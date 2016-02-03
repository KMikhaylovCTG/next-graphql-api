import pages from '../fixtures/pages';
import byConcept from '../fixtures/by-concept';
import searches from '../fixtures/searches';
import lists from '../fixtures/lists';
import content from '../fixtures/content/index';

import { logger } from 'ft-next-express';

import filterContent from '../helpers/filter-content';
import resolveContentType from '../helpers/resolve-content-type';

class MockCAPI {
	constructor(realBackend) {
		this.realBackend = realBackend;
	}

	page(uuid, sectionsId, ttl = 50) {

		if(pages[uuid]) {
			return Promise.resolve(pages[uuid])
		}

		return this.realBackend.page(uuid, ttl)
		.then(it => {
			const resp = { title: it.title, items: it.slice() };
			logger.info(`Mock backend asked for a missing page: ${uuid}. Add this to pages.js to use current real response: \n'${uuid}': ${JSON.stringify(resp, null, 2)}`);

			return it;
		});
	}

	byConcept(uuid, ttl = 50) {
		let concept = byConcept[uuid].items;
		concept.title = pages[uuid].title;

		if(concept) {
			return Promise.resolve(concept);
		}

		return this.realBackend.byConcept(uuid, ttl)
		.then(it => {
			const resp = { title: it.title, items: it.slice() };

			logger.info(`Mock backend asked for a missing content by concept: ${uuid}. Add this to by-concept.js to use current real response: \n'${uuid}': ${JSON.stringify(resp, null, 2)}`);
			return it;
		});
	}

	search(termName, termValue, opts, ttl = 50) {
		const search = searches[termValue];

		if(search) { return Promise.resolve(search); }

		return this.realBackend.search(termName, termValue, opts, ttl)
		.then(it => {
			logger.info(`Mock backend asked for a search: '${termValue}'. Add this to searches.js to use current real response: \n'${termValue}': ${JSON.stringify(it, null, 2)}`);
			return it;
		});
	}

	list(uuid, opts) {
		let list = lists[uuid];
		if (list) {
			return Promise.resolve(list);
		}

		return this.realBackend.list(uuid, opts)
			.then(it => {
				logger.info(`Mock backend asked for a list: '${uuid}'. Add this to lists.js to use current real response: \n'${uuid}': ${JSON.stringify(it, null, 2)}`);
				return it;
			});
	}

	// Content endpoints are not mocked because the responses are massive.

	content(uuids, opts) {
		const contentPromises = uuids.map(uuid =>
			content[uuid] ? Promise.resolve(content[uuid]) : this.realBackend.content(uuid, opts)
			);
			return Promise.all(contentPromises)
			.then(content => content.map(item => Array.isArray(item) ? item[0] : item))
			.then(filterContent(opts, resolveContentType));
	}

	contentv2(uuids, opts) {
		return this.realBackend.contentv2(uuids, opts);
	}
}

export default MockCAPI;
