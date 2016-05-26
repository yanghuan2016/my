/**
 * EDI首页store
 */
var React = require('react');
var Dispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var actionConstants = require('ediConstants/constants');
var cookie = require('util/cookieUtil');
var userStore = require('ediStores/userStore');
var validateStore = require('ediStores/validateStore');
var CHANGE_EVENT = 'change';

var homeInfo = {
    quotation: '', /* 昨日询价笔数　*/
    number: '', /*　昨日订单笔数　*/
    amount: '', /*　昨日订单金额　*/
    ship: '', /*　昨天出库笔数　*/
    returns: '', /*　昨日退款笔数　*/
    lastlogin: '', /*　上次登录时间　*/
    clientBuyerTotal: '', /*　采购客户总数　*/
    clientBuyerMatched: '', /*　采购客户匹配数　*/
    clientSellerTotal: '', /*　供应商总数　*/
    clientSellerMatched: '', /*　供应商匹配数　*/
    goodsInfoTotal: '', /*　商品同步总数　*/
    goodsInfoMatched: '', /*　商品匹配数　*/
    data: [] /*　统计数量*/
};

var HomeStore = assign({}, EventEmitter.prototype, {
    getHomeInfo: function () {
        var data = [];
        if (homeInfo) {
            homeInfo.data.map(function (item) {
                _.mapValues(item, function (value) {
                    data.push(value);
                });
            });
            data = _.chunk(data, 2);
            homeInfo.data = _.map(data, function (index) {
                var temp = index[1];
                index[1] = index[0];
                index[0] = temp;
                return index
            });
            return homeInfo;
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

// Register callback with Dispatcher
Dispatcher.register(function (action) {
    switch (action.type) {

        case actionConstants.HOME_INFO:
            homeInfo = action.data;
            break;
        default:
            return true;
    }

    HomeStore.emitChange();

    return true;

});

module.exports = HomeStore;
