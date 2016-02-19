import {graphql} from 'graphql';
import {printSchema} from 'graphql/utilities';

import schema from './schema';
import logger from '@financial-times/n-logger';

const fetch = (flags = {}, isUserRequest, userUuid) => {
	return (query, vars) => {
		const then = new Date().getTime();

		return graphql(schema, query, { flags, isUserRequest, userUuid }, vars)
			.then(it => {
				const now = new Date().getTime();

				logger.info(`Graphql responded in ${now - then} ms`);

				if (it.errors) {
					throw it.errors;
				}

				if (it.data) {
					return it.data;
				}
			});
	};
};

export default (flags = {}, isUserRequest, userUuid) => ({
	fetch: fetch(flags, isUserRequest, userUuid),
	printSchema: () => printSchema(schema)
});
