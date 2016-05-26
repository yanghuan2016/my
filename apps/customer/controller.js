/**
 * Created by dialox on 2015/9/24.
 */
/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * cart/controller.js
 *
 * --------------------------------------------------------------
 * 2015-09-18	zp-romens@sro-doc-17#17	完成产品页面上购物车增减功能的响应
 *
 */


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
    var path = require('path');
    var underscore = require("underscore");
    var formidable = require('formidable');
    var fs = require('fs');
    var strftime = require('strftime');
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var moment = require('moment');
    var repotsModel = require(__base + "/apps/reports/model")();
    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var pinyin = require(__modules_path + "/pinyin");
    /*
     * init app name etc
     */
    var APPNAME = __dirname.split(path.sep).pop();
    var APPURL = "/" + APPNAME;
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load module
     */

    var model = require(__dirname + "/model")();
    var orderModel = require(__base + "/apps/order/model")();
    var message = require(__modules_path + "/message");
    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */
    //todo uncomplete 促销管理
    app.get(APPURL + "/promotions", auth.restrict, getPromotionHandler);
    /**
     * todo 促销管理
     *
     * @param req
     * @param res
     */
    function getPromotionHandler(req, res) {
        logger.enter();
        dataService.commonData(req, function (data) {
            var product = [
                {
                    factory: '哈药集团',
                    starttimes: '2015-02-15',
                    endtimes: '2015-02-16',
                    name: '同仁堂大药房',
                    value: '3498.1',
                    status: '已生效',
                    startsecond: '10:05:20',
                    endsecond: '10:05:20'
                },
                {
                    factory: '云南白药集团',
                    starttimes: '2015-02-15',
                    endtimes: '2015-02-16',
                    name: '安吉大药房',
                    value: '3498.1',
                    status: '已生效',
                    startsecond: '10:05:20',
                    endsecond: '10:05:20'
                },
                {
                    factory: '哈药集团',
                    starttimes: '2015-02-15',
                    endtimes: '2015-02-16',
                    name: '仁康大药房',
                    value: '3498.1',
                    status: '已生效',
                    startsecond: '10:05:20',
                    endsecond: '10:05:20'
                },
                {
                    factory: '哈药集团',
                    starttimes: '2015-02-15',
                    endtimes: '2015-02-16',
                    name: '同仁堂大药房',
                    value: '3498.1',
                    status: '已生效',
                    startsecond: '10:05:20',
                    endsecond: '10:05:20'
                },
                {
                    factory: '哈药集团',
                    starttimes: '2015-02-15',
                    endtimes: '2015-02-16',
                    name: '安吉大药房',
                    value: '3498.1',
                    status: '未生效',
                    startsecond: '10:05:20',
                    endsecond: '10:05:20'
                },
                {
                    factory: '哈药集团',
                    starttimes: '2015-02-15',
                    endtimes: '2015-02-16',
                    name: '仁康堂大药房',
                    value: '3498.1',
                    status: '已生效',
                    startsecond: '10:05:20',
                    endsecond: '10:05:20'
                },

            ];
            res.render('customer/center/promotions', {data: data, product: product})
        });
    }

    //投诉管理
    app.get(APPURL + "/complaints", auth.restrict, getCustomerComplaintsListHandler);
    /**
     * show complaint list
     * @param req
     * @param res
     * @param next
     */
    function getCustomerComplaintsListHandler(req, res, next) {
        var clientCodeOrName = req.query.clientCodeOrName || "";
        dataService.commonData(req, function (data) {
            data.clientCodeOrName = clientCodeOrName; //客户编号或者客户名字
            var dbName = req.session.customer.customerDB;
            model.getComplainList(dbName, clientCodeOrName, function(err,result){
                if (err) {
                    logger.error(err);
                    return next();
                }
                data.comlainsList = result;
                res.render('customer/center/complain/complaintsList', {data: data});
            });
        });
    }

    app.get(APPURL, auth.restrict, getCustomerCenterHandler);
    /**
     * customer 个人中心
     * @param req
     * @param res
     */
    function getCustomerCenterHandler(req, res) {
        logger.enter();
        var customerId = req.session.customer.customerId;
        dataService.commonData(req, function (data) {
            model.getCustomerCenter(customerId, function (err, results) {
                data.customerData = results;
                var dbName = req.session.customer.customerDB;
                var operator = req.session.operator;
                var paginator = {
                    pageSize: 6,
                    page: 1
                };
                model.getCustomerMessage(dbName, operator, paginator, function (err, results) {
                    if (err) {
                        logger.error(err);
                        res.render("error/500", {data: data})
                    } else {
                        data.messages = results;
                        logger.debug("msgs=" + JSON.stringify(data.messages));
                        res.render('customer/center/customer', {data: data});
                    }
                });
            });
        })
    }

    app.get(APPURL + "/message/read", auth.restrict,getNotificationReadHandler );
    /**
     * sign read and redirect to
     * @param req
     * @param res
     */
    function getNotificationReadHandler(req,res){
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var operator = req.session.operator;
        var docType = req.query.docType;
        var docId = req.query.docId;
        var msgId = Number(req.query.msgId);
        model.setNotificationRead(dbName,operator,msgId,docType,docId,function(err,redirectUrl){
            if(err){
                logger.error(err);
                res.render("error/500");
            }else{
                logger.debug("redirect Url = "+ redirectUrl);
                res.redirect(redirectUrl);
            }
        })
    }

    app.get(APPURL + "/message", auth.restrict,getNotificationHandler );
    /**
     * customer 通知中心
     * @param req
     * @param res
     */
    function getNotificationHandler(req,res){
        logger.enter();
        dataService.commonData(req, function (data) {
            var dbName = req.session.customer.customerDB;
            var operator = req.session.operator;
            var paginator=model.createMessagesPaginator(req);
            model.getCustomerMessage(dbName,operator,paginator,function(err,results){
                if(err){
                    logger.error(err);
                    res.render("error/500",{data: data})
                }else{
                    data.messages = results;
                    data['paginator'] = model.restoreMessagesPaginator(paginator);
                    logger.debug("msgs="+JSON.stringify(data.messages));
                    res.render('customer/center/Message/MessageCenter',{data: data} )
                }
            });

        })
    }

    app.get(APPURL + "/certainClientCom", auth.restrict, getSingleClientComplaintsHandler);
    /**
     * one client Complaint
     * 特定用户的投诉管理页面
     * @param req
     * @param res
     * @param next
     */
    function getSingleClientComplaintsHandler(req, res, next) {
        var clientId = req.query.clientId;
        var hasBeenRead = req.query.hasBeenRead;//0 没有读
        var dbName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getSingleClientComplaint(dbName,clientId,hasBeenRead,function(err,result){
                if(err){
                    res.render("error/500");
                }else{
                    data.complains = result;
                    res.render('customer/center/complain/singleComplain', {data: data});
                }
            });
        });
    }

    app.post(APPURL + "/replyComplaints", auth.restrict, replyClientHandler);
    /**
     * customer 回复用户 投诉建议
     * @param req
     * @param res
     */
    function replyClientHandler(req, res) {
        var clientId = req.body.clientId;
        var content = req.body.content;
        var operatorId;
        var type = "DOWN";
        var dbName = req.session.customer.customerDB;
        model.postReplyClient(dbName,clientId,operatorId,type,content,function(err,result){
            if (err) {
                logger.error(err);
                res.json(new FeedBack(FBCode.DBFAILURE, '内部错误'));
            }else{
                res.json(new FeedBack(FBCode.SUCCESS, '发送成功'))
            }
        });
    }

    app.get(APPURL + "/settlement", auth.restrict, getSettlementCustomerHandler);
    /**
     * 结算管理
     * @param req
     * @param res
     */
    function getSettlementCustomerHandler(req, res) {
        logger.enter();
        var beginDate = req.query.startDate || "";
        var endDate = req.query.endDate || "";
        var fuzzyCondition = req.query.fuzzyCondition || "";//可能是发货单 订单号 客户名
        var status = req.query.status || "ALL";
        var pageData = {
            beginDate: beginDate,
            endDate: endDate,
            fuzzyCondition: fuzzyCondition,
            status: status
        };
        dataService.commonData(req, function (data) {
            data.pageData = pageData;
            data.clearingDetailsList = null;
            if (beginDate != "") {
                beginDate = moment(beginDate);
                if (!beginDate.isValid()) {
                    res.render('err/500');
                    return;
                }
                // Set beginDate to YYYY-MM-DD 00:00:00 and endDate to the time 00:00:00 on the next day
                beginDate.hour(0);
                beginDate.minute(0);
                beginDate.second(0);
            }
            if (endDate != "") {
                endDate = moment(endDate);
                if (!endDate.isValid()) {
                    res.render('err/500');
                    return;
                }
                // Set beginDate to YYYY-MM-DD 00:00:00 and endDate to the time 00:00:00 on the next day
                endDate.add(1, 'days');
                endDate.hour(0);
                endDate.minute(0);
                endDate.second(0);
            }
            var customerDBName = req.session.customer.customerDB;
            var searchStatus;
            if (status == 'ALL') {
                status = '%';
            }
            repotsModel.getClearingDetails(
                customerDBName,
                fuzzyCondition,
                beginDate != "" ? beginDate.format("YYYY-MM-DD HH:mm:ss") : "2000-01-01 00:00:00",
                endDate != "" ? endDate.format("YYYY-MM-DD HH:mm:ss") : "2100-01-01 00:00:00",
                status,
                function (err, result) {
                    if (err) {
                        res.render('res/500');
                        return;
                    }
                    data.clearingDetailsList = result;
                    logger.ndump('result', result);
                    res.render('customer/center/bill/settlement_manage', {data: data});
                }
            );

        });

    }

    app.post(APPURL + "/details/cleared", auth.restrict, setClearedHandler);
    /**
     * 结算管理 post数据
     * @param req
     * @param res
     * @param next
     */
    function setClearedHandler(req, res, next) {
        logger.enter();
        var clearingDetailId = req.body.clearingDetailId;
        var customerDBName = req.session.customer.customerDB;
        model.putClearDetails(customerDBName, clearingDetailId, function(err,result){
            if (err) {
                res.json(new FeedBack(FBCode.DBFAILURE, err))
            } else {
                res.json(new FeedBack(FBCode.SUCCESS));
            }
        });
    }

    app.post(APPURL + "/return/close", auth.restrict, auth.validateReq, postCloseReturnHandler);
    /**
     * set return close or cancle
     * @param req
     * @param res
     */
    function postCloseReturnHandler(req, res) {
        logger.enter();
        var returnData = req.body;
        var returnId = returnData.returnId;
        var customerDB = req.session.customer.customerDB;
        var operatorDataId = req.session.operator.operatorId;
        var fb;
        orderModel.closeReturnInfo(customerDB, returnId, 'CLOSED', operatorDataId, function (err, affectedResult) {
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS, "退货单已关闭", {results: affectedResult});
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "退货单关闭失败" + err.code);
            }
            res.json(fb)
        });
    }

    app.get(APPURL+"/getUnreadMessageCounts",getUnreadMessageCountsHandler);
    /**
     * 商户端获取 未读消息条数
     * @param req
     * @param res
     */
    function getUnreadMessageCountsHandler(req,res){
        var operatorData=req.session.operator,
            operatorId=operatorData.operatorId,
            operatorRoles=operatorData.operatorRoles,
            customerDB = req.session.customer.customerDB,
            feedback=null;
        model.getCustomerUnreadMessageCounts(customerDB,operatorId,operatorRoles,function(err,result){
            if(err){
                logger.error(err);
                feedback=new FeedBack(FBCode.INVALIDDATA,'内部错误');
            }else{
                feedback=new FeedBack(FBCode.SUCCESS,'查询成功',result);
            }
            res.json(feedback);
        });
    }

    app.get(APPURL + "/password", auth.restrict, getChangePwdHandler);
    /**
     * 加载商户修改密码页面
     * @param req
     * @param res
     */
    function getChangePwdHandler(req, res) {
        logger.enter();
        dataService.commonData(req, function (data) {
            res.render('customer/center/ChangePwd', {data: data});
        });
    }


    app.post(APPURL + "/password/modify", auth.restrict, auth.validateReq, postChangePwdHandler);  //密码修改提交
    //密码修改提交
    function postChangePwdHandler(req, res) {
        logger.enter();
        var passwordData = req.body;
        var customerDB = req.session.customer.customerDB;
        var operatorId = req.session.operator.operatorId;//当前session的operator Data
        logger.debug(JSON.stringify(passwordData));
        model.changePwd(customerDB, operatorId, passwordData, function (ret, result) {
            switch (ret) {
                case FBCode.SUCCESS:
                    return res.json(new FeedBack(FBCode.SUCCESS, "修改密码成功"));
                case FBCode.LOGINFAILURE:
                    return res.json(new FeedBack(FBCode.LOGINFAILURE, "旧密码不正确，请重新输入"));
                default:
                    return res.json(new FeedBack(ret, "修改密码失败，原因:" + result.tostring()));
            }
        });
    }

    //商品管理相关API
    app.get(APPURL + "/product", auth.restrict, getProductHandler);
    /**
     *  商品管理
     * @param req
     * @param res
     */
    function getProductHandler(req, res) {
        logger.enter();
        var selectedGoodsTypeId = Number(req.query.cbv || 0);
        var customerDB = req.session.customer.customerDB;
        var paginator = model.createGoodsPaginator(req);
        dataService.commonData(req, function (data) {
            model.getCustomerGoods(customerDB,selectedGoodsTypeId,paginator,function(err,product){
                if(err){
                    res.render("error/500");
                }else{
                    data['paginator'] = model.restoreGoodsPaginator(paginator);
                    res.render('customer/center/goods/goods', {data: data, product: product})
                }
            });

        });
    }

    app.post(APPURL + "/product/add", auth.restrict, auth.validateReq, auth.acl(__FEATUREENUM.FP_NEW_GOODS),
        postProductAddHandler);  //商品管理==>新增文件post
    app.post(APPURL + "/product/edit", auth.restrict, auth.validateReq, auth.acl(__FEATUREENUM.FP_NEW_GOODS),
        postProductAddHandler);  //商品管理编辑==>新增文件post
    /**
     * 商品管理==>新增文件post
     * @param req
     * @param res
     */
    function postProductAddHandler(req, res) {
        dataService.commonData(req, function (data) {
            var form = new formidable.IncomingForm();   //创建上传表单
            form.encoding = 'utf-8';		//设置编辑
            form.uploadDir = __base + '/static/upload/';	 //设置上传目录
            var imgRootUrl = '/static/upload/';
            form.keepExtensions = true;	 //保留后缀
            form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
            form.parse(req, function (err, fields, files) {
                if (err) {
                    res.locals.error = err;
                    res.render('customer/center/customerProduct_add', {data: data});
                    return;
                }
                var types = files.fulAvatar.name.split('.');
                var timestamp = new Date();
                var url = strftime(imgRootUrl + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                var filename = strftime(form.uploadDir + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                fs.renameSync(files.fulAvatar.path, filename);
                res.render('customer/center/getPicture', {url: url});
            });
        });
    }

    app.get(APPURL + "/product/edit", auth.restrict, auth.acl(__FEATUREENUM.FP_NEW_GOODS),
        getProductEditHandler);
    /**
     * 商品管理修改编辑
     * @param req
     * @param res
     */
    function getProductEditHandler(req, res) {
        logger.enter();
        var goodsId = req.param("goodsId") || "";
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getCustomerProductEdit(customerDB,goodsId,data,function(err,data){
                if(err){
                    res.render("error/500");
                }else{
                    res.render('customer/center/goods/edit', {data: data});
                }
            });
        });

    }

    app.post(APPURL + "/product/edit_content", auth.restrict, auth.acl(__FEATUREENUM.FP_NEW_GOODS),
        auth.validateReq, postProductAddGetContentHandler);  //商品管理编辑==>新增文件post
    /**
     *
     * @param req
     * @param res
     */
    function postProductAddGetContentHandler(req, res) {
        var goodsId = req.param("goodsId");
        var customerDB = req.session.customer.customerDB;
        model.getProductContent(customerDB,goodsId,function(err,goodsBasicInfos){
            if(err){
                res.send({content:{}});
            }else{
                res.send({content: goodsBasicInfos[0]})
            }
        });
    }

    //订单相关API

    //订单管理
    app.get(APPURL + "/order", auth.restrict,auth.acl(__FEATUREENUM.FP_VIEW_ORDER),  getOrderHandler);
    /**
     * 查看订单管理
     * @param req
     * @param res
     */
    function getOrderHandler(req, res) {
        logger.enter();
        var orderPaginator = model.getOrderPaginator(req);
        dataService.commonData(req, function (data) {
            var customerDB = req.session.customer.customerDB;
            model.listOrderForCustomer(customerDB, orderPaginator, function (err,orderInfo){
                if(err){
                    logger.error(err);
                    return res.render("error/wrong", {err:err});
                }
                var paginator = model.restoreOrderPaginator(orderPaginator);
                paginator.cv = (paginator.cv == "CREATED") ? req.query.cv : paginator.cv;
                data.paginator = paginator;
                res.render('customer/center/order/order', {data: data, orders: orderInfo})
            });
        });
    }

    app.get(APPURL + "/order/pending", auth.restrict, auth.acl(__FEATUREENUM.FP_APPROVE_ORDER), getOrderPendingHandler);
    /**
     * 查看订单审核(customer，订单详情)
     * @param req
     * @param res
     */
    function getOrderPendingHandler(req, res) {
        logger.enter();
        var orderId = req.param('orderId');
        var customerDB = req.session.customer.customerDB;
        var customerId = req.session.customer.customerId;

        dataService.commonData(req, function (data) {
            model.listCustomerOrderDetails(customerDB, orderId, customerId, function (err, orderCatalog){
                //var orders = orderCatalog;
                logger.debug(JSON.stringify(orderCatalog));
                data.order=orderCatalog.order;
                data.orderhistorys=orderCatalog.orderhistorys;
                data.customerContractInfo=orderCatalog.customerContractInfo;
                data.clientContractInfo = orderCatalog.clientContractInfo;
                data.orderContractInfo=orderCatalog.orderContractInfo;
                data.contractStage=orderCatalog.contractStage;
                data.orderStatus=orderCatalog.orderStatus;
                data.clientQualInfo=orderCatalog.clientQualInfo;
                data.returnInfo=orderCatalog.returnInfo;
                data.shipInfo=formatOrderDetailsShipInfo(orderCatalog.shipInfo);
                res.render('customer/center/order/orderPending', {data: data, orders: data.order});
            })
        });

    }

    app.get(APPURL + "/order/ship", auth.restrict, auth.acl(__FEATUREENUM.FP_SHIP_ORDER), getOrderShipHandler);
    /**
     * 订单管理 ==>已全部发货
     * @param req
     * @param res
     */
    function getOrderShipHandler(req, res) {
        logger.enter();
        var orderId = Number(req.query.orderId);
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getOrderHistorys(customerDB,orderId,function(err,orderHistorys){
                if (!err) {
                    data['orderhistorys'] = orderHistroys;
                    res.render('customer/center/customerOrder_ship', {data: data});
                }else{
                    res.render("error/500");
                }
            });
        });
    }

    app.get(APPURL + "/order/waitship", auth.restrict, getOrderWaitshipHandler);//查看订单待发货
    /**
     * 订单管理 ==>待发货
     * @param req
     * @param res
     */
    function getOrderWaitshipHandler(req, res) {
        logger.enter();
        var orderId = req.param('orderId');
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getOrderWaitShip(customerDB,orderId,data,function(err,data){
                if (err) {
                    res.render("/error/500");
                }else{
                    res.render('customer/center/order/waitShip', {data: data, orders: data.orders, ships: data.ships});
                }
            });
        });
    }

    app.post(APPURL + "/order/updateStatus", auth.restrict, auth.validateReq, postUpdateOrderStatusHandler,message.postMsg);//订单审核
    /**
     * 订单审核
     * @param req
     * @param res
     */
    function postUpdateOrderStatusHandler(req, res,next) {
        logger.enter();
        var updateData = req.body;
        var operatorData = req.session.operator;
        var customerDBName = req.session.customer.customerDB;
        var isErpAvailable = req.session.customer.erpIsAvailable;
        model.orderStatusCheck(customerDBName, updateData.orderId, 'CREATED,RETURN-REQUESTED', function (success) {
            if(!success){
                res.json(new FeedBack(FBCode.DBFAILURE, "订单状态已变更，不能重复提交"));
                return;
            }
            model.transUpdateOrderStatusNew(customerDBName, updateData, operatorData, function (err, orderId) {
                if(err){
                    logger.error(err);
                    res.json(new FeedBack(FBCode.DBFAILURE, "订单状态更新失败"));
                    return;
                }
                logger.debug("ERP IS available="+isErpAvailable);
                req.session.msg = message.makeMsg(updateData.clientId,null,__FEATUREENUM.FP_SHIP_ORDER,
                    "DOC_ORDER", orderId, updateData.displayId, "订单"+updateData.displayId+"已通过审核，查看详情>");
                if(isErpAvailable){
                    model.asyncOrderStatusToERP(req.session,updateData,function(err,result){
                        res.json(new FeedBack(FBCode.SUCCESS, updateData.status, orderId));
                    });
                }else{
                    res.json(new FeedBack(FBCode.SUCCESS, updateData.status, orderId));
                }
                next();
            });
        });
    }

    //退货相关API
    app.get(APPURL + "/return", auth.restrict, getReturnHandler);
    /**
     * 退货管理
     * @param req
     * @param res
     */
    function getReturnHandler(req, res) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var paginator = model.createCustomerReturnPaginator(req);
        var orderId = req.param("orderId")||"";
        var condition = {};
        if(orderId != ""){
            condition = {"ReturnInfo.orderId" : orderId};
        }
        dataService.commonData(req, function (data) {
            model.getAllReturns(customerDB, paginator, condition,function(err,results){
                if(err){
                    res.render("error/500");
                }else{
                    data['paginator'] = model.restoreCustomerReturnPaginator(paginator);
                    res.render('customer/center/return/return', {data: data, returns: results})
                }
            });
        });
    }

    app.get(APPURL + "/return/detail", auth.restrict, getReturnDetailHandler);
    /**
     * get return Details
     * @param req
     * @param res
     */
    function getReturnDetailHandler(req, res) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var returnId = req.param("returnId");
        dataService.commonData(req, function (data) {
            model.getReturnInfoById(customerDB, returnId, function (err, returnInfo) {
                if (!err) {
                    logger.debug(JSON.stringify(returnInfo));
                    data["returnInfo"] = returnInfo[0];
                    data['returnHistory'] = returnInfo[1];
                    data.applyRemark = returnInfo[0].remark;
                    var result = returnInfo[0][0];
                    logger.debug(JSON.stringify(result));
                    logger.debug(result.beforeCloseStatus);
                    if (result.returnStatus == "APPROVED" || (result.beforeCloseStatus=="APPROVED" && result.returnStatus == "CLOSED")) {
                        //审核通过的页面
                        data.returnShipDetails = returnInfo[0];
                        logger.debug(" return page ="+'customer/center/return/approve');
                        res.render('customer/center/return/approve', {data: data});
                    }
                    else if (result.returnStatus == "DELIVERED" || (result.beforeCloseStatus=="DELIVERED" && result.returnStatus == "CLOSED")) {
                        //退货已送达
                        logger.debug(" return page ="+'customer/center/return/delivered');
                        res.render('customer/center/return/delivered', {data: data});
                    }
                    else if (result.returnStatus == "CREATED" || (result.beforeCloseStatus=="CREATED" && result.returnStatus == "CLOSED")) {
                        //退货待审核
                        data.returnShipDetails = returnInfo[0];
                        logger.debug(" return page ="+'customer/center/return/returnPending');

                        res.render('customer/center/return/returnPending', {data: data, returns: returnInfo});
                    }
                    else if (result.returnStatus == "SHIPPED" || (result.beforeCloseStatus=="SHIPPED" && result.returnStatus == "CLOSED")) {
                        //退货已发货
                        logger.debug(" return page ="+'customer/center/return/returnShip');
                        res.render('customer/center/return/returnShip', {data: data});
                    }
                    else {
                        res.redirect('/404');
                    }
                } else {
                    res.json("err=" + err);
                }
            });
        })
    }

    app.post(APPURL + "/return/pending", auth.restrict, auth.validateReq, postReturnPendingHandler);
    /**
     * @deprecated
     * 商户审核退货 提交审核数据(暂时不用)0321:postReturnPendingHandlerNew
     * @param req
     * @param res
     */
    function postReturnPendingHandler(req, res) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var returnId = req.body.returnId;
        var operatorId = operatorData.operatorId;
        var customerReply = req.body.customerReply;
        //req.body = {"returnId": "1", "customerReply": "remark", "goodsArr": [["772", "1"]]}

        model.returnStatusCheck(customerDB, returnId, "CREATED", function (success) {
            var fb;

            if (success) {

                //新的method
                model.checkApplyReturn(customerDB, operatorId, returnId, customerReply, req.body.goodsArr, function (err, result) {
                    if (returnId) {
                        fb = new FeedBack(FBCode.SUCCESS, "退货单已审核", {returnId: returnId});
                    } else {
                        fb = new FeedBack(FBCode.DBFAILURE, "退货单审核失败, " + err.code);
                    }
                    res.json(fb);


                })
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "客户退货单已审核");
                res.json(fb);
            }
        });
    }

    app.post(APPURL + "/return/newpending", auth.restrict, auth.validateReq, postReturnPendingHandlerNew, message.postMsg);
    /**
     * 新的审核退货单post handler
     * @param req
     * @param res
     * @param next
     */
    function postReturnPendingHandlerNew(req,res, next){
        logger.enter();
        logger.debug(JSON.stringify(req.body));
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var returnId = req.body.returnId;
        var shipId = req.body.shipId;
        var orderId = req.body.orderId;
        var customerReply = req.body.remark;
        var returnPendingData = req.body.goodsArr;
        model.returnStatusCheck(customerDB, returnId, "CREATED", function (success) {
            var fb;
            if (success) {
                //新的method
                model.checkApplyReturnItem(customerDB, operatorData, returnId,shipId,orderId, customerReply, returnPendingData, function (err, result) {
                    if (returnId) {
                        fb = new FeedBack(FBCode.SUCCESS, "退货单审核成功", {returnId: returnId});
                        req.session.msg = message.makeMsg(req.body.operatorId,null,null, "DOC_RETURN",
                            returnId, req.body.returnDisplayId, "您的退货单"+req.body.returnDisplayId+"已通过审核，请尽快将商品发回，查看详情>");
                        res.json(fb);
                        return next();
                    } else {
                        fb = new FeedBack(FBCode.DBFAILURE, "退货单审核失败, " + err.code);
                        res.json(fb);
                    }

                })
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "客户退货单已审核");
                res.json(fb);
            }
        });



    }

    app.post(APPURL + "/return/delivered", auth.restrict, auth.validateReq, postReturnDeliveredHandler,message.postMsg);
    /**
     * 商户退货收货
     * @param req
     * @param res
     */
    function postReturnDeliveredHandler(req, res,next) {
        logger.enter();
        logger.debug(JSON.stringify(req.body));
        var data = req.body;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var returnId = data.returnId;
        data.operatorId = operatorData.operatorId;


        model.returnStatusCheck(customerDB, returnId, "SHIPPED", function (success) {
            var fb;
            if (success) {
                model.putReturnGoodsInStorage(customerDB, data, function (err, returnId) {
                    if (returnId) {
                        fb = new FeedBack(FBCode.SUCCESS, "退货单已确认入库", {returnId: returnId});
                        var msgBody = "您的退货单"+data.displayReturnId+"已成功入库，查看详情>";
                        goodsArr = data.goodsArr;
                        for(var i=0; i<goodsArr.length; i++){
                            if (goodsArr[i].returnShippedQuantity !== goodsArr[i].receiveShippedQuantity){
                                msgBody = "您的退货单"+ data.displayReturnId +"入库数量与您的发货数量不一致，查看详情>"
                                break;
                            }
                        }
                        req.session.msg = message.makeMsg(data.clientId,null,null,
                            "DOC_RETURN", returnId, data.displayReturnId, msgBody);
                        res.json(fb);
                        return next();
                    } else {
                        fb = new FeedBack(FBCode.DBFAILURE, "退货单确认入库失败, " + err.code);
                        res.json(fb);
                    }
                })

            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "客户退货单不是已发货状态，不能确认入库");
                res.json(fb);
            }
        });
    }

    app.post(APPURL + "/return/close", auth.restrict,auth.validateReq, closeReturnInfoHandler,message.postMsg);
    /**
     * close return
     * @param req
     * @param res
     */
    function closeReturnInfoHandler(req,res,next){

        logger.enter();
        var returnData = req.body;
        var returnId = returnData.returnId;
        var customerDB = req.session.customer.customerDB;
        var operatorDataId = req.session.operator.operatorId;
        if(req.session.operator.operatorType=='CLIENT'){
            operatorDataId=null;
        }else{
            operatorDataId=Number(operatorDataId);
        }
        orderModel.closeReturnInfo(customerDB,returnId,'CLOSED',operatorDataId,function(err,affectedResult){
            var fb;
            if (!err) {
                fb=new FeedBack(FBCode.SUCCESS,"退货单已关闭",{results : affectedResult});
                res.json(fb);
                db.getClientIdById(customerDB,returnData.operatorId, function(err, result){
                    req.session.msg = message.makeMsg(result[0].clientId,null,null, "DOC_RETURN",
                        returnId, returnData.displayId, "您的退货单"+returnData.displayId+"未通过审核，查看详情>");
                    return next();
                })
            } else {
                fb=new FeedBack(FBCode.DBFAILURE,"退货单关闭失败"+err.code);
                res.json(fb);
            }
        });
    }

    app.post(APPURL + "/addGoods", auth.restrict,auth.acl(__FEATUREENUM.FP_NEW_GOODS),
        auth.validateReq, postAddGoodsHandler);
    /**
     * 新增商品基本信息
     *
     * @param req
     * @param res
     */
    function postAddGoodsHandler(req, res) {
        logger.enter();
        var goodsData = req.body;
        var customerDBName = req.session.customer.customerDB;

        logger.ndump("goodsData", goodsData);
        /* 获取通用名称的拼音首字母缩写字符串 */
        goodsData.pinyinInitials = pinyin.getPinyinInitials(goodsData.commonName);
        model.customerAddGoods(customerDBName, goodsData, function (err, goodsId) {
            var fb;
            if (goodsId) {
                fb = new FeedBack(FBCode.SUCCESS, "商品信息已经添加成功", goodsId);
            } else {
                if (err.code === "ER_DUP_ENTRY")
                    fb = new FeedBack(FBCode.DUPDATA, "批准文号或商品编号已存在！");
                else
                    fb = new FeedBack(FBCode.DBFAILURE, err.toString);
            }
            res.json(fb);
        });
    }

    app.post(APPURL + "/updateGoodsPrice", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, postUpdateGoodsPriceHandler);
    /**
     * 更新商品价格信息
     * @param req
     * @param res
     */
    function postUpdateGoodsPriceHandler(req, res) {
        logger.enter();
        var feedback;
        var priceData = req.body;
        var limitedPrice = Number(priceData.limitedPrice);
        var wholesalePrice = Number(priceData.wholesalePrice);
        var refRetailPrice = Number(priceData.refRetailPrice);
        var price1 = Number(priceData.price1);
        var price2 = Number(priceData.price2);
        var price3 = Number(priceData.price3);
        var goodsId = req.param("goodsId");
        var customerDBName = req.session.customer.customerDB;
        model.putGoodsPrice(customerDBName, limitedPrice, wholesalePrice,
            refRetailPrice, price1, price2, price3, goodsId,function(err,affectedRows){
                if (!err) {
                    feedback.status = FBCode.SUCCESS;
                    feedback.msg = '商品信息已更新: [' + affectedRows + '] Success!';
                    feedback.data.affectedRows = affectedRows;
                    res.json(feedback);
                } else {
                    feedback.status = FBCode.DBFAILURE;
                    feedback.msg = "商品信息更新失败";
                    res.json(feedback);
                }
            });

    }

    app.post(APPURL + "/updateGoodsInventory", auth.restrict, auth.acl(__FEATUREENUM.FP_INVENTORY_GOODS),
        auth.validateReq, postUpdateGoodsInventoryHandler);
    /**
     * 商品库存信息更新
     * @param req
     * @param res
     */
    function postUpdateGoodsInventoryHandler(req, res) {
        logger.enter();
        var inventoryData = req.body;
        var negSell = inventoryData.negSell;
        var goodsId = req.param("goodsId");
        var customerDBName = req.session.customer.customerDB;
        var goodsInventoryData = {
            "showPlanId": inventoryData.stock_case,
            "goodsBatchTime": inventoryData.goodsBatchTime,
            "amount": inventoryData.amount,
            "onSell": inventoryData.onSell
        };
        model.putGoodsInventoryData(customerDBName,goodsInventoryData,negSell,goodsId,function(err,result){
            var fb;
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS, "商品更新成功", result);
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "商品更新失败");
            }
            res.json(fb);
        });
    }

    app.post(APPURL + "/updateGoodsGsp", auth.restrict,auth.acl(__FEATUREENUM.FP_NEW_GOODS),
        auth.validateReq, postUpdateGoodsGspHandler);
    /**
     * 更新商品GSP信息
     * @param req
     * @param res
     */
    function postUpdateGoodsGspHandler(req, res) {
        logger.enter();
        var gspData = req.body;
        var goodsId = req.param("goodsId");
        var customerDBName = req.session.customer.customerDB;
        model.putGoodsGsp(customerDBName, gspData, goodsId, function (err,results){
            var fb;
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS, "商品更新成功", results);
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "商品更新失败");
            }
            res.json(fb);
        });
    }

    app.post(APPURL + "/updateGoodsMarks", auth.restrict, auth.acl(__FEATUREENUM.FP_NEW_GOODS),
        auth.validateReq, postUpdateGoodsMarksHandler);
    /**
     * 更新商品标志信息
     * @param req
     * @param res
     */
    function postUpdateGoodsMarksHandler(req, res) {
        logger.enter();
        var marksData = req.body;
        var goodsId = req.param("goodsId");
        var customerDBName = req.session.customer.customerDB;
        model.putGoodsMarks(customerDBName, marksData, goodsId,function(err,results){
            var fb;
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS, "商品更新成功", results);
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "商品更新失败");
            }
            res.json(fb);
        });
    }

    app.get(APPURL + "/updateGoodsOnsell", auth.restrict,auth.acl(__FEATUREENUM.FP_NEW_GOODS),
        auth.validateReq, getUpdateGoodsOnsellHandler);
    //更新商品上下架信息
    function getUpdateGoodsOnsellHandler(req, res) {
        logger.enter();
        var redirectTo = req.headers.referer;
        var goodsId = req.param("goodsId");
        var onSell = req.param("onSell");
        var isDeleted = req.param("isDeleted");
        var customerDBName = req.session.customer.customerDB;
        model.putGoodsOnsellStatus(customerDBName,goodsId,onSell,isDeleted,function(err,result){
            if(err){
                res.render("error/500");
            }else{
                res.redirect(redirectTo);
            }
        });

    }
    app.post(APPURL + "/updateMutiGoodsOnsell", auth.restrict, auth.acl(__FEATUREENUM.FP_SALE_GOODS),
        auth.validateReq, postUpdateMutiGoodsOnsellHandler);
    /**
     * 批量更新商品上下架信息
     * @param req
     * @param res
     */
    function postUpdateMutiGoodsOnsellHandler(req, res) {
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        var goodsIds = req.body.goodsIds;
        if (underscore.isEmpty(goodsIds)) {
            fb = new FeedBack(FBCode.DBFAILURE, "您没有选中任何商品");
            res.json(fb);
            return;
        }
        var onSellstatus = req.body.onSell;
        var updateGoods = [];
        for (var i in goodsIds) {
            updateGoods.push(Number(goodsIds[i]));
        }
        var fb;
        model.putMutiOnSell(customerDBName, updateGoods, onSellstatus, function(err,result){
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS, "更新成功");
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "更新失败");
            }
            res.json(feedback);
        });
    }

    app.post(APPURL + "/updateGoodsInfo", auth.restrict, auth.acl(__FEATUREENUM.FP_NEW_GOODS),
        auth.validateReq, postUpdateGoodsAllInfoHandle);
    function postUpdateGoodsAllInfoHandle(req, res) {
        var customerDBName = req.session.customer.customerDB;
        var data = req.body;
        logger.ndump("data",data);
        /* 获取通用名称的拼音首字母缩写字符串 */
        data.baseInfo.pinyinInitials = pinyin.getPinyinInitials(data.baseInfo.commonName);
        model.customerAddAndUpdateGoods(customerDBName, data, function(err, results) {
            if (err) {
                return res.json(new FeedBack(FBCode.DBFAILURE,"商品信息保存失败"));
            } else {
                return res.json(new FeedBack(FBCode.SUCCESS,"商品信息保存成功",{goodsId:results}));
            }
        });
    }

    //other functions
    function formatOrderDetailsShipInfo(shipDetailArray){
        var initialData= underscore.chain(shipDetailArray).groupBy(function(item){
            return item.shipId;
        }).value();
        var shipDetails=[];
        var keys=Object.keys(initialData);
        for (var index in  keys){
            var key=keys[index];
            shipDetails.push(initialData[key]);
        }
        return shipDetails;
    }

};