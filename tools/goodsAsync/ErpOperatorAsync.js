var logger = require("../../services/logService");
var underscore = require("underscore");

global.__logService = logger;
global.__base = __dirname.split('tools')[0];
global.__node_modules_path = __base + "node_modules";
global.__modules_path = __base + "modules";
global.__services_path = __base + "services";
global.__db_service_path = __services_path + "/database";
global.__db_schema_path = __base + "db";
global.__report_path = "static/reports";

var sysconf = replaceSysConfWithEnvars(require(__base + '/config/sysconfig.json'));

function replaceSysConfWithEnvars(sysconf) {
    if (!underscore.isUndefined(process.env.SCC_DB_HOST)) sysconf.db.host = process.env.SCC_DB_HOST;
    if (!underscore.isUndefined(process.env.SCC_DB_USER)) sysconf.db.user = process.env.SCC_DB_USER;
    if (!underscore.isUndefined(process.env.SCC_DB_PASSWORD)) sysconf.db.password = process.env.SCC_DB_PASSWORD;
    if (!underscore.isUndefined(process.env.SCC_CLOUDDB)) sysconf.cloudDBName = process.env.SCC_CLOUDDB;
    if (!underscore.isUndefined(process.env.SCC_CUSTOMERDB_PREFIX)) {
        sysconf.customerDBPrefix = process.env.SCC_CUSTOMERDB_PREFIX;
    }
    if (!underscore.isUndefined(process.env.SCC_REDIS_HOST)) {
        sysconf.redis.host = process.env.SCC_REDIS_HOST;
    }
    logger.ndump("Applying sysconf", sysconf);
    return sysconf;
}
global.__logLevel = sysconf.logLevel;
global.__isErpMsgCheckStrict = sysconf.isErpMsgCheckStrict;
global.__erpApiVersion = sysconf.erpApiVersion;
global.__cloudURL = sysconf.cloudURL;
global.__customerDBPrefix = sysconf.customerDBPrefix;
global.__cloudDBName = sysconf.cloudDBName;
global.__sessionSecret = sysconf.sessionSecret;
global.__sessionTTL = sysconf.sessionTTL;
global.__goodsTopDays = sysconf.goodsTopBuyDays;
global.__dbConfig = sysconf.db;
global.__redisConfig = sysconf.redis;
global.__cacheConfig = sysconf.cache;
global.__newsMaxCounts = sysconf.indexNewsCounts;
global.__smsConfig = sysconf.sms;
global.__securityConfig = sysconf.security;
global.__mqConfig = sysconf.mq;
global.__queues = {OfflineTask: __mqConfig.OfflineTaskPrefix + "_" + process.env.USER};
global.__cacheService = require(__services_path + "/cacheService")();
global.__dbService = require(__services_path + "/dbService")();
global.__dataService = require(__services_path + "/dataService")();
global.__mqService = require(__services_path + "/mqService")();
global.__worker_path = __base + "/worker";
try {
    global.__version = require(__base + "/config/version.json");
} catch (e) {
    // if not exists, load an default empty instead
    global.__version = {
        version: "",
        revision: "",
        time: ""
    };
}
var dbConfig = {
    "connectionLimit": 1,
    "host": "cd",
    "user": "root",
    "password": "romens@2015",
    "logSql": true
};

var http = require("http");
var sprintf = require("sprintf-js").sprintf;
var mysql = require('mysql');
var pool = mysql.createPool(__dbConfig);
global.__mysql = pool;
var dbService = __dbService;
var redis = require('redis');

var redisClient = redis.createClient(__redisConfig.port, __redisConfig.host);

if (__redisConfig.password)
    redisClient.auth(__redisConfig.password);

redisClient.select(__redisConfig.dbNum);

global.__redis = redis;
global.__redisClient = redisClient;
var redisService = __redisClient;
var path = require('path');

var ErpAppCodeRobot = require(__modules_path + path.sep + 'erpAppCodeRobot');
var erpAppCodeRobot = new ErpAppCodeRobot(__cloudDBName, dbService, redisService);
var ApiRobot = require(__base + "/modules/apiRobot");
var async = require('async');

var cloudDbName = __cloudDBName;
var redisConn = __redisClient;
var isErpMsgCheckStrict = sysconf.isErpMsgCheckStrict;
var version = sysconf.version;
var msgType = "OPERATOR_ALL";
var msgData = {};
var enterpriseId = 6;

var apiRobot = new ApiRobot(cloudDbName, dbService, redisConn, isErpMsgCheckStrict, version);
apiRobot.sendMsg(enterpriseId, msgType, msgData, function sendMsgCallback(error, feedback) {
    if (error) {
        logger.error(error);
        return;
    }
    logger.debug(feedback);

    var customerDbName = null;
    var msg = JSON.parse(feedback.data);
    var operators = msg.Operators;

    dbService.customerRetrieveDbName(enterpriseId, cloudDbName, function customerRetrieveDbNameCallback(error, customerDBSuffix) {
        if (error) {
            logger.error(error);
            return;
        }

        customerDbName = __customerDBPrefix + "_" + customerDBSuffix;
        logger.ndump(customerDbName, customerDbName);

        var operatorType = "CUSTOMER";
        var customerId = enterpriseId;
        operators = underscore(operators).map(function (item) {
            var temp = [];
            temp.push(item.GUID);
            temp.push(item.Code);
            temp.push(item.Code);
            temp.push(operatorType);
            temp.push(customerId);
            temp.push(item.Code);
            temp.push(item.IsForbidden?0:1);
            temp.push(item.Name);
            return temp;
        });

        dbService.operatorCreateByBatch(customerDbName, operators, function operatorCreateByBatch(error, result) {
            if (error) {
                logger.error(error);
                return;
            }

            // todo:
        });
    });
});