'use strict';

var url = require('url');


var Order = require('./OrderService');


module.exports.getOrderlist = function getOrderlist (req, res, next) {
  Order.getOrderlist(req.swagger.params, res, next);
};
