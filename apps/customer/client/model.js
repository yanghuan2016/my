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
 * 产品信息展示model
 * --------------------------------------------------------------
 * 2015-09-21	hc-romens@issue#18  created
 *
 */

module.exports=function() {
    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;
    var dataService = __dataService;
    /*
     * load 3rd party modules
     */
    var underscore = require("underscore");
    var async = require("async");
    var uuid = require('node-uuid');
    /*
     * load project modules
     */
    var Paginator = require(__base + "/modules/paginator");
    var myPath = require(__modules_path + "/mypath");
    var KeyMapper = require(__base + '/modules/fieldNameMapper');
    var FieldNameMapper = require(__base + '/modules/fieldNameMapper');
    var moment=require('moment');
    /*
     * init model name etc
     */
    var MODELNAME = myPath.getModelName(__dirname);
    logger.trace("Initiating model:[" + MODELNAME + "]");
    var goodsFieldMapper = new KeyMapper({
        'commonName': '商品名',
        'goodsType': '产品类别',
        'goodsNo': '货号',
        'alias': '别名',
        'onSell':'状态',
        'licenseNo': '批准文号',
        'producer': '生产企业',
        'boughtTimes':'人气',
        'boughtAmount':'销售额',
        'createdOn':'创建时间'
    });
    var registerModel=require(__base+"/apps/register/model")();



    //model
    var model = {


        getClientsReview: function(dbName,clientId,data,callback){
            logger.enter();

            var clientInfo = undefined;
            async.series([
                    function(done){
                        db.listClientGspTypes(dbName, function(err,gspTypes) {
                                if(err){
                                    logger.error(err);
                                    done(err)
                                }else{
                                    data['allGspTypes']=gspTypes;
                                    data['institutions'] = [
                                        {
                                            name: "二级",
                                            hospitalLevel: "secondLevel",
                                            hospitalGrades: [
                                                "甲等", "乙等", "丙等", "未评", "其他", "未知"
                                            ]
                                        },
                                        {
                                            name: "三级",
                                            hospitalLevel: "threeLevel",
                                            hospitalGrades: [
                                                "甲等", "乙等", "合格", "未定等", "其他", "未知"
                                            ]
                                        }
                                    ];
                                    done();
                                }
                        });
                    },
                    function(done){
                        db.getClientFinance(dbName, clientId, function(err, results){
                                if(err){
                                    logger.error(err);
                                    done(err);
                                }else{
                                    data['clientFinance']=results;
                                    logger.ndump('clientFinance >> ', data.clientFinance);
                                    done();
                                }

                        });
                    },
                    function(done){
                        db.getClientArea(dbName, function(err, results) {
                                if (err) {
                                    logger.error(err);
                                    done(err);
                                }else{
                                    data.clientAreas  = results;
                                    done();
                                }
                        })
                    },
                    function(done){
                        db.getClientCategory(dbName, function (err, clientCategories) {
                            if (err) {
                                logger.error(err);
                                done(err);
                            }else{
                                var categoryNames = [];
                                for (var c in clientCategories) {
                                    var temp = {};
                                    temp.categoryName = clientCategories[c].categoryName;
                                    temp.categoryId = clientCategories[c].categoryId;
                                    categoryNames.push(temp);
                                }
                                data.clientCategorys = categoryNames;
                                done();
                            }
                        });
                    },
                    function(done){
                        db.getClientById(dbName,clientId,function(err,client){
                            if (err) {
                                logger.error(err);
                                done(err);
                            }else{
                                clientInfo = client;
                                done();
                            }
                        })
                    },
                    function(done){
                        db.getGSPTypesFromUpdateById(dbName,clientId,function(err,result){
                            if(err){
                                logger.error(err);
                                done(err);
                            }else{
                                if(result.length==0){
                                    done(err,result);
                                }else {
                                    result = formatClientGspIdLinksUpdateData(result);
                                    data.gspTypes = result;
                                    done(err, result);
                                }
                            }
                        });
                    },
                    function(done){
                        db.listGoodsGspTypes(dbName, function(err, results){
                                if (err) {
                                    logger.error(err);
                                    done(err);
                                }else{
                                    data.goodsGspTypelist = results;
                                    done();
                                }
                        });
                    },

                    function(done){
                        if(underscore.isUndefined(data.gspTypes)){
                            db.getGSPTypesById(dbName,clientId,function(err,gspTypes) {
                                if (err) {
                                    logger.error(err);
                                    done(err);
                                }else{
                                    data.gspTypes = gspTypes;
                                    var gspTypesIds=[];
                                    underscore.each(gspTypes,function(item){
                                        gspTypesIds.push(item.gspTypeId);
                                    });
                                    data.gspTypesIds=gspTypesIds;
                                    done();
                                }
                            })
                        }else{
                            var gspTypesIds = [];
                            underscore.each(gspTypes, function (item) {
                                gspTypesIds.push(item.gspTypeId);
                            });
                            data.gspTypesIds = gspTypesIds;
                            done();
                        }
                    },
                    function(done){
                        db.getGSPfromClientUpdate(dbName,clientId,function(err,gspInfo){
                            if(err){
                                logger.error(err);
                                done(err);
                            }else{
                                data.client= gspInfo;
                                done();
                            }
                        })
                    },
                    function(done){
                        if(underscore.isUndefined(data.client)){
                            db.getGSP(dbName, clientId, function (err, gspInfo) {
                                if(err){
                                    logger.error(err);
                                    done(err);
                                }else{
                                    data.client= gspInfo;
                                    data.client.clientCategoryId=clientInfo.clientCategoryId;
                                    data.client.pricePlan=clientInfo.pricePlan;
                                    data.client.clientArea=clientInfo.clientArea;
                                    data.client.clientCode=clientInfo.clientCode;
                                    data.client.registerStatus=clientInfo.registerStatus;
                                    data.client.clientName=clientInfo.clientName;
                                    data.client.stampLink=clientInfo.stampLink;
                                    data.client.id=clientInfo.id;
                                    done();
                                }
                            })
                        }else{
                            data.client.clientCategoryId=clientInfo.clientCategoryId;
                            data.client.pricePlan=clientInfo.pricePlan;
                            data.client.clientArea=clientInfo.clientArea;
                            data.client.clientCode=clientInfo.clientCode;
                            data.client.registerStatus=clientInfo.registerStatus;
                            data.client.clientName=clientInfo.clientName;
                            data.client.stampLink=clientInfo.stampLink;
                            data.client.id=clientInfo.id;
                            done();
                        }
                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    }else{
                        logger.debug(JSON.stringify(results));
                        callback(null,data);
                    }
                }
            );
        },

        /**
         * get client
         * @param customerDBName
         * @param clientId
         * @param page
         * @param operatorData
         * @param data
         * @param callback
         */
        getClientAdd:function(customerDBName,clientId,page,operatorData,data,callback){
            logger.enter();
            logger.trace("clientId=" + clientId + underscore.isUndefined(clientId));
            db.getClientCategory(customerDBName, function (err, clientCategories) {
                data.clientCategorys = clientCategories;
                data['institutions'] = [
                    {
                        name: "二级",
                        hospitalLevel: "secondLevel",
                        hospitalGrades: [
                            "甲等", "乙等", "丙等", "未评", "其他", "未知"
                        ]
                    },
                    {
                        name: "三级",
                        hospitalLevel: "threeLevel",
                        hospitalGrades: [
                            "甲等", "乙等", "合格", "未定等", "其他", "未知"
                        ]
                    }
                ];
                db.getClientFinance(customerDBName, clientId, function(err, results){
                    if(err){
                        logger.error(err);
                        return res.render('error/wrong', {err: err});
                    }
                    data['clientFinance'] = results;
                    logger.ndump('data.clientFinance > ', data.clientFinance);
                    db.listClientGspTypes(customerDBName,function(err,gspTypes) {
                        data.gspTypes = gspTypes;
                        db.getGSPTypesById(customerDBName,clientId,function(err,gspTypeIds){
                            data.gspTypeIds = gspTypeIds;
                            db.getClientArea(customerDBName, function (error, results) {
                                data.clientAreas = results;
                                if (!underscore.isUndefined(clientId)) {
                                    //todo Client与Operator为一一对应关系，如否需修改下面方法
                                    db.getOperatorByClientId(customerDBName, operatorData, function (err, operatorInfo) {
                                        data['operatorInfo'] = operatorInfo;
                                        db.getClientById(customerDBName, clientId, function (err, client) {
                                            logger.trace(JSON.stringify(client));
                                            data['client'] = client;
                                            data['client'].id = clientId;
                                            //当下客户是已经审核通过的客户,商户修改直接修改原表,不是审核功能,直接显示原表GSP信息
                                            db.getGSP(customerDBName, clientId, function (err, gspInfo) {
                                                data.gsp = gspInfo;
                                                data['client'].mobile = gspInfo.mobile;
                                                //获取基本数据
                                                if (err) {
                                                    logger.error(err);
                                                }
                                                else {
                                                    data.page = page;
                                                    callback(null,data);
                                                }
                                            });
                                        })
                                    })
                                }
                                else {
                                    logger.footprint();
                                    data['client'].id = clientId;
                                    data.page = page;
                                    callback(null,data);
                                }

                            });

                        });

                    });
                });
            });
        },


        /**
         * 获取客户详情信息
         * @param customerDB
         * @param clientId
         * @param data
         * @param callback
         */
        getClientDetailData : function (customerDB, clientId, data, callback) {
          logger.enter();
            var _self = this;
            async.series([
                function (done) {
                    _self.getClientsReview(customerDB, clientId, data, function(err, clientData) {
                        if(err) {
                            logger.error(err);
                            return done(err);
                        }
                        data = clientData;
                        done(null, clientData);
                    });
                },
                function (done) {
                    _self.getClientSaleScope(customerDB, clientId, function(err, goodsGspTypeList) {
                        if(err) {
                            logger.error(err);
                            return done(err);
                        }
                        data.goodsGspTypeList = goodsGspTypeList;
                        done(null, goodsGspTypeList);
                    });
                }
            ], function(err, resultList) {
                if(err){
                    logger.error(JSON.stringify(err));
                    callback(err);
                }else{
                    logger.debug(JSON.stringify(resultList));
                    callback(null, data);
                }
            });
        },

        /**
         * get  price add
         * @param customerDBName
         * @param clientId
         * @param goodsTypeId
         * @param paginator
         * @param data
         * @param callback
         */
        getPriceAdd : function(customerDBName,clientId,goodsTypeId,paginator,data,callback){
            logger.enter();
            dataService.getGoodsTypeDescendants(customerDBName, goodsTypeId, function(err, goodsTypeIds) {
                db.listCustomerGoods(customerDBName, goodsTypeIds, paginator, function (err1, goods) {
                    db.getClientById(customerDBName, clientId, function (err2, client) {
                        db.getCLientPrice(customerDBName, clientId, function (err3, filterGoodsIdArr) {
                            if(err||err1||err2||err3){
                                callback(err+err1+err2+err3);
                            }else{
                                data['goods'] = goods;
                                data['filterGoodsIdArr'] = underscore.map(filterGoodsIdArr, function (item) {
                                    return item.goodsId
                                });
                                data['clientId'] = clientId;
                                data['pricePlan'] = client.pricePlan;
                                callback(null,data);
                            }
                        });
                    });
                });
            });
        },

        /**
         * reject client apply
         * @param dbName
         * @param clientId
         * @param rejectReason
         * @param clientStatus
         * @param callback
         */
        putClientApplyReject : function(dbName,clientId,rejectReason,clientStatus,callback){
            logger.enter();
            db.setNewRegisterClientDisable(dbName, clientId, clientStatus,function (error, results) {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else {
                    db.updateCheckComments(dbName, rejectReason, clientId, function (err, result) {
                        if (err) {
                            logger.error(err);
                            callback(err);
                        }
                        else {
                            callback(null,result);
                        }
                    })

                }
            });
        },
        /**
         * sava check comments
         * @param dbName
         * @param approveReason
         * @param clientId
         * @param callback
         */
        putCheckComments : function(dbName,approveReason,clientId,callback){
            logger.enter();
            db.updateCheckComments(dbName, approveReason, clientId, function (err, result) {
                callback(err,result);
            });
        },

        /**
         * add new client function
         *      1. 增加新记录到GoodsInfo中
         *      2. 增加新的空记录到GoodsGsp中（通过DB trigger）
         *      3. 增加价格信息到ClientsGoodsPrice
         *
         * @param customerDBName
         * @param clientInfo
         * @param callback
         */
        customerAddClient: function (customerDBName, clientInfo, callback) {
            logger.enter();
            db.beginTrans(function (connect) {
                var clientId = null;
                async.series([
                        function addClientInfo(done) {
                            logger.enter();
                            db.metaNewClientInfo(connect, customerDBName, clientInfo, function (err, insertId) {
                                if (insertId) {
                                    logger.trace("New client insert successfully");
                                    clientId = insertId;
                                }
                                done(err, insertId);
                            });
                        },
                        function addOperator(done) {
                            logger.enter();
                            db.metaNewOperatorInfo(connect, customerDBName, clientInfo, clientId, function (err, insertId) {
                                if (insertId)
                                    logger.trace("New operator insert successfully");
                                done(err, insertId);
                            });
                        }
                    ],
                    function (err) {
                        logger.enter();
                        logger.ndump("err", err);
                        if (typeof err === "object") {  // err is set
                            logger.trace("Found ERROR, rollback Transaction");
                            db.rollbackTrans(connect, function () {
                                callback(err);
                            });
                        } else {
                            logger.trace("All SQL passed, commit transaction");
                            db.commitTrans(connect, function () {
                                callback(null, clientId);
                            });
                        }
                    });
            });
        },

        customerReviewClient: function(dbName, stampLink, gspTypes, credits, clientInfo, gspInfo, clientId, saleScope, callback) {
            logger.enter();
            var cloudDBInfo = {};
            var enterpriselicenseNo = undefined;
            db.beginTrans(function(connect) {
                async.series([
                    function(cb) {
                        db.setNewRegisterClientEnable(connect, dbName,stampLink, clientInfo, clientId,function (error, result) {
                            cb(error, result);
                        });
                    },
                    function(cb) {
                        db.updateGSP(connect, dbName, gspInfo, clientId, function (err, result) {
                            cb(err, result);
                        });
                    },
                    //delete old gspTypes
                    function(cb){
                        db.metaGspTypesDeleteByClientId(connect,dbName,clientId,function(err,result){
                            if(err){
                                logger.error(err);
                                cb(err);
                            }else{
                                 cb(err,result);
                            }
                        })
                    },
                    //insert new gspTypes
                    function(cb){
                        if (typeof gspTypes != 'undefined') {
                            db.metaGspTypesBatchInsert(connect, dbName, gspTypes, function (err, result) {
                                if (err) {
                                    logger.error(err);
                                    cb(err);
                                } else {
                                    cb(err, result);
                                }
                            });
                        } else {
                            cb(null);
                        }
                    },
                    //select 需要插入CLOUDDB的数据内容
                    function(cb){
                        cloudDBInfo.customerName = clientInfo.clientName;
                        cloudDBInfo.customerDBSuffix = clientInfo.clientName;
                        cloudDBInfo.enterpriseType = "BUYER";
                        db.metaCloudDBInfoSelect(connect,dbName,clientId,function(err,result){
                            if(err){
                                logger.error(err);
                                cb(err)
                            }
                            if(result.length !=0){
                                var cusInfo = result[0];
                                cloudDBInfo.businessLicense = cusInfo.businessLicense;
                                cloudDBInfo.businessLicenseValidateDate = moment(new Date(cusInfo.businessLicenseValidateDate)).format('YYYY-MM-DD HH:mm:ss');
                                cloudDBInfo.stampLink = cusInfo.stampLink;
                                enterpriselicenseNo = cusInfo.businessLicense;
                            }
                            cb(null,result);
                        })
                    },
                    //覆盖或新建cloudDB.customer中对应的企业的信息
                    function(cb){
                        db.metaInsertCloudDB(connect,__cloudDBName,cloudDBInfo,function(err,result){
                            if(err){cb(err)}
                            logger.debug("INSERT INTO CLOUDDB SUCCESS");
                            cb(null,result);
                        })
                    },
                    //更新operator.customerId
                    function(cb){
                        db.metaUpdateOperatorCustomerId(connect,dbName,__cloudDBName,clientId,enterpriselicenseNo,function(err,result){
                            if(err){cb(err)}
                            logger.debug("UPDATE CUSTOMERID INTO OPERATOR SUCCESS");
                            cb(null,result);
                        });
                    },
                    function(cb){
                        // 设置更新客户销售范围
                        db.addClientSaleScope(connect, dbName, clientId, saleScope, function(err, result){
                            if(err){cb(err)}
                            logger.debug("INSERT GOODSGSPTYPEID INTO CLIENTSALESCOPE SUCCESS");
                            cb(null,result);
                        });
                    },
                    // 更新授信额度和授信账期
                    function(cb){
                        db.updateClientFinanceByConnect(connect, dbName, credits, clientId, function(err, rows) {
                            if(err) {
                                logger.error(err);
                                cb(err);
                            }else {
                                logger.debug("INSERT CREDITS INTO CLIENTFINANCE SUCCESS");
                                cb(null,rows);
                            }
                        })
                    }
                ],
                function(err, results) {
                    if (err) {
                        logger.enter();
                        // rollback transaction
                        db.rollbackTrans(connect, function(){
                            callback(err);
                        });
                    } else {
                        // commit transaction
                        db.commitTrans(connect, function(){
                            callback(null, results[0]);
                        });
                    }
                });
            })
        },

        /**
         * update client function
         * @param customerDBName
         * @param clientInfo
         * @param callback
         */
        customerUpdateClient: function(customerDBName, clientInfo, gspInfo, gspTypeIds, clientId, saleScope, credits,oldCredits,operatorId,callback) {
            logger.enter();
            db.beginTrans(function (connect) {
                async.series(
                    [
                        /**
                         * update ClientInfo by clientId
                         * @param done
                         */
                            function updateClientInfo(done){
                            db.metaUpdateClientInfo(connect, customerDBName, clientInfo, clientId, function(err, affectedRows){
                                done(err, affectedRows);
                            });
                        },

                        /**
                         * 暂时商户不能修改客户的密码
                         * update OperatorInfo by clientId
                         * @param done
                         */
                            /*function updateOperatorInfo(done){
                            db.metaUpdateOperatorInfo(connect, customerDBName, clientInfo, clientId, function(err, affectedRows){
                                done(err, affectedRows);
                            });
                        }*/
                        function updateGspInfo(cb) {
                            db.updateGSP(connect, customerDBName, gspInfo, clientId, function(err, results) {
                                cb(err, results);
                            });
                        },

                        //清空原有的GSP类型控制数据
                        function clearGspTypeInfo(cb) {
                            db.metaClearGSPTypes(connect, customerDBName, clientId, function(err, results) {
                                cb(err, results);
                            });
                        },
                        //插入新GSP类型控制数据
                        function updateGspTypeLink(done){
                            logger.enter();
                            async.mapSeries(
                                gspTypeIds,
                                function(item, callback) {
                                    db.metaNewClientGspLinks(connect, customerDBName, clientId,Number(item),
                                        function (error, result) {
                                            if (error) {
                                                logger.error(error);
                                                callback(error);
                                            } else {
                                                logger.trace("Update gspId="+item+" gsp contol link successfully");
                                                callback(error, result);
                                            }
                                        }
                                    );
                                },
                                function(err,results) {
                                    if(err){
                                        done(err);
                                    }else{
                                        done(err,results)
                                    }
                            });
                        },
                        function(done){
                            db.clearClientSaleScope(connect, customerDBName, clientId, function(err, result){
                                if(err){done(err)}
                                logger.debug("CLEAR GOODSGSPTYPEID INTO CLIENTSALESCOPE SUCCESS");
                                done(null,result);
                            });
                        },
                        function(done){
                            // 设置更新客户销售范围
                            db.addClientSaleScope(connect, customerDBName, clientId, saleScope, function(err, result){
                                if(err){done(err)}
                                logger.debug("INSERT GOODSGSPTYPEID INTO CLIENTSALESCOPE SUCCESS");
                                done(null,result);
                            });
                        },
                        function(done){
                            //如果授信额度有变化,则写入历史表
                            if(oldCredits!==credits){
                                var insertObj={
                                    operatorId:operatorId,
                                    clientId:clientId,
                                    oldCredit:oldCredits,
                                    currentCredit:credits
                                };
                                db.insertClientCreditHistory(connect,customerDBName,insertObj,function(err,result){
                                    if(err){
                                        logger.error(err);
                                        done(err);
                                    }else{
                                        done(err,result);
                                    }
                                });
                            }else{
                                done(null,credits);//直接回调
                            }
                        }
                        ,
                        // 更新授信额度
                        function(cb){
                            db.updateClientFinanceByConnect(connect, customerDBName, credits, clientId, function(err, rows) {
                                if(err) {
                                    logger.error(err);
                                    cb(err);
                                }else {
                                    logger.debug("INSERT CREDITS INTO CLIENTFINANCE SUCCESS");
                                    cb(null,rows);
                                }
                            })
                        }
                    ],
                    /**
                     * On final step to finish a transaction
                     * @param err
                     * @param resultList
                     */
                    function(err, resultList) {
                        if (err && typeof(err)==="object") {
                            logger.enter();
                            // rollback transaction
                            db.rollbackTrans(connect, function(){
                                callback(err);
                            });
                        } else {
                            logger.enter();
                            // commit transaction
                            db.commitTrans(connect, function(){
                                callback(null);
                            });
                        }
                    }
                );
            });
        },
        /**
         * 更新客户状态信息
         * @param customerDBName
         * @param clientId
         * @param statusName
         * @param status
         * @param callback
         */
        customerUpdateStatusClient: function(customerDBName,clientId,statusName,status,callback) {
            logger.enter();
            logger.trace("status===" +status);
            db.updateClientStatus(customerDBName,clientId,statusName,status,function(err,affectedRows){
                /*if(affectedRows){
                    callback(affectedRows);
                }*/
                callback(err,affectedRows);
            })
        },

        /**
         * 获取用户经营范围
         * @param customerDBName
         * @param callback
         */
        getClientSaleScope: function(customerDBName, clientId, callback){
            logger.enter();
            var data = {};
            async.series([
                // 获取所有商品GSP类别信息
                function(done){
                    db.listGoodsGspTypes(customerDBName, function(err, results) {
                        if (err) {
                            logger.error(error);
                            done(err);
                        }
                        else{
                            data.goodsGspTypeList = results;
                            done(err, results);
                        }
                    });
                },
                //获取该用户的销售范围
                function(done){
                    db.selectClientSaleScope(customerDBName, clientId, function(err, results){
                        if (err) {
                            logger.error(err);
                            done(err);
                        }
                        else{
                            data.clientSaleScope = results;
                            done(err, results);
                        }
                    });
                }
            ], function(err, resultlist){
                if (err && typeof(err) === "object") {
                    logger.error(err);
                    callback(err);
                }else{
                    logger.ndump("resultlist ", resultlist);
                    underscore.map(data.goodsGspTypeList, function(goodsGspType) {
                        goodsGspType['isSelected'] = false;
                        underscore.map(data.clientSaleScope, function(saleScope) {
                            if(goodsGspType.id == saleScope.id){
                                goodsGspType['isSelected'] = true;
                            }
                        });
                    });
                    callback(err, data.goodsGspTypeList);
                }
            });
        },



        //客户自己提交更新Gsp信息  这里是在GSPUPDATE gspIdlinksUpdate
        updateClientGSPbyClient:function(customerDBName,clientData,clientId,stampLink,status,gspTypes,callback){
                async.series([
                        //step 1 updateGsp
                        function(done){
                            registerModel.clientAddUpdatedInfo(customerDBName, clientData, function(err, result) {
                                if(err){
                                    done(err);
                                }else{
                                    done(err,result);
                                }
                            });
                        },
                        //step2 update special pic StampLink
                        function(done){
                            db.ClientUpdateStampLinkInfo(customerDBName,clientId,stampLink, function(err, result) {
                                if(err){
                                    done(err);
                                }else{
                                    done(err,result);
                                }

                            });
                        }
                        ,
                        // step3 update status
                        function(done){
                            db.setClientStatusFromREJECTEDtoCREATED(customerDBName,clientId,status,function(err,result){
                                if(err){
                                    done(err);
                                }else{
                                    done(err,result);
                                }

                            });
                        },
                        //step4 更新gsp控制类型,在这个方法里面执行事务,
                        // 客户自己更新 是更新到 ClientGspIdLinksUpdate 里面去,商户审核的时候将该信息更新到ClientGspIdLinks里面
                        function(done){
                                var newUUID=uuid.v1(); // Generate a v1 (time-based) id
                                underscore.each(gspTypes,function(item){
                                    item.push(newUUID);
                                });

                            db.metaGspTypesUpdateBatchInsert(customerDBName,gspTypes,function(err,result){
                                    if(err){
                                        logger.error(err);
                                        done(err);
                                    }else{
                                        done(err,result);
                                    }
                                });
                        },

                    ],

                    function(err,resultList){
                          if (err && typeof(err) === "object") {
                                logger.error(err);
                                 callback(err);
                          }else{
                              callback(err,resultList);
                          }

                });




        },
        //从ClientGspIdlinksUpdate取出的数据格式化
        getClientGSPIdLinksUpdateByClientId:function(customerDBName,clientId,callback){
            db.getGSPTypesFromUpdateById(customerDBName,clientId,function(err,result){
                    if(err){
                        logger.error(err);
                        callback(err);
                    }else{
                        if(result.length==0){
                            callback(err,result);
                        }else {
                            result = formatClientGspIdLinksUpdateData(result);
                            callback(err, result);
                        }
                    }
            });

        },

        /**
         * 获取审核更新状态的客户信息
         * @param customerDB
         * @param data
         * @param paginator
         * @param callback
         */
        getClientUpdateStatusInfo: function(customerDB, data, paginator, callback) {
            logger.enter();
            async.series([
                function (done) {
                    db.updatedClientRetrieveAll(customerDB, data.clientName, paginator, function (error, clients) {
                        if(error) {
                            done(error);
                        }
                        else{
                            data.clients = clients;
                            done(null, clients);
                        }
                    });
                },
                function (done) {
                    db.getClientSumsByRegisterStatus(customerDB, function(error, results) {
                        if(error) {
                            done(error);
                        }
                        else {
                            data.clientStatusNum = results;
                            done(null, results);
                        }
                    });
                }
            ], function(err, results) {
                if(err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    logger.ndump(results);
                    callback(null, data);
                }
            });
        },

        getClientCreatedStatusInfo: function(customerDB, data, paginator, callback) {
            logger.enter();
            async.series([
                function (done) {
                    db.newRegisteredClientRetrieveAll(customerDB, data.clientName, paginator, function (error, clients) {
                        if(error) {
                            done(error);
                        }
                        else{
                            data.clients = clients;
                            done(null, clients);
                        }
                    });
                },
                function (done) {
                    db.getClientSumsByRegisterStatus(customerDB, function(error, results) {
                        if(error) {
                            done(error);
                        }
                        else {
                            data.clientStatusNum = results;
                            done(null, results);
                        }
                    });
                }
            ], function(err, results) {
                if(err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    logger.ndump(results);
                    callback(null, data);
                }
            });
        },

        /**
         * 获取审核拒绝状态的客户信息
         * @param customerDB
         * @param data
         * @param paginator
         * @param callback
         */
        getClientRejectStatusInfo: function(customerDB, data, paginator, callback) {
            logger.enter();
            async.series([
                function (done) {
                    db.rejectedRegisterClientRetrieveAll(customerDB, data.clientName, paginator, function (error, clients) {
                        if(error) {
                            done(error);
                        }
                        else{
                            data.clients = clients;
                            done(null, clients);
                        }
                    });
                },
                function (done) {
                    db.getClientSumsByRegisterStatus(customerDB, function(error, results) {
                        if(error) {
                            done(error);
                        }
                        else {
                            data.clientStatusNum = results;
                            done(null, results);
                        }
                    });
                }
            ], function(err, results) {
                if(err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    logger.ndump(results);
                    callback(null, data);
                }
            });
        },

        /**
         * 获取所有已审客户数据
         * @param customerDB
         * @param data
         * @param paginator
         * @param callback
         */
        getApprovedStatusClients: function(customerDB, data, paginator, callback) {
            logger.enter();
            async.series([
                function (done) {
                    db.listClients(__mysql, customerDB, paginator, data.clientName, function (err, clients) {
                        done(err, clients);
                    });
                },
                function (done) {
                    db.getClientCategory(customerDB, function (err, categories) {
                        done(err, categories);
                    });
                },
                function (done) {
                    db.getClientSumsByRegisterStatus(customerDB, function (err, clientSumsGroupByRegisterStatus) {
                        done(err, clientSumsGroupByRegisterStatus);
                    });
                }
            ],
            function (err, resultList) {
                logger.ndump("err", err);
                if (err && typeof(err) === "object") {
                    logger.error(err);
                    callback(err);
                }
                else {
                    var categoryNames = [];
                    for (var c in resultList[1]) {
                        categoryNames.push(resultList[1][c].categoryName);
                    }
                    data.clients = resultList[0];
                    data.clientCategorys = categoryNames;
                    data.clientSumsGroupByRegisterStatus = resultList[2];
                    callback(null, data);
                }
            });
        },


        /**
         * 获取不同审核状态下客户数据
         * @param customerDB
         * @param data
         * @param paginator
         * @param callback
         */
        getRegisterStatusClients: function(customerDB, data, paginator, callback) {
            logger.enter();
            logger.enter();
            async.series([
                function (done) {
                    // 获取客户地区列表
                    db.getClientArea(customerDB, function(error, arealist) {
                        if(error) {
                            done(error);
                        }
                        else{
                            data.clientArea = arealist;
                            done(null, arealist);
                        }
                    });
                },
                function (done) {
                    // 筛选客户列表
                    db.getRegisterClientRetrieveAll(customerDB, paginator, function (error, clients) {
                        if(error) {
                            done(error);
                        }
                        else{
                            data.clients = clients;
                            done(null, clients);
                        }
                    });
                },
                function (done) {
                    // 数量统计
                    db.getClientSumsByRegisterStatus(customerDB, function(error, results) {
                        if(error) {
                            done(error);
                        }
                        else {
                            data.clientStatusNum = results;
                            done(null, results);
                        }
                    });
                }
            ], function(err, results) {
                if(err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    logger.ndump(results);
                    callback(null, data);
                }
            });
        },

        /**
         * 获取单品价格信息
         * @param customerDB
         * @param data
         * @param clientId
         * @param paginator
         * @param callback
         */
        getProductPrice: function(customerDB, data, paginator, callback) {
            logger.enter();
            var productPrice;
            async.series([
                function (done) {
                    db.getClientById(customerDB, data.clientId, function(err, client) {
                        if(err) {
                            return done(err);
                        }
                        data.client = client;
                        done(null, client);
                    });
                },
                function (done) {
                    db.listClientGoods(customerDB, data.clientId, paginator, function(err, result) {
                        if(err) {
                            return done(err);
                        }
                        productPrice = result;
                        done(null, productPrice);
                    });
                }
            ], function(err, resultList) {
                logger.ndump("err", err);
                if (err && typeof(err) === "object") {
                    logger.error(err);
                    callback(err);
                }
                else {
                    logger.debug(JSON.stringify(resultList));
                    callback(null, {data: data, productPrice: productPrice});
                }
            });

            db.getClientById(customerDBName,clientId,function(err,client){
                db.listClientGoods(customerDBName,clientId,paginator,function(err,productPrice){
                    data.client = client;
                    logger.debug(JSON.stringify(productPrice));
                    data['paginator']=model.restorePurePaginator(paginator);
                    res.render('customer/center/client/priceSet', {data: data, productprice: productPrice})
                })
            })
        },

        /**
         * 更新商品客户价格数据
         * @param customerDB
         * @param data
         * @param callback
         */
        putClientPrice: function(customerDB, data, callback) {
            logger.enter();
            db.clientUpdatePrice(customerDB, data.newPrice, data.clientId, data.goodsId, function(err, result){
                callback(err, result);
            });
        },

        /**
         * 删除商品价格数据
         * @param customerDB
         * @param data
         * @param callback
         */
        delClientPrice: function(customerDB, data, callback) {
            logger.enter();
            db.clientDeleteGoods(customerDB, data.clientId, data.goodsId, function(err, result){
                callback(err, result);
            });
        },

        /**
         * 获取客户授信额度信息
         * @param customerDB
         * @param clientId
         * @param callback
         */
        getClientFinance: function(customerDB, clientId, callback) {
            logger.enter();
            db.getClientFinance(customerDB, clientId, function(err, result) {
                callback(err, result);
            });
        },

        /**
         * 新增客户授信额度信息
         * @param customerDB
         * @param data
         * @param callback
         */
        postClientPrice: function(customerDB, data, callback) {
            logger.enter();
            db.clientAddGoods(customerDB, data, function(err, clientPriceId){
                callback(err, clientPriceId);
            });
        },

        /**
         * 查询证照是否已过期
         * @param callback
         */
        getIsExpire: function(customerId, clientId, callback) {
            logger.enter();
            var isExpire = false;
            var customerList;
            var licenseInfo;
            var popMsg = {};
            var detail = {};
            async.series([
                function (done) {
                    db.getCustomerDBList(function (err, result){
                        if(err) {
                            done(err);
                        }
                        else {
                            customerList = result;
                            done(null, result);
                        }
                    });
                },
                function (done) {
                    db.getClientGspList(customerList, function (err, result) {
                        if(err) {
                            done(err);
                        }
                        else{
                            for (var k = 0; k < result.length; k++) {
                                if (result[k].customerId == customerId) {
                                    popMsg = result[k];
                                }
                            }
                            for (var i = 0; i < popMsg.details.length; i++) {
                                if (popMsg.details[i].clientId == clientId) {
                                    detail = popMsg.details[i];
                                }
                            }
                            done(null, result);
                        }
                    });
                },
                function (done) {
                    //筛选证照的deadline以及剩余天数
                    db.compareExpireLicense(detail, function (err, result) {
                        if(err) {
                            return done(err);
                        }
                        licenseInfo = result;
                        done(null, result);
                    });
                },
            ], function (err, resultList) {
                if(err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    for (var j = 0; j < licenseInfo.length; j++) {
                        if (licenseInfo[j].leftDays < 0) {
                            isExpire = true;
                        }
                    }
                    callback(null, isExpire);
                }
            });
        },

        /**
         * 更新客户状态
         * @param customerDB
         * @param bodyData
         * @param updateClientIds
         * @param callback
         */
        putClientStatus: function(customerDB, bodyData, updateClientIds, callback) {
            logger.enter();
            db.mutiUpdateClientStatus(customerDB, updateClientIds, bodyData.statusName, bodyData.status, function(affectedRows){
                callback(affectedRows);
            });

        },

        /**
         * 获取不同审核状态下客户数据
         * @param customerDB
         * @param data
         * @param paginator
         * @param callback
         */
        getRegisterStatusClientList: function(customerDB, data, filter, callback) {
            logger.enter();
            async.series([
                function (done) {
                    // 获取客户地区列表
                    db.getClientArea(customerDB, function(error, arealist) {
                        if(error) {
                            done(error);
                        }
                        else{
                            data.clientArea = arealist;
                            done(null, arealist);
                        }
                    });
                },
                function (done) {
                    // 筛选客户列表
                    db.getRegisterClientRetrieveAllByKnex(customerDB, filter, function (error, clients) {
                        if(error) {
                            done(error);
                        }
                        else{
                            data.clients = clients;
                            done(null, clients);
                        }
                    });
                },
                function (done) {
                    // 数量统计
                    db.getClientSumsByRegisterStatus(customerDB, function(error, results) {
                        if(error) {
                            done(error);
                        }
                        else {
                            data.clientStatusNum = results;
                            done(null, results);
                        }
                    });
                }
            ], function(err, results) {
                if(err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    logger.ndump(results);
                    callback(null, data);
                }
            });
        },

        //make Paginator start
        createGoodsPaginator: function (req) {
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'GoodsInfo';

            var categoryA = {};
            var categoryB = {};
            var keywordA = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: goodsFieldMapper.convertToField(req.query.caf) || "commonName",
                categoryValue: req.query.cav || "%",
                //categoryBField: goodsFieldMapper.convertToField(req.query.cbf) || "commonName",
                //categoryBValue: req.query.cbv || "%",
                keywordField: goodsFieldMapper.convertToField(req.query.kf) || "commonName",
                keywordValue: req.query.kv || "%",
                sortField: goodsFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isNaN(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                categoryA.field = param.categoryField;
                categoryA.value = param.categoryValue;
                if(/(onSell)$/i.test(param.categoryField)) {
                    categoryA.tableName = 'GoodsInventory';
                }
            }
            if (!underscore.isNaN(param.categoryBValue) && !underscore.isEmpty(param.categoryBField)) {
                categoryB.field = param.categoryBField;
                categoryB.value = param.categoryBValue;
                if(/(onSell)$/i.test(param.categoryBField)) {
                    categoryB.tableName = 'GoodsInventory';
                }
                if(/(goodsType)$/i.test(param.categoryBField)) {
                    categoryB.value = Number(param.categoryBValue);
                }
            }
            if (!underscore.isEmpty(param.keywordField) && !underscore.isEmpty(param.keywordValue) || !underscore.isEmpty(param.keywordBValue)) {
                keywordA.field = param.keywordField;
                keywordA.value = param.keywordValue;
                keywordA.tableName = tableName
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
                if(/(price)$/i.test(param.sortField)) {
                    s.tableName = 'ClientGoodsPrice';
                }else if(/(refRetailPrice)$/i.test(param.sortField)) {
                    s.tableName = 'GoodsPrice';
                }

                if(/(commonName)/.test(param.sortField)){
                    s.tableName="";
                    s.field="CONVERT(commonName USING gb2312)";
                }
                if(/(producer)/.test(param.sortField)){
                    s.tableName="";
                    s.field="CONVERT(producer USING gb2312)";
                }
                if(/(boughtTimes)$/.test(param.sortField) || /(boughtAmount)$/.test(param.sortField)) {
                    s.tableName = 'GoodsTopBuy';
                }
            }
            if (typeof param.page == 'number') {
                p = param.page;
            }
            if (typeof param.pageSize == 'number') {
                ps = param.pageSize;
            }

            if (!underscore.isEmpty(categoryA)) {
                categoryList.push(categoryA);
            }
            if (!underscore.isEmpty(categoryB)) {
                categoryList.push(categoryB);
            }
            if (!underscore.isEmpty(keywordA)) {
                keywordList.push(keywordA);
            }
            if (!underscore.isEmpty(s)) {
                sort = s;
            }
            if (!underscore.isNaN(p)) {
                page = p;
            }
            if (!underscore.isNaN(ps)) {
                pageSize = ps;
            }

            return new Paginator(categoryList, keywordList, sort, page, pageSize);
        },
        restoreGoodsPaginator: function (paginator) {
            var p = {};
            //p.cf = goodsFieldMapper.convertToAlias(paginator.categoryList[0].field);
            //p.cv = paginator.categoryList[0].value;
            p.caf = goodsFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cav = paginator.categoryList[0].value;
            /*
             p.cbf = goodsFieldMapper.convertToAlias(paginator.categoryList[1].field);
             if(/(产品类别)$/i.test(p.cbf)) {
             p.cbv = "0";
             }else{
             p.cbv = paginator.categoryList[1].value;
             }
             */
            p.kf = goodsFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = goodsFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },
        createPurePaginator: function(req){
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page =  Number(req.query.p) || 1;
            var pageSize = Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10;
            //pageSize=
            return new Paginator(categoryList, keywordList, sort, page, pageSize);
        },
        restorePurePaginator:function(paginator){
            var p = {};
            p.caf = '';
            p.cav = '';
            p.cbf = '';
            p.cbv = '';
            p.kf =  '';
            p.kv =  '';
            p.sf =  '';
            p.sv =  '';
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },
        createPriceSetPaginator:function(req){
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'GoodsInfo';

            var categoryA = {};
            var categoryB = {};
            var keywordA = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: goodsFieldMapper.convertToField(req.query.caf) || "commonName",
                categoryValue: req.query.cav || "%",
                //categoryBField: goodsFieldMapper.convertToField(req.query.cbf) || "commonName",
                //categoryBValue: req.query.cbv || "%",
                keywordField: goodsFieldMapper.convertToField(req.query.kf) || "commonName",
                keywordValue: req.query.kv || "%",
                sortField: goodsFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isNaN(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                categoryA.field = param.categoryField;
                categoryA.value = param.categoryValue;
                if(/(onSell)$/i.test(param.categoryField)) {
                    categoryA.tableName = 'GoodsInventory';
                }
            }
            if (!underscore.isNaN(param.categoryBValue) && !underscore.isEmpty(param.categoryBField)) {
                categoryB.field = param.categoryBField;
                categoryB.value = param.categoryBValue;
                if(/(onSell)$/i.test(param.categoryBField)) {
                    categoryB.tableName = 'GoodsInventory';
                }
                if(/(goodsType)$/i.test(param.categoryBField)) {
                    categoryB.value = Number(param.categoryBValue);
                }
            }
            if (!underscore.isEmpty(param.keywordField) && !underscore.isEmpty(param.keywordValue) || !underscore.isEmpty(param.keywordBValue)) {
                keywordA.field = param.keywordField;
                keywordA.value = param.keywordValue;
                keywordA.tableName = tableName
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
                if(/(price)$/i.test(param.sortField)) {
                    s.tableName = 'ClientGoodsPrice';
                }else if(/(refRetailPrice)$/i.test(param.sortField)) {
                    s.tableName = 'GoodsPrice';
                }else if(/(createdOn)$/i.test(param.sortField)) {
                    s.tableName = 'GoodsPriceReadjust';
                }

                if(/(commonName)/.test(param.sortField)){
                    s.tableName="";
                    s.field="CONVERT(commonName USING gb2312)";
                }
                if(/(producer)/.test(param.sortField)){
                    s.tableName="";
                    s.field="CONVERT(producer USING gb2312)";
                }
                if(/(boughtTimes)$/.test(param.sortField) || /(boughtAmount)$/.test(param.sortField)) {
                    s.tableName = 'GoodsTopBuy';
                }
            }
            if (typeof param.page == 'number') {
                p = param.page;
            }
            if (typeof param.pageSize == 'number') {
                ps = param.pageSize;
            }

            if (!underscore.isEmpty(categoryA)) {
                categoryList.push(categoryA);
            }
            if (!underscore.isEmpty(categoryB)) {
                categoryList.push(categoryB);
            }
            if (!underscore.isEmpty(keywordA)) {
                keywordList.push(keywordA);
            }
            if (!underscore.isEmpty(s)) {
                sort = s;
            }
            if (!underscore.isNaN(p)) {
                page = p;
            }
            if (!underscore.isNaN(ps)) {
                pageSize = ps;
            }

            return new Paginator(categoryList, keywordList, sort, page, pageSize);
        },
        restorePriceSetPaginator:function(paginator){
            var p = {};
            //p.cf = goodsFieldMapper.convertToAlias(paginator.categoryList[0].field);
            //p.cv = paginator.categoryList[0].value;
            p.caf = goodsFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cav = paginator.categoryList[0].value;
            /*
             p.cbf = goodsFieldMapper.convertToAlias(paginator.categoryList[1].field);
             if(/(产品类别)$/i.test(p.cbf)) {
             p.cbv = "0";
             }else{
             p.cbv = paginator.categoryList[1].value;
             }
             */
            p.kf = goodsFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = goodsFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },

    };


    var formatClientGspIdLinksUpdateData=function(result){
        var result= underscore.groupBy(result,function(item){
            return item.groupGuid;
        });
        var returnResult=result[Object.keys(result)[0]]

        return returnResult ;

    };

    return model;
}