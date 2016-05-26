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
    var underscore = require("underscore");
    var formidable = require('formidable');
    var fs = require('fs');
    var strftime = require('strftime');
    var myPath = require(__modules_path + "/mypath");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var express = require("express");
    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var md5 = require('js-md5');

    var Md5Calibrator = require(__base +"/modules/md5Calibrator");
    var md5Calibrator = new Md5Calibrator(md5);

    var MsgRobot = require(__base + "/modules/msgRobot");
    var msgRobot = new MsgRobot(md5Calibrator);

    /*
     * init app name etc
     */
    var APPNAME = myPath.getAppName(__dirname);
    var APPURL = "/" + APPNAME;
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load module
     */
    var customerModel = require(__dirname + "/../model")();
    var model = require( __dirname + "/model")();
    var clientModel = require("../client/model")();


    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */
    //系统设置相关API

    //短信网关的设置
    /**
     * 短信网关的设置 list view
     * /customer/system/smsList
     */
    app.get(APPURL + "/smsGetway", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_SMSGW), getSystemSMSHandler);
    function getSystemSMSHandler(req, res) {
        var dbName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getSMSList(dbName,function(err,smsList){
                if (err) {
                    logger.error(err);
                    res.render('error/500');
                } else {
                    data.smsList = smsList;
                    res.render("customer/center/system/setSmsGetway",{data:data})
                }
            });
        })
    }

    /**
     * 配置短信网关的首选，备选
     */
    app.post(APPURL + "/smsList", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_SMSGW), postSystemSMSHandler);
    function postSystemSMSHandler(req, res) {
        var data = req.body.data;
        var dbName = req.session.customer.customerDB;
        logger.debug(JSON.stringify(data));
        var countMain = 0;
        var countStandby = 0;
        underscore.map(data,function(item){
            if(Number(item.isMain)==1){
                countMain++;
            }
            if(Number(item.isStandby)==1){
                countStandby++;
            }
        });
        if(countMain>1||countStandby>1||countMain==0){
            return res.json(new FeedBack(FBCode.INVALIDDATA, '系统仅允许提交一个首选和一个备选网关'))
        }
        model.setSmsStatus(dbName,data,function(err,results){
            if(err){
                res.json(new FeedBack(FBCode.DBFAILURE, '数据操作出错，请重试'));
            }else{
                res.json(new FeedBack(FBCode.SUCCESS, "成功"));
            }
        });
    }


    /**
     * 特定短信网关的参数获取
     * /customer/system/sms/set?smsId=1
     */
    app.get(APPURL + "/sms/set", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_SMSGW),
        getSystemSetSMSHandler);
    function getSystemSetSMSHandler(req, res) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var smsId = req.param("smsId");
        dataService.commonData(req, function (data) {
            if(smsId){
                model.getSMSsetting(dbName,smsId,function(err,smsConfig){
                    if (err) {
                        logger.error(err);
                        res.render('error/500');
                    } else {
                        data.smsConfig = smsConfig;
                        res.json(data.smsConfig);
                    }
                });
            }
        })
    }
    app.post(APPURL + "/sms/set", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_SMSGW),
        postSystemSetSMSAddHandler);
    function postSystemSetSMSAddHandler(req, res) {
        logger.enter();
        var data = req.body;
        var customerDB = req.session.customer.customerDB;
        logger.debug(JSON.stringify(data));
        model.setSmsConfig(customerDB,data,function(err,results){
            if(err){
                res.json(new FeedBack(FBCode.DBFAILURE, '数据操作出错，请重试'));
            }else{
                res.json(new FeedBack(FBCode.SUCCESS, "成功"));
            }
        });
    }

    
    /**
     * 商品类别设置
     */
    app.get(APPURL + "/product", auth.restrict, getSystemProductHandler);
    app.post(APPURL + "/product/update", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_GOODSTYPE),
        auth.validateReq, postSystemProductUpdateHandler);
    app.post(APPURL + "/product/updateDisplayOrder", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_GOODSTYPE),
        auth.validateReq, postSystemProductUpdateDisplayOrderHandler);
    app.post(APPURL + "/product/delete", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_GOODSTYPE),
        auth.validateReq, postSystemProductDeleteHandler);

    //系统设置 ==>商品类别设置
    function getSystemProductHandler(req, res) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getProductTypes(dbName,function(err,goodsTypesList){
                if (err) {
                    logger.error(err);
                    res.render('error/500');
                } else {
                    dataService.buildJSON(dbName, underscore.sortBy(goodsTypesList, "displayOrder"), function (goodsTypes) {
                        data._goodsTypes = goodsTypes;
                        res.render('customer/center/system/setProductType', {data: data});
                    });
                }
            });

        })
    }
    /**
     * 系统设置　商品类别增加,修改
     * @param req
     * @param res
     */
    function postSystemProductUpdateHandler(req, res){
        var data = req.body.data;
        var dbName = req.session.customer.customerDB;
        model.postSystemProduct(dbName,data,function(error,result){
            if (error) {
                logger.error(error);
                res.json(new FeedBack(FBCode.DBFAILURE, '数据操作出错，请重新尝试'));
            }else{
                res.json(new FeedBack(FBCode.SUCCESS, "成功", result.insertId));
            }
        });
    }
    /**
     *更新商品类别顺序
     * @param req
     * @param res
     */
    function postSystemProductUpdateDisplayOrderHandler(req, res){
        var data = req.body.data;
        var dbName = req.session.customer.customerDB;
        logger.ndump("data", data);
        model.postGoodsCategoryOne(dbName,data,function(error,result){
            if (error) {
                logger.error(error);
                res.json(new FeedBack(FBCode.DBFAILURE, '数据操作出错，请重新尝试'));
            } else {
                res.json(new FeedBack(FBCode.SUCCESS, "成功", result.insertId));

            }
        });
    }
    /**
     * 删除一个商品类别
     * @param req
     * @param res
     */
    function postSystemProductDeleteHandler(req, res){
        var data = req.body.data;
        var dbName = req.session.customer.customerDB;
        model.forbiddenGoodsCategory(dbName, data, function (error, result) {
            if (error) {
                logger.error(error);
                if (error == "err") {
                    res.json(new FeedBack(FBCode.DBFAILURE, '请先移除该类别下所有商品，方可禁用该类别'));
                } else {
                    res.json(new FeedBack(FBCode.DBFAILURE, '数据操作出错，请重试'));
                }
            } else {
                return res.json(new FeedBack(FBCode.SUCCESS, "成功", result.insertId));
            }
        });
    }


    /**
     * 商品剂型设置
     */
    app.get(APPURL + "/productJX", auth.restrict, getSystemProductJXHandler);
    app.post(APPURL + "/productJX/add", auth.restrict,  auth.acl(__FEATUREENUM.FP_MANAGE_BASIC_OPTION),
        auth.validateReq, postSystemProductJXAddHandler);
    app.post(APPURL + "/productJX/delete", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_BASIC_OPTION),
        auth.validateReq, postSystemProductJXDelateHandler);
    //系统设置，商品剂型管理
    function getSystemProductJXHandler(req, res, next) {
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            /*
             * 获取数据库的商品剂型
             * */
            model.getDrugsTypeInfo(customerDBName, function (err, results) {
                if (err) {
                    logger.error(err);
                    res.json(new FeedBack(FBCode.DBFAILURE, "出错了，稍后重试"));
                }
                else {
                    logger.ndump('getDrugsTypeInfo: ', results);
                    data.jxs = results;
                    res.render('customer/center/system/setProductJX', {data: data});
                }
            });
        });
    }
    //系统设置，商品剂型管理 添加新的剂型
    function postSystemProductJXAddHandler(req, res, next) {
        logger.enter();
        var jxValue = req.body.jx;
        var customerDBName = req.session.customer.customerDB;
        model.addDrugsTypeInfo(customerDBName, jxValue, function(err, results){
            if(err){
                logger.error(err);
                res.json(new FeedBack(FBCode.DBFAILURE, "出错了，稍后重试"));
            }
            else{
                logger.ndump('DrugsTypeID: ', results);
                var jxId = results.insertId;
                logger.ndump('DrugsTypeID: ', jxId);
                res.json(new FeedBack(FBCode.SUCCESS, "添加剂型成功", {jxId: jxId}));
            }
        });
    }
    //系统设置，商品剂型管理 删除剂型
    function postSystemProductJXDelateHandler(req, res) {
        logger.enter();
        var jxId = Number(req.body.jxId);
        var customerDBName = req.session.customer.customerDB;
        model.delDrugsTypeInfo(customerDBName, jxId, function (err, results) {
            if (err) {
                logger.error(err);
                if (err == "err") {
                    res.json(new FeedBack(FBCode.DBFAILURE, '请先移除属于该剂型的所有商品，方可删除'));
                } else {
                    res.json(new FeedBack(FBCode.DBFAILURE, '数据操作出错，请重试'));
                }
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS, "删除成功"));
            }
        });
    }



    /**
     * 商品ＧＳＰ类别设置
     */
    app.get(APPURL + "/productGSP", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_GSP_OPTION), getSystemProductGSPHandler);
    app.post(APPURL + "/productGSP/add", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_GSP_OPTION),
        auth.validateReq, postSystemProductGSPAddHandler);
    app.post(APPURL + "/productGSP/delete", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_GSP_OPTION),
        auth.validateReq, postSystemProductGSPDelateHandler);

    //系统设置，商品GSP类别管理
    function getSystemProductGSPHandler(req, res) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getGoodsGspTypes(dbName,function(err,results){
                if(err){
                    logger.error(err);
                    res.render("error/wrong",{err:err+"get gsp Type fail"});
                }else{
                    data.gsp = results;
                    res.render('customer/center/system/setProductGSP', {data: data});
                }
            });

        })
    }

    //系统设置，商品GSP类别管理 添加新的GSP类别
    function postSystemProductGSPAddHandler(req, res) {
        logger.enter();
        var gspValue = req.body.gspValue;
        var dbName = req.session.customer.customerDB;
        model.postAddGoodsGspType(dbName,gspValue,function(err,results){
            if(err){
                logger.error(err);
                res.json(new FeedBack(FBCode.DBFAILURE, "出错了，稍后重试"));
            }else{
                var gspId = results.insertId;
                res.json(new FeedBack(FBCode.SUCCESS, "添加GSP成功",{gspId:gspId}));
            }
        });
    }

    //系统设置，商品GSP类别管理 删除GSP类别管理
    function postSystemProductGSPDelateHandler(req, res) {
        logger.enter();
        var gspId = Number(req.body.gspId);
        var dbName = req.session.customer.customerDB;
        model.delCurrentProductGspOneInfo(dbName, Number(gspId), function (err) {
            if (err) {
                logger.error(err);
                if (err == "err") {
                    res.json(new FeedBack(FBCode.DBFAILURE, '请先移除该类别下所有商品，方可删除'));
                } else {
                    res.json(new FeedBack(FBCode.DBFAILURE, '数据操作出错，请重试'));
                }
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS, "删除成功"));
            }
        });
    }


    //支付方式的设置
    //app.get(APPURL + "/paymentType", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_PAYMENT), getSystemPaymentHandler);
    app.get(APPURL + "/paymentType",  getSystemPaymentHandler);
    function getSystemPaymentHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var customerId = req.session.customer.customerId;
        dataService.commonData(req,function(data){
            model.getClientPaymentlist(customerDB,customerId, function(err, results) {
                if(err){
                    logger.error(err);
                    res.render('error/500');
                    return res.end();
                }
                data.paymentlist=results;
                //res.json(data.paymentlist);
                logger.debug("paymentlist="+JSON.stringify(data.paymentlist));
				res.render("customer/center/system/setPaymentType.ejs",{data:data})
            });
        });

    }

    /**
     * 设置某个支付方式的启用/禁用
     */
    //app.post(APPURL + "/paymentType", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_PAYMENT), postSystemPaymentHandler);
    app.post(APPURL + "/paymentType",  postSystemPaymentHandler);
    function postSystemPaymentHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var customerId = req.session.customer.customerId;
        var paymentId = req.body.paymentId;
        var isForbidden = req.body.isForbidden;
        var updateData = {
            customerId:customerId,
            paymentId:paymentId,
            isForbidden:isForbidden
        };
        model.setClientPaymentForbidden(customerDB,updateData,function(err,results){
            if (err) {
                logger.error(err);
                var feedback = new FeedBack(FBCode.DBFAILURE, '内部错误');
                res.json(feedback);
            } else {
                logger.trace(JSON.stringify(results));
                var feedback = new FeedBack(FBCode.SUCCESS, '保存成功');
                res.json(feedback);
            }
        });

    }

    //app.get(APPURL + "/payment/set", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_PAYMENT),
    //    getSystemSetPaymentAddHandler);

    app.get(APPURL + "/payment/set",
        getSystemSetPaymentAddHandler);
    function getSystemSetPaymentAddHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var customerId = req.session.customer.customerId;
        var paymentId = req.param("paymentId");
        logger.debug("paymentId = "+paymentId);
        dataService.commonData(req,function(data){
            model.getClientPaymentConfig(customerDB,customerId,paymentId,function(err, results) {
                if(err){
                    logger.error(err);
                    res.render('error/500');
                    return res.end();
                }
                data.paymentConfig=results;
                res.json(data.paymentConfig);
                //res.render("error/building",{data:{}})
            });
        });
    }

    
    app.post(APPURL + "/payment/add", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_PAYMENT),
        postSystemPaymentAddHandler);
    function postSystemPaymentAddHandler(req, res) {
        logger.enter();
        var data = req.body;
        var customerDB = req.session.customer.customerDB;
        var customerId = req.session.customer.customerId;
        var paymentData = {
            name:data.name,
            version: data.version,
            encoding:data.encoding,
            signMethod:data.signMethod,
            baseUrl:data.baseUrl
        };

        var configValueData = {
            customerId:customerId,
            isForbidden:data.isForbidden,
            configValue:data.configValue
        };
        logger.debug(JSON.stringify(paymentData));
        logger.debug(JSON.stringify(configValueData));

        model.setClientPayment(customerDB,paymentData,configValueData,function(err,results){
            if (err) {
                logger.error(err);
                var feedback = new FeedBack(FBCode.DBFAILURE, '内部错误');
                res.json(feedback);
            } else {
                logger.trace(JSON.stringify(results));
                var feedback = new FeedBack(FBCode.SUCCESS, '保存成功');
                res.json(feedback);
            }
        });
    }

    app.post(APPURL + "/payment/set", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_PAYMENT),
        postSystemPaymentSetHandler);
    function postSystemPaymentSetHandler(req, res) {
        logger.enter();
        var data = req.body;
        var customerId = req.session.customer.customerId;
        var customerDB = req.session.customer.customerDB;
        model.setClientPaymentConfigValue(customerDB,customerId,data,function(err,results){
            if (err) {
                logger.error(err);
                var feedback = new FeedBack(FBCode.DBFAILURE, '内部错误');
                res.json(feedback);
            } else {
                logger.trace(JSON.stringify(results));
                var feedback = new FeedBack(FBCode.SUCCESS, '保存成功');
                res.json(feedback);
            }
        });
    }
    app.get(APPURL+"/others",auth.restrict,getOtherSettingHandler);
    /**
     * 系统设置 ==>其他设置
     * @param req
     * @param res
     */
    function getOtherSettingHandler(req,res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req,function(data){
            model.acquireOthersInfo(customerDB, function(err, results) {
                if(err){
                    logger.error(err);
                    res.render('error/500');
                    return res.end();
                }
                data.otherSettings=results;
                res.render('customer/center/system/otherSettings',{data: data});
            });

        });
    }


    app.post(APPURL+"/others",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_AUTOSIGN),auth.validateReq,postOtherSettingHandler);
    /**
     * 系统设置中其他信息设置
     * @param req
     * @param res
     */
    function postOtherSettingHandler(req,res){
        var postData=req.body;
        var customerDB = req.session.customer.customerDB;
        var kvListData = [{
            aKey: "maxAutoReceiveDays",
            KeyAlias: "自动确认收货最大天数",         // (1~14 天)
            aValue: "14"
        },{
            aKey: "maxCheckOutDays",
            KeyAlias: "最大结帐日",                  // (1~28 天) "-1"表示月末日
            aValue: "28"
        },{
            aKey: "maxAutoCloseOrderDays",
            KeyAlias: "未付款自动关闭订单最大天数",      // (1~3 天)
            aValue: "3"
        },{
            aKey: "autoReceiveDays",
            KeyAlias: "自动确认收货天数",
            aValue: postData.autoReceiveDays
        },{
            aKey: "checkOutDays",
            KeyAlias: "结帐日",
            aValue: postData.checkOutDays
        },{
            aKey: "autoCloseOrderDays",
            KeyAlias: "未付款自动关闭订单天数",
            aValue: postData.autoCloseOrderDays
        }];
        var fb;
        model.updateOthersInfo(customerDB, kvListData, function(err, results){
            if(err){
                logger.error(err);
                fb=new FeedBack(FBCode.DBFAILURE,"修改其他信息失败，" + err.code);
                res.json(fb);
            }
            else{
                fb=new FeedBack(FBCode.SUCCESS, "更新成功", null);
                res.json(fb);
            }
        });
    }

    // 操作员日志
    app.get(APPURL + "/operatorLog", auth.restrict, auth.validateReq, auth.acl(__FEATUREENUM.FP_VIEW_LOG)
        , getSystemCustomerOperatorLogHandler);
    /**
     * 操作员日志
     * @param req
     * @param res
     */
    function getSystemCustomerOperatorLogHandler(req, res) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        // 操作员名称
        var operatorName = req.query.on;
        if(underscore.isUndefined(operatorName)){
            operatorName = '';
        }

        dataService.commonData(req, function (data) {
            model.getOperatorLogInfo(dbName, false, operatorName, paginator, function (error, result) {
                if (error) {
                    logger.error(error);
                    res.json(new FeedBack(FBCode.DBFAILURE, '获取失败,数据库出错:' + error.code));
                } else {
                    data.logList =result;
                    data.searchContent = operatorName;
                    data.paginator = clientModel.restorePurePaginator(paginator);
                    res.render('customer/center/operatorLog/operatorLog', {data: data})
                }
            });
        });

    }


    //包装单位设置
    app.get(APPURL + "/packUnit", auth.restrict, getSystemPackUnitHandler);
    app.post(APPURL + "/packUnit/add", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_BASIC_OPTION),
        auth.validateReq, postSystemPackUnitAddHandler);
    app.post(APPURL + "/packUnit/remove", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_BASIC_OPTION),
        auth.validateReq, postSystemPackUnitRemoveHandler);
    //系统设置==>单位设置==>
    function getSystemPackUnitHandler(req,res){
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getPackUnit(customerDBName,function(err,packUnits){
                data.packUnits = packUnits;
                logger.ndump("pack unit result",data);
                res.render('customer/center/system/setPackUnit', {data: data})
            });
        });
    }
    //系统设置==>单位设置==>新增方案
    function postSystemPackUnitAddHandler(req,res){
        var packUnit = req.body.packUnit;
        var customerDBName = req.session.customer.customerDB;
        logger.debug(packUnit);
        model.postNewPackUnit(customerDBName,packUnit,function(err,packUnitId){
            var fb;
            if(err){
                if (err.code==="ER_DUP_ENTRY")
                    fb = new FeedBack(FBCode.DUPDATA, "单位已存在，请勿重复添加！");
                else
                    fb = new FeedBack(FBCode.DBFAILURE, err.toString);
            }else{
                fb = new FeedBack(FBCode.SUCCESS, "添加单位成功",{packUnitId:packUnitId});
            }
            res.json(fb);
        });

    }
    //系统设置==>单位设置==>删除单位
    function postSystemPackUnitRemoveHandler(req,res){
        var packUnitId = req.body.packUnitId;
        var customerDBName = req.session.customer.customerDB;
        model.deleteSystemPackUnit(customerDBName,packUnitId,function(err,result){
            var fb;
            if(err){
                fb = new FeedBack(FBCode.DBFAILURE, "删除失败");
            }else{
                fb = new FeedBack(FBCode.SUCCESS, "删除单位成功",{result:result});
            }
            res.json(fb);
        });

    }


    //库存设置
    app.get(APPURL + "/inventory", auth.restrict,auth.validateReq,getSystemInventoryHandler);
    app.get(APPURL + "/inventory/add",auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_INVENTORYDISPLAY),
        auth.validateReq, getSystemInventoryAddHandler);
    app.post(APPURL + "/inventory/add",auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_INVENTORYDISPLAY),
        auth.validateReq,postSystemInventoryAddHandler);
    app.get(APPURL + "/inventory/editSubCate",auth.restrict,  auth.acl(__FEATUREENUM.FP_MANAGE_INVENTORYDISPLAY),
        auth.validateReq, getSystemInventoryEditSubCateHandler);
    app.post(APPURL + "/inventory/editSubCate",auth.restrict,  auth.acl(__FEATUREENUM.FP_MANAGE_INVENTORYDISPLAY),
        auth.validateReq, postSystemInventoryEditSubCateHandler);
    app.get(APPURL + "/inventory/edit",auth.restrict,  auth.acl(__FEATUREENUM.FP_MANAGE_INVENTORYDISPLAY),
        auth.validateReq, getSystemInventoryEditHandler);
    app.post(APPURL + "/inventory/remove",auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_INVENTORYDISPLAY),
        auth.validateReq,postSystemInventoryRemoveHandler);
    app.post(APPURL + "/inventory/setDefault",auth.restrict,  auth.acl(__FEATUREENUM.FP_MANAGE_INVENTORYDISPLAY),
        auth.validateReq,postSystemInventorySetDefaultHandler);
    //系统设置 ==>库存设置
    function getSystemInventoryHandler(req, res) {
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getAllGoodsInventoryPlan(customerDBName,function(err,plans){
                if(err){
                    res.render("error/500");
                }else{
                    res.render('customer/center/system/setInventory', {data: data,plans:plans})
                }

            });
        });
    }

    //系统设置==>库存设置==>新增方案
    function getSystemInventoryAddHandler(req,res){
        logger.enter();
        dataService.commonData(req, function (data) {
            res.render('customer/center/system/InventoryAdd', {data: data})
        });
    }

    //系统设置==>库存设置==>新增方案
    function postSystemInventoryAddHandler(req,res){
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        var data = req.body;
        var planName = data.planName;
        var itemKeys = data.inventoryKeys;
        var itemVals = data.inventoryVals;
        customerModel.transAddInventoryPlan(customerDBName,planName,itemKeys,itemVals,function(err,inventoryPlanId){
            var fb;
            if(!err){
                fb = new FeedBack(FBCode.SUCCESS, "方案已成功添加",{results:inventoryPlanId});
            }else{
                if (err.code==="ER_DUP_ENTRY"){
                    fb = new FeedBack(FBCode.DUPDATA, "方案名已存在，请勿重复添加！");
                } else {
                    fb = new FeedBack(FBCode.DBFAILURE, err.toString);
                }
            }
            res.json(fb);
        });
    }

    //系统设置==>库存设置==>修改方案
    function getSystemInventoryEditSubCateHandler(req,res){
        logger.enter();
        dataService.commonData(req, function (data) {
            res.render('customer/center/system/inventoryEdit', {data: data})
        });
    }

    //系统设置==>库存设置==>修改方案
    function postSystemInventoryEditSubCateHandler(req,res){
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        var data = req.body;
        var planName = data.planName;
        var planId = data.planId;
        var updateData = data.items;

        customerModel.transUpdateInventoryPlan(customerDBName,planName,updateData,planId,function(err,results){
            var fb;
            if(!err){
                fb = new FeedBack(FBCode.SUCCESS, "方案修改成功",{results:results});
            }else{
                fb = new FeedBack(FBCode.DBFAILURE, err.toString);

            }
            res.json(fb);
        });
    }
    //系统设置==>库存设置==>修改方案
    function getSystemInventoryEditHandler(req,res){
        logger.enter();
        var id = req.param("id");
        var customerDBName = req.session.customer.customerDB;
        logger.debug(id);
        model.getGoodsInventoryPlanDetail(customerDBName,id,function(err,planDetails){
            var fb;
            if(!err){
                fb = new FeedBack(FBCode.SUCCESS,"获取库存方案详情成功",planDetails);
            } else{
                fb = new FeedBack(FBCode.DBFAILURE, err.toString);
            }
            res.json(fb);
        });

    }

    //系统设置==>库存设置==>新增方案
    function postSystemInventoryRemoveHandler(req,res){
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        var data = req.body;
        var id = data.id;
        logger.debug(id);
        model.deleteGoodsInventoryPlanDetail(customerDBName,id,function(err,result){
            var fb;
            if(!err){
                fb = new FeedBack(FBCode.SUCCESS,"删除方案成功",result);
            }else{
                fb = new FeedBack(FBCode.DBFAILURE, err.toString);
            }
            res.json(fb);
        });
    }
    //系统设置==>库存设置==>设为默认方案
    function postSystemInventorySetDefaultHandler(req,res){
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        var data = req.body;
        var id = data.id;
        var status = data.status;
        var updateData = {"isDefault":status};
        logger.debug(id);
        model.putDefaultInventoryPlan(customerDBName,updateData,id,function(err,result){
            if(!err){
                res.json(new FeedBack(FBCode.SUCCESS,"更新方案成功",result));
            }else{
                res.json(new FeedBack(FBCode.DBFAILURE, err.toString));
            }
        });

    }


    /**
     * 客户类设置
     */
    app.get(APPURL + "/customer",auth.restrict,auth.validateReq,getSystemCustomerHandler);
    app.post(APPURL + "/customer/add",auth.restrict,  auth.acl(__FEATUREENUM.FP_MANAGE_CLIENTCATEGORY),
        auth.validateReq,postSystemCustomerAddHandler);
    app.post(APPURL + "/customer/edit",auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_CLIENTCATEGORY),
        auth.validateReq,postSystemCustomerEditClientCateHandler);
    app.post(APPURL + "/customer/remove",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_CLIENTCATEGORY),
        auth.validateReq,postSystemCustomerRemoveClientCateHandler);
    ///系统设置==>客户类设置 start
    //系统设置==>客户类设置
    function getSystemCustomerHandler(req,res){
        logger.enter();
        dataService.commonData(req, function (data) {
            var customerDB = req.session.customer.customerDB;
            model.getClientCategorylist(customerDB,function(error,result){
                if (error) {
                    logger.error(error);
                    res.render("error/500");
                } else {
                    data.clientCategory  = underscore(result).map(function (item) { return { id: item.id, name: item.categoryName } });
                    res.render('customer/center/system/setCustomerType', {data: data})
                }
            });
        });
    }

    //系统设置==>客户类设置
    function postSystemCustomerAddHandler(req, res){
        logger.enter();
        var clientCategory = req.body.categoryName;
        var dbName = req.session.customer.customerDB;
        model.postNewClientCategory(dbName, clientCategory, function(error,result){
            if (error) {
                logger.error(error);
                res.json(new FeedBack(FBCode.DBFAILURE, '新增客户类别失败'));
            } else {
                res.json(new FeedBack(FBCode.SUCCESS, '新增客户类别成功.'))
            }
        });

    }

    //系统设置==>客户类修改
    function postSystemCustomerEditClientCateHandler(req,res){
        logger.enter();
        var categoryName = req.body.categoryName;
        var categoryId = req.body.categoryId;
        var dbName = req.session.customer.customerDB;
        model.putSystemEditClientCateory(dbName, categoryId, categoryName,function(error,result){
            if (error) {
                logger.error(error);
                res.json(new FeedBack(FBCode.DBFAILURE, '更新失败,可能是数据库出错了:' + error.code));
            } else {
                res.json(new FeedBack(FBCode.SUCCESS, '修改成功!'));
            }
        });

    }

    //系统设置==>客户类删除
    function postSystemCustomerRemoveClientCateHandler(req,res){
        logger.enter();
        var categoryId = req.body.categoryId;
        var dbName = req.session.customer.customerDB;
        logger.ndump("categoryId", categoryId);
        model.delCurrentClientCategoryInfo(dbName, categoryId, function (error) {
            if (error) {
                logger.error(error);
                if (error == "err") {
                    res.json(new FeedBack(FBCode.DBFAILURE, '请先移除该类别下所有客户，方可删除'));
                } else {
                    res.json(new FeedBack(FBCode.DBFAILURE, '数据操作出错，请重试'));
                }
            } else {
                return res.json(new FeedBack(FBCode.SUCCESS, "成功"));
            }
        });
    }


    //erp设置
    app.get(APPURL+"/erpSetting",auth.restrict,auth.validateReq, auth.acl(__FEATUREENUM.FP_MANAGE_ERP),getSystemErpSettings);
    //系统设置==>erp设置==>跳转到页面
    function getSystemErpSettings(req, res, next){
        var cId = req.session.customer.customerId;
        dataService.commonData(req, function (data) {
            model.getSystemERPsetting(req, data, cId,function(error,data){
                if(error){
                    res.render("error/500");
                }else{
                    res.render('customer/center/system/erpSettings',{data:data});
                }
            });
        });
    }
    app.get(APPURL + "/get/appKey/", auth.restrict, auth.validateReq, auth.acl(__FEATUREENUM.FP_MANAGE_ERP), getAppKeyHandler);
    function getAppKeyHandler(req, res) {
        var userId = req.session.customer.customerId;
        var key = msgRobot.generateAppKey(userId);
        var feedback = new FeedBack(FBCode.SUCCESS, '生成成功', key);
        res.json(feedback);
    }
    app.post(APPURL + "/erpSetting", auth.restrict, auth.validateReq, auth.acl(__FEATUREENUM.FP_MANAGE_ERP),postERPSettingHandler);
    function postERPSettingHandler(req, res) {
        var erpIsAvailable = Number(req.body.erpEnabled == "true");
        var erpAppCodeUrl = req.body.erpAppCodeUrl;
        var erpMsgUrl = req.body.erpMsgUrl;
        var appKey = req.body.appKey;
        var customerId = req.session.customer.customerId;
        var dbName = __cloudDBName;
        model.putERPSetting(dbName, customerId, erpIsAvailable, erpAppCodeUrl, erpMsgUrl, appKey,function(error,result){
            if (error) {
                logger.error(error);
                var feedback = new FeedBack(FBCode.DBFAILURE, '内部错误');
                res.json(feedback);
            } else {
                logger.trace(result);
                var feedback = new FeedBack(FBCode.SUCCESS, '保存成功');
                res.json(feedback);
            }
        });
    }




    //区域设置
    app.get(APPURL+"/domainSetting",auth.restrict,auth.restrict,
        auth.validateReq,getDomainSettingHandler);
    function getDomainSettingHandler(req,res){
        dataService.commonData(req, function (data) {
            var customerDB = req.session.customer.customerDB;
            model.getDomainSetting(customerDB,function(err,results){
                if (err) {
                    logger.error(err);
                    res.render('error/wrong',{err: err});
                } else {
                    data.clientAreas  = results;
                    res.render('customer/center/system/domainSetting', {data: data})
                }
            });

        });
    }

    app.post(APPURL+"/domainSetting/add",auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_BASIC_OPTION),
        auth.validateReq,postAddDomainSettingHandler);
    function postAddDomainSettingHandler(req,res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var name = req.body.name;
        model.postNewDomainSetting(customerDB,name,function(error,result){
            if (error) {
                logger.error(error);
                var feedback = new FeedBack(FBCode.DBFAILURE, '内部错误');
                res.json(feedback);
            } else {
                logger.trace(result);
                var feedback = new FeedBack(FBCode.SUCCESS, '新增区域成功',result);
                res.json(feedback);
            }
        });
    }

    app.post(APPURL+"/domainSetting/update",auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_BASIC_OPTION),
        auth.validateReq,postUpdateDomainSettingHandler);
    function postUpdateDomainSettingHandler(req,res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var id = req.body.id;
        var name = req.body.name;
        model.putDomainSetting(customerDB,id,name,function (error, result){
            if (error) {
                logger.error(error);
                var feedback = new FeedBack(FBCode.DBFAILURE, '内部错误');
                res.json(feedback);
            } else {
                logger.trace(result);
                var feedback = new FeedBack(FBCode.SUCCESS, '更新区域成功');
                res.json(feedback);
            }
        });
    }

    app.post(APPURL+"/domainSetting/delete",auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_BASIC_OPTION),
        auth.validateReq,postDeleteDomainSettingHandler);
    function postDeleteDomainSettingHandler(req,res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var id = req.body.id;
        model.deleteDomainSetting(customerDB,id,function (error, result){
            if (error) {
                logger.error(error);
                var feedback = new FeedBack(FBCode.DBFAILURE, '内部错误');
                res.json(feedback);
            } else {
                logger.trace(result);
                var feedback = new FeedBack(FBCode.SUCCESS, '删除区域成功');
                res.json(feedback);
            }
        });
    }
};