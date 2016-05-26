/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * ERPgoodsinfoAsync
 *      scc's startup initialization
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2016/1/15     romens@xdw
 *
 */

var logger = require("../../services/logService");
var underscore = require("underscore");
var async = require('async');
global.__logService = logger;
/**
 * Basic config
 */

global.__base   =__dirname.split('tools')[0];

/**
 * Path config
 */

global.__node_modules_path = __base + "node_modules";
global.__modules_path = __base + "modules";
global.__services_path = __base + "services";
global.__db_service_path = __services_path + "/database";
global.__db_schema_path = __base + "db";
global.__report_path = "static/reports";

/**
 * system config
 */
var sysconf = replaceSysConfWithEnvars(require(__base + '/config/sysconfig.json'));

function replaceSysConfWithEnvars(sysconf) {


    /* DB Host */
    if (!underscore.isUndefined(process.env.SCC_DB_HOST)) sysconf.db.host = process.env.SCC_DB_HOST;
    /* DB User */
    if (!underscore.isUndefined(process.env.SCC_DB_USER)) sysconf.db.user = process.env.SCC_DB_USER;
    /* DB password */
    if (!underscore.isUndefined(process.env.SCC_DB_PASSWORD)) sysconf.db.password = process.env.SCC_DB_PASSWORD;

    /* CloudDBName */
    if (!underscore.isUndefined(process.env.SCC_CLOUDDB)) sysconf.cloudDBName = process.env.SCC_CLOUDDB;
    /* CustomerDBPrefix */
    if (!underscore.isUndefined(process.env.SCC_CUSTOMERDB_PREFIX))
        sysconf.customerDBPrefix = process.env.SCC_CUSTOMERDB_PREFIX;

    /* Redis host */
    if (!underscore.isUndefined(process.env.SCC_REDIS_HOST)) sysconf.redis.host = process.env.SCC_REDIS_HOST;

    logger.ndump("Applying sysconf", sysconf);

    return sysconf;
}
global.__logLevel = sysconf.logLevel;
global.__isErpMsgCheckStrict = sysconf.isErpMsgCheckStrict;
global.__erpApiVersion = sysconf.erpApiVersion;
/* say, romens.cn */
global.__cloudURL = sysconf.cloudURL;

/* CustomerDB_hc as the customer db name prefix, "hc" is the user name */
global.__customerDBPrefix = sysconf.customerDBPrefix;

/* cloud db name */
global.__cloudDBName = sysconf.cloudDBName;

/* seesion secret */
global.__sessionSecret = sysconf.sessionSecret;

/* session TTL */
global.__sessionTTL = sysconf.sessionTTL;

/* session goodsTop buy days 统计商品排行天数 */
global.__goodsTopDays = sysconf.goodsTopBuyDays;

/* db config */
global.__dbConfig = sysconf.db;

/* redis config */
global.__redisConfig = sysconf.redis;

/* cache config */
global.__cacheConfig = sysconf.cache;

/* index newsCounts*/
global.__newsMaxCounts=sysconf.indexNewsCounts;

/* sms config*/
global.__smsConfig=sysconf.sms;

/* security config */
global.__securityConfig = sysconf.security;

/**
 * MQ config
 */
global.__mqConfig = sysconf.mq;
global.__queues = { OfflineTask: __mqConfig.OfflineTaskPrefix + "_" + process.env.USER };

/**
 * load services
 */
global.__cacheService = require(__services_path + "/cacheService")();
global.__dbService  = require(__services_path + "/dbService")();
global.__dataService = require(__services_path + "/dataService")();
global.__mqService = require(__services_path + "/mqService")();


/**
 * worker path
 */
global.__worker_path = __base + "/worker";

/**
 * Load version
 */
try {
    global.__version = require(__base + "/config/version.json");
} catch (e) {
    // if not exists, load an default empty instead
    global.__version = {
        version : "",
        revision: "",
        time: ""
    };
}
/* initdb */
var dbConfig = {
    "connectionLimit"     : 1,
    "host"                : "cd",
    "user"                : "root",
    "password"            : "romens@2015",
    "logSql"		      : true
};

