/*****************************************************************
 * 青岛雨人软件有限公司?2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 * return.js
 *
 */
var logger = __logService;

module.exports = function() {
    /**
     * Service
     */
    var logger = __logService;

    /**
     *  modules
     */
    var customerModel = require( __base + "/apps/customer/model")();
    var orderModel = require( __base + "/apps/order/model")();
    var underscore = require("underscore");


    var apiModule = {

        //创建退货信息
        B2B_ORDER_RETURN_NEW : function (data){
            logger.enter();
            var customerDBName = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            var returnInfo = msg.msgData;
            returnInfo.returnData = underscore.filter(returnInfo.returnData, function(item){
                return Number(item.quantity) != 0;
            });
            if(returnInfo.returnData.length <= 0){
                //res.json(new FeedBack(FBCode.DBFAILURE,"不能退0个商品"));
                return;
            }
            orderModel.returnOverLimit(customerDBName,returnInfo,function(success){
                if(success){
                    var operatorData ={
                        operatorId : operatorId,
                        clientId : msg.msgData.clientId
                    };
                    orderModel.addReturnInfo(customerDBName,returnInfo,operatorData,function(err,returnId){
                        if(!err){
                            //fb=new FeedBack(FBCode.SUCCESS,"创建退货信息成功",{results : returnId});
                        }else{
                            //fb=new FeedBack(FBCode.DBFAILURE,"创建退货信息失败"+err.code);
                        }
                    });
                }else{
                    //fb=new FeedBack(FBCode.INVALIDACTION,"该商品已经申请过退货且当前退货总数超出发货数量，申请失败");
                }
            })

        },

        //退货审核
        B2B_ORDER_RETURN_CONFIRM : function (data) {
            logger.enter();
            var customerDB = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            var msgData = msg.msgData;
            customerModel.returnStatusCheck(customerDB,msgData.returnId,"CREATED",function(success){
                if(success){
                    var operatorData ={
                        operatorId : operatorId,
                        clientId : msg.msgData.clientId
                    };
                    customerModel.updateReturnStatus(customerDB,msgData.returnId,msgData.customerReply,msgData.approvedItems,operatorData,function(err,returnId){
                        if (returnId) {
                            //fb = new FeedBack(FBCode.SUCCESS, "退货单已审核", {returnId:returnId});
                        } else {
                            //fb = new FeedBack(FBCode.DBFAILURE, "退货单审核失败, " + err.code);
                        }
                    });
                }else{
                    //fb = new FeedBack(FBCode.DBFAILURE, "客户退货单已审核");
                }
            });
        },

        //退货发货
        B2B_ORDER_RETURN_SHIP : function (data) {
            logger.enter();
            var customerDB = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            var returnData = msg.msgData;
            orderModel.returnStatusCheck(customerDB,returnData.returnId,"APPROVED",function(success){
                if(success){
                    var operatorData ={
                        operatorId : operatorId,
                        clientId : msg.msgData.clientId
                    };
                    orderModel.transUpdateReturn(customerDB,returnData,operatorData,function(err,affectedRows){
                        if (!err) {
                            //fb=new FeedBack(FBCode.SUCCESS,"退货单已发货",{results : affectedRows});
                        } else {
                            //fb=new FeedBack(FBCode.DBFAILURE,"退货单发货失败"+err.code);
                        }
                    })
                }else{
                    //fb=new FeedBack(FBCode.INVALIDACTION,"退货单已发货，不能重复操作");
                }
            })
        },

        //退货收货
        B2B_ORDER_RETURN_RECEIVE : function (data) {
            logger.enter();
            var customerDB = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            var deliverData = msg.msgData;
            customerModel.returnStatusCheck(customerDB,deliverData.returnId,"SHIPPED",function(success){
                if(success){
                    var operatorData ={
                        operatorId : operatorId,
                        clientId : msg.msgData.clientId
                    };
                    customerModel.confirmReturnDelivered(customerDB,deliverData,operatorData,function(err,returnId){
                        if (returnId) {
                            //fb = new FeedBack(FBCode.SUCCESS, "退货单已确认收货", {returnId:returnId});
                        } else {
                            //fb = new FeedBack(FBCode.DBFAILURE, "退货单确认收货失败, " + err.code);
                        }
                    });
                }else{
                    //fb = new FeedBack(FBCode.DBFAILURE, "客户退货单不是已发货状态，不能确认收货");
                }
            });
        }
    };
    return apiModule;
};