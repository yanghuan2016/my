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
var message = require('antd').message;

module.exports = {
    getInquirys: function(enterpriseId, query){
        var url = Url.seller.inquiryListUrl.replace('enterpriseId', enterpriseId);
        if(query) {
            url += ('?' + query);
        }
        var service = new RestService(url);
        service.findAll(function(res){
            Dispatcher.dispatch(new Action(actionConstants.INQUIRY_SELLER_LIST, res));
        });
    },
    getQuotationDetail: function(id, enterpriseId, quotationType){
        var url = '';
        //根据单据已报或者未报价状态选择url
        if(quotationType == 'QUOTATION'){
            url = Url.seller.quotationDetailUrl.replace('enterpriseId', enterpriseId);
        }else if(quotationType == 'INQUIRY'){
            url = Url.seller.inquiryDetailUrl.replace('enterpriseId', enterpriseId);
        }
        var service = new RestService(url);
        service.find(id, function(res){
            Dispatcher.dispatch(new Action(actionConstants.QUOTATION_SELLER_DETAIL, res));
        });
    },
    getQuotations: function(enterpriseId, query){
        var url = Url.seller.quotationListUrl.replace('enterpriseId', enterpriseId);
        if(query) {
            url += ('?' + query);
        }
        var service = new RestService(url);
        service.findAll(function(res){
            Dispatcher.dispatch(new Action(actionConstants.QUOTATION_SELLER_LIST, res));
        })
    },
    replyInquiry: function(datas, enterpriseId){
        var url = Url.seller.replyInquiryUrl.replace('enterpriseId', enterpriseId);
        var service = new RestService(url);
        service.post(datas, function(res){
            try{
                res = JSON.parse(res);
                if(res.status == 200){
                    history.pushState(null, '/seller/quotation');
                } else {
                    message.error('报价提交失败' + res.msg);
                }
            } catch(err){
                logger.error(JSON.stringify(err));
                message.error('参数错误' + res.msg);
            }
        });
    }

};