var http = require("http");
var sprintf = require("sprintf-js").sprintf;

//init dbService
var mysql = require('mysql');
var pool  = mysql.createPool(__dbConfig);
global.__mysql = pool;
var dbService = __dbService;
//init redis

var redis = require('redis');

var redisClient = redis.createClient(__redisConfig.port, __redisConfig.host);
if (__redisConfig.password)
    redisClient.auth(__redisConfig.password);

redisClient.select(__redisConfig.dbNum);

global.__redis = redis;
global.__redisClient = redisClient;
var redisService = __redisClient;
var path = require('path');

//引入SCC robot
var ErpAppCodeRobot = require(__modules_path + path.sep+'erpAppCodeRobot');
var erpAppCodeRobot = new ErpAppCodeRobot(__cloudDBName,dbService,redisService);
var ApiRobot = require(__base + "/modules/apiRobot");
//var EventProxy = require('eventproxy');

var PAGESIZE = 10000;

function ERPCustomersAsync (enterpriseId){
    this.cloudDBName = __cloudDBName;
    this.enterpriseId = enterpriseId;
}

ERPCustomersAsync.prototype.sendMsg =function (msgType,data,callback){
    var cloudDbName = __cloudDBName;
    var dbService = __dbService;
    var redisConn = __redisClient;
    var isErpMsgCheckStrict = __isErpMsgCheckStrict;
    var version = __erpApiVersion;

    var msgData = data;
    var apiRobot = new ApiRobot(cloudDbName, dbService, redisConn, isErpMsgCheckStrict, version);
    apiRobot.sendMsg(this.enterpriseId, msgType, msgData, function sendMsgCallback(error, feedback) {
        if (error) {
            logger.error(error);
            return;
        }
        logger.debug(JSON.stringify(feedback));
        callback(null, feedback);
    });
};



ERPCustomersAsync.prototype.getCustomerIds = function (cloudDBName, cb) {
    dbService.customerRetrieveIds(cloudDBName, function (err, data) {
        if(err) {
            return cb(err);
        }
        cb(null, data);
    });
};

ERPCustomersAsync.prototype.restoreIntoDB = function(data,type,cb){

    var enterpriseId = this.enterpriseId;
    var cloudDBName = this.cloudDBName;
    var customerDB = undefined;
    var invalidLicenselist = [];
    async.series(
        [
            //step1 取得当前的用户的数据库名
            function(done){
                getCustomerDBName(enterpriseId, cloudDBName, function(err, name) {
                    customerDB = name;
                    done(err,name);
                });
            },
            //step2 根据data类型type插入当前数据库的对应库表
            function(done){
                if(type == 'SELLER_ALL') {
                    insertClientSellerInfo(customerDB, data,function(err, result) {
                        done(err, result)
                    });
                }else {
                    insertClientBuyerInfo(customerDB, data,function(err, result) {
                        done(err, result);
                    });
                }
            },
            //step3 更新cloudDB中的企业数据，如当前同步的信息不存在，返回license,提示需新建数据库并补齐数据才可生效
            // ，如果已有，则更新类型信息，并根据CloudDB中的enterpriseId，找到对应数据库更新selller或buyer表信息
            function(done){
                async.mapSeries(data,
                    function(itemlist,mapcallback){
                        var businessLicense = itemlist[2];
                        selectCloudDBBylicense(__cloudDBName,businessLicense,function(err,result){
                            if(err){
                                mapcallback(err)
                            }else{
                                if(result.length==0){
                                   invalidLicenselist.push(businessLicense);
                                }else{
                                    var enterpriseType = result[0].enterpriseType;
                                    var typeStr = type.split("_")[0];
                                    var targetCustomerDB = __customerDBPrefix+"_"+result[0].customerDBSuffix;
                                    if(enterpriseType == "BOTH" || enterpriseType ==typeStr){
                                        logger.debug("无需更新cloudDB数据库中的类型信息");
                                    }else{
                                        updateCloudDBType(__cloudDBName,businessLicense,function(err,res){
                                            if(err){mapcallback(err)}else{
                                                /**
                                                 * 对于目标客户来说，seller相当于buyer，buyer也就相当于seller，
                                                 * 所以此处应插入相反的表格中
                                                 */
                                                if(type == 'SELLER_ALL') {
                                                    insertClientBuyerInfo(targetCustomerDB, data,function(err, result) {
                                                        done(err, result)
                                                    });
                                                }else {
                                                    insertClientSellerInfo(targetCustomerDB, data,function(err, result) {
                                                        done(err, result);
                                                    });
                                                }
                                            }
                                        })
                                    }
                                }
                                mapcallback(null,result);
                            }
                        })
                    },
                    function(errs,results){
                            done(errs,results)
                    }
                )
            }

        ]
        ,function(errs,resultArrays){
            if(errs){
                cb(errs);
            }else{
                if(invalidLicenselist.length>0){
                    logger.debug("以下同步的企业在cloudDB中没有配置数据，请更新后再次同步："+JSON.stringify(invalidLicenselist));
                    cb(null,{msgType:"NOT FOUND IN CLOUDDB",data:invalidLicenselist});
                }else{
                    logger.debug("所有企业都已同步数据库成功");
                    cb(null,{msgType:"OK",data:{}})
                }
            }
    })

};


