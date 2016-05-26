'use strict';

var url = require('url');


var Authentication = require('./AuthenticationService');


module.exports.postAuthentication = function postAuthentication (req, res, next) {
    Authentication.postAuthentication(req, req.swagger.params, res, next);
};
