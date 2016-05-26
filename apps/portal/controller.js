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
 * portal/controller.js
 *
 * portal controller
 * --------------------------------------------------------------
 * 2015-09-24	xdw-romens@issue#43 created
 *
 */

module.exports=function(app) {

    /*
     * Services
     */
    var logger = __logService;
    var dataService = __dataService;
    /*
     * load 3rd party modules
     */
    var path = require('path');
    var underscore = require("underscore");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;

    var md5 = require('js-md5');

    var Md5Calibrator = require(__base +"/modules/md5Calibrator");
    var md5Calibrator = new Md5Calibrator(md5);

    var MsgRobot = require(__base + "/modules/msgRobot");
    var msgRobot = new MsgRobot(md5Calibrator);
    var message = require(__modules_path + "/message");


    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var customerModel = require( __base + "/apps/customer/model")();
    var orderModel = require(__base + "/apps/customer/client/model")();
    var reportModel=require(__base+"/apps/reports/model")();
    var systemModel = require(__base + "/apps/customer/system/model")();
    var portalModel=require('./model')();
    var moment = require("moment");
    /*
     * init app name etc
     */
    var APPNAME = __dirname.split(path.sep).pop();
    var APPURL = "/" + APPNAME;
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load module
     */
    var model = require( __dirname + "/model")();
    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */

    //[this is handler need to be moved to other file.]
    app.get(APPURL, auth.restrict, getCenterHandler);

    /* show personal info  */
    app.get(APPURL + "/personal/info",auth.restrict, changeInfoHandler);

    /* show promotion Info  */
    app.get(APPURL + "/promotion/promotion_Info",auth.restrict, promotionInfoHandler);
    function promotionInfoHandler(req,res){
        dataService.commonData(req, function (data) {
            res.render('client/promotion/promotion_Info.ejs',{data:data});
        })
    }

    /* show changePwd page  */
    app.get(APPURL + "/personal/pwd",auth.restrict, changePwdHandler);

    /* show personal GSP page */
    app.get(APPURL + "/personal/gsp", auth.restrict, gspHandlerNew);

    /* personal GSP edit page*/
    app.get(APPURL + "/personal/gsp/edit", auth.restrict, gspEditHandler);
    //end of [this is handler need to be moved to other file.]

    //change pwd
    app.post(APPURL + "/password/modify", auth.restrict, auth.validateReq, postChangePwdHandler);  //密码修改提交

    //结款报表
    app.get(APPURL+"/personal/bill",auth.restrict,auth.validateReq,getClientBillListHandler);

    app.post(APPURL+"/personal/billExport",auth.restrict,auth.validateReq,exportClientBillListHandler);

    app.get(APPURL+"/personal/erpSetting",auth.restrict,auth.validateReq,getErpSettingPage);

    app.get(APPURL + "/get/appKey/", auth.restrict, auth.validateReq, getAppKeyHandler);
    /**
     * 获取   APPKEY
     * @param req
     * @param res
     */
    function getAppKeyHandler(req, res) {
        var userId = req.session.operator.clientId;
        var key = msgRobot.generateAppKey(userId);
        var feedback = new FeedBack(FBCode.SUCCESS, '生成成功', key);
        res.json(feedback);
    }




    app.post(APPURL + "/erpSetting", auth.restrict, postERPSettingHandler);
    /**
     * 提交ERP设定参数
     */
    function postERPSettingHandler(req, res) {
        var erpIsAvailable = Number(req.body.erpEnabled == "true");
        var erpAppCodeUrl = req.body.erpAppCodeUrl;
        var erpMsgUrl = req.body.erpMsgUrl;
        var appKey = req.body.appKey;

        var operatorId = req.session.operator.operatorId;
        var customerDbName = req.session.customer.customerDB;
        var cloudDbName = __cloudDBName;

        model.postERPsettings(customerDbName,cloudDbName,operatorId,
            erpAppCodeUrl,erpIsAvailable,erpMsgUrl,appKey,function(err,result){
                if(err){
                    logger.error(err);
                    return res.json(new FeedBack(FBCode.DBFAILURE, '内部错误'));
                }else{
                    logger.trace(result);
                    res.json(new FeedBack(FBCode.SUCCESS, '保存成功'));
                }
            });
    }

    /* handlers */
    app.get(APPURL+"/clearCheckComments",auth.restrict,auth.validateReq,clearCheckcommentsHandler);
    /**
     * 清除回复评论
     * @param req
     * @param res
     * @param next
     */
    function clearCheckcommentsHandler(req,res,next){
        var customerDB = req.session.customer.customerDB;
        var clientId=req.query.clientId;
        var comments = "";
        model.postCheckComments(customerDB,comments,clientId,function(err,affectedRows){
            if(err){
                logger.error(err);
                res.render("error/500");
            }else{
                res.end;
            }
        });
    }

    app.get(APPURL+"/personal/complaints",auth.restrict,getPersonalComplaintsHandler);
    /**
     * Complaints proposals,客户投诉管理界面
     * @param req
     * @param res
     * @param next
     */
    function getPersonalComplaintsHandler(req,res,next){
        dataService.commonData(req, function (data) {
            var clientId=req.session.operator.clientId;//通过session获取
            var dbName=req.session.customer.customerDB;
            model.getPersonalComplaint(dbName,clientId,function(err,result){
                if(err){
                    logger.error(err);
                    res.render("error/500");
                }else{
                    data.complains = result;
                    res.render('customer/portal/personal_complaints', {data: data});
                }
            });
        });
    }

    app.post(APPURL+"/personal/clientSaveComplaints",auth.restrict,postClientComplaints,message.postMsg);
    /**
     * 提交投诉信息
     * @param req
     * @param res
     * @param next
     */
    function postClientComplaints(req,res,next){
        logger.enter();
        var clientId=req.session.operator.clientId;//通过session获取
        var operatorId=req.session.operator.operatorId;
        var content=req.body.content;
        var type="UP";
        var dbName=req.session.customer.customerDB;
        model.postClientComplaint(dbName,clientId,operatorId,content,type,function(err,result){
            if(err){
                logger.error(err);
                return res.json(new FeedBack(FBCode.DBFAILURE,'内部错误'));
            }
            res.json(new FeedBack(FBCode.SUCCESS,'发送成功'));
            req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_OPERATOR, "DOC_COMPLAIN", null, "", "客户（"+req.session.operator.operatorName+"）发起了投诉，去处理>");
            next();
        });
    }

    app.get(APPURL+"/personal/operatorLog", auth.restrict, getClientOperatorLogHandler);
    /**
     * 客户操作日志列表
     * @param req
     * @param res
     */
    function getClientOperatorLogHandler(req, res) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = orderModel.createPurePaginator(req);
        // 操作员名称
        var operatorName = req.session.operator.operatorName;
        if(underscore.isUndefined(operatorName)){
            operatorName = '';
        }
        dataService.commonData(req, function (data) {
            systemModel.getOperatorLogInfo(dbName, true, operatorName, paginator, function (error, result) {
                if (error) {
                    logger.error(error);
                    res.json(new FeedBack(FBCode.DBFAILURE, '获取失败,数据库出错:' + error.code));
                } else {
                    logger.ndump('logList==>[X] ', result);
                    data.logList =result;
                    data.searchContent = operatorName;
                    data.paginator = orderModel.restorePurePaginator(paginator);
                    res.render('customer/portal/personal_log', {data: data})
                }
            });
        });
    }

    //获取客户 未读的消息列表
    app.get(APPURL+"/personal/getMessageCounts",auth.restrict,getMessageCountsHandler);
    function getMessageCountsHandler(req,res){
            logger.debug('get into handler getMessageCountsHandler');
            var clientId=req.query.clientId;
            var customerDB = req.session.customer.customerDB;
            var feedback=null;
            if(underscore.isNaN(clientId)){
                feedback=new FeedBack(FBCode.INVALIDDATA,'clientId无效',null);
                res.json(feedback);
                res.end();
            }
            portalModel.getClientUnreadMessageCounts(customerDB,clientId,function(err,result) {
                if (err) {
                    feedback = new FeedBack(FBCode.INVALIDDATA, '内部错误', null);
                    res.json(feedback);
                    res.end();
                }
                feedback=new FeedBack(FBCode.SUCCESS,'查询成功',result);
                res.json(feedback);
            });
    }

    app.get(APPURL, auth.restrict, getCenterHandler);
    /**
     * 用户个人中心
     * @param req
     * @param res
     * @param next
     */
    function getCenterHandler(req, res, next) {
        logger.enter();
        var clientId = req.session.operator.clientId;
        var operatorType = req.session.operator.operatorType;
        var customerDB = req.session.customer.customerDB;
        var num = (!req.query.num)? 4 : req.query.num;
        var orderFreqlimitNum = 4;//TODO use constants to replace hard code 4
        dataService.commonData(req, function (data) {
            model.getCenterInfo(customerDB,clientId,operatorType,num,orderFreqlimitNum,data,function(err,result){
                if(err){
                    if(err == "REDIRECT"){
                        res.redirect("/customer");
                    }else{
                        res.render("error/500");
                    }
                }else{
                    data.paginator = {};
                    res.render('customer/portal/personal_center', {data: data});
                }
            });
        });
    }

    app.get(APPURL + "/personal/gsp", auth.restrict, gspHandlerNew);
    /**
     * 查看客户GSP页面
     * @param req
     * @param res
     * @param next
     */
    function gspHandlerNew(req,res,next){
        logger.enter();
        dataService.commonData(req, function (data) {
            var customerDB = req.session.customer.customerDB;
            var operatorData = req.session.operator;
            data.clientModifyGSP = __clientModifyGSP;
            if (operatorData.operatorType === "CUSTOMER") {
                return res.redirect("/customer");
            }
            data.paginator = {};
            model.getClientGspDetail(customerDB,operatorData,data,function(err,data){
                if(err){
                    logger.error(err);
                    res.render('error/500');
                }else{
                    var status = data._client.registerStatus;
                    renderPage(status,data,data.checkComments,res);
                }
            });
        });
    }
    function renderPage(status,data,checkCommentsm,res){
        if ((status == 'REJECTED' || status == 'APPROVED')&&__clientModifyGSP) {
            data.checkComments = checkCommentsm;
            res.render('customer/portal/personal_gsp_edit', {data: data});
        }
        else {
            res.render('customer/portal/personal_gsp', {data: data});
        }

    }

    app.get(APPURL + "/personal/gsp/edit", auth.restrict, gspEditHandler);
    /**
     * gsp 修改页面按operatorType加载
     * @param req
     * @param res
     * @param next
     */
    function gspEditHandler(req, res, next) {
        logger.enter();

        dataService.commonData(req, function (data) {
            if (req.session.operator.operatorType === "CUSTOMER")
                res.redirect("/customer");
            else{
                data.paginator = {};
                res.render('customer/portal/personal_gsp_edit', {data: data});
            }
        });
    }

    app.get(APPURL + "/personal/info",auth.restrict, changeInfoHandler);
    /**
     * change client personal info
     * @param req
     * @param res
     * @param next
     */
    function changeInfoHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        dataService.commonData(req, function (data) {
            model.getClientPersonalInfo(customerDB,operatorData,data,function(err, data){
                if(err) {
                    if (err == "500") {
                        logger.error(err);
                        res.render("error/500");
                    } else {
                        res.redirect("/customer");
                    }
                }else{
                    logger.ndump('data', data);
                    res.render('customer/portal/personal_info', {data: data});
                }
            });

        });
    }

    app.get(APPURL + "/personal/pwd",auth.restrict, changePwdHandler);
    /**
     * 修改密码页面
     *
     */
    function changePwdHandler(req, res, next) {
        logger.enter();
        dataService.commonData(req, function (data) {
            logger.ndump('data', data);
            //add this page data
            data.paginator = {};
            res.render('customer/portal/personal_change_pwd',{data:data});
        });

    }

    app.post(APPURL + "/password/modify", auth.restrict, auth.validateReq, postChangePwdHandler);  //密码修改提交
    /**
     * POST 修改密码
     * @param req
     * @param res
     */
    function postChangePwdHandler(req,res){
        logger.enter();
        var passwordData = req.body;
        var customerDB = req.session.customer.customerDB;
        var operatorId = req.session.operator.operatorId;
        logger.debug("passwordData="+JSON.stringify(passwordData));
        customerModel.changePwd(customerDB,operatorId,passwordData,function(ret, result){
            switch(ret){
                case FBCode.SUCCESS:
                    return res.json(new FeedBack(FBCode.SUCCESS, "修改密码成功"));
                case FBCode.LOGINFAILURE:
                    return res.json(new FeedBack(FBCode.LOGINFAILURE, "旧密码不正确，请重新输入"));
                default:
                    return res.json(new FeedBack(ret, "修改密码失败，原因:"+result.tostring()));
            }
        });
    }

    app.get(APPURL+"/personal/bill",auth.restrict,auth.validateReq,getClientBillListHandler);
    /**
     *  商户结款报表页面
     * @param req
     * @param res
     */
    function getClientBillListHandler(req,res){
        logger.enter();
        var beginDate=req.query.beginDate;
        var endDate=req.query.endDate;
        var clientName=req.session.operator.clientName;
        beginDate=(underscore.isUndefined(beginDate)||beginDate=="")?"":beginDate;
        endDate=(underscore.isUndefined(endDate)||endDate=="")?"":endDate;
        var pageData={
            beginDate:beginDate,
            endDate:endDate,
            clientName:clientName
        };
        dataService.commonData(req,function(data){
            data.pageData=pageData;
            data.billList=null;
            if(beginDate!=""){
                beginDate=moment(beginDate);
                if(!beginDate.isValid()){
                    res.render('err/500');
                    return;
                }
                // Set beginDate to YYYY-MM-DD 00:00:00 and endDate to the time 00:00:00 on the next day
                beginDate.hour(0);
                beginDate.minute(0);
                beginDate.second(0);
            }
            if(endDate!=""){
                endDate=moment(endDate);
                if(!beginDate.isValid()){
                    res.render('err/500');
                    return;
                }
                // Set beginDate to YYYY-MM-DD 00:00:00 and endDate to the time 00:00:00 on the next day
                endDate.add(1,'days');
                endDate.hour(0);
                endDate.minute(0);
                endDate.second(0);
            }

            var customerDBName = req.session.customer.customerDB;
            //三个 查询条件都有可能为空
            reportModel.getClearingList(
                customerDBName,
                clientName,
                beginDate!=""?beginDate.format("YYYY-MM-DD HH:mm:ss"):"2000-01-01 00:00:00",
                endDate!=""?endDate.format("YYYY-MM-DD HH:mm:ss"):"2100-01-01 00:00:00",
                function(err, result) {
                    if (err) {
                        res.render('res/500');
                        return;
                    }
                    //format Date
                    data.billList=underscore(result).map(function(item){
                        item.clearingDate=moment(item.clearingDate).format('YYYY-MM-DD');
                        return item;
                    });
                    logger.ndump('result', result);
                    res.render('customer/portal/personal_bill', {data: data});
                }
            );
        });
    }

    app.post(APPURL+"/personal/billExport",auth.restrict,auth.validateReq,exportClientBillListHandler);
    /**
     * to do expoert ClientBILL
     */
    function exportClientBillListHandler(req,res){
        logger.enter();
        //to build
        res.json("building...");
    }

    app.get(APPURL+"/personal/erpSetting",auth.restrict,auth.validateReq,getErpSettingPage);
    /**
     * client erp setting
     * @param req
     * @param res
     */
    function getErpSettingPage(req,res){
        var operatorId = req.session.operator.operatorId;
        var customerDbName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getClientERPsetting(customerDbName,operatorId,data,function(err,data){
                if(err){
                    logger.error(err);
                    res.render("error/500");
                }else{
                    data.msgApi  =  req.protocol + '://' + req.get('host') + "/api/erp/" + data.customerId ;
                    data.appCodeApi =  req.protocol + '://' + req.get('host') + "/api/erp/appCode/" + data.customerId ;
                    res.render('customer/portal/personal_erpSetting',{data:data});
                }
            });
        });
    }
};

