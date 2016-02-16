import myftClient from 'next-myft-client';

import TopicCards from '../models/topic-cards';

class Myft {
	constructor() {
		this.type = 'myft';
	}

	getAllRelationship(uuid, relationship, model, args) {
		return myftClient.getAllRelationship('user', uuid, relationship, model, args)
			.then(res => res.items)
			.catch(() => [] );
	}

	personalisedFeed(uuid, { limit = 10 }) {
		return fetch(`https://ft-next-personalised-feed-api.herokuapp.com/v2/feed/${uuid}?originatingSignals=followed&from=-7d`, {
			headers: {
				'X-FT-Personalised-Feed-Api-Ke': process.env.PERSONALISED_FEED_API_KEY
			}
		})
			.then(res => res.json())
			.then(res =>
				(new TopicCards(res.results).process())
					.slice(0, limit)
					.map(card => card.term)
			)
			.catch(err => {
				console.log('#####');
			})
	}

	getViewed(uuid, { limit = 10 }) {
		// NOTE: not caching, as would get too diluted keying off the uuid
		return myftClient.fetchJson('GET', `next/popular-concepts/${uuid}`)
			.then(results =>
				results.viewed
					.filter(concept => concept)
					.slice(0, limit)
			);
	}
}

export default Myft;
