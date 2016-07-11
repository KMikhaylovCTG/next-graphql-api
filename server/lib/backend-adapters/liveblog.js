import logger from '@financial-times/n-logger';

const duplicateMessages = (message, index, messages) =>
	messages.findIndex(otherMessage => otherMessage.mid === message.mid) === index;

export default class {
	constructor (cache) {
		this.cache = cache;
	}

	parse (liveblog) {
		// pull out all the messages (and edit messages), and order by date
		const updates = liveblog
			.filter(message => ['msg', 'editmsg'].includes(message.event))
			.map(message => message.data)
			.sort((messageOne, messageTwo) => messageTwo.datemodified - messageOne.datemodified)
			.filter(duplicateMessages);
		let status = 'comingsoon';
		if (liveblog.findIndex(message => message.event === 'end') !== -1) {
			status = 'closed';
		} else if (updates.length) {
			status = 'inprogress';
		}

		return { updates, status };
	}

	fetch (uri, { limit, ttl = 60 } = { }) {
		const cacheKey = `liveblogs.${uri}`;
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
				.then(liveblog => this.parse(liveblog))
				.catch(err => {
					logger.error('Failed fetching a liveblog', err);
					return { };
				});

		return this.cache.cached(cacheKey, ttl, fetcher)
			.then(liveBlogInfo => ({
				status: liveBlogInfo.status,
				updates: limit ? liveBlogInfo.updates.slice(0, limit) : liveBlogInfo.updates
			}));
	}
}
