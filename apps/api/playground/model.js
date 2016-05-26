var logger = __logService;
var db = __dbService;
var redisCli = __redisClient;
var RedisKeys = __cacheService.CacheKeys;

var underscore = require('underscore');
var md5 = require('js-md5');

var Md5Calibrator = require(__base +"/modules/md5Calibrator");
var md5Calibrator = new Md5Calibrator(md5);

var MsgRobot = require(__base + "/modules/msgRobot");
var msgRobot = new MsgRobot(md5Calibrator);

var redis_TTL_AppCode = 600;

function PlaygroundModel() {
}

PlaygroundModel.prototype.retrieveClientAppCode = function (clientId, callback) {
    var key = "ERP.appCode." + clientId;

    redisCli.get(key, function(error, result){
        if (error) {
            logger.error(error);
            callback(error);
        } else {
            callback(null, result);
        }
    });
};


module.exports = PlaygroundModel;

