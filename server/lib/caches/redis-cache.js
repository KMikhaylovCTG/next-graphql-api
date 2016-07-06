import logger from '@financial-times/n-logger';
import { metrics } from '@financial-times/n-express';
import Redis from '../redis';

export default class {
	constructor ({ redisUrl, redis } = { }) {
		this.redis = redis || new Redis({ redisUrl });
		this.currentRequests = {};
	}

	cached (key, ttl, fetcher) {
		const metricsKey = key.split('.')[0];

		return this.redis
			.get(key)
			.then(data => {
				if (data) {
					// we have fresh data
					metrics.count(`cache.${metricsKey}.cached`, 1);
					return JSON.parse(data);
				}

				// we don't have fresh data, fetch it
				return this.fetchAndSet(key, ttl, fetcher);
			})
			.catch(err => {
				logger.error('Error getting data from Redis', err);
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
				if (!res) {
					return;
				}
				metrics.count(`cache.${metricsKey}.fresh`, 1);
				const data = JSON.stringify(res);
				return this.redis
					.set(key, ttl, data)
					.catch(err => logger.error('Error setting data to Redis', err))
					.then(() => {
						delete this.currentRequests[key];
						return res;
					});
			})
			.catch(err => {
				metrics.count(`cache.${metricsKey}.error`, 1);
				delete this.currentRequests[key];
				logger.error('Error fetching data', err);
			});
	}
}
