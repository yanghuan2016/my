/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports=function(app){

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
    var constants=require(__modules_path + "/SystemConstants");

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


    app.get(PAGEURL ,auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), getShowcaseListHandler);
    /**
     * 橱窗列表
     * @param req
     * @param res
     */
    function getShowcaseListHandler(req,res){
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {

            model.getShowcaseList(customerDB, function(err, result) {
                if(err) {
                    logger.error(err);
                    return res.render('error/500');
                }
                else {
                    var showCaseTypes=[];
                    var ShopWindow_ModeConstants = constants.ShopWindow_Mode;
                    for(var i=0; i< Object.keys(constants.ShopWindow_Mode).length; i++) {
                        var key = Object.keys(constants.ShopWindow_Mode)[i];
                        var currentObj = ShopWindow_ModeConstants[key];
                        if(currentObj.ENABLED==false)
                            continue;
                        var obj={
                            text:currentObj.ALIAS,
                            value:currentObj.KEY
                        };
                        showCaseTypes.push(obj);
                    }
                    data.showCaseTypes = showCaseTypes;
                    data.showcases = result;
                    res.render('customer/portal/manage_shopwindowList', {data: data});
                }
            });
        });

    }

    app.get(PAGEURL + "/:id", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), getShowcaseNewHandler);
    /**
     * 通过id查看(编辑)LIST 和 ICON 橱窗以及商品
     * @param req
     * @param res
     */
    function getShowcaseNewHandler(req,res){
        var strId = req.params.id;
        //console.log(strId);
        var id = Number(strId);
        //通过橱窗id获取到,橱窗名字,以及该橱窗下所有的商品,按照orderSeq排序
        var customerDB = req.session.customer.customerDB;

        var returnObj={
            showcase:{id:id},
            showcaseGoods:[]
        };
        dataService.commonData(req, function (data) {
            model.getShowcaseNew(customerDB, data, returnObj, function(err, result) {
                if(err) {
                    logger.error(err);
                    return res.render('error/500');
                }
                res.render(result.url, {data: result.data});
            });
        });

    }

    app.get(PAGEURL+"/item/add",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW),  addShowCaseHandler);
    /**
     * 新增橱窗,跳转到橱窗页面 该橱窗类型为List类型
     * @param req
     * @param res
     */
    function addShowCaseHandler(req,res){
        dataService.commonData(req, function (data) {
            data.showcase = null;
            data.showcaseGoods = null;
            data.showCaseGoodsIds=[];
            res.render('customer/portal/manage_addShopwindow',{data: data});
        });
    }

    //app.get(PAGEURL + "/iconShowcase/:id", auth.restrict,auth.validateReq, getIConShowcaseNewHandler);//通过id查看(编辑)ICON橱窗以及商品  和List类型用同一个controller
    app.get(PAGEURL+"/itemIcon/add",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), auth.validateReq,getIconShowCaseHandler);
    /**
     * 新增橱窗,跳转到橱窗页面 该橱窗类型为Icon类型
     * @param req
     * @param res
     * @param next
     */
    function getIconShowCaseHandler(req,res,next){
        dataService.commonData(req, function (data) {
            data.showCaseGoodsIds=[];
            data.showcase = null;
            data.advertiseGood={
                advertiseImg:null,
                advertiseHref:null
            };
            data.showcaseGoods = null;
            res.render('customer/portal/manage_addShopwindowIcon',{data: data});
        });
    }

    app.post(RESTURL, auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), auth.validateReq, postShowcaseHandler);
    /**
     * 新增LIST橱窗
     * @param req
     * @param res
     */
    function postShowcaseHandler(req, res) {
        //保存传递过来的橱窗以及橱窗商品信息，然后返回状态值
        var customerDB = req.session.customer.customerDB;
        var newShowcaseName=req.body.showcaseName;
        var goodsIds=req.body.goodsIds;
        var goodsIdsLength;
        if(underscore.isUndefined(goodsIds)){
            goodsIdsLength=0;
        }
        else{
            goodsIdsLength =goodsIds.length;
        }
        var shopWindowData={
            title:newShowcaseName,
            mode:constants.ShopWindow_Mode.LIST.KEY,
            size:constants.ShopWindow_Mode.LIST.SIZE,
            advertiseImg:null,
            advertiseHref:null
        };

        model.postShowcase(customerDB, goodsIds, goodsIdsLength, shopWindowData, function(err, result) {
            if(err){
                logger.error(err);
                return res.json(new FeedBack(FBCode.DBFAILURE,"数据库错误"));
            }
            res.json(new FeedBack(FBCode.SUCCESS,"保存成功",result));
        });
    }

    app.put(RESTURL , auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), auth.validateReq, putShowcaseHandler);
    /**
     * //更新LIST橱窗
     * @param req
     * @param res
     */
    function putShowcaseHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var bodyData = req.body;
        var goodsIds=req.body.goodsIds;
        var goodsIdsLength;
        if(underscore.isUndefined(goodsIds)){
            goodsIdsLength=0;
        }
        else{
            goodsIdsLength =goodsIds.length;
        }

        model.putShopWindowInfo(customerDB, bodyData, goodsIdsLength, function(err, result) {
            if(err) {
                logger.error(err);
                return res.json(new FeedBack(FBCode.DBFAILURE, "内部错误,请稍后再试"));
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS, "保存成功", result));
            }
        });
    }


    app.post(RESTURL+'/iconShowcase', auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), auth.validateReq, postShowcaseIconHandler);
    /**
     * 新增ICON橱窗
     * @param req
     * @param res
     */
    function postShowcaseIconHandler(req, res) {
        //保存传递过来的橱窗以及橱窗商品信息，然后返回状态值
        var customerDB = req.session.customer.customerDB;
        var newShowcaseName=req.body.showcaseName;
        var goodsIds=req.body.goodsIds;
        var goodsIdsLength;
        if(underscore.isUndefined(goodsIds)){
            goodsIdsLength=0;
        }
        else{
            goodsIdsLength =goodsIds.length;
        }
        var shopWindowData={
            title:newShowcaseName,
            mode:constants.ShopWindow_Mode.ICONLIST.KEY,
            size:constants.ShopWindow_Mode.ICONLIST.SIZE,
            advertiseImg:req.body.advertiseObj.advertiseImg,
            advertiseHref:req.body.advertiseObj.advertiseHref
        };

        model.postShowcaseIcon(customerDB, shopWindowData, goodsIds, goodsIdsLength, function(err, result) {
            if(err) {
                logger.error(err);
                res.json(new FeedBack(FBCode.DBFAILURE,"数据库错误"));
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS,"保存成功",result));
            }
        });
    }

    app.put(RESTURL +'/iconShowcase', auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), auth.validateReq, putShowcaseIconHandler);
    /**
     * 更新ICON橱窗
     * @param req
     * @param res
     */
    function putShowcaseIconHandler(req, res) {
        var customerDB = req.session.customer.customerDB;

        var bodyData = req.body;
        var newTitle=req.body.showcaseName;
        var goodsIds=req.body.goodsIds;
        var goodsIdsLength;
        if(underscore.isUndefined(goodsIds)){
            goodsIdsLength=0;
        }
        else{
            goodsIdsLength =goodsIds.length;
        }

        var updateobj={
            title:newTitle,
            advertiseImg:req.body.advertiseObj.advertiseImg,
            advertiseHref:req.body.advertiseObj.advertiseHref
        };

        model.putShowcaseIcon(customerDB, updateobj, bodyData, goodsIdsLength, function(err, result) {
            if(err) {
                logger.error(err);
                res.json(new FeedBack(FBCode.DBFAILURE,"内部错误,请稍后再试"));
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS,"保存成功",result));
            }
        });
    }


    app.delete(RESTURL + "/:id", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), auth.validateReq, deleteShowcaseHandler);
    /**
     * 删除橱窗
     * @param req
     * @param res
     */
    function deleteShowcaseHandler(req,res){
        var id=req.params.id;
        //delete
        var customerDB=req.session.customer.customerDB;

        model.delShowcase(customerDB, id, function(err, result) {
            if(err) {
                logger.error(err);
                res.json(new FeedBack(FBCode.DBFAILURE,"内部错误,请稍后再试"));
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS,"删除成功",result));
            }
        });
    }

    app.post(RESTURL +"/updateShowcaseOrder",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), auth.validateReq, updateShowcaseOrderHandler);
    /**
     * 更新橱窗的顺序
     * @param req
     * @param res
     * @returns {boolean}
     */
    function updateShowcaseOrderHandler(req,res){
        //接收到的是一个以id数组 [5,3,1,4,2] 说明id为5的在最前面...
        var customerDB=req.session.customer.customerDB;
        var newOrderIds=req.body.ids;
        var objLength=newOrderIds.length;
        for(var i=0;i<objLength;i++){
            var currentShopWindowId=newOrderIds[i];
            if(Number.isNaN(currentShopWindowId)){
                res.json(new FeedBack(FBCode.DBFAILURE,"参数出错,请稍后再试",null));
                return false;
            }
            var currentOrderSeq=i+1;

            model.postShopWindow(customerDB, currentOrderSeq, currentShopWindowId, function(err, result) {
                if(err) {
                    logger.error(err);
                    return res.json(new FeedBack(FBCode.DBFAILURE, "参数出错,请稍后再试"));
                }
            });
        }
        res.json(new FeedBack(FBCode.SUCCESS, '更新成功', null));
    }

    app.delete(RESTURL + "/scGoodDelete/:id",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_SHOPWINDOW), auth.validateReq,deleteShowcaseGoodHandler);
    /**
     * 删除橱窗商品
     * @param req
     * @param res
     */
    function deleteShowcaseGoodHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;
        var strId = req.params.id;//待删除的橱窗产品的ID
        var id = Number(strId);
        var scId=Number(req.body.scId);
        if (!underscore.isEmpty(strId) && !underscore.isNaN(id)) {

            model.delShowcaseGoods(customerDB, scId, id, function(err, result) {
                if(err) {
                    logger.error(err);
                    res.json(new FeedBack(FBCode.DBFAILURE,"删除失败,请重试."));
                }
                else {
                    res.json(new FeedBack(FBCode.SUCCESS,"删除成功",result));
                }
            });
        } else {
            res.json(new FeedBack(FBCode.INVALIDDATA, '参数出错'))
        }
    }

};
