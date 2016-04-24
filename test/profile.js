'use strict';

var sinon = require('sinon'),
	errors = require('../lib/errors'),
	InternalOAuthError = require('passport-oauth2').InternalOAuthError,
	url = require('url'),
	expect = require('expect.js'),
	helpers = require('./helpers');

describe('Profile', function() {
	describe('getting', function() {
		var strategy, stub, getStub,
			clientSecret = '1234',
			accessToken = 'accesstoken',
			profileURL = {
				host: 'testprofile.url',
				pathname: '/fb.do',
				protocol: 'https:'
			};

		before(function() {
			strategy = helpers.createStrategy({
				clientSecret: clientSecret,
				profileURL: url.format(profileURL)
			});
			helpers.passport.use(strategy);
		});

		after(function() {
			helpers.passport.restore();
		});

		beforeEach(function() {
			stub = sinon.stub();
			getStub = sinon.stub(strategy._oauth2, 'get');
		});

		afterEach(function() {
			getStub.restore();
		});

		it('check oauth url', function() {
			strategy.userProfile(accessToken, stub);

			expect(getStub.called).to.be.ok();
			var call = getStub.firstCall;
			expect(call.args[1]).to.eql(accessToken);

			var parsedUrl = url.parse(call.args[0], true);
			expect(parsedUrl.host).to.eql(profileURL.host);
			expect(parsedUrl.pathname).to.eql(profileURL.pathname);
			expect(parsedUrl.query.method).to.eql('users.getCurrentUser');
			expect(parsedUrl.query.application_key).to.eql(clientSecret);
			expect(parsedUrl.query.sig).to.eql('7fe78b9f05339e85504da6bec3918431');
		});

		it('try to get with oauth error', function() {
			var errorData = {
				statusCode: 500,
				data: {}
			};

			getStub.yields(errorData);

			strategy.userProfile(accessToken, stub);

			var error = stub.firstCall.args[0];
			expect(error).to.be.a(InternalOAuthError);
			expect(error.message).to.eql('Failed to fetch user profile');
			expect(error.oauthError).to.eql(errorData);
		});

		it('try to get with invalid json', function() {
			getStub.yields(null, 'invalidjson');

			strategy.userProfile(accessToken, stub);

			var error = stub.firstCall.args[0];
			expect(error).to.be.an(errors.InvalidResponse);
		});

		it('check ok api error', function() {
			var errorData = {
				error_code: 123,
				error_msg: 'test msg'
			};

			getStub.yields(null, JSON.stringify(errorData));
			strategy.userProfile(accessToken, stub);

			var error = stub.firstCall.args[0];
			expect(error).to.be.an(errors.OkApiError);
			expect(error.errorCode).to.eql(errorData.error_code);
			expect(error.message).to.eql(errorData.error_msg);
		});

		it('check profile parsing', function() {
			var profileData = {
					uid: '2494A013S3EE',
					birthday: '1901-03-03',
					age: 110,
					first_name: 'Name',
					last_name: 'Surname',
					name: 'Name Surname',
					gender: 'male',
					has_email: true,
					pic_1: 'http://i113.odnoklassniki.ru/getImage?photoId=93412337&photoType=4',
					pic_2: 'http://i342.odnoklassniki.ru/getImage?photoId=93412337&photoType=2'
				},
				rawProfile = JSON.stringify(profileData);

			getStub.yields(null, rawProfile);
			strategy.userProfile(accessToken, stub);

			expect(stub.firstCall.args[0]).to.not.be.ok();

			var profile = stub.firstCall.args[1];
			expect(rawProfile).to.eql(profile._raw);
			expect(profileData).to.eql(profile._json);

			expect(profile.provider).to.eql('odnoklassniki');

			expect(profile.id).to.eql(profileData.uid);
			expect(profile.displayName).to.eql(profileData.name);
			expect(profile.name.familyName).to.eql(profileData.last_name);
			expect(profile.name.givenName).to.eql(profileData.first_name);
			expect(profile.gender).to.eql(profileData.gender);
			expect(profile.profileUrl)
				.to.eql('https://odnoklassniki.ru/profile/' + profile.id);
			expect(profile.emails).to.have.length(0);

			expect(profile.photos).to.have.length(2);
			expect(profile.photos[0].value).to.eql(profileData.pic_1);
			expect(profile.photos[1].value).to.eql(profileData.pic_2);
		});
	});

	describe('getting with fields', function() {
		var strategy,
			fields = ['first_name', 'last_name'];

		before(function() {
			strategy = helpers.createStrategy({
				profileFields: fields
			});
			helpers.passport.use(strategy);
		});

		after(function() {
			helpers.passport.restore();
		});

		it('check that fields in url', function() {
			var stub = sinon.stub(),
				getStub = sinon.stub(strategy._oauth2, 'get');

			strategy.userProfile('1234', stub);

			expect(getStub.called).to.be.ok();
			var call = getStub.firstCall;

			var parsedUrl = url.parse(call.args[0], true);
			expect(parsedUrl.query.fields).to.be.ok();
			expect(parsedUrl.query.fields).to.eql(fields.join(','));
		});
	});
});
