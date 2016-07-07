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
				.then(sheet => sheet.json());

		return this.cache.cached(cacheKey, ttl, fetcher);
	}
}
