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
    var async = require("async");
    var fs = require('fs');
    var strftime = require('strftime');
    var myPath = require(__modules_path + "/mypath");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var message = require(__modules_path + "/message");

    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');

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
    var clientModel = require(__base + '/apps/order/model')();

    app.post(APPURL+ "/close", auth.restrict, auth.acl(__FEATUREENUM.FP_CLOSE_ORDER),
        auth.validateReq,postCustomerCloseOrderHandler,message.postMsg);
    /**
     * 后台管理员取消订单
     * @param req
     * @param res
     */
    function postCustomerCloseOrderHandler(req,res,next){
        logger.enter();
        var fb;
        var orderId = Number(req.body.orderId);
        var displayId = req.body.displayId || null;
        var clientId = req.body.clientId || null;


        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        clientModel.orderStatusCheck(customerDB,orderId,"CLOSED",function(success){
            if(!success){
                clientModel.transCloseOrder(customerDB,orderId,operatorData,function(err, resultList){
                    if (!err) {
                        // 退款流程
                        clientModel.refundOrder(customerDB,orderId,function(err, result){
                            var msgBody = "您提交的订单"+ displayId +"已被关闭，查看详情>";
                            if(req.body.type === 'ORDER_RATIFY'){
                                msgBody = "您提交的订单"+ displayId +"未通过审核，查看详情>";
                            }
                            req.session.msg = message.makeMsg(clientId,null,null, "DOC_ORDER", orderId, displayId, msgBody);
                            fb=new FeedBack(FBCode.SUCCESS,"订单已关闭");
                            res.json(fb);
                            return next();
                        });
                    } else {
                        fb=new FeedBack(FBCode.INVALIDACTION,"订单关闭失败");
                        res.json(fb);
                    }
                })
            }else{
                fb=new FeedBack(FBCode.INVALIDACTION,"订单已关闭，不能重复操作");
                res.json(fb)
            }
        });
    }

    app.get(APPURL+ "/refuse", auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_REJECT, __FEATUREENUM.FP_RECEIVE_REJECT]),
        getRefuseListHandler);

    /**
     * 商家端 拒收单列表(待入库)
     * 获取拒收单列表
     * @param req
     * @param res
     */
    function getRefuseListHandler(req,res){
        //获取数据库的拒收单列表
        var customerDB = req.session.customer.customerDB;
        var type = req.query.type;
        var operatorType;
        if(type=='receive'){
            operatorType='SHIPPED';
        }else{
            operatorType='FINISHED';
        }
        var paginator=model.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            model.getRefuseList(customerDB,operatorType,paginator,data,function(err,data){
                if(err){
                    res.render('error/wrong',{err:err});
                }else{
                    data.paginator=model.restorePurePaginator(paginator);
                    res.render('customer/center/order/refuse',{data: data});
                }
            });

        });
    }


    app.get(APPURL+ "/refuse/detail", auth.restrict,
        auth.acl([__FEATUREENUM.FP_VIEW_REJECT, __FEATUREENUM.FP_RECEIVE_REJECT]), getRefuseDetailHandler);
    /**
     * 获取拒收单详情
     * @param req
     * @param res
     */
    function getRefuseDetailHandler(req, res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var refuseId = req.param("refuseId");
        /**
         *　通过判断该拒收单的状态是已入库还是待入库,跳转不同的页面
         */
        dataService.commonData(req, function (data) {
            model.getRefuseDetailById(customerDB,refuseId,function(err,refuseDetails){
                logger.debug(JSON.stringify(refuseDetails));
                data.refuseDetails = refuseDetails;
                var status = refuseDetails[0].isReceived;
                if(status == "1"){
                    res.render("customer/center/order/storage", {data: data});
                }else if(status == "0"){
                    res.render("customer/center/order/waitInStorage", {data: data});
                }
            });
        })
    }


    app.post(APPURL+ "/refuse/delivered",
        auth.restrict, auth.acl(__FEATUREENUM.FP_RECEIVE_REJECT),
        auth.validateReq,postRefuseDeliveredHandler);
    /**
     * 拒收单收货
     * @param req
     * @param res
     */
    function postRefuseDeliveredHandler(req, res){
        logger.enter();
        var data = req.body;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        logger.debug(JSON.stringify(data));
        model.updateRefuseData(customerDB,operatorData,data,function(err,rejectId){
            var fb;
            if(err){
                fb = new FeedBack(FBCode.DBFAILURE,"入库失败"+ err.toString());
            }else{
                fb = new FeedBack(FBCode.SUCCESS, "入库成功",{rejectId:rejectId});
            }
            res.json(fb);
        })
    }
};