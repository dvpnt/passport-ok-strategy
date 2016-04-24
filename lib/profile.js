'use strict';

/**
 * Parse profile.
 *
 * @param {object|string} json
 * @return {object}
 * @access public
 */
exports.parse = function profileParser(json) {
	var profile = {};

	profile.id = json.uid;
	profile.displayName = json.name;
	profile.name = {
		familyName: json.last_name,
		givenName: json.first_name
	};

	profile.gender = json.gender;
	profile.profileUrl = 'https://odnoklassniki.ru/profile/' + profile.id;
	profile.emails = [];

	profile.photos = [];

	Object.keys(json).forEach(function(key) {
		if (key.startsWith('pic')) {
			profile.photos.push({
				value: json[key]
			});
		}
	});

	return profile;
};
