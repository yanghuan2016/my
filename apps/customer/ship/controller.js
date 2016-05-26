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

    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */

    //发货管理

    app.get(APPURL, auth.restrict,getShipHandler);
    /**
     * 发货相关API
     * @param req
     * @param res
     */
    function getShipHandler(req,res){
        logger.enter();
        var paginator = model.getShipInfoPaginator(req);
        var customerDB = req.session.customer.customerDB;
        var type = req.query.type;
        var isReceived = (type == "received");
        dataService.commonData(req, function (data) {
            model.getShipInfoModel(customerDB,paginator,type,isReceived,data,function(err,data){
                if(err){
                    res.render('error/wrong',{err:err});
                }else{
                    data["paginator"] = model.restoreShipPaginator(paginator);
                    res.render('customer/center/ship/ship', {data: data,ships:data.ships})
                }
            });

        })
    }

    app.get(APPURL + "/detail", auth.restrict, auth.acl([__FEATUREENUM.FP_SHIP_ORDER, __FEATUREENUM.FP_VIEW_ORDER]),
        auth.validateReq,getShipDetailHandler);
    //发货管理==>详情页
    function getShipDetailHandler(req,res) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var shipId = req.param("shipId");
        var orderId = req.param("orderId");
        dataService.commonData(req, function (data) {
            if(underscore.isEmpty(shipId) && !underscore.isEmpty(orderId)){
                model.getShipInfoByOrder(customerDB,orderId,function(err,shipDetails){
                    if(shipDetails[0].isReceived == 1){
                        //已收货
                        res.render('customer/center/ship/received', {data: data,shipDetails:shipDetails});
                    }else if(shipDetails[0].isReceived == 0){
                        //待收货
                        res.render('customer/center/ship/receive', {data: data,shipDetails:shipDetails});
                    }
                });

            }else if(!underscore.isEmpty(shipId)){
                model.getShipDetailsByShipId(customerDB,shipId,function(err,shipDetails){
                    if(shipDetails[0].isReceived == 1){
                        //已收货
                        res.render('customer/center/ship/received', {data: data,shipDetails:shipDetails});
                    }else if(shipDetails[0].isReceived == 0){
                        //待收货
                        res.render('customer/center/ship/receive', {data: data,shipDetails:shipDetails});
                    }
                });

            }
        });
    }

    app.post(APPURL + "/add", auth.restrict, auth.acl(__FEATUREENUM.FP_SHIP_ORDER), auth.validateReq,addShipInfoHandler,message.postMsg);
    /**
     * add ship Info
     * @param req
     * @param res
     */
    function addShipInfoHandler(req,res,next){
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

    app.post(APPURL + "/update", auth.restrict, auth.acl(__FEATUREENUM.FP_SHIP_ORDER), auth.validateReq,updateShipInfoHandler);
    /**
     * @deprecated     R1M1收货仅作状态变更使用如下方法，R1M2及其后使用apps/order/model.js中updateShipReceived方法
     * @param req
     * @param res
     */
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