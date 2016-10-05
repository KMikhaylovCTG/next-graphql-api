const logger = require('@financial-times/n-logger').default;
const HttpError = require('./errors').HttpError;
const Decoder = require('@financial-times/session-decoder-js');

const decoder = new Decoder(process.env.SESSION_PUBLIC_KEY);

module.exports = (req, uuid) => {
	const apiKey = (req.headers && req.headers['x-api-key']) || (req.query && req.query.apiKey);

	if (apiKey) {
		if (apiKey === process.env.GRAPHQL_API_KEY) {
			return Promise.resolve(uuid)
		} else {
			return Promise.reject(new HttpError('Bad apiKey supplied', 401));
		}
	}

	const sessionToken = req.cookies['FTSession'];

	if (sessionToken) {
		return Promise.resolve()
			.then(() => ({ uuid: decoder.decode(sessionToken) }))
			.then((response) => {
				if (!response.uuid) {
					throw new HttpError('No uuid returned from session endpoint', 500);
				}
				if (uuid && response.uuid !== uuid) {
					throw new HttpError(`Requested uuid does not match user\'s uuid=${uuid} users_uuid=${response.uuid}`, 401);
				}

				return response.uuid;
			})
			.catch(err => {
				logger.error('event=GRAPHQL_FAILED_USER_AUTH', typeof err === 'string' ? {
					err: err
				} : err);
				throw new HttpError(`Session endpoint responded with error server_error_name=${err.name} server_error_message=${err.message} ft_session=${req.cookies.FTSession}`, 500);
			});
	} else {
		return Promise.reject(new HttpError('Sign in to view user data', 401));
	}
};
