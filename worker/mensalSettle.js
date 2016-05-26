/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/


/**
 * 离线任务 每月固定时间 自动结算 上个结款周期的金额
 * @returns {{autoSettleBills: Function}}
 */
module.exports=function(){

    var underscore = require('underscore');
    var async = require("async");


    /**
     * Services
     **/
    var logger = __logService;
    var dbService = __dbService;



    var worker={
        autoSettleBills:function(){

            logger.enter();
            var allEnterprises=null;


                async.series([
                        //step1,get all customer,获取所有的卖家信息
                        function(done){
                            dbService.RetrieveAllSeller(__cloudDBName,function(err,results){
                                if(err){
                                    done(err);
                                }else{
                                    allEnterprises=results;
                                    logger.dump(JSON.stringify(results));
                                    done(err,results);//数组类型,所有的卖家
                                }
                            });
                        },
                        // step2  遍历每一个卖家[商户]
                        function(done) {
                            async.mapSeries(
                                allEnterprises,
                                function(item,callback){
                                    //获取当前商户的customerDBName,
                                    var customerDBSuffix=item['customerDBSuffix'];
                                    var customerDBName=__customerDBPrefix+'_'+customerDBSuffix;

                                    //对该商户下的所有该结款StatementMonthly进行更新
                                    var allUnsettleMonthlyBills={};
                                    async.series([
                                        //准备工作,该商户对应的所有客户 在这个结款周期必须要有数据
                                        function(done){
                                            prepareCurrentCycleCreditData(customerDBName,function(err,results){
                                                if(err){
                                                    logger.error(err);
                                                    done(err);
                                                }else{
                                                    done(err,results);
                                                }
                                            });
                                        },
                                        //step1  获取卖家下面的当月所有未结账单
                                        function(done){
                                            RetrieveAllClientOnThisMonth(customerDBName,allUnsettleMonthlyBills,function(err,results){
                                              if(err){
                                                 logger.error(err);
                                                 done(err);
                                              }else{
                                                 done(err,results);
                                              }
                                            });
                                        },
                                        // step2 处理该卖家 当前月份的所有订单
                                        function(done){
                                            handleAllUnsettleList(customerDBName,allUnsettleMonthlyBills.data,function(err,result){
                                                if(err){
                                                    logger.error(err);
                                                    done(err);
                                                }else{
                                                    done(err,result)
                                                }
                                            });
                                        }
                                    ],function(err,resultList){
                                            if(err){
                                                logger.error(err);
                                                callback(err);
                                            }else{
                                                callback(err,resultList)
                                            }
                                    });
                                },
                                function(err,results){
                                    if(err){
                                        logger.dump('某一个特定商户结款出现了错误!');
                                        done(err);
                                    }
                                    else{
                                     done(err,results);//results 结果待定
                                    }
                                });
                        }
                    ],
                    function (errs) {
                        if (errs) {
                            logger.debug('结算账单出现了错误.');
                            logger.error(errs);
                            process.exit(1);
                        }
                        else {
                            logger.debug('所有库的 当月的账单已经结算');
                            process.exit(0);
                        }

                    });
        }
    };


    //获取当前商户的 当月 所有未结单据
    function RetrieveAllClientOnThisMonth(customerDBName,allUnsettleMonthlyBills,callback){
        dbService.RetriveAllClientOnThisMonth(customerDBName,function(err,results){
            if(err){
                logger.dump('商户->'+customerDBName +'获取当前月未结账单出现了错误');
                logger.error(err);
                callback(err);
            }else{
                logger.dump('商户->'+customerDBName +'获取当前月账单成功, 未结账单条数:'+ results.length);
                allUnsettleMonthlyBills.data=results;
                callback(err,results);
            }
        });
    }

    //遍历所有未结的单据 更新单据
    function handleAllUnsettleList(customerDBName,allUnsettleMonthlyBills,callback){
            async.mapSeries(
                allUnsettleMonthlyBills,
                function(item,done){
                    var clientId=item.clientId,
                        billMonth=item.billMonth;
                    updateUnsettleBill(customerDBName,clientId,billMonth,function(err,result){
                        if(err){
                            logger.dump('商户->'+customerDBName+' 客户Id' +clientId +' 结款失败');
                            logger.error(err);
                            done(err);
                        }
                        else{
                            done(err,result);
                        }
                    });
                },
                function(err,results){
                    if(err){
                        logger.error(err);
                        callback(err);
                    }else{
                        callback(err,results);
                    }
            }
        )
    }


    function updateUnsettleBill(customerDBName,clientId,billMonth,callback){
            dbService.beginTrans(function(connect){
                var relatedData,relatedReceivableData;
                async.series([
                    //step 1,获取该客户的 当前授信额度  以及在这个结款周期内的授信额度变化 以及上期期末的余额
                    function(done){
                            dbService.getRelatedData(connect,customerDBName,clientId,billMonth,function(err,results){
                                if(err){
                                    done(err);
                                }else{
                                    relatedData=results[0];
                                    logger.dump('获取当前客户,当前周期的 授信额度等信息:');
                                    logger.dump(JSON.stringify(results[0]));
                                    done(err,results);
                                }
                            })
                    },
                    //step 2,获取该客户的 当前结款周期的 应收款 红冲 和已结款
                    function(done){
                            dbService.getCurrentClientReceivableAndRelatedData(connect,customerDBName,clientId,function(err,results){
                                if(err){
                                    logger.error(err);
                                    done(err);
                                }else{
                                    logger.dump('获取当前客户,当前周期的 应收款 红冲 已结款');
                                    logger.dump(results);
                                    relatedReceivableData=results;
                                    done(err,results);
                                }
                            });
                    },
                    //step 3,更新结款单
                    function(done){
                            var currentCredits=relatedData.credits,
                                ultimateAmount=relatedData.ultimateAmount,
                                oldCredit     =relatedData.oldCredit,
                                newCredit     =relatedData.newCredit,
                                creditChange  =newCredit-oldCredit,
                                currentOriginAmount,
                                currentUltimateAmount;

                            //上期期末的额度,如果为0的话,那就默认为现在的授信可用的额度,对应着clientFinance 的字段 arrearsBalance
                            ultimateAmount=ultimateAmount==0?currentCredits:ultimateAmount;

                            //期初余额 = 上期 期末额度 + (当前周期)授信额度的变化
                            currentOriginAmount=ultimateAmount+creditChange;


                            //应结款= 订单金额 - 红冲

                            //期末余额 = 期初余额 - 应结款 +已结款
                            currentUltimateAmount=currentOriginAmount
                                -(relatedReceivableData.receivableAmount-relatedReceivableData.redflushAmount)
                                +relatedReceivableData.clearAmount;

                            dbService.updateClientOriginAmountAndUltimateMount(connect,customerDBName,clientId,currentOriginAmount,currentUltimateAmount,function(err,result){
                                 if(err){
                                    logger.error(err);
                                    done(err);
                                 }
                                 else{
                                     logger.dump('商户->'+customerDBName+' 的 客户ID为'+clientId +'的客户 当前月账单已经结算');
                                     done(err,result);
                                 }
                            });
                    }
                ],function (err, resultList) {
                    if (err) {
                        logger.debug("结算账单回滚事务");
                        dbService.rollbackTrans(connect, function (transErr) {
                            callback(err);
                        });
                    } else {
                        logger.debug("结算账单提交事务");
                        dbService.commitTrans(connect, function () {
                            callback(null, resultList);
                        });
                    }
                })
            });
    }



    //某些客户 在当前结款周期内 并没有交易
    function prepareCurrentCycleCreditData(customerDBName,callback){
            var allClientWithoutTrade=null;
            async.series([
                //todo 1 获取当前月份 该商户 的客户中 没有任何交易的 客户集合
                function(done){
                    dbService.getAllCreditClientsWithoutTradeInCurrentCycle(customerDBName,function(err,results){
                        if(err){
                            logger.error(err);
                            done(err);
                        }else{
                            logger.dump('当前商户 '+customerDBName +' 的当月没有交易的客户集合:' +results);
                            allClientWithoutTrade=results;
                            done(err,results);
                        }
                    });
                },
                //todo 2 为这些客户 生成一个新的结款记录[交易数据为0]
                function(done){
                    iteratorAllClients(allClientWithoutTrade,customerDBName,function(err,results){
                        if(err){
                            logger.error(err);
                            done(err);
                        }
                        else{
                            done(err,results);
                        }
                    });
                }
            ],function(err,resultList){
                if(err){
                    callback(err);
                }else{
                    if(allClientWithoutTrade.length!=0){
                        logger.dump('库->'+customerDBName +' 的当月没有发生交易的客户数量为: '+allClientWithoutTrade.length);
                    }else{
                        logger.dump('库->'+customerDBName+ ' 当月所有的客户都有交易');
                    }
                    callback(err,resultList);
                }
            });
    }


    function iteratorAllClients(allClientWithoutTrade,dbName,callback){
        async.mapSeries(
            allClientWithoutTrade,
            function(item,callback){
                var clientId=item.clientId,
                    currentMonth=getCurrentMonth();
                constructNewData(clientId,dbName,currentMonth,function(err,results){
                    if(err){
                        logger.error(err);
                        logger.dump('给客户添加一条默认数据失败了');
                        callback(err);
                    }else{
                        callback(err,results);
                    }
                });
            },
            function(err,results){
                if(err){
                    callback(err);
                }else{
                    callback(err,results);
                }
            }
        )
    }



    //为当月没有交易的客户 增加一条默认的StatementMonthly数据
    function constructNewData(clientId,dbName,currentMonth,callback){
        var relatedData=null;
        dbService.beginTrans(function(connect){
            async.series(
                [
                    // step1 获取客户的 当前授信额度  上期期末余额 以及  当前结款周期的  授信额度变化
                    function(done){
                        dbService.getRelatedData(connect,dbName,clientId,currentMonth,function(err,results){
                              if(err){
                                  logger.error(err);
                                  done(err);
                              }else{
                                  relatedData=results[0];
                                  done(err,results);
                              }
                            });
                    },
                    function(done){
                        //format raw data to insertObj

                        var currentCredits=relatedData.credits,         //客户的 当前授信额度
                            ultimateAmount=relatedData.ultimateAmount,  //上一期账单的期末余额
                            oldCredit     =relatedData.oldCredit,
                            newCredit     =relatedData.newCredit,
                            creditChange  =newCredit-oldCredit,         //当前周期内 额度的变化
                            currentOriginAmount,
                            currentUltimateAmount;

                        //上期期末的额度,如果为0的话,那就默认为现在的授信可用的额度,对应着clientFinance 的字段 arrearsBalance
                        ultimateAmount=ultimateAmount==0?currentCredits:ultimateAmount;

                        //期初余额 = 上期 期末额度 + (当前周期)授信额度的变化
                        currentOriginAmount=ultimateAmount+creditChange;




                        var insertObj={
                            clientId:clientId,
                            billMonth:getCurrentMonth(),
                            originAmount:currentOriginAmount,
                            ultimateAmount:currentOriginAmount,//该月没有
                            status:'PENDING',
                            isChargeOff:0,
                            orderAmount:0,
                            orderCount:0,
                            shipAmount:0,
                            shipCount:0,
                            receivableAmount:0,
                            receivableCount:0,
                            prepayAmount:0,
                            prepayCount:0,
                            redflushAmount:0,
                            redflushCount:0,
                            refundAmount:0,
                            refundCount:0,
                            clearAmount:0,
                            clearCount:0
                        };
                        dbService.insertStatementMonthly(connect,dbName,insertObj,function(err,results){
                            if(err){
                                logger.error(err);
                                done(err);
                            }else{
                                if(results.insertId!=0){
                                    logger.dump('库 ->'+dbName +' 中的客户ID为 ' +clientId +'  当月为0的数据已经添加成功');
                                }
                                done(err,results);
                            }
                        });
                    }
                ],
                function (err, resultList) {
                    if (err&&typeof(err)==="object") {
                        logger.debug("结算账单回滚事务");
                        dbService.rollbackTrans(connect, function (transErr) {
                            callback(err);
                        });
                    } else {
                        logger.debug("结算账单提交事务");
                        dbService.commitTrans(connect, function () {
                            callback(null, resultList);
                        });
                    }
                });
        });

    }







    function getCurrentMonth(){
         var now =new Date(),
             currentYear=now.getFullYear(),
             currentMonth=now.getMonth()+1,
             currentDay=now.getDate(),
             currentDate=currentYear+'-'+currentMonth+'-'+currentDay;
         return currentDate;
    }
    return worker;
}