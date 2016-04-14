import url from 'url';
import redis from 'redis';
import logger from '@financial-times/n-logger';
import denodeify from 'denodeify';

const redisUrl = url.parse(process.env.REDIS_URL);

const redisClient = redis.createClient({
	port: redisUrl.port,
	host: redisUrl.hostname,
	enable_offline_queue: false // fail fast when redis is down
});

redisClient.auth(redisUrl.auth.split(':')[1]);

redisClient.on('error', err => {
	console.log('Redis Error', err);
	logger.error(err);
});

const get = denodeify(redisClient.get.bind(redisClient));
const setex = denodeify(redisClient.setex.bind(redisClient));

export { get, setex };

