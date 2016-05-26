/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

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
    var moment = require("moment");
    /*
     * load project modules
     */
    var Paginator = require(__base + "/modules/paginator");
    var myPath = require(__modules_path + "/mypath");
    var idGen = require(__modules_path + "/idTwister");

    /*
     * init model name etc
     */
    var MODELNAME = myPath.getModelName(__dirname);
    logger.trace("Initiating model:[" + MODELNAME + "]");

    //model
    var model = {
        getTradeList:function(dbName,paginator,queryObj,callback){
            db.listTradeList(dbName,queryObj,paginator,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,results);
                }
            });
        },
        /**
         * 获取指定时间段内的结款表表
         * @param customerDBName
         * @param beginDate
         * @param endDate
         * @param clientName
         * @param callback
         */
        getClearingList: function(customerDBName, clientName, beginDate, endDate, callback) {
            logger.enter();
            if (underscore.isEmpty(clientName))
                clientName = "";

            async.series([
                function updateIncome(done) {
                    logger.enter();
                    db.updateClearingIncome(customerDBName, function(err, rows){
                        done();
                    });
                },
                function updateRefund(done) {
                    logger.enter();
                    db.updateClearingRefund(customerDBName, function(err, rows){
                        done();
                    });
                }
            ],
            function(err, results) {
                logger.enter();
                db.getClearingBills(customerDBName, clientName, beginDate, endDate, function (err, results) {
                    callback(err, results);
                });
            });
        },


        excuteRefund:function(customerDBName,refundId){



        },
        /**
         * 财务退回
         * @param dbName
         * @param refundId
         * @param updateObj
         * @param callback
         */
        financeStaffRejectVerifyRefund:function(dbName,refundId,updateObj,callback){
            var updateRefundObj={
                refundStatus:'CREATED',
                verifiedAmount:0,
                verifiedTime:'0000-00-00 00:00:00'
            };
            var updateRefundHistory={
                refundId:refundId,
                refundStatus:'REJECT',
                rejecterOperatorId:updateObj.operatorId,
                rejecterName:updateObj.operatorName,
                rejectTime:moment(new Date()).format('YYYY-MM-DD H:mm:ss'),
                rejectComment:updateObj.remark||'',
                rejecterMobile:updateObj.mobile
            };
            modifyRefundAndRefundHistory(async,db,dbName,refundId,updateRefundObj,updateRefundHistory,logger,callback);

        },

        /**
         * 获取退款数据列表
         * @param dbName
         * @param filterCondition
         * @param paginator
         * @param callback
         */
        getListRefund: function(dbName, data, filterCondition, paginator, callback) {
            logger.enter();
            db.listRefundData(dbName,filterCondition,paginator,function(err,results){
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                logger.dump(results);
                data.refundList=results;
                data.filterCondition=filterCondition;
                callback(null, data);
            });
        },

        /**
         * 财务中心审核退款单据,通过的时候
         * @param dbName
         * @param refundId
         * @param updateObj
         * @param callback
         */
        financeStaffVerifyRefund:function(dbName,refundId,updateObj,callback){
            logger.enter();
            //主表             只是更新状态

            var status='';
            if(updateObj.refundType=='REDFLUSH'){
                status='SUCCESS';
            }
            else{
                status='APPROVED';
            }
            var updateRefundObj={
                refundStatus:status,
                approveTime:moment(new Date()).format('YYYY-MM-DD H:mm:ss')
            };
            var updateRefundHistory={
                refundId:refundId,
                refundStatus:status,
                approverOperatorId:updateObj.operatorId,
                approverName:updateObj.operatorName,
                approverMobile:updateObj.mobile,
                approveTime:moment(new Date()).format('YYYY-MM-DD H:mm:ss'),
                approveComment:updateObj.remark
            };

            modifyRefundAndRefundHistory(async,db,dbName,refundId,updateRefundObj,updateRefundHistory,logger,callback);


        },

        /**
         * 更新授信支付用户的授信余额
         * @param dbName
         * @param clientId
         * @param refundAmount
         * @param callback
         */
        putClientFinanceBalance: function(dbName, clientId, refundAmount, callback){
            logger.enter();
            db.updateClientFinanceBalance(__mysql, dbName, clientId, refundAmount, false, function(err, results){
                if(err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    callback(null, results);
                }
            });
        },

        /**
         * 客服中心审核退款单
         * @param dbName
         * @param refundId
         * @param updateObj
         * @param callback
         */
        callCenterVerifyRefund:function(dbName,refundId,updateObj,callback){

                var updateRefundObj={
                    refundStatus:'VERIFIED',
                    verifiedAmount:updateObj.amount,
                    verifiedTime:moment(now).format('YYYY-MM-DD H:mm:ss')
                };
            var now=new Date();
                var updateRefundHistory={
                    refundId:refundId,
                    refundStatus:'VERIFIED',
                    verifierOperatorId:updateObj.operatorId,
                    verifierName:updateObj.operatorName,
                    verifiedTime:moment(now).format('YYYY-MM-DD H:mm:ss'),
                    verificationComment :updateObj.remark,
                    verifiedSum:updateObj.amount,
                    verifierMobile:updateObj.mobile,
                    attachMentUrl:updateObj.attachmentUrl
                };
            modifyRefundAndRefundHistory(async,db,dbName,refundId,updateRefundObj,updateRefundHistory,logger,callback);


        }
        ,
        /**
         * 获取退款单详情
         * 1,该详情包含了 订单 和 发货单 部分内容
         * 2,退货单 审核存在 退回 和 重新提交两个状态  可能包含退货单审核的历史信息
         * @param dbName
         * @param refundId
         * @param callback
         */
        getRefundDetail:function(dbName,refundId,callback){
            logger.enter();
            async.series([
                    //step1 get RefundInfo
                    function(done){
                        db.getRefundDetailByRefundId(dbName,refundId,function(err,result){
                            if(err){
                                logger.error(err);
                                //done(err);
                            }else{
                                logger.dump('获取refundDetail完毕');
                                done(null,result);
                            }

                        });
                    },
                    //step2 get ShipInfo
                    function(done){
                        db.getShipInfoRelatedToRefund(dbName,refundId,function(err,result){
                           if(err){
                               done(err);
                           }else{
                               logger.dump('获取ShipInfo完毕');
                               done(null,result);
                           }
                        });
                    },
                    //step3 get RefundHistoryInfo
                    function(done){
                        db.getRefundHistoryByRefundId(dbName,refundId,function(err,result){
                            if(err){
                                done(err);
                            }else {
                                logger.dump('获取退货历史完毕');
                                done(null,result);
                            }
                        });
                    }

            ], function (err, resultList) {
                    if (err) {
                        logger.error(err);
                        callback(err);
                    }
                    else {
                        var ultimateData=formatRefundData(resultList);
                        logger.debug("Commit the transaction");
                        callback(null, ultimateData);
                    }
                });
        },
        /**
         * 获取结款页面所需要的数据
         * @param dbName
         * @param paginator
         * @param queryObj
         * @param callback
         */
        getFinanceData : function(dbName,paginator,queryObj,callback){
            logger.enter();
            logger.debug(JSON.stringify(paginator));
            var data = {};
            async.series([
                    function(done){
                        db.listMonthlyStatementDetails(dbName,paginator,queryObj,function(err,results){
                            data.statementDetails = results;
                            underscore.map(results,function(item){
                                var clearAmount = item.clearAmount || 0;//已结款总计
                                var shipAmount = item.shipAmount || 0;//出库
                                var redflushAmount =item.redflushAmount || 0;//冲红
                                var receivableAmount=item.receivableAmount||0;


                                var needToPayState = receivableAmount-redflushAmount; //应结款
                                var waitForState = needToPayState-clearAmount;//待结款



                                item.needToPayState=needToPayState;
                                item.receivableState = receivableAmount;//应收
                                item.waitForState = waitForState;//待结
                            });
                            done(err,results);
                        });
                    },
                    function(done){
                        db.listStatementSum(dbName,paginator,queryObj,function(err,results) {
                            data.statementSum = results[0];
                            //var clearSum = data.statementSum.receivableStateSum || 0;//已结款总计

                            var clearSum = data.statementSum.clearAmountSum || 0;//已结
                            var shipAmountSum = data.statementSum.shipAmountSum || 0;//出库
                            var redflushAmountSum =data.statementSum.redflushAmountSum || 0;//冲红
                            var receivableStateSum=data.statementSum.receivableAmountSum;//应收


                            var needToPayStateSum = data.statementSum.receivableAmountSum-redflushAmountSum; //应结款

                            var waitForStateSum = needToPayStateSum-clearSum;//待结款
                            data.clearSum=clearSum;
                            data.needToPayStateSum=needToPayStateSum;//应结
                            data.receivableStateSum = receivableStateSum;//应收
                            data.waitForStateSum = waitForStateSum;
                            done(err,results);
                        });
                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(errs);
                        callback(errs);
                    }else{
                        logger.debug(JSON.stringify(results));
                        callback(null,data)
                    }
                }
            );

        },

        getCODclearData: function(dbName,paginator,queryObj,callback){
            logger.enter();
            logger.debug(JSON.stringify(queryObj));
            var data = {};
            async.series([
                    function(done){
                       db.getCODclearSum(dbName,paginator,queryObj,function(err,results){
                           if(err){
                               done("获取货到付款统计数据失败"+err);
                           }else{
                               data.codClearSum = results[0].codAmountSum;
                               done();
                           }
                       }) ;
                    },
                    function(done){
                        //db.getCODclearDetail(dbName,paginator, queryObj, function(err,results){
                        db.getCodClearDetails(dbName, paginator, queryObj, function(err,results){
                            if(err){
                                done("获取货到付款统计数据失败"+err);
                            }else{

                                data.codClearDetails = [];
                                underscore.map(results,function(item){
                                    item.status =(item.waitForPayAmount==item.clearAmount)?"CLEARED":"UNCLEARED";
                                    if('ALL' == queryObj.status){
                                        data.codClearDetails.push(item);
                                    }
                                    else if(item.status == queryObj.status){
                                        data.codClearDetails.push(item);
                                    }
                                });
                                done();
                            }
                        }) ;
                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    }else{
                        callback(null,data)
                    }
                }
            );

        },

        /**
         * 更新货到付款结算完成信息
         * @param dbName
         * @param orderId
         * @param callback
         */
        updateCODClearFinishInfo: function(dbName, clearData, callback){
            logger.enter();
            db.updateCODClearFinishData(dbName, clearData, function(err, result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err, result);
                }
            });

        },

        getCreditMonthData  : function(dbName,paginator,queryObj,callback){
            logger.enter();
            var data = {};
            async.series([
                    function(done){
                        db.listCentainMonthlyStatementDetails(dbName,paginator,queryObj,function(err,results){
                            if(err ){
                                done("获取该客户的月结数据失败");
                            }else{

                              if(results.length==0){
                                  data.monthClear={};
                                  done(err,null)
                              }else{
                                  var item = results[0],
                                      shipAmount = item.shipAmount || 0,   //出库
                                      redflushAmount =item.redflushAmount || 0, //冲红
                                      needToPayAmount=item.receivableAmount-redflushAmount,//应结款
                                      clearAmount = item.clearAmount || 0, //已结
                                      waitForState=needToPayAmount-clearAmount;//待结

                                  //
                                  //var receivableState = shipAmount-redflushAmount; //应结款
                                  //var waitForState = receivableState-clearAmount;//待结款





                                  item.needToPayAmount=needToPayAmount;
                                  //item.receivableState = receivableState;
                                  item.waitForState = waitForState;
                                  data.monthClear = item;
                                  done(err,results);
                              }
                            }
                        });
                    },
                    function(done){
                        db.listSystemCheckoutDate (dbName,function(err,results){
                            if(err||underscore.isEmpty(results)){
                                done(err+"获取该客户的结帐日失败");
                            }else{
                                var checkoutdate = results[0].aValue;
                                queryObj.checkoutDate = checkoutdate;
                                db.listClientStatementOrderSum(dbName,paginator,queryObj,function(err,results){
                                    data.monthClear.orders = results;
                                    done();
                                });
                            }
                        });

                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    }else{
                        callback(null,data)
                    }
                }
            );

        },




        getClientReceiveData : function(dbName,paginator,clientId,callback){
            logger.enter();
            var data = {};
            async.series([
                    function(done){
                        db.listSumClientStatements(dbName,paginator,clientId,function(err,results){
                            if(err){
                                logger.error(err);
                                done("获取该客户的结款统计数据失败");
                            }else{
                                var item = results[0];
                                var clearAmountSum = item.clearAmountSum || 0;//已结
                                var shipAmountSum = item.shipAmountSum || 0;//出库
                                var redflushAmountSum =item.redflushAmountSum || 0;//冲红

                                var receivableStateSum=item.receivableAmountSum;//应收款
                                var needToPaySum = receivableStateSum-redflushAmountSum; //应结款=应收-红冲
                                var waitForStateSum = needToPaySum-clearAmountSum;//待结款 = 应结-已结

                                item.needToPaySum=needToPaySum;//待结
                                item.receivableStateSum = receivableStateSum;//应收
                                item.waitForStateSum = waitForStateSum;//待收
                                data.clientStatementSum = item;
                                done(err,results);
                            }
                        });
                    },
                    function(done){
                        db.listClientClearDetails(dbName,paginator,clientId,function(err,results){
                            if(err){
                                done("获取该客户的结款明细失败"+err);
                            }else{
                                logger.debug(JSON.stringify(results));
                                data.clearDetails = results;
                                done();
                            }
                        });
                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    }else{
                        callback(null,data)
                    }
                }
            );
        },

        /**
         * 更新结款页面数据
         * @param dbName
         * @param updateFinaceInfo
         * @param callback
         */
        updateFinanceData : function(dbName,updateData,operatorId,callback){
            logger.enter();
            logger.debug(JSON.stringify(updateData));
            db.beginTrans(function (connect) {
                async.series([
                        function(done){
                            //step1 更新结款明细
                            db.metaUpdateMonthlyClearDetails(connect,dbName,updateData, operatorId,function(err,results){
                                if(results.affectedRows > 0){
                                    done(null,"SUCCESS UPDATE MonthlyClearDetails")
                                }else{
                                    done(err + "UPDATE MonthlyClearDetails FAIL");
                                }
                            });
                        },
                        function(done){
                        //step2 更新结款表
                            db.transUpdateStatementMonthly(connect,dbName,updateData, function(err,results){
                                if(results.affectedRows>0){
                                    done(null,"SUCCESS UPDATE StatementMonthly")
                                }else{
                                    logger.error(err);
                                    done(err + "UPDATE StatementMonthly FAIL");
                                }
                            });
                        },
                        function(done){
                            //step3 更新在线授信额度
                            db.metaUpdateClientFinace(connect,dbName,updateData,function(err,results){
                                if(results.affectedRows>0){
                                    done(null,"SUCCESS UPDATE CLIENT FINACE")
                                }else{
                                    done(err + "UPDATE FINACE FAIL");
                                }
                            });
                        }
                    ],
                    function(errs,results){
                        if(errs){
                            logger.error(JSON.stringify(errs));
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function () {
                                callback(errs);
                            });
                        }else{
                            logger.debug(JSON.stringify(results));
                            db.commitTrans(connect, function () {
                                callback(null, results);
                            });
                        }
                    }
                );
            })
        },


        /**
         * 获取月度结款页面所需要的数据
         * @param dbName
         * @param paginator
         * @param callback
         */
        getMonthlyFinanceData : function(dbName,paginator,callback){
            logger.enter();
            logger.debug(JSON.stringify(paginator));
            db.listMonthlyStatementDetails(dbName,paginator,function(err,results){
                callback(err,results);
            });
        },


        /**
         * 获取退款页面所需要的数据
         * @param dbName
         * @param paginator
         * @param callback
         */
        getRefundData : function(dbName,paginator,callback){
            logger.enter();
            logger.debug(JSON.stringify(paginator));
            db.listRefundData(dbName,paginator,function(err,results){
                callback(err,results);
            });
        },



        /**
         * 获取退款执行页面所需要的数据
         * @param dbName
         * @param paginator
         * @param callback
         */
        getRefundExecutionData : function(dbName, paginator, queryObj, callback){
            logger.enter();
            logger.debug(JSON.stringify(paginator));
            var data = {};
            var statistics = {};
            async.series([
                // step1. 获取待执行（已审核）的退款统计信息
                function(done) {
                    db.getRefundStatisticsInfo(dbName, 'APPROVED', function(err, result) {
                        if(err){
                            done(err);
                        }
                        else{
                            if(result.length > 0) {
                                statistics.approvedCount = result[0].count;
                                statistics.approvedTotal = result[0].total;
                            }
                            logger.ndump('statistics.approvedCount ', statistics.approvedCount);
                            logger.ndump('statistics.approvedTotal ', statistics.approvedTotal);
                            done(err, result);
                        }
                    });
                },
                // step2. 获取退款失败的统计信息
                function(done) {
                    db.getRefundStatisticsInfo(dbName, 'FAILED', function(err, result) {
                        if(err){
                            done(err);
                        }
                        else{
                            if(result.length > 0) {
                                statistics.failedCount = result[0].count;
                                statistics.failedTotal = result[0].total;
                            }
                            logger.ndump('statistics.failedCount ', statistics.failedCount);
                            logger.ndump('statistics.failedTotal ', statistics.failedTotal);
                            done(err, result);
                        }
                    });
                },
                // step3. 获取退款执行数据列表
                function(done) {
                    db.listRefundExecution(dbName, paginator, queryObj, function(err, results) {
                        if(err){
                            done(err);
                        }
                        else{
                            data.refundList = results;
                            done(err, results);
                        }
                    });
                }
            ], function(err, resultlist) {
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    data.statistics = statistics;
                    logger.ndump('resultlist ', resultlist);
                    logger.ndump('data ', data);
                    callback(null, data);
                }
            });
        },

        updateRefundExecution: function(dbName, getData, RefundData,operatorObj, callback){
            logger.enter();
            var displayRefExecId = '';
            var refundExecutionId = 0;
            var excuteResultStatus='';
            db.beginTrans(function (connect) {
                async.series([
                    // step1 生成 refundExecutionId
                    function (done) {
                        // displayRefExecId、refundId、executedBy、waterbillNo、executionStatus
                        var today = new Date();
                        var yyyymmdd = moment(today).format('YYYYMMDD');
                        displayRefExecId = idGen.getDisplayId(getData.refundId, yyyymmdd, __idPrefix.refund);
                        var execData = {
                            displayRefExecId: displayRefExecId,
                            refundId: getData.refundId,
                            executedBy: RefundData.operatorId,
                            executionStatus: RefundData.executionStatus,
                            waterbillNo: RefundData.waterbillNo
                        };

                        // 添加 RefundExecution 数据
                        db.addRefundExecutionInfo(connect, dbName, execData, function (err, result) {
                            if (err) {
                                logger.error(err);
                                done(err);
                            } else {
                                refundExecutionId = result.insertId;
                                excuteResultStatus='SUCCESS';
                                done();
                            }
                        });
                    },
                    // step2 更新退款状态及相关信息
                    function (done) {
                        var refData = {
                            refundExecutionId: refundExecutionId,
                            refundStatus: RefundData.executionStatus,
                            payWaterbillNo: RefundData.waterbillNo
                        };
                        logger.ndump('INFO:refData>>> ', refData);
                        db.updateRefundInfo(connect, dbName, getData.refundId, refData, function (err, result) {
                            if (err) {
                                logger.error(err);
                                done(err);
                            } else {
                                done(err, result);
                            }
                        });
                    },
                    function (done){

                    var insertObj=operatorObj;
                        insertObj.excuteTime=moment(new Date()).format('YYYY-MM-DD H:mm:ss');
                        insertObj.refundStatus=excuteResultStatus;

                    db.insertVerifyRefundHistory(connect,dbName, getData.refundId,insertObj,function(err,result){
                            if(err){
                                logger.error(err);
                                done(err);
                            }
                            else{
                                done(null,result);
                            }
                    });
                    }
                ], function (err, resultList) {
                    if (err) {
                        logger.error(err);
                        db.rollbackTrans(connect, function () {
                            callback(err);
                        });
                    }
                    else {
                        logger.debug("Commit the transaction");
                        db.commitTrans(connect, function () {
                            //final callback result:shipId
                            callback(null, resultList);
                        });
                    }
                });
            });
        }
    };
    return model;
};

