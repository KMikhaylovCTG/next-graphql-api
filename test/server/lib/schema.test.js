import { graphql } from 'graphql';
import sinon from 'sinon';
import chai from 'chai';
chai.should();
const expect = chai.expect;

import schema from '../../../server/lib/schema';
import listOfTypeFixture from '../../fixtures/list-of-type-fixture.json';
import listWithVideoContent from '../../fixtures/list-including-video-content.json';
import mixedContentFetch from '../../fixtures/mixed-content-fetch.json'


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
					title: 'Super Tuesday results: sweeping victories for Trump and Clinton',
					url: 'https://www.ft.com/content/5b0be968-dff3-11e5-b67f-a61732c1d025'
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
							url
						}
					}
				}
			`;

			return graphql(schema, query, null, { backend })
				.then(({ data }) => {
					data.editorsPicks.title.should.equal('Editor\'s Picks');
					data.editorsPicks.items.length.should.equal(1);
					data.editorsPicks.items.should.deep.equal([
						{
							id: 'http://api.ft.com/things/5b0be968-dff3-11e5-b67f-a61732c1d025',
							title: 'Super Tuesday results: sweeping victories for Trump and Clinton',
							url: 'https://www.ft.com/content/5b0be968-dff3-11e5-b67f-a61732c1d025'
						}
					]);
				});
		});

	});

	describe('Popular Topics', () => {

		it('should be able to fetch topics', () => {
			const topicsStub = sinon.stub();
			topicsStub.returns([
				{ url: 'https://www.ft.com/stream/fooId/abc', id: 'abc', taxonomy: 'foo', name: 'One' },
				{ url: 'https://www.ft.com/stream/barId/def', id: 'def', taxonomy: 'bar', name: 'Two' }
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

			return graphql(schema, query, null, { backend })
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
					top(edition: UK) {
						url
						title
					}
				}
			`;

			return graphql(schema, query, null, { backend })
				.then(({ data }) => {
					data.top.title.should.equal('Top Stories');
					data.top.url.should.equal('1234');
				})
		});

	});

	describe('Top Stories', () => {

		it('should be able to fetch', () => {
			const listStub = sinon.stub();
			listStub.withArgs('520ddb76-e43d-11e4-9e89-00144feab7de').returns({ title: 'Top Stories', layoutHint: 'bigstory' });
			listStub.withArgs('81f74b34-cbf9-11e5-be0b-b7ece4e953a0').returns({ title: 'Top Stories List with Videos', layoutHint: 'standalonevideo' });
			const backend = () => ({
				capi: {
					list: listStub
				}
			});
			const query = `
				query TopStories {
					topStories(edition: UK) {
						title
						layoutHint
					}
				}
			`;

			return graphql(schema, query, null, { backend })
				.then(({ data }) => {
					data.topStories.title.should.equal('Top Stories');
					data.topStories.layoutHint.should.equal('bigstory');
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
				query TopStories {
					topStories(edition: UK) {
						title
					}
				}
			`;

			return graphql(schema, query, null, { backend })
				.then(({ data }) => {
					expect(data).to.have.property('topStories');
					expect(data.topStories).to.be.null;
				})
		});

		it('should be able to fetch from test list if flag is set', () => {
			const listStub = sinon.stub();
			listStub.withArgs('520ddb76-e43d-11e4-9e89-00144feab7de').returns({ title: 'Top Stories List', layoutHint: 'bigstory' });
			listStub.withArgs('81f74b34-cbf9-11e5-be0b-b7ece4e953a0').returns({ title: 'Top Stories List with Videos', layoutHint: 'standalonevideo' });
			const backend = () => ({
				capi: {
					list: listStub
				}
			});
			const query = `
				query TopStories {
					topStories(edition: UK) {
						title
						layoutHint
					}
				}
			`;

			return graphql(schema, query, null, { flags: {useVideoTopStoriesData: true}, backend })
				.then(({ data }) => {
					data.topStories.title.should.equal('Top Stories List with Videos');
					data.topStories.layoutHint.should.equal('standalonevideo');
				})
		});

		it('should be able to have mixed content types e.g. Articles & Videos', () => {
			const listStub = sinon.stub();
			const contentStub = sinon.stub();
			listStub.returns(listWithVideoContent);
			contentStub.returns(mixedContentFetch)

			const backend = () => ({
				capi: {
					list: listStub,
					content: contentStub
				}
			});
			const query = `
				query TopStories {
					topStories(edition: UK) {
						items {
							id
							contentType
						}
					}
				}
			`;

			const expected = [
				{
					'id': '5cebe746-655a-11e6-8310-ecf0bddad227',
					'contentType': 'Article'
				},
				{
					'id': '57e57cb3-a52f-3723-986a-fba78ba2177d',
					'contentType': 'Video'
				}
			]

			return graphql(schema, query, null, { backend })
				.then(({ data }) => {
					expect(data.topStories.items.length).to.equal(2);
					expect(data.topStories.items).to.deep.equal(expected);
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

			return graphql(schema, query, null, { req })
				.then(({ data }) => {
					data.user.uuid.should.equal('1234');
				})
		});

	});

	describe('Concepts', () => {

		it('should be able to fetch', () => {

			const thingsStub = sinon.stub();
			thingsStub.returns(Promise.resolve(
				[
					{url: 'https://www.ft.com/stream/fooId/abc', id: 'abc', taxonomy: 'foo', name: 'One'},
					{url: 'https://www.ft.com/stream/barId/def', id: 'def', taxonomy: 'bar', name: 'Two'}
				]
			));
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

			return graphql(schema, query, null, { backend })
				.then(({ data }) => {
					data.concepts.length.should.eq(2);
					expect(data.concepts[0]).to.deep.equal({ name: 'One', url: '/stream/fooId/abc' });
					expect(data.concepts[1]).to.deep.equal({ name: 'Two', url: '/stream/barId/def' });
				});
		});
	});

	describe('List Of Type', () => {

		const query = `
		query GetListOfType{
			listOfType(listType: "curatedTopStories", concept: "NzE=-U2VjdGlvbnM=") {
				id
			}
		}
		`
		const listOfTypeStub = sinon.stub();
		const contentStub = sinon.stub();
		const backend = () => ({
			capi: {
				listOfType: listOfTypeStub,
				content: contentStub
			}
		});

		afterEach(() => {
			listOfTypeStub.reset();
			contentStub.reset();
		});


		it('returns an array of articles', () => {

			listOfTypeStub.returns(Promise.resolve(listOfTypeFixture));
			contentStub.returns(Promise.resolve([
				{
					id: 'http://api.ft.com/things/5b0be968-dff3-11e5-b67f-a61732c1d025',
					title: 'Super Tuesday results: sweeping victories for Trump and Clinton'
				},
				{
					id: 'http://api.ft.com/things/5b0be968-dff3-11e5-b67f-a61732c1d025',
					title: 'Super Tuesday results: sweeping victories for Trump and Clinton'
				}
			]));

			return graphql(schema, query, null, { backend })
				.then(({data}) => {
					expect(data.listOfType.length).to.equal(2);
					expect(data.listOfType[0].id).to.exist;
					expect(data.listOfType[1].id).to.exist;
					expect(listOfTypeStub.calledOnce).to.be.true;
					expect(contentStub.calledOnce).to.be.true;
				});
		});

		it('handles getting an array of lists returned', () => {
			listOfTypeStub.returns(Promise.resolve([listOfTypeFixture, listOfTypeFixture]));
			contentStub.returns(Promise.resolve([
				{
					id: 'http://api.ft.com/things/5b0be968-dff3-11e5-b67f-a61732c1d025',
					title: 'Super Tuesday results: sweeping victories for Trump and Clinton'
				},
				{
					id: 'http://api.ft.com/things/5b0be968-dff3-11e5-b67f-a61732c1d025',
					title: 'Super Tuesday results: sweeping victories for Trump and Clinton'
				}
			]));

			return graphql(schema, query, null, { backend })
				.then(({data}) => {
					expect(data.listOfType.length).to.equal(2);
					expect(data.listOfType[0].id).to.exist;
					expect(data.listOfType[1].id).to.exist;
					expect(listOfTypeStub.calledOnce).to.be.true;
					expect(contentStub.calledOnce).to.be.true;
				});
		});

		it('gracefully handles no data being returned', () => {

			listOfTypeStub.returns(Promise.resolve(undefined));

			return graphql(schema, query, null, { backend })
				.then(({data}) => {
					expect(data.listOfType).to.eql([]);
					expect(listOfTypeStub.calledOnce).to.be.true;
					expect(contentStub.called).to.be.false;
				});
		});
	});

	describe('Page', () => {

		it('should be able to fetch', () => {
			const pageStub = sinon.stub();
			pageStub.returns({ title: 'UK Stories', url: '1234' });
			const backend = () => ({
				capi: {
					page: pageStub
				}
			});
			const query = `
				query Page {
					page(uuid: "2836ebbe-cd26-11de-a748-00144feabdc0") {
						url
						title
					}
				}
			`;

			return graphql(schema, query, null, { backend })
				.then(({ data }) => {
					data.page.title.should.equal('UK Stories');
					data.page.url.should.equal('1234');
				})
		});

	});

	describe('Popular Premium Articles', () => {

		const stubs = {
			content: sinon.stub(),
			articles: sinon.stub()
		};

		afterEach(() => {
			stubs.content.reset();
			stubs.articles.reset();
		});

		it('should return an array of 5 articles', () => {
			const query = `
				query GetPopularPremiumArticles {
					popularPremiumArticles {
						id
					}
				}
			`;
			const backend = () => ({
				capi: { content: stubs.content },
				popularApi: { articles: stubs.articles }
			});
			stubs.content.returnsArg(0);
			stubs.articles.returns([{id: '1234'}]);
			return graphql(schema, query, null, { backend })
			.then(({ data }) => {
				expect(stubs.articles.callCount).to.equal(5);
				expect(stubs.content.callCount).to.equal(1);
				expect(data.popularPremiumArticles.length).to.equal(5);
				data.popularPremiumArticles.map(article => {
					expect(article.id).to.equal('1234');
				});
			});
		});

	});

});
