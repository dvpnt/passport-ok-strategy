'use strict';

var _ = require('underscore'),
	Strategy = require('../lib').Strategy;

exports.passport = {
	use: function(strategy) {
		this._strategy = strategy;

		_(['success', 'fail', 'redirect', 'error', 'pass']).each(function(callback) {
			strategy[callback] = _.noop;
		});
	},
	authenticate: function(options) {
		this._strategy.authenticate({}, options);
	},
	restore: function() {
		this._strategy = null;
	}
};

exports.strategyOptions = {
	clientID: '1234',
	clientPublic: '1234',
	clientSecret: '123abcf3213'
};

exports.createStrategy = function(options) {
	options = _(options || {}).defaults(exports.strategyOptions);

	return new Strategy(options, _.noop);
};

