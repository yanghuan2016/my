/**
 * userAction
 */
var Dispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');

module.exports = {

    switchLeftActive: function (type) {
        Dispatcher.dispatch(new Action(actionConstants.SWITCHLEFTACTIVE, type));
    },

    switchType: function (type) {
        Dispatcher.dispatch(new Action(actionConstants.SWITCHTYPE, type));
    },

    clearMessage: function () {
        Dispatcher.dispatch(new Action(actionConstants.CHANGE_MSG, ''));
    }

};