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

// scc modules:
var sccPath = require(modulesPath + '/mypath');

// initialize
var buyerPath = "/" + sccPath.getAppName(__dirname);
var FBCode = require(__modules_path + "/feedback").FBCode;
var Feedback = require(__modules_path + "/feedback").FeedBack;

//load module
var ApiModel = require("./model");
var model = new ApiModel();

module.exports = function (app) {
    
    // TODO Consolidate param validation in middleware
    // TODo Permission control


    //询价单列表（待报价列表）
    app.route(buyerPath + "/:enterpriseId/inquirySheets").get(getInquiriesHandler);
    /**
     * 读取询价单列表信息
     * @param req
     * @param res
     * @param next
     */
    function getInquiriesHandler(req, res, next) {
        // 解析参数
        var enterpriseId = req.params.enterpriseId;
        var page = req.query.page||1;
        var pageSize = req.query.pageSize||10;
        var startTime = req.query.startTime||"";
        var endTime = req.query.endTime||"";
        var keywords = req.query.keyword||"";

        var filter = {
            enterpriseId: enterpriseId,
            pageIndex: page,
            pageSize: pageSize,
            startTime: startTime,
            endTime: endTime,
            keywords: keywords
        }; 
        
        // call model to get data
        model.getBuyerInquirySheets(enterpriseId, filter, function(err, inquiryList){
            var feedback;
            if (err) {
                feedback = new Feedback(FBCode.DBFAILURE, "查询数据库出错, 错误:" + err);
            } else {
                var data = {
                    inquirySheets: inquiryList,
                    filter: filter
                };
                feedback = new Feedback(FBCode.SUCCESS, "查询成功", data);
            }
            res.json(feedback);
        });
    }

    //加载buyer询价单详情（待报价详情）
    app.route(buyerPath + "/:enterpriseId/inquiryDetails/:inquiryId")
        .get(getInquiryDetails);
    function getInquiryDetails(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var inquiryId = req.params.inquiryId;
        model.getBuyerInquiryDetails(enterpriseId,inquiryId,function(err,inquirySheets){
            logger.debug(JSON.stringify(inquirySheets));
            if(err){
                res.json(new Feedback(FBCode.DBFAILURE, "未搜索到报价信息",{}));
            }else{
                logger.debug(inquirySheets);
                var feedbackData = {
                    inquirySheets: inquirySheets
                };
                res.json(new Feedback(FBCode.SUCCESS, "成功搜索到detail信息!", feedbackData));
            }
        });
    }

    //加载已报价列表
    app.route(buyerPath + "/:enterpriseId/quotationSheets")
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
        var keywords = req.query.keyword||"";
        var filter = {
            pageIndex: page,
            pageSize: pageSize,
            startTime: startTime,
            endTime: endTime,
            keywords: keywords
        };
        model.getBuyerQuotationSheets(enterpriseId,filter,function(err,inquirySheets){
            if(err){
                res.json(new Feedback(FBCode.DBFAILURE, "未搜索到报价信息",{}));
            }else {
                logger.debug("buyer quotationSheets="+JSON.stringify(inquirySheets));
                var feedbackData = {
                    filter: filter,
                    quotationSheets: inquirySheets
                };
                res.json(new Feedback(FBCode.SUCCESS, "成功搜索到信息!", feedbackData));
            }
        });
    }
    //加载buyer已报价详情
    app.route(buyerPath + "/:enterpriseId/quotationDetails/:inquiryId")
        .get(getQuotationDetails);
    function getQuotationDetails(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var inquiryId = req.params.inquiryId;
        model.getBuyerQuotationDetails(enterpriseId,inquiryId,function(err,quotation){
            if(err){
                res.json(new Feedback(FBCode.DBFAILURE, "未搜索到报价信息",{}));
            }else{
                logger.debug(quotation);
                var feedbackData = {
                    quotationSheets: quotation
                };
                res.json(new Feedback(FBCode.SUCCESS, "成功搜索到报价信息!", feedbackData));
            }

        });
    }


    //订单列表
    app.route(buyerPath + '/:enterpriseId/orders/')
        .get(getOrdersHandler);

    function getOrdersHandler(req, res) {
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

        var filter = {
            enterpriseId: enterpriseId,
            pageIndex: page,
            pageSize: pageSize,
            startTime: startTime,
            endTime: endTime,
            keywords: keywords
        };

        model.getBuyerOrderList(enterpriseId,filter,function(err,result){
            var feedback=null,
                data={};
            if(err){
                feedback=new Feedback(FBCode.DBFAILURE,'查询失败',data);
            }else{
                data = {
                    orders: result,
                    filter: filter
                };
                feedback=new Feedback(FBCode.SUCCESS,'查询成功',data)
            }
            res.json(feedback);
        });
    }

    //订单详情
    app.route(buyerPath + '/:enterpriseId/order/:orderId')
        .get(getOrderHandler);
    function getOrderHandler(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var orderId = req.params.orderId;

        model.getBuyerOrderInfoByOrderId(enterpriseId,orderId,function(err,result){
            var feedback=null,
                data={};
            if(err){
                feedback=new Feedback(FBCode.DBFAILURE,'查询失败',data);
            }else{
                data=result[0];
                feedback=new Feedback(FBCode.SUCCESS,'查询成功',data)
            }
            res.json(feedback);
        });
    }

    // 发货
    app.route(buyerPath + '/:enterpriseId/orderShips/')
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
        var filter = {
            pageIndex: page,
            pageSize: pageSize,
            startTime: startTime,
            endTime: endTime,
            keywords: keywords
        };
        model.getBuyerShips(enterpriseId,filter,function(err,shipInfos){
            if(err){
                var feedback = new Feedback(FBCode.DBFAILURE, '查询失败', {});
                res.json(feedback);
            }else{
                logger.debug(JSON.stringify(shipInfos));
                var data = {
                    filter: filter,
                    orderShips: shipInfos
                };
                var feedback = new Feedback(FBCode.SUCCESS, '查询成功', data);
                res.json(feedback);
            }
        });
    }

    app.route(buyerPath + '/:enterpriseId/orderShip/:orderShipId')
        .get(getOrderShipHandler);
    function getOrderShipHandler(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var orderShipId = req.params.orderShipId;
        model.getBuyerShipDetailsById(enterpriseId,orderShipId,function(err,data){
            if(err){
                var feedback = new Feedback(FBCode.DBFAILURE, '查询失败', {});
                res.json(feedback);
            }else{
                data = {orderShip: data};
                var feedback = new Feedback(FBCode.SUCCESS, '查询成功', data);
                res.json(feedback);
            }
        });
    }

    // 退货列表
    app.route(buyerPath + '/:enterpriseId/orderShipReturns/')
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
        var filter = {
            page: page,
            pageSize: pageSize,
            startTime: startTime,
            endTime: endTime,
            keywords: keywords
        };

        model.getBuyerOrderReturnSheets(enterpriseId,filter,function(err,orderShipReturns){
            if(err){
                res.json(new Feedback(FBCode.DBFAILURE, "查询失败",{}));
            }else{
                var data = {
                    filter:filter,
                    orderShipReturns: orderShipReturns
                };
                var feedback = new Feedback(FBCode.SUCCESS, '查询成功', data);
                res.json(feedback);
            }
        });
    }

    //退货详情
    app.route(buyerPath + '/:enterpriseId/orderShipReturn/:orderShipReturnId')
        .get(getOrderShipReturnHandler);
    function getOrderShipReturnHandler(req, res) {
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId)) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var orderShipReturnId = req.params.orderShipReturnId;

        model.getBuyerOrderReturnDetails(enterpriseId,orderShipReturnId,function(err,orderShipReturn){
            if(err){
                res.json(new Feedback(FBCode.DBFAILURE, "查询失败",{}));
            }else{
                var data = {
                    orderShipReturn: orderShipReturn
                };
                var feedback = new Feedback(FBCode.SUCCESS, '查询成功', data);
                res.json(feedback);
            }
        });
    }
};


