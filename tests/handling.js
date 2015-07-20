var should = require('should');
var sinon = require('sinon');
var handling = require('../handling');

describe('handling', function () {
	describe('buildContext', function () {
		it('should return context with user object taken from request', function () {
			var req = { user: { id: 10 }, stuff: {} };
			handling.buildContext(req, {}).should.containEql({ user: req.user });
			handling.buildContext(req, {}).should.not.containEql({ stuff: req.stuff });
		});
		it('should return context with view result builder', function () {
			handling.buildContext({}, {}).view.should.be.Function();
		});
		it('should return context with redirect result builder', function () {
			handling.buildContext({}, {}).redirect.should.be.Function();
		});
		it('should return context with json result builder', function () {
			handling.buildContext({}, {}).json.should.be.Function();
		});
		it('should return context with registered custom result builder', function () {
			handling.registerResult('foobar', function () {});
			handling.buildContext({}, {}).foobar.should.be.Function();
		});
	});
	describe('registerResult', function () {
		before(function () {
			handling.registerResult('myresult', function () {});
		});
		it('should not allow to register existing result', function () {
			should.throws(function () {
				handling.registerResult('myresult', function () {});	
			});
		});
		it('should allow to overwrite existing result', function () {
			should.doesNotThrow(function () {
				handling.registerResult('myresult', function () {}, true);	
			});
		});
	});
	describe('registerHandler', function () {
		before(function () {
			handling.registerHandler('myresult', function () {});
		})
		it('should not allow to register existing result', function () {
			should.throws(function () {
				handling.registerHandler('myresult', function () {});	
			});
		});
		it('should allow to overwrite existing result', function () {
			should.doesNotThrow(function () {
				handling.registerHandler('myresult', function () {}, true);	
			});
		});
	});
	describe('results', function () {
		it('should contain view result', function () {
			var context = handling.buildContext({}, {});
			var result = context.view('my-view', { my: 'data', your: 1 });
			result.should.eql({
				type: 'view',
				name: 'my-view',
				data: { my: 'data', your: 1 }
			});
		});
		it('should contain view result with empty data if only view name was passed', function () {
			var context = handling.buildContext({}, {});
			var result = context.view('my-view-2');
			result.should.eql({
				type: 'view',
				name: 'my-view-2',
				data: {}
			});
		});
		it('should contain redirect result', function () {
			var context = handling.buildContext({}, {});
			var result = context.redirect('my-url');
			result.should.eql({
				type: 'redirect',
				url: 'my-url'
			});
		});
		it('should contain redirect result', function () {
			var context = handling.buildContext({}, {});
			var result = context.json({ data: 5 });
			result.should.eql({
				type: 'json',
				pojo: { data: 5 }
			});
		});
	});
	describe('handleResult', function () {
		it('should handle view', function () {
			var context = handling.buildContext({}, {});
			var res = { render: sinon.spy() };
			var result = context.view('my-view', { my: 'data' });
			handling.handleResult({}, res, result);
			res.render.callCount.should.eql(1);
			res.render.firstCall.args.should.eql(['my-view', { my: 'data' }]);
		});
		it('should handle redirect', function () {
			var context = handling.buildContext({}, {});
			var res = { redirect: sinon.spy() };
			var result = context.redirect('my-url');
			handling.handleResult({}, res, result);
			res.redirect.callCount.should.eql(1);
			res.redirect.firstCall.args.should.eql(['my-url']);
		});
		it('should handle json', function () {
			var context = handling.buildContext({}, {});
			var res = { json: sinon.spy() };
			var result = context.json({ my: 'data' });
			handling.handleResult({}, res, result);
			res.json.callCount.should.eql(1);
			res.json.firstCall.args.should.eql([{ my: 'data' }]);
		});
		it('should handle custom result', function () {
			var handler = sinon.spy();
			handling.registerHandler('custom', handler);
			handling.handleResult({}, {}, { type: 'custom', a: 'q' });
			handler.callCount.should.eql(1);
			handler.firstCall.args.should.eql([{}, {}, { type: 'custom', a: 'q' }]);
		});
		it('should handle undefined result', function () {
			var res = { status: sinon.spy(), end: sinon.spy() };
			handling.handleResult({}, res);
			res.status.callCount.should.eql(1);
			res.status.firstCall.args.should.eql([404]);
		});
	});
	describe('handleException', function () {
		it('should handle exception', function () {
			var res = { status: sinon.spy(), end: sinon.spy() };
			handling.handleException({}, res);
			res.status.callCount.should.eql(1);
			res.status.firstCall.args.should.eql([500]);
		});
	});
});
