import fetchMock from 'fetch-mock';
import sinon from 'sinon';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.should();
chai.use(chaiAsPromised);

import CAPI from '../../../../server/lib/backend-adapters/capi';

const cachedSpy = () => sinon.spy((cacheKey, cacheTTL, value) => value());

describe('CAPI', () => {

	describe('#content', () => {

		before(() => {
			fetchMock.mock(
				new RegExp('https://[^/]*/v3_api_v2/item/_mget'),
				{
					docs: [
						{
							found: true,
							_source: { id: 'content-one' }
						},
						{
							found: true,
							_source: { id: 'content-two' }
						}
					]
				}
			);
		});

		after(() => {
			fetchMock.restore();
		});

		it('should be able to fetch content', () => {
			const cache = { cached: cachedSpy() };
			const capi = new CAPI(cache);

			return capi.content(['content-one', 'content-two'])
				.then(content => {
					content.should.have.length(2);
					content.should.eql([{ id: 'content-one' }, { id: 'content-two' }]);
				});
		});

		it('should use correct cache key and ttl', () => {
			const cached = cachedSpy();
			const cache = { cached };
			const capi = new CAPI(cache);

			return capi.content(['content-one', 'content-two'])
				.then(() => {
					cached.alwaysCalledWith('capi.content.content-one_content-two', 50);
				});
		});

		it('should handle empty response from CAPI', () => {
			fetchMock.reMock(
				new RegExp('https://[^/]*/v3_api_v2/item/_mget'),
				{
					docs: []
				}
			);
			const cache = { cached: cachedSpy() };
			const capi = new CAPI(cache);

			return capi.content(['content-one', 'content-two'])
				.then(content => {
					content.should.have.length(0);
				});
		});

	});

	describe('#list', () => {
		const listUuid = '73667f46-1a55-11e5-a130-2e7db721f996';

		before(() => {
			fetchMock.mock(
				new RegExp(`https://[^\.]*.ft.com/lists/${listUuid}`),
				[{ id: 'content-one' }, { id: 'content-two' }]
			);
		});

		after(() => {
			fetchMock.restore();
		});

		it('should be able to fetch list', () => {
			const cached = cachedSpy();
			const cache = { cached };
			const capi = new CAPI(cache);

			return capi.list(listUuid)
				.then(list => {
					list.should.have.length(2);
					list.should.deep.equal([{ id: 'content-one' }, { id: 'content-two' }]);
					cached.alwaysCalledWith('capi.lists.73667f46-1a55-11e5-a130-2e7db721f996', 50);
					// make sure mock was called
					fetchMock.called().should.be.true;
				});
		});

	});

	describe('#search', () => {

		before(() => {
			fetchMock.mock(
				new RegExp('https://[^/]*/v3_api_v2/item/_search'),
				{
					hits: {
						total: 1,
						hits: [
							{
								_source: {
									id: 'topic1'
								}
							}
						]
					}
				}
			);
		});

		after(() => {
			fetchMock.restore();
		});

		it('should be able to fetch content', () => {
			const cache = {cached: cachedSpy()};
			const capi = new CAPI(cache);

			return capi.search('metadata.idV1', 'topicId', {count: 50, since: '2016-03-21'})
				.then(content => {
					const expectedResult = [{id: 'topic1'}];
					expectedResult.total = 1;
					content.should.eql(expectedResult);
				});
		});

		it('should use correct cache key and ttl when a single conceptID is specified', () => {
			const cached = cachedSpy();
			const cache = {cached};
			const capi = new CAPI(cache);

			return capi.search('metadata.idV1', 'topicId', {count: 50, since: '2016-03-21'})
				.then(() => {
					cached.alwaysCalledWith('capi.search.metadata.idV1:topicId:since_2016-03-21:count_50', 600).should.be.true;
				});
		});

		it('should use correct cache key and ttl when multiple conceptIDs are specified', () => {
			const cached = cachedSpy();
			const cache = {cached};
			const capi = new CAPI(cache);

			return capi.search('metadata.idV1', ['topicId1', 'topicId2', 'topicId3'], {count: 50, since: '2016-03-21'})
				.then(() => {
					cached.alwaysCalledWith('capi.search.metadata.idV1:topicId1,topicId2,topicId3:since_2016-03-21:count_50', 600).should.be.true;
				});
		});

		it('should handle empty response from CAPI', () => {
			fetchMock.reMock(
				new RegExp('https://[^/]*/v3_api_v2/item/_search'),
				{
					hits: {
						total: 0,
						hits: []
					}
				}
			);
			const cache = {cached: cachedSpy()};
			const capi = new CAPI(cache);

			return capi.search('metadata.idV1', 'topicId', {count: 50, since: '2016-03-21'})
				.then(content => {
					const expectedResult = [];
					expectedResult.total = 0;
					content.should.eql(expectedResult);
				});
		});

	});

});
