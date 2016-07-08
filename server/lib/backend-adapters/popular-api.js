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
			fetch(`${this.baseUrl}/topics?apiKey=${this.apiKey}`).then(response => response.json());

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(topics => sliceList(topics, { from, limit }));
	}

	articles ({ from, limit, concept, ttl = 60 * 10 } = {}) {
		const cacheKey = `${this.type}.articles${concept ? `:concept=${concept}` : ''}`;
		const url = `${this.baseUrl}/articles?apiKey=${this.apiKey}${concept ? `&conceptid=${concept}` : ''}`;
		const fetcher = () =>
				fetch(url)
					.then(response => response.json())
					.then(json => (json.articles || []).map(article => article.uuid));

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(articles => sliceList(articles, { from, limit }));
	}
}
