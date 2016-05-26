/**
 * 用户信息　store
 */
var Dispatcher = require('dispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var constants = require('base/constants.js');
var logger = require('util/logService');
var cookie = require('util/cookieUtil');
/* tips 用来显示每个页面出错的信息 */
var tips = "";

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

    getUserName: function () {
        return JSON.parse(cookie.getItem('userInfo')) ? JSON.parse(cookie.getItem('userInfo')).username : '';
    },

    getDoctorId: function () {
        return JSON.parse(cookie.getItem('userInfo')) ? JSON.parse(cookie.getItem('userInfo')).doctorId : '';
    },

    getDiagnosisId: function () {
        return cookie.getItem('diagnosisId');
    },

    /*　获取页面出错的信息提示　*/
    getErrorMsg: function () {
        return tips;
    }
});

/**
 * register callback
 */

Dispatcher.register(function (action) {
    logger.enter();
    var data = action.data;
    switch (action.type) {

        /*　登录成功　*/
        case constants.LOGIN_SUCCESS:
            cookie.setItem('userInfo', JSON.stringify(data));
            tips = "";
            break;

        /*　验证没通过　*/
        case constants.VALIDATE_ERROR:
            tips = data;
            break;

        /* 清空消息提示　*/
        case constants.CLEAR_MSG:
            tips = "";
            break;

        default:
            return true;
    }
    userStore.emitChange();
    return true;
});

module.exports = userStore;