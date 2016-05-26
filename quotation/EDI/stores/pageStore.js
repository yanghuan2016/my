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

var leftActive = '';
var msg = '';

var socketIoService = require('util/socketIoService');

var pageStore = assign({}, EventEmitter.prototype, {

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

    getLeftActive: function () {
        return leftActive;
    },

    getMsg: function () {
        return msg;
    }

});

/**
 * register callback
 */

Dispatcher.register(function (action) {
    logger.enter();
    var data = action.data;
    switch (action.type) {

        case actionConstants.SWITCHLEFTACTIVE:
            cookie.setItem('leftActive', data);
            leftActive = data;
            break;

        case actionConstants.SWITCHTYPE:
            cookie.setItem('enterpriseType', data);
            break;

        case actionConstants.CHANGE_MSG:
            msg = data;
            break;

        default:
            return true;
    }
    pageStore.emitChange();
    return true;
});

module.exports = pageStore;