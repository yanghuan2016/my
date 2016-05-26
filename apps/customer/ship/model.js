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
    /*
     * load project modules
     */
    var Paginator = require(__base + "/modules/paginator");
    var myPath = require(__modules_path + "/mypath");
    var FieldNameMapper = require(__base + '/modules/fieldNameMapper');
    var moment=require('moment');
    var idGen = require(__modules_path + "/idTwister");

    /*
     * init model name etc
     */
    var MODELNAME = myPath.getModelName(__dirname);
    logger.trace("Initiating model:[" + MODELNAME + "]");

    var shipFieldMapper = new FieldNameMapper({
        'id': '发货单号',
        'shipTime': '发货时间',
        'createdOn': '下单时间',
        'orderId': '订货单号',
        'isReceived': '订单状态',
        'clientName': '客户名'
    });

    //model
    var model = {

        /**
         * get ship detail by orderId
         * @param customerDB
         * @param orderId
         * @param callback
         */
        getShipInfoByOrder : function(customerDB,orderId,callback){
            db.getShipInfoByOrderId(customerDB,orderId,function(err,shipDetails){
                    callback(err,shipDetails);
            })
        },
        /**
         * get ship detail by ship Id
         * @param customerDB
         * @param shipId
         * @param callback
         */
        getShipDetailsByShipId : function(customerDB,shipId,callback){
            db.getShipDetails(customerDB,shipId,function(err,shipDetails){
                    callback(err,shipDetails);
            })
        },


        /**
         * get all ship INfo
         * @param customerDB
         * @param paginator
         * @param isReceived
         * @param data
         * @param callback
         */
        getShipInfoModel:function(customerDB,paginator,type,isReceived,data,callback){
            logger.enter();
            db.getAllShipInfo(customerDB,paginator, isReceived, function(err,ships){
                if(err){
                    callback(err);
                }else {
                    var ships = underscore.chain(ships)
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
                            shipItem.subtotal=shipItem.subtotal.toFixed(2);
                            return shipItem;
                        })
                        .value();
                    data["type"] = type;
                    data.ships = ships;
                    db.getAllShipInfo(customerDB,paginator, false, function(err2,oppositeShipInfo){
                        data["oppositeShipInfo"] = oppositeShipInfo;
                        if(err2){
                            callback(err2);
                        }else{
                            callback(null,data);
                        }
                    });
                }
            });
        },
        //新增发货单
        /**
         *
         * @param customerDB
         * @param shipInfo
         * @param operatorData
         * @param callback
         */
        newShipInfo: function (customerDB, shipInfo, operatorData, callback) {
            logger.enter();
            db.beginTrans(function (connect) {
                var clientId=shipInfo.clientId;
                // var value for next step
                var shipId = undefined;
                var orderId = shipInfo.orderId;
                var shipData = shipInfo.shipData;
                shipInfo.operatorId=operatorData.operatorId;
                var autoSwitchToDeliveredDays=0;
                var autoSwitchToDeliveredDate=null;
                //start async

                async.series([
                        //step1.1 select autoSwitchDeliveredDays;  发货时间，自动收货时间的更新
                        function getDeliveredDays(done){
                          db._getValue(customerDB,'autoReceiveDays',function(err,result){
                                if(err){
                                    done(err);
                                }else{
                                    autoSwitchToDeliveredDays=result;
                                    var now =new Date();
                                    now.setDate(now.getDate() + (Number(autoSwitchToDeliveredDays)+1));
                                    now.setHours(0);
                                    now.setMinutes(0);
                                    now.setSeconds(0);
                                    autoSwitchToDeliveredDate=now;
                                    done(err,result);
                                }
                          });
                        },
                        //step1.2 insert ship data to ShipInfo.sql;  发货信息
                        function insertShipInfo(done){
                            db.metaBatchInsertShip(connect, customerDB, shipInfo,autoSwitchToDeliveredDate,false, function (err,result) {
                                if(err){
                                    done(err);
                                }else{
                                    shipId = result.insertId;
                                    shipInfo.shipId = shipId;
                                    done(err,shipId);
                                }
                            });
                        },
                        //step1.3 a offline Task
                        function insertToTask(done){
                                var taskData={};
                                taskData.taskName = 'SCC_SHIP_RECEIVE_OVERDUE';                     // 任务名称
                                taskData.taskType = 'SHIP_RECEIVE';                                 // 任务类型
                                taskData.taskStatus = 'RUNNING';                                    // 任务状态
                                taskData.taskParam =
                                {shipId: shipId,customerDB:customerDB};                            // 任务参数
                                taskData.maxCount = 1;                                              // 最大执行数
                                taskData.customerId=operatorData.operatorId;                                     // 执行人ID,在这里表示发货人的operatorId
                                taskData.pubsubScope='OPERATOR';
                                var now=new Date(),
                                    offlineTaskExecuteTime=moment(now).add(autoSwitchToDeliveredDays,'days'),
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
                                        logger.dump('插入离线任务失败!');
                                        done(err);
                                    }else{
                                        logger.dump('插入离线任务成功!');
                                        done(err,result);
                                    }
                                });
                            }
                        ,
                        //step2.1 更新displayShipId
                        function updateDisplayShipId(done) {
                            var today = new Date();
                            var yyyymmdd = moment(today).format('YYYYMMDD');
                            shipInfo.displayShipId = idGen.getDisplayId(shipInfo.shipId, yyyymmdd, __idPrefix.ship);

                            db.metaBatchSetDisplayShipId(connect, customerDB, shipInfo, function(err, result){
                                if (err) {
                                    logger.error(err);
                                    done(err);
                                } else {
                                    logger.trace("Set ship order id: " + shipInfo.displayShipId + " successful.");
                                    done();
                                }
                            });
                        },

                        //step2.2 add ship details to ShipDetails.sql 发货详情
                        function insertShipDetails(done){
                            db.metaBatchInsertShipDetails(connect, customerDB, shipInfo, function (err,result) {
                                    if(err){
                                        done(err);
                                    }else{
                                        var lastShipDetailsId = result.insertId;
                                        done(err,lastShipDetailsId);
                                    }
                            });
                        },
                        //step3 update shippedQuantity in orderDetails  订单详情
                        function updateOrderDetailsQty(done){
                            async.mapSeries(shipData,
                                function(item,callback) {
                                    db.listOrderDetailsShippedQty(customerDB, orderId, item.goodsId, function (err, result) {
                                        //老商品不为空,更新soldPrice   result.length!=0
                                        item.totalQuantityOrder = 0;
                                        if(! underscore.isUndefined(result) ) {
                                            var currentGoodsSoldPrice=result.soldPrice;
                                            var currentGoodsShipId=shipId;
                                            item.totalQuantityOrder = result.totalQuantity;
                                            var sum = underscore.reduce(item.batchDatas, function (memo, item) {
                                                return Number(item[3]) + Number(memo);
                                            }, 0);
                                            var shippedQty = ((typeof result) == "undefined") ? 0 : result.shippedQuantity;
                                            var shippedNum = Number(shippedQty) + sum;
                                            db.metaUpdateShippedQuantity(connect, customerDB, orderId,
                                                item.goodsId, shippedNum, function (err, affectedRows) {
                                                    if (err) {
                                                        callback(err)
                                                    } else {
                                                        //new 更新小计到 表里面
                                                        var insertUpdateData = [];
                                                        if (item.batchDatas){
                                                            for (var i = 0; i < item.batchDatas.length; i++) {
                                                                var batchNum = item.batchDatas[i][0];
                                                                logger.debug('当前批次号:' + batchNum);
                                                                var singleArr = [];
                                                                singleArr.push(Number(currentGoodsShipId));
                                                                singleArr.push(Number(item.goodsId));
                                                                singleArr.push(batchNum);
                                                                singleArr.push(Number(currentGoodsSoldPrice));
                                                                insertUpdateData.push(singleArr);
                                                            }

                                                            db.metaUpdateSoldPriceAndAmountShipDetail(connect, customerDB, insertUpdateData, function (err, results) {
                                                                if (err) {
                                                                    logger.fatal(err);
                                                                    callback(err);
                                                                }
                                                                else {
                                                                    callback(err, results);
                                                                }
                                                            })
                                                        } else {
                                                            callback(null, affectedRows);
                                                        }
                                                    }
                                                });
                                        }
                                        else{
                                            //新增商品的result必定为空
                                            var currentOrderClientId=clientId;
                                            var goodsIdArray=[];//每次只有一个商品
                                            goodsIdArray.push(Number(item.goodsId));
                                            //查询商品价格
                                            db.getClientGoodsPrice(customerDB, currentOrderClientId, goodsIdArray, function(err, results) {
                                                logger.ndump("results", results);
                                                var currentGoodsPrice=results[0]['price'];
                                                //new 更新小计 到ShipDetails

                                                //new 更新小计到 表里面
                                                var insertUpdateData=[];
                                                for(var i=0;i<item.batchDatas.length;i++){
                                                    var batchNum=item.batchDatas[i][0];
                                                    var singleArr=[];
                                                    singleArr.push(Number(shipId));
                                                    singleArr.push(Number(item.goodsId));
                                                    singleArr.push(batchNum);
                                                    singleArr.push(Number(currentGoodsPrice));
                                                    insertUpdateData.push(singleArr);
                                                }
                                                db.metaUpdateSoldPriceAndAmountShipDetail(connect,customerDB,insertUpdateData,function(err,results){
                                                    if(err){
                                                        callback(err);
                                                    }
                                                    else{
                                                        callback(err,results);
                                                    }
                                                })
                                            });
                                        }
                                    });
                                },
                                function(err,mapSeriesResult){
                                    if(err){logger.error(err)};
                                    logger.debug(mapSeriesResult);
                                    done(err,mapSeriesResult);
                                })
                        },
                        //step4  update status in OrderInfo   订单状态
                        function updateOrderStatus(done){
                            logger.enter();
                            db.getOrderInfo(customerDB,orderId,function(orderInfo){
                                if(orderInfo.status == "FINISHED"){
                                    done();
                                }else{
                                    var status = "SHIPPED";
                                    db.metaUpdateStatus(connect,customerDB, orderId, status,"", function (err,result) {
                                        if(err){
                                            done(err)
                                        }else{
                                            done(err,result)
                                        }
                                    })
                                }
                            })
                        },
                        //step5  add order history in OrderHistory  订单历史
                        function newOrderHistory(done){
                            var orderHistoryData = {};
                            // 当operator是客户时取 clientId, 否则取customerID
                            orderHistoryData.clientId = operatorData.clientId || operatorData.customerId;
                            orderHistoryData.operatorId = operatorData.operatorId;
                            orderHistoryData.orderId = orderId;
                            orderHistoryData.action = "SHIP";
                            orderHistoryData.shipId = shipId;
                            orderHistoryData.remark = shipInfo.remark;
                            db.metaNewOrderHistory(connect,customerDB, orderHistoryData, function (err,success) {
                                if(err){
                                    done(err)
                                }else{
                                    done(err,success)
                                }
                            });
                        },
                        //step6  update goods inventroy 商品库存变化
                        function updategoodsInventory(done){
                            //[{"goodsId":"771","batchDatas":[["baa","2016-03-14","2016-03-30","batchQty","121","/static/upload/0.7995977653190494.jpg","1","1"]]}]
                            var updateArr = [];
                            underscore.map(shipData,function(shipItem){
                                var tempObj = {};
                                tempObj.goodsId=shipItem.goodsId;
                                tempObj.totalQuantityOrder = Number(shipItem.totalQuantityOrder);
                                var shipNum = underscore.reduce(shipItem.batchDatas,function(memo,item){
                                    return memo + Number(item[3])
                                },0);
                                tempObj.shippedNum=shipNum;
                                updateArr.push(tempObj);
                            });
                            logger.debug(JSON.stringify(updateArr));
                            async.mapSeries(updateArr,
                                function (updateItem, mapCallback) {
                                    db.metaUpdateShippedLockedInventory(connect, customerDB, updateItem.goodsId, updateItem.shippedNum, updateItem.totalQuantityOrder, function (err, results) {
                                        mapCallback(err, results);
                                    })
                                },
                                function(errs,resultList){
                                    done(errs,resultList);
                                }
                            );
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
                                //final callback result:shipId
                                callback(null,shipId);
                            });
                        }
                    }
                )
            });

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
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: shipFieldMapper.convertToField(req.query.cf) || "isReceived",
                categoryValue: req.query.cv || "%",
                keywordField: shipFieldMapper.convertToField(req.query.kf) || "id",
                keywordValue: req.query.kv || "%",
                sortField: shipFieldMapper.convertToField(req.query.sf) || "shipTime",
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
                if (/(clientName)$/.test(param.keywordField)) {
                    keyword.tableName = 'Client';
                }
                if(/(id)$/.test(param.keywordField)) {
                    keyword.field = "displayShipId";
                    keyword.value = param.keywordValue.toUpperCase();
                }
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;

                if (/(orderTime)$/.test(param.sortField)) {
                    s.tableName = "";
                    s.field = "CONVERT(OrderInfo.orderTime USING gb2312)";
                }
                if (/(createdOn)$/.test(param.sortField)) {
                    s.tableName = 'OrderInfo';
                }
                if (/(clientName)$/.test(param.sortField)) {
                    s.tableName = 'Client';
                }
                if (/(status)$/.test(param.sortField)) {
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
            p.kf = shipFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = shipFieldMapper.convertToAlias(paginator.sort.field);
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
        }
    };
    return model;
};