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
    var formidable = require('formidable');
    var fs = require('fs');
    var strftime = require('strftime');
    var myPath = require(__modules_path + "/mypath");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;

    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var message = require(__modules_path + "/message");
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





    app.get(APPURL,auth.restrict,getPromotionHandler);
    function getPromotionHandler(req,res){
        dataService.commonData(req, function (data) {
            res.render('customer/center/promotion/set_promotion_list.ejs',{data:data});
        })
    }

    app.get(APPURL+'/setPromotionItem',auth.restrict,getAddPromotionItemHandler);
    function getAddPromotionItemHandler(req,res){
        dataService.commonData(req, function (data) {
            res.render('customer/center/promotion/set_promotion_add.ejs',{data:data});
        })

    }





    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */
    //发货相关API
    app.get(APPURL, auth.restrict,getShipHandler);
    app.get(APPURL + "/detail", auth.restrict, auth.acl([__FEATUREENUM.FP_SHIP_ORDER, __FEATUREENUM.FP_VIEW_ORDER]),
        auth.validateReq,getShipDetailHandler);

    /* add  shipInfo */
    app.post(APPURL + "/add", auth.restrict, auth.acl(__FEATUREENUM.FP_SHIP_ORDER), auth.validateReq,addShipInfoHandler, message.postMsg);

    /* update  shipInfo */
    app.post(APPURL + "/update", auth.restrict, auth.acl(__FEATUREENUM.FP_SHIP_ORDER), auth.validateReq,updateShipInfoHandler);

    //发货管理
    function getShipHandler(req,res){
        logger.enter();
        var paginator = model.getShipInfoPaginator(req);
        var customerDB = req.session.customer.customerDB;
        var type = req.query.type;
        var isReceived = (type == "received");
        dataService.commonData(req, function (data) {
            db.getAllShipInfo(customerDB,paginator, isReceived, function(err,ships){
                if(err){
                    res.render('error/wrong',{err:err});
                }else {
                    var ships = underscore.chain(ships)
                        .groupBy(function (item) {
                            return item.shipId
                        })
                        .map(function (item) {
                            // item is an array
                            var shipItem = item[0];
                            shipItem.countBatch = item.length;


                            shipItem.quantity = underscore(item).reduce(function (memo, item) {
                                return memo + item.quantity;
                            }, 0);

                            shipItem.subtotal = underscore(item).reduce(function (memo, item) {
                                return memo + item.amount;
                            }, 0);
                            shipItem.subtotal=shipItem.subtotal.toFixed(2);
                            return shipItem;
                        })
                        .value();
                    data["paginator"] = model.restoreShipPaginator(paginator);
                    if (ships.length > 0) {
                        data["type"] = ships[0].isReceived ? "received" : "receive";
                    } else {
                        data["type"] = type;
                    }
                    db.getAllShipInfo(customerDB,paginator, false, function(err2,oppositeShipInfo){
                        data["oppositeShipInfo"] = oppositeShipInfo;
                        if(err2){
                            res.render('error/wrong',{err:err2});
                        }else{
                            res.render('customer/center/ship/ship', {data: data,ships:ships})
                        }
                    });
                }
            });
        })
    }

    //发货管理==>详情页
    function getShipDetailHandler(req,res) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var shipId = req.param("shipId");
        var orderId = req.param("orderId");
        dataService.commonData(req, function (data) {
            if(underscore.isEmpty(shipId) && !underscore.isEmpty(orderId)){
                db.getShipInfoByOrderId(customerDB,orderId,function(err,shipDetails){
                    if(shipDetails[0].isReceived == 1){
                        //已收货
                        res.render('customer/center/ship/received', {data: data,shipDetails:shipDetails});
                    }else if(shipDetails[0].isReceived == 0){
                        //待收货
                        res.render('customer/center/ship/receive', {data: data,shipDetails:shipDetails});
                    }
                })
            }else if(!underscore.isEmpty(shipId)){
                db.getShipDetails(customerDB,shipId,function(err,shipDetails){
                    if(shipDetails[0].isReceived == 1){
                        //已收货
                        res.render('customer/center/ship/received', {data: data,shipDetails:shipDetails});
                    }else if(shipDetails[0].isReceived == 0){
                        //待收货
                        res.render('customer/center/ship/receive', {data: data,shipDetails:shipDetails});
                    }
                })
            }
        });
    }

    function addShipInfoHandler(req,res, next){
        logger.enter();
        var shipData = underscore.filter(req.body.shipData, function(item){
            return Number(item.quantity) != 0;
        });
        if(shipData.length <= 0){
            res.json(new FeedBack(FBCode.DBFAILURE,"不能发0个商品"));
            return;
        }
        var shipInfo = req.body;
        shipInfo.shipData = shipData;

        var customerDBName = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var shipStatusCheck = __entryFromOrderOnly?"APPROVED,SHIPPED,FINISHED":"APPROVED";

        customerModel.orderStatusCheck(customerDBName,shipInfo.orderId,shipStatusCheck,function(success){
            var fb;
            if(success){
                model.newShipInfo(customerDBName,shipInfo,operatorData,function(err,shipId){
                    if(!err){
                        fb=new FeedBack(FBCode.SUCCESS,"添加发货信息成功",{results : shipId});
                        req.session.msg = message.makeMsg(shipInfo.clientId,null,null, "DOC_SHIP", shipInfo.orderId, shipInfo.displayId, "您的订单"+shipInfo.displayId+"已发货，请注意查收，查看详情>");
                        res.json(fb);
                        return next();
                    }else{
                        fb=new FeedBack(FBCode.DBFAILURE,err.code);
                        res.json(fb);
                    }
                });
            }else{
                fb=new FeedBack(FBCode.INVALIDACTION,"该订单单不能再次发货，不能重复操作");
                res.json(fb)
            }
        })
    }

    //R1M1收货仅作状态变更使用如下方法，R1M2及其后使用apps/order/model.js中updateShipReceived方法
    function updateShipInfoHandler(req,res){
        logger.enter();
        var shipId = req.body.shipId;
        var customerDBName = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        model.shipStatusCheck(customerDBName,shipId,function(success){
            var fb;
            if(success){
                model.updateShipReceived(customerDBName,shipId,operatorData,function(err,shipId){
                    if(!err){
                        fb=new FeedBack(FBCode.SUCCESS,"确认收货信息成功",{results : shipId});
                    }else{
                        fb=new FeedBack(FBCode.DBFAILURE,err.code);
                    }
                    res.json(fb)
                });
            }else{
                fb=new FeedBack(FBCode.INVALIDACTION,"收货已确认，不能重复提交");
                res.json(fb)
            }
        })
    }
};