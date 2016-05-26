'use strict';

var url = require('url');


var Address = require('./AddressService');


module.exports.deleteAddressById = function deleteAddressById (req, res, next) {
  Address.deleteAddressById(req, req.swagger.params, res, next);
};

module.exports.getAddressById = function getAddressById (req, res, next) {
  Address.getAddressById(req, req.swagger.params, res, next);
};

module.exports.getAddressList = function getAddressList (req, res, next) {
  Address.getAddressList(req, req.swagger.params, res, next);
};

module.exports.postAddress = function postAddress (req, res, next) {
  Address.postAddress(req, req.swagger.params, res, next);
};

module.exports.putAddressById = function putAddressById (req, res, next) {
  Address.putAddressById(req, req.swagger.params, res, next);
};
