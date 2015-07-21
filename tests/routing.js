var should = require('should');
var _ = require('lodash');
var sinon = require('sinon');

var expressMock = function () {};
var routerMock = {};
expressMock.Router = function () { return routerMock; };
var requireAllMock = sinon.spy();
var handlingMock = {
	buildContext: sinon.spy(),
	handleResult: sinon.spy(),
	handleException: sinon.spy()
};

var routing = require('../routing').__buildModule(expressMock, requireAllMock, handlingMock);

describe('routing', function () {
	describe('parseRoute', function () {
		it('should parse implicit CRUD create route', function () {
			routing.parseRoute('my-controller', 'create').should.eql({
				method: 'post',
				path: 'my-controller'
			});
		});
		it('should parse implicit CRUD view route', function () {
			routing.parseRoute('my-controller', 'view').should.eql({
				method: 'get',
				path: 'my-controller/:id'
			});
		});
		it('should parse implicit CRUD list route', function () {
			routing.parseRoute('my-controller', 'list').should.eql({
				method: 'get',
				path: 'my-controller'
			});
		});
		it('should parse implicit CRUD update route', function () {
			routing.parseRoute('my-controller', 'update').should.eql({
				method: 'put',
				path: 'my-controller/:id'
			});
		});
		it('should parse implicit CRUD delete route', function () {
			routing.parseRoute('my-controller', 'remove').should.eql({
				method: 'delete',
				path: 'my-controller/:id'
			});
		});
		it('should parse explicit route', function () {
			routing.parseRoute('my-controller-2', 'patch /my-entity/:id').should.eql({
				method: 'patch',
				path: '/my-entity/:id'
			});
		});
		it('should infer resource name in explicit route', function () {
			routing.parseRoute('my-controller-2', 'head /&/:id').should.eql({
				method: 'head',
				path: '/my-controller-2/:id'
			});
		});
		it('should lowercase method (verb) in explicit route', function () {
			routing.parseRoute('my-controller-2', 'DELETE /my-stuff/:id').should.eql({
				method: 'delete',
				path: '/my-stuff/:id'
			});
		});
		it('should interpret controller name as resource name in kebab case', function () {
			routing.parseRoute('myController2', 'GET &/:id').should.eql({
				method: 'get',
				path: 'my-controller-2/:id'
			});
		});
	});
	describe('createHandler', function () {
		it('should obtain context via buildContext', function () {
			var context = {}, req = {}, res = {}, method = sinon.spy();
			handlingMock.buildContext = sinon.stub().returns(context);
			routing.createHandler(method)(req, res);
			handlingMock.buildContext.callCount.should.eql(1);
			handlingMock.buildContext.firstCall.args.should.eql([req, res]);
			method.alwaysCalledOn(context);
		});
		it('should pass complete params object (composed from query, body, etc) to method', function () {
			var req = { query: { a: 'aaa' }, body: { b: 2 } }, res = {}, method = sinon.spy();
			routing.createHandler(method)(req, res);
			method.firstCall.args[0].should.eql({
				a: 'aaa',
				b: 2
			});
		});
		it('should pass req and res as second and third args to method', function () {
			var req = {}, res = {}, method = sinon.spy();
			routing.createHandler(method)(req, res);
			method.firstCall.args.slice(1).should.eql([req, res]);
		});
		it('should pass req, res and result args to success handler', function (done) {
			var req = {}, res = {}, result = { type: 'unique1' }, method = sinon.stub().returns(result);
			handlingMock.handleResult = function () {
				arguments[0].should.eql(req); 
				arguments[1].should.eql(res); 
				arguments[2].should.eql(result);
				handlingMock.handleResult = sinon.spy();
				done();
			}; 
			routing.createHandler(method)(req, res);
		});
		it('should pass req, res and exception args to exception handler', function (done) {
			var req = {}, res = {}, exception = new Error('unique2'), method = sinon.stub().throws(exception);
			handlingMock.handleException = function () {
				arguments[0].should.eql(req); 
				arguments[1].should.eql(res); 
				arguments[2].should.eql(exception);
				handlingMock.handleException = sinon.spy();
				done();
			};
			routing.createHandler(method)(req, res);
		});
	});
	describe('createRouter', function () {
		var controllers = {
			myController1: {
				create: function () {},
				list: function () {},
				view: function () {},
				update: function () {},
				remove: function () {},
				'PUT &/:id/star': function () {}
			}
		};
		it('should bind create CRUD method to correct route', function () {
			routerMock.post = sinon.spy();
			var router = routing.createRouter({
				myController1: { create: function () {} }
			});
			router.should.equal(routerMock);
			routerMock.post.firstCall.args.should.containEql('my-controller-1');
			delete routerMock.post;
		});
		it('should bind list CRUD method to correct route', function () {
			routerMock.get = sinon.spy();
			var router = routing.createRouter({
				myController1: { list: function () {} }
			});
			router.should.equal(routerMock);
			routerMock.get.firstCall.args.should.containEql('my-controller-1');
			delete routerMock.get;
		});
		it('should bind view CRUD method to correct route', function () {
			routerMock.get = sinon.spy();
			var router = routing.createRouter({
				myController1: { view: function () {} }
			});
			router.should.equal(routerMock);
			routerMock.get.firstCall.args.should.containEql('my-controller-1/:id');
			delete routerMock.get;
		});
		it('should bind update CRUD method to correct route', function () {
			routerMock.put = sinon.spy();
			var router = routing.createRouter({
				myController1: { update: function () {} }
			});
			router.should.equal(routerMock);
			routerMock.put.firstCall.args.should.containEql('my-controller-1/:id');
			delete routerMock.put;
		});
		it('should bind remove CRUD method to correct route', function () {
			routerMock['delete'] = sinon.spy();
			var router = routing.createRouter({
				myController1: { remove: function () {} }
			});
			router.should.equal(routerMock);
			routerMock['delete'].firstCall.args.should.containEql('my-controller-1/:id');
			delete routerMock['delete'];
		});
		it('should bind explicit route handler to correct route', function () {
			routerMock.put = sinon.spy();
			var router = routing.createRouter({
				myController1: { 'PUT &/:id/star': function () {} }
			});
			router.should.equal(routerMock);
			routerMock.put.firstCall.args.should.containEql('my-controller-1/:id/star');
			delete routerMock.put;
		});
		it('should bind explicit route handler with implicit method (verb) to correct route', function () {
			routerMock.get = sinon.spy();
			var router = routing.createRouter({
				myController1: { '&/:id/star': function () {} }
			});
			router.should.equal(routerMock);
			routerMock.get.firstCall.args.should.containEql('my-controller-1/:id/star');
			delete routerMock.get;
		});
		it('should throw if route can not be parsed', function () {
			should.throws(function () {
				routing.createRouter({
					myController1: { 'post bla &': function () {} }
				});
			});
		});
		it('should use requireAll for controller lookup if controllers arg is path', function () {
			routing.createRouter('bla-bla-path/');
			requireAllMock.args.should.containEql(['bla-bla-path/']);
		});
	});
});
