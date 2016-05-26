var logger = __logService;
var db = __dbService;
var redisCli = __redisClient;

var underscore = require('underscore');
var moment = require('moment');
var crypto = require("crypto");
var md5 = require('js-md5');

var Md5Calibrator = require(__base +"/modules/md5Calibrator");
var md5Calibrator = new Md5Calibrator(md5);
var async = require('async');

var MsgRobot = require(__base + "/modules/msgRobot");
var msgRobot = new MsgRobot(md5Calibrator);
var ApiRobot = require(__base + "/modules/apiRobot");
var isErpMsgCheckStrict = __isErpMsgCheckStrict;
var version = __erpApiVersion;
var redis_TTL_AppCode = 600;

function ApiModel(db) {
}


/**
 *  goods inquiry
 * @param erpmsg
 * @param cloudDBName
 * @param userId
 * @param callback
 */
ApiModel.prototype.goodsInquiry = function(erpmsg,cloudDBName,userId,callback){
    logger.debug(JSON.stringify(erpmsg));
    logger.debug(cloudDBName);
    logger.debug(userId);

    var buyerInquiryId = undefined;
    var sellerInquiryId = undefined;
    var licenseNo = undefined;
    var buyerDBName = undefined;
    var sellerDBName = undefined;
    var notInGoodsInfo = undefined;
    var notFoundSeller = undefined;
    var sellerPackageQty = undefined;
    var sellerId = undefined;
    var buyerInfo = {};
    var sellerInfo = {};
    var errMsg = "";
    //msg content
    var erpguid = erpmsg.GUID;
    var erpBillNo = erpmsg.BILLNO;
    var goodsNo = erpmsg.MATERIELCODE;
    var unicode = erpmsg.PLATFORMCODE;
    var buyerPackageQty = erpmsg.CONVERSION;
    var sellerCode = erpmsg.SUPPLIERCODE;
    var purchaseset = erpmsg.PURCHASEUPSET;
    var balancePeriod = erpmsg.BALANCEPERIOD;
    var lastErpPrice = erpmsg.UNITPRICETAX;
    var planQuantity = erpmsg.PLANQUANTITY;
    db.beginTrans(function (connect) {
        async.series(
            [
                /**
                 * step1.1 根据userId匹配出customerDBName
                 * @param cb
                 */
                    function (cb) {
                    db.getBuyerOrSellerInfoById(connect, cloudDBName, userId, function (err, results) {
                        if (err) {
                            var errmsg = "userId=" + userId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                            cb(errmsg)
                        } else {
                            buyerInfo = results[0];
                            var dbSuffix = results[0].dbSuffix;
                            buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                            logger.debug("buyerCustomerDB=" + buyerDBName);
                            cb();
                        }
                    });

                },
                /**
                 * step1.2 根据unicode covert packageQty
                 * @param cb
                 */
                function (cb) {
                    db.getPackageQty(connect,buyerDBName,unicode,function(err,result){
                        if(!err&&result.length >0){
                             var packageQty = result[0].packageQty;
                             if(Number(packageQty)!=Number(buyerPackageQty)){
                                 errMsg += "商品换算关系和ERP同步数据不一致";
                                 if(underscore.isNull(buyerPackageQty)){
                                     buyerPackageQty = 1;
                                 }
                                 logger.error(errMsg);
                             }
                        }
                        if(!err&&result.length ==0){
                            errMsg += "unicode = "+unicode +"buyer找不到对应的goods";
                            logger.error(errMsg);
                            unicode = "NO_MATCH_"+goodsNo+"_"+moment();
                        }
                        cb(null,result);
                    })

                },
                /**
                 * step2 根据ERP上传的erpcode对应的供货方id
                 * @param cb
                 */
                    function (cb) {
                    db.getSellerIdByErpCode(connect, buyerDBName, sellerCode, function (err, result) {
                        if (err) {
                            cb(err);
                        }
                        logger.debug(JSON.stringify(result));
                        if(result.length==0){
                            sellerId = Number(sellerCode+"_"+moment());
                            logger.error("数据库缺少对应"+sellerCode+"的seller数据"+"sellerId ="+sellerId);
                            notFoundSeller = true;
                            cb();
                        }else{
                            sellerId = result[0].enterpriseId;
                            notFoundSeller =false;
                            cb(null,result);
                        }
                    })
                },

                /**
                 * step3 根据sellerId，取出对应seller信息
                 * @param cb
                 */
                    function (cb) {
                    if(notFoundSeller){
                        cb();
                    }else {
                        logger.debug("seller enterpriesId="+sellerId);
                        db.getBuyerOrSellerInfoById(connect, cloudDBName, sellerId, function (err, result) {
                            if (!err) {
                                if (result.length == 0) {
                                    cb("没有取到对应的sellerinfo");
                                } else {
                                    sellerInfo = result[0];
                                    logger.debug("sellerinfo=" + JSON.stringify(sellerInfo));
                                    sellerDBName = __customerDBPrefix + "_" + sellerInfo.dbSuffix;
                                    cb(null, sellerInfo);
                                }
                            }else{
                                cb(err);
                            }

                        })
                    }
                },

                /**
                 * step4.0 根据ERP上传货号匹配出buyer licenseNo by goodsNo
                 * @param cb
                 */
                    function (cb) {
                    db.getlicenseNoByGoodsNo(connect, buyerDBName, goodsNo, function (err, result) {
                        if (!err) {
                            if(result.length == 0){
                                licenseNo = "NOTFOUND_"+goodsNo+"_"+moment();
                                var error = goodsNo+"找不到对应货号"+"HARD CODE licenseNo="+licenseNo;
                                logger.error(error);
                                notInGoodsInfo = true;
                                cb();
                            }else{
                                logger.debug("licenseNo=" + result[0].licenseNo);
                                licenseNo = result[0].licenseNo;
                                notInGoodsInfo = false;
                                cb(err, result);
                            }
                        }else{
                            cb(err);
                        }
                    })

                },

                /**
                 * step4.1 根据以上信息生成buyer询价单信息，如果已经生成了，取出该ID
                 */
                    function (cb) {
                        var tableName = "BuyerInquiry";
                        db.insertInquiry(connect, buyerDBName, tableName,erpguid, function (err, result) {
                            if (!err) {
                                buyerInquiryId = result.insertId;
                                logger.debug("buyer inquiryId = " + buyerInquiryId);
                                cb(null, buyerInquiryId);
                            }else{
                                logger.debug("erpguid = " + erpguid+"已经生成过inquiryId");
                                db.getInquiryId(connect,buyerDBName,tableName,erpguid,function(err,result){
                                    if(!err){
                                        buyerInquiryId = result.id;
                                    }
                                    cb(err, buyerInquiryId);
                                });
                            }
                        })
                },

                /**
                 * step4.2 根据以上信息生成seller询价单信息，如果已经生成了，取出该ID
                 */
                    function (cb) {
                    if(notFoundSeller){
                        logger.debug("NOT FOUND SELLER DB , INSERT SELLER INQUIRY FAIL");
                        cb();
                    }else{
                        var tableName = "SellerInquiry";
                        db.insertInquiry(connect, sellerDBName, tableName,erpguid, function (err, result) {
                            if (!err) {
                                sellerInquiryId = result.insertId;
                                logger.debug("seller inquiryId = " + sellerInquiryId);
                                cb(null, sellerInquiryId);
                            }else{
                                logger.debug("erpguid = " + erpguid+"已经生成过inquiryId");
                                db.getInquiryId(connect,sellerDBName,tableName,erpguid,function(err,result){
                                    if(!err){
                                        sellerInquiryId = result.id;
                                    }
                                    cb(err, sellerInquiryId);
                                });
                            }
                        })
                    }
                },

                /**
                 * step5.1 根据以上信息生成buyer询价详情
                 * @param cb
                 */
                    function (cb) {
                        var tableName = "BuyerInquiryDetails";
                        db.addInquiryDetails(connect, buyerDBName,tableName,
                            buyerInquiryId, unicode,buyerPackageQty,erpBillNo,
                            licenseNo, lastErpPrice,sellerId,
                            planQuantity, purchaseset, balancePeriod, function (err, result) {
                                logger.debug("add buyer inquiryDetails=" + JSON.stringify(result));
                                cb(err, result);
                        })

                },
                /**
                 * step5.2 根据unicode covert packageQty
                 * @param cb
                 */
                    function (cb) {
                        if( notFoundSeller){
                            logger.debug("NOT FOUND SELLER DB , CONVERT  SELLER PACKAGEQTY  FAIL");
                            cb();
                        }else {
                            db.getPackageQty(connect,sellerDBName,unicode,function(err,result){
                                if(!err&&result.length >0){
                                    sellerPackageQty = result[0].packageQty;
                                }
                                if(!err&&result.length ==0){
                                    logger.error("unicode = "+unicode +"找不到对应的goods");
                                    errMsg += "unicode = "+unicode +"找不到对应的goods";
                                }
                                cb(null,result);
                            })
                        }
                    },

                /**
                 * step5.3 根据以上信息生成seller询价详情
                 * @param cb
                 */
                    function (cb) {
                    if(notFoundSeller||underscore.isUndefined(sellerPackageQty)){
                        logger.debug("NOT FOUND SELLER DB OR SELLER PACKAGETQTY, INSERT  SELLER INQUIRY DETAILS  FAIL");
                        cb();
                    }else {
                        var tableName = "SellerInquiryDetails";
                        var sellerPlanQuantity = (planQuantity*buyerPackageQty/sellerPackageQty).toFixed(4);
                        var sellerlastErpPrice = (lastErpPrice*planQuantity/sellerPlanQuantity).toFixed(4);
                        var sellerPurchaseset = (purchaseset*planQuantity/sellerPlanQuantity).toFixed(4);
                        db.addInquiryDetails(connect, sellerDBName,tableName,
                            sellerInquiryId,  unicode,sellerPackageQty,erpBillNo,licenseNo, sellerlastErpPrice,userId,
                            sellerPlanQuantity, sellerPurchaseset, balancePeriod,
                            function (err, result) {
                                logger.debug("add seller inquiryDetails=" + JSON.stringify(result));
                                cb(err, result);
                            })
                    }
                },
                /**
                 * 6.1add buyer count for inquiry
                 * @param cb
                 */
                function(cb){
                    var objectSide = "BUYER";
                    db.selectInquiryCount(connect,buyerDBName,objectSide,buyerInquiryId,function(err,results){
                       if(err){
                           cb(err);
                       } else{
                           if(results.length ==0 ){

                               db.putInquiryCountData(connect,buyerDBName, buyerInquiryId,objectSide, function (err, result) {
                                   cb(err, result);
                               })
                           }else{
                               cb();
                           }
                       }
                    });
                },
                /**
                 * 6.2add seller count for inquiry
                 * @param cb
                 */
                function(cb){
                    if(notFoundSeller){
                        cb();
                    }else{
                        var objectSide = "SELLER";
                        db.selectInquiryCount(connect,sellerDBName,objectSide,sellerInquiryId,function(err,results){
                            if(err){
                                cb(err);
                            } else{
                                if(results.length ==0 ){

                                    db.putInquiryCountData(connect,sellerDBName, sellerInquiryId,objectSide,function (err, result) {
                                        cb(err, result);
                                    })
                                }else{
                                    cb();
                                }
                            }
                        });

                    }
                }
            ],
            function (err, resultList) {
                if (err) {
                    logger.debug("Rollback the transaction");
                    logger.error(err);
                    db.rollbackTrans(connect, function (error) {
                        callback(err);
                    });
                }
                else {
                    logger.debug("Commit the transaction");
                    db.commitTrans(connect, function () {
                        logger.debug("buyer inquiryId=" + buyerInquiryId);
                        logger.debug("seller inquiryId=" + sellerInquiryId);
                        logger.debug("err msg=" +errMsg);
                        callback(null, buyerInquiryId);

                    });
                }
            }
        )
    });
};


