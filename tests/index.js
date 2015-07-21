var sinon = require('sinon');
var should = require('should');

var expressAppMock = {
	set: sinon.spy(),
	use: sinon.spy()
};
var expressMock = sinon.stub().returns(expressAppMock);
var bodyParserMock = {
	urlencoded: sinon.spy(),
	json: sinon.spy()
};
var requireAllMock = sinon.spy();
var globalsMock = {
	init: sinon.spy(),
	register: sinon.spy()
};
var handlingMock = {
	registerResult: sinon.spy(),
	registerHandler: sinon.spy()
};
var routingMock = {
	createRouter: sinon.stub().returns(function () {})
};
var bex = require('../').__buildModule(
	expressMock,
	bodyParserMock,
	requireAllMock,
	require('path'),
	globalsMock,
	handlingMock,
	routingMock
);

describe('bex', function () {
	describe('createApp', function () {
		it('should init globals', function () {
			globalsMock.init = sinon.spy();
			bex.createApp({});
			globalsMock.init.calledOnce.should.be.true();
		});
		it('should init non-global globals (via globalObj, if provided)', function () {
			globalsMock.__buildModule = sinon.stub().returns(globalsMock);
			var globalObj = {};
			bex.createApp({ globalObj: globalObj });
			globalsMock.__buildModule.calledOnce.should.be.true();
			globalsMock.__buildModule.getCall(0).args.should.eql([globalObj]);
		});
		it('should use basedir to infer controllers and views location', function () {
			bex.createApp({ basedir: 'mydir/mysubdir' });
			routingMock.createRouter.args.should.containEql(['mydir/mysubdir/controllers']);
			expressAppMock.set.args.should.containEql(['views', 'mydir/mysubdir/views']);
		});
		it('should use basedir to infer controllers but not views location if views option is set to false', function () {
			expressAppMock.set = sinon.spy();
			bex.createApp({ basedir: 'mydir/mysubdir', views: false });
			routingMock.createRouter.args.should.containEql(['mydir/mysubdir/controllers']);
			expressAppMock.set.args.should.not.containEql(['views', 'mydir/mysubdir/views']);
		});
		it('should use basedir to infer views but not controllers location if controllers option is set to false', function () {
			expressAppMock.set = sinon.spy();
			bex.createApp({ basedir: 'mydir/mysubdir', controllers: false });
			requireAllMock.args.should.not.containEql(['mydir/mysubdir/controllers']);
			expressAppMock.set.args.should.containEql(['views', 'mydir/mysubdir/views']);
		});
		it('should call hooks', function () {
			var hooks = { before: sinon.spy(), after: sinon.spy() };
			expressAppMock.set = sinon.spy();
			bex.createApp({ hooks: hooks });
			hooks.before.calledBefore(hooks.after).should.be.true();
			hooks.before.calledBefore(expressAppMock.set).should.be.true();
			hooks.after.calledAfter(expressAppMock.set).should.be.true();
		});
		it('should make app trust proxy', function () {
			expressAppMock.set = sinon.spy();
			bex.createApp({});
			expressAppMock.set.getCall(0).args.should.eql(['trust proxy', true]);
		});
		it('should set view engine if any is passed via params', function () {
			var engine = function () {};
			expressAppMock.engine = sinon.spy();
			bex.createApp({ views: 'views', viewEngine: engine });
			expressAppMock.set.args.should.containEql(['view engine', 'html']);
			expressAppMock.engine.args.should.containEql(['html', engine]);
		});
		it('should use custom view file ext if any is specified via params', function () {
			var engine = function () {};
			expressAppMock.engine = sinon.spy();
			bex.createApp({ views: 'views', viewExt: 'dot', viewEngine: engine });
			expressAppMock.set.args.should.containEql(['view engine', 'dot']);
			expressAppMock.engine.args.should.containEql(['dot', engine]);
		});
		it('should not set view engine if no views dir is passed via params', function () {
			var engine = function () {};
			expressAppMock.engine = sinon.spy();
			bex.createApp({ viewEngine: engine });
			expressAppMock.engine.callCount.should.eql(0);
		});
	});
});
