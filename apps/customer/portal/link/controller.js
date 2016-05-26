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
    var RESTURL = "/rest/" + APPNAME;
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    //请求 添加link 的页面
    app.get(PAGEURL + "/add/:columnId", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), addPageColumnAddHandler);
    function addPageColumnAddHandler(req, res) {
        var columnId = req.params.columnId;//这个id是父类的ID
        dataService.commonData(req, function (data) {
            data.subLink = null;
            data.id = columnId;
            res.render('customer/portal/manage_addFooterRowColumn', { data: data });
        });
    }

    //请求 查看link 的页面
    app.get(PAGEURL + "/item/:id",auth.restrict,getPageLinkHandler);
    function getPageLinkHandler(req, res) {
        var strId = req.params.id;
        var id = Number(strId);
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {

            model.getLinkRetrieveOne(customerDB, id, function(err, result) {
                if(err) {
                    logger.error(err);
                    res.render('error/500');
                }
                else {
                    var link = {
                        id: id,
                        title: result[0].name
                    };
                    data.subLink = link;
                    res.render('customer/portal/manage_addFooterRowColumn', {data: data });
                }
            });
        });
    }

    //Ajax 获取 link(JSON格式)
    app.get(RESTURL + "/:id",auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), getLinkHandler);
    function getLinkHandler(req, res) {
        var strId = req.params.id;
        var id = Number(strId);
        var customerDB = req.session.customer.customerDB;
        model.getLinkRetrieveOne(customerDB, id, function (err, result) {
            if (err) {
                return;
            }
            var link = {
                id: id,
                title: result[0].name,
                html: result[0].html
            };
            res.send(new FeedBack(FBCode.SUCCESS, '取回html数据', link));
        });
    }

    //Ajax 新增 link
    app.post(RESTURL,auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), auth.validateReq,postLinkHandler);
    function postLinkHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var link = {
            columnId: Number(req.body.columnId),
            name: req.body.name,
            html: req.body.html
        };
        model.postLinkOne(customerDB, link, function(err, result) {
            if(err) {
                logger.error(err);
                res.json(new FeedBack('fatal', '添加失败,请重试.', err));
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS, '添加成功', result));
            }
        });
    }

    //Ajax 删除 link
    app.delete(RESTURL + "/:id", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), auth.validateReq,deletelinkHandler);
    function deletelinkHandler(req, res) {
        var strId = req.params.id;//传入的子标题ID
        var linkId = Number(strId);
        var customerDB = req.session.customer.customerDB;

        model.delLinkOne(customerDB, linkId, function(err, result) {
            if (err) {
                res.json(new FeedBack(FBCode.DBFAILURE, '删除失败,错误码:' + err.code));
                logger.error(err);
            } else {
                if (result.affectedRows > 0) {
                    res.json(new FeedBack(FBCode.SUCCESS, '删除成功'));
                } else {
                    res.json(new FeedBack(FBCode.DBFAILURE, '删除失败,错误码:' + result.message));
                }
            }
        });
    }

    //Ajax 修改 link
    app.put(RESTURL,auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER),  auth.validateReq,putLinkHandler);
    function putLinkHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var link = {
            id: Number(req.body.id),
            name: req.body.name,
            html: req.body.html
        };

        model.putLinkOne(customerDB, link, function(err, result) {
            if (err) {
                logger.error(err);
                return res.json(new FeedBack(FBCode.DBFAILURE, '更新失败,请重试,错误:' + err.code, err));
            }
            res.json(new FeedBack(FBCode.SUCCESS, '更新成功.', result));
        });
    }
};
