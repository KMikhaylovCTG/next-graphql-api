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

const redisCache = new RedisCache();

const capi = new CAPI(redisCache);
const mockCapi = new MockCapi(capi);
const fastFT = new FastFtFeed(sources.fastFt);
const hui = new Hui(redisCache);
const liveblog = new Liveblog(redisCache);
const mockLiveblog = new MockLiveblog(liveblog);
const myft = new Myft(redisCache);
const popularApi = new PopularAPI(redisCache);
const video = new Video(redisCache);
const todaysTopics = new TodaysTopics(redisCache);
const bertha = new Bertha(redisCache);

export default (flags = {}) => ({
	capi: flags.mockData ? mockCapi : capi,
	fastFT,
	hui,
	liveblog: flags.mockData ? mockLiveblog : liveblog,
	myft,
	popularApi,
	video,
	todaysTopics,
	bertha
});
