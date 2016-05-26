'use strict';

var url = require('url');


var Goods = require('./GoodsService');


module.exports.deleteCommonGoodsById = function deleteCommonGoodsById (req, res, next) {
  Goods.deleteCommonGoodsById(req.swagger.params, res, next);
};

module.exports.getCommonGoodsById = function getCommonGoodsById (req, res, next) {
  Goods.getCommonGoodsById(req.swagger.params, res, next);
};

module.exports.getDrugTypeList = function getDrugTypeList (req, res, next) {
  Goods.getDrugTypeList(req.swagger.params, res, next);
};

module.exports.getGoodsById = function getGoodsById (req, res, next) {
  Goods.getGoodsById(req.swagger.params, res, next);
};

module.exports.getGoodsInventoryPlans = function getGoodsInventoryPlans (req, res, next) {
  Goods.getGoodsInventoryPlans(req.swagger.params, res, next);
};

module.exports.getGoodsTypes = function getGoodsTypes (req, res, next) {
  Goods.getGoodsTypes(req.swagger.params, res, next);
};

module.exports.getListPackUnit = function getListPackUnit (req, res, next) {
  Goods.getListPackUnit(req.swagger.params, res, next);
};

module.exports.managerGoodsGET = function managerGoodsGET (req, res, next) {
  Goods.managerGoodsGET(req.swagger.params, res, next);
};

module.exports.managerGoodsGoodsIdCheckGET = function managerGoodsGoodsIdCheckGET (req, res, next) {
  Goods.managerGoodsGoodsIdCheckGET(req.swagger.params, res, next);
};

module.exports.managerGoodsGoodsIdCheckPOST = function managerGoodsGoodsIdCheckPOST (req, res, next) {
  Goods.managerGoodsGoodsIdCheckPOST(req.swagger.params, res, next);
};

module.exports.managerGoodsGoodsIdPUT = function managerGoodsGoodsIdPUT (req, res, next) {
  Goods.managerGoodsGoodsIdPUT(req.swagger.params, res, next);
};

module.exports.managerGoodsGoodsIdPay_typePOST = function managerGoodsGoodsIdPay_typePOST (req, res, next) {
  Goods.managerGoodsGoodsIdPay_typePOST(req.swagger.params, res, next);
};

module.exports.managerGoodsPOST = function managerGoodsPOST (req, res, next) {
  Goods.managerGoodsPOST(req.swagger.params, res, next);
};

module.exports.postGoods = function postGoods (req, res, next) {
  Goods.postGoods(req.swagger.params, res, next);
};

module.exports.postGoodsById = function postGoodsById (req, res, next) {
  Goods.postGoodsById(req.swagger.params, res, next);
};

module.exports.postGoodsQuotaion = function postGoodsQuotaion (req, res, next) {
  Goods.postGoodsQuotaion(req.swagger.params, res, next);
};
