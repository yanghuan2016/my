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
__customerDbPrefix = sysconf.customerDBPrefix;
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
var _ = require('lodash');



function ErpBuyerAsync(enterpriseId) {
    this.cloudDBName = __cloudDBName;
    this.enterpriseId = enterpriseId;
}

ErpBuyerAsync.prototype.sendMsg = function (msgType, data, callback) {
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
            return callback(error);
        }
        //logger.debug(JSON.stringify(feedback));
        callback(null, feedback);
    });
};

ErpBuyerAsync.prototype.getCustomerIds = function (cloudDBName, cb) {
    dbService.customerRetrieveIds(cloudDBName, function (err, data) {
        if (err) {
            return cb(err);
        }
        cb(null, data);
    });
};

ErpBuyerAsync.prototype.saveToDb = function (buyers, callback) {
    var enterpriseId = this.enterpriseId;
    var cloudDBName = this.cloudDBName;
    var sellerDbName = null;
    var invalidLicenseList = [];
    var insertedEnterpriseId = null;
    async.series(
        [
            // 1 取得当前的用户的CustomerDbName
            function (done) {
                customerDbNameRtrieve(enterpriseId, cloudDBName, function (err, name) {
                    logger.trace(name);
                    sellerDbName = name;
                    done(err, name);
                });
            },
            // 2 将数据写入CloudDb.customer表中
            function (done) {
                buyersInsertCustomer(cloudDBName, buyers, function (error, result) {
                    if (error) {
                        logger.trace('出错了在插入cloud的函数里');
                        logger.error(error);
                        return done(error, result);
                    }

                    done(null, result);
                });
            },
            //step2 将数据写入buyerInfo表中
            function (done) {
                logger.trace('接下来将数据写入buyer表中');
                buyersInsertClientBuyerInfo(sellerDbName, buyers, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return done(error);
                    }
                    done(null, result);
                });
            }
            // todo: last: 拉取operator的信息, 将operator信息 Cusotmer.Operator表中
        ], function (errs, resultArr) {
            if (!underscore.isEmpty(errs)) {
                logger.error(JSON.stringify(errs));
                callback(errs);
            } else {
                logger.trace('没有出错走完save函数会来到这里');

                if (invalidLicenseList.length > 0) {
                    logger.debug("以下同步的企业在cloudDB中没有配置数据，请更新后再次同步：" + JSON.stringify(invalidLicenseList));
                    callback(null, {msgType: "NOT FOUND IN CLOUDDB", data: invalidLicenseList});
                } else {
                    logger.debug("所有企业都已同步数据库成功");
                    callback(null, {msgType: "OK", data: {}})
                }
            }
        });
};

function buyersInsertClientBuyerInfo(selfDbName, buyers, callback) {
    logger.enter();
    var INSERT_CLIENT_BUYER = "" +
        "INSERT INTO %s.ClientBuyerInfo (" +
        "   erpCode," +
        "   enabled, " +
        "   businessLicense" +
        "   ) VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "   enabled = VALUES(enabled), erpCode=VALUES(erpCode)";
    var sql = sprintf(INSERT_CLIENT_BUYER, selfDbName);

    //var buyer = {
    //    GUID: 'e60a5f3f-81fe-428d-adef-71eeff7c8bbf',   // ERP内码
    //    TJ_TAG: '1',            // 客户类别ID
    //    TJBH: '00000',          // 客户编号
    //    AREARANGE: null,        // 客户所属区域范围
    //    MC: 'dd',               // 客户名称
    //    JGFA: '5',              // 价格方案
    //    EMAIL: '',              // 电子邮箱
    //    HANDTEL: '',            // 手机号
    //    FAXTEL: '',             // 传真号
    //    YYZZ: '',               // 营业执照
    //    ZZQX: null,             // 营业执照期限
    //    IsAuditing: 1,          // 审核标志
    //    FDELETED: 0,            // 禁用标志
    //    UPDATEDATE: '2015-12-31T00:00:00'   // 最近更新时间
    //};

    buyers = underscore(buyers).map(function (buyer) {
        var temp = [];
        temp.push(buyer.TJBH);
        temp.push(buyer.FDELETED ? 0 : 1);
        temp.push(buyer.YYZZ);
        return temp;
    });

    __mysql.query(sql, [buyers], function (error, results) {
        if (error) {
            logger.enter();
            return callback(error)
        }
        callback(null, results);
    });
}

