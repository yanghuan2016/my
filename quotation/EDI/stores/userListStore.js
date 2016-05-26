/**
 * 用户信息　store
 */
var Dispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var actionConstants = require('ediConstants/constants');
var logger = require('util/logService');
var cookie = require('util/cookieUtil');

var clientList = [];
var supplierList = [];

var userListStore = assign({}, EventEmitter.prototype, {

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

    getClientList: function(){
        return clientList;
    },

    getSupplierList: function(){
        return supplierList;
    }

});

/**
 * register callback
 */

Dispatcher.register(function (action) {
    logger.enter();
    var data = action.data;
    switch (action.type) {

        case actionConstants.GET_CLIENT_LIST_SUCCESS:
            var tempOne = data.clientList;
            clientList = _.map(tempOne, function (item) {
                item.key = item.erpCode;
                return item;
            });
            break;

        case actionConstants.GET_SUPPLIER_LIST_SUCCESS:
            var tempTwo = data.supplierList;
            supplierList = _.map(tempTwo, function (item) {
                item.key = item.erpCode;
                return item;
            });
            break;

        default:
            return true;
    }
    userListStore.emitChange();
    return true;
});

module.exports = userListStore;