import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql';
import {expect} from 'chai';

import Video from '../../../../server/lib/types/media/video';

const videoFixture = require('../../../fixtures/video-fixture.json');

describe('Video', () => {


		const testSchema = source => new GraphQLSchema({
			query: new GraphQLObjectType({
				name: 'Test',
				fields: () => ({
					video: {
						type: Video,
						resolve: () => source
					}
				})
			})
		});

		context('General fields', () => {

			function setup () {
				const schema = testSchema(videoFixture);
				const query = `
					query Video {
						video {
							id
							title
							summary
							description
							image {
								src(width:700)
								alt
							}
							brand
							duration
						}
					}
				`;

				return graphql(schema, query)
					.then(({data}) => {
						return data.video;
					});
			}

			it('Can get the id', () => {
				return setup()
					.then(video => {
						expect(video.id).to.equal(videoFixture.id.toString())
					})
			});

			it('Can get the title', () => {
				return setup()
					.then(video => {
						expect(video.title).to.equal(videoFixture.name)
					})
			});

			it('Can get the summary', () => {
				return setup()
					.then(video => {
						expect(video.summary).to.equal(videoFixture.shortDescription)
					})
			});

			it('Can get the description', () => {
				return setup()
					.then(video => {
						expect(video.description).to.equal(videoFixture.longDescription)
					})
			});

			it('Can get the placeholder image', () => {
				return setup()
					.then(video => {
						expect(video.image.src).to.exist;
					})
			});

			it('Can get the placeholder image', () => {
				return setup()
					.then(video => {
						expect(video.image.src).to.exist;
					})
			});

			it('Can get the brand', () => {
				return setup()
					.then(video => {
						expect(video.brand).to.equal('FT Markets');
					})
			});

			it('Can get the duration', () => {
				return setup()
					.then(video => {
						expect(video.duration).to.equal('3:04');
					})
			})
		});


});
