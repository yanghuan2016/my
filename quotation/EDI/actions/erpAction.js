var ErpSettingDispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var validateAction = require('ediAction/validateAction');
var message = require('antd').message;

var RestService = require('util/restService');
var Url = require('edi/constantsUrl')();
var userStore = require('ediStores/userStore');

var socketIoAction = require('ediAction/socketIoAction');
var socketIoService = require('util/socketIoService');

var ErpSettingAction = {
    //生成appKey(已废弃)
    createAPPKEY: function (enterpriseId) {
        var service = new RestService(Url.createAppKeyUrl.replace(/enterpriseId/, enterpriseId));
        service.findAll(function (feedback) {
            if (feedback.status == 200)
                ErpSettingDispatcher.dispatch({
                    actionType: actionConstants.GET_APPKEY,
                    data: feedback.data.appKey
                });
            else
                message.warn(feedback.msg || "连接错误！");
        });
    },
    //测试连接
    createLink: function (enterpriseId, data) {
        var me = this;
        var service = new RestService(Url.testingErpSettingUrl.replace(/enterpriseId/, enterpriseId));
        service.post(data, function (result) {
            var feedback = result;
            var notificationParams = {};
            if (typeof result === 'string') {
                feedback = JSON.parse(result);
            }
            if (feedback.status == 201) {
                //连接中
                socketIoService.watchSocket('connectSCC-ERP', function (result) {
                    if (!result.isDone) {
                        notificationParams = {
                            type: result.errmsg ? "error" : "success",
                            message: "测试连接",
                            description: result.msg || result.errmsg,
                            duration: 2
                        };
                        socketIoAction.updateSyncData(notificationParams);
                        if (result.errmsg) {
                            socketIoService.removeSocketListener('connectSCC-ERP');
                        }
                    } else {
                        notificationParams = {
                            type: "success",
                            message: "测试连接",
                            description: "连接测试成功，请保存当前配置参数",
                            duration: 2
                        };
                        socketIoAction.updateSyncData(notificationParams);
                        me.changeBtStatus(null, false);
                        socketIoService.removeSocketListener('connectSCC-ERP');
                    }
                });
            } else {
                notificationParams = {
                    type: "error",
                    message: "测试连接",
                    description: "连接测试失败，请更改配置参数",
                    duration: null
                };
                socketIoAction.updateSyncData(notificationParams);
            }
        });
    },
    changeBtStatus: function (LinkStatus, SaveStatus) {
        ErpSettingDispatcher.dispatch({
            actionType: actionConstants.BT_STATUS_CHANGE,
            data: {
                SaveStatus: SaveStatus,
                LinkStatus: LinkStatus
            }
        });
    },
    changeBtLoading: function () {
        ErpSettingDispatcher.dispatch({
            actionType: actionConstants.LOADING_BT_CHANGE,
            data: null
        });
    },
    intervalMaker: function (enterpriseId) {
        var me = this;
        var service = new RestService(Url.getErpDataPercentUrl.replace(/enterpriseId/, enterpriseId));
        var erpProgressInterval = window.setInterval(function () {
            service.findAll(function (feedback) {
                if (feedback.data && feedback.data.syncDataStatus == "DOING") {
                } else if (feedback.data && feedback.data.syncDataStatus == "FINISHED") {
                    message.success(feedback.msg);
                    clearInterval(erpProgressInterval);

                    me.getSyncTime(enterpriseId);
                } else if (feedback.data && feedback.data.syncDataStatus == "ERROR") {
                    ErpSettingDispatcher.dispatch({
                        actionType: actionConstants.STOP_LOADING,
                        data: null
                    });
                    message.warn(feedback.msg);
                    clearInterval(erpProgressInterval);
                } else {
                    clearInterval(erpProgressInterval);
                    message.warn("连接错误！");
                }
            });
        }, 2000);
    },
    //同步
    createSync: function (enterpriseId, password) {//func是调回body处理erp百分比的函数
        var me = this;
        var temp = {};
        temp.password = $.base64.encode(password);
        var service = new RestService(Url.erpAsyncUrl.replace(/enterpriseId/, enterpriseId));
        service.post(temp, function (feedback) {
            var result = JSON.parse(feedback);
            if (result.status == 1003) {//密码错误
                ErpSettingDispatcher.dispatch({
                    actionType: actionConstants.LOADING_BT_CHANGE,
                    data: false
                });
                message.warn(result.msg);
            } else if (result.status == 200) {
                socketIoService.watchSocket('task', function (result) {
                    var notificationParams = '';
                    if (!result.isDone) {
                        notificationParams = {
                            type: "warn",
                            message: "提示",
                            description: result.msg || result.errmsg,
                            duration: 2
                        };
                        socketIoAction.updateSyncData(notificationParams);
                    }
                    else {
                        notificationParams = {
                            type: "success",
                            message: "提示",
                            description: result.msg || result.errmsg,
                            duration: 2
                        };
                        socketIoAction.updateSyncData(notificationParams);
                        socketIoService.removeSocketListener('task');
                        me.changeBtLoading();
                        me.getSyncTime(enterpriseId);
                    }
                });
                //ErpSettingDispatcher.dispatch({
                //    actionType: actionConstants.KEEP_LOADING,
                //    data: null
                //});
                //me.intervalMaker(enterpriseId, func);
                message.success(result.msg);
            } else if (result.status == 6001) {//正在同步
                //ErpSettingDispatcher.dispatch({
                //    actionType: actionConstants.KEEP_LOADING,
                //    data: null
                //});
                //me.intervalMaker(enterpriseId, func);

                ErpSettingDispatcher.dispatch({
                    actionType: actionConstants.LOADING_BT_CHANGE,
                    data: false
                });
                message.warn(result.msg);
            }
            else
                message.warn(result.msg || "连接错误！");
        });
    },
    //保存
    saveSettings: function (enterpriseId, password, data) {
        data.password = $.base64.encode(password);
        var service = new RestService(Url.erpSubmitSettingUrl.replace(/enterpriseId/, enterpriseId));
        service.post(data, function (feedback) {
            var result = JSON.parse(feedback);
            if (result.status == 1003) {//密码错误
                message.warn(result.msg);
            } else if (result.status == 200) {
                ErpSettingDispatcher.dispatch({
                    type: actionConstants.SETTINGSUCCESS,
                    data: result.data
                });
                message.success(result.msg);
            }
            else
                message.warn(feedback.msg || "连接错误！");
        });
    },
    //上一次同步时间
    getSyncTime: function (enterpriseId) {
        var service = new RestService(Url.getSyncTimeUrl.replace(/enterpriseId/, enterpriseId));
        service.findAll(function (feedback) {
            if (feedback.status == 200) {
                ErpSettingDispatcher.dispatch({
                    actionType: actionConstants.STOP_LOADING,
                    data: feedback.data
                });
            } else
                message.warn(feedback.msg || "获取上一次同步时间失败！");
        });
    },
    //同步appKey
    syncAppKey: function (enterpriseId, appKey) {
        var service = new RestService(Url.syncAppKeyUrl.replace(/enterpriseId/, enterpriseId));
        service.post({appKey: appKey}, function (feedback) {
            if (typeof feedback === 'string') {
                feedback = JSON.parse(feedback);
            }
            //feedback = {
            //    status: 200,
            //    data: {}
            //};
            if (feedback.status == 200) {
            } else if (feedback.status == 201) {
                var notificationParams = {};
                socketIoService.watchSocket("updateAppkey-ERP", function (result) {
                    if (!result.isDone) {
                        notificationParams = {
                            type: "error",
                            message: "提示",
                            description: result.errmsg,
                            duration: 2
                        };
                        socketIoAction.updateSyncData(notificationParams);
                    } else {
                        notificationParams = {
                            type: "success",
                            message: "提示",
                            description: result.msg,
                            duration: 2
                        };
                        socketIoAction.updateSyncData(notificationParams);
                        ErpSettingDispatcher.dispatch({
                            actionType: actionConstants.SYNC_APPKEY_SUCCESS,
                            data: false
                        });
                        socketIoService.removeSocketListener('updateAppkey-ERP');
                    }
                })
            } else {
                notificationParams = {
                    type: "error",
                    message: "提示",
                    description: "同步appKey失败!",
                    duration: 2
                };
                socketIoAction.updateSyncData(notificationParams);
            }
        });
    },
    sureWindow: function (key, password, data) {
        if (userStore.getEnterpriseId()) {
            var enterpriseId = userStore.getEnterpriseId();
            switch (key) {
                //确认重新生成APPKEY
                case "SURE_FOR_RELOAD":
                    this.createAPPKEY(enterpriseId);
                    break;
                //测试连接
                case "LINK_TEST":
                    this.createLink(enterpriseId, data);
                    break;
                //保存数据时输入密码
                case "SAVE_PASSWORD":
                    this.saveSettings(enterpriseId, password, data);
                    break;
                //同步数据时输入密码
                case "SYNC_PASSWORD":
                    this.createSync(enterpriseId, password);
                    break;
                //同步中
                case "SYNC_DOING":
                    break;
                //同步中
                case "SYNC_APPKEY":
                    this.syncAppKey(enterpriseId, data.appKey);
                    break;
                default:
            }
            ErpSettingDispatcher.dispatch({
                actionType: actionConstants.CLOSE_ERP_WINDOW,
                data: null
            });
        }
    }
};
/*var intervalMaker = function () {
 var service = new RestService(Url.getErpDataPercentUrl.replace(/enterpriseId/, enterpriseId));
 var erpProgressInterval = window.setInterval(function () {
 service.findAll(function (feedback) {
 if (feedback.status != 200) {
 message.warn(feedback.msg);
 } else
 message.success(feedback.msg);
 });
 }, 2000);
 };*/
module.exports = ErpSettingAction;