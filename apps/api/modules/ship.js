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
 * ship.js
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
    var shipModel = require( __base + "/apps/customer/ship/model")();
    var orderModel = require( __base + "/apps/order/model")();

    var apiModule = {

        B2B_ORDER_SHIP : function (data){
            logger.enter();
            var customerDBName = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            customerModel.orderStatusCheck(customerDBName,msg.msgData.orderId,"APPROVED",function(success){
                if(success){
                    var operatorData ={
                        operatorId : operatorId,
                        clientId : msg.msgData.clientId
                    };
                    shipModel.newShipInfo(customerDBName,msg.msgData,operatorData,function(err,shipId){
                        if(!err){
                            //todo notify add shipInfo success ;
                        }else{
                            //todo notify  add shipInfo fail ;
                        }
                    });
                }else{
                    //todo notify order status ;
                }
            })
        },

        B2B_ORDER_SHIP_RECEIVE : function (data) {
            logger.enter();
            var customerDBName = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            shipModel.shipStatusCheck(customerDBName,msg.msgData.shipId,function(success){
                if(success){
                    var operatorData ={
                        operatorId : operatorId,
                        clientId : msg.msgData.clientId
                    };
                     orderModel.updateShipReceived(customerDBName,operatorData,msg.msgData,function(err,shipId){
                        if(!err){
                            //todo notify shipreceive Info success ;
                        }else{
                            //todo notify shipreceive Info Fail ;
                        }

                    });
                }else{
                    //todo notify order status ;
                }
            })

        },

        //由于R1M2的设计上，拒收在收货时自动生成，所以暂时不会有具体实现方法
        B2B_ORDER_SHIP_REJECT : function (data) {
        }
    };
    return apiModule;
};