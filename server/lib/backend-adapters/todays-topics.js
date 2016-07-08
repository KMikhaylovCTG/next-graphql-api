import sources from '../../config/sources';
import backend from '.';

const nonEmpty = item => item;

const createCacheKeyOpts = (opts = {}) =>
	Object.keys(opts)
		.map(optName => opts[optName] ? `${optName}=${opts[optName]}` : '')
		.filter(nonEmpty)
		.join(':');

function getPrimaryTag (metadata) {
	const primarySection = metadata.find(tag => tag.primary === 'section');
	const primaryTheme = metadata.find(tag => tag.primary === 'theme');
	return primaryTheme || primarySection || null;
}

export default class {
	constructor (cache) {
		this.type = 'todays-topics';
		this.cache = cache;
	}

	getTopics ({ region, from, limit, genres, type, flags = {}, ttl = 60 * 10 } = { }) {
		const cacheKey = `${this.type}.get-topics:${createCacheKeyOpts({ region, from, limit, genres, type })}`;
		const fetcher = () => {
			const be = backend(flags);
			const args = { from, limit, genres, type };
			return Promise.all([
				be.capi.page(sources[`${region}Top`].uuid)
					.then(p => be.capi.content(p.items, args))
					.then(c => c.map(c => getPrimaryTag(c.metadata))),
				be.capi.page(sources.opinion.uuid, sources.opinion.sectionsId)
					.then(p => p ? be.capi.content(p.items, args) : [])
					.then(c => c.map(c => getPrimaryTag(c.metadata))),
				be.capi.list(sources.editorsPicks.uuid)
					.then(r => be.capi.content(r.items.map(i => i.id.replace(/http:\/\/api\.ft\.com\/things?\//, '')), args))
					.then(c => c.map(c => getPrimaryTag(c.metadata)))
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
