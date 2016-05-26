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
 * seller/model.js
 *
 * --------------------------------------------------------------
 *
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
    var underscore = require("underscore");
    var async = require("async");
    var purePaginator = require(__base + "/modules/purePaginator");
    /*
     * init model name etc
     */
    var MODELNAME = __dirname.split("/").pop();
    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {
        getEnterpriseInfoById: function (cloudDB, enterpriseId, callback) {
            logger.enter();
            db.RetrieveSingleSeller(cloudDB, enterpriseId, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(err, result);
                }
            });

        },
        /**
         * 通过orderId获取订单详情
         * @param customerDBName
         * @param orderId
         * @param callback
         */
        getBuyerOrderInfoByOrderId: function (enterpriseId, orderId, callback) {
            logger.enter();
            var customerDBName = null;
            async.series([
                function (done) {
                    db.RetrieveSingleSeller(__cloudDBName, enterpriseId, function (err, result) {
                        if (err) {
                            logger.error(err);
                            done(err);
                        } else {
                            var dbSuffix = result.customerDBSuffix;
                            customerDBName = __customerDBPrefix + "_" + dbSuffix;
                            done(err, result);
                        }
                    });
                },
                function (done) {

                    db.getBuyerOrderByOrderId(customerDBName, orderId, function (err, result) {
                        if (err) {
                            logger.error(err);
                            done(err);
                        } else {
                            //分页 在callback 里面 set pageIndex pageSize
                            done(err, formatBuyerOrderInfo(result));
                        }
                    });
                }
            ], function (err, results) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(err, results[1]);
                }
            });

        },
        /**
         * 获取buyer的OrderList
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getBuyerOrderList: function (enterpriseId, filter, callback) {
            logger.enter();
            var customerDBName = null;
            var orderList = [];
            var orderResults = [];
            var errmsg = "";
            async.series([
                function (done) {
                    //step1 get seller dbname
                    db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, enterpriseId, function (err, results) {
                        if (err || results.length == 0) {
                            errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                            done(errmsg);
                        } else {
                            var dbSuffix = results[0].dbSuffix;
                            customerDBName = __customerDBPrefix + "_" + dbSuffix;
                            done(null, "buyerCustomerDB=" + customerDBName);
                        }
                    });
                },
                function (done) {
                    db.getBuyerOrderInfo(customerDBName, filter, function (err, result) {
                        if (err) {
                            logger.error(err);
                            done(err);
                        } else {
                            orderList = result;
                            done();
                        }
                    });
                },
                function (done) {
                    async.mapSeries(
                        orderList,
                        function (item, mapCallback) {
                            db.getBuyerOrderDetailsByGuid(customerDBName, item.guid, function (err, result) {
                                if (err) {
                                    logger.error(err);
                                    mapCallback(err);
                                } else {
                                    item.orderDetails = result;
                                    mapCallback();
                                }
                            })
                        },
                        function (errs, results) {
                            if (errs) {
                                logger.error(JSON.stringify(errs));
                                done(errs);
                            } else {
                                logger.debug(JSON.stringify(results));
                                done();
                            }
                        }
                    )

                },
                function (done) {
                    //format seller orderInfo
                    underscore.map(orderList, function (item) {
                        var tempItem = {
                            billNO: item.billNO,
                            billDate: item.billDate,
                            sellerCode: item.sellerCode,
                            sellerName: item.sellerName,
                            consigneeName: item.consigneeName,
                            consigneeAddress: item.consigneeAddress,
                            consigneeMobileNum: item.consigneeMobileNum,
                            buyerEmployeeCode: item.buyerEmployeeCode,
                            buyerEmployeeName: item.buyerEmployeeName,
                            sellerEmployeeName: item.sellerEmployeeName,
                            usefulDate: item.usefulDate,
                            advGoodsArriveDate: item.advGoodsArriveDate,
                            remark: item.remark,
                            isConfirmed: item.isConfirmed,
                            confirmRemark: item.confirmRemark,
                            confirmDate: item.confirmDate,
                            isClosed: item.isClosed,
                            closeRemark: item.closeRemark,
                            closeDate: item.closeDate,
                            subtotal: 0,
                            goods: []
                        };
                        underscore.map(item.orderDetails, function (goodItem) {
                            var goodObj = {
                                key: goodItem.goodId,
                                goodId: goodItem.goodId,
                                unicode: goodItem.unicode,
                                packageQty: goodItem.packageQty,
                                sellerGoodsNo: goodItem.buyerGoodsNo,
                                quantity: goodItem.quantity,
                                inPrice: goodItem.inPrice.toFixed(__pointDigit.DEFAULT),
                                licenseNo: goodItem.licenseNo,
                                amountTax: goodItem.amountTax,
                                commonName: goodItem.commonName,
                                alias: goodItem.alias,
                                producer: goodItem.producer,
                                spec: goodItem.spec,
                                imageUrl: goodItem.imageUrl,
                                drugsType: goodItem.drugsType
                            };
                            tempItem.subtotal += (Number(goodItem.quantity) * Number(goodItem.inPrice));
                            tempItem.goods.push(goodObj);
                        });
                        tempItem.subtotal = tempItem.subtotal.toFixed(__pointDigit.DEFAULT);
                        orderResults.push(tempItem);


                    });
                    done();
                }
            ], function (err, results) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(err, orderResults);
                }
            });
        },

        /**
         * get buyer return details by id
         * @param enterpriseId
         * @param orderShipReturnId
         * @param callback
         */
        getBuyerOrderReturnDetails: function (enterpriseId, orderShipReturnId, callback) {
            logger.enter();
            var errmsg = "";
            var buyerDBName = undefined;
            var OrderReturn = undefined;
            var oriReturnDetails = undefined;
            async.series([
                    function (done) {
                        //step1 get dbname
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, enterpriseId, function (err, results) {
                            if (err || results.length == 0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null, "buyerCustomerDB=" + buyerDBName);
                            }
                        });
                    },
                    function (done) {
                        //step2 get ori orderReturn
                        db.getBuyerOrderReturnsbyId(buyerDBName, orderShipReturnId, function (err, results) {
                            if (err) {
                                errmsg = "get order return info err";
                                done(err);
                            } else {
                                OrderReturn = results;
                                logger.debug(JSON.stringify(results));
                                done(null, "get order return success");
                            }
                        });
                    },
                    function (done) {
                        //step3 get ori orderReturnsDetails
                        db.getBuyerOrderReturnDetails(buyerDBName, OrderReturn[0].guid, function (err, results) {
                            if (err) {
                                errmsg = "get order return details err";
                                done(err + errmsg);
                            } else {
                                oriReturnDetails = results;
                                logger.debug(JSON.stringify(results));
                                done(null, "get order return detils success");
                            }
                        });

                    },
                    function (done) {
                        //step4 from return data
                        var unicodes = [];
                        var newDetails = [];
                        underscore.map(oriReturnDetails, function (detail) {
                            if (unicodes.length == 0 || unicodes.indexOf(detail.unicode)==-1) {
                                unicodes.push(detail.unicode);
                                var newDetailObj = {
                                    guid: detail.guid,
                                    goodsNo: detail.goodsNo,
                                    batchDetail: [],
                                    Remark: detail.Remark,
                                    commonName: detail.commonName,
                                    alias: detail.alias,
                                    producer: detail.producer,
                                    spec: detail.spec,
                                    imageUrl: detail.imageUrl,
                                    drugsType: detail.drugsType
                                };
                                newDetails.push(newDetailObj);
                            }
                        });
                        underscore.map(oriReturnDetails, function (detail) {
                            var batchObj = {
                                batchNo: detail.batchNo,
                                batchNum: detail.batchNum,
                                quantity: detail.quantity,
                                taxPrice: detail.taxPrice,
                                price: detail.price,
                                goodsSubtotal: detail.goodsSubtotal,
                                taxSubtotal: detail.taxSubtotal,
                                subtotal: detail.subtotal
                            };
                            underscore.map(newDetails,function(item){
                                if(detail.goodsNo == item.goodsNo){
                                    item.batchDetail.push(batchObj);
                                }
                            })
                        });
                        OrderReturn[0].returnDetails = newDetails;
                        logger.debug(JSON.stringify(OrderReturn));
                        done();
                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    } else {
                        logger.debug(JSON.stringify(results));
                        callback(null, OrderReturn)
                    }
                }
            );
        },

        /**
         * get buyer orderReturns
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getBuyerOrderReturnSheets: function (enterpriseId, filter, callback) {
            logger.enter();
            var errmsg = "";
            var buyerDBName = undefined;
            var oriOrderReturns = undefined;
            var data = [];
            async.series([
                    function (done) {
                        //step1 get dbname
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, enterpriseId, function (err, results) {
                            if (err || results.length == 0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null, "buyerCustomerDB=" + buyerDBName);
                            }
                        });
                    },
                    function (done) {
                        //step2 get ori orderReturns
                        db.getBuyerOrderReturns(buyerDBName, filter, function (err, results) {
                            if (err) {
                                errmsg = "get order return info err";
                                done(err);
                            } else {
                                oriOrderReturns = results;
                                logger.debug(JSON.stringify(results));
                                done(null, "get order return success");
                            }
                        });
                    },
                    function (done) {
                        //step3 get ori orderReturnsDetails
                        async.mapSeries(
                            oriOrderReturns,
                            function (item, mapCallback) {
                                db.getBuyerOrderReturnsbyId(buyerDBName,item.guid,function(err1,results){
                                   if(!err1 && results.length>0){
                                   item.sellerName = results[0].sellerName;
                                       db.getBuyerOrderReturnDetails(buyerDBName, item.guid, function (err, results) {
                                           if (err) {
                                               errmsg = "get order return details err";
                                               mapCallback(err);
                                           } else {
                                               item.returnDetails = results;
                                               logger.debug(JSON.stringify(results));
                                               mapCallback(null, "get order return detils success");
                                           }
                                       });
                                   } else{
                                       errmsg = "get sellerName err";
                                       mapCallback(errmsg);
                                   }
                                });
                            },
                            function (errs, results) {
                                if (errs) {
                                    logger.error(JSON.stringify(errs));
                                    done(errs);
                                } else {
                                    logger.debug(JSON.stringify(results));
                                    done()
                                }

                            }
                        )

                    },
                    function (done) {
                        //step4 from return data
                        if (underscore.isEmpty(oriOrderReturns)) {
                            done()
                        } else {
                            underscore.map(oriOrderReturns, function (orderReturn) {
                                var batchNos = [];
                                var newDetails = [];
                                underscore.map(orderReturn.returnDetails, function (detail) {
                                    var batchObj = {
                                        batchNum: detail.batchNum,
                                        quantity: detail.quantity,
                                        taxPrice: detail.taxPrice,
                                        price: detail.price,
                                        goodsSubtotal: detail.goodsSubtotal,
                                        taxSubtotal: detail.taxSubtotal,
                                        subtotal: detail.subtotal
                                    };
                                    if (batchNos.length == 0 || batchNos.indexOf(detail.batchNo)) {
                                        batchNos.push(detail.batchNo);
                                        var newDetailObj = {
                                            guid: detail.guid,
                                            goodsNo: detail.goodsNo,
                                            batchNo: detail.batchNo,
                                            batchDetail: [
                                                batchObj
                                            ],
                                            Remark: detail.Remark,
                                            commonName: detail.commonName,
                                            alias: detail.alias,
                                            producer: detail.producer,
                                            spec: detail.spec,
                                            imageUrl: detail.imageUrl,
                                            drugsType: detail.drugsType
                                        };
                                        newDetails.push(newDetailObj);
                                    } else {
                                        underscore.map(newDetails, function (newItem) {
                                            if (newItem.batchNo == detail.batchNo) {
                                                newItem.batchDetail.push(batchObj);
                                            }
                                        })
                                    }
                                });
                                orderReturn.returnDetails = newDetails;
                                data.push(orderReturn);
                            });
                            done();
                        }
                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    } else {
                        logger.debug(JSON.stringify(results));
                        callback(null, data)
                    }
                }
            );
        },
        /**
         * get buyer ship details
         * @param enterpriseId
         * @param shipInfoId
         * @param callback
         */
        getBuyerShipDetailsById: function (enterpriseId, shipInfoId, callback) {
            logger.enter();
            var orderShip = {};
            var errmsg = "";
            var buyerDBName = undefined;
            var oriShipDetails = [];
            async.series([
                    function (done) {
                        //step1 get buyer dbname
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, enterpriseId, function (err, results) {
                            if (err || results.length == 0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null, "buyerCustomerDB=" + buyerDBName);
                            }
                        });
                    },
                    function (done) {
                        //step2 get ori shipdetails info
                        db.getBuyerShipDetails(buyerDBName, shipInfoId, function (err, results) {
                            if (err) {
                                done(err);
                            } else {
                                oriShipDetails = results;
                                done();
                            }
                        });
                    },
                    function (done) {
                        //step2 get ship monitor info
                        async.mapSeries(
                            oriShipDetails,
                            function(item,mapCallback){
                                db.getBuyerShipMonitors(buyerDBName, item.shipDetailNo, function (err, results) {
                                    if (err) {
                                        mapCallback(err);
                                    } else {
                                        if(results.length>0){
                                            item.monitor = results[0];
                                        }else{
                                            item.monitor = {
                                                drugESC:"",
                                                packingSpec:""
                                            };
                                        }
                                        mapCallback();
                                    }
                                });
                            },
                            function(errs,results){
                                if(errs){
                                    logger.error(JSON.stringify(errs));
                                    done(errs);
                                }else{
                                    logger.debug(JSON.stringify(results));
                                    done();

                                }

                            }
                        )

                    },
                    function (done) {
                        //step3 form shipDetails
                        if (oriShipDetails.length > 0) {
                            orderShip = {
                                billNo: oriShipDetails[0].billNo,
                                billDate: oriShipDetails[0].billDate,
                                billTime: oriShipDetails[0].billTime,
                                orderBillNo: oriShipDetails[0].orderBillNo,
                                orderGuid: oriShipDetails[0].orderGuid,
                                notes:oriShipDetails[0].notes ,
                                FHRY: oriShipDetails[0].FHRY,
                                FHRQ: oriShipDetails[0].FHRQ,
                                buyerName: oriShipDetails[0].sellerName,
                                buyerCode: oriShipDetails[0].sellerCode,
                                isShipped:oriShipDetails[0].isShipped,
                                shipDetails:[]

                            };


                            var buyerGoodsNos = [];
                            underscore.map(oriShipDetails,function(item){
                                var shipDetailObj = {
                                    key:item.detailId,  // 唯一标识
                                    shipDetailNo: item.shipDetailNo,
                                    shipDetailDate: item.shipDetailDate,
                                    buyerGoodsNo: item.buyerGoodsNo,
                                    remark: item.remark,
                                    salesType: item.salesType,
                                    orderDetailGuid: item.orderDetailGuid,
                                    commonName: item.commonName,
                                    alias: item.alias,
                                    producer: item.producer,
                                    spec: item.spec,
                                    imageUrl: item.imageUrl,
                                    drugsType: item.drugsType,
                                    batchDetails:[]
                                };
                                if(buyerGoodsNos.length ==0 || buyerGoodsNos.indexOf(item.buyerGoodsNo)==-1){
                                    buyerGoodsNos.push(item.buyerGoodsNo);
                                    orderShip.shipDetails.push(shipDetailObj);
                                }

                            });

                            underscore.map(oriShipDetails,function(item){
                                var batchDetailObj = {
                                    buyerGoodsNo: item.buyerGoodsNo,
                                    batchNo :item.batchNo,
                                    batchNum: item.batchNum,
                                    taxPrice: item.taxPrice,
                                    goodsValidDate: item.goodsValidDate,
                                    goodsProduceDate: item.goodsProduceDate,
                                    quantity: item.quantity,
                                    inspectReportUrl: item.inspectReportUrl,
                                    drugESC:item.drugESC
                                };
                                underscore.map(orderShip.shipDetails,function(detail){
                                    if(detail.buyerGoodsNo==item.buyerGoodsNo){
                                        detail.batchDetails.push(batchDetailObj);
                                    }
                                });
                            });
                            done();
                        } else {
                            done();
                        }

                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    } else {
                        logger.debug(JSON.stringify(results));
                        callback(null, orderShip);
                    }
                }
            );
        },

        /**
         * get all buyer shipInfos
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getBuyerShips: function (enterpriseId, filter, callback) {
            logger.enter();
            var shipInfos = [];
            var errmsg = "";
            var buyerDBName = undefined;
            var oriShipInfos = [];
            async.series([
                    function (done) {
                        //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, Number(enterpriseId), function (err, results) {
                            if (err || results.length == 0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null, "buyerCustomerDB=" + buyerDBName);
                            }
                        });
                    },
                    function (done) {
                        //step2 get ori shipInfos according to filter
                        db.getBuyerShipInfos(buyerDBName, filter, function (err, results) {
                            if (err) {
                                done(err);
                            } else {
                                oriShipInfos = results;
                                done();
                            }
                        });
                    },
                    function (done) {
                        //step3 form shipInfos
                        if (oriShipInfos.length > 0) {
                            var index = 0;
                            underscore.map(oriShipInfos, function (ship) {
                                index++;
                                ship.key = index;
                                shipInfos.push(ship);
                            });
                            done();
                        } else {
                            done();
                        }

                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        callback(errs);
                    } else {
                        logger.debug(JSON.stringify(results));
                        callback(null, shipInfos);
                    }
                }
            );
        },

        /**
         * get buyer quotations
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getBuyerQuotationSheets: function (enterpriseId, filter, callback) {
            logger.enter();
            var errmsg = "";
            var buyerDBName = undefined;
            var inquiryOri = undefined;
            var quotations = [];
            filter.type = "QUOTATION";
            async.series([
                    function (done) {
                        //step1 get buyer dbname
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, enterpriseId, function (err, results) {
                            if (err || results.length == 0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null, "buyerCustomerDB=" + buyerDBName);
                            }
                        });
                    },
                    function (done) {
                        //step2 get data from sellerinquiry
                        db.getBuyerInquirys(buyerDBName, filter, function (err, results) {
                            if (err) {
                                errmsg = "get buyer inquiry err";
                                done(err);
                            } else {
                                inquiryOri = results;
                                logger.debug("buyer inquirys = "+JSON.stringify(results));
                                done(null, "get buyer inquirys success");
                            }
                        });
                    },
                    function (done) {
                        //step3 get data from buyerinquiry
                        async.mapSeries(
                            inquiryOri,
                            function (item, mapCallback) {
                                db.getBuyerInquiryDetailsById(buyerDBName, item.inquiryId, function (err, results) {
                                    if (err) {
                                        errmsg = "get buyer inquiry detail err,inquiryId=";
                                        mapCallback(err);
                                    } else {
                                        item.inquiryDetails = results;
                                        logger.debug("buyer inquiry details = "+JSON.stringify(results));
                                        mapCallback(null, "get buyer inquiry details success,inquiryId=" + item.inquiryId);
                                    }
                                });
                            },
                            function (errs, results) {
                                if (errs) {
                                    logger.error(JSON.stringify(errs));
                                    done(errs);
                                } else {
                                    logger.debug(JSON.stringify(results));
                                    done();
                                }

                            }
                        )

                    },
                    function (done) {
                        //step3 get data from buyer quotations
                        async.mapSeries(
                            inquiryOri,
                            function (item, mapCallback) {
                                db.getBuyerQuotations(buyerDBName, item.inquiryId, function (err, results) {
                                    if (err) {
                                        errmsg = "get buyer quotation err";
                                        mapCallback(err);
                                    } else {
                                        item.quotationDetails = results;
                                        logger.debug("buyer quotations = "+JSON.stringify(results));
                                        mapCallback(null, "get buyer ori quotations success");
                                    }
                                });
                            },
                            function (errs, results) {
                                if (errs) {
                                    logger.error(JSON.stringify(errs));
                                    done(errs);
                                } else {
                                    logger.debug(JSON.stringify(results));
                                    done();
                                }
                            }
                        )
                    },

                    function (done) {
                        //step4 form data for inquirySheets
                        underscore.map(inquiryOri,function(obj){
                           var inquiryCommon = {
                               key:obj.guid,
                               inquiryId:obj.inquiryId,
                               guid: obj.guid,
                               createdOn: obj.createdOn,
                               inquirySuppliers:0,
                               quotationSuppliers:0,
                               inquiryGoodsTypes:0,
                               quotationGoodsTypes:0,
                               quotationDate:obj.quotationDate,
                               inquiryExpire:""
                           };
                               if(obj.inquiryDetails.length>0){
                                   inquiryCommon.inquiryExpire = obj.inquiryDetails[0].inquiryExpire
                               }
                               var inqSuppliers = [];
                               var inqGoods = [];
                               underscore.map(obj.inquiryDetails,function(inquiryItem){
                                   if(inqSuppliers.length == 0 || inqSuppliers.indexOf(inquiryItem.objectId)==-1){
                                       inqSuppliers.push(inquiryItem.objectId);
                                   }
                                   if(inqGoods.length == 0 || inqGoods.indexOf(inquiryItem.unicode)==-1){
                                       inqGoods.push(inquiryItem.unicode);
                                   }
                               });
                               inquiryCommon.inquirySuppliers = inqSuppliers.length;
                               inquiryCommon.inquiryGoodsTypes = inqGoods.length;

                               var quoSuppliers = [];
                               var quoGoods = [];
                               underscore.map(obj.quotationDetails,function(inquiryItem){
                                   if(quoSuppliers.length == 0 || quoSuppliers.indexOf(inquiryItem.sellerId)==-1){
                                       quoSuppliers.push(inquiryItem.sellerId);
                                   }
                                   if(quoGoods.length == 0 || quoGoods.indexOf(inquiryItem.unicode)==-1){
                                       quoGoods.push(inquiryItem.unicode);
                                   }
                               });
                               inquiryCommon.quotationSuppliers = quoSuppliers.length;
                               inquiryCommon.quotationGoodsTypes = quoGoods.length;
                           quotations.push(inquiryCommon);
                        });
                        done();
                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        callback(errmsg);
                    } else {
                        logger.debug(JSON.stringify(results));
                        callback(null, quotations);
                    }
                }
            );

        },

        /**
         * get buyer quotation details by id
         * @param enterpriseId
         * @param inquiryId
         * @param callback
         */
        getBuyerQuotationDetails: function (enterpriseId, inquiryId, callback) {
            logger.enter();
            var errmsg = "";
            var buyerDBName = undefined;
            var quotationOri = undefined;
            var quotation = {};
            async.series([
                    function (done) {
                        //step1 get buyerDBName
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, enterpriseId, function (err, results) {
                            if (err) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null, "buyerCustomerDB=" + buyerDBName);
                            }
                        });
                    },
                    function (done) {
                        //step2 get data from buyer quotation
                        db.getBuyerInquiryById(buyerDBName, inquiryId, function (err, results) {
                            if (err) {
                                errmsg = "get buyer quotation details err";
                                done(err);
                            } else {
                                quotationOri = results;
                                logger.debug(JSON.stringify(results));
                                done(null, "get buyer quotation success");
                            }
                        });
                    },
                    function (done) {
                        //step3 form data for inquirySheets
                        if(quotationOri.length >0){
                            quotation.inquiryId = quotationOri[0].inquiryId;
                            quotation.guid = quotationOri[0].guid;
                            quotation.inquiryExpire = quotationOri[0].inquiryExpire;
                            quotation.goods = [];
                            var unicodes = [];
                            underscore.map(quotationOri, function (item) {
                                var goodsObj = {
                                    key: item.id,
                                    inquiryId: item.inquiryId,
                                    unicode: item.unicode,
                                    packageQty: item.packageQty,
                                    licenseNo: item.buyerPZWH,
                                    inquiryExpire: item.inquiryExpire,
                                    inquiryQuantity: item.inquiryQuantity,
                                    purchaseUpset: item.purchaseUpset,
                                    lastErpPrice: item.lastErpPrice,
                                    clearingPeriod: item.clearingPeriod,
                                    commonName: item.commonName,
                                    alias: item.alias,
                                    producer: item.producer,
                                    spec: item.spec,
                                    imageUrl: item.imageUrl,
                                    drugsType: item.drugsType,
                                    suppliers:[]
                                };
                                var supplierObj = {
                                    key:item.sellerId,
                                    billNo: item.billNo,
                                    sellerId: item.sellerId,
                                    sellerName: item.sellerName,
                                    quotationQuantity: item.quotationQuantity,
                                    quotationPrice: item.quotationPrice,
                                    quotationExpire: item.quotationExpire
                                };
                                if(unicodes.length == 0 || unicodes.indexOf(item.unicode)==-1){
                                    unicodes.push(item.unicode);
                                    goodsObj.suppliers.push(supplierObj);
                                    quotation.goods.push(goodsObj);
                                }else{
                                    underscore.map(quotation.goods,function(good){
                                        if(good.unicode === item.unicode){
                                            good.suppliers.push(supplierObj);
                                        }
                                    })
                                }
                            });
                        }
                        done();
                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        callback(errmsg);
                    } else {
                        logger.debug(JSON.stringify(results));
                        callback(null, quotation);
                    }
                }
            );

        },
        /**
         * get buyer inquiry details by id
         * @param enterpriseId
         * @param inquiryId
         * @param callback
         */
        getBuyerInquiryDetails: function (enterpriseId, inquiryId, callback) {
            logger.enter();
            var errmsg = "";
            var buyerDBName = undefined;
            var inquiryOri = undefined;
            var inquiryDetailObj = {};
            async.series([
                    function (done) {
                        //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, enterpriseId, function (err, results) {
                            if (err) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null, "buyerCustomerDB=" + buyerDBName);
                            }
                        });
                    },
                    function (done) {
                        //step2 get data from buyerinquiry
                        db.getBuyerInquiryById(buyerDBName, inquiryId, function (err, results) {
                            if (err) {
                                errmsg = "get buyer inquiry err";
                                done(err);
                            } else {
                                inquiryOri = results;
                                logger.debug(JSON.stringify(results));
                                done(null, "get buyer inquirys success");
                            }
                        });
                    },
                    function (done) {
                        //step3 get data from buyer quotation history
                        async.mapSeries(
                            inquiryOri,
                            function (item, mapCallback) {
                                db.getNearBuyerQuoationHistory(buyerDBName, item, function (err, results) {
                                    if (results.length > 0) {
                                        item.lastQuotationQuantity = results[0].quotationQuantity;
                                        item.lastQuotationPrice = results[0].quotationPrice;
                                        item.lastQuotationDate = results[0].createdOn;
                                    }
                                    if (results.length == 0) {
                                        item.lastQuotationQuantity = null;
                                        item.lastQuotationPrice = null;
                                        item.lastQuotationDate = null;
                                    }
                                    mapCallback(err, results);
                                })
                            },
                            function (errs, results) {
                                if (errs) {
                                    logger.error(JSON.stringify(errs));
                                    errmsg = "get buyer quotation history err";
                                    done(errmsg);
                                } else {
                                    logger.debug("get buyer quotation history done" + JSON.stringify(results));
                                    done();
                                }

                            }
                        )
                    },
                    function (done) {
                        //step4 form data for inquirySheets
                        inquiryDetailObj = {
                            inquiryId:inquiryOri[0].inquiryId,
                            guid:inquiryOri[0].guid,
                            inquiryExpire : inquiryOri[0].inquiryExpire,
                            goods:[]
                        };
                        var unicodes = [];
                        underscore.map(inquiryOri, function (item) {
                            var goodsObj = {
                                key: item.id,
                                unicode: item.unicode,
                                packageQty: item.packageQty,
                                licenseNo: item.buyerPZWH,
                                inquiryExpire: item.inquiryExpire,
                                inquiryQuantity: item.inquiryQuantity,
                                purchaseUpset: item.purchaseUpset,
                                lastErpPrice: item.lastErpPrice,
                                clearingPeriod: item.clearingPeriod,
                                commonName: item.commonName,
                                alias: item.alias,
                                producer: item.producer,
                                spec: item.spec,
                                imageUrl: item.imageUrl,
                                drugsType: item.drugsType,
                                suppliers:[]
                            };
                            var supplierObj = {
                                key:item.sellerId,
                                objectId: item.sellerId,
                                sellerName: item.sellerName,
                                billNo: item.billNo,
                                lastQuotationPrice: item.lastQuotationPrice,
                                lastQuotationDate: item.lastQuotationDate,
                                lastQuotationQuantity:item.lastQuotationQuantity
                            };
                            if(unicodes.length == 0 || unicodes.indexOf(item.unicode)==-1){
                                unicodes.push(item.unicode);
                                goodsObj.suppliers.push(supplierObj);
                                inquiryDetailObj.goods.push(goodsObj);
                            }else{
                                underscore.map(inquiryDetailObj.goods,function(good){
                                    if(good.unicode === item.unicode){
                                        good.suppliers.push(supplierObj);
                                    }
                                })
                            }
                        });
                        logger.debug(JSON.stringify(inquiryDetailObj));
                        done();
                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error(JSON.stringify(errs));
                        callback(errmsg);
                    } else {
                        logger.debug(JSON.stringify(results));
                        callback(null, inquiryDetailObj);
                    }
                }
            );
        },

        /**
         *get all inquirys
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getBuyerInquirySheets: function (enterpriseId, filter, callback) {
            logger.enter();
            var errmsg = "";
            var dbName = undefined;
            var inquiryOri = undefined;
            var inquirys = [];
            filter.type = "INQUIRY";
            async.series([
                    function (done) {
                        //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql, __cloudDBName, enterpriseId, function (err, results) {
                            if (err) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                if (results.length) {
                                    var dbSuffix = results[0].dbSuffix;
                                    dbName = __customerDBPrefix + "_" + dbSuffix;
                                    done(null, "buyerDBName=" + dbName);
                                } else
                                    done(null);
                            }
                        });
                    },
                    function (done) {
                        //step2 get data from sellerinquiry
                        db.getBuyerInquirys(dbName, filter, function (err, results) {
                            if (err) {
                                errmsg = "get buyer inquiry err";
                                done(err);
                            } else {
                                inquiryOri = results;
                                logger.debug(JSON.stringify(results));
                                done(null, "get buyer inquirys success");
                            }
                        });
                    },
                    function (done) {
                        //step3 get data from buyerinquiry
                        async.mapSeries(
                            inquiryOri,
                            function (item, mapCallback) {
                                db.getBuyerInquiryDetailsById(dbName, item.inquiryId, function (err, results) {
                                    if (err) {
                                        errmsg = "get buyer inquiry detail err,inquiryId=";
                                        mapCallback(err);
                                    } else {
                                        item.inquiryDetails = results;
                                        logger.debug(JSON.stringify(results));
                                        mapCallback(null, "get buyer inquiry details success,inquiryId=" + item.inquiryId);
                                    }
                                });
                            },
                            function (errs, results) {
                                if (errs) {
                                    logger.error(JSON.stringify(errs));
                                    done(errs);
                                } else {
                                    logger.debug(JSON.stringify(results));
                                    done();
                                }

                            }
                        )

                    },
                    function (done) {
                        //step3 form data for inquirySheets
                        underscore.map(inquiryOri, function (obj) {
                            var inquiryObj = {
                                key: obj.guid,
                                inquiryId: obj.inquiryId,
                                guid: obj.guid,
                                createdOn: obj.createdOn,
                                typesCount: 0,
                                suplierCount: 0,
                                subtotal: 0,
                                addInquiryDetails: []
                            };
                            var types = [];
                            var suppliers = [];
                            underscore.map(obj.inquiryDetails, function (item) {
                                if (types.length == 0 || types.indexOf(item.unicode) == -1) {
                                    types.push(item.unicode);
                                }
                                if (suppliers.length == 0 || suppliers.indexOf(item.objectId) == -1) {
                                    suppliers.push(item.objectId);
                                }

                                var inquiryDetailObj = {
                                    key: item.unicode,
                                    unicode: item.unicode,
                                    packageQty: item.packageQty,
                                    billNo: item.billNo,
                                    licenseNo: item.buyerPZWH,
                                    objectId: item.objectId,
                                    inquiryExpire: item.inquiryExpire,
                                    inquiryQuantity: item.inquiryQuantity,
                                    purchaseUpset: item.purchaseUpset,
                                    lastErpPrice: item.lastErpPrice,
                                    clearingPeriod: item.clearingPeriod,
                                    commonName: item.commonName,
                                    alias: item.alias,
                                    producer: item.producer,
                                    spec: item.spec,
                                    imageUrl: item.imageUrl,
                                    drugsType: item.drugsType
                                };
                                inquiryObj.addInquiryDetails.push(inquiryDetailObj);
                                inquiryObj.subtotal += (Number(item.inquiryQuantity) * Number(item.purchaseUpset));
                            });
                            inquiryObj.subtotal = inquiryObj.subtotal.toFixed(__pointDigit.DEFAULT);
                            inquiryObj.typesCount = types.length;
                            inquiryObj.supplierCount = suppliers.length;
                            inquirys.push(inquiryObj);
                        });
                        done();
                    }
                ],
                function (errs, results) {
                    if (errs) {
                        logger.error("Error to get buyer's inquerySheets");
                        callback(errmsg);
                    } else {
                        callback(null, inquirys);
                    }
                }
            );

        }
    };

    function formatBuyerOrderInfo(orderArray, pageIndex, pageSize) {
        var orderList = underscore.chain(orderArray)
            .groupBy(function (item) {
                return item.guid;
            })
            .map(function (item) {
                var tempItem = {
                    billNO: item[0].billNO,
                    billDate: item[0].billDate,
                    sellerCode: item[0].sellerCode,
                    sellerName: item[0].sellerName,
                    consigneeName: item[0].consigneeName,
                    consigneeAddress: item[0].consigneeAddress,
                    consigneeMobileNum: item[0].consigneeMobileNum,
                    buyerEmployeeCode: item[0].buyerEmployeeCode,
                    buyerEmployeeName: item[0].buyerEmployeeName,
                    sellerEmployeeName: item[0].sellerEmployeeName,
                    usefulDate: item[0].usefulDate,
                    advGoodsArriveDate: item[0].advGoodsArriveDate,
                    remark: item[0].remark,
                    isConfirmed: item[0].isConfirmed,
                    confirmRemark: item[0].confirmRemark,
                    confirmDate: item[0].confirmDate,
                    isClosed: item[0].isClosed,
                    closeRemark: item[0].closeRemark,
                    closeDate: item[0].closeDate
                };

                tempItem.subtotal = underscore(item).reduce(function (memo, item) {
                    return memo + Number(item.quantity) * Number(item.inPrice);
                }, 0);

                tempItem.goods = [];
                underscore.each(item, function (goodItem) {

                    var goodObj = {
                        goodId: goodItem.goodId,
                        unicode: goodItem.unicode,
                        packageQty: goodItem.packageQty,
                        buyerGoodsNo: goodItem.buyerGoodsNo,
                        quantity: goodItem.quantity,
                        inPrice: goodItem.inPrice,
                        licenseNo: goodItem.licenseNo,
                        amountTax: goodItem.amountTax,
                        commonName: goodItem.commonName,
                        alias: goodItem.alias,
                        producer: goodItem.producer,
                        spec: goodItem.spec,
                        imageUrl: goodItem.imageUrl,
                        drugsType: goodItem.drugsType
                    };
                    tempItem.goods.push(goodObj);
                });

                return tempItem;

            }).value();
        return underscore.isUndefined(pageIndex) ?
            orderList : purePaginator.getCurrentPageDatas(pageIndex, pageSize, orderList);
    }

    return model;
};