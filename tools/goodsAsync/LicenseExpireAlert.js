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
 * LicenseExpireAlert
 *     证照到期时间预警的离线任务
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2016/1/15     romens@xdw
 *
 */

var logger = require("../../services/logService");
var underscore = require("underscore");
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
var async = require('async');
var redisClient = redis.createClient(__redisConfig.port, __redisConfig.host);
if (__redisConfig.password)
    redisClient.auth(__redisConfig.password);

redisClient.select(__redisConfig.dbNum);

global.__redis = redis;
global.__redisClient = redisClient;
var redisService = __redisClient;
var path = require('path');


function LicenseExpireAlert (){
    var cloudDB = __cloudDBName;
    if(cloudDB.indexOf("_") == -1){
        logger.error("Please excute '. bin/setenv' first ");
        this.error = "Please excute '. bin/setenv' first ";
    }else{
        this.error = null;
    }

}
/**
 * 遍历出CloudDB下的所有Customer
 * @param cb
 */
LicenseExpireAlert.prototype.getCustomerDBList = function(cb){
    logger.enter();
    var cloudDB = __cloudDBName;
    var SQL = "SELECT id,customerName,customerDBSuffix FROM %s.Customer WHERE enabled = 1;";
    var sql = sprintf(SQL, cloudDB);
    logger.sql(sql);
    __mysql.query(sql,function(err,results){
       if(err){
           cb(err);
       } else{
           cb(this.error,results);
       }
    });

};

/**
 * 遍历出Customer下，所有的clientGsp数据
 * @param customerList
 * @param cb
 */
LicenseExpireAlert.prototype.getClientGspList = function(customerList,cb){
    logger.enter();
    async.mapSeries(customerList,
    function(customer,mapcallback){
        var customerId = customer.id;
        var customerName = customer.customerName;
        var customerDB = __customerDBPrefix + "_" +customer.customerDBSuffix;
        getAllClientGsp(customerDB,function(err,results){
            if(err){
                var msg = "customerId="+customerId+","+customerName+" get clientGsp failed";
                console.log(msg);
                mapcallback(null,err+msg);
            }else{
                var clientGsp = {};
                clientGsp.customerId = customerId;
                clientGsp.customerName = customerName;
                clientGsp.details = results;
                mapcallback(null,clientGsp);
            }
        })
    },
    function(errs,resultlist){
        if(errs){
            cb(errs);
        }else{
            cb(this.error,resultlist);
        }
    });

};


LicenseExpireAlert.prototype.compareExpireLicense = function(clientGspList,cb){
    logger.enter();
    async.mapSeries(clientGspList,
        function(clientGsp,mapcallback){
             if(typeof (clientGsp)=="string"){
                 mapcallback(null, clientGsp);
             }else{
                 var customerId = clientGsp.customerId;
                 var customerName = clientGsp.customerName;
                 var details = clientGsp.details;
                 var expireList = [];
                 underscore.map(details,function(gsp){
                     var obj = {};
                     var keylist = underscore.keys(gsp);
                     underscore.map(keylist,function(item){
                         if(item.indexOf("Date")>-1 && gsp[item] != null){
                             logger.debug(item);
                             logger.debug(gsp[item]);
                             var licenseDate = new Date(gsp[item]);
                             var now = new Date();
                             var expireDays = (licenseDate.getTime()-now.getTime())/1000/3600/24;
                             logger.debug(expireDays);
                             obj.customerId = customerId;
                             obj.customerName = customerName;
                             obj.expireDays = expireDays;
                             obj.licenseName = item;
                             obj.clientId = gsp.clientId;
                             expireList.push(obj);
                         }
                     })
                 });
                 mapcallback(null,expireList);
             }
        },
        function(errs,resultlist){
            if(errs){
                cb(errs);
            }else{
                cb(this.error,resultlist);
            }
        });

};




LicenseExpireAlert.prototype.writeNotification = function(dataList,cb){
    logger.enter();
    var cloudDB = __cloudDBName;
    //dataList=[ [ { customerId: 1,
    //    customerName: '神木医药网',
    //    expireDays: 12452.222941006943,
    //    licenseName: 'businessLicenseValidateDate',
    //    clientId: 1 } ],
    //    [ { customerId: 2,
    //        customerName: '神木医药网',
    //        expireDays: 12452.22294099537,
    //        licenseName: 'businessLicenseValidateDate',
    //        clientId: 1 } ],
    //    [ { customerId: 3,
    //        customerName: '神木医药网',
    //        expireDays: 12452.22294099537,
    //        licenseName: 'businessLicenseValidateDate',
    //        clientId: 1 },
    //        { customerId: 3,
    //            customerName: '神木医药网',
    //            expireDays: 119.22294096064815,
    //            licenseName: 'medicalInstitutionLicenseNumValidateDate',
    //            clientId: 2 },
    //        { customerId: 3,
    //            customerName: '神木医药网',
    //            expireDays: 119.22294096064815,
    //            licenseName: 'medicalInstitutionLicenseNumValidateDate',
    //            clientId: 2 },
    //        { customerId: 3,
    //            customerName: '神木医药网',
    //            expireDays: 119.22294096064815,
    //            licenseName: 'medicalInstitutionLicenseNumValidateDate',
    //            clientId: 2 },
    //        { customerId: 3,
    //            customerName: '神木医药网',
    //            expireDays: 119.22294096064815,
    //            licenseName: 'medicalInstitutionLicenseNumValidateDate',
    //            clientId: 2 },
    //        { customerId: 3,
    //            customerName: '神木医药网',
    //            expireDays: 119.22294096064815,
    //            licenseName: 'medicalInstitutionLicenseNumValidateDate',
    //            clientId: 2 } ]];
    //todo 1.select expired data from datalist by expried 30<60,15<30,7<15, 3<7,1<3,1<;
    //todo 2.select send target operatorId by customerId
    cb();
};



function getAllClientGsp(customerDB,cb){
    var SQL = "SELECT * FROM %s.ClientGsp;";
    var sql = sprintf(SQL, customerDB);
    logger.sql(sql);
    __mysql.query(sql,function(err,results){
        if(err){
            cb(err);
        } else{
            cb(this.error,results);
        }
    });
}


module.exports = LicenseExpireAlert;

