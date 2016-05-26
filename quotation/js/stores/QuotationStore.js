var Dispatcher = require('js/dispatcher/dispatcher');

var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var type = 'pending';

var dataList = {
    quotationList: [],
    inquiryList: []
};
var quotationList = [];
var inquiryList = [];

var currentList = []; //询价单列表 [已报价 或者 未报价]

var currentQuotationDetail = {}; //某个询价单

var quotationGoodDetail = {}; //询价单里面 单个商品的报价以及数量

var Constants = require('actionConstants/constants');
var quotationListAction = require('actions/quotationListAction');
var cookieUtil = require('util/cookieUtil');

var logger = require('util/logService');
var tips = "";


var QuotationStore = assign({}, EventEmitter.prototype, {
    /**
     * 某个
     * @param goodsNo
     * @returns {{}}
     */
    getCurrentDetailGoodItem: function (No) {
        logger.ndump("currentQuotationDetail", currentQuotationDetail);
        if (currentQuotationDetail && (currentQuotationDetail.addInquiryDetails || currentQuotationDetail.quotationDetails)) {
            var quotationGoodsList = currentQuotationDetail.addInquiryDetails || currentQuotationDetail.quotationDetails || [];
            quotationGoodDetail = quotationGoodsList[_.findIndex(quotationGoodsList, { unicode: No })];
        }
        return quotationGoodDetail;
    },
    /**
     * 某一个商家的询价情况
     * @returns {{}}
     */
    getCurrentDetail: function () {
        return currentQuotationDetail;
    },

    getTips: function () {
        return tips;
    },
    /**
     * 询价列表
     * @returns {Array}
     */
    getInquiryList: function () {
        logger.ndump('获取store里的数据:');
        logger.info(dataList);
        return inquiryList;
    },
    getQuotationList: function(){
        return quotationList;
    },
    emitChange: function () {
        this.emit(CHANGE_EVENT);
    },
    addChangeListener: function (callback) {
        this.on(CHANGE_EVENT, callback);
    },
    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    }
});


QuotationStore.dispatchToken = Dispatcher.register(function (action) {
    switch (action.actionType) {
        case Constants.TODO_GETALL_INQUIRY:
            logger.info("获取数据完成");
            var inquiries = action.data.inquirySheets || [];
            if(inquiries.length > 0){
                inquiryList = _.groupBy(inquiries, function(item){
                    var date = new Date(item.createdOn);
                    return date.getFullYear() + '-' + (date.getMonth()+1);
                })
            }
            break;
        //待报价 和 已报价 切换
        case Constants.TODO_QUTATIONTYPE:
            currentList = _.filter(quotationList, function (item) {
                return item.status == action.data;
            });
            break;

        case Constants.TODO_QUOTATIONDETAIL:
            //logger.ndump("action", action);
            //logger.ndump("store quotationList = ", action.data);
            currentQuotationDetail = action.data.inquirySheets || action.data.quotationSheets;
            break;

        case Constants.TODO_queryQuationSuccess:
            if(action.data.queryList.length > 0){
                action.data.queryList = _.groupBy(action.data.queryList, function(item){
                    var date = new Date(item.createdOn);
                    return date.getFullYear() + '-' + (date.getMonth()+1);
                })
            }
            switch(action.data.type){
                case 'inquiry':
                    inquiryList = action.data.queryList;
                    break;
                case 'quotation':
                    quotationList = action.data.queryList;
                    break;
            }
            break;

        case Constants.TODO_queryQuationFiled:
            tips = action.data.msg;
            break;

        case Constants.TODO_GETALL_QUOTATION:
            var quotations = action.data.quotationSheets || [];
            if(quotations.length > 0){
                quotationList = _.groupBy(quotations, function(item){
                    var date = new Date(item.createdOn);
                    return date.getFullYear() + '-' + (date.getMonth()+1);
                })
            }
            break;
        default:
            return true;
    }
    QuotationStore.emitChange();
});


module.exports = QuotationStore;