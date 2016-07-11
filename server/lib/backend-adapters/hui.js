import logger from '@financial-times/n-logger';
import ApiClient from 'next-ft-api-client';

import sliceList from '../helpers/slice-list';

const createCacheKeyOpts = (opts = {}) =>
	Object.keys(opts)
		.map(optName => `${optName}=${opts[optName]}`)
		.join(':');

export default class {
	constructor (cache) {
		this.type = 'hui';
		this.cache = cache;
	}

	content ({ industry, position, sector, country, period = 'last-1-week', from, limit, ttl = 60 } = { }) {
		const cacheKey = `${this.type}.content:${createCacheKeyOpts({ industry, position, sector, country, period })}`;
		const fetcher = () =>
			ApiClient
				.hui({ model: 'content', industry, position, sector, country, period })
				.catch(err => {
					logger.error('Failed getting hui content', err);
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(articles => sliceList(articles, { from, limit }));
	}

	topics ({ industry, position, sector, country, period = 'last-1-week', ttl = 60 * 60 * 60 }) {
		const cacheKey = `${this.type}.topics:${createCacheKeyOpts({ industry, position, sector, country, period })}`;
		const fetcher = () =>
			ApiClient
				.hui({ model: 'annotations', industry, position, sector, country, period })
				.catch(err => {
					logger.error('Failed getting hui topics', err);
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

}