ApiModel.prototype.retrieveCustomerAppKey = function(cloudDb, enterpriseId, appKey,callback){
    db.retrieveCustomerAppKey(cloudDb, enterpriseId, appKey, function (error, result) {
        callback(error,result);
    });
};


ApiModel.prototype.restoreErpMsgIn = function (userId, data,isValidMsg, callback) {
   logger.enter();
    var msgType = data.msg.msgType;
    var isEDIMsg = msgType.indexOf("EDI")>-1;
    var insertData = {
        version : data.msg.version,
        msgId   : data.msg.msgId,
        msgType : msgType,
        isEDIMsg: isEDIMsg,
        appCodeValidity:isValidMsg,
        msgData : JSON.stringify(data.msg.msgData),
        enterpriseId : data.userId
    };
    var customerDB = "";
    db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,userId,function(err,result){
        customerDB=__customerDbPrefix+"_"+result[0].dbSuffix;
        logger.debug("restoreErpMsgIn insertdata="+JSON.stringify(insertData));
        db.insertErpMsgIn(customerDB,insertData,function(err,results){
            callback(err,results);
        });
    });
};


ApiModel.prototype.generateAppCode = function (userId, userType, appKey) {
    var appCode = msgRobot.generateAppCode(appKey);

    var key = "ERP.appCode." + userId;
    redisCli.set(key, appCode);
    redisCli.expire(key, redis_TTL_AppCode);
    return appCode;
};

