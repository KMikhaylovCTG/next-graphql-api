import logger from '@financial-times/n-logger';
import httpStatus from 'http-status-codes';
import { GraphQLError } from 'graphql/error'

import graphql from '../lib/graphql';
import { HttpError } from '../lib/errors';

export default (req, res) => {
	const query = req.body.query || req.query.query || req.body;
	const vars = req.body.variables || JSON.parse(req.query.variables || '{}');

	if (!Object.keys(query).length) {
		const message = 'Empty query supplied';
		logger.warn(message);
		return res.status(400).jsonp({ type: 'Bad Request', error: { message } });
	}

	graphql({ flags: {
		mockData: req.get('FT-Graphql-Mock-Data') === '1' ? true : false,
		useVideoTopStoriesData: req.get('FT-Graphql-Video-Top-Stories-Data') === '1' ? true : false
	}, req })
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
