import { GraphQLInt, GraphQLList, GraphQLNonNull,GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

import { Edition, Region } from './types/basic';
import { Page, List, Collection } from './types/collections';
import { Content, Concept, Article, LiveBlog, Video } from './types/content';
import VideoMedia from './types/media/video';
import { ContentType } from './types/basic';
import User from './types/user';
import sources from '../config/sources';
import backendReal from './backend-adapters/index';
import userAuth from './user-auth';

import tap from './tap';
import identity from './identity';

const queryType = new GraphQLObjectType({
	name: 'Query',
	description: 'FT content API',
	fields: {
		brexitPrimary: {
			type: List,
			resolve: (root, _, { flags, backend = backendReal }) =>
				backend(flags).capi.list(sources.brexitPrimary.uuid)
		},
		brexitSecondary: {
			type: List,
			resolve: (root, _, { flags, backend = backendReal }) =>
				backend(flags).capi.list(sources.brexitSecondary.uuid)
		},
		usElectionHeadpiece: {
			type: List,
			resolve: (root, _, { flags, backend = backendReal }) =>
				backend(flags).capi.list(sources.usElectionHeadpiece.uuid)
		},
		usElectionMidriff: {
			type: List,
			resolve: (root, _, { flags, backend = backendReal }) =>
				backend(flags).capi.list(sources.usElectionMidriff.uuid)
		},
		top: {
			type: Page,
			args: {
				edition: {
					type: new GraphQLNonNull(Edition)
				}
			},
			resolve: (root, { edition }, { flags, backend = backendReal }) =>
				backend(flags).capi.page(sources[`${edition}Top`].uuid)
		},
		topStories: {
			type: List,
			args: {
				edition: {
					type: new GraphQLNonNull(Edition)
				}
			},
			resolve: (root, { edition }, { flags, backend = backendReal }) => {
				const listUuid = flags && flags.useVideoTopStoriesData && edition === 'uk' ?
					sources[`${edition}TopListWithVideos`].uuid :
					sources[`${edition}TopList`].uuid

				return backend(flags).capi.list(listUuid)
			}
		},
		fastFT: {
			type: new GraphQLList(Content),
			args: {
				from: {
					type: GraphQLInt,
					defaultValue: 0
				},
				limit: {
					type: GraphQLInt,
					defaultValue: 20
				}
			},
			resolve: (root, { from, limit }, { flags, backend = backendReal }) =>
				backend(flags).fastFT.fetch({ from, limit })
		},
		editorsPicks: {
			type: List,
			args: {
				edition: {
					type: Edition,
					defaultValue: 'uk'
				}
			},
			resolve: (root, { edition }, { flags, backend = backendReal }) =>
				backend(flags).capi.list(sources[`${edition}EditorsPicks`].uuid)
		},
		opinion: {
			type: List,
			args: {
				edition: {
					type: Edition,
					defaultValue: 'uk'
				}
			},
			resolve: (root, { edition }, { flags, backend = backendReal }) =>
				backend(flags).capi.list(sources[`${edition}Opinion`].uuid)
		},
		lifestyle: {
			type: List,
			resolve: (root, _, { flags, backend = backendReal }) =>
				backend(flags).capi.list(sources.lifestyle.uuid)
		},
		markets: {
			type: Page,
			resolve: (root, _, { flags, backend = backendReal }) =>
				backend(flags).capi.page(sources.markets.uuid)
		},
		technology: {
			type: Page,
			resolve: (root, _, { flags, backend = backendReal }) =>
				backend(flags).capi.page(sources.technology.uuid)
		},
		videos: {
			type: new GraphQLList(VideoMedia),
			args: {
				from: {
					type: GraphQLInt
				},
				limit: {
					type: GraphQLInt
				}
			},
			resolve: (root, { from, limit }, { flags, backend = backendReal }) =>
				backend(flags).video.fetch(sources.videos.id, { from, limit })
		},
		todaysTopics: {
			type: new GraphQLList(Concept),
			args: {
				edition: {
					type: Edition
				},
				from: {
					type: GraphQLInt
				},
				limit: {
					type: GraphQLInt
				},
				genres: {
					type: new GraphQLList(GraphQLString)
				},
				type: {
					type: ContentType
				}
			},
			resolve: (root, { edition, from, limit, genres, type }, { flags, backend = backendReal }) =>
				backend(flags)
					.todaysTopics
					.getTopics({ edition, from, limit, genres, type, flags })
					.then(topics => topics.slice(0, limit))
		},
		popularTopics: {
			type: new GraphQLList(Concept),
			args: {
				from: {
					type: GraphQLInt
				},
				limit: {
					type: GraphQLInt
				}
			},
			resolve: (root, { from, limit }, { flags, backend = backendReal }) =>
				backend(flags).popularApi.topics({ from, limit })
		},
		popularReadTopicsFromMyFtApi: {
			type: new GraphQLList(Concept),
			args: {
				limit: {
					type: GraphQLInt
				}
			},
			resolve: (root, { limit }, { flags, backend = backendReal }) =>
				backend(flags).myft.getMostReadTopics({ limit })
					.then(items => backend(flags).capi.things(items.map(t => t.uuid)))
		},
		popularFollowedTopicsFromMyFtApi: {
			type: new GraphQLList(Concept),
			args: {
				limit: {
					type: GraphQLInt
				}
			},
			resolve: (root, { limit }, { flags, backend = backendReal }) =>
				backend(flags).myft.getMostFollowedTopics({ limit })
					.then(items => backend(flags).capi.things(items.map(t => t.uuid)))
		},
		popularArticles: {
			type: new GraphQLList(Content),
			args: {
				from: {
					type: GraphQLInt
				},
				limit: {
					type: GraphQLInt
				},
				genres: {
					type: new GraphQLList(GraphQLString)
				},
				type: {
					type: ContentType
				},
				concept: {
					type: GraphQLString
				}
			},
			resolve: (root, args, { flags, backend = backendReal }) => {
				const be = backend(flags);
				return be.popularApi.articles(args)
					.then(articles => be.capi.content(articles, args));
			}
		},
		popularPremiumArticles: {
			type: new GraphQLList(Content),
			resolve: (root, _, { flags, backend = backendReal }) => {
				const be = backend(flags);
				const popularArticlesPromises = [];
				sources.popularPremiumArticles.concepts.map(concept => {
					popularArticlesPromises.push(be.popularApi.articles({limit: 1, concept}));
				});
				return Promise.all(popularArticlesPromises)
					.then(articleArrays => articleArrays.reduce((a, b) => a.concat(b)))
					.then(articles => be.capi.content(articles));
			}
		},
		popularFromHui: {
			type: new GraphQLList(Content),
			args: {
				industry: {
					type: GraphQLString
				},
				position: {
					type: GraphQLString
				},
				sector: {
					type: GraphQLString
				},
				country: {
					type: GraphQLString
				},
				period: {
					type: GraphQLString
				},
				from: {
					type: GraphQLInt
				},
				limit: {
					type: GraphQLInt
				},
				genres: {
					type: new GraphQLList(GraphQLString)
				},
				type: {
					type: ContentType
				}
			},
			resolve: (root, args, { flags, backend = backendReal }) => {
				const be = backend(flags);
				return be.hui.content(args)
					.then(articles => be.capi.content(articles, args));
			}
		},
		popularTopicsFromHui: {
			type: new GraphQLList(Concept),
			args: {
				industry: {
					type: GraphQLString
				},
				position: {
					type: GraphQLString
				},
				sector: {
					type: GraphQLString
				},
				country: {
					type: GraphQLString
				},
				period: {
					type: GraphQLString
				},
				limit: {
					type: GraphQLInt
				}
			},
			resolve: (root, { industry, position, sector, country, period, limit }, { flags, backend = backendReal }) =>
				backend(flags)
					.hui.topics({ industry, position, sector, country, period })
					.then(items => backend(flags).capi
						.things(items, { type: 'prefLabel' })
						.then(items => items.filter(t => t).slice(0, limit))
					)
		},
		user: {
			type: User,
			args: {
				uuid: {
					type: GraphQLString
				}
			},
			resolve: (root, { uuid }, { req }) =>
				userAuth(req, uuid).then(uuid => ({ uuid }))
		},
		concepts: {
			type: new GraphQLList(Concept),
			args: {
				ids: {
					type: new GraphQLList(GraphQLString),
					defaultValue: []
				}
			},
			resolve: (root, { ids }, { flags, backend = backendReal }) =>
				backend(flags).capi.things(ids)
		},
		collections: {
			type: new GraphQLList(Collection),
			args: {
				limit: {
					type: GraphQLInt,
					defaultValue: 4
				}
			},
			resolve: (root, { limit }, { flags, backend = backendReal }) =>
				backend(flags).bertha
					.get('1rsBgkPD51vI7UvFz6GCuR-LX6x0TV-o6VLueYW0RDcs', 'Output')
					.then(results => {
						const collections = JSON.parse(JSON.stringify(results)).slice(0, limit);
						const ids = [].concat(...collections.map(c => c.concepts));
						return backend(flags).capi.things(ids).then(concepts => {
							return collections.map(tap(collection => {
								collection.concepts = collection
									.concepts
									.map(o => concepts.find(n => n.id === o))
									.filter(identity);
							}));
						});
					})
		},
		listOfType: {
			type: new GraphQLList(Content),
			args: {
				listType : {
					type: new GraphQLNonNull(GraphQLString)
				},
				concept: {
					type: new GraphQLNonNull(GraphQLString)
				}
			},
			resolve: (root, { listType, concept }, { flags, backend = backendReal }) => {
				const be = backend(flags);
				return be.capi.listOfType(listType, concept)
					.then(list => {
						if (!list) {
							return [];
						}
						// When there are multiple lists meeting the criteria an array is returned
						// We're only interested in the first of the array - the most recent
						if (Array.isArray(list)) {
							list = list[0];
						}
						const articlesUuids = list.items.map(item => item.id.substring(item.id.length - 36));
						return be.capi.content(articlesUuids)
					});
			}
		},
		page: {
			type: Page,
			args: {
				uuid: {
					type: new GraphQLNonNull(GraphQLString)
				}
			},
			resolve: (root, { uuid }, { flags, backend = backendReal }) =>
				backend(flags).capi.page(uuid)
		},
		search: {
			type: new GraphQLList(Content),
			args: {
				termName: {
					type: new GraphQLNonNull(GraphQLString)
				},
				termValue: {
					type: new GraphQLNonNull(GraphQLString)
				},
				limit: {
					type: GraphQLInt,
					defaultValue: 20
				}
			},
			resolve: (root, { termName, termValue, limit }, { flags, backend = backendReal }) =>
				backend(flags).capi.search(termName, termValue, { limit })
		},
		regionalNews: {
			type: List,
			args: {
				region: {
					type: new GraphQLNonNull(Region)
				}
			},
			resolve: (root, { region }, { flags, backend = backendReal }) =>
				backend(flags).capi.list(sources[`${region}RegionalNews`].uuid)
		}
	}
});

export default new GraphQLSchema({
	query: queryType,
	types: [ Article, LiveBlog, Video ]
});
