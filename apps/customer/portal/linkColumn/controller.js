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
    var formidable = require('formidable');
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

    // 请求 查看所有linkColumn 的页面
    app.get(PAGEURL + "/all",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), getLinksPageHandler);
    function getLinksPageHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {

            model.getLinksRetrieveAll(customerDB, function(err, result) {
                if(err) {
                    logger.error(err);
                    return res.render('error/500');
                }
                data.links = result;
                res.render('customer/portal/manage_footerSettings', {data: data});
            });
        });
    }

    //请求 添加linkColumn的页面
    app.get(PAGEURL + "/add", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), addColumnHandler);
    function addColumnHandler(req, res) {
        dataService.commonData(req, function (data) {
            data.Column = null;
            res.render('customer/portal/manage_addFooterColumn', { data: data })
        });
    }

    //请求 修改linkColum的页面
    app.get(PAGEURL + "/item/:columnId",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER),  getPageColumnHandler);
    function getPageColumnHandler(req, res) {
        var strId = req.params.columnId;
        var id = Number(strId);
        //返回假数据
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {

            model.getLinkColumOne(customerDB, id, function(err, result) {
                if (err) {
                    logger.error(err);
                    return res.render('error/500');
                }
                data.Column = result[0];
                res.render('customer/portal/manage_addFooterColumn', {data: data});
            });
        });
    }

    //Ajax 添加 linkColumn
    app.post(RESTURL,auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), auth.validateReq, postLinkColumnHandler);
    function postLinkColumnHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var objLinkObj = {
            columnIcon: req.body.iconName,
            columnName: req.body.columnName,
            isDeleted: 0
        };

        model.postLinkColumns(customerDB, objLinkObj, function(err, result) {
            if(err) {
                logger.error(err);
                return res.json(new FeedBack('fatal', '添加失败,请重试.', err));
            }
            res.json(new FeedBack(FBCode.SUCCESS, '添加成功', result));
        });
    }

    //Ajax 修改 linkColumn
    app.put(RESTURL,auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), auth.validateReq, putLinkColumnHandler);
    function putLinkColumnHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;
        var updateLinkColumn = {
            id: req.body.id,
            columnIcon: req.body.iconName,
            columnName: req.body.columnName
        };

        model.putLinkColumnOne(customerDB, clientId, updateLinkColumn, function(err, result) {
            if (err) {
                res.json(new FeedBack(FBCode.DBFAILURE, '更新失败,请重试.', err));
            } else {
                res.json(new FeedBack(FBCode.SUCCESS, '修改成功', result));
            }
        });
    }

    //Ajax 删除 linkColumn
    app.delete(RESTURL + "/:id",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), auth.validateReq, deleteLinkColumnHandler);
    function deleteLinkColumnHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var strId = req.params.id;
        var id = Number(strId);

        if (!underscore.isEmpty(strId) && !underscore.isNaN(id)) {

            model.delLinkColumnOne(customerDB, id, function(err, result) {
                if (err) {
                    logger.error(err);
                    res.json(new FeedBack(FBCode.DBFAILURE, '删除失败,错误码:' + err.code));
                } else {
                    if (result.affectedRows > 0) {
                        res.json(new FeedBack(FBCode.SUCCESS, '删除成功'));
                    } else {
                        res.json(new FeedBack(FBCode.DBFAILURE, '删除失败,错误码:' + result.message));
                    }
                }
            });
        } else {
            res.json(new FeedBack('error', '参数出错'))
        }
    }

    //Ajax 修改 linkColumn和link的排序
    app.put(RESTURL + "/orderSeq",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_FOOTER), auth.validateReq, updateLinkColumnOrder);
    function updateLinkColumnOrder(req, res) {
        var data = req.body.links;
        var customerDB = req.session.customer.customerDB;

        var temp = underscore.chain(data)
            .map(function (item, index) {
                item.links = underscore(item.subIds).map(function (item, index) {
                    return {
                        id: item,
                        orderSeq: index + 1
                    };
                });
                delete(item.subIds);
                item.orderSeq = index + 1;
                item.id = Number(item.id);
                return item;
            })
            .value();
        var columns = underscore.chain(temp)
            .map(function (item) {
                return [item.id, item.orderSeq];
            })
            .value();
        var links = underscore.chain(temp)
            .map(function (item) {
                return item.links;
            })
            .flatten(true)
            .map(function (item) {
                return underscore.values(item);
            })
            .value();

        model.putLinkColumsOrder(customerDB, columns, links, function(err, result) {
            if(err) {
                logger.error(err);
                res.json(new FeedBack(FBCode.DBFAILURE, '修改失败,错误码:' + err.code));
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS, '修改成功'));
            }
        });
    }

};
