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
global.__customerDbPrefix = sysconf.customerDBPrefix;

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
var _ = require("lodash");

//引入SCC robot
var ErpAppCodeRobot = require(__modules_path + path.sep+'erpAppCodeRobot');
var erpAppCodeRobot = new ErpAppCodeRobot(__cloudDBName,dbService,redisService);
var ApiRobot = require(__base + "/modules/apiRobot");
var EventProxy = require('eventproxy');
var async = require('async');
var PAGESIZE = 1000;

function ERPGoodsAsync (enterpriseId){
    if(enterpriseId==undefined){
        logger.error("enterpriseId is undefined")
        return;
    }
    this.cloudDBName = __cloudDBName;
    this.enterpriseId = enterpriseId;
}




//根据enterpriseId拿到APPCODE
ERPGoodsAsync.prototype.getAppCode =function (cb) {
    erpAppCodeRobot.getAppCode(this.enterpriseId,function(err,appcode){
        if(err){
            logger.error(err);
            cb(err);
        }
        cb(null,appcode);
    });
};

ERPGoodsAsync.prototype.sendMsg =function (msgType,data,callback){
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
            callback(error);
            return;
        }
        callback(null,feedback);
    });
};

ERPGoodsAsync.prototype.getAllGoodsNum = function(cb){
    var msgType="ASYNC_GOODS_COUNT";
    var data = null;
    this.sendMsg(msgType,data,function(error,result){
        if (error) {
            logger.error(error);
            cb(error);
            return;
        }
        //logger.debug(JSON.stringify(result));
        cb(null,result);
    })

};


ERPGoodsAsync.prototype.getBasicInfoKeys = function(goodsSize,cb){
    logger.enter();
    var pageTotal =  goodsSize/PAGESIZE+1;
    var msgType="ASYNC_GOODSBASICINFO_KEYS";
    var ep = new EventProxy();
    var datalist =[];
    logger.trace("pageTotal="+pageTotal);
    ep.after('get_goods_keys',pageTotal,function(datas){
        underscore.map(datas,function(item){
            try {
                logger.debug(JSON.stringify(item.data));
                var itemObj = JSON.parse(item.data);
                datalist = datalist.concat(itemObj['YW_KCK']);
            }catch(err){
                logger.error("JSON.parse item failed"+err) ;
            }
        });
        cb(null,datalist);
    });
    for(var i=1;i<=pageTotal;i++){
        var data = {
            "startNo":1+PAGESIZE*(i-1), //开始序号
            "endNo":i*PAGESIZE //结束序号
        };
        //logger.debug(JSON.stringify(data));
        this.sendMsg(msgType,data,function(error,result){
            if (error) {
                logger.error(error);
                cb(error);
                return;
            }
            //logger.debug(JSON.stringify(result));
            ep.emit('get_goods_keys',result);
        })
    }
};

