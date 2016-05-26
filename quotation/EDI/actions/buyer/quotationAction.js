/*
 *  报价单action
 */
var Dispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');
var RestService = require('util/restService');
var Url = require('edi/constantsUrl')();
var history = require('js/history');


module.exports = {
    getInquirys: function(enterpriseId, query){
        var url = Url.buyer.inquiryListUrl.replace('enterpriseId', enterpriseId);
        if(query) {
            url += ('?' + query);
        }
        var service = new RestService(url);
        service.findAll(function(res){
            Dispatcher.dispatch(new Action(actionConstants.INQUIRY_LIST, res));
        });
    },
    getQuotationDetail: function(id, enterpriseId, quotationType){
        var url = '';
        if(quotationType == 'QUOTATION'){
            url = Url.buyer.quotationDetailUrl.replace('enterpriseId', enterpriseId);
        }else if(quotationType == 'INQUIRY'){
            url = Url.buyer.inquiryDetailUrl.replace('enterpriseId', enterpriseId);
        }
        var service = new RestService(url);
        service.find(id, function(res){
            Dispatcher.dispatch(new Action(actionConstants.QUOTATION_DETAIL, res));
        });
    },
    getQuotations: function(enterpriseId, query){
        var url = Url.buyer.quotationListUrl.replace('enterpriseId', enterpriseId);
        if(query) {
            url += ('?' + query);
        }
        var service = new RestService(url);
        service.findAll(function(res){
            Dispatcher.dispatch(new Action(actionConstants.QUOTATION_LIST, res));
        })
    }
};