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
var dataService = __dataService;

var path = require('path');
var underscore = require("underscore");

var auth = require(__modules_path + '/auth');
var myPath = require(__modules_path + "/mypath");

var APPNAME = myPath.getAppName(__dirname);
var APPURL = "/" + APPNAME;

var model = require(__dirname + "/model");
var customerModel = require(__dirname + "/../../model")();


function inventoryController(app) {
    logger.enter();

    app.get(APPURL + "/list", auth.restrict, auth.acl(__FEATUREENUM.FP_INVENTORY_GOODS), getModifyInventoryBatchHandler);
}

module.exports = inventoryController;

function getModifyInventoryBatchHandler(req, res, next) {
    var paginator = customerModel.createGoodsPaginator(req);
    var customerDB = req.session.customer.customerDB;
    var goodTypeId = req.query.cbv || 0;

    dataService.commonData(req, function (data) {
        model.list(customerDB, paginator, goodTypeId, function (err, goodsList) {
            if (err) {
                logger.error(err);
                return next();
            }
            data['paginator'] = customerModel.restoreGoodsPaginator(paginator);
            data.goodsList = goodsList;
            data.handlerType = 'setInventory';
            res.render('customer/center/goods/inventorySet', {data: data});
        });
    });
}
