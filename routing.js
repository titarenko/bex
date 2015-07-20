var express = require('express');
var _ = require('lodash');
var Promise = require('bluebird');
var requireAll = require('require-all');
var handling = require('./handling');

var crudMethods = {
	create: 'post &',
	update: 'put &/:id',
	list: 'get &',
	view: 'get &/:id',
	remove: 'delete &/:id'
};

function parseRoute (controllerName, routeOrMethodName) {
	var route = crudMethods[routeOrMethodName] || routeOrMethodName;
	return parseExplicitRoute(controllerName, route);
}

function parseExplicitRoute (controllerName, route) {
	route = route.replace('&', _.kebabCase(controllerName));
	var parts = route.split(' ');
	switch (parts.length) {
		case 1:
			return {
				method: 'get',
				path: parts[0]
			};
		case 2:
			return {
				method: parts[0].toLowerCase(),
				path: parts[1]
			};
		default:
			throw new Error('Can not parse route "' + route + '"!');
	}
}

function createRouter (controllers) {
	controllers = _.isString(controllers) ? requireAll(controllers) : controllers;
	var router = express.Router();
	_.each(controllers, function (actions, name) {
		_.each(actions, function (method, route) {
			route = parseRoute(name, route);
			router[route.method](route.path, createHandler(method));
		});
	});
	return router;
}

function createHandler (method) {
	return function routeHandler (req, res) {
		Promise.try(function () {
			var context = handling.buildContext(req, res);
			var params = _.extend({}, req.files, req.query, req.params, req.body);
			return method.call(context, params, req, res);
		}).then(handling.handleResult).catch(handling.handleException);
	};
}

module.exports = {
	parseRoute: parseRoute,
	createRouter: createRouter
};
