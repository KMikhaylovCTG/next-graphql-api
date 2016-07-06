import logger from '@financial-times/n-logger';

export default class {
	constructor (cache) {
		this.cache = cache;
	}

	parse (json, limit) {
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

	fetch (uri, opts, ttl = 60) {
		const then = new Date();

		return this.cache.cached(`liveblogs.${uri}`, ttl, () =>
				fetch(`${uri}?action=catchup&format=json`)
					.then(res => {
						const now = new Date();
						logger.info(`Fetching live blog updates from ${uri}?action=catchup&format=json took ${now - then} ms`);
						return res;
					})
					.then(res => res.json())
			)
			.then(json => this.parse(json, opts.limit));
	}
}
