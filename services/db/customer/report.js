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

    /**
     * system service handles
     */
    var logger = global.__logService;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");
    var moment = require("moment");
    /**
     * SQL for customer DB, abbr. SQL_CT_***
     */
    var SQL_CT_REPORT_ORDERS =
        "SELECT OrderInfo.id AS orderId," +
        "       DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i') AS orderTime," +
        "       GoodsInfo.goodsNo AS goodsNo," +
        "       GoodsInfo.commonName AS commonName," +
        "       GoodsInfo.spec AS spec," +
        "       GoodsInfo.producer AS producer," +
        "       GoodsInfo.measureUnit AS unit," +
        "       OrderDetails.soldPrice AS price," +
        "       OrderDetails.quantity AS quantity," +
        "       OrderDetails.amount AS amount " +
        "  FROM %s.GoodsInfo, %s.OrderInfo, %s.OrderDetails " +
        " WHERE OrderInfo.id=OrderDetails.orderId AND " +
        "       OrderDetails.goodsId=GoodsInfo.id " +
        "ORDER BY orderTime;";
    var SQL_CT_REPORT_SHIPS =
        "SELECT ShipInfo.id AS shipId," +
        "       DATE_FORMAT(ShipInfo.shipDate, '%%Y-%%m-%%d %%H:%%i') AS shipDate," +
        "       ShipInfo.orderId AS orderId," +
        "       Client.clientName AS clientName," +
        "       GoodsInfo.goodsNo AS goodsNo," +
        "       GoodsInfo.commonName AS commonName," +
        "       GoodsInfo.spec AS spec, " +
        "       GoodsInfo.producer AS producer," +
        "       GoodsInfo.measureUnit AS unit, " +
        "       OrderDetails.quantity AS orderQty, " +
        "       ShipDetails.quantity AS shipQty," +
        "       ShipInfo.shipDescription AS description," +
        "       ShipInfo.senderName AS sender," +
        "       ShipInfo.logisticsNo AS logisticsNo," +
        "       ShipInfo.isReceived AS isReceived," +
        "       ShipInfo.receiverName AS receiver " +
        "       FROM %s.ShipInfo, %s.GoodsInfo, %s.ShipDetails, %s.OrderDetails, %s.OrderInfo, %s.Client " +
        "       WHERE ShipInfo.id=ShipDetails.shipId AND " +
        "       GoodsInfo.id=ShipDetails.goodsId AND " +
        "       ShipInfo.orderId=OrderDetails.orderId AND " +
        "       OrderInfo.clientId=Client.id AND " +
        "       OrderInfo.id=ShipInfo.orderId " +
        "ORDER BY shipId;";
    var SQL_CT_REPORT_RETURNS =
        "SELECT ReturnInfo.id AS returnId," +
        "       DATE_FORMAT(ReturnInfo.createdOn, '%%Y-%%m-%%d %%H:%%i') AS applyDate," +
        "       CASE" +
        "           WHEN ReturnInfo.status='CREATED' THEN '申请退货中' " +
        "           WHEN ReturnInfo.status='APPROVED' THEN '已批准退货' " +
        "           WHEN ReturnInfo.status='REJECTED' THEN '退货申请被拒绝' " +
        "           WHEN ReturnInfo.status='SHIPPED' THEN '退货已发货' " +
        "           WHEN ReturnInfo.status='DELIVERED' THEN '退货已收货' " +
        "           ELSE '已关闭' " +
        "       END," +
        "       DATE_FORMAT(ReturnInfo.confirmDate, '%%Y-%%m-%%d %%H:%%i') AS confirmDate," +
        "       ReturnInfo.orderId AS orderId," +
        "       ReturnInfo.shipId AS shipId," +
        "       Client.clientName AS clientName," +
        "       GoodsInfo.goodsNo AS goodsNo," +
        "       GoodsInfo.commonName AS commonName," +
        "       GoodsInfo.spec AS spec," +
        "       GoodsInfo.producer AS producer," +
        "       GoodsInfo.measureUnit AS unit," +
        "       ReturnDetails.quantity AS returnQty " +
        "  FROM %s.ReturnInfo, %s.ReturnDetails, %s.Client, %s.GoodsInfo, %s.OrderInfo " +
        " WHERE ReturnInfo.id=ReturnDetails.returnId AND " +
        "       ReturnInfo.orderId = OrderInfo.id AND " +
        "       ReturnDetails.goodsId = GoodsInfo.id AND " +
        "       OrderInfo.clientId = Client.id " +
        "ORDER BY commonName, returnId;";
    var SQL_CT_REPORT_CUSTOMER_CLEARING =
        "SELECT " +
        "   ShipTime AS myDay," +
        "   SUM(OrderDetails.soldPrice * ShipDetails.quantity) " +
        "  FROM %s.ShipInfo, %s.ShipDetails, %s.OrderInfo, %s.OrderDetails " +
        " WHERE " +
        "   ShipInfo.orderId = OrderInfo.id AND " +
        "   ShipInfo.id = ShipDetails.shipId AND " +
        "   ShipDetails.goodsId = OrderDetails.goodsId " +
        "GROUP BY shipTime";

    var SQL_CT_REPORT_CLEARING_INCOME_INSERT =
        "INSERT INTO %s.ReportClearing " +
        "       (clientId, clearingDate, income)(" +
        "       SELECT OrderInfo.clientId," +
        "              DATE(ShipInfo.shipTime)," +
        "              SUM(ShipDetails.quantity*OrderDetails.soldPrice) " +
        "         FROM %s.OrderInfo,%s.ShipInfo,%s.OrderDetails,%s.ShipDetails " +
        "        WHERE OrderInfo.id=ShipInfo.orderId AND " +
        "              OrderDetails.goodsId=ShipDetails.goodsId AND " +
        "              OrderInfo.id=OrderDetails.orderId AND " +
        "              ShipInfo.id=ShipDetails.shipId AND " +
        "              (OrderInfo.status='PARTIAL-SHIPPED' OR OrderInfo.status='FULLY-SHIPPED') " +
        "     GROUP BY OrderInfo.clientId,DATE(ShipInfo.shipTime) " +
        ") ON DUPLICATE KEY UPDATE " +
        "       clientId=VALUES(clientId)," +
        "       clearingDate=VALUES(clearingDate)," +
        "       income=VALUES(income);";

    var SQL_CT_REPORT_CLEARING_REFUND_INSERT =
        "INSERT INTO %s.ReportClearing " +
        "       (clientId, clearingDate, refund)(" +
        "       SELECT OrderInfo.clientId," +
        "              DATE(ReturnInfo.updatedOn)," +
        "              SUM(ReturnDetails.quantity*OrderDetails.soldPrice) " +
        "         FROM %s.OrderInfo,%s.OrderDetails,%s.ReturnInfo,%s.ReturnDetails " +
        "        WHERE OrderInfo.id=ReturnInfo.orderId AND " +
        "              OrderDetails.goodsId=ReturnDetails.goodsId AND " +
        "              OrderInfo.id=OrderDetails.orderId AND " +
        "              ReturnInfo.status='DELIVERED' AND " +
        "              ReturnInfo.id=ReturnDetails.returnId " +
        "     GROUP BY OrderInfo.clientId,DATE(ReturnInfo.updatedOn)" +
        ") ON DUPLICATE KEY UPDATE " +
        "       clientId=VALUES(clientId)," +
        "       clearingDate=VALUES(clearingDate)," +
        "       refund=VALUES(refund);";

    var SQL_CT_REPORT_CLEARING_SELECT =
        "SELECT ReportClearing.clientId, " +
        "       Client.clientName," +
        "       ReportClearing.clearingDate," +
        "       ReportClearing.income AS income," +
        "       ReportClearing.refund AS refund," +
        "       ReportClearing.income-ReportClearing.refund AS netIncome " +
        "  FROM %s.ReportClearing, %s.Client " +
        " WHERE ReportClearing.clientId=Client.id AND " +
        "       Client.clientName LIKE '%%%s%%' AND " +
        "       ReportClearing.clearingDate>='%s' AND " +
        "       ReportClearing.clearingDate<'%s' " +
        "ORDER BY ClientId ASC, clearingDate DESC;";

    var SQL_CT_REPORT_CLEARDETAIL_SELECT =
        "SELECT ClearingDetails.id AS clearDetailId," +
        "       CASE " +
        "           WHEN ClearingDetails.clearingType='SHIP' THEN ClearingDetails.shipId " +
        "           WHEN ClearingDetails.clearingType='RETURN' THEN ClearingDetails.returnId " +
        "           WHEN ClearingDetails.clearingType='REJECT' THEN ClearingDetails.rejectId " +
        "       END AS formId, " +
        "       ClearingDetails.clearingType," +
        "       ClearingDetails.orderId," +
        "       ClearingDetails.amount," +
        "       ClearingDetails.status," +
        "       Client.clientName, " +
        "       DATE_FORMAT(ClearingDetails.createdOn,'%%Y-%%m-%%d ')  AS occurDate " +
        "  FROM %s.ClearingDetails, %s.Client " +
        " WHERE ClearingDetails.clientId=Client.id AND " +
        "       (Client.clientName LIKE '%%%s%%' OR " +
        "        ClearingDetails.orderId LIKE '%%%s%%' OR " +
        "        CASE " +
        "           WHEN ClearingDetails.clearingType='SHIP' THEN ClearingDetails.shipId " +
        "           WHEN ClearingDetails.clearingType='RETURN' THEN ClearingDetails.returnId " +
        "           WHEN ClearingDetails.clearingType='REJECT' THEN ClearingDetails.rejectId " +
        "       END LIKE '%%%s%%' ) AND " +
        "       ClearingDetails.createdOn >= '%s' AND " +
        "       ClearingDetails.createdOn < '%s' AND " +
        "       ClearingDetails.status LIKE '%s' " +
        "ORDER BY DATE(ClearingDetails.createdOn) DESC, Client.clientName ASC, ClearingDetails.status DESC;";


    var SQL_CT_SET_CLEAR_UPDATE =
        "UPDATE %s.ClearingDetails " +
        "   SET status='CLEARED' " +
        " WHERE id=%d;";
    var SQL_CT_UPDATE_REFUND_STATUS="" +
        "UPDATE %s.Refund " +
        "   SET " +
        "refundStatus='%s' " +
        "   WHERE " +
        "displayRefundId='%s'";

    logger.info("Init report.js");

    /**
     * DB Service provider
     */
    var dbService = {

        insertStatementMonthly:function(connect,dbName,insertObj,callback){
            logger.enter();
            var insertObj=parseInsertInfoNew(insertObj),
                sql="" +
                "INSERT INTO " +
                "   %s.StatementMonthly(%s)" +
                "VALUES (%s)";
            sql=sprintf(sql,dbName,insertObj.keys,insertObj.values);
            logger.sql(sql);
            connect.query(sql,function(err,results){
                 if(err){
                     logger.error(err);
                     callback(results);
                 }else{
                     callback(err,results);
                 }
            });
        },
        /**
         * 离线任务 根据clientId 以及 billMonth 去更新 期初余额  期末余额 默认情况下 期末余额是等于期初余额
         *
         * @param connect
         * @param clientId
         * @param billMonth
         * @param lastUltimateAmount
         * @param creditChange
         * @param callback
         */
        updateClientOriginAmountAndUltimateMount:function(connect,dbName,clientId,lastUltimateAmount,currentUltimateAmount,callback){
            logger.enter();
            var sql="" +
                "UPDATE %s.StatementMonthly " +
                "   SET ultimateAmount=%f,originAmount=%f,isChargeOff=1 " +
                "WHERE " +
                "   clientId=%d " +
                "AND " +
                "   billMonth=DATE_FORMAT(NOW(),'%%Y-%%m-%%d');";
            sql=sprintf(sql,dbName,currentUltimateAmount,lastUltimateAmount,clientId);
            logger.sql(sql);
            connect.query(sql,function(err,results){
                    if(err){
                        logger.error(err);
                        callback(err);
                    }else{
                        callback(err,results);
                    }
            });
        },
        getCurrentClientReceivableAndRelatedData:function(connect,dbName,clientId,callback){
            logger.enter();
            var sql="" +
                "SELECT " +
                "   receivableAmount, " +
                "   redflushAmount, " +
                "   clearAmount " +
                "FROM %s.StatementMonthly " +
                "   WHERE " +
                "clientId=%d " +
                "   AND " +
                "billMonth=DATE_FORMAT(now(),'%%Y-%%m-%%d')";
            sql=sprintf(sql,dbName,clientId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,result[0]);
                }
            });
        },
        /**
         * 通过clientId 获取当前授信额度  上期期末余额 以及  当前周期的 额度变化
         * @param connect
         * @param dbName
         * @param clientId
         * @param callback
         */
        getRelatedData:function(connect,dbName,clientId,billMonth,callback){
            logger.enter();
            var sql=" SELECT   " +
                "(SELECT credits FROM %s.ClientFinance WHERE clientId=%d) AS credits ," +
                "" +
                "IFNULL( " +
                "(SELECT ultimateAmount FROM %s.StatementMonthly " +
                "   WHERE clientId=%d AND billMonth<DATE_FORMAT(%s ,'%%Y-%%m-%%d')  " +
                "order by createdOn DESC  limit 0,1)  ,0) as ultimateAmount ," +
                "" +
                "IFNULL((SELECT oldCredit FROM %s.ClientCreditHistory " +
                "   WHERE clientId=%d  " +
                "AND" +
                "   createdOn<now() and createdOn>date_sub(%s, interval 1 month) " +
                "order by createdOn  limit 0, 1),0) as oldCredit," +
                "" +
                "IFNULL((SELECT currentCredit FROM %s.ClientCreditHistory " +
                "   WHERE clientId=%d " +
                "AND " +
                "   createdOn<now() and createdOn>date_sub(%s, interval 1 month)  " +
                "order by createdOn DESC  limit 0, 1),0) as newCredit   " +
                "from dual;";
            sql=sprintf(sql,dbName,clientId,dbName,clientId,billMonth,dbName,clientId,billMonth,dbName,clientId,billMonth);
            logger.sql(sql);
            connect.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results);
                }

            });
        },
        /**
         *  获取所有客户这个月的账单
         * @param connect
         * @param dbName
         * @param callback
         * @constructor
         */
        RetriveAllClientOnThisMonth:function(dbName,callback){
            logger.enter();
            var sql="SELECT id,clientId,DATE_FORMAT(billMonth,'%%Y-%%m-%%d') AS billMonth, "+
                "isChargeOff FROM %s.StatementMonthly " +
                "WHERE billMonth=DATE_FORMAT(NOW(),'%%Y-%%m-%%d') " +
                "AND isChargeOff=0";
            sql=sprintf(sql,dbName);
            logger.sql(sql);
            __mysql.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },
        /**
         * 过滤出商户中 这个月没有交易的授信客户
         * @param dbName
         * @param callback
         */
        getAllCreditClientsWithoutTradeInCurrentCycle:function(dbName,callback){
            logger.enter();
            var sql="" +
                "SELECT " +
                "   Client.id AS clientId,billMonth " +
                "FROM " +
                "   %s.Client LEFT JOIN %s.StatementMonthly " +
                "ON Client.id=StatementMonthly.clientId" +
                "   AND " +
                "billMonth=DATE_FORMAT(NOW(),'%%Y-%%m-%%d') " +
                "" +
                "   WHERE " +
                "billMonth is NULL " +
                "   AND " +
                "Client.paymentType='CREDIT' " ;
            sql=sprintf(sql,dbName,dbName);
            logger.sql(sql);
            __mysql.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    if(results.length==0){
                        logger.dump('所有客户这个月都有交易');
                    }
                    callback(err,results);
                }
            });

        },
        /**
         * Deprecated  更新字段 合并到
         * updateClientOriginAmountAndUltimateMount方法里面
         * 每月25号将StatementMonthly字段 isChargeOff转换
         * @param connect
         * @param dbName
         */
        switchStatementMonthlyToCharge:function(connect,dbName,clientId,callback){
            logger.enter();
            var sql="" +
                "UPDATE %s.StatementMonthly set isChargeOff=1 " +
                "WHERE " +
                "   DATE_FORMAT(NOW(),%%Y-%%m-%%d)=billMonth " +
                "AND isChargeOff=0  " +
                "AND clientId=%d";
            sql=sprintf(sql,dbName,clientId);
            logger.sql(sql);
            connect.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,results);
                }
            });
        },

        /**
         * 获取退款单执行详情所需要的数据
         * @param dbName
         * @param paginator
         * @param callback
         */
        listRefundExecution: function(dbName, paginator, queryObj, callback){
            logger.enter();

            var SQL_REFUND_EXECUTION_SELECT = "SELECT " +
                " Refund.id, " +
                " Refund.orderId," +
                " Refund.displayRefundId," +
                " Refund.displayReturnId, " +
                " Refund.displayOrderId, " +
                " Client.clientName, " +
                " Refund.refundReason, " +
                " Refund.verifiedAmount, " +
                " Refund.refundStatus, " +
                " DATE_FORMAT(Refund.approveTime,'%%Y-%%m-%%d %%H:%%i:%%s ') AS approveTime, " +
                " DATE_FORMAT(Refund.updatedOn,'%%Y-%%m-%%d %%H:%%i:%%s ') AS updatedOn, " +
                " DATE_FORMAT(Refund.createdOn,'%%Y-%%m-%%d %%H:%%i:%%s ') AS createdOn " +
                " FROM %s.Refund, %s.Client " +
                " %s " +              // where clause
                " %s " +              // sort by clause
                " %s;";               // limit clause

            var whereStr = paginator.where(sprintf(" Refund.clientId=Client.id " +
                " AND refundStatus IN ('APPROVED','EXECUTED','SUCCESS','FAILED') " +
                " AND refundType='REFUND' "));

            if(queryObj.startDate!=''&&queryObj.endDate!='') {
                whereStr += sprintf(" AND (Refund.approveTime BETWEEN '%s' AND '%s') ", queryObj.startDate, queryObj.endDate);
            }
            if(queryObj.startDate!=''&&queryObj.endDate==''){

                whereStr += sprintf(" AND (Refund.approveTime >= '%s') ", queryObj.startDate);
            }
            if(queryObj.startDate==''&&queryObj.endDate!=''){
                whereStr += sprintf(" AND (Refund.approveTime <= '%s') ", queryObj.endDate);
            }
            if(queryObj.refundType != 'ALL'){
                whereStr +=sprintf(" AND Refund.refundType='%s' ", queryObj.refundType);
            }
            if(queryObj.refundReason != 'ALL'){
                whereStr +=sprintf(" AND Refund.refundReason='%s' ", queryObj.refundReason);
            }
            if(queryObj.refundStatus != 'ALL'){
                whereStr +=sprintf(" AND Refund.refundStatus='%s' ", queryObj.refundStatus);
            }
            if(!underscore.isEmpty(queryObj.keyWord)){
                whereStr +=sprintf(" AND Refund.displayReturnId LIKE '%%%s%%' ", String(queryObj.keyWord).toLocaleLowerCase());
            }

            var sql = sprintf(SQL_REFUND_EXECUTION_SELECT,
                dbName, dbName,
                whereStr,
                ' order by Refund.updatedOn desc ',
                paginator.limit()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select refund exectution details="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        /**
         * 获取的退款统计信息
         * @param dbName
         * @param paginator
         * @param callback
         */
        getRefundStatisticsInfo: function(dbName, refundStatus, callback) {
            logger.enter();
            var  SQL_SELECT_REFUND_STATISTICS =  "SELECT COUNT(*) AS count, SUM(verifiedAmount) AS total FROM %s.Refund WHERE refundStatus='%s';";
            var sql = sprintf(SQL_SELECT_REFUND_STATISTICS, dbName, refundStatus);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    callback(null, results);
                }
            });
        },

        /**
         * 增添退款执行信息
         * @param connect
         * @param customerDB
         * @param execData
         * @param callback
         */
        addRefundExecutionInfo: function(connect, customerDB, execData, callback){
            logger.enter();
            var newItem=parseInsertInfoNew(execData);
            var  SQL_INSERT_REFUND_STATISTICS =  "INSERT INTO %s.RefundExecution( %s ) VALUES( %s ) ;";
            var sql = sprintf(SQL_INSERT_REFUND_STATISTICS, customerDB, newItem.keys,newItem.values);
            logger.sql(sql);
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    callback(null, results);
                }
            });
        },

        /**
         * 更新退款信息
         * @param connect
         * @param customerDB
         * @param refundId
         * @param refData
         * @param callback
         */
        updateRefundInfo: function(connect, customerDB, refundId, refData, callback) {
            logger.enter();
            var  SQL_UPDATE_REFUND_INFO =  "UPDATE " +
                " %s.Refund " +
                " SET refundStatus='%s', refundExecutionId=%s, payWaterbillNo='%s' " +
                " WHERE id=%s; ";
            var sql = sprintf(SQL_UPDATE_REFUND_INFO,
                customerDB,
                refData.refundStatus, refData.refundExecutionId, refData.payWaterbillNo, refundId);
            logger.sql(sql);
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    callback(null, results);
                }
            });
        },

        /**
         * 客服确认金额的时候,写入历史表,add操作
         * 财务人员审核的时候 写入历史表,同样的操作
         * @param dbName
         * @param refundId
         * @param updateObj
         * @param callback
         */

        insertVerifyRefundHistory:function(connect,dbName,refundId,updateObj,callback){
                logger.enter();
                var SQL_ITEM_ADD_REFUND_HISTORY="" +
                    "   INSERT INTO %s.RefundHistory( %s )" +
                    "VALUES(%s) ";
                var newItem=parseInsertInfoNew(updateObj);
                var insertSql=sprintf(SQL_ITEM_ADD_REFUND_HISTORY,dbName,newItem.keys,newItem.values);
                //var newSql=logger.sql(insertSql);
                connect.query(insertSql, function (err, results) {
                    logger.enter();
                    if (err) {
                        logger.error("error insert RefundHistoryCallCenter: " + err + ", " + err.stack);
                        callback(err)
                    } else{
                        logger.debug("insert RefundHistoryCallCenter affectedRows: "+results.affectedRows);
                        callback(null, results);
                    }
                });

        },
        /**
         * 更新Refund的信息
         * @param dbName
         * @param refundId 退货单Id
         * @param updateObj 更新的字段对象 [金额,备注,上传的文件链接]
         * @param callback
         */
        modifyVerifyRefund:function(connect,dbName,refundId,updateObj,callback){
            logger.enter();
            var SQL_UPDATE_REFUND="" +
                "UPDATE %s.Refund " +
                "   SET %s " +
                "WHERE id=%d";

            var updateInfo=parseUpdateInfo(updateObj);
            var sql=sprintf(SQL_UPDATE_REFUND,dbName,updateInfo,Number(refundId));
            logger.sql(sql);
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("更新Refund出错:" + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("更新Refund成功了: "+results.affectedRows);
                    callback(null, results);
                }
            });
        },
        /**
         * 获取退货单相关联的ShipInfo的数据
         * @param dbName
         * @param refundId
         * @param callback
         */
        getShipInfoRelatedToRefund:function(dbName,refundId,callback){
            logger.enter();
            var SQL_GETSHIOINFO_BY_REFUNDID="" +
                "SELECT " +
                "   ShipInfo.remark AS shipRemark, " +
                "   DATE_FORMAT(ShipInfo.createdOn ,'%%Y-%%m-%%d %%H:%%i:%%S ')   AS shipCreatedOn, " +
                "   ShipInfo.receiverId AS receiveOperatorId, " +
                " " +
                "   Operator.operatorName AS operatorName," +
                "   Operator.mobileNum AS operatorMobile " +
                " " +
                "FROM %s.ShipInfo " +
                "LEFT JOIN " +
                "   %s.Operator ON ShipInfo.receiverId= Operator.id " +
                "WHERE " +
                "   ShipInfo.displayShipId in " +
                "   (SELECT displayShipId from %s.Refund" +
                "   WHERE id= %d )" ;
            var sql=sprintf(SQL_GETSHIOINFO_BY_REFUNDID,dbName,dbName,dbName,Number(refundId));
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.dump('退货单的发货信息:'+results);
                    callback(null, results[0]);//
                }
            });



        },
        /**
         * 获取单个退货单Refund的数据,包含了订单的提交时间
         */
        getRefundDetailByRefundId:function(dbName,refundId,callback){
            logger.enter();
            var  SQL_REFUND_SELECT_BY_ID =  "" +
                "   SELECT " +
                "   Refund.id," +
                "   displayRefundId," +
                "   Refund.clientId," +
                "   mobile, " +   //  提交订单的电话号码
                "   clientName," +      //客户名称
                "   refundReason," +    //退款原因
                "   refundType," +      //退款类型
                "   refundChannel," +
                "" +
                "   OrderInfo.closeOperatorId, " +
                "   OrderInfo.total AS totalPrice, " +
                "   DATE_FORMAT(OrderInfo.closeOrderInfoDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS closeOrderInfoDate,"+
                "   Operator.username AS closeOperatorName," +
                "   Operator.mobileNum AS closeMobileNum, " +
                "" +
                "   Refund.returnId," +
                "   Refund.displayReturnId," + //退货单号
                "   ReturnInfo.receiveReturnCustomerId, " +
                "   DATE_FORMAT(ReturnInfo.updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS returnInfoUpdatedOn ," +
                "   NEWOP.OperatorName AS returnReceiveOperatorName, " +
                "   NEWOP.mobileNum AS returnReceivemobileNum, "+
                "" +
                "   Refund.paymentType AS paymentType , " +
                "   Refund.orderId," +
                "   Refund.displayOrderId," +  //订单号
                "   Refund.shipId," +
                "   displayShipId," +
                "" +
                "   refundAmount," +    //应退金额
                "   verifiedAmount," +  //确认金额
                "   refundStatus," +    //当前退款单的状态
                "   DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S ')  AS orderCreatedOn,"+ //订单生成时间
                "   DATE_FORMAT(Refund.updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S ')  AS updatedOn," +
                "   DATE_FORMAT(Refund.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S ')  AS createdOn" +  //生成时间
                "   FROM %s.Refund " +
                "LEFT JOIN %s.Client  ON Refund.ClientId=Client.id  " +
                "LEFT JOIN %s.OrderInfo ON OrderInfo.id=Refund.orderId AND OrderInfo.displayOrderId=Refund.displayOrderId " +
                "LEFT JOIN %s.Operator ON  IFNULL(OrderInfo.closeOperatorId,0)=Operator.id  " +
                "LEFT JOIN %s.ReturnInfo ON IFNULL(Refund.returnId,0) = ReturnInfo.id   " +
                "LEFT JOIN (SELECT id,username as operatorName ,mobileNum FROM %s.Operator ) AS NEWOP  ON  IFNULL(ReturnInfo.receiveReturnCustomerId,0)=NEWOP.id  " +
                "" +
                "   WHERE Refund.id =%d;";

                var sql=sprintf(SQL_REFUND_SELECT_BY_ID,dbName,dbName,dbName,dbName,dbName,dbName,Number(refundId));
                logger.sql(sql);
                __mysql.query(sql, function (err, results) {
                    logger.enter();
                    if (err) {
                        logger.error("error query: " + err + ", " + err.stack);
                        callback(err)
                    } else{
                        logger.dump('退货单详情:'+results);
                        callback(null, results[0]);//肯定只有一条
                    }
                });
        },
        /**
         * 获取退货单历史 通过特定Id
         * @param dbName
         * @param refundId
         * @param callback
         */
        getRefundHistoryByRefundId:function(dbName,refundId,callback){
            logger.enter();
            var SQL_RETRIVE_REFUNDHISTORY_BY_ID="" +
                "SELECT " +
                " id ," +
                " refundId, " +
                " refundStatus," +
                "" +
                " verifierOperatorId, " +
                " verifierName," +
                " verifierMobile, " +
                " verifiedSum," +
                "  DATE_FORMAT(verifiedTime,'%%Y-%%m-%%d %%H:%%i:%%S ') AS verifiedTime, " +
                " verificationComment, " +
                " " +
                " approverOperatorId, " +
                " approverName," +
                " approverMobile, " +
                "  DATE_FORMAT(approveTime,'%%Y-%%m-%%d %%H:%%i:%%S ') AS approveTime, " +
                " approveComment, " +
                "" +
                "rejecterOperatorId," +
                "rejecterMobile," +
                "rejecterName," +
                "  DATE_FORMAT(rejectTime,'%%Y-%%m-%%d %%H:%%i:%%S ') AS rejectTime, " +
                "rejectComment," +
                "" +
                "excuterOperatorId," +
                "excuterName," +
                "excuterMobile," +
                "  DATE_FORMAT(excuteTime,'%%Y-%%m-%%d %%H:%%i:%%S ') AS excuteTime, " +
                "" +
                " refundGatewayId, " +
                " payWaterbillNo, " +
                " refundExecutionId, " +
                " attachMentUrl, " +
                " updatedOn, " +
                " createdOn " +
                "" +
                "FROM %s.RefundHistory " +
                "   WHERE " +
                "refundId=%d " +
                " ORDER BY createdOn " +
                "DESC";
            var sql=sprintf(SQL_RETRIVE_REFUNDHISTORY_BY_ID,dbName,Number(refundId));
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.dump('退货单历史记录:'+results.length);
                    callback(null, results);
                }
            });


        },
        /**
         * 获取退款单列表页面所需要的数据
         * @param dbName
         * @param paginator
         * @param callback
         */
        listRefundData: function(dbName,queryObj,paginator,callback){
            logger.enter();
            var  SQL_REFUND_SELECT =  "" +
                "   SELECT " +
                "   Refund.id," +
                "   displayRefundId," +
                "   clientId," +
                "   clientName," +      //客户名称
                "   refundReason," +    //退款原因
                "   refundType," +      //退款类型
                "   refundChannel," +
                "" +
                "   orderId," +
                "   displayOrderId," +  //订单号
                "   shipId," +
                "   displayShipId," +
                "   returnId," +
                "   displayReturnId," + //退货单号
                "" +
                "   refundAmount," +    //应退金额
                "   verifiedAmount," +  //确认金额
                "   refundStatus," +    //当前退款单的状态
                "   verifierOperatorId," +
                "   verifierName," +
                //"   verifiedTime," +
                "   DATE_FORMAT(Refund.verifiedTime,'%%Y-%%m-%%d %%H:%%i:%%S ')  AS verifiedTime," +
                "   verificationComment," +
                "   approverOperatorId," +
                "   approverName," +
                "   approveTime," +
                "   approveComment," +
                "   " +
                "   refundGatewayId," +
                "   payWaterbillNo," +
                "   refundExecutionId," +
                "   DATE_FORMAT(Refund.updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S ')  AS updatedOn," +
                "   DATE_FORMAT(Refund.createdOn,'%%Y-%%m-%%d  %%H:%%i:%%S')  AS createdOn" +  //生成时间
                "   FROM %s.Refund,%s.Client " +
                "%s " +              // where clause
                "%s " +              // sort by clause
                "%s;";               // limit clause
            var whereStr='where Client.id = Refund.clientId   ';
            logger.debug('退款单的过滤条件: '+JSON.stringify(queryObj));
            if(queryObj.startDate!=''&&queryObj.endDate!='') {
                if(queryObj.startDate==queryObj.endDate!=''){
                    whereStr += sprintf("  AND  (Refund.createdOn BETWEEN '%s' AND '%s') ", queryObj.startDate+' 00:00:00', queryObj.endDate+' 23:59:59');
                }else{
                    whereStr += sprintf("  AND  (Refund.createdOn BETWEEN '%s' AND '%s') ", queryObj.startDate, queryObj.endDate);
                }
            }
            if(queryObj.startDate!=''&&queryObj.endDate==''){

                whereStr += sprintf("  AND  (Refund.createdOn >= '%s') ", queryObj.startDate);
            }
            if(queryObj.startDate==''&&queryObj.endDate!=''){


                whereStr += sprintf("  AND  (Refund.createdOn <= '%s') ",  queryObj.endDate);
            }

            if(queryObj.refundReason!='ALL'){
                whereStr +=sprintf(" AND refundReason LIKE '%%%s%%' ",queryObj.refundReason);
            }
            if(queryObj.refundType!='ALL'){
                whereStr += sprintf(" AND refundType LIKE '%%%s%%' ",queryObj.refundType );
            }
            if(queryObj.refundStatus!='ALL'){
                whereStr += sprintf(" AND refundStatus LIKE '%%%s%%' ",queryObj.refundStatus);
            }else{
                var currentStatus=queryObj.status;// CREATED VERIFIED
                switch (currentStatus){
                    case 'VERIFIED':
                        whereStr +=" AND refundStatus !='CREATED' ";
                        break;
                    default:
                        break;
                }
            }
            if(queryObj.keyWord!=''){
                whereStr += sprintf(" AND (displayRefundId LIKE '%%%s%%' OR displayOrderId LIKE '%%%s%%' OR clientName LIKE '%%%s%%' )",
                    queryObj.keyWord,
                    queryObj.keyWord,
                    queryObj.keyWord);
            }

            paginator.sort = {
                field:"createdOn",//排序字段
                tableName:"Refund",//排序依据表名
                value:"DESC"//排序方式ASC，DESC
            };
            var sql = sprintf(SQL_REFUND_SELECT,
                dbName,
                dbName,
                whereStr,
                paginator.orderby(),
                paginator.limit()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    callback(null, results);
                }
            });
        },

        listTradeList:function(dbName,queryObj,paginator,callback){
                logger.enter();
                var startDate=queryObj.startDate,
                    endDate=queryObj.endDate,
                    bType=queryObj.bType,
                    pType=queryObj.pType,
                    keyWord=queryObj.keyWord;

                var SQL_GET_TRADEDETAIL="" +
                    "SELECT StatementDetails.id," +
                    "   StatementDetails.paymentType," +
                    "   DATE_FORMAT(StatementDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S ')  AS createdOn," +
                    "   StatementDetails.billType, " +
                    "   StatementDetails.amount," +
                    "   StatementDetails.displayOrderId," +
                    "   StatementDetails.orderId," +
                    " " +
                    "   Client.clientName " +
                    "FROM" +
                    "   %s.StatementDetails,%s.Client " +
                    "WHERE " +
                    "   Client.id=StatementDetails.clientId " +
                    " %s " + //where
                    " %s " + //sort
                    " %s ";  //limit
                var whereStr='';
                if(startDate!=''&&endDate!='') {
                    if(startDate==endDate){
                        whereStr +=sprintf("  AND  (StatementDetails.createdOn BETWEEN '%s' AND '%s') ", startDate+' 00:00:00', endDate+' 23:59:59');
                    }else{
                        whereStr += sprintf("  AND  (StatementDetails.createdOn BETWEEN '%s' AND '%s') ", startDate, endDate);
                    }
                }
                if(startDate!=''&&endDate==''){
                    whereStr += sprintf("  AND  (StatementDetails.createdOn >= '%s') ", startDate);
                }
                if(startDate==''&&endDate!=''){
                    whereStr += sprintf("  AND  (StatementDetails.createdOn <= '%s') ",  endDate);
                }

                if(bType!='ALL'){
                    whereStr+=sprintf(" AND StatementDetails.billType LIKE '%%%s%%' ",bType);
                }
                if(pType!='ALL'){
                    whereStr+=sprintf(" AND StatementDetails.paymentType LIKE '%%%s%%'",pType);
                }
                if(keyWord!=''){
                    whereStr+=sprintf(" AND (StatementDetails.id LIKE '%%%s%%'  OR Client.clientName LIKE '%%%s%%' )",keyWord);
                }
                paginator.sort = {
                    field:"createdOn",//排序字段
                    tableName:"StatementDetails",//排序依据表名
                    value:"DESC"//排序方式ASC，DESC
                };
                var sql=sprintf(SQL_GET_TRADEDETAIL,
                    dbName,
                    dbName,
                    whereStr,
                    paginator.orderby(),
                    paginator.limit());
                logger.sql(sql);
                __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    callback(null, results);
                }
            });
        },

        /**
         * 获取特定客户的订单结款明细表
         * @param dbName
         * @param paginator
         * @param queryObj
         * @param callback
         */
        listClientStatementOrderSum: function(dbName,paginator,queryObj,callback){
            var checkoutDate = queryObj.checkoutDate;
            var certainMonth  = queryObj.certainMonth;
            var checkoutEnd= (certainMonth+"-"+checkoutDate);
            var checkoutStart =  moment(new Date(checkoutEnd)).subtract(1,'month').format("YYYY-MM-DD");


            var SQL_COD_CLEAR_DERAILS_SELECT = "SELECT " +
                " CodInfo.orderId, " +
                " CodInfo.displayOrderId, " +
                " CodInfo.clientId," +
                " CodInfo.paymentType, " +
                "" +
                " DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderCreateTime, " +
                " DATE_FORMAT(ShipInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipCreateTime, " +
                " SUM(CodInfo.shipAmount) AS shipAmount, " +
                " SUM(CodInfo.clearAmount) AS clearAmount, " +
                " SUM(CodInfo.redflushAmount) AS redflushAmount, " +
                    //" IF(SUM(CodInfo.shipAmount)!=0, SUM(CodInfo.shipAmount)-SUM(CodInfo.redflushAmount), SUM(CodInfo.receivableAmount)-SUM(CodInfo.redflushAmount)) AS waitForPayAmount " +
                " SUM(CodInfo.receivableAmount)-SUM(CodInfo.redflushAmount) AS needToPayAmount, " +  //应结款
                " SUM(CodInfo.receivableAmount) AS receivableAmount  " +
                "" +
                " FROM " +
                "" +
                " (SELECT orderId, displayOrderId, clientId, paymentType, " +
                " IF(billType='BILL_SHIP', transDate, '') AS transDate, " +
                " IF(billType='BILL_REDFLUSH', sum(amount), 0) AS redflushAmount," +
                " IF(billType='BILL_RECEIVABLE', sum(amount),0) AS receivableAmount, " +
                " IF(billType='BILL_CLEAR', sum(amount),0) AS clearAmount, " +
                " IF(billType='BILL_SHIP', sum(amount),0) AS shipAmount " +
                " FROM %s.StatementDetails " +
                //" WHERE " +
                " WHERE transDate>='%s' AND transDate<='%s'  " +
                " GROUP BY orderId, billType)" +
                " AS CodInfo  " +
                "" +
                " LEFT JOIN " +
                " %s.OrderInfo  ON  CodInfo.orderId=OrderInfo.id    " +
                " LEFT JOIN " +
                " %s.ShipInfo  On CodInfo.orderId=ShipInfo.orderId  " +
                "" +
                " %s " +                //  where clause
                " GROUP BY orderId " +
                " %s " +                //  sort by clause
                " %s;";                 //  limit clause

            var whereStr = paginator.where(sprintf(
                " CodInfo.paymentType='CREDIT' AND CodInfo.clientId =%d   ",  queryObj.clientId
            ));
            logger.debug(JSON.stringify(queryObj));

            var sql = sprintf(SQL_COD_CLEAR_DERAILS_SELECT,
                dbName,
                checkoutStart,
                checkoutEnd,
                dbName,
                dbName,
                whereStr,
                paginator.orderby(),
                paginator.limit()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select COD SUMs="+JSON.stringify(results));
                    callback(null, results);
                }
            });







        },

        /**
         * get checkout date from KV
         * @param dbName
         * @param callback
         */
        listSystemCheckoutDate : function(dbName,callback){
            logger.enter();
            var  SQL_REFUND_EXECUTION_SELECT =  "" +
                "   SELECT " +
                "   aKey, KeyAlias, aValue " +
                "   FROM %s.KVList WHERE aKey = 'checkOutDays'; " +
                ";";
            var sql = sprintf(SQL_REFUND_EXECUTION_SELECT, dbName);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select refund exectution details="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },


        listClientClearDetails: function(dbName,paginator,clientId,callback){
            logger.enter();
            var  SQL_CLIENT_CLEAR_DETAILS_SELECT =  "" +
                "   SELECT " +
                "   ClearDetails.statementMonthlyId," +
                "   DATE_FORMAT(ClearDetails.clearTime,'%%Y-%%m-%%d %%H:%%i:%%S')  AS clearTime," +
                "   ClearDetails.clearAmount," +
                "   ClearDetails.clearRemark," +
                "   Operator.operatorName," +
                "" +
                "   StatementMonthly.clientId," +
                "   StatementMonthly.status," +
                "   DATE_FORMAT(StatementMonthly.billMonth,'%%Y-%%m')  AS billMonth," +
                "   StatementMonthly.orderAmount," +
                "   StatementMonthly.orderCount," +
                "   StatementMonthly.shipAmount," +
                "   StatementMonthly.shipCount," +
                "   StatementMonthly.receivableAmount," +
                "   StatementMonthly.receivableCount," +
                "   StatementMonthly.prepayAmount," +
                "   StatementMonthly.prepayCount," +
                "   StatementMonthly.redflushAmount," +
                "   StatementMonthly.redflushCount," +
                "   StatementMonthly.refundAmount," +
                "   StatementMonthly.refundCount," +
                //"   StatementMonthly.clearAmount," +
                "   StatementMonthly.clearCount," +
                "   (StatementMonthly.receivableAmount-StatementMonthly.clearAmount) AS waitForStateAmount," +
                "   DATE_FORMAT(StatementMonthly.updatedOn,'%%Y-%%m-%%d ')  AS updatedOn," +
                "   DATE_FORMAT(StatementMonthly.createdOn,'%%Y-%%m-%%d ')  AS createdOn" +
                "   FROM %s.ClearDetails,%s.StatementMonthly,%s.Operator" +
                "%s " +              // where clause
                "%s " +              // sort by clause
                "%s;";               // limit clause



            var whereStr = paginator.where(sprintf(
                " StatementMonthly.clientId=%d " +
                " AND ClearDetails.statementMonthlyId=StatementMonthly.id AND Operator.id=ClearDetails.operatorId ",clientId));

            var sql = sprintf(SQL_CLIENT_CLEAR_DETAILS_SELECT,
                dbName,
                dbName,
                dbName,
                whereStr,
                paginator.orderby(),
                paginator.limit()
            );
            logger.sql(sql);




            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select MONTHLY statement details="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },


        /**
         * 获取特定客户的结款总表
         * @param dbName
         * @param paginator
         * @param clientId
         * @param callback
         */
        listSumClientStatements: function(dbName,paginator,clientId,callback){
            logger.enter();
            var  SQL_CLIENT_STATEMENT_SELECT =  "" +
                "   SELECT " +
                "   Client.clientName," +
                "   StatementMonthly.clientId," +
                "   ClientFinance.credits," +
                "   ClientFinance.arrearsBalance," +
                "   SUM(StatementMonthly.orderAmount) AS orderAmountSum," +
                "   SUM(StatementMonthly.orderCount) AS orderCountSum," +
                "   SUM(StatementMonthly.shipAmount) AS shipAmountSum," +
                "   SUM(StatementMonthly.shipCount) AS shipCountSum," +
                "   SUM(StatementMonthly.receivableAmount) AS receivableAmountSum," +
                "   SUM(StatementMonthly.receivableCount) AS receivableCountSum," +
                "   SUM(StatementMonthly.prepayAmount) AS prepayAmountSum," +
                "   SUM(StatementMonthly.prepayCount) AS prepayCountSum," +
                "   SUM(StatementMonthly.redflushAmount) AS redflushAmountSum," +
                "   SUM(StatementMonthly.redflushCount) AS redflushCountSum," +
                "   SUM(StatementMonthly.refundAmount) AS refundAmountSum," +
                "   SUM(StatementMonthly.refundCount) AS refundCountSum," +
                "   SUM(StatementMonthly.clearAmount) AS clearAmountSum," +
                "   SUM(StatementMonthly.clearCount) AS clearCountSum" +
                "   FROM %s.StatementMonthly,%s.Client,%s.ClientFinance " +
                "%s " +              // where clause
                "%s;";

            var whereStr = paginator.where(sprintf(
                " StatementMonthly.clientId=%d " +
                " AND StatementMonthly.clientId=Client.id" +
                " AND StatementMonthly.clientId=ClientFinance.clientId",clientId));

            var sql = sprintf(SQL_CLIENT_STATEMENT_SELECT,
                dbName,
                dbName,
                dbName,
                whereStr,
                paginator.orderby()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select CLIENT statement SUMs="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },


        /**
         * 获取特定客户的月结明细表
         * @param dbName
         * @param paginator
         * @param queryObj
         * @param callback
         */
        listCentainMonthlyStatementDetails: function(dbName,paginator,queryObj,callback){
            logger.enter();
            var  SQL_MONTHLY_STATEMENT_DETAILS_SELECT =  "" +
                "   SELECT " +
                "   StatementMonthly.id," +
                "   StatementMonthly.clientId," +
                "   StatementMonthly.status," +
                "   Client.clientName," +
                "   Client.paymentType, " +
                "   ClientFinance.credits," +
                "   ClientFinance.arrearsBalance," +
                "   DATE_FORMAT(StatementMonthly.billMonth,'%%Y-%%m')  AS billMonth," +
                "   StatementMonthly.originAmount," +
                "   StatementMonthly.ultimateAmount," +
                "   StatementMonthly.orderAmount," +
                "   StatementMonthly.orderCount," +
                "   StatementMonthly.shipAmount," +
                "   StatementMonthly.shipCount," +
                "   StatementMonthly.receivableAmount," +
                "   StatementMonthly.receivableCount," +
                "   StatementMonthly.prepayAmount," +
                "   StatementMonthly.prepayCount," +
                "   StatementMonthly.redflushAmount," +
                "   StatementMonthly.redflushCount," +
                "   StatementMonthly.refundAmount," +
                "   StatementMonthly.refundCount," +
                "   StatementMonthly.clearAmount," +
                "   StatementMonthly.clearCount," +
                "   DATE_FORMAT(StatementMonthly.updatedOn,'%%Y-%%m-%%d ')  AS updatedOn," +
                "   DATE_FORMAT(StatementMonthly.createdOn,'%%Y-%%m-%%d ')  AS createdOn" +
                "   FROM %s.StatementMonthly,%s.Client,%s.ClientFinance " +
                "%s " +              // where clause
                "%s ;" ;              // sort by clause
                             // limit clause

            logger.debug(JSON.stringify(queryObj));
            var clientId = queryObj.clientId;
            var whereStr = paginator.where(sprintf(
                " StatementMonthly.clientId=%d " +
                " AND StatementMonthly.clientId = Client.id" +
                " AND StatementMonthly.clientId=ClientFinance.clientId ",clientId));
            var certainMonth  = queryObj.certainMonth;
            logger.debug(certainMonth);
            whereStr +=sprintf(" AND DATE_FORMAT(StatementMonthly.billMonth,'%%Y-%%m ') = '%s' ",certainMonth);

            var sql = sprintf(SQL_MONTHLY_STATEMENT_DETAILS_SELECT,
                dbName,
                dbName,
                dbName,
                whereStr,
                paginator.orderby()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select MONTHLY statement details="+JSON.stringify(results));
                    callback(null, results);

                }
            });
        },

        /**
         * 获取货到付款结算数据
         * @param dbName
         * @param paginator
         * @param queryObj
         * @param callback
         */
        getCodClearDetails: function(dbName, paginator, queryObj, callback) {
            var SQL_COD_CLEAR_DERAILS_SELECT = "SELECT " +
                " CodInfo.orderId, CodInfo.displayOrderId, CodInfo.clientId, Client.clientName, CodInfo.paymentType, " +
                " MAX(transDate) AS transDate, " +
                " SUM(CodInfo.receivableAmount) AS shipAmount, " +
                " SUM(CodInfo.clearAmount) AS clearAmount, " +
                " SUM(CodInfo.redflushAmount) AS redflushAmount, " +
                //" IF(SUM(CodInfo.shipAmount)!=0, SUM(CodInfo.shipAmount)-SUM(CodInfo.redflushAmount), SUM(CodInfo.receivableAmount)-SUM(CodInfo.redflushAmount)) AS waitForPayAmount " +
                " SUM(CodInfo.receivableAmount) AS waitForPayAmount " +
                " FROM " +
                " (SELECT orderId, displayOrderId, clientId, paymentType, " +
                " IF(billType='BILL_RECEIVABLE', transDate, '') AS transDate, " +
                " IF(billType='BILL_REDFLUSH', sum(amount), 0) AS redflushAmount," +
                " IF(billType='BILL_RECEIVABLE', sum(amount),0) AS receivableAmount, " +
                " IF(billType='BILL_CLEAR', sum(amount),0) AS clearAmount, " +
                " IF(billType='BILL_SHIP', sum(amount),0) AS shipAmount " +
                " FROM %s.StatementDetails GROUP BY orderId, billType) AS CodInfo, " +
                " %s.Client " +
                " %s " +                //  where clause
                " GROUP BY orderId " +
                " %s " +                //  sort by clause
                " %s;";                 //  limit clause

            var whereStr = paginator.where(sprintf(
                " CodInfo.paymentType='COD' AND CodInfo.clientId=Client.id "
                ));

            var queryStr = queryObj.orderNoOrClientName;
            if(!underscore.isEmpty(queryStr)){
                whereStr +=sprintf(" AND CodInfo.displayOrderId LIKE '%%%s%%' OR Client.clientName LIKE '%%%s%%' ", queryStr, queryStr);
            }
            logger.debug(JSON.stringify(queryObj));

            var sql = sprintf(SQL_COD_CLEAR_DERAILS_SELECT,
                dbName, dbName,
                whereStr,
                ' order by transDate desc',
                paginator.limit()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select COD SUMs="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        getCODclearDetail: function(dbName, paginator, queryObj, callback){
            logger.enter();
            var  SQL_COD_CLEAR_SUM_SELECT =  "" +
                " SELECT " +
                " OrderInfo.id AS orderId, " +
                " OrderInfo.displayOrderId, " +
                " Client.clientName, " +
                " Client.id AS clientId, " +
                " ( SELECT " +
                " SUM(StatementDetails.amount) " +
                " From %s.StatementDetails " +
                " WHERE StatementDetails.billType='BILL_CLEAR' AND StatementDetails.orderId = OrderInfo.id ) AS clearAmount, " +
                " ( SELECT " +
                " SUM(StatementDetails.amount) " +
                " From %s.StatementDetails " +
                " WHERE StatementDetails.billType='BILL_SHIP' AND StatementDetails.orderId = OrderInfo.id ) AS shipAmount, " +
                " ( SELECT " +
                " SUM(StatementDetails.amount) " +
                " From %s.StatementDetails " +
                " WHERE StatementDetails.docType='SHIP' AND StatementDetails.orderId = OrderInfo.id ) AS amount, " +
                " (( SELECT " +
                " SUM(StatementDetails.amount) " +
                " From %s.StatementDetails " +
                " WHERE StatementDetails.billType='BILL_RECEIVABLE' AND StatementDetails.orderId = OrderInfo.id )-" +
                "( SELECT " +
                " SUM(StatementDetails.amount) " +
                " From %s.StatementDetails " +
                " WHERE StatementDetails.billType='BILL_REDFLUSH' AND StatementDetails.orderId = OrderInfo.id ))  "+
                " AS waitForPayAmount, " +
                " ( SELECT " +
                " DATE_FORMAT(StatementDetails.transDate,'%%Y-%%m-%%d ')" +
                " From %s.StatementDetails " +
                " WHERE StatementDetails.billType='BILL_SHIP' AND StatementDetails.orderId = OrderInfo.id ) AS shipTime " +
                " FROM %s.OrderInfo, %s.Client " +
                " %s " +              // where clause
                " %s " +              // sort by clause
                " %s;";               // limit clause

            var whereStr = paginator.where(sprintf(
                " OrderInfo.paymentType='COD' " +
                " AND OrderInfo.clientId=Client.id " +
                " "));

            var queryStr = queryObj.orderNoOrClientName;
            if(!underscore.isEmpty(queryStr)){
                whereStr +=sprintf(" AND OrderInfo.displayOrderId LIKE '%%%s%%' OR Client.clientName LIKE '%%%s%%' ", queryStr, queryStr);
            }
            logger.debug(JSON.stringify(queryObj));

            var sql = sprintf(SQL_COD_CLEAR_SUM_SELECT,
                dbName, dbName, dbName, dbName, dbName, dbName, dbName, dbName,
                whereStr,
                paginator.orderby(),
                paginator.limit()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select COD SUMs="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        getCODclearSum: function(dbName,paginator,queryObj,callback){
            logger.enter();
            var SQL_COD_SUM_CLEAR_SELECT="SELECT  " +
                "MAX(IF(billType='BILL_RECEIVABLE',codAmountSum,0))-Max(IF(billType='BILL_CLEAR',codAmountSum,0)) " +
                "" +
                "AS codAmountSum  " +
                "" +
                "FROM  " +
                "" +
                "(SELECT billType,SUM(StatementDetails.amount) as codAmountSum " +
                "FROM %s.StatementDetails where paymentType='COD' " +
                "GROUP BY billType) " +
                "AS TEMP;";
           var sql=sprintf(SQL_COD_SUM_CLEAR_SELECT,dbName);

            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select COD SUMs="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        /**
         * 更新货到付款结算完成信息
         * @param dbName
         * @param orderId
         * @param callback
         */
        updateCODClearFinishData: function(dbName, clearData, callback) {
            logger.enter();
            var  SQL_CT_INSERT_STATEMENTDETAILS =  "INSERT INTO " +
                " %s.StatementDetails " +
                " (clientId,orderId,displayOrderId,billType,paymentType,amount,docType) " +
                " VALUES " +
                " (%s, %s, '%s', 'BILL_CLEAR', 'COD', %s, 'CLEAR');";
            var sql = sprintf(SQL_CT_INSERT_STATEMENTDETAILS,
                dbName,
                clearData.clientId,
                clearData.orderId,
                clearData.displayOrderId,
                clearData.amount
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("insert STATEMENTDETAILS ="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },


        /**
         * 获取月度结款页面所需要的数据
         * @param dbName
         * @param paginator
         * @param queryObj
         * @param callback
         */
        listMonthlyStatementDetails: function(dbName,paginator,queryObj,callback){
            logger.enter();
            var  SQL_MONTHLY_STATEMENT_DETAILS_SELECT =  "" +
                "   SELECT " +
                "   StatementMonthly.id," +
                "   StatementMonthly.clientId," +
                "   StatementMonthly.status," +
                "   Client.clientName," +
                "   ClientFinance.credits," +
                "   ClientFinance.arrearsBalance," +
                "   DATE_FORMAT(StatementMonthly.billMonth,'%%Y-%%m')  AS billMonth," +
                "   DATE_FORMAT(StatementMonthly.billMonth,'%%Y-%%m-%%d')  AS billDate," +
                "   NOW()<date_add(billMonth, interval 1 month) && NOW()>billMonth AS isEdit ," +
                "   StatementMonthly.isChargeOff," +
                "   StatementMonthly.originAmount," +
                "   StatementMonthly.ultimateAmount,"+
                "   StatementMonthly.orderAmount," +
                "   StatementMonthly.orderCount," +
                "   StatementMonthly.shipAmount," +
                "   StatementMonthly.shipCount," +
                "   StatementMonthly.receivableAmount," +
                "   StatementMonthly.receivableCount," +
                "   StatementMonthly.prepayAmount," +
                "   StatementMonthly.prepayCount," +
                "   StatementMonthly.redflushAmount," +
                "   StatementMonthly.redflushCount," +
                "   StatementMonthly.refundAmount," +
                "   StatementMonthly.refundCount," +
                "   StatementMonthly.clearAmount," +
                "   StatementMonthly.clearCount," +
                "   DATE_FORMAT(StatementMonthly.updatedOn,'%%Y-%%m-%%d ')  AS updatedOn," +
                "   DATE_FORMAT(StatementMonthly.createdOn,'%%Y-%%m-%%d ')  AS createdOn" +
                "   FROM %s.StatementMonthly,%s.Client,%s.ClientFinance " +
                "%s " +              // where clause
                "%s " +              // sort by clause
                "%s;";               // limit clause

            var whereStr = paginator.where(sprintf(
                "StatementMonthly.clientId=Client.id " +
                "AND StatementMonthly.clientId=ClientFinance.clientId AND Client.paymentType='CREDIT'"));

            logger.debug(JSON.stringify(queryObj));
            //{"startMonth":"2016-03","endMonth":"2016-06","clientName":"1212","status":"ALL"}
            var startMonth = moment(new Date(queryObj.startMonth)).format('YYYY-MM-DD');
            var endMonth = moment(new Date(queryObj.endMonth)).format('YYYY-MM-DD');
            logger.debug(startMonth);
            logger.debug(endMonth);
            whereStr +=sprintf(" AND StatementMonthly.billMonth BETWEEN '%s' AND  '%s'",startMonth,endMonth);

            var clientName = queryObj.clientName;
            if(!underscore.isEmpty(clientName)){
                whereStr +=sprintf(" AND Client.clientName LIKE '%%%s%%' ",clientName);
            }
            var status = queryObj.status;
            if(status != "ALL"){
                whereStr +=sprintf(" AND StatementMonthly.status='%s' ",status);
            }

            paginator.sort = {
                field:"billMonth",//排序字段
                tableName:"StatementMonthly",//排序依据表名
                value:"DESC"//排序方式ASC，DESC
            };
            var sql = sprintf(SQL_MONTHLY_STATEMENT_DETAILS_SELECT,
                dbName,
                dbName,
                dbName,
                whereStr,
                paginator.orderby(),
                paginator.limit()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select MONTHLY statement details="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        /**
         * 通过退款ID获取退款信息
         * @param dbName
         * @param refundId
         * @param callback
         */
        getRefundDataById: function(dbName, refundId, callback) {
            logger.enter();
            var  SQL_CT_SELECT_REFUND =  "SELECT " +
                " clientId, paymentType, refundReason, refundType, " +
                " orderId, displayOrderId, shipId, displayShipId, " +
                " returnId, displayReturnId, refundAmount, verifiedAmount, " +
                " refundStatus, verifierOperatorId, verifierName, verifiedTime, " +
                " verificationComment, approverOperatorId, approverName, approveTime, " +
                " approveComment, refundGatewayId, payWaterbillNo, refundExecutionId " +
                " updatedOn, createdOn FROM %s.Refund WHERE id=%d;";
            var sql = sprintf(SQL_CT_SELECT_REFUND, dbName, refundId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select REFUND ="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        /**
         * 获取结款页面所需要的统计数据
         * @param dbName
         * @param paginator
         * @param queryObj
         * @param callback
         */
        listStatementSum: function(dbName,paginator,queryObj,callback){
            logger.enter();
            var  SQL_CT_STATEMENT_DETAILS_SELECT =  "" +
                "   SELECT " +
                "   SUM(orderAmount) AS orderAmountSum," +
                "   SUM(orderCount) AS orderCountSum," +
                "   SUM(shipAmount) AS shipAmountSum," +
                "   SUM(shipCount) AS shipCountSum," +
                "   SUM(receivableAmount) AS receivableAmountSum," +
                "   SUM(receivableCount) AS receivableCountSum," +
                "   SUM(prepayAmount) AS prepayAmountSum," +
                "   SUM(prepayCount) AS prepayCountSum," +
                "   SUM(redflushAmount) AS redflushAmountSum," +
                "   SUM(redflushCount) AS redflushCountSum," +
                "   SUM(refundAmount) AS refundAmountSum," +
                "   SUM(refundCount) AS refundCountSum," +
                "   SUM(clearAmount) AS clearAmountSum," +
                "   SUM(clearCount) AS clearCountSum," +
                "   COUNT(StatementMonthly.id) AS totalNum " +//总计数据条数
                "   FROM %s.StatementMonthly ,%s.Client" +
                "%s " +              // where clause
                "%s ;";             // sort by clause

            //加上isChargedOff 未出账的账单不能计入总计
            var sql = sprintf(SQL_CT_STATEMENT_DETAILS_SELECT,
                dbName,
                dbName,
                paginator.where(" Client.paymentType!='ONLINE' AND Client.id = StatementMonthly.clientId AND isChargeOff=1 "),
                paginator.orderby()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select statement sums="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        /**
         * 获取结款页面所需要的数据
         * @param dbName
         * @param paginator
         * @param callback
         */
        listStatementDetails: function(dbName,paginator,callback){
            logger.enter();
            var  SQL_CT_STATEMENT_DETAILS_SELECT =  "" +
                "   SELECT " +
                "   StatementDetails.id," +
                "   StatementDetails.clientId," +
                "   Client.clientName," +
                "   ClientFinance.credits," +
                "   ClientFinance.arrearsBalance," +
                "   StatementDetails.transDate," +
                "   StatementDetails.orderId," +
                "   StatementDetails.displayOrderId," +
                "   StatementDetails.billType," +
                "   StatementDetails.amount," +
                "   StatementDetails.docType," +
                "   StatementDetails.docId," +
                "   StatementDetails.displayDocId," +
                "   StatementDetails.creditBalance," +
                "   StatementDetails.cashBalance," +
                "   DATE_FORMAT(StatementDetails.updatedOn,'%%Y-%%m-%%d ')  AS updatedOn," +
                "   DATE_FORMAT(StatementDetails.createdOn,'%%Y-%%m-%%d ')  AS createdOn" +
                "   FROM %s.StatementDetails,%s.Client,%s.ClientFinance " +
                "%s " +              // where clause
                "%s " +              // sort by clause
                "%s;";               // limit clause

            var whereStr = paginator.where(sprintf(
                "StatementDetails.clientId=Client.id " +
                "AND StatementDetails.clientId=ClientFinance.clientId"));

            paginator.sort = {
                field:"transDate",//排序字段
                tableName:"StatementDetails",//排序依据表名
                value:"DESC"//排序方式ASC，DESC
            };

            var sql = sprintf(SQL_CT_STATEMENT_DETAILS_SELECT,
                dbName,
                dbName,
                dbName,
                whereStr,
                paginator.orderby(),
                paginator.limit()
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("select statement details="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        /**
         * 更新结款后授信额度变化
         * @param connect
         * @param dbName
         * @param updateData
         * @param callback
         */
        metaUpdateClientFinace : function(connect,dbName,updateData,callback){
            logger.enter();
            var  SQL_CT_CLIENT_FINACE_UPDATE =  "" +
                "   UPDATE %s.ClientFinance " +
                "   SET arrearsBalance=arrearsBalance + %f " +
                "   WHERE  clientId=%d ;";              // where clause
            var sql = sprintf(SQL_CT_CLIENT_FINACE_UPDATE,
                dbName,
                updateData.clearAmount,
                updateData.clientId
            );
            logger.sql(sql);
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("update CLIENT FINACE ="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        /**
         * 更新结款明细表 MONTHLY
         * @param connect
         * @param dbName
         * @param updateData
         * @param callback
         */
        metaUpdateMonthlyClearDetails: function(connect,dbName,updateData,operatorId,callback){
            logger.enter();
            var  SQL_CT_CLIENT_FINACE_UPDATE =  "" +
                "   Insert into %s.ClearDetails " +
                "   (clientId,statementMonthlyId,clearAmount,clearRemark,operatorId) " +
                "   VALUES  (%d,%d,%f,'%s',%d) ;";              // where clause
            var sql = sprintf(SQL_CT_CLIENT_FINACE_UPDATE,
                dbName,
                updateData.clientId,
                updateData.statementMonthlyId,
                updateData.clearAmount,
                updateData.clearRemark,
                operatorId
            );
            logger.sql(sql);
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("update CLIENT FINACE ="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        /**
         * 更新结款明细表COD
         * @param connect
         * @param dbName
         * @param updateData
         * @param callback
         */
        metaUpdateCODClearDetails: function(connect,dbName,updateData,callback){
            logger.enter();
            var  SQL_CT_CLIENT_FINACE_UPDATE =  "" +
                "   Insert into %s.ClearDetails " +
                "   (clientId,statementDetailsId,clearAmount,clearRemark) " +
                "   VALUES  (%d,%d,%f,'%s') ;";              // where clause
            var sql = sprintf(SQL_CT_CLIENT_FINACE_UPDATE,
                dbName,
                updateData.clientId,
                updateData.statementDetailsId,
                updateData.clearAmount,
                updateData.clearRemark
            );
            logger.sql(sql);
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("update COD CLEAR  ="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },


        /**
         * 更新结款页面所需要的数据
         * @param dbName
         * @param updateData
         * @param callback
         */
        transUpdateStatementMonthly: function(connect,dbName,updateData,callback){
            logger.enter();
            var  SQL_CT_STATEMENT_DETAILS_UPDATE =  "" +
                "   UPDATE %s.StatementMonthly " +
                "   SET status = '%s',clearAmount=clearAmount + %f, clearCount= clearCount+1, " +//结款数据
                "    receivableCount = receivableCount-1 ,ultimateAmount= ultimateAmount+ %f " +//应收数据  receivableAmount = receivableAmount - %f
                "   WHERE  id=%d;";              // where clause
            var sql = sprintf(SQL_CT_STATEMENT_DETAILS_UPDATE,
                dbName,
                updateData.status,
                updateData.clearAmount,
                updateData.clearAmount,
                updateData.statementMonthlyId
            );
            logger.sql(sql);
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.error(err);
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    logger.debug("update statement details="+JSON.stringify(results));
                    callback(null, results);
                }
            });
        },


        /**
         * 获得订单报表下载数据
         * @param customerDBName
         * @param callback
         */
        getReportOrder: function(customerDBName, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_REPORT_ORDERS, customerDBName, customerDBName, customerDBName, customerDBName, customerDBName );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * 获得发货单报表下载数据
         * @param customerDBName
         * @param callback
         */
        getReportShip: function(customerDBName, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_REPORT_SHIPS, customerDBName, customerDBName, customerDBName, customerDBName, customerDBName, customerDBName);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * 获得退货单报表下载数据
         * @param customerDBName
         * @param callback
         */
        getReportReturn: function(customerDBName, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_REPORT_RETURNS, customerDBName, customerDBName, customerDBName, customerDBName, customerDBName);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * 计算所有客户的按日结款收入
         * @param customerDBName
         * @param callback
         */
        updateClearingIncome: function(customerDBName, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_REPORT_CLEARING_INCOME_INSERT,
                customerDBName, customerDBName, customerDBName, customerDBName, customerDBName);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(err, result.affectedRows);
                }
            });
        },

        /**
         * 计算所有客户的按日结款退货款(红冲)
         * @param customerDBName
         * @param callback
         */
        updateClearingRefund: function(customerDBName, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_REPORT_CLEARING_REFUND_INSERT,
                customerDBName, customerDBName, customerDBName, customerDBName, customerDBName);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(err, result.affectedRows);
                }
            });
        },

        /**
         * 获取指定时间段内的结款明细数据
         * @param customerDBName
         * @param beginDate
         * @param endDate
         * @param clientName, 查询的客户名称，为空时表示全部客户
         * @param callback
         */
        getClearingBills: function(customerDBName, clientName, beginDate, endDate, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_REPORT_CLEARING_SELECT,
                customerDBName, customerDBName, clientName, beginDate, endDate);
            logger.sql(sql);

            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * 获取结算明细列表
         * @param customnerDBName
         * @param clientName
         * @param beginDate
         * @param endDate
         * @param status
         * @param callback
         */
        getClearingDetails: function(customerDBName, keyword, beginDate, endDate, status, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_REPORT_CLEARDETAIL_SELECT,
                customerDBName, customerDBName, keyword, keyword, keyword, beginDate, endDate, status);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(err, results);
                }
            });
        },

        /**
         * 设置结算明细为已结算
         * @param customerDBName
         * @param clearDetailId
         * @param callback
         */
        setClearDetailsCleared: function(customerDBName, clearDetailId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_SET_CLEAR_UPDATE,
                customerDBName, clearDetailId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(err, result.affectedRows);
                }
            });
        }



    };
    function parseUpdateInfo(data){
        logger.enter();
        var result = "";
        if(underscore.isEmpty(data)) {
            return result;
        }

        for(var key in data){
            result += key + "='"+data[key] +"'," ;
        }
        result = result.slice(0,-1);
        return result;
    }

    function parseInsertInfo(data){
        logger.enter();
        var result = {keys:"",values:""};
        for(var key in data){
            if(data[key]) {
                result.keys += key + "," ;
                result.values += data[key]+ ",";
            }
        }
        result.keys = result.keys.slice(0,-1);
        result.values = result.values.slice(0,-1);
        return result;
    }
    function parseInsertInfoNew(data){
        logger.enter();
        var result = {keys:"",values:""};
        for(var key in data){
            if(data[key]) {
                result.keys += key + ',' ;
                result.values +='"'+ data[key]+ '",';
            }
        }
        result.keys = result.keys.slice(0,-1);
        result.values = result.values.slice(0,-1);
        return result;
    }


    function parseInsertOnDuplicateInfo(data){
        logger.enter();
        var result = {
            keyStr:"",
            valueStr:"",
            updateStr:""};
        for(var key in data){
            if(!underscore.isUndefined(data[key])) {
                result.keyStr += key + "," ;
                result.valueStr += "'"+data[key]+ "',";
                result.updateStr += key +"=Values("+key+"),";
            }
        }
        result.keyStr = result.keyStr.slice(0,-1);
        result.valueStr = result.valueStr.slice(0,-1);
        result.updateStr = result.updateStr.slice(0,-1);
        return result;
    }

    function parseBatchInsert(keyList){
        logger.enter();
        var result = {keys:"",values:""};
        for(var i in keyList){
            result.keys += keyList[i] + "," ;
            result.values += keyList[i]+ "=VALUES("+keyList[i]+"),";

        }
        result.keys = result.keys.slice(0,-1);
        result.values = result.values.slice(0,-1);
        return result;
    }

    return dbService;
}
