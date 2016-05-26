/**
 * 用于验证使用的store
 */
var Dispatcher = require('ediDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var actionConstants = require('ediConstants/constants');
var logger = require('util/logService');

var tips = {
    username: '',
    password: ''
};

var noPassValidate = {
    type: "",
    msg: "",
    erpMsgUrl:"",
    erpAppCodeUrl:"",
    appKey:""
};

var validateStore = assign({}, EventEmitter.prototype, {

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

    getTips: function () {
        logger.enter();
        return tips;
    },

    getNoPassValidate: function () {
        logger.enter();
        return noPassValidate;
    }
});

/**
 * register callback
 */

Dispatcher.register(function (action) {
    logger.enter();
    var data = action.data || "";
    switch (action.type) {

        case actionConstants.VALIDATE:
            var type = action.data.type;
            if (!validateInfoRegex[type].regExp.test(data.data)) {
                tips[type] = validateInfoRegex[type].msg;
                noPassValidate.type = type;
                noPassValidate.msg = validateInfoRegex[type].msg;
            } else {
                tips[type] = '';
                noPassValidate = {
                    type: "",
                    msg: ""
                };
            }
            break;

        case actionConstants.LOGIN_ERROR:
            noPassValidate = {
                type: "",
                msg: data
            };
            break;

        default:
            return true;
    }
    validateStore.emitChange();
    return true;
});

var validateInfoRegex = {
    'username': {
        regExp: new RegExp(/\S/),
        msg: '登录名不能为空'
    },
    'password': {
        regExp: new RegExp(/\S/),
        msg: '密码不能为空'
    },
    'erpMsgUrl': {
        regExp: new RegExp(/\S/),
        msg: '不能为空'
    },
    'erpAppCodeUrl': {
        regExp: new RegExp(/\S/),
        msg: '不能为空'
    },
    'appKey': {
        regExp: new RegExp(/^[0-9a-f]{32}$/),
        msg: '请输入32位十六进制码'
    }
};

module.exports = validateStore;