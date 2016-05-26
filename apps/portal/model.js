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
 * order/model.js
 *
 * 订单信息model
 * --------------------------------------------------------------
 * 2015-09-25   hc-romens@issue#49  added postNewOrderHandler
 *
 */

module.exports = function () {
    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;
    /*
     * load 3rd party modules
     */
    var underscore = require('underscore');
    var BigNumber = require('bignumber.js');
    var path = require('path');
    var async = require("async");
    var sprintf = require("sprintf-js").sprintf;
    var moment = require("moment");
    /*
     * load project modules
     */
    var Paginator = require(__base + '/modules/paginator');
    var NameMapper = require(__base + '/modules/fieldNameMapper');
    var FieldNameMapper = require(__base + '/modules/fieldNameMapper');
    var ApiRobot = require(__base + "/modules/apiRobot");
    var paymentModule = require(__base + "/modules/paymentModule");
    var apiModule = require(__base + "/apps/api/apiModule")();
    var idGen = require(__modules_path + "/idTwister");

    /*
     * init model name etc
     */
    var MODELNAME = __dirname.split("/").pop();
    logger.trace("Initiating model:[" + MODELNAME + "]");
    //define fieldMapper

    //model
    var model = {


        /**
         * get gsp detail
         * @param customerDB
         * @param operatorData
         * @param data
         * @param callback
         */
        getClientGspDetail:function(customerDB,operatorData,data,callback){
            logger.enter();
            var status=data._client.registerStatus;
            var gspTypes = undefined;
            async.series([
                    function(done){
                        db.listClientGspTypes(customerDB,function(err,gspTypes) {
                            if(err){
                                done(err);
                            }else{
                                data['allGspTypes']=gspTypes;
                                done();
                            }
                        });
                    },
                    function(done){
                        if(status=='CREATED'||status=='UPDATED'){
                            db.getGSPTypesFromUpdateById(customerDB,operatorData.clientId,function(err,result){
                                if(err){
                                    done(err);
                                }else{
                                    if(result.length==0){
                                        db.getGSPTypesById(customerDB, operatorData.clientId, function (err, results){
                                            if(err){
                                                done(err)
                                            }else{
                                                gspTypes = results;
                                                data.gspTypes = gspTypes;
                                                var gspTypesIds = [];
                                                underscore.each(gspTypes, function (item) {
                                                    gspTypesIds.push(item.gspTypeId);
                                                });
                                                data.gspTypesIds = gspTypesIds;
                                                db.getGSPfromClientUpdate(customerDB, operatorData.clientId, function (err, gspInfo){
                                                    if(err){
                                                        done(err)
                                                    }else{
                                                        if (underscore.isUndefined(gspInfo)) {
                                                            db.getGSP(customerDB, operatorData.clientId, function (err, gspInfo) {
                                                                if(err){
                                                                    done(err)
                                                                }else{
                                                                    data['gsp'] = gspInfo;
                                                                    db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                                                        if (err) {
                                                                            logger.error(err);
                                                                            done(err)
                                                                        } else {
                                                                            data.stampLink = client.stampLink;
                                                                            data.checkComments = client.checkComments;
                                                                            //根据该用户的状态->判断渲染是显示数据页面
                                                                            done();
                                                                        }
                                                                    });
                                                                }
                                                            })
                                                        }else{
                                                            gspInfo.registerStatus = status;
                                                            data['gsp'] = gspInfo;
                                                            db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                                                if(err){
                                                                    done(err)
                                                                }else{
                                                                    data.stampLink = client.stampLink;
                                                                    data.checkComments = client.checkComments;
                                                                    done();
                                                                }
                                                            })
                                                        }
                                                    }
                                                })
                                            }
                                        });
                                        done()
                                    }else {
                                        result = formatClientGspIdLinksUpdateData(result);
                                        gspTypes = result;
                                        var gspTypesIds = [];
                                        underscore.each(gspTypes, function (item) {
                                            gspTypesIds.push(item.gspTypeId);
                                        });
                                        data.gspTypesIds = gspTypesIds;
                                        db.getGSPfromClientUpdate(customerDB, operatorData.clientId, function (err, gspInfo){
                                            if(err){
                                                done(err)
                                            }else{
                                                if (underscore.isUndefined(gspInfo)) {
                                                    db.getGSP(customerDB, operatorData.clientId, function (err, gspInfo) {
                                                        if(err){
                                                            done(err)
                                                        }else{
                                                            data['gsp'] = gspInfo;
                                                            db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                                                if (err) {
                                                                    logger.error(err);
                                                                    done(err)
                                                                } else {
                                                                    data.stampLink = client.stampLink;
                                                                    data.checkComments = client.checkComments;
                                                                    //根据该用户的状态->判断渲染是显示数据页面
                                                                    done();
                                                                }
                                                            });
                                                        }
                                                    })
                                                }else{
                                                    gspInfo.registerStatus = status;
                                                    data['gsp'] = gspInfo;
                                                    db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                                        if(err){
                                                            done(err)
                                                        }else{
                                                            data.stampLink = client.stampLink;
                                                            data.checkComments = client.checkComments;
                                                            done();
                                                        }
                                                    })
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        }else{
                            done();
                        }
                    },
                    function(done){
                        if(status=='CREATED'||status=='UPDATED'){
                            done();
                        }else{
                            db.getGSPTypesById(customerDB, operatorData.clientId, function (err, gspTypes) {
                                if (err) {
                                    done(err)
                                }else{
                                    data.gspTypes = gspTypes;
                                    //获取客户的gsp控制类型的 id
                                    var gspTypesIds = [];
                                    underscore.each(gspTypes, function (item) {
                                        gspTypesIds.push(item.gspTypeId);
                                    });
                                    data.gspTypesIds = gspTypesIds;
                                    db.getGSP(customerDB, operatorData.clientId, function (err, gspInfo) {
                                        if (err) {
                                            done(err)
                                        }else{
                                            data['gsp'] = gspInfo;
                                            db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                                if (err) {
                                                    done(err)
                                                }else{
                                                    data.stampLink = client.stampLink;
                                                    data.checkComments = client.checkComments;
                                                    done();
                                                }
                                            })
                                        }
                                    })

                                }
                            })
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
         * post client complaint
         * @param dbName
         * @param clientId
         * @param operatorId
         * @param content
         * @param type
         * @param callback
         */
        postClientComplaint:function(dbName,clientId,operatorId,content,type,callback){
            logger.enter();
            db.complainCreateOne(dbName, clientId, operatorId, type, content, function(err,result){
                callback(err,result);
            })
        },

        /**
         * get complaint for client
         * @param dbName
         * @param clientId
         * @param callback
         */
        getPersonalComplaint :function(dbName,clientId,callback){
            logger.enter();
            db.complainRetrieveByClientId(dbName, clientId, function (err, result) {
                if(err){
                    logger.error(err);
                    callback(err)
                }else{
                    db.setComplainHasBeenReadByClientId(dbName, clientId, "DOWN", function (error, setRead) {
                        if (error) {
                            logger.error(error);
                            callback(error);
                        }else{
                            callback(null,result);
                        }
                    });
                }
            });

        },

        /**
         * 提交评论
         */
        postCheckComments:function(customerDB,comments,clientId,callback){
            logger.enter();
            db.updateCheckComments(customerDB,comments,clientId,function(err){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback();
                }
            })
        },


        /**
         * ERP设定参数提交
         * @param customerDbName
         * @param cloudDbName
         * @param operatorId
         * @param erpAppCodeUrl
         * @param erpIsAvailable
         * @param erpMsgUrl
         * @param appkey
         * @param callback
         */
        postERPsettings:function(customerDbName,cloudDbName,operatorId,
                                 erpAppCodeUrl,erpIsAvailable,erpMsgUrl,appKey,callback){
            logger.enter();
            db.retrieveCustomerIdByOperatorId(customerDbName, operatorId, function (error, customerId) {
                if (error) {
                    logger.error(error);
                    callback(error)
                }else{
                    db.updateCustomerERPSetting(cloudDbName, customerId, erpIsAvailable, erpAppCodeUrl, erpMsgUrl, appKey, function (error, result) {
                        if (error) {
                            logger.error(error);
                            callback(error);
                        }else{
                            logger.trace(result);
                            callback(null,result);
                        }
                    });
                }
            });

        },



        /**
         * ERP CLIENT SETTING
         * @param customerDbName
         * @param operatorId
         * @param data
         * @param callback
         */
        getClientERPsetting: function(customerDbName,operatorId,data,callback){
            logger.enter();
            db.retrieveCustomerIdByOperatorId(customerDbName, operatorId, function (error, customerId) {
                if (error) {
                    logger.error(error);
                    callback(error);
                }else{
                    data.customerId = customerId;
                    db.retrieveCustomerERPSetting(__cloudDBName, customerId, function (error, result) {
                        if (error) {
                            logger.error(error);
                            callback(error);
                            return
                        }
                        data.erpSetting = result[0];
                        var key = "ERP.appCode." + customerId;
                        __redisClient.get(key, function(error, appcode){
                            if (error) {
                                logger.error(error);
                                callback(error);
                                return
                            }
                            data.appCode = appcode || "暂无" ;
                            callback(null,data);
                        });
                    });
                }
            });
        },
        /**
         * client personal info
         * @param customerDB
         * @param operatorData
         * @param data
         * @param callback
         */
        getClientPersonalInfo : function(customerDB,operatorData,data,callback){
            logger.enter();
            //add this page data
            //add this page data
            data.clientModifyGSP = __clientModifyGSP;
            if (operatorData.operatorType === "CUSTOMER") {
                callback("CUSTOMER");
            }
            data.paginator = {};
            var status=data._client.registerStatus;
            //获取所有的gsp控制类型
            db.listClientGspTypes(customerDB,function(err,gspTypes) {
                if(err){
                    logger.error(err);
                   callback(err);
                }
                data['allGspTypes']=gspTypes;
                //获取客户的gsp控制类型
                //获取gsp控制类型 在created 和updated 的时候 从 ClientGspIdLinksUpdate 表里面获取
                //在created 的状态下 可能从ClientGspIdLinks里面取
                // 其他情况从ClientGspIdLinks获取
                if(status=='CREATED'||status=='UPDATED')
                {
                    db.getGSPTypesFromUpdateById(customerDB,clientId,function(err,result){
                        if(err){
                            logger.error(err);
                            callback(err);
                            return;
                        }
                        gspTypes = formatClientGspIdLinksUpdateData(result);
                        //如果等于0,则从GspIdLinks表格里面取
                        if (gspTypes.length == 0) {
                            db.getGSPTypesById(customerDB, operatorData.clientId, function (err, gspTypes) {
                                if (err) {
                                    logger.error(err);
                                    callback("500");
                                    return;
                                }
                                data.gspTypes = gspTypes;
                                //获取客户的gsp控制类型的 id
                                var gspTypesIds = [];
                                underscore.each(gspTypes, function (item) {
                                    gspTypesIds.push(item.gspTypeId);
                                });
                                data.gspTypesIds = gspTypesIds;
                                //先从ClientUpdate取数据,如果没有,则从ClientGsp取数据 ,除去这两个状态其他全部从Gsp里面去
                                db.getGSPfromClientUpdate(customerDB, operatorData.clientId, function (err, gspInfo) {
                                    if (err) {
                                        logger.error(err);
                                        callback("500");
                                        return;
                                    } else {
                                        if (underscore.isUndefined(gspInfo)) {
                                            logger.error('老的Gsp 表格里面');
                                            db.getGSP(customerDB, operatorData.clientId, function (err, gspInfo) {
                                                if (err) {
                                                    logger.error(err);
                                                    callback("500");
                                                    return;
                                                } else {
                                                    data['gsp'] = gspInfo;
                                                    db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                                        if (err) {
                                                            logger.error(err);
                                                            callback("500");
                                                            return;
                                                        } else {
                                                            data.stampLink = client.stampLink;
                                                            //根据该用户的状态->判断渲染是显示数据页面
                                                            db.listAddress(customerDB, req.session.operator.clientId, function (err,address) {
                                                                if (err) {
                                                                    logger.error(err);
                                                                    callback("500");
                                                                    return;
                                                                } else {
                                                                    data['address'] = address;
                                                                    data['__shipToRegisteredAddressOnly']=__shipToRegisteredAddressOnly;
                                                                    data['defaultAddress']='这是默认地址';
                                                                    data.paginator = {};
                                                                    data.defaultAddress=gspInfo.defaultAddress;
                                                                    logger.ndump('data', data);
                                                                    callback(null,data);
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                        else {
                                            logger.error('从新的GspUpdate表格里面取的....');
                                            gspInfo.registerStatus = status;
                                            data['gsp'] = gspInfo;
                                            db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                                data.stampLink = client.stampLink;
                                                if (err) {
                                                    logger.error(err);
                                                    res.render('error/500');
                                                } else {
                                                    db.listAddress(customerDB, req.session.operator.clientId, function (err,address) {
                                                        if (err) {
                                                            logger.error(err);
                                                            res.render('error/500');
                                                        } else {
                                                            data['address'] = address;
                                                            data['__shipToRegisteredAddressOnly']=__shipToRegisteredAddressOnly;
                                                            data['defaultAddress']='这是默认地址';
                                                            data.paginator = {};
                                                            data.defaultAddress=gspInfo.defaultAddress;
                                                            logger.ndump('data', data);
                                                            res.render('customer/portal/personal_info', {data: data});
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                });

                            });
                        } else {
                            data.gspTypes = gspTypes;
                            //获取客户的gsp控制类型的 id
                            var gspTypesIds = [];
                            underscore.each(gspTypes, function (item) {
                                gspTypesIds.push(item.gspTypeId);
                            });
                            data.gspTypesIds = gspTypesIds;
                            //先从ClientUpdate取数据,如果没有,则从ClientGsp取数据 ,除去这两个状态其他全部从Gsp里面去
                            db.getGSPfromClientUpdate(customerDB, operatorData.clientId, function (err, gspInfo) {
                                if (err) {
                                    logger.error(err);
                                    callback("500");
                                    return;
                                } else {
                                    if (underscore.isUndefined(gspInfo)) {
                                        db.getGSP(customerDB, operatorData.clientId, function (err, gspInfo) {
                                            if (err) {
                                                logger.error(err);
                                                callback("500");
                                                return;
                                            }
                                            else {
                                                data['gsp'] = gspInfo;
                                                db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                                    if (err) {
                                                        logger.error(err);
                                                        callback("500");
                                                        return;
                                                    } else {
                                                        data.stampLink = client.stampLink;
                                                        //根据该用户的状态->判断渲染是显示数据页面
                                                        db.listAddress(customerDB, req.session.operator.clientId, function (err,address) {
                                                            if (err) {
                                                                logger.error(err);
                                                                callback("500");
                                                                return;
                                                            } else {
                                                                data['address'] = address;
                                                                data['__shipToRegisteredAddressOnly']=__shipToRegisteredAddressOnly;
                                                                data['defaultAddress']='这是默认地址';
                                                                data.paginator = {};
                                                                data.defaultAddress=gspInfo.defaultAddress;
                                                                logger.ndump('data', data);
                                                               callback(null,data)
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    else {
                                        gspInfo.registerStatus = status;
                                        data['gsp'] = gspInfo;
                                        db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                            data.stampLink = client.stampLink;
                                            if (err) {
                                                logger.error(err);
                                                res.render('error/500');
                                            } else {
                                                db.listAddress(customerDB, req.session.operator.clientId, function (err,address) {
                                                    if (err) {
                                                        logger.error(err);
                                                        res.render('error/500');
                                                    } else {
                                                        data['address'] = address;
                                                        data['__shipToRegisteredAddressOnly']=__shipToRegisteredAddressOnly;
                                                        data['defaultAddress']='这是默认地址';
                                                        data.paginator = {};
                                                        data.defaultAddress=gspInfo.defaultAddress;
                                                        logger.ndump('data', data);
                                                        res.render('customer/portal/personal_info', {data: data});
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    })
                }else {
                    db.getGSPTypesById(customerDB, operatorData.clientId, function (err, gspTypes) {
                        if (err) {
                            logger.error(err);
                            callback("500");
                        }
                        data.gspTypes = gspTypes;
                        //获取客户的gsp控制类型的 id
                        var gspTypesIds = [];
                        underscore.each(gspTypes, function (item) {
                            gspTypesIds.push(item.gspTypeId);
                        });
                        data.gspTypesIds = gspTypesIds;
                        //先从ClientUpdate取数据,如果没有,则从ClientGsp取数据 ,除去这两个状态其他全部从Gsp里面去
                        db.getGSP(customerDB, operatorData.clientId, function (err, gspInfo) {
                            if (err) {
                                logger.error(err);
                                callback("500");
                            } else {
                                data['gsp'] = gspInfo;
                                db.getClientById(customerDB, operatorData.clientId, function (err, client) {
                                    if (err) {
                                        logger.error(err);
                                        callback("500");
                                    } else {
                                        data.stampLink = client.stampLink;
                                        //根据该用户的状态->判断渲染是显示数据页面
                                        db.listAddress(customerDB, operatorData.clientId, function (err,address) {
                                            if (err) {
                                                logger.error(err);
                                                callback("500");
                                            } else {
                                                data['address'] = address;
                                                data['__shipToRegisteredAddressOnly']=__shipToRegisteredAddressOnly;
                                                data['defaultAddress']='这是默认地址';
                                                data.paginator = {};
                                                data.defaultAddress=gspInfo.defaultAddress;
                                                logger.ndump('data', data);
                                                callback(null,data);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            });
        },
        /**
         * 获取个人中心页面
         * @param customerDB
         * @param clientId
         * @param operatorType
         * @param num
         * @param orderFreqlimitNum
         * @param data
         * @param callback
         */
         getCenterInfo : function(customerDB,clientId,operatorType,num,orderFreqlimitNum,data,callback){
             logger.enter();
             //如果没有前后依赖关系的可通过并发来提高效率
             db.getClientFreqBuyById(customerDB,clientId,function(err,freqBuyInfo){
                 //退货待发货
                 db.countReturnInfoByStatusNotRelatedWithOrder(customerDB,clientId,'APPROVED',function(err,result){
                     //countOrdersByStatus
                     db.metaRetreiveShipCountsByStatusAndClient(customerDB,clientId,function(err,countResult){
                         var key = "checkOutDays";
                         db.getKeyValue(customerDB,key,function(value){
                             data.accoutDays = value;
                             db.getClientFinance(customerDB, clientId, function(err, results) {
                                 data['orderCount'] = countResult;
                                 data['returnCount'] = result[0]; //退货待发货
                                 data['orderFreqBuy'] = freqBuyInfo;//常购商品
                                 data.limitNum = orderFreqlimitNum;
                                 data.clientFinance = results;
                                 data.num = num;
                                 if (operatorType === "CUSTOMER")
                                    callback("REDIRECT");
                                 else{
                                     db.complainCountUnreadByClientId(customerDB, clientId, function (error, result) {
                                         if (error) {
                                            callback("DBFAILURE");
                                         }else{
                                             data.unreadComplainCount = result[0].unreadComplainCount;
                                             callback(null,data);
                                         }
                                     });
                                 }
                             });
                         })

                     });
                 });
             });


         },


     getClientUnreadMessageCounts:function(customerDB,clientId,callback){
            db.hasNewClientMessage(customerDB,clientId,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,result);
                }
            });
        }
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
