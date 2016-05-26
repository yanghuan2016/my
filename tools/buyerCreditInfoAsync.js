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


// 调用时候需要传入的数据
var sellerEnterpriseId = 3;     // 卖家
var clientId = 1;               // buyer1
var msgType = 'REQUEST_BUYER_CREDIT_INFO_TO_SELLER';
// 应该去数据库查出来营业执照
var msgData = {
    businessLicense: '620900000003505'
};


//实现代码

var apiRobot = new ApiRobot(cloudDbName, dbService, redisClient, isErpMsgCheckStrict, erpApiVersion);

customerDbNameRetrieve(sellerEnterpriseId, cloudDbName, function (error, customerDbName) {
    if (error) {
        logger.error(error);
        process.exit(1);
    }
    retrieveEnterpriseIdByClientId(clientId, customerDbName, function (error, clientEnterpriseId) {
        if (error) {
            logger.error(error);
            process.exit(1);
        }
        logger.trace(clientEnterpriseId);
        apiRobot.sendMsg(clientEnterpriseId, msgType, msgData, function sendMsgCallback(error, feedback) {
            if (error) {
                return logger.error(error);
            }
            logger.debug(JSON.stringify(feedback));
            var credit = JSON.parse(feedback.data).CREDIT;
            if (credit.length == 0) {
                logger.trace("该营业执照号没有对应的数据.");
                process.exit(0);
            }
            credit = credit[0]; //credit对象
            // 将授信信息写入数据库
            saveCredit(customerDbName, clientId, credit, function (error, result) {
                if (error) {
                    logger.error(error);
                    process.exit(1);
                }
                logger.trace('成功写入授信额度信息');
                process.exit(0);
            });
        })
    });
});

function customerDbNameRetrieve(enterpriseId, cloudDBName, callback) {
    logger.enter();
    var LIST_CUSTOMER_SUFFIX = " SELECT customerDBSuffix FROM %s.Customer WHERE id = %d;";
    var sql = sprintf(LIST_CUSTOMER_SUFFIX, cloudDBName, enterpriseId);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, __customerDBPrefix + "_" + result[0].customerDBSuffix);
    });
}

function saveCredit(customerDbName, clientId, credit, callback) {
    logger.enter();
    //        {
    //            "EDJE": 0.00,         // 信用限额
    //            "CreditTerm": 0,      // 信用期限
    //            "XYSY": -18653.770000 // 剩余额度
    //        }
    var sql = 'insert into %s.ClientFinance (' +
        '   clientId, ' +
        '   credits, ' +
        '   arrearsBalance, ' +
        '   accountDays ' +
        ') values (%d, "%s", "%s", "%s" ) ' +
        'on duplicate key update ' +
        '   credits = values(credits), ' +
        '   arrearsBalance = values(arrearsBalance), ' +
        '   accountDays = values(accountDays);';
    sql = sprintf(sql, customerDbName, clientId, credit.EDJE, credit.XYSY, credit.CreditTerm );
    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, result);
    });
}

function retrieveEnterpriseIdByClientId(clientId, customerDbName, callback) {
    logger.enter();

    // 先拿到operatorId,
    var sql = "select customerId from %s.Operator where clientId = %d;";
    sql = sprintf(sql, customerDbName, clientId);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        try {
            callback(null, result[0].customerId);
        } catch (error) {
            callback(error);
        }
    });
}