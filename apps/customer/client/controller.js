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

    /*
     * load project modules
     */
    var auth = require(__modules_path + '/auth');
    var myPath = require(__modules_path + "/mypath");
    var feedback = require(__modules_path + "/feedback");
    var smsModule= require(__modules_path+"/smsModule")();
    var CONSTANTS= require(__modules_path+"/SystemConstants");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var message = require(__modules_path + "/message");

    /*
     * init app name etc
     */
    var APPNAME = myPath.getAppName(__dirname);
    var APPURL = "/" + APPNAME;

    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load model
     */
    var customerModel = require(__dirname + "/../model")();
    var model = require(__dirname + "/model")();
    var orderModel = require(__base + "/apps/customer/client/model")();
    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */


    app.post(APPURL + "/review", auth.restrict,
        //auth.acl(__FEATUREENUM.FP_APPROVE_CLIENT),
        postClientsReviewHandler,message.postMsg);
    /**
     * 客户审核
     * @param req
     * @param res
     */
    function postClientsReviewHandler(req, res, next) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var saleScope = req.body.goodsGspTypeList;
        var clientId = Number(req.body.clientId);
        var clientInfo = req.body.clientInfo;
        clientInfo.enabled = 'ENABLED';
        clientInfo.registerStatus = 'APPROVED';
        var approveReason = req.body.approveReason || '';
        var status = req.body.status;
        var loginAccount = clientInfo.clientCode;
        var phoneNumber = clientInfo.mobile;
        var gspInfo = req.body.gspInfo;
        var gspTypes= req.body.gspTypes;
        var stampLink=req.body.stampLink;
        var credits = req.body.credits;
        logger.ndump('credits > ', credits);
        //return ;
        model.customerReviewClient(dbName,stampLink,gspTypes, credits, clientInfo, gspInfo, clientId, saleScope, function(err, result) {
            if (err) {
                if (err.code == "ER_DUP_ENTRY") {
                    return res.json(new FeedBack(FBCode.DUPDATA, "客户名称或者证照已经存在, 请核对"));
                } else {
                    return res.json(new FeedBack(FBCode.DBFAILURE, "客户信息修改失败，", err.code));
                }
            } else {
                if (result.affectedRows != '1') {
                   return res.json(new FeedBack(FBCode.DBFAILURE, "审核通过失败,请重试."));
                }else {
                    //将checkComments存到Client
                    model.putCheckComments(dbName,approveReason,clientId,function(err,result){
                        if (err) {
                            logger.error(error);
                            res.json(new FeedBack(FBCode.DBFAILURE, "保存审核意见失败" + error.code));
                        }else {
                            if (result == "1") {
                                //send SMS to user
                                var initialSMSContent;
                                if (status == "CREATED") {
                                    initialSMSContent = CONSTANTS.CheckClientResult.ApprovedSMS;
                                }
                                else if (status == "UPDATED") {
                                    initialSMSContent = CONSTANTS.CheckClientResult.UpdatedToApprovedSMS;
                                }
                                var smsContent = "";
                                logger.ndump('approveReason ', approveReason);
                                if(approveReason != ""){
                                    smsContent = initialSMSContent.replace('account', loginAccount).replace('reasonContent', "，备注：" + approveReason+"");
                                }else{
                                    smsContent = initialSMSContent.replace('account', loginAccount).replace('reasonContent', "");
                                }
                                logger.ndump('smsContent ', smsContent);
                                smsModule.sendClientSMS(dbName, phoneNumber, smsContent, function (err,feedback) {
                                    if (err) {
                                        logger.error(err);
                                        res.json(new FeedBack(FBCode.SUCCESS, "审核成功,短信发送系统出错了,用户可能不会收到短信提示!"));
                                        req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                                            "DOC_OTHER", null, null, "短信发送失败"+err);
                                        logger.ndump("msg", req.session.msg);
                                        next();
                                    }
                                    else {
                                        res.json(new FeedBack(FBCode.SUCCESS, "审核成功,短信发送成功!"));
                                        if(!feedback.isMainSucc){
                                            req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                                                "DOC_OTHER", null, null, "首选短信网关发送失败");
                                            logger.ndump("msg", req.session.msg);
                                            next();
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }

    app.post(APPURL + "/reject", auth.restrict, postRejectClientHandler,message.postMsg);
    /**
     * post reject client approve
     * @param req
     * @param res
     */
    function postRejectClientHandler(req, res,next) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var clientId = Number(req.body.clientId);
        var phoneNumber=req.body.phoneNumber;
        var rejectReason=req.body.rejectReson;
        var loginAccount=req.body.loginAccount;
        var clientStatus=req.body.clientStatus;
        model.putClientApplyReject(dbName,clientId,rejectReason,clientStatus,function(err,results){
            if(results=="1"){
                //should send SMS to user
                var initialRejectContent;
                if(clientStatus=="CREATED"){
                    initialRejectContent=CONSTANTS.CheckClientResult.RejectedSMS;
                }else if(clientStatus=="UPDATED"){
                    initialRejectContent=CONSTANTS.CheckClientResult.UpdatedToApproved_R_SMS;
                }
                var contentSms=initialRejectContent.replace('account',loginAccount).replace('reasonContent',rejectReason);
                logger.ndump("contentSms==> ", contentSms);
                smsModule.sendClientSMS(dbName,phoneNumber,contentSms,function(err,feedback){
                    if(err){
                        logger.error(err);
                        res.json(new FeedBack(FBCode.SUCCESS, "退回成功,短信发送系统出错了,用户可能不会收到短信提示!"));
                        req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                            "DOC_OTHER", null, null, "短信发送失败"+err);
                        logger.ndump("msg", req.session.msg);
                        next();
                    }
                    else{
                        res.json(new FeedBack(FBCode.SUCCESS, "退回成功,短信发送成功!"));
                        if(!feedback.isMainSucc){
                            req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                                "DOC_OTHER", null, null, "首选短信网关发送失败");
                            logger.ndump("msg", req.session.msg);
                            next();
                        }
                    }
                });
            }else{
                res.json(new FeedBack(FBCode.DBFAILURE, "更改数据失败,错误码" + error.code));
            }
        });
    }


    app.get(APPURL+"/updateInfoClient", auth.restrict, getUpdateInfoClientHandler);
    /**
     * 获取审核更新状态的客户信息
     * @param req
     * @param res
     */
    function getUpdateInfoClientHandler(req, res){
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var clientName=req.query.clientName;
        clientName=clientName==undefined||clientName==null ? '' : clientName;
        var paginator=model.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            data.clientName=clientName;
            model.getClientUpdateStatusInfo(dbName, data, paginator, function(err, results) {
                if(err) {
                    logger.error(error);
                    next();
                }
                else {
                    data.paginator = model.restorePurePaginator(paginator);
                    data.clientsSumsGroupByStatus=customerModel.getClientsSumByRegisterStatus(results.clientStatusNum);
                    res.render('customer/center/client/updateInfoClient', {data: data});
                }
            });
        });
    }

    /**************************************************************
     * handlers
     */

    //显示已退回客户界面
    app.get(APPURL+"/reject", auth.restrict, getClientRejectHandler);
    /**
     * 获取审核拒绝状态的客户信息
     * @param req
     * @param res
     * @param next
     */
    function getClientRejectHandler(req, res, next) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var clientName=req.query.clientName;
        var paginator=model.createPurePaginator(req);
        clientName=clientName==undefined||clientName==null?'':clientName;
        dataService.commonData(req, function (data) {
            data.clientName=clientName;
            model.getClientRejectStatusInfo(dbName, data, paginator, function(error, results) {
                if(error) {
                    logger.error(error);
                    next();
                }
                else {
                    data.paginator = model.restorePurePaginator(paginator);
                    data.clientsSumsGroupByStatus=customerModel.getClientsSumByRegisterStatus(results.clientStatusNum);
                    res.render('customer/center/client/rejectClient', {data: data});
                }
            });
        });
    }

    // 加载显示已审核客户管理页面
    app.get(APPURL, auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_CLIENT,__FEATUREENUM.FP_APPROVE_CLIENT]),
        getListClientsHandler);
    //已审核客户管理
    function getListClientsHandler(req, res) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var clientName=req.query.clientName;
        var paginator=model.createPurePaginator(req);
        clientName=clientName==undefined||clientName==null?'':clientName;
        dataService.commonData(req, function (data) {
            data.clientName = clientName;
            model.getApprovedStatusClients(customerDB, data, paginator, function(err, data) {
                if(err) {
                    logger.error(error);
                    next();
                }
                else {
                    data.paginator = model.restorePurePaginator(paginator);
                    data.clientsSumsGroupByStatus = customerModel.getClientsSumByRegisterStatus(data.clientSumsGroupByRegisterStatus);
                    res.render('customer/center/client/client',
                        {
                            clients: data.clients,
                            data: data
                        }
                    );
                }
            });
        });
    }

    //加载显示待审核客户页面
    app.get(APPURL + "/toReview", auth.restrict,
        //auth.acl(__FEATUREENUM.FP_APPROVE_CLIENT),
        getToReviewListClientsHandler);
    //待审核客户管理
    function getToReviewListClientsHandler(req, res, next){
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var clientName=req.query.clientName;
        clientName=clientName==undefined||clientName==null?'':clientName;
        var paginator=model.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            data.clientName=clientName;
            model.getClientCreatedStatusInfo(dbName, data, paginator, function(err, results) {
                if(err) {
                    logger.error(error);
                    next();
                }
                else {
                    data.paginator = model.restorePurePaginator(paginator);
                    data.clientsSumsGroupByStatus = customerModel.getClientsSumByRegisterStatus(results.clientStatusNum);
                    res.render('customer/center/client/toReviewClient', {data: data});
                }
            });
        });
    }

    app.get(APPURL + "/review", auth.restrict,
        //auth.acl(__FEATUREENUM.FP_APPROVE_CLIENT),
        getClientsReviewHandler);
    //审核客户管理  //todo 获取用户gsp控制类型  两个审核都是这个 资料更新审核  注册资料审核
    function getClientsReviewHandler(req, res, next){
        logger.enter();
        var clientId = Number(req.query.id);
        var dbName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getClientsReview(dbName,clientId,data,function(err,data){
                if(err){
                    logger.error(err);
                    res.render('error/500');

                }else{
                    res.render('customer/center/client/ratify', {data: data});
                }
            });
        });
    }

    // 处理上传客户xls文件
    app.post(APPURL + "/upload", auth.restrict, postUploadClientXLSHandler);
    //客户管理==>导入post
    function postUploadClientXLSHandler(req, res) {
        var customerDBName = req.session.customer.customerDB;
        var paginator = customerModel.createCustomerPaginator(req);
        dataService.commonData(req, function (data) {
            logger.enter();
            //data['paginator'] = customerModel.restorePaginator(paginator);
            //var form = new formidable.IncomingForm();   //创建上传表单
            //form.encoding = 'utf-8';		//设置编辑
            //form.uploadDir = 'static/upload/';	 //设置上传目录
            //form.keepExtensions = true;	 //保留后缀
            //form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
            //
            //form.parse(req, function (err, fields, files) {
            //
            //    if (err) {
            //        res.locals.error = err;
            //        res.render('customer/center/client/client', {data: data});
            //        return;
            //    }
            //    var types = files.fulAvatar.name.split('.');
            //    var timestamp = new Date();
            //    var filename = strftime(form.uploadDir + "%Y%m%d%H%M%S." + String(types[types.length - 1]), timestamp);
            //    fs.renameSync(files.fulAvatar.path, filename);
            //});
            //data['paginator'] = customerModel.restorePaginator(paginator);
            //res.render('customer/center/client/client', {data: data, clients: clients});
            res.render("error/building");

        });
    }

    app.post(APPURL + "/uploadUnitXLS", auth.restrict, postUploadUnitXLSHandler);
    //客户管理==>导入post
    function postUploadUnitXLSHandler(req, res) {
        var type = req.query.type;
        var unitXls = req.query.unitXls;
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
                    res.render('customer/center/client', {data: data});
                    return;
                }
                var types = files.fulAvatar.name.split('.');
                var timestamp = new Date();
                var url = strftime(imgRootUrl + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                var filename = strftime(form.uploadDir + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                fs.renameSync(files.fulAvatar.path, filename);
                var feedback = "";
                if(unitXls == "false"){
                    feedback = "请先上传单位表";
                    res.render('customer/center/client/guide',{
                        type: 'clientUnit',
                        feedback :feedback,
                        unitXls : false
                    });
                }else if(type == "client"){
                    feedback = "单位表上传成功";
                    res.render('customer/center/client/guide',{
                        type: type,
                        feedback :feedback,
                        unitXls : true
                    });
                }else if(type == "clients"){
                    feedback = "客户表上传成功";
                    res.render('customer/center/client/guide',{
                        type: type,
                        feedback :feedback,
                        unitXls : true
                    });
                }
            });
        });
    }


    // 显示客户单品价格设定页面
    app.get(APPURL + "/price", auth.restrict, getPriceHandler);
    /**
     * 渲染客户单品价格页面
     * @param req
     * @param res
     */
    function getPriceHandler(req, res){
        var paginator = model.createPurePaginator(req);
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var clientId = req.query.clientId;
        dataService.commonData(req, function (data) {
            data.clientId = clientId;
            model.getProductPrice(customerDB, data, paginator, function(err, result) {
                if(err) {
                    logger.error(err);
                    res.render('error/500');
                }
                else {
                    res.render('customer/center/client/priceSet', {data: result.data, productprice: result.productPrice});
                }
            });
        });
    }

    // 修改客户单品价格
    app.post(APPURL + "/price/update", auth.restrict, UpdatePriceHandler);
    /*　修改单个商品的价格　*/
    function UpdatePriceHandler(req,res){
        var data = req.body;
        var customerDB = req.session.customer.customerDB;
        model.putClientPrice(customerDB, data, function(err, result) {
            var fb;
            if(err){
                fb = new FeedBack(FBCode.DBFAILURE, "客户单品价格修改失败，" + err.code);
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "客户单品价格修改成功", {result: result});
            }
            res.json(fb);
        });
    }

    // 删除客户单品
    app.post(APPURL + "/price/delete", auth.restrict, DeletePriceHandler);
    /**
     * 删除单个商品
     * @param req
     * @param res
     * @constructor
     */
    function DeletePriceHandler(req,res){
        var data = req.body;
        var customerDB = req.session.customer.customerDB;
        model.delClientPrice(customerDB, data, function(err, result) {
            var fb;
            if (err) {
                fb = new FeedBack(FBCode.DBFAILURE, "删除失败，" + err.code);
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "删除成功", {result:result});
            }
            res.json(fb);
        });
    }

    // 获取客户授信额度
    app.get(APPURL + "/finance", getFinanceHandler);
    /**
     * 获取客户授信额度
     * @param req
     * @param res
     */
    function getFinanceHandler(req, res) {
        var clientId    = req.session.operator.clientId;
        var customerDB = req.session.customer.customerDB;
        model.getClientFinance(customerDB, clientId, function(err, result) {
            var fb;
            if (err) {
                fb = new FeedBack(FBCode.DBFAILURE, "获取授信额度失败，" + err.code);
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "获取授信额度成功", result);
            }
            res.json(fb);
        });
    }

    // 添加客户单品
    app.post(APPURL + "/price/addGoods", auth.restrict, clientAddGoodsHandler);
    /**
     * 添加单个商品
     * @param req
     * @param res
     */
    function clientAddGoodsHandler(req,res){
        logger.enter();
        var data = req.body;
        var customerDB = req.session.customer.customerDB;
        model.postClientPrice(customerDB, data, function(err, clientPriceId) {
            var fb;
            if (err) {
                if (err.code === "ER_DUP_ENTRY"){
                    fb = new FeedBack(FBCode.DUPDATA, "客户单品价格已存在，请返回修改");
                }else{
                    fb = new FeedBack(FBCode.DBFAILURE, "客户单品价格添加失败，" + err.code);
                }
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "客户单品价格添加成功", clientPriceId);
            }
            res.json(fb);
        });
    }


    // 新增客户单品价格
    app.get(APPURL + "/price/add", auth.restrict, getPriceAddHandler);
    //客户管理==>价格设定==>添加页
    function getPriceAddHandler(req,res) {
        logger.enter();
        var clientId = req.param("client");
        var customerDBName = req.session.customer.customerDB;
        var paginator = model.createGoodsPaginator(req);
        var goodsTypeId = Number(req.query.cbv);
        dataService.commonData(req, function (data) {
            model.getPriceAdd(customerDBName,clientId,goodsTypeId,paginator,data,function(err,data){
                if(err){
                    res.render("error/500");
                }else{
                    data['paginator'] = model.restoreGoodsPaginator(paginator);
                    res.render('customer/center/client/priceAdd', {data: data})
                }
            });
        });
    }

    //　设置价格页面
    app.get(APPURL + "/price/setPrice", auth.restrict, getSetPriceHandler);
    //设定价格页面
    function getSetPriceHandler(req, res){
        logger.enter();
        dataService.commonData(req, function (data) {
            res.render('customer/center/client/setPriceDialog', {data: data});
        });
    }

    // 显示已经审核通过的客户页面
    app.get(APPURL + "/add", auth.restrict, getClientAddHandler);
    //客户管理==>审核通过之后 编辑客户
    function getClientAddHandler (req, res) {
        logger.enter();
        var clientId = req.param("clientId");
        var page = req.param("active");
        var operatorData = {};
        operatorData.clientId = clientId;
        var customerDBName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getClientSaleScope(customerDBName, clientId, function(err, results){
                if(err){
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }else{
                    data['SaleScope'] = results;
                    logger.ndump('data[\'SaleScope\'] ', data.SaleScope);
                    model.getClientAdd(customerDBName,clientId,page,operatorData,data,function(err,data){
                        if(err){
                            res.render('error/wrong', {err: err});
                        }else{
                            res.render('customer/center/client/add', {data: data})
                        }
                    });
                }
            });
        });
    }

    // 新增客户提交
    app.post(APPURL + "/add", auth.restrict, auth.validateReq, postClientAddHandler);
    //新增客户基本信息
    function postClientAddHandler(req,res){
        logger.enter();
        var clientData = req.body;
        var customerDBName = req.session.customer.customerDB;
        logger.trace(JSON.stringify(clientData));
        model.customerAddClient(customerDBName,clientData,function(err, clientId){
            var fb;
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    fb = new FeedBack(FBCode.DUPDATA, "客户编号或登录账户已经存在，请使用其他字符");
                } else {
                    fb = new FeedBack(FBCode.DBFAILURE, "客户信息添加失败, " + err.code);
                }
            } else {
                fb = new FeedBack(FBCode.SUCCESS, '客户信息已添加成功', clientId);
            }

            res.json(fb);
        });
    }

    // 更新客户信息
    app.post(APPURL + "/update", auth.restrict, auth.validateReq, postClientUpdateHandler);
    //商户更新  直接更新,不用审核客户GSP信息
    //更新客户基本信息
    function postClientUpdateHandler(req,res){
        logger.enter();
        var clientId = req.param("clientId");
        var customerDBName = req.session.customer.customerDB;
        var gspTypeIds = req.body.gspTypes;
        var clientInfo = req.body.clientInfo;
        var saleScope = req.body.goodsGspTypeList;
        clientInfo.stampLink=req.body.stampLink;
        var gspInfo = req.body.gspInfo;
        var credits = req.body.credits;
        var oldCredit=req.body.oldCredits,
            operatorId=req.session.operator.operatorId;
        logger.ndump('*[clientInfo.credits]=>> ', credits);
        model.customerUpdateClient(customerDBName,clientInfo, gspInfo,gspTypeIds,clientId, saleScope, credits, oldCredit,operatorId,function(err, clientAffectedRows){
            var fb;
            if (err) {
                if (err.code == "ER_DUP_ENTRY")
                    fb = new FeedBack(FBCode.DUPDATA, "客户名称或者证照已经存在, 请核对");
                else
                    fb = new FeedBack(FBCode.DBFAILURE, "客户信息修改失败，" + err.code);
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "客户信息修改成功", clientId);
            }
            res.json(fb);
        });
    }

    // 倒入客户
    app.get(APPURL + "/import", auth.restrict, getClientImportHandler);
    //客户管理==>导入get
    //客户管理==>导入get
    function getClientImportHandler(req,res){
        logger.enter();
        dataService.commonData(req, function (data) {
            res.render('customer/center/customerManagement_import', {data: data})
        });
    }

    // 更新客户GSP
    app.post(APPURL + "/gsp/update", auth.validateReq, postClientGspUpdateHandler);
    //客户自己更新 GSP信息
    //客户自己发起GSP信息 更新   这里点击之后都是直接更新到ClientUpdate里面
    function postClientGspUpdateHandler(req,res){

        var clientId=req.body.clientId;
        var dbName = req.session.customer.customerDB;
        var clientData = {
            gspInfo: req.body.gspInfo,
            basicInfo: req.body.basicInfo,
            clientId:clientId
        };
        //clientData.gspInfo.images = req.body.images;
        var status=req.body.registerStatus;

        var gspTypes=req.body.gspTypes;
        //updateGSPtoTableCLientUpdate,clientUpdateRegisterInfo

        model.updateClientGSPbyClient(dbName,clientData,clientId,clientData.gspInfo.stampLink,status,gspTypes,function(err,result){
                if(err){
                    logger.error(err);
                    res.json(new FeedBack(FBCode.DBFAILURE, "更新失败." + error.code));
                }else{
                    res.json(new FeedBack(FBCode.SUCCESS, "更新成功"));
                }
        });
    }

    // 显示客户状态
    app.get(APPURL + "/status", auth.restrict, auth.validateReq, getClientStatusHandler, message.postMsg);
    //设置客户状态信息
    //更新客户状态信息
    function getClientStatusHandler(req,res,next){
        logger.enter();
        var redirectTo = req.headers.referer;
        var customerId = req.session.customer.customerId;
        var clientId = req.param("clientId");
        var statusName =  req.param("statusName");
        var status = req.param("status");
        var customerDB = req.session.customer.customerDB;

        model.getIsExpire(customerId, clientId, function(err, isExpire) {
            if(err) {
                res.render('error/wrong',{err:err});
            }
            else {
                if(isExpire == true && status == '0' && statusName == 'readOnly' ){
                    res.json(new FeedBack(FBCode.INVALIDACTION, "存在已过期证照,无法启购"));
                }
                else{
                    model.customerUpdateStatusClient(customerDB, clientId, statusName, status,function(err, clientAffectedRows){
                        logger.trace(clientAffectedRows);
                        if(!err){
                            if(statusName == "readOnly" && status == 0){
                                req.session.msg = message.makeMsg(clientId,null,null, "DOC_ACCOUNT", clientId, "", "您的帐号已被禁购，请联系我们（客服电话:40002125441）重新启购后方可购买商品");
                                next();
                            }
                        }else{
                            //todo add err page here
                            res.render('error/wrong', {err: err});
                        }
                    });
                }
            }
        });
    }

    // 更改客户状态
    app.post(APPURL + "/status/update", auth.restrict, auth.validateReq, postClientStatusUpdateHandler, message.postClinetsMsg);
    //批量设置客户状态信息
    //客户管理批量更新状态
    function postClientStatusUpdateHandler(req,res,next){
        logger.enter();
        var feedback = {
            status: FBCode.INVALIDACTION,
            msg: '',
            data: {}
        };
        var bodyData = req.body;
        var clientIds = req.body.clientIds;
        var statusName = req.body.statusName;
        var status = req.body.status;
        logger.debug(JSON.stringify(req.body));
        if(underscore.isEmpty(clientIds)){
            feedback.msg="您没有选中任何客户";
            res.json(feedback);
            return;
        }
        var updateClientIds = [];
        for(var i in clientIds){ updateClientIds.push(Number(clientIds[i]));}
        var customerDB = req.session.customer.customerDB;

        model.putClientStatus(customerDB, bodyData, updateClientIds, function(affectedRows) {
            if(affectedRows){
                feedback.status = FBCode.SUCCESS;
                feedback.msg = "成功";
            }
            res.json(feedback);
            if(statusName == "ReadOnly" && status == "ON"){
                req.session.msg = message.makeMsg(clientIds,null,null, "DOC_ACCOUNT", null, "", "您的帐号已被禁购，请联系我们（客服电话:40002125441）重新启购后方可购买商品");
                next();
            }
        });

    }

    //弹出上传文件向导对话框
    app.get(APPURL + "/guide", auth.restrict, getGuideHandler);
    //上传向导
    function getGuideHandler(req, res){
        res.render("customer/center/client/guide",{
            type : "clientUnit",
            feedback :　"",
            unitXls : false
        });
    }
};
