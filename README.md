# bex

Express.js application bootstrapper. Simplicity, brevity, flexibility.

[![Build Status](https://secure.travis-ci.org/titarenko/bex.png?branch=master)](https://travis-ci.org/titarenko/bex) [![Coverage Status](https://coveralls.io/repos/titarenko/bex/badge.png)](https://coveralls.io/r/titarenko/bex)

[![NPM](https://nodei.co/npm/bex.png?downloads=true&stars=true)](https://nodei.co/npm/bex/)

# Installation

```bash
npm i bex --save
```

# Example

## app.js

```js
var config = require('./config').web;

require('bex').createApp({
	basedir: __dirname,
	viewEngine: require('express-dot').__express,
	hooks: { after: initialize }
}).listen(config.port);

function initialize (app) {
	this.registerGlobal('db', require('knex')(config.db));
	this.registerGlobal(this.requireAll(__dirname + '/modules'));
}
```

## controllers/items.js

```js
module.exports = {

	create: _.flow($.sanitize, $.validate, $.authorize, function (params) {
		return $.db('items').insert(params).then(this.json);
	}),

	'&/:id/render': function (params) {
		return Promise
			.props({ item: $.db('items').where('id', params.id).first() })
			.then(_.partial(this.view, 'items/index'));
	},

	'PUT items/:id/star': _.flow($.authorize, function (params) {
		return $.db('items').where('id', params.id).update('is_starred', 1).then(this.json);
	})

};
```

# Quick notes (on example)

As you probably noted, there are 2 ways of specifying the route-handler pair:

- implicit: via method names like `list` (`GET resource`), `view` (`GET resource/:id`), `create` (`POST resource`), `update` (`PUT resource/:id`) and `remove` (`DELETE resource/:id`)
- explicit: by specifying exact route (`GET resource/:from/:to`) or exact route with resource name placeholder (`GET &/:id`) where kebab-cased controller's name will be substituted

In case of explicit route, you can omit `GET` verb, it is being used by default (`&/:id` is the same as `GET &/:id` or `get &/:id`).

# What does it do?

- registers global variables (yes, global, because they are *very* intensively used): `Promise` (bluebird), `_` (lodash), `$` (shortcuts object), **can be omitted** by specifying `globalObj: {}`
- creates `express.js` app
- calls hook (`before`), if it is passed via `hooks` param
- sets `'trust proxy'` to `true` (*very* often `node.js` app is hosted behind `nginx`)
- initializes view-related stuff, can be omitted by specifying `views: false`
- initializes `body-parser` (almost *every* express project needs this)
- creates router based on controllers modules (see example), can be omitted, if no `controllers` param is passed
- calls hook (`after`), if it is passed via `hooks` param

# Few words about route handling

- it is expected, that route handler returns view result (or promise with view result): `return this.json({ my: 'data' });`
- there are 3 built-it view results: `view(name, data)` (ends with rendering of `name` view with `data`), `redirect(url)` and `json(data)`
- you can register your own result, which will be available via `this` inside route handler: `bex.registerResult('myresult', function (anyarg) { return { type: 'myresult', arg: anyarg }; });` - minimal requirement for result constructor is to return result object with mandatory `type` property
- you can register your own *result* handler, which will be called once result of given `type` is obtained from any of your *route* handlers: `bex.registerHandler('myresult', function (req, res, result) { res.send(result.anyarg); });`

There are 2 special results

- `exception` - generated when exception occurs inside route handler (default handler will cause empty response with `500` code)
- `undefined` - generated when no view result is returned from route handler (its default handler will cause empty response with `404` status)

You can override how `bex` reacts to these 2 special results (as well as other "ordinary" results) via overwriting their handlers: `bex.registerHandler('exception', function (req, res, exception) { logstash.send(req.url, exception); }, true);`.

# Few words regarding hooks

- there are 2 hooks: `before` (called just after `express.js` app is created, but nothing was performed with it) and `after` (called after everything is done and `bex` is ready to return bootstrapped app)
- each hook will have `this` populated with utility methods: `requireAll`, `registerGlobal`, `registerResult`, `registerHandler`, `createRouter`

# Utility methods

## requireAll(path)

Requires all modules which exist inside specified folder (see [require-all](https://www.npmjs.com/package/require-all) docs for details).

## registerGlobal(name, value, [overwrite]) or registerGlobal(nameValueObject, [overwrite])

Registers `name` property of global `$` with `value`. Also can be called with 1 argument of type object, each property-value pair of it will be treated as `name`-`value` pair. There is also additional last argument which specifies whether previous value can be overwritten if exists (by default `bex` will throw if such name is already registered).

## regiserResult(name, value, [overwrite]) or registerResult(nameValueObject, [overwrite])

Registers view result(s).

## regiserResult(name, value, [overwrite]) or registerResult(nameValueObject, [overwrite])

Registers view result handler(s).

## createRouter(path)

Loads everything from specified `path` and maps converts to route-handler pairs, applying them to `express.Router`. Returns `express.Router` instance ready to be used by `express.js` app. Also accepts object as argument, each property-value of which will be treated as `controllerName`-`controllerInstance` pairs.

# License

MIT
