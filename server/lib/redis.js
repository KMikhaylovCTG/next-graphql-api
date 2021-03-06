import url from 'url';
import redis from 'redis';
import logger from '@financial-times/n-logger';
import denodeify from 'denodeify';

export default class {
	constructor (opts = {}) {
		const redisUrlObject = url.parse(opts.redisUrl || 'http://localhost:6379');
		const redisClient = (opts.redis || redis).createClient({
			host: redisUrlObject.hostname,
			port: redisUrlObject.port,
			socket_keepalive: true,
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

		this.get = (...args) => ready.then(() => denodeifiedGet.apply(redisClient, args));
		this.set = (...args) => ready.then(() => denodeifiedSetex.apply(redisClient, args));
	}
}
