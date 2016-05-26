/**
 * 客户订单管理Action
 */
var Dispatcher = require('ediDispatcher');
var URL = require('edi/constantsUrl')();
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');
var RestService = require('util/restService');

module.exports = {
    orderListAction:function(enterpriseId,filter){
        var url = URL.buyer.orderListUrl.replace("enterpriseId", enterpriseId);
        if(filter) {
             url = url + "?" + filter;
        }
        console.log(url);
        var service = new RestService(url);
        service.findAll(function(feedback){
            if (feedback.status == "200") {
                Dispatcher.dispatch(new Action(actionConstants.ORDER_LIST, feedback.data.orders));
            }
        });
    },
    orderDetailAction:function(orderId,enterpriseId){
        var url = URL.buyer.orderDetailUrl.replace("enterpriseId",enterpriseId);
        var service = new RestService(url);
        service.find(orderId,function(feedback){
            if (feedback.status == "200") {
                Dispatcher.dispatch(new Action(actionConstants.ORDER_DETAIL, feedback.data));
            }
        });
    }
};