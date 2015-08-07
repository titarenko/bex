function __buildModule (express, bodyParser, requireAll, path, handling, routing) {

var _ = require('lodash');

var utils = {
	requireAll: requireAll,
	registerResult: handling.registerResult,
	registerHandler: handling.registerHandler,
	createRouter: routing.createRouter
};

function normalizeParams (params) {
	params = _.cloneDeep(params);
	if (_.isString(params.basedir)) {
		if (!params.controllers && params.controllers !== false) {
			params.controllers = path.join(params.basedir, 'controllers');
		}
		if (!params.views && params.views !== false) {
			params.views = path.join(params.basedir, 'views');
		}
	}
	return params;
}

function createApp (params) {
	var app = express();
	
	params = normalizeParams(params);

	var before = _.get(params, 'hooks.before') || _.identity;
	var after = _.get(params, 'hooks.after') || _.identity;

	before.call(utils, app);

	app.set('trust proxy', true);

	if (_.isString(params.views)) {
		app.set('views', params.views);
		if (_.isFunction(params.viewEngine)) {
			app.engine(params.viewExt || 'html', params.viewEngine);
			app.set('view engine', params.viewExt || 'html');
		}
	}

	app.use(bodyParser.urlencoded(_.extend({ extended: false }, params.bodyParser)));
	app.use(bodyParser.json(params.bodyParser));

	if (_.isString(params.controllers)) {
		app.use(routing.createRouter(params.controllers));
	}

	after.call(utils, app);

	return app;
}

return _.extend({}, utils, { createApp: createApp });

} // end of __buildModule

module.exports = __buildModule(
	require('express'),
	require('body-parser'),
	require('require-all'),
	require('path'),
	require('./handling'),
	require('./routing')
);

module.exports.__buildModule = __buildModule;
