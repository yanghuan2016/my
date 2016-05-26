/**
 * productMatchStore 商品匹配
 */
var Dispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var actionConstants = require('ediConstants/constants');
var logger = require('util/logService');
var cookie = require('util/cookieUtil');

var leftProductList = [];
var rightProductList = [];

var productMatchStore = assign({}, EventEmitter.prototype, {

    emitChange: function () {
        logger.enter();
        this.emit(CHANGE_EVENT);
    },

    addChangeListener: function (callback) {
        logger.enter();
        this.on(CHANGE_EVENT, callback);
    },

    removeChangeListener: function (callback) {
        logger.enter();
        this.removeListener(CHANGE_EVENT, callback);
    },

    getLeftList: function () {
        return leftProductList;
    },

    getLeftListOne: function (id) {
        var temp = _.filter(leftProductList, function (item) {
            return item.id == id;
        });
        return temp.length > 0 ? temp[0] : [];
    },

    getRightList: function () {
        return rightProductList;
    },

    getRightListOne: function (id) {
        var temp = _.filter(rightProductList, function (item) {
            return item.id == id;
        });
        return temp.length > 0 ? temp[0] : [];
    }
});

/**
 * register callback
 */

Dispatcher.register(function (action) {
    logger.enter();
    switch (action.type) {

        case actionConstants.GET_PRODUCT_LIST_SUCCESS:
            leftProductList = action.data;
            break;

        case actionConstants.GET_PRODUCT_LIST_FROM_CLOUDS_SUCCESS:
            rightProductList = action.data;
            break;

        case actionConstants.GET_PRODUCT_LIST_ERROR:
            leftProductList = [];
            break;

        case actionConstants.GET_PRODUCT_LIST_FROM_CLOUDS_ERROR:
            rightProductList = [];
            break;

        default:
            return true;
    }
    productMatchStore.emitChange();
    return true;
});

module.exports = productMatchStore;