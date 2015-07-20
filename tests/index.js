var mockery = require('mockery');
mockery.enable();
mockery.warnOnUnregistered(false);

var sinon = require('sinon');
var should = require('should');

var requireAllMock = sinon.stub().returns({});
var globalsMock = { init: sinon.spy() };

mockery.registerMock('require-all', requireAllMock);
mockery.registerMock('./globals', globalsMock);

var bex = require('../');

describe('bex', function () {
	after(function () {
		mockery.deregisterAll();
	})
	describe('createApp', function () {
		it('should init globals', function () {
			bex.createApp({ basedir: __dirname });
			globalsMock.init.calledOnce.should.be.true();
		});
		it('should look for controllers in specified folder', function () {
			bex.createApp({ controllers: '/ctrl' });
			requireAllMock.getCall(1).args.should.eql(['/ctrl']);
		});
	});
});