//格式化 退款单详情
function formatRefundData(dataArray){
    var closeOrderInfo={};  //关闭订单的操作人员信息

    if(dataArray[0].closeOperatorId==null){
        closeOrderInfo=undefined;
    }
    else{
        closeOrderInfo={
            closeOperatorId:dataArray[0].closeOperatorId,
            closeOrderInfoDate:dataArray[0].closeOrderInfoDate,
            closeOperatorName:dataArray[0].closeOperatorName,
            closeMobileNum:dataArray[0].closeMobileNum
        }
    }

    var  receiveOperatorInfo= dataArray[0].receiveReturnCustomerId==null?undefined:{
            returnId:dataArray[0].returnId,
            returnDisplayId:dataArray[0].displayReturnId,
            returnInfoUpdatedOn:dataArray[0].returnInfoUpdatedOn,
            returnReceiveOperatorName:dataArray[0].returnReceiveOperatorName,
            mobileNum:dataArray[0].returnReceivemobileNum
    };


    var refundBasicInfo={
        clientId:dataArray[0].clientId,
        isCredit:dataArray[0].paymentType=='CREDIT',
        orderId:dataArray[0].orderId,
        id:dataArray[0].id,
        refundType:dataArray[0].refundType,
        displayRefundId:dataArray[0].displayRefundId,
        displayOrderId:dataArray[0].displayOrderId,
        clientName:dataArray[0].clientName,
        refundReason:dataArray[0].refundReason,
        refundAmount:dataArray[0].refundAmount,
        verifiedAmount:dataArray[0].verifiedAmount,
        refundStatus:dataArray[0].refundStatus,
        createdOn:dataArray[0].createdOn,
        orderTotal:dataArray[0].totalPrice
        },
       orderBasicInfo={
        createOn:dataArray[0].orderCreatedOn,
        clientName:dataArray[0].clientName,
        displayOrderId:dataArray[0].displayOrderId,
        mobile:dataArray[0].mobile
    },
       shipBasicInfo=dataArray[1],
       refundHistory=dataArray[2],
       returnObj={
        refundBasicInfo:refundBasicInfo,
        orderBasicInfo:orderBasicInfo,
        shipBasicInfo:shipBasicInfo,
        refundHistory:refundHistory,
        closeOrderInfo:closeOrderInfo,
        receiveOperatorInfo:receiveOperatorInfo
    };
    return returnObj;
}

