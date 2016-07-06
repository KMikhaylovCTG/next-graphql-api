import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';

chai.should();
chai.use(sinonChai);

import Redis from '../../../server/lib/redis';

class RedisClientMock {
	constructor () {
		this.events = { };
		this.db = { };
	}
	auth () { }
	on (event, func) {
		this.events[event] = func;
	}
	get (key, func) {
		func(null, this.db[key]);
	}
	setex (key, ttl, data, func) {
		func(null);
	}
	_fire (event) {
		this.events[event]();
	}
}

const createRedisMock = redisClient => ({
	createClient: sinon.spy(() => redisClient)
});

describe('Redis', () => {

	it('should be able to initialise', () => {
		const redisMock = createRedisMock(new RedisClientMock());
		const redis = new Redis({ redis: redisMock });

		redis.should.be.defined;
	});

	it('should use host localhost, port 6379, if no url supplied', () => {
		const redisMock = createRedisMock(new RedisClientMock());
		new Redis({ redis: redisMock });

		redisMock.createClient.should.have.been.calledWith({
			host: 'localhost',
			port: '6379',
			enable_offline_queue: false
		});
	});

	it('should use url if supplied', () => {
		const redisMock = createRedisMock(new RedisClientMock());
		new Redis({ redisUrl: 'http://www.foo.com:6666', redis: redisMock });

		redisMock.createClient.should.have.been.calledWith({
			host: 'www.foo.com',
			port: '6666',
			enable_offline_queue: false
		});
	});

	it('should auth, if supplied', () => {
		const redisClientMock = new RedisClientMock();
		const authSpy = sinon.spy(redisClientMock, 'auth');
		const redisMock = createRedisMock(redisClientMock);
		new Redis({ redisUrl: 'http://:secret@www.foo.com:6666', redis: redisMock });

		authSpy.should.have.been.calledWith('secret');
	});

	it('should be able to get', done => {
		const redisClientMock = new RedisClientMock();
		const getSpy = sinon.spy(redisClientMock, 'get');
		// put some data in its 'database'
		redisClientMock.db['some-key'] = '{"foo":"bar"}';
		const redisMock = createRedisMock(redisClientMock);
		const redis = new Redis({ redis: redisMock });

		redis.get('some-key')
			.then(data => {
				data.should.equal('{"foo":"bar"}');
				getSpy.should.have.been.calledWith('some-key');
				done()
			})
			.catch(done);
		redisClientMock._fire('ready');
	});

	it('should be able to set', done => {
		const redisClientMock = new RedisClientMock();
		const setSpy = sinon.spy(redisClientMock, 'setex');
		const redisMock = createRedisMock(redisClientMock);
		const redis = new Redis({ redis: redisMock });

		redis.set('some-key', 60, 'some data')
			.then(() => {
				setSpy.should.have.been.calledWith('some-key', 60, 'some data');
				done()
			})
			.catch(done);
		redisClientMock._fire('ready');
	});

});
