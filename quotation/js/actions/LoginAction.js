var LoginDispatcher = require('js/dispatcher/dispatcher');
var SysConstants = require('js/Sysconfig.js');
var RestService = require('util/restService');
var assign = require('object-assign');

var LoginConstants = require('actionConstants/constants');

var logger = require('util/logService');
var base64 = require('plugin/jquery.base64.min.js');

var history = require('js/history');
var cookieUtil = require('util/cookieUtil');
var Action = require('util/action');

var validate = require('util/validate');

var LoginAction = {
    logIn: function (data) {
        var validateResult = validate.validateUserNameAndPwd(data);
        if (validateResult) {
            LoginDispatcher.dispatch({
                actionType: LoginConstants.TODO_LOGIN,
                tips: validateResult
            });
            return;
        }
        data.password = $.base64.encode(data.password);
        var _ajax = new RestService(SysConstants.login.loginInUrl);
        _ajax.post(data, function (feedback) {
            try {
                feedback = JSON.parse(feedback);
                if (feedback.status == 200) {
                    logger.dump('登陆成功');
                    if(feedback.data.needInitDB){
                        LoginDispatcher.dispatch({
                            actionType: LoginConstants.TODO_LOGIN,
                            tips: '请先在电脑端进行数据初始化'
                        });
                        return;
                    }
                    cookieUtil.setItem('token', feedback.data['access-token']);
                    LoginDispatcher.dispatch({
                        actionType: LoginConstants.LOGIN_SUCCESS,
                        data: feedback.data
                    });
                    history.pushState(null, '/Info');
                } else {
                    cookieUtil.clearCookie();
                    LoginDispatcher.dispatch({
                        actionType: LoginConstants.TODO_LOGIN,
                        tips: feedback.msg
                    });
                }
            } catch (err) {
                console.log(err);
                logger.error(JSON.stringify(err));
            }
        });
    },
    validateUserNameAndPwd: function (data) {
        logger.dump('进入了验证页面');
        var feedback;
        if (data.username.trim() == '') {
            feedback = '请输入用户名';
        } else if (data.password.trim() == '') {
            feedback = '请输入密码';
        }
        return feedback;
    },
    validateUserOldPwd: function (value) {
        var _ajax = new RestService(SysConstants.login.validateUserPwd);

        _ajax.post({pwd: value}, function (feedback) {
            logger.ndump("feedback", feedback);
            LoginDispatcher.dispatch({
                actionType: LoginConstants.validateUserOldPwd,
                data: feedback
            });
        });
    },
    validateUserNewPwd: function (value) {
        //验证新密码格式是否正确
        LoginDispatcher.dispatch({
            actionType: LoginConstants.validateUserNewPwd,
            data: feedback
        });
    },
    validateUserReNewPwd: function (newPwd, value) {
        //验证跟上一个输入的密码是否一致
        var feedback = {
            msg: "本次输入的密码跟之前的密码不一样"
        };
        LoginDispatcher.dispatch({
            actionType: LoginConstants.validateUserReNewPwd,
            data: feedback
        });

    },
    userUpdatePwd: function (value) {
        var _ajax = new RestService(SysConstants.login.updatePwd);
        _ajax.post({pwd: value}, function (feedback) {
            logger.error();
            logger.ndump("feedback", feedback);

            LoginDispatcher.dispatch({
                actionType: LoginConstants.userUpdatePwd,
                data: feedback
            });
        });

    },
    updateName: function (name) {
        var _ajax = new RestService(SysConstants.login.updateName);
        var isValid = validate.validateIsNULLOrEMPTY(name);
        if (!isValid) {
            alert('用户名不能为空');
            return false;
        }
        _ajax.post({name: name}, function (feedback) {
            LoginDispatcher.dispatch({
                actionType: LoginConstants.userUpdateName,
                data: feedback
            });
        });
    },
    updateIdCard: function (idCard) {
        var _ajax = new RestService(SysConstants.login.updateIdCard);
        var isEMPTY = validate.validateIsNULLOrEMPTY(idCard);
        if (!isEMPTY) {
            alert('身份证号不能为空');
            return false;
        }
        var isValidIDCard = validate.validateIDCard(idCard);
        if (!isValidIDCard) {
            alert('身份证号码格式不对');
            return false;
        }
        _ajax.post({idCard: idCard}, function (feedback) {
            logger.error();
            feedback = {
                idCard: idCard,
                status: 200,
                msg: "身份证号码已更新"
            };
            LoginDispatcher.dispatch({
                actionType: LoginConstants.updateIdCard,
                data: feedback
            });
        });
    },
    updatePhoneNumber: function (phoneNumber) {
        var _ajax = new RestService(SysConstants.login.updatePhoneNumber);
        var isEMPTY = validate.validateIsNULLOrEMPTY(phoneNumber);
        if (!isEMPTY) {
            alert('电话号码不为空');
            return false;
        }
        var isValidPhone = validate.validatePhoneNum(phoneNumber);
        if (!isValidPhone) {
            alert('电话号码格式不正确');
            return false;
        }
        _ajax.post({phoneNumber: phoneNumber}, function (feedback) {
            logger.error();
            feedback = {
                phoneNumber: phoneNumber,
                status: 200,
                msg: "电话号码已更新"
            };
            LoginDispatcher.dispatch({
                actionType: LoginConstants.updatePhoneNumber,
                data: feedback
            });
        });
    },
    updateEmail: function (email) {
        var _ajax = new RestService(SysConstants.login.updateEmail);
        var isEMPTY = validate.validateIsNULLOrEMPTY(email);
        if (!isEMPTY) {
            alert('邮箱不能为空');
            return false;
        }
        var isValid = validate.validateEmail(email);
        if (!isValid) {
            alert('邮箱格式不正确');
            return false;
        }
        _ajax.post({email: email}, function (feedback) {
            logger.error();
            feedback = {
                email: email,
                status: 200,
                msg: "邮箱已更新"
            };
            LoginDispatcher.dispatch({
                actionType: LoginConstants.updateEmail,
                data: feedback
            });
        });
    }
};
module.exports = LoginAction;
