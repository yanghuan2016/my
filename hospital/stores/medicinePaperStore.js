/**
 * 引导单store
 */
var Dispatcher = require('dispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var actionConstants = require('base/constants');
var CHANGE_EVENT = 'change';
var logger = require('util/logService');

var ifShow = false;
var qrCodeUrl = '';

var medicinePaperStore = assign({}, EventEmitter.prototype, {
    ifShowMedicinePaper(){
        return ifShow;
    },
    // Emit Change event
    emitChange: function () {
        this.emit(CHANGE_EVENT);
    },

    getQrcode: function(){
        return qrCodeUrl;
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
        case actionConstants.SHOW_MEDICINE_PAPER:
            logger.trace(action);
            ifShow = action.data.ifShow;
            break;
        case actionConstants.GET_QRCODE:
            if(action.data.status == 200){
                qrCodeUrl = action.data.data.url;
            }
            break;
    }
    medicinePaperStore.emitChange();
    return true;
});

module.exports = medicinePaperStore;