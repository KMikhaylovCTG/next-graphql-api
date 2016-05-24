import { GraphQLInt, GraphQLList, GraphQLNonNull,GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

import { Region } from './types/basic';
import { Page, List, Collection } from './types/collections';
import { Content, Video, Concept } from './types/content';
import { ContentType } from './types/basic';
import User from './types/user';
import sources from '../config/sources';
import backendReal from './backend-adapters/index';
import userAuth from './user-auth';
import filterContent from './helpers/filter-content';

import tap from './tap';
import identity from './identity';

const queryType = new GraphQLObjectType({
	name: 'Query',
	description: 'FT content API',
	fields: {
		brexitCoverage: {
			type: List,
			resolve: (root, _, { rootValue: { flags, backend = backendReal }}) => {
				const uuid = sources['brexitCoverage'].uuid;
				return backend(flags).capi.list(uuid);
			}
		},
		brexitBuildup: {
			type: List,
			resolve: (root, _, { rootValue: { flags, backend = backendReal }}) => {
				const uuid = sources['brexitBuildup'].uuid;
				return backend(flags).capi.list(uuid);
			}
		},
		top: {
			type: Page,
			args: {
				region: {
					type: new GraphQLNonNull(Region)
				}
			},
			resolve: (root, { region }, { rootValue: { flags, backend = backendReal }}) => {
				const uuid = sources[`${region}Top`].uuid;
				return backend(flags).capi.page(uuid);
			}
		},
		topStoriesList: {
			type: List,
			args: {
				region: {
					type: new GraphQLNonNull(Region)
				}
			},
			resolve: (root, { region }, { rootValue: { flags, backend = backendReal }}) => {
				const uuid = sources[`${region}TopList`].uuid;
				return backend(flags).capi.list(uuid);
			}
		},
		fastFT: {
			type: new GraphQLList(Content),
			args: {
				from: {
					type: GraphQLInt
				},
				limit: {
					type: GraphQLInt
				}
			},
			resolve: (root, args, { rootValue: { flags, backend = backendReal }}) =>
				filterContent(args)(backend(flags).fastFT.fetch() || [])
		},
		editorsPicks: {
			type: List,
			resolve: (root, _, { rootValue: { flags, backend = backendReal }}) => {
				const uuid = sources['editorsPicks'].uuid;
				return backend(flags).capi.list(uuid);
			}
		},
		opinion: {
			type: List,
			resolve: (root, _, { rootValue: { flags, backend = backendReal }}) => {
				const { uuid, url } = sources.opinion;
				return backend(flags).capi.list(uuid, url);
			}
		},
		lifestyle: {
			type: Page,
			resolve: (root, _, { rootValue: { flags, backend = backendReal }}) => {
				const { uuid, url } = sources.lifestyle;
				return backend(flags).capi.page(uuid, url);
			}
		},
		markets: {
			type: Page,
			resolve: (root, _, { rootValue: { flags, backend = backendReal }}) => {
				const { uuid, url } = sources.markets;
				return backend(flags).capi.page(uuid, url);
			}
		},
		technology: {
			type: Page,
			resolve: (root, _, { rootValue: { flags, backend = backendReal }}) => {
				const { uuid, url } = sources.technology;
				return backend(flags).capi.page(uuid, url);
			}
		},
		videos: {
			type: new GraphQLList(Video),
			args: {
				from: {
					type: GraphQLInt
				},
				limit: {
					type: GraphQLInt
				}
			},
			resolve: (root, { from, limit }, { rootValue: { flags, backend = backendReal }}) => {
				const { id } = sources.videos;
				return backend(flags).video.fetch(id, { from, limit });
			}
		},
		todaysTopics: {
			type: new GraphQLList(Concept),
			args: {
				region: {
					type: new GraphQLNonNull(Region)
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
			resolve: (root, { region, from, limit, genres, type }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags)
					.todaysTopics
					.getTopics({region, from, limit, genres, type}, flags)
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
			resolve: (root, { from, limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).popularApi.topics({ from, limit })
		},
		popularReadTopicsFromMyFtApi: {
			type: new GraphQLList(Concept),
			args: {
				limit: {
					type: GraphQLInt
				}
			},
			resolve: (root, { limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).myft.getMostReadTopics({ limit })
					.then(items => backend(flags).capi.things(items.map(t => t.uuid)).then(c => c.items))
		},
		popularFollowedTopicsFromMyFtApi: {
			type: new GraphQLList(Concept),
			args: {
				limit: {
					type: GraphQLInt
				}
			},
			resolve: (root, { limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).myft.getMostFollowedTopics({ limit })
					.then(items => backend(flags).capi.things(items.map(t => t.uuid)).then(c => c.items))
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
			resolve: (root, args, { rootValue: { flags, backend = backendReal }}) => {
				const be = backend(flags);
				return be.popularApi.articles(args)
					.then(articles => be.capi.content(articles, args));
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
			resolve: (root, args, { rootValue: { flags, backend = backendReal }}) => {
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
			resolve: (root, { industry, position, sector, country, period, limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags)
					.hui.topics({industry, position, sector, country, period})
					.then(items => backend(flags).capi
						.things(items, 'prefLabel')
						.then(c => c.items
							.filter(t => t)
							.slice(0, limit)
						)
					)
		},
		user: {
			type: User,
			args: {
				uuid: {
					type: GraphQLString
				}
			},
			resolve: (root, { uuid }, { rootValue: { req }}) => userAuth(req, uuid).then(uuid => ({ uuid }))
		},
		concepts: {
			type: new GraphQLList(Concept),
			args: {
				ids: {
					type: new GraphQLList(GraphQLString)
				}
			},
			resolve: (root, { ids }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).capi.things(ids).then(c => c.items)
		},
		collections: {
			type: new GraphQLList(Collection),
			args: {
				limit: {
					type: GraphQLInt,
					defaultValue: 4
				}
			},
			resolve: (root, { limit }, { rootValue: { flags, backend = backendReal }}) => {
				return backend(flags).bertha.get('1rsBgkPD51vI7UvFz6GCuR-LX6x0TV-o6VLueYW0RDcs', 'Output')
					.then(results => {
						const collections = JSON.parse(JSON.stringify(results)).slice(0, limit);
						const ids = [].concat(...collections.map(c => c.concepts));
						return backend(flags).capi.things(ids).then(({items:concepts}) => {
							return collections.map(tap(collection => {
								collection.concepts = collection
									.concepts
									.map(o => concepts.find(n => n.id === o))
									.filter(identity);
							}));
						});
					});
			}
		}
	}
});

export default new GraphQLSchema({
	query: queryType
});
