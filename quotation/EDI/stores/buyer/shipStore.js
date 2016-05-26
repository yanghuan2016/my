/**
 * buyer出库单store
 */
var Dispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var actionConstants = require('ediConstants/constants');
var CHANGE_EVENT = 'change';
var logger = require('util/logService');

var shipList = {
    orderShips:[]
};
var shipDetail = {};

var shipStore = assign({}, EventEmitter.prototype, {
    getShipList: function(){
        return shipList;
    },
    getBatchList: function (No) {
        logger.trace(No);
        return shipDetail.shipDetails[_.findIndex(shipDetail.shipDetails, {shipDetailNo: No})].batchDetails;
    },
    getShipDetail: function(id){
        if(!shipDetail.billNo){
            var tmp = shipList.orderShips[_.findIndex(shipList.orderShips, {'billNo': Number(id)})];
            if(tmp){
                shipDetail = tmp;
            }
        }
        var data = {};
        if(shipDetail){
            //筛选出需要显示的字段
            data.displayField = [
                {
                    name: '单据日期',
                    field: 'billDate',
                    value: shipDetail.billDate
                },{
                    name: '单据时间',
                    field: 'billTime',
                    value: shipDetail.billDate
                },{
                    name: '备注',
                    field: 'notes',
                    value: shipDetail.notes
                },{
                    name: '供应商编号',
                    field: 'sellerCode',
                    value: shipDetail.sellerCode
                }
            ];
            data.detail = shipDetail;
            return data;
        }
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
        case actionConstants.SHIP_LIST:
            if(action.data.status == 200){
                shipList = action.data.data;
            }
            break;
        case actionConstants.SHIP_DETAIL:
            if(action.data.status == 200){
                shipDetail = action.data.data.orderShip;
            }
            break;
    }
    shipStore.emitChange();
    return true;
});

module.exports = shipStore;