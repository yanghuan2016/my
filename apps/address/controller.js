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
 * address/controller.js
 *
 * --------------------------------------------------------------
 * 2015-09-24	xdw-romens@issue#43 created
 *
 */

module.exports=function(app) {
    /*
     * Services
     */
    var logger = __logService;
    /*
     * load 3rd party modules
     */
    var path = require('path');
    var underscore = require("underscore");
    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    /*
     * init app name etc
     */
    var APPNAME = __dirname.split(path.sep).pop();
    var APPURL = "/" + APPNAME;
    /*
     * load module
     */
    var ApiModel = require("./model");
    var model = new ApiModel();
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     *handle to add  Address
     */
    app.post(APPURL + "/add", auth.restrict, auth.validateReq,postAddAddressHandler);
    function postAddAddressHandler(req,res){
        logger.enter();
        var data = req.body;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        model.postAddress(customerDB,operatorData.clientId,data.addressDetail,function(err,addressId){
            var fb;
            if (!err) {
                fb = new FeedBack(FBCode.SUCCESS,"添加地址成功",addressId);
            } else {
                fb=new FeedBack(FBCode.DBFAILURE,err.code);
            }
            res.json(fb);
        });
    }
    /*
     *handle to update Address
     */
    app.post(APPURL + "/update",auth.restrict, auth.validateReq, postUpdateAddressHandler);
    function postUpdateAddressHandler(req,res){
        logger.enter();
        var data = req.body;
        //update address data to DB by addressId
        var customerDB = req.session.customer.customerDB;
        model.putAddress(customerDB,data.addressId,data.addressDetail,function(err,affectedRows){
            var fb;
            if(!err){
                fb = new FeedBack(FBCode.SUCCESS,"更新地址成功",affectedRows);
            }else{
                fb = new FeedBack(FBCode.DBFAILURE,err.code);
            }
            res.json(fb);
        });

    }
    /*
     *handle to delete Address by addressId
     */
    app.get(APPURL + "/delete", auth.restrict, auth.validateReq, getDeleteAddressHandler);
    function getDeleteAddressHandler(req,res){
        logger.enter();
        var addressId = req.param('id');
        //delete address data from DB by addressId
        var customerDB = req.session.customer.customerDB;
        model.deleteAddress(customerDB,addressId,function(err,affectedRows){
            var fb;
            if(!err){
                fb = new FeedBack(FBCode.SUCCESS,"删除地址成功",affectedRows);
            }else{
                fb = new FeedBack(FBCode.DBFAILURE,err.code);
            }
            res.json(fb);
        });
    }
};

