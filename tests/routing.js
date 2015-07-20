var should = require('should');
var _ = require('lodash');
var routing = require('../routing');

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
			var router = routing.createRouter(controllers);
			var routes = _.pluck(router.stack, 'route');
			routes[0].should.containEql({ path: 'my-controller-1', methods: { post: true } });
		});
		it('should bind list CRUD method to correct route', function () {
			var router = routing.createRouter(controllers);
			var routes = _.pluck(router.stack, 'route');
			routes[1].should.containEql({ path: 'my-controller-1', methods: { get: true } });
		});
		it('should bind view CRUD method to correct route', function () {
			var router = routing.createRouter(controllers);
			var routes = _.pluck(router.stack, 'route');
			routes[2].should.containEql({ path: 'my-controller-1/:id', methods: { get: true } });
		});
		it('should bind update CRUD method to correct route', function () {
			var router = routing.createRouter(controllers);
			var routes = _.pluck(router.stack, 'route');
			routes[3].should.containEql({ path: 'my-controller-1/:id', methods: { put: true } });
		});
		it('should bind remove CRUD method to correct route', function () {
			var router = routing.createRouter(controllers);
			var routes = _.pluck(router.stack, 'route');
			routes[4].should.containEql({ path: 'my-controller-1/:id', methods: { 'delete': true } });
		});
		it('should bind explicit route handler to correct route', function () {
			var router = routing.createRouter(controllers);
			var routes = _.pluck(router.stack, 'route');
			routes[5].should.containEql({ path: 'my-controller-1/:id/star', methods: { put: true } });
		});
	});
});
