import sinon from 'sinon';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import MemCache from '../../../server/lib/mem-cache';

describe('Mem Cache', () => {
	const memCache = new MemCache(10);
	const fetcher = () => {
		return Promise.resolve('fresh');
	};
	const fail = () => {
		return Promise.reject('OMG');
	};


	describe('#cached', () => {
		it('fetches fresh data when nothing is cached', () => {
			expect(memCache.cached('test-key-1', 1, fetcher)).to.eventually.eq('fresh');
		});

		it('returns cached data when fresh', () => {
			return memCache.cached('test-key-2', 10, () => Promise.resolve('orig'))
			.then(() => {
				return memCache.cached('test-key-2', 10, fetcher)
			})
			.then((it) => {
				expect(it).to.eq('orig');
			});
		});

		it('returns stale data when expired', () => {
			return memCache.cached('test-key-3', -1, () => Promise.resolve('stale'))
			.then(() => {
				return memCache.cached('test-key-3', 10, fetcher);
			})
			.then((it) => {
				expect(it).to.eq('stale')
			})
		});


		it('fetches new data when memCache expires', () => {
			return memCache.cached('test-key-4', -10, () => Promise.resolve('stale'))
			.then(() => {
				return memCache.cached('test-key-4', 10, fetcher);
			})
			.then((it) => {
				expect(it).to.eq('stale');
				return memCache.cached('test-key-4', 10, () => Promise.resolve('too fresh'));
			})
			.then((it) => {
				expect(it).to.eq('fresh');
			})
		});

		it('only fetches new data once at a time when memCache expires', () => {
			let p1 = memCache.cached('test-key-5', 10, fetcher);
			let p2 = memCache.cached('test-key-5', 10, fetcher);

			// both should be the same promise
			expect(p1).to.eq(p2);
		});

		it('clean up finished and failed fetches', () => {
			let p3 = null;
			let p1 = memCache.cached('test-key-6', -1, fail)

			return p1.then(() => {
				let p2 = memCache.cached('test-key-6', -1, fetcher)

				return p2.then(() => {
					memCache.clear('test-key-6');
					p3 = memCache.cached('test-key-6', 10, fetcher);

					// now they shouldn't be the same promise
					expect(p1).to.not.equal(p2);
					expect(p1).to.not.equal(p3);
					expect(p2).to.not.equal(p3);
				})
			});
		});
	});


	it('returns stale data on a fetch error', () => {
		const clock = sinon.useFakeTimers();
		const cache = new MemCache(10 * 60, 5 * 60);
		return cache.cached('test-key-7', -1, () => Promise.resolve('stale'))
		.then(() => {
			return cache.cached('test-key-7', 10, () => Promise.reject('error'));
		})
		.then((it) => {
			//Stale object in memCache, so ignore error and return that
			expect(it).to.eq('stale');
			clock.tick(1000 * 60 * 4);
			return cache.cached('test-key-7', 10, () => Promise.reject('error'));
		})
		.then((it) => {
			//After 6 minutes it is still being used, so return stale again
			expect(it).to.eq('stale');
			clock.tick(1000 * 60 * 11);
			return cache.cached('test-key-7', 10, () => Promise.reject('error'));
		})
		.then((it) => {
			//After 10 minutes we've cleared our memCache, so give up and return undefined
			expect(it).to.eq(undefined);
		})
	});

	it('does not memCache undefined', () => {
		return memCache.cached('test-key-8', -1, () => Promise.resolve('stale'))
		.then((it) => {
			//return stale and go and fetch
			expect(it).to.eq('stale');
			return memCache.cached('test-key-8', 10, () => Promise.resolve(undefined));
		})
		.then((it) => {
			expect(it).to.eq('stale')
			return memCache.cached('test-key-8', 10, () => Promise.resolve(undefined));
		})
		.then((it) => {
			expect(it).to.eq('stale')
		})
	});


	it('cleans up memCache items stale items and unused stale items seperately', () => {
		const clock = sinon.useFakeTimers();
		const cache = new MemCache(10 * 60, 5 * 60);


		const p1 = cache.cached('test-key-1', 1, fetcher);
		const p2 = cache.cached('test-key-unused', 1, fetcher);
		return Promise.all([p1,p2]).then(() => {

			//After two minutes, both are still valid so remain in memCache
			clock.tick(1000 * 60 * 2);
			expect(cache.contentCache['test-key-1']).to.exist;
			expect(cache.contentCache['test-key-unused']).to.exist;

			clock.tick(1000 * 60 * 2);
			//Rerequest test-key-1 so it remains fresh
			cache.cached('test-key-1', Date.now() + 50, fetcher);

			clock.tick(1000 * 60 * 2);
			expect(cache.contentCache['test-key-1']).to.exist;
			expect(cache.contentCache['test-key-unused']).to.be.undefined;

			clock.tick(1000 * 60 * 5);
			expect(cache.contentCache['test-key-1']).to.be.undefined;
			expect(cache.contentCache['test-key-unused']).to.be.undefined;
		});

	});
});