//退款单的审核 流程 需要用的方法
function modifyRefundAndRefundHistory(async,dbService,dbName,refundId,updateRefundObj,updateRefundHistoryObj,logger,callback){
    var db=dbService,
        async=async;
    db.beginTrans(function (connect) {
        async.series([
                //step1 update Refund
                function(done){
                    db.modifyVerifyRefund(connect,dbName,refundId,updateRefundObj,function(err,result){
                        if(err){
                            logger.error(err);
                            done(err);
                        }else{
                            logger.dump('客服审核成功了:'+result.affectedRows);
                            done(err,result);
                        }
                    });
                },
                //step2  update RefundHistory
                function(done){
                    db.insertVerifyRefundHistory(connect,dbName,refundId,updateRefundHistoryObj,function(err,result){
                        if(err){
                            logger.error(err);
                            done(err);
                        }
                        else{
                            logger.dump('客服审核 添加历史记录');
                            done(err,result);
                        }
                    });
                }
            ],
            function(errs,results){
                if(errs){
                    logger.error(JSON.stringify(errs));
                    logger.debug("回滚事务,Rollback the transaction");
                    db.rollbackTrans(connect, function () {
                        callback(errs);
                    });
                }else{
                    logger.debug(JSON.stringify(results));
                    db.commitTrans(connect, function () {
                        callback(null, results);
                    });
                }
            }
        );
    });





}