ERPGoodsAsync.prototype.selectGoodInfoKeys = function(list,cb) {
    logger.enter();
    var cloudDBName = this.cloudDBName;
    var enterpriseId = this.enterpriseId;

    var guidlist = [];      // 数组中的guid表示需要拉取的商品
    var insertList = [];    // 表示将要更新erpUpdatedOn这个字段的数据
    underscore.map(list,function(item){
        //更新时间为null的直接加入需要拉取的列表，不作比较
        if(item.UPDATEDATE == null){
            guidlist.push(item['GUID'])
        }else{
            insertList.push(item);
        }
    });
    //console.log(guidlist);
    //console.log(insertList);
    //对insertList列表的商品，分两步对比，先写表，再select
    var customerDBName = undefined;
    async.series([
        /**
         * 通过enterpriseId,拿到customDBName
         */

        function (done){
            var LIST_CUSTOMER_SUFFIX = " SELECT customerDBSuffix FROM %s.Customer WHERE id = %d;";
            var sql = sprintf(LIST_CUSTOMER_SUFFIX,cloudDBName,enterpriseId);
            __mysql.query(sql,function(err,result){
                if(!err){
                    customerDBName = __customerDBPrefix+"_"+result[0].customerDBSuffix;
                    logger.debug("customerDB ="+customerDBName)
                }
                done(err,result);
            })
        },
        /**
         * 通过guid更新商品的 erpUpdatedOn
         */
        function (done){
            var INSERT_GOODSINFO_KEYS = "INSERT INTO %s.GoodsInfo (guid, erpUpdatedOn) VALUES ('%s','%s') ON DUPLICATE KEY UPDATE erpUpdatedOn=VALUES(erpUpdatedOn);";
            console.log("正在项数据库更新商品的erpUpdatedOn字段:...",insertList.length);
            var i = 0;
            var percent = 0;
            // TODO: 因为有可能数据太多 ,测试时候取前100条,
            //insertList = insertList.slice(0, 21);
            async.mapSeries(
                insertList,
                function(item, callback) {
                    var insertSql = sprintf(INSERT_GOODSINFO_KEYS,customerDBName,item.GUID,item.UPDATEDATE);
                    //logger.sql(insertSql);
                    __mysql.query(insertSql, function(err, results) {
                        if(!err) {
                            //console.log('success insert goodsInfo');
                        }
                        if (Math.floor(i/insertList.length * 10) !== percent) {
                            percent = Math.floor(i / insertList.length * 10);
                            console.log('更新erpupdatedOn: ', insertList.length, percent * 10+ "%");
                        }
                        i++;
                        callback(err, results );
                    });
                },
                function(err, results) {
                    if(!err){
                        done(err,results);
                    }
                    console.log("更新完成. erpUpdatedOn字段:...");
                }
            );
        },
        /**
         * select 上次更新时间 小于 Erp更新时间的 guid
         */
        function (done){
            var SELECT_GOODSINFO_GUIDS = "SELECT guid FROM %s.GoodsInfo WHERE erpUpdatedOn > IFNULL(lastAsyncTime,0) ;"
            var sql = sprintf(SELECT_GOODSINFO_GUIDS,customerDBName);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                var guidAdd = underscore.pluck(result,'guid');
                guidlist=guidlist.concat(guidAdd);      // 得到一个需要拉取数据的商品 guid 的数组
                done(err,result);
            })

        }
    ],
    function(err,resultList){
        if(err){
            logger.error(err)
            cb(err);
        }else{
            cb(null,guidlist);
        }
    }
    );

};



ERPGoodsAsync.prototype.getBasicInfoDetails = function(guidlist,cb){
    var msgType="ASYNC_GOODSBASICINFO_DETAILS";
    var DETAIL_SIZE = 2;
    var getTimes = guidlist.length/DETAIL_SIZE+1;
    var ep = new EventProxy();
    ep.after('get_goods_details',getTimes,function(results){
        cb(null,results);
    });
    for(var i=1;i<=getTimes;i++) {
        var startIndex = DETAIL_SIZE * (i - 1); //开始下标
        var endIndex = i * DETAIL_SIZE;//结束下标
        var guids = guidlist.slice(startIndex, endIndex);
        var guidlistStr = "";
        underscore.each(guids, function (item) {
            guidlistStr += "'" + item + "',"
        });
        guidlistStr = guidlistStr.slice(0, -1);
        var data = {'GUID': guidlistStr};
        this.sendMsg(msgType, data, function (error, result) {
            if (error) {
                logger.error(error);
                cb(error);
                return;
            }
            var backResult = undefined;
           try{
               backResult = JSON.parse(result.data);
           }catch(err){
               logger.error(err);
               logger.debug(JSON.stringify(result));
               backResult={'YW_KCK':[]};
           }
           ep.emit('get_goods_details', backResult);
        })
    }
};


ERPGoodsAsync.prototype.batchInsertIntoGoodsInfo = function(dataList, cb) {
        var cloudDBName = this.cloudDBName;
        var enterpriseId = this.enterpriseId;
        var customerDBName = undefined;
        async.series([
                /**
                 * 通过enterpriseId,拿到customDBName
                 */
                function (done){
                var LIST_CUSTOMER_SUFFIX = " SELECT customerDBSuffix FROM %s.Customer WHERE id = %d;";
                var sql = sprintf(LIST_CUSTOMER_SUFFIX,cloudDBName,enterpriseId);
                __mysql.query(sql,function(err,result){
                    if(!err){
                        customerDBName = __customerDBPrefix+"_"+result[0].customerDBSuffix;
                        logger.debug("customerDB ="+customerDBName)
                    }
                    done(err,result);
                })
                },
                function (done){
                    async.mapSeries(dataList,
                    function(item,mapcallback){
                       var itemInfolist = item['YW_KCK'];
                        //console.log("没有按照批准文号过滤时数量:",itemInfolist.length);
                        // 去掉没有批准文号和货号的数据
                        itemInfolist = _.map(itemInfolist, function (item) {
                            if (_.isEmpty(item.PZWH) || _.isEmpty(item.HH)) {
                                return;
                            }
                            return item;
                        });
                        itemInfolist = _.compact(itemInfolist);
                        console.log("按照批准文号过滤后数量:",itemInfolist.length);
                       if(itemInfolist.length>0){
                           logger.debug(JSON.stringify(itemInfolist));
                           batchAddERPGoodsBasicInfo(customerDBName,itemInfolist,function(err, result){
                               mapcallback(err,result);
                           })
                       }else{
                           mapcallback();
                       }
                    },
                    function(err, results) {
                        done(err,results);
                    });
                }
            ],
            function(err,resultList){
                if(err){
                    logger.error(err)
                    cb(err);
                }else{
                    cb();
                }

            }
        );
};


