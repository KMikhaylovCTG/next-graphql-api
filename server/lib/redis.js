import url from 'url';
import redis from 'redis';
import logger from '@financial-times/n-logger';
import denodeify from 'denodeify';

export default class {
	constructor ({ redisUrl = 'http://localhost:6379' } = {}) {
		const redisUrlObject = url.parse(redisUrl);
		const redisClient = redis.createClient({
			host: redisUrlObject.hostname,
			port: redisUrlObject.port,
			enable_offline_queue: false // fail fast when redis is down
		});
		if (redisUrlObject.auth) {
			redisClient.auth(redisUrlObject.auth.split(':')[1]);
		}
		redisClient.on('error', err => {
			logger.error('Redis Error', err);
		});
		const ready = new Promise((resolve, reject) => {
			redisClient.on('ready', err => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});

		const denodeifiedGet = denodeify(redisClient.get);
		const denodeifiedSetex = denodeify(redisClient.setex);

		// NOTE: absolutely no idea why this has to be a full method with body (breaks otherwise)
		this.get = (...args) => ready.then(() => {
			return denodeifiedGet.apply(redisClient, args);
		});
		this.set = (...args) => ready.then(denodeifiedSetex.apply(redisClient, args));
	}
}
