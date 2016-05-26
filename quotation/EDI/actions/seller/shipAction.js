/*
 *  出库单action
 */
var Dispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');
var RestService = require('util/restService');
var Url = require('edi/constantsUrl')();

module.exports = {
    getListData: function (enterpriseId, url) {
        console.log(Url.seller.shipListUrl.replace(/enterpriseId/, enterpriseId) + url);
        var service = new RestService(Url.seller.shipListUrl.replace(/enterpriseId/, enterpriseId) + url);
        service.findAll(function (feedback) {
            if (feedback.status == "200") {
                Dispatcher.dispatch(new Action(actionConstants.SHIP_SELLER_LIST,
                    feedback.data.orderShips));
            }
        })
    },
    getShipDetail: function (enterpriseId, id) {
        var service = new RestService(Url.seller.shipDetailUrl.replace(/enterpriseId/, enterpriseId));
        service.find(id, function (feedback) {
            if (feedback.status == "200") {
                var details = feedback.data && feedback.data.shipDetails;
                var length = details ? details.length : 0;
                if (length > 0) {
                    for (var i = 0; i < length; i++) {
                        var sum = 0;//计算商品数量
                        for (var j = 0; j < details[i].batchDetails.length; j++) {
                            sum += details[i].batchDetails[j].quantity
                        }
                        details[i].goodsNum = sum;
                    }
                    Dispatcher.dispatch(new Action(actionConstants.SHIP_SELLER_DETAIL,
                        feedback.data));
                }
            }
        })
    },
    getBatchAction: function (No) {
        Dispatcher.dispatch(new Action(actionConstants.SHIP_BATCH_LIST, No));
    }
};