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
 * Customer_message_controller.js
 *
 * 客户端消息中心controller
 * --------------------------------------------------------------
 *
 */

//Services
var logger = __logService;
var db = __dbService;
var dataService = __dataService;

//load 3rd party modules
var path = require('path');
var underscore = require("underscore");
var async = require("async");
//load project modules
var auth = require(__base + '/modules/auth');
var feedback = require(__modules_path + "/feedback");
var FBCode = feedback.FBCode;
var FeedBack = feedback.FeedBack;
var moment = require('moment');

//init app name etc
var APPNAME = __dirname.split(path.sep).pop();
var APPURL = "/" + APPNAME;

//load module
var model = require("./model")();


module.exports = function(app) {

    app.get(APPURL, auth.restrict, getMessageHandler);
    /**
     * 客户端通知中心显示数据
     * @param req
     * @param res
     */
    function getMessageHandler(req, res){
        dataService.commonData(req, function (data) {
            var paginator=model.createMessagesPaginator(req);
            var dbName = req.session.customer.customerDB;
            var operator = req.session.operator;
            model.getClientMessage(dbName,operator,paginator,function(err,results){
               if(err){
                   logger.error(err);
                   res.render('error/500',{data: data})
               }else{
                   data.messages = results;
                   data['paginator'] = model.restoreMessagesPaginator(paginator);
                   logger.debug("client message ="+JSON.stringify(data.messages));
                   res.render('customer/message/MessageCustomer', {data: data});
               }
            });
        })
    }

    app.get(APPURL + '/read', auth.restrict, getReadMessageHandler);
    /**
     * 客户端设置通知已读并跳转到对应链接
     * @param req
     * @param res
     */
    function getReadMessageHandler(req, res){
        var dbName = req.session.customer.customerDB;
        var operator = req.session.operator;
        var docType = req.query.docType;
        var docId = req.query.docId;
        var msgId = Number(req.query.msgId);
        model.setClientNotificationRead(dbName,operator,msgId,docType,docId,function(err,redirectUrl){
            if(err){
                logger.error(err);
                res.render("error/500");
            }else{
                logger.debug("redirect Url = "+ redirectUrl);
                res.redirect(redirectUrl);
            }
        })
    }

};
