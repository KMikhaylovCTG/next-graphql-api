import logger from '@financial-times/n-logger';
import httpStatus from 'http-status-codes';
import { GraphQLError } from 'graphql/error'

import graphql from '../lib/graphql';
import { HttpError } from '../lib/errors';

export default (req, res) => {
	const flags = res.locals.flags;
	const query = req.body.query || req.query.query || req.body;
	const vars = JSON.parse(req.body.variables || '{}');

	if (!Object.keys(query).length) {
		const message = 'Empty query supplied';
		const errorInfo = {
			host: req.host,
			method: req.method
		};
		logger.warn(message, errorInfo);
		return res.status(400).jsonp(Object.assign({ type: 'Bad Request', error: { message } }, errorInfo));
	}

	graphql({ flags, req })
		.fetch(query, vars)
		.then(data => res.jsonp(data))
		.catch(errs => {
			const err = Array.isArray(errs) ? errs.shift() : errs;
			const error = err instanceof GraphQLError && err.originalError ? err.originalError : err;
			const status = error instanceof HttpError ? error.status : 500;
			logger.error(error);

			return res.status(status).jsonp({
				type: httpStatus.getStatusText(status),
				error: { message: error.message }
			});
		});
};
