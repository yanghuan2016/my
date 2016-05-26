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
    var cloudDbName = __cloudDBName;
    var enterpriseDbPrefix = __customerDBPrefix;

    /*
     * load 3rd party modules
     */
    var underscore = require("underscore");
    var purePaginator=require(__base+"/modules/purePaginator");
    var async = require("async");
    var _ = require("lodash");

    /*
     * init model name etc
     */
    var MODELNAME = __dirname.split("/").pop();
    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {

        getSellerOrderInfoByOrderId:function(enterpriseId,orderId,callback){
            logger.enter();
            var sellerDBName=null;
            async.series([
                function(done){
                    db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                        if (err) {
                           logger.error(err);
                            done(err);
                        } else {
                            var dbSuffix = results[0].dbSuffix;
                            sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                            done(null,"sellerCustomerDB=" + sellerDBName);
                        }
                    });
                },
                function(done){
                    db.getSellerOrderByOrderId(sellerDBName,orderId,function(err,result){
                        if(err){
                            logger.error(err);
                            done(err);
                        }else{
                            done(err,formatSellerOrderInfo(result));
                        }
                    });
                }
            ],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results[1][0]);
                }
            })
        },
        getSellerOrderList:function(enterpriseId,filter,callback){
            logger.enter();
            var sellerDBName=null,
                orderList=[],
                orderResults = [],
                errmsg = "";
            async.series([
                    function(done){
                        //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                            if (err||results.length ==0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            }   else {
                                var dbSuffix = results[0].dbSuffix;
                                sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null,"sellerCustomerDB=" + sellerDBName);
                            }
                        });
                    },
                    function(done){
                        db.getSellerOrderInfo(sellerDBName,filter,function(err,results){
                            if(!err){
                                orderList = results;
                            }
                            done(err,results);
                        })
                    },
                    function(done){
                        async.mapSeries(
                            orderList,
                            function(item,mapCallback){
                                db.getSellerOrderDetailsByGuid(sellerDBName,item.guid,function(err,result){
                                    if(err){
                                        logger.error(err);
                                        mapCallback(err);
                                    }else{
                                        item.orderDetails=result;
                                        mapCallback();
                                    }
                                })
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
                    function(done){
                        //format seller orderInfo
                         underscore.map(orderList,function(item){
                             var tempItem={
                                 key:item.billNO,
                                 billNo: item.billNO,
                                 billDate: item.billDate,
                                 buyerCode: item.buyerCode,
                                 buyerName: item.buyerName,
                                 consigneeName: item.consigneeName,
                                 consigneeAddress: item.consigneeAddress,
                                 consigneeMobileNum:item.consigneeMobileNum ,
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
                                 subtotal:0,
                                 goods:[]
                             };
                             underscore.map(item.orderDetails,function(goodItem){
                                 var goodObj={
                                     key:goodItem.goodId,
                                     goodId:goodItem.goodId,
                                     unicode:goodItem.unicode,
                                     packageQty:goodItem.packageQty,
                                     sellerGoodsNo:goodItem.sellerGoodsNo,
                                     quantity: goodItem.quantity,
                                     inPrice: goodItem.price.toFixed(__pointDigit.DEFAULT),
                                     licenseNo: goodItem.licenseNo,
                                     amountTax: goodItem.amountTax,
                                     commonName: goodItem.commonName,
                                     alias: goodItem.alias,
                                     producer: goodItem.producer,
                                     spec: goodItem.spec,
                                     imageUrl: goodItem.imageUrl,
                                     drugsType: goodItem.drugsType
                                 };
                                 tempItem.subtotal+=(Number(goodItem.quantity)*Number(goodItem.price));
                                 tempItem.goods.push(goodObj);
                             });
                             tempItem.subtotal=tempItem.subtotal.toFixed(__pointDigit.DEFAULT);
                             orderResults.push(tempItem);
                         });
                         done();
                    }
            ],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,orderResults);
                }
            })
        }
        ,
        /**
         *
         * @param enterpriseId
         * @param filter
         * @param callback
         * @constructor
         */
        retrieveOrderShipReturns:function (enterpriseId, filter, callback) {
            logger.enter();

            // 步骤说明:
            // 1. 先用enterpriseId找到库名
            // 2. 按照filter,先做链接,在查询数据,
            // 3. 将筛选出来的returnId用来当做关键字,再次进行详情的查询.
            // 4. 将详情查询出来, 做格式转换.
            var sellerDbName = null;            // 在函数 1. 中被赋值
            var sellerReturnInfoGuids = null;     // 在函数 2. 中被赋值, 根据filter查询出来,退货单Id
            var sellerReturnInfoDetails = null;     // 在函数 3. 中被赋值, 根据 sellerReturnInfoGuids 查出seller退货详情.
            async.series(
                [
                    // 1. 根据enterpriseId查询enterpriseInfo, 并且拿到数据库名称.
                    function (callback) {
                        retrieveEnterpriseInfoByEnterpriseId(cloudDbName, enterpriseId, function (error, enterpriseInfo) {
                            if (error) {
                                logger.error(error);
                                return callback(error);
                            }
                            if (enterpriseInfo.length === 0) {
                                return callback(new Error('没有查询到enterpriseId为;' + enterpriseId + " 的数据."));
                            }
                            sellerDbName = enterpriseDbPrefix + '_' + enterpriseInfo[0].customerDBSuffix;
                            logger.debug(sellerDbName);
                            callback(null,enterpriseInfo);
                        });
                    },
                    // 2. 根据filter拿到returnInfo的数据,只需要returnInfo.guid即可
                    function (callback) {
                        db.retrieveSellerReturnInfos(sellerDbName, filter, function (error, returnInfos) {
                            if (error) {
                                logger.error(error);
                                return callback(error);
                            }

                            sellerReturnInfoGuids = _.map(returnInfos, function (item) {
                                return item.guid;
                            });
                            callback(null, sellerReturnInfoGuids);
                        });
                    },
                    // 3. 根据上一步的sellerReturnInfoGuids 去拿到returnDetails
                    function (callback) {
                        db.retrieveSellerReturnDetailsByGuid(sellerDbName, sellerReturnInfoGuids, function (error, returnInfoDetails) {
                            if (error) {
                                logger.error(error);
                                return callback(error);
                            }
                            sellerReturnInfoDetails = returnInfoDetails;
                            callback(null, sellerReturnInfoDetails);
                        });
                    },
                    // 4. 对 sellerReturnInfoDetails 转格式:
                    function (callback) {
                        // 格式转化
                        sellerReturnInfoDetails = formatReturnInfoDetails(sellerReturnInfoDetails);
                        callback(null, sellerReturnInfoDetails);
                    }
                ],
                function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }
                    logger.ndump(JSON.stringify(result));
                    callback(null, sellerReturnInfoDetails)
                }
            );
        },

        retrieveOrderShipReturnByReturnGuid: function (enterpriseId, orderShipReturnId, callback) {
            logger.enter();

            var sellerDbName = null;            // 在函数 1. 中被赋值
            var sellerReturnInfoGuids = [orderShipReturnId];
            var sellerReturnInfoDetails = null;     // 在函数 3. 中被赋值, 根据 sellerReturnInfoGuids 查出seller退货详情.
            async.series(
                [
                    function (callback) {
                        retrieveEnterpriseInfoByEnterpriseId(cloudDbName, enterpriseId, function (error, enterpriseInfo) {
                            if (error) {
                                logger.error(error);
                                return callback(error);
                            }
                            if (enterpriseInfo.length === 0) {
                                return callback(new Error('没有查询到enterpriseId为;' + enterpriseId + " 的数据."));
                            }
                            sellerDbName = enterpriseDbPrefix + '_' + enterpriseInfo[0].customerDBSuffix;

                            callback(null,enterpriseInfo);
                        });
                    },
                    // 2. sellerReturnInfoGuids 去拿到returnDetails
                    function (callback) {
                        db.retrieveSellerReturnDetailsByGuid(sellerDbName, sellerReturnInfoGuids, function (error, returnInfoDetails) {
                            if (error) {
                                logger.error(error);
                                return callback(error);
                            }
                            logger.debug(JSON.stringify(returnInfoDetails));
                            sellerReturnInfoDetails = returnInfoDetails;
                            callback(null, returnInfoDetails);
                        });
                    },
                    // 3. 对 sellerReturnInfoDetails 转格式:
                    function (callback) {
                        // 格式转化
                        sellerReturnInfoDetails = formatReturnInfoDetails(sellerReturnInfoDetails);
                        callback(null, sellerReturnInfoDetails);
                    }
                ],
                function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }
                    logger.ndump(JSON.stringify(result));
                    callback(null, sellerReturnInfoDetails);
                }
            );
        },

        /**
         * get seller ship details by id
         * @param enterpriseId
         * @param shipInfoId
         * @param callback
         */
        getSellerShipDetailsById : function(enterpriseId,shipInfoId,callback){
            logger.enter();
            var orderShip = {};
            var errmsg = "";
            var sellerDBName = undefined;
            var oriShipDetails = [];
            async.series([
                    function(done){
                        //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                            if (err||results.length ==0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null,"sellerCustomerDB=" + sellerDBName);
                            }
                        });
                    },
                    function(done){
                        //step2 get ori shipInfos according to filter
                        db.getSellerShipDetails(sellerDBName,shipInfoId,function(err,results){
                            if(err){
                                done(err);
                            }else{
                                oriShipDetails = results;
                                done();
                            }
                        });
                    },
                    function(done){
                        //step3 form shipDetails
                        if(oriShipDetails.length>0){
                            orderShip = {
                                billNo: oriShipDetails[0].billNo,
                                billDate: oriShipDetails[0].billDate,
                                billTime: oriShipDetails[0].billTime,
                                orderBillNo: oriShipDetails[0].orderBillNo,
                                orderGuid: oriShipDetails[0].orderGuid,
                                notes:oriShipDetails[0].notes ,
                                FHRY: oriShipDetails[0].FHRY,
                                FHRQ: oriShipDetails[0].FHRQ,
                                buyerGuid: oriShipDetails[0].buyerGuid,
                                buyerName: oriShipDetails[0].buyerName,
                                buyerCode: oriShipDetails[0].buyerCode,
                                isShipped:oriShipDetails[0].isShipped,
                                shipDetails:[]

                            };


                            var sellerGoodsNos = [];
                            underscore.map(oriShipDetails,function(item){
                                var shipDetailObj = {
                                    key:item.detailId,  // 唯一标识
                                    shipDetailNo: item.shipDetailNo,
                                    shipDetailDate: item.shipDetailDate,
                                    sellerGoodsNo: item.sellerGoodsNo,
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
                                if(sellerGoodsNos.length ==0 || sellerGoodsNos.indexOf(item.sellerGoodsNo)==-1){
                                    sellerGoodsNos.push(item.sellerGoodsNo);
                                    orderShip.shipDetails.push(shipDetailObj);
                                }

                            });

                            underscore.map(oriShipDetails,function(item){
                                var batchDetailObj = {
                                    sellerGoodsNo: item.sellerGoodsNo,
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
                                   if(detail.sellerGoodsNo==item.sellerGoodsNo){
                                       detail.batchDetails.push(batchDetailObj);
                                   }
                                });
                            });
                            done();
                        }else{
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
                        callback(null,orderShip);
                    }
                }
            );
        },

        /**
         * get all seller shipInfos
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getSellerShips : function(enterpriseId,filter,callback){
            logger.enter();
            var shipInfos = [];
            var errmsg = "";
            var sellerDBName = undefined;
            var oriShipInfos = [];
            async.series([
                    function(done){
                    //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                            if (err||results.length ==0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null,"sellerCustomerDB=" + sellerDBName);
                            }
                        });
                    },
                    function(done){
                        //step2 get ori shipInfos according to filter
                        db.getSellerShipInfos(sellerDBName,filter,function(err,results){
                            if(err){
                                done(err);
                            }else{
                                oriShipInfos = results;
                                done();
                            }
                        });
                    },
                    function(done){
                        //step3 form shipInfos
                        if(oriShipInfos.length>0){
                            var index = 0;
                            underscore.map(oriShipInfos,function(ship){
                                index++;
                                ship.key = index;
                                shipInfos.push(ship);
                            });
                            done();
                        }else{
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
                        callback(null,shipInfos);
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
        getSellerInquirySheetes : function(enterpriseId,filter,callback){
            logger.enter();
            var errmsg = "";
            var sellerDBName = undefined;
            var inquiryOri = undefined;
            var inquirys = [];
            filter.type="INQUIRY";
            async.series([
                    function(done){
                        //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                            if (err||results.length ==0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null,"sellerCustomerDB=" + sellerDBName);
                            }
                        });
                    },
                    function(done){
                        //step2 get data from sellerinquiry
                        db.getSellerInquirys(sellerDBName,filter,function(err,results){
                            if(err){
                                errmsg = "get seller inquiry err";
                                done(err);
                            }else{
                                inquiryOri = results;
                                logger.debug(JSON.stringify(results));
                                done(null,"get seller inquirys success");
                            }
                        });
                    },
                    function(done){
                        //step3 get data from buyerinquiry
                        async.mapSeries(
                            inquiryOri,
                            function(item,mapCallback){
                                db.getSellerInquiryDetailsById(sellerDBName,item.inquiryId,function(err,results){
                                    if(err){
                                        errmsg = "get seller inquiry detail err,inquiryId=";
                                        mapCallback(err);
                                    }else{
                                        item.inquiryDetails= results;
                                        logger.debug(JSON.stringify(results));
                                        mapCallback(null,"get seller inquiry details success,inquiryId="+item.inquiryId);
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
                    function(done){
                        //step3 form data for inquirySheets
                        underscore.map(inquiryOri,function(obj){
                            var inquiryObj={
                                key: obj.guid,
                                inquiryId: obj.inquiryId,
                                guid: obj.guid,
                                createdOn:obj.createdOn,
                                typesCount: 0,
                                subtotal: 0,
                                addInquiryDetails:[]
                            };
                            underscore.map(obj.inquiryDetails,function(item){
                                var inquiryDetailObj = {
                                    key: item.unicode,
                                    inquiryId: obj.inquiryId,
                                    guid: obj.guid,
                                    unicode:item.unicode,
                                    packageQty: item.packageQty,
                                    billNo:item.billNo,
                                    licenseNo:item.sellerPZWH,
                                    buyerId: item.objectId,
                                    inquiryExpire: item.inquiryExpire,
                                    inquiryQuantity: item.inquiryQuantity,
                                    purchaseUpset: item.purchaseUpset,
                                    lastErpPrice: item.lastErpPrice,
                                    clearingPeriod: item.clearingPeriod,
                                    buyerName:item.buyerName,
                                    commonName: item.commonName,
                                    alias: item.alias,
                                    producer: item.producer,
                                    spec: item.spec,
                                    imageUrl: item.imageUrl,
                                    drugsType: item.drugsType
                                };
                                inquiryObj.addInquiryDetails.push(inquiryDetailObj);
                                inquiryObj.typesCount ++;
                                inquiryObj.subtotal+= (item.inquiryQuantity*item.purchaseUpset);
                            });
                            inquiryObj.subtotal=inquiryObj.subtotal.toFixed(__pointDigit.DEFAULT);
                            inquirys.push(inquiryObj);
                        });
                        done();
                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                        callback(errmsg);
                    }else{
                        logger.debug(JSON.stringify(results));
                        callback(null,inquirys);
                    }
                }
            );

        },
        /**
         * get seller quotations
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getSellerQuotationSheets:function(enterpriseId,filter,callback){
            logger.enter();
            var errmsg = "";
            var sellerDBName = undefined;
            var inquiryOri = undefined;
            var quotations = [];
            filter.type="QUOTATION";
            async.series([
                    function(done){
                        //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                            if (err||results.length ==0) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null,"sellerCustomerDB=" + sellerDBName);
                            }
                        });
                    },
                    function(done){
                        //step2 get data from sellerinquiry
                        db.getSellerInquirys(sellerDBName,filter,function(err,results){
                            if(err){
                                errmsg = "get seller inquiry err";
                                done(err);
                            }else{
                                inquiryOri = results;
                                logger.debug(JSON.stringify(results));
                                done(null,"get seller inquirys success");
                            }
                        });
                    },
                    function(done){
                        //step3 get data from seller quotations
                        async.mapSeries(
                            inquiryOri,
                            function(item,mapCallback){
                                db.getSellerQuotations(sellerDBName,item.inquiryId,function(err,results){
                                    if(err){
                                        errmsg = "get seller quotation err";
                                        mapCallback(err);
                                    }else{
                                        item.quotationOri = results;
                                        mapCallback(null,"get seller ori quotations success");
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
                        );
                    },
                    function(done){
                        //step3 get data from seller quotations
                        async.mapSeries(
                            inquiryOri,
                            function(item,mapCallback){
                                db.getSellerInquiryDetailsById(sellerDBName,item.inquiryId,function(err,results){
                                    if(err){
                                        errmsg = "get seller quotation err";
                                        mapCallback(err);
                                    }else{
                                        item.inquiryOri = results;
                                        mapCallback(null,"get seller ori quotations success");
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
                        );
                    },
                    function(done){
                        //step4 form data for inquirySheets

                        underscore.map(inquiryOri,function(obj){
                            var inquiryObj={
                                key: obj.guid,
                                inquiryId: obj.inquiryId,
                                guid: obj.guid,
                                createdOn:obj.quotationDate,
                                typesCount: 0,
                                subtotal: 0,
                                quotationDetails:[]
                            };
                            var quoUnicodelist = [];
                            underscore.map(obj.quotationOri,function(item){
                                quoUnicodelist.push(item.unicode);
                                var inquiryDetailObj = {
                                    key: item.id,
                                    guid: obj.guid,
                                    inquiryId: obj.inquiryId,
                                    unicode:item.unicode,
                                    packageQty: item.packageQty,
                                    billNo:item.billNo,
                                    licenseNo:item.sellerPZWH,
                                    inquiryExpire: item.inquiryExpire,
                                    inquiryQuantity: item.inquiryQuantity,
                                    purchaseUpset: item.purchaseUpset,
                                    lastErpPrice: item.lastErpPrice,
                                    clearingPeriod: item.clearingPeriod,
                                    buyerId:item.buyerId,
                                    buyerName:item.buyerName,
                                    quotationQuantity: item.quotationQuantity,
                                    quotationPrice: item.quotationPrice,
                                    quotationExpire: item.quotationExpire,
                                    commonName: item.commonName,
                                    alias: item.alias,
                                    producer: item.producer,
                                    spec: item.spec,
                                    imageUrl: item.imageUrl,
                                    drugsType: item.drugsType
                                };
                                inquiryObj.quotationDetails.push(inquiryDetailObj);
                                inquiryObj.typesCount ++;
                                inquiryObj.subtotal+= (Number(item.quotationPrice)*Number(item.quotationQuantity));
                            });
                            inquiryObj.subtotal = inquiryObj.subtotal.toFixed(__pointDigit.DEFAULT);

                            underscore.map(obj.inquiryOri,function(item){
                                var inquiryDetailObj = {
                                    key: item.id,
                                    guid: obj.guid,
                                    inquiryId: obj.inquiryId,
                                    unicode:item.unicode,
                                    packageQty: item.packageQty,
                                    billNo:item.billNo,
                                    licenseNo:item.sellerPZWH,
                                    inquiryExpire: item.inquiryExpire,
                                    inquiryQuantity: item.inquiryQuantity,
                                    purchaseUpset: item.purchaseUpset,
                                    lastErpPrice: item.lastErpPrice,
                                    clearingPeriod: item.clearingPeriod,
                                    buyerId:item.objectId,
                                    buyerName:item.buyerName,
                                    quotationQuantity: null,
                                    quotationPrice: null,
                                    quotationExpire: null,
                                    commonName: item.commonName,
                                    alias: item.alias,
                                    producer: item.producer,
                                    spec: item.spec,
                                    imageUrl: item.imageUrl,
                                    drugsType: item.drugsType
                                };
                                if(quoUnicodelist.indexOf(item.unicode) == -1){
                                    inquiryObj.quotationDetails.push(inquiryDetailObj);
                                    inquiryObj.typesCount ++;
                                }
                            });
                            if(inquiryObj.quotationDetails.length >0){
                                quotations.push(inquiryObj);
                            }
                        });
                        done();
                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                        callback(errmsg);
                    }else{
                        logger.debug(JSON.stringify(results));
                        callback(null,quotations);
                    }
                }
            );

        },

        /**
         * get seller quotation details by id
         * @param enterpriseId
         * @param inquiryId
         * @param callback
         */
        getSellerQuotationDetails  : function(enterpriseId,inquiryId,callback){
            logger.enter();
            var errmsg = "";
            var sellerDBName = undefined;
            var quotationOri = undefined;
            var inquiryOri = undefined;
            var quotation = {};
            async.series([
                    function(done){
                        //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                            if (err) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null,"sellerCustomerDB=" + sellerDBName);
                            }
                        });
                    },
                    function(done){
                        //step2.1 get data from sellerquotation
                        db.getSellerQuotationById(sellerDBName,inquiryId,function(err,results){
                            if(err){
                                errmsg = "get seller quotation details err";
                                done(err);
                            }else{
                                quotationOri = results;
                                logger.debug(JSON.stringify(results));
                                done(null,"get seller quotation success");
                            }
                        });
                    },
                    function(done){
                        //step2.2 get data from sellerinquiry
                        db.getSellerInquiryDetailsById(sellerDBName,inquiryId,function(err,results){
                            if(err){
                                errmsg = "get seller inquiry details err";
                                done(err);
                            }else{
                                inquiryOri = results;
                                logger.debug(JSON.stringify(results));
                                done(null,"get seller quotation success");
                            }
                        });
                    },
                    function(done){
                        //step3 get data from seller quotation history
                        async.mapSeries(
                            quotationOri,
                            function(item,mapCallback){
                                db.getNearSellerQuotationHistory(sellerDBName,item,function(err,results){
                                    if(results.length >0){
                                        item.lastQuotationPrice = results[0].quotationPrice;
                                        item.lastQuotationDate = results[0].createdOn;
                                        item.purchaseUpset = results[0].purchaseUpset;
                                    }
                                    if(results.length == 0){
                                        item.lastQuotationPrice = null;
                                        item.lastQuotationDate = null;
                                    }
                                    mapCallback(err,results);
                                })
                            },
                            function(errs,results){
                                if(errs){
                                    logger.error(JSON.stringify(errs));
                                    errmsg = "get seller quotation history err";
                                    done(errmsg);
                                }else{
                                    logger.debug("get seller quotation history done"+JSON.stringify(results));
                                    done();
                                }

                            }
                        )
                    },
                    function(done){
                        //step4 get data from seller  history price
                        async.mapSeries(
                            quotationOri,
                            function(item,mapCallback){
                                db.getNearClientQuotationHistory(sellerDBName,item,function(err,results){
                                    if(results.length >0){
                                        item.lastClientPrice = results[0].quotationPrice;
                                        item.lastClientDate = results[0].createdOn;
                                    }
                                    if(results.length == 0){
                                        item.lastClientPrice = null;
                                        item.lastClientDate = null;
                                    }
                                    mapCallback(err,results);
                                })
                            },
                            function(errs,results){
                                if(errs){
                                    logger.error(JSON.stringify(errs));
                                    errmsg = "get seller client quotation history err";
                                    done(errmsg);
                                }else{
                                    logger.debug("get seller client quotation history done"+JSON.stringify(results));
                                    done();
                                }

                            }
                        )
                    },
                    function(done){
                        //step4 form data for quotation details
                        quotation={
                            inquiryId: quotationOri[0].inquiryId,
                            guid: quotationOri[0].guid,
                            inquiryExpire:quotationOri[0].inquiryExpire,
                            typesCount: 0,
                            subtotal: 0,
                            quotationDetails:[]
                        };
                        var unicodes = [];
                        underscore.map(quotationOri,function(item){
                            unicodes.push(item.unicode);
                            var quotationDetailObj = {
                                key: item.unicode,
                                guid: item.guid,
                                inquiryId: item.inquiryId,
                                unicode:item.unicode,
                                packageQty: item.packageQty,
                                billNo:item.billNo,
                                licenseNo:item.sellerPZWH,
                                inquiryExpire: item.inquiryExpire,
                                inquiryQuantity: item.inquiryQuantity,
                                purchaseUpset: item.purchaseUpset,
                                lastErpPrice: item.lastErpPrice,
                                clearingPeriod: item.clearingPeriod,
                                createdOn:item.createdOn,
                                buyerId:item.buyerId,
                                buyerName:item.buyerName,
                                quotationQuantity: item.quotationQuantity,
                                quotationPrice: item.quotationPrice,
                                quotationExpire: item.quotationExpire,
                                lastQuotationPrice: item.lastQuotationPrice,
                                lastQuotationDate: item.lastQuotationDate,
                                lastClientPrice: item.lastClientPrice,
                                lastClientDate: item.lastClientDate,
                                commonName: item.commonName,
                                alias: item.alias,
                                producer: item.producer,
                                spec: item.spec,
                                imageUrl: item.imageUrl,
                                drugsType: item.drugsType
                            };
                            quotation.typesCount++;
                            quotation.subtotal += Number(item.quotationQuantity)*Number(item.quotationPrice);
                            quotation.quotationDetails.push(quotationDetailObj);
                        });
                        quotation.subtotal = quotation.subtotal.toFixed(__pointDigit.DEFAULT);

                        underscore.map(inquiryOri,function(item){
                            var inqObj = {
                                key: item.id,
                                guid: quotationOri[0].guid,
                                inquiryId: item.inquiryId,
                                unicode:item.unicode,
                                packageQty: item.packageQty,
                                billNo:item.billNo,
                                licenseNo:item.sellerPZWH,
                                inquiryExpire: item.inquiryExpire,
                                inquiryQuantity: item.inquiryQuantity,
                                purchaseUpset: item.purchaseUpset,
                                lastErpPrice: item.lastErpPrice,
                                clearingPeriod: item.clearingPeriod,
                                createdOn:item.createdOn,
                                buyerId:quotationOri[0].buyerId,
                                buyerName:quotationOri[0].buyerName,
                                quotationQuantity: null,
                                quotationPrice: null,
                                quotationExpire: null,
                                lastQuotationPrice: null,
                                lastQuotationDate: null,
                                lastClientPrice: null,
                                lastClientDate: null,
                                commonName: item.commonName,
                                alias: item.alias,
                                producer: item.producer,
                                spec: item.spec,
                                imageUrl: item.imageUrl,
                                drugsType: item.drugsType
                            };
                            if(unicodes.indexOf(item.unicode) == -1){
                                quotation.quotationDetails.push(inqObj);
                                quotation.typesCount++;
                            }
                        });
                        done();
                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                        callback(errmsg);
                    }else{
                        logger.debug(JSON.stringify(results));
                        callback(null,quotation);
                    }
                }
            );

        },
        /**
         * get seller inquiry details by inquiryId
         * @param enterpriseId
         * @param inquiryId
         * @param callback
         */
        getSellerInquiryDetails : function(enterpriseId,inquiryId,callback){
            logger.enter();
            var errmsg = "";
            var sellerDBName = undefined;
            var inquiryOri = undefined;
            var inquirys = [];
            async.series([
                    function(done){
                        //step1 get seller dbname
                        db.getBuyerOrSellerInfoById(__mysql,__cloudDBName,enterpriseId,function(err,results){
                            if (err) {
                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                done(errmsg);
                            } else {
                                var dbSuffix = results[0].dbSuffix;
                                sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                                done(null,"sellerCustomerDB=" + sellerDBName);
                            }
                        });
                    },
                    function(done){
                        //step2 get data from sellerinquiry
                        db.getSellerInquiryById(sellerDBName,inquiryId,function(err,results){
                            if(err){
                                errmsg = "get seller inquiry err";
                                done(err);
                            }else{
                                inquiryOri = results;
                                logger.debug(JSON.stringify(results));
                                done(null,"get seller inquirys success");
                            }
                        });
                    },
                    function(done){
                        //step3 get data from seller quotation history
                        async.mapSeries(
                            inquiryOri,
                            function(item,mapCallback){
                                db.getNearSellerQuotationHistory(sellerDBName,item,function(err,results){
                                    if(results.length >0){
                                        item.lastQuotationPrice = results[0].quotationPrice;
                                        item.lastQuotationDate = results[0].createdOn;
                                    }
                                    if(results.length == 0){
                                        item.lastQuotationPrice = null;
                                        item.lastQuotationDate = null;
                                    }
                                    mapCallback(err,results);
                                })
                            },
                            function(errs,results){
                                if(errs){
                                    logger.error(JSON.stringify(errs));
                                    errmsg = "get seller quotation history err";
                                    done(errmsg);
                                }else{
                                    logger.debug("get seller quotation history done"+JSON.stringify(results));
                                    done();
                                }

                            }
                        )
                    },
                    function(done){
                        //step4 get data from seller  history price
                        async.mapSeries(
                            inquiryOri,
                            function(item,mapCallback){
                                db.getNearClientQuotationHistory(sellerDBName,item,function(err,results){
                                    if(results.length >0){
                                        item.lastClientPrice = results[0].quotationPrice;
                                        item.lastClientDate = results[0].createdOn;
                                    }
                                    if(results.length == 0){
                                        item.lastClientPrice = null;
                                        item.lastClientDate = null;
                                    }
                                    mapCallback(err,results);
                                })
                            },
                            function(errs,results){
                                if(errs){
                                    logger.error(JSON.stringify(errs));
                                    errmsg = "get seller client quotation history err";
                                    done(errmsg);
                                }else{
                                    logger.debug("get seller client quotation history done"+JSON.stringify(results));
                                    done();
                                }

                            }
                        )
                    },
                    function(done){
                        //step5 form data for inquirySheets
                        var inquiryIds = [];
                        underscore.map(inquiryOri,function(item){
                            var inquiryDetailObj = {
                                key: item.unicode,
                                guid: item.guid,
                                inquiryId:item.inquiryId,
                                unicode:item.unicode,
                                packageQty: item.packageQty,
                                billNo:item.billNo,
                                licenseNo:item.sellerPZWH,
                                buyerId: item.buyerId,
                                inquiryExpire: item.inquiryExpire,
                                inquiryQuantity: item.inquiryQuantity,
                                lastQuotationPrice: item.lastQuotationPrice,
                                lastQuotationDate: item.lastQuotationDate,
                                lastClientPrice: item.lastClientPrice,
                                lastClientDate: item.lastClientDate,
                                purchaseUpset: item.purchaseUpset,
                                lastErpPrice: item.lastErpPrice,
                                clearingPeriod: item.clearingPeriod,
                                buyerName:item.buyerName,
                                commonName: item.commonName,
                                alias: item.alias,
                                producer: item.producer,
                                spec: item.spec,
                                imageUrl: item.imageUrl,
                                drugsType: item.drugsType
                            };
                            if(inquiryIds.length==0||inquiryIds.indexOf(item.inquiryId)== -1){
                                inquiryIds.push(item.inquiryId);
                                var inquiryObj={
                                    inquiryId: item.inquiryId,
                                    guid: item.guid,
                                    createdOn:item.createdOn,
                                    typesCount: 1,
                                    subtotal: Number(item.purchaseUpset)*Number(item.inquiryQuantity),
                                    addInquiryDetails:[]
                                };
                                inquiryObj.addInquiryDetails.push(inquiryDetailObj);
                                inquirys.push(inquiryObj);
                            }else{
                                underscore.map(inquirys,function(obj){
                                    if(obj.inquiryId == item.inquiryId){
                                        obj.typesCount++;
                                        obj.subtotal+=Number(item.purchaseUpset)*Number(item.inquiryQuantity);
                                        obj.addInquiryDetails.push(inquiryDetailObj);
                                    }
                                })
                            }
                        });
                        underscore.map(inquirys,function(inq){
                           inq.subtotal = inq.subtotal.toFixed(__pointDigit.DEFAULT);
                        });
                        done();
                    }
                ],
                function(errs,results){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                        callback(errmsg);
                    }else{
                        logger.debug(JSON.stringify(results));
                        callback(null,inquirys);
                    }
                }
            );

        },
        /**
         * post quotation data and send to ERP
         * @param enterpriseId
         * @param quotations
         * @param callback
         */
        postSellerQuotation:function(enterpriseId,quotations,callback){
            logger.enter();
                var quotaionCommit = false;
                async.mapSeries(
                    quotations,
                    function(quotation,mapCallback){
                        var errmsg = "";
                        var sellerDBName = undefined;
                        var sellerName = undefined;
                        var buyerDBName = undefined;
                        var buyerPackageQty = undefined;
                        var buyerLicenseNo = undefined;
                        var buyerQuotation = undefined;
                        var buyerInquiry = undefined;
                        db.beginTrans(function (connect) {
                            async.series(
                                [
                                    //1.get seller dbName
                                    function (done) {
                                        db.getBuyerOrSellerInfoById(connect, __cloudDBName, enterpriseId, function (err, results) {
                                            if (err) {
                                                errmsg = "enterpriseId=" + enterpriseId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                                done(errmsg);
                                            } else {
                                                var dbSuffix = results[0].dbSuffix;
                                                sellerName = results[0].buyerName;
                                                sellerDBName = __customerDBPrefix + "_" + dbSuffix;
                                                logger.debug("sellerCustomerDB=" + sellerDBName);
                                                done(null, "sellerCustomerDB=" + sellerDBName);
                                            }
                                        });
                                    },
                                    //2.get buyer dbName
                                    function (done) {
                                        logger.debug(JSON.stringify(quotation));
                                        var buyerId = quotation.buyerId;
                                        db.getBuyerOrSellerInfoById(connect, __cloudDBName, buyerId, function (err, results) {
                                            if (err) {
                                                errmsg = "enterpriseId=" + buyerId + "get CUSTOMER_DB ERR,该商户没有在SCC上构建数据库";
                                                done(errmsg);
                                            } else {
                                                var dbSuffix = results[0].dbSuffix;
                                                buyerDBName = __customerDBPrefix + "_" + dbSuffix;
                                                done(null, "buyerCustomerDB=" + buyerDBName);
                                            }
                                        });
                                    },
                                    //3.get buyerPackageQty
                                    function (done) {
                                        var buyerUnicode = quotation.unicode;
                                        db.getPackageQty(connect, buyerDBName, buyerUnicode, function (err, result) {
                                            if (!err && result.length > 0) {
                                                buyerPackageQty = result[0].packageQty;
                                                buyerLicenseNo = result[0].licenseNo;
                                            }
                                            if (!err && result.length == 0) {
                                                logger.error("unicode = " + quotation.unicode + "找不到对应的goods");
                                                errmsg = "unicode = " + quotation.unicode + "找不到对应的goods";
                                            }
                                            done();
                                        })
                                    },
                                    //4.0 verify quotation details
                                    function(done){
                                      db.selectOneQuotationDetail(connect,sellerDBName,quotation,function(err,result){
                                          if(err){
                                              done(err);
                                          }else{
                                              if(result.length ==0){
                                                  if(underscore.isNull(quotation.quotationPrice)){
                                                      done("不允许报价null，报价提交无效");
                                                  }else{
                                                      logger.debug("quotation verify pass");
                                                      done()
                                                  }
                                              }else{
                                                  done("报价单中商品已经报价，不允许重复报价，报价提交无效");
                                              }
                                          }
                                      })
                                    },

                                    //4.1write to seller quotationdetails
                                    function (done) {
                                        db.insertSellerQuotationDetails(connect, sellerDBName, quotation, function (err, result) {
                                            done(err, result);
                                        })
                                    },

                                    //4.2write to seller inquirydetails
                                    function (done) {
                                        db.insertSellerInquiryDetails(connect, sellerDBName, quotation, function (err, result) {
                                            done(err, result);
                                        })
                                    },
                                    //4.3 update quotation date to buyer Inquiry
                                    function(done){
                                        db.updateBuyerInquiryDate(connect,buyerDBName,quotation.guid,function(err,result){
                                           done(err,result);
                                        });
                                    },
                                    //4.4 update quotation date to seller Inquiry
                                    function(done){
                                        db.updateSellerInquiryDate(connect,sellerDBName,quotation.guid,function(err,result){
                                            done(err,result);
                                        });
                                    },
                                    //4.5 add quotation to seller quotation history
                                    function(done){
                                        db.insertSellerQuotationHistory(connect, sellerDBName, quotation, function (err, result) {
                                            done(err, result);
                                        })
                                    },
                                    //5.0 get buyer info
                                    function(done){
                                        db.getBuyerInquiry(connect,sellerDBName,buyerDBName,quotation.inquiryId,function(err,result){
                                            if(!err && result.length>0){
                                                buyerInquiry = result[0];
                                            }
                                            done(err,result);
                                        });
                                    },
                                    //5.1write to buyer quotationdetails
                                    function (done) {
                                        if(underscore.isUndefined(buyerPackageQty)||underscore.isUndefined(buyerInquiry)){
                                            done("unicode = " + quotation.unicode + "no matched buyerPackageQty or get buyerInquiry err");
                                        }else{
                                            var buyerInquiryQuantity = Number((quotation.inquiryQuantity * quotation.packageQty / buyerPackageQty).toFixed(4));
                                            var buyerLastErpPrice = Number((quotation.lastErpPrice * quotation.inquiryQuantity / buyerInquiryQuantity).toFixed(4));
                                            var buyerQuotationQuantity = Number((quotation.quotationQuantity * quotation.packageQty / buyerPackageQty).toFixed(4));
                                            var buyerQuotationPrice = Number((quotation.quotationQuantity * quotation.quotationPrice / buyerQuotationQuantity).toFixed(4));
                                            var buyerPurchaseUpset = Number((quotation.purchaseUpset * quotation.inquiryQuantity / buyerInquiryQuantity).toFixed(4));
                                            buyerQuotation = {
                                                inquiryId: buyerInquiry.id,
                                                sellerId: enterpriseId,
                                                sellerName: sellerName,
                                                unicode: quotation.unicode,
                                                packageQty: buyerPackageQty,
                                                licenseNo: buyerLicenseNo,
                                                billNo:quotation.billNo,
                                                lastErpPrice: buyerLastErpPrice,
                                                purchaseUpset: buyerPurchaseUpset,
                                                inquiryQuantity: buyerInquiryQuantity,
                                                inquiryExpire: quotation.inquiryExpire,
                                                quotationQuantity: buyerQuotationQuantity,
                                                quotationPrice: buyerQuotationPrice,
                                                quotationExpire: quotation.quotationExpire||null,
                                                clearingPeriod: quotation.clearingPeriod
                                            };
                                            logger.debug(JSON.stringify(buyerQuotation));
                                            db.insertBuyerQuotationDetails(connect, buyerDBName, buyerQuotation, function (err, result) {
                                                done(err, result);
                                            })
                                        }
                                    },
                                    //5.2write to buyer inquirydetails
                                    function (done) {
                                        db.insertBuyerInquiryDetails(connect, buyerDBName, buyerQuotation, function (err, result) {
                                            done(err, result);
                                        })
                                    },
                                    //5.3 add quotation to buyer quotation history
                                    function(done){
                                        db.insertBuyerQuotationHistory(connect, buyerDBName, buyerQuotation, function (err, result) {
                                            done(err, result);
                                        })
                                    }
                                ],
                                function (errs, resultList) {
                                    if (errs) {
                                        // rollback trans
                                        logger.error(errs);
                                        db.rollbackTrans(connect, function () {
                                            mapCallback(null, "unicode =" + quotation.unicode + "post seller fail" + errmsg);
                                        });
                                    } else {
                                         //commit trans
                                        db.commitTrans(connect, function (commitErr) {
                                            if (commitErr) {
                                                logger.error(commitErr);
                                            }
                                            quotaionCommit = true;
                                            mapCallback(null, "unicode =" + quotation.unicode + "post seller success");
                                        });
                                    }
                                }
                            );
                        });

                    },
                    function(errs,results){
                        //if save success then send to erp
                        if(quotaionCommit){
                            var ApiModel = require( __base + "/apps/api/model");
                            var apiModel = new ApiModel;
                            apiModel.webQuotationResult(quotations,enterpriseId,function(err,results){
                                logger.debug(results);
                            });
                        }
                        logger.debug(JSON.stringify(results));
                        callback(null,"post seller quotation done， post erp ="+quotaionCommit);
                    }
                );
        }
    };

    function retrieveEnterpriseInfoByEnterpriseId(cloudDbName, enterpriseId, callback) {
        logger.enter();
        db.enterpriseInfoRetrieveByEnterpriseId(cloudDbName, enterpriseId, function (error, enterpriseInfo) {
            logger.ndump(enterpriseInfo);
            if (error) {
                logger.error(error);
                return callback(error);
            }
            callback(null, enterpriseInfo);
        });

    }

    function formatReturnInfoDetails(sellerReturnInfoDetails) {

        //sellerReturnInfoDetails = _.chain(sellerReturnInfoDetails)
        // 按照退货单号分组
        sellerReturnInfoDetails = _.groupBy(sellerReturnInfoDetails, 'guid');
        // 对每组的元素进行遍历
        if (_.isEmpty(sellerReturnInfoDetails)) {
            return _.values(sellerReturnInfoDetails);
        }
        sellerReturnInfoDetails = underscore.mapObject(sellerReturnInfoDetails, function (val, key) {
            // 取出下列字段作为returnInfo的字段
            var returnInfo = _.pick(val[0], 'guid', 'billNo', 'billDate', 'buyerCode', "buyerName", 'returnReason', 'stockType', 'saleType', 'remark');
            // 将其余字段过滤出来,组成数组,放入returnInfo的returnDetails字段中
            returnInfo.returnDetails = _.map(val, function (item) {
                return _.omit(item, 'guid', 'billNo', 'billDate', 'buyerCode', 'returnReason', 'stockType', 'saleType', 'remark');
            });
            return returnInfo;
        });
        // 将分组的元素重新组合在一起,成为一个退货单数组,
        sellerReturnInfoDetails = _.values(sellerReturnInfoDetails);
        // 遍历这个退货单数组
        sellerReturnInfoDetails = _.map(sellerReturnInfoDetails, function (item) {
            var returnDetails = item.returnDetails;
            // 将退货单详情中的数据按照商品号进行分组
            returnDetails = _.groupBy(returnDetails, "unicode");
            // 遍历分组后的每个组的元素
            returnDetails = underscore.mapObject(returnDetails, function (val, key) {
                // 取下列字段作为returnDetail中的商品信息
                var goodsItem = _.pick(val[0],
                    'goodsNo', 'unicode', 'packageQty', 'batchNo',
                    'detailRemark', 'commonName', 'alias', 'producer',
                    'spec', 'imageUrl', 'drugsType');
                // 其余字段过滤出来,生成数组, 放入商品信息的BatchDetails中
                goodsItem.batchDetail = _.map(val, function (item) {
                    return _.omit(item, 'goodsNo', 'unicode', 'packageQty', 'batchNo',
                        'detailRemark', 'commonName', 'alias', 'producer',
                        'spec', 'imageUrl', 'drugsType');
                });
                return goodsItem;
            });
            item.returnDetails = _.values(returnDetails);
            return item;
        });

        var i = 1;
        var j = 1;
        var k = 1;
        // 给每个数组添加编号key 供前端使用.
        sellerReturnInfoDetails = _.map(sellerReturnInfoDetails, function (item) {
            item.key = i.toString();
            i++;
            j = 1;
            item.returnDetails = _.map(item.returnDetails, function (item) {
                item.key = j.toString();
                j++;
                k = 1;
                item.batchDetail = _.map(item.batchDetail, function (item) {
                    item.key = k.toString();
                    k++;
                    return item;
                });
                return item;
            });
            return item;
        });

        return sellerReturnInfoDetails;
    }


    function formatSellerOrderInfo(orderArray,pageIndex,pageSize){
        var orderList=underscore.chain(orderArray)
            .groupBy(function(item){
                return item.guid;
            })
            .map(function(item){
                var tempItem={
                    key:item[0].billNO,
                    billNo: item[0].billNO,
                    billDate: item[0].billDate,
                    buyerCode: item[0].buyerCode,
                    buyerName: item[0].buyerName,
                    consigneeName: item[0].consigneeName,
                    consigneeAddress: item[0].consigneeAddress,
                    consigneeMobileNum:item[0].consigneeMobileNum ,
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
                    return memo + Number(item.quantity) * Number(item.price);
                }, 0);

                tempItem.goods=[];
                underscore.each(item,function(goodItem){
                    var goodObj={
                        key:goodItem.goodId,
                        goodId:goodItem.goodId,
                        unicode:goodItem.unicode,
                        packageQty:goodItem.packageQty,
                        sellerGoodsNo:goodItem.sellerGoodsNo,
                        quantity: goodItem.quantity,
                        inPrice: goodItem.price,
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
        return underscore.isUndefined(pageIndex)?
            orderList:purePaginator.getCurrentPageDatas(pageIndex,pageSize,orderList);
    }
    return model;
};