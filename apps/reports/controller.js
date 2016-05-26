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
    var path = require('path');
    var underscore = require("underscore");
    var fs = require('fs');
    var strftime = require('strftime');
    var myPath = require(__modules_path + "/mypath");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var express = require("express");
    var moment = require("moment");

    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');

    /*
     * init app name etc
     */
    var APPNAME = myPath.getAppName(__dirname);
    var APPURL = "/" + APPNAME;
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load module
     */
    var model = require(__dirname + "/model")();

    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */
    app.get(APPURL,auth.restrict,getClientBillListHandler);
    /**
     * 生成客户结款数据
     * @param req
     * @param res
     * @param next
     */
    function getClientBillListHandler(req,res,next){
        logger.enter();
        var beginDate=req.query.beginDate;
        var endDate=req.query.endDate;
        //三个参数都有可能为空
        beginDate=(underscore.isUndefined(beginDate)||beginDate=="")?"":beginDate;
        endDate=(underscore.isUndefined(endDate)||endDate=="")?"":endDate;
        var clientName = req.session.operator.clientName;

        var pageData={
            beginDate:beginDate,
            endDate:endDate,
            clientName:clientName
        };
        dataService.commonData(req,function(data){
            data.pageData=pageData;
            data.billList=null;
            /* res.render('customer/center/bill/bill', {data: data});*/
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
            model.getClearingList(
                customerDBName,
                clientName,
                beginDate!=""?beginDate.format("YYYY-MM-DD HH:mm:ss"):"2000-01-01 00:00:00",
                endDate!=""?endDate.format("YYYY-MM-DD HH:mm:ss"):"2100-01-01 00:00:00",
                function(err, result) {
                    if (err) {
                        res.render('res/500');
                        return;
                    }
                    data.billList=result;
                    logger.ndump('result', result);
                    res.render('customer/center/bill/bill', {data: data});
                }
            );
        });
    }

    app.get(APPURL + "/details", auth.restrict, getClearingDetailsHandler);
    /**
     * 获取结算明细资料
     * @param req
     * @param res
     * @param next
     */
    function getClearingDetailsHandler(req,res,next){
        logger.enter();

        var beginDate=req.query.beginDate;
        beginDate=(underscore.isUndefined(beginDate)||beginDate=="")?"":beginDate;

        var endDate=req.query.endDate;
        endDate=(underscore.isUndefined(endDate)||endDate=="")?"":endDate;

        var fuzzyCondition = req.query.fuzzyCondition||"";//可能是发货单 订单号 客户名
        var status = req.query.status||"all";

        var pageData={
            beginDate:beginDate,
            endDate:endDate,
            fuzzyCondition:fuzzyCondition,
            status: status
        };

        dataService.commonData(req,function(data){

            data={};
            data.pageData=pageData;
            res.render('customer/center/bill/settlement_manage',{data:data});

        })
    }

    app.post(APPURL + "/details/cleared", auth.restrict, setClearedHandler);
    /**
     * 提交结算数据
     * @param req
     * @param res
     * @param next
     */
    function setClearedHandler(req, res, next) {
        logger.enter();
        var clearingDetailId = req.param.clearingDetailId;
        var customerDBName = req.session.customer.customerDB;
        model.putClearDetails(customerDBName, clearingDetailId, function(err, result){
            if (err){
                res.json(new FeedBack(FBCode.DBFAILURE, err))
            } else {
                res.json(new FeedBack(FBCode.SUCCESS));
            }
        });

    }
};