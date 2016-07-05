import proxyquire from 'proxyquire';
import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';

chai.should();
chai.use(sinonChai);

const redisClientSpy = {
	auth: sinon.spy(),
	on: sinon.spy(),
	get: sinon.spy(),
	setex: sinon.spy()
};
const redisSpy = {
	createClient: sinon.spy(opts => redisClientSpy)
};
const Redis = proxyquire('../../../server/lib/redis', { redis: redisSpy });

describe('Redis', () => {

	it('should be able to initialise', () => {
		const redis = new Redis();
		redis.should.be.defined;
	});

	it('should use host localhost, port 6379, if no url supplied', () => {
		new Redis();
		redisSpy.createClient.should.have.been.calledWith({
			host: 'localhost',
			port: '6379',
			enable_offline_queue: false
		});
	});

	it('should use url if supplied', () => {
		new Redis({ redisUrl: 'http://www.foo.com:6666' });
		redisSpy.createClient.should.have.been.calledWith({
			host: 'www.foo.com',
			port: '6666',
			enable_offline_queue: false
		});
	});

	it('should auth, if supplied', () => {
		new Redis({ redisUrl: 'http://:secret@www.foo.com:6666' });
		redisClientSpy.auth.should.have.been.calledWith('secret');
	});

	it('should be able to get', () => {
		const redis = new Redis();
		redis.get('some-key');
		redisClientSpy.get.should.have.been.calledWith('some-key');
	});

	it('should be able to set', () => {
		const redis = new Redis();
		const fetcher = () => { };
		redis.set('some-key', 60, fetcher);
		redisClientSpy.setex.should.have.been.calledWith('some-key', 60, fetcher);
	});

});
