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
    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var CONSTANTS = require(__modules_path + "/SystemConstants");
    var message = require(__modules_path + "/message");

    /*
     * init app name etc
     */

    var myPath = require(__modules_path + "/mypath");
    var APPNAME = myPath.getAppName(__dirname);

    var APPURL = "/" + APPNAME;

    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load module
     */

    var customerModel = require(__base + "/apps/customer/model")();
    var model = require(__dirname + "/model")();
    var clientModel = require(__base + "/apps/customer/client/model")();

    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */

    app.put(APPURL + "/goods/inventory", auth.restrict,
        auth.acl(__FEATUREENUM.FP_INVENTORY_GOODS), function (req, res) {
        logger.enter();

        var inventorys = req.body.inventorys;
        var customerDB = req.session.customer.customerDB;

        var data = {
            inventorys: inventorys
        };

        var values = underscore(inventorys).map(function (item) {
            return underscore.values(item);
        });

        model.postGoodsInventory(customerDB, values, function(error, result) {
            if (error) {
                logger.error(error);
                return new FeedBack(FBCode.DBFAILURE, "数据库开小差了,请稍后重试" + error.code);
            }
            res.json(new FeedBack(FBCode.SUCCESS, "ok", data));
        });
    });

    app.put(APPURL + "/goods/inventory/:goodsId",auth.restrict,
        auth.acl(__FEATUREENUM.FP_INVENTORY_GOODS),  function (req, res) {

        var goodsId = req.params.goodsId;
        var inventory = req.body.inventory;
        var customerDB = req.session.customer.customerDB;

        model.putGoodsInventoryOne(customerDB, goodsId, inventory, function(error, result) {
            if (error) {
                logger.error(error);
                return new FeedBack(FBCode.DBFAILURE, "数据库开小差了,请稍后重试" + error.code);
            }
            var feedbackData = {
                goodsId: goodsId,
                inventory: inventory
            };

            res.json(new FeedBack(FBCode.SUCCESS, "ok", feedbackData));
        });
    });

    //价格设定 start
    //商品管理->价格设定
    app.get(APPURL + "/setprice", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS), getGoodsSetPriceHandler);
    function getGoodsSetPriceHandler(req, res, next) {

        var paginator = customerModel.createGoodsPaginator(req);
        var customerDB = req.session.customer.customerDB;
        var goodsTypeId = req.query.cbv || 0;
        dataService.commonData(req, function (data) {
            data.handlerType = 'setprice';
            customerModel.getGoodsForCustomerManager(customerDB, paginator, goodsTypeId, data.handlerType, function (err, goodslist) {
                if (!err) {
                    data['paginator'] = customerModel.restoreGoodsPaginator(paginator);
                    data.goodsList = goodslist;
                    data['paginator'].cbv= req.query.cbv || '0';


                    //a = underscore.sortBy(a);

                    res.render('customer/center/goods/priceSet', {data: data});
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }
            });
        });

    }

    //商品管理->价格设定->调价一览表
    app.get(APPURL + "/setgoodallprice", auth.restrict,  auth.acl(__FEATUREENUM.FP_VIEW_PRICE), auth.validateReq, getSetSingleGoodPriceHandler);
    function getSetSingleGoodPriceHandler(req, res, next) {
        var goodsId = req.query.goodsId;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        dataService.commonData(req, function (data) {
            //获取商品的基本信息
            model.getSingleGoodPriceData(customerDB, goodsId, operatorData, function (err, results) {
                if (!err) {

                    data.priceData = results;

                    res.render('customer/center/goods/priceset/setGoodAllPrice', {data: data})
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }
            })

        });
    }

    //商品管理->价格设定->调价一览表(提交数据)
    app.post(APPURL + "/setgoodallprice", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, postSetSingleGoodPriceHandler);
    function postSetSingleGoodPriceHandler(req, res, next) {

        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var priceData = req.body;
        //生成调价单记录
        model.checkReadjustStatus(customerDB, priceData, function (enable) {
            var fb;
            if (enable) {
                model.creatReadjustPrice(customerDB, operatorData, priceData, function (err, results) {
                    if (!err) {
                        fb = new FeedBack(FBCode.SUCCESS, "调价单已创建成功", {results: results});
                    } else {
                        fb = new FeedBack(FBCode.DBFAILURE, "调价单创建失败, " + err);
                    }
                    res.json(fb);
                });
            } else {
                fb = new FeedBack(FBCode.INVALIDACTION, "该商品还有待审核调价单未处理,请先联系审核员审核");
                res.json(fb);
            }
        });

    }

    //商品管理->价格设定->基础价格设定
    app.get(APPURL + "/setgoodbasicprice", auth.restrict,auth.acl(__FEATUREENUM.FP_PRICE_GOODS), auth.validateReq, getSetBasicPriceHandler);
    function getSetBasicPriceHandler(req, res) {
        //需要的商品信息 数据：
        var goodsId = req.query.goodsId;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        dataService.commonData(req, function (data) {
            customerModel.getSingleGoodPriceData(customerDB, goodsId, operatorData, function (err, results) {
                if (!err) {
                    data.priceData = results;
                    res.render('customer/center/goods/priceset/setBasicPrice', {data: data})
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }
            })
        });

    }

    //商品管理->价格设定->基础价格设定(提交数据)
    app.post(APPURL + "/setgoodbasicprice", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),auth.validateReq, postGoodBasicPriceHandler,message.postMsg);
    function postGoodBasicPriceHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var priceData = req.body;

        //生成调价单记录
        customerModel.checkReadjustStatus(customerDB, priceData, function (enable) {
            var fb;
            if (enable) {
                customerModel.creatReadjustPrice(customerDB, operatorData, priceData, function (err, results) {
                    if (!err) {
                        fb = new FeedBack(FBCode.SUCCESS, "调价单已创建成功", {results: results});
                        req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_APPROVE_PRICE, "DOC_PRICE", results[0], null, operatorData.operatorName+"提交了新的调价单"+results[0]+"，去处理>");
                        res.json(fb);
                        return next();
                    } else {
                        fb = new FeedBack(FBCode.DBFAILURE, "调价单创建失败, " + err);
                    }
                    res.json(fb);
                });
            } else {
                fb = new FeedBack(FBCode.INVALIDACTION, "该商品还有待审核调价单未处理,请先联系审核员审核");
                res.json(fb);
            }
        });

    }


    //商品管理->价格设定->客户单品价格设定
    app.get(APPURL + "/setclientprice", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),auth.validateReq, getSetClientPriceHandler);
    function getSetClientPriceHandler(req, res, next) {
        //需要的商品信息 数据：
        var goodsId = req.query.goodsId;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        dataService.commonData(req, function (data) {
            customerModel.getSingleGoodPriceData(customerDB, goodsId, operatorData, function (err, results) {
                if (!err) {
                    data.priceData = results;
                    res.render('customer/center/goods/priceset/setClientPrice', {data: data})
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }
            })
        });

    }

    //商品管理->价格设定->客户单品价格设定(提交数据)
    app.post(APPURL + "/setclientprice", auth.restrict,auth.acl(__FEATUREENUM.FP_PRICE_GOODS), auth.validateReq, postGoodClientPriceHandler,message.postMsg);
    function postGoodClientPriceHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var priceData = req.body;
        //生成调价单记录
        customerModel.checkReadjustStatus(customerDB, priceData, function (enable) {
            var fb;
            if (enable) {
                customerModel.creatReadjustPrice(customerDB, operatorData, priceData, function (err, results) {
                    if (!err) {
                        fb = new FeedBack(FBCode.SUCCESS, "调价单已创建成功", {results: results});
                        req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_APPROVE_PRICE, "DOC_PRICE", results[0], null, operatorData.operatorName+"提交了新的调价单"+results[0]+"，去处理>");
                        res.json(fb);
                        return next();
                    } else {
                        fb = new FeedBack(FBCode.DBFAILURE, "调价单创建失败, " + err);
                    }
                    res.json(fb);
                });
            } else {
                fb = new FeedBack(FBCode.INVALIDACTION, "该商品还有待审核调价单未处理,请先联系审核员审核");
                res.json(fb);
            }
        });

    }

    //商品管理->价格设定->客户类价格设定
    app.get(APPURL + "/setclientcategoryprice", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),auth.validateReq, getClientCategoryPriceHandler);
    function getClientCategoryPriceHandler(req, res, next) {
        var goodsId = req.query.goodsId;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        dataService.commonData(req, function (data) {
            customerModel.getSingleGoodPriceData(customerDB, goodsId, operatorData, function (err, results) {
                if (!err) {
                    //获取客户类别
                    model.getClientCategory(customerDB, function (err, clientCategories) {
                        if (!err) {
                            data.clientCategories = clientCategories;
                            data.priceData = results;
                            res.render('customer/center/goods/priceset/setClientCategoryPrice', {data: data});
                        }
                    });
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }
            })
        });
    }

    //商品管理->价格设定->客户类价格设定(提交数据)
    app.post(APPURL + "/setclientcategoryprice", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),auth.validateReq, postClientCategoryPriceHandler, message.postMsg);
    function postClientCategoryPriceHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var priceData = req.body;
        //生成调价单记录
        customerModel.checkReadjustStatus(customerDB, priceData, function (enable) {
            var fb;
            if (enable) {
                customerModel.creatReadjustPrice(customerDB, operatorData, priceData, function (err, results) {
                    if (!err) {
                        fb = new FeedBack(FBCode.SUCCESS, "调价单已创建成功", {results: results});
                        req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_APPROVE_PRICE, "DOC_PRICE", results[0], null, operatorData.operatorName+"提交了新的调价单"+results[0]+"，去处理>");
                        res.json(fb);
                        return next();
                    } else {
                        fb = new FeedBack(FBCode.DBFAILURE, "调价单创建失败, " + err);
                    }
                    res.json(fb);
                });
            } else {
                fb = new FeedBack(FBCode.INVALIDACTION, "该商品还有待审核调价单未处理,请先联系审核员审核");
                res.json(fb);
            }
        });
    }

    //商品管理->价格设定->基本价格调整历史
    app.get(APPURL + "/goodsbasicpricehistory", auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_GOODS,__FEATUREENUM.FP_VIEW_PRICE]),
        auth.validateReq, getGoodsBasicPriceHistoryHandler);
    function getGoodsBasicPriceHistoryHandler(req, res, next) {
        var goodsId = req.query.goodsId;
        var customerDB = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);

        dataService.commonData(req, function (data) {
            model.listReadjustPriceHistory(customerDB, goodsId, "'BASIC'", paginator, function (err, results) {
                if (!err) {
                    data['paginator'] = clientModel.restorePurePaginator(paginator);
                    data.PriceData = results;
                    res.render('customer/center/goods/priceset/basicPriceHistory', {data: data})
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }


            });
        });
    }

    //商品管理- > 价格设定->客户类价格调整历史
    app.get(APPURL+"/clientcategorypricehistory",auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_GOODS,__FEATUREENUM.FP_VIEW_PRICE]),
        auth.validateReq,getGoodsClientCategoryPriceHistoryHandler);
    function getGoodsClientCategoryPriceHistoryHandler(req,res,next){
        //CLIENTCATEGORY
        var goodsId = req.query.goodsId;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var clientCategoryId=req.query.clientCategoryId;
        var startDate=req.query.startDate||'';
        var endDate=req.query.endDate||'';

        

        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            model.listReadjustPriceHistory(customerDB, goodsId, "'CLIENTCATEGORY'", paginator, function (err, results) {
                if (!err) {

                    //获取客户类别

                    model.getClientCategory(customerDB, function (err, clientCategories) {
                        data['paginator'] = clientModel.restorePurePaginator(paginator);

                        var newreadjustPriceInfo;
                        if(clientCategoryId!=0){
                            newreadjustPriceInfo=underscore.filter(results.readjustPriceInfo,function(item){
                                return Number(item.clientCategoryId)==Number(clientCategoryId);
                            });
                        }
                        else{
                            newreadjustPriceInfo=results.readjustPriceInfo;
                        }


                        clientCategories.unshift({categoryName:'所有类别',categoryId:0});
                        data.clientCategories = clientCategories;
                        results.readjustPriceInfo=newreadjustPriceInfo;
                        data.Date={
                            startDate:startDate,
                            endDate:endDate
                        };
                        data.clientCategoryId=clientCategoryId;
                        data.PriceData = results;
                        
                        
                        res.render('customer/center/goods/priceset/clientCategoryPriceHistory', {data: data});
                    });
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }


            });
        });

    }


    //商品管理 -> 价格设定 客户调整历史
    app.get(APPURL+"/clientpricehistory",auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_GOODS,__FEATUREENUM.FP_VIEW_PRICE]),
        auth.validateReq,getGoodsClientPriceHistoryHandler);
    function getGoodsClientPriceHistoryHandler(req, res, next){
        var goodsId = req.query.goodsId;
        var customerDB = req.session.customer.customerDB;
        var startDate=req.query.startDate||'';
        var endDate=req.query.endDate||'';

        var clientId=req.query.clientId;
        var clientName=req.query.clientName||'';
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            model.listReadjustPriceHistory(customerDB, goodsId, "'SINGLECLIENT'", paginator, function (err, results) {
                if (!err) {

                    //有客户ID传过来 过滤客户ID
                    if(clientId!=""&&clientId!=null&&!underscore.isUndefined(clientId)&&Number(clientId)!=0){
                        var newreadjustPriceInfo=underscore.filter(results.readjustPriceInfo,function(item){
                            return Number(item.clientId)==Number(clientId);
                        });
                        results.readjustPriceInfo=newreadjustPriceInfo;
                    }
                        data['paginator'] = clientModel.restorePurePaginator(paginator);
                        data.Date={
                            startDate:startDate,
                            endDate:endDate
                        };
                    //没有客户ID 有客户名字  [没有输入正确的客户名]
                    if(Number(clientId)==0&&clientName!=''){
                        results.readjustPriceInfo=[];
                    }

                    //data.clientCategoryId=clientCategoryId;
                        data.PriceData = results;
                        data.clientName=clientName;
                        data.clientId=clientId;

                        res.render('customer/center/goods/priceset/clientPriceHistory', {data: data});
                    //});
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }
            });
        });
    }

    //价格设定 end


    //价格审核相关 start

    //调价审核->待审核调价单列表
    app.get(APPURL, auth.restrict, auth.acl([__FEATUREENUM.FP_APPROVE_PRICE,__FEATUREENUM.FP_VIEW_PRICE]),
        getPendingPriceModifyHandler);
    function getPendingPriceModifyHandler(req, res, next) {

        var paginator=clientModel.createPriceSetPaginator(req);
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var operatorId = operatorData.operatorId;

        dataService.commonData(req, function (data) {
            model.getAllReadjustPrice(customerDB, paginator, operatorId, 'CREATED', function(err, results) {
                //获取该商品基础类价格
                if(!err){
                    data.priceAdjustList=results;

                    data['paginator'] = clientModel.restorePriceSetPaginator(paginator);
                    data.handlerType='pendingPriceModify';
                    res.render('customer/center/checkprice/pendingPriceModifyList.ejs',{data:data})
                }
            });
        });
    }

    //调价审核->已审核调价单列表
    app.get(APPURL+"/approvedPriceModifyList",auth.restrict,
        auth.acl([__FEATUREENUM.FP_APPROVE_PRICE,__FEATUREENUM.FP_VIEW_PRICE]),
        auth.validateReq,getApprovedPriceModifyHandler);
    function getApprovedPriceModifyHandler(req, res, next){

        var paginator=clientModel.createPriceSetPaginator(req);
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var operatorId = operatorData.operatorId;
        dataService.commonData(req, function (data) {
            model.getAllReadjustPrice(customerDB,paginator,operatorId,"APPROVED",function(err,results){
                if(!err){
                    data.priceAdjustList=results;
                    data['paginator'] = clientModel.restorePriceSetPaginator(paginator);
                    data.handlerType='approvedPriceModify';
                    res.render('customer/center/checkprice/approvedPriceModifyList.ejs',{data:data})
                }
            })
        });


    }
    //调价审核->已退回调价单列表
    app.get(APPURL+"/rejectPriceModifyList",auth.restrict,
        auth.acl([__FEATUREENUM.FP_APPROVE_PRICE,__FEATUREENUM.FP_VIEW_PRICE]),
        auth.validateReq,getRejectPriceModifyHandler);
    function getRejectPriceModifyHandler(req,res,next){
        var paginator=clientModel.createPriceSetPaginator(req);
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var operatorId = operatorData.operatorId;
        dataService.commonData(req, function (data) {
            model.getAllReadjustPrice(customerDB,paginator,operatorId,"REJECTED",function(err,results){
                if(!err){

                    data.priceAdjustList=results;
                    data['paginator'] = clientModel.restorePriceSetPaginator(paginator);
                    data.handlerType='rejectPriceModify';
                    res.render('customer/center/checkprice/rejectPriceModifyList.ejs',{data:data})
                }
            })
        });
      /*dataService.commonData(req, function (data) {
            data.handlerType='rejectPriceModify';
            res.render('customer/center/checkprice/rejectPriceModifyList.ejs',{data:data})
        });*/
    }
    //审核单个商品
    app.get(APPURL+"/checkPriceModify",auth.restrict,
        auth.acl([__FEATUREENUM.FP_APPROVE_PRICE]),
        auth.validateReq,getCheckPriceModifyHandler);
    function getCheckPriceModifyHandler(req,res,next){
        var adjustPriceId=req.query.adjustPriceId;


        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var goodsId=req.query.goodsId;
        dataService.commonData(req, function (data) {
            //获取商品的基本信息
            customerModel.listCheckReadjustPricePage(customerDB,adjustPriceId,function(err,results){
                if (!err) {
                    var canCheck=Number(results.commonInfo.approverId)==Number(operatorData.operatorId);
                    //获取商品的 基本价格信息
                    model.getSingleGoodsPrice(customerDB, goodsId, function(err, goodsBasicPriceInfo){
                        if(!err) {
                            data.canCheck = canCheck;
                            data.goodsBasicPriceInfo = goodsBasicPriceInfo;
                            data.allData = results;
                            res.render('customer/center/checkprice/checkPriceModify', {data: data});
                        }
                    });
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }
            });
        });
    }

    //审核单个商品(提交数据)
    app.post(APPURL+"/checkPriceModify",auth.restrict,auth.acl([__FEATUREENUM.FP_APPROVE_PRICE]),
        auth.validateReq,postCheckResultHandler, message.postMsg);
    function postCheckResultHandler(req,res,next){
        var customerDB = req.session.customer.customerDB;


        customerModel.updateReadjustPrice(customerDB,req.body,function(err,results){
            var fb;
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS, "审批成功", {results: results});
                if(req.body.status === 'REJECTED'){
                    req.session.msg = message.makeMsg(null,null, __FEATUREENUM.FP_VIEW_PRICE, "DOC_PRICE", req.body.readjustId, null, "您提交的调价单"+req.body.readjustId+"未通过审核，查看详情>");
                }else{
                    req.session.msg = message.makeMsg(null,null, __FEATUREENUM.FP_VIEW_PRICE, "DOC_PRICE", req.body.readjustId, null, "您提交的调价单"+req.body.readjustId+"已通过审核，查看详情>");
                }
                res.json(fb);
                return next();
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "审批失败, " + err);
            }
            res.json(fb);

        })
    }
    
    //审核通过调价信息 查看
    app.get(APPURL+"/approvedPriceModify",auth.restrict,auth.acl([__FEATUREENUM.FP_APPROVE_PRICE]),
        auth.validateReq,getApprovedPriceModifyDetailsHandler);
    function getApprovedPriceModifyDetailsHandler(req,res,next){
        var adjustPriceId=req.query.adjustPriceId;

        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        dataService.commonData(req, function (data) {
            //获取商品的基本信息
            customerModel.listCheckReadjustPricePage(customerDB,adjustPriceId,function(err,results){
                if (!err) {

                    data.allData = results;

                    res.render('customer/center/checkprice/approvedPriceModify', {data: data})
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }
            });
        });
    }

    //审核退回调价细心  查看详细内容
    app.get(APPURL+"/rejectedPriceModify",auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_PRICE,__FEATUREENUM.FP_APPROVE_PRICE]),
        auth.validateReq,getRejectedPriceModifyDetailsHandler);
    function getRejectedPriceModifyDetailsHandler(req,res){
        var adjustPriceId=req.query.adjustPriceId;
        var customerDB = req.session.customer.customerDB;
        //var operatorData = req.session.operator;
        dataService.commonData(req, function (data) {
            //获取商品的基本信息
            customerModel.listCheckReadjustPricePage(customerDB,adjustPriceId,function(err,results){
                if (!err) {
                    data.allData = results;
                    res.render('customer/center/checkprice/rejectedPriceModify', {data: data})
                } else {
                    logger.error(err);
                    res.render('error/wrong', {err: err});
                }
            });
        });
    }
};