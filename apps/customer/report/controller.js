/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports = function (app) {
    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;
    var dataService = __dataService;

    /*
     * load 3rd party modules
     */
    var async = require('async');
    var path = require('path');
    var underscore = require("underscore");
    var formidable = require('formidable');
    var fs = require('fs');
    var strftime = require('strftime');
    var iconv = require('iconv-lite');

    /*
     * load project modules
     */
    var auth = require(__modules_path + '/auth');
    var myPath = require(__modules_path + "/mypath");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;

    /*
     * init app name etc
     */
    var APPNAME = myPath.getAppName(__dirname);
    var APPURL = "/" + APPNAME;

    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load model
     */

    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */

    /* 下载全部订单列表 */
    app.get(APPURL + "/orders", auth.restrict, downloadOrderXLS);
    /* 下载全部发货单列表 */
    app.get(APPURL + "/ships", auth.restrict, downloadShipXLS);
    /* 下载全部退货单列表 */
    app.get(APPURL + "/returns", auth.restrict, downloadReturnXLS);

    /**
     * 下载全部订单数据xls文件
     * @param req
     * @param res
     * @param next
     */
    function downloadOrderXLS(req, res, next) {
        logger.enter();
        var customerDBName = req.session.customer.customerDB;

        db.getReportOrder(customerDBName, function(err, orderData) {
            logger.trace("Loaded " + orderData.length + " orders in the report.");

            var filename = __report_path + "/" + (req.session.operator.customerId || "order") + strftime("_%Y%m%d%H%M%S.xls", new Date());
            var outStream = fs.createWriteStream(filename, {
                flags: 'w',
                defaultEncoding: 'binary'
            });
            outStream.on('finish', function(){
                // 写完文件后，开始下载
                logger.trace(filename + " is generated.");
                res.download(filename);
            });

            // 写表头
            outStream.write(iconv.encode(["订单号","时间","货号","品名","规格","生产厂家","单位","供价","数量","小计"].join('\t'), 'gbk').toString('binary') + '\r');
            // 写数据
            underscore.map(orderData, function(order){
                outStream.write(iconv.encode(underscore.values(order).join('\t'), 'gbk').toString('binary') + '\r');
            });
            // 写文件完毕
            outStream.end();
        });
    }

    function downloadShipXLS(req, res, next) {
        logger.enter();
        var customerDBName = req.session.customer.customerDB;

        db.getReportShip(customerDBName, function(err, shipData) {
            logger.trace("Loaded " + shipData.length + " ships in the report.");

            var filename = __report_path + "/" + (req.session.operator.customerId || "ship") + strftime("_%Y%m%d%H%M%S.xls", new Date());
            var outStream = fs.createWriteStream(filename, {
                flags: 'w',
                defaultEncoding: 'binary'
            });
            outStream.on('finish', function(){
                // 写完文件后，开始下载
                logger.trace(filename + " is generated.");
                res.download(filename);
            });

            // 写表头
            outStream.write(iconv.encode(["发货单号","发货日期","订单号","货号","通用名称","规格","生产厂家","单位","订单数量","发货数量","描述","发货人","物流信息","已收货","收货人"].join('\t'), 'gbk').toString('binary') + '\r');
            // 写数据
            underscore.map(shipData, function(ship){
                outStream.write(iconv.encode(underscore.values(ship).join('\t'), 'gbk').toString('binary') + '\r');
            });
            // 写文件完毕
            outStream.end();
        });
    }

    function downloadReturnXLS(req, res, next) {
        logger.enter();
        var customerDBName = req.session.customer.customerDB;

        db.getReportReturn(customerDBName, function(err, returnData) {
            logger.trace("Loaded " + returnData.length + " returns in the report.");

            var filename = __report_path + "/" + (req.session.operator.customerId || "return") + strftime("_%Y%m%d%H%M%S.xls", new Date());
            var outStream = fs.createWriteStream(filename, {
                flags: 'w',
                defaultEncoding: 'binary'
            });
            outStream.on('finish', function(){
                // 写完文件后，开始下载
                logger.trace(filename + " is generated.");
                res.download(filename);
            });

            // 写表头
            outStream.write(iconv.encode(["退货单号","申退日期","状态","审核日期","订单号","发货单号","客户名","货号","通用名称","规格","生产厂家","单位","退货数量"].join('\t'), 'gbk').toString('binary') + '\r');
            // 写数据
            underscore.map(returnData, function(ret){
                outStream.write(iconv.encode(underscore.values(ret).join('\t'), 'gbk').toString('binary') + '\r');
            });
            // 写文件完毕
            outStream.end();
        });
    }

};
