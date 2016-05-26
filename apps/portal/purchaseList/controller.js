/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports=function(app) {

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
    var feedback = require(__modules_path + "/feedback");
    var async = require('async');
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    /*
     * load project modules
     */
    var auth = require(__modules_path + '/auth');
    var myPath = require(__modules_path + "/mypath");
    /*
     * init app name etc
     */
    var APPNAME = myPath.getAppName(__dirname);
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

    //app.get(APPURL, auth.restrict, getPurchaseHandler);
    //app.get(APPURL + "/list", auth.restrict, getPurchaseListHandler);
    //app.get(APPURL + "/edit", auth.restrict, getPurchaseListEditHandler);
    //app.post(APPURL + "/add", auth.restrict, postPurchaseListAddHandler);
    //app.post(APPURL + "/remove", auth.restrict, postPurchaseListRemoveHandler);
    //app.post(APPURL + "/removeGoodsOne", auth.restrict, postPurchaseListRemoveGoodsOneHandler);
    //app.get(APPURL + "/addToCart", auth.restrict, postPurchaseListAddToCartHandler);
    //app.post(APPURL + "/update", auth.restrict, postPurchaseListUpdateHandler);



    app.get(APPURL, auth.restrict, getPurchaseHandler);
    /**
     * 获取常购清单
     * @param req
     * @param res
     */
    function getPurchaseHandler(req, res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;
        dataService.commonData(req, function (data) {
            model.retrieveFavorList(customerDB,clientId,function(err,result){
               if(err){
                   logger.error('error');
               }else{
                   data.lists = result;
                   res.render("customer/portal/purchaseList/list",{data: data});
               }
            });
        });
    }

    app.get(APPURL + "/list", auth.restrict, getPurchaseListHandler);
    /**
     * 获取常购清单详情
     * @param req
     * @param res
     */
    function getPurchaseListHandler(req, res){
        var goodsId=req.query.goodsId;
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;
        dataService.commonData(req, function (data) {
            model.getPurchaseList(customerDB,clientId,goodsId,function(err,result){
                if(!err){
                    data.lists = result;
                    res.render("customer/goods/addPurchaseList",{data: data});
                }else{
                    res.render("error/500", {data: data});
                }
            });
        });
    }

    function getPurchaseListAddHandler(req, res){
        logger.enter();
        dataService.commonData(req, function (data) {
            res.render("customer/portal/purchaseList/add",{data: data});
        });
    }

    app.post(APPURL + "/add", auth.restrict, postPurchaseListAddHandler);
    /**
     * post add purchase List
     * @param req
     * @param res
     */
    function postPurchaseListAddHandler(req, res){
        logger.enter();
        var name = req.body.listName;
        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;
        if(name == ""){
            var fb=new FeedBack(FBCode.DBFAILURE, "请输入清单的名字");
            res.json(fb);
            return;
        }
        model.postNewPurchaseList(customerDB, clientId, name,function(err,result){
            var fb;
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS, "添加成功", result);
            } else {
                if(err.code == "ER_DUP_ENTRY"){
                    fb = new FeedBack(FBCode.DUPDATA, "已经有一个名字是"+ name + "的清单存在", result);
                }else {
                    fb=new FeedBack(FBCode.DBFAILURE, "添加失败，请重试");
                }
            }
            res.json(fb);
        });
    }

    app.post(APPURL + "/remove", auth.restrict, postPurchaseListRemoveHandler);
    /**
     * delete purchaselist
     * @param req
     * @param res
     */
    function postPurchaseListRemoveHandler(req, res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var data = {
            listId : Number(req.body.listId),
            clientId : Number(req.session.operator.clientId)
        };
        model.deletePurchaseList(customerDB, data,function(err,result){
            var fb;
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS, "删除清单成功");
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "删除失败，请重试");
            }
            res.json(fb);
        });
    }

    app.post(APPURL + "/removeGoodsOne", auth.restrict, postPurchaseListRemoveGoodsOneHandler);
    /**
     * post remove goods in purchase list
     * @param req
     * @param res
     */
    function postPurchaseListRemoveGoodsOneHandler(req, res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var data = {
            listId : Number(req.body.listId),
            goodsId : Number(req.body.goodsId)
        };
        model.deleteOneGoodInPurchaseList(customerDB,data,function(err,result){
            var fb;
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS, "删除商品成功");
            } else {
                fb = new FeedBack(FBCode.DBFAILURE, "删除失败，请重试");
            }
            res.json(fb);
        });
    }

    app.get(APPURL + "/addToCart", auth.restrict, postPurchaseListAddToCartHandler);
    /**
     * purchase list add to cart
     * @param req
     * @param res
     */
    function postPurchaseListAddToCartHandler(req, res){
        logger.enter();
        var clientId    = req.session.operator.clientId;
        var customerDB = req.session.customer.customerDB;
        var reqData = {
            listId : Number(req.query.listId),
            clientId : Number(req.session.operator.clientId)
        };
        model.putPurchaseListToCart(customerDB,reqData,clientId,function(errs,result){
            var fb;
            fb = new FeedBack(FBCode.DBFAILURE);
            if(req.headers['x-requested-with'] && (req.headers['x-requested-with'] == 'XMLHttpRequest')) {
                if (errs) {
                    if (errs == "INVALIDACTION") {
                        fb = new FeedBack(FBCode.INVALIDACTION, '存在商品不在您的GSP控制范围内,无法下单');
                    }
                    res.json(fb);
                } else {
                    res.json(new FeedBack(FBCode.SUCCESS, "商品已成功加入购物车"));
                }
            }else{
                if (errs) {
                    if (errs == "INVALIDACTION") {
                        fb = new FeedBack(FBCode.INVALIDACTION, '存在商品不在您的GSP控制范围内,无法下单');
                    }
                    res.json(fb);
                } else {
                    res.redirect('/cart');
                }
            }
        });


    }

    app.post(APPURL + "/update", auth.restrict, postPurchaseListUpdateHandler);
    /**
     * post update purchaselist
     * @param req
     * @param res
     */
    function postPurchaseListUpdateHandler(req, res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var data = {
            listId : req.body.listId,
            listName : req.body.listName,
            goods : req.body.goods
        };
        model.postUpdatePurchaseList(customerDB,data,function(err,result){
            var fb;
            if(err){
                fb = new FeedBack(FBCode.DBFAILURE, "修改失败，请重试");
                res.json(fb);
            }else{
                fb = new FeedBack(FBCode.SUCCESS, "修改清单成功");
                res.json(fb);
            }
        });
    }

    app.get(APPURL + "/edit", auth.restrict, getPurchaseListEditHandler);
    /**
     * show edit purchase page
     * @param req
     * @param res
     */
    function getPurchaseListEditHandler(req, res){
        logger.enter();
        var type = req.query.type;
        var id = req.query.listId;
        var clientId = req.session.operator.clientId;
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getEditPurchaseList(customerDB,type,id,clientId,data,function(err,data){
                if(err){
                    logger.error(JSON.stringify(err))
                    res.render("error/500");
                }else{
                    res.render("customer/portal/purchaseList/edit",{data: data});
                }
            });
        });
    }
};