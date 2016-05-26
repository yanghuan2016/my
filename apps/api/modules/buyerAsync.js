var logger = __logService;
var db = __dbService;

var underscore = require("underscore");
var async = require("async");

var ErpAppCodeRobot = require(__base + "/modules/erpAppCodeRobot");
var ErpApiRobot = require(__base + "/modules/erpApiRobot");
var MsgRobot = require(__base + "/modules/msgRobot");

var msgRobot = new MsgRobot(md5Calibrator);

// 构造器
function Buyer(enterpriseId, cloudDbName) {
    this.enterpriseId = enterpriseId.toUpperCase();
    this.cloudDbName = cloudDbName || __cloudDBName;
}

// 实例方法
Buyer.prototype.asyncSellers = function (appCodeRobot) {
    var erpAppKey = null;
    var erpAppcodeUrl = null;
    var self = this;

    // 发送请求要用到的数据
    var erpUrl = null;
    var msgType = 'SELLER_ALL';
    var msgData = {};

    var enterpriseId = this.enterpriseId;
    var cloudDbName = this.cloudDbName;
    var dbService = null;
    var redisService = null;
    var version = '1';
    var erpApiRobot = new ErpApiRobot(erpUrl);


    // 可以写一个ErpAppCodeRobot (enterpriseId, mysqlConn, redisConn), 专门用来获取AppCode,
    var erpAppCodeRobot = new ErpAppCodeRobot(cloudDbName, dbService, redisService);

    erpAppCodeRobot.getAppCode(enterpriseId, function getAppCodeCallback(error, appCode, ttl) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        getEnterpriseType(enterpriseId, cloudDbName, function (error, enterpriseType) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            msg = msgRobot.generateMsg(version, enterpriseType, enterpriseId, msgType, appCode, msgData);
            erpApiRobot.sendMsg(msg, function sendMsgCallback(error, feedback) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                if(feedback.data.sellers){
                    self.updateSeller(feedback.data.sellers);
                }else{
                    logger.error("feedback err");
                    return callback(error);
                }



            });
        });
    });
};

Buyer.prototype.getDbName = function (callback) {
    logger.enter();
    var enterpriseId = this.enterpriseId;
    var cloudDb = this.cloudDbName;
    db.customerRetrieveDbName(enterpriseId, cloudDb, function (error, customerDBSuffix) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, __customerDBPrefix + customerDBSuffix);
    });
};

Buyer.prototype.getBusinessLicense = function (callback) {
    logger.enter();
    var enterpriseId = this.enterpriseId;
    var cloudDb = this.cloudDbName;
    db.customerRetrieveBusinessLicense(enterpriseId, cloudDb, function (error, businessLicense) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, businessLicense);
    });
};

var getEnterpriseType = function (enterpriseId, cloudDbName, callback) {
    logger.enter();
    db.customerRetrieveUserType(enterpriseId, cloudDbName, function (error, enterpriseType) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, enterpriseType);
    });
};

// 上来的seller数据
//var sellers = [
//    {businessLicense
//        GUID: 5001,                 // 内码
//        TJBH: '12345',              // 供应商编码
//        MC: '神木药业',             // 供应商名称
//        FDELETED: true,             // 禁用标志
//        YYZZ: '',                   // 营业执照号
//        ZZQX: '',                   // 执照日期
//        ADDR: '',                   // 营业地址
//        FRDB: '',                   // 法人代表
//        UPDATEDATE: ''              // ERP传
//    },
//    {
//        GUID: 5001,                 // 内码
//        TJBH: '12345',              // 供应商编码
//        MC: '神木药业',             // 供应商名称
//        FDELETED: true,             // 禁用标志
//        YYZZ: '',                   // 营业执照号
//        ZZQX: '',                   // 执照日期
//        ADDR: '',                   // 营业地址
//        FRDB: '',                   // 法人代表
//        UPDATEDATE: ''              // ERP传
//    }
//];
Buyer.prototype.updateSeller = function (sellers, callback) {
    logger.enter();
    var self = this;

    self.getDbName(function (error, corporateDbName) {
        logger.enter();

        var arrNewSeller = underscore(sellers).map(function (item) {
            var temp = [];
            temp.push(item.FDELETED);
            temp.push(item.TJBH);
            temp.push(item.YYZZ.toUpperCase());
            temp.push(item.UPDATEDATE);
            return temp;
        });

        // 用 on duplicate 的方法更新 buyer 的 sellerInfo 表.
        db.sellerInsertUpdate(corporateDbName, arrNewSeller, function (error, insertUpdateResult) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            // 拿到ERP上传的被禁用的供应商的营业执照数组
            var disabledSellers = underscore(sellers).filter(function (item) {
                return item.FDELETED;
            });
            var disabledBusinessLicenses = underscore(disabledSellers).map(function (item) {
                return item.YYZZ.toString().toUpperCase();
            });

            // 访问cloudDb.customer表拿到一组数据库名字,
            db.customerRetrieveByBusinessLicense(self.cloudDbName, disabledBusinessLicenses, function (error, disabledSellerDbNames) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                // 将拿到的数据[{businessLicense:'', customerDBSuffix:''}]转化成 数据库名字数组
                disabledSellerDbNames(disabledSellerDbNames).map(function (item) {
                    return __customerDBPrefix + item.customerDBSuffix;
                });


                self.getBusinessLicense(function (error, businessLicense) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    // 访问每个数据库, 在buyer表中将对应的businessLicense禁用
                    self.disableBuyerFromSellerDbs(disabledSellerDbNames, businessLicense, function (error, disableResult) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }

                        callback(null, disableResult);
                    })
                });
            });
        });
    });
};

Buyer.prototype.disableBuyerFromSellerDbs = function (disabledSellerDbNames, buyerBusinessLicense, callback) {
    logger.enter();

    db.beginTrans(function (connection) {
        async.mapSeries(disabledSellerDbNames, function (sellerDbName, mapCallback) {
            logger.enter();

            db.BuyerUpdateDisableBusinessLicense(sellerDbName, buyerBusinessLicense, function (error, result) {
                if (error) {
                    logger.error(error);
                    return mapCallback(error);
                }
                mapCallback(null, result);
            });

        }, function (error, results) {
            if (error) {
                logger.error(error);
                return db.rollbackTrans(connection, function () {
                    callback(error);
                });
            }
            db.commitTrans(connect, function () {
                callback(null, results);
            });
        });
    })
};

module.exports = Buyer;
