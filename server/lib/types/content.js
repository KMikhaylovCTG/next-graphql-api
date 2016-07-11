import * as graphql from 'graphql';
import articleGenres from 'ft-next-article-genre';
import articleBranding from 'ft-n-article-branding';

import capifyMetadata from '../helpers/capify-metadata';
import backendReal from '../backend-adapters/index';
import { LiveBlogStatus, ContentType } from './basic';

const podcastIdV1 = 'NjI2MWZlMTEtMTE2NS00ZmI0LWFkMzMtNDhiYjA3YjcxYzIy-U2VjdGlvbnM=';

const propertyEquals = (property, value) => (item) => item[property] === value;

// TODO: rather hacky way of getting the headshot url from ft-n-article-branding
const getAuthorHeadshot = (id, name) => {
	const metadata = [
		{
			taxonomy: 'authors',
			idV1: id,
			prefLabel: name,
			attributes: []
		},
		{
			taxonomy: 'genre',
			prefLabel: 'Comment'
		}
	];
	return articleBranding(metadata).headshot;
};

const Content = new graphql.GraphQLInterfaceType({
	name: 'Content',
	description: 'A piece of FT content',
	resolveType: content => /liveblog|marketslive|liveqa/i.test(content.webUrl) ? LiveBlog : Article,
	fields: () => ({
		id: {
			type: graphql.GraphQLID
		},
		contentType: {
			type: ContentType
		},
		title: {
			type: graphql.GraphQLString
		},
		url: {
			type: graphql.GraphQLString
		},
		genre: {
			type: graphql.GraphQLString
		},
		branding: {
			type: Concept
		},
		summary: {
			type: graphql.GraphQLString
		},
		tags: {
			type: new graphql.GraphQLList(Concept),
			args: {
				only: {
					type: new graphql.GraphQLList(graphql.GraphQLString),
					description: 'Only return tags which match one of these taxonomies'
				},
				not: {
					type: new graphql.GraphQLList(graphql.GraphQLString),
					description: 'Don\'t return tags which match one of these taxonomies'
				}
			}
		},
		primaryTag: {
			type: Concept
		},
		primaryTheme: {
			type: Concept
		},
		primarySection: {
			type: Concept
		},
		primaryImage: {
			type: Image
		},
		published: {
			type: graphql.GraphQLString
		},
		lastPublished: {
			type: graphql.GraphQLString
		},
		relatedContent: {
			type: new graphql.GraphQLList(Content),
			args: {
				from: {
					type: graphql.GraphQLInt
				},
				limit: {
					type: graphql.GraphQLInt
				}
			}
		},
		authors: {
			type: new graphql.GraphQLList(Author)
		},
		isEditorsChoice: {
			type: graphql.GraphQLBoolean
		},
		isExclusive: {
			type: graphql.GraphQLBoolean
		},
		isScoop: {
			type: graphql.GraphQLBoolean
		}
	})
});

