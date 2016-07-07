import liveblogs from '../fixtures/liveblogs';

export default class {
	constructor (realBackend) {
		this.realBackend = realBackend;
	}

	fetch (uri, { limit, ttl = 50 } = { }) {
		const liveblog = liveblogs[uri];

		return liveblog ?
			Promise.resolve(liveblog).then(json => this.realBackend.parse(json, limit)) :
			this.realBackend.fetch(uri, ttl);
	}
}
