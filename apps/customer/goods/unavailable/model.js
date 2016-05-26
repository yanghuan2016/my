/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/
var logger = __logService;
var db = __dbService;
var dataService = __dataService;

var underscore = require("underscore");
var async = require("async");

var Paginator = require(__base + "/modules/paginator");
var myPath = require(__modules_path + "/mypath");

var MODELNAME = myPath.getModelName(__dirname);


function GoodsInventoryModel() {

}

GoodsInventoryModel.prototype.getGoodsList = function (customerDB, paginator, goodTypeId, callback) {
    dataService.getGoodsTypeDescendants(customerDB, goodTypeId, function (error, goodsTypeIds) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        db.listCustomerGoodsUnavailable(customerDB, goodsTypeIds, paginator, function (error, goods) {
            if (error) {
                logger.error(error);
                return callback(error);
            }
            callback(null, goods);
        });
    });
};

GoodsInventoryModel.prototype.postGoodsEnable = function(customerDB, goodsIds,callback){
    db.enableGoodsByIds(customerDB, goodsIds, function enableGoodsByIdsCallback(error, result) {
        callback(error,result);
    });
};



GoodsInventoryModel.prototype.checkGoodsPriceAndInventory = function (customerDB, goodsIds, callback) {
    async.mapSeries(goodsIds,
        function (goodsId, mapCallback) {
            db.getOldGoodsInventoryByIdNoConnect(customerDB, goodsId, function (error, results) {
                logger.ndump("results", results);
                if (error || results.length == 0) {
                    mapCallback('err');
                } else {
                    var result = results[0];
                    logger.ndump("result.wholesalePrice", result.wholesalePrice);
                    logger.ndump("result.wholesalePrice == 0", result.wholesalePrice == 0);
                    logger.ndump("result.refRetailPrice", result.refRetailPrice);
                    logger.ndump("result.refRetailPrice == 0", result.refRetailPrice == 0);
                    logger.ndump("result.price1", result.price1);
                    logger.ndump("result.price1 == 0", result.price1 == 0);
                    logger.ndump("result.price2", result.price2);
                    logger.ndump("result.price2 == 0", result.price2 == 0);
                    logger.ndump("result.price3", result.price3);
                    logger.ndump("result.price3 == 0", result.price3 == 0);
                    logger.ndump("result.actualAmount", result.actualAmount);
                    logger.ndump("result.actualAmount == 0", result.actualAmount == 0);
                    if (result.wholesalePrice == 0 || result.refRetailPrice == 0 || result.price1 == 0 || result.price2 == 0 || result.price3 == 0 || result.actualAmount == 0) {
                        mapCallback('err');
                    } else {
                        db.enableGoodsByIds(customerDB, goodsIds, function enableGoodsByIdsCallback(error, result) {
                            if (error) {
                                logger.sqlerr(error);
                                mapCallback(error);
                            }
                            mapCallback(null);
                        });
                    }
                }
            });
        }, function (errs, results) {
            if (errs) {
                logger.error(errs);
                callback(errs);
            } else {
                callback(null);
            }
        });
};

module.exports = new GoodsInventoryModel();

