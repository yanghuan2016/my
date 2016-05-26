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

GoodsInventoryModel.prototype.list = function (customerDB, paginator, goodTypeId, callback) {
    dataService.getGoodsTypeDescendants(customerDB, goodTypeId, function (error, goodsTypeIds) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        db.listCustomerGoodsAvailable(customerDB, goodsTypeIds, paginator, function (error, goods) {
            if (error) {
                logger.error(error);
                return callback(error);
            }
            callback(null, goods);
        });
    });
};

GoodsInventoryModel.prototype.putGoodsDisable = function(customerDB,goodsIds,callback){
    db.disableGoodsByIds(customerDB, goodsIds, function disableGoodsByIdsCallback(error, result) {
        callback(error,result);
    });
};

module.exports = new GoodsInventoryModel();

