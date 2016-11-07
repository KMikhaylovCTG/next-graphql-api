const query = `
	query GraphQLSmoke {
		top(edition: UK) {
			lead: items(limit: 1, type: Article) {
				title
				url
			}
			liveBlogs: items(type: LiveBlog) {
				title
				url
			}
			items(from: 1, type: Article) {
				title
				url
			}
		}
		topStories(edition: UK) {
			layoutHint
			items(limit: 10) {
				title
				url
			}
		}
		fastFT(limit: 5) {
			title
			url
		}
		opinion {
			url
			items {
				title
				url
				branding {
					headshot
					taxonomy
				}
			}
		}
		popularTopics {
			name
			items(limit: 1) {
				title
				url
			}
		}
		editorsPicks {
			title
			items(limit: 6) {
				title
				url
			}
		}
		popularArticles {
			title
		}
		technology {
			url
			items(limit: 2, genres: ["analysis", "comment"]) {
				title
				url
			}
		}
		markets {
			url
			items(limit: 2, genres: ["analysis", "comment"]) {
				title
				url
			}
		}
		lifestyle {
			url
			items(limit: 2) {
				title
				url
			}
		}
		videos {
			id
			title
		}
	}
`;

const getTestUrls = {};
getTestUrls['/data?query=' + query] = 200;

module.exports = [
	{
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'X-API-KEY': process.env.GRAPHQL_API_KEY
		},
		method: 'POST',
		body: JSON.stringify({
			query: query
		}),
		timeout: 8000,
		urls: {
			'/data': 200
		}
	},
	{
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'X-API-KEY': process.env.GRAPHQL_API_KEY
		},
		method: 'GET',
		timeout: 8000,
		urls: getTestUrls
	}
];
