/*
 *  出库单action
 */
var Dispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');
var RestService = require('util/restService');
var URL = require('edi/constantsUrl')();

module.exports = {
    returnListAction: function (enterpriseId,filter) {
        var url = URL.seller.returnListUrl.replace("enterpriseId", enterpriseId);
        if(filter) {
            url = url + "?" + filter;
        }
        var service = new RestService(url);
        service.findAll(function(feedback) {
            if(feedback.status == "200"){
                Dispatcher.dispatch(new Action(actionConstants.RETURN_SELLER_LIST, feedback.data.orderShipReturns));
            }
        })
    },
    returnDetailAction: function (returnId, enterpriseId) {
        var url = URL.seller.returnDetailUrl.replace("enterpriseId", enterpriseId);
        var service = new RestService(url);
        service.find(returnId, function (feedback) {
            Dispatcher.dispatch(new Action(actionConstants.RETURN_SELLER_DETAIL, feedback.data.orderShipReturns));
        })
    },
    returnBatchAction:function(guid){
        Dispatcher.dispatch(new Action(actionConstants.RETURN_SELLER_BATCH,guid));
    }
};

