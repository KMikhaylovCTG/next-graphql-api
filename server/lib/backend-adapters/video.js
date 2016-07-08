import logger from '@financial-times/n-logger';

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
				.then(res => {
					if (res.ok) {
						return res.json()
					} else {
						return res.text(text => {
							throw new Error(`Video api responded with "${text}" (${res.status})`);
						});
					}
				})
				.then(({ items: videos }) => videos.filter(video => video.renditions.length > 0))
				.catch(err => {
					logger.error('Failed fetching video playlist', err, { playlist: id });
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(topics => sliceList(topics, { from, limit }));
	}
}
