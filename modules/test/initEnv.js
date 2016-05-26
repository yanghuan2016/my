function initEnv() {
    global.__report_path = "static/reports";
    global.__base = process.cwd();
    global.__logService = require(global.__base + "/services/logService");
    global.__node_modules_path = global.__base + "/node_modules";
    global.__modules_path = global.__base + "/modules";
    global.__services_path = global.__base + "/services";
    global.__db_service_path = global.__services_path + "/database";
    global.__db_schema_path = global.__base + "/db";


    global.__redis = require('redis');
    var path = require('path');
    var async = require('async');
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require(global.__base + "/node_modules/underscore");
    var mysql = require('mysql');

    var sysconf = replaceSysConfWithEnvars(require(global.__base + '/config/sysconfig.json'));

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

    global.__logLevel = sysconf.logLevel;
    global.__isErpMsgCheckStrict = sysconf.isErpMsgCheckStrict;
    global.__enableCaptcha = sysconf.enableCaptcha;
    global.__enableSMS = sysconf.enableSMS;
    global.__erpApiVersion = sysconf.erpApiVersion;
    global.__appCodeValidTime = sysconf.appCodeValidTime;
    global.__cloudUrl = sysconf.cloudURL;
    global.__customerDbPrefix = sysconf.customerDBPrefix;
    global.__customerDBPrefix = sysconf.customerDBPrefix;
    global.__cloudDbName = sysconf.cloudDBName;
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
    global.__queues = {OfflineTask: global.__mqConfig.OfflineTaskPrefix + "_" + process.env.USER};

    global.__cacheService = require(global.__services_path + "/cacheService")();
    global.__dbService = require(global.__services_path + "/dbService")();
    global.__dataService = require(global.__services_path + "/dataService")();
    global.__mqService = require(global.__services_path + "/mqService")();
    global.__worker_path = global.__base + "/worker";

    try {
        global.__version = require(global.__base + "/config/version.json");
    } catch (e) {
        global.__version = {
            version: "",
            revision: "",
            time: ""
        };
    }

//init mysql connection pool
    global.__mysql = mysql.createPool(global.__dbConfig);
    var dbService = global.__dbService;

//init redisClient & redisService
    var redisClient = global.__redis.createClient(global.__redisConfig.port, global.__redisConfig.host);
    if (global.__redisConfig.password) {
        redisClient.auth(global.__redisConfig.password);
    }
    redisClient.select(global.__redisConfig.dbNum);
    global.__redisClient = redisClient;
}

module.exports = initEnv;