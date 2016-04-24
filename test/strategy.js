'use strict';

var expect = require('expect.js'),
	url = require('url'),
	helpers = require('./helpers'),
	sinon = require('sinon'),
	_ = require('underscore'),
	Strategy = require('../lib').Strategy;

describe('Strategy', function() {
	describe('creating', function() {
		it('should try create without public key', function() {
			expect(function() {
				new Strategy({}, _.noop);
			}).to.throwException(Error);
		});

		it('should create strategy', function() {
			var strategy = helpers.createStrategy();

			expect(strategy.name).to.eql('odnoklassniki');
		});
	});

	describe('authenteication layout', function() {
		var strategy;

		beforeEach(function() {
			strategy = helpers.createStrategy();
			helpers.passport.use(strategy);
		});

		afterEach(function() {
			helpers.passport.restore();
		});

		it('should redirect without layout', function() {
			var redirectStub = sinon.stub(strategy, 'redirect');
			helpers.passport.authenticate();

			var query = url.parse(redirectStub.firstCall.args[0], true).query;

			expect(query.layout).to.not.be.ok();
			expect(query.response_type).to.eql('code');
		});

		it('should redirect with correct layout', function() {
			var redirectStub = sinon.stub(strategy, 'redirect');
			helpers.passport.authenticate({layout: 'w'});

			var query = url.parse(redirectStub.firstCall.args[0], true).query;

			expect(query.layout).to.eql('w');
			expect(query.response_type).to.eql('code');
		});

	});
});
