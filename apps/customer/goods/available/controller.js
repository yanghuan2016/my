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
var feedback = require(__modules_path + "/feedback");
var FBCode = feedback.FBCode;
var FeedBack = feedback.FeedBack;

var APPNAME = myPath.getAppName(__dirname);
var APPURL = "/" + APPNAME;

var model = require(__dirname + "/model");
var customerModel = require(__dirname + "/../../model")();


function enabledController(app) {
    logger.enter();

    app.get(APPURL + "/list", auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_GOODS, __FEATUREENUM.FP_SALE_GOODS, __FEATUREENUM.FP_PRICE_GOODS,
                  __FEATUREENUM.FP_INVENTORY_GOODS, __FEATUREENUM.FP_NEW_GOODS]),
        getGoodsListHandler);
    app.post(APPURL + "/disableGoods", auth.restrict,
        auth.acl([__FEATUREENUM.FP_SALE_GOODS]),
        postDisableGoodsHandler);

}

module.exports = enabledController;

function getGoodsListHandler(req, res, next) {
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
            data.handlerType = 'available';

            res.render('customer/center/goods/available', {data: data});
        });
    });
}

function postDisableGoodsHandler(req, res) {
    logger.enter();

    var goodsIds = req.body.goodsIds;
    var customerDB = req.session.customer.customerDB;
    model.putGoodsDisable(customerDB,goodsIds,function(error,result){
        if (error) {
            logger.sqlerr(error);
            return res.json(new FeedBack(FBCode.DBFAILURE, "数据库开小差了,请稍后再试." + error.code));
        }
        res.json(new FeedBack(FBCode.SUCCESS, "下架成功", {goodsIds: goodsIds, result: result}));
    });
}