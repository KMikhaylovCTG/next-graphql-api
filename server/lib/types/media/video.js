import * as graphql from 'graphql';
import Image from './image';

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
		summary: {
			type: graphql.GraphQLString,
			resolve: video => video.shortDescription
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
		},
		brand: {
			type: graphql.GraphQLString,
			resolve: video => {
				let tags = video.tags || [];
				let brandRegex = /brand:/i;
				for(let tag of tags){
					if(brandRegex.test(tag)){
						return tag.replace(brandRegex, '');
					}
				}

				return '';
			}
		},
		duration: {
			type: graphql.GraphQLString,
			resolve: video => {
				let lengthInSeconds = Math.round(video.length / 1000);
				let minutes = Math.round(lengthInSeconds / 60);
				let seconds = (lengthInSeconds - (minutes * 60));
				if(seconds < 0){
					seconds = 0;
				}
				seconds = seconds.toString();
				let paddedSeconds = seconds.length === 2 ? seconds : '0'+seconds;
				return `${minutes}:${paddedSeconds}`;
			}
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

export default Video;
