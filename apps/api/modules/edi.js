/***************************************************************** 青岛雨人软件有限公司@2016版权所有
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
var logger      = __logService;
var sprintf     = require("sprintf-js").sprintf;
var model       = require('./../../edi/v1/model');
var cacheService = require(__base + '/services/cacheService.js')();


module.exports = function () {
    /**
     * Service
     */
    var logger = __logService;
    var db = __dbService;
    var underscore = require("underscore");
    var moment = require('moment');
    var async = require('async');
    var redisCli = __redisClient;
    var cloudDB = __cloudDBName;
    var ApiRobot = require(__base + "/modules/apiRobot");
    var isErpMsgCheckStrict = __isErpMsgCheckStrict;
    var version = __erpApiVersion;
    var cacheService = require(__base + '/services/cacheService.js')();

    var apiModule = {
        /**
         * 保存由客户erp传递到scc的订单到BUYER库
         * @param data
         * @constructor
         */
        EDI_ORDER_SAVE_INTO_BUYER: function (data) {
            logger.enter();
            logger.debug(JSON.stringify(data));
            //在下面的方法里面执行存库操作
        },

        /**
         * 订单创建的edi数据交换接口
         * @param data
         * @constructor
         */
        EDI_ORDER_CREATE_FROM_BUYER: function (data) {
            var msgTypgIn = "EDI_ORDER_CREATE_FROM_BUYER";
            var msgTypgOut = "EDI_ORDER_CREATE_TO_SELLER";
            var msgTypgErr = "EDI_ERR_REPORT";
            logger.enter();
            logger.debug(JSON.stringify(data));
            var msg = data.msg;
            var msgId = data.msg.msgId;
            var userId = data.userId;
            var OriginInfo = msg.msgData;
            var errMsgs = [];
            var errmsg = undefined;

            var oriOrders = OriginInfo.STOCKORDERFORM;
            var oriDetails = OriginInfo.STOCKORDERFORMDETAIL;
            logger.debug("msgId=" + msgId);
            logger.debug("STOCKORDERFORM=" + JSON.stringify(oriOrders));
            logger.debug("STOCKORDERFORMDETAIL=" + JSON.stringify(oriDetails));
            underscore.map(oriOrders, function (item) {
                item.orderDetails = [];
                underscore.map(oriDetails, function (details) {
                    if (item.GUID == details.STOCKORDERFORMGUID) {
                        item.orderDetails.push(details);
                    }
                })
            });
            async.mapSeries(
                oriOrders,
                function (item, mapCallback) {
                    var orderInfo = {};
                    var orderTotal = 0;
                    var orderDetail = [];
                    var buyerName = undefined;
                    var sellerName = undefined;
                    var sellerId = undefined;
                    var buyerCustomerDB = undefined;
                    var sellerCustomerDB = undefined;
                    var sendData = undefined;
                    async.series([
                            /**
                             * 通过接口userId，找到buyerCustomerDB
                             * @param done
                             */
                                function (done) {
                                db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, userId, function (err, results) {
                                    if (err) {
                                        errmsg = "userId=" + userId + " get CUSTOMER_DB ERR,该客户在SCC上没有注册并构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        buyerName = results[0].buyerName;
                                        var dbSuffix = results[0].dbSuffix;
                                        buyerCustomerDB = __customerDBPrefix + "_" + dbSuffix;
                                        logger.debug("buyerCustomerDB=" + buyerCustomerDB);
                                        done();
                                    }
                                });
                            },
                            /**
                             * 将客户erp传递过来的订单信息 存入buyerCustomerDB
                             * save data to BUYER
                             * @param done
                             */
                                function (done) {
                                saveOrderIntoBuyer(buyerCustomerDB, item, function (err, result) {
                                    if (err) {
                                        errmsg = "userId=" + userId + " save ORDER ERR,保存客户erp订单到buyer 失败";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        done();
                                    }
                                });
                            },
                            /**
                             * 通过buyerCustomerDB下的clientSellerInfo，拿到enterpriseId和licenseNO
                             * 进而拿到sellerCustomerDB
                             * @param done
                             */
                                function (done) {
                                var erpCode = item.SUPPLIERCODE;
                                db.listSupplierInfo(buyerCustomerDB, erpCode, function (err, results) {
                                    if (err) {
                                        errmsg = "erpCode=" + erpCode + "get ClientSellerInfo ERR，该供应商没有在SCC注册并构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        if (underscore.isEmpty(results)) {
                                            errmsg = "请先行同步" + buyerCustomerDB + ".ClientSellerInfo,该供应商数据库没有同步该询价企业数据";
                                            errMsgs.push(errmsg);
                                            done(errmsg);
                                            return;
                                        }
                                        var sellerInfo = results[0];
                                        sellerId = sellerInfo.enterpriseId;
                                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, sellerInfo.enterpriseId, function (errs, cloudInfos) {
                                            sellerName = cloudInfos[0].buyerName;
                                            sellerCustomerDB = __customerDBPrefix + "_" + cloudInfos[0].dbSuffix;
                                            logger.debug("sellerCustomerDB=" + sellerCustomerDB);
                                            done();
                                        });
                                    }
                                });
                            },
                            /**
                             * save data to seller
                             * @param done
                             */
                                function (done) {
                                var buyerId = userId;
                                saveOrderIntoSeller(buyerCustomerDB, sellerCustomerDB, item.GUID, buyerId, function (err, result) {
                                    if (err) {
                                        errmsg = "userId=" + userId + " save ORDER ERR,保存客户erp订单到buyer 失败";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        done();
                                    }
                                });
                            },
                            /**
                             * convert orderDetails
                             * @param done
                             */
                                function (done) {
                                async.mapSeries(
                                    item.orderDetails,
                                    function (detail, mapCallback) {
                                        orderTotal += Number(detail.AMOUNTTAX);
                                        var detailObj = {
                                            STOCKORDERFORMDETAILGUID: detail.GUID,
                                            DETAILNO: detail.DETAILNO,
                                            ORDERID: item.GUID,
                                            SOLDPRICE: detail.INPRICE,
                                            QUANTITY: detail.QUANTITY,
                                            AMOUNT: detail.AMOUNTTAX,
                                            REMARK: item.REMARK
                                        };
                                        convertSellerGoodsNo(buyerCustomerDB, sellerCustomerDB, detail.PZWH, detail.HH, function (err, result) {
                                            if (err) {
                                                errmsg = "PZWH = " + detail.PZWH + " GET GOODSNO ERR，该批准文号商品没有同步到SCC，订单无法继续同步";
                                                errMsgs.push(errmsg);
                                                mapCallback(errmsg)
                                            } else {
                                                //detailObj.goodsNo = goodsNo;
                                                detailObj.GOODSID = result.goodsNo;
                                                orderDetail.push(detailObj);
                                                mapCallback(null, result.goodsNo);
                                            }
                                        });
                                    },
                                    function (errs, results) {
                                        if (errs) {
                                            logger.error(JSON.stringify(errs));
                                            errmsg = "orderNo =" + item.GUID + " CONVERT GOODSNO ERR，该订单号的商品数据转化失败";
                                            errMsgs.push(errmsg);
                                            done(errmsg);
                                        } else {
                                            logger.debug("orderTotal=" + orderTotal);
                                            orderInfo.TOTAL = orderTotal;
                                            done();
                                        }
                                    }
                                );

                            },
                            /**
                             * convert orderInfo
                             * @param done
                             */
                                function (done) {
                                orderInfo.CONSIGNEENAME = item.EMPLOYEENAME;//收货人 = 采购订单业务员姓名
                                orderInfo.CONSIGNEEADDRESS = item.CUSTOMERADDER;//收货地址
                                orderInfo.CONSIGNEEMOBILENUM = item.EMPLOYEEMOBILE || "";
                                orderInfo.STATUS = "CREATED";//订单状态
                                orderInfo.REMARK = item.REMARK;//订单备注
                                orderInfo.CONFIRMDATE = item.BILLDATE;//订单单据日期
                                orderInfo.STOCKORDERFORMGUID = item.GUID;
                                convertClientGuid(__cloudDBName, sellerCustomerDB, userId, function (err, clientCode) {
                                    if (err) {
                                        orderInfo.CLIENTGUID = null;
                                        errmsg = "userId=" + userId + "GET CLIENT CODE ERR，该客户在对应数据库" + sellerCustomerDB + "中没有同步ERP信息erpCode"
                                        logger.error(errmsg);
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        //orderInfo.clientGuid = clientCode;
                                        orderInfo.CLIENTGUID = clientCode;
                                        done();
                                    }
                                });
                            },
                            /**
                             * form send Info
                             * @param done
                             */
                                function (done) {
                                var msgData = {
                                    ORDER: {
                                        ORDERINFO: orderInfo,
                                        ORDERDETAIL: orderDetail
                                    }
                                };
                                sendData = {
                                    msgId: msgId,
                                    customerId: sellerId,
                                    msgType: msgTypgOut,
                                    msgData: msgData
                                };
                                logger.debug("SEND DATA = " + JSON.stringify(sendData));
                                done();
                            }
                        ],
                        function (errs, results) {
                            if (errs) {
                                logger.error(JSON.stringify(errs));
                                mapCallback(errs);
                            } else {
                                mapCallback(null, sendData);
                            }
                        }
                    );
                },
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        var msgData = {
                            errMsg: errMsgs
                        };
                        var sendData = {
                            msgId: msgId,
                            customerId: userId,
                            msgType: msgTypgErr,
                            msgData: msgData
                        };
                        sendDataOut(sendData, function (err, results) {
                            if (err) {
                                logger.error("send msg err,msg=" + JSON.stringify(sendData) + "err=" + err);
                            } else {
                                logger.debug("send msg success,msg=" + JSON.stringify(sendData));
                            }
                        });
                    } else {
                        logger.debug(JSON.stringify(results));
                        async.mapSeries(
                            results,
                            function (sendData, mapCallback) {
                                sendDataOut(sendData, function (err, results) {
                                    if (err) {
                                        mapCallback(null, "send msg err,msg=" + JSON.stringify(sendData) + "err=" + err);
                                    } else {
                                        mapCallback(null, "send msg success,msg=" + JSON.stringify(sendData));
                                    }
                                })
                            },
                            function (errs, results) {
                                if (errs) {
                                    logger.error(JSON.stringify(errs));
                                } else {
                                    logger.debug(JSON.stringify(results));
                                    logger.debug("EDI_ORDER_CREATE_FROM_BUYER excute done")

                                }

                            }
                        )

                    }
                }
            );

        },

        /**
         * 订单审核的edi数据交换接口
         * @param data
         * @constructor
         */
        EDI_ORDER_CONFIRM_FROM_SELLER: function (data) {
            var msgTypgIn = "EDI_ORDER_CONFIRM_FROM_SELLER";
            var msgTypgOut = "EDI_ORDER_CONFIRM_TO_BUYER";
            var msgTypgErr = "EDI_ERR_REPORT";
            logger.enter();
            var msg = data.msg;
            var msgId = msg.msgId;
            var userId = data.userId;
            var OriginInfo = msg.msgData;
            var errMsgs = [];
            var errmsg = undefined;
            var approvedData = OriginInfo.XSDDHead;

            async.mapSeries(
                approvedData,
                function (item, mapCallback) {
                    var orderId = item.BILLNO;
                    var status = "";
                    if (item.ISAUDITING == 1) {
                        status = "APPROVED";
                    }
                    if (item.ISCLOSE == 1) {
                        status = "CLOSED";
                    }
                    logger.debug(status);
                    //var clientCode = item.CustomGuid;
                    var clientCode = item.CUSTOMGUID;

                    var buyerName = undefined;
                    var sellerName = undefined;
                    var buyerId = undefined;
                    var buyerCustomerDB = undefined;
                    var sellerCustomerDB = undefined;
                    var sendData = undefined;
                    async.series([
                            function (done) {
                                //通过接口userId，找到sellerCustomerDB
                                db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, userId, function (err, results) {
                                    if (err) {
                                        errmsg = "userId=" + userId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        sellerName = results[0].buyerName;
                                        var dbSuffix = results[0].dbSuffix;
                                        sellerCustomerDB = __customerDBPrefix + "_" + dbSuffix;
                                        logger.debug("sellerCustomerDB=" + sellerCustomerDB);
                                        done();
                                    }
                                });
                            },
                            function (done) {
                                //通过sellerCustomerDB下的clientBuyerInfo和clientCode，拿到enterpriseId和licenseNO
                                //进而拿到buyerCustomerDB;
                                var erpCode = clientCode;
                                db.listBuyerInfo(sellerCustomerDB, erpCode, function (err, results) {
                                    if (err) {
                                        errmsg = "erpCode=" + erpCode + "get ClientSellerInfo ERR,该客户没有在SCC上注册并构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        if (underscore.isEmpty(results)) {
                                            errmsg = "请先行同步ClientBuyerInfo" + sellerCustomerDB + "该订单无法继续同步";
                                            errMsgs.push(errmsg);
                                            done(errmsg);
                                            return;
                                        }
                                        var buyerInfo = results[0];
                                        buyerId = buyerInfo.enterpriseId;
                                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, buyerInfo.enterpriseId, function (errs, cloudInfos) {
                                            buyerName = cloudInfos[0].buyerName;
                                            buyerCustomerDB = __customerDBPrefix + "_" + cloudInfos[0].dbSuffix;
                                            logger.debug("buyerCustomerDB=" + buyerCustomerDB);
                                            done();
                                        });
                                    }
                                });
                            },
                            function (done) {
                                var msgData = {
                                    ORDERUPDATE: {
                                        ORDERID: orderId,
                                        STATUS: status
                                    }
                                };
                                sendData = {
                                    msgId: msgId,
                                    customerId: buyerId,
                                    msgType: msgTypgOut,
                                    msgData: msgData
                                };
                                logger.debug("SEND DATA = " + JSON.stringify(sendData));
                                done();
                            }
                        ],
                        function (errs, results) {
                            if (errs) {
                                logger.error(JSON.stringify(errs));
                                mapCallback(errs);
                            } else {
                                mapCallback(null, sendData);
                            }
                        }
                    );
                },
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        var msgData = {
                            errMsg: errMsgs
                        };
                        var sendData = {
                            msgId: msgId,
                            customerId: userId,
                            msgType: msgTypgErr,
                            msgData: msgData
                        };
                        sendDataOut(sendData, function (err, results) {
                            if (err) {
                                logger.error("send msg err,msg=" + JSON.stringify(sendData) + "err=" + err);
                            } else {
                                logger.debug("send msg success,msg=" + JSON.stringify(sendData));
                            }
                        })
                    } else {
                        logger.debug(JSON.stringify(results));
                        async.mapSeries(
                            results,
                            function (sendData, mapCallback) {
                                sendDataOut(sendData, function (err, results) {
                                    if (err) {
                                        mapCallback(null, "send msg err,msg=" + JSON.stringify(sendData) + "err=" + err);
                                    } else {
                                        mapCallback(null, "send msg success,msg=" + JSON.stringify(sendData));
                                    }
                                })
                            },
                            function (errs, results) {
                                if (errs) {
                                    logger.error(JSON.stringify(errs));
                                } else {
                                    logger.debug(JSON.stringify(results));
                                    logger.debug("EDI_ORDER_CONFIRM_TO_BUYER excute done")

                                }

                            }
                        )

                    }

                }
            );
        },

        /**
         * 订单发货的edi数据交换接口
         * @param data
         * @constructor
         */
        EDI_ORDER_SHIP_FROM_SELLER: function (data) {
            var msgTypgIn = "EDI_ORDER_SHIP_FROM_SELLER";
            var msgTypgOut = "EDI_ORDER_SHIP_TO_BUYER";
            var msgTypgErr = "EDI_ERR_REPORT";
            logger.enter();

            var msg = data.msg;
            var msgId = msg.msgId;
            var userId = data.userId;
            var OriginInfo = msg.msgData;
            var errMsgs = [];
            var errmsg = undefined;
            var shipDatas = OriginInfo.FHDZK;
            var shipCommon = OriginInfo.FHDZKHEAD;
            var monitorDetail = OriginInfo.MONITORDETAIL;

            var buyerName = undefined;
            var sellerName = undefined;
            var sellerInfo = undefined;
            var sellerUnicode = undefined;
            var sellerPackageQty = undefined;
            var buyerId = undefined;
            var buyerCustomerDB = undefined;
            var sellerCustomerDB = undefined;
            var sendData = undefined;
            var sendArr = [];
            var sellerSaveTimes = 0;
            var buyerSaveTimes = 0;
            async.mapSeries(
                shipDatas,
                function (shipData, mapCallback) {
                    var sendObj = {
                        "LSH": shipData.LSH,
                        "DH": shipData.DH,
                        "KDRQ": shipData.KDRQ,
                        "SUPPLIERCODE": "",//待更新
                        "HH": "",//待更新
                        "SJ": shipData.SJ,
                        "SL": shipData.QUANTITY,
                        "PH1": shipData.BATCHNO,
                        "PCDH": shipData.BATCHNUM,
                        "PH1_XQ": shipData.GOODSVALIDDATE,
                        "SCRQ": shipData.GOODSPRODUCEDATE,
                        "BZ": shipData.REMARK,
                        "SBZ1": shipData.INSPECTREPORTURL,
                        "TYBZ": shipData.TYBZ,
                        "SBZ2": shipData.SBZ2,
                        "MONITORDETAIL": monitorDetail
                    };
                    async.series([
                            function (done) {
                                //通过接口userId，找到sellerCustomerDB
                                db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, userId, function (err, results) {
                                    if (err) {
                                        errmsg = "userId=" + userId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        sellerInfo = results[0];
                                        sellerName = results[0].buyerName;
                                        var dbSuffix = results[0].dbSuffix;
                                        sellerCustomerDB = __customerDBPrefix + "_" + dbSuffix;
                                        logger.debug("sellerCustomerDB=" + sellerCustomerDB);
                                        done();
                                    }
                                });
                            },
                            //save data to seller edi tables
                            function (done) {
                                saveSellerShipInfos(sellerCustomerDB, shipCommon, shipData, monitorDetail, sellerSaveTimes, function (err, result) {
                                    if (!err) {
                                        sellerSaveTimes++;
                                        sellerUnicode = result.unicode;
                                        sellerPackageQty = result.sellerPackageQty;
                                    }
                                    done(err, result);
                                });
                            },
                            //list buyer info by erpcode;
                            function (done) {
                                var erpCode = shipData.CLIENTCODE;
                                db.listBuyerInfo(sellerCustomerDB, erpCode, function (err, results) {
                                    if (err) {
                                        errmsg = "erpCode=" + erpCode + "get ClientSellerInfo ERR,该客户没有在SCC上注册并构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        if (underscore.isEmpty(results)) {
                                            errmsg = "请先行同步ClientBuyerInfo" + sellerCustomerDB + "该订单无法继续同步";
                                            errMsgs.push(errmsg);
                                            done(errmsg);
                                            return;
                                        }
                                        var buyerInfo = results[0];
                                        buyerId = buyerInfo.enterpriseId;
                                        if(underscore.isNull(buyerId)){
                                            errmsg ="ClientBuyerInfo 没有匹配到"+erpCode+"对应的enterpriseId"
                                            errMsgs.push(errmsg);
                                            done(errmsg);
                                            return;
                                        }
                                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, buyerId, function (errs, cloudInfos) {
                                            buyerName = cloudInfos[0].buyerName;
                                            buyerCustomerDB = __customerDBPrefix + "_" + cloudInfos[0].dbSuffix;
                                            logger.debug("buyerCustomerDB=" + buyerCustomerDB);
                                            done();
                                        });
                                    }
                                });
                            },
                            //save data to buyer edi tables
                            function (done) {
                                var sellerInfo = {
                                    sellerId: userId,
                                    unicode: sellerUnicode,
                                    sellerPackageQty: sellerPackageQty
                                };
                                saveBuyerShipInfos(buyerCustomerDB, sellerInfo, shipCommon, shipData, monitorDetail, buyerSaveTimes, function (err, result) {
                                    if (!err) {
                                        buyerSaveTimes++;
                                    }
                                    done(err, result);
                                })
                            },
                            //update supplierCode in sendObj
                            function (done) {
                                db.listSupplierInfoByLicenseNo(buyerCustomerDB, sellerInfo.businessLicense, function (err, results) {
                                    if (err || underscore.isEmpty(results)) {
                                        errmsg = "businessLicense=" + sellerInfo.businessLicense + "get ClientSellerInfo ERR,该客户没有在SCC上构建完整数据库信息，请先同步信息";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        sendObj.SUPPLIERCODE = results[0].erpCode;
                                        done();
                                    }
                                })
                            },
                            //update HH in sendObj
                            function (done) {
                                convertBuyerGoodsNo(buyerCustomerDB, sellerCustomerDB, "", shipData.HH, function (err, result) {
                                    if (err) {
                                        errmsg = "HH = " + shipData.HH + " GET GOODSNO ERR，该商品没有同步到SCC，订单无法继续同步";
                                        errMsgs.push(errmsg);
                                        mapCallback(errmsg)
                                    } else {
                                        sendObj.HH = result.goodsNo;
                                        sendArr.push(sendObj);
                                        done();
                                    }

                                })
                            }
                        ],
                        function (errs, results) {
                            if (errs) {
                                logger.error(JSON.stringify(errs));
                                var msgData = {
                                    errMsg: errMsgs
                                };
                                sendData = {
                                    msgId: msgId,
                                    customerId: userId,
                                    msgType: msgTypgErr,
                                    msgData: msgData
                                };
                            } else {
                                var msgData = {
                                    T_HEADMOVE: sendArr
                                };
                                sendData = {
                                    msgId: msgId,
                                    customerId: buyerId,
                                    msgType: msgTypgOut,
                                    msgData: msgData
                                };
                            }
                            mapCallback(null, sendData);
                        }
                    );
                },
                function (errs, results) {
                    logger.debug(JSON.stringify(sendData));
                    sendDataOut(sendData, function (err, results) {
                        if (err) {
                            logger.error("send msg err,msg=" + JSON.stringify(sendData) + "err=" + err);
                        } else {
                            logger.debug("send msg success,msg=" + JSON.stringify(sendData));
                        }
                    })
                }
            );
        },

        /**
         * 订单收货的edi数据交换接口
         * @param data
         * @constructor
         */
        EDI_ORDER_SHIP_RECEIVE_FROM_BUYER: function (data) {
            var msgTypgIn = "EDI_ORDER_SHIP_RECEIVE_FROM_BUYER";
            var msgTypgOut = "EDI_ORDER_SHIP_RECEIVE_TO_SELLER";
            var msgTypgErr = "EDI_ERR_REPORT";
            logger.enter();
            var msg = data.msg;
            var msgId = msg.msgId;
            var userId = data.userId;
            var OriginInfo = msg.msgData;
            var errMsgs = [];
            var errmsg = undefined;

            var receiveDatas = OriginInfo.RKDHEADZK;
            logger.debug("rkdheadzk=" + JSON.stringify(receiveDatas));
            var buyerName = undefined;
            var sellerName = undefined;
            var sellerId = undefined;
            var buyerCustomerDB = undefined;
            var sellerCustomerDB = undefined;
            var sendData = undefined;
            var receiveArr = [];
            async.mapSeries(
                receiveDatas,
                function (item, mapCallback) {
                    async.series([
                            function (done) {
                                //通过接口userId，找到buyerCustomerDB
                                db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, userId, function (err, results) {
                                    if (err) {
                                        errmsg = "userId=" + userId + " get CUSTOMER_DB ERR,该客户在SCC上没有注册并构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        buyerName = results[0].buyerName;
                                        var dbSuffix = results[0].dbSuffix;
                                        buyerCustomerDB = __customerDBPrefix + "_" + dbSuffix;
                                        logger.debug("buyerCustomerDB=" + buyerCustomerDB);
                                        done();
                                    }
                                });
                            },
                            function (done) {
                                //通过buyerCustomerDB下的clientSellerInfo，拿到enterpriseId和licenseNO
                                //进而拿到sellerCustomerDB;de;
                                var erpCode = item.SUPPLIERCODE;
                                db.listSupplierInfo(buyerCustomerDB, erpCode, function (err, results) {
                                    if (err) {
                                        errmsg = "erpCode=" + erpCode + "get ClientSellerInfo ERR，该供应商没有在SCC注册并构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        if (underscore.isEmpty(results)) {
                                            errmsg = "请先行同步" + buyerCustomerDB + ".ClientSellerInfo,该供应商数据库没有同步该询价企业数据";
                                            errMsgs.push(errmsg);
                                            done(errmsg);
                                            return;
                                        }
                                        var sellerInfo = results[0];
                                        sellerId = sellerInfo.enterpriseId;
                                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, sellerInfo.enterpriseId, function (errs, cloudInfos) {
                                            sellerName = cloudInfos[0].buyerName;
                                            sellerCustomerDB = __customerDBPrefix + "_" + cloudInfos[0].dbSuffix;
                                            logger.debug("sellerCustomerDB=" + sellerCustomerDB);
                                            done();
                                        });
                                    }
                                });
                            },
                            function (done) {
                                //step1 convert orderDetails
                                async.mapSeries(
                                    item.RKDZK,
                                    function (detail, mapCallback) {
                                        var detailObj = {
                                            "HTBH": detail.HTBH,
                                            "SCCRECEIVEQUANTITY": detail.SSSL
                                        };
                                        receiveArr.push(detailObj);
                                        mapCallback();
                                    },
                                    function (errs, results) {
                                        done();
                                    }
                                );

                            },
                            function (done) {
                                //step3 form send Info
                                var msgData = {
                                    FHDZK: receiveArr
                                };
                                sendData = {
                                    msgId: msgId,
                                    customerId: sellerId,
                                    msgType: msgTypgOut,
                                    msgData: msgData
                                };

                                done();
                            }
                        ],
                        function (errs, results) {
                            if (errs) {
                                logger.error(JSON.stringify(errs));
                                var msgData = {
                                    errMsg: errMsgs
                                };
                                sendData = {
                                    msgId: msgId,
                                    customerId: userId,
                                    msgType: msgTypgErr,
                                    msgData: msgData
                                };
                                mapCallback();
                            } else {
                                mapCallback();
                            }
                        }
                    );
                },
                function (errs, results) {
                    logger.debug("SEND DATA = " + JSON.stringify(sendData));
                    sendDataOut(sendData, function (err, results) {
                        if (err) {
                            logger.error("send msg err,msg=" + JSON.stringify(sendData) + "err=" + err);
                        } else {
                            logger.debug("send msg success,msg=" + JSON.stringify(sendData));
                        }
                    });

                }
            );


        },

        /**
         * 订单退货的edi数据交换接口
         * @param data
         * @constructor
         */
        EDI_ORDER_RETURN_CREATE_FROM_BUYER: function (data) {
            var msgTypgIn = "EDI_ORDER_RETURN_CREATE_FROM_BUYER";
            var msgTypgOut = "EDI_ORDER_RETURN_CREATE_TO_SELLER";
            var msgTypgErr = "EDI_ERR_REPORT";
            logger.enter();
            var msg = data.msg;
            var msgId = msg.msgId;
            var userId = data.userId;
            var OriginInfo = msg.msgData;
            var errMsgs = [];
            var errmsg = undefined;
            var buyerName = null;
            var buyerCustomerDB = null;

            var oriReturns = OriginInfo.STOCKRETURNAPPROVE;
            var oriDetails = OriginInfo.STOCKRETURNAPPROVEDETAIL;

            saveReturnInfosToDB(userId, oriReturns, oriDetails, function (err, result) {
                if (err) {
                    logger.error(JSON.stringify(err));
                }
                logger.debug("returnInfo saved to DB done" + result);
            });
            async.mapSeries(
                oriReturns,
                function (item, mapCallback) {
                    var returnInfo = {};
                    var returnDetail = [];
                    var buyerName = undefined;
                    var buyerInfo = undefined;
                    var sellerName = undefined;
                    var sellerId = undefined;
                    var buyerCustomerDB = undefined;
                    var sellerCustomerDB = undefined;
                    var sendData = undefined;
                    async.series([
                            function (done) {
                                //通过接口userId，找到buyerCustomerDB
                                db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, userId, function (err, results) {
                                    if (err || results.length == 0) {
                                        errmsg = "userId=" + userId + " get CUSTOMER_DB ERR,该客户在SCC上没有注册并构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        buyerInfo = results[0];
                                        buyerName = results[0].buyerName;
                                        var dbSuffix = results[0].dbSuffix;
                                        buyerCustomerDB = __customerDBPrefix + "_" + dbSuffix;
                                        logger.debug("buyerCustomerDB=" + buyerCustomerDB);
                                        done();
                                    }
                                });
                            },
                            function (done) {
                                //通过buyerCustomerDB下的clientSellerInfo，拿到供应商的enterpriseId和licenseNO
                                //进而拿到sellerCustomerDB;de;
                                var erpCode = item.SUPPLIERCODE;
                                db.listSupplierInfo(buyerCustomerDB, erpCode, function (err, results) {
                                    if (err) {
                                        errmsg = "erpCode=" + erpCode + "get ClientSellerInfo ERR，该供应商没有在SCC注册并构建数据库";
                                        errMsgs.push(errmsg);
                                        done(errmsg);
                                    } else {
                                        if (underscore.isEmpty(results)) {
                                            errmsg = "请先行同步" + buyerCustomerDB + ".ClientSellerInfo,该供应商数据库没有同步该询价企业数据";
                                            errMsgs.push(errmsg);
                                            done(errmsg);
                                            return;
                                        }
                                        var sellerInfo = results[0];
                                        sellerId = sellerInfo.enterpriseId;
                                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, sellerInfo.enterpriseId, function (errs, cloudInfos) {
                                            sellerName = cloudInfos[0].buyerName;
                                            sellerCustomerDB = __customerDBPrefix + "_" + cloudInfos[0].dbSuffix;
                                            logger.debug("sellerCustomerDB=" + sellerCustomerDB);
                                            done();
                                        });
                                    }
                                });
                            },
                            function (done) {
                                //step1 convert orderDetails
                                async.mapSeries(
                                    oriDetails,
                                    function (detail, mapCallback) {
                                        var detailObj = {
                                            "GUID": detail.GUID,
                                            "MAINGUID": item.GUID,
                                            "DETAILNO": detail.DETAILNO,
                                            "MATERIELCODE": "",
                                            "BATCHNO": detail.BATCHNO,
                                            "BATCHNUMBER": detail.BATCHNUMBER,
                                            "RETURNREASON": detail.RETURNREASON,
                                            "QUANTITY": detail.QUANTITY,
                                            "TAXUNITPRICE": detail.TAXUNITPRICE,
                                            "UNITPRICE": detail.UNITPRICE,
                                            "AMOUNT": detail.AMOUNT,
                                            "TAXAMOUNT": detail.TAXAMOUNT,
                                            "AMOUNTTAX": detail.AMOUNTTAX,
                                            "REMARK": detail.REMARK,
                                            "ORDERDETAILGUID": detail.ORDERDETAILGUID
                                        };
                                        convertSellerGoodsNo(buyerCustomerDB, sellerCustomerDB, "", detail.MATERIELCODE, function (err, result) {
                                            if (err) {
                                                errmsg = "HH = " + detail.MATERIELCODE + " GET GOODSNO ERR，该商品没有同步到SCC，订单无法继续同步";
                                                errMsgs.push(errmsg);
                                                mapCallback(errmsg)
                                            } else {
                                                //detailObj.goodsNo = goodsNo;
                                                detailObj.MATERIELCODE = result.goodsNo;
                                                returnDetail.push(detailObj);
                                                mapCallback();
                                            }
                                        });
                                    },
                                    function (errs, results) {
                                        if (errs) {
                                            logger.error(JSON.stringify(errs));
                                            errmsg = "returnGuid =" + item.GUID + " CONVERT GOODSNO ERR，该订单号的商品数据转化失败";
                                            errMsgs.push(errmsg);
                                            done(errmsg);
                                        } else {
                                            done();
                                        }
                                    }
                                );

                            },
                            function (done) {
                                //step2 convert orderInfo
                                returnInfo.GUID = item.GUID;
                                returnInfo.BILLNO = item.BILLNO;//流水号
                                returnInfo.BILLDATE = item.BILLDATE;//单据日期
                                returnInfo.CUSTOMERCODE = "";
                                returnInfo.SALETYPE = item.STOCKTYPE;//销售方式？
                                returnInfo.RETURNREASON = oriDetails[0].RETURNREASON;
                                returnInfo.REMARK = item.REMARK;

                                db.listClientBuyerInfoBylicenseNo(sellerCustomerDB, buyerInfo.businessLicense, function (err, result) {
                                    if (err) {
                                        errmsg = "businessLicens = " + buyerInfo.businessLicense + " GET erpcode ERR，没有同步ClientbuyerInfo到SCC，无法继续同步";
                                        errMsgs.push(errmsg);
                                        done(errmsg)
                                    } else {
                                        returnInfo.CUSTOMERCODE = result[0].erpCode;
                                        done();
                                    }
                                })
                            },
                            function (done) {
                                //step3 form send Info
                                var msgData = {
                                    SALERETURNAPPROVE: [returnInfo],
                                    SALERETURNAPPROVEDETAIL: returnDetail
                                };
                                sendData = {
                                    msgId: msgId,
                                    customerId: sellerId,
                                    msgType: msgTypgOut,
                                    msgData: msgData
                                };
                                logger.debug("SEND DATA = " + JSON.stringify(sendData));
                                done();
                            }
                        ],
                        function (errs, results) {
                            if (errs) {
                                logger.error(JSON.stringify(errs));
                                mapCallback(errs);
                            } else {
                                mapCallback(null, sendData);
                            }
                        }
                    );
                },
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        var msgData = {
                            errMsg: errMsgs
                        };
                        var sendData = {
                            msgId: msgId,
                            customerId: userId,
                            msgType: msgTypgErr,
                            msgData: msgData
                        };
                        sendDataOut(sendData, function (err, results) {
                            if (err) {
                                logger.error("send msg err,msg=" + JSON.stringify(sendData) + "err=" + err);
                            } else {
                                logger.debug("send msg success,msg=" + JSON.stringify(sendData));
                            }
                        });
                    } else {
                        logger.debug(JSON.stringify(results));
                        async.mapSeries(
                            results,
                            function (sendData, mapCallback) {
                                sendDataOut(sendData, function (err, results) {
                                    if (err) {
                                        mapCallback(null, "send msg err,msg=" + JSON.stringify(sendData) + "err=" + err);
                                    } else {
                                        mapCallback(null, "send msg success,msg=" + JSON.stringify(sendData));
                                    }
                                })
                            },
                            function (errs, results) {
                                if (errs) {
                                    logger.error(JSON.stringify(errs));
                                } else {
                                    logger.debug(JSON.stringify(results));
                                    logger.debug("EDI_RETURN_CREATE_FROM_BUYER excute done")

                                }

                            }
                        )

                    }
                }
            );


        },

        EDI_ORDER_RETURN_CONFIRM_FROM_SELLER: function (data) {
            var msgTypgIn = "EDI_ORDER_RETURN_CONFIRM_FROM_SELLER";
            var msgTypgOut = "EDI_ORDER_RETURN_CONFIRM_TO_BUYER";
            logger.enter();
            var msg = data.msg;
            var msgId = msg.msgId;
            var userId = data.userId;
            var OriginInfo = msg.msgData;

            var shipData = OriginInfo.XSDDHead;

            async.mapSeries(
                shipData,
                function (item, mapCallback) {

                    var buyerName = undefined;
                    var sellerName = undefined;
                    var buyerId = undefined;
                    var buyerCustomerDB = undefined;
                    var sellerCustomerDB = undefined;
                    var sendData = undefined;
                    async.series([
                            function (done) {
                                //通过接口userId，找到sellerCustomerDB
                                db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, userId, function (err, results) {
                                    if (err) {
                                        done("userId=" + userId + "get CUSTOMER_DB ERR");
                                    } else {
                                        sellerName = results[0].buyerName;
                                        var dbSuffix = results[0].dbSuffix;
                                        sellerCustomerDB = __customerDBPrefix + "_" + dbSuffix;
                                        logger.debug("sellerCustomerDB=" + sellerCustomerDB);
                                        done();
                                    }
                                });
                            },
                            function (done) {
                                //通过sellerCustomerDB下的clientBuyerInfo和clientCode，拿到enterpriseId和licenseNO
                                //进而拿到buyerCustomerDB;
                                var erpCode = clientCode;
                                db.listBuyerInfo(sellerCustomerDB, erpCode, function (err, results) {
                                    if (err) {
                                        done("erpCode=" + erpCode + "get ClientSellerInfo ERR");
                                    } else {
                                        if (underscore.isEmpty(results)) {
                                            done("请先行同步ClientBuyerInfo" + sellerCustomerDB);
                                            return;
                                        }
                                        var buyerInfo = results[0];
                                        buyerId = buyerInfo.enterpriseId;
                                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, buyerInfo.enterpriseId, function (errs, cloudInfos) {
                                            buyerName = cloudInfos[0].buyerName;
                                            buyerCustomerDB = __customerDBPrefix + "_" + cloudInfos[0].dbSuffix;
                                            logger.debug("buyerCustomerDB=" + buyerCustomerDB);
                                            done();
                                        });
                                    }
                                });
                            },
                            function (done) {
                                var msgData = {
                                    //todo
                                };
                                sendData = {
                                    msgId: msgId,
                                    customerId: buyerId,
                                    msgType: "EDI_ORDER_RETURN_CONFIRM_TO_BUYER",
                                    msgData: msgData
                                };
                                logger.debug("SEND DATA = " + JSON.stringify(sendData));
                                done();
                            }
                        ],
                        function (errs, results) {
                            if (errs) {
                                logger.error(JSON.stringify(errs));
                                //todo deal with err
                            } else {
                                mapCallback(null, sendData);
                            }
                        }
                    );
                },
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        //todo deal with errs
                    } else {
                        logger.debug(JSON.stringify(results));
                        //todo deal with no errs

                    }

                }
            );


        },

        EDI_ORDER_RETURN_RECEIVE_FROM_SELLER: function (data) {
            var msgTypgIn = "EDI_ORDER_RETURN_RECEIVE_FROM_SELLER";
            var msgTypgOut = "EDI_ORDER_RETURN_RECEIVE_TO_BUYER";

            logger.enter();
            var msg = data.msg;
            var msgId = msg.msgId;
            var userId = data.userId;
            var OriginInfo = msg.msgData;

            var shipData = OriginInfo.XSDDHead;

            async.mapSeries(
                shipData,
                function (item, mapCallback) {

                    var buyerName = undefined;
                    var sellerName = undefined;
                    var buyerId = undefined;
                    var buyerCustomerDB = undefined;
                    var sellerCustomerDB = undefined;
                    var sendData = undefined;
                    async.series([
                            function (done) {
                                //通过接口userId，找到sellerCustomerDB
                                db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, userId, function (err, results) {
                                    if (err) {
                                        done("userId=" + userId + "get CUSTOMER_DB ERR");
                                    } else {
                                        sellerName = results[0].buyerName;
                                        var dbSuffix = results[0].dbSuffix;
                                        sellerCustomerDB = __customerDBPrefix + "_" + dbSuffix;
                                        logger.debug("sellerCustomerDB=" + sellerCustomerDB);
                                        done();
                                    }
                                });
                            },
                            function (done) {
                                //通过sellerCustomerDB下的clientBuyerInfo和clientCode，拿到enterpriseId和licenseNO
                                //进而拿到buyerCustomerDB;
                                var erpCode = clientCode;
                                db.listBuyerInfo(sellerCustomerDB, erpCode, function (err, results) {
                                    if (err) {
                                        done("erpCode=" + erpCode + "get ClientSellerInfo ERR");
                                    } else {
                                        if (underscore.isEmpty(results)) {
                                            done("请先行同步ClientBuyerInfo" + sellerCustomerDB);
                                            return;
                                        }
                                        var buyerInfo = results[0];
                                        buyerId = buyerInfo.enterpriseId;
                                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, buyerInfo.enterpriseId, function (errs, cloudInfos) {
                                            buyerName = cloudInfos[0].buyerName;
                                            buyerCustomerDB = __customerDBPrefix + "_" + cloudInfos[0].dbSuffix;
                                            logger.debug("buyerCustomerDB=" + buyerCustomerDB);
                                            done();
                                        });
                                    }
                                });
                            },
                            function (done) {
                                var msgData = {
                                    //todo
                                };
                                sendData = {
                                    msgId: msgId,
                                    customerId: buyerId,
                                    msgType: "EDI_ORDER_RETURN_RECEIVE_TO_BUYER",
                                    msgData: msgData
                                };
                                logger.debug("SEND DATA = " + JSON.stringify(sendData));
                                done();
                            }
                        ],
                        function (errs, results) {
                            if (errs) {
                                logger.error(JSON.stringify(errs));
                                //todo deal with err
                            } else {
                                mapCallback(null, sendData);
                            }
                        }
                    );
                },
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        //todo deal with errs
                    } else {
                        logger.debug(JSON.stringify(results));
                        //todo deal with no errs

                    }

                }
            );
        },

        EDI_PONG_FROM_ERP: function (data) {
            var msg = data.msg;
            var enterpriseId = data.userId;
            var msgData = msg.msgData;
            var pong = msgData.pong;
            var pingKey = "_ping_" + enterpriseId;

            logger.debug(JSON.stringify(pingKey));
            cacheService.get(pingKey, function (error, result) {
                logger.debug(JSON.stringify(result));
                var temp = JSON.parse(result);
                var socketId = temp.socketId;
                var ping = temp.ping;
                logger.ndump('ping from redis:' + temp.ping + "socketId from redis:" + socketId);

                var socketConn = __socketIO.sockets.connected[temp.socketId];
                if (!socketConn) {
                    logger.error(new Error('无法拿到socket连接'));
                    return;
                }

                if ((temp.ping).toString() !== pong.toString()) {
                    var errmsg = '测试失败, 请检查配置.';
                    var pushInfo = {
                        // 任务id, @see table CloudDB.Task.taskId
                        taskId: "",
                        // 任务类型, @see table CloudDB.Task.taskType
                        taskType: "",
                        // 子任务名称, 可选
                        description: "",
                        // 任务进度百分比, 0-100
                        taskProgress: "",
                        // 任务完成标志
                        isDone: false,
                        // 错误消息
                        errmsg: errmsg,
                        // 消息体
                        msg:""

                    };
                    socketConn.emit("connectSCC-ERP", pushInfo);
                    return logger.ndump('测试失败, 请检查配置. ping!==pong');
                }
                var msg = '测试成功,连接正常.';
                var pushInfo = {
                    // 任务id, @see table CloudDB.Task.taskId
                    taskId: "",
                    // 任务类型, @see table CloudDB.Task.taskType
                    taskType: "",
                    // 子任务名称, 可选
                    description: "",
                    // 任务进度百分比, 0-100
                    taskProgress: "",
                    // 任务完成标志
                    isDone: true,
                    // 错误消息
                    errmsg: "",
                    // 消息体
                    msg:msg

                };
                socketConn.emit("connectSCC-ERP", pushInfo);
                logger.ndump('测试成功,连接正常');
            });
        }
    };


    /**
     *  send data out ERP here
     * @param data
     * @param callback
     */
    function sendDataOut(data, callback) {
        if (underscore.isEmpty(data)) {
            return callback("send data is Empty ");
        }
        var customerId = data.customerId;
        var msgType = data.msgType;
        var msgId = data.msgId;
        var msgData = data.msgData;
        var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
        apiRobot.sendMsg(customerId, msgType, msgData, msgId, function sendMsgCallback(error, result) {
            callback(error, result);
        });
    }

    function convertSellerGoodsNo(buyerCustomerDB, sellerCustomerDB, PZWH, HH, callback) {
        var goodsNo = undefined;
        async.series([
                function (done) {
                    //step1 to do
                    if (underscore.isEmpty(PZWH) || underscore.isUndefined(PZWH)) {
                        db.getPZWHfromBuyerByHH(buyerCustomerDB, HH, function (err, results) {
                            if (err || results.length == 0) {
                                logger.error("HH=" + HH + " GET PZWH FAIL" + JSON.stringify(err));
                                done("HH=" + HH + " GET PZWH FAIL");
                            } else {
                                PZWH = results[0].licenseNo;
                                done();
                            }
                        })
                    } else {
                        done();
                    }
                },
                function (done) {
                    //step2 to do
                    db.getGoodsNoByPZWH(sellerCustomerDB, PZWH, function (err, results) {
                        if (err || results.length == 0) {
                            logger.error("PZWH=" + PZWH + " ,CONVERT PZWH TO HH ERR");
                            done("CONVERT PZWH TO HH ERR");
                        } else {
                            goodsNo = results[0].goodsNo;
                            done();
                        }
                    });
                }
            ],
            function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                } else {
                    //todo deal with no err
                    callback(null, {PZWH: PZWH, goodsNo: goodsNo});
                }
            }
        );


    }

    function convertBuyerGoodsNo(buyerCustomerDB, sellerCustomerDB, PZWH, HH, callback) {
        var goodsNo = undefined;
        async.series([
                function (done) {
                    //step1 to do
                    if (underscore.isEmpty(PZWH) || underscore.isUndefined(PZWH)) {
                        db.getPZWHfromBuyerByHH(sellerCustomerDB, HH, function (err, results) {
                            if (err || results.length == 0) {
                                logger.error("HH=" + HH + " GET PZWH FAIL" + JSON.stringify(err));
                                done("HH=" + HH + " GET PZWH FAIL");
                            } else {
                                PZWH = results[0].licenseNo;
                                done();
                            }
                        })
                    } else {
                        done();
                    }
                },
                function (done) {
                    //step2 to do
                    db.getGoodsNoByPZWH(buyerCustomerDB, PZWH, function (err, results) {
                        if (err || results.length == 0) {
                            logger.error("PZWH=" + PZWH + " ,CONVERT PZWH TO HH ERR");
                            done("CONVERT PZWH TO HH ERR");
                        } else {
                            goodsNo = results[0].goodsNo;
                            done();
                        }
                    });
                }
            ],
            function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                } else {
                    //todo deal with no err
                    callback(null, {PZWH: PZWH, goodsNo: goodsNo});
                }
            }
        );


    }

    function convertClientGuid(cloudDB, sellerCustomerDB, userId, callback) {
        db.getBuyerOrSellerInfoById(__mysql, cloudDB, userId, function (err, result) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                var businessLicense = result[0].businessLicense;
                db.getClientCodeBylicenseNoFromClientBuyerInfo(sellerCustomerDB, businessLicense, function (error, results) {
                    if (error) {
                        console.log(err);
                        return callback(err);
                    }
                    if (results.length == 0) {
                        return callback("CLIENTCODE NOT FOUND")
                    }
                    callback(null, results[0].clientCode);
                });
            }
        })
    }

    function formatOrderInfo(item) {
        var orderDetailsInfo = [],
            orderInfoObj = {
                guid: item.GUID,
                billNO: item.BILLNO,
                billDate: item.BILLDATE,
                sellerCode: item.SUPPLIERCODE,
                sellerName: item.SUPPLIERNAME,
                consigneeMobileNum: item.CONSIGNEEMOBILENUM || null,
                consigneeName: item.EMPLOYEENAME,
                consigneeAddress: item.CUSTOMERADDER,
                buyerEmployeeCode: item.EMPLOYEECODE,
                buyerEmployeeName: item.EMPLOYEENAME,
                sellerEmployeeName: item.SUPPLIEREMPLOYEENAME,
                usefulDate: item.USEFULDATE,
                advGoodsArriveDate: item.ADVGOODSARRIVEDATE,
                remark: item.REMARK
            };
        // [当下情况]客户 erp 传递过来的数据 ,当前没有unicode 和packageQty这个字段,所以构造数据的时候做一个或判断
        underscore.each(item.orderDetails, function (item) {
            var temp = [];
            temp.push(item.GUID,
                item.STOCKORDERFORMGUID,
                item.PLATFORMCODE || null,
                item.CONVERSION || 1,
                item.HH,
                item.QUANTITY,
                item.INPRICE,
                item.PZWH,
                item.AMOUNTTAX);

            orderDetailsInfo.push(temp);
        });
        return {
            orderInfo: orderInfoObj,
            orderDetailsInfo: orderDetailsInfo
        }
    }

    function saveSellerShipInfos(sellerDBName, shipCommon, shipData, monitorDetail, saveTimes, callback) {
        logger.enter();
        var sellerShipInfo, sellerShipDetail, sellerShipMonitals, unicode, sellerPackageQty;
        async.series([
                //form sellerShipInfo
                function (done) {
                    sellerShipInfo = {
                        billNo: shipCommon[0].BILLNO, /* 流水号 */
                        billDate: shipCommon[0].BILLDATE, /* 单据日期 */
                        billTime: shipCommon[0].BillTIme, /* 单据时间 */
                        orderBillNo: shipCommon[0].ORDERBILLNO, /* 订单号 */
                        orderGuid: shipCommon[0].ORDERGUID, /* 订单guid */
                        notes: shipCommon[0].NOTES, /* 备注 */
                        FHRY: shipCommon[0].FHRY,
                        FHRQ: shipCommon[0].FHRQ,
                        buyerGuid: shipCommon[0].CUSTOMGUID, /* 客户guid: CustomGuid */
                        buyerName: shipCommon[0].CUSTOMNAME, /* 客户名称: CustomName */
                        buyerCode: shipData.CLIENTCODE /* 客户编号: clientCode */
                    };
                    done();
                },
                //form sellerShipDetail
                function (done) {
                    sellerShipDetail = {
                        shipNo: shipCommon[0].BILLNO,// 发货单号
                        shipDetailNo: shipData.DH, /* 发货详情号: DH */
                        shipDetailDate: shipData.KDRQ, /* 单据日期: KDRQ */
                        sellerGoodsNo: shipData.HH, /* 商品编号: HH */
                        unicode: shipData.PLATFORMCODE || "", /* 平台编码 unicode */
                        packageQty: shipData.CONVERSION || 1, /* 换算关系 */
                        taxPrice: shipData.SJ, /* 含税价: SJ */
                        batchNo: shipData.BATCHNO, /* 批号: BATCHNO */
                        batchNum: shipData.BATCHNUM, /* 批次号: BATCHNUM */
                        goodsValidDate: shipData.GOODSVALIDDATE, /* 有效期: GOODSVALIDDATE*/
                        goodsProduceDate: shipData.GOODSPRODUCEDATE, /* 生产日期: GOODSPRODUCEDATE */
                        quantity: shipData.QUANTITY, /* 数量 */
                        remark: shipData.REMARK, /* 备注 */
                        inspectReportUrl: shipData.INSPECTREPORTURL, /* 质检报告单: INSPECTREPORTURL*/
                        salesType: shipData.TYBZ, /* 销售方式: TYBZ */
                        orderDetailGuid: shipData.SBZ2/* 订单明细 guid: SBZ2 */
                    };
                    //if erp not supply unicode and packageQty,select from GoodsInfo

                    db.getGoodsPackInfoByHH(sellerDBName, shipData.HH, function (err, results) {
                        if (err || results.length == 0) {
                            done("get seller goods info fail" + err);
                        } else {
                            unicode = results[0].unicode;
                            sellerPackageQty = results[0].packageQty;
                            sellerShipDetail.unicode = sellerShipDetail.unicode == "" ? unicode : sellerShipDetail.unicode;
                            sellerShipDetail.packageQty = sellerShipDetail.unicode == "" ? sellerPackageQty : sellerShipDetail.packageQty;
                            done();
                        }
                    });

                },
                //form sellerShipMonital
                function (done) {
                    sellerShipMonitals = [];
                    if(monitorDetail.length>0){
                        underscore.map(monitorDetail, function (item) {
                            var arr = [];
                            arr.push(
                                item.DRUGESC,
                                item.YSDH,
                                item.BZGG,
                                item.FTYPE
                            );
                            sellerShipMonitals.push(arr);
                        });
                    }
                    done();
                },
                //insert by trans
                function (done) {
                    db.beginTrans(function (connect) {
                        async.series([
                            function (done) {
                                if (saveTimes > 0) {
                                    done();
                                } else {
                                    db.metaInsertShipInfoToSeller(connect,
                                        sellerDBName,
                                        sellerShipInfo,
                                        function (err, results) {
                                            if (err) {
                                                done(err);
                                            } else {
                                                done(err, results);
                                            }
                                        })
                                }
                            },
                            function (done) {
                                db.metaInsertShipDetailsToSeller(connect,
                                    sellerDBName,
                                    sellerShipDetail,
                                    function (err, results) {
                                        if (err) {
                                            done(err);
                                        } else {
                                            done(err, results);
                                        }
                                    })
                            },
                            function (done) {
                                if (saveTimes > 0||sellerShipMonitals.length ==0) {
                                    done();
                                } else {
                                    db.metaInsertShipMonitorsToSeller(connect,
                                        sellerDBName,
                                        sellerShipMonitals,
                                        function (err, results) {
                                            if (err) {
                                                done(err);
                                            } else {
                                                done(err, results);
                                            }
                                        })
                                }
                            },
                            function(done){
                                if (saveTimes > 0) {
                                    done();
                                } else {
                                    var shipId = sellerShipInfo.billNo;
                                    var shipDate = sellerShipInfo.billDate;
                                    var shipAmount = 0;
                                    var objectSide = "SELLER";
                                    db.putCountForShip(connect, sellerDBName,objectSide, shipId,
                                        shipDate, shipAmount, function (err, result) {
                                        done(err, result);
                                    })
                                }
                            }

                        ], function (err, resultList) {
                            if (err) {
                                logger.debug("保存ship信息到seller 回滚事务");
                                db.rollbackTrans(connect, function (transErr) {
                                    done(err);
                                });
                            } else {
                                logger.debug("保存ship信息到seller 提交事务");
                                db.commitTrans(connect, function () {
                                    done(null, resultList);
                                });
                            }
                        })
                    });
                }
            ],
            function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                } else {
                    logger.debug("save SellerShipInfos exeuted done");
                    callback(null, {unicode: unicode, sellerPackageQty: sellerPackageQty});
                }
            }
        );
    }

    function saveBuyerShipInfos(buyerDBName, sellerInfo, shipCommon, shipData, monitorDetail, saveTimes, callback) {
        logger.enter();
        var buyerShipInfo, buyerShipDetail, buyerShipMonitals;
        async.series([
                //form buyerShipInfo
                function (done) {
                    buyerShipInfo = {
                        billNo: shipCommon[0].BILLNO, /* 流水号 */
                        billDate: shipCommon[0].BILLDATE, /* 单据日期 */
                        billTime: shipCommon[0].BILLTIME, /* 单据时间 */
                        orderBillNo: shipCommon[0].ORDERBILLNO, /* 订单号 */
                        orderGuid: shipCommon[0].ORDERGUID, /* 订单guid */
                        notes: shipCommon[0].NOTES, /* 备注 */
                        FHRY: shipCommon[0].FHRY,
                        FHRQ: shipCommon[0].FHRQ,
                        sellerName: "", /* 供应商Name */
                        sellerCode: "" /* 供应商: erpCode */
                    };
                    db.getSellerPackInfo(buyerDBName, __cloudDBName, sellerInfo.sellerId, function (err, results) {
                        if (err || results.length == 0) {
                            done("form seller pack info fail" + err);
                        } else {
                            buyerShipInfo.sellerName = results[0].customerName;
                            buyerShipInfo.sellerCode = results[0].erpCode;
                            done();
                        }
                    });

                },
                //form buyerShipDetail
                function (done) {
                    buyerShipDetail = {
                        shipNo: shipCommon[0].BILLNO,// 发货单号
                        shipDetailNo: shipData.DH, /* 发货详情号: DH */
                        shipDetailDate: shipData.KDRQ, /* 单据日期: KDRQ */
                        buyerGoodsNo: "", /* 商品编号: HH */
                        unicode: sellerInfo.unicode, /* 平台编码 unicode */
                        packageQty: 1, /* 换算关系 */
                        taxPrice: 0, /* 含税价: SJ */
                        batchNo: shipData.BATCHNO, /* 批号: BATCHNO */
                        batchNum: shipData.BATCHNUM, /* 批次号: BATCHNUM */
                        goodsValidDate: shipData.GOODSVALIDDATE, /* 有效期: GOODSVALIDDATE*/
                        goodsProduceDate: shipData.GOODSPRODUCEDATE, /* 生产日期: GOODSPRODUCEDATE */
                        quantity: 0, /* 数量 */
                        remark: shipData.REMARK, /* 备注 */
                        inspectReportUrl: shipData.INSPECTREPORTURL, /* 质检报告单: INSPECTREPORTURL*/
                        salesType: shipData.TYBZ, /* 销售方式: TYBZ */
                        orderDetailGuid: shipData.SBZ2/* 订单明细 guid: SBZ2 */
                    };
                    //select from buyer.GoodsInfo
                    db.getPackageQty(__mysql, buyerDBName, sellerInfo.unicode, function (err, results) {
                        if (err || results.length == 0) {
                            done("get buyer goods info fail" + err);
                        } else {
                            buyerShipDetail.packageQty = results[0].packageQty;
                            buyerShipDetail.buyerGoodsNo = results[0].licenseNo;
                            buyerShipDetail.quantity = (shipData.QUANTITY * sellerInfo.sellerPackageQty / buyerShipDetail.packageQty).toFixed(4);
                            buyerShipDetail.taxPrice = (shipData.SJ * shipData.QUANTITY / buyerShipDetail.quantity).toFixed(4);
                            done();
                        }
                    });

                },
                //form sellerShipMonital
                function (done) {
                    buyerShipMonitals = [];
                    if(monitorDetail.length>0) {
                        underscore.map(monitorDetail, function (item) {
                            var arr = [];
                            arr.push(
                                item.DRUGESC,
                                item.YSDH,
                                item.BZGG,
                                item.FTYPE
                            );
                            buyerShipMonitals.push(arr);
                        });
                    }
                    done();
                },
                //insert by trans
                function (done) {
                    db.beginTrans(function (connect) {
                        async.series([
                            function (done) {
                                if (saveTimes > 0) {
                                    done();
                                } else {
                                    db.metaInsertShipInfoToBuyer(connect,
                                        buyerDBName,
                                        buyerShipInfo,
                                        function (err, results) {
                                            if (err) {
                                                done(err);
                                            } else {
                                                done(err, results);
                                            }
                                        })
                                }
                            },
                            function (done) {
                                db.metaInsertShipDetailsToBuyer(connect,
                                    buyerDBName,
                                    buyerShipDetail,
                                    function (err, results) {
                                        if (err) {
                                            done(err);
                                        } else {
                                            done(err, results);
                                        }
                                    })
                            },
                            function (done) {
                                if (saveTimes > 0||buyerShipMonitals.length == 0) {
                                    done();
                                } else {
                                    db.metaInsertShipMonitorsToBuyer(connect,
                                        buyerDBName,
                                        buyerShipMonitals,
                                        function (err, results) {
                                            if (err) {
                                                done(err);
                                            } else {
                                                done(err, results);
                                            }
                                        })
                                }
                            },
                            function(done){
                                if (saveTimes > 0) {
                                    done();
                                } else {
                                    var shipId = buyerShipInfo.billNo;
                                    var shipDate = buyerShipInfo.billDate;
                                    var shipAmount = 0;
                                    var objectSide = "BUYER";
                                    db.putCountForShip(connect, buyerDBName, objectSide,shipId, shipDate, shipAmount, function (err, result) {
                                        done(err, result);
                                    })
                                }
                            }
                        ], function (err, resultList) {
                            if (err) {
                                logger.debug("保存ship信息到buyer 回滚事务");
                                db.rollbackTrans(connect, function (transErr) {
                                    done(err);
                                });
                            } else {
                                logger.debug("保存ship信息到buyer 提交事务");
                                db.commitTrans(connect, function () {
                                    done(null, resultList);
                                });
                            }
                        })
                    });
                }
            ],
            function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                } else {
                    logger.debug(JSON.stringify(results));
                    callback();
                }
            }
        );
    }

    function saveOrderIntoSeller(buyerCustomerDB, sellerCustomerDB, guid, buyerId, callback) {
        logger.enter();
        var buyerOrderInfo, sellerOrderInfo,
            buyerOrderDetails, sellerOrderDetails;
        async.series([
                //1.get orderInfo by guid
                function (done) {
                    db.getBuyerOrderInfoByGuid(buyerCustomerDB, guid, function (err, result) {
                        if (err || result.length == 0) {
                            done("get buyer orderInfo ERR" + err);
                        } else {
                            buyerOrderInfo = result[0];
                            done(null, "get buyer orderInfo success");
                        }
                    })
                },
                //2.get sellerOrderInfo
                function (done) {
                    db.getSellerOrderInfoPartData(sellerCustomerDB, buyerId, function (err, results) {
                        if (err || results.length == 0) {
                            done("get seller orderInfo ERR" + err);
                        } else {
                            logger.debug("buyerOrderInfo="+JSON.stringify(buyerOrderInfo));
                            sellerOrderInfo = {
                                guid: buyerOrderInfo.guid,
                                billNO: buyerOrderInfo.billNO,
                                billDate: moment(buyerOrderInfo.billDate).format('YYYY-MM-DD HH:mm:ss'),
                                clientGuid: results[0].clientGuid || "",
                                buyerCode: results[0].buyerCode,
                                buyerName: results[0].buyerName,
                                consigneeMobileNum: buyerOrderInfo.consigneeMobileNum || null,
                                consigneeName: buyerOrderInfo.consigneeName,
                                consigneeAddress: buyerOrderInfo.consigneeAddress,
                                buyerEmployeeCode: buyerOrderInfo.buyerEmployeeCode,
                                buyerEmployeeName: buyerOrderInfo.buyerEmployeeName,
                                sellerEmployeeName: buyerOrderInfo.sellerEmployeeName,
                                usefulDate: moment(buyerOrderInfo.usefulDate).format('YYYY-MM-DD HH:mm:ss'),
                                advGoodsArriveDate: moment(buyerOrderInfo.advGoodsArriveDate).format('YYYY-MM-DD HH:mm:ss'),
                                remark: buyerOrderInfo.remark,
                                total: 0//caculate below
                            };
                            done(null, "form seller orderInfo success");
                        }
                    });
                },
                //3.get orderDetail by guid
                function (done) {
                    db.getBuyerOrderDetailByGuid(buyerCustomerDB, guid, function (err, result) {
                        if (err || result.length == 0) {
                            done("get buyer orderDetail ERR" + err);
                        } else {
                            buyerOrderDetails = result;
                            done(null, "get buyer orderDetail success");
                        }
                    })
                },
                //4.get sellerOrderDetail
                function (done) {
                    sellerOrderDetails = [];
                    async.mapSeries(buyerOrderDetails,
                        function (item, mapCallback) {
                            sellerOrderInfo.total += item.amountTax;
                            db.getPartSellerOrderDetailData(sellerCustomerDB, item.unicode, function (err, results) {
                                if (err || results.length == 0) {
                                    mapCallback("get seller order detail data fail" + err);
                                } else {
                                    var sellerPackageQty = results[0].packageQty;
                                    var sellerGoodsNo = results[0].goodsNo;
                                    var sellerQuantity = (item.quantity * item.packageQty / sellerPackageQty).toFixed(4);
                                    var sellerInprice = (item.amountTax / sellerQuantity).toFixed(4);
                                    var temp = [];
                                    temp.push(
                                        item.guid,
                                        item.orderInfoGuid,
                                        item.unicode,
                                        sellerPackageQty,
                                        sellerGoodsNo,
                                        sellerQuantity,
                                        sellerInprice,
                                        item.licenseNo,
                                        item.amountTax,
                                        sellerInprice * sellerQuantity
                                    );
                                    sellerOrderDetails.push(temp);
                                    mapCallback(null, "get seller order detail data success");
                                }
                            });
                        },
                        function (errs, results) {
                            if (errs) {
                                done("convert details data err" + errs);
                            } else {
                                done(null, "convert details data success" + results);
                            }
                        });
                },
                //5.insert into seller OrderInfo and seller OrderDetails
                function (done) {
                    db.beginTrans(function (connect) {
                        async.series([
                            function (done) {
                                db.metaInsertOrderInfoToSellerOrder(connect,
                                    sellerCustomerDB,
                                    sellerOrderInfo,
                                    function (err, results) {
                                        if (err) {

                                            done(err);
                                        } else {
                                            done(err, results);
                                        }
                                    })
                            },
                            function (done) {
                                db.metaInsertOrderDetailsToSellerOrderDetails(connect,
                                    sellerCustomerDB,
                                    sellerOrderDetails,
                                    function (err, results) {
                                        if (err) {
                                            done(err);
                                        } else {
                                            done(err, results);
                                        }
                                    })
                            },
                            function(done){
                                var orderId = buyerOrderInfo.billNO;
                                var orderDate = moment(buyerOrderInfo.billDate).format('YYYY-MM-DD HH:mm:ss');
                                var orderAmount = underscore.reduce(buyerOrderDetails,function(memo,obj){
                                    return memo + Number(obj.amountTax);
                                },0);
                                var objectSide = "SELLER";
                                db.putCountForOrder(connect,sellerCustomerDB,objectSide,orderId,orderDate,orderAmount,function(err,result){
                                    done(err,result);
                                })

                            }
                        ], function (err, resultList) {
                            if (err) {
                                logger.debug("保存订单信息到Seller 回滚事务");
                                db.rollbackTrans(connect, function (transErr) {
                                    done(err);
                                });
                            } else {
                                logger.debug("保存订单信息到Seller 提交事务");
                                db.commitTrans(connect, function () {
                                    done(null, resultList);
                                });
                            }
                        })
                    });
                }
            ],
            function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs)
                } else {
                    logger.debug(JSON.stringify(results));
                    callback();
                }
            }
        );

    }

    function saveOrderIntoBuyer(buyerCustomerDB, orderItem, callback) {
        var insertData = formatOrderInfo(orderItem);
        db.beginTrans(function (connect) {
            async.series([
                function (done) {
                    db.metaInsertOrderInfoToBuyerOrder(connect,
                        buyerCustomerDB,
                        insertData.orderInfo,
                        function (err, results) {
                            if (err) {
                                done(err);
                            } else {
                                done(err, results);
                            }
                        })
                },
                function (done) {
                    db.metaInsertOrderDetailsToBuyerOrderDetails(connect,
                        buyerCustomerDB,
                        insertData.orderDetailsInfo,
                        function (err, results) {
                            if (err) {
                                done(err);
                            } else {
                                done(err, results);
                            }
                        })
                },
                function(done){
                    var orderId = orderItem.BILLNO;
                    var orderDate = moment(orderItem.BILLDATE).format('YYYY-MM-DD HH:mm:ss');
                    var orderAmount = underscore.reduce(orderItem.orderDetails,function(memo,obj){
                        return memo + Number(obj.AMOUNTTAX);
                    },0);
                    var objectSide = "BUYER";
                    db.putCountForOrder(connect,buyerCustomerDB,objectSide,orderId,orderDate,orderAmount,function(err,result){
                        done(err,result);
                    })
                }
            ], function (err, resultList) {
                if (err) {
                    logger.debug("保存订单信息到buyer 回滚事务");
                    db.rollbackTrans(connect, function (transErr) {
                        callback(err);
                    });
                } else {
                    logger.debug("保存订单信息到buyer 提交事务");
                    db.commitTrans(connect, function () {
                        callback(null, resultList);
                    });
                }
            })
        });
    }

    function saveReturnInfosToDB(userId, oriReturns, oriDetails, callback) {
        logger.enter();
        //save data to buyer DB
        var buyerName = undefined;
        var buyerCustomerDB = undefined;
        var sellerId = undefined;
        var sellerName = undefined;
        var sellerCustomerDB = undefined;
        var errmsg = "";
        var arryBuyerReturnDetails = [];
        var arryBuyerReturnInfo = [];
        var arrySellerReturnDetails = [];
        var arrySellerReturnInfo = [];
        async.series([
                function (done) {
                    async.series([
                        function (done) {
                            //通过接口userId，找到buyerCustomerDB
                            db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, userId, function (err, results) {
                                if (err || results.length == 0) {
                                    errmsg = "userId=" + userId + " get CUSTOMER_DB ERR,该客户在SCC上没有注册并构建数据库";
                                    return done(err + errmsg);
                                }
                                buyerName = results[0].buyerName;
                                var dbSuffix = results[0].dbSuffix;
                                buyerCustomerDB = __customerDBPrefix + "_" + dbSuffix;
                                logger.debug("buyerCustomerDB=" + buyerCustomerDB);
                                done(null, results);
                            });
                        },
                        //form returnDetail arr
                        function (done) {
                            if(underscore.isUndefined(oriDetails[0].PLATFORMCODE)){
                                async.mapSeries(
                                    oriDetails,
                                    function(item,mapCallback){
                                        db.getGoodsPackInfoByHH(buyerCustomerDB,item.MATERIELCODE,function(err,results){
                                            if (err || results.length == 0) {
                                                mapCallback("get buyer goods info fail" + err);
                                            } else {
                                                var temp = [];
                                                item.PLATFORMCODE =  results[0].unicode;
                                                item.CONVERSION =  results[0].packageQty;
                                                temp.push(item.GUID);// guid
                                                temp.push(item.DETAILNO);
                                                temp.push(oriReturns[0].GUID);
                                                temp.push(item.MATERIELCODE);
                                                temp.push(item.PLATFORMCODE);
                                                temp.push(item.CONVERSION);
                                                temp.push(item.BATCHNO);
                                                temp.push(item.BATCHNUMBER);
                                                temp.push(item.QUANTITY);
                                                temp.push(item.TAXUNITPRICE);
                                                temp.push(item.UNITPRICE);
                                                temp.push(item.AMOUNT);
                                                temp.push(item.TAXAMOUNT);
                                                temp.push(item.AMOUNTTAX);
                                                temp.push(item.REMARK);
                                                arryBuyerReturnDetails.push(temp);
                                                mapCallback();
                                            }
                                        })
                                    },
                                    function(errs,results){
                                        if(errs){
                                            done(errs);
                                        }else{
                                            done();
                                        }
                                    }
                                );
                            }else{
                                underscore.map(oriDetails,function(item){
                                    var temp = [];
                                    temp.push(item.GUID);// guid
                                    temp.push(item.DETAILNO);
                                    temp.push(oriReturns[0].GUID);
                                    temp.push(item.MATERIELCODE);
                                    temp.push(item.PLATFORMCODE);
                                    temp.push(item.CONVERSION);
                                    temp.push(item.BATCHNO);
                                    temp.push(item.BATCHNUMBER);
                                    temp.push(item.QUANTITY);
                                    temp.push(item.TAXUNITPRICE);
                                    temp.push(item.UNITPRICE);
                                    temp.push(item.AMOUNT);
                                    temp.push(item.TAXAMOUNT);
                                    temp.push(item.AMOUNTTAX);
                                    temp.push(item.REMARK);
                                    arryBuyerReturnDetails.push(temp);
                                });
                                done();
                            }
                        },
                        //form returnInfo arr
                        function (done) {
                            logger.debug(JSON.stringify(oriReturns));
                            underscore.map(oriReturns, function (item) {
                                var temp = [];
                                temp.push(item.GUID);
                                temp.push(item.BILLNO);
                                temp.push(item.SUPPLIERCODE);
                                temp.push(item.BILLDATE);
                                temp.push(oriDetails[0].RETURNREASON);
                                temp.push(item.STOCKTYPE);
                                temp.push(item.REMARK);
                                arryBuyerReturnInfo.push(temp);
                            });
                            done();
                        },
                        //save to buyer info
                        function (done) {
                            db.beginTrans(function (connect) {
                                async.series([
                                    function (done) {
                                        logger.debug(JSON.stringify(arryBuyerReturnInfo));
                                        db.metaInsertReturnInfoToBuyer(connect,
                                            buyerCustomerDB,
                                            arryBuyerReturnInfo,
                                            function (err, results) {
                                                if (err) {
                                                    done(err);
                                                } else {
                                                    done(err, results);
                                                }
                                            })
                                    },
                                    function (done) {
                                        logger.debug(JSON.stringify(arryBuyerReturnDetails));
                                        db.metaInsertReturenDetailsToBuyer(connect,
                                            buyerCustomerDB,
                                            arryBuyerReturnDetails,
                                            function (err, results) {
                                                if (err) {
                                                    done(err);
                                                } else {
                                                    done(err, results);
                                                }
                                            })
                                    },
                                    //save count for return
                                    function(done){
                                        var returnId =oriReturns[0].GUID;
                                        var returnDate = moment(oriReturns[0].BILLDATE).format('YYYY-MM-DD HH:mm:ss');
                                        var returnAmount = underscore.reduce(oriDetails,function(memo,obj){
                                            return memo + Number(obj.AMOUNTTAX)
                                        },0);
                                        var objectSide = "BUYER";
                                        db.putCountForReturn(connect,buyerCustomerDB,objectSide,returnId,returnDate,returnAmount,function(err,result){
                                            done(err,result);
                                        })
                                    }
                                ], function (err, resultList) {
                                    if (err) {
                                        logger.debug("保存return信息到buyer 回滚事务");
                                        db.rollbackTrans(connect, function (transErr) {
                                            done(err);
                                        });
                                    } else {
                                        logger.debug("保存return信息到buyer 提交事务");
                                        db.commitTrans(connect, function () {
                                            done(null, resultList);
                                        });
                                    }
                                })
                            });
                        },

                    ], function (errs, results) {
                        if (errs) {
                            logger.error(errs);
                            done(errs);
                        } else {
                            logger.debug('成功将return信息写入buyer数据库');
                            done(null,'成功将return信息写入buyer数据库');
                        }
                    });

                },
                function (done) {
                    async.series([
                        function (done) {
                            //通过supplierCode,find sellerdb
                            var erpCode = oriReturns[0].SUPPLIERCODE;
                            db.listSupplierInfo(buyerCustomerDB, erpCode, function (err, results) {
                                if (err) {
                                    errmsg = "erpCode=" + erpCode + "get ClientSellerInfo ERR，该供应商没有在SCC注册并构建数据库";
                                    done(errmsg);
                                } else {
                                    if (underscore.isEmpty(results)) {
                                        errmsg = "请先行同步" + buyerCustomerDB + ".ClientSellerInfo,该供应商数据库没有同步该询价企业数据";
                                        done(errmsg);
                                        return;
                                    }
                                    var sellerInfo = results[0];
                                    sellerId = sellerInfo.enterpriseId;
                                    db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, sellerInfo.enterpriseId, function (errs, cloudInfos) {
                                        sellerName = cloudInfos[0].buyerName;
                                        sellerCustomerDB = __customerDBPrefix + "_" + cloudInfos[0].dbSuffix;
                                        logger.debug("sellerCustomerDB=" + sellerCustomerDB);
                                        done();
                                    });
                                }
                            });
                        },
                        //form seller returnDetail arr
                        function (done) {
                            async.mapSeries(
                                oriDetails,
                                function (item, mapCallback) {
                                    db.getPackageQty(__mysql, sellerCustomerDB, item.PLATFORMCODE, function (err, results) {
                                        if (err || results.length == 0) {
                                            mapCallback("find seller goods info  fail by unicode = " + item.PLATFORMCODE + ",please sync goods info ");
                                        } else {
                                            var sellerPackageQty = results[0].packageQty;
                                            var sellerGoodsNo = results[0].goodsNo;
                                            var sellerQty = (item.QUANTITY * item.CONVERSION / sellerPackageQty).toFixed(4);
                                            var sellerTaxPrice = (item.AMOUNTTAX / sellerQty).toFixed(4);
                                            var sellerUnitPrice = ((item.AMOUNTTAX - item.TAXAMOUNT) / sellerQty).toFixed(4);
                                            var temp = [];
                                            temp.push(item.GUID);// guid
                                            temp.push(item.DETAILNO);//detailNo
                                            temp.push(oriReturns[0].GUID);//BuyerReturnGuid
                                            temp.push(sellerGoodsNo);//goodsNo
                                            temp.push(item.PLATFORMCODE);//unicode
                                            temp.push(sellerPackageQty);//packageQty
                                            temp.push(item.BATCHNO);//batchNo
                                            temp.push(item.BATCHNUMBER);//batchNum
                                            temp.push(sellerQty);//
                                            temp.push(sellerTaxPrice);//taxPrice
                                            temp.push(sellerUnitPrice);//price
                                            temp.push(item.AMOUNT);//goodsSubtotal
                                            temp.push(item.TAXAMOUNT);//taxSubtotal
                                            temp.push(item.AMOUNTTAX);//subtotal
                                            temp.push(item.REMARK);//Remark
                                            arrySellerReturnDetails.push(temp);
                                            mapCallback();
                                        }
                                    });
                                },
                                function (errs, results) {
                                    if (errs) {
                                        logger.error(JSON.stringify(errs));
                                        done(errs);
                                    } else {
                                        logger.debug(JSON.stringify())
                                        done();
                                    }
                                }
                            )

                        },
                        //form seller returnInfo arr
                        function (done) {
                            db.listBuyerInfoById(sellerCustomerDB, userId, function (err, results) {
                                if (err || results.length == 0) {
                                    done("find clientBuyerinfo in seller fail" + err);
                                } else {
                                    var buyerCode = results[0].erpCode;
                                    underscore.map(oriReturns, function (item) {
                                        var temp = [];
                                        temp.push(item.GUID);
                                        temp.push(item.BILLNO);
                                        temp.push(buyerCode);
                                        temp.push(item.BILLDATE);
                                        temp.push(oriDetails[0].RETURNREASON);
                                        temp.push(item.STOCKTYPE);
                                        temp.push(item.REMARK);
                                        arrySellerReturnInfo.push(temp);
                                    });
                                    done();
                                }
                            });

                        },
                        //save to seller db
                        function (done) {
                            db.beginTrans(function (connect) {
                                async.series([
                                    function (done) {
                                        db.metaInsertReturnInfoToSeller(connect,
                                            sellerCustomerDB,
                                            arrySellerReturnInfo,
                                            function (err, results) {
                                                if (err) {
                                                    done(err);
                                                } else {
                                                    done(err, results);
                                                }
                                            })
                                    },
                                    function (done) {
                                        db.metaInsertReturenDetailsToSeller(connect,
                                            sellerCustomerDB,
                                            arrySellerReturnDetails,
                                            function (err, results) {
                                                if (err) {
                                                    done(err);
                                                } else {
                                                    done(err, results);
                                                }
                                            })
                                    },
                                    //save count for return
                                    function(done){
                                        var returnId =oriReturns[0].GUID;
                                        var returnDate = moment(oriReturns[0].BILLDATE).format('YYYY-MM-DD HH:mm:ss');
                                        var returnAmount = underscore.reduce(oriDetails,function(memo,obj){
                                            return memo + Number(obj.AMOUNTTAX)
                                        },0);
                                        var objectSide = "SELLER";
                                        db.putCountForReturn(connect,sellerCustomerDB,objectSide,returnId,returnDate,returnAmount,function(err,result){
                                            done(err,result);
                                        })
                                    }
                                ], function (errs, resultList) {
                                    if (errs) {
                                        logger.debug("保存return信息到seller fail 回滚事务");
                                        db.rollbackTrans(connect, function (transErr) {
                                            done(errs);
                                        });
                                    } else {
                                        logger.debug("保存return信息到seller success 提交事务");
                                        db.commitTrans(connect, function () {
                                            done(null, resultList);
                                        });
                                    }
                                })
                            });
                        }
                    ], function (errs, results) {
                        if (errs) {
                            logger.error(errs);
                            done(errs);
                        } else {
                            logger.debug('成功将return信息写入seller数据库');
                            done(null,'成功将return信息写入seller数据库');
                        }
                    });

                }
            ],
            function (errs, results) {
                if (errs) {
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                } else {
                    callback(null,results);
                }
            }
        );
    }

    var generateDetailNo = (function test() {
        var start = 0;
        return function (length) {
            start++;
            var time = (new Date()).getTime().toString();
            return time + (new Array(length).join("0") + start.toString()).slice(time.length - length);
        };
    })();
    return apiModule;
};