function buyersInsertCustomer(CloudDbName, buyers, callback) {
    logger.enter();
    //var buyer = {
    //    GUID: 'e60a5f3f-81fe-428d-adef-71eeff7c8bbf',   // ERP内码
    //    TJ_TAG: '1',            // 客户类别ID
    //    TJBH: '00000',          // 客户编号
    //    AREARANGE: null,        // 客户所属区域范围
    //    MC: 'dd',               // 客户名称
    //    JGFA: '5',              // 价格方案
    //    EMAIL: '',              // 电子邮箱
    //    HANDTEL: '',            // 手机号
    //    FAXTEL: '',             // 传真号
    //    YYZZ: '',               // 营业执照
    //    ZZQX: null,             // 营业执照期限
    //    IsAuditing: 1,          // 审核标志
    //    FDELETED: 0,            // 禁用标志
    //    UPDATEDATE: '2015-12-31T00:00:00'   // 最近更新时间
    //};
    var sql = "insert into %s.Customer" +
        "   (" +
        "   orgId, " +
        "   customerName, " +
        "   enterpriseType, " +
        "   customerDBSuffix, " +
        "   enabled," +
        "   businessLicense, " +
        "   businessLicenseValidateDate " +
        "   ) values ?" +
        "on duplicate key update " +
        "   businessLicense = values(businessLicense);";
    sql = sprintf(sql, CloudDbName);
    var customerType = "BUYER";
    var buyersArr = underscore(buyers).map(function (buyer) {
        var temp = [];
        temp.push(buyer.TJBH);      // orgId
        temp.push(buyer.MC);        // customerName
        temp.push(customerType);    // enterpriseType
        temp.push(buyer.YYZZ);      // customerDBSuffix
        temp.push(buyer.IsAuditing);      // enabled
        temp.push(buyer.YYZZ);      // businessLicense
        temp.push(buyer.ZZQX);      // businessLicenseValidateDate
        return temp;
    });
    logger.trace(buyersArr);
    __mysql.query(sql, [buyersArr], function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        logger.ndump('insertCloudDB.Customer', result);
        callback(null, result);
    });
}

function customerDbNameRtrieve(enterpriseId, cloudDBName, callback) {
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


var enterpriseId = 2;
var msgType = 'REQUEST_CLIENT_TO_SELLER';
var msgData = {};

var erpBuyerAsync = new ErpBuyerAsync(enterpriseId);

erpBuyerAsync.sendMsg(msgType, {}, function (err, feedback) {
    var buyers = JSON.parse(feedback.data).BUYER;
    //logger.trace(buyers[0]);


    buyers = _.map(buyers, function (item) {
        if (_.isEmpty(item.BusinessLicense) || _.isEmpty(item.Mobile) || _.isEmpty(item.ClientCode)) {
            return;
        }
        // todo: 保证上层进来的数据有值后, 删掉下面三行补全数据的代码
        if (_.isEmpty(item.clientCategoryErpCode)) {
            item.clientCategoryErpCode = '1';
        }
        return item;
    });
    buyers = _.compact(buyers);


//var buyers = [{
//    GUID: 'e60a5f3f-81fe-428d-adef-71eeff7c8bbf',   // ERP内码
//    TJ_TAG: '1',            // 客户类别ID
//    TJBH: '00000',          // 客户编号
//    AREARANGE: null,        // 客户所属区域范围
//    MC: 'dd',               // 客户名称
//    JGFA: '5',              // 价格方案
//    EMAIL: 'zhaopeng.qq.com',              // 电子邮箱
//    HANDTEL: '18202835971',            // 手机号
//    FAXTEL: '18202835971',             // 传真号
//    YYZZ: '123456788',               // 营业执照
//    ZZQX: "2017-12-12",             // 营业执照期限
//    IsAuditing: 1,          // 审核标志
//    FDELETED: 0,            // 禁用标志
//    UPDATEDATE: '2015-12-31T00:00:00'   // 最近更新时间
//}];



    erpBuyerAsync.saveToDb(buyers, function (err, dataObj) {
        if (err) {
            logger.error(err);
            process.exit(1);
        }
        //logger.trace(dataObj);
        process.exit(0);
    });
});

