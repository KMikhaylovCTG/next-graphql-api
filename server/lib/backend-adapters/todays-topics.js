import sources from '../../config/sources';
import backend from '.';

const nonEmpty = item => item;

const createCacheKeyOpts = (opts = {}) =>
	Object.keys(opts)
		.map(optName => opts[optName] ? `${optName}=${opts[optName]}` : '')
		.filter(nonEmpty)
		.join(':');

const getPrimaryTag = metadata => {
	const primarySection = metadata.find(tag => tag.primary === 'section');
	const primaryTheme = metadata.find(tag => tag.primary === 'theme');
	return primaryTheme || primarySection || null;
}

const extractUuid = item => item.id.replace(/http:\/\/api\.ft\.com\/things?\//, '');

export default class {
	constructor (cache) {
		this.type = 'todays-topics';
		this.cache = cache;
	}

	getTopics ({ edition, from, limit, genres, type, flags = {}, ttl = 60 * 10 } = { }) {
		const cacheKey = `${this.type}.get-topics:${createCacheKeyOpts({ edition, from, limit, genres, type })}`;
		const fetcher = () => {
			const be = backend(flags);
			const args = { from, limit, genres, type };
			return Promise.all([
				be.capi.page(sources[`${edition}Top`].uuid)
					.then(page => page.items ? be.capi.content(page.items, args) : [])
					.then(items => items.map(item => getPrimaryTag(item.metadata))),
				be.capi.list(sources[`${edition}Opinion`].uuid)
					.then(list => list.items ? be.capi.content(list.items.map(extractUuid), args) : [])
					.then(items => items.map(item => getPrimaryTag(item.metadata))),
				be.capi.list(sources[`${edition}EditorsPicks`].uuid)
					.then(list => list.items ? be.capi.content(list.items.map(extractUuid), args) : [])
					.then(items => items.map(item => getPrimaryTag(item.metadata)))
			])
				.then(data => {
					//Flatten results
					const tags = data.reduce((res, item) => res.concat(item), []).filter(t => t);
					//Group by frequency of tag
					const countById = tags.reduce((res, item) => {
						res[item.idV1] = res[item.idV1] ? ++res[item.idV1] : 1;
						return res;
					}, {});
					//Dedupe
					const uniq = tags.reduce((res, item) => {
						return res.find(i => i.idV1 === item.idV1) ? res : res.concat(item);
					}, []);
					//Sort by frequency
					const result = uniq.sort((a, b) => countById[b.idV1] - countById[a.idV1]);

					return result;
				});
		};

		return this.cache.cached(cacheKey, ttl, fetcher);
	}
}