// 根据企业id查询appcode
ApiModel.prototype.retrieveAppCode = function (userId, callback) {
    var key = "ERP.appCode." + userId;

    redisCli.get(key, function(error, appCode){
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, appCode);
    });
};

// 用于保存erp过来的msg对象, 暂时没有被调用
ApiModel.prototype.saveMsg = function (dbName, userId, userType, msgRoute, handleStatus, msg, callback) {
    var dbName = dbName;
    var userId = userId;
    var userType = userType;
    var version = msg.version;
    var msgId = msg.msgId;
    var msgType = msg.msgType;
    var msgData = JSON.stringify(msg.msgData);
    var msgRoute = msgRoute;
    var handleStatus = handleStatus;

    db.createErpMsg(dbName, userId, userType, version, msgId, msgType, msgData, msgRoute, handleStatus, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        logger.trace(result);
        callback(null, result);
    });
};



/**
 * @deprecated
 * 将询价单存入数据库
 * @param erpmsg
 * @param cloudDBName
 * @param userId
 * @param callback
 */
ApiModel.prototype.goodsQuotationOld = function(erpmsg,cloudDBName,userId,callback){
    logger.debug(JSON.stringify(erpmsg));
    logger.debug(cloudDBName);
    logger.debug(userId);
    var inquiryId = undefined;
    var licenseNo = undefined;
    var sellerId= undefined;
    var buyerInfo = {};
    var sellerInfo = {};
    var erpguid = erpmsg.GUID;
    var goodsNo = erpmsg.MATERIELCODE;
    var unicode = erpmsg.SKUNO;//todo replaced by erp doc
    var packageQty = erpmsg.PACKAGEUNIT;//todo replaced by erp doc
    var sellerCode = erpmsg.SUPPLIERCODE;
    var purchaseset = erpmsg.PURCHASEUPSET;
    var balancePeriod = erpmsg.BALANCEPERIOD;
    var lastErpPrice = erpmsg.UNITPRICETAX;
    var planQuantity = erpmsg.PLANQUANTITY;
    var customerDBName = undefined;
    var notInGoodsInfo = undefined;
    var notFoundSeller = undefined;
    db.beginTrans(function (connect) {
        async.series(
            [

                /**
                 * step0 根据userId匹配出customerDBName
                 * @param cb
                 */
                function (cb) {
                    db.getBuyerOrSellerInfoById(connect, cloudDBName, userId, function (err, results) {
                        if (err) {
                            var errmsg = "userId=" + userId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                            cb(errmsg)
                        } else {
                            buyerInfo = results[0];
                            var dbSuffix = results[0].dbSuffix;
                            customerDBName = __customerDBPrefix + "_" + dbSuffix;
                            logger.debug("buyerCustomerDB=" + customerDBName);
                            cb();
                        }
                    });

                },

                /**
                 * step1 根据ERP上传货号匹配出licenseNo
                 * @param cb
                 */
                function (cb) {
                    db.getlicenseNoByGoodsNo(connect, customerDBName, goodsNo, function (err, result) {
                        if (!err) {
                            if(result.length == 0){
                                var error = "找不到对应货号"+goodsNo;
                                logger.error(error);
                                notInGoodsInfo = true;
                                cb();
                            }else{
                                logger.debug("licenseNo=" + result[0].licenseNo);
                                licenseNo = result[0].licenseNo;
                                notInGoodsInfo = false;
                                cb(err, result);
                            }
                        }else{
                            cb(err);
                        }
                    })

                },
                /**
                 * step2 根据ERP上传的客户营业执照匹配对应的GoodsSeller供货方id
                 * @param cb
                 */
                function (cb) {
                    if(notInGoodsInfo){
                        cb();
                    }else{
                        db.getSellerIdByErpCode(connect, customerDBName, sellerCode, function (err, result) {
                            if (err) {
                                cb(err);
                            }
                            logger.debug(JSON.stringify(result));
                            if(result.length==0){
                                logger.error("数据库缺少对应"+sellerCode+"的seller数据");
                                notFoundSeller = true;
                            }else{
                                sellerId = result[0].enterpriseId;
                                notFoundSeller =false;
                                cb(null,result);
                            }
                        })
                    }

                },
                /**
                 * step3 根据以上信息生成询价单信息，如果已经生成了，只是更新
                 */
                function (cb) {
                    logger.debug('erpguid ='+erpguid);
                    if(notInGoodsInfo || notFoundSeller){
                        cb();
                    }else{
                        db.addInquiry(connect, customerDBName, erpguid, function (err, result) {
                            if (!err) {
                                inquiryId = result.insertId;
                                logger.debug("inquiryId = " + inquiryId);
                                if(inquiryId==0){
                                    db.getInquiryId(connect,customerDBName,erpguid,function(err,result){
                                        if(!err){
                                            inquiryId = result.id;
                                            cb(err, inquiryId);
                                        }
                                    })
                                }else{
                                    cb(err, inquiryId);
                                }
                            }
                        })
                    }
                },

                /**
                 * step4 根据以上信息生成询价详情
                 * @param cb
                 */
                 function (cb) {
                    if(notInGoodsInfo || notFoundSeller){
                        cb();
                    }else {
                        logger.debug("licenseNo="+licenseNo);
                        db.addInquiryDetails(connect, customerDBName,
                            inquiryId, licenseNo, lastErpPrice,sellerId,
                            planQuantity, purchaseset, balancePeriod,
                            function (err, result) {
                                logger.debug("add inquiryDetails=" + JSON.stringify(result));
                                cb(err, result);
                            })
                    }
                 },
                /**
                 * step5 根据sellerId，取出对应seller信息
                 * @param cb
                 */
                function (cb) {
                    if(notInGoodsInfo || notFoundSeller){
                        cb();
                    }else {
                        logger.debug("seller enterpriesId="+sellerId);
                        db.getBuyerOrSellerInfoById(connect, cloudDBName, sellerId, function (err, result) {
                            if (!err) {
                                if (result.length == 0) {
                                    cb("没有取到对应的sellerinfo");
                                } else {
                                    sellerInfo = result[0];
                                    logger.debug("sellerinfo=" + JSON.stringify(sellerInfo));
                                }

                            }
                            cb(err, sellerInfo);
                        })
                    }
                },
                /**
                 * step6 根据userId，取出对应buyer信息
                 * @param cb
                 */
                    function (cb) {
                    if(notInGoodsInfo || notFoundSeller){
                        cb();
                    }else {
                        logger.debug("buyer enterpriesId="+userId);
                        db.getBuyerOrSellerInfoById(connect, cloudDBName, userId, function (err, result) {
                            if (!err) {
                                if (result.length == 0) {
                                    cb("没有取到对应的buyerinfo");
                                } else {
                                    buyerInfo = result[0];
                                    logger.debug("buyerinfo=" + JSON.stringify(buyerInfo));
                                }

                            }
                            cb(err, buyerInfo);
                        })
                    }
                },
                /**
                * step7 根据以上信息在SELLER数据库生成报价详情表
                * @param cb
                */
                function(cb){
                    if(notInGoodsInfo || notFoundSeller){
                        cb();
                    }else {
                        if (buyerInfo.enabled == 1&&sellerInfo.enabled == 1) {
                            var sellerDBName = __customerDBPrefix + "_" + sellerInfo.dbSuffix;
                            var customerName = buyerInfo.buyerName;
                            logger.debug("customerName=" + customerName);
                            db.addQuotataion(
                                connect,
                                sellerDBName, inquiryId, userId,
                                customerName, licenseNo, lastErpPrice,
                                planQuantity, balancePeriod,
                                function (err, result) {
                                    if (!err) {
                                        logger.debug("quotationId=" + JSON.stringify(result));
                                        var quotationId = result.insertId;
                                    }
                                    cb(err, quotationId);
                                })

                        } else {
                            logger.debug("buyerInfo or sellerInfo diabled");
                            cb();
                        }
                    }
                }


            ],
            function (err, resultList) {
                if (err) {
                    logger.debug("Rollback the transaction");
                    logger.error(err);
                    db.rollbackTrans(connect, function (error) {
                        callback(err);
                    });
                }
                else {
                    logger.debug("Commit the transaction");
                    db.commitTrans(connect, function () {
                        logger.debug("inquiryId=" + inquiryId);
                        if(notInGoodsInfo || notFoundSeller){
                            callback();
                        }else {
                            callback(null, inquiryId);
                        }
                    });
                }
            }
        )
    });
};

