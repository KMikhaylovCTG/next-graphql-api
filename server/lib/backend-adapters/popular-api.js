import sliceList from '../helpers/slice-list';

export default class {
	constructor (cache) {
		this.cache = cache;
		this.baseUrl = 'https://ft-next-popular-api.herokuapp.com';
		this.apiKey = process.env.POPULAR_API_KEY;
	}

	topics ({ from, limit } = {}, ttl = 60 * 10) {
		const url = `${this.baseUrl}/topics?apiKey=${this.apiKey}`;

		return this.cache.cached('popular-api.topics', ttl, () =>
				fetch(url).then(response => response.json())
			)
			.then(topics => sliceList(topics, { from, limit }));
	}

	articles ({ from, limit, concept } = {}, ttl = 60 * 10) {
		const conceptQueryParam = concept ? `concept=${concept}&` : '';
		const url = `${this.baseUrl}/articles?${conceptQueryParam}apiKey=${this.apiKey}`;
		const cacheProperty = concept || 'all';

		return this.cache.cached(`popular-api.articles.${cacheProperty}`, ttl, () =>
				fetch(url)
					.then(response => response.json())
					.then(json => (json.articles || []).map(article => article.uuid))
			)
			.then(articles => sliceList(articles, { from, limit }));
	}
}
