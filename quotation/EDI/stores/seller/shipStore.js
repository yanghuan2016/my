/**
 * seller出库单store
 */
var Dispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var actionConstants = require('ediConstants/constants');
var CHANGE_EVENT = 'change';
var logger = require('util/logService');
var moment = require('moment');

var shipList = [];
var orderInfo = [];
var shipDetail = {};
var batchList = [];

var shipStore = assign({}, EventEmitter.prototype, {
    getShipList: function () {
        return shipList;
    },
    getShipDetail: function () {
        return shipDetail;
        if (!shipDetail.billNo) {
            var tmp = shipList.orderShips[_.findIndex(shipList.orderShips, {'billNo': Number(id)})];
            if (tmp) {
                shipDetail = tmp;
            }
        }
    },
    getOrderInfo: function () {
        return orderInfo;
    },
    getBatchList: function () {
        return batchList;
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

Dispatcher.register(function (action) {
    switch (action.type) {
        case actionConstants.SHIP_SELLER_LIST:
            logger.trace(action);
            shipList = action.data;
            break;
        case actionConstants.SHIP_SELLER_DETAIL:
            shipDetail = action.data.shipDetails;
            orderInfo = [{name: "单据日期", value:moment(action.data.billDate).format("YYYY-MM-DD"), field: "billDate"},
                {name: "单据时间", value:moment(action.data.billDate).format("YYYY-MM-DD hh-mm-ss"), field: "billTime"},
                {name: "备注", value: action.data.notes, field: "notes"},
                {name: "供应商编号", value: action.data.sellerCode, field: "sellerCode"}];
            break;
        case actionConstants.SHIP_BATCH_LIST:
            var No = action.data;
            var detail = null;
            shipDetail.map(function (item) {
                if (item.shipDetailNo == No) {
                    detail = item;
                }
            });
            batchList = detail.batchDetailsN;
            break;
    }
    shipStore.emitChange();
    return true;
});

module.exports = shipStore;