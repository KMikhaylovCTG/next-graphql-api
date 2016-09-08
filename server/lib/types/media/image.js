import * as graphql from 'graphql';

const Image = new graphql.GraphQLObjectType({
	name: 'Image',
	description: 'An image',
	fields: () => ({
		src: {
			type: graphql.GraphQLString,
			description: 'Source URL of the image',
			args: {
				width: {
					type: new graphql.GraphQLNonNull(graphql.GraphQLInt)
				}
			},
			resolve: (image, { width }) =>
				`//next-geebee.ft.com/image/v1/images/raw/${encodeURIComponent(image.url)}?source=next&fit=scale-down&width=${width}`
		},
		rawSrc: {
			type: graphql.GraphQLString,
			description: 'Original source URL of the image',
			resolve: image => image.url
		},
		alt: {
			type: graphql.GraphQLString,
			description: 'Alternative text',
			resolve: image => image.description
		}
	})
});

export default Image;
