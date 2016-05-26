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
 * 产品信息展示model
 * --------------------------------------------------------------
 * 2015-09-21	hc-romens@issue#18  created
 *
 */

module.exports=function(){
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
    var hasher = require("password-hash-and-salt");

    /*
     * load project modules
     */
    var Paginator = require(__base + "/modules/paginator");
    var KeyMapper = require(__base + '/modules/fieldNameMapper');
    var FieldNameMapper = require(__base + '/modules/fieldNameMapper');
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;


    /*
     * init model name etc
     */
    var MODELNAME = __dirname.split("/").pop();
    logger.trace("Initiating model:[" + MODELNAME + "]");

    //define fieldMapper
    var customerFieldMapper = new FieldNameMapper({
        'clientCategory': '客户类别',
        'clientCode ': '客户编号',
        'clientArea': '客户所属区域',
        'clientName': '客户名称',
        'readOnly': '停用标志',
        'enabled': '禁用标志',
        'createdOn':'创建时间'
    });
    var orderFieldMapper = new FieldNameMapper({
        'id': '订货单号',
        'createdOn': '下单时间',
        'status': '订单状态',
        'operatorName': '客户名称',
        'total': '金额'
    });
    var returnCustomerOrderFieldMapper = new FieldNameMapper({
        'id': '退货单号',
        'orderId': '订货单号',
        'clientName': '客户名称',
        'createdOn': '申请时间',
        'status': '订单状态'
    });
    var goodsFieldMapper = new KeyMapper({
        'commonName': '商品名',
        'goodsType': '产品类别',
        'goodsNo': '货号',
        'alias': '别名',
        'onSell':'状态',
        'boughtTimes':'人气',
        'boughtAmount':'销售额',
        'licenseNo': '批准文号',
        'producer': '生产企业',
        'createdOn':'创建时间'
    });
    var messageFieldMapper = new FieldNameMapper({
        'docType': '相关单据类型',
        'createdOn': '申请时间',
        'messageBody': '消息体',
        'status': '消息状态'
    });


    //model
    var model = {
        /**
         * update muti goods Onsell
         * @param customerDBName
         * @param updateGoods
         * @param onSellstatus
         * @param callback
         */
        putMutiOnSell : function(customerDBName, updateGoods, onSellstatus, callback){
            logger.enter();
            db.updateMutiOnSell(customerDBName, updateGoods, onSellstatus, function (err,affectedRows) {
                callback(err,affectedRows);
            });
        },

        /**
         * update one goods Onsell
         * @param customerDBName
         * @param goodsId
         * @param onSell
         * @param isDeleted
         * @param callback
         */
        putGoodsOnsellStatus: function(customerDBName,goodsId,onSell,isDeleted,callback){
            logger.enter();
            if (isDeleted == "true") {
                var goodsInventoryData = {"onSell": 0};
                db.updateGoodsInventoryById(customerDBName, goodsInventoryData, goodsId, function (err, affectedRows) {
                    if (!err) {
                        var goodsNewInfo = {"isDeleted": 1};
                        db.updateGoodsInfo(customerDBName, goodsNewInfo, goodsId, function (err, result) {
                            if (!err) {
                               callback();
                            }else{
                                callback(err);
                            }
                        });
                    }else{
                        callback(err);
                    }
                });
            } else {
                var goodsInventoryData = {"onSell": onSell == "true" ? 1 : 0};
                db.updateGoodsInventoryById(customerDBName, goodsInventoryData, goodsId, function (err, affectedRows) {
                    if (!err) {
                       callback();
                    }else{
                       callback(err);
                    }
                });
            }
        },
        /**
         * update goodsMarks
         * @param customerDBName
         * @param marksData
         * @param goodsId
         * @param callback
         */
        putGoodsMarks : function(customerDBName, marksData, goodsId,callback){
            logger.enter();
            db.updateGoodsMarksById(customerDBName, marksData, goodsId, function (err,results) {
                callback(err,results);
            });
        },

        /**
         * update goods gsp
         * @param customerDBName
         * @param gspData
         * @param goodsId
         * @param callback
         */
        putGoodsGsp: function(customerDBName, gspData, goodsId,callback){
            logger.enter();
            db.updateGoodsGspById(customerDBName, gspData, goodsId, function (err,affectedRows) {
                callback(err,affectedRows);
            });
        },

        /**
         * update goods inventory
         * @param customerDBName
         * @param goodsInventoryData
         * @param negSell
         * @param goodsId
         * @param callback
         */
        putGoodsInventoryData: function(customerDBName,goodsInventoryData,negSell,goodsId,callback){
            logger.enter();
            db.updateGoodsInventoryById(customerDBName, goodsInventoryData, goodsId, function (err, affectedRows) {
                if (!err) {
                    db.updateGoodsNegSellById(customerDBName, negSell, goodsId, function (err2, affectedRows) {
                        if(err2){
                            callback(err2);
                        }else{
                            callback();
                        }
                    });
                }else{
                    callback(err);
                }
            });

        },


        /**
         * update price info
         * @param customerDBName
         * @param limitedPrice
         * @param wholesalePrice
         * @param refRetailPrice
         * @param price1
         * @param price2
         * @param price3
         * @param goodsId
         * @param callback
         */
        putGoodsPrice : function(customerDBName, limitedPrice, wholesalePrice,
                                 refRetailPrice, price1, price2, price3, goodsId,callback){
            logger.enter();
            db.updateGoodsPriceById(customerDBName, limitedPrice, wholesalePrice,
                refRetailPrice, price1, price2, price3, goodsId, function (err, affectedRows) {
                    callback(err,affectedRows);
            })

        },

        /**
         * get all returns
         * @param customerDB
         * @param paginator
         * @param condition
         * @param callback
         */
        getAllReturns : function(customerDB, paginator, condition,callback){
            logger.enter();
            db.getAllReturnInfo(customerDB, paginator, condition,function (err, returns) {
                if(err){
                    callback(err);
                }else{
                    var returnList = underscore.chain(returns)
                        .groupBy(function (item) {
                            return item.id;
                        })
                        .map(function (item) {
                            // item is an array
                            var temp = item[0];
                            temp.countBatch = item.length;//笔数
                            var currentReturnInfoStatus = item[0].status;
                            //关闭前状态 字段不为空 说明他被关闭了

                            if (!underscore.isNull(item[0].beforeCloseStatus)) {
                                currentReturnInfoStatus = item[0].beforeCloseStatus;
                            }
                            var getQuantityName = '';
                            if (currentReturnInfoStatus == 'CREATED') {
                                getQuantityName = 'returnDetailApplyQuantity';
                            }
                            else if (currentReturnInfoStatus == 'APPROVED') {
                                getQuantityName = 'returnApprovedQuantity';
                            }
                            else if (currentReturnInfoStatus == 'SHIPPED') {
                                getQuantityName = 'returnDetailShippedQuantity';
                            }
                            else if (currentReturnInfoStatus == 'DELIVERED') {
                                getQuantityName = 'returnDeliveredQuantity';
                            }


                            item.returnStatus=item[0].status;
                            temp.quantity = underscore(item).reduce(function (memo, item) {
                                return memo + Number(item[getQuantityName]);
                            }, 0);

                            temp.subtotal = underscore(item).reduce(function (memo, item) {
                                return memo + Number(item[getQuantityName]) * Number(item['returnPrice']);
                            }, 0);

                            return temp;
                        })
                        .value();

                    var pageIndex=paginator.page;
                    var pageSize=paginator.pageSize;

                    var startIndex=(pageIndex-1)*pageSize +1;
                    var endIndex=pageIndex*pageSize;

                    var ultimateReturnInfo=[];
                    for(var i= startIndex-1;i<endIndex;i++){
                        if(!underscore.isUndefined(returnList[i])){
                            ultimateReturnInfo.unshift(returnList[i]);
                        }
                    }
                    callback(null,ultimateReturnInfo);
                }
            })
        },


        /**
         * get order wait ship
         * @param customerDB
         * @param orderId
         * @param data
         * @param callback
         */
        getOrderWaitShip:function(customerDB,orderId,data,callback){
            logger.enter();
            db.listWatingShipOrders(customerDB, orderId, function (orders) {
                var clientId=orders[0].clientId;
                data.orders = orders;
                db.getShipInfoByOrderId(customerDB, orderId, function (err, ships) {
                    if(err){
                        callback(err);
                        return;
                    }
                    data.ships = ships;
                    db.retrieveClientInfoForContract(customerDB, clientId, function (error, clientInfo) {
                        if (error) {
                            logger.error(error);
                            callback(error);
                        }else{
                            var orderStatus=orders[0].status,
                                paymentType=clientInfo.paymentType;
                            var paymentStatus = orders[0].paymentStatus;
                            logger.dump('当前订单的状态: '+orderStatus);
                            if(orderStatus=='CREATED'){
                                data.orderStatus=paymentStatus;
                            }
                            else{
                                data.orderStatus=orderStatus;
                            }
                            data.shipStrictly = (paymentType == 'CREDIT') ? __shipStrictly : true;
                            callback(null,data);
                        }
                    });
                });
            });
        },

        /**
         * get order history info
         * @param customerDB
         * @param orderId
         * @param callbak
         */
        getOrderHistorys:function(customerDB,orderId,callback){
            logger.enter();
            db.getOrderHistoryDetails(customerDB, orderId, function (err, orderHistroys) {
                callback(err,orderHistroys);
            });
        },
        /**
         * get product edit data
         */
        getCustomerProductEdit :function(customerDB,goodsId,data,callback){
            logger.enter();
            db.listPackUnit(customerDB, function (err, listPackUnit) {
                db.listAllGoodsInventoryPlan(customerDB, function (err, goodsInventoryPlans) {
                    db.selectDrugsTypeInfo(customerDB, function(err, results){
                        var DrugsTypeArr = [];
                        underscore.each(results,function(obj){
                            DrugsTypeArr.push(obj.name);
                        });
                        data['drugsTypeList'] = DrugsTypeArr;
                        db.listGoodsGspTypes(customerDB, function (err, goodsGspTypes) {
                            data["listPackUnit"] = listPackUnit;
                            data['goodsInventoryPlans'] = goodsInventoryPlans;
                            data["goodsGspTypes"] = goodsGspTypes;
                            logger.ndump("data", data);
                            if (goodsId != "") {
                                db.listGoodsBasicInfoById(customerDB, goodsId, function (err, goodsBasicInfos) {
                                    db.listGoodsTypesById(customerDB, goodsId, function (err2, goodsTypeList) {
                                        if (!err) {
                                            if (goodsBasicInfos[0])
                                                goodsBasicInfos[0]['goodsType'] = goodsTypeList;
                                        }
                                        db.listGoodsPriceInfoById(customerDB, goodsId, function (goodsPriceInfos) {
                                            db.listGoodsInventoryInfoById(customerDB, goodsId, function (goodsInventorys) {
                                                db.listGoodsGspInfoById(customerDB, goodsId, function (goodsGsps) {
                                                    data['goodsPriceInfo'] = goodsPriceInfos[0];
                                                    data['goodsInventory'] = goodsInventorys[0];
                                                    //库存计划详细信息获取
                                                    var inventoryId = goodsInventorys[0].showPlanId;
                                                    var defaultInventoryPlan = underscore.filter(goodsInventoryPlans, function (item) {
                                                        return item.isDefault == true;
                                                    });
                                                    if (inventoryId == 0) {
                                                        inventoryId = defaultInventoryPlan[0].id;
                                                    }
                                                    //获取库存详细信息
                                                    db.listGoodsInventoryPlanDetailsById(customerDB, inventoryId, function (err, planDetails) {
                                                        if (err) {
                                                            logger.error(err);
                                                            callback(err);
                                                        } else {
                                                            //get the default IventoryPlanId
                                                            data['goodsInventoryDetail'] = {
                                                                isDefaultInventoryPlan: planDetails[0].isDefault,
                                                                planDetails: planDetails
                                                            };
                                                            //格式化 gsp信息的  时间信息
                                                            goodsGsps[0].gmpCertificationDate =
                                                                goodsGsps[0].gmpCertificationDate == "0000-00-00 00:00:00" || goodsGsps[0].gmpCertificationDate == null ? "" : moment(goodsGsps[0].gmpCertificationDate).format("YYYY-MM-DD");
                                                            goodsGsps[0].gmpValidDate =
                                                                goodsGsps[0].gmpValidDate == "0000-00-00 00:00:00" || goodsGsps[0].gmpValidDate == null ? "" : moment(goodsGsps[0].gmpValidDate).format("YYYY-MM-DD");
                                                            goodsGsps[0].importRegisCertNumValidDate =
                                                                goodsGsps[0].importRegisCertNumValidDate == "0000-00-00 00:00:00" || goodsGsps[0].importRegisCertNumValidDate == null ? "" : moment(goodsGsps[0].importRegisCertNumValidDate).format("YYYY-MM-DD");
                                                            goodsGsps[0].drugsValidDate =
                                                                goodsGsps[0].drugsValidDate == "0000-00-00 00:00:00" || goodsGsps[0].drugsValidDate == null ? "" : moment(goodsGsps[0].drugsValidDate).format("YYYY-MM-DD");
                                                            data['goodsGsp'] = goodsGsps[0];
                                                            goodsBasicInfos[0].filingNumberValidDate =
                                                                goodsBasicInfos[0].filingNumberValidDate == "0000-00-00 00:00:00" || goodsBasicInfos[0].filingNumberValidDate == null ? "" : moment(goodsBasicInfos[0].filingNumberValidDate).format("YYYY-MM-DD");
                                                            data['goodsBasicInfo'] = goodsBasicInfos[0];
                                                            callback(null,data);
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            }
                            else {
                                //get the default IventoryPlanId
                                var defaultInventoryPlan = underscore.filter(goodsInventoryPlans, function (item) {
                                    return item.isDefault == true;
                                });
                                db.listGoodsInventoryPlanDetailsById(customerDB, Number(defaultInventoryPlan[0].id), function (err, planDetails) {
                                    if (err) {
                                        logger.error(err);
                                        callback(err);
                                    } else {
                                        data['goodsInventoryDetail'] = {
                                            isDefaultInventoryPlan: planDetails[0].isDefault == 1,
                                            planDetails: planDetails
                                        };
                                        callback(null,data);
                                    }
                                });
                            }
                        });
                    });
                });

            });
        },

        /**
         * get product content
         * @param customerDB
         * @param goodsId
         * @param callback
         */
        getProductContent: function(customerDB,goodsId,callback){
            logger.enter();
            db.listGoodsBasicInfoById(customerDB, goodsId, function (err, goodsBasicInfos) {
                callback(err,goodsBasicInfos);
            });
        },
        /**
         * get customer goods view
         * @param customerDB
         * @param selectedGoodsTypeId
         * @param paginator
         * @param callback
         */
        getCustomerGoods: function(customerDB,selectedGoodsTypeId,paginator,callback){
            logger.enter();
            dataService.getGoodsTypeDescendants(customerDB, selectedGoodsTypeId, function (err, goodsTypeIds) {
                if(err){
                    callback(err);
                }else{
                    db.listCustomerGoods(customerDB, goodsTypeIds, paginator, function (err, product) {
                        callback(err,product);
                    })
                }
            });
        },
        /**
         * reply client complaint
         * @param dbName
         * @param clientId
         * @param operatorId
         * @param type
         * @param content
         * @param callback
         */
        postReplyClient: function(dbName,clientId,operatorId,type,content,callback){
            logger.enter();
            db.complainRetrieveLastOneByClientId(dbName, clientId, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                }else{
                    operatorId = result[0].operatorId;
                    db.complainCreateOne(dbName, clientId, operatorId, type, content, function (err, result) {
                        if (err) {
                            logger.error(err);
                            callback(err)
                        }else{
                            callback();
                        }
                    })
                }
            })
        },

        /**
         * get the special client complaint
         * @param dbName
         * @param clientId
         * @param callback
         */
        getSingleClientComplaint: function(dbName,clientId,hasBeenRead,callback){
            logger.enter();
            db.complainRetrieveByClientId(dbName, clientId, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err)
                }else{
                    if (!Number(hasBeenRead)) {
                        //set read if not
                        db.setComplainHasBeenReadByClientId(dbName, clientId, 'UP', function (err, result) {
                            if (err) {
                                logger.error(err);
                            }
                        });
                        callback(null,result);
                    }
                }
            });

        },


        /**
         * show complain list
         * @param dbName
         * @param clientCodeOrName
         * @param callback
         */
        getComplainList: function(dbName, clientCodeOrName, callback){
            logger.enter();
            db.complainRetrieveLastOneFromEveryClient(dbName, clientCodeOrName, function (err, result) {
                callback(err,result);
            });
        },

        /**
         * customer center
         * @param customerId
         * @param callback
         */
        getCustomerCenter : function(customerId,callback){
            logger.enter();
            db.loadCustomer(customerId, function (err, results) {
                callback(err,results);
            })
        },

        /**
         * set notification read
         * @param dbName
         * @param operator
         * @param msgId
         * @param docType
         * @param callback
         */
        setNotificationRead:function(dbName,operator,msgId,docType,docId,callback){
            logger.enter();
            var redirectMap = {
                "DOC_ORDER":"/customer/order/pending?orderId="+docId,   /* 订单相关的通知 */
                "DOC_SHIP":"/customer/ship/detail?shipId="+docId,    /* 发货单相关通知 */
                "DOC_RETURN":"/customer/return/detail?returnId="+docId,  /* 退货相关通知 */
                "DOC_REFUND":"/customer/bill/verifyRefundItem?refundId="+docId,  /* 退款相关通知 */
                "DOC_COMPLAIN":"/customer/complaints",/* 投诉建议相关通知 */
                "DOC_ACCOUNT":"/customer/client/review?id="+docId, /* 证照客户资料相关通知 */
                "DOC_PRICE":"/customer/priceset",   /* 调价单相关通知 */
                "DOC_OTHER": "/customer/message"   /* 其他客户通知 */
            };
            var operatorId = operator.operatorId;
            db.updateMessageStatus(dbName,msgId,operatorId,function(err,result){
                if(err){
                    callback(err);
                }else{
                    logger.trace("update message status success,msgId="+msgId);
                    var redirectUrl = redirectMap[docType];
                    callback(null,redirectUrl);
                }
            });
        },

        /**
         * customer 通知中心
         * @param dbName
         * @param operator
         * @param paginator
         * @param callback
         */
        getCustomerMessage:function(dbName,operator,paginator,callback){
            logger.enter();
            var startPos = (paginator.page-1)*paginator.pageSize;
            var offset = paginator.pageSize;
            var operatorId = operator.operatorId;
            var operatorFPs = operator.operatorRoles;
            var data = [];
            db.listOperatorMessages(dbName, paginator, operatorId, function(err,result){
                data = data.concat(result);
                db.listOperatorFPMessages(dbName, paginator, operatorFPs, function(err,results){
                    data = data.concat(results);
                    if(data.length>startPos){
                        data = data.splice(startPos,startPos+offset);
                    }
                    callback(err,data);
                })
            })
        },

        /**
         * 获取商户的未读消息条数
         * @param customerDB
         * @param operatorId
         * @param operatorFPs
         * @param callback
         */
        getCustomerUnreadMessageCounts:function(customerDB,operatorId,operatorFPs,callback) {
            db.hasNewOperatorMessage(customerDB,operatorId,operatorFPs,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,result);
                }
            });
        },

        /**
         *
         * @param customerDB
         * @param orderId
         * @param customerId
         * @param callback
         */
        listCustomerOrderDetails : function(customerDB, orderId, customerId, callback){
            logger.enter();
            var orderInfo = undefined;
            var clientId = undefined;
            var orderCatelog={};
            logger.debug(JSON.stringify(orderCatelog));
            async.series([
                function(done){
                    db.listPendingOrders(customerDB, orderId, function (err, orderdata) {
                        if (err) {
                            logger.error(err);
                            done("GET ORDER INFO ERR");
                        }

                        orderCatelog.order = orderdata;
                        clientId = orderdata[0].clientId;
                        var orderStatus=orderdata[0].status;
                        var paymentType=orderdata[0].paymentType;
                        var paymentStatus = orderdata[0].paymentStatus;
                        logger.dump('当前订单的状态: '+orderStatus);
                        if(orderStatus=='CREATED'){
                            orderCatelog.orderStatus=paymentStatus;
                        }else{
                            orderCatelog.orderStatus=orderStatus;
                        }
                        //logger.debug(JSON.stringify(orderCatelog));
                        done(null,"GET ORDER INFO SUCC");
                    })
                },
                function(done){
                    db.listGoodsByOrderId(customerDB, orderId, function (err, goods) {
                        if (err) {
                            logger.error(err);
                            done("GET GOODS INFO ERR");
                        }
                        var temp = [];
                        if(!underscore.isEmpty(goods)){
                            underscore.map(orderCatelog.order,function(orderItem){
                               underscore.map(goods,function(goodsItem){
                                   if(orderItem.goodsId == goodsItem.goodsId){
                                        orderItem['goodsInfo'] = goodsItem;
                                        temp.push(orderItem);
                                   }
                               })
                            });
                        }

                        orderCatelog.order = temp;

                        //logger.debug(JSON.stringify(orderCatelog));
                        done(null,"GET GOODS INFO SUCC")
                    })
                },
                function(done){
                    db.getOrderHistoryDetails(customerDB, orderId, function (err, orderHistroys) {
                        if (err) {
                            logger.error(err);
                            done("GET GOODSHISTORY ERR");
                        }
                        orderCatelog.orderhistorys = orderHistroys;
                        //logger.debug(JSON.stringify(orderCatelog));
                        done(null,"GET GOODSHISTORY SUCC");
                    })
                },
                function(done){
                    db.retrieveCustomerInfoForContract(__cloudDBName, customerId, function (err1, customerInfo) {
                        db.retrieveClientInfoForContract(customerDB, clientId, function (err2, clientInfo) {
                            db.retrieveOrderInfoForContract(customerDB, orderId, function (err3, orderContractInfo) {
                                db.getClientQualInfo(customerDB, clientId, function (err4, qualInfo) {
                                    if (err1 || err2 || err3 || err4) {
                                        done("GET CONTRACT ERR");
                                    }
                                    orderCatelog.customerContractInfo = customerInfo;
                                    orderCatelog.clientContractInfo = clientInfo;
                                    orderCatelog.clientQualInfo = qualInfo;
                                    orderCatelog.orderContractInfo = orderContractInfo;
                                    orderCatelog.contractStage = "CUSTOMERSIGN";
                                    //logger.debug(JSON.stringify(orderCatelog));
                                    done(null, "GET CONTRACT INFO SUCC");
                                });
                            });
                        });
                    });
                },
                function(done){
                    db.getShipDetailsByOrderId(customerDB,orderId,function(err,shipInfo){
                        if (err) {
                            logger.error(err);
                            done("GET SHIPINFO ERR");
                        }
                        orderCatelog.shipInfo = shipInfo;
                        //logger.debug(JSON.stringify(orderCatelog));
                        done(null,"GET SHIPINFO SUCC");
                    })
                },
                function(done){
                    db.getReturnInfoByOrderId(customerDB,orderId,function(err,results){
                        if (err) {
                            logger.error(err);
                            done(null,"GET RETURN INFO ERR")
                        }
                        orderCatelog.returnInfo = results;
                        if(orderCatelog.orderStatus == 'FINISHED' && results.length>0){
                            orderCatelog.orderStatus = 'RETURNED';
                        }
                        //logger.debug(JSON.stringify(orderCatelog));
                        done(null,"GET RETURN INFO SUCC")
                    })
                }
            ],
            function(errs,results){
                if(errs){
                    logger.error(JSON.stringify(errs));
                    callback(errs);
                }else{
                    logger.debug(JSON.stringify(results));
                    //logger.debug(JSON.stringify(orderCatelog));
                    callback(null,orderCatelog);
                }
            })
        },

        /**
         * 审核调价单并更新状态
         * @param customerDB
         * @param readjustData
         * @param callback
         */
        updateReadjustPrice: function(customerDB,readjustData,callback){
            var goodsId = readjustData.goodsId;
            var readjustId = readjustData.readjustId;
            var priceData = readjustData.priceData;
            var status = readjustData.status;

            var remark = readjustData.remark;
            db.beginTrans(function (connect) {
                async.series([
                        //step1:处理调价单总表状态变更
                        function(done){
                          db.metaUpdateReadjustPriceStatus(connect,customerDB,readjustId,status,remark,function(err,result){
                              done(err,result);
                          })
                        },
                        //step1.1:处理调价单详情表状态变更
                    /*    function(done){
                            db.metaUpdateReadjustDetailStatus(connect,customerDB,readjustId,function(err,result){
                                done(err,result);
                            })
                        },*/
                        //step2.1更新已审核调价详情数据——基础价格
                        function(done){
                            var basicPriceInfo = priceData.basicPriceInfo;
                            if(underscore.isEmpty(basicPriceInfo)||underscore.isNull(basicPriceInfo)){
                                done();
                            }else{
                                var temp = {};
                                underscore.map(basicPriceInfo,function(item){
                                    if(item.name=='limitedPrice'){
                                        temp.limitedPriceOrigin = item.oldPrice;
                                        temp.limitedPriceNew = item.newPrice;
                                    }
                                    if(item.name=='wholesalePrice'){
                                        temp.wholesalePriceOrigin = item.oldPrice;
                                        temp.wholesalePriceNew = item.newPrice;
                                    }
                                    if(item.name=='refRetailPrice'){
                                        temp.refRetailPriceOrigin = item.oldPrice;
                                        temp.refRetailPriceNew = item.newPrice;
                                    }
                                    if(item.name=='price1'){
                                        temp.price1Origin = item.oldPrice;
                                        temp.price1New = item.newPrice;
                                    }
                                    if(item.name=='price2'){
                                        temp.price2Origin = item.oldPrice;
                                        temp.price2New = item.newPrice;
                                    }
                                    if(item.name=='price3'){
                                        temp.price3Origin = item.oldPrice;
                                        temp.price3New = item.newPrice;
                                    }
                                });
                                temp.readjustId = readjustId;
                                temp.readjustType = "'BASIC'";
                                temp.isApproved = "TRUE";
                                db.metaNewGoodsPriceReadjustDetail(connect,customerDB,temp,function(err,results){
                                    done(err,results);
                                })
                            }
                        },
                        //step2.2更新已审核调价详情数据——客户类价格调整表
                        function(done){
                            var clientCategoryPriceInfo = priceData.clientCategoryPriceInfo;
                            if(underscore.isEmpty(clientCategoryPriceInfo)||underscore.isNull(clientCategoryPriceInfo)){
                                done();
                            }else{
                                async.mapSeries(
                                    clientCategoryPriceInfo,
                                    function(item,mapcallback) {
                                        logger.enter();
                                        var insertData = {};
                                        insertData.clientCategoryId = item.id;
                                        insertData.clientCategoryPriceOrigin = item.oldPrice;
                                        insertData.clientCategoryPriceNew = item.newPrice;
                                        insertData.readjustId = readjustId;
                                        insertData.isApproved = "TRUE";
                                        insertData.readjustType = "'CLIENTCATEGORY'";
                                        db.metaNewGoodsPriceReadjustDetail(connect,customerDB,insertData,function(err,results){
                                            mapcallback(err,results);
                                        })
                                    },
                                    function(err,results){
                                        if(err){
                                            logger.error(err);
                                            done(err);
                                        }else{
                                            done(null,results);
                                        }
                                    }
                                );
                            }
                        },
                        //step2.3更新已审核调价详情数据——客户单品价格调整表
                        function(done){
                            var clientPriceInfo = priceData.clientPriceInfo;
                            if(underscore.isEmpty(clientPriceInfo)||underscore.isNull(clientPriceInfo)){
                                done();
                            }else{
                                async.mapSeries(
                                    clientPriceInfo,
                                    function(item,mapcallback) {
                                        logger.enter();
                                        var insertData = {};
                                        insertData.clientId = item.id;
                                        insertData.clientPriceOrigin = item.oldPrice;
                                        insertData.clientPriceNew = item.newPrice;
                                        insertData.readjustId = readjustId;
                                        insertData.isApproved = "TRUE";
                                        insertData.readjustType = "'SINGLECLIENT'";
                                        db.metaNewGoodsPriceReadjustDetail(connect,customerDB,insertData,function(err,results){
                                            mapcallback(err,results);
                                        })
                                    },
                                    function(err,results){
                                        if(err){
                                            logger.error(err);
                                            done(err);
                                        }else{
                                            done(null,results);
                                        }
                                    }
                                );
                            }
                        },
                        //step3.1:根据调价单明细表-基础价格调整表调整基础价格
                        function(done){
                           if(status == 'APPROVED'){
                               db.metaListReadjustPriceDetail(connect,customerDB,readjustId,"'BASIC'",function(error,basicPrice){
                                   if(basicPrice.length>0) {
                                       var p = basicPrice[0];
                                       var goodsPriceData = {
                                           goodsId: goodsId,
                                           wholesalePrice: p.wholesalePriceNew,
                                           refRetailPrice: p.refRetailPriceNew,
                                           limitedPrice: p.limitedPriceNew,
                                           price1: p.price1New,
                                           price2: p.price2New,
                                           price3: p.price3New
                                       };

                                       db.metaUpdateGoodsPrice(connect, customerDB, goodsPriceData, function (err, result) {
                                           done(err, result)
                                       })
                                   }else{
                                       done();
                                   }
                               })
                           }else{
                               done();
                           }
                        },
                        //step3.2:根据调价单明细表-客户类价格调整表调整客户类价格
                        function(done){
                            if(status == 'APPROVED'){
                                db.metaListReadjustPriceDetail(connect,customerDB,readjustId,"'CLIENTCATEGORY'",function(error,clientCategoryPriceInfo){
                                    if(clientCategoryPriceInfo.length>0){
                                        async.mapSeries(
                                            clientCategoryPriceInfo,
                                            function(item,mapcallback) {
                                                logger.enter();
                                                var updateData = {};
                                                updateData.goodsId = goodsId;
                                                updateData.clientCategoryId = item.clientCategoryId;
                                                updateData.clientCategoryPrice = item.clientCategoryPriceNew;

                                                //更新价格<0表示删除该数据
                                                if(updateData.clientCategoryPrice <0){
                                                    db.metaRemoveClientCategoryPrice(connect,customerDB,updateData.goodsId,updateData.clientCategoryId,function(err,results){
                                                        mapcallback(err, results);
                                                    })
                                                }else{
                                                    db.metaUpdateClientCategoryPrice(connect,customerDB,updateData,function(err,results) {

                                                        mapcallback(err, results);
                                                    });
                                                }
                                            },
                                            function(err,results){
                                                if(err){
                                                    logger.error(err);
                                                    done(err);
                                                }else{
                                                    done(null,results);
                                                }
                                            }
                                        );
                                    }else{
                                        done();
                                    }
                                });
                            }else{
                                done();
                            }
                        },
                        //step3.3:根据调价单明细表-客户单品价格调整表调整客户单品价格
                        function(done){
                            if(status == 'APPROVED'){
                                db.metaListReadjustPriceDetail(connect,customerDB,readjustId,"'SINGLECLIENT'",function(error,clientPriceInfo){
                                    if(clientPriceInfo.length>0) {
                                        async.mapSeries(
                                            clientPriceInfo,
                                            function (item, mapcallback) {
                                                logger.enter();
                                                var updateData = {};
                                                updateData.goodsId = goodsId;
                                                updateData.clientId = item.clientId;
                                                updateData.clientPrice = item.clientPriceNew;
                                                //更新价格<0表示删除该数据
                                                if (updateData.clientPrice < 0) {
                                                    db.metaRemoveClientPrice(connect, customerDB, updateData.goodsId, updateData.clientId, function (err, results) {
                                                        mapcallback(err, results);
                                                    })
                                                } else {
                                                    db.metaUpdateClientPrice(connect, customerDB, updateData, function (err, results) {
                                                        mapcallback(err, results);
                                                    });
                                                }
                                            },
                                            function (err, results) {
                                                if (err) {
                                                    logger.error(err);
                                                    done(err);
                                                } else {
                                                    done(null, results);
                                                }
                                            }
                                        );
                                    }else{
                                        done();
                                    }
                                });
                            }else{
                                done();
                            }
                        }

                    ],
                    function (err, resultList) {
                        if (err) {
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
            }


            );

        },

        /**
         * 根据ID查看或审核调价单页面数据
         * @param customerDB
         * @param readjustId
         * @param callback
         */
        listCheckReadjustPricePage : function(customerDB,readjustId,callback){
            logger.enter();
            var result= {};
            async.series([
                    //step1 : //商品基础信息用于显示表头
                    function (done){
                        db.listReadjustPriceCommonById(customerDB,readjustId,function(err,commonInfo){
                            if(!err){
                                result.commonInfo=commonInfo;
                            }
                            done(err,commonInfo)
                        });
                    },

                    //step2   //商品的价格数据
                    function (done){
                        db.listReadjustPriceDetailsById(customerDB,readjustId,function(err,detailInfo){
                            if(!err){
                                var basicPrice = [];
                                var clientPrice=[];
                                var clientCategoryPrice=[];
                                underscore.map(detailInfo,function(item){
                                    if(item.readjustType == "BASIC"){
                                        basicPrice.push(item);
                                    }else if(item.readjustType=="SINGLECLIENT"){
                                        clientPrice.push(item);
                                    }else{
                                        clientCategoryPrice.push(item);
                                    }
                                });
                                result.detailInfo={};
                                result.detailInfo.basicPrice=basicPrice;
                                result.detailInfo.clientPrice=clientPrice;
                                result.detailInfo.clientCategoryPrice=clientCategoryPrice;

                            }

                            done(err,detailInfo)
                        });
                    }
                ],
                //if no err,resultList = [results,results]
                function (err, resultList) {
                    if (err&&typeof(err)==="object") {
                        logger.error("async series error"+err);
                        callback(err);
                    } else {
                        logger.debug("async finish");
                        callback(null,result);
                    }
                }
            );
        },

        /**
         * 根据调价类型
         * 取出调价单历史数据
         * @param customerDB
         * @param goodsId
         * @param readjustType
         * @param paginator
         * @param callback
         */
        listReadjustPriceHistory: function(customerDB,goodsId,readjustType,paginator,callback){

            logger.enter();
            var result= {};
            async.series([
                    //step1 : //商品基础信息用于显示表头
                    function (done){
                        db.listSingleGoodsPriceInfo(customerDB,goodsId,function(err,goodsBasicInfo){
                            if(!err){
                                result.goodsBasicInfo=goodsBasicInfo;
                            }
                            done(err,goodsBasicInfo)
                        });
                    },

                    //step2   //商品的价格审核表数据，只包含审核通过的部分
                    function (done){
                        db.listReadjustedPrice(customerDB,goodsId,readjustType,paginator,function(err,readjustPriceInfo){


                            if(!err){
                                result.readjustPriceInfo=readjustPriceInfo;
                            }
                            done(err,readjustPriceInfo)
                        });
                    }

                ],
                //if no err,resultList = [results,results]
                function (err, resultList) {
                    if (err) {
                        logger.error("async series error"+err);
                        callback(err);
                    } else {
                        logger.debug("async finish");
                        callback(null,result);
                    }
                }
            );


        },

        /**
         * 验证调价单状态
         * @param customerDB
         * @param priceData
         * @param callback
         */
        checkReadjustStatus : function(customerDB,priceData,callback){

            var goodsId = priceData.goodsId;
            var readjustTypes = [];
            var basicPriceInfo = priceData.basicPriceInfo;
            if(!(underscore.isEmpty(basicPriceInfo)||underscore.isNull(basicPriceInfo))){
                readjustTypes.push('BASIC')
            }
            var clientCategoryPriceInfo = priceData.clientCategoryPriceInfo;
            if(!(underscore.isEmpty(clientCategoryPriceInfo)||underscore.isNull(clientCategoryPriceInfo))){
                readjustTypes.push('CLIENTCATEGORY')
            }
            var clientPriceInfo = priceData.clientPriceInfo;
            if(!(underscore.isEmpty(clientPriceInfo)||underscore.isNull(clientPriceInfo))){
                readjustTypes.push('SINGLECLIENT')
            }
            if(readjustTypes.length== 0){
                callback(true);
            }else{
                db.checkReadjustEnable(customerDB,goodsId,readjustTypes,function(err,results){

                    if(err){
                       logger.error(err)
                       callback(false)
                   }else{
                       callback(underscore.isEmpty(results)?true:false);
                   }
                });
            }
        },
        /**
         * 生成调价单
         * @param customerDB
         * @param operatorData
         * @param priceData
         * @param callback
         */
        creatReadjustPrice : function(customerDB,operatorData,priceData,callback){
            logger.enter();
            var readjustId = null;
            db.beginTrans(function (connect) {
                async.series([
                //step1:生成调价单总表
                        function(done){
                           var goodsId = priceData.goodsId;
                           var applyOperatorId = operatorData.operatorId;
                           var checkContents = priceData.checkContents;
                           var approverId = checkContents.operatorId;
                           var reason = checkContents.modifyReason;
                           db.metaNewGoodsPriceReadjust(connect,customerDB,
                               goodsId, applyOperatorId, approverId, reason,
                               function(err,insertId){
                                   if(err){
                                       logger.error(err);
                                       done(err);
                                   }else{
                                       //获得调价单Id
                                       readjustId=insertId;
                                       done(err,insertId);
                                   }
                           });
                        },
                //step2.1:生成调价单明细表-基础价格调整表
                        function(done){
                            var basicPriceInfo = priceData.basicPriceInfo;
                            if(underscore.isEmpty(basicPriceInfo)||underscore.isNull(basicPriceInfo)){
                                done();
                            }else{
                                var temp = {};
                                var isChanged=false;//默认没有改变
                                underscore.map(basicPriceInfo,function(item){
                                    if(item.name=='limitedPrice'){
                                        temp.limitedPriceOrigin = item.oldPrice;
                                        temp.limitedPriceNew = item.newPrice;
                                        if(!isChanged){
                                            isChanged=item.oldPrice!= item.newPrice;
                                        }
                                    }
                                    if(item.name=='wholesalePrice'){
                                        temp.wholesalePriceOrigin = item.oldPrice;
                                        temp.wholesalePriceNew = item.newPrice;
                                        if(!isChanged){
                                            isChanged=item.oldPrice!= item.newPrice;
                                        }
                                    }
                                    if(item.name=='refRetailPrice'){
                                        temp.refRetailPriceOrigin = item.oldPrice;
                                        temp.refRetailPriceNew = item.newPrice;
                                        if(!isChanged){
                                            isChanged=item.oldPrice!= item.newPrice;
                                        }
                                    }
                                    if(item.name=='price1'){
                                        temp.price1Origin = item.oldPrice;
                                        temp.price1New = item.newPrice;
                                        if(!isChanged){
                                            isChanged=item.oldPrice!= item.newPrice;
                                        }
                                    }
                                    if(item.name=='price2'){
                                        temp.price2Origin = item.oldPrice;
                                        temp.price2New = item.newPrice;
                                        if(!isChanged){
                                            isChanged=item.oldPrice!= item.newPrice;
                                        }
                                    }
                                    if(item.name=='price3'){
                                        temp.price3Origin = item.oldPrice;
                                        temp.price3New = item.newPrice;
                                        if(!isChanged){
                                            isChanged=item.oldPrice!= item.newPrice;
                                        }
                                    }
                                });
                                temp.readjustId = readjustId;
                                temp.readjustType = "'BASIC'";
                                if(isChanged){
                                    db.metaNewGoodsPriceReadjustDetail(connect,customerDB,temp,function(err,results){
                                        done(err,results);
                                    })
                                }else{
                                    done();
                                }
                            }
                        },
                //step2.2:生成调价单明细表-客户类价格调整表
                        function(done){
                            var clientCategoryPriceInfo = priceData.clientCategoryPriceInfo;
                            if(underscore.isEmpty(clientCategoryPriceInfo)||underscore.isNull(clientCategoryPriceInfo)){
                                done();
                            }else{
                                async.mapSeries(
                                    clientCategoryPriceInfo,
                                    function(item,mapcallback) {
                                        logger.enter();
                                        var insertData = {};
                                        insertData.clientCategoryId = item.id;
                                        insertData.clientCategoryPriceOrigin = item.oldPrice;
                                        insertData.clientCategoryPriceNew = item.newPrice;
                                        if(insertData.clientCategoryPriceOrigin!=insertData.clientCategoryPriceNew){
                                            insertData.readjustId = readjustId;
                                            insertData.readjustType = "'CLIENTCATEGORY'";
                                            db.metaNewGoodsPriceReadjustDetail(connect,customerDB,insertData,function(err,results){
                                                mapcallback(err,results);
                                            })

                                        }else{
                                            mapcallback();
                                        }


                                    },
                                    function(err,results){
                                        if(err){
                                            logger.error(err);
                                            done(err);
                                        }else{
                                            done(null,results);
                                        }
                                    }
                                );
                            }
                        },
                //step2.3:生成调价单明细表-客户单品价格调整表
                        function(done){
                            var clientPriceInfo = priceData.clientPriceInfo;
                            if(underscore.isEmpty(clientPriceInfo)||underscore.isNull(clientPriceInfo)){
                                done();
                            }else{
                                async.mapSeries(
                                    clientPriceInfo,
                                    function(item,mapcallback) {
                                        logger.enter();
                                        var insertData = {};
                                        insertData.clientId = item.id;
                                        insertData.clientPriceOrigin = item.oldPrice;
                                        insertData.clientPriceNew = item.newPrice;
                                        insertData.readjustId = readjustId;
                                        insertData.readjustType = "'SINGLECLIENT'";
                                        if(insertData.clientPriceOrigin!=insertData.clientPriceNew){
                                            db.metaNewGoodsPriceReadjustDetail(connect,customerDB,insertData,function(err,results){
                                                mapcallback(err,results);
                                            })
                                        }else{
                                            mapcallback();
                                        }
                                    },
                                    function(err,results){
                                        if(err){
                                            logger.error(err);
                                            done(err);
                                        }else{
                                            done(null,results);
                                        }
                                    }
                                );
                            }
                        }
                    //todo step3:发出通知提醒审核操作员
                    ],
                    function (err, resultList) {
                        if (err&&typeof(err)==="object") {
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

        //加载单个商品调价数据（生成调价单之前的数据）
        getSingleGoodPriceData: function(customerDB,goodsId,OperatorData,callback){
            var result={};
            async.series([
                    //step1 : //商品基础信息及基础价格
                    function (done){
                        db.listSingleGoodsPriceInfo(customerDB,goodsId,function(err,goodsBasicPriceInfo){
                            if(!err){
                                result.goodsBasicInfo=goodsBasicPriceInfo;
                            }
                            done(err,goodsBasicPriceInfo)
                        });
                    },
                    //step2   //商品的客户类价格
                    function (done){
                        db.listClientCategoryPriceByGoodsId(customerDB,goodsId,function(err,goodsClientCategoryPriceInfo){
                            if(!err){

                                result.goodsClientCategoryPriceInfo=goodsClientCategoryPriceInfo;
                            }
                            done(err,goodsClientCategoryPriceInfo)
                        });
                    },
                    //step3 : //商品的客户单品价格,此时不指定特定客户名，clientName=""
                    function (done){
                        db.listClientPriceByGoodsId(customerDB,goodsId,"",function(err,goodsClientPrice){
                            if(!err){
                                result.goodsClientPriceInfo = goodsClientPrice;
                            }
                            done(err,goodsClientPrice)
                        });
                    },
                    //step4 : //获取审核人的信息
                    function (done){
                        db.listOthterCustomerOperator(customerDB,OperatorData.operatorId,function(err,operatorlist){
                            if(!err){
                                result.operatorlist = operatorlist;
                            }
                            done(err,operatorlist)
                        });
                    }
                ],
                //if no err,resultList = [results,results]
                function (err, resultList) {
                    if (err) {
                        logger.error("async series error"+err);
                        callback(err);
                    } else {
                        logger.debug("async finish");
                        callback(null,result);
                    }
                }
            );
        },

        //加载商品管理中的商品数据，可根据不同标签页类型加载
        getGoodsForCustomerManager: function(customerDB,paginator,goodTypeId,handerType,callback){
            //设置库存或者设置价格，需显示全部商品
            if(handerType=='setInventory'||handerType=='setprice'){
                //var goodsTypeId = goodsTypeId || 0;
                dataService.getGoodsTypeDescendants(customerDB,goodTypeId,function(err, goodsTypeIds) {
                    db.listCustomerGoods(customerDB, goodsTypeIds, paginator, function (err, results) {
                        if (err) {
                            logger.error(err);
                            callback(err);
                        } else {



                            callback(err, results);
                        }
                    });
                });
            }else if(handerType=='goodsInShelf'){
                //已上架商品
                var isOnSell = 1;
                var IdObj = {};
                db.listOnSellGoods(customerDB,IdObj,isOnSell,paginator,function(err,results){
                    if(err){
                        logger.error(err);
                        callback(err);
                    } else{
                        callback(err,results);
                    }
                })
            }else if(handerType=='goodsinware'){
                //仓库中商品
                var isOnSell = 0;
                var IdObj = {};
                db.listOnSellGoods(customerDB,IdObj,isOnSell,paginator,function(err,results){
                    if(err){
                        logger.error(err);
                        callback(err);
                    } else{
                        callback(err,results);
                    }
                })
            }

        },

        /**
         * 退货发货确认
         * @param customerDB
         * @param data
         * @param operatorData
         * @param callback
         */
        confirmReturnDelivered: function(customerDB,data,operatorData,callback){
            logger.enter();
            db.beginTrans(function (connect) {
                // var value for next step
                var returnId = data.returnId;
                var orderId = data.orderId;
                var remark = data.remark;
                logger.debug(JSON.stringify(data));
                //start async
                async.series([
                        //step1 update returnInfo data to ReturnInfo.sql;
                        function updateShippedReturnInfo(done){
                            var updateData={status:"DELIVERED", returnDeliveredRemark:remark};
                            db.metaUpdateReturnStatus(connect,customerDB,returnId,updateData,function(err,affectedRows){
                                if(err){
                                    done(err);
                                }else{
                                    done(err,affectedRows);
                                }
                            });
                        },
                        //step2 update return details to ReturnDetails.sql
                        function updateReturnDeliverdReturnDetails(done){
                            var deliverdItems = data.deliveredItems;
                            logger.debug(JSON.stringify(deliverdItems));
                            async.mapSeries(
                                deliverdItems,
                                function(item,mapcallback) {
                                    logger.enter();
                                    var metaUpdateData = item.batchDatas;
                                    db.metaUpdateDeliveredReturnDetails(connect,customerDB,metaUpdateData,function(err,affectedRows){
                                        if(err){
                                            logger.error(err);
                                            mapcallback(err);
                                        }else{
                                            mapcallback(err,affectedRows);
                                        }
                                    });
                                },
                                function(err,results){
                                    if(err){
                                        logger.error(err);
                                        done(err);
                                    }else{
                                        logger.debug(JSON.stringify(results))
                                        done(null,results);
                                    }
                                }
                            );
                        },
                        //step3  add order history in OrderHistory
                        function newOrderHistory(done){
                            var orderHistoryData = {};
                            orderHistoryData.clientId = underscore.isEmpty(operatorData.clientId)?0:operatorData.clientId;
                            orderHistoryData.operatorId = operatorData.operatorId;
                            orderHistoryData.orderId = orderId;
                            orderHistoryData.action = "RECEIVE-RETURN";
                            orderHistoryData.returnId = returnId;
                            orderHistoryData.remark = remark;
                            db.metaNewOrderHistory(connect,customerDB, orderHistoryData, function (err,success) {
                                if(err){
                                    done(err)
                                }else{
                                    done(err,success)
                                }

                            });
                        }
                    ],
                    //if no err,resultList = [shipId,lastShipDetailsId,mapSeriesResult,orderStatusAffectedRows,success]
                    function (err, resultList) {
                        if (err&&typeof(err)==="object") {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function (transErr) {
                                callback(err);
                            });
                        } else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                //final callback result:returnId
                                callback(null,returnId);
                            });
                        }
                    }
                )
            });

        },

        transUpdateInventoryPlan: function(customerDB,planName,updateData,planId,callback){
            db.beginTrans(function (connect) {
                async.series([
                        //step1 :update GoodsInventoryPlan
                        function updateGoodsInventoryPlan(done){
                            var updateData= {"name":planName};
                            db.metaUpdateInventoryPlan(connect, customerDB, updateData,planId,function(err,results) {
                                if(err){
                                    done(err);
                                }else{
                                    done(err,results) ;
                                }
                            });
                        },
                        //step2   updateGoodsInventoryPlanDetails
                        function metaUpdateInventoryPlanDetails(done){
                            logger.debug(JSON.stringify(updateData));
                            db.metaUpdateInventoryPlanDetails(connect, customerDB,updateData,function(error,results) {
                                if(error){
                                    done(error);
                                }else {
                                    done(error, results);
                                }
                            });
                        }
                    ],
                    //if no err,resultList = [results,results]
                    function (err, resultList) {
                        if (err) {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function (transErr) {
                                callback(err);
                            });
                        } else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                //final callback result:
                                callback(null,resultList);
                            });
                        }
                    }
                );

            });
        },

        transAddInventoryPlan:function(customerDB,planName,itemKeys,itemVals,callback){
            var inventoryPlanId = undefined;
            db.beginTrans(function (connect) {
                async.series([
                        //step1 :insert into GoodsInventoryPlan
                        function insertGoodsInventoryPlan(done){
                            db.metaAddGoodsInventoryPlan(connect, customerDB, planName,function(err,goodsInventoryPlanId) {
                                inventoryPlanId = goodsInventoryPlanId;
                                done(err,inventoryPlanId)
                            });
                        },
                        //step2   insert into GoodsInventoryPlanDetails
                        function insertGoodsInventoryPlanDetails(done){
                            var detailsData = [];
                            for(var i=0; i<itemVals.length;i++){
                                if(itemVals[i] != ""){
                                    var item = [];
                                    var NUMBER_MAX_SAFE_INTEGER = Math.pow(2,53)-1;
                                    item.push(inventoryPlanId);
                                    item.push(Number(itemKeys[i]=="X"?NUMBER_MAX_SAFE_INTEGER:itemKeys[i]));
                                    item.push(itemVals[i]);
                                    detailsData.push(item);
                                    logger.debug(JSON.stringify(item));
                                }
                            }
                            logger.debug(JSON.stringify(detailsData));
                            db.metaAddGoodsInventoryPlanDetails(connect, customerDB,detailsData,function(error,results) {
                                done(error,results);
                            });
                        }
                    ],
                    //if no err,resultList = [inventoryPlanId,results]
                    function (err, resultList) {
                        if (err&&typeof(err)==="object") {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function (transErr) {
                                callback(err);
                            });
                        } else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                //final callback result:
                                callback(null,inventoryPlanId);
                            });
                        }
                    }
                );

            });
        },

        /*
         * status check functions
         */
        //检查提交数据是否符合当前订单状态，避免重复提交状态变更
        returnStatusCheck: function (customerDB,returnId,conditions,callback){
            logger.enter();

            db.getReturnDetailsById(customerDB,returnId,function(err,returnInfos){
                if(conditions.indexOf(returnInfos[0].status) > -1) {
                    callback(true) ;
                }else {
                    callback(false);
                }
            })
        },
        //检查提交数据是否符合当前订单状态，避免重复提交状态变更
        orderStatusCheck: function (customerDB,orderId,conditions,callback){
            logger.enter();
            db.getOrderInfo(customerDB,orderId,function(order){
                logger.debug(conditions);
                logger.debug(order.status);
                logger.debug(conditions.indexOf(order.status));
                if(conditions.indexOf(order.status) > -1) {
                    callback(true) ;
                }else {
                    callback(false);
                }
            })
        },

        //API
        changePwd: function(customerDB,operatorId,passwordData,callback){
            logger.enter();
            /*
            *step1 validate origin password is real
            */
            //base64 decode password
            var oldPwd = new Buffer(passwordData.password,'base64');
            var newPwd = new Buffer(passwordData.passwordnew,'base64');

            db.getOperatorById(customerDB, operatorId, function(err, operatorInfo){
                hasher(oldPwd.toString()).verifyAgainst(operatorInfo.password, function(err2, verified){
                    if (err2) {
                        callback(FBCode.INTERNALERROR, err2);
                        return;
                    } else {
                        if (verified) {
                            // 旧密码正确
                            hasher(newPwd.toString()).hash(function(err3, hashedPwd){
                                var updateOperatorInfo = {password:hashedPwd};
                                db.updateOperatorInfo(customerDB, updateOperatorInfo, operatorId, function(err4, affectedRows){
                                    if (err4) {
                                        callback(FBCode.DBFAILURE, err4);
                                        return;
                                    }
                                    if (affectedRows<1)
                                        callback(FBCode.INTERNALERROR,"操作员id不正确，密码修改失败");
                                    else
                                        callback(FBCode.SUCCESS,"修改密码成功，请牢记新密码");
                                });
                            });
                        } else {
                            // 旧密码错误
                            callback(FBCode.LOGINFAILURE, "旧密码不正确，请重新输入!");
                        }
                    }
                });
            });
        },

        updateReturnStatus: function (customerDB,returnId,customerReply,approvedItems,operatorData,callback) {
            db.beginTrans(function (connect) {
                async.series([
                        //step1 :update ReturnStatus
                        function updateReturnStatus(done){
                            var updateData= {status:"APPROVED",customerReply:customerReply};
                            db.metaUpdateReturnStatusWithConfirmDate(connect,customerDB,returnId,updateData, function (err,affectedRows)  {
                                if(err){
                                    done(err);
                                }else{
                                    done(err,affectedRows);
                                }
                            });
                        },
                        //step2 :update ReturnDetails
                        function updateReturnStatus(done){
                            if(approvedItems.length!=0){
                                async.mapSeries(
                                    approvedItems,
                                    function(item,callback) {
                                        logger.enter();
                                        db.metaUpdateReturnDetails(connect,customerDB,returnId,item, function (err,updateResults)  {
                                            if(err){
                                                callback(err);
                                            }else{
                                                callback(err,updateResults);
                                            }
                                        });
                                    },
                                    function(err,results){
                                        if(err){
                                            logger.error(err);
                                            done(err);
                                        }else{
                                            done(err,results);
                                        }
                                    }
                                )
                            }else{
                                done();
                            }
                        },
                        //step2   new OrderHistory
                        function metaNewOrderHistory(done){
                            db.getReturnDetailsById(customerDB,returnId,function(err,returns){
                                var orderId = returns[0].orderId;
                                var orderHistoryData = {};
                                orderHistoryData.orderId = orderId;
                                orderHistoryData.returnId = returnId;
                                orderHistoryData.operatorId = operatorData.operatorId;
                                orderHistoryData.clientId = operatorData.clientId;
                                orderHistoryData.action = "APPROVE-RETURN";
                                orderHistoryData.remark = customerReply;
                                db.metaNewOrderHistory(connect,customerDB,orderHistoryData,function(err,success){
                                   if(err){
                                       done(err);
                                   }else {
                                       done(err, success);
                                   }
                                })
                            });
                        }
                    ],
                    //if no err,resultList = [affectedRows,results,success]
                    function (err, resultList) {
                        if (err) {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function (transErr) {
                                callback(err);
                            });
                        } else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                //final callback result:
                                callback(null,returnId);
                            });
                        }
                    }
                );

            });
        },

        confirmReturnStatus: function (customerDB,returnId,status,customerReply,operatorData,callback) {
            db.beginTrans(function (connect) {
                try {
                    var updateData = {status:status};
                    db.metaUpdateReturnStatus(connect,customerDB,returnId,updateData,function (err,affectedRows) {
                        if(affectedRows){
                            var orderHistoryData = {};
                            db.getReturnDetailsById(customerDB,returnId,function(err,returns){
                                var orderId = returns[0].orderId;
                                orderHistoryData.orderId = orderId;
                                orderHistoryData.returnId = returnId;
                                orderHistoryData.operatorId = operatorData.operatorId;
                                orderHistoryData.clientId = operatorData.clientId;
                                orderHistoryData.action = "RECEIVE-RETURN";
                                orderHistoryData.remark = customerReply;
                                db.metaNewOrderHistory(connect,customerDB,orderHistoryData,function(err,success){
                                    if (success) {
                                        db.commitTrans(connect, function () {
                                            callback(returnId);
                                        });
                                    }
                                })
                            })

                        }
                    })

                } catch (err) {
                    /* rollback the transaction */
                    logger.error("Going to rollback transaction, stack trace: " + err.stack);
                    db.rollbackTrans(connect, function () {
                        callback(err);
                    });
                }
            });
        },

        /**
         *check order quantity > goodsInventory
         * @param customerDBName
         * @param orderId
         * @param callback
         */
        checkInventory: function (customerDBName, orderId, callback) {
            db.listPendingOrders(customerDBName,orderId, function (err,orders) {
                var inventoryData = [];
                logger.debug(JSON.stringify(orders))
                for(var i in orders){
                    var item = {};
                    if(!orders[i].negSell && orders[i].quantity>orders[i].goodsInventory){
                        callback([])
                    }else{
                        item.goodsId = orders[i].goodsId;
                        item.lockedInventory = orders[i].quantity;
                        item.goodsInventory = orders[i].goodsInventory - orders[i].quantity
                    }
                    inventoryData.push(item);
                }
                logger.debug(JSON.stringify(inventoryData))
                callback(inventoryData)
            })
        },

        /**
         * OLD update order status function
         * @param customerDBName
         * @param updateData
         * @param operatorData
         * @param callback
         */
        transUpdateOrderStatus: function(customerDBName,updateData,operatorData,callback) {
            logger.enter();
            db.beginTrans(function (connect) {
                try {
                    /* insert into Client */
                    db.metaUpdateStatus(connect,customerDBName,
                        updateData.orderId,
                        updateData.status,
                        updateData.remark,
                        function(err,result){
                            if(!err){
                            if(updateData.status =="APPROVED"){
                                var goodsInventoryItems = updateData.inventoryDatas;
                                logger.trace(JSON.stringify(goodsInventoryItems));
                                var count = goodsInventoryItems.length;
                                var i = 0;
                                db.metaUpdateOrderContractInfo(connect, customerDBName, updateData.orderId, updateData.customerSignature, function (error, result) {
                                    if (error) {
                                        logger.error(error);
                                        return;
                                    }
                                    var updateInventoryItem = function (index) {
                                        db.metaUpdateInventory(connect,
                                            customerDBName,
                                            goodsInventoryItems[index],
                                            function (err,affectedRows) {
                                                if (!err) {
                                                    if (++index < count) {
                                                        logger.trace("do next update");
                                                        updateInventoryItem(index);
                                                    } else {
                                                        var orderHistoryData = {};
                                                        orderHistoryData.orderId = updateData.orderId;
                                                        orderHistoryData.operatorId = operatorData.operatorId;
                                                        // 当operator是客户时取 clientId, 否则取customerID
                                                        orderHistoryData.clientId = operatorData.clientId || operatorData.customerId;
                                                        orderHistoryData.action = "APPROVE";
                                                        orderHistoryData.remark = updateData.remark;
                                                        db.metaNewOrderHistory(connect, customerDBName, orderHistoryData, function (err, success) {
                                                            if (success) {
                                                                db.commitTrans(connect, function () {
                                                                    callback(null,updateData.orderId);
                                                                });
                                                            }
                                                        })
                                                    }

                                                }
                                            })

                                    };
                                    updateInventoryItem(i);
                                });
                            }else{
                                var orderHistoryData = {};
                                orderHistoryData.orderId = updateData.orderId;
                                orderHistoryData.operatorId = operatorData.operatorId;
                                orderHistoryData.clientId = operatorData.clientId;
                                orderHistoryData.action = "REJECT";
                                orderHistoryData.remark = updateData.remark;
                                db.metaNewOrderHistory(connect,customerDBName,orderHistoryData,function(err,success){
                                    if(success){
                                        db.commitTrans(connect, function () {
                                            callback(null,updateData.orderId);
                                        });
                                    }
                                })
                            }
                        }
                    });
                } catch (err) {
                    /* rollback the transaction */
                    logger.error("Going to rollback transaction, stack trace: " + err.stack);
                    db.rollbackTrans(connect, function () {
                        callback(err);
                    });
                }
            });
        },


        /**
         * new update order status function 0326
         * @param customerDBName
         * @param updateData
         * @param operatorData
         * @param callback
         */
        transUpdateOrderStatusNew: function(customerDBName,updateData,operatorData,callback) {
            logger.enter();
            db.beginTrans(function (connect) {
                async.series([
                    function(done){
                        db.metaUpdateStatus(connect,customerDBName,
                            updateData.orderId,
                            updateData.status,
                            updateData.remark,
                            function(err,result){
                                if(!err){
                                    done(null,"SUCCESS UPDATE ORDER STATUS");
                                }else{
                                    done(err);
                                }
                            })
                    },
                    function(done){
                        db.metaUpdateOrderContractInfo(connect, customerDBName, updateData.orderId, updateData.customerSignature, function (error, result) {
                            if (error) {
                                logger.error(error);
                                done(error);
                            }else{
                                done(null,"SUCCESS UPDATE ORDER CONTRACTINFO");
                            }
                        })
                    },
                    function(done){
                        var orderHistoryData = {};
                        orderHistoryData.orderId = updateData.orderId;
                        orderHistoryData.operatorId = operatorData.operatorId;
                        // 当operator是客户时取 clientId, 否则取customerID
                        orderHistoryData.clientId = operatorData.clientId || operatorData.customerId;
                        orderHistoryData.action = "APPROVE";
                        orderHistoryData.remark = updateData.remark;
                        db.metaNewOrderHistory(connect, customerDBName, orderHistoryData, function (err, success) {
                            if (success) {
                               done(null,"SUCCESS UPDATE ORDERHISTORY");
                            }else{
                                done(err);
                            }
                        })
                    }
                ],
                function(errs,resultArr){
                    if(errs){
                        logger.error(JSON.stringify(errs));
                        db.rollbackTrans(connect, function () {
                            callback(errs);
                        });
                    }else{
                        logger.debug(JSON.stringify(resultArr));
                        db.commitTrans(connect, function () {
                            callback(null,updateData.orderId);
                        });
                    }
                });
            });
        },

        /**
         * 同步订单审核状态到ERP
         * @param session
         * @param updateData
         * @param callback
         */
        asyncOrderStatusToERP : function(session,updateData,callback){
            logger.enter();
            var msgdata={
                orderUpdate: {
                    orderId: updateData.orderId,
                    status: updateData.status,
                    remark:updateData.remark,
                    createdOn: (new Date()).toLocaleString()
                }
            };
            var apiModule = require(__base + "/apps/api/apiModule")();
            var data = {};
            async.series(
                [
                    function(cb){
                        //订单审核数据同步到销售方ERP
                        data.msgData = msgdata;
                        data.customerId = session.customer.customerId;
                        data.msgType= "B2B_ORDER_CONFIRM_TO_SELLER";

                        apiModule[data.msgType](data,function(err,result){
                            if(err){logger.error(err)};
                            logger.debug(result);
                        });
                        cb(null,data.msgType);
                    },
                    function(cb){
                        if(__sccMode=="SM") {
                            //SM NO BUYER ERP
                            cb();
                        }else{
                            //订单审核数据同步到采购方ERP
                            data.msgData = msgdata;
                            data.customerId = session.operator.customerId;
                            data.msgType= "B2B_ORDER_CONFIRM_TO_BUYER";

                            apiModule[data.msgType](data,function(err,result){
                                if(err){logger.error(err)};
                                logger.debug(result);
                            });
                            cb(null,data.msgType);
                        }
                    }
                ],
                function(errs,results){
                    logger.debug(results);
                    callback(errs,results);
                }
            );
        },

        //通知库存阈值
        notifyInventoryThresholdWarning: function(customerDbName, customerId, data, callback) {
            var userType = 'Customer';
            var msgType = 'SKU_STOCK_OUT';
            var userId = customerId;
            var msgData = {
                goodsInventories: data
            };
            var apiRobot = new ApiRobot(customerDbName, cloudDbName, db, __redisClient);
            apiRobot.sendMsg(userType, userId, msgType, msgData, function sendMsgCallback(error, result) {
                if (error) {
                    logger.error(error);
                    callback(error);
                }else{
                    callback(null, result);
                }
            });
        },

        /**
         * customerAddGoods function
         * @param customerDBName
         * @param goodsData
         * @param callback
         */
        customerAddGoods: function(customerDBName,goodsInfo,callback) {
            logger.enter();
            db.getConnection(function(connect) {
                db.metaNewGoodsInfo(
                    connect,
                    customerDBName,
                    goodsInfo.goodsType,
                    goodsInfo.goodsNo,
                    goodsInfo.barcode,
                    goodsInfo.commonName,
                    goodsInfo.pinyinInitials,
                    goodsInfo.filingNumber,
                    goodsInfo.filingNumberValidDate,
                    goodsInfo.producer,
                    goodsInfo.spec,
                    goodsInfo.imageUrl,
                    goodsInfo.areaDesc,
                    goodsInfo.goodsDetails,
                    goodsInfo.alias,
                    goodsInfo.birthPlace,
                    goodsInfo.measureUnit,
                    goodsInfo.largePackUnit,
                    goodsInfo.largePackNum,
                    goodsInfo.middlePackUnit,
                    goodsInfo.middlePackNum,
                    goodsInfo.smallPackUnit,
                    goodsInfo.smallPackNum,

                    function (err, id) {
                        db.endConnection(connect);
                        callback(err, id);
                    }
                );
            });
        },

        /**
         * 新增和修改商品
         * @param customerDBName
         * @param data
         * @param callback
         */
        customerAddAndUpdateGoods: function(customerDBName, data, callback) {
            logger.enter();

            var goodsId = Number(data.baseInfo.id) || NaN;
            var goodsTypeIds = data.baseInfo.goodsType.split(",");

            db.beginTrans(function (connect) {
                async.series([
                    function addGoodsInfo(done) {
                        logger.enter();
                        db.getGoodsGspType(connect,customerDBName,data.baseInfo.gspTypeId,function(err,result){
                            data.baseInfo.gspTypeId = result[0].GspTypeId;
                            db.addGoodsInfo(connect, customerDBName, goodsId, data.baseInfo, function(err, insertId){
                                if (!err && insertId) {
                                    goodsId = insertId;
                                }
                                done(err);
                            });
                        });
                    },

                    function addGoodsTypeMaps(done){
                        logger.enter();
                        db.addGoodsTypeMap(connect, customerDBName, goodsId, goodsTypeIds, function(err,results){
                            if (err) {
                                logger.error("Fail to save GoodsTypeMaps for goodsId:" + goodsId + " [" + goodsTypeIds + "]");
                                done(err);
                            } else {
                                db.clearUselessGoodsTypes(connect, customerDBName, goodsId, goodsTypeIds, function(err, result) {
                                    if(err) {
                                        logger.error("Fail to remove the useless GoodsTypes for goodsId:" + goodsId + " other than [" + goodsTypeIds + "]");
                                    }
                                    done(err);
                                });
                            }
                        });
                    },
                    //新增一个商品，设定默认的价格 limitedPrice, wholesalePrice,refRetailPrice,price1, price2, price3为0
                    function addGoodsPrice(done) {
                    logger.enter();
                    //var priceData = data.priceInfo;
                        if(underscore.isUndefined(data.baseInfo.id)) {
                            db.addGoodsPriceById(
                                connect,
                                customerDBName,
                                goodsId, 0, 0, 0, 0, 0, 0,
                                function (err) {
                                    done(err);
                                });
                        }else{
                            done(null);
                        }
                    },
                    //检查对应goodsId的商品的库存以及商品的零售价，批发价，价一，价二，价三
                    function checkGoodsPriceAndInventoryInfo(done) {
                        if (data.inventoryInfo.onSell == 1) {
                            db.getOldGoodsInventoryById(connect, customerDBName, goodsId, function (error, results) {
                                logger.ndump("results", results);
                                if (error || results.length == 0) {
                                    done('err');
                                } else {
                                    var result = results[0];
                                    logger.ndump("result.wholesalePrice", result.wholesalePrice);
                                    logger.ndump("result.wholesalePrice == 0", result.wholesalePrice == 0);
                                    logger.ndump("result.refRetailPrice", result.refRetailPrice);
                                    logger.ndump("result.refRetailPrice == 0", result.refRetailPrice == 0);
                                    logger.ndump("result.price1", result.price1);
                                    logger.ndump("result.price1 == 0", result.price1 == 0);
                                    logger.ndump("result.price2", result.price2);
                                    logger.ndump("result.price2 == 0", result.price2 == 0);
                                    logger.ndump("result.price3", result.price3);
                                    logger.ndump("result.price3 == 0", result.price3 == 0);
                                    logger.ndump("result.actualAmount", result.actualAmount);
                                    logger.ndump("result.actualAmount == 0", result.actualAmount == 0);
                                    if (result.wholesalePrice == 0 || result.refRetailPrice == 0 || result.price1 == 0 || result.price2 == 0 || result.price3 == 0 || result.actualAmount == 0) {
                                        logger.dump("出错了");
                                        done('err');
                                    } else {
                                        done(null);
                                    }
                                }
                            });
                        } else {
                            done(null);
                        }
                    },
                    //库存信息
                    function addInventoryInfo(done) {
                        logger.enter();

                        var inventoryData = data.inventoryInfo;
                        /*    "amount"  : inventoryData.amount || 0,
                         "onSell"        : inventoryData.onSell || false,*/         //库存和状态去掉
                        var goodsInventoryData = {
                            "showPlanId"    : inventoryData.showPlanId || 0,
                            "goodsBatchTime": inventoryData.goodsBatchTime,
                            "isSplit"       : inventoryData.isSplit || false,
                            "onSell"        : inventoryData.onSell
                        };

                        db.addGoodsInventoryById(connect, customerDBName, goodsId, goodsInventoryData, function(err, result){
                            if (err) {
                                logger.error("Fail to update GoodsInventory by id:" + goodsId);
                            }
                            done(err)
                        });
                    },
                    function updateNegSell(done){
                        var negSell = data.inventoryInfo.negSell;
                        db.metaUpdateGoodsNegSellById(connect,customerDBName,negSell,goodsId,function(err,result){
                            done(err,result);
                        });
                    },

                    function addGoodsGsp(done){
                        logger.enter();
                        var gspInfo = underscore.extend(data.gspInfo, data.marksInfo);
                        db.addGoodsGspById(connect, customerDBName, goodsId, gspInfo, function(err, result){
                            if (err) {
                                logger.error("Fail to update GoodsGsp by goodsId: " + goodsId);
                            }
                            done(err);
                        });
                    }

                    ////GSP信息
                    //function addGSPInfo(cb) {
                    //    logger.enter();
                    //    var gspData = data.gspInfo;
                    //    db.updateGoodsGspById(customerDBName,gspData,goodsId,function(err){
                    //        if(err) logger.error(err);
                    //        cb(err);
                    //    });
                    //},
                    //商品标志
                    //function addGoodsMark(cb) {
                    //    logger.enter();
                    //    var marksData = data.marksInfo;
                    //    db.updateGoodsMarksById(customerDBName,marksData,goodsId,function(err){
                    //        if(err) logger.error(err);
                    //        cb(err);
                    //    });
                    //}
                ], function(err) {
                    logger.enter();
                    logger.dump(err);
                    logger.ndump("err && typeof(err)==='object'" , (err && typeof(err)==='object'));
                    logger.ndump("err", err);
                    if (err && typeof(err)==='object' || err == "err") {
                        logger.error("Found ERROR, rollback Transaction");
                        db.rollbackTrans(connect, function () {
                            callback(err);
                        });
                    } else {
                        logger.trace("All SQL passed, commit transaction");
                        db.commitTrans(connect, function () {

                            callback(null, goodsId);
                        });
                    }
                });
            });
        },

        /**
         * 新增商品的基础信息
         * @param baseDate
         * @param customerDBName
         * @param callback
         */
        //addGoodsInfo: function(baseDate, customerDBName, callback){
        //    db.beginTrans(function (connect) {
        //        async.waterfall([
        //            function(cb) {
        //                db.metaNewGoodsInfo(connect, customerDBName, baseDate.goodsNo, baseDate.barcode, baseDate.commonName,
        //                    baseDate.filingNumber, baseDate.filingNumberValidDate, baseDate.producer, baseDate.spec||'', baseDate.imageUrl||'',
        //                    baseDate.areaDesc, baseDate.goodsDetails||'', baseDate.alias, baseDate.birthPlace, baseDate.measureUnit, baseDate.largePackUnit,
        //                    baseDate.largePackNum||1, baseDate.middlePackUnit, baseDate.middlePackNum||1, baseDate.smallPackUnit, baseDate.smallPackNum||1,
        //                    function (err, id) {
        //                        cb(err, id);
        //                    });
        //            },
        //            function(goodsId, cb) {
        //                var goodsTypeStr = baseDate.goodsType;
        //                var goodsTypeIds = goodsTypeStr.split(',');
        //                db.metaAddGoodsTypes(connect, customerDBName, goodsId, goodsTypeIds, function(err, results){
        //                    cb(err, results.affectedRows);
        //                });
        //            },
        //            function(goodsId, cb) {
        //                db.metaNewGoodsPrice(connect, customerDBName, goodsId, function(err, results) {
        //                    cb(err, goodsId);
        //                })
        //            },
        //            function(goodsId, cb) {
        //                db.metaNewGoodsInventory(connect, customerDBName, goodsId, function(err, results) {
        //                    cb(err, goodsId);
        //                });
        //            },
        //            function(goodsId, cb) {
        //                db.metaNewGoodsGsp(connect, customerDBName, goodsId, function(err, results) {
        //                    cb(err, goodsId);
        //                });
        //            }
        //        ], function(err, results) {
        //            logger.enter();
        //            if (err) {
        //                db.rollbackTrans(connect, function () {
        //                    callback(err);
        //                });
        //            } else {
        //                db.commitTrans(connect, function () {
        //                    callback(null, results);
        //                });
        //            }
        //        });
        //    });
        //},


        /**
         * insetShipToOrder
         *      Insert ShipInfo to Order table by orderId to get format Orderdata model
         * @param shipInfo
         * @param orderInfo
         * @returns  orderInfo new
         */
        insetShipToOrder: function (orderInfo, shipInfo) {
            logger.enter();

            var ret = [];

            for (var i=0; i<orderInfo.length; i++) {
                for(var j= 0; j<shipInfo.length; j++){
                    if(orderInfo[i].id == shipInfo[j].orderId){
                       orderInfo[i]['shipInfo'] = shipInfo[j];
                    }
                }
                ret.push(orderInfo[i]);

            }
            return ret;
        },

        getClientsSumByRegisterStatus:function(resultsArray){
            logger.enter();
            var sumsGroupByStatus={
                "sumsInCREATED":0,
                "sumsInAPPROVED":0,
                "sumsInREJECTED":0,
                "sumsInUPDATEINFO":0
            };
            for(var j=0;j<resultsArray.length;j++){
                var currentObj=resultsArray[j];
                switch(currentObj.REGISTERSTATUS){
                    case "CREATED":
                        sumsGroupByStatus.sumsInCREATED=currentObj.SUMS;
                        break;
                    case "APPROVED":
                        sumsGroupByStatus.sumsInAPPROVED=currentObj.SUMS;
                        break;
                    case "REJECTED":
                        sumsGroupByStatus.sumsInREJECTED=currentObj.SUMS;
                        break;
                    case "UPDATED":
                        sumsGroupByStatus.sumsInUPDATEINFO=currentObj.SUMS;
                        break;
                    default:
                        break;
                }

            }
            return sumsGroupByStatus;
        }
        ,
        /**
         * insetGoodsToOrder
         *      Insert GoodsInfo to Order table by orderId to get format Orderdata model
         * @param goodsInfo
         * @param orderInfo
         * @returns  orderInfo new
         */
        insetGoodsToOrder: function (orderInfo, goodsInfo) {
            logger.enter();

            var ret = [];
            if(!underscore.isEmpty(goodsInfo)){
                for (var i=0; i<orderInfo.length; i++) {
                    for(var j= 0; j<goodsInfo.length; j++){
                        if(orderInfo[i].goodsId == goodsInfo[j].goodsId){
                            orderInfo[i]['goodsInfo'] = goodsInfo[j];
                        }
                    }
                    ret.push(orderInfo[i]);
                }
            }else{
                ret=orderInfo;
            }
            return ret;
        },

        //make Paginator start
        createMessagesPaginator: function (req) {
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'Messages';

            var categoryA = {};
            var categoryB = {};
            var keywordA = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: messageFieldMapper.convertToField(req.query.caf) || "docType",
                categoryValue: req.query.cav || "%",
                categoryBField: messageFieldMapper.convertToField(req.query.cbf) || "status",
                categoryBValue: req.query.cbv || "%",
                keywordField: messageFieldMapper.convertToField(req.query.kf) || "messageBody",
                keywordValue: req.query.kv || "%",
                sortField: messageFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isNaN(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                categoryA.field = param.categoryField;
                categoryA.value = param.categoryValue;
            }
            if (!underscore.isNaN(param.categoryBValue) && !underscore.isEmpty(param.categoryBField)) {
                categoryB.field = param.categoryBField;
                categoryB.value = param.categoryBValue;
            }
            if (!underscore.isEmpty(param.keywordField) && !underscore.isEmpty(param.keywordValue) || !underscore.isEmpty(param.keywordBValue)) {
                keywordA.field = param.keywordField;
                keywordA.value = param.keywordValue;
                keywordA.tableName = tableName
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

            if (!underscore.isEmpty(categoryA)) {
                categoryList.push(categoryA);
            }
            if (!underscore.isEmpty(categoryB)) {
                categoryList.push(categoryB);
            }
            if (!underscore.isEmpty(keywordA)) {
                keywordList.push(keywordA);
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

        restoreMessagesPaginator: function (paginator) {
            var p = {};
            logger.debug(JSON.stringify(paginator.categoryList));
            p.caf = messageFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cav = paginator.categoryList[0].value;
            p.cbf = messageFieldMapper.convertToAlias(paginator.categoryList[1].field);
            p.cbv = paginator.categoryList[1].value;
            p.kf = messageFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = messageFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },

        createGoodsPaginator: function (req) {
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'GoodsInfo';

            var categoryA = {};
            var categoryB = {};
            var keywordA = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: goodsFieldMapper.convertToField(req.query.caf) || "commonName",
                categoryValue: req.query.cav || "%",
                //categoryBField: goodsFieldMapper.convertToField(req.query.cbf) || "commonName",
                //categoryBValue: Number(req.query.cbv || "0"),
                keywordField: goodsFieldMapper.convertToField(req.query.kf) || "commonName",
                keywordValue: req.query.kv || "%",
                sortField: goodsFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isNaN(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                categoryA.field = param.categoryField;
                categoryA.value = param.categoryValue;
                if(/(onSell)$/i.test(param.categoryField)) {
                    categoryA.tableName = 'GoodsInventory';
                }
            }
            if (!underscore.isNaN(param.categoryBValue) && !underscore.isEmpty(param.categoryBField)) {
                categoryB.field = param.categoryBField;
                categoryB.value = param.categoryBValue;
                if(/(onSell)$/i.test(param.categoryBField)) {
                    categoryB.tableName = 'GoodsInventory';
                }
                if(/(goodsType)$/i.test(param.categoryBField)) {
                    categoryB.value = Number(param.categoryBValue);
                }
            }
            if (!underscore.isEmpty(param.keywordField) && !underscore.isEmpty(param.keywordValue) || !underscore.isEmpty(param.keywordBValue)) {
                keywordA.field = param.keywordField;
                keywordA.value = param.keywordValue;
                keywordA.tableName = tableName
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
                if(/(price)$/i.test(param.sortField)) {
                    s.tableName = 'ClientGoodsPrice';
                }else if(/(refRetailPrice)$/i.test(param.sortField)) {
                    s.tableName = 'GoodsPrice';
                }

                if(/(commonName)/.test(param.sortField)){
                    s.tableName="";
                    s.field="CONVERT(commonName USING gb2312)";
                }
                if(/(producer)/.test(param.sortField)){
                    s.tableName="";
                    s.field="CONVERT(producer USING gb2312)";
                }
                if(/(boughtTimes)$/.test(param.sortField) || /(boughtAmount)$/.test(param.sortField)) {
                    s.tableName = 'GoodsTopBuy';
                }
            }
            if (typeof param.page == 'number') {
                p = param.page;
            }
            if (typeof param.pageSize == 'number') {
                ps = param.pageSize;
            }

            if (!underscore.isEmpty(categoryA)) {
                categoryList.push(categoryA);
            }
            if (!underscore.isEmpty(categoryB)) {
                categoryList.push(categoryB);
            }
            if (!underscore.isEmpty(keywordA)) {
                keywordList.push(keywordA);
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

        restoreGoodsPaginator: function (paginator) {
            var p = {};
            //p.cf = goodsFieldMapper.convertToAlias(paginator.categoryList[0].field);
            //p.cv = paginator.categoryList[0].value;
            p.caf = goodsFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cav = paginator.categoryList[0].value;
            /*
            p.cbf = goodsFieldMapper.convertToAlias(paginator.categoryList[1].field);
            if(/(产品类别)$/i.test(p.cbf)) {
                p.cbv = "0";
            }else{
                p.cbv = paginator.categoryList[1].value;
            }
            */
            p.kf = goodsFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = goodsFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },

        createCustomerPaginator: function (req) {
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'Client';
            var tableNameCategory = 'ClientCategory';

            var categoryA = {};
            var categoryB = {};
            var categoryC = {};
            var categoryD = {};
            var keyword = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryAField: customerFieldMapper.convertToField(req.query.caf) || "categoryName",
                categoryAValue: req.query.cav || "%",
                categoryBField: customerFieldMapper.convertToField(req.query.cbf) || "categoryName",
                categoryBValue: req.query.cbv || "%",
                categoryCField: customerFieldMapper.convertToField(req.query.ccf),
                categoryCValue: req.query.ccv,
                categoryDField: customerFieldMapper.convertToField(req.query.cdf),
                categoryDValue: req.query.cdv,
                keywordField: customerFieldMapper.convertToField(req.query.kf) || "clientName",
                keywordValue: req.query.kv || "%",
                sortField: customerFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isEmpty(param.categoryAValue) && !underscore.isEmpty(param.categoryAField)) {
                categoryA.field = param.categoryAField;
                categoryA.value = param.categoryAValue.trim();
                categoryA.tableName = tableNameCategory;
            }
            if (!underscore.isEmpty(param.categoryBValue) && !underscore.isEmpty(param.categoryBField)) {
                categoryB.field = param.categoryBField;
                categoryB.value = param.categoryBValue.trim();
                categoryB.tableName = tableNameCategory;
            }
            if (!underscore.isEmpty(param.categoryCValue) && !underscore.isEmpty(param.categoryCField)) {
                categoryC.field = param.categoryCField;
                categoryC.value = param.categoryCValue.trim() == 'true' ? 1:0;
                categoryC.tableName = tableName;
            }
            if (!underscore.isEmpty(param.categoryDValue) && !underscore.isEmpty(param.categoryDField)) {
                categoryD.field = param.categoryDField;
                categoryD.value = param.categoryDValue.trim() == 'true' ? 1:0;
                categoryD.tableName = tableName;
            }

            if (!underscore.isEmpty(param.keywordField) && !underscore.isEmpty(param.keywordValue)) {
                keyword.field = param.keywordField;
                keyword.value = param.keywordValue;
                keyword.tableName = tableName;
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
                if(/(orderTime)/.test(param.sortField)){
                    s.tableName="";
                    s.field="CONVERT(orderTime USING gb2312)";
                }
            }
            if (typeof param.page == 'number') {
                p = param.page;
            }
            if (typeof param.pageSize == 'number') {
                ps = param.pageSize;
            }

            if (!underscore.isEmpty(categoryA)) {
                categoryList.push(categoryA);
            }
            if (!underscore.isEmpty(categoryB)) {
                categoryList.push(categoryB);
            }
            if (!underscore.isEmpty(categoryC)) {
                categoryList.push(categoryC);
            }
            if (!underscore.isEmpty(categoryD)) {
                categoryList.push(categoryD);
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

        restoreCustomerPaginator: function(paginator) {
            var p = {};
            p.caf = customerFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cav = paginator.categoryList[0].value;
            p.cbf = customerFieldMapper.convertToAlias(paginator.categoryList[1].field);
            p.cbv = paginator.categoryList[1].value;
            p.ccf = paginator.categoryList[2]? customerFieldMapper.convertToAlias(paginator.categoryList[2].field):'';
            p.ccv = paginator.categoryList[2]? paginator.categoryList[2].value == 1:'';
            p.cdf = paginator.categoryList[3]? customerFieldMapper.convertToAlias(paginator.categoryList[3].field):'';
            p.cdv = paginator.categoryList[3]? paginator.categoryList[3].value ==1 :'';
            p.kf = customerFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = customerFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },

        createCustomerReturnPaginator: function(req){
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'ReturnInfo';
            var orderInfoTablename = 'OrderInfo';

            var category = {};
            var keyword = {};
            var orderIdKeyWord={};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: returnCustomerOrderFieldMapper.convertToField(req.query.cf) || "status",
                categoryValue: req.query.cv || "%",
                keywordField: returnCustomerOrderFieldMapper.convertToField(req.query.kf) || "id",
                keywordValue: req.query.kv || "%",
                sortField: returnCustomerOrderFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isEmpty(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                category.field = param.categoryField;
                category.value = param.categoryValue.trim();
                category.tableName = tableName;
            }
            if (!underscore.isEmpty(param.keywordField) && !underscore.isEmpty(param.keywordValue)) {
                keyword.field = param.keywordField;
                keyword.value = param.keywordValue;
                keyword.tableName = tableName;

                orderIdKeyWord.field = param.keywordField;
                orderIdKeyWord.value = param.keywordValue;
                orderIdKeyWord.tableName = orderInfoTablename;

                if(/(clientName)$/.test(param.keywordField)) {
                    keyword.tableName = 'Client';
                }
                if(/(id)$/.test(param.keywordField)) {
                    keyword.field = "displayReturnId";
                    keyword.value = param.keywordValue.toUpperCase();

                    orderIdKeyWord.field = "displayOrderId";
                    orderIdKeyWord.value = param.keywordValue.toUpperCase();
                }
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
                if(/(clientName)$/.test(param.sortField)) {
                    s.tableName = '';
                    s.field="CONVERT(Client.clientName USING gb2312)";
                }
                if(/(createdOn)$/.test(param.sortField)) {
                    s.tableName="";
                    s.field="CONVERT(ReturnInfo.createdOn USING gb2312)";
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
            if (!underscore.isEmpty(keyword)) {
                keywordList.push(keyword);
            }
            if (!underscore.isEmpty(orderIdKeyWord)) {
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
            return new Paginator(categoryList, keywordList, sort, page, pageSize);
        },

        restoreCustomerReturnPaginator: function(paginator){
            var p = {};
            p.cf = returnCustomerOrderFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cv = paginator.categoryList[0].value;
            p.kf = returnCustomerOrderFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = returnCustomerOrderFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            if(paginator.sort.field == "CONVERT(ReturnInfo.createdOn USING gb2312)"){
                p.sf = "申请时间"
            }
            if(paginator.sort.field == "CONVERT(Client.clientName USING gb2312)"){
                p.sf = "客户名"
            }
            return p;
        },

        getOrderPaginator: function (req) {
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'OrderInfo';

            var category = {};
            var keywordA = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: orderFieldMapper.convertToField(req.query.cf) || "status",
                categoryValue: req.query.cv || "%",
                keywordAField: orderFieldMapper.convertToField(req.query.kf) || "id",
                keywordAValue: req.query.kv || "%",
                sortField: orderFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isEmpty(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                category.field = param.categoryField;
                category.value = param.categoryValue.trim();
                if(category.value=="PAID"||category.value=="UNPAID"){
                    category.value = "CREATED";
                }
                category.tableName = tableName;
            }
            if (!underscore.isEmpty(param.keywordAField) && !underscore.isEmpty(param.keywordAValue) || !underscore.isEmpty(param.keywordBValue)) {
                keywordA.field = param.keywordAField;
                keywordA.value = param.keywordAValue;
                keywordA.tableName = tableName;
                if(/(operatorName)$/.test(param.keywordAField)) {
                    keywordA.tableName = 'Operator';
                }
                if(/(id)$/.test(param.keywordAField)) {
                    keywordA.field = "displayOrderId";
                    keywordA.value = param.keywordAValue.toUpperCase();
                }
            }

            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
                if(/(orderTime)$/.test(param.sortField)) {
                    s.tableName="";
                    s.field="CONVERT(orderTime USING gb2312)";
                }
                if(/(operatorName)$/.test(param.sortField)) {
                    s.tableName = 'Operator';
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

        restoreOrderPaginator: function (paginator) {
            var p = {};
            p.cf = orderFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cv = paginator.categoryList[0].value;
            p.kf = orderFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = orderFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        },

        //新的退货model层的方法 start
        listOrderForCustomer : function(customerDB, orderPaginator,callback){
            logger.enter();
            db.listAllOrders(customerDB, orderPaginator, function (orderInfo) {
                async.mapSeries(orderInfo,
                    function(item,mapcallback){
                        var orderStatus=item.status,
                            paymentType=item.paymentType;
                        var paymentStatus = item.paymentStatus;
                        if(orderStatus=='CREATED'){
                            item.status=paymentStatus;
                        }
                        if(orderStatus == 'FINISHED' && item.returnSize>0){
                            item.status = 'RETURNED';
                        }
                        mapcallback();
                    },
                    function(errs,resultslist){
                        if(errs){
                            logger.error(errs)
                        }
                        callback(null,orderInfo)
                    }

                );
            });
        },

        //get页面获取数据
        getReturnInfoById:function(customerDB,returnId,callback){
            var ReturnDetails=undefined;
            db.beginTrans(function(connect){
                        async.series([
                                //退货详情
                                function getReturnInfo(done){
                                    db.metaRetrieveReturnInfoCheckPending(connect,customerDB,returnId,function(err,result){
                                         if(err){
                                             done(err);
                                         }
                                         else{
                                             ReturnDetails=result;
                                             done(err,result);
                                         }
                                    });
                                },

                                // 退货单历史记录
                                function getReturnHistory(done){
                                    db.metaGetReturnInfoHistory(connect,customerDB,returnId,function(err,result){
                                        if(err){
                                            done(err);
                                        }else{
                                            done(err,formatReturnHistory(result[0],ReturnDetails));
                                        }
                                    })
                                },
                                function getOrderAndshipInfo(done){
                                    db.metaRetrieveOrderShipInfoCheckPending(connect,customerDB,returnId,function(err,result){
                                        if(err){
                                            done(err);
                                        }
                                        else{
                                            if(underscore.isEmpty(result)){
                                                done(err,result);
                                            }else{
                                                logger.debug("contract order ship Info");
                                                db.metaGetAllreturnReceiveQty(connect,customerDB,ReturnDetails[0].orderId,function(err,data){
                                                    logger.debug(JSON.stringify(data));
                                                    ReturnDetails = underscore.map(ReturnDetails,function(detail){
                                                        underscore.map(result,function(obj){
                                                            if(detail.goodsId == obj.goodsId){
                                                                underscore.map(data,function(dataItem){
                                                                    if(dataItem.goodsId == detail.goodsId){
                                                                        detail.totalReturnedQty = dataItem.totalReturnedQty;
                                                                        detail.orderStatus = obj.orderStatus;
                                                                        detail.orderTime = obj.orderTime;
                                                                        detail.shippedQuantitySum = obj.shippedQuantitySum;
                                                                        detail.shipTime = obj.shipTime;
                                                                    }
                                                                })

                                                            }
                                                        })
                                                    });
                                                    done(err,result);
                                                });
                                            }
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
                                        callback(null, resultList);
                                    });
                                }
                            })

            });


        },
        //商家审核退货 post 提交审核数据
        checkApplyReturn:function(customerDB,operatorId,returnId,replyRemark,RGMBatchData,callback){


            underscore.each(RGMBatchData,function(item){
                item.unshift(returnId);
                item.push(null);
                item.push(null);
            });

            var updateReturnInfoObj={
                replyRemark:replyRemark,
                confirmReturnCustomerId:operatorId,
                status:'APPROVED'
            };
              db.beginTrans(function(connect){
                      async.series([
                              function updateReturnInfo(done){
                                  db.metaUpdateReturnStatusWithConfirmDate(connect,customerDB,returnId,updateReturnInfoObj,function(err,result){
                                      if(err){
                                          done(err);
                                      }else{

                                           done(null,result);
                                      }
                                  });
                              },
                              function updateReturnInfoGoodsMap(done){
                                  db.metaInsertBatchRGMquantity(connect,customerDB,RGMBatchData,function(err,result){
                                     if(err){
                                         done(err);
                                     }
                                      else{
                                         done(null,result);
                                     }
  
                                  });
  
                              }
                          ],
                          function (err, resultList) {
                          if (err&&typeof(err)==="object") {
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

        /**
         * ERP同步退货单的审核结果
         * @param customerDB
         * @param returnId
         * @param operatorId
         * @param status
         * @param callback
         */
        updateApplyReturnFromErp : function(customerDB,returnId,operatorId,status,callback){

            var updateReturnInfoObj={
                replyRemark:"",
                confirmReturnCustomerId:operatorId,
                status:status
            };
            db.beginTrans(function(connect){
                async.series([

                        //更新ReturnInfo
                        function updateReturnInfo(done){
                            db.metaUpdateReturnStatusWithConfirmDate(connect,customerDB,returnId,updateReturnInfoObj,function(err,result){
                                if(err){
                                    done(err);
                                }else{
                                    done(null,result);
                                }
                            });
                        },
                        //更新ReturnDetails
                        function updataReturnDetails(done){
                            if(status == "CLOSED"){
                                done();
                            }else{
                                db.metaUpdateReturnDetailsFromErp(connect,customerDB,returnId,function(err,result){
                                    done(err,result);
                                })
                            }
                        },
                        //更新ReturnInfoGoodsMap
                        function updateReturnInfoGoodsMap(done){
                            if(status == "CLOSED"){
                                done();
                            }else{
                                db.metaUpdateApprovedReturnGoodsQty(connect,customerDB,returnId,function(err,result){
                                    if(err){done(err);
                                    } else{
                                        done(null,result);
                                    }
                                });
                            }
                        }
                    ],
                    function (err, resultList) {
                        if (err) {
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
        //商家退货收货  post 提交数据 modify 0325
        putReturnGoodsInStorage:function(customerDB,returnGoodsinStorageData,callback){
            logger.enter();
            var returnId=returnGoodsinStorageData.returnId;
            var updateReturnDetails=[];
            db.beginTrans(function(connect){
                async.series([
                        function (done){
                                var returnInfoGoodsMapBatchData=[];
                            /*   "ReturnInfo_Goods_Map(returnId,goodsId,price,approvedQuantity,returnShippedQuantity,receiveShippedQuantity)" */
                                underscore.map(returnGoodsinStorageData.goodsArr,function(item){
                                    var obj = [];
                                    obj.push(returnId,item.goodsId,item.price,item.approvedQuantity,item.returnShippedQuantity,item.receiveShippedQuantity);
                                    returnInfoGoodsMapBatchData.push(obj);
                                });
                            logger.debug("returnInfoGoodsMapBatchData="+JSON.stringify(returnInfoGoodsMapBatchData));
                            db.metaInsertBatchRGMquantity(connect,customerDB,returnInfoGoodsMapBatchData,function(err,result){
                                    if(err){
                                        done(err);
                                    }else{
                                        done(err,result);
                                    }

                                });


                        },
                        function (done){

                            //ReturnId,goodsId,batchNum,returnDeliveredQuantity,drugESC
                            //batchdata = ["goodsId_0", "batchNum_1", "currentQty_2", "OriginQty_3", "produceData_4", "validData_5", "drugESC_6", "inspectUrl_7"
                            underscore.each(returnGoodsinStorageData.goodsArr,function(shipItem){
                                underscore.each(shipItem.batchDatas,function(batchData){
                                    var updateItem = [];
                                    updateItem.push(returnId,batchData[0],batchData[1],batchData[2],batchData[6]);
                                    updateReturnDetails.push(updateItem);
                                })
                            });
                            logger.debug("updateReturnDetails="+JSON.stringify(updateReturnDetails));
                            db.metaBatchUpdateReturnDetails(connect,customerDB,updateReturnDetails,function(err,result){
                                    if(err){
                                        done(err);
                                    }else{
                                        done(err,result);
                                    }
                                });
                        },

                        function (done){
                            var updateReturnInventory=[];
                            //goodsId,returnDeliveredQuantity
                            //batchdata = ["goodsId_0", "batchNum_1", "currentQty_2", "OriginQty_3", "produceData_4", "validData_5", "drugESC_6", "inspectUrl_7"
                            underscore.each(returnGoodsinStorageData.goodsArr,function(shipItem){
                                underscore.each(shipItem.batchDatas,function(batchData){
                                    var inventoryItem = [];
                                    inventoryItem.push(batchData[0],batchData[2]);
                                    updateReturnDetails.push(inventoryItem);
                                })
                            });
                            logger.debug("updateReturnInventory="+JSON.stringify(updateReturnInventory));
                            async.mapSeries(updateReturnInventory,
                                function(item,mapCallback){
                                    db.metaBatchUpdateReturnInventorys(connect,customerDB,item[0],item[1],function(err,result){
                                     mapCallback(err,result);
                                    });
                                },
                                function(errs,results){
                                    done(errs,results);
                            });

                        },
                        function (done){
                            var updateReturnInfoObj={
                                status:'DELIVERED',
                                receiveDate:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                                receiveReturnCustomerId:returnGoodsinStorageData.operatorId,
                                returnDeliveredRemark:returnGoodsinStorageData.remark
                            };
                            logger.debug("updateReturnInfoObj="+JSON.stringify(updateReturnInfoObj));
                            db.metaUpdateReturnStatus(connect, customerDB, returnId, updateReturnInfoObj, function (err, result) {
                                if (err) {
                                    done(err);
                                }
                                else {
                                    done(err, result);
                                }
                            });
                        }
                ],function(err,resultList){
                    if (err && typeof(err) == 'object') {
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
                });
            })
        },

        //新的退货model层的方法 end
        //最新的一次退货流程修改 2016 -03 -25 start
        //商家审核退货
        checkApplyReturnItem:function(customerDB, operatorData, returnId,shipId,orderId, customerReply, goodsArr,callback){
            logger.enter();
            var updateReturnInfoObj={
                replyRemark:customerReply,
                confirmReturnCustomerId:operatorData.operatorId,
                status:'APPROVED'
            };
            var RGMBatchData=[];
            underscore.each(goodsArr,function(item){
                var tempArr=[];
                tempArr.push(returnId,item.goodsId,item.price,item.allowReturnQuantity,null,null);
                RGMBatchData.push(tempArr);
            });
            logger.debug(JSON.stringify(RGMBatchData));
            var ReturnDetailsData=[];
            //(returnId,goodsId,batchNum,approvedQuantity,drugesc)
            underscore.each(goodsArr,function(item){
                underscore.each(item.batchDatas,function(batchItem){
                    var tempArr=[];
                    tempArr.push(returnId,batchItem[0],batchItem[1],batchItem[2],batchItem[6]);
                    ReturnDetailsData.push(tempArr);
                });
            });
            db.beginTrans(function(connect){
                async.series([
                        //step0 check allowReturnQuantity
                        function(done){
                            //orderId = shipId = -1表示订单外退货，不做数量校验
                            if(orderId>0 && shipId>0){
                                db.metaGetShipReturnInfoForApplyReturn(connect,customerDB,orderId,function(err,results){
                                    var overNumLimit = false;
                                    var overGoodsLimit = false;
                                    logger.debug(JSON.stringify(results));
                                    logger.debug(JSON.stringify(goodsArr));
                                    underscore.map(results,function(checkItem){
                                        if(underscore.pluck(goodsArr,"goodsId").indexOf((checkItem.goodsId).toString())==-1&& __returnStrictly){
                                            overGoodsLimit = true;
                                            return
                                        }
                                        logger.debug("退货商品在订单范围"+"returnStrictly="+__returnStrictly);
                                        underscore.map(goodsArr,function(good){
                                            if(good.goodsId == checkItem.goodsId){
                                                if((Number(good.allowReturnQuantity) + Number(checkItem.returnShippedQuantity))>Number(checkItem.shippedQuantitySum)){
                                                    overNumLimit = true;
                                                }
                                            }
                                        })
                                    });
                                    logger.debug("overNumlimit="+overNumLimit);
                                    logger.debug("overgoodslimit="+overGoodsLimit);
                                    if(overGoodsLimit){
                                        logger.debug("退货申请品种已超过系统限制");
                                        done("退货申请品种已超过系统限制");
                                    }else if(overNumLimit){
                                        logger.debug("退货申请总数已超过发货到货总数量");
                                        done(null,"退货申请总数已超过发货到货总数量");
                                    }else{
                                        done();
                                    }
                                })
                            }else{
                                done();
                            }
                        },
                        //step1 update ReturnInfo
                        function(done){
                            db.metaUpdateReturnStatusWithConfirmDate(connect,customerDB,returnId,updateReturnInfoObj,function(err,result){
                                if(err){
                                    done(err);
                                }else{

                                    done(null,result);
                                }
                            });
                        },
                        //step2 update ReturnInfo_Goods_Map
                        function(done){
                            db.metaInsertBatchRGMquantity(connect,customerDB,RGMBatchData,function(err,result){
                                if(err){
                                    done(err);
                                }
                                else{
                                    done(null,result);
                                }
                            });
                        },
                        //step3 update ReturnInfoDetails
                        function(done){
                            db.metaUpdateReturnDetailsCheck(connect,customerDB,ReturnDetailsData,function(err,result){
                                if(err){
                                    done(err);
                                }
                                else{
                                    done(null,result);
                                }
                            });
                        }
                    ],
                    function (err, resultList) {
                        if (err) {
                            logger.debug("Rollback the transaction");
                            logger.error(JSON.stringify(err));
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

        /**
         * 获取客户资质信息（client+clientGSP）
         * @param customerDB
         * @param clientId
         * @param callback
         */
        retrieveClientQualification: function(customerDB, clientId, callback){
            logger.enter();
            db.getClientQualInfo(customerDB, clientId, function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * 获取剂型列表
         * @param customerDB
         * @param callback
         */
        getDrugsTypeList: function(customerDB, callback){
            logger.enter();
            db.selectDrugsTypeInfo(customerDB, function(err, results){
                if(err){
                    callback(err);
                }
                else{
                    callback(err, results);
                }
            });
        },

        //商家收货退货
        putReturnItemInStorage:function(customerDB,returnGoodsinStorageData,callback){
            //var operatorId=returnGoodsinStorageData.operatorId;

            var returnId=returnGoodsinStorageData.returnId;
            db.beginTrans(function(connect){
                async.series([
                    function(done){
                        var updateReturnInfoObj={
                            status:'DELIVERED',
                            receiveDate:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                            receiveReturnCustomerId:returnGoodsinStorageData.operatorId,
                            returnDeliveredRemark:returnGoodsinStorageData.returnDeliveredRemark
                        };
                        db.metaUpdateReturnStatus(connect, customerDB, returnId, updateReturnInfoObj, function (err, result) {
                            if (err) {
                                done(err);
                            }
                            else {
                                done(err, result);
                            }
                        });
                    },
                    /*   "INSERT INTO %s.ReturnInfo_Goods_Map(returnId,goodsId,approvedQuantity,returnShippedQuantity,receiveShippedQuantity)" */
                    function(done){
                        var RGMBatchData=[],goodsArr=returnGoodsinStorageData.goodsArr;
                        underscore.each(goodsArr,function(item){
                            var tempArr=[];
                            tempArr.push(returnId,item.goodsId,item.approvedQuantity,item.returnShippedQuantity,receiveShippedQuantity);
                            RGMBatchData.push(tempArr);
                        });


                        db.metaInsertBatchRGMquantity(connect,customerDB,RGMBatchData,function(err,result){
                            if(err){
                                done(err);
                            }else{
                                done(err,result);
                            }

                        });


                    },
                    function(done){
                        var ReturnDetailsData=[];
                        //(returnId,goodsId,batchNum,approvedQuantity)
                        underscore.each(goodsArr,function(item){
                            var goodsId=item.goodsId;
                            var tempArr=[];
                            underscore.each(item.batchDatas,function(batchItem){
                                tempArr.push(returnId,goodsId,batchItem[0],batchItem[1]);
                                ReturnDetailsData.push(tempArr);
                            });
                        });
                        db.metaUpdateReturnDetailsReceive(connect,customerDB,ReturnDetailsData,function(err,result){
                            if(err){
                                done(err);
                            }else{
                                done(err,result);
                            }
                        });
                    }
                ],function(err,resultList){
                    if (err && typeof(err) == 'object') {
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
                });
            })
        },
        //最新的一次退货流程修改 2016 -03 -18 end
    };

    function formatReturnHistory(historyObj,ReturnDetails){

        /*
        "   ReturnInfo.remark AS remark, " + //申请退货的时候退货单的备注
        "   ReturnInfo.replyRemark AS replyRemark, "+//商户审核退货单的时候填的备注
        "   ReturnInfo.returnDeliveredRemark AS returnDeliveredRemark, "+//商户退货收货的时候填写的备注
        "   ReturnInfo.returnShipRemark AS returnShipRemark,"+//客户退货的时候退货单的备注
            logisticsNo
        */

        ReturnDetails=ReturnDetails[0];

        //优先级顺序
        var historyArr=[];

        var applyReturnRemarkByClient=ReturnDetails.remark;

        var checkReturnRemarkByCustomer=ReturnDetails.replyRemark;

        var shipReturnRemarkByClient=ReturnDetails.returnShipRemark;


        var receiveReturnRemarkByCustomer=ReturnDetails.returnShipRemark;

        var logisticsNo=ReturnDetails.logisticsNo;


        


        var applyRemark=applyReturnRemarkByClient!=null&&applyReturnRemarkByClient!=''?(' [备注]:'+applyReturnRemarkByClient):'';
        historyArr.unshift({
            action:'提交退货申请'+applyRemark,
            date:historyObj.applyDate,
            operator:historyObj.clientName
        });

        if(!underscore.isNull(historyObj.confirmDate)){
            var remark=(checkReturnRemarkByCustomer!=null&&checkReturnRemarkByCustomer!='')?(' [备注]:'+checkReturnRemarkByCustomer) :'';
            historyArr.unshift({
                action:'商家审核退货申请' + remark,
                date:historyObj.confirmDate,
                operator:historyObj.confirmReturnCustomerName
            })
        }
        if(!underscore.isNull(historyObj.shipDate)){
            var remark=shipReturnRemarkByClient!=null&&shipReturnRemarkByClient!=''?' [备注]:'+shipReturnRemarkByClient +' [物流信息]:'+logisticsNo :'';
            historyArr.unshift({
                action:'客户发货'+remark,
                date:historyObj.shipDate,
                operator:historyObj.clientName
            })
        }
        if(!underscore.isNull(historyObj.receiveDate)){
            historyArr.unshift({
                action:'商家收货',
                date:historyObj.receiveDate,
                operator:historyObj.receiveReturnCustomerName
            })
        }

        if(!underscore.isNull(historyObj.closeDate)){
            var remark=receiveReturnRemarkByCustomer!=null&&receiveReturnRemarkByCustomer!=''? '[备注]:'+receiveReturnRemarkByCustomer : ''
            historyArr.unshift({
                action:'关闭订单'+remark ,
                date:historyObj.closeDate,
                operator:historyObj.closeReturnCustomerId!=null?historyObj.closeReturnCustomerName:historyObj.clientName
            })
        }

        return  historyArr;
    }
    return model;
};