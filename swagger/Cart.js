'use strict';

var url = require('url');


var Cart = require('./CartService');


module.exports.deleteCart = function deleteCart (req, res, next) {
  Cart.deleteCart(req, req.swagger.params, res, next);
};

module.exports.getCartlist = function getCartlist (req, res, next) {
  Cart.getCartlist(req, req.swagger.params, res, next);
};

module.exports.patchCart = function patchCart (req, res, next) {
  Cart.patchCart(req, req.swagger.params, res, next);
};

module.exports.postCart = function postCart (req, res, next) {
  Cart.postCart(req, req.swagger.params, res, next);
};
