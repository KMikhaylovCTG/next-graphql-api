import logger from '@financial-times/n-logger';
import myftClient from 'next-myft-client';

const nonEmpty = item => item;

export default class {
	constructor (cache) {
		this.type = 'myft';
		this.cache = cache;
	}

	getAllRelationship (uuid, relationship, model, { limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.all-relationship.${uuid}:relationship=${relationship}:model=${model}:limit=${limit}`;
		const fetcher = () =>
			myftClient.getAllRelationship('user', uuid, relationship, model, { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					// don't log if it's just a 'no user data' error
					if (err.message !== 'No user data exists') {
						logger.error('Failed getting all relationships from myFT', err, { uuid, relationship, model });
					}
					throw err;
				});

		// NOTE: emulate a 0 sec cache, as setex doesn't allow a zero value
		if (ttl === 0) {
			return fetcher()
				.catch(() => [])
		} else {
			return this.cache.cached(cacheKey, ttl, fetcher)
				.then((relationships = []) => relationships)
		}
	}

	getViewed (uuid, { limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.viewed.${uuid}:limit=${limit}`;
		const fetcher = () =>
			myftClient.fetchJson('GET', `next/popular-concepts/${uuid}`, { limit })
				.then(results => results.viewed.filter(nonEmpty))
				.catch(err => {
					logger.error('Failed getting viewed from myFT', err, { uuid });
					throw err;
				});

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then((viewed = []) => viewed);
	}

	getRecommendedTopics (uuid, { limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.recommended-topics.${uuid}:limit=${limit}`;
		const fetcher = () =>
			myftClient.fetchJson('GET', `recommendation/user/${uuid}/concept`, { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					// don't log if it's just a 'no user data' error
					if (err.message !== 'No user data exists') {
						logger.error('Failed getting recommended topics from myFT', err, { uuid });
					}
					throw err;
				});

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then((topics = []) => topics)
	}

	getMostReadTopics ({ limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.most-read-topics:limit=${limit}`;
		const fetcher = () => {
			return myftClient.fetchJson('GET', 'recommendation/most-read/concept', { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					logger.error('Failed getting most read topics from myFT', err);
					throw err;
				});
		};

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then((topics = []) => topics);
	}

	getMostFollowedTopics ({ limit = 10, ttl = 60 }) {
		const cacheKey = `${this.type}.most-followed-topics:limit=${limit}`;
		const fetcher = () =>
			myftClient.fetchJson('GET', 'recommendation/most-followed/concept', { limit })
				.then(results => results.items.filter(nonEmpty))
				.catch(err => {
					logger.error('Failed getting most followed topics from myFT', err);
					throw err;
				});

		return this.cache.cached(cacheKey, ttl, fetcher)
		.then((topics = []) => topics);
	}
}