function insertClientBuyerInfo(dbName,data, cb) {

    var INSERT_CLIENT_BUYER = "INSERT INTO %s.ClientBuyerInfo (erpCode, enabled, businessLicense) VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "enabled=VALUES(enabled), erpCode=VALUES(erpCode)";
    var sql = sprintf(INSERT_CLIENT_BUYER, dbName);
    __mysql.query(sql, [data], function (err, results) {
        cb(err, results)
    });

}

function insertClientSellerInfo(dbName,data, cb) {
    var INSERT_CLIENT_BUYER = "INSERT INTO %s.ClientSellerInfo (erpCode, enabled, businessLicense) VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "enabled=VALUES(enabled), erpCode=VALUES(erpCode)";
    var sql = sprintf(INSERT_CLIENT_BUYER, dbName);
    __mysql.query(sql, [data], function (err, results) {
        cb(err, results)
    });

}

function getCustomerDBName(enterpriseId,cloudDBName, cb) {
    var LIST_CUSTOMER_SUFFIX = " SELECT customerDBSuffix FROM %s.Customer WHERE id = %d;";
    var sql = sprintf(LIST_CUSTOMER_SUFFIX, cloudDBName,enterpriseId);
    __mysql.query(sql,function(err,result){
        if(!err){
            var customerDBName = __customerDBPrefix+"_"+result[0].customerDBSuffix;
            cb(null, customerDBName);
        }else {
         cb(err);
        }
    });
}

function selectCloudDBBylicense(cloudDBName, licenseNo,cb) {
    var SELECT_CLOUDDB_BY_YYZZ = " SELECT id,enterpriseType,customerDBSuffix FROM %s.Customer WHERE businessLicense = '%s' ;";
    var sql = sprintf(SELECT_CLOUDDB_BY_YYZZ, cloudDBName,licenseNo);
    __mysql.query(sql,function(err,result){
        if(!err){
            cb(null, result);
        }else {
            cb(err);
        }
    });
}

function updateCloudDBType (cloudDBName,licenseNo,cb){
    var UPDATE_CLOUDDB_TYPE = "  UPDATE %s.Customer SET enterpriseType = 'BOTH' WHERE businessLicense = '%s'; ";
    var sql = sprintf(UPDATE_CLOUDDB_TYPE, cloudDBName,licenseNo);
    __mysql.query(sql,function(err,result){
        if(!err){
            cb(null, result);
        }else {
            cb(err);
        }
    });
}
module.exports = ERPCustomersAsync;
