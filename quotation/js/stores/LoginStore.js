var LoginDispatcher = require('js/dispatcher/dispatcher');

var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var cookieUtil = require('util/cookieUtil');

var CHANGE_EVENT = 'change';
var _loginTips = '';
var name = '';//登陆之后的用户名字

var userInfo = {
    name: '',
    phoneNumber: '',
    email: ''
};

var LoginConstants = require('actionConstants/constants');

var logger = require('util/logService');

function setLoginTips(tips) {
    _loginTips = tips;
}

var LoginStore = assign({}, EventEmitter.prototype, {
    getLoginTips: function () {
        return _loginTips;
    },
    getUserInfo: function () {
        return {
            name: cookieUtil.getItem('name'),
            phoneNumber: cookieUtil.getItem('phoneNumber'),
            email: cookieUtil.getItem('email'),
            enterpriseId: cookieUtil.getItem('enterpriseId')
        };
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


function setCookieUserInfo(data) {
    cookieUtil.setItem('name', data.identityInfo.UserName || '');
    cookieUtil.setItem('email', data.identityInfo.EMail || '');
    cookieUtil.setItem('phoneNumber', data.identityInfo.Phone || '');
    cookieUtil.setItem('enterpriseId', data.enterpriseInfo.enterpriseId);
}

LoginDispatcher.register(function (action) {
    var text;
    switch (action.actionType) {
        case LoginConstants.TODO_LOGIN:
            text = action.tips && action.tips.trim();
            logger.dump('当前提示信息:' + text);
            if (text !== '') {
                setLoginTips(text);
            }
            break;

        case LoginConstants.LOGIN_SUCCESS:
            userInfo = action.data;
            setCookieUserInfo(action.data);
            break;

        case LoginConstants.userUpdatePwd:
            // 用户更新密码
            _loginTips = action.data.msg;
            break;

        case LoginConstants.validateUserOldPwd:
            // 验证旧密码是否正确
            _loginTips = action.data.msg;
            break;

        case LoginConstants.validateUserNewPwd:
            // 密码格式是否正确
            _loginTips = action.data.msg;
            break;

        case LoginConstants.validateUserReNewPwd:
            // 密码格式是否正确
            _loginTips = action.data.msg;
            break;

        default:
            return true;
    }
    LoginStore.emitChange();
});


module.exports = LoginStore;