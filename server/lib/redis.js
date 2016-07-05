import url from 'url';
import redis from 'redis';
import logger from '@financial-times/n-logger';
import denodeify from 'denodeify';

export default class {
	constructor ({ redisUrl = 'http://localhost:6379' }) {
		const redisUrlObject = url.parse(redisUrl);
		const redisClient = redis.createClient({
			port: redisUrlObject.port,
			host: redisUrlObject.hostname,
			enable_offline_queue: false // fail fast when redis is down
		});
		if (redisUrlObject.auth) {
			redisClient.auth(redisUrlObject.auth.split(':')[1]);
		}
		redisClient.on('error', err => {
			logger.error('Redis Error', err);
		});

		this.get = denodeify(redisClient.get.bind(redisClient));
		this.set = denodeify(redisClient.setex.bind(redisClient));
	}
}
