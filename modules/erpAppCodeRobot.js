// 第三方模块
var superAgent = require('superagent');

// 环境变量
var logger = __logService;
var Md5Calibrator = require(__base +"/modules/md5Calibrator");
var MsgRobot = require(__base + "/modules/msgRobot");
var crypto = require("crypto");
var md5 = require('js-md5');


var md5Calibrator = new Md5Calibrator(md5);
var msgRobot = new MsgRobot(md5Calibrator);
var cacheService = __cacheService;

// 构造器
function ErpAppCodeRobot(cloudDb, dbService, redisService) {
    this.cloudDb = cloudDb;
    this.dbService = dbService;
    this.redisService = redisService;
}

ErpAppCodeRobot.prototype.getAppCode = function (enterpriseId, callback) {
    logger.enter();

    var redisService = this.redisService;
    var cloudDbService = this.dbService;
    var cloudDb = this.cloudDb;

    // 向redis查询appCode.
    retrieveMsgOutAppCodeFromRedis(redisService, enterpriseId, function retrieveAppCodeFromRedis(error, appCode) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        // 如果拿到正确的appCode
        if (typeof appCode === 'string') {
            logger.debug("redis appcode ="+appCode);
            return callback(null, appCode);
        }
        
        cacheService.getErpConfig(enterpriseId, cloudDb, function (error, result) {
            if (error) {
                logger.error(error);
                callback(error);
            }
            logger.debug("erpAppCodeRobot getErpConfig"+JSON.stringify(result));
            try {
                var config = JSON.parse(result);
                var appKey = config.appKey;
                var erpAppCodeUrl = config.erpAppCodeUrl;
            } catch (error) {
                logger.error(error);
                return callback(error);
            }
            
            // 再向ERP请求appCode
            applyAppCodeFromErp(enterpriseId, appKey, erpAppCodeUrl, function applyAppCodeFromErp(error, appCode, ttl) {
                logger.debug("enter applyAppCodeFromErp");
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                var redisKey = "ERP.appCode.msgOut." + enterpriseId;
                logger.info("erpAppCodeRobot 向redis写入appCode:", redisKey, appCode, ttl);
                redisService.set(redisKey, appCode);
                redisService.expire(redisKey, Math.floor(ttl * .8));
                callback(null, appCode, ttl);
            });
        });
    })
};

var retrieveMsgOutAppCodeFromRedis = function (redis, userId, callback) {
    logger.enter();

    var key = "ERP.appCode.msgOut." + userId;

    redis.get(key, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, result);
    });
};

var applyAppCodeFromErp = function (enterpriseId, appKey, erpAppCodeUrl, callback) {
    logger.enter();

    var data = {
        enterpriseId: enterpriseId,
        appKey: appKey
    };

    logger.trace("appKey:" + appKey + "erpAppCodeUrl: " + erpAppCodeUrl);
    logger.ndump('请求appCode:', data);
    superAgent
        .post(erpAppCodeUrl)
        .send(data)
        .set('Accept', 'application/json')
        .end(function superAgentCallback(error, res) {
            if (res === undefined) {
                return callback(new Error('请求AppCode:发送请求后没有收到相应. ' + enterpriseId + ":" + appKey + ":" + erpAppCodeUrl));
            }
            if (res.ok) {
                try {
                    var feedback = JSON.parse(res.text);
                    if (feedback.status == 200) {
                        logger.ndump('请求appcode的返回值:', feedback);
                        return callback(null, feedback.data.appCode, feedback.data.ttl);
                    } else {
                        logger.trace('请求appCode 失败:' + JSON.stringify(feedback));
                        return callback(new Error(feedback.msg));
                    }
                } catch (error) {
                    return callback(error);
                }
            }
            logger.error(error);
            callback(error);
        });
};

ErpAppCodeRobot.prototype.generateMsgInAppCode = function (enterpriseId, appKey, ttl) {
    logger.enter();
    
    var md5Calibrator = new Md5Calibrator(md5);
    var appCode = md5Calibrator.calculateMd5ChecksumWithTime(appKey);
    //将生成的appCode写进redis.
    var redisKey = "ERP.appCode.msgIn." + enterpriseId;
    this.redisService.set(redisKey, appCode);
    this.redisService.expire(redisKey, ttl);
    
    return appCode;
};

module.exports = ErpAppCodeRobot;