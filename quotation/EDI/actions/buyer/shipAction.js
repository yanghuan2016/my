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
    getListData: function(enterpriseId, query){
        //替换掉url中的enterpriseId
        var url = Url.buyer.shipListUrl.replace('enterpriseId', enterpriseId);
        //拼接query参数
        if(query) {
            url += ('?' + query);
        }
        var service = new RestService(url);
        service.findAll(function(res){
            Dispatcher.dispatch(new Action(actionConstants.SHIP_LIST, res));
        })
    },
    getShipDetail: function(enterpriseId, id){
        var url = Url.buyer.shipDetailUrl.replace('enterpriseId', enterpriseId);
        var service = new RestService(url);
        service.find(id, function(res){
            Dispatcher.dispatch(new Action(actionConstants.SHIP_DETAIL, res));
        })
    }
};