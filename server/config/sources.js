const sources = {
	ukTop: {
		uuid: '4c499f12-4e94-11de-8d4c-00144feabdc0'
	},
	usTop: {
		uuid: 'b0ed86f4-4e94-11de-8d4c-00144feabdc0'
	},
	ukTopList: {
		uuid: '520ddb76-e43d-11e4-9e89-00144feab7de'
	},
	usTopList: {
		uuid: 'b0d8e4fe-10ff-11e5-8413-00144feabdc0'
	},
	fastFt: {
		uuid: '5c7592a8-1f0c-11e4-b0cb-b2227cce2b54',
		idV1: 'NTlhNzEyMzMtZjBjZi00Y2U1LTg0ODUtZWVjNmEyYmU1NzQ2-QnJhbmRz'
	},
	opinion: {
		url: '/comment',
		type: 'list',
		uuid: 'bc81b5bc-1995-11e5-a130-2e7db721f996'
	},
	markets: {
		url: '/markets',
		genres: ['analysis', 'comment'],
		uuid: '011debcc-cd26-11de-a748-00144feabdc0'
	},
	technology: {
		url: '/companies/technology',
		genres: ['analysis', 'comment'],
		uuid: 'e900741c-f7e8-11df-8d91-00144feab49a'
	},
	lifestyle: {
		url: '/life-arts',
		uuid: 'cec106aa-cd25-11de-a748-00144feabdc0'
	},
	management: {
		type: 'page',
		uuid: 'fcdae4e8-cd25-11de-a748-00144feabdc0'
	},
	frontPageSkyline: {
		type: 'page',
		uuid: '4c499f12-4e94-11de-8d4c-00144feabdc0'
	},
	videos: {
		id: '69917354001' // BrightCove ID
	},
	editorsPicks: {
		type: 'list',
		uuid: '73667f46-1a55-11e5-a130-2e7db721f996'
	},
	brexitPrimary: {
		type: 'list',
		uuid: '5ae77144-3162-11e6-ad39-3fee5ffe5b5b'
	},
	brexitSecondary: {
		type: 'list',
		uuid: 'b2f7f28c-1114-11e6-91da-096d89bd2173'
	},

	// TODO remove brexitCoverage, once next-front-page has switched to using new source "brexitPrimary"
	brexitCoverage: {
		type: 'list',
		uuid: 'b2f7f28c-1114-11e6-91da-096d89bd2173'
	},
	// TODO remove brexitBuildup, once next-front-page has switched to using new source "brexitSecondary"
	brexitBuildup: {
		type: 'list',
		uuid: 'b2f7f28c-1114-11e6-91da-096d89bd2173'
	}
};

export default sources;
