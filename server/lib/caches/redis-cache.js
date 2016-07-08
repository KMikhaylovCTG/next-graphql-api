import logger from '@financial-times/n-logger';
import { metrics } from '@financial-times/n-express';
import Redis from '../redis';

export default class {
	constructor ({ redisUrl, redis } = { }) {
		this.redis = redis || new Redis({ redisUrl });
		this.currentRequests = {};
	}

	cached (key, ttl, fetcher) {
		return fetcher();
		const metricsKey = key.split('.')[0];

		return this.redis
			.get(key)
			.then(data => {
				if (data !== null) {
					// we have fresh data
					metrics.count(`cache.${metricsKey}.hit`, 1);
					return JSON.parse(data);
				}
				metrics.count(`cache.${metricsKey}.miss`, 1);

				// we don't have fresh data, fetch it
				return this.fetchAndSet(key, ttl, fetcher);
			})
			.catch(err => {
				logger.error('Error fetching data from Redis', err, { cache_key: key });
				metrics.count(`cache.${metricsKey}.error`, 1);
				return this.fetchAndSet(key, ttl, fetcher);
			});
	}

	fetchAndSet (key, ttl, fetcher) {
		if (this.currentRequests[key]) {
			return this.currentRequests[key];
		}
		const metricsKey = key.split('.')[0];

		return this.currentRequests[key] = fetcher()
			.then(res => {
				if (res === undefined) {
					return;
				}
				metrics.count(`cache.${metricsKey}.fresh`, 1);
				const data = JSON.stringify(res);
				return this.redis
					.set(key, ttl, data)
					.then(() => {
						metrics.count(`cache.${metricsKey}.write`, 1);
					})
					.catch(err => {
						logger.error('Error writing data to Redis', err, { cache_key: key });
						metrics.count(`cache.${metricsKey}.error`, 1);
					})
					.then(() => {
						delete this.currentRequests[key];
						return res;
					});
			})
			.catch(err => {
				logger.error('Error fetching data for cache', err);
				delete this.currentRequests[key];
			});
	}
}
