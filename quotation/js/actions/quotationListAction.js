var Dispatcher = require('js/dispatcher/dispatcher');
var SysConstants = require('js/Sysconfig.js');
var RestService = require('util/restServiceNoToken');
var assign = require('object-assign');
var message = require('antd').message;

var actionConstants = require('actionConstants/constants');

var goods = require('./1.jpg');
var logger = require('util/logService');

var quotationListAction = {
    initialData: function (enterpriseId) {
        (typeof enterpriseId === 'undefined') && logger.error('no enterpriseId');
        var url = SysConstants.quotationList.getAllUrl.replace('enterpriseId', enterpriseId);
        var _ajax = new RestService(url);
        _ajax.findAll(function (feedback) {
            logger.info("获取数据");
            if(feedback){
                Dispatcher.dispatch({
                    actionType: actionConstants.TODO_GETALL_INQUIRY,
                    data: feedback.data
                })
            }
        });
    },
    getQuotationList: function(enterpriseId){
        (typeof enterpriseId === 'undefined') && logger.error('no enterpriseId');
        var url = SysConstants.quotationList.getInquiryList.replace('enterpriseId', enterpriseId);
        var _ajax = new RestService(url);
        _ajax.findAll(function(feedback){
            if(feedback){
                Dispatcher.dispatch({
                    actionType: actionConstants.TODO_GETALL_QUOTATION,
                    data: feedback.data
                })
            }
        })
    },
    getDetails: function (id, type, enterpriseId) {
        logger.ndump("id = " + id);
        var url;
        switch(type){
            case 'inquiry':
                url = SysConstants.quotationList.getInquiryDetailUrl;
                break;
            case 'quotation':
                url = SysConstants.quotationList.getQuotationDetailUrl;
                break;
        }
        url = url.replace('enterpriseId', enterpriseId);
        var _ajax = new RestService(url);
        _ajax.find(id, function (feedback) {
            logger.ndump("获取 quotation details　feedback");
            if (feedback.status == "200") {
                Dispatcher.dispatch({
                    actionType: actionConstants.TODO_QUOTATIONDETAIL,
                    data: feedback.data
                });
            }
        });
    },
    changeType: function (data) {
        Dispatcher.dispatch({
            actionType: actionConstants.TODO_QUTATIONTYPE,
            data: data
        })
    },
    updateQuationPriceAndNum: function (data, enterpriseId) {
        var url = SysConstants.quotationList.updateQuationPriceAndNumUrl.replace('enterpriseId', enterpriseId);
        var _ajax = new RestService(url);
        _ajax.post(data, function (feedback) {
            feedback = JSON.parse(feedback);
            if (feedback && (feedback.status == 200)) {
                history.pushState(null, '/quotation');
            } else {
                //todo 提示错误
                message.error('参数错误');
            }
        });
    },
    queryQuation: function (data, type, enterpriseId) {
        var url = '';
        switch(type){
            case 'inquiry':
                url = SysConstants.quotationList.getAllUrl;
                break;
            case 'quotation':
                url = SysConstants.quotationList.getInquiryList;
                break;
        }
        url = url.replace('enterpriseId', enterpriseId);
        url += '?' + $.param(data);
        logger.trace(url);
        var _ajax = new RestService(url);
        _ajax.findAll(function (feedback) {
            //test data
            //logger.ndump("获取　feedback", feedback);
            if (feedback && (feedback.status == 200)) {
                Dispatcher.dispatch({
                    actionType: actionConstants.TODO_queryQuationSuccess,
                    data: {
                        queryList: feedback.data.inquirySheets || feedback.data.quotationSheets,
                        type: type
                    }
                })
            } else if(feedback) {
                Dispatcher.dispatch({
                    actionType: actionConstants.TODO_queryQuationFiled,
                    data: feedback.data
                });
            }
        });
    }
};
module.exports = quotationListAction;