const getContentFields = () => ({
	id: {
		type: graphql.GraphQLID
	},
	title: {
		type: graphql.GraphQLString
	},
	url: {
		type: graphql.GraphQLString
	},
	genre: {
		type: graphql.GraphQLString,
		resolve: content => articleGenres(capifyMetadata(content.metadata))
	},
	branding: {
		type: Concept,
		resolve: content => articleBranding(content.metadata.slice())
	},
	summary: {
		type: graphql.GraphQLString,
		resolve: content => (content.summaries && content.summaries.length) ? content.summaries[0] : null
	},
	tags: {
		type: new graphql.GraphQLList(Concept),
		args: {
			only: {
				type: new graphql.GraphQLList(graphql.GraphQLString),
				description: 'Only return tags which match one of these taxonomies'
			},
			not: {
				type: new graphql.GraphQLList(graphql.GraphQLString),
				description: 'Don\'t return tags which match one of these taxonomies'
			}
		},
		resolve: (content, { only, not = [] }) => {
			const tags = (only && only.length) ?
				content.metadata.filter(tag => only.includes(tag.taxonomy)) : content.metadata;
			return not.length ? tags.filter(tag => !not.includes(tag.taxonomy)) : tags;
		}
	},
	primaryTag: {
		type: Concept,
		resolve: content => {
			const primaryTheme = content.metadata.find(propertyEquals('primary', 'theme'));
			const primarySection = content.metadata.find(propertyEquals('primary', 'section'));
			return primaryTheme || primarySection;
		}
	},
	primaryTheme: {
		type: Concept,
		resolve: content => content.metadata.find(propertyEquals('primary', 'theme'))
	},
	primarySection: {
		type: Concept,
		resolve: content => content.metadata.find(propertyEquals('primary', 'section'))
	},
	primaryImage: {
		type: Image,
		resolve: content => content.mainImage
	},
	published: {
		type: graphql.GraphQLString,
		resolve: content => content.initialPublishedDate
	},
	lastPublished: {
		type: graphql.GraphQLString,
		resolve: content => content.publishedDate
	},
	relatedContent: {
		type: new graphql.GraphQLList(Content),
		args: {
			from: {
				type: graphql.GraphQLInt
			},
			limit: {
				type: graphql.GraphQLInt
			}
		},
		resolve: (content, { from, limit }, { rootValue: { flags, backend = backendReal }}) => {
			const storyPackageIds = (content.storyPackage || []).map(story => story.id);
			return storyPackageIds.length ? backend(flags).capi.content(storyPackageIds, { from, limit }) : [];
		}
	},
	authors: {
		type: new graphql.GraphQLList(Author),
		resolve: content =>
			content.metadata
				.filter(propertyEquals('taxonomy', 'authors'))
				.map(author => ({
					id: author.idV1,
					name: author.prefLabel,
					headshot: getAuthorHeadshot(author.idV1, author.prefLabel),
					isBrand: author.primary === 'brand',
					url: `/stream/authorsId/${author.idV1}`
				}))
	},
	isEditorsChoice: {
		type: graphql.GraphQLBoolean,
		resolve: content => content.standout && content.standout.editorsChoice
	},
	isExclusive: {
		type: graphql.GraphQLBoolean,
		resolve: content => content.standout && content.standout.exclusive
	},
	isScoop: {
		type: graphql.GraphQLBoolean,
		resolve: content => content.standout && content.standout.scoop
	}
});

const Article = new graphql.GraphQLObjectType({
	name: 'Article',
	description: 'Content item',
	interfaces: [Content],
	fields: () => Object.assign(getContentFields(), {
		contentType: {
			type: ContentType,
			description: 'Type of content',
			resolve: () => 'article'
		},
		isPodcast: {
			type: graphql.GraphQLBoolean,
			resolve: content => content.metadata.some(propertyEquals('idV1', podcastIdV1))
		}
	})
});

const LiveBlog = new graphql.GraphQLObjectType({
	name: 'LiveBlog',
	description: 'Live blog item',
	interfaces: [Content],
	fields: () => Object.assign(getContentFields(), {
		contentType: {
			type: ContentType,
			description: 'Type of content',
			resolve: () => 'liveblog'
		},
		status: {
			type: LiveBlogStatus,
			resolve: (content, _, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).liveblog.fetch(content.webUrl)
					.then(extras => extras.status)
		},
		updates: {
			type: new graphql.GraphQLList(LiveBlogUpdate),
			args: {
				limit: {
					type: graphql.GraphQLInt
				}
			},
			resolve: (content, { limit }, { rootValue: { flags, backend = backendReal }}) =>
				backend(flags).liveblog.fetch(content.webUrl, { limit })
					.then(extras => extras.updates)
		}
	})
});

