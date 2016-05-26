/**
 * userAction
 */
var Dispatcher = require('dispatcher');
var Action = require('util/action');
var logger = require('util/logService');

var RestService = require('util/restService');
var url = require('base/url')();
//引入history,用于跳转页面
var history = require('base/history.js');
var constants = require('base/constants.js');
var cookie = require('util/cookieUtil');
require('plugin/jquery.base64.min.js');

var userAction = {
    //用户登录
    Login: function (data) {
        var service = new RestService(url.authenticationUrl);
        var msg = validate(data);
        if (msg) {
            Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, msg));
        } else {
            service.post(data, function (feedback) {
                try {
                    feedback = JSON.parse(feedback);
                } catch (e) {
                    logger.error(e);
                }
                if (feedback.status == '200') {
                    cookie.setItem('token', feedback.data.token);
                    Dispatcher.dispatch(new Action(constants.LOGIN_SUCCESS, feedback.data.doctorInfo));
                    history.pushState(null, '/home');
                } else {
                    Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, "出错了,请重试"));
                }
            });
        }
    },

    //清除用户提示信息
    clearMsg: function () {
        Dispatcher.dispatch(new Action(constants.CLEAR_MSG, ''));
    },

    //点击退出
    Logout: function (id) {
        var service = new RestService(url.authenticationUrl);
        service.remove(id, function () {
            cookie.clearCookie();
            history.pushState(null, '/login');
        });
    }
};


//验证
var validate = function (data) {
    var keys = _.keys(data);
    for (var item = 0; item < keys.length; item++) {
        var temp = keys[item];
        if (!validateRegex[temp].regExp.test(data[temp])) {
            return validateRegex[temp].msg;
        }
    }
    return "";
};

var validateRegex = {
    'username': {
        regExp: new RegExp(/\S/),
        msg: '请输入用户名'
    },
    'password': {
        regExp: new RegExp(/\S/),
        msg: '请输入密码'
    }
};

module.exports = userAction;