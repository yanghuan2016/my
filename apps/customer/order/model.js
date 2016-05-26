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
 * 商品model
 * --------------------------------------------------------------
 * 2015-10-30	hc-romens@issue#267  created
 *
 */

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
    /*
     * load project modules
     */
    var myPath = require(__modules_path + "/mypath");

    /*
     * init model name etc
     */
    var MODELNAME = myPath.getModelName(__dirname);
    logger.trace("Initiating model:[" + MODELNAME + "]");
    var Paginator = require(__base + '/modules/paginator');
    var ApiRobot = require(__base + "/modules/apiRobot");
    var apiModule = require(__base + "/apps/api/apiModule")();
    //model
    var model = {
        /**
         * 将客户erp发送过来的订单
         * @param session
         * @param postData
         * @param callback
         */
        saveOrderToBuyerOrderTable:function(session,postData,callback){



        },
        /**
         * 拒收单列表
         * @param customerDB
         * @param operatorType
         * @param paginator
         * @param data
         * @param callback
         */
        getRefuseList: function(customerDB,operatorType,paginator,data,callback){
            logger.enter();
            db.listAllRefuseInfo(customerDB,operatorType,paginator,function(err,refuseDatas){
                if(err){
                   callback(err);
                }else{
                    var filterQuantity="";
                    if(type=='receive'){
                        filterQuantity='rejectQuantity';
                        refuseDatas=underscore.filter(refuseDatas,function(item){
                            return item.rejectQuantity!=0;
                        })
                    }else{
                        filterQuantity='rejectReceiveQuantity';
                        refuseDatas=underscore.filter(refuseDatas,function(item){
                            return item.rejectReceiveQuantity!=0;
                        })
                    }
                    refuseDatas = underscore.chain(refuseDatas)
                        .groupBy(function (item) {
                            return item.refuseId;
                        })
                        .map(function (item) {
                            // item is an array
                            var temp = item[0];
                            temp.countBatch = item.length;
                            temp.quantity = underscore(item).reduce(function (memo, item) {
                                return memo + item[filterQuantity];
                            }, 0);

                            temp.subtotal = underscore(item).reduce(function (memo, item) {
                                return memo + Number(item[filterQuantity])*Number(item.soldPrice);
                            }, 0);

                            temp.subtotal=temp.subtotal.toFixed(2);
                            return temp;
                        })
                        .value();
                    data.refuseList = refuseDatas;
                    data.type = type;
                    db.listAllRefuseInfo(customerDB, 'SHIPPED', paginator, function(err2,oppositerefuseDatas){
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
         * 获取拒收单详情
         * @param customerDB
         * @param refuseId
         * @param callback
         */
        getRefuseDetailById:function(customerDB,refuseId,callback){
            logger.enter();
            db.listRefuseDetailsById(customerDB,refuseId,function(err,refuseDetails){
                callback(err,refuseDetails);
            });
        },


        //客户拒收的商品发回来 商户执行拒收入库操作
        updateRefuseData:function(customerDB,operatorData,data,callback){
            db.beginTrans(function (connect) {
                // var value for next step
                var rejectId = data.rejectId;
                var orderId = data.orderId;
                var remark = data.remark;
                //start async
                async.series([
                        //step1 update returnInfo data to ReturnInfo.sql;
                        function updateRejectedInfo(done){
                            var updateData={isReceived:"1",receivedRemark:remark,status:'FINISHED'};
                            db.metaUpdateRejectStatus(connect,customerDB,updateData,rejectId,function(err,affectedRows){
                                if(err){
                                    done(err);
                                }else{
                                    done(err,affectedRows);
                                }
                            });
                        },
                        //step2 update reject details to ReturnDetails.sql
                        function updateDeliveredRejectDetails(done){
                            var deliverdItems = data.deliveredItems;
                            async.mapSeries(
                                deliverdItems,
                                function(item,mapcallback) {
                                    logger.enter();
                                    //"INSERT INTO %s.RejectDetails (rejectId,goodsId,batchNum,rejectReceiveQuantity,rejectedDrugESC,rejectReceiveQuantitySum) "
                                    var metaUpdateData = item.batchDatas;
                                    db.metaUpdateRejectDetails(connect,customerDB,metaUpdateData,function(err,results){
                                        if(err){
                                            logger.error(err);
                                            mapcallback(err);
                                        }else{
                                            mapcallback(err,results.affectedRows);
                                        }
                                    });
                                },
                                function(err,results){
                                    if(err){
                                        logger.error(err);
                                        done(err);
                                    }else{
                                        logger.debug(JSON.stringify(results));
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
                            orderHistoryData.action = "RECEIVE-REJECT";
                            orderHistoryData.rejectId = rejectId;
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
                        if (err) {
                            logger.debug("Rollback the transaction");
                            db.rollbackTrans(connect, function (transErr) {
                                callback(err);
                            });
                        } else {
                            logger.debug("Commit the transaction");
                            db.commitTrans(connect, function () {
                                //final callback result:rejectId
                                callback(null,rejectId);
                            });
                        }
                    }
                )
            });

        }
        ,

        //scc关闭订单通知到ERP
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
            data.msgType= "ORDER_CLOSE_TO_SELLER";
            apiModule[data.msgType](data,function(err,results){
                if(err){logger.error(err);}
                logger.debug(JSON.stringify(results));
            });
            if(__sccMode == "SM") {
                logger.debug("CURRENT IN SM MODE ORDER CLOSE NOT SEND TO BUYER")
            }else {
                //订单关闭数据同步到采购方ERP,
                data.customerId = session.operator.customerId;
                data.msgType = "ORDER_CLOSE_TO_BUYER";
                apiModule[data.msgType](data, function (err, results) {
                    if (err) {
                        logger.error(err);
                    }
                    logger.debug(JSON.stringify(results));
                });
            }
            callback(null,"ORDER CLOSED TO ERP");
        },


        createPurePaginator: function(req){
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page =  Number(req.query.p) || 1;
            var pageSize = Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10;
            //pageSize=
            return new Paginator(categoryList, keywordList, sort, page, pageSize);
        },

        restorePurePaginator:function(paginator){
            var p = {};
            p.caf = '';
            p.cav = '';
            p.cbf = '';
            p.cbv = '';
            p.kf =  '';
            p.kv =  '';
            p.sf =  '';
            p.sv =  '';
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        }
    };

    return model;
}
