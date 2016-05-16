import { graphql } from 'graphql';
import sinon from 'sinon';
import chai from 'chai';
chai.should();
const expect = chai.expect;

import schema from '../../../server/lib/schema';

describe('Schema', () => {

	describe('Editor\'s Picks', () => {

		it('should be able to get editor\'s picks', () => {
			const listStub = sinon.stub();
			listStub.returns({
				title: 'Editor\'s Picks',
				items: [
					{ id: 'http://api.ft.com/things/5b0be968-dff3-11e5-b67f-a61732c1d025' }
				]
			});
			const contentStub = sinon.stub();
			contentStub.returns([
				{
					id: 'http://api.ft.com/things/5b0be968-dff3-11e5-b67f-a61732c1d025',
					title: 'Super Tuesday results: sweeping victories for Trump and Clinton'
				}
			]);
			const backend = () => ({
				capi: {
					list: listStub,
					content: contentStub
				}
			});
			const query = `
				query EditorsPicks {
					editorsPicks {
						title
						items {
							id
							title
						}
					}
				}
			`;

			return graphql(schema, query, { backend })
				.then(({ data }) => {
					data.editorsPicks.title.should.equal('Editor\'s Picks');
					data.editorsPicks.items.length.should.equal(1);
					data.editorsPicks.items.should.deep.equal([
						{
							id: 'http://api.ft.com/things/5b0be968-dff3-11e5-b67f-a61732c1d025',
							title: 'Super Tuesday results: sweeping victories for Trump and Clinton'
						}
					]);
				});
		});

	});

	describe('Popular Topics', () => {

		it('should be able to fetch topics', () => {
			const topicsStub = sinon.stub();
			topicsStub.returns([
				{ id: 'abc', taxonomy: 'foo', name: 'One' },
				{ id: 'def', taxonomy: 'bar', name: 'Two' }
			]);
			const backend = () => ({
				popularApi: {
					topics: topicsStub
				}
			});
			const query = `
				query PopularTopics {
					popularTopics {
						name
						url
					}
				}
			`;

			return graphql(schema, query, { backend })
				.then(({ data }) => {
					data.popularTopics.length.should.eq(2);
					expect(data.popularTopics[0]).to.deep.equal({ name: 'One', url: '/stream/fooId/abc' });
					expect(data.popularTopics[1]).to.deep.equal({ name: 'Two', url: '/stream/barId/def' });
				});
		});
	});

	describe('Top', () => {

		it('should be able to fetch', () => {
			const pageStub = sinon.stub();
			pageStub.returns({ title: 'Top Stories', url: '1234' });
			const backend = () => ({
				capi: {
					page: pageStub
				}
			});
			const query = `
				query Top {
					top(region: UK) {
						url
						title
					}
				}
			`;

			return graphql(schema, query, { backend })
				.then(({ data }) => {
					data.top.title.should.equal('Top Stories');
					data.top.url.should.equal('1234');
				})
		});

	});

	describe('Top Stories List', () => {

		it('should be able to fetch', () => {
			const listStub = sinon.stub();
			listStub.returns({ title: 'Top Stories List', layoutHint: 'bigstory' });
			const backend = () => ({
				capi: {
					list: listStub
				}
			});
			const query = `
				query TopStoriesList {
					topStoriesList(region: UK) {
						title
						layoutHint
					}
				}
			`;

			return graphql(schema, query, { backend })
				.then(({ data }) => {
					data.topStoriesList.title.should.equal('Top Stories List');
					data.topStoriesList.layoutHint.should.equal('bigstory');
				})
		});

		it('should not break if list api is down', () => {
			const listStub = sinon.stub();
			listStub.returns(null);
			const backend = () => ({
				capi: {
					list: listStub
				}
			});
			const query = `
				query TopStoriesList {
					topStoriesList(region: UK) {
						title
					}
				}
			`;

			return graphql(schema, query, { backend })
				.then(({ data }) => {
					expect(data).to.have.property('topStoriesList');
					expect(data.topStoriesList).to.be.null;
				})
		});

	});

	describe('User', () => {

		it('should be able to access if header has api key', () => {
			const query = `
				query User {
					user(uuid: "1234") {
						uuid
					}
				}
			`;
			const req = {
				headers: {
					'x-api-key': process.env.GRAPHQL_API_KEY
				}
			};

			return graphql(schema, query, { req })
				.then(({ data }) => {
					data.user.uuid.should.equal('1234');
				})
		});

	});

	describe('Concepts', () => {

		it('should be able to fetch', () => {

			const thingsStub = sinon.stub();
			thingsStub.returns(Promise.resolve(
				{items: [
					{id: 'abc', taxonomy: 'foo', name: 'One'},
					{id: 'def', taxonomy: 'bar', name: 'Two'}
				]}));
			const backend = () => ({
				capi: {
					things: thingsStub
				}
			});
			const query = `
				query Concepts {
					concepts(ids: ["sdfjksdjfh","idauoiausyi"]) {
						name
						url
					}
				}
			`;

			return graphql(schema, query, { backend })
				.then(({ data }) => {
					data.concepts.length.should.eq(2);
					expect(data.concepts[0]).to.deep.equal({ name: 'One', url: '/stream/fooId/abc' });
					expect(data.concepts[1]).to.deep.equal({ name: 'Two', url: '/stream/barId/def' });
				});
		});
	});
});
