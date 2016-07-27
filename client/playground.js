import 'isomorphic-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';

const fetcher = (apiKey, { query, variables }) => {
	const body = { query, variables: JSON.parse(variables || '{}') };
	console.log('GraphiQL submitted', body);

	return fetch(`/data?apiKey=${apiKey}`, {
			method: 'post',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
		.then(response => response.json())
		.then(data => ({ data }))
};

export default (el, apiKey) => ReactDOM.render(<GraphiQL fetcher={fetcher.bind(null, apiKey)} />, el);
