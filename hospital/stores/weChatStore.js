/**
 * 医药直通车-微信Store
 * Created by time on 16-5-13.
 */
var Dispatcher = require('dispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var constants = require('base/constants.js');
var logger = require('util/logService');
var cookie = require('util/cookieUtil');

var recipeInfo = {
    prescription:[],
    diagnosis:[],
    patient:[]
};
var pickUpInfo ={
    pickUpInfo:{},
    goods:[]
};
var orderData={};//发送到要配送的抢单数据

var WeChatStore = assign({}, EventEmitter.prototype, {
    getOrderData:function(){
      return orderData;
    },
    getCustomerRecipe:function(){
        return recipeInfo
    },

    pickUpInfo:function(){
        return pickUpInfo
    },

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
    }
});

/**
 * register callback
 */

Dispatcher.register(function (action) {
    logger.enter();
    switch (action.type) {
        case constants.GETRECIPE_INFO:
            recipeInfo = action.data;
            break;
        case constants.PICKUP_INFO:
            pickUpInfo = action.data;
            break;
        case constants.GET_ORDERINFO:
            orderData=action.data;
        default:
            return true;
    }
    WeChatStore.emitChange();
    return true;
});

module.exports = WeChatStore;