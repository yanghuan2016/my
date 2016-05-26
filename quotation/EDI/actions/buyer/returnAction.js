/*
 *  出库单action
 */
var Dispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var URL = require('edi/constantsUrl')();
var Action = require('util/action');
var logger = require('util/logService');
var RestService = require('util/restService');
var Url = require('edi/constantsUrl')();

module.exports = {
    returnListAction: function(enterpriseId,filter){
        var url = URL.buyer.returnListUrl.replace("enterpriseId",enterpriseId);
        if(filter) {
            url = url + "?" + filter;
        }
       var service = new RestService(url);
       service.findAll(function(feedback){
           if(feedback.status == "200"){
               Dispatcher.dispatch(new Action(actionConstants.RETURN_LIST, feedback.data.orderShipReturns));
           }
       })
    },
    returnDetailAction:function(returnId,enterpriseId){
        var url = URL.buyer.returnDetailUrl.replace("enterpriseId",enterpriseId);
        var service = new RestService(url);
        service.find(returnId,function(feedback){
           if(feedback.status == "200"){
            Dispatcher.dispatch(new Action(actionConstants.RETURN_DETAIL, feedback.data.orderShipReturn[0]));
           }
        })
    },
    returnBatchAction:function(guid){
        Dispatcher.dispatch(new Action(actionConstants.RETURN_BATCH,guid));
    }
};