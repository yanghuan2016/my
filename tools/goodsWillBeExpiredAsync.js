__report_path = "static/reports";
__base = process.cwd();
__logService = require(__base + "/services/logService");
__node_modules_path = __base + "/node_modules";
__modules_path = __base + "/modules";
__services_path = __base + "/services";
__db_service_path = __services_path + "/database";
__db_schema_path = __base + "/db";


__redis = require('redis');
var path = require('path');
var async = require('async');
var sprintf = require("sprintf-js").sprintf;
var underscore = require(__base + "/node_modules/underscore");
var mysql = require('mysql');
var logger = __logService;

var sysconf = replaceSysConfWithEnvars(require(__base + '/config/sysconfig.json'));
function replaceSysConfWithEnvars(sysconf) {

    if (!underscore.isUndefined(process.env.SCC_DB_HOST)) {
        sysconf.db.host = process.env.SCC_DB_HOST;
    }
    if (!underscore.isUndefined(process.env.SCC_DB_USER)) {
        sysconf.db.user = process.env.SCC_DB_USER;
    }
    if (!underscore.isUndefined(process.env.SCC_DB_PASSWORD)) {

    }
    sysconf.db.password = process.env.SCC_DB_PASSWORD;
    if (!underscore.isUndefined(process.env.SCC_CLOUDDB)) {
        sysconf.cloudDBName = process.env.SCC_CLOUDDB;
    }
    if (!underscore.isUndefined(process.env.SCC_CUSTOMERDB_PREFIX)) {
        sysconf.customerDBPrefix = process.env.SCC_CUSTOMERDB_PREFIX;
    }
    if (!underscore.isUndefined(process.env.SCC_REDIS_HOST)) {
        sysconf.redis.host = process.env.SCC_REDIS_HOST;
    }

    return sysconf;
}
__logLevel = sysconf.logLevel;
__isErpMsgCheckStrict = sysconf.isErpMsgCheckStrict;
__erpApiVersion = sysconf.erpApiVersion;
__cloudURL = sysconf.cloudURL;
__customerDBPrefix = sysconf.customerDBPrefix;
__cloudDBName = sysconf.cloudDBName;
__sessionSecret = sysconf.sessionSecret;
__sessionTTL = sysconf.sessionTTL;
__goodsTopDays = sysconf.goodsTopBuyDays;
__dbConfig = sysconf.db;
__redisConfig = sysconf.redis;
__cacheConfig = sysconf.cache;
__newsMaxCounts = sysconf.indexNewsCounts;
__smsConfig = sysconf.sms;
__securityConfig = sysconf.security;
__mqConfig = sysconf.mq;
__queues = {OfflineTask: __mqConfig.OfflineTaskPrefix + "_" + process.env.USER};

__cacheService = require(__services_path + "/cacheService")();
__dbService = require(__services_path + "/dbService")();
__dataService = require(__services_path + "/dataService")();
__mqService = require(__services_path + "/mqService")();
__worker_path = __base + "/worker";

try {
    __version = require(__base + "/config/version.json");
} catch (e) {
    __version = {
        version: "",
        revision: "",
        time: ""
    };
}

//init mysql connection pool
__mysql = mysql.createPool(__dbConfig);
var dbService = __dbService;

//init redisClient & redisService
var redisClient = __redis.createClient(__redisConfig.port, __redisConfig.host);
if (__redisConfig.password) {
    redisClient.auth(__redisConfig.password);
}
redisClient.select(__redisConfig.dbNum);
__redisClient = redisClient;

var ErpAppCodeRobot = require(__modules_path + path.sep + 'erpAppCodeRobot');
var erpAppCodeRobot = new ErpAppCodeRobot(__cloudDBName, dbService, redisClient);
var ApiRobot = require(__base + "/modules/apiRobot");
var cloudDbName = __cloudDBName;
var isErpMsgCheckStrict = __isErpMsgCheckStrict;
var erpApiVersion = __erpApiVersion;


var enterpriseId = 3;
var msgType = 'REQUEST_GOODS_WILL_BE_EXPIRED_TO_SELLER';
var expirationDate = 3;
var customerDbName = null;
var msgData = {
    expirationDate: expirationDate
};

var apiRobot = new ApiRobot(cloudDbName, dbService, redisClient, isErpMsgCheckStrict, erpApiVersion);
apiRobot.sendMsg(enterpriseId, msgType, msgData, function sendMsgCallback(error, feedback) {
    if (error) {
        return logger.error(error);
    }
    var goods = JSON.parse(feedback.data).PHK;
    customerDbNameRetrieve(enterpriseId, cloudDbName, function (error, name) {
        if (error) {
            return logger.error(error);
        }
        logger.trace(name);
        customerDbName = name;
        saveGoodsWillExpired(customerDbName, goods, function (error, result) {
            if (error) {
                return logger.error(error);
            }
            console.log(result);
            process.exit(1);
        });
    });

});

function saveGoodsWillExpired(customerDbName, goods, callback) {
    logger.enter();
    var sql = "insert into %s.GoodsWillBeExpired(" +
        "   goodsNo , " +
        "   batchNo , " +
        "   licenseNo , " +
        "   amount ," +
        "   goodsProduceDate ," +
        "   goodsValidDate " +
        ") values ? " +
        "on duplicate key update" +
        "   amount = values(amount);";
    sql = sprintf(sql, customerDbName);
    logger.sql(sql);
    //goods = [{
    //    HH: '103532',               // 货号
    //    PH: '15031001',             // 批号
    //    XQ: '2016-03-09T00:00:00',  // 有效期
    //    SCRQ: null,                 // 生产日期
    //    SL: 0,                      // 数量
    //    PZWH: '国药准字H20013024'     // 批准文号
    //}];
    goods = underscore(goods).map(function (item) {
        var temp = [];
        temp.push(item.HH);
        temp.push(item.PH);
        temp.push(item.PZWH);
        temp.push(item.SL);
        temp.push(item.SCRQ);
        temp.push(item.XQ);
        return temp;
    });
    __mysql.query(sql, [goods], function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, result);
    });
}
function customerDbNameRetrieve(enterpriseId, cloudDBName, callback) {
    logger.enter();
    var LIST_CUSTOMER_SUFFIX = " SELECT customerDBSuffix FROM %s.Customer WHERE id = %d;";
    var sql = sprintf(LIST_CUSTOMER_SUFFIX, cloudDBName, enterpriseId);
    __mysql.query(sql, function (eror, result) {
        if (eror) {
            logger.error(eror);
            return callback(eror);
        }
        var customerDBName = __customerDBPrefix + "_" + result[0].customerDBSuffix;
        callback(null, customerDBName);
    });
}
