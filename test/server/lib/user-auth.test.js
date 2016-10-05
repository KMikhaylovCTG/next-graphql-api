import fetchMock from 'fetch-mock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.should();

import userAuth from '../../../server/lib/user-auth';

describe('User Auth', () => {

	afterEach(() => {
		fetchMock.restore();
	});

	it('should return uuid if header has correct api key', () => {
		const req = {
			headers: { 'x-api-key': process.env.GRAPHQL_API_KEY }
		};

		return userAuth(req, '1234').should.become('1234');
	});

	it('should return uuid if query string has correct api key', () => {
		const req = {
			query: { apiKey: process.env.GRAPHQL_API_KEY }
		};

		return userAuth(req, '1234').should.become('1234');
	});

	it('should throw error if incorrect api key', () => {
		const req = {
			headers: { 'x-api-key': 'bad-api-key' }
		};

		return userAuth(req, '1234').should.be.rejectedWith('Bad apiKey supplied');
	});

	// it('should return uuid if valid session', () => {
	// 	fetchMock.mock('https://session-next.ft.com/uuid', { uuid: '1234' });
	// 	const req = {
	// 		cookies: { FTSession: 'session-id' },
	// 		headers: { }
	// 	};

	// 	return userAuth(req, '1234').should.become('1234');
	// });

	// it('should return user\'s uuid if none supplied', () => {
	// 	fetchMock.mock('https://session-next.ft.com/uuid', { uuid: '1234' });
	// 	const req = {
	// 		cookies: { FTSession: 'session-id' },
	// 		headers: { }
	// 	};

	// 	return userAuth(req).should.become('1234');
	// });

	// it('should throw error if nothing returned from session endpoint', () => {
	// 	fetchMock.mock('https://session-next.ft.com/uuid', { });
	// 	const req = {
	// 		cookies: { FTSession: 'session-id' },
	// 		headers: { }
	// 	};

	// 	return userAuth(req, '1234').should.be.rejectedWith('No uuid returned from session endpoint');
	// });

	// it('should throw error if no FTSession cookie', () => {
	// 	fetchMock.mock('https://session-next.ft.com/uuid', { });
	// 	const req = {
	// 		cookies: { },
	// 		headers: { }
	// 	};

	// 	return userAuth(req, '1234').should.be.rejectedWith('Sign in to view user data');
	// });

	// it('should throw error if requested uuid is different to user\'s', () => {
	// 	fetchMock.mock('https://session-next.ft.com/uuid', { uuid: '1234' });
	// 	const req = {
	// 		cookies: { FTSession: 'session-id' },
	// 		headers: { }
	// 	};

	// 	return userAuth(req, '4567').should.be.rejectedWith(
	// 		'Requested uuid does not match user\'s uuid=4567 users_uuid=1234'
	// 	);
	// });

	// it('should throw error if session request fails', () => {
	// 	fetchMock.mock('https://session-next.ft.com/uuid', 500);
	// 	const req = {
	// 		cookies: { FTSession: 'session-id' },
	// 		headers: { }
	// 	};

	// 	return userAuth(req).should.be.rejectedWith(
	// 		'Session endpoint responded with error server_error_name=BadServerResponseError server_error_message=500 ft_session=session-id'
	// 	);
	// });

});
