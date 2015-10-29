function __buildModule () {

var _ = require('lodash');

var results = {
	view: function (view, data) {
		return { type: 'view', name: view, data: data || {} };
	},
	redirect: function (url) {
		return { type: 'redirect', url: url };
	},
	empty: function () { 
		return { type: 'empty' };
	},
	json: function (pojo) {
		return { type: 'json', pojo: pojo };
	},
	stream: function (stream, type, disposition) {
		return { type: 'stream', stream: stream, type: type, disposition: disposition };
	}
};

var handlers = {
	view: function (req, res, result) {
		res.render(result.name, result.data);
	},
	redirect: function (req, res, result) {
		res.redirect(result.url);
	},
	json: function (req, res, result) {
		res.json(result.pojo);
	},
	exception: function (req, res, result) {
		res.status(500).end();
	},
	empty: function (req, res) {
		res.status(200).end();
	},
	stream: function (req, res, result) {
		if (result.type) {
			res.set('Content-Type', result.type);
		}
		if (result.disposition) {
			res.set('Content-Disposition', result.disposition);
		}
		result.stream.pipe(res);
	},
	undefined: function (req, res, result) {
		res.status(404).end();
	}
};

function register (kind, name, fn, overwrite) {
	var dictionary = kind == 'result' ? results : handlers;
	
	var pairs;
	if (_.isObject(name)) {
		pairs = name;
		overwrite = fn;
	} else {
		pairs = _.zipObject([name], [fn]);
	}

	_.each(pairs, function (fn, name) {
		if (dictionary[name] && !overwrite) {
			throw new Error('Can not overwrite ' + kind + ' "' + name + '"!');
		}
		dictionary[name] = fn;
	});
}

function handleResult (req, res, result) {
	var handler = handlers[result && result.type || 'undefined'];
	handler(req, res, result);
}

function handleException (req, res, exception) {
	handlers['exception'](req, res, exception);
}

function buildContext (req, res) {
	return _.extend({ user: req.user }, results);
}

return {
	buildContext: buildContext,
	registerResult: _.partial(register, 'result'),
	registerHandler: _.partial(register, 'handler'),
	handleResult: handleResult,
	handleException: handleException
};

} // end of __buildModule

module.exports = __buildModule();
module.exports.__buildModule = __buildModule;
