'use strict';

var url = require('url');


var Client = require('./ClientService');


module.exports.getClientById = function getClientById (req, res, next) {
  Client.getClientById(req, req.swagger.params, res, next);
};

module.exports.getClientList = function getClientList (req, res, next) {
  Client.getClientList(req, req.swagger.params, res, next);
};

module.exports.patchClientById = function patchClientById (req, res, next) {
  Client.patchClientById(req, req.swagger.params, res, next);
};

module.exports.postClient = function postClient (req, res, next) {
  Client.postClient(req, req.swagger.params, res, next);
};

module.exports.putClientById = function putClientById (req, res, next) {
  Client.putClientById(req, req.swagger.params, res, next);
};
