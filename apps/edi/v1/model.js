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
 * v1 model
 * --------------------------------------------------------------
 *
 *
 */

module.exports = function () {
    var logger = __logService;
    var db = __dbService;
    var cache = __cacheService;

    var MODELNAME = __dirname.split("/").pop();

    var underscore = require("underscore");
    var moment = require('moment');
    var url = require('url');
    var querystring = require('querystring');
    var http = require('http');
    var crypto = require('crypto');
    var _ = require('lodash');

    var async = require('async');
    var sprintf = require("sprintf-js").sprintf;
    var smsModule = require(__modules_path + "/smsModule")();
    var ERPGoodsAsync = require(__base + '/tools/goodsAsync/ERPGoodsAsync');
    var MsgTransmitter = require(__modules_path + '/msgTransmitter');
    var cloudTask = require(__services_path + "/db/cloud/task")();

    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;

    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {

        /**
         * set app key to customer
         * @param enterpriseId
         * @param appKey
         * @param callback
         */
        putAppKeyToCustomer : function(enterpriseId,appKey,callback) {
            logger.enter();
            db.putAppKeyToDB(__cloudDBName,enterpriseId,appKey,function(err,result){
                callback(err,result);
            })
        },

        /**
         * get My suppliers
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getMySuppliers : function(enterpriseId,filter,callback){
            logger.enter();
            var suppliers = {};
            var dbName = undefined;
            var errmsg = "";
            async.series([
                    //get dbName
                    function(cb){
                        db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                            if (err||results.length ==0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                cb(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                dbName = __customerDBPrefix + "_" + dbSuffix;
                                cb();
                            }
                        })
                    },
                    //clientSellerTotal:"供应商总数"
                    function(cb){
                        db.getTotalofClientSellers(dbName,enterpriseId,function(err,result){
                            if(err){
                                cb(err)
                            }else{
                                suppliers.clientSellerTotal = 0;
                                if(result.length!=0) {
                                    suppliers.clientSellerTotal = result[0].clientSellerTotal;
                                    logger.debug("clientSellerTotal = " +  suppliers.clientSellerTotal);
                                }
                                cb();
                            }
                        })
                    },
                    //clientSellerMatched:"供应商匹配数"
                    function(cb){
                        db.getMatchedofClientSellers(dbName,enterpriseId,function(err,result){
                            if(err){
                                cb(err)
                            }else{
                                suppliers.clientSellerMatched = 0;
                                if(result.length!=0) {
                                    suppliers.clientSellerMatched = result[0].clientSellerMatched;
                                    logger.debug("clientSellerMatched = " +  suppliers.clientSellerMatched);
                                }
                                cb();
                            }
                        })
                    },
                    //clients list
                    function(cb){
                        db.getMySupplierList(dbName,enterpriseId,filter,function(err,results){
                            if(err){
                                cb(err);
                            }else{
                                suppliers.supplierList = results;
                                cb()
                            }
                        });
                    },
                    function(cb){
                        async.mapSeries(suppliers.supplierList,
                            function(item,mapCallback){
                                if(underscore.isNull(item.enterpriseId)){
                                    item.createdOn = null;
                                    mapCallback();
                                }else{
                                    db.getSccCreated(__cloudDBName,item.enterpriseId,function(err,results){
                                        item.createdOn = results[0].createdOn;
                                        mapCallback(err,results);
                                    })
                                }
                            },
                            function(err,result){
                                if(err){
                                    cb(err);
                                }else{
                                    cb()
                                }
                            })
                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                    }
                    logger.debug("<<<<<<<<<<<<<my suppliers = "+JSON.stringify(suppliers));
                    callback(errs,suppliers);
                });
        },
        /**
         * get my clients
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getMyClients :  function(enterpriseId,filter,callback){
            logger.enter();
            var clients = {};
            var dbName = undefined;
            var errmsg = "";
            async.series([
                //get dbName
                function(cb){
                    db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                        if (err||results.length ==0) {
                            errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                            cb(errmsg);
                        } else {
                            var dbSuffix = results[0].dbSuffix;
                            dbName = __customerDBPrefix + "_" + dbSuffix;
                            cb();
                        }
                    })
                },
                //clientBuyerTotal:"采购客户总数"
                function(cb){

                    db.getTotalofClientBuyers(dbName,enterpriseId,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            clients.clientBuyerTotal = 0;
                            if(result.length!=0) {
                                clients.clientBuyerTotal = result[0].clientBuyerTotal;
                                logger.debug("clientBuyerTotal = " +  clients.clientBuyerTotal);
                            }
                            cb();
                        }
                    })
                },
                //clientBuyerMatched:"采购客户匹配数"
                function(cb){
                    db.getMatchedofClientBuyers(dbName,enterpriseId,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            clients.clientBuyerMatched = 0;
                            if(result.length!=0) {
                                clients.clientBuyerMatched = result[0].clientBuyerMatched;
                                logger.debug("clientBuyerMatched = " +  clients.clientBuyerMatched);
                            }
                            cb();
                        }
                    })
                },
                //clients list
                function(cb){
                    db.getMyClientList(dbName,enterpriseId,filter,function(err,results){
                        if(err){
                            cb(err);
                        }else{
                            clients.clientList = results;
                            cb()
                        }
                    });
                },
                function(cb){
                    async.mapSeries(clients.clientList,
                    function(item,mapCallback){
                        if(underscore.isNull(item.enterpriseId)){
                            item.createdOn = null;
                            mapCallback();
                        }else{
                            db.getSccCreated(__cloudDBName,item.enterpriseId,function(err,results){
                                item.createdOn = results[0].createdOn;
                                mapCallback(err,results);
                            })
                        }
                    },
                    function(err,result){
                        if(err){
                            cb(err);
                        }else{
                            cb()
                        }
                    })
                }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                    }
                    logger.debug("<<<<<<<<<<<<<my clients = "+JSON.stringify(clients));
                    callback(errs,clients);
                });
        },

        /**
         * 获取主页显示需要的数据
         * @param enterpriseId
         * @param enterpriseType
         * @param callback
         */
        getHomePageData : function(enterpriseId,enterpriseType,callback){
            logger.enter();
            var homeData={};
            var dbName = undefined;
            var errmsg = "";
            var dayTime = moment().startOf('day');
            var condition = {
                beginAt: dayTime.subtract(1, 'days'),
                endAt: dayTime,
                objectSide:enterpriseType
            };
            logger.debug("condition="+JSON.stringify(condition));
            async.series([
                //get dbName
                function(cb){
                    db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                        if (err||results.length ==0) {
                            errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                            cb(errmsg);
                        } else {
                            var dbSuffix = results[0].dbSuffix;
                            dbName = __customerDBPrefix + "_" + dbSuffix;
                            cb();
                        }
                    })
                },
                //昨日询价笔数
                function(cb){
                    db.getDataCountofInquiry(dbName,condition,function(err,result){
                        if(err){
                            cb(err);
                        }else{
                            homeData.quotation=result[0].inquiryNum;
                            cb();
                        }
                    })
                },
                //number: "昨日订单笔数",
                //amount: "昨日订单金额",
                function(cb){
                    db.getDataCountofOrder(dbName,condition,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            homeData.number=result[0].orderNum;
                            homeData.amount = Number(result[0].orderAmountSum).toFixed(2);
                            cb();
                        }
                    })
                },
                //ship: "昨日出库笔数",
                function(cb){
                    db.getDataCountofShip(dbName,condition,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            homeData.ship=result[0].shipNum;
                            cb();
                        }
                    })
                },
                //returns: "昨日退货笔数",
                function(cb){
                    db.getDataCountofReturn(dbName,condition,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            homeData.returns=result[0].returnNum;
                            cb();
                        }
                    })
                },
                //lastlogin:"上次登陆日期时间"
                function(cb){
                    db.getDataDateofLogin(dbName,condition,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            if(result.length!=0) {
                                homeData.lastlogin = result[0].lastLogin;
                            }
                            cb();
                        }
                    })
                },
                function(cb){
                    //lastlogin:"首次登陆日期时间"
                    db.getDateofFirstLogin(dbName,condition,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            if(result.length!=0) {
                                homeData.firstlogin = result[0].firstLogin;
                                logger.debug(">>>>>>>fisrtLogin = " + homeData.firstlogin);
                            }
                            cb();
                        }
                    })
                },
                function(cb){
                    //clientBuyerTotal:"采购客户总数"
                    db.getTotalofClientBuyers(dbName,enterpriseId,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            homeData.clientBuyerTotal = 0;
                            if(result.length!=0) {
                                homeData.clientBuyerTotal = result[0].clientBuyerTotal;
                                logger.debug("clientBuyerTotal = " +  homeData.clientBuyerTotal);
                            }
                            cb();
                        }
                    })
                },
                function(cb){
                    //clientBuyerMatched:"采购客户匹配数"
                    db.getMatchedofClientBuyers(dbName,enterpriseId,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            homeData.clientBuyerMatched = 0;
                            if(result.length!=0) {
                                homeData.clientBuyerMatched = result[0].clientBuyerMatched;
                                logger.debug("clientBuyerMatched = " +  homeData.clientBuyerMatched);
                            }
                            cb();
                        }
                    })
                },
                function(cb){
                    //clientSellerTotal:"供应商总数"
                    db.getTotalofClientSellers(dbName,enterpriseId,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            homeData.clientSellerTotal = 0;
                            if(result.length!=0) {
                                homeData.clientSellerTotal = result[0].clientSellerTotal;
                                logger.debug("clientSellerTotal = " +  homeData.clientSellerTotal);
                            }
                            cb();
                        }
                    })
                },
                function(cb){
                    //clientSellerMatched:"供应商匹配数"
                    db.getMatchedofClientSellers(dbName,enterpriseId,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            homeData.clientSellerMatched = 0;
                            if(result.length!=0) {
                                homeData.clientSellerMatched = result[0].clientSellerMatched;
                                logger.debug("clientSellerMatched = " +  homeData.clientSellerMatched);
                            }
                            cb();
                        }
                    })
                },
                function(cb){
                    //goodsInfoTotal:"商品同步总数"
                    logger.debug("todo sync yiyao365 get goods total");
                    homeData.goodsInfoTotal = 15000;
                    cb();
                },
                function(cb){
                    //goodsInfoMatched:"商品匹配数"
                    db.getGoodsInfoMatchedNum(dbName,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            homeData.goodsInfoMatched = 0;
                            if(result.length!=0) {
                                homeData.goodsInfoMatched = result[0].goodsInfoMatched;
                                logger.debug("goodsInfoMatched = " +  homeData.goodsInfoMatched);
                            }
                            cb();
                        }
                    });
                },

                //过去30天的订单金额数组data
                function(cb){
                    var condition = {
                        beginAt: dayTime.subtract(30, 'days'),
                        endAt: moment().startOf('day'),
                        objectSide:enterpriseType
                    };
                    logger.debug(JSON.stringify(condition));
                    db.getDataSumofOrder(dbName,condition,function(err,result){
                        if(err){
                            cb(err)
                        }else{
                            homeData.averageAmount = 0;
                            if(result.length>0){
                                var num = 30;
                                var total = underscore.reduce(result,function(memo,item){
                                    return memo + item.dailyOrderNum;
                                },0);
                                logger.debug(">>>>>>>>>>>>average Num ="+num);
                                homeData.averageAmount = (total/num).toFixed(4);
                            }
                            var dataArr = [];
                            for(var i=1;i<31;i++){
                                var orderDate = moment(condition.beginAt).add(i,'days').format('MM-DD');
                                var dailyOrderNum = 0;
                                underscore.map(result,function(resItem){
                                   if(resItem.orderDate==orderDate){
                                       dailyOrderNum = resItem.dailyOrderNum
                                   }
                                });
                                dataArr.push({
                                    dailyOrderNum:dailyOrderNum,
                                    orderDate:orderDate
                                });

                            }
                            logger.debug(JSON.stringify(dataArr));
                            homeData.data=dataArr;
                            cb();
                        }
                    })
                }
            ],function(err,results){
                if(err){
                    logger.error(JSON.stringify(err));
                }
                logger.debug(">>>>>>>>>>>>>>homeData = "+JSON.stringify(homeData));
                callback(err,homeData);
            });
        },


        /**
         * 获取同步历史数据
         * @param enterpriseId
         * @param callback
         */
        getErpSyncHistory : function(enterpriseId,callback){
            logger.enter();
            db.getLastSyncTaskHistory(__cloudDBName,enterpriseId,function(err,results){
                callback(err,results);
            })
        },

        /**
         * 获取同步进度状态
         * @param cloudDbName
         * @param taskType
         * @param enterpriseId
         * @param callback
         */
        getSyncProcessStatus: function(cloudDbName, taskType, enterpriseId, callback) {
            logger.enter();
            db.getCertainCustomerTask(cloudDbName,taskType,enterpriseId,function(err,result){
                callback(err, result);
            });
        },

        /**
         * EDI 同步数据库操作
         * @param enterpriseId
         * @param enterpriseType
         * @param socketId
         * @param callback
         */
        ediTablesDataSync: function(enterpriseId, socketId, callback) {
            logger.enter();
            var cloudDB = __cloudDBName;
            var isExist = false;

            var taskInfo = [];
            var taskData = {};
            // 判断当前是否存在进行中的任务
            this.getSyncProcessStatus(cloudDB, 'ERP_SYNC_GOODS', enterpriseId, function(err, result) {
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                else {
                    if(result.length > 0) {
                        isExist = _.find(result, function(item) {
                            if('RUNNING'==item.taskStatus) {
                                return true;
                            }
                        });
                        if(isExist) {
                            // 若任务中存在 'RUNNING' 状态，则禁止创建新同步任务
                            return callback(null, {status:'REJECT', taskId:-1})
                        }
                    }

                    // 创建新同步任务
                    taskData.taskName = 'EDI_Tables_Data_Sync';                         // 任务名称
                    taskData.taskType = 'ERP_SYNC_GOODS';                               // 任务类型
                    taskData.taskStatus = 'RUNNING';                                    // 任务状态
                    taskData.taskParam = {enterpriseId: enterpriseId};  // 任务参数
                    taskData.maxCount = 1;                                              // 最大执行数
                    taskData.second = '*/10';                                           // 秒定时任务
                    taskData.minute = '*';                                              // 分定时任务
                    taskData.hour = '*';                                                // 时定时任务
                    taskData.dom = '*';                                                 // 日定时任务
                    taskData.mon = '*';                                                 // 月定时任务
                    taskData.customerId=enterpriseId;                                   // 执行人ID

                    taskInfo.push(taskData);
                    __taskService.insertTask(taskInfo[0], socketId,
                        function syncGoodsProgressUpdate(msgObj){

                            logger.enter();


                            var progress = msgObj.taskProgress;
                            var errmsg="";
                            if (_.has(msgObj, "errmsg")) {
                                errmsg = msgObj.errmsg;
                            } else {
                                if (progress < 0 || progress > 100) {
                                    logger.error("taskId <" + taskInfo.taskId + ">'s progress is illegal: " + progress);
                                    return;
                                }
                            }

                            // transform to socket.io message format
                            var pushInfo = {
                                // 任务id, @see table CloudDB.Task.taskId
                                taskId: taskInfo.taskId,
                                // 任务类型, @see table CloudDB.Task.taskType
                                taskType: taskInfo.taskType,
                                // 子任务名称, 可选
                                description: taskInfo.taskName,
                                // 任务进度百分比, 0-100
                                taskProgress: progress,
                                // 任务完成标志
                                isDone: msgObj.isDone,
                                // 错误消息
                                errmsg: errmsg,
                                // 消息体
                                msg:msgObj.msg

                            };
                            logger.ndump("pushInfo", pushInfo);
                            if (socketId && __socketIO.sockets.connected[socketId]) {
                                __socketIO.sockets.connected[socketId].emit("task",pushInfo);
                            }

                        },function(err, taskId) {
                        if(err) {
                            logger.error(err);
                            return callback(err);
                        }
                        logger.ndump('taskId', taskId);
                        taskData.taskId = taskId;
                        callback(null, {status:'ALLOW', taskId: taskId});
                    });
                }
            });
        },

        /**
         * 设置ERP配置参数是否有效
         * @param customerId
         * @param isEffective
         * @param callback
         */
        putHasValidErpSetting: function(customerId, isEffective, callback) {
            logger.enter();
            var cloudDB = __cloudDBName;
            logger.ndump('isEffective', isEffective);
            db.updateHasValidErpSetting(cloudDB, customerId, isEffective, function(err, result) {
                callback(err, result);
            });
        },

        /**
         * 判断是否已经存在一个任务了
         * @param dbName
         * @param taskType
         * @param customerId
         * @param callback
         */
        judgeScheduleTaskExistOrNot:function(dbName,taskType,customerId,callback){
            db.judgeScheduleTaskExistOrNot(dbName,taskType,customerId,function(err,result){
               if(err){
                   logger.error(err);
                   callback(err);
               }else{
                   callback(err,result);
               }
            });
        }

    };




    return model;
};
