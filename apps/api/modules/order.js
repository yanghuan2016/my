/*****************************************************************
 * 青岛雨人软件有限公司?2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 * apiModule.js
 *
 */
var logger = __logService;

module.exports = function () {
    /**
     * Service
     */
    var logger = __logService;
    var db = __dbService;
    var underscore = require("underscore");
    var async = require('async');
    var redisCli = __redisClient;
    var cloudDB = __cloudDBName;
    var ApiRobot = require(__base + "/modules/apiRobot");
    var isErpMsgCheckStrict = __isErpMsgCheckStrict;
    var version = __erpApiVersion;
    var redis_TTL_AppCode = 600;
    var idGen = require(__modules_path + "/idTwister");
    var moment = require("moment");

    var apiModule = {

        /**
         * 接受ERP传来的采购订单数据,转化为销售订单数据后存入数据库
         * @param data
         * @constructor
         */
        B2B_ORDER_CREATE_FROM_BUYER: function (data) {

            console.log('ORDER_CREATE_FROM_BUYER:', data);
            console.log('ORDER_CREATE_FROM_BUYER:', JSON.stringify(data));

            return ;
            logger.enter();
            logger.debug(__sccMode);
            logger.debug(JSON.stringify(data));
            var msg = data.msg;
            var customerInfo = data.customerInfo;
            var customerDBName = data.customerDB;
            var operatorId = data.operatorRobotId;
            var cloudDBName = __cloudDBName;
            var clientCustomerId = Number(data.userId);//采购方发送数据接口对应的customerId;
            var ERPdata = JSON.parse(msg.msgData);

            //数据准备
            var orderInfos = ERPdata.STOCKORDERFORM;
            var orderDetails = ERPdata.STOCKORDERFORMDETAIL;

            async.mapSeries(orderInfos,
                function (orderInfo, mapcallback) {
                    var guid = orderInfo.GUID;
                    var currentDetails = [];
                    var oDetails = {};
                    var goodsIds = [];
                    //单个订单数据处理
                    var clientId = undefined;
                    var total = 0;
                    async.series([
                            function (cb) {
                                //归并相同订单内码的订单详情;
                                underscore.map(orderDetails, function (detail) {
                                    if (detail.StockOrderFormGuid == guid) {
                                        currentDetails.push(detail);
                                    }
                                });
                                cb();
                            },
                            function (cb) {
                                db.getClientByCustomerId(customerDBName, clientCustomerId, function (err, result) {
                                    if (!err && result.length > 0) {
                                        clientId = result[0].clientId;
                                    }
                                    cb(err, result);
                                })
                            },
                            function (cb) {
                                async.mapSeries(currentDetails,
                                    function (item, mapcallback) {
                                        total += Number(item.AmountTax);
                                        db.getGoodsIdByPZWH(customerDBName, item.PZWH, function (err, result) {
                                            if (err) {
                                                logger.error("对应的商品没有数据,需要先同步再生成订单" + item.PZWH);
                                                mapcallback(err);
                                            }
                                            var goodsId = result[0].id;

                                            oDetails[goodsId] = {
                                                quantity: Number(item.Quantity),
                                                soldPrice: Number(item.InPrice),
                                                pricePlan: "clientPrice", //采购订单价格默认客户单品价格
                                                amount: Number(item.AmountTax),
                                                remark: ""
                                            };
                                            goodsIds.push(goodsId);
                                            mapcallback();
                                        })

                                    },
                                    function (err, result) {
                                        cb(err, result);
                                    });
                            }
                        ],
                        function (err, result) {
                            if (err) {
                                logger.debug("数据不完整,无法创建订单");
                                logger.error(err);
                                mapcallback(null, "订单数据缺失,请重新处理,ERP采购内码=" + guid);
                            } else {
                                var insertOrderInfo = {
                                    operatorId: operatorId,//生成销售订单的系统操作员
                                    clientId: clientId,
                                    consigneeAddress: orderInfo.CustomerAdder + ";" + orderInfo.EmployeeName,//收货人地址
                                    action: "CREATED",
                                    remark: orderInfo.Remark,
                                    total: total,// 订单合计金额
                                    clientSignature: "CREATED_FROM_ERP",//todo 客户签名数据
                                    customerSignature: "CREATED_FROM_ERP"//todo 商户签名数据
                                };

                                logger.debug(JSON.stringify(insertOrderInfo));
                                logger.debug(JSON.stringify(oDetails));
                                db.beginTrans(function (connect) {
                                    async.series(
                                        [
                                            function addOrderInfo(done) {
                                                // 生成新订单
                                                db.metaBatchInsertOrder(connect, customerDBName, insertOrderInfo, function (err, result) {
                                                    if (err) {
                                                        logger.error(err);
                                                        done(err);
                                                    } else {
                                                        insertOrderInfo.orderId = result.insertId;
                                                        logger.ndump("orderInfo", insertOrderInfo);
                                                        done(err, insertOrderInfo.orderId);
                                                    }
                                                });
                                            },
                                            function addOrderDetails(done) {
                                                var values = [];

                                                // 把对象转换成数据库对应的记录数组格式
                                                Object.keys(oDetails).forEach(function (key) {
                                                    var row = [];

                                                    row.push(insertOrderInfo.orderId);            // orderId
                                                    row.push(key);                          // goodsId
                                                    row.push(oDetails[key].soldPrice);  // soldPrice
                                                    row.push(oDetails[key].quantity);   // quantity
                                                    row.push(oDetails[key].amount);     // amount
                                                    row.push(oDetails[key].pricePlan);  // pricePlan
                                                    row.push(oDetails[key].remark);     // remark

                                                    values.push(row);
                                                });

                                                // 将values插入数据库
                                                logger.ndump("values = " + values);
                                                db.metaBatchInsertOrderDetail(connect, customerDBName, values, function (err, result) {
                                                    if (err) {
                                                        logger.error(err);
                                                        done(err);
                                                    } else {
                                                        done(err, result.affectedRows);
                                                    }
                                                });
                                            },

                                            function addOrderHistory(done) {
                                                db.metaBatchInsertOrderHistory(connect, customerDBName, insertOrderInfo, function (err, result) {
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
                                                logger.ndump("orderInfo", insertOrderInfo);
                                                db.addClientFreqBuy(connect, customerDBName, insertOrderInfo.orderId, function (err, affectedRows) {
                                                    if (err) {
                                                        logger.error(err);
                                                        done(err);
                                                    } else {
                                                        done(err, affectedRows);
                                                    }
                                                });
                                            }
                                        ],

                                        function (err, resultList) {
                                            if (err && typeof(err) === 'object') {
                                                // rollback trans
                                                logger.error(err);
                                                db.rollbackTrans(connect, function () {
                                                    logger.debug("订单生成失败guid=" + guid);
                                                    mapcallback(null, "订单生成失败guid=" + guid);
                                                });

                                            } else {
                                                // commit trans
                                                db.commitTrans(connect, function (commitErr) {
                                                    if (commitErr) {
                                                        logger.error(commitErr);
                                                    } else {
                                                        logger.debug("订单生成" + insertOrderInfo.orderId);
                                                        //同步订单数据到ERP
                                                        var orderbase = {};
                                                        var orderDetails = [];
                                                        var clientGuid = undefined;

                                                        async.series([

                                                                function (cb) {
                                                                    db.getErpClientGuidbyClientId(customerDBName, clientId, function (err, result) {
                                                                        //get ERP CODE FROM BUYERINFO table;
                                                                        if (err) {
                                                                            cb(err);
                                                                        }
                                                                        if (result.length == 0) {
                                                                            logger.debug("该客户尚未进行ERP数据同步,数据库ClientBuyerInfo中没有对应信息")
                                                                        } else {
                                                                            clientGuid = result[0].erpCode;
                                                                        }
                                                                        cb();
                                                                    })
                                                                },
                                                                function (cb) {
                                                                    db.getOrderInfo(customerDBName, insertOrderInfo.orderId, function (result) {
                                                                        orderbase = {
                                                                            //BIGINT,       订单表的自增长id
                                                                            id: result.id,
                                                                            // 对应 erp 收货方ERP编号
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
                                                                            //TIMESTAMP,    创建时间
                                                                            createdOn: result.createdOn
                                                                        };
                                                                        cb(null, result);
                                                                    });
                                                                },
                                                                function (cb) {
                                                                    db.listOrderDetailsById(customerDBName, insertOrderInfo.orderId, function (err, results) {
                                                                        orderDetails = results;
                                                                        cb(null, results);
                                                                    });
                                                                },

                                                                function (cb) {
                                                                    if (underscore.isUndefined(clientGuid)) {
                                                                        cb("该客户尚未进行ERP数据同步,销售方数据库ClientBuyerInfo中没有对应信息");
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
                                                                        data.customerId = customerInfo.customerId;
                                                                        data.msgType = "ORDER_CREATE_TO_SELLER";
                                                                        apiModule[data.msgType](data, function (err, result) {
                                                                            if (err) {
                                                                                logger.error(err);
                                                                            }
                                                                            logger.debug(result);
                                                                            cb(null, data.msgType);
                                                                        });
                                                                    }
                                                                }
                                                            ],
                                                            function (errs, results) {
                                                                if (errs) {
                                                                    logger.error(errs);
                                                                    logger.debug("ORDER SEND TO SELLER FAIL");
                                                                } else {
                                                                    logger.debug("ORDER SEND TO SELLER Ok");
                                                                }
                                                                mapcallback(null, "订单生成" + insertOrderInfo.orderId);
                                                            });
                                                    }

                                                });
                                            }
                                        }
                                    );
                                });
                            }

                        });

                },
                function (errs, results) {
                    logger.debug("所有订单处理完毕,result=" + JSON.stringify(results));
                });
        },

        B2B_ORDER_SHIP_RECEIVE_FROM_BUYER: function (data) {
            console.log(data);

            // 定一个数据格式:
            logger.enter();

            var receiveData = {
                status: 'DELIVERED',
                shipId: '1',
                remark: '',
                orData: [
                    ['1', '142', '2001', '1', '20011111', ''],
                    ['1', '59', '1001', '9', '10011111111', '']
                    //shipId, goodsId, batchNum, batchQty,drugEsc, remark
                ],
                isReject: 'false'
            };

            msData = {
                status: 'DELIVERED',
                shipId: '1',
                remark: '',
                orData: [
                    {
                        shipId: 1,
                        goodsId: 142,
                        batchNum: '2001',
                        batchQty: 1,
                        drugEsc: '123451231',
                        remark: 'abcdefg'
                    },
                    {
                        shipId: 1,
                        goodsId: 59,
                        batchNum: '1001',
                        batchQty: 9,
                        drugEsc: '1011111111',
                        remark: 'abcdefg'
                    }
                ],
                isReject: 'false'
            };

            var ORDER_SHIP_RECEIVE_FROM_BUYER = {
                Lsh: '',                    // 流水号
                rkdzk: [
                    {
                        Rkdh: '',           //入库单号
                        Hh:'',              // 商品货号
                        Yfphm:'',           //原配送单号
                        Sssl: 123,          // 入库数量
                        Htbn:'',            // 采购订单明细表guid
                        monitordetail:[
                            {
                                monitorcode:'',         // 监管码
                                ysdh: '',               // 入库单号
                                bzgg: '',               // 包装规格
                                ftype: ''               // 单据类型  作为限定条件ftype=0
                            }
                        ]
                    }
                ]
            }
        },

        B2B_ORDER_RETURN_CREATE_FROM_SELLER: function (data) {
            var reqbody = {
                goodsArr: [
                    {
                        goodsId: 59,            // 商品号
                        qty: 4,                  // 退货数量
                        remark: 'remark1111'     // 备注
                    },
                    {
                        goodsId: 142,
                        qty: 3,
                        remark: 'remark22222'
                    }
                ],
                remark: 'balbalabalabala'
            };

        },

        /**
         * 接受ERP传来的销售订单数据后存入数据库(暂无该情况)
         * @param data
         * @constructor
         */
        B2B_ORDER_CREATE_FROM_SELLER: function (data) {
            logger.enter();
            //this condition never happen

            var ORDER_CREATE_FROM_SELLER = {
                Guid: '',
                BillNO:'',      // 流水号
                BillDate: '',    //
                CustomGuid:'',      //客户编号
                EmployeeGuid: '',   //业务员编号
                SellItem: '',       // 结算客户
                SendAddress: '',    //发货地址
                Notes: '',          //备注
                Fahuo:[
                    {
                        DH:'',      // 明细单号
                        LSH:'',     // 对应FahuoHead的BillNo）
                        HH:'',      // 货号
                        PH1:'',     // 批号
                        PCDH:'',        // 批次单号
                        PH1_XQ:'',      // 批次效期
                        PH3:'',     // 退回原因
                        SL:'',      // 退货数量
                        SJ:'',      // 退回单价
                        JSHJ:'',        // 退回价税
                        BZ:''       // 备注
                    }
                ]
            }

        },

        /**
         * SCC向采购方发送采购订单数据
         * @param data
         * @param callback
         * @constructor
         */
        B2B_ORDER_CREATE_TO_BUYER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug("CREATE ORDER TO BUYER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * SCC向销售方发送销售订单数据
         * @param data
         * @param callback
         * @constructor
         */
        B2B_ORDER_CREATE_TO_SELLER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug("CREATE ORDER TO SELLER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },


        /**
         * SCC上在审核前可关闭(取消)订单
         * @param data
         * @constructor
         */
        B2B_ORDER_CLOSE_TO_SELLER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug("CLOSE ORDER TO SELLER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        B2B_ORDER_CLOSE_TO_BUYER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug("CLOSE ORDER TO BUYER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },


        //销售方ERP发起关闭订单请求的处理
        B2B_ORDER_CLOSE_FROM_SELLER: function (data) {
            var customerModel = require(__base + "/apps/order/model")();
            logger.enter();
            var customerDBName = data.customerDB;
            var msg = data.msg;
            var msgData = data.msgData;
            var operatorId = data.operatorRobotId;
            customerModel.orderStatusCheck(customerDBName, orderId, "CLOSED", function (success) {
                if (!success) {
                    db.getOrderInfo(customerDBName, orderId, function (orderData) {
                        clientId = orderData.clientId;
                        var operatorData = {
                            operatorId: operatorId,
                            clientId: clientId
                        };
                        customerModel.transCloseOrder(customerDBName, orderId, operatorData, function (err, resultList) {
                            if (!err) {
                                logger.debug("Order Close  SEND TO BUYER");
                                db.getCustomerIdByClientId(customerDBName, clientId, function (err, result) {
                                    var sendCustomerId = result[0].customerId;
                                    var customerId = sendCustomerId;
                                    var msgType = "ORDER CLOSE TO BUYER";
                                    var msgData = msgData;
                                    var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
                                    apiRobot.sendMsg(customerId, msgType, msgData, function sendMsgCallback(error, result) {
                                        if (error) {
                                            logger.error(err);
                                        }
                                        logger.debug("SEND ORDER CLOSE TO BUYER;")

                                    });
                                    mapcallback();
                                });
                            } else {
                                logger.error(err);
                                mapcallback();
                            }
                        })
                    });

                } else {
                    logger.debug("订单状态已关闭,不能再次提交关闭请求");
                    mapcallback();
                }
            });
        },


        //    ORDER_CLOSE_FROM_BUYER: function(data){},
        /**
         * 销售方ERP审核订单并通知到SCC,采购方ERP
         * 不存在采购订单的审核到SCC
         * @param data
         * @constructor
         */
        B2B_ORDER_CONFIRM_FROM_SELLER: function (data) {
            var customerModel = require(__base + "/apps/customer/model")();
            var customerDBName = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            var msgData = msg.msgData;

            //订单审核的处理
            //"XSDDHead":[{"GUID":"31","BILLNO":"31","ISAUDITING":1,"ISCLOSE":1}]
            var clientId = undefined;
            var auditingOrders = msgData.XSDDHead;
            async.mapSeries(auditingOrders,
                function (auditingOrder, mapcallback) {
                    var orderId = Number(auditingOrder.BILLNO);//SCC订单号
                    var isClosed = auditingOrder.ISCLOSE == "1";
                    var isApproved = auditingOrder.ISAUDITING == "1";
                    logger.debug("orderId=" + orderId + ",isClosed=" + isClosed + ",isApproved=" + isApproved);
                    //同步订单审核信息
                    if (isClosed) {
                        customerModel.orderStatusCheck(customerDBName, orderId, "CLOSED", function (success) {
                            if (!success) {
                                db.getOrderInfo(customerDBName, orderId, function (orderData) {
                                    clientId = orderData.clientId;
                                    var operatorData = {
                                        operatorId: operatorId,
                                        clientId: clientId
                                    };
                                    customerModel.transCloseOrder(customerDBName, orderId, operatorData, function (err, resultList) {
                                        if (!err) {
                                            if (__sccMode == "SM") {
                                                logger.debug("current mode is SM ,not send  order close to buyer ")
                                                mapcallback();
                                            } else {
                                                logger.debug("Order Close  SEND TO BUYER");
                                                db.getCustomerIdByClientId(customerDBName, clientId, function (err, result) {
                                                    var sendCustomerId = result[0].customerId;
                                                    var customerId = sendCustomerId;
                                                    var msgType = "ORDER CLOSE TO BUYER";
                                                    var msgData = msgData;
                                                    var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
                                                    apiRobot.sendMsg(customerId, msgType, msgData, function sendMsgCallback(error, result) {
                                                        if (error) {
                                                            logger.error(err);
                                                        }
                                                        logger.debug("SEND ORDER CLOSE TO BUYER;")

                                                    });
                                                    mapcallback();
                                                });
                                            }
                                        } else {
                                            logger.error(err);
                                            mapcallback();
                                        }
                                    })
                                });
                            } else {
                                logger.debug("订单状态已关闭,不能再次提交关闭请求")
                                mapcallback();
                            }
                        });
                    } else {
                        customerModel.orderStatusCheck(customerDBName, orderId, 'CREATED', function (success) {
                            if (success) {
                                //2016-3-25 更新了订单审核方法，下面方法不再适用
                                //customerModel.checkInventory(customerDBName, orderId, function (inventoryDatas) {
                                //    db.getOrderInfo(customerDBName, orderId, function (orderData) {
                                //        clientId = orderData.clientId;
                                //        var updateData = {
                                //            inventoryDatas: inventoryDatas,
                                //            orderId: orderId,
                                //            status: isApproved ? "APPROVED" : "REJECTED",
                                //            remark: "",
                                //            customerSignature: ""
                                //        };
                                //        var operatorData = {
                                //            operatorId: operatorId,
                                //            clientId: clientId
                                //        };
                                //        logger.debug(JSON.stringify(updateData));
                                //        logger.debug(JSON.stringify(operatorData));
                                //        customerModel.transUpdateOrderStatus(customerDBName, updateData, operatorData, function (err, orderId) {
                                //            if (!err) {
                                //                logger.debug("UpdateOrderStatus orderId=" + orderId + " APPROVED");
                                //
                                //                if (__sccMode != "SM") {
                                //                    db.getCustomerIdByClientId(customerDBName, clientId, function (err, result) {
                                //                        var sendCustomerId = result[0].customerId;
                                //                        var customerId = sendCustomerId;
                                //                        var msgType = "ORDER CONFIRM TO BUYER";
                                //                        var msgData = msgData;
                                //                        var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
                                //                        apiRobot.sendMsg(customerId, msgType, msgData, function sendMsgCallback(error, result) {
                                //                            if (error) {
                                //                                logger.error(err);
                                //                            }
                                //                            logger.debug("SEND ORDER CONFIRM TO BUYER;")
                                //                        });
                                //                    });
                                //                } else {
                                //                    logger.debug("current mode in SM , ORDER CONFIRM NOT SENT TO BUYER");
                                //                }
                                //            } else {
                                //                logger.debug("UpdateOrderStatus FAIL")
                                //            }
                                //            mapcallback(null, "orderId=" + orderId + "APPROVED");
                                //        });
                                //    });
                                //});
                                clientId = orderData.clientId;
                                var updateData = {
                                    orderId: orderId,
                                    status: isApproved ? "APPROVED" : "REJECTED",
                                    remark: "",
                                    customerSignature: ""
                                };
                                var operatorData = {
                                    operatorId: operatorId,
                                    clientId: clientId
                                };
                                logger.debug(JSON.stringify(updateData));
                                logger.debug(JSON.stringify(operatorData));
                                customerModel.transUpdateOrderStatusNew(customerDBName,updateData,operatorData, function (err, orderId) {
                                    if (!err) {
                                        logger.debug("UpdateOrderStatus orderId=" + orderId + " APPROVED");

                                        if (__sccMode != "SM") {
                                            db.getCustomerIdByClientId(customerDBName, clientId, function (err, result) {
                                                var sendCustomerId = result[0].customerId;
                                                var customerId = sendCustomerId;
                                                var msgType = "ORDER CONFIRM TO BUYER";
                                                var msgData = msgData;
                                                var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
                                                apiRobot.sendMsg(customerId, msgType, msgData, function sendMsgCallback(error, result) {
                                                    if (error) {
                                                        logger.error(err);
                                                    }
                                                    logger.debug("SEND ORDER CONFIRM TO BUYER;")
                                                });
                                            });
                                        } else {
                                            logger.debug("current mode in SM , ORDER CONFIRM NOT SENT TO BUYER");
                                        }
                                    } else {
                                        logger.debug("UpdateOrderStatus FAIL")
                                    }
                                    mapcallback(null, "orderId=" + orderId + "APPROVED");
                                })
                            } else {
                                logger.debug("Order Status is not to be APPROVED");
                                mapcallback(null, "Order id=" + orderId + " Status is not to be APPROVED")
                            }
                        });
                    }
                },
                function (errs, resultArrays) {
                    if (errs) {
                        logger.error(errs);
                    }
                    logger.debug(JSON.stringify(resultArrays));
                }
            );
        },

        /**
         * SCC执行订单审核后同步到双方
         * @param data
         * @param callback
         * @constructor
         */
        B2B_ORDER_CONFIRM_TO_BUYER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug("CONFIRM ORDER TO BUYER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });

        },
        B2B_ORDER_CONFIRM_TO_SELLER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug("CONFIRM ORDER TO SELLER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });

        },

        /**
         * 销售方商品发货通知到SCC,采购方ERP
         * 不存在采购方订单发货到SCC
         * @param data
         * @constructor
         */
        B2B_ORDER_SHIP_FROM_SELLER: function (data) {

            logger.enter();
            logger.debug(__sccMode);
            var msg = data.msg;
            var customerInfo = data.customerInfo;
            var operatorId = data.operatorRobotId;
            var cloudDBName = __cloudDBName;
            var customerDB = customerInfo.customerDB;
            var msgData = msg.msgData;

            //先沿用SCC ship model方法新建一个发货单,再补充ERP提供的其他数据
            var shipInfo = {};
            //new ship order
            //data = {
            //    "FhdzkHead": [{
            //        "BILLNO": "GKZRM201603070024",
            //        "BILLDATE": "2016-03-07T00:00:00",
            //        "BILLTIME": "14:15:58",
            //        "ORDERBILLNO": null,
            //        "ORDERGUID": null,
            //        "NOTES": "客户高开价折让差价处理生成",
            //        "FHRY": null,
            //        "FHRQ": null,
            //        "CUSTOMGUID": "06EB2300EC784C1FA032379251358CF5",
            //        "CUSTOMNAME": "雨人健康城(兰州店)"
            //    }],
            //    "Fhdzk": [{
            //        "DH": "201603070026",
            //        "LSH": "GKZRM201603070024",
            //        "HH": "111059",
            //        "PH1": "",
            //        "PCDH": "",
            //        "PH1_XQ": null,
            //        "SCRQ": null,
            //        "HTBH": null,
            //        "SL": 1,
            //        "BZ": " ",
            //        "REPORTURL": null,
            //        "MONITORCODE": null
            //    }]
            //}
            var ships = msgData.FhdzkHead;
            var detailShips = msgData.Fhdzk;
            async.mapSeries(ships,
                function (ship, mapcallback) {
                    var orderId = Number(ship.ORDERBILLNO);
                    db.getOrderInfo(customerDB, orderId, function (result) {
                        shipInfo.orderId = orderId;
                        shipInfo.logisticsNo = "ERP发货";
                        shipInfo.logisticsCompany = "商家";
                        shipInfo.remark = ship.NOTES;
                        shipInfo.clientId = result.clientId;

                        var operatorData = {
                            operatorId: operatorId,
                            clientId: shipInfo.clientId
                        };
                        var shipData = [];
                        var shipDetailsUpdates = [];
                        var shipItems = [];
                        underscore.map(detailShips, function (detail) {
                            if (detail.LSH == ship.BILLNO) {
                                shipItems.push(detail);
                            }
                        });

                        /**
                         * 根据orderId取出Ordertails作统计
                         */
                        if (shipInfo.orderId > 0 && shipInfo.clientId > 0) {
                            async.series(
                                [
                                    function (done) {
                                        db.getOrderDetail(customerDB, shipInfo.orderId, function (err, results) {
                                            //统计orderDetailQuantity
                                            var orderDetailQuantity = 0;
                                            underscore.map(results, function (detail) {
                                                orderDetailQuantity += detail.quantity;
                                            });
                                            logger.debug("orderDetailQuantity=" + orderDetailQuantity);
                                            //统计shippedQuantitySum
                                            var shippedQuantitySum = 0;
                                            async.mapSeries(shipItems,
                                                function (item, mapcallback) {
                                                    shippedQuantitySum += Number(item.SL);
                                                    db.getGoodsIdbyGoodsNo(customerDB, item.HH, function (goodsId) {
                                                        item.goodsId = goodsId;
                                                        mapcallback();
                                                    });
                                                },
                                                function (err, result) {
                                                    logger.debug("shippedQuantitySum=" + shippedQuantitySum);
                                                    var goodIds = [];
                                                    underscore.map(shipItems, function (item) {
                                                        var goodsId = Number(item.goodsId);
                                                        var batchData = [];
                                                        batchData.push(item.PCDH);
                                                        batchData.push(item.SCRQ);
                                                        batchData.push(item.PH1_XQ);
                                                        batchData.push(Number(item.SL));
                                                        batchData.push(item.MonitorCode);
                                                        batchData.push(item.ReportURL);
                                                        batchData.push(orderDetailQuantity);
                                                        batchData.push(shippedQuantitySum);
                                                        if (goodIds.indexOf(goodsId) == -1) {
                                                            var shipObj = {
                                                                goodsId: goodsId,
                                                                batchDatas: []
                                                            };
                                                            shipObj.batchDatas.push(batchData);
                                                            goodIds.push[goodsId];
                                                            shipData.push(shipObj);
                                                        } else {
                                                            shipData = underscore.map(shipData, function (sObj) {
                                                                if (sObj.goodsId == item.goodsId) {
                                                                    return sObj.batchDatas.push(batchData);
                                                                }
                                                            });

                                                        }
                                                        var detailObj = {
                                                            goodsId: item.goodsId,
                                                            batchNum: item.PCDH,
                                                            batchNo: item.PH1,
                                                            detailNo: item.DH,
                                                            orderBillOutDetailUid: item.HTBH,
                                                            remark: item.BZ
                                                        };
                                                        shipDetailsUpdates.push(detailObj);
                                                    });
                                                    shipInfo.shipData = shipData;

                                                    logger.debug(JSON.stringify(shipInfo));
                                                    var customerModel = require(__base + "/apps/customer/model")();
                                                    var shipModel = require(__base + "/apps/customer/ship/model")();
                                                    customerModel.orderStatusCheck(customerDB, shipInfo.orderId, "APPROVED", function (success) {
                                                        if (success) {
                                                            shipModel.newShipInfo(customerDB, shipInfo, operatorData, function (err, shipId) {
                                                                //ERP提供待更新的字段:
                                                                //更新shipInfo:
                                                                var updataShipInfo = {
                                                                    guid: ship.BILLNO, //ERP流水号
                                                                    billNo: ship.ORDERBILLNO,//订单号
                                                                    shipTime: ship.BILLTIME,//发货时间
                                                                    shipDescription: ship.NOTES,//发货描述
                                                                    senderName: ship.FHRY,//发货人
                                                                    shipDate: ship.BILLDATE//发货日期
                                                                };
                                                                db.updateShipInfo(customerDB, shipId, updataShipInfo, function (err, result) {
                                                                    if (err) {
                                                                        logger.error(err);
                                                                    }
                                                                    //更新shipDetails:
                                                                    underscore.map(shipDetailsUpdates, function (detailobj) {
                                                                        db.updateErpShipDetails(customerDB, shipId, detailobj, function (err, result) {
                                                                            if (err) {
                                                                                logger.error(err);
                                                                            }
                                                                        })
                                                                    });
                                                                    logger.debug("订单" + shipInfo.orderId + "状态更新," + "发货单=" + shipId);
                                                                    done();
                                                                });
                                                            })
                                                        } else {
                                                            logger.debug("订单不是待发货状态，不能操作发货");
                                                            done(null, "订单" + shipInfo.orderId + "不是待发货状态，不能操作发货");
                                                        }
                                                    });
                                                }
                                            );
                                        });
                                    },
                                    function (done) {
                                        if (__sccMode == "SM") {
                                            logger.debug("NOW IN SM MODE NOT SENT ORDER SHIP TO BUYER");
                                            done();
                                        } else {
                                            db.getCustomerIdByClientId(customerDB, shipInfo.clientId, function (err, result) {
                                                if (err || result.length == 0) {
                                                    logger.debug("数据缺失,找不到对应的Cloud.Customer.id,请联系管理员");
                                                    done();
                                                } else {
                                                    var data = {};
                                                    data.msgData = msgData;
                                                    data.customerId = result[0].customerId;
                                                    data.msgType = "ORDER_SHIP_TO_BUYER";
                                                    sendDataToBuyerSeller(data, function (err, result) {
                                                        if (err) {
                                                            logger.error(err);
                                                        }
                                                        done(null, "send order ship to buyer");
                                                    });
                                                }
                                            });
                                        }
                                    }
                                ],
                                function (errs, results) {
                                    if (errs) {
                                        logger.error(errs);
                                    }
                                    logger.debug(JSON.stringify(results));
                                });
                        } else {
                            logger.debug("ERP发送的发货数据orderId=" + shipInfo.orderId + "和clientId=" + shipInfo.clientId + "格式不正确");
                            mapcallback(null, "ERP发送的发货数据orderId=" + shipInfo.orderId + "和clientId=" + shipInfo.clientId + "格式不正确")
                        }
                    });
                },
                function (errs, results) {
                    if (errs) {
                        logger.error(errs);
                    }
                    logger.debug("发货单处理完成" + JSON.stringify(results));
                });
        },

        B2B_ORDER_SHIP_TO_BUYER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug("SHIP ORDER TO BUYER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * SCC上完成发货收货动作并通知到两方
         * @param data
         * @constructor
         */
        B2B_ORDER_SHIP_RECEIVE_TO_BUYER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug("SHIP RECEIVE ORDER TO BUYER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        //SCC确认收货同步到ERP
        B2B_ORDER_SHIP_RECEIVE_TO_SELLER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug("SHIP RECEIVE ORDER TO SELLER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * 销售方退货审核通过后同步退货单到采购方;
         * @param data
         * @param callback
         * @constructor
         */
        B2B_ORDER_RETURN_CREATE_TO_BUYER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug(" ORDER RETURN CREATE TO BUYER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },


        /**
         * ERP验货收货岗位替客户创建退货单(针对全单拒收的情况)
         * @param data
         * @constructor
         */
        B2B_ORDER_RETURN_CREATE_FROM_SELLER: function (data) {
            logger.enter();
            logger.debug(__sccMode);
            var customerDB = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            //msgData = {"XSJSHead":[{"GUID":"001","BillNO":"001"}]};
            var rejectDatas = msg.msgData.XSJSHead;
            var shipDatas = undefined;
            var returnId = undefined;
            var displayReturnId = undefined;
            async.mapSeries(
                rejectDatas,
                function(item,mapCallback){
                     var orderId = Number(item.GUID);
                     logger.debug("rejeted orderId ="+orderId);
                     db.beginTrans(function (connect) {
                         async.series([
                                 function (done) {
                                     //step1 to get shipInfo
                                     db.getShipInfoByOrderId(customerDB, orderId, function (err, result) {
                                         if (err) {
                                             done(err);
                                         } else {
                                             logger.debug(JSON.stringify(result));
                                             shipDatas = result;
                                             done();
                                         }
                                     });
                                 },
                                 function (done) {
                                     //step2insert into ReturnInfo
                                     var shipData = shipDatas[0];
                                     var insertReturnInfo = {
                                         shipId: Number(shipData.shipId),
                                         orderId: Number(shipData.orderId),
                                         operatorId: Number(operatorId),//SCC robot Id
                                         status: "DELIVERED",
                                         receiveDate: (new Date()).toLocaleString(),
                                         returnDeliveredRemark: "goods all reject from buyer",
                                         remark:"created by SCC"
                                     };
                                     logger.debug(JSON.stringify(insertReturnInfo));
                                     db.metaInsertRejectReturnInfo(connect,customerDB,insertReturnInfo,function(err,insertId){
                                        if(err){
                                            done(err);
                                        }else{
                                            returnId = insertId;
                                            logger.debug("returnId ="+returnId);
                                            done();
                                        }
                                     });
                                 },
                                 function (done) {
                                     var today = new Date();
                                     var yyyymmdd = moment(today).format('YYYYMMDD');
                                     displayReturnId = idGen.getDisplayId(returnId, yyyymmdd, __idPrefix.return);
                                     var updateData = {returnId: returnId, displayReturnId: displayReturnId};
                                     db.metaBatchSetDisplayReturnId(connect, customerDB, updateData, function (err, result) {
                                         if (err) {
                                             logger.error(err);
                                             done(err);
                                         } else {
                                             logger.trace("Set return display id: " + displayReturnId + " successful.");
                                             done();
                                         }
                                     });
                                 },
                                 function (done) {
                                     //step3 insert into ReturnGoodsMap
                                     var insertGoodsMap = [];
                                     var goodsArr = underscore.groupBy(shipDatas,"goodsId");
                                     var goodsArrValues = underscore.values(goodsArr);
                                     underscore.map(goodsArrValues,function(itemArr){
                                       var sumQty =0;
                                       underscore.each(itemArr,function(item){
                                         sumQty += item.quantity;
                                       });
                                       var mapItem = [];
                                         mapItem.push(returnId);
                                         mapItem.push(itemArr[0].goodsId);
                                         mapItem.push(itemArr[0].soldPrice);
                                         mapItem.push(sumQty);//receiveShippedQuantity
                                         insertGoodsMap.push(mapItem);
                                     });
                                     db.metaBatchInsertRejectReturnInfoGoodsMap(connect,customerDB,insertGoodsMap,function(err,result){
                                        if(err){
                                            done(err+"INSERT RETURNINFOGOODSMAP FAIL");
                                        } else{
                                            logger.debug("insert returninfo goods map Success");
                                            done();
                                        }
                                     });
                                 },
                                 function (done) {
                                     //step4 insert into ReturnDetails
                                     var shipDetails = [];
                                     underscore.map(shipDatas,function(item){
                                         var arr =[];
                                         arr.push(returnId);
                                         arr.push(item.orderId);
                                         arr.push(item.goodsId);
                                         arr.push(item.quantity);//全单拒收时quantity退货数量=发货数量，下同
                                         arr.push(item.quantity);//全单拒收时returnDeliveredQuantity
                                         arr.push(item.drugESC);//全单拒收时电子监管码
                                         arr.push(item.batchNum);//全单拒收时批次号
                                         arr.push(item.batchNo);//全单拒收时批号
                                         arr.push(item.licenseNo);//商品批准文号goodslicenseNo
                                         arr.push(item.inspectReportURL);//批次检验报告URL
                                         arr.push(item.drugESC);//商户确认退货收货时录入的电子监管码deliveredDrugESC
                                         arr.push(item.goodsProduceDate);//生产日期
                                         arr.push(item.goodsValidDate);//有效期
                                         shipDetails.push(arr);
                                     });
                                     logger.debug(JSON.stringify(shipDetails));
                                     db.metaBatchInsertRejectReturnDetails(connect,customerDB,shipDetails,function(err,results){
                                         if(err){
                                             done(err+"INSERT RETURNDETAILS FAIL");
                                         } else{
                                             logger.debug("insert return DETAILS Success");
                                             done();
                                         }
                                     });
                                 }
                             ],
                             function (errs, results) {
                                 if (errs) {
                                     logger.error(JSON.stringify(errs));
                                     logger.debug("Rollback the transaction");
                                     db.rollbackTrans(connect, function (error) {
                                         mapCallback(null, "orderId="+orderId+"拒收处理出现错误"+errs);
                                     });

                                 } else {
                                     logger.debug("commit the transaction");
                                     logger.debug("orderId="+orderId+"拒收处理完成");
                                     db.commitTrans(connect, function () {
                                         mapCallback();
                                     });
                                 }
                             }
                         );
                     })
                },
                function(errs,results){
                    if(errs){
                    }else{
                        logger.debug("全单拒收已处理完成"+JSON.stringify(results));
                        //todo deal with no errs
                    }
                }
            )
        },



        /**
         * SCC上创建退货单并通知到销售方
         * @param data
         * @param callback
         * @constructor
         */
        B2B_ORDER_RETURN_CREATE_TO_SELLER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug(" ORDER RETURN CREATE TO SELLER IS SENDING....");

            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * 销售方ERP进行退货单审核并通知到SCC,审核成功情况下,通知采购方生成采购退货单
         * @param data
         * @constructor
         */
        B2B_ORDER_RETURN_CONFIRM_FROM_SELLER: function (data) {
            logger.enter();
            var customerDB = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            var customerModel = require(__base + "/apps/customer/model")();
            //msgData = {"XSTHHead":[{"GUID":"001","BillNO":"001","IsAuditing":"1","IsClose":"0"}]};
            var returnDatas = msg.msgData.XSTHHead;
            async.mapSeries(returnDatas,
                function (returnData, mapcallback) {
                    var returnId = returnData.BILLNO;//SCC 退货单号也等价returnData.BillNO
                    var isApproved = returnData.IsAuditing == "1";
                    var isClosed = returnData.IsClose == "1";
                    if (isClosed || !isApproved) {
                        customerModel.returnStatusCheck(customerDB, returnId, 'CREATED', function (success) {
                            if (success) {
                                var status = "CLOSED";
                                customerModel.updateApplyReturnFromErp(customerDB, returnId, operatorId, status, function (err, result) {
                                    logger.debug("退货单" + returnId + "关闭")
                                })
                            } else {
                                logger.debug("该退货单已审核,不能关闭,清联系管理员");
                            }
                            mapcallback();
                        });
                    } else {
                        customerModel.returnStatusCheck(customerDB, returnId, 'CREATED', function (success) {
                            if (success) {
                                var status = "APPROVED";
                                customerModel.updateApplyReturnFromErp(customerDB, returnId, operatorId, status, function (err, result) {
                                    mapcallback(null, returnId);
                                });
                            } else {
                                logger.debug("该退货单不是待审核状态,请检查退货单状态或联系管理员");
                                mapcallback();
                            }

                        });
                    }
                },
                function (errs, resultArr) {
                    logger.debug("update return status ok returnid =" + JSON.stringify(resultArr));
                    // send result to buyer

                    if (__sccMode == "SM") {
                        logger.debug("NOW IN SM MODE RETURN CONFIEM NOT SEND TO BUYER");
                    } else {
                        //todo fix send return confirm to buyer
                        async.mapSeries(returnDatas,
                            function (returnData, mapcallback) {
                                var returnId = Number(returnData.BILLNO);
                                var returnInfo = {};
                                var returnDetails = [];
                                var sendCustoemrId = undefined;
                                async.series([

                                    function (done) {
                                        //数据库取出发送给采购方ERP的退货单数据
                                        db.listReturnInfoById(customerDB, returnId, function (err, result) {
                                            if (!err && result.length > 0) {
                                                returnInfo = result[0];
                                                db.listReturnDetailsById(customerDB, returnId, function (err, returnDetails) {
                                                    returnInfo.details = returnDetails;
                                                    done();
                                                });
                                            } else {
                                                done(err);
                                            }
                                        })
                                    },
                                    function (done) {
                                        db.getCustomerIdByOperatorId(customerDB, returnInfo.operatorId, function (err, result) {
                                            if (!err) {
                                                logger.debug(JSON.stringify(result));
                                                sendCustoemrId = result[0].customerId;
                                                done();
                                            } else {
                                                done(err);
                                            }
                                        });

                                    },
                                    function (done) {
                                        var customerId = sendCustoemrId;
                                        var msgType = "ORDER_RETURN_CONFIRM_TO_BUYER";
                                        var msgData = returnInfo;
                                        var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
                                        apiRobot.sendMsg(customerId, msgType, msgData, function sendMsgCallback(error, result) {
                                            if (error) {
                                                logger.error(error);
                                            }
                                        });
                                        done();
                                    }
                                ], function (err, result) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    mapcallback(null, result);
                                });
                            },
                            function (errs, resList) {
                                if (errs) {
                                    logger.error(errs);
                                }
                                logger.debug("RETURN CREATE AND CONFIRM SEND TO BUYER OK");
                            });


                    }

                }
            );
        },

        /**
         * 退货单确认通知到采购方,已经合并到ORDER_RETURN_CONFIRM_FROM_SELLER
         * @param data
         * @param callback
         * @constructor
         */
        B2B_ORDER_RETURN_CONFIRM_TO_BUYER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug(" ORDER RETURN CONFIRM TO SELLER IS SENDING....");
            logger.debug("SEE ORDER_RETURN_CONFIRM_FROM_SELLER");
            callback();
        },

        /**
         * 采购方ERP进行退货单发货并通过SCC通知到销售方ERP,sm模式下需登录SCC操作
         * @param data
         * @constructor
         */
        B2B_ORDER_RETURN_SHIP_FROM_BUYER: function (data) {
            var customerDB = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            var customerModel = require(__base + "/apps/customer/model")();
            var msgData = msg.msgData;
            var returnDatas = msgData.CGTHFHHead;
            var returnId = Number(returnDatas.BillNo);

            //检查退货单状态是否是待发货
            customerModel.returnStatusCheck(customerDB, returnId, 'APPROVED', function (success) {
                if (success) {
                    var shipTime = returnDatas.SHIPTIME;
                    var remark = returnDatas.REMARK;
                    async.series(
                        [
                            function (done) {
                                //更新地退货单状态到已发货
                                db.updateReturnShipFromERP(customerDB, returnId, "SHIPPED", shipTime, remark, function (err, result) {
                                    done(err, result);
                                });
                            },
                            function (done) {
                                //更新退货单详情状态
                                var returnItems = returnDatas.ITEMS;
                                db.updateShipReturnDetailsFromErp(customerDB, returnId, returnItems, function (err, result) {
                                    done(err, result);
                                });
                            },
                            function (done) {
                                //更新returnInfoGoodsMap
                                var returnItems = returnDatas.ITEMS;
                                var insertArrlist = [];
                                underscore.map(returnItems, function (item) {
                                    var itemlist = [];
                                    itemlist.push(returnId);
                                    itemlist.push(item.goodsId);
                                    itemlist.push(item.quantity);
                                    if (insertArrlist.length > 0) {
                                        underscore.map(insertArrlist, function (obj) {
                                            if (obj[1] == itemlist[1]) {
                                                obj[2] += itemlist[2];
                                            } else {
                                                insertArrlist.push(itemlist);
                                            }
                                        });
                                    } else {
                                        insertArrlist.push(itemlist);
                                    }

                                });
                                db.updateShipReturnGoodsMap(customerDB, insertArrlist, function (err, result) {
                                    done(err, result);
                                });
                            }
                        ],
                        function (error, results) {
                            if (error) {
                                logger.error(error);
                            }
                            logger.debug(JSON.stringify(results));
                            logger.debug("退货单发货returnId=" + returnId);

                            //todo ORDER_RETURN_SHIP_TO_SELLER
                            //var sendCustomerId =  "";
                            //var customerId = sendCustomerId;
                            //var msgType = "ORDER_RETURN_SHIP_TO_SELLER";
                            //var msgData = msg.msgData;
                            //var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
                            //apiRobot.sendMsg(customerId, msgType, msgData, function sendMsgCallback(error, result) {
                            //    if(error){logger.error(err);}
                            //});
                        }
                    );


                } else {
                    logger.debug("退货单状态不是待发货,请检查提交数据或联系系统管理员");
                }
            });
        },

        /**
         *
         * 退货单发货通知到销售,已经合并到ORDER_RETURN_SHIP_FROM_BUYER OR SCC
         * @param data
         * @param callback
         * @constructor
         */
        B2B_ORDER_RETURN_SHIP_TO_SELLER: function (data, callback) {
            logger.enter();
            logger.debug(__sccMode);
            logger.debug(" ORDER RETURN SHIP TO SELLER IS SENDING....");
            callback();
            sendDataToBuyerSeller(data, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },


        /**
         * 销售方通知SCC退货已经收货,不再通知到采购方ERP
         * @param data
         * @constructor
         */
        B2B_ORDER_RETURN_RECEIVE_FROM_SELLER: function (data) {
            var customerDB = data.customerDB;
            var msg = data.msg;
            var operatorId = data.operatorRobotId;
            var customerModel = require(__base + "/apps/customer/model")();
            var msgData = msg.msgData;
            var returnDatas = msgData.FhdzkHead;
            var returnDetails = msgData.Fhdzk;
            async.mapSeries(returnDatas,
                function (returnData, mapcallback) {
                    var returnId = Number(returnData.BILLNO);
                    var details = [];
                    underscore.map(returnDetails, function (obj) {
                        if (obj.LSH == returnId) {
                            details.push(obj);
                        }
                    });
                    customerModel.returnStatusCheck(customerDB, returnId, 'SHIPPED', function (success) {
                        if (success) {
                            var receiveTime = returnData.BILLDATE + returnData.BILLTIME;
                            var remark = returnData.NOTES;
                            async.series(
                                [
                                    function (done) {
                                        //更新地退货单状态到已收货
                                        db.updateReturnReceiveFromERP(customerDB, returnId, "DELIVERED", receiveTime, remark, function (err, result) {
                                            done(err, result);
                                        });
                                    },
                                    function (done) {
                                        async.mapSeries(details,
                                            function (obj, mapcallback) {
                                                db.getGoodsIdbyGoodsNo(customerDB, obj.HH, function (goodsId) {
                                                    obj.goodsId = goodsId;
                                                    mapcallback();
                                                })
                                            },
                                            function (err, result) {
                                                done(err, result);
                                            }
                                        )
                                    },
                                    function (done) {
                                        //更新退货单详情状态
                                        var returnItems = details;
                                        db.updateReceiveReturnDetailsFromErp(customerDB, returnId, returnItems, function (err, result) {
                                            done(err, result);
                                        });
                                    },
                                    function (done) {
                                        //更新returnInfoGoodsMap
                                        var returnItems = details;
                                        var insertArrlist = [];
                                        underscore.map(returnItems, function (item) {
                                            var itemlist = [];
                                            itemlist.push(returnId);
                                            itemlist.push(Number(item.goodsId));
                                            itemlist.push(Number(item.SL));
                                            if (insertArrlist.length > 0) {
                                                underscore.map(insertArrlist, function (obj) {
                                                    if (obj[1] == itemlist[1]) {
                                                        obj[2] += itemlist[2];
                                                    } else {
                                                        insertArrlist.push(itemlist);
                                                    }
                                                });
                                            } else {
                                                insertArrlist.push(itemlist);
                                            }

                                        });
                                        db.updateReceiveReturnGoodsMap(customerDB, insertArrlist, function (err, result) {
                                            done(err, result);
                                        });
                                    }
                                ],
                                function (error, results) {
                                    if (error) {
                                        logger.error(error);
                                    }
                                    logger.debug(JSON.stringify(results));
                                    logger.debug("退货单returnId=" + returnId + "已收货");
                                    mapcallback(null, "退货单returnId=" + returnId + "已收货");
                                });
                        } else {
                            logger.debug("退货单状态不是待收货,请检查提交数据或联系系统管理员");
                            mapcallback();
                        }
                    });
                },
                function (errs, result) {
                    if (errs) {
                        logger.error(errs);
                    } else {
                        logger.debug("退货收货完成" + JSON.stringify(result));
                    }
                }
            );

            //"FhdzkHead": [{
            //    "BILLNO": "101SZQ1510220253",
            //    "BILLDATE": "2015-10-22T00:00:00",
            //    "BILLTIME": "13:05:54",
            //    "ORDERBILLNO": "003",
            //    "ORDERGUID": "1417834129879",
            //    "NOTES": "调拨生成",
            //    "FHRY": "MANAGE",
            //    "FHRQ": "",
            //    "CUSTOMGUID": null,
            //    "CUSTOMNAME": null
            //}],
            //    "Fhdzk": [{
            //    "LSH": "101SZQ1510220253",
            //    "DH": "dh121097",
            //    "HH": "1220102034",
            //    "PH1": "bn1297",
            //    "PCDH": "bnum121",
            //    "PH1_XQ": "2016-09-09",
            //    "SCRQ": "2015-09-09",
            //    "HTBH": "orderdetailId",
            //    "SL": "10",
            //    "BZ": "备注",
            //    "ReportURL": "批次检验报告URL",
            //    "MonitorCode": "监管码"
            //}]

            //var returnDatas = msgData.XSTHSHHead;
            //var returnId = Number(returnDatas.BillNo);
            //{"XSTHSHHead":
            //    {
            //        "GUID": "018",
            //        "BillNo": "018",
            //        "RECEIVETIME": "2016-03-03 12-22-20",
            //        "REMARK": "shipremark",
            //        "ITEMS": [
            //        {
            //            "guid": "detailshipguid",
            //            "goodsId": "724",
            //            "batchNo":"batNO1",
            //            "drugESC": "drugesctest1",
            //            "batchNum": "batchNum1",
            //            "inspectReportURL": "url:123",
            //            "goodsProduceDate": "2016-01-01",
            //            "goodsValidDate": "20116-10-10",
            //            "detailNo": 2,
            //            "quantity": 1,
            //            "remark": "detailreamrk1"
            //        },
            //        {
            //          //....
            //        }
            //    ]
            //    }
            //},
            //customerModel.returnStatusCheck(customerDB, returnId, 'SHIPPED', function (success) {
            //    if (success) {
            //        var receiveTime = returnDatas.RECEIVETIME;
            //        var remark = returnDatas.REMARK;
            //        async.series(
            //            [
            //                function (done) {
            //                    //更新地退货单状态到已收货
            //                    db.updateReturnReceiveFromERP(customerDB, returnId, "DELIVERED", receiveTime, remark, function (err, result) {
            //                        done(err, result);
            //                    });
            //                },
            //                function (done) {
            //                    //更新退货单详情状态
            //                    var returnItems = returnDatas.ITEMS;
            //                    db.updateReceiveReturnDetailsFromErp(customerDB, returnId, returnItems, function (err, result) {
            //                        done(err, result);
            //                    });
            //                },
            //                function (done) {
            //                    //更新returnInfoGoodsMap
            //                    var returnItems = returnDatas.ITEMS;
            //                    var insertArrlist = [];
            //                    underscore.map(returnItems, function (item) {
            //                        var itemlist = [];
            //                        itemlist.push(returnId);
            //                        itemlist.push(item.goodsId);
            //                        itemlist.push(item.quantity);
            //                        if (insertArrlist.length > 0) {
            //                            underscore.map(insertArrlist, function (obj) {
            //                                if (obj[1] == itemlist[1]) {
            //                                    obj[2] += itemlist[2];
            //                                } else {
            //                                    insertArrlist.push(itemlist);
            //                                }
            //                            });
            //                        } else {
            //                            insertArrlist.push(itemlist);
            //                        }
            //
            //                    });
            //                    db.updateReceiveReturnGoodsMap(customerDB, insertArrlist, function (err, result) {
            //                        done(err, result);
            //                    });
            //                }
            //            ],
            //            function (error, results) {
            //                if (error) {
            //                    logger.error(error);
            //                }
            //                logger.debug(JSON.stringify(results));
            //                logger.debug("退货单returnId=" + returnId + "已收货");
            //            });
            //    } else {
            //        logger.debug("退货单状态不是待收货,请检查提交数据或联系系统管理员");
            //    }
            //});
        }
    };


    /**
     *  send data to buyer ERP here
     * @param data
     * @param callback
     */
    function sendDataToBuyerSeller(data, callback) {
        var customerId = data.customerId;
        var msgType = data.msgType;
        var msgData = data.msgData;
        var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
        apiRobot.sendMsg(customerId, msgType, msgData, function sendMsgCallback(error, result) {
            callback(error, result);
        });
    }


    return apiModule;
};