/**
 *
 *  @deprecated
 * 接收到询价单后转成报价单,  scc --> 报价方
 * @param cloudDBName
 * @param userId
 * @param inquiryId
 * @param callback
 */
ApiModel.prototype.sendQuotation = function(cloudDBName,userId,inquiryId,callback){

    var customerDBName = undefined;
    db.getBuyerOrSellerInfoById(__mysql, cloudDBName, userId, function (err, results) {
        if (err) {
            var errmsg = "userId=" + userId + "get CUSTOMER_DB ERR";
            callback(errmsg)
        } else {
            var dbSuffix = results[0].dbSuffix;
            customerDBName = __customerDBPrefix + "_" + dbSuffix;
            logger.debug("buyerCustomerDB=" + customerDBName);
            //step1 find all inquiryInfo by
            var isSendSuccess= undefined;
            db.listInquiryDetailsById(customerDBName,inquiryId,function(err,result){
                //step2 通过listGroupBy转换为根据传入的属性字段重新排列的数组
                var quotationList = listGroupBy(result,"sellerId");
                logger.debug(JSON.stringify(quotationList));
                async.mapSeries(quotationList,
                    function(quotationItem,mapCallback){
                        var sellerId = quotationItem.sellerId;
                        var quotationInfo = quotationItem.itemInfo;

                        //step3 通过ERP接口发送到ERP端
                        var msgType = "INQUIRY_CREATED";
                        var msgData = {
                            sellerId : sellerId,
                            quotationInfo : quotationInfo
                        };
                        var apiRobot = new ApiRobot(cloudDBName, db, redisCli, isErpMsgCheckStrict, version);
                        apiRobot.sendMsg(sellerId, msgType, msgData,  function sendMsgCallback(error, result) {
                            if (error) {
                                logger.error(error);
                                isSendSuccess =false;
                            }else{
                                isSendSuccess = true;
                            }
                            mapCallback();
                        });
                    },
                    function(err,results){
                        if (err) {
                            logger.error(err);
                            callback(err);
                        }else{
                            if(isSendSuccess){
                                callback(null,"OK")
                            }else{
                                callback(null,"FAIL");

                            }
                        }
                    });

            });
        }
    });

};

