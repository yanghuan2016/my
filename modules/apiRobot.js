var superAgent = require('superagent');
var _ = require("lodash");
var md5 = require('js-md5');
var logger = __logService;
var cacheService = __cacheService;


var Md5Calibrator = require(__base + "/modules/md5Calibrator");
var MsgRobot = require(__base + "/modules/msgRobot");
var AppCodeRobot = require(__base + "/modules/erpAppCodeRobot");


function ApiRobot(cloudDbName, dbService, redisConn, strict, version) {
    this.cloudDbName = cloudDbName;
    this.dbService = dbService;
    this.redisConn = redisConn;
    this.strict = strict;
    this.version = version;
}

ApiRobot.prototype.send = function (erpMsgUrl, msg, callback) {
    logger.enter();
    logger.trace('SCC will Send msg :(' + erpMsgUrl + ')' + JSON.stringify(msg));
    superAgent
        .post(erpMsgUrl)
        .send({msg: JSON.stringify(msg)})
        .set('Accept', 'application/json')
        .end(function superAgentCallback(error, res) {
            if(error){
                logger.error(error);
                callback(error);
            }else{
                if (res.ok) {
                    logger.trace('发送消息的返回值:'+ res.text.length > 20000 ? res.text.substr(0,20000) + '......' : res.text);
                    var data = JSON.parse(res.text);
                    logger.trace('after send msg, feedback:'+ JSON.stringify(data).length > 20000 ? JSON.stringify(data).substr(0,20000) + '......' : data);
                    return callback(null, data);
                }
            }
        });
};

 ApiRobot.prototype.sendMsg = function () {
     // argument1: enterpriseId
     // argument2: msgType
     // argument3: msgData
     // argument4: erpMsgInMsgId  可选
     // argument5: callback
    logger.enter();

    var enterpriseId = arguments[0];
    var msgType = arguments[1];
    var msgData = arguments[2];
    var erpMsgInMsgId = "";
    if (typeof arguments[3] !== 'function') {
        erpMsgInMsgId = arguments[3];
    }
    var callback = arguments[arguments.length - 1];

    var self = this;
    var cloudDbName = this.cloudDbName;
    var dbService = this.dbService;
    var redis = this.redisConn;
    var strict = this.strict;
    var version = this.version;

    var customerDbName = null;
    var customerDBSuffix = null;
    var enterpriseType = null;
    var erpAppCodeUrl = null;
    var erpMsgUrl = null;
    var appKey = null;
    var msg = null;
    if(enterpriseId == "undefined"){
        callback("没有传入enterpriseId");
    }
    // 去数据库拿到 user 的 erpMsgUrl, erpAppCodUrl, appKey
    dbService.retrieveUserErpInfo(cloudDbName, enterpriseId, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        if (result && result[0]) {
            customerDBSuffix = result[0].customerDBSuffix || undefined;
            enterpriseType = result[0].enterpriseType || undefined;
            customerDbName = __customerDBPrefix + "_" + customerDBSuffix;
        } else {
            return callback(new Error("该客户（商户）没有数据.企业号:" + enterpriseId));
        }

        cacheService.getErpConfig(enterpriseId, cloudDbName, function (error, result) {
            if (error) {
                logger.error(error);
                callback(error);
            }

            try {
                var config = JSON.parse(result);
                appKey = config.appKey;
                erpAppCodeUrl = config.erpAppCodeUrl;
                erpMsgUrl = config.erpMsgUrl;
                logger.debug("API ROBOT GET appkey = "+appKey);
            } catch (error) {
                logger.error(error);
                return callback(error);
            }
            
            logger.debug(cloudDbName);
            logger.debug(enterpriseId);
            // 去数据库或者Erp拿到appCode //不确定性较大,此处可能失败
            var appCodeRobot = new AppCodeRobot(cloudDbName, dbService, redis);
            appCodeRobot.getAppCode(enterpriseId, function getAppCodeCallback(error, appCode) {
                logger.enter();

                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                var md5Calibrator = new Md5Calibrator(md5);
                var msgRobot = new MsgRobot(md5Calibrator, strict);
                msg = msgRobot.generateMsg(version, enterpriseId, msgType, appCode, msgData);
                // 将msg对象写入数据库,由 worker来执行发送, 重发等操作.
                var enterpriseInfo = {
                    enterpriseId: enterpriseId,
                    enterpriseType: enterpriseType,
                    erpMsgUrl: erpMsgUrl,
                    erpAppCodeUrl: erpAppCodeUrl,
                    appKey: appKey
                };
                self.saveMsg(customerDbName, msg, enterpriseInfo, erpMsgInMsgId, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }
                    // 将msg对象发送出去
                    self.send(erpMsgUrl, msg, function sendCallback(error, feedback) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }
                        self.saveMsgFeedback(customerDbName, msg.msgId, feedback, function (error, result) {
                            if (error) {
                                logger.error(error);
                                return callback(error);
                            }
                            return callback(null, feedback);
                        });
                    });
                });
            });
        });
    });
};

ApiRobot.prototype.saveMsgFeedback = function (customerDbName, msgId, feedback, callback) {
    logger.enter();
    var dbService = this.dbService;
    var erpFeedbackStatus = 1014;
    var erpFeedback = JSON.stringify(feedback).replace(/'/g,"@@@");
    if (feedback) {
        erpFeedbackStatus = Number(feedback.status);
    }
    if (erpFeedback.length > 10000) {
        erpFeedback = erpFeedback.substr(0, 10000);
    }
    erpFeedback = erpFeedback.replace(/'/g, "@@@");

    while(erpFeedback.substr(-1) === '\\') {
        erpFeedback = erpFeedback.substr(0, erpFeedback.length - 1);
    }
    dbService.updateErpMsgOutByMsgId(customerDbName, msgId, erpFeedback, erpFeedbackStatus, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, result);
    });
};

ApiRobot.prototype.saveMsg = function(customerDbName, msg, enterpriseInfo, erpMsgInMsgId, callback) {
    var dbService = this.dbService;
    try {
        var erpMsgOutInfo = {
            version: msg.version,
            msgId: msg.msgId,
            isEDIMsg: Number(/^EDI/.test(msg.msgType)),
            erpMsgInMsgId: erpMsgInMsgId,
            msgType: msg.msgType,
            msgData: JSON.stringify(msg.msgData),
            enterpriseId: enterpriseInfo.enterpriseId,
            enterpriseType: enterpriseInfo.enterpriseType,
            erpMsgUrl: enterpriseInfo.erpMsgUrl,
            erpAppCodeUrl: enterpriseInfo.erpAppCodeUrl,
            appKey: enterpriseInfo.appKey
        };
    } catch (e) {
        logger.error(error);
        callback(e)
    }
    dbService.insertErpMsgOut(customerDbName, erpMsgOutInfo, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, result);
    });
};

module.exports = ApiRobot;