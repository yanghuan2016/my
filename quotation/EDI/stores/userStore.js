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

var feedback = {
    status: '',
    errcode: 'fail',
    msg: '此操作将初始化您的数据库，建议由IT部门经理执行，现在去初始化数据库?'
};

var notificationParams = {
    message: '提示',
    description: "",
    type: "success",
    duration: 2,
    doing: false
};

var percent = 0;
var erpModal = false;
var description = "";

var socketIoService = require('util/socketIoService');

var userStore = assign({}, EventEmitter.prototype, {

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

    getFeedback: function () {
        return feedback;
    },

    getInitDBPercent: function () {
        return percent;
    },

    getSyncData: function () {
        if (notificationParams.doing) {
            notificationParams.doing = false;
            return notificationParams;
        }
        else {
            return null;
        }
    },

    getErpModal: function () {
        return erpModal;
    },

    getInitDBVisible: function () {
        return cookie.getItem('needInitDB') == 'true';
    },

    getErpVisible: function () {
        return cookie.getItem('needInitDB') != 'true' && cookie.getItem('erpModalVisible') == 'true';
    },

    getEnterpriseInfo: function () {
        return JSON.parse(cookie.getItem('enterpriseInfo')) ? JSON.parse(cookie.getItem('enterpriseInfo')) : {};
    },

    getEnterpriseId: function () {
        return JSON.parse(cookie.getItem('enterpriseInfo')).enterpriseId ? JSON.parse(cookie.getItem('enterpriseInfo')).enterpriseId : '';
    },

    getIdentityInfoAdmin: function () {
        return JSON.parse(cookie.getItem('identityInfo')).isAdmin ? JSON.parse(cookie.getItem('identityInfo')).isAdmin : false;
    },

    getEnterpriseType: function () {
        return cookie.getItem('enterpriseType') && cookie.getItem('enterpriseType').toLowerCase();
    }

});

/**
 * register callback
 */

Dispatcher.register(function (action) {
    logger.enter();
    var data = action.data;
    switch (action.type) {

        case actionConstants.INITIAL_DB_CLEAR:
            feedback = {
                status: '',
                errcode: 'fail',
                msg: '此操作将初始化您的数据库，建议由IT部门经理执行，现在去初始化数据库?'
            };
            break;

        case actionConstants.INIT_DB:
            feedback = data;
            feedback.errcode = "";
            break;

        case actionConstants.SETTINGSUCCESS:
            var info = cookie.getItem('enterpriseInfo') ? JSON.parse(cookie.getItem('enterpriseInfo')) : {};
            if (info) {
                info.erpMsgUrl = data.erpConfig.erpMsgUrl;
                info.erpAppCodeUrl = data.erpConfig.erpAppCodeUrl;
                info.appKey = data.erpConfig.appKey;
            }
            cookie.setItem('enterpriseInfo', JSON.stringify(info));
            cookie.setItem('erpModalVisible', 'false');
            break;

        case actionConstants.UPDATE_PERCENT:
            logger.debug('获取新的百分比');
            if (data.errmsg && data.errcode) {
                feedback.msg = data.errmsg;
                feedback.errcode = data.errcode;
            } else {
                percent = data.taskProgress;
                feedback.msg = '正在初始化数据库';
                feedback.errcode = data.errcode;
                description = data.description;
                if (percent == 100) {
                    erpModal = data.enterpriseInfo.hasValidErpSetting;
                    socketIoService.removeSocketListener('task');
                }
            }
            break;

        case actionConstants.SET_NOTIFICATION:
            logger.debug('notification统一管理');
            notificationParams = data;
            notificationParams.doing = true;
            break;

        case actionConstants.DISPLAY_ERPMODAL:
            cookie.setItem('erpModalVisible', 'true');
            break;

        default:
            return true;
    }
    userStore.emitChange();
    return true;
});

module.exports = userStore;