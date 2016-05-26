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
    var path = require('path');
    var myPath = require(__modules_path + "/mypath");
    var underscore = require("underscore");
    var strftime = require('strftime');
    var fs = require('fs');
    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var model = require('./model')();
    /*
     * init app name etc
     */
    var APPNAME = myPath.getAppName(__dirname);

    var APPURL = "/" + APPNAME;
    var PAGEURL = "/page/" + APPNAME;
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    // 投诉管理列表页面
    app.get(PAGEURL, auth.restrict, getComplaintsHandler);
    //获取投诉电话列表管理页面
    function getComplaintsHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getAllContractPhone(customerDB, function(err, result) {
                if(err) {
                    logger.error(err);
                    return res.render('error/500');
                }
                data.complaints = result;
                res.render('customer/portal/manage_complaints', {data: data});
            });
        });
    }

    //门户设置，投诉电话管理 添加新的投诉电话
    app.post(PAGEURL + '/add', auth.restrict, auth.validateReq, postComplaintsPhoneAddHandler);
    //门户设置，投诉电话管理 添加新的投诉电话
    function postComplaintsPhoneAddHandler(req, res) {
        logger.enter();
        var complaints = req.body.complaints;

        //TODO 根据发送过来的数据存储
        /*
         * 发送过来的数据{complaints: value}
         * */
        res.json(new FeedBack(FBCode.SUCCESS, "添加投诉电话成功", {complaintsId: '123'}));
    }

    //门户设置，投诉电话管理 删除投诉电话
    app.post(PAGEURL + '/delete', auth.restrict, auth.validateReq, postComplaintsPhoneDeleteHandler);
    //门户设置，投诉电话管理 删除新的投诉电话
    function postComplaintsPhoneDeleteHandler(req, res) {
        logger.enter();
        var complaintsId = req.body.complaintsId;

        //TODO 根据发送过来的数据存储
        /*
         * 发送过来的数据{complaintsId: value}
         * */
        res.json(new FeedBack(FBCode.SUCCESS, "删除投诉电话成功"));
    }

    //门户设置，投诉电话管理 更新投诉电话
    app.post(PAGEURL + '/update', auth.restrict, auth.validateReq, postComplaintsPhoneUpdateHandler);
    //门户设置，投诉电话管理 更新新的投诉电话
    function postComplaintsPhoneUpdateHandler(req, res) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var newData = {
            id: req.body.id,
            name: req.body.name,
            content: req.body.content
        };

        model.postOneContractPhone(customerDB, newData, function(err, result) {
            if(err) {
                logger.error(err);
                return res.json(new FeedBack(FBCode.DBFAILURE, {}));
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS, {data: result}));
            }
        });
    }
};
