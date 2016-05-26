/**
 * buyer报价单相关store
 */
var Dispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var actionConstants = require('ediConstants/constants');
var CHANGE_EVENT = 'change';
var logger = require('util/logService');

var listData = {
    quotationList: {
        quotationSheets: [],
        filter: {}
    },
    inquiryList: {
        inquirySheets: [],
        filter: {}
    }
};
var quotationDetail = {
    inquiryId: '',
    guid: '',
    createdOn: '',
    typesCount: '',
    subtotal: '',
    key: '',
    addInquiryDetails: [''],
    quotationDetails: ['']
};

var quotationStore = assign({}, EventEmitter.prototype, {
    getQuotationList: function(){
        return listData;
    },
    getQuotationDetail: function (id) {
        //分别尝试从inquiryList和quotationList中查找对应inquiryId的detail
        //var tmp = listData.inquiryList.inquirySheets[_.findIndex(listData.inquiryList.inquirySheets, {'inquiryId': Number(id)})];
        //if(tmp){
        //    quotationDetail = tmp;
        //    quotationDetail.type = 'INQUIRY';
        //} else {
        //    tmp = listData.quotationList.quotationSheets[_.findIndex(listData.quotationList.quotationSheets, {'inquiryId': Number(id)})];
        //    if(tmp){
        //        quotationDetail = tmp;
        //        quotationDetail.type = 'QUOTATION';
        //    }
        //}
        return quotationDetail;
    },
    // Emit Change event
    emitChange: function () {
        this.emit(CHANGE_EVENT);
    },

    // Add change listener
    addChangeListener: function (callback) {
        this.on(CHANGE_EVENT, callback);
    },

    // Remove change listener
    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    }
});

Dispatcher.register(function(action){
    switch (action.type) {
        case actionConstants.INQUIRY_LIST:
            if(action.data && action.data.status == 200){
                listData.inquiryList = action.data.data;
            }
            break;

        case actionConstants.QUOTATION_DETAIL:
            if(action.data && action.data.status == 200){
                quotationDetail = action.data.data.inquirySheets || action.data.data.quotationSheets;
            }
            break;
        case actionConstants.QUOTATION_LIST:
            if(action.data && action.data.status == 200){
                listData.quotationList = action.data.data;
            }
            break;
    }
    quotationStore.emitChange();
    return true;
});

module.exports = quotationStore;
