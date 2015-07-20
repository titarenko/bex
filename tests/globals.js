var should = require('should');
var globals = require('../globals');

describe('globals', function () {
	after(function () {
		delete global._;
		delete global.Promise;
		delete global.$;
	});
	describe('init', function () {
		it('should not register "Promise" if it already exists in global namespace', function () {
			global.Promise = {};
			should.throws(function () {
				globals.init();
			});
		});
		it('should not register "_" if it already exists in global namespace', function () {
			global._ = {};
			should.throws(function () {
				globals.init();
			});
		});
		it('should not register "$" if it already exists in global namespace', function () {
			global.$ = {};
			should.throws(function () {
				globals.init();
			});
		});
	});
	describe('register', function () {
		it('should register custom properties of global "$"', function () {
			globals.register('customProp', { a: 'b' });
			$.customProp.should.eql({ a: 'b' });
		});
		it('should register multiple custom properties of global "$"', function () {
			globals.register({
				a: 'b',
				c: 1
			});
			$.a.should.eql('b');
			$.c.should.eql(1);
		});
		it('should not allow to register anything that was previously registered', function () {
			globals.register('already', 1);
			should.throws(function () {
				globals.register('already', 2);
			});
		});
	});
});