/**
 *  @deprecated
 *   scc --> 询价方的 汇总的报价单
 * @param cloudDBName
 * @param userId
 * @param msg
 * @param callback
 */
ApiModel.prototype.returnQuotationResult = function(cloudDBName,userId,callback) {
    var sellerId = userId;
    var buyerDBName = undefined;
    var buyerInfo = undefined;
    var sellerInfo = undefined;
    var sellerId = msg.sellerId;

    db.beginTrans(function (connect) {
        async.series(
            //step1 根据返回数据写入报价单数据库中
            [

                function (cb) {
                    db.getBuyerOrSellerInfoById(connect, cloudDBName,  userId, function (err, result) {
                        if (!err) {
                            if(result.length==0){
                                cb("cloudDb没有渠道对应id的企業信息id="+userId);
                            }else{
                                buyerInfo = result[0];
                                logger.debug("buyerInfo=" + JSON.stringify(buyerInfo));
                                var dbSuffix = results[0].dbSuffix;
                                customerDBName = __customerDBPrefix + "_" + dbSuffix;
                                cb(err, buyerInfo);
                            }
                        }
                    });
                },
                function (cb) {
                    db.getBuyerOrSellerInfoById(connect, cloudDBName,  sellerId, function (err, result) {
                        if (!err) {
                            if(result.length==0){
                                cb("cloudDb没有渠道对应id的企業信息id="+sellerId);
                            }else{
                                sellerInfo = result[0];
                                logger.debug("sellerInfo=" + JSON.stringify(sellerInfo));
                                cb(err, sellerInfo);
                            }
                        }
                    });
                },
                //更新报价详情
                function (cb) {
                    var sellerDBName = __customerDBPrefix + "_" + sellerInfo.dbSuffix;
                    db.updateQuotationResult(connect, sellerDBName, msg.goods, function (err, result) {
                        cb(err, result);
                    })
                }
            ],
            function (err, result) {
                if (err) {
                    logger.error(err);
                    logger.debug("Rollback the transaction");
                    logger.debug("更新sellerid=" + sellerId + "报价单数据失败");
                    db.rollbackTrans(connect, function (error) {
                        callback(err);
                    });
                } else {
                    logger.debug("Commit the transaction");
                    db.commitTrans(connect, function () {
                        logger.debug("更新sellerid=" + sellerId + "报价单数据成功");
                        //step2 重新组织数据 按selllerId发送数据
                        sendQuotationResult(cloudDBName,sellerInfo,msg,function(err,result){
                            logger.debug("向询价ERP发送报价结果"+err+result);
                            callback(err,result);
                        });
                    });
                }
            }
        );
    });
};
/**
 * send quotation result for web quotation
 * @param quotations
 * @param callback
 */
