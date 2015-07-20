var _ = require('lodash');

function init () {
	var keys = ['_', 'Promise', '$'];
	keys.forEach(function (key) {
		if (global[key]) {
			throw new Error('Can not overwrite "' + key + '"!');
		}
	});
	var values = [_, require('bluebird'), {}];
	_.each(keys, function (key, index) {
		global[key] = values[index];
	});
}

function register (name, value) {
	var subject = _.isObject(name) && _.isUndefined(value)
		? name
		: _.zipObject([name], [value]);
	_.each(subject, function (value, key) {
		if ($[key]) {
			throw new Error('"' + key + '" already registered!');
		}
		$[key] = value;
	});
}

module.exports = {
	init: init,
	register: register
};
