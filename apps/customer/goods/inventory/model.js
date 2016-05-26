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
var async = require("async");
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
        db.listCustomerGoods(customerDB, goodsTypeIds, paginator, function (error, goods) {
            if (error) {
                logger.error(error);
                return callback(error);
            }
            callback(null, goods);
        });
    });
};

module.exports = new GoodsInventoryModel();

