import logger from '@financial-times/n-logger';
import { json as fetchresJson } from 'fetchres';
import ApiClient from 'next-ft-api-client';

import filterContent from '../helpers/filter-content';
import resolveContentType from '../helpers/resolve-content-type';

const genreMap = {
	analysis: [
		'MQ==-R2VucmVz',
		'Mw==-R2VucmVz',
		'OQ==-R2VucmVz',
		'MTA=-R2VucmVz',
		'ODFmNjI1ODYtMzllYi00MzQzLTg2Y2EtNmM1ZGQ4MjExMWZh-R2VucmVz'
	],
	comment: [
		'OA==-R2VucmVz',
		'NQ==-R2VucmVz',
		'Ng==-R2VucmVz',
		'NA==-R2VucmVz',
		'NGQ2MWQ0NDMtMDc5Mi00NWExLTlkMGQtNWZhZjk0NGExOWU2-R2VucmVz'
	]
};

const getSearchOpts = (termName, termValue, { from, limit, since, genres = [], type } = { }) => {
	console.log('#####');
	console.log(termValue);
	const searchOpts = {
		filter: {
			bool: {
				must: [
					{
						term: { [termName]: termValue }
					}
				]
			}
		}
	};
	const genreIds = genres.reduce(
		(currentGenreIds, genre) => genreMap[genre] ? currentGenreIds.concat(genreMap[genre]) : currentGenreIds, []
	);
	if (genreIds.length) {
		searchOpts.filter.bool.must.push({
			term: { 'metadata.idV1': genreIds }
		});
	}
	if (type) {
		const liveBlogWebUrl = '.*(liveblog|marketslive|liveqa).*';
		if (type === 'liveblog') {
			searchOpts.filter.bool.must.push({
				regexp: {
					webUrl: liveBlogWebUrl
				}
			});
		} else {
			searchOpts.filter.bool.must_not = [{
				regexp: {
					webUrl: liveBlogWebUrl
				}
			}];
		}
	}
	if (from) {
		searchOpts.offset = from;
	}
	if (limit) {
		searchOpts.count = limit;
	}
	if (since) {
		searchOpts.filter.bool.must.push({
			range: {
				publishedDate: {
					gte: since
				}
			}
		});
	}

	return searchOpts;
};

const nonEmpty = item => item;

const createCacheKeyOpts = (opts = {}) =>
	Object.keys(opts)
		.map(optName => opts[optName] ? `${optName}=${opts[optName]}` : '')
		.filter(nonEmpty)
		.join(':');

export default class {
	constructor (cache) {
		this.type = 'capi';
		this.cache = cache;
		this.listApiAuthorization = process.env.LIST_API_AUTHORIZATION;
	}

	page (uuid, { ttl = 60 } = { }) {
		const cacheKey = `${this.type}.page.${uuid}`;
		const fetcher = () =>
			ApiClient.pages({ uuid })
				.then(page => ({
					id: uuid,
					title: page.title,
					items: page.slice()
				}));

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

	search (termName, termValue, { from, limit, since, genres, type, ttl = 60 * 10 } = {}) {
		const cacheKey = `${this.type}.search:${termName}=${termValue}:${createCacheKeyOpts({ from, limit, since, genres, type })}`;
		const fetcher = () =>
			ApiClient.search(getSearchOpts(termName, termValue, { from, limit, since, genres, type }))
				.then(results => results.slice());

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

	// searchCount is separate from search so that we can look a long way back just for the sake of counting articles
	// and cache the count only, avoiding caching loads of unused content
	searchCount (termName, termValue, { since, type, genres, ttl = 60 * 10 } = {}) {
		const cacheKey = `${this.type}.search-count:${termName}=${termValue}:${createCacheKeyOpts({ since, genres, type })}`;
		const fetcher = () =>
			ApiClient.search(getSearchOpts(termName, termValue, { since, genres, type }))
				.then(results => results.total);

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

	content (uuids, { from, limit, genres, type, ttl = 60 } = { }) {
		const cacheKey = `${this.type}.content.${Array.isArray(uuids) ? uuids.join('_') : uuids}`;
		const fetcher = () =>
			ApiClient.content({
				uuid: uuids,
				index: 'v3_api_v2'
			});

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(filterContent({ from, limit, genres, type }, resolveContentType));
	}

	list (uuid, { ttl = 60 } = { }) {
		const cacheKey = `${this.type}.list.${uuid}`;
		const headers = { Authorization: this.listApiAuthorization };
		const fetcher = () =>
			fetch(`https://prod-coco-up-read.ft.com/lists/${uuid}`, { headers })
				.then(response => {
					if (!response.ok) {
						logger.warn('Failed getting List response', {
							uuid: uuid,
							status: response.status
						});
					}
					return response;
				})
				.then(fetchresJson)
				.then(list => ({
					id: uuid,
					title: list.title,
					items: list.items,
					layoutHint: list.layoutHint
				}));

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

	listOfType (type, concept, { ttl = 60 } = { }) {
		const cacheKey = `${this.type}.list-of-type.${type}.${concept}`;
		const headers = { Authorization: this.listApiAuthorization };
		const fetcher = () =>
			fetch(`https://prod-coco-up-read.ft.com/lists?${type}For=${concept}`, { headers })
				.then(fetchresJson)
				.catch(err => {
					logger.warn('Failed getting List Of Type response', err, { type, concept });
				});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

	things (uuids, { type = 'idV1', ttl = 60 * 10 } = { }) {
		const cacheKey = `${this.type}.things.${type}.${Array.isArray(uuids) ? uuids.join('_') : uuids}`;
		const fetcher = () =>
			ApiClient.things({
				identifierValues: uuids,
				identifierType: type,
				authority: 'http://api.ft.com/system/FT-TME'
			});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}
}
