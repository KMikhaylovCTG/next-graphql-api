import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';

chai.should();
chai.use(sinonChai);

import RedisCache from '../../../../server/lib/caches/redis-cache';

class RedisStub {
	constructor () { }

	get () {
		return Promise.resolve();
	}

	set () {
		return Promise.resolve();
	}
}

describe('Redis Cache', () => {

	it('should be able to initialise', () => {
		const redisStub = new RedisStub();
		const redisCache = new RedisCache({ redis: redisStub });
		redisCache.should.be.defined;
	});

	it('should be able to cache', () => {
		const redisStub = new RedisStub();
		const redisGetSpy = sinon.spy(redisStub, 'get');
		const redisSetSpy = sinon.spy(redisStub, 'set');
		const redisCache = new RedisCache({ redis: redisStub });

		return redisCache
			.cached('some-key', 60, () => Promise.resolve({ foo: 'bar' }))
			.then(data => {
				data.should.eql({ foo: 'bar' });
				redisGetSpy.should.have.been.calledWith('some-key');
				redisSetSpy.should.have.been.calledWith('some-key', 60, '{"foo":"bar"}');
			});
	});

	it('should be able to retrieve from cache', () => {
		const redisStub = new RedisStub();
		const redisGetStub = sinon.stub(redisStub, 'get');
		redisGetStub.returns(Promise.resolve('{"foo":"bar"}'));
		const redisCache = new RedisCache({ redis: redisStub });
		const fetcherStub = sinon.stub();
		fetcherStub.returns(Promise.resolve());

		return redisCache
			.cached('some-key', 60, fetcherStub)
			.then(data => {
				data.should.eql({ foo: 'bar' });
				fetcherStub.should.not.have.been.called;
			});
	});

});