ApiModel.prototype.webQuotationResult = function(quotations,sellerId,callback){
    logger.enter();
    var index = -1;
    async.mapSeries(
        quotations,
        function(item,mapCallback){
            index++;
            var inquiryId = item.inquiryId;
            var buyerId = item.buyerId;
            var unicode= item.unicode;
            var LSH = creatLSH(inquiryId,buyerId,index);
            var buyerDBName,sellerDBName;
            var buyerQuotaion;
            async.series(
                [
                    //1.get buyer dbName
                    function (done) {
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, buyerId, function (err, results) {
                            if (err){
                                done(err);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                                logger.debug("buyerCustomerDB=" + buyerDBName);
                                done(null, "buyerCustomerDB=" + buyerDBName);
                            }
                        });
                    },
                    //1.get buyer dbName
                    function (done) {
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, sellerId, function (err, results) {
                            if (err){
                                done(err);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                                logger.debug("sellerDBName=" + sellerDBName);
                                done(null, "sellerDBName=" + sellerDBName);
                            }
                        });
                    },
                    //2.get buyer quotation
                    function (done) {
                        db.listOneBuyerQuotationDetail(buyerDBName,sellerDBName,inquiryId,sellerId,unicode,function(err,results){
                            if(err){
                                logger.error(JSON.stringify(err));
                                done(err);
                            }else{
                                if(results.length>0){
                                    buyerQuotaion = results[0];
                                }
                                done(null,"listOneBuyerQuotationDetail done");
                            }
                        })
                    },
                    //3.send quotation
                    function (done) {
                        if(underscore.isUndefined(buyerQuotaion)){
                            done("buyer quotation is not valid to send");
                        }else{
                            var msgData = {
                                PRICECOMPARE:{
                                    GUID:buyerQuotaion.guid,
                                    LSH:LSH,
                                    BILLDATE:new Date()
                                },
                                PRICECOMPAREDETAIL:{
                                    GUID:creatGuid("detail",getIndex(index)),
                                    PRICECOMPAREGUID:buyerQuotaion.guid,
                                    DH:buyerQuotaion.billNo,
                                    GYS:buyerQuotaion.GYS,//供应商ERP编号
                                    HH:buyerQuotaion.HH,//getHH from GoodsInfoBy  item.licenseNo;
                                    SCHEDULECOUNT:buyerQuotaion.inquiryQuantity,
                                    SCHEDULEPRICE:buyerQuotaion.lastErpPrice,
                                    ORDERCOUNT:buyerQuotaion.quotationQuantity,
                                    ORDERPRICE:buyerQuotaion.quotationPrice
                                },
                                PRICECOMPARESCHEDULE:{
                                    GUID:creatGuid("schedule",getIndex(index)),
                                    PRICECOMPAREGUID:buyerQuotaion.guid,
                                    BILLNO:buyerQuotaion.billNo,
                                    HH:buyerQuotaion.HH,
                                    SCHEDULECOUNT:buyerQuotaion.inquiryQuantity,
                                    SCHEDULEPRICE:buyerQuotaion.lastErpPrice
                                }
                            };
                            logger.debug(JSON.stringify(msgData));
                            var msgType = "EDI_QUOTATION_CREATED";
                            var apiRobot = new ApiRobot(__cloudDBName, db, redisCli, isErpMsgCheckStrict, version);
                            apiRobot.sendMsg(buyerId, msgType, msgData, function sendMsgCallback(error, result) {
                                if (error) {
                                    logger.error(error);
                                    done(null,"msgData="+JSON.stringify(msgData)+"send fail,error="+error);
                                } else {
                                    done(null, "msgData="+JSON.stringify(msgData)+"send OK");
                                }
                            });
                        }
                    }

                ],
                function (errs, resultList) {
                    if (errs) {
                        mapCallback(null, "inquiryId="+inquiryId+"unicode =" + unicode + "post to ERP fail"+errs);
                    } else {
                        logger.debug(JSON.stringify(resultList));
                        mapCallback(null, "inquiryId="+inquiryId+"unicode =" +unicode + "post to ERP success");

                    }
                }
            );
        },
        function(errs,results){
                logger.debug(JSON.stringify(results));
                callback(null,results);
        }
    )

};

