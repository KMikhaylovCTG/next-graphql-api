import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql';
import chai from 'chai';
chai.should();
const expect = chai.expect;

import { Content } from '../../../../server/lib/types/content';

describe('Content', () => {

	describe('Content', () => {

		const testSchema = source => new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Test',
				fields: () => ({
					content: {
						type: Content,
						resolve: () => source
					}
				})
			})
		});

		it('should be able to get primaryTheme', () => {
			const schema = testSchema({
				metadata: [
					{ url: 'https://www.ft.com/stream/themeId/Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', idV1: 'Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', primary: 'theme' }
				]
			});
			const query = `
					query Content {
						content {
							primaryTheme {
								id
							}
						}
					}
				`;

			return graphql(schema, query)
				.then(({ data }) => {
					expect(data.content.primaryTheme).to.eql({ id: 'Q0ItMDAwMDgwNQ==-QXV0aG9ycw==' });
				});
		});

		it('should be able to get primarySection', () => {
			const schema = testSchema({
				metadata: [
					{ idV1: 'Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', primary: 'section' }
				]
			});
			const query = `
					query Content {
						content {
							primarySection {
								id
							}
						}
					}
				`;

			return graphql(schema, query)
				.then(({ data }) => {
					expect(data.content.primarySection).to.eql({ id: 'Q0ItMDAwMDgwNQ==-QXV0aG9ycw==' });
				});
		});

		it('should handle missing primarySection', () => {
			const schema = testSchema({
				metadata: [
					{ idV1: 'Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', primary: 'theme' }
				]
			});
			const query = `
					query Content {
						content {
							primarySection {
								id
							}
						}
					}
				`;

			return graphql(schema, query)
				.then(({ data }) => {
					expect(data.content.primaryTheme).to.be.undefiend;
				});
		});

		describe('assigns correct content type', () => {

			const query = `
			query Content {
				content {
					contentType
				}
			}
			`;

			it('should correctly return Article type', () => {
				const schema = testSchema({
					webUrl: 'http://www.ft.com/cms/s/0/5cebe746-655a-11e6-8310-ecf0bddad227.html',
				});

				return graphql(schema, query)
				.then(({ data }) => {
					expect(data.content.contentType).to.eql('Article');
				});
			});

			it('should correctly return LiveBlog type', () => {
				const schema = testSchema({
					webUrl: 'http://liveblog.ft.com/mba-blog/2016/08/29/application-essays-question-told-me-chicago-booth-was-the-right-choice/',
				});

				return graphql(schema, query)
				.then(({ data }) => {
					expect(data.content.contentType).to.eql('LiveBlog');
				});
			});

			it('should correctly return Video type', () => {
				const schema = testSchema({
					webUrl: 'http://video.ft.com/123456789',
				});

				return graphql(schema, query)
				.then(({ data }) => {
					expect(data.content.contentType).to.eql('Video');
				});
			});
		});


		describe('Authors', () => {

			it('should be able to get authors', () => {
				const schema = testSchema({
					metadata: [
						{ url: 'https://www.ft.com/stream/authorsId/Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', taxonomy: 'authors', idV1: 'Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', prefLabel: 'Edward Luce' },
						{ url: 'https://www.ft.com/stream/authorsId/Q0ItMDA2NTUxOA==-QXV0aG9ycw==', taxonomy: 'authors', idV1: 'Q0ItMDA2NTUxOA==-QXV0aG9ycw==', prefLabel: 'Philip Augar' }
					]
				});
				const query = `
					query Content {
						content {
							authors {
								name
								id
							}
						}
					}
				`;

				return graphql(schema, query)
					.then(({ data }) => {
						data.content.authors.should.eql([
							{ id: 'Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', name: 'Edward Luce' },
							{ id: 'Q0ItMDA2NTUxOA==-QXV0aG9ycw==', name: 'Philip Augar' }
						]);
					});
			});

			it('should be able to get author\'s headshot', () => {
				const schema = testSchema({
					metadata: [
						{ url: 'https://www.ft.com/stream/authorsId/Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', taxonomy: 'authors', idV1: 'Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', prefLabel: 'Edward Luce' }
					]
				});
				const query = `
					query Content {
						content {
							authors {
								headshot
							}
						}
					}
				`;

				return graphql(schema, query)
					.then(({ data }) => {
						data.content.authors.should.eql([
							{ headshot: 'https://next-geebee.ft.com/image/v1/images/raw/fthead:edward-luce' }
						]);
					});
			});

			it('should be able to get author\'s headshot if author\'s name contains an apostrophe', () => {
				const schema = testSchema({
					metadata: [
						{ url: 'https://www.ft.com/stream/authorsId/Q0ItMDAwMTA1NQ==-QXV0aG9y==', taxonomy: 'authors', idV1: 'Q0ItMDAwMTA1NQ==-QXV0aG9ycw==', prefLabel: 'Sarah O\'Connor' }
					]
				});
				const query = `
					query Content {
						content {
							authors {
								headshot
							}
						}
					}
				`;

				return graphql(schema, query)
					.then(({ data }) => {
						data.content.authors.should.eql([
							{ headshot: 'https://next-geebee.ft.com/image/v1/images/raw/fthead:sarah-o-connor' }
						]);
					});
			});

			it('should flag if author is a brand', () => {
				const schema = testSchema({
					metadata: [
						{ url: 'https://www.ft.com/stream/authorsId/', taxonomy: 'authors', primary: 'brand' }
					]
				});
				const query = `
					query Content {
						content {
							authors {
								isBrand
							}
						}
					}
				`;

				return graphql(schema, query)
					.then(({ data }) => {
						data.content.authors.should.eql([{ isBrand: true }]);
					});
			});

			it('should be able to get author\'s url ', () => {
				const schema = testSchema({
					metadata: [
						{ url: 'https://www.ft.com/stream/authorsId/Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', taxonomy: 'authors', idV1: 'Q0ItMDAwMDgwNQ==-QXV0aG9ycw==', prefLabel: 'Edward Luce' }
					]
				});
				const query = `
					query Content {
						content {
							authors {
								url
							}
						}
					}
				`;

				return graphql(schema, query)
					.then(({ data }) => {
						data.content.authors.should.eql([{ url: '/stream/authorsId/Q0ItMDAwMDgwNQ==-QXV0aG9ycw==' }]);
					});
			});

		});

		describe('Video Content', () => {
			it('should be able to get the brightcoveId', () => {
				const schema = testSchema({
					webUrl: 'http://video.ft.com/123456789',
					url: 'http://video.ft.com/123456789'
				});
				const query = `
						query Content {
							content {
								... on VideoContent {
									brightcoveId
								}
							}
						}
					`;

				return graphql(schema, query)
					.then(({ data }) => {
						expect(data.content.brightcoveId).to.eql('123456789');
					});

			});
		});

	});

});
