var ErpSettingDispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var actionConstants = require('ediConstants/constants');
var cookie = require('util/cookieUtil');
var userStore = require('ediStores/userStore');
var validateStore = require('ediStores/validateStore');
var CHANGE_EVENT = 'change';

var list = {
    winContent: [],
    winTital: null,
    winServer: null,
    winFooter: [],
    visible: false,
    keepLoading: {
        timedesc: "上次数据同步完成时间：",
        time: null
    },
    SaveStatus: true,
    LinkStatus: true
};
var loading = false;
var ImportRate = 0;

var ErpSettingStore = assign({}, EventEmitter.prototype, {

    getData: function () {
        return list;
    },
    getLoading: function () {
        return loading;
    },
    getAPPKey: function () {
        return cookie.getItem('enterpriseInfo') ? JSON.parse(cookie.getItem('enterpriseInfo')).appKey : "";
    },

    getPrograssData: function () {
        return ImportRate;
    },

    emitChange: function () {
        this.emit(CHANGE_EVENT);
    },

    addChangeListener: function (callback) {
        this.on(CHANGE_EVENT, callback);
    },

    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    }
});

ErpSettingDispatcher.register(function (action) {

    var data;

    switch (action.actionType) {

        case actionConstants.GET_APPKEY:
            data = action.data.trim();
            if (data !== '' && cookie.getItem('enterpriseInfo')) {
                var info = JSON.parse(cookie.getItem('enterpriseInfo'));
                info.appKey = data;
                cookie.setItem('enterpriseInfo', JSON.stringify(info));
            }
            break;

        case actionConstants.KEEP_LOADING:
            list.keepLoading.time = null;
            break;

        case actionConstants.STOP_LOADING:
            list.keepLoading.timedesc = "上次数据同步完成时间：";
            var time = !!action.data[0] ? action.data[0].endAt : "没有同步记录";
            list.keepLoading.time = time;
            break;

        case actionConstants.OPEN_ERP_WINDOW:
            var win = action.data;
            list.winContent = win.winContent;
            list.winTital = win.winTital;
            list.winServer = win.winServer;
            list.winFooter = win.winFooter;
            list.visible = true;
            break;

        case actionConstants.CLOSE_ERP_WINDOW:
            list.winTital = null;
            list.winServer = null;
            list.winContent = [];
            list.winFooter = [];
            list.visible = false;
            break;
        case actionConstants.BT_STATUS_CHANGE:
            action.data.SaveStatus != null ? list.SaveStatus = action.data.SaveStatus : null;
            action.data.LinkStatus != null ? list.LinkStatus = action.data.LinkStatus : null;
            break;
        case actionConstants.LOADING_BT_CHANGE:
            loading = action.data ? action.data : !loading;
            break;
        case actionConstants.SYNC_APPKEY_SUCCESS:
            list.LinkStatus = action.data != null ? action.data : true;
        default:
        // no op
    }
    ErpSettingStore.emitChange();
});
module.exports = ErpSettingStore;