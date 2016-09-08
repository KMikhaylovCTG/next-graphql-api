const articleUuid = 'd0377096-f290-11e4-b914-00144feab7de';
const listUuid = '73667f46-1a55-11e5-a130-2e7db721f996';
const pageUuid = 'fcdae4e8-cd25-11de-a748-00144feabdc0';
const conceptUuid = '5c7592a8-1f0c-11e4-b0cb-b2227cce2b54';

const searchOpts = {
	filter: {
		bool: {
			must: {
				term: {
					'metadata.idV1': 'Mjk=-VG9waWNz'
				}
			}
		}
	}
};

export default {
	name: 'CAPI',
	description : 'CAPI / Elastic Search service health checks',
	checks : [
		{
			name: 'Article (v3_api_v2)',
			severity: 1,
			businessImpact: 'API may not be able to serve articles',
			technicalSummary: 'Tries to fetch an article from the Elastic Search cluster',
			panicGuide: 'Don\'t Panic. Check the underlying next-es-interface healthchecks EU https://ft-next-es-interface-eu.herokuapp.com/__health, US https://ft-next-es-interface-us.herokuapp.com/__health',
			type: 'capi',
			capiMethod: 'content',
			capiOptions: {
				uuid: articleUuid,
				index: 'v3_api_v2'
			}
		},
		{
			name: 'By Concept',
			severity: 2,
			businessImpact: 'API may not be able to serve related articles',
			technicalSummary: 'Tries to fetch articles by a concept from API',
			panicGuide: 'Don\'t Panic',
			type: 'capi',
			capiMethod: 'contentAnnotatedBy',
			capiOptions: {
				uuid: conceptUuid
			}
		},
		{
			name: 'List',
			severity: 2,
			businessImpact: 'API may not be able to serve lists',
			technicalSummary: 'Tries to fetch a list from CAPI v2',
			panicGuide: 'Don\'t Panic. Check http://dashing.internal.ft.com/APIGateway-endpoints - Lists tile',
			type: 'capi',
			capiMethod: 'lists',
			capiOptions: {
				uuid: listUuid
			}
		},
		{
			name: 'Page',
			severity: 2,
			businessImpact: 'API may not be able to serve pages',
			technicalSummary: 'Tries to fetch a page from CAPI v1',
			panicGuide: 'Don\'t Panic. Check http://dashing.internal.ft.com/APIGateway-endpoints - Site V1 tile',
			type: 'capi',
			capiMethod: 'pages',
			capiOptions: {
				uuid: pageUuid
			}
		},
		{
			name: 'Search',
			severity: 2,
			businessImpact: 'API may not be able to perform searches',
			technicalSummary: 'Tries to do a search for a concept from the Elastic Search cluster',
			panicGuide: 'Don\'t Panic. Check the underlying next-es-interface healthchecks EU https://ft-next-es-interface-eu.herokuapp.com/__health, US https://ft-next-es-interface-us.herokuapp.com/__health',
			type: 'capi',
			capiMethod: 'search',
			capiOptions: {
				searchOpts: searchOpts
			}
		},
		{
			name: 'Hui',
			severity: 3,
			businessImpact: 'API may not be able to serve Most Popular by Industry',
			technicalSummary: 'Tries to fetch most popular content by an industry from CAPI v2',
			panicGuide: 'Don\'t Panic. Check http://dashing.internal.ft.com/APIGateway-endpoints - HUI Api tile',
			type: 'capi',
			capiMethod: 'hui',
			capiOptions: {
				industry: 'http://api.ft.com/things/077bea1d-01ca-328e-aa0b-d7dc92796030',
				period: 'last-1-week'
			}
		}
	]
}