function sendQuotationResult(cloudDB,sellerInfo,msg,cb){
    logger.enter();
    var msgType = "EDI_QUOTATION_CREATED";
    var index = -1;
    async.mapSeries(
        msg.goods,
        function(item,mapCallback){
            index++;
            var inquiryId = item.inquiryId;
            var buyerId = item.buyerId;
            var licenseNo = item.licenseNo;
            var guid = creatGuid(inquiryId,licenseNo);
            var LSH = creatLSH(inquiryId,buyerId,index);
            var sellerDBName = __customerDBPrefix + "_" + sellerInfo.dbSuffix;
            var customerDBName = undefined;
            async.series([
                function(done){
                    db.getBuyerInfoById(cloudDB,buyerId,function(err,result){
                      if(!err && result.length>-1){
                          customerDBName =__customerDBPrefix + "_" + result[0].dbSuffix;
                      }
                      done(err,result);
                    });
                },
                function(done){
                    db.listQuotationDetails(sellerDBName,customerDBName,inquiryId,licenseNo,buyerId,function(err,result){
                        if(result.length==0){
                            logger.debug("没有取到对应的quotataion信息");
                            mapCallback("没有取到对应的quotataion信息");
                        }else{
                            var quotationDetail = result[0];
                            logger.debug("result="+JSON.stringify(quotationDetail));
                            var msgData = {
                                PRICECOMPARE:{
                                    GUID:guid,
                                    LSH:LSH,
                                    BILLDATE:new Date()
                                },
                                PRICECOMPAREDETAIL:{
                                    GUID:creatGuid("detail",getIndex(index)),
                                    PRICECOMPAREGUID:guid,
                                    DH:getIndex(index),
                                    GYS:quotationDetail.GYS,//供应商ERP编号
                                    HH:quotationDetail.HH,//getHH from GoodsInfoBy  item.licenseNo;
                                    SCHEDULECOUNT:quotationDetail.inquiryQuantity,
                                    SCHEDULEPRICE:quotationDetail.lastErpPrice,
                                    ORDERCOUNT:item.quotationQuantity,
                                    ORDERPRICE:item.quotationPrice
                                },
                                PRICECOMPARESCHEDULE:{
                                    GUID:creatGuid("schedule",getIndex(index)),
                                    PRICECOMPAREGUID:guid,
                                    BILLNO:LSH+getIndex(index),
                                    HH:quotationDetail.HH,
                                    SCHEDULECOUNT:quotationDetail.inquiryQuantity,
                                    SCHEDULEPRICE:quotationDetail.lastErpPrice
                                }
                            };
                            logger.debug(JSON.stringify(msgData));
                            var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
                            apiRobot.sendMsg(buyerId, msgType, msgData, function sendMsgCallback(error, result) {
                                if (error) {
                                    logger.error(error);
                                    done(error);
                                } else {
                                    done(null, result);
                                }
                            });
                        }

                    });
                }
            ],
            function(errs,results){
                mapCallback(errs,results)
            });


        },
        function(err,resultlist){
            logger.error(err);
            cb(null,resultlist);
        }
    )

}

//create guid for Erp
function creatGuid(inquiryId,licenseNo){
    var crypto = require('crypto');
    var timeStr = (new Date()).getTime();
    var buffer=inquiryId+licenseNo+timeStr;
    crypto = crypto.createHash('md5');
    crypto.update(buffer);
    return crypto.digest('hex');
}


//create LSH for Erp
function creatLSH(inquiryId,buyerId,index){
    var dataStr = new Date().Format("yyyyMMdd");
    var result = "SCCBJ"+ inquiryId+ buyerId+ dataStr+getIndex(index);
    return result;
}
//format index
function getIndex(index){
    if(index < 10){
        return "0"+index;
    }
    return index+"";
}



function listGroupBy(list,fieldName){
    var fieldlist = underscore.pluck(list,fieldName);
    var uniqFiedlist = underscore.uniq(fieldlist);
    var results=[];
    underscore.map(uniqFiedlist,function(item){
        var resultObj={};
        resultObj[fieldName] = item;
        resultObj['itemInfo'] = [];
        underscore.map(list,function(listItem){
            if(listItem[fieldName] == item){
                resultObj['itemInfo'].push(listItem);
            }
        });
        results.push(resultObj);
    });
    return results;
}

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

module.exports = ApiModel;

