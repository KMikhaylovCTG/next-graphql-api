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

import MemCache from '../mem-cache';
import RedisCache from '../redis-cache';

const memCache = new MemCache(12 * 60 * 60, 30 * 60);
const redisCache = new RedisCache();

const capi = new CAPI(redisCache);
const mockCapi = new MockCapi(capi);
const fastFT = new FastFtFeed(sources.fastFt);
const hui = new Hui(memCache);
const liveblog = new Liveblog(memCache);
const mockLiveblog = new MockLiveblog(liveblog);
const myft = new Myft(memCache);
const popularApi = new PopularAPI(memCache);
const video = new Video(memCache);
const todaysTopics = new TodaysTopics(memCache);
const bertha = new Bertha(memCache);

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
