import logger from '@financial-times/n-logger';
import { json as fetchresJson } from 'fetchres';
import ApiClient from 'next-ft-api-client';

import filterContent from '../helpers/filter-content';
import resolveContentType from '../helpers/resolve-content-type';

function getSearchOpts (termName, termValue, opts) {
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

	if (opts.since) {
		searchOpts.filter.bool.must.push({
			range: {
				publishedDate: {
					gte: opts.since
				}
			}
		});
	}

	if (opts.count) {
		searchOpts.count = opts.count;
	}

	return searchOpts;
}

export default class {
	constructor (cache) {
		this.type = 'capi';
		this.cache = cache;
	}

	page (uuid, url, ttl = 60) {
		return this.cache.cached(`${this.type}.pages.${uuid}`, ttl, () =>
			ApiClient.pages({ uuid: uuid })
				.then(it => ({
					id: uuid,
					title: it.title,
					url: url,
					items: it.slice()
				}))
		);
	}

	byConcept (uuid, title, ttl = 60) {
		return this.cache.cached(`${this.type}.byconcept.${uuid}`, ttl, () =>
			ApiClient.contentAnnotatedBy({ uuid: uuid })
				.then(ids => ({
					title: title,
					conceptId: uuid,
					sectionId: null,
					items: ids.slice()
				}))
		);
	}

	search (termName, termValue, opts, ttl = 60 * 10) {
		return this._search('search', termName, termValue, opts, ttl);
	}

	// searchCount is separate from search so that we can look a long way back just for the sake of counting articles
	// and cache the count only, avoiding caching loads of unused content
	searchCount (termName, termValue, opts, ttl = 60 * 10) {
		return this._search('searchCount', termName, termValue, opts, ttl, (items => items.length));
	}

	_search (cacheKeyAction, termName, termValue, opts, ttl, andThen) {

		const optsCacheKey = `${opts.since ? `:since_${opts.since}` : ''}${opts.count ? `:count_${opts.count}` : ''}`;
		const cacheKey = `${this.type}.${cacheKeyAction}.${termName}:${termValue}${optsCacheKey}`;

		return this.cache.cached(cacheKey, ttl, () => {

			let cachedRequest = ApiClient.search(getSearchOpts(termName, termValue, opts))
				.then(filterContent(opts, resolveContentType));

			if(typeof andThen === 'function') {
				cachedRequest = cachedRequest.then(andThen);
			}

			return cachedRequest;
		});
	}

	content (uuids, opts = {}, ttl = 60) {
		const cacheKey = `${this.type}.content.${Array.isArray(uuids) ? uuids.join('_') : uuids}`;
		return this.cache.cached(cacheKey, ttl, () =>
				ApiClient.content({
					uuid: uuids,
					index: 'v3_api_v2'
				})
			)
			.then(filterContent(opts, resolveContentType))
	}

	list (uuid, url, ttl = 60) {
		return this.cache.cached(`${this.type}.lists.${uuid}`, ttl, () => {
			const headers = { Authorization: process.env.LIST_API_AUTHORIZATION };
			return fetch(`https://prod-coco-up-read.ft.com/lists/${uuid}`, { headers })
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
				.then(it => {
					return {
						id: uuid,
						title: it.title,
						url: url,
						items: it.items,
						layoutHint: it.layoutHint
					};
				});
		});
	}

	listOfType (listType, concept, ttl = 60) {
		return this.cache.cached(`${this.type}.lists.${listType}.${concept}`, ttl, () => {
			const headers = { Authorization: process.env.LIST_API_AUTHORIZATION };
			return fetch(`https://prod-coco-up-read.ft.com/lists?${listType}For=${concept}`, { headers })
				.then(response => {
					if (!response.ok) {
						logger.warn('Failed getting List response', {
							listType,
							concept,
							status: response.status
						});
					}
					return response;
				})
				.then(fetchresJson);
		});
	}

	things (uuids, type = 'idV1', ttl = 60 * 10) {
		const cacheKey = `${this.type}.things.${type}.${Array.isArray(uuids) ? uuids.join('_') : uuids}`;
		return this.cache.cached(cacheKey, ttl, () =>
			ApiClient.things({
				identifierValues: uuids,
				identifierType: type,
				authority: 'http://api.ft.com/system/FT-TME'
			})
		);
	}
}
