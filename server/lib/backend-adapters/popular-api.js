import logger from '@financial-times/n-logger';

import sliceList from '../helpers/slice-list';

export default class {
	constructor (cache) {
		this.type = 'popular-api';
		this.cache = cache;
		this.baseUrl = 'https://ft-next-popular-api-eu.herokuapp.com';
		this.apiKey = process.env.POPULAR_API_KEY;
	}

	topics ({ from, limit, ttl = 60 * 10 } = { }) {
		const cacheKey = `${this.type}.topics`;
		const fetcher = () =>
			fetch(`${this.baseUrl}/topics?apiKey=${this.apiKey}`, { timeout: 3000 })
				.then(res => {
					if (res.ok) {
						return res.json()
					} else {
						return res.text()
							.then(text => {
								throw new Error(`Popular api topics responded with "${text}" (${res.status})`);
							});
					}
				})
				.catch(err => {
					logger.error('Failed getting popular api topics', err);
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(topics => sliceList(topics, { from, limit }));
	}

	articles ({ from, limit, concept, ttl = 60 * 10 } = {}) {
		const cacheKey = `${this.type}.articles${concept ? `:concept=${concept}` : ''}`;
		const url = `${this.baseUrl}/articles?apiKey=${this.apiKey}${concept ? `&conceptid=${concept}` : ''}`;
		const fetcher = () =>
				fetch(url, { timeout: 3000 })
					.then(res => {
						if (res.ok) {
							return res.json()
						} else {
							return res.text()
								.then(text => {
									throw new Error(`Popular api responded with "${text}" (${res.status})`);
								});
						}
					})
					.then(json => (json.articles || []).map(article => article.uuid))
					.catch(err => {
						logger.error('Failed getting popular api articles', err);
						return [];
					});

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(articles => sliceList(articles, { from, limit }));
	}
}
