/*
 *  引导单的action
 */
var Dispatcher = require('dispatcher');
var actionConstants = require('base/constants');
var Action = require('util/action');
var logger = require('util/logService');
var RestService = require('util/restService');
var Url = require('base/url')();
var history = require('base/history');

module.exports = {
    showMedicinePaper: function(ifShow){
        Dispatcher.dispatch(new Action(actionConstants.SHOW_MEDICINE_PAPER, { ifShow: ifShow }));
    },
    getQrcode: function(prescriptionId){
        var url = Url.getQrcodeUrl.replace('prescriptionId', prescriptionId);
        var server = new RestService(url);
        server.findAll(function(feedback){
            Dispatcher.dispatch(new Action(actionConstants.GET_QRCODE, feedback));
        });
    }
};