const playlistId = '69917354001';

export default {
	name: 'APIs',
	description : 'External APIs used by the GraphQL service',
	checks : [
		{
			name: 'Next Video Playlist',
			severity: 2,
			businessImpact: 'API may not be able to serve video data',
			technicalSummary: 'Tries to query the Next Video service playlist endpoint',
			panicGuide: 'https://github.com/Financial-Times/next-brightcove-proxy-api',
			type: 'json',
			url: `https://next-video.ft.com/api/playlist/${playlistId}`,
			callback: playlist => playlist.items && playlist.items.length,
			checkResult : {
				PASSED: 'Successful response from the playlist endpoint',
				FAILED : 'Bad response from the playlist endpoint',
				PENDING : 'This test has not yet run'
			}
		},
		{
			name: 'Popular Topics',
			severity: 2,
			businessImpact: 'API may not be able to serve popular topics',
			technicalSummary: 'Tries to fetch popular topics from the Popular API',
			panicGuide: 'https://github.com/Financial-Times/next-popular-api',
			type: 'json',
			url: `https://ft-next-popular-api-eu.herokuapp.com/topics?apiKey=${process.env.POPULAR_API_KEY}`,
			callback: popularTopics => popularTopics.length,
			checkResult : {
				PASSED: 'Successful response from the Popular API',
				FAILED : 'Bad response from the Popular API',
				PENDING : 'This test has not yet run'
			}
		},
		{
			name: 'Popular Articles',
			severity: 2,
			businessImpact: 'API may not be able to serve popular articles',
			technicalSummary: 'Tries to fetch popular articles from the Popular API',
			panicGuide: 'https://github.com/Financial-Times/next-popular-api',
			type: 'json',
			url: `https://ft-next-popular-api-eu.herokuapp.com/articles?apiKey=${process.env.POPULAR_API_KEY}`,
			callback: popularArticles => popularArticles.articles && popularArticles.articles.length,
			checkResult : {
				PASSED: 'Successful response from the Most Popular API',
				FAILED : 'Bad response from the Most Popular API',
				PENDING : 'This test has not yet run'
			}
		},
		{
			name: 'Live Blog',
			severity: 2,
			businessImpact: 'API may not be able to serve live blog articles',
			technicalSummary: 'Tries to fetch live blog data',
			panicGuide: 'Don\'t panic',
			type: 'json',
			url: 'http://ftalphaville.ft.com/marketslive/2015-07-30?action=catchup&format=json',
			callback: liveBlogs => liveBlogs.filter(liveBlog => liveBlog.event === 'msg').length,
			checkResult : {
				PASSED: 'Successful response from the live blog endpoint',
				FAILED : 'Bad response from the live blog endpoint',
				PENDING : 'This test has not yet run'
			}
		},
		{
			name: 'Notifications',
			severity: 2,
			businessImpact: 'API may not know when new articles are created',
			technicalSummary: 'Tries to fetch notifications for fastFt',
			panicGuide: 'Don\'t panic',
			type: 'json',
			url: `http://api.ft.com/content/notifications?since=${new Date().toISOString()}&apiKey=${process.env.FAST_FT_KEY}`,
			callback: notifications => notifications.notifications,
			checkResult : {
				PASSED: 'Successful response from the notifications endpoint',
				FAILED : 'Bad response from the notifications endpoint',
				PENDING : 'This test has not yet run'
			}
		}
	]
}
