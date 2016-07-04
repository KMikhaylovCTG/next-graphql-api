import logger from '@financial-times/n-logger';
import { metrics } from '@financial-times/n-express';
import * as redis from './redis';

export default class {
	constructor () {
		this.cache = redis;
		this.requestMap = [];
	}

	cached (key, ttl, fetcher) {
		const metricsKey = key.split('.')[0];

		return this.cache.get(key)
			.then(data => {
				// we have fresh data
				if (data) {
					metrics.count(`cache.${metricsKey}.cached`, 1);
					return JSON.parse(data);
				}

				// we don't have fresh data, fetch it
				return this.fetchAndSet(key, ttl, fetcher);
			});
	}

	fetchAndSet (key, ttl, fetcher) {
		if (this.requestMap[key]) {
			return this.requestMap[key];
		}
		const metricsKey = key.split('.')[0];
		metrics.count(`cache.${metricsKey}.fresh`, 1);
		this.requestMap[key] = fetcher()
			.then(res => {
				if(!res) {
					return;
				}
				const data = JSON.stringify(res);

				return this.cache
					.setex(key, ttl, data)
					.then(() => {
						delete this.requestMap[key];
						return res;
					});
			})
			.catch(err => {
				metrics.count(`cache.${metricsKey}.error`, 1);
				delete this.requestMap[key];
				logger.error(err);
			});

		return this.requestMap[key];
	}
}
