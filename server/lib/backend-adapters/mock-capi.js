import pages from '../fixtures/pages';
import searches from '../fixtures/searches';
import lists from '../fixtures/lists';
import content from '../fixtures/content/index'

import filterContent from '../helpers/filter-content';
import resolveContentType from '../helpers/resolve-content-type';

export default class {
	constructor (realBackend) {
		this.realBackend = realBackend;
	}

	page (uuid, { ttl = 50 } = { }) {
		const page = pages[uuid];

		return page ? Promise.resolve(page) : this.realBackend.page(uuid, ttl);
	}

	search (termName, termValue, { from, limit, since, genres, type, ttl = 60 * 10 } = {}) {
		const search = searches[termValue];

		return search ?
			Promise.resolve(search) :
			this.realBackend.search(termName, termValue, { from, limit, since, genres, type, ttl });
	}

	// Content endpoints are not mocked because the responses are massive.
	content (uuids, { from, limit, genres, type, ttl = 60 } = { }) {
		const contentPromises = uuids.map(uuid =>
			content[uuid] ?
				Promise.resolve(content[uuid]) : this.realBackend.content(uuid, { from, limit, genres, type, ttl })
		);

		return Promise.all(contentPromises)
			.then(content => content
				.map(item => Array.isArray(item) ? item[0] : item)
				.filter(item => item)
			)
			.then(filterContent(opts, resolveContentType));
	}

	list (uuid, { ttl = 60 } = { }) {
		const list = lists[uuid];

		return list ? Promise.resolve(list) : this.realBackend.list(uuid, { ttl });
	}
}
