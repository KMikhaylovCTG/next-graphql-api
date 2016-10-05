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
import MemCache from '../caches/mem-cache';

const adapters = {};

export default (flags = {}) => {
	if (!Object.keys(adapters).length) {
		const memCache = new MemCache(12 * 60 * 60, 30 * 60);
		const capi = new CAPI(memCache);
		const liveblog = new Liveblog(memCache);

		Object.assign(adapters, {
			capi,
			liveblog,
			hui: new Hui(memCache),
			myft: new Myft(memCache),
			popularApi: new PopularAPI(memCache),
			video: new Video(memCache),
			todaysTopics: new TodaysTopics(memCache),
			bertha: new Bertha(memCache),
			fastFT: new FastFtFeed(memCache),
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
