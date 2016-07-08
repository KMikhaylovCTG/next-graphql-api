import logger from '@financial-times/n-logger';

export default class {
	constructor (cache) {
		this.type = 'bertha';
		this.cache = cache;
	}

	get (key, name, { ttl = 60 * 10 } = { }) {
		const cacheKey = `${this.type}.sheet.${key}.${name}`;
		const fetcher = () =>
			fetch(
				`https://bertha.ig.ft.com/view/publish/gss/${key}/${name}`,
				{
					method: 'get',
					headers: { 'Content-Type': 'application/json' }
				}
			)
				.then(res => {
					if (res.ok) {
						return res.json()
					} else {
						return res.text(text => {
							throw new Error(`Bertha responded with "${text}" (${res.status}) sheet_key=${key} sheet_name=${name}`);
						});
					}
				})
				.catch(err => {
					logger.err('Failed getting a bertha sheet', err);
					return [];
				});

		return this.cache.cached(cacheKey, ttl, fetcher);
	}
}
