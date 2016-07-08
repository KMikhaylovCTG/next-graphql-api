import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt } from 'graphql';

import { Content, Concept } from './content';
import backendReal from '../backend-adapters/index';

export default new GraphQLObjectType({
	name: 'User',
	description: 'Represents an FT user',
	fields: {
		uuid: {
			type: GraphQLString
		},
		saved: {
			type: new GraphQLList(Content),
			args: {
				limit: {
					type: GraphQLInt,
					defaultValue: 10
				}
			},
			resolve: ({ uuid }, { limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).myft
					.getAllRelationship(uuid, 'saved', 'content', { limit })
					.then(items => !items ? [] : backend(flags).capi.content(items.map(item => item.uuid), { limit }))
		},
		read: {
			type: new GraphQLList(Content),
			args: {
				limit: {
					type: GraphQLInt,
					defaultValue: 10
				}
			},
			resolve: ({ uuid }, { limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).myft
					.getAllRelationship(uuid, 'read', 'content', { limit })
					.then(items => !items ? [] : backend(flags).capi.content(items.map(item => item.uuid), { limit }))
		},
		followed: {
			type: new GraphQLList(Concept),
			args: {
				limit: {
					type: GraphQLInt,
					defaultValue: 10
				}
			},
			resolve: ({ uuid }, { limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).myft.personalisedFeed(uuid, { limit })
		},
		viewed: {
			type: new GraphQLList(Concept),
			args: {
				limit: {
					type: GraphQLInt,
					defaultValue: 10
				}
			},
			resolve: ({ uuid }, { limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).myft
					.getViewed(uuid, { limit })
					.then(concepts => !concepts ? [] : concepts)
		},
		personalisedFeed: {
			type: new GraphQLList(Content),
			args: {
				limit: {
					type: GraphQLInt,
					defaultValue: 10
				}
			},
			resolve: ({ uuid }, { limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).myft
					.personalisedFeed(uuid, { limit })
					.then(items => !items ? [] : items.map(item => item.content))
		},
		recommendedTopics: {
			type: new GraphQLList(Concept),
			args: {
				limit: {
					type: GraphQLInt,
					defaultValue: 10
				}
			},
			resolve: ({ uuid }, { limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags)
					.myft.getRecommendedTopics(uuid, { limit })
					.then(concepts => !concepts ? [] : concepts)
		}
	}
});
