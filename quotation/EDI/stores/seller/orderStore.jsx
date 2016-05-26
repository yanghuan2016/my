/**
 * seller订单管理Store
 *
 * added by sunshine 2016-04-20
 */

var Dispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var actionConstants = require('ediConstants/constants');
var CHANGE_EVENT = 'change';

var orderList = [];
var orderDetailList = {
    goods: [],
    orderInfo: []
};

var orderStore = assign({}, EventEmitter.prototype, {

    // Return order items
    getOrderList: function () {
        return orderList;
    },

    // Return news details items
    getOrderDetailList: function (orderID) {
        if (orderList.length !== 0) {
            orderDetailList = orderList[_.findIndex(orderList, {"billNo": orderID})];
        }
        if (orderDetailList) {
            var goodsInfo = {};
            orderDetailList.goods.map(function (data) {
                goodsInfo = {
                    goodsNo: data.buyerGoodsNo,
                    licenseNo: data.licenseNo,
                    commonName: data.commonName,
                    alias: data.alias,
                    producer: data.producer,
                    spec: data.spec,
                    imageUrl: data.imageUrl
                };
                data.goodsInfo = goodsInfo;
            });
            orderDetailList.orderInfo = [
                {
                    name: '单据日期',
                    field: 'billDate',
                    value: orderDetailList.billDate
                },
                {
                    name: '单据失效期',
                    field: 'usefulDate',
                    value: orderDetailList.usefulDate
                },
                {
                    name: '预到货日期',
                    field: 'advGoodsArriveDate',
                    value: orderDetailList.advGoodsArriveDate
                },
                {
                    name: '送货地址',
                    field: 'consigneeAddress',
                    value: orderDetailList.consigneeAddress
                }, {
                    name: '订单备注',
                    field: 'remark',
                    value: orderDetailList.remark
                }
            ];
        }
        return orderDetailList;
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

// Register callback with Dispatcher
Dispatcher.register(function (action) {
    switch (action.type) {

        case actionConstants.ORDER_SELLER_LIST:
            orderList = action.data;
            break;

        case actionConstants.ORDER_SELLER_DETAIL:
            orderDetailList = action.data;
            break;

        default:
            return true;
    }

    orderStore.emitChange();

    return true;

});

module.exports = orderStore;
