/**
 * seller订单管理Action
 *
 * added by sunshine 2016-04-20
 */
var Dispatcher = require('ediDispatcher');
var URL = require('edi/constantsUrl')();
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');
var RestService = require('util/restService');

module.exports = {
    orderListAction: function (enterpriseId, filter) {
        var url = URL.seller.orderListUrl.replace("enterpriseId", enterpriseId);
        if (filter) {
            url = url + "?" + filter;
        }
        var service = new RestService(url);
        service.findAll(function (feedback) {
            if (feedback.status == "200") {
                Dispatcher.dispatch(new Action(actionConstants.ORDER_SELLER_LIST, feedback.data));
            }
        });
    },
    orderDetailAction: function (orderId, enterpriseId) {
        var url = URL.seller.orderDetailUrl.replace("enterpriseId", enterpriseId);
        var service = new RestService(url);
        service.find(orderId,function (feedback) {
            if (feedback.status == "200") {
                Dispatcher.dispatch(new Action(actionConstants.ORDER_SELLER_DETAIL, feedback.data));
            }
        });
    }
};