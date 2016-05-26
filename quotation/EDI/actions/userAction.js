/**
 * userAction
 */
var Dispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');

var RestService = require('util/restService');
var Url = require('edi/constantsUrl')();
//引入history,用于跳转页面
var history = require('js/history');
var cookie = require('util/cookieUtil');
var socketIoAction = require('ediAction/socketIoAction');
var socketIoService = require('util/socketIoService');
var _ = require("lodash");


module.exports = {
    //用户登录
    Login: function (data) {
        Dispatcher.dispatch(new Action(actionConstants.INITIAL_DB_CLEAR));
        var service = new RestService(Url.loginUrl);
        var msg = validate(data);
        if (msg) {
            Dispatcher.dispatch(new Action(actionConstants.LOGIN_ERROR, msg));
        } else {
            var info = {
                username: data.username,
                password: $.base64.encode(data.password)
            };
            service.post(info, function (feedback) {
                try {
                    var result = JSON.parse(feedback);
                    var enterpriseInfo = result.data['enterpriseInfo'];
                    if (result.status == '200') {
                        cookie.setItem('token', result.data['access-token']);
                        cookie.setItem('enterpriseType', 'BUYER');
                        cookie.setItem('needInitDB', result.data['needInitDB'] ? 'true' : 'false');
                        cookie.setItem('erpModalVisible', _.isEmpty(enterpriseInfo.appKey) ||
                            _.isEmpty(enterpriseInfo.erpMsgUrl) ||
                            _.isEmpty(enterpriseInfo.erpAppCodeUrl));
                        cookie.setItem('enterpriseInfo', JSON.stringify(enterpriseInfo) || '');
                        cookie.setItem('identityInfo', JSON.stringify(result.data['identityInfo']) || '');
                        history.pushState(null, '/buyer/home');
                        cookie.setItem('leftActive', '/buyer/home');
                    } else {
                        cookie.clearCookie();
                        Dispatcher.dispatch(new Action(actionConstants.LOGIN_ERROR, result.msg));
                    }
                } catch (err) {
                    cookie.clearCookie();
                    Dispatcher.dispatch(new Action(actionConstants.LOGIN_ERROR, '连接服务器失败，请检查网络'));
                }
            });
        }
    },

    //用户初始化数据库
    initDb: function (url) {
        //test data
        var service = new RestService(url);
        service.post({}, function (feedback) {
            try {
                var result = JSON.parse(feedback);
                if (result.status == '200') {
                    socketIoService.watchSocket('task', function (result) {
                        logger.ndump('监听到的任务task的结果是: ', result);
                        if (result.isDone == true && result.taskProgress == 100) {
                            cookie.setItem('enterpriseInfo', JSON.stringify(result.enterpriseInfo));
                        }
                        socketIoAction.updatePercent(result);
                    });
                }
                Dispatcher.dispatch(new Action(actionConstants.INIT_DB, result));
            } catch (err) {
                alert('出错了');
                Dispatcher.dispatch(new Action(actionConstants.INITIAL_DB_CLEAR));
            }
        });
    },

    //点击退出
    Logout: function () {
        var service = new RestService(Url.logoutUrl);
        service.remove("", function () {
            cookie.clearCookie();
            history.pushState(null, '/login');
        });
    },

    //获取我的客户列表
    getClientList: function (enterpriseId, filter) {
        var url = Url.getClientListUrl.replace(/enterpriseId/, enterpriseId);
        url += '?page=' + filter.page + '&status=' + filter.status + '&keyWords=' + filter.keyWords;
        var service = new RestService(url);
        service.findAll(function (feedback) {
            logger.trace();
            if (feedback.status == '200') {
                Dispatcher.dispatch(new Action(actionConstants.GET_CLIENT_LIST_SUCCESS, feedback.data.clients));
            } else {
                Dispatcher.dispatch(new Action(actionConstants.CHANGE_MSG, "出错了，请重刷"));
            }
        })
    },

    //获取我的供应商列表
    getSupplierList: function (enterpriseId, filter) {
        var url = Url.getSupplierListUrl.replace(/enterpriseId/, enterpriseId);
        url += '?page=' + filter.page + '&status=' + filter.status + '&keyWords=' + filter.keyWords;
        var service = new RestService(url);
        service.findAll(function (feedback) {
            //test data
            if (feedback.status == '200') {
                Dispatcher.dispatch(new Action(actionConstants.GET_SUPPLIER_LIST_SUCCESS, feedback.data.suppliers));
            } else {
                Dispatcher.dispatch(new Action(actionConstants.CHANGE_MSG, "出错了，请重刷"));
            }
        })
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