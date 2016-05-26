module.exports=function(){

    var underscore = require('underscore');
    var async = require("async");


    /**
     * Services
     **/
    var logger = __logService;
    var dbService = __dbService;



    var worker={
        batchSwitchShipInfo:function(){


            logger.enter();
            var allEnterprise=null;
            async.series([
                    //get all customer,获取所有的卖家信息
                    function(done){
                        dbService.RetrieveAllSeller(__cloudDBName,function(err,results){
                                if(err){
                                    done(err);
                                }else{
                                    allEnterprise=results;

                                    /**
                                     * 仅供测试使用
                                     */
                                    //start 仅供测试使用
                           /*         allEnterprise=underscore.filter(allEnterprise,function(item){
                                    return item.customerDBSuffix=='127_0_0_1';
                                    });*/
                                    //end
                                    logger.dump(JSON.stringify(results));
                                    done(err,results);//数组类型,所有的卖家
                                }
                        });
                    },
                    //iterate all sellers,遍历卖家,找到要更新的shipInfo
                    function(done){
                        async.mapSeries(
                            allEnterprise,
                            function(item,callback){

                                //获取customerDBName
                                var customeDBSuffix=item['customerDBSuffix'];
                                var customerDBName=__customerDBPrefix+'_'+customeDBSuffix;

                                var operatorId=null;

                               async.series([
                                   //获取operatorId
                                   function(done){
                                       getSysRobotOperatorId(customerDBName,'sysRobot',function(err,result){
                                                if(err){
                                                    done(err);
                                                }else{
                                                    operatorId=result;
                                                    done(err,result);
                                                }
                                       });
                                   },
                                   //执行收货操作
                                   function(done){
                                       updateShipInfoToDelivered(item['customerName'],customerDBName,operatorId,function(err,result){
                                                if(err){
                                                    done(err);
                                                }else{
                                                    done(err,result);//为该企业下的所有的被自动更新的 shipInfo 的 Id 集合
                                                }
                                       })
                                   }
                               ],function(err,results){
                                    //results[0]   为operatorId
                                    //每一个企业执行完收货的回调函数
                                    if(err){
                                        callback(err);
                                    }else{
                                        callback(err,results[1]);  //为该企业下的所有的被自动更新的 shipInfo 的 Id 集合
                                    }

                               })
                            },
                            function(err,results){
                                //每一个seller企业的回调函数
                                if(err){
                                    done(err);
                                }else{
                                    done(null,results[1]);//为该企业下的所有的被自动更新的 shipInfo 的 Id 集合
                                }
                            }
                        );
                    }
                ],
                function(err,results){
                     if(err){
                        logger.error(err);
                         process.exit(1);
                     }
                    else{
                         logger.dump('所有企业的shipInfo 超时的发货单已经 自动更新 ');
                         process.exit(0);
                     }
                }
            );

        }
    };

    //获取operatorId
    function getSysRobotOperatorId(customerDBName,operatorName,callback){
        //'sysRobot'
        dbService.systemRobotOperatorRetrieve(customerDBName,operatorName,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    if(result.length==0){
                        logger.dump('数据库:'+customerDBName+'  添加了自动收货的机器人账号 sysRobot');
                        //插入新的管理员机器人账号
                        dbService.insertNewOperator(customerDBName,'sysRobot','DE3302D84BDE0591C6378B0F718E75C6','sysRobot',function(err,result){
                                if(err){
                                    logger.error(err);
                                    callback(err);
                                }
                            logger.dump('数据库:'+customerDBName+'  添加的机器人账号: sysRobot.'+'id为  '+result);
                            callback(err,result);
                        });
                    }else{
                        logger.dump('数据库:'+customerDBName+'  之前添加过机器人账号: sysRobot.'+'id为  '+result[0].id);
                        callback(err,result[0].id);
                    }
                }

        });

    }

    //遍历每一个SELLER的未发货的ShipInfo
    function updateShipInfoToDelivered(customerName,customerDBName,operatorId,callback){
        var allShipInfoIds=null;

        async.series([
            //step1 获取所有没有收货的订单
            function(done){
                dbService.metaRetreiveShipInfosNotReceived(customerDBName,function(err,results){
                    if(err){
                        logger.error(err);
                        done(err);
                    }else{
                        logger.debug(customerName+' 的数据库中查询未收货的发货单条数:'+results.length+'条');
                        allShipInfoIds=results;
                        done(err,results);
                    }
                });
            },
            //step2 遍历所有退货单,构造发货数据
            function(done){
                async.mapSeries(
                    allShipInfoIds,
                    function(item,callback){
                        dbService.getShipDetails(customerDBName,item['shipId'],function(err,shipDetail){
                            if(err){
                                callback(err);
                            }else{
                                //step 2.1 构造发货数据
                                var data={
                                    isReject:false,
                                    shipId:shipDetail[0].shipId,
                                    status:"DELIVERED",
                                    remark:"",//收货备注
                                    orData:[]
                                };
                                var clientId=shipDetail[0].clientId;
                                for(var i=0;i<shipDetail.length;i++){
                                    var curObj=shipDetail[i];
                                    var tempArray=[];
                                    tempArray.push(
                                        curObj.shipId,
                                        curObj.goodsId,
                                        curObj.batchNum,
                                        curObj.quantity,
                                        curObj.drugESC,
                                        "" //收货备注
                                    );
                                    data.orData.push(tempArray);
                                }
                                var operatorData={
                                    operatorId:operatorId,
                                    clientId:clientId
                                };
                                //step 2.2 更新发货单状态
                                updateShipReceived(customerDBName,operatorData,data,item['autoSwitchToReceivedDate'],function(err,shipId,rejectId){
                                    if(err){
                                        callback(err);
                                    }
                                    else{
                                        callback(null,shipId);
                                    }

                                })
                            }
                        });
                    },
                    function(err,results){
                        if(err){
                            logger.error(err);
                        }else{
                            //logger.dump('自动收货成功的shipId有:  '+JSON.stringify(results));

                            //results 为所有被收货的shipInfo Id 的集合  [1,2,3,4]
                            done(err,results);
                        }
                    })
            }

        ],function(err,results){
            if(err){
                logger.error(err);
                callback(err);
            }else{
                if(results[1].length>0) {
                    logger.debug(customerName + '的所有ShipInfo单自动收货成功,他们的id是: ' + JSON.stringify(results[1])); //为所有被收货的shipInfo Id 的集合  [1,2,3,4]
                }else{
                    logger.debug(customerName+' 没有超时的发货单 ');
                }
                callback(null,results[1]);
            }
        });


    }

    //某一个特定的ShipInfo更新状态,包括更新ShipDetails
    function updateShipReceived(customerDBName, operatorData, receivedData,autoSwitchToReceivedDate, callback){
        logger.enter();
        var orderId = undefined;
        var shipId = receivedData.shipId;
        var rejectId = undefined;
        /* 拒收数据 */
        var rejectItems = [];
        dbService.getShipDetails(customerDBName, shipId, function (err, results) {
            if (err) {
                callback(err);
            } else {
                orderId = results[0].orderId;
                var remark = receivedData.remark;
                /* 实际收货数据 */
                var updateData = receivedData.orData;
                var reData = receivedData.reData;
                var status = receivedData.status;
                if(status == "REJECT-REQUEST"){
                    reData.forEach(function(item){
                        var rejectItem = [];
                        rejectItem.push(orderId);//orderId
                        rejectItem.push(operatorData.operatorId);//operatorId
                        rejectItem.push(item[0]);//shipId
                        rejectItem.push(item[5]);//remark
                        rejectItem.push(item[1]);//goodsId
                        rejectItem.push(item[2]);//batchNum
                        rejectItem.push(item[3]);//rejectQty
                        rejectItem.push(item[4]);//drugESC
                        rejectItem.push(item[6]);//soldPrice
                        rejectItem.push(item[7]);//inspectUrl 质检报告
                        rejectItems.push(rejectItem);
                    });
                }
                dbService.beginTrans(function (connect) {
                    // var value for next step
                    //start async

                    var updateStatus = {isReceived: "1", status: status,updatedOn:autoSwitchToReceivedDate};
                    async.series([
                            //step1 :update Ship Status in ShipInfo
                            function updateShipStatus(done) {
                                // todo 这里和普通收货是不一样的  这里的收货时间 要手动更新到updateOn
                                dbService.metaUpdateShipInfo(connect, customerDBName, shipId, updateStatus, function (err, affectedRows) {
                                    if (err) {
                                        done(err);
                                    } else {
                                        done(err, affectedRows);
                                    }
                                });
                            },
                            //step2   update shipDetails
                            function updateShipDetails(done) {
                                //INSERT INTO %s.ShipDetails (shipId,goodsId,batchNum,receivedQuantity,receivedDrugESC,receivedRemark)
                                dbService.metaUpdateReceivedShipDetails(connect, customerDBName, updateData, function (err, results) {
                                    if (err) {
                                        done(err);
                                    } else {
                                        done(err, results);
                                    }
                                });
                            },
                            //step3   update orderstatus
                            function updateOrderStatus(done) {
                                var orderStatus = "FINISHED";
                                dbService.metaUpdateStatus(connect, customerDBName, orderId, orderStatus, "", function (err, results) {
                                    if (err) {
                                        done(err);
                                    } else {
                                        done(err, results);
                                    }
                                });


                            },
                            //step4   add new   rejectInfo if need
                            function newRejectInfo(done) {
                                //"INSERT INTO %s.RejectInfo (orderId,operatorId,shipId,remark) "
                                if ((status == "REJECT-REQUEST") && receivedData.isReject) {
                                    var insertdata = underscore.first(rejectItems[0], 4);
                                    dbService.metaNewRejectInfo(connect, customerDBName, insertdata, function (err, newRejectId) {
                                        if (err) {
                                            done(err);
                                        } else {
                                            rejectId = newRejectId;
                                            done(err, rejectId);
                                        }
                                    })
                                } else {
                                    done();
                                }
                            },
                            //step4   add new   rejectDetails if need
                            function newRejectDetails(done) {
                                if ((status == "REJECT-REQUEST") && receivedData.isReject) {

                                    //rejectItems [ [   ] ]

                                    //orderId clientId shipId remark        goodsId batchNum rejectQty drugESC
                                    var insertDetails = underscore.map(rejectItems, function (item) {
                                        item.splice(3, 1, rejectId);
                                        return item.slice(3);
                                    });
                                    // INSERT INTO %s.RejectDetails (rejectId,goodsId,batchNum,quantity,drugESC)
                                    logger.debug(rejectId);
                                    logger.error(JSON.stringify(insertDetails));
                                    db.metaNewRejectDetails(connect, customerDBName, insertDetails, function (err, result) {
                                        if (err) {
                                            done(err);
                                        } else {
                                            done(err, result);
                                        }
                                    })
                                } else {
                                    done();
                                }

                            },
                            // step6   add new OrderHistory
                            function newOrderHistory(done) {
                                var orderHistoryData = {};
                                orderHistoryData.orderId = orderId;
                                orderHistoryData.shipId = shipId;
                                orderHistoryData.operatorId = operatorData.operatorId;
                                orderHistoryData.clientId = operatorData.clientId;
                                orderHistoryData.action = "RECEIVE";
                                orderHistoryData.remark = remark;
                                dbService.metaNewOrderHistory(connect, customerDBName, orderHistoryData, function (err, success) {
                                    if (err) {
                                        done(err);
                                    } else {
                                        done(err, success);
                                    }
                                });
                            }
                        ],
                        //if no err,resultList = [affectedRows,success]
                        function (err, resultList) {
                            if (err && typeof(err) === "object") {
                                logger.debug("Rollback the transaction");
                                dbService.rollbackTrans(connect, function (transErr) {
                                    callback(err);
                                });
                            } else {
                                logger.debug("Commit the transaction");
                                dbService.commitTrans(connect, function () {
                                    //final callback result:shipId
                                    callback(null, shipId, rejectId);
                                });
                            }
                        }
                    );
                });
            }
        });
    }

    return worker;
}