/**
 * socketIoAction
 */
var Dispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');

module.exports = {

    updatePercent: function (percent) {
        Dispatcher.dispatch(new Action(actionConstants.UPDATE_PERCENT, percent));
    },

    updateSyncData: function (result) {
        Dispatcher.dispatch(new Action(actionConstants.SET_NOTIFICATION, result));
    },

    displayErpModal: function () {
        Dispatcher.dispatch(new Action(actionConstants.DISPLAY_ERPMODAL));
    }
};