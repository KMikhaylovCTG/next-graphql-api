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
		const start = Date.now();
		return this.redis
			.get(key)
			.then(data => {
				if (data !== null) {
					// we have fresh data
					metrics.histogram(`cache.${metricsKey}.hit.time`, Date.now() - start)
					metrics.count(`cache.${metricsKey}.hit`, 1);
					return JSON.parse(data);
				}
				metrics.histogram(`cache.${metricsKey}.miss.time`, Date.now() - start)
				metrics.count(`cache.${metricsKey}.miss`, 1);

				// we don't have fresh data, fetch it
				return this.fetchAndSet(key, ttl, fetcher);
			})
			.catch(err => {
				logger.error('Error fetching data from Redis', err, { cache_key: key });
				metrics.histogram(`cache.${metricsKey}.error.time`, Date.now() - start)
				metrics.count(`cache.${metricsKey}.error`, 1);
				return this.fetchAndSet(key, ttl, fetcher);
			});
	}

	fetchAndSet (key, ttl, fetcher) {
		if (this.currentRequests[key]) {
			return this.currentRequests[key];
		}
		const metricsKey = key.split('.')[0];
		let start = Date.now();
		return this.currentRequests[key] = fetcher()
			.then(res => {
				if (res === undefined) {
					return;
				}
				metrics.histogram(`cache.${metricsKey}.fresh.time`, Date.now() - start)
				metrics.count(`cache.${metricsKey}.fresh`, 1);
				const data = JSON.stringify(res);
				start = Date.now();
				return this.redis
					.set(key, ttl, data)
					.then(() => {
						metrics.histogram(`cache.${metricsKey}.write.time`, Date.now() - start)
						metrics.count(`cache.${metricsKey}.write`, 1);
					})
					.catch(err => {
						logger.error('Error writing data to Redis', err, { cache_key: key });
						metrics.histogram(`cache.${metricsKey}.error.time`, Date.now() - start)
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
