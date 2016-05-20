import logger from '@financial-times/n-logger';
import myftClient from 'next-myft-client';

import TopicCards from '../models/topic-cards';

const nonEmpty = item => item;

// NOTE: not caching, as would get too diluted keying off the uuid
export default class {
	constructor () {
		this.type = 'myft';
	}

	getAllRelationship (uuid, relationship, model, args) {
		return myftClient.getAllRelationship('user', uuid, relationship, model, args)
			.then(res => res.items)
			.catch(err => {
				logger.error(err);
				return [];
			});
	}

	personalisedFeed (uuid, { limit = 10 }) {
		return fetch(`https://ft-next-personalised-feed-api.herokuapp.com/v2/feed/${uuid}?originatingSignals=followed&from=-7d`, {
			headers: {
				'X-FT-Personalised-Feed-Api-Key': process.env.PERSONALISED_FEED_API_KEY
			}
		})
			.then(res => res.json())
			.then(res =>
				(new TopicCards(res.results).process())
					.slice(0, limit)
					.map(card => card.term)
			)
			.catch(err => {
				logger.error(err);
				return [];
			});
	}

	getViewed (uuid, { limit = 10 }) {
		return myftClient.fetchJson('GET', `next/popular-concepts/${uuid}`)
			.then(results =>
				results.viewed
					.filter(nonEmpty)
					.slice(0, limit)
			)
			.catch(err => {
				logger.error(err);
				return [];
			});
	}

	getMostReadTopics ({ limit = 10 }) {
		return myftClient.fetchJson('GET', 'recommendation/most-read/concept', { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					logger.error(err);
					return [];
				});
	}

	getMostFollowedTopics ({ limit = 10 }) {
		return myftClient.fetchJson('GET', 'recommendation/most-followed/concept', { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					logger.error(err);
					return [];
				});
	}

	getRecommendedTopics (uuid, { limit = 10 }) {
		return myftClient.fetchJson('GET', `recommendation/user/${uuid}/concept`, { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					logger.error(err);
					return [];
				});
	}

}
