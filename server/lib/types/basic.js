import { GraphQLEnumType } from 'graphql';

const Edition = new GraphQLEnumType({
	name: 'Edition',
	description: 'Edition with specific content',
	values: {
		UK: {
			value: 'uk',
			description: 'United Kingdom'
		},
		INTL: {
			value: 'intl',
			description: 'International'
		}
	}
});

const Region = new GraphQLEnumType({
	name: 'Region',
	description: 'Region with specific content',
	values: {
		UK: {
			value: 'uk',
			description: 'United Kingdom'
		},
		US: {
			value: 'us',
			description: 'United States of America'
		},
		EU: {
			value: 'eu',
			description: 'Europe'
		},
		AS: {
			value: 'as',
			description: 'Asia Pacific'
		}
	}
});

const ContentType = new GraphQLEnumType({
	name: 'ContentType',
	description: 'Story type, e.g. article, live blog, video, infographic, etc.',
	values: {
		Article: {
			value: 'article',
			description: 'Basic article'
		},
		LiveBlog: {
			value: 'liveblog',
			description: 'LiveBlog with updates'
		},
		Video: {
			value: 'video',
			description: 'Video content'
		}
	}
});

const LiveBlogStatus = new GraphQLEnumType({
	name: 'LiveBlogStatus',
	description: 'State of the live blog, i.e. coming soon / in progress / closed',
	values: {
		ComingSoon: {
			value: 'comingsoon',
			description: 'Live blog will start, there are no updates'
		},
		InProgress: {
			value: 'inprogress',
			description: 'LiveBlog is currently being updated'
		},
		Closed: {
			value: 'closed',
			description: 'LiveBlog is over'
		}
	}
});

export { Edition, Region, ContentType, LiveBlogStatus };
