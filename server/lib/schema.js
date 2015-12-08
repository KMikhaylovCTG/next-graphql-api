import {
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLNonNull,
	GraphQLString,
	GraphQLInt,
	GraphQLList,
} from 'graphql';

import {Region} from './types/basic';
import {Collection} from './types/collections';
import {Content, Video, Concept} from './types/content';
import {ContentType} from './types/basic';

import sources from '../config/sources';

const queryType = new GraphQLObjectType({
	name: 'Query',
	description: 'FT content API',
	fields: {
		top: {
			type: Collection,
			args: {
				region: { type: new GraphQLNonNull(Region) }
			},
			resolve: (root, {region}, {rootValue: {backend}}) => {
				let uuid = sources[`${region}Top`].uuid;

				return backend.page(uuid);
			}
		},
		fastFT: {
			type: Collection,
			resolve: (root, _, {rootValue: {backend}}) => {
				return backend.fastFT();
			}
		},
		editorsPicks: {
			type: Collection,
			resolve: (root, _, {rootValue: {backend, flags}}) => {
				if (flags && flags.editorsPicksFromList) {
					return backend.list(sources['editorsPicks'].uuid);
				} else {
					return [];
				}
			}
		},
		opinion: {
			type: Collection,
			resolve: (root, _, {rootValue: {backend}}) => {
				let {uuid, sectionsId} = sources.opinion;

				return backend.page(uuid, sectionsId);
			}
		},
		lifestyle: {
			type: Collection,
			resolve: (root, _, {rootValue: {backend}}) => {
				let {uuid, sectionsId} = sources.lifestyle;

				return backend.page(uuid, sectionsId);
			}
		},
		markets: {
			type: Collection,
			resolve: (root, _, {rootValue: {backend}}) => {
				let {uuid, sectionsId} = sources.markets;

				return backend.page(uuid, sectionsId);
			}
		},
		technology: {
			type: Collection,
			resolve: (root, _, {rootValue: {backend}}) => {
				let {uuid, sectionsId} = sources.technology;

				return backend.page(uuid, sectionsId);
			}
		},
		popular: {
			type: Collection,
			resolve: (root, _, {rootValue: {backend}}) => {
				let url = sources.popular.url;

				return backend.popular(url, 'Popular');
			}
		},
		search: {
			type: Collection,
			args: {
				query: { type: new GraphQLNonNull(GraphQLString) }
			},
			resolve: (_, {query}, {rootValue: {backend}}) => {
				return backend.search(query)
					.then(ids => ({ items: ids }));
			}
		},
		videos: {
			type: new GraphQLList(Video),
			args: {
				from: { type: GraphQLInt },
				limit: { type: GraphQLInt }
			},
			resolve: (root, {from, limit}, {rootValue: {backend}}) => {
				let {id} = sources.videos;
				return backend.videos(id, {from, limit});
			}
		},
		popularTopics: {
			type: new GraphQLList(Concept),
			args: {
				from: { type: GraphQLInt },
				limit: { type: GraphQLInt }
			},
			resolve: (root, {from, limit}, {rootValue: {backend}}) => {
				return backend.popularTopics({from, limit})
			}
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
				}
			},
			resolve: (root, args, { rootValue: { backend }}) => {
				return backend
					.popularArticles(args)
					.then(articles => backend.content(articles, args));
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
			resolve: (root, args, { rootValue: { backend }}) => {
				return backend
					.popularFromHui(args)
					.then(articles => backend.content(articles, args));
			},
		}
	}
});

export default new GraphQLSchema({
	query: queryType
});
