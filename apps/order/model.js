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
    var orderFieldMapper = new NameMapper({
        'status': 'diliveryStatus',
        'id': 'orderId',
        'createdOn': 'createdTime'
    });
    var returnOrderFieldMapper = new FieldNameMapper({
        'id': '退货单号',
        'orderId': '订货单号',
        'createdOn': '申请时间',
        'status': '订单状态'
    });
    var shipFieldMapper = new FieldNameMapper({
        'id': '发货单号',
        'shipTime': '发货时间',
        'orderTime': '下单时间',
        'orderId': '订单号',
        'isReceived': '订单状态',
        'clientName': '客户名'
    });
    //model
    var model = {

        /**
         * get refuse details
         * @param customerDB
         * @param refuseId
         * @param callback
         */
        getRefuseDetail : function(customerDB,refuseId,callback){
            logger.enter();
            db.listRefuseDetailsById(customerDB,refuseId,function(err,refuseDetails){
                callback(err,refuseDetails);
            });
        },


        /**
         * get refuse info
         * @param customerDB
         * @param operatorData
         * @param operatorType
         * @param paginator
         * @param data
         * @param callback
         */
        getRefuseInfo: function(customerDB,operatorData,operatorType,paginator,data,callback){
            logger.enter();
            db.listRefuseInfoByOperatorId(customerDB,operatorData.operatorId,operatorType,paginator,function(err,refuseDatas){
                if(err){
                   callback(err);
                }else {
                    var filterQuantity="";
                    //这里客户的拒收单的三种状态,CREATE SHIPPED FINISHED 每种状态的笔数和金额有可能是不同的
                    if(type=='receive'){
                        filterQuantity='rejectQuantity';
                        refuseDatas=underscore.filter(refuseDatas,function(item){
                            return  item.rejectQuantity!=0;
                            //return  !underscore.isNull(item.rejectQuantity);
                        })
                    }else if(type=='received'){
                        filterQuantity='rejectReceiveQuantity';
                        refuseDatas=underscore.filter(refuseDatas,function(item){
                            return item.rejectReceiveQuantity!=0;
                            //return  !underscore.isNull(item.rejectReceiveQuantity);
                        })
                    }
                    else {
                        filterQuantity='quantity';
                    }
                    refuseDatas = underscore.chain(refuseDatas)
                        .groupBy(function (item) {
                            return item.refuseId;
                        })
                        .map(function (item) {
                            // item is an array
                            var shipItem = item[0];
                            shipItem.countBatch = item.length;
                            shipItem.quantity = underscore(item).reduce(function (memo, item) {
                                return memo + item[filterQuantity];
                            }, 0);

                            shipItem.subtotal = underscore(item).reduce(function (memo, item) {
                                return memo + Number(item[filterQuantity])*Number(item.soldPrice);
                            }, 0);

                            shipItem.subtotal=shipItem.subtotal.toFixed(2);

                            return shipItem;
                        })
                        .value();
                    data.refuseList = refuseDatas;
                    data.type=type;

                    db.listRefuseInfoByOperatorId(customerDB,operatorData.operatorId,"CREATED",paginator,function(err2,oppositerefuseDatas){
                        data["oppositerefuseDatas"] = oppositerefuseDatas;
                        if(err2){
                           callback(err2);
                        }else{
                           callback(null,data);
                        }
                    });
                }
            });
        },


        /**
         * get all return infos
         * @param customerDB
         * @param operatorData
         * @param paginator
         * @param data
         * @param callback
         */
        getReturnInfos : function(customerDB,operatorData,paginator,data,callback){
            logger.enter();
            //当状态是申请退货带审核的时候, 数据会不一样, 默认是全部的状态
            db.getReturnInfo(customerDB,operatorData.clientId,paginator,function(err,returnInfo){
                returnInfo = underscore.chain(returnInfo)
                    .groupBy(function (item) {
                        return item.id;
                    })
                    .map(function (item) {
                        /*for(var i=0;i<item.length;i++){
                         }*/
                        // item is an array
                        var shipItem = item[0];
                        shipItem.countBatch = item.length;//笔数是对的
                        //shipItem.status=item[0].status;
                        var currentReturnInfoStatus=item[0].status;
                        //关闭前状态 字段不为空 说明他被关闭了
                        if(!underscore.isNull(item[0].beforeCloseStatus)){
                            currentReturnInfoStatus=item[0].beforeCloseStatus;
                        }
                        var getQuantityName='';
                        if(currentReturnInfoStatus=='CREATED'){
                            getQuantityName='returnDetailApplyQuantity';
                        }
                        else if(currentReturnInfoStatus=='APPROVED'){
                            getQuantityName='returnApprovedQuantity';
                        }
                        else if(currentReturnInfoStatus=='SHIPPED'){
                            getQuantityName='returnDetailShippedQuantity';
                        }
                        else if(currentReturnInfoStatus=='DELIVERED'){
                            getQuantityName='returnDeliveredQuantity';
                        }
                        shipItem.status = item[0].status;
                        shipItem.quantity = underscore(item).reduce(function (memo, item) {
                            return memo + Number(item[getQuantityName]);
                        }, 0);

                        shipItem.subtotal = underscore(item).reduce(function (memo, item) {
                            //return memo + Number(item[getQuantityName])*Number(item['price']);//returnPrice
                            return memo + Number(item[getQuantityName])*Number(item['returnPrice']);//returnPrice
                        }, 0);
                        shipItem.subtotal =shipItem.subtotal.toFixed(2);
                        return shipItem;
                    }).sortBy(function(item){
                        return Math.min(item.createdOn);

                    })
                    .value();
                var pageIndex=paginator.page;
                var pageSize=paginator.pageSize;
                var startIndex=(pageIndex-1)*pageSize +1;
                var endIndex=pageIndex*pageSize;
                var ultimateReturnInfo=[];
                for(var i= startIndex-1;i<endIndex;i++){
                    if(!underscore.isUndefined(returnInfo[i])){
                        ultimateReturnInfo.unshift(returnInfo[i]);
                    }
                }
                data["returnInfo"] = ultimateReturnInfo;
                db.retrieveClientInfoForContract(customerDB, operatorData.clientId, function (error, clientInfo) {
                    data.returnStrictly = (clientInfo.paymentType == 'CREDIT') ? __returnStrictly : true;
                    callback(null,data);
                });
            });
        },


        /**
         * get batch info from db by batchNum
         * @param customerDB
         * @param batchNum
         * @param callback
         */
        getBatchInfo: function(customerDB, batchNum,callback){
            logger.enter();
            db.getBatchInfoByBatchNum(customerDB, batchNum, function (err, result) {
                callback(err,result);
            });
        },

        /**
         * get Return Apply info
         * @param customerDB
         * @param orderId
         * @param shipId
         * @param callback
         */
        getReturnApplyInfo: function(customerDB,orderId,shipId,callback){
            logger.enter();
            if(underscore.isUndefined(shipId)){
                //通过orderId 查询shipId
                db.getShipIdByOrderId(customerDB,orderId,function(err,result){
                    var shipId = result[0].id;
                    db.getShipDetails(customerDB,shipId,function(err,shipDetails){
                        callback(err,shipDetails);
                    })
                })
            }
            else{
                db.getShipDetails(customerDB,shipId,function(err,shipDetails){
                    callback(err,shipDetails);
                })
            }
        },

        /**
         * 获取发货单信息
         * @param customerDB
         * @param operatorData
         * @param isReceived
         * @param shipPaginator
         * @param data
         * @param callback
         */
        getShipInfos : function(customerDB,operatorData,isReceived,shipPaginator,data,callback){
            //add this page data
            db.getShipInfo(customerDB,operatorData.clientId,shipPaginator,isReceived, function(err,shipInfo) {
                if (!err) {
                    shipInfo = underscore.chain(shipInfo)
                        .groupBy(function (item) {
                            return item.shipId
                        })
                        .map(function (item) {
                            // item is an array
                            var shipItem = item[0];
                            shipItem.countBatch = item.length;
                            shipItem.quantity = underscore(item).reduce(function (memo, item) {
                                return memo + item.quantity;
                            }, 0);

                            shipItem.subtotal = underscore(item).reduce(function (memo, item) {
                                return memo + item.amount;
                            }, 0);
                            shipItem.subtotal = shipItem.subtotal.toFixed(2);
                            return shipItem;
                        })
                        .value();
                    data["shipInfo"] = shipInfo;

                    if (shipInfo.length > 0) {
                        data["type"] = shipInfo[0].isReceived ? "received" : "receive";
                    } else {
                        data["type"] = type;
                    }
                    var temp = shipPaginator;
                    temp.keywordList = [];
                    db.getShipInfo(customerDB, operatorData.clientId, temp, false, function (err2, oppositeShipInfo) {
                        data["oppositeShipInfo"] = oppositeShipInfo;
                        if (err2) {
                            callback(err2);
                        } else {
                            callback(null, data);
                        }
                    });
                } else {
                    callback(err);
                }
            });

        },

        /**
         * 获取发货单详情
         * @param customerDB
         * @param shipId
         * @param callback
         */
        getShipDetailsInfo : function(customerDB,shipId,callback){
            logger.enter();
            db.getShipDetails(customerDB,shipId,function(err,shipDetails){
                callback(err,shipDetails);
            });
        },

        /**
         * get data for client order/details
         * @param customerDB
         * @param orderId
         * @param clientId
         * @param customerId
         * @param callback
         */
        getClientOrderDetails : function(customerDB,orderId,clientId,customerId,callback){
            logger.enter();
            var order = undefined;

            var orderCatalog={};
            async.series([
                function(done){
                    //1.get order info;
                    db.getOrderInfo(customerDB, orderId, function (orderInfo) {
                        if(underscore.isEmpty(orderInfo)) {
                            done("ORDER INFO NOT FOUND");
                        }
                        orderCatalog.order = orderInfo;
                        var orderStatus=orderInfo.status;
                        //var paymentType=orderInfo.paymentType;
                        var paymentStatus = orderInfo.paymentStatus;
                        if(orderStatus=='CREATED'){
                            orderCatalog. order.status=paymentStatus;
                        }else{
                            orderCatalog. order.status=orderStatus;
                        }

                        done(null,"GET ORDER INFO SUCC");
                    })
                },
                function(done){
                    //2.get order details
                    db.getOrderDetail(customerDB, orderId, function (err, orderItems) {
                        if(err||underscore.isEmpty(orderItems)){
                            done("ORDERDETAILS  NOT FOUND");
                        }
                        orderCatalog.cartItems = underscore(orderItems).map(function (item) {
                            item.img = item.img || '/static/images/QQ20150908-1@2x.png';
                            return item;
                        });
                        done(null,"GET ORDER DETAILS SUCC");
                    });
                },
                function(done){
                    //3.get order history
                    db.getOrderHistoryDetails(customerDB,orderId,function (err,orderhistorys) {
                        if(err||underscore.isEmpty(orderhistorys)){
                            done("ORDERHISTORY  NOT FOUND");
                        }
                        logger.debug(JSON.stringify(orderhistorys));
                        orderCatalog.orderhistorys = orderhistorys;
                        done(null,"GET ORDER HISTORY SUCC");
                    })
                },
                function(done){
                    //4.get order Contract
                    db.retrieveCustomerInfoForContract( __cloudDBName , customerId, function (err1, customerInfo) {
                        db.retrieveClientInfoForContract(customerDB, clientId, function (err2, clientInfo) {
                            db.retrieveOrderInfoForContract(customerDB, orderId, function (err3, orderContractInfo) {
                                if (err1||err2||err3) {
                                    done("get clientContractInfo err");
                                }
                                orderCatalog.customerContractInfo = customerInfo;
                                orderCatalog.clientContractInfo = clientInfo;
                                orderCatalog.orderContractInfo = orderContractInfo;
                                orderCatalog.contractStage = "DONE";
                                done(null,"get order contrack succ");
                            })
                        })
                    });
                },
                function(done){
                    //5.get order ship and shipdetails
                    db.getShipDetailsByOrderId(customerDB, orderId, function (err,result){
                        if (err) {
                            logger.error(err);
                            done(null, "get ship Info fail");
                        }
                        orderCatalog.shipInfo = result;
                        logger.debug("order shipInfo = "+ JSON.stringify(result));
                        done(null,"GET SHIP INFO SUCC")
                    });
                },
                function(done){
                    //6.get order return info
                    db.getReturnInfoByOrderId(customerDB,orderId,function(err,results) {
                        if (err) {
                            logger.error(err);
                            done(null, "get return Info fail");
                        }
                        orderCatalog.returnInfo = results;
                        if(orderCatalog.order.status == 'FINISHED' && results.length>0){
                            orderCatalog.order.status = 'RETURNED';
                        }
                        done(null,"GET RETURN INFO SUCC");
                    })
                },
                function(done) {
                    //7. get order payment info
                    db.getPaymentInfoByOrderId(customerDB, orderId, function(err, results){
                        if (err) {
                            logger.error(err);
                            return done(null, "get payment info fail");
                        }
                        if(results.length > 0){
                            orderCatalog.paymentInfo = results[0];
                        }
                        else{
                            orderCatalog.paymentInfo = {
                                "id": 0,
                                "paymentGatewayId": 0,
                                "currencyCode": "RMB",
                                "txnAmt": 0,
                                "txnTime": "",
                                "paymentStatus": "",
                                "updatedOn":"",
                                "createdOn":""
                            };
                        }

                        logger.debug("order paymentInfo = "+ JSON.stringify(results));
                        done(null, "GET PAYMENT INFO SUCC");
                    });
                }
            ],function(errs,results){
                if(errs){
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                }
                logger.debug(JSON.stringify(results));
                callback(null,orderCatalog);
            });
        },


        /**
         * get data for Client Order list
         * @param customerDB
         * @param clientId
         * @param paginator
         * @param callback
         */
        listOrderForClient: function (customerDB, clientId, paginator, callback) {
            var orders = [];
            db.listOrders(customerDB, clientId, paginator, function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    async.mapSeries(results,
                        function (item, mapcallback) {
                            var orderStatus = item.status;
                            var paymentStatus = item.paymentStatus;
                            if (orderStatus == 'CREATED') {
                                item.status = paymentStatus;
                            }
                            if (orderStatus == 'FINISHED' && item.returnSize > 0) {
                                item.status = 'RETURNED';
                            }
                            mapcallback();
                        },
                        function (errs, resultslist) {
                            if (errs) {
                                logger.error(errs)
                            }
                            orders = results;
                            callback(null, orders)

                        }
                    );
                }
            });
        },

        /**
         * restore paymentInfo
         * @param customerDB
         * @param payData
         * @param callback
         */
        restorePayInfo: function (customerDB, payData, callback) {
            logger.enter();
            var time = new Date();
            var expireMin = __payExpireMin; //系统参数，订单的支付超时期限，分钟数
            time.setMinutes(time.getMinutes() + expireMin, time.getSeconds(), 0);
            logger.debug(time.toLocaleString());
            var payInfo = {
                paymentId: payData.paymentId,  //支付网关Id
                orderId:payData.orderId,
                displayOrderId: payData.dealOrder,    //订单displayorderId
                currencyCode: "RMB",//支付货币
                txnAmt: Number(payData.dealFee),  //支付金额
                payTimeout: time.toLocaleString()// 支付超时时间
            };
            var payId = undefined;
            async.series(
                [
                    function (done) {
                        db.restorePaymentInfo(customerDB, payInfo, function (err, results) {
                            if (err) {
                                done(err);
                            } else {
                                payId = results.insertId;
                                payInfo.payId = payId;
                                done();
                            }
                        })
                    },
                    function (done) {
                        db.restorePayInfoToOrder(customerDB, payInfo, function (err, results) {
                            if (err) {
                                done(err);
                            } else {
                                done();
                            }
                        })
                    }
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        callback();
                    }
                }
            );

        },


        /**
         * change order paidstatus
         * @param cloudDB
         * @param customerId
         * @param dealOrder
         * @param dealFee
         * @param dealState
         * @param callback
         */
        notifyPaidStatus: function (cloudDB, customerId, dealOrder, dealFee, dealState, callback) {
            var customerDB = undefined;
            var displayOrderId = dealOrder;
            var status = dealState == "SUCCESS" ? "PAID" : "UNPAID";
            var orderId = undefined;
            var isPaid=false;
            db.beginTrans(function (connect) {
                async.series([
                        function (done) {
                            db.listCustomerDBsuffixById(cloudDB, customerId, function (err, results) {
                                if (err) {
                                    done(err);
                                } else {
                                    var dbSuffix = results[0].customerDBsuffix;
                                    customerDB = __customerDBPrefix + "_" + dbSuffix;
                                    done();
                                }
                            })
                        },
                        function (done) {
                            //获取订单信息
                            db.getOrderInfoBydisplayOrderId(customerDB, displayOrderId, function (orderInfo) {
                                    orderId = orderInfo.id;
                                    done(null, "order id=" + orderId + " update success");
                            })
                        },
                        function (done) {
                            //更新订单银行回调支付状态
                            db.updateOrderBankCbInfo(connect, customerDB, orderId, status, function (err, results) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(null, "order id=" + orderId + " update success");
                                }
                            })
                        },
                        function (done) {
                            //更新paymentInfoStatus
                            db.updatePaymentInfoStatus(connect, customerDB, orderId, status, function (err, results) {
                                if (err) {
                                    done(err);
                                } else {
                                    isPaid=true;
                                    done(null, "payInfo  update Success");
                                }
                            })

                        },
                        function (done){
                            updateAutoCloseOrderTask(isPaid,orderId,function(err,result){
                                //当前更新离线任务的状态不应该影响其他流程,无论有错与否都应该正常返回
                                done(null,result);
                            });
                        }
                    ],
                    function (errs, results) {
                        if (errs) {
                            logger.error(JSON.stringify(errs));
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function () {
                                callback(null, errs);
                            });
                        } else {
                            logger.debug(JSON.stringify(results));
                            db.commitTrans(connect, function () {
                                callback(null, results);
                            });
                        }
                    })
            });

        },


        setOrderHistoryForPayment: function (cloudDB, customerId, dealOrder, dealFee, dealState, callback) {
            var customerDB = undefined;
            var status = dealState == "SUCCESS" ? "PAID" : "PAID-FAIL";
            var displayOrderId = dealOrder;
            var orderHistoryData = {};
            var orderData = undefined;
            var orderId=null,
                isPaid=false;
            db.beginTrans(function (connect) {
                async.series([
                        function (done) {
                            db.listCustomerDBsuffixById(cloudDB, customerId, function (err, results) {
                                if (err) {
                                    done(err);
                                } else {
                                    var dbSuffix = results[0].customerDBsuffix;
                                    customerDB = __customerDBPrefix + "_" + dbSuffix;
                                    done();
                                }
                            })
                        },
                        function (done) {
                            //获取订单信息
                            db.getOrderInfoBydisplayOrderId(customerDB, displayOrderId, function (orderInfo) {
                                orderData = orderInfo;
                                 orderId = orderData.id;
                                done(null, "order id=" + orderId + " update success");
                            })
                        },
                        function (done) {
                            //更新订单信息状态
                            var orderId = orderData.id;
                            db.updateOnlineOrderPayInfo(connect, customerDB, orderId, status, function (err, results) {
                                if (err) {
                                    done(err);
                                } else {
                                    isPaid=true;
                                    done(null, "order id=" + orderId + " update success");
                                }
                            })
                        },

                        function (done) {
                            //在线支付锁定库存
                            var orderId = orderData.id;
                            db.listOrderDetailsById(customerDB, orderId, function (err, orders) {
                                var updateDetails = [];
                                underscore.map(orders, function (order) {
                                    var tempArr = [];
                                    tempArr.push(order.goodsId);//订单详情中的商品Id
                                    tempArr.push(order.quantity);//订单详情中的商品数量（需要锁定的数量）
                                    updateDetails.push(tempArr);
                                });
                                db.metaUpdateSetLockedInventory(connect, customerDB, updateDetails, function (err, results) {
                                    if (err) {
                                        done(err);
                                    } else {
                                        done(err, results);
                                    }
                                });
                            })
                        },
                        function (done) {
                            orderHistoryData.clientId = orderData.clientId;
                            orderHistoryData.operatorId = orderData.operatorId;
                            orderHistoryData.orderId = orderData.id;
                            orderHistoryData.returnId = null;
                            orderHistoryData.action = status;
                            orderHistoryData.remark = dealFee;
                            db.metaNewOrderHistory(connect, customerDB, orderHistoryData, function (err, success) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(err, success);
                                }
                            })
                        },
                        function(done){
                            //支付成功之后应该去清楚掉CloudDB里面的Task内容


                            updateAutoCloseOrderTask(isPaid,orderId,function(err,result){
                                //当前更新离线任务的状态不应该影响其他流程,无论有错与否都应该正常返回
                                done(null,result);
                            });
                        }
                    ],
                    function (errs, results) {
                        if (errs) {
                            logger.error(JSON.stringify(errs));
                            db.rollbackTrans(connect, function () {
                                callback(null, errs);
                            });
                        } else {
                            logger.debug(JSON.stringify(results));
                            db.commitTrans(connect, function () {
                                callback(null, orderData.id);
                            });
                        }
                    }
                );
            });
        },

        /**
         * 校验订单支付信息的签名
         * @param cloudDB
         * @param customerId
         * @param paymentId
         * @param dealOrder
         * @param dealState
         * @param dealSignature
         * @param callback
         */
        checkDealSignature: function (cloudDB, customerId, paymentId, dealOrder, dealState, dealSignature, callback) {
            db.getPayConfig(cloudDB, customerId, paymentId, function (err, result) {
                if (err || result.length == 0) {
                    logger.error("获取支付授权码错误");
                    callback(false);
                } else {
                    var configValue = result[0].configValue;
                    db.getPaymentInfoById(cloudDB, paymentId, function (err, paymentInfo) {
                        var checkSignature = paymentModule.getReturnSignure(paymentInfo, dealOrder, dealState, configValue);
                        logger.debug(dealSignature);
                        if (checkSignature == dealSignature) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    })
                }
            })
        },

        checkClientDealSignature: function (customerDB, customerId, paymentId, dealOrder, dealState, dealSignature, callback) {
            db.getClientPayConfig(customerDB, customerId, paymentId, function (err, result) {
                if (err || result.length == 0) {
                    logger.error("获取支付授权码错误");
                    callback(false);
                } else {
                    var configValue = result[0].configValue.replace(/\'/g, "\"");
                    logger.debug(configValue);
                    var configData = JSON.parse(configValue);
                    db.getClientPaymentInfoById(customerDB, paymentId, function (err, paymentInfo) {
                        var checkSignature = paymentModule.getReturnSignure(paymentInfo, dealOrder, dealState, configData);
                        logger.debug(dealSignature);
                        if (checkSignature == dealSignature) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    })
                }
            })
        },

        /**
         * 授信客户付款或者货到付款
         * @param customerDB
         * @param orderId
         * @param payType  CRT = 授信客户， COD=货到付款
         * @param callback
         */
        payForCredit : function(customerDB, orderId, clientId, payType, callback){
            logger.enter();
            var isPaid=false;
            if(payType == "CRT"){
                logger.debug("orderInfo.payType="+payType);
                var orderTotal = 0;
                var arrearsBalance = 0;
                db.beginTrans(function(connect) {
                    async.series(
                        [
                            function(done){
                                //todo 1.验证授信的支付合格
                                db.listPayOrderInfo(customerDB,orderId,function(err,results){
                                    if(err){
                                        done(err)
                                    }
                                    var paymentStatus = results[0].paymentStatus;
                                    orderTotal = Number(results[0].total);
                                    if(paymentStatus == "PAID"){
                                        done("该订单已经支付");
                                    }else{
                                        done();
                                    }
                                });
                            },
                            function(done) {
                                // 用户授信余额检测
                                db.getClientFinance(customerDB, clientId, function(err, results){
                                    if (err) {
                                        done(err);
                                    } else {
                                        arrearsBalance = Number(results.arrearsBalance);
                                        if(orderTotal > arrearsBalance) {
                                            done("您的授信余额不足");
                                        }
                                        else {
                                            done(err, results);
                                        }
                                    }
                                });
                            },
                            function(done){
                                //2.更新订单支付状态
                                db.updateOrderPayInfo(connect,customerDB,orderId,"PAID",function(err,results){
                                    if(err){
                                        logger.error(err);
                                        done(err);
                                    }else{
                                        isPaid=true;
                                        done(err,results);

                                    }
                                })
                            },
                            //如果支付成功,将Task中该订单相关联的任务状态设置为DELETED
                            function(done){
                                //支付成功之后应该去清楚掉CloudDB里面的Task内容
                                updateAutoCloseOrderTask(isPaid,orderId,function(err,result){
                                    //当前更新离线任务的状态不应该影响其他流程,无论有错与否都应该正常返回
                                    done(null,result);
                                });
                            }
                            ,
                            function(done){
                                //3.更新订单支付paymentType
                                db.updateOrderPayType(connect,customerDB,orderId,"CREDIT",function(err,results){
                                    done(err,results);
                                })
                            },
                            /*2,3 更新订单的paymentType 和 paymentStatus*/
                     /*       function(done){
                                db.updateOrderPayStatusAndPayType(connect,customerDB,orderId,"PAID","CREDIT",function(err,results){
                                    if(err){
                                        logger.error(err);
                                        done(err);
                                    }else{
                                        done(err,results);
                                    }
                                });
                            },*/
                            function(done){
                                //4.更新锁定库存数据
                                db.listOrderDetailsById(customerDB, orderId, function (err, orders) {
                                    var updateDetails = [];
                                    underscore.map(orders, function (order) {
                                        var tempArr = [];
                                        tempArr.push(order.goodsId);//订单详情中的商品Id
                                        tempArr.push(order.quantity);//订单详情中的商品数量（需要锁定的数量）
                                        updateDetails.push(tempArr);
                                    });
                                    db.metaUpdateSetLockedInventory(connect, customerDB, updateDetails, function (err, results) {
                                        if (err) {
                                            done(err);
                                        } else {
                                            done(err, results);
                                        }
                                    });
                                })
                            },
                            function(done){
                                //5.扣除授信欠款余额
                                db.updateClientFinanceBalance(connect, customerDB, clientId, orderTotal, true, function(err, results){
                                    if (err) {
                                        done(err);
                                    } else {
                                        done(err, results);
                                    }
                                });
                            }
                        ],
                        function(errs,results){
                            if(errs){
                                logger.error(JSON.stringify(errs));
                                // rollback transaction
                                db.rollbackTrans(connect, function(){
                                    callback(errs);
                                });
                            }else{
                                logger.debug(JSON.stringify(results));
                                // commit transaction
                                db.commitTrans(connect, function(){
                                    callback(null, results);
                                });
                            }
                        }
                    );
                });

            }
            if(payType == "COD"){
                logger.debug("orderInfo.payType="+payType);
                async.series(
                    [
                        function(done){
                            //todo 1.验证货到付款的资格
                            db.listPayOrderInfo(customerDB,orderId,function(err,results){
                                if(err){
                                    done(err)
                                }
                                var paymentStatus = results[0].paymentStatus;
                                if(paymentStatus == "PAID"){
                                    done("该订单已经支付");
                                }else{
                                    done();
                                }
                            });
                        },
                       /* function(done){
                            //2.更新订单支付状态
                            db.updateOrderPayInfo(__mysql,customerDB,orderId,"PAID",function(err,results){
                                done(err,results);
                            })
                        },
                        function(done){
                            //3.更新订单支付paymentType
                            db.updateOrderPayType(__mysql,customerDB,orderId,"COD",function(err,results){
                                done(err,results);
                            })
                        },*/

                        //2,3 更新paymentStatus 以及 paymentType
                        function(done){
                            db.updateOrderPayStatusAndPayType(__mysql,customerDB,orderId,"PAID","COD",function(err,results){
                                if(err){
                                    logger.error(err);
                                    done(err);
                                }else{
                                    isPaid=true;
                                    done(err,results);
                                }
                            });
                        },
                        //更新Task表里面的内容
                        function(done){
                            //支付成功之后应该去清楚掉CloudDB里面的Task内容
                            updateAutoCloseOrderTask(isPaid,orderId,function(err,result){
                                //当前更新离线任务的状态不应该影响其他流程,无论有错与否都应该正常返回
                                done(null,result);
                            });
                        }
                        ,
                        function(done){
                            //4.更新锁定库存数据
                            db.listOrderDetailsById(customerDB, orderId, function (err, orders) {
                                var updateDetails = [];
                                underscore.map(orders, function (order) {
                                    var tempArr = [];
                                    tempArr.push(order.goodsId);//订单详情中的商品Id
                                    tempArr.push(order.quantity);//订单详情中的商品数量（需要锁定的数量）
                                    updateDetails.push(tempArr);
                                });
                                db.metaUpdateSetLockedInventory(__mysql, customerDB, updateDetails, function (err, results) {
                                    if (err) {
                                        done(err);
                                    } else {
                                        done(err, results);
                                    }
                                });
                            })
                        }
                    ],
                    function(errs,results){
                        if(errs){
                            logger.error(JSON.stringify(errs));
                            callback(errs)
                        }else{
                            logger.debug(JSON.stringify(results));
                            callback(null,results);
                        }
                    }
                )
            }
        },


        /**
         * get customerSuffix
         * @param cloudDB
         * @param customerId
         * @param callback
         */
        getCustomerDBsuffix: function (cloudDB, customerId, callback) {
            db.listCustomerDBsuffixById(cloudDB, customerId, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            })
        },

        /**
         *
         * @param customerDB
         * @param dealOrder
         * @param callback
         */
        checkNotifyStatus: function (customerDB, dealOrder, callback) {
            logger.enter();
            var displayOrderId = dealOrder;
            db.checkOrderStatus(customerDB, displayOrderId,function (err, result) {
                if (!err && result.length > 0) {
                    callback(true);
                } else {
                    callback(false);
                }
            });

        },

        checkNotifyBankStatus: function (customerDB, dealOrder, callback) {
            logger.enter();
            var displayOrderId = dealOrder;
            db.checkOrderBankStatus(customerDB, displayOrderId,function (err, result) {
                if (!err && result.length > 0) {
                    callback(true);
                } else {
                    callback(false);
                }
            });

        },
        /**
         * 校验订单支付信息的订单金额
         * @param customerDB
         * @param dealOrder
         * @param dealFee
         * @param callback
         */
        checkDealFee: function (customerDB, dealOrder, dealFee, callback) {
            logger.enter();
            var displayOrderId = dealOrder;
            var amount = Number(dealFee);
            db.checkOrderFee(customerDB, displayOrderId, amount, function (err, result) {
                if (!err && result.length > 0) {
                    callback(true);
                } else {
                    callback(false);
                }
            });

        },


        formClientPaymentQuery: function (customerDB, payGateId, customerId, dealQuery, callback) {
            logger.enter();
            var data = {};
            var paymentGateway = undefined;
            async.series([
                //get paymentGateway Info
                function (cb) {
                    db.getClientPaymentInfoById(customerDB, payGateId, function (err, result) {
                        if (err) {
                            cb(err +  " PaymentGateway can not found");
                        } else {
                            paymentGateway = result;
                            cb();
                        }
                    })
                },

                //get  dealSignure
                function (cb) {
                    db.getClientPayConfig(customerDB, customerId, payGateId, function (err, result) {
                        if (err || result.length == 0) {
                            logger.error("获取支付授权码错误");
                            cb(err + "获取支付授权码错误");
                        } else {
                            var configValue = result[0].configValue.replace(/\'/g, "\"");
                            logger.debug(configValue);
                            var configData = JSON.parse(configValue);
                            data.merId = configData.merId;
                            data.dealQuery = dealQuery;
                            data.dealSignure = paymentModule.getQuerySignure(paymentGateway, data, configData);
                            data.baseUrl = paymentGateway.baseUrl;
                            logger.debug("data = " + JSON.stringify(data));
                            cb();
                        }
                    });
                }
            ], function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                } else {
                    logger.error(JSON.stringify(results));
                    callback(null, data);
                }
            })
        },

        getPayGateIdByName: function (cloudDB, customerDB, paymentOnCloud, payGateKey, callback) {
            logger.enter();
            if (payGateKey == "ecpay") {
                var payGateName = "联行支付";
                if (paymentOnCloud) {
                    db.getPayIdByName(cloudDB, payGateName, function (err, results) {
                        if (err) {
                            callback("NOT FIND PAYGATE");
                        } else {
                            callback(null, results[0].id);
                        }
                    })

                } else {
                    db.getClientPayIdByName(customerDB, payGateName, function (err, results) {
                        if (err) {
                            callback("NOT FIND PAYGATE");
                        } else {
                            callback(null, results[0].id);
                        }
                    })
                }
            } else {
                callback(null, "NO DEFINED PAYGATE")
            }
        },


        formPaymentQuery: function (cloudDB, payGateId, customerId, dealQuery, callback) {
            logger.enter();
            var data = {};
            var paymentGateway = undefined;
            async.series([
                //get paymentGateway Info
                function (cb) {
                    db.getPaymentInfoById(cloudDB, payGateId, function (err, result) {
                        if (err) {
                            cb(err +" PaymentGateway can not found");
                        } else {
                            paymentGateway = result;
                            cb();
                        }
                    })
                },

                //get  dealSignure
                function (cb) {
                    db.getPayConfig(cloudDB, customerId, payGateId, function (err, result) {
                        if (err || result.length == 0) {
                            logger.error("获取支付授权码错误");
                            cb(err + "获取支付授权码错误");
                        } else {
                            var configValue = result[0].configValue.replace(/\'/g, "\"");
                            logger.debug(configValue);
                            var configData = JSON.parse(configValue);
                            data.merId = configData.merId;
                            data.dealQuery = dealQuery;
                            data.dealSignure = paymentModule.getQuerySignure(paymentGateway, data, configData);
                            data.baseUrl = paymentGateway.baseUrl;
                            logger.debug("data = " + JSON.stringify(data));
                            cb();
                        }
                    });
                }
            ], function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                } else {
                    logger.error(JSON.stringify(results));
                    callback(null, data);
                }
            })
        },

        formRefundInfo:function (cloudDB, customerDB, orderId,callback) {
            logger.enter();
            var data = {};
            var paymentId = undefined;
            var paymentInfo = undefined;
            var paymentGateway = undefined;
            var refundId = undefined;
            var displayOrderId = undefined;
            async.series([
                //get order paymentId by OrderInfo.id=ordedrId paymentType="ONLINE",AND paymentStatus = "PAID"
                function (cb) {
                    db.getPaymentIdForRefund(customerDB, orderId, function (err, result) {
                        if (err || result.length == 0||underscore.isNull(result[0].paymentId)) {
                            cb(err + "orderId=" + orderId + " status can not refund");
                        } else {
                            paymentId = result[0].paymentId;
                            cb();
                        }
                    })
                },

                //get paymentInfo by paymentId
                function (cb) {
                    db.getOrderPayment(customerDB, paymentId, function (err, results) {
                        if (err || results.length == 0) {
                            cb(err + "orderId=" + orderId + " paymentInfo can not found");
                        } else {
                            paymentInfo = results[0];
                            cb();
                        }
                    })
                },
                //get paymentGateway Info
                function (cb) {
                    db.getPaymentInfoById(cloudDB, paymentInfo.paymentGatewayId, function (err, result) {
                        if (err) {
                            cb(err + "orderId=" + orderId + " PaymentGateway can not found");
                        } else {
                            paymentGateway = result;
                            cb();
                        }
                    })
                },

                //update OrderInfo hasRefund
                function (cb) {
                    var status = "1";
                    db.updateOrderInfoRefund(customerDB, orderId, status, function (err, result) {
                        if (err) {
                            cb(err + "orderId=" + orderId + "update order hasrefund fail");
                        } else {
                            cb(null, "update OrderInfo.hasrefund Success");
                        }
                    })
                },
                function (cb) {
                    db.getOrderInfo(customerDB, orderId, function (orderInfo) {
                        displayOrderId = orderInfo.displayOrderId;
                        cb();
                    })
                },
                //restore refundInfo
                function (cb) {
                    var refundInfo = {
                        paymentGatewayId: Number(paymentInfo.paymentGatewayId),
                        orderId: Number(paymentInfo.orderId),
                        currencyCode: paymentInfo.currencyCode,
                        txnAmt: Number(paymentInfo.txnAmt),//退款金额
                        orderAmt: Number(paymentInfo.txnAmt)
                    };
                    db.restoreRefundInfo(customerDB, refundInfo, function (err, result) {
                        if (err) {
                            cb(err + "orderId=" + orderId + "restore refund info fail");
                        } else {
                            refundId = result[0].id;
                            cb(null, "restore order Refund Success");
                        }
                    })
                },
                //get  dealSignure
                function (cb) {
                    db.getPayConfig(customerDB, customerId, paymentGateway.id, function (err, result) {
                        if (err || result.length == 0) {
                            logger.error("获取支付授权码错误");
                            cb(err + "获取支付授权码错误");
                        } else {
                            var configValue = result[0].configValue.replace(/\'/g, "\"");
                            logger.debug(configValue);
                            var configData = JSON.parse(configValue);
                            data.merId = configData.merId;
                            data.dealOrder = displayOrderId;
                            data.dealAmount = Number(paymentInfo.txnAmt).toFixed(2);
                            data.refundAmount = Number(paymentInfo.txnAmt).toFixed(2);//退款金额
                            data.dealSignure = paymentModule.getRefundSignure(paymentGateway, data, configData);
                            data.baseUrl = paymentGateway.baseUrl;
                            logger.debug("data = " + JSON.stringify(data));
                            cb();
                        }
                    });
                },

                //restore refundList
                function (cb) {
                    db.restoreRefundList(customerDB, refundId, function (err, result) {
                        cb(err, result);
                    })
                }
            ], function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                } else {
                    logger.error(JSON.stringify(results));
                    callback(null, data);
                }
            })
        },


        /**
         * 构建refund数据(Client)
         */
        formClientRefundInfo: function (customerDB, orderId, refundId, customerId, callback) {
            logger.enter();
            var data = {};
            var paymentId = undefined;
            var paymentInfo = undefined;
            var paymentGateway = undefined;
            var displayOrderId = undefined;
            var verifiedAmount = undefined;

            async.series([
                // 通过 refundId 获取退款确认金额
                function (cb) {
                    db.getRefundDataById(customerDB, refundId, function(err, result) {
                        if(err || result.length == 0) {
                            cb(err+ " refundId=" + refundId + " status can not refund");
                        }
                        else {
                            verifiedAmount = parseFloat(result[0].verifiedAmount);
                            logger.ndump('verifiedAmount : ', verifiedAmount);
                            cb();
                        }
                    });
                },

                //get order paymentId by OrderInfo.id=ordedrId paymentType="ONLINE",AND paymentStatus = "PAID"
                function (cb) {
                    db.getPaymentIdForRefund(customerDB, orderId, function (err, result) {
                        if (err || result.length == 0) {
                            cb(err + " orderId=" + orderId + " status can not refund");
                        } else {
                            paymentId = result[0].paymentId;
                            cb();
                        }
                    })
                },

                //get paymentInfo by paymentId
                function (cb) {
                    db.getOrderPayment(customerDB, paymentId, function (err, results) {
                        if (err || results.length == 0) {
                            cb(err + " orderId=" + orderId + " paymentInfo can not found");
                        } else {
                            paymentInfo = results[0];
                            cb();
                        }
                    })
                },
                function (cb) {
                    db.getOrderInfo(customerDB, orderId, function (orderInfo) {
                        displayOrderId = orderInfo.displayOrderId;
                        cb();
                    })
                },

                //get paymentGateway Info
                function (cb) {
                    db.getClientPaymentInfoById(customerDB, paymentInfo.paymentGatewayId, function (err, result) {
                        if (err) {
                            cb(err + "orderId=" + orderId + " PaymentGateway can not found");
                        } else {
                            paymentGateway = result;
                            cb();
                        }
                    })
                },

                //update OrderInfo hasRefund
                function (cb) {
                    var status = "1";
                    db.updateOrderInfoRefund(customerDB, orderId, status, function (err, result) {
                        if (err) {
                            cb(err + "orderId=" + orderId + "update order hasrefund fail");
                        } else {
                            cb(null, "update OrderInfo.hasrefund Success");
                        }
                    })
                },
                //restore refundInfo
                function (cb) {
                    var refundInfo = {
                        paymentGatewayId: Number(paymentInfo.paymentGatewayId),
                        orderId: Number(paymentInfo.orderId),
                        currencyCode: paymentInfo.currencyCode,
                        txnAmt: verifiedAmount,
                        orderAmt: Number(paymentInfo.txnAmt)
                    };
                    db.restoreRefundInfo(customerDB, refundInfo, function (err, result) {
                        if (err) {
                            cb(err + "orderId=" + orderId + "restore refund info fail");
                        } else {
                            cb(null, "restore order Refund Success");
                        }
                    })
                },

                //get  dealSignure
                function (cb) {
                    db.getClientPayConfig(customerDB, customerId, paymentGateway.id, function (err, result) {
                        if (err || result.length == 0) {
                            logger.error("获取支付授权码错误");
                            cb(err + "获取支付授权码错误");
                        } else {
                            var configValue = result[0].configValue.replace(/\'/g, "\"");
                            logger.debug(configValue);
                            var configData = JSON.parse(configValue);
                            data.merId = configData.merId;
                            data.dealOrder = displayOrderId;
                            data.dealAmount = Number(paymentInfo.txnAmt).toFixed(2);
                            data.refundAmount = Number(verifiedAmount).toFixed(2);
                            data.dealSignure = paymentModule.getRefundSignure(paymentGateway, data, configData);
                            data.baseUrl = paymentGateway.baseUrl;
                            logger.debug("data = " + JSON.stringify(data));
                            cb();
                        }
                    });
                }
            ], function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                } else {
                    logger.error(JSON.stringify(results));
                    callback(null, data);
                }
            })
        },

        /**
         * 构建支付订单的数据
         */
        formPaymentInfo: function (cloudDB, customerDB, orderId, customerId, callback) {
            logger.enter();
            var data = [];
            var obj = {};
            var payments = [];
            var orderInfo = {};
            var goodsName = undefined;
            var baseReturn = undefined;
            var financeData = undefined;
            var clientId = undefined;
            var orderPaymentType = undefined;
            async.series([
                    //取出所有支付方式对应的支付数据
                    function (cb) {
                        db.listPayments(cloudDB, function (err, results) {
                            if (err) {
                                cb(err);
                            } else {
                                if (results.length == 0) {
                                    cb("系统没有配置该客户的支付网关，请联系管理员");
                                } else {
                                    payments = results;
                                    cb();
                                }
                            }
                        })
                    },
                    //取出订单信息的对应数据，订单编号，订单金额
                    function (cb) {
                        db.listPayOrderInfo(customerDB, orderId, function (err, results) {
                            if (!err && results.length > 0) {
                                orderInfo = {
                                    id: results[0].displayOrderId,
                                    amount: results[0].total
                                };
                                clientId = results[0].clientId;
                                orderPaymentType = results[0].paymentType;
                                logger.debug("orderInfo = " + JSON.stringify(orderInfo));
                                cb();
                            } else {
                                cb("没有对应的订单数据，无法支付")
                            }

                        });
                    },
                    //取出订单详情需要的数据（第一个商品的商品名字）
                    function (cb) {
                        db.listOrderDetailsForPay(customerDB, orderId, function (err, results) {
                            goodsName = results[0].commonName;
                            cb(null, goodsName);
                        })
                    },
                    //取出订单对应的客户的财务数据（用于授信客户查看信用额度）
                    function (cb) {
                        db.listFinaceInfoByClientId(customerDB, clientId, function (err, results) {
                            financeData = results[0];
                            financeData.paymentType = orderPaymentType;
                            cb(null, "GET FINANCE OK");
                        })
                    },
                    //取出或配置支付结果展示和返回的URL
                    function (cb) {
                        var sysconfig = require(__base + '/config/sysconfig.json');
                        baseReturn = sysconfig.paymentCallbackUrl;
                        logger.debug(baseReturn);
                        cb();
                    },
                    //生成数字签名
                    function (cb) {
                        async.mapSeries(payments,
                            function (payment, mapcallback) {
                                db.getPayConfig(cloudDB, customerId, payment.id, function (err, result) {
                                    if (err || result.length == 0) {
                                        logger.error("获取支付授权码错误");
                                        mapcallback(err + "获取支付授权码错误");
                                    } else {
                                        //替换数据库中单引号为JSON解析需要的双引号
                                        var configValue = result[0].configValue.replace(/\'/g, "\"");
                                        logger.debug(configValue);
                                        var configData = JSON.parse(configValue);
                                        //todo here to get decode Value of configValue by crpto;
                                        logger.debug(JSON.stringify(configData));
                                        obj.merId = configData.merId;
                                        obj.dealName = goodsName;
                                        obj.dealOrder = orderInfo.id;
                                        obj.dealReturn = baseReturn + path.sep + "Return" + path.sep + payment.id + path.sep + customerId + path.sep+clientId+path.sep;
                                        obj.dealNotify = baseReturn + path.sep + "Notify" + path.sep + payment.id + path.sep + customerId + path.sep+clientId+path.sep;
                                        obj.dealFee = Number(orderInfo.amount).toFixed(2);
                                        obj.dealSignure = paymentModule.getSignure(payment, orderInfo, obj.dealReturn, configData);
                                        obj.baseUrl = payment.baseUrl;
                                        logger.debug("obj = " + JSON.stringify(obj));
                                        data.push(obj);
                                        mapcallback();
                                    }
                                });
                            },
                            function (err, result) {
                                if (err) {
                                    logger.error(err);
                                }
                                cb();
                            })
                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    } else {
                        logger.error(JSON.stringify(results));
                        callback(null, {datas: data, payments: payments,finaceData:financeData});
                    }

                })
        },
        /**
         * 构建支付订单的数据（client）
         */
        formPaymentInfoOnClient: function (req, customerDB, orderId, customerId,callback) {
            logger.enter();
            var data = [];
            var obj = {};
            var payments = [];
            var orderInfo = {};
            var goodsName = undefined;
            var baseReturn = undefined;
            var financeData = undefined;
            var orderPaymentType = undefined;
            var clientId = undefined;
            async.series([
                    //取出所有支付方式对应的支付数据
                    function (cb) {
                        db.listClientPayments(customerDB, customerId, function (err, results) {
                            if (err) {
                                cb(err);
                            } else {
                                if (results.length == 0) {
                                    cb("系统没有配置支付网关，请联系管理员");
                                } else {
                                    payments = results;
                                    cb();
                                }
                            }
                        })
                    },
                    //取出订单信息的对应数据，订单编号，订单金额
                    function (cb) {
                        db.listPayOrderInfo(customerDB, orderId, function (err, results) {
                            if (!err && results.length > 0) {
                                orderInfo = {
                                    id: results[0].displayOrderId,
                                    amount: results[0].total
                                };
                                clientId = results[0].clientId;
                                orderPaymentType = results[0].paymentType;
                                logger.debug("orderInfo = " + JSON.stringify(orderInfo));
                                cb();
                            } else {
                                cb("没有对应的订单数据，无法支付")
                            }

                        });
                    },
                    //取出订单详情需要的数据（第一个商品的商品名字）
                    function (cb) {
                        db.listOrderDetailsForPay(customerDB, orderId, function (err, results) {
                            goodsName = results[0].commonName;
                            orderInfo['goodsId'] = results[0].goodsId;
                            cb(null, goodsName);
                        })
                    },
                    //取出订单对应的客户的财务数据（用于授信客户查看信用额度）
                    function (cb) {
                        db.listFinaceInfoByClientId(customerDB, clientId, function (err, results) {
                            financeData = results[0];
                            financeData.paymentType = orderPaymentType;
                            cb(null, "GET FINANCE OK");
                        })
                    },
                    //取出系统配置的结帐日期
                    function (cb) {
                        var key = "checkOutDays";
                        db.getKeyValue(customerDB,key,function(value){
                            financeData.checkoutDays = value;
                            cb();
                        })
                    },
                    //取出或配置支付结果展示和返回的URL
                    function (cb) {
                        var sysconfig = require(__base + '/config/sysconfig.json');
                        baseReturn = sysconfig.paymentCallbackUrl;
                        logger.debug(baseReturn);
                        cb();
                    },
                    //生成数字签名
                    function (cb) {
                        async.mapSeries(payments,
                            function (payment, mapcallback) {
                                db.getClientPayConfig(customerDB, customerId, payment.id, function (err, result) {
                                    if (err || result.length == 0) {
                                        logger.error("获取支付授权码错误");
                                        mapcallback(err + "获取支付授权码错误");
                                    } else {
                                        //替换数据库中单引号为JSON解析需要的双引号
                                        var configValue = result[0].configValue.replace(/\'/g, "\"");
                                        var configData = JSON.parse(configValue);
                                        payment.payType = configData.payType||"ONLINE";
                                        //todo here to get decode Value of configValue by crpto;

                                        logger.debug(JSON.stringify(configData));

                                        logger.ndump('payment', payment);
                                        obj = {};
                                        obj.paymentId = payment.id;
                                        obj.paymentName = payment.name;
                                        obj.dealFee = Number(orderInfo.amount).toFixed(2);
                                        if(payment.name == "联行支付"){
                                            obj.merId = configData.merId;
                                            obj.dealName = goodsName;
                                            obj.dealOrder = orderInfo.id;
                                            obj.dealReturn = baseReturn + path.sep + "Return" + path.sep + payment.id + path.sep + customerId + path.sep+clientId+path.sep;
                                            obj.dealNotify = baseReturn + path.sep + "Notify" + path.sep + payment.id + path.sep + customerId + path.sep+clientId+path.sep;
                                            obj.dealFee = Number(orderInfo.amount).toFixed(2);
                                            obj.dealSignure = paymentModule.getSignure(payment, orderInfo, obj.dealReturn, configData);
                                            obj.baseUrl = payment.baseUrl;
                                            logger.debug("obj = " + JSON.stringify(obj));
                                            data.push(obj);
                                            return mapcallback();
                                        }else if(payment.name == "微信支付") {
                                            var WXPay = require('../../services/wechat/pay');
                                            var wxpay = WXPay({
                                                appid: configData.appid,
                                                mch_id: configData.mch_id,
                                                partner_key: configData.partner_key //微信商户平台API密钥
                                                //pfx: fs.readFileSync('./wxpay_cert.p12'), //微信商户平台证书
                                            });

                                            var clientIpStr = paymentModule.getClientIp(req);
                                            var clientIp = clientIpStr.split(':');
                                            logger.ndump('clientIp[3]', clientIp[3]);
                                            logger.ndump('orderInfo', orderInfo);
                                            logger.ndump('Number(orderInfo.amount).toFixed(2)', Number(orderInfo.amount).toFixed(2));


                                            wxpay.createUnifiedOrder({
                                                body: '这里是商品的简单描述',
                                                out_trade_no: orderInfo.id,
                                                // total_fee: Number(orderInfo.amount).toFixed(2) * 100,
                                                total_fee: 1,
                                                spbill_create_ip: clientIp[3],
                                                notify_url: __cloudURL + '/order/wechatPayment/notify',
                                                trade_type: 'NATIVE',
                                                product_id: orderInfo.goodsId  //此id为二维码中包含的商品ID，商户自行定义。
                                            }, function(err, result){
                                                logger.ndump('rusult', result);
                                                obj.wechat_pay_url = result.code_url;

                                                logger.debug("obj = " + JSON.stringify(obj));
                                                data.push(obj);
                                                return mapcallback();
                                        })
                                        }else{
                                            logger.debug("obj = " + JSON.stringify(obj));
                                            data.push(obj);
                                            return mapcallback();
                                        }
                                    }
                                });
                            },
                            function (err, result) {
                                if (err) {
                                    logger.error(err);
                                }
                                cb();
                            }
                        )
                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    } else {
                        logger.debug(JSON.stringify(results));
                        callback(null, {datas: data, payments: payments,finaceData:financeData});
                    }

                })
        },

        /*插入新的退货单,客户申请退货,没有批次信息*/
        insertNewReturnInfo: function (customerDB, operatorId, status, remark, goodsArr, callback) {
            logger.enter();
            var newReturnId;
            var displayReturnId;
            db.beginTrans(function (connect) {
                async.series([
                        //step 1  newReturnInfo
                        function insertIntoReturnInfo(done) {
                            db.metaInsertNewReturnInfo(connect, customerDB, operatorId, status, remark, function (err, result) {
                                if (err) {
                                    done(err);
                                }
                                else {
                                    newReturnId = result;
                                    done(err, result);
                                }
                            });
                        },
                        function setDisplayReturnInfo(done) {
                            var today = new Date();
                            var yyyymmdd = moment(today).format('YYYYMMDD');
                            displayReturnId = idGen.getDisplayId(newReturnId, yyyymmdd, __idPrefix.return);

                            db.metaBatchSetDisplayReturnId(connect, customerDB, {returnId: newReturnId, displayReturnId: displayReturnId}, function(err, result){
                                if (err) {
                                    logger.error(err);
                                    done(err);
                                } else {
                                    logger.trace("Set return display id: " + displayReturnId + " successful.");
                                    done();
                                }
                            });
                        },
                        //step 2 newReturnInfoGoods映射表
                        function batchInsertReturnGoodsMap(done) {
                            for (var i = 0; i < goodsArr.length; i++) {

                                goodsArr[i].unshift(newReturnId);
                            }
                            db.metaBatchInsertReturnInfoGoodsMap(connect, customerDB, goodsArr, function (err, result) {
                                if (err) {
                                    done(err);
                                }
                                else {

                                    done(err, result)
                                }
                            });
                        }
                    ],
                    function (err) {
                        if (err && typeof(err) === "object") {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function () {
                                callback(err);
                            });
                        } else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                //final callback result:shipId
                                callback(null, newReturnId);
                            });
                        }
                    });
            });
        },

        /**退货改版,新的退货单,有批次信息 2016-03-18*/
        insertNewReturnItem: function (customerDB, operatorId, orderId, shipId, status, remark, goodsArr, clientId, callback) {
            logger.enter();
            var newReturnId;
            var displayId,
                isShipped=false;
            //当下不收货 就可以退货.这里isShipped为了去更新Task里面的数据的状态
            db.beginTrans(function (connect) {
                async.series([
                        //step1 insert into ReturnInfo
                        function (done) {
                            db.metaReturnInfoInsert(connect, customerDB, operatorId, orderId, shipId, status, remark, function (err, result) {
                                if (err) {
                                    logger.error(err);
                                    done(err);
                                }
                                else {
                                    newReturnId = result;
                                    isShipped=true;
                                    logger.debug(newReturnId);
                                    done(err, result);
                                }

                            });
                        },
                        //比对总的发货数量和申请数量
                        function (done) {
                            //orderId =-1 代表订单外退货，不检查发货总数，[{"goodsId":771,"sumShipQty":1}]
                            if (orderId > 0) {
                                db.getSumShipQtyByOrderId(connect, customerDB, orderId, function (err, results) {
                                    if (err) {
                                        logger.error(err);
                                        done(err);
                                    } else {
                                        logger.debug(JSON.stringify(results));
                                        var overlimit = false;
                                        underscore.map(goodsArr, function (item) {
                                            underscore.map(results, function (obj) {
                                                if (item.goodsId == obj.goodsId) {
                                                    overlimit = item.applyQuantity > obj.sumShipQty;
                                                }
                                            })
                                        });
                                        logger.debug("overlimit=" + overlimit);
                                        if (overlimit) {
                                            done("退货申请数量超过了发货总数")
                                        } else {
                                            done();
                                        }
                                    }
                                })
                            } else {
                                done();
                            }
                        },
                        //step2 insert into ReturnGoodsMap
                        function (done) {
                            //returnId,goodsId,applyQuantity,remark,price
                            var newInsertGoodsMapsArray = [];
                            var goodsList = [];
                            underscore.map(goodsArr, function (obj) {
                                if (goodsList.length == 0 || goodsList.indexOf(obj.goodsId) == -1) {
                                    var tempArr = [];
                                    goodsList.push(obj.goodsId);
                                    tempArr.push(newReturnId, obj.goodsId, obj.applyQuantity, obj.price);
                                    newInsertGoodsMapsArray.push(tempArr);
                                }
                            });
                            logger.debug(JSON.stringify(newInsertGoodsMapsArray));
                            db.metaReturnInfoGoodsMapBatchInsert(connect, customerDB, newInsertGoodsMapsArray, function (err, result) {
                                if (err) {
                                    done(err);
                                }
                                else {
                                    done(err, result)
                                }
                            });
                        },
                        //step3 insert into ReturnDetails
                        function (done) {
                            //returnId,goodsId,batchNum,quantity,goodsProduceDate,goodsValidDate,drugESC,inspectReportURL
                            var updateReturnDetails = [];
                            underscore.each(goodsArr, function (goodItem) {
                                underscore.each(goodItem.batchDatas, function (batchData) {
                                    batchData.unshift(newReturnId);
                                    updateReturnDetails.push(batchData);
                                })
                            });
                            logger.debug(JSON.stringify(updateReturnDetails));
                            db.metaReturnDetailsBatchInsert(connect, customerDB, updateReturnDetails, function (err, result) {
                                if (err) {
                                    done(err);
                                }
                                else {
                                    done(err, result);
                                }
                            })
                        },
                        //step3 add order History
                        function newOrderHistory(done) {
                            var orderHistoryData = {};
                            orderHistoryData.clientId = underscore.isEmpty(clientId) ? -1 : clientId;
                            orderHistoryData.operatorId = operatorId;
                            orderHistoryData.orderId = orderId;
                            orderHistoryData.shipId = shipId;
                            orderHistoryData.action = "REQUEST-RETURN";
                            orderHistoryData.remark = remark;
                            db.metaNewOrderHistory(connect, customerDB, orderHistoryData, function (err, success) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(err, success);
                                }
                            })
                        },
                        // step4 更新退货displayReturnId
                        function(done) {
                            var today = new Date();
                            var yyyymmdd = moment(today).format('YYYYMMDD');
                            var displayReturnId = idGen.getDisplayId(newReturnId, yyyymmdd, __idPrefix.return);

                            db.metaBatchSetDisplayReturnId(connect, customerDB, {returnId: newReturnId, displayReturnId: displayReturnId}, function(err, result){
                                if (err) {
                                    logger.error(err);
                                    done(err);
                                } else {
                                    logger.trace("Set return order id: " + displayReturnId + " successful.");
                                    displayId = displayReturnId;
                                    done();
                                }
                            });
                        },
                        // step5 退货的时候肯定有收货 更新离线任务Task里面的条目
                        function(done){
                            if(isShipped){
                                //删除掉Task里面的这条数据
                                var taskId=null;
                                async.series([
                                        //查询存到Task的单据
                                        function(innerDone){
                                            db.listCertainTypeTask(__cloudDBName,'SHIP_RECEIVE',function(err,results){
                                                if(err){
                                                    logger.error(err);
                                                    innerDone(err);
                                                }else{
                                                    if(results.length==0){
                                                        return innerDone();
                                                    }
                                                    logger.fatal(JSON.stringify(results));
                                                    var taskObj=underscore.find(results,function(item){
                                                        var taskParam=null;
                                                        try{
                                                            taskParam=JSON.parse(item.taskParam);
                                                        }catch(err){
                                                            logger.error(err);
                                                            innerDone(err);
                                                        }
                                                        return taskParam.shipId==shipId;
                                                    });
                                                    taskId=taskObj&&taskObj.taskId;
                                                    innerDone(err,taskId);
                                                }
                                            })
                                        },
                                        //将该Task记录 状态 更新为 DELETED
                                        function(innerDone){
                                            if(underscore.isNull(taskId)){
                                                return innerDone();
                                            }
                                            db.editTask(__cloudDBName,taskId,{taskStatus:'DELETED'},function(err,result){
                                                if(err){
                                                    logger.error(err);
                                                    innerDone(err);
                                                }else{
                                                    innerDone(err,result);
                                                }
                                            });
                                        }

                                    ],
                                    function(err,result){
                                        if(err){
                                            done(err);
                                        }else{
                                            done(err,result);
                                        }
                                    });
                            }
                            else{
                                done()
                            }
                        }
                    ],
                    function (errs) {
                        if (errs) {
                            logger.debug('Rollback the transaction' + JSON.stringify(errs));
                            db.rollbackTrans(connect, function () {
                                callback(errs);
                            })
                        }
                        else {
                            logger.debug('commit the transaction');
                            db.commitTrans(connect, function () {
                                //final callback result:returnId
                                callback(null, {
                                    newReturnId: newReturnId,
                                    displayReturnId: displayId
                                });
                            });
                        }

                    });
            });
        },


        /*客户退货发货*/
        clientReturnGoodsShip: function (customerDB, returnData, callback) {
            var returnId = returnData.returnId;
            db.beginTrans(function (connect) {
                async.series([
                        //step1 更新主表 ReturnInfo
                        function updateReturnInfo(done) {
                            var updateReturnInfoObj = {
                                status: 'SHIPPED',
                                shipDate: returnData.logisticsDate,
                                logisticsNo: returnData.logisticsCompany + "&" + returnData.logisticsNo,
                                returnShipRemark: returnData.remark
                            };
                            logger.debug("updateReturnInfoObj =" + JSON.stringify(updateReturnInfoObj));
                            db.metaUpdateReturnStatus(connect, customerDB, returnId, updateReturnInfoObj, function (err, result) {
                                if (err) {
                                    done(err);
                                }
                                else {
                                    logger.dump('主表 ReturnInfo 更新成功');
                                    done(err, result);
                                }
                            });

                        },
                        //step2 更新RetrunInfo_Goods_Map
                        function updateReturnInfoGoodsMap(done) {
                            var returnInfoGoodsMapBatchData = [];
                            for (var i = 0; i < returnData.goodsArr.length; i++) {
                                var currentItem = returnData.goodsArr[i];
                                var obj = [];
                                obj.push(returnId, currentItem.goodsId, currentItem.price, currentItem.allowQuantity, currentItem.returnQuantity, null);
                                returnInfoGoodsMapBatchData.push(obj);
                            }

                            logger.debug("returnInfoGoodsMapBatchData =" + JSON.stringify(returnInfoGoodsMapBatchData));
                            /*   ReturnInfo_Goods_Map(returnId,goodsId,approvedQuantity,returnShippedQuantity,receiveShippedQuantity)" */
                            db.metaInsertBatchRGMquantity(connect, customerDB, returnInfoGoodsMapBatchData, function (err, result) {
                                if (err) {
                                    done(err);
                                } else {
                                    logger.dump('更新ReturnInfo_Goods_Map附表成功');
                                    done(err, result);
                                }


                            });
                        },
                        //step3 更新ReturnDetails
                        function (done) {
                            var updateReturnDetails = [];
                            underscore.each(returnData.goodsArr, function (shipItem) {
                                underscore.each(shipItem.batchDatas, function (batchData) {
                                    batchData.unshift(returnId);
                                    //returnId,goodsId,batchNum,approvedQuantity,returnQuantity,goodsProduceDate,goodsValidDate,drugESC,inspectReportURL
                                    /* [ '5',
                                     '771',
                                     '42',
                                     '2',
                                     '3',
                                     '2016-03-25 00:00:00',
                                     '2016-03-26 00:00:00',
                                     '22222222',
                                     '/static/upload/0.22167837503366172.jpg' ]
                                     */


                                    //(returnId,goodsId,batchNum,returnQuantity,goodsProduceDate,goodsValidDate,drugESC,inspectReportURL)
                                    //["16","771","bat1","batchQty","OriginbatchQty","2016-03-08 00:00:00","2016-03-31 00:00:00","2121","/static/upload/0.6091752185020596.jpg"]
                                    updateReturnDetails.push(batchData);

                                })
                            });
                            logger.debug("updateReturnDetails =" + JSON.stringify(updateReturnDetails));
                            db.metaBatchInsertReturnDetails(connect, customerDB, updateReturnDetails, function (err, result) {
                                if (err) {
                                    logger.dump('更新失败了');
                                    done(err);
                                }
                                else {
                                    logger.dump('更新ReturnDetails 成功');
                                    done(err, result);
                                }
                            })
                        }
                    ],
                    function (err, resultList) {
                        if (err) {
                            logger.debug("rollback the transaction");
                            db.rollbackTrans(connect, function () {
                                callback(err);
                            })
                        } else {
                            logger.debug('commit the transaction');
                            db.commitTrans(connect, function () {
                                callback(null, returnId);
                            });
                        }
                    }
                );


            });
        },


        /**退货修改，客户退货发货  2016 -03-18*/
        ClientReturnItemShip: function (customerDB, returnData, callback) {
            //returnId,returnShipRemark,logisticsCompany,logisticsNo,goodsArr
            var returnId = returnData.returnId;
            var updateReturnInfoObj = {
                status: 'SHIPPED',
                shipDate: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                logisticsNo: returnData.logisticsCompany + returnData.logisticsNo,
                returnShipRemark: returnData.returnShipRemark
            }


            var RGMBatchData = [], goodsArr = returnData.goodsArr;
            underscore.each(goodsArr, function (item) {
                var tempArr = [];
                tempArr.push(returnId, item.goodsId, item.approvedQuantity, item.returnShippedQuantity, null);
                RGMBatchData.push(tempArr);
            });

            var ReturnDetailsData = [];
            //(returnId,goodsId,batchNum,approvedQuantity)
            underscore.each(goodsArr, function (item) {
                var goodsId = item.goodsId;
                var tempArr = [];
                underscore.each(item.batchDatas, function (batchItem) {
                    tempArr.push(returnId, goodsId, batchItem[0], batchItem[1]);
                    ReturnDetailsData.push(tempArr);
                });
            });
            db.beginTrans(function (connect) {
                async.series([
                        //step1 update ReturnInfo
                        function (done) {
                            //用的旧的 service 方法
                            db.metaUpdateReturnStatusWithConfirmDate(connect, customerDB, returnId, updateReturnInfoObj, function (err, result) {
                                if (err) {
                                    done(err);
                                } else {

                                    done(null, result);
                                }
                            });
                        },
                        //step2 update ReturnInfo_Goods_Map
                        function (done) {
                            db.metaInsertBatchRGMquantity(connect, customerDB, RGMBatchData, function (err, result) {
                                if (err) {
                                    done(err);
                                }
                                else {
                                    done(null, result);
                                }
                            });
                        },
                        //step3 update ReturnInfoDetails
                        function (done) {
                            db.metaUpdateReturnDetailsShip(connect, customerDB, ReturnDetailsData, function (err, result) {
                                if (err) {
                                    done(err);
                                }
                                else {
                                    done(null, result);
                                }
                            });
                        }
                    ],
                    function (err, resultList) {
                        if (err && typeof(err) === "object") {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function () {
                                callback(err);
                            });
                        } else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                callback(null, returnId);
                            });
                        }
                    });
            });

        },

        /*
         * status check functions
         */
        //检查提交数据是否符合当前退货总数限制
        returnOverLimit: function (customerDB, returnInfo, callback) {
            logger.enter();
            var orderId = returnInfo.orderId;
            var shipId = returnInfo.shipId;
            var returnData = returnInfo.returnData;
            db.getOrderShipInfo(customerDB, orderId, shipId, function (err, orderShipInfo) {
                db.getOrderReturnInfo(customerDB, orderId, shipId, function (err, orderReturnInfo) {
                    for (var i in returnData) {
                        for (var j in orderShipInfo) {
                            for (var k in orderReturnInfo) {
                                if (Number(orderShipInfo[j].shipId) == Number(orderReturnInfo[k].shipId)
                                    && Number(orderShipInfo[j].goodsId) == Number(orderReturnInfo[k].goodsId)
                                    && Number(returnData[i].goodsId) == Number(orderReturnInfo[k].goodsId)) {
                                    if (Number(orderReturnInfo[k].quantity) + Number(returnData[i].quantity) > Number(orderShipInfo[j].quantity)) {
                                        callback(false);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                    callback(true);
                })
            })

        },
        //检查提交数据是否符合当前订单状态，避免重复提交状态变更
        orderStatusCheck: function (customerDB, orderId, conditions, callback) {
            logger.enter();
            db.getOrderInfo(customerDB, orderId, function (order) {
                logger.debug(conditions);
                logger.debug(order.status);
                logger.debug(conditions.indexOf(order.status));
                if (conditions.indexOf(order.status) > -1) {
                    callback(true);
                } else {
                    callback(false);
                }
            })
        },
        //检查提交数据是否符合当前发货单状态，避免重复提交状态变更
        shipStatusCheck: function (customerDB, shipId, callback) {
            logger.enter();
            db.getShipDetails(customerDB, shipId, function (err, shipDatas) {
                if (shipDatas[0].isReceived == 0) {
                    callback(true);
                } else {
                    callback(false);
                }
            })
        },
        //检查提交数据是否符合当前退货单状态，避免重复提交状态变更
        returnStatusCheck: function (customerDB, returnId, conditions, callback) {
            logger.enter();
            db.getReturnDetailsById(customerDB, returnId, function (err, returnDatas) {
                if (conditions.indexOf(returnDatas[0].status) > -1) {
                    callback(true);
                } else {
                    callback(false);
                }
            })
        },


        //检查提订单数据提交的有效性
        validateOrder: function (customerDBName,orderData,operatorId,clientId,callback) {
            logger.enter();
            var goodsID = [];
            db.getOperatorById(customerDBName,operatorId,function(err,operator) {
                if(err){
                    callback("DBFAILURE");
                }else{
                    underscore.map(orderData.items,function(item){
                       goodsID.push(item.goodsId);
                    });
                    if(operator.readOnly == 0){
                        //查询GoodGSP信息
                        db.findGoodsGSP(customerDBName,goodsID,function(err2,findGoodsGsp){
                            //获取ClientGSP控制范围
                            db.findClientGspType(customerDBName, clientId, function (err3, ClientGspType) {
                                if(err2||err3){
                                    callback("DBFAILURE");
                                    return;
                                }
                                //开关与GSP控制范围为空不检测
                                if(__gspScopeCheck == true && ClientGspType.length !== 0) {
                                    if(findGoodsGsp.length == 0 ||findGoodsGsp.length !== goodsID.length){
                                        callback("INVALIDACTION");
                                        return;
                                    }
                                    var gsp = [];
                                    var isGspArea = false;
                                    underscore.map(ClientGspType,function(item){
                                        gsp.push(item.goodsGspTypeId);
                                    });

                                    underscore.map(findGoodsGsp,function(item){
                                        var cartbuy = underscore.some(gsp, function (gspid) {
                                            return gspid == item.id;
                                        });
                                        if (!cartbuy) {
                                            isGspArea = true;
                                        }
                                    });
                                    if(isGspArea){
                                        callback("INVALIDACTION");
                                        return
                                    }
                                    callback();
                                }else{
                                    callback();
                                }
                            });
                        });
                    }else{
                        callback("AUTHFAILURE");
                    }
                }

            });
        },
        /*
         * transctions to DB API
         */
        //关闭订单
        /**
         * 关闭订单
         * @param customerDB
         * @param orderId
         * @param operatorData
         * @param callback
         */
        transCloseOrder: function (customerDB, orderId, operatorData, callback) {
            var status = "CLOSED";
            var clientId = undefined;
            var orderTotal = undefined;
            var status = undefined;
            var paymentType = undefined,
                isClosed    =false;
            db.beginTrans(function (connect) {
                async.series([
                        //step1 update order Status
                        function CloseOrder(done) {
                    /*        db.metaUpdateStatus(connect, customerDB, orderId, status, "", function (err, result) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(err, result);
                                }
                            });*/
                            db.metaCloseOrder(connect,customerDB,orderId,operatorData.operatorId,function(err,result){
                                if(err){
                                    done(err);
                                }else{
                                    isClosed=true;
                                    done(err,result);
                                }
                            });
                        },
                        //step2 return inventory back
                        function returnInventory(done) {
                            db.listPendingOrders(customerDB, orderId, function (err, orders) {
                                logger.debug(JSON.stringify(orders));
                                var updateArr = [];
                                orderTotal = orders[0].total;
                                clientId = orders[0].clientId;
                                status = orders[0].status;
                                paymentType = orders[0].paymentType;
                                //[{"id":9,"clientId":2,"status":"CREATED","paymentStatus":"UNPAID","total":12.8,"consigneeName":null,"consigneeAddress":"bvszvafaf","consigneeMobileNum":null,"remark":"","hasReceipt":0,"receiptTitle":"buyer","orderTime":"2016-03-26 14:34:06",
                                // "soldPrice":12.8,"quantity":1,"amount":12.8,"goodsRemark":"","goodsInventory":704,"lockedAmount":0,"actualAmount":704,"negSell":1,"goodsNo":"1160401054","measureUnit":"盒","goodsId":771}]
                                underscore.map(orders,function(orderItem){
                                    if(orderItem.paymentStatus == "PAID"){
                                        var tempArr = [orderItem.goodsId,orderItem.quantity] ;
                                        updateArr.push(tempArr);
                                    }
                                });
                                if(underscore.isEmpty(updateArr)){
                                    //没有需要更新的库存信息
                                    logger.debug("ORDER IS UNPAID NOT RETURN INVENTORY ");
                                    done();
                                }else{
                                    async.mapSeries(updateArr,
                                        function(updateItem,mapCallback){
                                            var goodsId = updateItem[0];
                                            var quantity = updateItem[1];
                                            db.metaReturnInventory(connect,customerDB,goodsId,quantity,function(err,result){
                                                mapCallback(err,result);
                                            })
                                        },
                                        function(errs,results){
                                            done(errs,results);
                                        })

                                }
                            })
                        },
                        // step3 restore clientFinance arrearsBalance
                        function(done) {
                            // 此处仅对 未审核 授信余额支付订单 的取消做授信欠款余额的还原操作
                            if( ('CREATED'==status||'APPROVED'==status) && 'CREDIT'==paymentType) {
                                // 还原取消订单前的授信欠款余额
                                db.updateClientFinanceBalance(connect, customerDB, clientId, orderTotal, false, function(err, results){
                                    if (err) {
                                        done(err);
                                    } else {
                                        done(err, results);
                                    }
                                });
                            }
                            else{
                                done();
                            }
                        },

                        //step4 add order History
                        function newOrderHistory(done) {
                            var orderHistoryData = {};
                            orderHistoryData.clientId = underscore.isEmpty(operatorData.clientId) ? -1 : operatorData.clientId;
                            orderHistoryData.operatorId = operatorData.operatorId;
                            orderHistoryData.orderId = orderId;
                            orderHistoryData.action = "ClOSE";
                            db.metaNewOrderHistory(connect, customerDB, orderHistoryData, function (err, success) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(err, success);
                                }
                            })
                        }
                        ,
                        //step 5 关闭订单之后,离线任务也需要更新状态
                        function updateOfflineTask(done){
                            updateAutoCloseOrderTask(isClosed,orderId,function(err,results){
                                done(null,results);//更新离线任务的状态不应该影响其他流程
                            });
                        }
                    ],
                    function (err, resultList) {
                        if (err) {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function (err) {
                                callback(err)
                            });
                        }
                        else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                callback(null, resultList);
                            });
                        }
                    })

            });
        },

        refundOrder : function (customerDB, orderId, callback) {
            logger.enter();
            var checkStatus = '';
            var paymentType = '';
            async.series([
                    // step1. 根据支付类型进行退款处理
                    function(done) {
                        db.getOrderPaymentTypeById(customerDB, orderId, function(err, results){
                            if(!err){
                                paymentType = results.paymentType;
                                if('ONLINE' == paymentType){
                                    done(null, results);
                                }else{
                                    done("paymentType is not online");
                                }
                            }
                            else{
                                logger.ndump('err', err);
                                done(err);
                            }
                        });
                    },
                    // step2. 退款状态检测
                    function(done) {
                        // 状态为已支付(PAID) 且 未审核(仅有CREATE、CLOSE) 方能退款；
                        refundOrderStatusCheck(customerDB, orderId, function(err, results){
                            if(!err) {
                                checkStatus = results.status;
                                logger.debug(checkStatus);
                                done(err, results);
                            }
                            else{
                                logger.ndump('err', err);
                                done(err);
                            }
                        });
                    }],
                function(err, resultlist){
                    if(!err){
                        // 允许退款
                        if('REFUND' == checkStatus){
                            // 跳转页面
                            var cloudDB = __cloudDBName;
                            logger.debug("orderId="+orderId);
                            formRefundInfo(cloudDB,customerDB,orderId,function(err,refundData){
                                if(err) {
                                    logger.error(err+ "获取退款数据失败");
                                    callback(err+"获取退款数据失败")
                                }else{
                                    callback(null,"已保存退款数据")
                                }
                            })
                        }else{
                            callback("退款失败"+checkStatus);
                        }
                    }else{
                        if(err) {
                            logger.error(err+ "获取退款数据失败");
                            callback(err+"获取退款数据失败")
                        }
                    }
                });
        },



        /**
         * 获取订单支付类型
         * @param customerDB
         * @param orderId
         * @param callback
         */
        getOrderPaymentType: function (customerDB, orderId, callback) {
            logger.enter();
            db.getOrderPaymentTypeById(customerDB, orderId, function (err, results) {
                if (err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    callback(err, results);
                }
            });
        },

        //更新购物车
        /**
         *
         * @param customerDB
         * @param clientId
         * @param operatorId
         * @param cartItems
         * @param callback
         */
        transUpdateCart: function (customerDB, clientId, operatorId, cartItems, callback) {
            db.beginTrans(function (connect) {
                // var value for next step
                var goodsIds = underscore(cartItems).map(function (item) {
                    return item.goodsId;
                });
                cartItems.clientId = clientId;
                logger.debug(JSON.stringify(goodsIds));


                //start async
                async.series([
                        //step1 :delete old data in cart by client & goodsIds
                        function delGoodsFromCart(done) {
                            db.metaDeleteCartByGoodsIds(connect, customerDB, clientId, goodsIds, function (err, affectedRows) {
                                if (err) {
                                    done(err)
                                } else {
                                    var deleteCartAffectedRows = affectedRows;
                                    done(err, deleteCartAffectedRows)
                                }
                            });
                        },
                        //step2   insert new data to Cart
                        function insertNewGoodsToCart(done) {
                            db.metaBatchInsertToCart(connect, customerDB, cartItems, function (err, result) {
                                if (err) {
                                    done(err)
                                } else {
                                    done(err, result);
                                }
                            });
                        }
                    ],
                    //if no err,resultList = [deleteCartAffectedRows,result]
                    function (err, resultList) {
                        if (err && typeof(err) === "object") {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function (transErr) {
                                callback(err);
                            });
                        } else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                //final callback result:
                                callback(null, resultList);
                            });
                        }
                    }
                );

            });
        },


        //更新发货单收货状态
        /**
         *
         * @param customerDBName
         * @param receivedData
         * @param operatorData
         * @param callback
         */
        updateShipReceived: function (customerDBName, operatorData, receivedData, callback) {
            logger.enter();
            var orderId = undefined;
            var shipId = receivedData.shipId;
            var rejectId = undefined;
            /* 拒收数据 */
            var rejectItems = [];
            db.getShipDetails(customerDBName, shipId, function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    orderId = results[0].orderId;
                    var remark = receivedData.remark;
                    /* 实际收货数据 */
                    var updateData = receivedData.orData;
                    var reData = receivedData.reData;
                    var status = receivedData.status;
                    if (status == "REJECT-REQUEST"&&typeof(reData)!='undefined') {
                        reData.forEach(function (item) {
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
                    db.beginTrans(function (connect) {
                        // var value for next step
                        //start async
                        var updateStatus = {
                            isReceived: "1",
                            status: status,
                            receivedDate: (new Date()).toLocaleString()
                        },
                            isShipped=false;
                        async.series([
                                //step1 :update Ship Status in ShipInfo
                                function updateShipStatus(done) {
                                    db.metaUpdateShipInfo(connect, customerDBName, shipId, updateStatus, function (err, affectedRows) {
                                        if (err) {
                                            done(err);
                                        } else {
                                            isShipped=true;
                                            done(err, affectedRows);
                                        }
                                    });
                                },
                                //step1.1 :update TaskInfo
                                function updateOffLineTask(done){
                                    if(isShipped){
                                        //删除掉Task里面的这条数据
                                        var taskId=null;
                                        async.series([
                                                //查询存到Task的单据
                                                function(innerDone){
                                                    db.listCertainTypeTask(__cloudDBName,'SHIP_RECEIVE',function(err,results){
                                                        if(err){
                                                            logger.error(err);
                                                            innerDone(err);
                                                        }else{
                                                            if(results.length==0){
                                                                return innerDone();
                                                            }
                                                            var taskObj=underscore.find(results,function(item){
                                                                var taskParam=null;
                                                                try{
                                                                    taskParam=JSON.parse(item.taskParam);
                                                                }catch(err){
                                                                    logger.error(err);
                                                                    innerDone(err);
                                                                }
                                                                return taskParam.shipId==shipId;
                                                            });
                                                            taskId=taskObj.taskId;
                                                            logger.dump('taskId:------>'+ taskId);
                                                            innerDone(err,taskId);
                                                        }
                                                    })
                                                },
                                                //将该Task记录 状态 更新为 DELETED
                                                function(innerDone){
                                                    if(underscore.isNull(taskId)){
                                                        return innerDone();
                                                    }
                                                    db.editTask(__cloudDBName,taskId,{taskStatus:'DELETED'},function(err,result){
                                                        if(err){
                                                            logger.error(err);
                                                            innerDone(err);
                                                        }else{
                                                            innerDone(err,result);
                                                        }
                                                    });
                                                }

                                            ],
                                            function(err,result){
                                                if(err){
                                                    done(err);
                                                }else{
                                                    done(err,result);
                                                }

                                            });
                                    }
                                    else{
                                        done()
                                    }
                                },
                                //step2   update shipDetails
                                function updateShipDetails(done) {
                                    //INSERT INTO %s.ShipDetails (shipId,goodsId,batchNum,receivedQuantity,receivedDrugESC,receivedRemark)
                                    db.metaUpdateReceivedShipDetails(connect, customerDBName, updateData, function (err, results) {
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
                                    db.metaUpdateStatus(connect, customerDBName, orderId, orderStatus, "", function (err, results) {
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

                                    if (((status == "REJECT-REQUEST")&&receivedData.isReject)=='true') {
                                        var insertdata = underscore.first(rejectItems[0], 4);
                                        db.metaNewRejectInfo(connect, customerDBName, insertdata, function (err, newRejectId) {
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
                                    if (((status == "REJECT-REQUEST")&&receivedData.isReject)=='true') {

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
                                    db.metaNewOrderHistory(connect, customerDBName, orderHistoryData, function (err, success) {
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
                                    db.rollbackTrans(connect, function (transErr) {
                                        callback(err);
                                    });
                                } else {
                                    logger.debug("Commit the transaction");
                                    db.commitTrans(connect, function () {
                                        //final callback result:shipId
                                        callback(null, shipId);
                                    });
                                }
                            }
                        );
                    });
                }
            });
        },


        /**
         * 通知ERP订单已收货
         * @param session
         * @param shipId
         * @param callback
         */
        notifyERPShipReceived :function(session,shipId,callback){
            logger.enter();
            var customerDB = session.customer.customerDB;
            var shipInfo = undefined;
            var shipDetails = undefined;
            var ERPshipInfo = undefined;
            var ERPshipDetails = undefined;
            var shipId = Number(shipId);
            async.series([
                function(cb){
                    db.getShipInfoById(customerDB,shipId,function(err,result) {
                        if(!err && result.length >0){
                            shipInfo = result[0];
                            cb();
                        }else{
                            cb(null,"发货单信息缺少对应Id的信息="+shipId);
                        }
                    });
                },
                function(cb){
                    db.getShipDetailsById(customerDB,shipId,function(err,result){
                        if(!err && result.length >0){
                            shipDetails = result;
                            cb();
                        }else{
                            cb(null,"发货单详情信息缺少对应Id的信息="+shipId);
                        }
                    });
                },
                function(cb){
                    //整理ERP需要的数据格式:
                    logger.debug(JSON.stringify(shipInfo));
                    logger.debug(JSON.stringify(shipDetails));
                    ERPshipDetails = [];
                    underscore.map(shipDetails,function(item){
                        ERPshipInfo = {
                            Lsh : shipInfo.id+shipDetails.id,//流水号 唯一生成的发货记录ID
                            dh : item.shipDetailsId,//明细单号 shipDetailsId
                            kdrq : shipInfo.receivedDate,//发货日期
                            Suppliercode : "",//供货方ERPcode
                            hh : "",//商品货号
                            sj : "",//税价
                            sl : item.receivedQuantity,//数量
                            Ph1 : item.batchNo,//批号
                            pcdh : item.batchNum,//批次号
                            Ph1_xq : item.goodsValidDate,//效期
                            scrq : item. goodsProduceDate,//生产日期
                            bz : item.receivedRemark,//备注
                            Sbz1 : item.inspectReportURL//检验报告单
                        };
                    });
                    ERPshipDetails.push(ERPshipInfo);
                    async.mapSeries(ERPshipDetails,
                          function(details,mapcallback){
                              var shipDetailsId = details.dh;
                              db.getComplimentForERPshipInfo(customerDB,shipDetailsId,function(err,results){
                                  if(!err&&results.length!=0){
                                      details.Suppliercode = results[0].Suppliercode;
                                      details.hh = results[0].hh;
                                      details.sj = results[0].sj;
                                  }
                                  mapcallback();
                              });
                          },
                        function(errs,results) {
                            cb();
                        }
                    );

                },
                function(cb){
                    var msgdata={
                        T_HeadMove:ERPshipDetails
                    };
                    var data = {};
                    data.msgData = msgdata;
                    //订单创建数据同步到销售方ERP,当前所在销售方的customer
                    data.customerId = session.customer.customerId;
                    data.msgType= "B2B_ORDER_SHIP_RECEIVE_TO_SELLER";
                    apiModule[data.msgType](data,function(err,results){
                        if(err){
                            logger.debug("ORDER_SHIP_RECEIVE_TO_SELLER FAIL! ");
                            logger.error(err);
                        }
                        logger.debug(JSON.stringify(results));
                    });
                    //订单创建数据同步到采购方ERP,采购方做收货确认,所以操作员是采购方操作员 ,SM MODE下无此操作
                    if(__sccMode == "SM"){
                        logger.debug("NOW IN SM MODE ORDER_SHIP RECEIVE NOT SEND TO BUYER")
                    }else{
                        data.customerId = session.operator.customerId;
                        data.msgType= "B2B_ORDER_SHIP_RECEIVE_TO_BUYER";
                        apiModule[data.msgType](data,function(err,results){
                            if(err){
                                logger.debug("ORDER_SHIP_RECEIVE_TO_BUYER FAIL! ");
                                logger.error(err);
                            }
                            logger.debug(JSON.stringify(results));
                        });
                    }

                    cb(null,"SEND TO  SELLER ERP");
                }

            ],function(errs,results){
                if(errs){logger.error(errs);}
                callback(null,"SHIP RECEIVE "+JSON.stringify(results));
            });
        },

        /**
         * BUYER登录scc取消订单通知到ERP
         * @param session
         * @param orderId
         * @param callback
         */
        notifyERPOrderClosed :function(session,orderId,callback){
            logger.enter();
            var msgdata= {"XSDDHead":[{
                "GUID": orderId,
                "BillNO": orderId,
                "IsAuditing": "0",
                "IsClose": "1"}]
            };
            var data = {};
            data.msgData = msgdata;
            //订单关闭数据同步到销售方ERP,当前所在销售方的customer
            data.customerId = session.customer.customerId;
            data.msgType= "B2B_ORDER_CLOSE_TO_SELLER";
            apiModule[data.msgType](data,function(err,results){
                if(err){logger.error(err);}
                logger.debug(JSON.stringify(results));
            });
            if(__sccMode == "SM") {
                logger.debug("CURRENT IN SM MODE ORDER CLOSE NOT SEND TO BUYER")
            }else{
                //订单关闭数据同步到采购方ERP,
                data.customerId = session.operator.customerId;
                data.msgType= "B2B_ORDER_CLOSE_TO_BUYER";
                apiModule[data.msgType](data,function(err,results){
                    if(err){logger.error(err);}
                    logger.debug(JSON.stringify(results));
                });
            }
            callback(null,"ORDER CLOSED TO ERP");
        },


        //退货发货
        notifyERPReturnShipped  :function(session,returnId,callback){
            logger.enter();
            //组织退货单发货数据
            var customerDB = session.customer.customerDB;

            var allReturnInfo = undefined;
            var allReturnDetails = undefined;
            var returnInfo = {};
            var returnDetails = [];
            var erpCode = undefined;
            async.series([
                function(cb){
                    db.getReturnInfoByReturnId(customerDB,returnId,function(err,results){
                        if(!err){
                            allReturnInfo = results[0];
                        }
                        cb(err,results);
                    })
                },
                function(cb){
                    db.getReturnDetailsByReturnId(customerDB,returnId,function(err,results){
                            if(!err){
                                allReturnDetails = results;
                            }
                            cb(err,results);
                    });
                },

                function(cb){
                    db.getErpCodeByOperatorId(customerDB,allReturnInfo.operatorId,function(err,result){
                        if(!err && result.length >0){
                            erpCode = result[0].erpCode;
                        }
                        cb();
                    })
                },
                function(cb){
                       returnInfo = {
                           returnId: returnId,//退货单号
                           clientErpCode: erpCode,//退货客户对应的ERPCODE
                           shipId : allReturnInfo.shipId,//SCC 发货单号,如等于0,表示没有对应的发货单
                           orderId: allReturnInfo.shipId,//SCC 订单号,如等于0,表示没有对应的订单
                           shipDate: allReturnInfo.shipDate, // 发货日期
                           logisticsNo: allReturnInfo.logisticsNo, //发货地址
                           remark : allReturnInfo.returnShipRemark // 发货备注
                       };
                       underscore.map(allReturnDetails,function(item){
                           var returnObj = {
                               returnId :   item.returnId,//SCC退货单号
                               orderId  :   item.orderId,//SCC订单号
                               goodsId  :   item.goodsId,//SCC商品编号
                               quantity :   item.returnQuantity,//SCC录入退货数量
                               price    :   item.returnPrice,//SCC录退货价格
                               drugESC  :   item.drugESC,//SCC录入的电子监管吗
                               batchNo  :   item.batchNo,//SCC录入批号
                               batchNum :   item.batchNum,//SCC录入批次好
                               goodsLicenseNo : item.goodsLicenseNo,//商品的批准文号
                               inspectReportURL : item.inspectReportURL,//批次检验报告
                               goodsProduceDate :   item.goodsProduceDate,//生产日期
                               goodsValidDate   :   item.goodsValidDate//有效期
                            };
                           returnDetails.push(returnObj);
                       });
                       cb();
                }
            ],
            function(errs,results){
                if(errs){logger.error(errs);
                }else{
                    var msgData = {
                        ReturnInfo : returnInfo,
                        ReturnDetails: returnDetails
                    };
                    logger.debug(JSON.stringify(msgData));
                    //发送给销售方ERP
                    var data = {};
                    data.msgData = msgData;
                    //订单关闭数据同步到销售方ERP,当前所在销售方的customer
                    data.customerId = session.customer.customerId;
                    data.msgType= "B2B_ORDER_RETURN_SHIP_TO_SELLER";
                    apiModule[data.msgType](data, function(err, results){
                        if(err){logger.error(err);}
                        logger.debug(JSON.stringify(results));
                    });
                    callback();
                }
            });
        },

        //新增退货单
        /**
         *
         * @param customerDBName
         * @param returnInfo
         * @param operatorData
         * @param callback
         */
        addReturnInfo: function (customerDBName, returnInfo, operatorData, callback) {
            logger.enter();
            db.beginTrans(function (connect) {
                // var value for next step
                var returnId = undefined;
                returnInfo.operatorId = operatorData.operatorId;
                returnInfo.action = "REQUEST-RETURN";
                //start async
                async.series([
                        //step1 insert data to ReturnInfo.sql;
                        function insertReturnInfo(done) {
                            db.metaBatchInsertReturn(connect, customerDBName, returnInfo, function (err, result) {
                                if (err) {
                                    done(err);
                                } else {
                                    returnId = result.insertId;
                                    returnInfo.returnId = returnId;
                                    done(err, returnId);
                                }
                            })
                        },
                        //step2 insert  details to ReturnDetails.sql
                        function insertReturnDetails(done) {
                            db.metaBatchInsertReturnDetails_old(connect, customerDBName, returnInfo, function (err, result) {
                                logger.debug((result));
                                if (err) {
                                    done(err);
                                } else {
                                    var lastReturnDetailsId = result.insertId;
                                    done(err, lastReturnDetailsId);
                                }
                            })
                        },
                        //step3 insert order history to OrderHistory.sql
                        function insertOrderHistory(done) {
                            var orderHistoryData = {};
                            orderHistoryData.clientId = operatorData.clientId;
                            orderHistoryData.operatorId = operatorData.operatorId;
                            orderHistoryData.orderId = returnInfo.orderId;
                            orderHistoryData.action = returnInfo.action;
                            orderHistoryData.shipId = returnInfo.shipId;
                            orderHistoryData.returnId = returnId;
                            orderHistoryData.remark = returnInfo.remarks;
                            db.metaNewOrderHistory(connect, customerDBName, orderHistoryData, function (err, success) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(err, success);
                                }
                            });
                        }
                    ],
                    //if no err,resultList = [returnId,lastReturnDetailsId,success]
                    function (err, resultList) {
                        if (err && typeof(err) === "object") {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function (transErr) {
                                callback(err);
                            });
                        }
                        else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                //final callback result:returnId
                                callback(null, returnId);
                            });
                        }
                    }
                )
            })
        },

        //申请退货通知
        returnApplyNotify: function (session,returnId,callback) {
            logger.enter();
            var customerDB = session.customer.customerDB;
            var returnInfo = undefined;
            var returnDetails = undefined;
            var returnGoodsMap = undefined;
            var ERPreturnDetails = undefined;
            var ERPreturnInfo = undefined;
            var CustomerCode = undefined;
            async.series([
                function(cb){
                    db.listReturnInfoById(customerDB,returnId,function(err,result) {
                        if(!err && result.length >0){
                            returnInfo = result[0];
                            cb();
                        }else{
                            cb(null,"退货单信息缺少对应Id的信息="+returnId);
                        }
                    });
                },
                function(cb){
                    db.listReturnDetailsById(customerDB,returnId,function(err,result){
                        if(!err && result.length >0){
                            returnDetails = result;
                            cb();
                        }else{
                            cb(null,"退货单详情信息缺少对应Id的信息="+returnId);
                        }
                    });
                },
                function(cb){
                    db.listReturnGoodsMapById(customerDB,returnId,function(err,result){
                        if(!err && result.length >0){
                            returnGoodsMap = result;
                            cb();
                        }else{
                            cb(null,"退货单goodsmap缺少对应Id的信息="+returnId);
                        }
                    });
                },
                function(cb){
                    var buyerId = session.operator.customerId;
                    db.getClientBuyerInfo(customerDB,buyerId,function(err,result){
                        if(!err && result.length >0){
                            CustomerCode = result[0].erpCode;
                            cb();
                        }else{
                            cb(null,"退货单goodsmap缺少对应Id的信息="+returnId);
                        }
                    });
                },
                function(cb){
                    logger.debug(JSON.stringify(returnInfo));
                    logger.debug(JSON.stringify(returnDetails));
                    ERPreturnInfo = {
                        "Guid": creatGuid(returnInfo.id,returnInfo.displayReturnId),
                        "BillNO": returnInfo.displayReturnId,
                        "CustomerCode": CustomerCode,
                        "BillDate": (new Date(returnInfo.createdOn)).toLocaleString(),
                        "EmployeeCode": "",
                        "SellItem": "",
                        "SendAddressCode": "",
                        "Remark": returnInfo.remark
                    };
                    ERPreturnDetails = [];
                    underscore.map(returnDetails,function(details){
                        underscore.map(returnGoodsMap,function(goodsMap){
                           if(details.goodsId == goodsMap.goodsId){
                               var reObj={
                                   "Guid": creatGuid(details.id,details.returnId),
                                   "MainGuid": ERPreturnInfo.Guid,
                                   "Materielcode": goodsMap.goodsNo,
                                   "Quantity": details.quantity,
                                   "ReturnReason": details.remark,
                                   "AmountTax": goodsMap.price*details.quantity,
                                   "TaxUnitPrice": goodsMap.price,
                                   "BatchNumber": details.batchNum,
                                   "BatchNo": details.batchNo,
                                   "UseFulDate": "",
                                   "Remark": details.remark
                               };
                               ERPreturnDetails.push(reObj);
                           }
                        });

                    });
                    cb(null,"退货单数据准备完毕="+returnId);

                },
                function(cb){
                    var msgdata={
                        SALERETURNAPPROVE:ERPreturnInfo,
                        SALERETURNAPPROVEDETAIL:ERPreturnDetails
                    };
                    var data = {};
                    data.msgData = msgdata;
                    //订单创建数据同步到销售方ERP,当前所在销售方的customer
                    data.customerId = session.customer.customerId;
                    data.msgType= "B2B_ORDER_RETURN_CREATE_TO_SELLER";
                    apiModule[data.msgType](data,function(err,results){
                        if(err){
                            logger.debug("B2B_ORDER_RETURN_CREATE_TO_SELLER FAIL! ");
                            logger.error(err);
                        }
                        logger.debug(JSON.stringify(results));
                    });
                    //订单创建数据同步到采购方ERP,采购方做收货确认,所以操作员是采购方操作员 ,SM MODE下无此操作
                    if(__sccMode == "SM"){
                        logger.debug("NOW IN SM MODE ORDER_RETURN_CREATE NOT SEND TO BUYER")
                    }else{
                        data.customerId = session.operator.customerId;
                        data.msgType= "B2B_ORDER_RETURN_CREATE_TO_BUYER";
                        apiModule[data.msgType](data,function(err,results){
                            if(err){
                                logger.debug("B2B_ORDER_RETURN_CREATE_TO_BUYER! ");
                                logger.error(err);
                            }
                            logger.debug(JSON.stringify(results));
                        });
                    }

                    cb(null,"SEND TO  SELLER ERP");
                }

            ],function(errs,results){
                if(errs){logger.error(errs);}
                callback(null,"return created "+JSON.stringify(results));
            });




        },

        //关闭退货单
        closeReturnInfo: function (customerDB, returnId, status, operatorId, callback) {

            var closeReturnInfoData = [returnId, status, operatorId || null];
            db.metaCloseReturnInfo(customerDB, closeReturnInfoData, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        //更新退货单状态
        /**
         *
         * @param customerDB
         * @param returnData
         * @param operatorData
         * @param callback
         */
        transUpdateReturn: function (customerDB, returnData, operatorData, callback) {
            var returnId = returnData.returnId;
            var orderId = returnData.orderId;
            var remark = returnData.returnShipRemark;
            var updateDetails = returnData.returnShipItems;
            returnData.status = "SHIPPED";
            returnData.action = "SHIP-RETURN";
            db.beginTrans(function (connect) {
                async.series([
                        //step1 update returnInfo Status
                        function updateReturnInfoStatus(done) {
                            var updateData = {
                                status: returnData.status,
                                returnShipRemark: remark,
                                logisticsNo: returnData.logisticsNo,
                                returnLogisticsDate: returnData.logisticsDate
                            };
                            db.metaUpdateReturnStatus(connect, customerDB, returnId, updateData, function (err, affectedRows) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(err, affectedRows);
                                }
                            });
                        },
                        //step2 update returnDetails data
                        function updateReturnDetails(done) {

                            async.mapSeries(
                                updateDetails,
                                function (item, mapcallback) {
                                    logger.enter();
                                    var metaUpdateData = item.batchDatas;
                                    db.metaUpdateShippedReturnDetails(connect, customerDB, metaUpdateData, function (err, affectedRows) {
                                        if (err) {
                                            logger.error(err);
                                            mapcallback(err);
                                        } else {
                                            mapcallback(err, affectedRows);
                                        }
                                    });
                                },
                                function (err, results) {
                                    if (err) {
                                        logger.error(err);
                                        done(err);
                                    } else {
                                        logger.debug(JSON.stringify(results))
                                        done(null, results);
                                    }
                                }
                            )

                        },
                        //step3 add orderHistory
                        function UpdateOrderHistory(done) {
                            var orderHistoryData = {};
                            orderHistoryData.clientId = operatorData.clientId;
                            orderHistoryData.operatorId = operatorData.operatorId;
                            orderHistoryData.orderId = orderId;
                            orderHistoryData.returnId = returnId;
                            orderHistoryData.action = returnData.action;
                            orderHistoryData.remark = remark;
                            db.metaNewOrderHistory(connect, customerDB, orderHistoryData, function (err, success) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(err, success);
                                }
                            })

                        }

                    ],
                    //if no err,resultList = [affectedRows,success]
                    function (err, resultList) {
                        if (err && typeof(err) === "object") {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function (transErr) {
                                callback(err)
                            });
                        }
                        else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                //final callback result = affectedRows
                                callback(null, returnId);
                            });
                        }
                    })

            });
        },

        //退货发货通知
        returnSendNotify: function (customerDB, customerId, returnData, callback) {
            var userType = 'Customer';
            var userId = customerId;
            var msgType = 'ORDER_RETURN_SHIPPED';
            var msgData = {
                returnId: returnData.returnId,
                orderId: returnData.orderId,
                remark: returnData.returnShipRemark,
                updateDetails: returnData.returnShipItems
            };
            var apiRobot = new ApiRobot(customerDB, cloudDbName, db, __redisClient);
            apiRobot.sendMsg(userType, userId, msgType, msgData, function sendMsgCallback(error, result) {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });

        },

        //make Paginator start
        createOrderPaginator: function (req) {

            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'OrderInfo';

            var category = {};
            var keyword = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: orderFieldMapper.convertToField(req.query.cf) || "status",
                categoryValue: req.query.cv || "%",
                keywordField: orderFieldMapper.convertToField(req.query.kf) || "id",
                keywordValue: req.query.kv || "%",
                sortField: orderFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isEmpty(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                category.field = param.categoryField;
                category.value = param.categoryValue.trim();
                if (category.value == "PAID" || category.value == "UNPAID") {
                    category.value = "CREATED";
                }
                category.tableName = tableName;
                if (/(待收货)$/.test(param.categoryValue.trim())) {
                    category.value = 'SHIPPED';
                }
                if (/(已完成)$/.test(param.categoryValue.trim())) {
                    category.value = 'FINISHED';
                }
            }
            if (!underscore.isEmpty(param.keywordField) && !underscore.isNaN(param.keywordValue)) {
                keyword.field = param.keywordField;
                keyword.value = param.keywordValue;
                keyword.tableName = tableName;
                if(/(id)$/.test(param.keywordField)) {
                    keyword.field = "displayOrderId";
                    keyword.value = param.keywordValue.toUpperCase();
                }
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
            }
            if (typeof param.page == 'number') {
                p = param.page;
            }
            if (typeof param.pageSize == 'number') {
                ps = param.pageSize;
            }

            if (!underscore.isEmpty(category)) {
                categoryList.push(category);
            }
            if (!underscore.isEmpty(keyword)) {
                keywordList.push(keyword);
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

        restorePaginator: function (paginator) {
            var p = {};
            p.cf = orderFieldMapper.convertToAlias(paginator.categoryList[0].field);
            var cv = paginator.categoryList[0].value;
            if (/(SHIPPED)/.test(cv)) {
                p.cv = '待收货';
            } else if (/(FINISHED)/.test(cv)) {
                p.cv = '已完成';
            }
            p.cv = paginator.categoryList[0].value;
            if (paginator.keywordList[0]) {
                p.kf = orderFieldMapper.convertToAlias(paginator.keywordList[0].field);
                p.kv = paginator.keywordList[0].value;
            }
            p.sf = orderFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;

        },

        createReturnPaginator: function (req) {
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'ReturnInfo';
            var orderInfoTableName='OrderInfo';

            var category = {};
            var keyword = {};
            var orderIdKeyWord={};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: returnOrderFieldMapper.convertToField(req.query.cf) || "status",
                categoryValue: req.query.cv || "%",
                keywordField: returnOrderFieldMapper.convertToField(req.query.kf) || "id",
                keywordValue: req.query.kv || "%",
                sortField: returnOrderFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isEmpty(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                category.field = param.categoryField;
                category.value = param.categoryValue.trim();
                category.tableName = tableName;
            }
            if (!underscore.isEmpty(param.keywordValue)) {
                keyword.field = param.keywordField;
                keyword.value = param.keywordValue;
                keyword.tableName = tableName;

                orderIdKeyWord.field=param.keywordField;
                orderIdKeyWord.value = param.keywordValue;
                orderIdKeyWord.tableName=orderInfoTableName;

                if(/(id)$/.test(param.keywordField)) {
                    keyword.field = "displayReturnId";
                    keyword.value = param.keywordValue.toUpperCase();

                    orderIdKeyWord.field='displayOrderId';
                    orderIdKeyWord.value = param.keywordValue.toUpperCase();
                }
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
            }
            if (typeof param.page == 'number') {
                p = param.page;
            }
            if (typeof param.pageSize == 'number') {
                ps = param.pageSize;
            }

            if (!underscore.isEmpty(category)) {
                categoryList.push(category);
            }
            if (!underscore.isEmpty(keyword)) {
                keywordList.push(keyword);
            }
            if (!underscore.isEmpty(orderIdKeyWord)){
                keywordList.push(orderIdKeyWord);
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
            logger.debug(categoryList + keywordList + sort + page + pageSize);
            return new Paginator(categoryList, keywordList, sort, page, pageSize);
        },

        restoreReturnPaginator: function (paginator) {
            var p = {};
            p.cf = returnOrderFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cv = paginator.categoryList[0].value;
            p.kf = returnOrderFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = returnOrderFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },

        getShipInfoPaginator: function (req) {
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'ShipInfo';

            var category = {};
            var keyword = {};
            var keywordA = {};
            var keywordB = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: shipFieldMapper.convertToField(req.query.cf) || "isReceived",
                categoryValue: req.query.cv || "%",
                keywordField: shipFieldMapper.convertToField(req.query.kf) || "id",
                keywordValue: req.query.kv || "%",
                keywordAField: shipFieldMapper.convertToField(req.query.kaf) || "id",
                keywordAValue: req.query.kav || "%",
                keywordBField: shipFieldMapper.convertToField(req.query.kbf) || "id",
                keywordBValue: req.query.kbv || "%",
                sortField: shipFieldMapper.convertToField(req.query.sf) || "id",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isEmpty(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                category.field = param.categoryField;
                category.value = param.categoryValue.trim();
                category.tableName = tableName;
                if (/(status)$/.test(param.categoryField)) {
                    category.tableName = 'OrderInfo';
                }
            }
            if (!underscore.isEmpty(param.keywordAField) && !underscore.isEmpty(param.keywordAValue) || !underscore.isEmpty(param.keywordBValue)) {
                keywordA.field = param.keywordAField;
                keywordA.value = param.keywordAValue;
                keywordA.tableName = tableName;
                if (/(clientName)$/.test(param.keywordAField)) {
                    keywordA.tableName = 'Client';
                }
                if(/(id)$/.test(param.keywordAField)) {
                    keywordA.field = "displayShipId";
                    keywordA.value = param.keywordAValue.toUpperCase();
                }
            }
            if (!underscore.isEmpty(param.keywordBValue)) {
                keywordB.field = param.keywordBField;
                keywordB.value = param.keywordBValue;
                keywordB.tableName = tableName;
            }
            if (!underscore.isEmpty(param.keywordValue)) {
                keyword.field = param.keywordField;
                keyword.value = param.keywordValue;
                keyword.tableName = tableName;
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
                if (/(orderTime)$/.test(param.sortField)) {
                    s.tableName = 'OrderInfo';
                }
            }
            if (typeof param.page == 'number') {
                p = param.page;
            }
            if (typeof param.pageSize == 'number') {
                ps = param.pageSize;
            }

            if (!underscore.isEmpty(category)) {
                categoryList.push(category);
            }
            if (!underscore.isEmpty(keywordA)) {
                keywordList.push(keywordA);
            }
            if (!underscore.isEmpty(keywordB)) {
                keywordList.push(keywordB);
            }
            if (!underscore.isEmpty(keyword)) {
                keywordList.push(keyword);
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

        restoreShipPaginator: function (paginator) {
            var p = {};
            p.cf = shipFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cv = paginator.categoryList[0].value;
            p.kaf = shipFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kav = paginator.keywordList[0].value;
            p.kbf = shipFieldMapper.convertToAlias(paginator.keywordList[1].field);
            p.kbv = paginator.keywordList[1].value;
            p.kf = shipFieldMapper.convertToAlias(paginator.keywordList[2].field);
            p.kv = paginator.keywordList[2].value;
            p.sf = shipFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },

        createPurePaginator: function (req) {
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = Number(req.query.p) || 1;
            var pageSize = Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10;
            //pageSize=
            return new Paginator(categoryList, keywordList, sort, page, pageSize);
        },

        restorePurePaginator: function (paginator) {
            var p = {};
            p.caf = '';
            p.cav = '';
            p.cbf = '';
            p.cbv = '';
            p.kf = '';
            p.kv = '';
            p.sf = '';
            p.sv = '';
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },

        //商家拒收发货, 更新RejectInfo and RejectDetails
        rejectShipData: function (customerDB, operatorData, data, callback) {
            db.beginTrans(function (connect) {
                var rejectId = data.rejectId;
                var olderId = data.orderId;
                var remark = data.remark;//拒收发货备注
                var rejectImg = data.rejectImg; //拒收发货添加的附件地址
                async.series([
                        //step1 update returnInfoData
                        function updateRejectInfo(done) {
                            var updateData = {
                                status: 'SHIPPED',
                                logisticsNo: data.logisticsCompany + data.logisticsNo,
                                rejectShipRemark: remark,
                                rejectImg: rejectImg
                            };
                            db.metaUpdateRejectInfo(connect, customerDB, updateData, rejectId, function (err, affectedRows) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(err, affectedRows);
                                }
                            })
                        },
                        function updateRejectDetails(done) {
                            //构造更新 RejectDetails 的数据
                            var shipData = data.shipData;
                            /**
                             *  [ '5', '62', '玛卡批次一', '2', '3', '2' ]
                             [ '5', '62', '玛卡批次二', '2', '3', '1' ]
                             [ '5', '70', '蜂王浆批次一', '1', '5', '3' ]
                             [ '5', '70', '蜂王浆批次三', '1', '5', '2' ]

                             * */

                            //INSERT INTO %s.RejectDetails(rejectId,goodsId,batchNum,goodsNotSendRefundQuantity,rejectShippedQuantitySum,rejectQuantity)
                            var updateDatas = [];
                            for (var i = 0; i < shipData.length; i++) {
                                var currentObj = shipData[i];
                                var goodsId = currentObj.goodsId;
                                var rejectShippedQuantitySum = currentObj.rejectShippedQuantitySum;//该商品 拒收发货的总数量
                                var goodsNotSendRefundQuantity = currentObj.goodsNotSendRefundQuantity;//该商品 拒收要退款 但是未发货的 数量
                                underscore.each(currentObj.batchDatas, function (item) {
                                    var updateData = [];
                                    updateData.push(rejectId);
                                    updateData.push(goodsId);
                                    updateData.push(item[0]);//批次号
                                    updateData.push(goodsNotSendRefundQuantity);
                                    updateData.push(rejectShippedQuantitySum);
                                    updateData.push(item[1]);//当前批次号拒收实发数量
                                    updateData.push(item[2]);//当前批次号拒收电子监管码
                                    updateDatas.push(updateData);

                                });
                            }
                            db.metaUpdateRejectDetailsNew(connect, customerDB, updateDatas, rejectId, function (err, affectedRows) {
                                if (err) {
                                    done(err);
                                } else {
                                    done(err, affectedRows);
                                }
                            });
                        },
                        function newOrderHistory(done) {
                            var orderHistoryData = {};
                            orderHistoryData.clientId = underscore.isEmpty(operatorData.clientId) ? 0 : operatorData.clientId;
                            orderHistoryData.operatorId = operatorData.operatorId;
                            orderHistoryData.orderId = olderId;
                            orderHistoryData.action = "SHIP-REJECT";
                            orderHistoryData.rejectId = rejectId;
                            orderHistoryData.remark = remark;
                            db.metaNewOrderHistory(connect, customerDB, orderHistoryData, function (err, success) {
                                if (err) {
                                    done(err)
                                } else {
                                    done(err, success)
                                }

                            });

                        }

                    ], function (err, resultList) {
                        if (err && typeof(err) === 'object') {
                            logger.debug('Rollback the transaction');
                            db.rollbackTrans(connect, function (transErr) {
                                callback(err);
                            });
                        } else {
                            logger.debug('Commit the transaction');
                            db.commitTrans(connect, function () {

                                callback(null, rejectId);
                            });
                        }
                    }
                )
            });
        },

        //下单操作
        /**
         *
         * @param customerDB
         * @param clientId
         * @param operatorId
         * @param orderData
         * @param callback
         */
        makeNewOrder: function (customerDB, clientId, operatorId, orderData, sessionData, callback) {


            logger.enter();
            logger.ndump("orderData", orderData);

            var isErpAvailable = sessionData.customer.erpIsAvailable;
            // 规整cart数据
            var orderDetails = {};
            var goodsIds = [];
            underscore.each(orderData.items, function (item) {
                var decodedQty = new Buffer(item.quantity, 'base64');
                orderDetails[item.goodsId] = {
                    quantity: Number(decodedQty),
                    remark: item.remark
                };
                goodsIds.push(item.goodsId);
            });

            // 规整order数据
            var orderInfo = {
                clientId: clientId,
                operatorId: operatorId,
                remark: orderData.remarks,
                consigneeAddress: orderData.address,
                clientSignature: orderData.clientSignature,
                action: "CREATE",
                hasReceipt: 'true' == orderData.hasReceipt,
                receiptTitle: orderData.receiptTitle
            };

            var rollbackNewOrder = function (connect, finish) {
                db.rollbackTrans(connect, function () {
                    // save onto Cart
                    db.getConnection(function (cartConnect) {
                        var values = [];

                        // 把对象转换成数据库对应的记录数组格式
                        Object.keys(orderDetails).forEach(function (key) {
                            var row = [];

                            row.push(clientId);     // clientId
                            row.push(key);          // goodsId
                            row.push(orderDetails[key].quantity);   // quantity
                            row.push(orderDetails[key].remark);     // remark

                            values.push(row);
                        });

                        db.saveOrderDetailsToCart(customerDB, values, function (err, result) {
                            if (err) {
                                finish(err);
                            } else {
                                finish(err, "系统繁忙，下单失败！请稍后重试！");
                            }
                        });
                    });
                })
            };

            // 获取单品价格
            orderInfo.total = 0;
            db.getClientGoodsPrice(customerDB, clientId, goodsIds, function (err, results) {

                logger.ndump("results", results);
                results.forEach(function (item) {
                    logger.ndump("item", item);
                    orderDetails[item.goodsId]['soldPrice'] = item.price;
                    orderDetails[item.goodsId]['pricePlan'] = item.pricePlan;
                    orderDetails[item.goodsId]['amount'] = (Number(item.price) * Number(orderDetails[item.goodsId].quantity));
                    orderInfo.total += orderDetails[item.goodsId].amount;
                });
                logger.ndump("orderDetails", orderDetails);


                // 保存订单数据
                var orderId,
                    autoCloseOrderDays=0;
                db.beginTrans(function (connect) {
                    async.series(
                        [
                            function addOrderInfo(done) {
                                // 生成新订单
                                db.getClientById(customerDB, clientId, function (err, results) {
                                    orderInfo.paymentType = results.paymentType;
                                    db.metaBatchInsertOrder(connect, customerDB, orderInfo, function (err, result) {
                                        if (err) {
                                            logger.error(err);
                                            done(err);
                                        } else {
                                            orderInfo.orderId = result.insertId;
                                            logger.ndump("orderInfo", orderInfo);
                                            done(err, orderId);
                                        }
                                    });
                                });

                            },
                            /**
                             * 设置订单显示ID
                             * @param done
                             */
                            function genDisplayOrderId(done) {
                                var today = new Date();
                                var yyyymmdd = moment(today).format('YYYYMMDD');
                                orderInfo.displayOrderId = idGen.getDisplayId(orderInfo.orderId, yyyymmdd, __idPrefix.order);
                                db.metaBatchSetDisplayOrderId(connect, customerDB, orderInfo, function (err, result) {
                                    if (err) {
                                        logger.error(err);
                                        done(err);
                                    } else {
                                        logger.trace("Set diplay order id: " + orderInfo.displayOrderId + " successful.");
                                        done();
                                    }
                                });
                            },

                            function addOrderDetails(done) {
                                var values = [];

                                // 把对象转换成数据库对应的记录数组格式
                                Object.keys(orderDetails).forEach(function (key) {
                                    var row = [];

                                    row.push(orderInfo.orderId);            // orderId
                                    row.push(key);                          // goodsId
                                    row.push(orderDetails[key].soldPrice);  // soldPrice
                                    row.push(orderDetails[key].quantity);   // quantity
                                    row.push(orderDetails[key].amount);     // amount
                                    row.push(orderDetails[key].pricePlan);  // pricePlan
                                    row.push(orderDetails[key].remark);     // remark

                                    values.push(row);
                                });

                                // 将values插入数据库
                                logger.ndump("values = " + values);
                                db.metaBatchInsertOrderDetail(connect, customerDB, values, function (err, result) {
                                    if (err) {
                                        logger.error(err);
                                        done(err);
                                    } else {
                                        done(err, result.affectedRows);
                                    }
                                });
                            },

                            function addOrderHistory(done) {
                                db.metaBatchInsertOrderHistory(connect, customerDB, orderInfo, function (err, result) {
                                    if (err) {
                                        logger.error(err);
                                        done(err);
                                    } else {
                                        var orderHistoryId = result.insertId;
                                        done(err, orderHistoryId);
                                    }
                                });
                            },

                            function updateClientFreqBuy(done) {
                                logger.ndump("customerDB", customerDB);
                                logger.ndump("orderInfo", orderInfo);
                                db.addClientFreqBuy(connect, customerDB, orderInfo.orderId, function (err, affectedRows) {
                                    if (err) {
                                        logger.error(err);
                                        done(err);
                                    } else {
                                        done(err, affectedRows);
                                    }
                                });
                            },
                            function getDeliveredDays(done){
                                db._getValue(customerDB,'autoCloseOrderDays',function(err,result){
                                    if(err){
                                        done(null);
                                    }else{
                                        autoCloseOrderDays=result;
                                        done(null,result);
                                    }
                                });
                            }
                            ,
                            function addToOffLineTask(done){
                                autoCloseOrderDays=autoCloseOrderDays|1;                            //若上一个步骤获取失败,这里默认自动关闭天数是1天
                                var taskData={};
                                taskData.taskName = 'SCC_CLOSE_OVERDUE_ORDER';                      // 任务名称
                                taskData.taskType = 'ORDER_CLOSE_UNPAID';                           // 任务类型
                                taskData.taskStatus = 'RUNNING';                                    // 任务状态
                                taskData.taskParam =
                                {orderId: orderInfo.orderId,customerDB:customerDB};                 // 任务参数
                                taskData.maxCount = 1;                                              // 最大执行数
                                taskData.customerId=clientId;                                       // 执行人ID,在这里表示提交订单的客户Id

                                var now=new Date(),
                                    offlineTaskExecuteTime=moment(now).add(autoCloseOrderDays,'days'),
                                    taskDate=offlineTaskExecuteTime.date(),
                                    taskMonth=offlineTaskExecuteTime.month(),
                                    hour=offlineTaskExecuteTime.hour(),
                                    minutes=offlineTaskExecuteTime.minute(),
                                    seconds=offlineTaskExecuteTime.second();

                                taskData.second = seconds;                                          // 秒定时任务
                                taskData.minute = minutes;                                          // 分定时任务
                                taskData.hour = hour;                                               // 时定时任务
                                taskData.dom = taskDate;                                            // 日定时任务
                                taskData.mon = taskMonth;                                           // 月定时任务

                                __taskService.insertTask(taskData,0,null,function(err,result){
                                    if(err){
                                        logger.error(err);
                                        logger.fatal('自动关闭订单的离线任务添加失败了,请做一些必要操作');
                                        done(null);
                                    }else{
                                        logger.dump('已经将该条订单插入Task里面');
                                        done(null,result);
                                    }
                                });
                            }
                        ],

                        function (err, resultList) {
                            if (err && typeof(err) === 'object') {
                                // rollback trans
                                logger.error(err);
                                rollbackNewOrder(connect, callback);
                            } else {
                                // commit trans
                                db.commitTrans(connect, function (commitErr) {
                                    if (commitErr) {
                                        rollbackNewOrder(connect, callback);

                                    } else {
                                        // 清空cart
                                        db.getConnection(function (cartConnect) {
                                            db.metaDeleteCartByGoodsIds(
                                                cartConnect, customerDB, clientId,
                                                goodsIds,
                                                function (carterr, affectedRows) {
                                                    // release db connection
                                                    db.endConnection(cartConnect);

                                                    if (isErpAvailable) {
                                                        //同步订单数据到ERP
                                                        var orderbase = {};
                                                        var orderDetails = [];
                                                        var clientGuid = undefined;
                                                        async.series([

                                                                function (cb) {
                                                                    db.getErpClientGuidbyClientId(customerDB, clientId, function (err, result) {
                                                                        //get ERP CODE FROM BUYERINFO table;
                                                                        if (err) {
                                                                            cb(err);
                                                                        }
                                                                        if (result.length == 0) {
                                                                            var error = "该客户尚未进行ERP数据同步,数据库ClientBuyerInfo中没有对应信息";
                                                                            logger.debug("该客户尚未进行ERP数据同步,数据库ClientBuyerInfo中没有对应信息");
                                                                            cb(error);
                                                                        } else {
                                                                            clientGuid = result[0].erpCode;
                                                                            cb();
                                                                        }
                                                                    })
                                                                },


                                                                function (cb) {
                                                                    db.getOrderInfo(customerDB, orderInfo.orderId, function (result) {
                                                                        orderbase = {
                                                                            //BIGINT,       订单表的自增长id
                                                                            id: result.id,
                                                                            // 对应 erp 收货人ERP编号
                                                                            clientGuid: clientGuid,
                                                                            //VARCHAR(50),  收货人姓名
                                                                            consigneeName: result.consigneeName,
                                                                            //VARCHAR(250), 收货地址
                                                                            consigneeAddress: result.consigneeAddress,
                                                                            //VARCHAR(30),  收货人手机
                                                                            consigneeMobileNum: result.consigneeMobileNum,
                                                                            //ENUM('CREATED','APPROVED','SHIPPED','FINISHED','CLOSED')
                                                                            //(已提交待审核,已受理待发货,商家已发货,已完成订单,已关闭订单)
                                                                            status: 'CREATED',
                                                                            //VARCHAR(200), 订单备注
                                                                            remark: result.remark,
                                                                            //DATETIME,     审核日期
                                                                            confirmDate: '',
                                                                            //DECIMAL(18,4),合计
                                                                            total: result.total,

                                                                            //支付方式 ONLINE-线上支付 CREDIT-授信支付 COD-货到付款
                                                                            paymentType: result.paymentType,
                                                                            //是否索要发票
                                                                            hasReceipt : result.hasReceipt,
                                                                            //发票抬头
                                                                            receiptTitle : result.receiptTitle,

                                                                            //TIMESTAMP,    创建时间
                                                                            createdOn: result.createdOn
                                                                        };
                                                                        cb(null, result);
                                                                    });
                                                                },
                                                                function (cb) {
                                                                    db.listOrderDetailsById(customerDB, orderInfo.orderId, function (err, results) {
                                                                        orderDetails = results;
                                                                        cb(null, results);
                                                                    });
                                                                },
                                                                function (cb) {
                                                                    //订单创建数据同步到采购方ERP`
                                                                    if(__sccMode == "SM"){
                                                                        //SM mode no buyer ERP
                                                                        cb()
                                                                    }else{
                                                                        var msgdata = {
                                                                            order: {
                                                                                orderInfo: orderbase,
                                                                                orderDetail: orderDetails
                                                                            }
                                                                        };
                                                                        var data = {};
                                                                        data.msgData = msgdata;
                                                                        data.customerId = sessionData.operator.customerId;
                                                                        data.msgType = "B2B_ORDER_CREATE_TO_BUYER";
                                                                        apiModule[data.msgType](data, function (err, result) {
                                                                            logger.error(err);
                                                                            logger.debug(result);
                                                                            cb(null, data.msgType);
                                                                        });
                                                                    }
                                                                },
                                                                function (cb) {
                                                                    if (underscore.isUndefined(clientGuid)) {
                                                                        cb(null, "该客户尚未进行ERP数据同步,销售方数据库ClientBuyerInfo中没有对应信息");
                                                                    } else {
                                                                        var msgdata = {
                                                                            order: {
                                                                                orderInfo: orderbase,
                                                                                orderDetail: orderDetails
                                                                            }
                                                                        };
                                                                        var data = {};
                                                                        //订单创建数据同步到销售方ERP
                                                                        data.msgData = msgdata;
                                                                        data.customerId = sessionData.customer.customerId;
                                                                        data.msgType = "B2B_ORDER_CREATE_TO_SELLER";
                                                                        apiModule[data.msgType](data, function (err, result) {
                                                                            logger.error(err);
                                                                            logger.debug(result);
                                                                            cb(null, data.msgType);
                                                                        });
                                                                    }
                                                                }
                                                            ],
                                                            function (errs, results) {
                                                                if (errs) {
                                                                    logger.error(errs);
                                                                }
                                                                callback(null, orderInfo.orderId);
                                                            });
                                                    } else {
                                                        logger.debug("cloudDB erp is not available");
                                                        callback(null, orderInfo.orderId);
                                                    }
                                                });
                                        });
                                    }
                                });
                            }
                        }
                    );
                });
            });
        }

    };
    /**
     * 退款订单状态检测
     * @param customerDB
     * @param orderId
     * @param callback
     */
    function refundOrderStatusCheck(customerDB, orderId, callback) {
        logger.enter();
        var isPaidup = false;
        var isUnaudited = false;
        async.series([
            // step1. 检测当前订单是否'已支付'
            function (done) {
                var conditions = 'PAID';
                db.getOrderInfo(customerDB, orderId, function (result) {
                    isPaidup = (result.paymentStatus == conditions);
                    done(null, result);
                });
            },
            // step2. 检测当前订单是否'未审核'
            function (done) {
                //获取该订单的所有状态
                db.getOrderHistoryAction(customerDB, orderId, function (err, results) {
                    if (!err && results.length > 0) {
                        logger.debug(JSON.stringify(results));
                        var actionArr = [];
                        if ((2 == results.length)) {
                            for (var i = 0; i < results.length; i++) {
                                actionArr.push(results[i].action);
                            }
                            logger.ndump('actionArr: ', actionArr);
                            if ((actionArr.indexOf("CREATE") > -1) && (actionArr.indexOf("CLOSE") > -1)) {
                                isUnaudited = true;
                            }

                        }
                        if ((3 == results.length)) {
                            for (var i = 0; i < results.length; i++) {
                                actionArr.push(results[i].action);
                            }
                            logger.ndump('actionArr: ', actionArr);
                            if ((actionArr.indexOf("CREATE") > -1) && (actionArr.indexOf("APPROVE") > -1) && (actionArr.indexOf("CLOSE") > -1)) {
                                isUnaudited = true;
                            }
                        }
                        logger.debug(isUnaudited);
                        done(null, results);
                    }
                    else {
                        done(err);
                    }
                });
            }
        ], function (err, resultlist) {
            if (err) {
                logger.error(err);
                callback(err);
            } else {
                logger.debug(JSON.stringify(resultlist));
                if (isPaidup && isUnaudited) {
                    callback(null, {status: 'REFUND'}); // 允许付款
                }
                else if (!isPaidup) {
                    callback(null, {status: 'UNPAID'}); // 订单未支付
                }
                else if (!isUnaudited) {
                    callback(null, {status: 'UNCLOSED'}); // 订单未取消
                }
                else {
                    callback(null, {status: 'UNKNOW'}); // 未知类型
                }
            }
        });
    }


    /**
     * 构建refund数据
     */
    function formRefundInfo(cloudDB, customerDB, orderId,callback) {
        logger.enter();
        var data = {};
        var paymentId = undefined;
        var paymentInfo = undefined;
        var paymentGateway = undefined;
        var refundId = undefined;
        async.series([
            //get order paymentId by OrderInfo.id=ordedrId paymentType="ONLINE",AND paymentStatus = "PAID"
            function (cb) {
                db.getPaymentIdForRefund(customerDB, orderId, function (err, result) {
                    if (err || result.length == 0||underscore.isNull(result[0].paymentId)) {
                        cb(err + "orderId=" + orderId + " status can not refund");
                    } else {
                        paymentId = result[0].paymentId;
                        cb();
                    }
                })
            },

            //get paymentInfo by paymentId
            function (cb) {
                db.getOrderPayment(customerDB, paymentId, function (err, results) {
                    if (err || results.length == 0) {
                        cb(err + "orderId=" + orderId + " paymentInfo can not found");
                    } else {
                        paymentInfo = results[0];
                        cb();
                    }
                })
            },
            //get paymentGateway Info
            function (cb) {
                db.getPaymentInfoById(cloudDB, paymentInfo.paymentGatewayId, function (err, result) {
                    if (err) {
                        cb(err + "orderId=" + orderId + " PaymentGateway can not found");
                    } else {
                        paymentGateway = result;
                        cb();
                    }
                })
            },

            //update OrderInfo hasRefund
            function (cb) {
                var status = "1";
                db.updateOrderInfoRefund(customerDB, orderId, status, function (err, result) {
                    if (err) {
                        cb(err + "orderId=" + orderId + "update order hasrefund fail");
                    } else {
                        cb(null, "update OrderInfo.hasrefund Success");
                    }
                })
            },
            //restore refundInfo
            function (cb) {
                var refundInfo = {
                    paymentGatewayId: Number(paymentInfo.paymentGatewayId),
                    orderId: Number(paymentInfo.orderId),
                    currencyCode: paymentInfo.currencyCode,
                    txnAmt: Number(paymentInfo.txnAmt),
                    orderAmt: Number(paymentInfo.txnAmt)
                };
                db.restoreRefundInfo(customerDB, refundInfo, function (err, result) {
                    if (err) {
                        cb(err + "orderId=" + orderId + "restore refund info fail");
                    } else {
                        refundId = result[0].id;
                        cb(null, "restore order Refund Success");
                    }
                })
            },

            //restore refundList
            function (cb) {
                db.restoreRefundList(customerDB, refundId, function (err, result) {
                    cb(err, result);
                })
            }
        ], function (errs, results) {
            if (errs) {
                logger.error(JSON.stringify(errs));
                callback(errs);
            } else {
                logger.error(JSON.stringify(results));
                callback(null, data);
            }
        })
    }
    //create guid for Erp
    function creatGuid(inquiryId,licenseNo){
        var crypto = require('crypto');
        var buffer=inquiryId.toString+licenseNo.toString();
        crypto = crypto.createHash('md5');
        crypto.update(buffer);
        return crypto.digest('hex');
    }

    function updateAutoCloseOrderTask(isPaid,orderId,callback){
        if(isPaid){
            //删除掉Task里面的这条数据
            var taskId=null;
            async.series([
                    //查询存到Task的单据
                    function(innerDone){
                        db.listCertainTypeTask(__cloudDBName,'ORDER_CLOSE_UNPAID',function(err,results){
                            if(err){
                                logger.error(err);
                                innerDone(err);
                            }else{
                                if(results.length==0){
                                    return innerDone();
                                }
                                var taskObj=underscore.find(results,function(item){
                                    var taskParam=null;
                                    try{
                                        taskParam=JSON.parse(item.taskParam);
                                    }catch(err){
                                        logger.error(err);
                                        logger.fatal('将离线任务转换成JSON失败');
                                        innerDone(err);
                                    }
                                    return taskParam.orderId==orderId;
                                });
                                taskId=taskObj.taskId;
                                innerDone(err,taskId);
                            }
                        })
                    },
                    //将该Task记录 状态 更新为 DELETED
                    function(innerDone){
                        if(underscore.isNull(taskId)){
                            return innerDone();
                        }
                        db.editTask(__cloudDBName,taskId,{taskStatus:'DELETED'},function(err,result){
                            if(err){
                                logger.error(err);
                                logger.fatal('将离线任务状态更新为DELETE失败,请做一些必要措施');
                                innerDone(err);
                            }else{
                                innerDone(err,result);
                            }
                        });
                    }

                ],
                function(err,result){
                    if(err){
                        callback(null);
                    }else{
                        callback(err,result);
                    }

                });
        }
        else{
            callback(null);
        }
    }
    return model;
}
