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
    /*
     * load project modules
     */
    var auth = require(__modules_path + '/auth');
    var myPath = require(__modules_path + "/mypath");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;

    /*
     * init app name etc
     */
    var APPNAME = myPath.getAppName(__dirname);
    var APPURL = "/" + APPNAME;

    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load model
     */
    var model = require(__dirname + "/model")();

    /*
     * URL mapping
     */
    app.get(APPURL, auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_OPERATOR), getListAccountsHandler);
    /**
     *  list all account
     */
    function getListAccountsHandler(req, res){
        var customerDBName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getAllOperators(customerDBName, function (err, results) {
                if (err) {
                    logger.error(err);
                    res.render("error/500")
                } else {
                    data.accounts = results;
                    res.render("customer/center/account/account", {
                        data: data
                    })
                }
            });
        });
    }

    app.get(APPURL + "/add", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_OPERATOR), getAddAccountHandler);
    /**
     * add account  get view
     * @param req
     * @param res
     */
    function getAddAccountHandler(req, res){
        dataService.commonData(req, function (data) {
            var  permissionRawData=__FEATUREGROUPS;
            var formatData=formatPermissionData(permissionRawData,null);
            data.permissionData=formatData;
            data.user=null;
            data.permissionData=formatData;
            res.render("customer/center/account/edit_new",{
                data: data
            })
        });
    }


    app.post(APPURL + "/add", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_OPERATOR), auth.validateReq, postAddAccountHandler);
    /**
     * edit account
     * @param req
     * @param res
     */
    function postAddAccountHandler(req, res){
        logger.enter();
        var operatorInfo = req.body.updateData;
        var customerDBName = req.session.customer.customerDB;
        operatorInfo.operatorType = "CUSTOMER";
        operatorInfo.customerId = req.session.customer.customerId;
        var isDisableOperator = (operatorInfo && operatorInfo.enable && operatorInfo.enable==0);
        var fb;
        model.postAddOperatorInfo(customerDBName, operatorInfo, function (err, result) {
            if (err) {
                if (err == "INTERNALERROR") {
                    fb = new FeedBack(FBCode.INTERNALERROR, "加密失败, 请稍后重试");
                } else if (err == "ER_DUP_ENTRY") {
                    fb = new FeedBack(FBCode.DUPDATA, "账户已经存在，请勿重复添加");
                } else if (err == "ADD_FAILUER") {
                    fb = new FeedBack(FBCode.DBFAILURE, "操作员添加失败");
                }
                res.json(fb);
            } else {
                if (isDisableOperator) {
                    fb = new FeedBack(FBCode.SUCCESS, "该账户已被禁用, ", result);
                } else {
                    fb = new FeedBack(FBCode.SUCCESS, '操作员添加成功', result);
                }
                res.json(fb);
            }
        });
    }


    app.get(APPURL + "/edit", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_OPERATOR), auth.validateReq, getEditAccountHandler);
    /*
     *　edit account get view
     */
    function getEditAccountHandler(req, res){
        var operatorId = req.param("operatorId");
        var action = req.param("action");
        var customerDBName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            data.action = action;
            model.getEditAccountInfo(customerDBName, data, operatorId, function (err, data) {
                if (err) {
                    logger.error(err);
                    res.render("error/wrong");
                } else {
                    res.render("customer/center/account/edit_new", {
                        data: data
                    })
                }
            });
        });
    }


    app.post(APPURL + "/edit", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_OPERATOR), auth.validateReq, postEditAccountHandler);
    /*
     *　edit account get view
     */
    function postEditAccountHandler(req, res){
        logger.enter();
        var updateData = req.body.updateData;
        var operatorId = req.body.operatorId;
        var customerDBName = req.session.customer.customerDB;
        logger.debug(JSON.stringify(updateData));
        var isDisableOperator = (updateData && updateData.enable && updateData.enable==0);
        model.putOperatorInfo(customerDBName, updateData, operatorId, function (err, result) {
            var fb;
            if(err){
                if (err === "ER_DUP_ENTRY")
                    fb = new FeedBack(FBCode.DUPDATA, "账户已经存在，请勿重复添加");
                else if (err === "DBFAILURE")
                    fb = new FeedBack(FBCode.DBFAILURE, "账户信息修改失败");
            }else{
                fb = new FeedBack(FBCode.SUCCESS, '操作员信息已修改成功', result);
                if (isDisableOperator) {
                    fb = new FeedBack(FBCode.SUCCESS, "该账户已被禁用, " ,result);
                }
            }
            res.json(fb);
        });
    }


    function formatPermissionData(permissionData, operatorRoles) {
        var isDefault = underscore.isNull(operatorRoles) || underscore.isUndefined(operatorRoles);

        var renderPermissionData = [];
        var keys = Object.keys(permissionData);
        for (var index in keys) {
            var key = keys[index];
            var permissionItem = {
                key: key,
                subNodes: [],
                value: true
            };
            var subObj = permissionData[key];
            var subNodesKeys = Object.keys(subObj);
            for (var subIndex in subNodesKeys) {
                var subKey = subNodesKeys[subIndex];
                var status = isDefault ? subObj[subKey].value : underscore.contains(JSON.parse(operatorRoles), subKey);

                var subNode = {
                    key: subKey,
                    description: subObj[subKey].description,
                    value: status
                };
                /*subObj[subKey].value*/
                /*subObj[subKey].value*/
                if (permissionItem.value == true && status == false) {
                    permissionItem.value = false;
                }
                permissionItem.subNodes.push(subNode);
            }
            renderPermissionData.push(permissionItem);
        }
        return renderPermissionData;
    }

};