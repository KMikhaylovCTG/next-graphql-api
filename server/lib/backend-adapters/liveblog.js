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
		return {updates, status};
	}

	fetch (uri, { limit, ttl = 60 } = { }) {
		const cacheKey = `liveblogs.${uri}:limit=${limit}`;
		const fetcher = () =>
			fetch(`${uri}?action=catchup&format=json`)
				.then(res => res.json())
				.then(json => this.parse(json, { limit }));

		return this.cache.cached(cacheKey, ttl, fetcher);
	}
}
