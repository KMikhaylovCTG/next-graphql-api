import ApiClient from 'next-ft-api-client';
import { captureError } from '@financial-times/n-raven';

// Polls for changes on the notification api to determine whether a fetch should
// be made for new content. Hopefully this is a little nicer to the content api
// polling it directly.

export default class {
	constructor (source) {
		this.type = 'capi';
		this.source = source;

		// in-memory content cache
		this.contentCache = [];
		this.since = new Date().toISOString();
		this.fetchFastFt();
		this.pollUpdates();
	}

	fetchFastFt () {
		const { idV1 } = this.source;
		return ApiClient.search({
				filter: { term: { 'metadata.idV1': idV1 } },
				// NOTE - hard-coded to a large number, not sure how to get the required amount in graphql-land
				count: 20
			})
			.then(items => this.contentCache = items)
			.catch(captureError);
	}

	pollUpdates () {
		this.poller = setInterval(() => {
			this.hasNewUpdates()
				.then(hasNewUpdates => {
					if (hasNewUpdates) {
						this.fetchFastFt();
						this.since = new Date().toISOString();
					}
				})
				.catch(captureError);
		}, 25 * 1000);
	}
	// Requests a list of notifications for FastFT to determine whether there are
	// any new items.
	hasNewUpdates () {
		const url = `http://api.ft.com/content/notifications?since=${this.since}&apiKey=${process.env.FAST_FT_KEY}`;
		return fetch(url)
			.then(res => res.json())
			.then(json => !!json.notifications.length)
			.catch(captureError);
	}

	// FIXME take uuid as an argument
	fetch () {
		return this.contentCache;
	}
}
