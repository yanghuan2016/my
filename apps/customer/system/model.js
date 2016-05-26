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
 * model.js
 *
 * 商品model
 * --------------------------------------------------------------
 * 2015-10-30	hc-romens@issue#267  created
 *
 */

module.exports=function() {
    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;
    /*
     * load 3rd party modules
     */
    var underscore = require("underscore");
    var async = require("async");
    /*
     * load project modules
     */
    var myPath = require(__modules_path + "/mypath");
    /*
     * init model name etc
     */
    var MODELNAME = myPath.getModelName(__dirname);
    logger.trace("Initiating model:[" + MODELNAME + "]");
    //model
    var model = {


        /**
         * get payment config by id
         * @param customerDB
         * @param customerId
         * @param paymentId
         * @param callback
         */
        getClientPaymentConfig: function(customerDB,customerId,paymentId,callback){
            logger.enter();
            db.getclientPaymentConfig(customerDB,customerId,paymentId,function(err,results){
                callback(err,results);
            })
        },
        /**
         * get client payment
         * @param customerDB
         * @param callback
         */
        getClientPaymentlist : function(customerDB,customerId,callback){
            logger.enter();
            db.getclientPayments(customerDB,customerId,function(err,results){
                callback(err,results);
            })
        },

        /**
         * set sms config model
         * @param customerDB
         * @param data
         * @param callback
         */
        setSmsConfig:function(customerDB,data,callback){
            logger.enter();
            var configValueStr = JSON.stringify(data.configValue);
            logger.debug(configValueStr);
            var base64ConfigStr = new Buffer(configValueStr).toString('base64');
            logger.debug(JSON.stringify(base64ConfigStr));
            db.updateSmsConfig(customerDB,data.smsId,base64ConfigStr,function(err,results){
                callback(err,results);
            })
        },

        /**
         * 配置短信网关参数
         * @param customerDB
         * @param smsId
         * @param callback
         */
        getSMSsetting : function(customerDB,smsId,callback){
            logger.enter();
            db.getSmsSetting(customerDB,smsId,function(err,results){
                if(err){
                    callback(err);
                }else {
                    var smsConfig = {};
                    if (results.length > 0) {
                        var configValue = results[0].configValue;
                        var decodeValue = new Buffer(configValue, 'base64').toString();
                        try{
                            smsConfig = JSON.parse(decodeValue);
                        }catch(parseErr){
                            smsConfig = {};
                            logger.error(parseErr)
                        }
                    }
                    callback(null, smsConfig);
                }
            })
        },
        /**
         * 配置短信网关的首选，备选
         * @param customerDB
         * @param data
         * @param callback
         */
        setSmsStatus:function(customerDB,data,callback){
            logger.enter();
            var updateArr = [];
            underscore.map(data,function(item){
                var itemArr = [];
                itemArr.push(
                    item.smsId,
                    item.isMain,
                    item.isStandby
                );
                updateArr.push(itemArr);
            });
            logger.debug("update sms status = "+JSON.stringify(updateArr));
            db.updateSmsStatus(customerDB,updateArr,function(err,results){
                callback(err,results);
            })
        },

        /**
         * get view data of sms list
         * @param customerDB
         * @param callback
         */
        getSMSList:function(customerDB,callback){
            logger.enter();
            var smsList = [];
            db.getSmsList(customerDB,function(err,results){
                callback(err,results);
            })
        },
        /**
         * delete domain setting
         * @param customerDB
         * @param id
         * @param callback
         */
        deleteDomainSetting: function(customerDB,id,callback){
            logger.enter();
            db.deleteClientArea(customerDB,id,function (error, result) {
                callback(error,result);
            });
        },
        /**
         * update domain setting
         * @param customerDB
         * @param id
         * @param name
         * @param callback
         */
        putDomainSetting : function(customerDB,id,name,callback){
            logger.enter();
            db.updateClientArea(customerDB,id,name,function (error, result) {
                callback(error,result);
            });
        },

        /**
         * add nwe domain
         * @param customerDB
         * @param name
         * @param callback
         */
        postNewDomainSetting:function(customerDB,name,callback){
            logger.enter();
            db.addClientArea(customerDB,name,function (error, result) {
                callback(error,result);
            });
        },

        /**
         * 区域设置
         * @param customerDB
         * @param callback
         */
        getDomainSetting: function(customerDB,callback){
            logger.enter();
            db.getClientArea(customerDB, function(error, results) {
                callback(error,results);
            });
        },


        /**
         * change erp setting
         * @param dbName
         * @param customerId
         * @param erpIsAvailable
         * @param erpAppCodeUrl
         * @param erpMsgUrl
         * @param appKey
         * @param callback
         */
        putERPSetting : function(dbName, customerId, erpIsAvailable, erpAppCodeUrl, erpMsgUrl, appKey,callback){
            logger.enter();
            db.updateCustomerERPSetting(dbName, customerId, erpIsAvailable, erpAppCodeUrl, erpMsgUrl, appKey, function (error, result) {
                callback(error,result);
            });
        },

        /**
         * get page to erp setting
         * @param data
         * @param cId
         * @param callback
         */
        getSystemERPsetting: function(req, data,cId,callback){
            logger.enter();
            db.retrieveCustomerERPSetting(__cloudDBName, cId, function (error, result) {
                if (error) {
                    callback(error);
                }else{
                    data.erpSetting = result[0];
                    var key = "ERP.appCode." + cId;
                    __redisClient.get(key, function (error, appcode) {
                        if (error) {
                            logger.error(error);
                        }
                        data.appCode = appcode || "暂无" ;
                        data._customer = req.session.customer;
                        data.msgApi  =  req.protocol + '://' + req.get('host') + "/api/erp/" + cId ;
                        data.appCodeApi  =  req.protocol + '://' + req.get('host') + "/api/erp/appCode/" + cId ;
                        callback(null,data);
                    });
                }
            });
        },

        /**
         * get category list
         * @param dbName
         * @param callback
         */
        getClientCategorylist: function(dbName,callback){
            logger.enter();
            db.clientCategoryRetrieveAvaliable(dbName, function(error, result) {
                callback(error,result);
            });
        },


        /**
         * add new clientcategory
         * @param dbName
         * @param clientCategory
         * @param callback
         */
        postNewClientCategory : function(dbName, clientCategory,callback){
            logger.enter();
            db.clientCategoryCreateOne(dbName, clientCategory, function(error,result){
                callback(error,result);
            });
        },


        /**
         * 系统设置==>客户类修改
         * @param dbName
         * @param categoryId
         * @param categoryName
         * @param callback
         */
        putSystemEditClientCateory : function(dbName, categoryId, categoryName,callback){
            logger.enter();
            db.clientCategoryUpdateOne(dbName, categoryId, categoryName, function(error,result){
                callback(error,result);
            });
        },

        /**
         * set default inventory plan
         * @param customerDBName
         * @param updateData
         * @param id
         * @param callback
         */
        putDefaultInventoryPlan: function(customerDBName,updateData,id,callback){
            logger.enter();
            db.updateInventoryPlan(customerDBName,updateData,id,function(err,result){
                if(!err){
                    db.updateGoodsInventoryShowPlan(customerDBName, id, function (err, result) {
                        if(!err){
                            callback(null,result);
                        }else{
                            callback(err);
                        }
                    });
                }else{
                    callback(err);
                }
            })
        },

        /**
         * delete good inventory plandetail
         * @param customerDBName
         * @param id
         * @param callback
         */
        deleteGoodsInventoryPlanDetail : function(customerDBName,id,callback){
            logger.enter();
            db.removeInventoryPlan(customerDBName,id,function(err,result){
                callback(err,result);
            })
        },


        /**
         * get good inventory plandetail
         * @param customerDBName
         * @param id
         * @param callback
         */
        getGoodsInventoryPlanDetail : function(customerDBName,id,callback){
            logger.enter();
            db.listGoodsInventoryPlanDetailsById(customerDBName,id,function(err,planDetails){
                callback(err,planDetails);
            });
        },

        /**
         * get all goods inventory plan
         * @param customerDBName
         * @param callback
         */
        getAllGoodsInventoryPlan : function(customerDBName,callback){
            logger.enter();
            db.listAllGoodsInventoryPlan(customerDBName,function(err,plans){
                callback(err,plans);
            });
        },


        /**
         * delete PackUnit
         * @param customerDBName
         * @param packUnitId
         * @param callback
         */
        deleteSystemPackUnit : function(customerDBName,packUnitId,callback){
            logger.enter();
            db.deletePackUnit(customerDBName,packUnitId,function(err,result){
                callback(err,result);
            })
        },

        /**
         * new PackUnit
         * @param customerDBName
         * @param packUnit
         * @param callback
         */
        postNewPackUnit : function(customerDBName,packUnit,callback){
            logger.enter();
            db.insertPackUnit(customerDBName,packUnit,function(err,packUnitId){
                callback(err,packUnitId);
            })
        },

        /**
         * get all unit
         * @param customerDBName
         * @param callback
         */
        getPackUnit : function(customerDBName,callback){
            logger.enter();
            db.listPackUnit(customerDBName,function(err,packUnits){
                callback(err,packUnits);
            })
        },

        /**
         * 系统设置，商品GSP类别管理 添加新的GSP类别
         * @param dbName
         * @param gspValue
         * @param callback
         */
        postAddGoodsGspType : function(dbName,gspValue,callback){
            logger.enter();
            db.addGoodsGspType(dbName,gspValue,function(err,results){
                callback(err,results);
            });
        },


        /**
         * 系统设置，商品GSP类别管理
         * @param dbName
         * @param callback
         */
        getGoodsGspTypes : function(dbName,callback){
            logger.enter();
            db.listGoodsGspTypes(dbName,function(err,results){
                callback(err,results);
            });
        },

        /**
         * 更新顺序
         * @param dbName
         * @param data
         * @param callback
         */
        postGoodsCategoryOne : function(dbName,data,callback){
            logger.enter();
            db.updateDisplayOrderGoodsCategoryOne(dbName, data, function (error, result) {
                if (error) {
                    logger.error(error);
                    callback(err);
                } else {
                    __cacheService.deleteCache(__cacheService.CacheKeys.GoodsTypesInJSON, function(err) {
                        if (err){
                            logger.debug("cacheService update ERR")
                        }
                        callback();
                    });
                }
            });
        },

        /**
         * 统设置　商品类别增加,修改
         * @param dbName
         * @param data
         * @param callback
         */
        postSystemProduct: function(dbName,data,callback){
            logger.enter();
            db.updateGoodsCategoryOne(dbName, data, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    __cacheService.deleteCache(__cacheService.CacheKeys.GoodsTypesInJSON, function(err) {
                        if(err){
                            logger.debug("delete Cache err = "+JSON.stringify(err));
                        }
                        callback(null,result);
                    });
                }
            });
        },

        /**
         * 商品类别设置
         * @param dbName
         * @param callback
         */
        getProductTypes: function(dbName,callback){
            logger.enter();
            db.listGoodsAllTypes(dbName, function (err, goodsTypesList) {
                callback(err,goodsTypesList);
            });
        },


        /**
         * set client payment forbidden
         * @param customerDB
         * @param paymentData
         * @param configValueData
         * @param callback
         */
        setClientPaymentForbidden : function(customerDB,paymentData,callback){
            logger.enter();
            db.updateClientPaymentIsForbidden(customerDB,paymentData,function(err,results){
                callback(err,results);
            })
        },



        setClientPaymentConfigValue :function(customerDB,customerId, data,callback){
           logger.enter();
            var paymentId = data.paymentId;
            var configValue = data.configValue;
            db.updateConfigValue(customerDB,customerId,paymentId,configValue,function(err,result){
                callback(err,result);
            })
        },
        /**
         * 客户系统设置中配置支付参数
         * @param customerDB
         * @param paymentData
         * @param configValueData
         * @param callback
         */
        setClientPayment : function(customerDB,paymentData,configValueData,callback){
            logger.enter();

            var paymentId = undefined;
            async.series([
                function(done){
                    db.insertClientPayment(customerDB,paymentData,function(err,results){
                       if(err){
                           done(null,"already exits payment")
                       }else{
                           paymentId = results.insertId;
                           done(null,results);
                       }
                    })
                },
                function(done){
                    if(underscore.isUndefined(paymentId)){
                        db.selectClientPaymentId (customerDB,paymentData,function(err,results){
                            if(err){
                                done(err)
                            }else{
                                paymentId = results[0].id;
                                done(null,paymentId);
                            }
                        })
                    }else{
                        done();
                    }
                },
                function(done){
                    db.insertUPdateClientPaymentKeys(customerDB,configValueData,paymentId,function(err,results){
                        done(err,results);
                    })
                }
            ],function(errs,results){
                if(errs){
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                }else{
                    logger.debug(JSON.stringify(results));
                    callback(null,results);
                }
            });

        },

        /**
         * 获取操作员日志信息
         * @param customerDB
         * @param callback
         */
        getOperatorLogInfo: function(customerDB, isClient, operatorName, paginator, callback){
            logger.enter();
            db.selectOperatorLog(customerDB, isClient, operatorName, paginator, function(err, results){
                if(err){
                    callback(err);
                }else{
                    callback(null, results);
                }
            });
        },

        /**
         * 禁用启用某一个商品类别并检查该类别是否有相应的商品
         * @param customerDB
         * @param callback
         */
        forbiddenGoodsCategory: function (customerDB, data, callback) {
            logger.enter();
            async.series([
                function (done) {
                    //检查该类别下面是否有商品存在
                    logger.ndump("data.isDeleted", data.isDeleted);
                    if (Number(data.isDeleted) == 1) {
                        db.checkGoodsInErpId(customerDB, data.erpId, function (err, results) {
                            logger.ndump("results", results);
                            if (err || results.length != 0) {
                                done("err");
                            } else {
                                done();
                            }
                        })
                    } else {
                        done();
                    }
                },
                function (done) {
                    //禁用启用该类别商品
                    db.forbiddenGoodsCategoryOne(customerDB, data, function (error) {
                        if (error) {
                            done(error);
                        } else {
                            done();
                        }
                    });
                },
                function (done) {
                    //删除对应的redis标志，重新从数据库取商品的分类信息
                    __cacheService.deleteCache(__cacheService.CacheKeys.GoodsTypesInJSON, function (err) {
                        if (err != 200) {
                            done(err);
                        } else {
                            done();
                        }
                    });
                }
            ], function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    if (errs[0] == "err") {
                        callback(errs[0]);
                    } else {
                        callback(errs);
                    }
                } else {
                    logger.debug(JSON.stringify(results));
                    callback(null, data.erpId);
                }
            });
        },
        /**
         * 获取剂型信息
         * @param customerDB
         * @param callback
         */
        getDrugsTypeInfo: function(customerDB, callback) {
            logger.enter();
            db.selectDrugsTypeInfo(customerDB, function(err, results){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err, results);
                }
            });
        },

        /**
         * 添加剂型信息
         * @param customerDB
         * @param jxValue
         * @param callback
         */
        addDrugsTypeInfo: function(customerDB, jxValue, callback){
            logger.enter();
            db.insertDrugsTypeInfo(customerDB, jxValue, function(err, results){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err, results);
                }
            });
        },

        /**
         * 删除剂型信息
         * @param customerDB
         * @param jxId
         * @param callback
         */
        delDrugsTypeInfo: function (customerDB, jxId, callback) {
            logger.enter();
            async.series([
                function (done) {
                    //检查该剂型下面是否有商品存在
                    db.checkGoodsInDrugsType(customerDB, Number(jxId), function (err, results) {
                        logger.ndump("results", results);
                        if (err || results.length != 0) {
                            done("err");
                        } else {
                            done();
                        }
                    })
                },
                function (done) {
                    //删除该剂型
                    db.deleteDrugsTypeInfo(customerDB, jxId, function (err, results) {
                        if (err) {
                            logger.error(err);
                            done(err);
                        } else {
                            done(err, results);
                        }
                    });
                }
            ], function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    if (errs[0] == "err") {
                        callback(errs[0]);
                    } else {
                        callback(errs);
                    }
                } else {
                    logger.debug(JSON.stringify(results));
                    callback(null, jxId);
                }
            });
        },

        /**
         * 删除一个客户类信息
         * @param customerDB
         * @param categoryId
         * @param callback
         */
        delCurrentClientCategoryInfo: function (customerDB, categoryId, callback) {
            logger.enter();
            async.series([
                function (done) {
                    //检查该客户类下面是否有客户存在
                    logger.ndump("categoryId", categoryId);
                    db.checkClientInCategoryId(customerDB, categoryId, function (err, results) {
                        logger.ndump("results", results);
                        if (err || results.length != 0) {
                            done("err");
                        } else {
                            done();
                        }
                    })
                },
                function (done) {
                    //删除该客户类
                    db.clientCategoryDisableOne(customerDB, categoryId, function (err, results) {
                        if (err) {
                            logger.error(err);
                            done(err);
                        } else {
                            done(err, results);
                        }
                    });
                }
            ], function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    if (errs[0] == "err") {
                        callback(errs[0]);
                    } else {
                        callback(errs);
                    }
                } else {
                    logger.debug(JSON.stringify(results));
                    callback(null, categoryId);
                }
            });
        },

        /**
         * 删除一个GSP类别
         * @param customerDB
         * @param categoryId
         * @param callback
         */
        delCurrentProductGspOneInfo: function (customerDB, gspId, callback) {
            logger.enter();
            async.series([
                function (done) {
                    //检查是否有商品的gsp属于该gsp
                    logger.ndump("gspId", gspId);
                    db.checkProductGspInGspId(customerDB, gspId, function (err, results) {
                        logger.ndump("results", results);
                        if (err || results.length != 0) {
                            done("err");
                        } else {
                            done();
                        }
                    })
                },
                function (done) {
                    //删除该GSP类别
                    db.deleteGoodsGspType(customerDB, gspId, function (err, results) {
                        if (err) {
                            logger.error(err);
                            done(err);
                        } else {
                            done(err, results);
                        }
                    });
                }
            ], function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    if (errs[0] == "err") {
                        callback(errs[0]);
                    } else {
                        callback(errs);
                    }
                } else {
                    logger.debug(JSON.stringify(results));
                    callback(null, gspId);
                }
            });
        },

        /**
         * 更新系统设置其他信息
         * @param customerDB
         * @param kvListData
         * @param callback
         */
        updateOthersInfo: function(customerDB, kvListData, callback) {
            logger.enter();
            async.series([
                // step1. 清除之前的设置信息
                function(done) {
                    db.clearKVListInfo(customerDB, kvListData, function(err, result) {
                        if(err) {
                            done(err);
                        }
                        else {
                            done(err, result);
                        }
                    });
                },
                // step2. 更新最新的设置信息
                function(done) {
                    db.insertKVlistInfo(customerDB, kvListData, function(err, result) {
                       if(err) {
                           done(err);
                       }
                       else {
                           done(err, result);
                       }
                    });
                }
            ], function(err, resultlist) {
                if(err) {
                    logger.error(JSON.stringify(err));
                    callback(err);
                }
                else {
                    logger.debug(JSON.stringify(resultlist));
                    callback(null, resultlist);
                }
            });
        },

        acquireOthersInfo: function(customerDB, callback) {
            logger.enter();
            db.getAllKV(customerDB, function(err,results){
                if(err){
                    logger.error(err);
                    return callback(err);
                }
                if(results.length > 0) {
                    var autoReceiveDays = {};
                    var checkOutDays = {};
                    var autoCloseOrderDays = {};
                    underscore.each(results, function(kvInfo) {
                        if('autoReceiveDays' == kvInfo._key) {
                            autoReceiveDays.value = kvInfo.value;
                            autoReceiveDays.keyAlias = kvInfo.keyAlias;
                        }
                        else if('checkOutDays' == kvInfo._key) {
                            checkOutDays.value = kvInfo.value;
                            checkOutDays.keyAlias = kvInfo.keyAlias;
                        }
                        else if('autoCloseOrderDays' == kvInfo._key) {
                            autoCloseOrderDays.value = kvInfo.value;
                            autoCloseOrderDays.keyAlias = kvInfo.keyAlias;
                        }
                        else if('maxAutoReceiveDays' == kvInfo._key) {
                            autoReceiveDays.maxDay = kvInfo.value;
                        }
                        else if('maxCheckOutDays' == kvInfo._key) {
                            checkOutDays.maxDay = kvInfo.value;
                        }
                        else if('maxAutoCloseOrderDays' == kvInfo._key) {
                            autoCloseOrderDays.maxDay = kvInfo.value;
                        }
                    });
                    var obj = {};
                    obj.autoReceiveDays = autoReceiveDays;
                    obj.checkOutDays = checkOutDays;
                    obj.autoCloseOrderDays = autoCloseOrderDays;
                }
                callback(err, obj);
            });
        }

    };

    return model;
};