/**
 * buyer退货单store
 */
var Dispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var actionConstants = require('ediConstants/constants');
var CHANGE_EVENT = 'change';
var logger = require('util/logService');

var returnList = [];
var returnDetailList =
{
    returnDetails:[],
    orderInfo:[]
};
var returnBatch = [];

var returnStore = assign({}, EventEmitter.prototype, {
    getReturnList: function(){
        return returnList;
    },

    getBatchList:function(){
        return returnBatch;
    },

    getReturnDetail: function(returnID){
        if(returnList.length!==0){
            returnDetailList = returnList[_.findIndex(returnList, {"guid":returnID})];
        }
        if(returnDetailList){
            var goodsInfo = {};
            returnDetailList.returnDetails.map(function(data){
                goodsInfo = {
                    buyerGoodsNo:data.buyerGoodsNo,
                    guid:data.guid,
                    commonName:data.commonName,
                    alias:data.alias,
                    producer:data.producer,
                    spec:data.spec,
                    imageUrl:data.imageUrl
                };
                data.goodsInfo = goodsInfo;
            });
            returnDetailList.orderInfo= [
                {
                    name: '单据日期',
                    field: 'billDate',
                    value: returnDetailList.billDate
                },
                {
                    name: '退回原因',
                    field: 'returnReason',
                    value: returnDetailList.returnReason
                },
                {
                    name: '申请备注',
                    field: 'Remark',
                    value: returnDetailList.Remark
                }
            ];
        }
        return returnDetailList;
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
        case actionConstants.RETURN_SELLER_LIST:
            logger.trace(action);
            returnList = action.data;
            break;
        case actionConstants.RETURN_SELLER_DETAIL:
            logger.trace(action);
            returnDetailList = action.data;
            break;
        case actionConstants.RETURN_SELLER_BATCH:
            logger.trace(action);
            returnBatch = returnDetailList.returnDetails[_.findIndex(returnDetailList.returnDetails, {"key":action.data})];
            returnBatch = returnBatch.batchDetail;
            break;
    }
    returnStore.emitChange();
    return true;
});

module.exports = returnStore;