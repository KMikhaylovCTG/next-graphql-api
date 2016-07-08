import { GraphQLString, GraphQLInt, GraphQLList, GraphQLObjectType } from 'graphql';

import { Content, Concept } from './content';
import { ContentType } from './basic';
import backendReal from '../backend-adapters/index';
import moment from 'moment';
import identity from '../identity';

const contentToUiid = content => content.id.replace(/http:\/\/api\.ft\.com\/things?\//, '');

const Page = new GraphQLObjectType({
	name: 'Page',
	description: 'Page of content',
	fields: {
		url: {
			type: GraphQLString
		},
		title: {
			type: GraphQLString
		},
		items: {
			type: new GraphQLList(Content),
			description: 'Content items of the page',
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
			resolve: (page, { from, limit, genres, type }, { rootValue: { flags, backend = backendReal }}) =>
				(page.items && page.items.length) ?
					backend(flags).capi.content(page.items, { from, limit, genres, type }) : []
		}
	}
});

const List = new GraphQLObjectType({
	name: 'List',
	description: 'Items contained in a list',
	fields: {
		url: {
			type: GraphQLString
		},
		title: {
			type: GraphQLString
		},
		layoutHint: {
			type: GraphQLString
		},
		items: {
			type: new GraphQLList(Content),
			description: 'Content items',
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
			resolve: (result, args, { rootValue: { flags, backend = backendReal }}) =>
				(result.items && result.items.length) ?
					backend(flags).capi.content(result.items.map(contentToUiid), args) : []
		}
	}
});

const Collection = new GraphQLObjectType({
	name: 'Collection',
	description: 'Abstract collection of concepts',
	fields: {
		title: {
			type: GraphQLString
		},
		concepts: {
			type: new GraphQLList(Concept),
			description: 'Concepts'
		},
		articleCount: {
			type: GraphQLInt,
			description: 'Approximate number of articles published with each of the sub-concepts',
			args: {
				since: {
					type: GraphQLString,
					defaultValue: moment().subtract(7, 'days').format('YYYY-MM-DD'),
					definition: 'Default is one week ago'
				},
				genres: {
					type: new GraphQLList(GraphQLString)
				},
				type: {
					type: ContentType
				}
			},
			resolve: (collection, { since, genres, type }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).capi.searchCount('metadata.idV1', collection.concepts.map(c => c.id), { since, genres, type })
		}
	}
});

export { Page, List, Collection };
