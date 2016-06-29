import pages from '../fixtures/pages';
import byConcept from '../fixtures/by-concept';
import searches from '../fixtures/searches';
import lists from '../fixtures/lists';
import content from '../fixtures/content/index'

import filterContent from '../helpers/filter-content';
import resolveContentType from '../helpers/resolve-content-type';

export default class {
	constructor (realBackend) {
		this.realBackend = realBackend;
	}

	page (uuid, sectionsId, ttl = 50) {
		const page = pages[uuid];

		return page ? Promise.resolve(page) : this.realBackend.page(uuid, ttl);
	}

	byConcept (uuid, ttl = 50) {
		const concept = byConcept[uuid].items;
		concept.title = pages[uuid].title;

		return concept ? Promise.resolve(concept) : this.realBackend.byConcept(uuid, ttl);
	}

	search (termName, termValue, opts, ttl = 50) {
		const search = searches[termValue];

		return search ? Promise.resolve(search) : this.realBackend.search(termName, termValue, opts, ttl);
	}

	list (uuid, opts) {
		const list = lists[uuid];

		return list ? Promise.resolve(list) : this.realBackend.list(uuid, opts);
	}

	// Content endpoints are not mocked because the responses are massive.

	content (uuids, opts) {
		const contentPromises = uuids.map(uuid =>
			content[uuid] ? Promise.resolve(content[uuid]) : this.realBackend.content(uuid, opts)
		);

		return Promise.all(contentPromises)
			.then(content => content
				.map(item => Array.isArray(item) ? item[0] : item)
				.filter(item => item)
			)
			.then(filterContent(opts, resolveContentType));
	}

	contentv2 (uuids, opts) {
		return this.realBackend.contentv2(uuids, opts);
	}
}
