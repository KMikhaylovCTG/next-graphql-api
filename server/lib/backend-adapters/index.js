import sources from '../../config/sources';

import FastFtFeed from './fast-ft';
import CAPI from './capi';
import MockCapi from './mock-capi';
import Hui from './hui';
import Liveblog from './liveblog';
import MockLiveblog from './mock-liveblog';
import Video from './video';
import PopularAPI from './popular-api';
import Myft from './myft';
import TodaysTopics from './todays-topics';
import Bertha from './bertha';
import RedisCache from '../caches/redis-cache';

const adapters = {};

export default (flags = {}) => {
	if (!Object.keys(adapters).length) {
		const redisUrl = process.env.REGION === 'US' ? process.env.REDIS_URL_US : process.env.REDIS_URL_EU;
		const redisCache = new RedisCache({ redisUrl });
		const capi = new CAPI(redisCache);
		const liveblog = new Liveblog(redisCache);

		Object.assign(adapters, {
			capi,
			liveblog,
			hui: new Hui(redisCache),
			myft: new Myft(redisCache),
			popularApi: new PopularAPI(redisCache),
			video: new Video(redisCache),
			todaysTopics: new TodaysTopics(redisCache),
			bertha: new Bertha(redisCache),
			fastFT: new FastFtFeed(sources.fastFt),
			mockCapi: new MockCapi(capi),
			mockLiveblog: new MockLiveblog(liveblog)
		});
	}

	return {
		capi: flags.mockData ? adapters.mockCapi : adapters.capi,
		fastFT: adapters.fastFT,
		hui: adapters.hui,
		liveblog: flags.mockData ? adapters.mockLiveblog : adapters.liveblog,
		myft: adapters.myft,
		popularApi: adapters.popularApi,
		video: adapters.video,
		todaysTopics: adapters.todaysTopics,
		bertha: adapters.bertha
	};
};
