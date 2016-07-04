import { metrics } from '@financial-times/n-express';
import logger from '@financial-times/n-logger';

export default class {
	constructor (staleTtl, unusedStaleTtl) {
		// in-memory content cache
		this.contentCache = {};
		this.requestMap = {};
		unusedStaleTtl = unusedStaleTtl || staleTtl;

		const sweeper = () => {
			const now = (new Date().getTime()) / 1000;
			for(let key in this.contentCache) {
				if(this.contentCache[key].expire + staleTtl < now ||
					this.contentCache[key].lastUsed + unusedStaleTtl < now) {
					delete this.contentCache[key];
				}
			}
			metrics.histogram('cache.size', JSON.stringify(this.contentCache).length);
		};

		// keep clearing the cache every minute
		setInterval(sweeper, 60 * 1000);
	}

	clear (key) {
		delete this.contentCache[key];
	}

	// Caching wrapper. Always returns a promise, when cache expires
	// returns stale data immediately and fetches fresh one
	cached (key, ttl, fetcher) {
		const metricsKey = key.split('.')[0];
		const cache = this.contentCache;

		const data = (cache[key] && cache[key].data);
		const expire = (cache[key] && cache[key].expire);
		const now = (new Date().getTime()) / 1000;

		if(data) {
			cache[key].lastUsed = now;
		}

		// we have fresh data
		if(expire > now && data) {
			metrics.count(`cache.${metricsKey}.cached`, 1);
			return Promise.resolve(data);
		}
		// we don't have fresh data, fetch it
		const eventualData = this._fetch(key, now, ttl, fetcher);

		// return stale data or promise of fresh data
		if(data) {
			metrics.count(`cache.${metricsKey}.stale`, 1);
			return Promise.resolve(data);
		} else {
			return eventualData;
		}
	}

	_fetch (key, now, ttl, fetcher) {
		const metricsKey = key.split('.')[0];

		if(this.requestMap[key])
			return this.requestMap[key];

		metrics.count(`cache.${metricsKey}.fresh`, 1);

		this.requestMap[key] = fetcher()
		.then((it) => {
			if(!it) {
				return;
			}
			let expireTime = now + ttl;
			this.contentCache[key] = {
				expire: expireTime,
				lastUsed: now,
				data: it
			};

			delete this.requestMap[key];

			return it;
		})
		.catch((err) => {
			metrics.count(`cache.${metricsKey}.error`, 1);
			delete this.requestMap[key];
			logger.error(err);

		});
		return this.requestMap[key];
	}
}
