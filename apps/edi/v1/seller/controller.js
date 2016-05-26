/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

// global variables:
var modulesPath = __modules_path;
var logger = __logService;

// third modules:
var path = require("path");
var _ = require('lodash');
var moment = require("moment");

// scc modules:
var sccPath = require(modulesPath + '/mypath');

// initialize
var sellerPath = "/" + sccPath.getAppName(__dirname);
var FBCode = require(__modules_path + "/feedback").FBCode;
var Feedback = require(__modules_path + "/feedback").FeedBack;
//load module
var ApiModel = require("./model");
var model = new ApiModel();


module.exports = function (app) {

    // 订单
    app.route(sellerPath + '/:enterpriseId/orders/')
        .get(getOrdersHandler);
    function getOrdersHandler(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var page = req.query.page;
        var pageSize = req.query.pageSize;
        var startTime = req.query.startTime;
        var endTime = req.query.endTime;
        var keywords = req.query.keyword;


        var filter = {
            pageIndex: page||1,
            pageSize: pageSize||10,
            startTime: startTime||"",
            endTime: endTime||"",
            keywords: keywords||""
        };
        model.getSellerOrderList(enterpriseId,filter,function(err,result){
            var feedback=null,
                data={};
            if(err){
                logger.error(err);
                feedback=new Feedback(FBCode.DBFAILURE,'查询失败',data);
            }else{
                data=result;
                feedback=new Feedback(FBCode.SUCCESS,'查询成功',data);
            }
            res.json(feedback);
        });
    }
    //订单详情
    app.route(sellerPath + '/:enterpriseId/order/:orderId')
        .get(getOrderHandler);
    function getOrderHandler(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var orderId = req.params.orderId;
        model.getSellerOrderInfoByOrderId(enterpriseId,orderId,function(err,result){
            var feedback=null,
                data={};
            if(err){
                logger.error(err);
                feedback=new Feedback(FBCode.DBFAILURE,'查询失败',data);
            }else{
                data=result;
                feedback=new Feedback(FBCode.SUCCESS,'查询成功',data);
            }
            res.json(feedback);
        });
    }

    // 发货
    app.route(sellerPath + '/:enterpriseId/orderShips/')
        .get(getOrderShipsHandler);
    function getOrderShipsHandler(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var page = req.query.page||1;
        var pageSize = req.query.pageSize||10;
        var startTime = req.query.startTime||"";
        var endTime = req.query.endTime||"";
        var keywords = req.query.keyword||"";
        var page = req.query.page||1;
        var pageSize = req.query.pageSize||10;
        var startTime = req.query.startTime||"";
        var endTime = req.query.endTime||"";
        var keywords = req.query.keyword||"";
        var filter = {
            pageIndex: page,
            pageSize: pageSize,
            startTime: startTime,
            endTime: endTime,
            keywords: keywords
        };
        model.getSellerShips(enterpriseId,filter,function(err,shipInfos){
            if(err){
                var feedback = new Feedback(FBCode.DBFAILURE, '查询失败', {});
                res.json(feedback);
            }else{
                logger.debug(JSON.stringify(shipInfos));
                var feedbackData = {
                    filter: filter,
                    orderShips: shipInfos
                };
                var feedback = new Feedback(FBCode.SUCCESS, '查询成功', feedbackData);
                res.json(feedback);
            }
        });
    }
    //发货详情
    app.route(sellerPath + '/:enterpriseId/orderShip/:orderShipId')
        .get(getOrderShipHandler);
    function getOrderShipHandler(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var orderShipId = req.params.orderShipId;
        model.getSellerShipDetailsById(enterpriseId,orderShipId,function(err,data){
            if(err){
                var feedback = new Feedback(FBCode.DBFAILURE, '查询失败', {});
                res.json(feedback);
            }else{
                var feedback = new Feedback(FBCode.SUCCESS, '查询成功', data);
                res.json(feedback);
            }
        });

    }

    // 退货
    app.route(sellerPath + '/:enterpriseId/orderShipReturns/')
        .get(getOrderShipReturnsHandler);
    function getOrderShipReturnsHandler(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var page = req.query.page;
        var pageSize = req.query.pageSize;
        var startTime = req.query.startTime;
        var endTime = req.query.endTime;
        var keywords = req.query.keywords;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 20;
        startTime = moment(new Date(startTime)).format("YYYY-MM-DD HH:mm:ss");
        endTime = moment(new Date(endTime)).format("YYYY-MM-DD HH:mm:ss");
        var filter = {
            page: page,
            pageSize: pageSize,
            startTime: startTime,
            endTime: endTime,
            keywords: keywords
        };

        model.retrieveOrderShipReturns(enterpriseId, filter, function (error, orderShipReturns) {
            if (error) {
                logger.error(error);
                return  res.json(new Feedback(FBCode.DBFAILURE, "链接服务器失败,请稍后再试.", {filter: filter}));
            }

            var feedbackData = {
                filter: filter,
                orderShipReturns: orderShipReturns
            };
            var feedback = new Feedback(FBCode.SUCCESS, '查询成功', feedbackData);
            res.json(feedback);
        });
    }
    //退货详情
    app.route(sellerPath + '/:enterpriseId/orderShipReturn/:orderShipReturnId')
        .get(getOrderShipReturnHandler);
    function getOrderShipReturnHandler(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var orderShipReturnId = req.params.orderShipReturnId;

        model.retrieveOrderShipReturnByReturnGuid(enterpriseId, orderShipReturnId, function (error, orderShipReturns) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            if (orderShipReturns.length === 0) {
                return res.json(new Feedback(FBCode.NOTFOUND, "没有找到数据,请重试."));
            }

            var data = {orderShipReturns: orderShipReturns[0]};
            var feedback = new Feedback(FBCode.SUCCESS, '查询成功', data);
            res.json(feedback);

        });
    }
    //询价单列表（待报价列表）
    app.route(sellerPath + "/:enterpriseId/inquirySheets")
        .get(getInquirySheets);
    function getInquirySheets(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var page = req.query.page||1;
        var pageSize = req.query.pageSize||10;
        var startTime = req.query.startTime||"";
        var endTime = req.query.endTime||"";
        var keywords = req.query.keywords||"";
        var filter = {
            pageIndex: page,
            pageSize: pageSize,
            startTime: startTime,
            endTime: endTime,
            keywords: keywords
        };
        model.getSellerInquirySheetes(enterpriseId,filter,function(err,inquirySheets){
            var feedbackData = {
                filter: filter,
                inquirySheets: inquirySheets
            };
            res.json(new Feedback(FBCode.SUCCESS, "成功搜索到信息!", feedbackData));
        });
    }

    //加载seller待报价详情信息
    app.route(sellerPath + "/:enterpriseId/inquiryDetails/:inquiryId")
        .get(getInquiryDetails);
    function getInquiryDetails(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var inquiryId = req.params.inquiryId;
        model.getSellerInquiryDetails(enterpriseId,inquiryId,function(err,inquirySheets){
            if(err){
                res.json(new Feedback(FBCode.DBFAILURE, "未搜索到报价信息",{}));
            }else{
                logger.debug(JSON.stringify(inquirySheets));
                var feedbackData = {
                    inquirySheets: inquirySheets[0]
                };
                res.json(new Feedback(FBCode.SUCCESS, "成功搜索到detail信息!", feedbackData));
            }
        });
    }

    //加载报价列表(已报价)
    app.route(sellerPath + "/:enterpriseId/quotationSheets")
        .get(getQuotationSheets);
    function getQuotationSheets(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var page = req.query.page||1;
        var pageSize = req.query.pageSize||10;
        var startTime = req.query.startTime||"";
        var endTime = req.query.endTime||"";
        var keywords = req.query.keywords||"";
        var filter = {
            pageIndex: page,
            pageSize: pageSize,
            startTime: startTime,
            endTime: endTime,
            keywords: keywords
        };
        model.getSellerQuotationSheets(enterpriseId,filter,function(err,inquirySheets){
            if(err){
                res.json(new Feedback(FBCode.DBFAILURE, "未搜索到报价信息",{}));
            }else {
                logger.debug(JSON.stringify(inquirySheets));
                var feedbackData = {
                    filter: filter,
                    quotationSheets: inquirySheets
                };
                res.json(new Feedback(FBCode.SUCCESS, "成功搜索到信息!", feedbackData));
            }
        });
    }
    //加载seller已报价信息
    app.route(sellerPath + "/:enterpriseId/quotationDetails/:inquiryId")
        .get(getQuotationDetails);
    function getQuotationDetails(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var inquiryId = req.params.inquiryId;
        model.getSellerQuotationDetails(enterpriseId,inquiryId,function(err,quotation){
            if(err){
                res.json(new Feedback(FBCode.DBFAILURE, "未搜索到报价信息",{}));
            }else{
                logger.debug(JSON.stringify(quotation));
                var feedbackData = {
                    quotationSheets: quotation
                };
                res.json(new Feedback(FBCode.SUCCESS, "成功搜索到报价信息!", feedbackData));
            }

        });
    }

    //seller提交报价数据
    app.route(sellerPath + "/:enterpriseId/quotation")
        .post(postQuotation);
    function postQuotation(req, res) {
        var enterpriseId = Number(req.params.enterpriseId); //报价企业的enterprseId
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var quotations = req.body;
        logger.debug("post seller quotations =" +JSON.stringify(quotations));
        model.postSellerQuotation(enterpriseId,quotations,function(err,results){
            if(err){
                res.json(new Feedback(FBCode.DBFAILURE, '', {}));
            }else{
                var data = {quotation: quotations};
                res.json(new Feedback(FBCode.SUCCESS, '', data));
            }
        });

    }
};
