import { json as fetchresJson } from 'fetchres';

import { HttpError } from './errors';

export default (req, uuid) => {
	const apiKey = (req.headers && req.headers['x-api-key']) || (req.query && req.query.apiKey);
	if (apiKey) {
		if (apiKey === process.env.GRAPHQL_API_KEY) {
			return Promise.resolve(uuid)
		} else {
			return Promise.reject(new HttpError('Bad apiKey supplied', 401));
		}
	}
	if (req.cookies.FTSession) {
		const headers = req.headers;
		delete headers.host;
		delete headers['content-length']; //API urls send this and it breaks session fetch
		return fetch('https://session-next.ft.com/uuid', {
			timeout: 2000,
			headers: headers
		})
			.then(fetchresJson)
			.then(response => {
				if (!response.uuid) {
					throw new HttpError('No uuid returned from session endpoint', 500);
				}
				if (uuid && response.uuid !== uuid) {
					throw new HttpError(`Requested uuid does not match user\'s uuid=${uuid} users_uuid=${response.uuid}`, 401);
				}

				return response.uuid;
			})
			.catch(err => {
				throw new HttpError(`Session endpoint responded with error server_error_name=${err.name} server_error_message=${err.message}`, 500);
			});
	} else {
		return Promise.reject(new HttpError('Sign in to view user data', 401));
	}
};
