import logger from '@financial-times/n-logger';
import ApiClient from 'next-ft-api-client';

import sources from '../../config/sources';

export default class {
	constructor (cache, { idV1 = sources.fastFt.idV1 } = { }) {
		this.type = 'fast-ft';
		this.cache = cache;
		this.idV1 = idV1;
	}

	fetch ({ from = 0, limit = 20, ttl = 30 } = { }) {
		const cacheKey = `${this.type}.items:from=${from}:limit=${limit}`;
		const fetcher = () =>
			ApiClient
				.search({
					filter: {
						term: {
							'metadata.idV1': this.idV1
						}
					},
					offset: from,
					count: limit
				})
				.then(results => results.slice())
				.catch(err => {
					logger.err('Failed getting fastFT content', err);
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}
}
