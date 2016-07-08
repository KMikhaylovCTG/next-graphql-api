import sliceList from '../helpers/slice-list';

export default class {
	constructor (cache) {
		this.type = 'video';
		this.cache = cache;
		this.videoFields = [
			'id', 'name', 'renditions', 'longDescription', 'publishedDate', 'videoStillURL'
		];
	}

	fetch (id, { from, limit, ttl = 60 * 10 }) {
		const cacheKey = `${this.type}.playlist.${id}`;
		const fetcher = () =>
			fetch(`http://next-video.ft.com/api/playlist/${encodeURI(id)}?videoFields=${this.videoFields.join(',')}`)
				.then(res => res.json())
				.then(json => json.items.filter(video => video.renditions.length > 0));

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(topics => sliceList(topics, { from, limit }));
	}
}
