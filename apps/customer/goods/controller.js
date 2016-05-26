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
 * customer/goods/controller.js
 *
 * --------------------------------------------------------------
 * 2015-10-30	hc-romens@issue#267
 *
 */

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

    app.get(APPURL + "/clientprice", auth.restrict, auth.acl(__FEATUREENUM.FP_VIEW_PRICE),
        auth.validateReq, getListClientPriceHandler);
    /**
     * list all client price
     * @param req
     * @param res
     * @param next
     */
    function getListClientPriceHandler(req, res, next){
        logger.enter();
        var goodsId = req.query.goodsId;
        var clientName=req.query.clientName;
        clientName=underscore.isUndefined(clientName)||clientName==null?"":clientName;

        var customerDBName = req.session.customer.customerDB;
        // 通过 ClientId 从数据库获取本条商品的客户信息
        dataService.commonData(req, function (data) {
            model.getClientPriceList(customerDBName,goodsId, clientName,function(err,results){
                if (err) {
                    next();
                } else {
                    data.goodsId = goodsId;
                    data.clientName=clientName;
                    res.render('customer/center/goods/customerPriceSet',
                        { data: data, client:results}
                    );
                }
            });

        });
    }



    app.get(APPURL + "/clientprice/add", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, getAddClientPriceHandler);
    /**
     * 显示新增客户价格页面
     * @param req
     * @param res
     * @param next
     */
    function getAddClientPriceHandler(req, res, next){
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        var goodsId = req.query.goodsId;
        model.getClientPriceAdd(customerDBName,goodsId,function(err,results){
            if (err) {
                next();
            } else {
                res.render('customer/center/goods/customerPriceAdd', {goodsPrice:results[0]});
            }
        });

    }


    app.post(APPURL + "/clientprice/listclients", auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_GOODS, __FEATUREENUM.FP_PRICE_GOODS, __FEATUREENUM.FP_APPROVE_PRICE]),
        auth.validateReq, postFilterClientNameHandler);
    /**
     * 按照关键词过滤客户名称
     * @param req
     * @param res
     * @param next
     */
    function postFilterClientNameHandler(req, res, next){
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        var keyword = req.body.keyword;
        model.postClientNameFilter(customerDBName,keyword,function(err,clientNameList){
            var fb;
            if (err) {
                fb = new FeedBack(FBCode.DBFAILURE, "过滤客户名称失败, " + err.code);
            } else {
                fb = new FeedBack(FBCode.SUCCESS, "", clientNameList);
            }
            res.json(fb);
        });

    }

    app.post(APPURL + "/clientprice/add", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, postAddClientPriceHandler);
    /**
     * 添加客户价格
     * @param req
     * @param res
     * @param next
     */
    function postAddClientPriceHandler(req, res, next){
        logger.enter();
        var goodsId = req.body.goodsId;
        var clientId = req.body.clientId;
        var price = req.body.price;
        var customerDBName = req.session.customer.customerDB;

        model.postAddClientPrice(customerDBName, clientId, goodsId, price,function(err,result){
            var fb;
            if (err) {
                if (err.code == "ER_DUP_ENTRY")
                    fb = new FeedBack(FBCode.DUPDATA, "该客户价格已经存在，请勿重复加入");
                else
                    fb = new FeedBack(FBCode.DBFAILURE, "添加客户价格失败, " + err.code);
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "添加客户价格成功", clientId);
            }
            res.json(fb);
        });

    }



    app.post(APPURL + "/clientprice/delete", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, postDeleteClientPriceHandler);
    /**
     * 删除客户单品价格
     * @param req
     * @param res
     * @param next
     */
    function postDeleteClientPriceHandler(req, res, next){
        logger.enter();

        var goodsId = req.body.goodsId;
        var clientId = req.body.clientId;
        var customerDBName = req.session.customer.customerDB;

        model.deleteClietPrice(customerDBName, clientId, goodsId,function(err,result){
            var fb;
            if (err) {
                fb = new FeedBack(FBCode.DBFAILURE, "客户价格删除失败，" + err.code);
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "客户价格删除成功", clientId);
            }
            res.json(fb);
        });

    }



    app.post(APPURL + "/clientprice/update", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, postUpdateClientPriceHandler);
    /**
     * 更新客户单品价格
     * @param req
     * @param res
     * @param next
     */
    function postUpdateClientPriceHandler(req, res, next){
        logger.enter();
        var price = req.body.price;
        var goodsId = req.body.goodsId;
        var clientId = req.body.clientId;
        var customerDBName = req.session.customer.customerDB;
        model.postClientPrice(customerDBName, price, clientId, goodsId,function(err,result){
            var fb;
            if (err) {
                fb = new FeedBack(FBCode.DBFAILURE, "客户单品价格修改失败，" + err.code);
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "客户单品价格修改成功", clientId);
            }
            res.json(fb);
        });
    }




    app.get(APPURL + "/categoryprice", auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_GOODS, __FEATUREENUM.FP_PRICE_GOODS, __FEATUREENUM.FP_APPROVE_PRICE]),
        auth.validateReq, getListCategoryPriceHandler);
    /**
     * 加载所有客户类价格
     * @param req
     * @param res
     * @param next
     */
    function getListCategoryPriceHandler(req, res, next){
        logger.enter();
        var goodsId = req.query.goodsId;
        var customerDBName = req.session.customer.customerDB;

        // 通过 ClientId 从数据库获取本条商品的客户信息
        dataService.commonData(req, function (data) {
            model.getCategoyPrice(customerDBName, goodsId, function(err,results){
                if (err) {
                    next();
                } else {
                    data.goodsId = goodsId;
                    res.render('customer/center/goods/customerClassPrice',
                        { data: data, classprice:results}
                    );
                }
            });
        });
    }



    app.get(APPURL + "/categoryprice/add", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, getAddCategoryPriceHandler);
    /**
     * 显示客户类价格添加窗口
     * @param req
     * @param res
     * @param next
     */
    function getAddCategoryPriceHandler(req, res, next) {
        logger.enter();
        var customerDBName = req.session.customer.customerDB;
        var goodsId = req.query.goodsId;
        model.getCategoryPriceAdd(customerDBName,goodsId,function(err,results){
            if (err) {
                next();
            } else {
                res.render('customer/center/goods/customerClassPriceAdd',
                    {data: results.data, goodsPrice: results.goodsPrice});
            }
        });
    }



    app.post(APPURL + "/categoryprice/add", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, postAddClientCategoryHandler);
    /**
     * 新增ClientCategoryPrice
     * @param req
     * @param res
     * @param next
     */
    function postAddClientCategoryHandler(req, res, next){
        logger.enter();

        var customerDBName = req.session.customer.customerDB;
        var goodsId = req.body.goodsId;
        var clientCategoryId = req.body.clientCategoryid;
        var price = req.body.price;
        model.postClientCategoryPrice(customerDBName, goodsId, clientCategoryId, price,function(err,result){
            var fb;
            if (err) {
                if (err.code == "ER_DUP_ENTRY"){
                    fb = new FeedBack(FBCode.DUPDATA, "该客户类价格已经存在，请勿重复加入");
                }
                else{
                    fb = new FeedBack(FBCode.DBFAILURE, "添加客户类价格失败, " + err.code);
                }
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "添加客户类价格成功", result);
            }
            res.json(fb);
        });

    }



    app.post(APPURL + "/categoryprice/delete", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, postDeleteCategoryPriceHandler);
    /**
     * 删除客户类单品价格
     * @param req
     * @param res
     * @param next
     */
    function postDeleteCategoryPriceHandler(req, res, next){
        logger.enter();
        var goodsId = req.body.goodsId;
        var clientCategoryId = req.body.clientCategoryid;
        var customerDBName = req.session.customer.customerDB;

        model.deleteCategoryPrice(customerDBName, clientCategoryId, goodsId, function(err, result){
            var fb;
            if (err){
                fb = new FeedBack(FBCode.DBFAILURE, "删除客户类单品价格失败, " + err.code);
            } else {
                fb = new FeedBack(FBCode.SUCCESS, "删除客户类单品价格成功", result);
            }
            res.json(fb);
        });
    }



    app.post(APPURL + "/categoryprice/update", auth.restrict, auth.acl(__FEATUREENUM.FP_PRICE_GOODS),
        auth.validateReq, postUpdateCategoryPriceHandler);
    /**
     * 修改单品客户类价格
     * @param req
     * @param res
     * @param next
     */
    function postUpdateCategoryPriceHandler(req, res, next){
        logger.enter();

        var price = req.body.price;
        var goodsId = req.body.goodsId;
        var clientCategoryId = req.body.clientCategoryid;
        var customerDBName = req.session.customer.customerDB;

        model.postClientCategoryPriceUpdate(customerDBName,price, clientCategoryId, goodsId,function(err,result){
            var fb;
            if (err) {
                fb = new FeedBack(FBCode.DBFAILURE, "修改单品客户类价格失败，" + err.code);
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "修改单品客户类价格成功", clientCategoryId);
            }
            res.json(fb);
        });
    }

    //上传向导
    function getGuideHandler(req, res){
        res.render("customer/center/goods/guide",{
            type : "goodsUnit",
            feedback :　"",
            unitXls : false
        });
    }
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
                    res.render('customer/center/goods', {data: data});
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
                    res.render('customer/center/goods/guide',{
                        type: 'goodsUnit',
                        feedback :feedback,
                        unitXls : false
                    });
                }else if(type == "good"){
                    feedback = "单位表上传成功";
                    res.render('customer/center/goods/guide',{
                        type: type,
                        feedback :feedback,
                        unitXls : true
                    });
                }else if(type == "goods"){
                    feedback = "客户表上传成功";
                    res.render('customer/center/goods/guide',{
                        type: type,
                        feedback :feedback,
                        unitXls : true
                    });
                }
            });
        });
    }
};