const Concept = new graphql.GraphQLObjectType({
	name: 'Concept',
	description: 'Metadata tag describing a person/region/brand/...',
	fields: () => ({
		id: {
			type: graphql.GraphQLID,
			description: 'Concept id',
			resolve: concept => concept.id || concept.idV1 || concept.uuid
		},
		taxonomy: {
			type: graphql.GraphQLString,
			description: 'Type of the concept'
		},
		name: {
			type: graphql.GraphQLString,
			description: 'Name of the concept',
			resolve: concept => concept.name || concept.prefLabel
		},
		url: {
			type: graphql.GraphQLString,
			description: 'Stream URL for the concept',
			resolve: concept => `/stream/${concept.taxonomy}Id/${concept.id || concept.idV1 || concept.uuid}`
		},
		attributes: {
			type: new graphql.GraphQLList(ConceptAttributes)
		},
		headshot: {
			type: graphql.GraphQLString
		},
		articleCount: {
			type: graphql.GraphQLInt,
			description: 'Approximate number of articles published with this concept',
			args: {
				since: {
					type: graphql.GraphQLString
				},
				genres: {
					type: new graphql.GraphQLList(graphql.GraphQLString)
				},
				type: {
					type: ContentType
				}
			},
			resolve: (concept, { since, genres, type }, { rootValue: { flags, backend = backendReal }}) => {
				const id = concept.id || concept.idV1 || concept.uuid;
				return backend(flags).capi.searchCount('metadata.idV1', id, { since, genres, type });
			}
		},
		items: {
			type: new graphql.GraphQLList(Content),
			description: 'Latest articles published with this concept',
			args: {
				from: {
					type: graphql.GraphQLInt
				},
				limit: {
					type: graphql.GraphQLInt
				},
				since: {
					type: graphql.GraphQLString
				},
				genres: {
					type: new graphql.GraphQLList(graphql.GraphQLString)
				},
				type: {
					type: ContentType
				}
			},
			resolve: (concept, { from, limit, since, genres, type }, { rootValue: { flags, backend = backendReal }}) => {
				const id = concept.id || concept.idV1 || concept.uuid;
				return backend(flags).capi.search('metadata.idV1', id, { from, limit, since, genres, type });
			}
		}
	})
});

const ConceptAttributes = new graphql.GraphQLObjectType({
	name: 'ConceptAttributes',
	description: 'Attribtues of a tag',
	fields: () => ({
		key: {
			type: graphql.GraphQLString
		},
		value: {
			type: graphql.GraphQLString
		}
	})
});

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
				`//next-geebee.ft.com/image/v1/images/raw/${image.url}?source=next&fit=scale-down&width=${width}`
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

const LiveBlogUpdate = new graphql.GraphQLObjectType({
	name: 'LiveBlogUpdate',
	description: 'Update of a live blog',
	fields: () => ({
		event: {
			type: graphql.GraphQLString
		},
		author: {
			type: graphql.GraphQLString,
			resolve: update => update.authordisplayname
		},
		date: {
			type: graphql.GraphQLString,
			resolve: update => new Date(update.datemodified * 1000).toISOString()
		},
		text: {
			type: graphql.GraphQLString
		},
		html: {
			type: graphql.GraphQLString
		}
	})
});

const Video = new graphql.GraphQLObjectType({
	name: 'Video',
	description: 'A Video',
	fields: () => ({
		id: {
			type: graphql.GraphQLID
		},
		title: {
			type: graphql.GraphQLString,
			resolve: video => video.name
		},
		description: {
			type: graphql.GraphQLString,
			resolve: video => video.longDescription
		},
		lastPublished: {
			type: graphql.GraphQLString,
			resolve: video => video.publishedDate
		},
		image: {
			type: Image,
			resolve: video => ({
				url: video.videoStillURL,
				alt: video.name
			})
		},
		renditions: {
			type: new graphql.GraphQLList(Rendition)
		}
	})
});

const Rendition = new graphql.GraphQLObjectType({
	name: 'Rendition',
	description: 'A Video\'s rendition',
	fields: () => ({
		id: {
			type: graphql.GraphQLID
		},
		url: {
			type: graphql.GraphQLString
		},
		frameWidth: {
			type: graphql.GraphQLInt
		},
		frameHeight: {
			type: graphql.GraphQLInt
		},
		videoCodec: {
			type: graphql.GraphQLString
		}
	})
});

const Author = new graphql.GraphQLObjectType({
	name: 'Author',
	fields: () => ({
		id: {
			type: graphql.GraphQLID
		},
		name: {
			type: graphql.GraphQLString
		},
		headshot: {
			type: graphql.GraphQLString
		},
		isBrand: {
			type: graphql.GraphQLBoolean
		},
		url: {
			type: graphql.GraphQLString
		}
	})
});

export { Content, Concept, Video };
