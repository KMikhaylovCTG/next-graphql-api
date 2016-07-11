import logger from '@financial-times/n-logger';

export default class {
	constructor (cache) {
		this.cache = cache;
	}

	parse (json, { limit } = { }) {
		const dated = json.filter(it => !!it.data.datemodified);
		const [first, second] = dated.slice(0, 2);

		// make sure updates are in order from latest to earliest
		if ((first && first.data.datemodified) < (second && second.data.datemodified)) {
			json.reverse();
		}

		// dedupe updates and only keep messages, decide on status
		let [, updates, status] = json.reduce(([skip, updates, status], event) => {
			if (event.event === 'end') { return [skip, updates, 'closed']; }

			if (event.event === 'msg' && event.data.mid && !skip[event.data.mid]) {
				updates.push(event);
				skip[event.data.mid] = true;
				status = status || 'inprogress';
			}

			return [skip, updates, status];
		}, [{}, [], null]);

		if (limit) {
			updates = updates.slice(0, limit);
		}

		status = status || 'comingsoon';
		return { updates, status };
	}

	fetch (uri, { limit, ttl = 60 } = { }) {
		const cacheKey = `liveblogs.${uri}:limit=${limit}`;
		const fetcher = () =>
			fetch(`${uri}?action=catchup&format=json`, { timeout: 3000 })
				.then(res => {
					if (res.ok) {
						return res.json()
					} else {
						return res.text()
							.then(text => {
								throw new Error(`Liveblog feed responded with "${text}" (${res.status})`);
							});
					}
				})
				.then(liveblog => this.parse(liveblog, { limit }))
				.catch(err => {
					logger.error('Failed fetching a liveblog', err);
					return { };
				});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}
}
