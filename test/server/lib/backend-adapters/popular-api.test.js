import fetchMock from 'fetch-mock';
import sinon from 'sinon';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.should();
chai.use(chaiAsPromised);

import Popular from '../../../../server/lib/backend-adapters/popular-api';

const cachedSpy = () => sinon.spy((cacheKey, cacheTTL, value) => value());

describe('Popular API', () => {

	describe('Topics', () => {

		before(() => {
			fetchMock.mock(
				'^https://ft-next-popular-api-eu.herokuapp.com/topics',
				[{ id: 'topic-one' }, { id: 'topic-two' }, { id: 'topic-three' }]
			);
		});

		after(() => {
			fetchMock.restore();
		});

		it('should be able to fetch topics', () => {
			const cache = { cached: cachedSpy() };
			const popular = new Popular(cache);

			return popular.topics()
				.then(topics => {
					topics.should.have.length(3);
				})
		});

		it('should be able limit the number of topics', () => {
			const cache = { cached: cachedSpy() };
			const popular = new Popular(cache);

			return popular.topics({ limit: 2 })
				.then(topics => {
					topics.should.have.length(2);
					topics.should.deep.equal([{ id: 'topic-one' }, { id: 'topic-two' }]);
				})
		});

		it('should be able offset the topics', () => {
			const cache = { cached: cachedSpy() };
			const popular = new Popular(cache);

			return popular.topics({ from: 1 })
				.then(topics => {
					topics.should.have.length(2);
					topics.should.deep.equal([{ id: 'topic-two' }, { id: 'topic-three' }]);
				})
		});

		it('should be able offset and limit the topics', () => {
			const cache = { cached: cachedSpy() };
			const popular = new Popular(cache);

			return popular.topics({ limit: 1, from: 1 })
				.then(topics => {
					topics.should.have.length(1);
					topics.should.deep.equal([{ id: 'topic-two' }]);
				})
		});

		it('should use correct cache key', () => {
			const cache = { cached: cachedSpy() };
			const popular = new Popular(cache);

			return popular.topics()
				.then(() => {
					cache.cached.alwaysCalledWith('popular-api.topics', 600).should.be.true;
				})
		});

		it('should be able to change cache ttl', () => {
			const cache = { cached: cachedSpy() };
			const popular = new Popular(cache);

			return popular.topics({}, 100)
				.then(() => {
					cache.cached.firstCall.args[1].should.be.equal(100);
				})
		});

	});

});
