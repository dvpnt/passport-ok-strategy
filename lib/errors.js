'use strict';

var util = require('util');

exports.OkApiError = OkApiError;

function OkApiError(params) {
	this.errorCode = params.error_code;
	this.message = params.error_msg;
}

util.inherits(OkApiError, Error);

exports.InvalidResponse = InvalidResponse;

function InvalidResponse() {
	this.message = 'Can\'t parse reponse data';
}

util.inherits(InvalidResponse, Error);

