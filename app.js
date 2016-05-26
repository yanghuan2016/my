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
 * app.js
 *      scc's start up entry
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-19   hc-romens@issue#224     load version file to __version
 * 2015-10-10   hc-romens@issue#168     worker mode introduced
 * 2015-10-05   hc-romens@issue#97      move init.js functions into app.js
 * 2015-09-14   hc-romens@issue#16      added module "stdio" for arg parse
 *
 *
 */

var underscore = require("underscore");
var logger = require(__dirname+"/services/logService");

/* init logger service */
global.__logService = logger;


/*
 * The main entry
 */
var main = function() {

    initGlobalVariables();

    logger.setLevel(__logLevel);

    readCliOptions();

    /* init Redis connections */
    require(__base+"/init/initRedis").initRedis();

    if (__appMode === "WEBSERVER") {
        startModeWebServer();
    }
    else if(__appMode === "SCHEDULE") {
        startModeSchedule();
    }
    else{
        require(__base + "/init/initDB").initDB(__mqConfig.dbConnectionLimit);

        logger.info("Run in mode: autoSwitchShipInfoToDelivered");
        startAutoSwitchShipInfoToDelivered();

    }

};

var startModeWebServer = function() {
    logger.info("Run in mode: Server");
    
    /* init DB  connections */
    require(__base+"/init/initDB").initDB();

    /* init other modules/apps/services */
    require(__dirname+"/init/init").initApp(function (error, server) {
        if (error) {
            logger.fatal(error);
            process.exit(1);
        }
        startServer(server);
    });
};

var startModeSchedule = function() {
    logger.info("Run in mode: Worker");
    require(__base + "/init/initDB").initDB(__mqConfig.dbConnectionLimit);

    logger.ndump("__taskService", __taskService);
    
    setTimeout(__taskService.startScheduler, 5000);
};

/**
 * Initialize the global variables
 *
 * The config params' priority is:
 *      CLI > Envars > sysconfig.json
 */
var initGlobalVariables=function (){

    /**
     * Basic config
     */
    global.__base   = __dirname;
    global.__port   = 3300;



    /**
     * Path config
     */
    global.__apps_path = __base + "/apps";
    global.__node_modules_path = __base + "/node_modules";
    global.__modules_path = __base + "/modules";
    global.__services_path = __base + "/services";
    global.__db_service_path = __services_path + "/database";
    global.__db_schema_path = __base + "/db";
    global.__report_path = "static/reports";
    global.__bin_path = __base + "/bin";

    /**
     * 初始化系统中所支持的权限
     */
    var features = require(__modules_path + "/features");
    global.__FEATUREENUM = features.FEATUREENUM;
    global.__FEATUREGROUPS = features.FEATUREGROUPS;
    global.__FEATURELIST = features.FEATURELIST;

    /**
     * system config
     */
    var sysconf = replaceSysConfWithEnvars(require(__dirname + '/config/sysconfig.json'));

    global.__logLevel = sysconf.logLevel;
    global.__mode = sysconf.mode;
    global.__yy365LoginAuth = sysconf.yy365LoginAuth;
    global.__isErpMsgCheckStrict = sysconf.isErpMsgCheckStrict;
    global.__erpApiVersion = sysconf.erpApiVersion;
    global.__appCodeValidTime = sysconf.appCodeValidTime;
    global.__clientModifyGSP = sysconf.clientModifyGSP;
    global.__enableCaptcha = sysconf.enableCaptcha;
    global.__enableSMS = sysconf.enableSMS;
    global.__shipToRegisteredAddressOnly = sysconf.shipToRegisteredAddressOnly;
    global.__entryFromOrderOnly  = sysconf.entryFromOrderOnly;
    global.__shipStrictly = sysconf.shipStrictly;
    global.__returnStrictly = sysconf.returnStrictly;
    global.__creditCanPay = sysconf.creditCanPay;
    global.__syncGoodsPeriod=sysconf.sync_goods_period;
    global.__pointDigit=sysconf.pointDigit;
    global.__msgCheckSec = sysconf.msgCheckSec;

    global.__idPrefix = sysconf.idPrefix;

    /* payment param */
    global.__payExpireMin = sysconf.payExpireMin;
    global.__refundExpireMin = sysconf.refundExpireMin;

    global.__gspScopeCheck = sysconf.gspScopeCheck;

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
    /* scc mode config */
    global.__sccMode = sysconf.sccMode;

    /* browser cache ttl */
    global.__browserCacheTTL = sysconf.browserCacheTTL;


    global.__verifyShipNum = sysconf.verifyShipNum;

    /*max counts when sync goods one time  */
    global.__maxSyncGoodsCount=sysconf.maxSyncGoodsCount;

    /*close order when last interval time past and order is not paid */
    global.__closeOrderIntervalTime=sysconf.closeOrderIntervalTime;
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
    global.__taskService = require(__services_path + "/taskService")();
    global.__pubsubService = require(__services_path + "/pubsubService")(__redisConfig);
    global.__yy365Service = require(__services_path + '/yy365Service')();
    
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

};

/**
 * replaceSysConfWithEnvars
 *      Replace the system configuration params with Envrionment Variabls,
 *      if exists. This is a solution to overwrite the config params by
 *      a shell script, @see /bin/setenv.sh
 * @param sysconf
 */
function replaceSysConfWithEnvars(sysconf) {
    var logger = __logService;

    /* Delete the comments, cause it is for comments purpose */
    delete sysconf.__comments;

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
    if (!underscore.isUndefined(process.env.USER)) sysconf.redis.prefix = process.env.USER;

    logger.ndump("Applying sysconf", sysconf);

    return sysconf;
}

/*
 * read command line options, overwrite the global variables if needed
 */
var readCliOptions = function() {

    // read CLI options
    var stdio = require("stdio");
    var options = stdio.getopt({
        'port': {key: 'p', description: 'port number', default: '3300', args: 1},
        'schedule':{key:'s',description:'自动离线任务执行器',default:false,args:0}
    });

    logger.ndump("options", options);
    // update global options
    global.__port = options.port;
    global.__appMode = options.schedule?"SCHEDULE":"WEBSERVER";
}

var startServer = function(server){
    logger.enter();

    var port = __port;

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
        var addr = server.address();
        logger.info("Listening on " + addr.port);
    }

};

/**
 * Start the application as offline task works
 */
var startWorker = function(){
    logger.enter();
    var worker = require(__worker_path + "/worker")();

    worker.go();
};

var startAutoSwitchShipInfoToDelivered=function(){
    logger.enter();
    var autoSwitchShipInfoToDelivered=require(__worker_path+"/switchToDelivered")();
    autoSwitchShipInfoToDelivered.batchSwitchShipInfo();
};

var autoSettleBill=function(){
    logger.enter();
    var autoSettleBill=require(__worker_path+"/mensalSettle")();
    autoSettleBill.autoSettleBills();
};

main();