function batchAddERPGoodsBasicInfo(DBName,goodsBasicInfo, callback){
    var goodsInfoList = [];
    var goodsGspInfoList = [];
    var goodsPriceInfoList = [];


    for(var i=0;i<goodsBasicInfo.length;i++) {

        var arrGoodsInfo = [];
        //用于GOODSINFO字段的默认值调整和导入值的映射关系调整
        arrGoodsInfo.push(goodsBasicInfo[i].GUID ? goodsBasicInfo[i].GUID : "NULL"); // guid,
        arrGoodsInfo.push(goodsBasicInfo[i].GHQY ? goodsBasicInfo[i].GHQY : goodsBasicInfo[i].GUID+i); //平台编码
        arrGoodsInfo.push(goodsBasicInfo[i].YPQK ? goodsBasicInfo[i].YPQK : 1); //换算关系
        arrGoodsInfo.push(goodsBasicInfo[i].HH ? goodsBasicInfo[i].HH : "NULL"); //货号 goodsNos
        arrGoodsInfo.push(goodsBasicInfo[i].TM ? goodsBasicInfo[i].TM : "NULL"); //条码 barcode,
        arrGoodsInfo.push(goodsBasicInfo[i].PM ? goodsBasicInfo[i].PM : "NULL"); //商品通用名称commonName,
        arrGoodsInfo.push(goodsBasicInfo[i].BM ? goodsBasicInfo[i].BM : ""); //别名Alias
        arrGoodsInfo.push(goodsBasicInfo[i].JX ? goodsBasicInfo[i].JX : "NULL"); //药剂类型DrugsType
        arrGoodsInfo.push(goodsBasicInfo[i].PZWH ? goodsBasicInfo[i].PZWH : ""); //批准文号licenseNo
        arrGoodsInfo.push(goodsBasicInfo[i].PZWHXQ ? goodsBasicInfo[i].PZWHXQ : "NULL"); //文号或备案号有效期限filingNumberValidDate
        arrGoodsInfo.push(goodsBasicInfo[i].GG ? goodsBasicInfo[i].GG : "NULL"); //规格spec
        arrGoodsInfo.push(goodsBasicInfo[i].GYS ? goodsBasicInfo[i].GYS : "NULL"); //供应商supplier

        arrGoodsInfo.push(goodsBasicInfo[i].CD?goodsBasicInfo[i].CD:"NULL");//产地birthPlace
        arrGoodsInfo.push(goodsBasicInfo[i].SCDW?goodsBasicInfo[i].SCDW:"NULL");//生产企业producer
        arrGoodsInfo.push(goodsBasicInfo[i].PDW?goodsBasicInfo[i].PDW:"NULL");//单位measureUnit
        arrGoodsInfo.push(goodsBasicInfo[i].LargePackUnit?goodsBasicInfo[i].LargePackUnit:"NULL");//大包装单位largePackUnit
        arrGoodsInfo.push(goodsBasicInfo[i].MJL?goodsBasicInfo[i].MJL:"NULL");//大包装量LargePackNum
        arrGoodsInfo.push(goodsBasicInfo[i].LargePackBarcode?goodsBasicInfo[i].LargePackBarcode:"NULL");//大包装条码LargePackBarcode
        arrGoodsInfo.push(goodsBasicInfo[i].MiddlePackUnit?goodsBasicInfo[i].MiddlePackUnit:"NULL");//中包装单位middlePackUnit
        arrGoodsInfo.push(goodsBasicInfo[i].ZBZL?goodsBasicInfo[i].ZBZL:"NULL");//中包装量middlePackNum
        arrGoodsInfo.push(goodsBasicInfo[i].MiddlePackBarcode?goodsBasicInfo[i].MiddlePackBarcode:"NULL");//中包装条码MiddlePackBarcode
        arrGoodsInfo.push(goodsBasicInfo[i].SmallPackUnit?goodsBasicInfo[i].SmallPackUnit:"NULL");//小包装单位SmallPackUnit

        arrGoodsInfo.push(goodsBasicInfo[i].SmallPackage?goodsBasicInfo[i].SmallPackage:"NULL");//小包装量SmallPackNum
        arrGoodsInfo.push(goodsBasicInfo[i].IsNebalance?goodsBasicInfo[i].IsNebalance:"NULL");//允许负库存销售NegSell
        arrGoodsInfo.push(goodsBasicInfo[i].FDeleted?goodsBasicInfo[i].FDeleted:"NULL");//禁用标志IsForbidden
        arrGoodsInfo.push(goodsBasicInfo[i].IsCancel?goodsBasicInfo[i].IsCancel:"NULL");//删除标志IsDeleted
        arrGoodsInfo.push(goodsBasicInfo[i].RJKSXBZ?goodsBasicInfo[i].RJKSXBZ:"NULL");//入库检查库存上线标志Ischeckstore
        arrGoodsInfo.push(goodsBasicInfo[i].ISCONTROLSELLSCOPE?goodsBasicInfo[i].ISCONTROLSELLSCOPE:"NULL");//需要控制销售范围标志IsAreaLimited
        arrGoodsInfo.push(goodsBasicInfo[i].AreaRangeDescibeId?goodsBasicInfo[i].AreaRangeDescibeId:"NULL");//区域范围描述AreaDesc
        arrGoodsInfo.push(goodsBasicInfo[i].UPDATEDATE?goodsBasicInfo[i].UPDATEDATE:"NULL");//最近更新时间UpdatedOn

        goodsInfoList.push(arrGoodsInfo);

        var arrGoodsGspInfo = [];
        //用于GOODSGSPINFO字段的默认值调整和导入值的映射关系调整
        arrGoodsGspInfo.push(goodsBasicInfo[i].GUID?goodsBasicInfo[i].GUID:"NULL");// guid,UNI
        arrGoodsGspInfo.push(goodsBasicInfo[i].GMPZSH?goodsBasicInfo[i].GMPZSH: "NULL");//GMP证书号gmpNumber
        arrGoodsGspInfo.push(goodsBasicInfo[i].GMPRZRQ?goodsBasicInfo[i].GMPRZRQ:"NULL");//GMP认证日期 gmpCertificationDate,
        arrGoodsGspInfo.push(goodsBasicInfo[i].GMPRZXQ?goodsBasicInfo[i].GMPRZXQ:"NULL");//GMP有效日期,gmpValidDate
        arrGoodsGspInfo.push(goodsBasicInfo[i].PZWH?goodsBasicInfo[i].PZWH:"NULL");// 批准文号或者器械注册备案号filingNumber
        arrGoodsGspInfo.push(goodsBasicInfo[i].PZWHXQ?goodsBasicInfo[i].PZWHXQ:"NULL");//文号或备案号有效期限filingNumberValidDate
        arrGoodsGspInfo.push(goodsBasicInfo[i].JKZCZH?goodsBasicInfo[i].JKZCZH:"NULL");//进口注册证号importRegisCertNum
        arrGoodsGspInfo.push(goodsBasicInfo[i].XKZQX?goodsBasicInfo[i].XKZQX:"NULL");//进口注册证期限importRegisCertNumValidDate

        arrGoodsGspInfo.push(goodsBasicInfo[i].XQ?goodsBasicInfo[i].XQ:"NULL");//药剂有效期DrugsValidDate
        arrGoodsGspInfo.push(goodsBasicInfo[i].CCTJ?goodsBasicInfo[i].CCTJ:"NULL");//存储条件storageCondition
        arrGoodsGspInfo.push(goodsBasicInfo[i].GSPSortID?goodsBasicInfo[i].GSPSortID:"NULL");//GSP类别GSPtype
        arrGoodsGspInfo.push(goodsBasicInfo[i].ZCSB?goodsBasicInfo[i].ZCSB:"NULL");//注册商标以及专利registeredTradeMarksAndPatents
        arrGoodsGspInfo.push(goodsBasicInfo[i].ZZQX?goodsBasicInfo[i].ZZQX:"NULL");//生产企业营业执照年检有效期businessLicenseValidDate
        arrGoodsGspInfo.push(goodsBasicInfo[i].YYZYXKZXQ?goodsBasicInfo[i].YYZYXKZXQ:"NULL");//器械生产许可证号instrumentProductionLicenseNum
        arrGoodsGspInfo.push(goodsBasicInfo[i].ZYX1?goodsBasicInfo[i].ZYX1:"NULL");//药监编码drugAdministrationEncoding
        arrGoodsGspInfo.push(goodsBasicInfo[i].MEDICALINSTRUMENTTYPE?goodsBasicInfo[i].MEDICALINSTRUMENTTYPE:"NULL");//医疗器械类别isMedicalApparatus
        arrGoodsGspInfo.push(goodsBasicInfo[i].YPBZ?goodsBasicInfo[i].YPBZ:"NULL");//药品标志IsMedicine
        arrGoodsGspInfo.push(goodsBasicInfo[i].JKPZBZ?goodsBasicInfo[i].JKPZBZ:"NULL");//进口标志IsImported
        arrGoodsGspInfo.push(goodsBasicInfo[i].ZYBZ?goodsBasicInfo[i].ZYBZ:"NULL");//中药饮片标志isHerbalDecoctioniieces
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISCHECKMEDIDEVICES?goodsBasicInfo[i].ISCHECKMEDIDEVICES:"NULL");//需检查医疗器械证标志isCheckMedicalInstrumentCert
        arrGoodsGspInfo.push(goodsBasicInfo[i].ZZRS_TAG?goodsBasicInfo[i].ZZRS_TAG:"NULL");//终止妊娠品标志isPregnancyRermination
        arrGoodsGspInfo.push(goodsBasicInfo[i].ZYC_TAG?goodsBasicInfo[i].ZYC_TAG:"NULL");//中药材标志IsHerbalMedicine
        arrGoodsGspInfo.push(goodsBasicInfo[i].FISGMP?goodsBasicInfo[i].FISGMP:"NULL");//含特药品标志IsContainSpecialContent
        arrGoodsGspInfo.push(goodsBasicInfo[i].SFCF?goodsBasicInfo[i].SFCF:"NULL");//是否处方药品标志IsPrescriptionDrugs
        arrGoodsGspInfo.push(goodsBasicInfo[i].FISYBPZ?goodsBasicInfo[i].FISYBPZ:"NULL");//医保药品标志isMedicalInsuranceDrugs
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISEGGPREPARATION?goodsBasicInfo[i].ISEGGPREPARATION:"NULL");//蛋白同化制剂标志isProteinasSimilationPreparation
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISEPHEDRINE?goodsBasicInfo[i].ISEPHEDRINE:"NULL");//含麻黄碱标志isContainEphedrine
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISTLHORMONE?goodsBasicInfo[i].ISTLHORMONE:"NULL");//含肽类激素标志IsContainPeptidehormone
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISTWOCLASSMENTALDRUG?goodsBasicInfo[i].ISTWOCLASSMENTALDRUG:"NULL");//二类精神药品标志IsSecondPsychotropicDrugs
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISMINDDRUG?goodsBasicInfo[i].ISMINDDRUG:"NULL");//一类精神药品标志IsFirstPsychotropicDrugs
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISDANGERCHEMISTRY?goodsBasicInfo[i].ISDANGERCHEMISTRY:"NULL");//危险化学品标志IsHazardousChemicals
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISANAESTHETIC?goodsBasicInfo[i].ISANAESTHETIC:"NULL");//麻醉药品标志isStupefacient
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISDIAGNOSTICREAGENT?goodsBasicInfo[i].ISDIAGNOSTICREAGENT:"NULL");//诊断试剂药品标志IsDiagnosticReagent
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISMEDICALTOXICITY?goodsBasicInfo[i].ISMEDICALTOXICITY:"NULL");//医疗用毒性品标志IsMedicalToxicity
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISSTIMULANT?goodsBasicInfo[i].ISSTIMULANT:"NULL");//含兴奋剂药品标志IsContainingStimulants
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISVACCINE?goodsBasicInfo[i].ISVACCINE:"NULL");//是否疫苗标志isVaccine
        arrGoodsGspInfo.push(goodsBasicInfo[i].IsHealthFoods?goodsBasicInfo[i].IsHealthFoods:"NULL");//麻醉药品标志isStupefacient
        arrGoodsGspInfo.push(goodsBasicInfo[i].ISFOOD?goodsBasicInfo[i].ISFOOD:"NULL");//麻醉药品标志isStupefacient
        goodsGspInfoList.push(arrGoodsGspInfo);


        var arrGoodsPriceInfo = [];
        //用于GOODSGSPINFO字段的默认值调整和导入值的映射关系调整
        arrGoodsPriceInfo.push(goodsBasicInfo[i].GUID?goodsBasicInfo[i].GUID:"NULL");// guid,UNI
        arrGoodsPriceInfo.push(goodsBasicInfo[i].PFJ?goodsBasicInfo[i].PFJ: 0);//商品批发价wholesalePrice
        arrGoodsPriceInfo.push(goodsBasicInfo[i].LSJ?goodsBasicInfo[i].LSJ:0);// 参考零售价,refRetailPrice
        arrGoodsPriceInfo.push(goodsBasicInfo[i].PFJ1?goodsBasicInfo[i].PFJ1:0);// 售价1,price1
        arrGoodsPriceInfo.push(goodsBasicInfo[i].LSJ1?goodsBasicInfo[i].LSJ1:0);//售价2,price2
        arrGoodsPriceInfo.push(goodsBasicInfo[i].SJ1?goodsBasicInfo[i].SJ1:0);//售价3,price3
        arrGoodsPriceInfo.push(goodsBasicInfo[i].GJXJ?goodsBasicInfo[i].GJXJ:0);//国家限价limitedPrice
        arrGoodsPriceInfo.push(goodsBasicInfo[i].BASEMATERIELRETAILPRICE?goodsBasicInfo[i].BASEMATERIELRETAILPRICE:0);//国家基药价basePrice
        arrGoodsPriceInfo.push(goodsBasicInfo[i].PROMANAGERETAILPRICE?goodsBasicInfo[i].PROMANAGERETAILPRICE:0);//省管基药价provinceBasePrice
        arrGoodsPriceInfo.push(goodsBasicInfo[i].BaseMaterielGuidePrice?goodsBasicInfo[i].BaseMaterielGuidePrice:0);//基药指导价guidedBasePrice
        goodsPriceInfoList.push(arrGoodsPriceInfo);

    }

    logger.debug(JSON.stringify(goodsInfoList));
    logger.debug(JSON.stringify(goodsGspInfoList));
    logger.debug(JSON.stringify(goodsPriceInfoList));
    var goodsId = undefined;
    async.series(
        [   //插入goodsinfo
            function (done){
                var insertGoodsInfosql = sprintf(" INSERT INTO %s.GoodsInfo " +
                    " (" +
                    "guid," +
                    "unicode," +
                    "packageQty," +
                    "goodsNo," +
                    "barcode," +
                    "commonName," +
                    "alias, " +
                    "drugsType," +
                    "licenseNo," +
                    "filingNumberValidDate," +
                    "spec," +
                    "supplier," +
                    "birthPlace," +
                    "producer," +
                    "measureUnit," +
                    "largePackUnit," +
                    "largePackNum," +
                    "largePackBarcode," +
                    "middlePackUnit," +
                    "middlePackNum," +
                    "middlePackBarcode," +
                    "smallPackUnit," +
                    "smallPackNum," +
                    "negSell," +
                    "isForbidden," +
                    "isDeleted," +
                    "isCheckStore," +
                    "areaDesc," +
                    "isAreaLimited," +
                    "   lastAsyncTime" +
                    " ) " +
                    " VALUES ? " +
                    " ON DUPLICATE KEY UPDATE " +
                    "   guid=VALUES(guid),unicode=VALUES(unicode),packageQty=VALUES(packageQty),goodsNo=VALUES(goodsNo),barcode=VALUES(barcode),commonName=VALUES(commonName)," +
                    "   alias=VALUES(alias),licenseNo=VALUES(licenseNo),drugsType=VALUES(drugsType),filingNumberValidDate=VALUES(filingNumberValidDate)," +
                    "   spec=VALUES(spec),supplier=VALUES(supplier),birthPlace=VALUES(birthPlace),producer=VALUES(producer)," +
                    "   measureUnit=VALUES(measureUnit),largePackUnit=VALUES(largePackUnit),largePackNum=VALUES(largePackNum)," +
                    "   largePackBarcode=VALUES(largePackBarcode),middlePackUnit=VALUES(middlePackUnit),middlePackNum=VALUES(middlePackNum)," +
                    "   middlePackBarcode=VALUES(middlePackBarcode),smallPackUnit=VALUES(smallPackUnit),smallPackNum=VALUES(smallPackNum)," +
                    "   negSell=VALUES(negSell),isForbidden=VALUES(isForbidden),isDeleted=VALUES(isDeleted)," +
                    "   isCheckStore=VALUES(isCheckStore),isAreaLimited=VALUES(isAreaLimited)," +
                    "   areaDesc=VALUES(areaDesc),lastAsyncTime=VALUES(lastAsyncTime);",
                    DBName);
                logger.sql(insertGoodsInfosql);
                var a = " (guid,unicode,packageQty,goodsNo,barcode,commonName,alias,licenseNo,filingNumberValidDate," +
                    "   spec,supplier,birthPlace,producer,measureUnit,largePackUnit,largePackNum," +
                    "   largePackBarcode,middlePackUnit,middlePackNum,middlePackBarcode,smallPackUnit," +
                    "   smallPackNum,negSell,isForbidden,isDeleted,isCheckStore,areaDesc,isAreaLimited," +
                    "   lastAsyncTime ) ";
                __mysql.query(insertGoodsInfosql,[goodsInfoList],function(err,result){
                    if (err) {
                        logger.error(err);
                        done(err);
                    } else {
                        console.log('sucess insert goodsinfos');
                        console.log(result);
                        goodsId = result.insertId;
                        done(null, result);
                    }
                });
            },
            //获取goodsId
            function(done){
                if(goodsId == 0){
                    var guid = goodsBasicInfo[0].GUID;
                    var sql = sprintf(" SELECT id From %s.GoodsInfo where guid = '%s';",DBName,guid);
                    logger.sql(sql);
                    __mysql.query(sql,function(err,result){
                       if(err){
                           logger.error(err);
                           done(err);
                       }else{
                           logger.debug(JSON.stringify(result));
                           goodsId = result[0].id;
                           done();
                       }
                    });
                }else{
                    done();
                }
            },
            //插入goodsgsp
            function (done){
                var insertGoodsGspsql = sprintf(" INSERT INTO %s.GoodsGsp " +
                    " (goodsId,guid,gmpNumber,gmpCertificationDate,gmpValidDate,filingNumber," +
                    "   filingNumberValidDate,importRegisCertNum,importRegisCertNumValidDate," +
                    "   drugsValidDate,storageCondition,gspType,registeredTradeMarksAndPatents," +
                    "   businessLicenseValidDate,instrumentProductionLicenseNum,drugAdministrationEncoding," +
                    "   isMedicalApparatus,isMedicine,isImported,isHerbalDecoctioniieces," +
                    "   isCheckMedicalInstrumentCert,isPregnancyRermination,isHerbalMedicine," +
                    "   isContainSpecialContent,isPrescriptionDrugs,isMedicalInsuranceDrugs," +
                    "   isProteinasSimilationPreparation,isContainEphedrine,isContainPeptidehormone," +
                    "   isSecondPsychotropicDrugs,isFirstPsychotropicDrugs,isHazardousChemicals," +
                    "   isStupefacient,isDiagnosticReagent,isMedicalToxicity,isContainingStimulants," +
                    "   isVaccine,isHealthProducts,isFood) " +
                    "VALUES ? " +
                    " ON DUPLICATE KEY UPDATE " +
                    "   goodsId=VALUES(goodsId),guid=VALUES(guid),gmpNumber=VALUES(gmpNumber)," +
                    "   gmpCertificationDate=VALUES(gmpCertificationDate),gmpValidDate=VALUES(gmpValidDate),filingNumber=VALUES(filingNumber)," +
                    "   filingNumberValidDate=VALUES(filingNumberValidDate),importRegisCertNum=VALUES(importRegisCertNum)," +
                    "   importRegisCertNumValidDate=VALUES(importRegisCertNumValidDate),drugsValidDate=VALUES(drugsValidDate)," +
                    "   storageCondition=VALUES(storageCondition),gspType=VALUES(gspType),registeredTradeMarksAndPatents=VALUES(registeredTradeMarksAndPatents)," +
                    "   businessLicenseValidDate=VALUES(businessLicenseValidDate),instrumentProductionLicenseNum=VALUES(instrumentProductionLicenseNum)," +
                    "   drugAdministrationEncoding=VALUES(drugAdministrationEncoding),isMedicalApparatus=VALUES(isMedicalApparatus)," +
                    "   isMedicine=VALUES(isMedicine),isImported=VALUES(isImported),isHerbalDecoctioniieces=VALUES(isHerbalDecoctioniieces)," +
                    "   isCheckMedicalInstrumentCert=VALUES(isCheckMedicalInstrumentCert),isPregnancyRermination=VALUES(isPregnancyRermination),isHerbalMedicine=VALUES(isHerbalMedicine)," +
                    "   isContainSpecialContent=VALUES(isContainSpecialContent),isPrescriptionDrugs=VALUES(isPrescriptionDrugs),isMedicalInsuranceDrugs=VALUES(isMedicalInsuranceDrugs)," +
                    "   isProteinasSimilationPreparation=VALUES(isProteinasSimilationPreparation),isContainEphedrine=VALUES(isContainEphedrine),isContainPeptidehormone=VALUES(isContainPeptidehormone)," +
                    "   isSecondPsychotropicDrugs=VALUES(isSecondPsychotropicDrugs),isFirstPsychotropicDrugs=VALUES(isFirstPsychotropicDrugs),isHazardousChemicals=VALUES(isHazardousChemicals)," +
                    "   isStupefacient=VALUES(isStupefacient),isDiagnosticReagent=VALUES(isDiagnosticReagent),isMedicalToxicity=VALUES(isMedicalToxicity),isContainingStimulants=VALUES(isContainingStimulants)," +
                    "   isVaccine=VALUES(isVaccine),isHealthProducts=VALUES(isHealthProducts),isFood=VALUES(isFood);",
                    DBName);
                logger.sql(insertGoodsGspsql);
                logger.debug("goodsId="+goodsId);
                goodsGspInfoList = underscore.map(goodsGspInfoList,function(item){
                    var goodsItem = [];
                    goodsItem.push(goodsId);
                    return goodsItem.concat(item);
                });
                logger.debug(JSON.stringify(goodsGspInfoList));
                __mysql.query(insertGoodsGspsql,[goodsGspInfoList],function(err,result){
                    if (err) {
                        logger.error(err);
                        done(err);
                    } else {
                        console.log('sucess insert goodsgsp');
                        console.log(result);
                        done(null, result);
                    }
                });
            },

            //插入goodsprice
            function (done){
                var insertGoodsPricesql = sprintf(" INSERT INTO %s.GoodsPrice " +
                    " (goodsId,guid,wholesalePrice,refRetailPrice,price1, " +
                    "   price2,price3,limitedPrice,basePrice,provinceBasePrice," +
                    "   guidedBasePrice) " +
                    "VALUES ? " +
                    " ON DUPLICATE KEY UPDATE " +
                    "   goodsId=VALUES(goodsId),guid=VALUES(guid),wholesalePrice=VALUES(wholesalePrice)," +
                    "   refRetailPrice=VALUES(refRetailPrice),price1=VALUES(price1), " +
                    "   price2=VALUES(price2),price3=VALUES(price3),limitedPrice=VALUES(limitedPrice)," +
                    "   basePrice=VALUES(basePrice),provinceBasePrice=VALUES(provinceBasePrice)," +
                    "   guidedBasePrice=VALUES(guidedBasePrice);",
                    DBName);
                logger.sql(insertGoodsPricesql);
                goodsPriceInfoList = underscore.map(goodsPriceInfoList,function(item){
                    var goodsItem = [];
                    goodsItem.push(goodsId);
                    return goodsItem.concat(item);
                });

                logger.debug(goodsPriceInfoList);
                __mysql.query(insertGoodsPricesql,[goodsPriceInfoList],function(err,result){
                    if (err) {
                        logger.error(err);
                        done(err);
                    } else {
                        console.log('sucess insert goodsPrice');
                        console.log(result);
                        done(null, result);
                    }
                });
            }

        ],
        function(err,resultList){
            if(err){
                logger.error(err);
                callback(err);
            }else{
                callback(null,resultList);
            }
        });

};


module.exports = ERPGoodsAsync;

