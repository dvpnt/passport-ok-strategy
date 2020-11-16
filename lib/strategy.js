'use strict';

var crypto = require('crypto'),
	errors = require('./errors'),
	OAuth2Strategy = require('passport-oauth2'),
	profile = require('./profile'),
	url = require('url'),
	InternalOAuthError = require('passport-oauth2').InternalOAuthError,
	util = require('util');

/**
 * `Strategy` constructor.
 *
 * The Odnoklassniki authentication strategy authenticates requests by delegating to
 * Odnoklassniki using the OAuth 2.0 protocol.
 *
 * Options:
 *   - `clientID`      Application Id
 *   - `clientSecret`  Application secret key
 *   - `clientPublic`  Application public key
 *   - `callbackURL`   URL to which Odnoklassniki will redirect the user after granting authorization
 *   - `profileURL`    Url to retrieve profile information
 *   - `profileFields` Fields that should be retrieved from Odnoklassniki
 *
 * Examples:
 *
 *     passport.use(new OdnoklassnikiStrategy({
 *         clientID: '213dsal',
 *         clientSecret: 'private-key'
 *         clientPublic: 'public-key'
 *         callbackURL: 'https://www.example.net/oauth/odnoklassniki/callback'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
var Strategy = function(options, verify) {
	if (!options.clientPublic) {
		throw new Error('Odnoklassniki\'s implementation of OAuth2.0 requires ' +
				'a clientPublic option');
	}

	options.authorizationURL = options.authorizationURL ||
		'https://connect.ok.ru/oauth/authorize';
	options.tokenURL = options.tokenURL ||
		'https://api.ok.ru/oauth/token.do';
	options.scopeSeparator = options.scopeSeparator || ';';

	OAuth2Strategy.call(this, options, verify);

	this.name = 'odnoklassniki';

	this._clientPublic = options.clientPublic;
	this._profileURL = options.profileURL || 'https://api.ok.ru/fb.do';
	this._profileFields = options.profileFields;
};

util.inherits(Strategy, OAuth2Strategy);

/**
 * Return extra Odnoklassniki-specific parameters to be included in the authorization
 * request.
 *
 * Options:
 *	- `layout`	Display mode to render dialog, { `w`, `m`, `a` }.
 *
 * @param {Object} options
 * @return {Object}
 * @api protected
 */
Strategy.prototype.authorizationParams = function(options) {
	var params = {};

	if (options.layout) {
		params.layout = options.layout;
	}

	return params;
};

/**
 * Make Odnoklassniki request sign-string
 *
 * @param {string} accessToken
 * @param {string} method
 * @param {object} request query params
 * @access private
 */
Strategy.prototype._makeSig = function(accessToken, method, params) {
	var makeHash = function(message) {
		return crypto.createHash('md5').update(message, 'utf8').digest('hex');
	};

	var queryParams = {
		application_key: this._clientPublic,
		method: method
	};

	Object.keys(params).forEach(function(key) {
		if (typeof params[key] !== 'undefined') {
			queryParams[key] = params[key];
		}
	});

	var sigString = Object.keys(queryParams).map(function(key) {
		return key + '=' + queryParams[key];
	}).sort().join('');

	return makeHash(
		sigString + makeHash(accessToken + this._oauth2._clientSecret)
	);
};

/**
 * Retrieve user profile from Odnoklassniki.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `odnoklassniki`
 *   - `id`               the user's uid
 *   - `displayName`      the user's name
 *   - `name.familyName`  the user's last_name
 *   - `name.givenName`   the user's first_name
 *   - `gender`           the user's gender: `male` or `female`
 *   - `profileUrl`       the URL of the profile for the user on Odnoklassniki
 *   - `emails`           the proxied or contact email address granted by the user
 *   - `photos`           the list of all pic* fields in Odnoklassniki profile
 *
 * @param {string} accessToken
 * @param {function} done
 * @access public
 */
Strategy.prototype.userProfile = function(accessToken, done) {
	var profileURL = url.parse(this._profileURL),
		profileFields = this._profileFields && this._profileFields.join(','),
		sig = this._makeSig(
			accessToken,
			'users.getCurrentUser',
			{fields: profileFields}
		),
		params = {
			method: 'users.getCurrentUser',
			application_key: this._clientPublic,
			sig: sig
		};

	if (profileFields) {
		params.fields = profileFields;
	}

	profileURL.query = params;

	this._oauth2.get(url.format(profileURL), accessToken, function(err, body) {
		if (err) {
			return done(new InternalOAuthError('Failed to fetch user profile', err));
		}

		try {
			var json = JSON.parse(body);
		} catch (e) {
			return done(new errors.InvalidResponse());
		}

		if (json.error_code) {
			return done(new errors.OkApiError(json));
		}

		var resultProfile = profile.parse(json);

		resultProfile.provider = 'odnoklassniki';
		resultProfile._raw = body;
		resultProfile._json = json;

		done(null, resultProfile);
	});
};

module.exports = Strategy;

