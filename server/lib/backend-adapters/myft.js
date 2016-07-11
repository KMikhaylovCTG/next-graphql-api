import logger from '@financial-times/n-logger';
import myftClient from 'next-myft-client';

import TopicCards from '../models/topic-cards';

const nonEmpty = item => item;

export default class {
	constructor (cache) {
		this.type = 'myft';
		this.cache = cache;
	}

	personalisedFeed (uuid, { limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.personalised-feed.${uuid}`;
		const fetcher = () => fetch(
			`https://ft-next-personalised-feed-api.herokuapp.com/v2/feed/${uuid}?originatingSignals=followed&from=-7d`,
			{
				headers: {
					'X-FT-Personalised-Feed-Api-Key': process.env.PERSONALISED_FEED_API_KEY
				}
			})
			.then(res => {
				if (res.ok) {
					return res.json()
						.then(res => res.results);
				} else {
					return res.text()
						.then(text => {
							throw new Error(`Personalised feed responded with "${text}" (${res.status})`);
						});
				}
			})
			.catch(err => {
				logger.error('Failed getting personalised feed from myFT', err, { uuid });
				return [];
			});

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(articles =>
				(new TopicCards(articles).process())
					.slice(0, limit)
					.map(card => card.term)
			);
	}

	getAllRelationship (uuid, relationship, model, { limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.all-relationship.${uuid}:relationship=${relationship}:model=${model}:limit=${limit}`;
		const fetcher = () =>
			myftClient.getAllRelationship('user', uuid, relationship, model, { limit })
				.then(res => res.items)
				.catch(err => {
					logger.error('Failed getting all relationships from myFT', err, { uuid, relationship, model });
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

	getViewed (uuid, { limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.viewed.${uuid}:limit=${limit}`;
		const fetcher = () =>
			myftClient.fetchJson('GET', `next/popular-concepts/${uuid}`)
				.then(results =>
					results.viewed
						.filter(nonEmpty)
						.slice(0, limit)
				)
				.catch(err => {
					logger.error('Failed getting viewed from myFT', err, { uuid });
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

	getMostReadTopics ({ limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.most-read-topics:limit=${limit}`;
		const fetcher = () => {
			return myftClient.fetchJson('GET', 'recommendation/most-read/concept', { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					logger.error('Failed getting most read topics from myFT', err);
					return [];
				});
		};

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

	getMostFollowedTopics ({ limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.most-followed-topics:limit=${limit}`;
		const fetcher = () =>
			myftClient.fetchJson('GET', 'recommendation/most-followed/concept', { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					logger.error('Failed getting most followed topics from myFT', err);
					logger.error(err);
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

	getRecommendedTopics (uuid, { limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.recommended-topics.${uuid}:limit=${limit}`;
		const fetcher = () =>
			myftClient.fetchJson('GET', `recommendation/user/${uuid}/concept`, { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					logger.error('Failed getting recommended topics from myFT', err, { uuid });
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}

}
