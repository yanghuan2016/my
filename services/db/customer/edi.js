/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports=function(){

    /**
     * system service handles
     */
    var logger = global.__logService;
    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");
    var knex = require('knex')({client: 'mysql'});
    var moment=require('moment');
    /**
     * DB Service provider
     */
    var dbService = {


        /**
         * set app key to customer db
         * @param dbName
         * @param enterpriseId
         * @param appKey
         * @param callback
         */
        putAppKeyToDB : function(dbName,enterpriseId,appKey,callback){
            logger.enter();
            var SQL = "update %s.Customer set appKey = '%s' where id = %d ;";
            var sql = sprintf(SQL,dbName,appKey,enterpriseId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * get my supplier list from db
         * @param dbName
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getMySupplierList: function(dbName,enterpriseId,filter,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   ClientSellerInfo.enterpriseId," +
                "   ClientSellerInfo.erpCode," +
                "   ClientSellerInfo.enabled," +
                "   ClientSellerInfo.businessLicense," +
                "   ClientSellerInfo.enterpriseName," +
                "   DATE_FORMAT(ClientSellerInfo.businessLicenseValidate,'%%Y-%%m-%%d') as businessLicenseValidate, " +
                "   ClientSellerInfo.businessAddress," +
                "   ClientSellerInfo.legalRepresentative," +
                "   DATE_FORMAT(ClientSellerInfo.erpUpdateTime,'%%Y-%%m-%%d %%H:%%i:%%S') as erpUpdateTime " +
                " FROM %s.ClientSellerInfo,%s.Customer " +
                "   %s  "+//where str
                "   %s ;";//limit str
            logger.debug(JSON.stringify(filter));
            var whereStr=" WHERE Customer.businessLicense<>ClientSellerInfo.businessLicense ";
            whereStr+=sprintf(" AND Customer.id = %d ", enterpriseId);
            var pageIndex = filter.pageIndex;
            var pageSize = filter.pageSize;
            var status = filter.status;
            var keyWords = filter.keywords;
            if(Number(status) >-1){
                whereStr+=sprintf(" AND ClientSellerInfo.enabled = '%s' ", status);
            }
            whereStr+= sprintf(" AND (ClientSellerInfo.enterpriseName LIKE  '%%%s%%'  OR ClientSellerInfo.erpCode LIKE  '%%%s%%' ) ",keyWords,keyWords);

            whereStr+= sprintf(" ORDER BY ClientSellerInfo.enabled ASC");
            var limitStr=sprintf("LIMIT %d,%d",(pageIndex-1)*pageSize,pageSize);
            var sql = sprintf(SQL,dbName,__cloudDBName,whereStr,limitStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });

        },
        getSccCreated : function(dbName, enterpriseId,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') as createdOn " +
                "   FROM %s.Customer " +
                "   WHERE id = %d; ";
            var sql = sprintf(SQL,dbName,enterpriseId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * get my client list from db
         * @param dbName
         * @param enterpriseId
         * @param filter
         * @param callback
         */
        getMyClientList : function(dbName,enterpriseId,filter,callback){
           logger.enter();
            var SQL =
                "   SELECT " +
                "   ClientBuyerInfo.enterpriseId," +
                "   ClientBuyerInfo.erpCode," +
                "   ClientBuyerInfo.enabled," +
                "   ClientBuyerInfo.businessLicense," +
                "   ClientBuyerInfo.enterpriseName," +
                "   DATE_FORMAT(ClientBuyerInfo.businessLicenseValidate,'%%Y-%%m-%%d') as businessLicenseValidate, " +
                "   ClientBuyerInfo.businessAddress," +
                "   ClientBuyerInfo.legalRepresentative," +
                "   DATE_FORMAT(ClientBuyerInfo.erpUpdateTime,'%%Y-%%m-%%d %%H:%%i:%%S') as erpUpdateTime " +
                " FROM %s.ClientBuyerInfo,%s.Customer " +
                "   %s  "+//where str
                "   %s ;";//limit str
            logger.debug(JSON.stringify(filter));
            var whereStr=" WHERE Customer.businessLicense<>ClientBuyerInfo.businessLicense ";
            whereStr+=sprintf(" AND Customer.id = %d ", enterpriseId);
            var pageIndex = filter.pageIndex;
            var pageSize = filter.pageSize;
            var status = filter.status;
            var keyWords = filter.keywords;
            if(Number(status) >-1){
                whereStr+=sprintf(" AND ClientBuyerInfo.enabled = '%s' ", status);
            }
            whereStr+= sprintf(" AND (ClientBuyerInfo.enterpriseName LIKE  '%%%s%%'  OR ClientBuyerInfo.erpCode LIKE  '%%%s%%'   ) ",keyWords,keyWords);

            whereStr+= sprintf(" ORDER BY ClientBuyerInfo.enabled ASC");
            var limitStr=sprintf("LIMIT %d,%d",(pageIndex-1)*pageSize,pageSize);
            var sql = sprintf(SQL,dbName,__cloudDBName,whereStr,limitStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });

        },


        /**
         *  GET DAILY COUNT FOR ORDER
         * @param dbName
         * @param condition
         * @param callback
         */
        getDataSumofOrder: function(dbName,condition,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   SUM(objectAmount) as dailyOrderNum," +
                "   DATE_FORMAT(objectDate,'%%m-%%d') as orderDate " +
                " FROM %s.EDIDataCount " +
                "   %s ;";//where str

            var whereStr="";
            whereStr+=sprintf(" WHERE objectType = 'ORDER' and objectSide = '%s' ", condition.objectSide);
            var startTime = condition.beginAt;
            var endTime = condition.endAt;
            if(startTime!=""&&endTime!=""){
                whereStr+=sprintf(" AND objectDate BETWEEN '%s' AND '%s '",
                    moment(startTime).format('YYYY-MM-DD'),moment(endTime).format('YYYY-MM-DD'));
            }
            whereStr+=" GROUP BY orderDate ";

            var sql = sprintf(SQL,dbName,whereStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                logger.debug(JSON.stringify(result));
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * GET LAST  LOGIN DATE
         * @param dbName
         * @param condition
         * @param callback
         */
        getDataDateofLogin: function(dbName,condition,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   DATE_FORMAT(objectDate,'%%Y-%%m-%%d %%H:%%i:%%S') as lastLogin " +
                " FROM %s.EDIDataCount " +
                "   %s ;";//where str

            var whereStr="";
            whereStr+=sprintf(" WHERE objectType = 'LOGIN' ORDER BY objectDate DESC LIMIT 1;");

            var sql = sprintf(SQL,dbName,whereStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * get goodsInfoMatched:"商品同步总数"
         * @param dbName
         * @param callback
         */
        getGoodsInfoMatchedNum : function(dbName,callback){
            logger.enter();
            var sql = knex.withSchema(dbName)
                .from('GoodsInfo')
                .count('unicode as goodsInfoMatched').toString();
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
         },
        /**
         * get clientSellerMatched:"供应商匹配数"
         * @param dbName
         * @param enterpriseId
         * @param callback
         */
        getMatchedofClientSellers: function(dbName,enterpriseId,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   COUNT(ClientSellerInfo.enterpriseId) as clientSellerMatched " +
                " FROM %s.ClientSellerInfo,%s.Customer " +
                " WHERE ClientSellerInfo.businessLicense <> Customer.businessLicense" +
                " and Customer.id = %d "+
                " and ClientSellerInfo.enabled = 1 ;";
            var sql = sprintf(SQL,dbName,__cloudDBName,enterpriseId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });

        },
        /**
         * get clientSellerTotal:"供应商总数"
         * @param dbName
         * @param enterpriseId
         * @param callback
         */
        getTotalofClientSellers: function(dbName,enterpriseId,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   COUNT(ClientSellerInfo.id) as clientSellerTotal " +
                " FROM %s.ClientSellerInfo,%s.Customer " +
                " WHERE ClientSellerInfo.businessLicense <> Customer.businessLicense" +
                " and Customer.id = %d ;";
            var sql = sprintf(SQL,dbName,__cloudDBName,enterpriseId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });

        },
        /**
         * get clientBuyerMatched:"采购客户匹配数"
         * @param dbName
         * @param enterpriseId
         * @param callback
         */
        getMatchedofClientBuyers: function(dbName,enterpriseId,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   COUNT(ClientBuyerInfo.enterpriseId) as clientBuyerMatched " +
                " FROM %s.ClientBuyerInfo,%s.Customer " +
                " WHERE ClientBuyerInfo.businessLicense <> Customer.businessLicense" +
                " and Customer.id = %d "  +
                " and ClientBuyerInfo.enabled = 1 ;";
            var sql = sprintf(SQL,dbName,__cloudDBName,enterpriseId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });

        },

        /**
         * get clientBuyerTotal:"采购客户总数"
         * @param dbName
         * @param enterpriseId
         * @param callback
         */
        getTotalofClientBuyers : function(dbName,enterpriseId,callback){
          logger.enter();
            var SQL =
                "   SELECT " +
                "   COUNT(ClientBuyerInfo.id) as clientBuyerTotal " +
                " FROM %s.ClientBuyerInfo ,%s.Customer " +
                " WHERE ClientBuyerInfo.businessLicense <> Customer.businessLicense" +
                " and Customer.id = %d "  +
                " ;   ";
            var sql = sprintf(SQL,dbName,__cloudDBName,enterpriseId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });

        },
        /**
         * GET FIRST LOGIN DATE
         * @param dbName
         * @param condition
         * @param callback
         */
        getDateofFirstLogin : function(dbName,condition,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "       DATE_FORMAT(objectDate,'%%Y-%%m-%%d %%H:%%i:%%S') as firstLogin " +
                "   FROM %s.EDIDataCount " +
                "   %s ;";//where str

            var whereStr="";
            whereStr+=sprintf(" WHERE objectType = 'LOGIN' ORDER BY objectDate ASC LIMIT 1;");

            var sql = sprintf(SQL,dbName,whereStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * GET RETURN COUNT
         * @param dbName
         * @param condition
         * @param callback
         */
        getDataCountofReturn: function(dbName,condition,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   count(objectID) as returnNum " +
                " FROM %s.EDIDataCount " +
                "   %s ;";//where str

            var whereStr="";
            whereStr+=sprintf(" WHERE objectType = 'RETURN' AND objectSide='%s' ", condition.objectSide);
            var startTime = condition.beginAt;
            var endTime = condition.endAt;
            if(startTime!=""&&endTime!=""){
                whereStr+=sprintf(" AND DATE_FORMAT(objectDate,'%%Y-%%m-%%d ') BETWEEN '%s' AND '%s '",
                    moment(startTime).format('YYYY-MM-DD'),moment(endTime).format('YYYY-MM-DD'));
            }

            var sql = sprintf(SQL,dbName,whereStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * GET SHIP COUNT
         * @param dbName
         * @param condition
         * @param callback
         */
        getDataCountofShip: function(dbName,condition,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   count(objectID) as shipNum " +
                " FROM %s.EDIDataCount " +
                "   %s ;";//where str

            var whereStr="";
            whereStr+=sprintf(" WHERE objectType = 'SHIP' AND objectSide='%s' ", condition.objectSide);
            var startTime = condition.beginAt;
            var endTime = condition.endAt;
            if(startTime!=""&&endTime!=""){
                whereStr+=sprintf(" AND DATE_FORMAT(objectDate,'%%Y-%%m-%%d ') BETWEEN '%s' AND '%s '",
                    moment(startTime).format('YYYY-MM-DD'),moment(endTime).format('YYYY-MM-DD'));
            }

            var sql = sprintf(SQL,dbName,whereStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * GET ORDER COUNT
         * @param dbName
         * @param condition
         * @param callback
         */
        getDataCountofOrder: function(dbName,condition,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   count(objectID) as orderNum," +
                "   SUM(objectAmount) as orderAmountSum  " +
                " FROM %s.EDIDataCount " +
                "   %s ;";//where str

            var whereStr="";
            whereStr+=sprintf(" WHERE objectType = 'ORDER'AND objectSide='%s' ", condition.objectSide);
            var startTime = condition.beginAt;
            var endTime = condition.endAt;
            if(startTime!=""&&endTime!=""){
                whereStr+=sprintf(" AND DATE_FORMAT(objectDate,'%%Y-%%m-%%d ') BETWEEN '%s' AND '%s '",
                    moment(startTime).format('YYYY-MM-DD'),moment(endTime).format('YYYY-MM-DD'));
            }

            var sql = sprintf(SQL,dbName,whereStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },


        /**
         * GET INQUIRY COUNT DATA
         * @param dbName
         * @param condition
         * @param callback
         */
        getDataCountofInquiry: function(dbName,condition,callback){
            logger.enter();
            var SQL =
                "   SELECT count(objectID) as inquiryNum FROM %s.EDIDataCount " +
                "   %s ;";//where str

            var whereStr="";
            whereStr+=sprintf(" WHERE objectType = 'INQUIRY' AND objectSide='%s' ", condition.objectSide);
            var startTime = condition.beginAt;
            var endTime = condition.endAt;
            if(startTime!=""&&endTime!=""){
                whereStr+=sprintf(" AND DATE_FORMAT(objectDate,'%%Y-%%m-%%d ') BETWEEN '%s' AND '%s '",
                    moment(startTime).format('YYYY-MM-DD'),moment(endTime).format('YYYY-MM-DD'));
            }

            var sql = sprintf(SQL,dbName,whereStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * get return info by billno
         * @param dbName
         * @param orderShipReturnId
         * @param callback
         */
        getBuyerOrderReturnsbyId : function(dbName,orderShipReturnId,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   BuyerReturnInfo.guid, " +
                "   BuyerReturnInfo.billNo, " +
                "   DATE_FORMAT(BuyerReturnInfo.billDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS billDate," +
                "   BuyerReturnInfo.sellerCode, " +
                "   BuyerReturnInfo.returnReason, " +
                "   BuyerReturnInfo.stockType, " +
                "   BuyerReturnInfo.Remark, " +
                "   BuyerReturnInfo.isConfirmed, " +
                "   BuyerReturnInfo.confirmRemark, " +
                "   DATE_FORMAT(BuyerReturnInfo.confirmDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS confirmDate," +
                "   BuyerReturnInfo.isReceived, " +
                "   BuyerReturnInfo.receivedRemark, " +
                "   DATE_FORMAT(BuyerReturnInfo.receivedDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS receivedDate," +
                "   BuyerReturnInfo.isClosed," +
                "   BuyerReturnInfo.closeRemark," +
                "   DATE_FORMAT(BuyerReturnInfo.closeDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS closeDate," +
                "" +
                "   Customer.customerName as sellerName," +
                "" +
                "   DATE_FORMAT(BuyerReturnInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn" +
                "   " +
                "   FROM %s.BuyerReturnInfo,%s.ClientSellerInfo,%s.Customer " +
                "       WHERE BuyerReturnInfo.guid = '%s'" +
                "           AND BuyerReturnInfo.sellerCode = ClientSellerInfo.erpCode" +
                "           AND ClientSellerInfo.enterpriseId = Customer.id ; ";
            var sql = sprintf(SQL,dbName,dbName,__cloudDBName,orderShipReturnId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * GET BUYER ORDER RETURN DETAILS
         * @param dbName
         * @param mainguid
         * @param callback
         */
        getBuyerOrderReturnDetails : function(dbName,mainguid,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   BuyerReturnDetails.guid, " +
                "   BuyerReturnDetails.detailNo, " +
                "   BuyerReturnDetails.BuyerReturnGuid, " +
                "   BuyerReturnDetails.goodsNo, " +
                "   BuyerReturnDetails.unicode, " +
                "   BuyerReturnDetails.packageQty, " +
                "   BuyerReturnDetails.batchNo, " +
                "   BuyerReturnDetails.batchNum, " +
                "   BuyerReturnDetails.quantity, " +
                "   BuyerReturnDetails.taxPrice, " +
                "   BuyerReturnDetails.price, " +
                "   BuyerReturnDetails.goodsSubtotal, " +
                "   BuyerReturnDetails.taxSubtotal, " +
                "   BuyerReturnDetails.subtotal," +
                "   BuyerReturnDetails.Remark," +
                "   DATE_FORMAT(BuyerReturnDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn," +
                "  " +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS sellerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType" +
                "   FROM %s.BuyerReturnDetails,%s.GoodsInfo" +
                "       WHERE BuyerReturnDetails.BuyerReturnGuid = '%s' " +
                "       AND BuyerReturnDetails.unicode = GoodsInfo.unicode" +
                "   ; ";
            var sql = sprintf(SQL,dbName,dbName,mainguid);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });

        },
        /**
         * get buyer order Returns
         * @param dbName
         * @param filter
         * @param callback
         */
        getBuyerOrderReturns : function(dbName,filter,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   BuyerReturnInfo.guid, " +
                "   BuyerReturnInfo.billNo, " +
                "   DATE_FORMAT(BuyerReturnInfo.billDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS billDate," +
                "   BuyerReturnInfo.sellerCode, " +
                "   BuyerReturnInfo.returnReason, " +
                "   BuyerReturnInfo.stockType, " +
                "   BuyerReturnInfo.Remark, " +
                "   BuyerReturnInfo.isConfirmed, " +
                "   BuyerReturnInfo.confirmRemark, " +
                "   DATE_FORMAT(BuyerReturnInfo.confirmDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS confirmDate," +
                "   BuyerReturnInfo.isReceived, " +
                "   BuyerReturnInfo.receivedRemark, " +
                "   DATE_FORMAT(BuyerReturnInfo.receivedDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS receivedDate," +
                "   BuyerReturnInfo.isClosed," +
                "   BuyerReturnInfo.closeRemark," +
                "   DATE_FORMAT(BuyerReturnInfo.closeDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS closeDate," +
                "   DATE_FORMAT(BuyerReturnInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn" +
                "   " +
                "   FROM %s.BuyerReturnInfo" +
                "   ; ";
            var sql = sprintf(SQL,dbName);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },


        getBuyerShipMonitors : function(dbName,shipDetailNo,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   BuyerShipDetailsMonitor.drugESC," +
                "   BuyerShipDetailsMonitor.shipDetailNo AS monitorDetailNo," +
                "   BuyerShipDetailsMonitor.packingSpec" +
                ""+
                "   FROM %s.BuyerShipDetailsMonitor" +
                "       WHERE BuyerShipDetailsMonitor.shipDetailNo = '%s' ;";

            var sql = sprintf(SQL,dbName,shipDetailNo);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         *  get buyer ShipDetails by shipNo
         * @param dbName
         * @param shipNo
         * @param callback
         */
        getBuyerShipDetails : function(dbName,shipNo,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   BuyerShipInfo.billNo, " +
                "   DATE_FORMAT(BuyerShipInfo.billDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS billDate, " +
                "   BuyerShipInfo.billTime, " +
                "   BuyerShipInfo.orderBillNo, " +
                "   BuyerShipInfo.orderGuid, " +
                "   BuyerShipInfo.notes, " +
                "   BuyerShipInfo.FHRY, " +
                "   BuyerShipInfo.FHRQ, " +
                "   BuyerShipInfo.sellerName, " +
                "   BuyerShipInfo.sellerCode, " +
                "   BuyerShipInfo.isShipped, " +
                "   " +
                "   BuyerShipDetails.id as detailId," +
                "   BuyerShipDetails.shipNo," +
                "   BuyerShipDetails.shipDetailNo," +
                "   DATE_FORMAT(BuyerShipDetails.shipDetailDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipDetailDate, " +
                "   BuyerShipDetails.buyerGoodsNo," +
                "   BuyerShipDetails.unicode," +
                "   BuyerShipDetails.packageQty," +
                "   BuyerShipDetails.taxPrice," +
                "   BuyerShipDetails.batchNo," +
                "   BuyerShipDetails.batchNum," +
                "   DATE_FORMAT(BuyerShipDetails.goodsValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsValidDate, " +
                "   DATE_FORMAT(BuyerShipDetails.goodsProduceDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsProduceDate, " +
                "   BuyerShipDetails.quantity," +
                "   BuyerShipDetails.remark," +
                "   BuyerShipDetails.inspectReportUrl," +
                "   BuyerShipDetails.salesType," +
                "   BuyerShipDetails.orderDetailGuid," +
                "" +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS buyerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType " +
                "   " +
                ""+
                "   FROM %s.BuyerShipDetails,%s.GoodsInfo,%s.BuyerShipInfo" +
                "       WHERE BuyerShipDetails.shipNo = '%s' " +
                "           AND  BuyerShipDetails.unicode = GoodsInfo.unicode" +
                "           AND  BuyerShipInfo.billNo = BuyerShipDetails.shipNo ;";

            var sql = sprintf(SQL,dbName,dbName,dbName,shipNo);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * GET ALL SHIP INFO FOR BUYER
         * @param dbName
         * @param filter
         * @param callback
         */
        getBuyerShipInfos : function(dbName,filter,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   BuyerShipInfo.billNo, " +
                "   DATE_FORMAT(BuyerShipInfo.billDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS billDate, " +
                "   DATE_FORMAT(BuyerShipInfo.billTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS billTime, " +
                "   BuyerShipInfo.orderBillNo, " +
                "   BuyerShipInfo.orderGuid, " +
                "   BuyerShipInfo.notes, " +
                "   BuyerShipInfo.FHRY, " +
                "   BuyerShipInfo.FHRQ, " +
                "   BuyerShipInfo.sellerName, " +
                "   BuyerShipInfo.sellerCode, " +
                "   BuyerShipInfo.isShipped, " +
                "   DATE_FORMAT(BuyerShipInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
                "   " +
                ""+
                "   FROM %s.BuyerShipInfo" +
                "   %s " +//where
                "   %s ";  //limit

            var startTime=filter.startTime,
                endTime=filter.endTime,
                keyword=filter.keywords,
                pageIndex=filter.pageIndex,
                pageSize=filter.pageSize;
            var whereStr="";

            if(startTime!=""&&endTime==""){
                whereStr+= sprintf(" WHERE DATE_FORMAT(billDate,'%%Y-%%m-%%d ')>='%s'",moment(startTime).format('YYYY-MM-DD'));
            }
            if(startTime==""&&endTime!=""){
                whereStr+= sprintf(" WHERE DATE_FORMAT(billDate,'%%Y-%%m-%%d ')<='%s'",moment(endTime).format('YYYY-MM-DD'));
            }
            if(startTime!=""&&endTime!=""){
                whereStr+=sprintf(" WHERE DATE_FORMAT(billDate,'%%Y-%%m-%%d ') BETWEEN '%s' AND '%s '",
                    moment(startTime).format('YYYY-MM-DD'),moment(endTime).format('YYYY-MM-DD'));
            }
            if(whereStr.indexOf('WHERE')==-1){
                whereStr+= sprintf(" WHERE (billNO LIKE '%%%s%%' OR sellerName LIKE  '%%%s%%'  ) ",keyword,keyword);
            }else if(whereStr.indexOf('WHERE')!=-1){
                whereStr+= sprintf(" AND (billNO LIKE  '%%%s%%'  OR sellerName LIKE  '%%%s%%'  ) ",keyword,keyword);
            }
            var limitStr=sprintf("LIMIT %d,%d",(pageIndex-1)*pageSize,pageSize);


            var sql = sprintf(SQL,dbName,whereStr,limitStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * get ShipDetails by shipNo
         * @param dbName
         * @param shipNo
         * @param callback
         */
        getSellerShipDetails : function(dbName,shipNo,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   SellerShipInfo.billNo, " +
                "   DATE_FORMAT(SellerShipInfo.billDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS billDate, " +
                "   SellerShipInfo.billTime, " +
                "   SellerShipInfo.orderBillNo, " +
                "   SellerShipInfo.orderGuid, " +
                "   SellerShipInfo.notes, " +
                "   SellerShipInfo.FHRY, " +
                "   SellerShipInfo.FHRQ, " +
                "   SellerShipInfo.buyerGuid, " +
                "   SellerShipInfo.buyerName, " +
                "   SellerShipInfo.buyerCode, " +
                "   SellerShipInfo.isShipped, " +
                "   " +
                "   SellerShipDetails.id as detailId," +
                "   SellerShipDetails.shipNo," +
                "   SellerShipDetails.shipDetailNo," +
                "   DATE_FORMAT(SellerShipDetails.shipDetailDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipDetailDate, " +
                "   SellerShipDetails.sellerGoodsNo," +
                "   SellerShipDetails.unicode," +
                "   SellerShipDetails.packageQty," +
                "   SellerShipDetails.taxPrice," +
                "   SellerShipDetails.batchNo," +
                "   SellerShipDetails.batchNum," +
                "   DATE_FORMAT(SellerShipDetails.goodsValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsValidDate, " +
                "   DATE_FORMAT(SellerShipDetails.goodsProduceDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsProduceDate, " +
                "   SellerShipDetails.quantity," +
                "   SellerShipDetails.remark," +
                "   SellerShipDetails.inspectReportUrl," +
                "   SellerShipDetails.salesType," +
                "   SellerShipDetails.orderDetailGuid," +
                "" +
                "   SellerShipDetailsMonitor.drugESC," +
                "   SellerShipDetailsMonitor.shipDetailNo AS monitorDetailNo," +
                "   SellerShipDetailsMonitor.packingSpec," +
                "" +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS sellerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType " +
                "   " +
                ""+
                "   FROM %s.SellerShipDetails " +
                "   LEFT JOIN %s.SellerShipDetailsMonitor ON SellerShipDetails.shipDetailNo = SellerShipDetailsMonitor.shipDetailNo" +
                "   LEFT JOIN %s.GoodsInfo ON SellerShipDetails.unicode = GoodsInfo.unicode " +
                "   LEFT JOIN %s.SellerShipInfo ON SellerShipInfo.billNo = SellerShipDetails.shipNo  " +
                "       WHERE SellerShipDetails.shipNo = '%s' " +
                "       ;";

            var sql = sprintf(SQL,dbName,dbName,dbName,dbName,shipNo);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * GET ALL SHIP INFO FOR SELLER
         * @param dbName
         * @param filter
         * @param callback
         */
        getSellerShipInfos : function(dbName,filter,callback){
            logger.enter();
            var SQL =
                "   SELECT " +
                "   SellerShipInfo.billNo, " +
                "   DATE_FORMAT(SellerShipInfo.billDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS billDate, " +
                "   DATE_FORMAT(SellerShipInfo.billTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS billTime, " +
                "   SellerShipInfo.orderBillNo, " +
                "   SellerShipInfo.orderGuid, " +
                "   SellerShipInfo.notes, " +
                "   SellerShipInfo.FHRY, " +
                "   SellerShipInfo.FHRQ, " +
                "   SellerShipInfo.buyerGuid, " +
                "   SellerShipInfo.buyerName, " +
                "   SellerShipInfo.buyerCode, " +
                "   SellerShipInfo.isShipped, " +
                "   DATE_FORMAT(SellerShipInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
                "   " +
                ""+
                "   FROM %s.SellerShipInfo" +
                "   %s " +//where
                "   %s ";  //limit

                var startTime=filter.startTime,
                    endTime=filter.endTime,
                    keyword=filter.keywords,
                    pageIndex=filter.pageIndex,
                    pageSize=filter.pageSize;
                var whereStr="";

                if(startTime!=""&&endTime==""){
                    whereStr+= sprintf(" WHERE DATE_FORMAT(billDate,'%%Y-%%m-%%d ')>='%s'",moment(startTime).format('YYYY-MM-DD'));
                }
                if(startTime==""&&endTime!=""){
                    whereStr+= sprintf(" WHERE DATE_FORMAT(billDate,'%%Y-%%m-%%d ')<='%s'",moment(endTime).format('YYYY-MM-DD'));
                }
                if(startTime!=""&&endTime!=""){
                    whereStr+=sprintf(" WHERE DATE_FORMAT(billDate,'%%Y-%%m-%%d ') BETWEEN '%s' AND '%s '",
                        moment(startTime).format('YYYY-MM-DD'),moment(endTime).format('YYYY-MM-DD'));
                }
                if(whereStr.indexOf('WHERE')==-1){
                    whereStr+= sprintf(" WHERE (billNO LIKE '%%%s%%' OR buyerName LIKE  '%%%s%%'  ) ",keyword,keyword);
                }else if(whereStr.indexOf('WHERE')!=-1){
                    whereStr+= sprintf(" AND (billNO LIKE   '%%%s%%'  OR buyerName LIKE  '%%%s%%'  ) ",keyword,keyword);
                }
                var limitStr=sprintf("LIMIT %d,%d",(pageIndex-1)*pageSize,pageSize);


                var sql = sprintf(SQL,dbName,whereStr,limitStr);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         *  get one special buyer quotationDetail by inquiryId,sellerId,unicode
         * @param buyerDBName
         * @param sellerDBName
         * @param inquiryId
         * @param sellerId
         * @param unicode
         * @param callback
         */
        listOneBuyerQuotationDetail : function(buyerDBName,sellerDBName,inquiryId,sellerId,unicode,callback){
            logger.enter();
            var SQL = "" +
                " SELECT " +
                " BuyerQuotationDetails.inquiryId," +
                " BuyerQuotationDetails.unicode, " +
                " BuyerQuotationDetails.billNo, " +
                " BuyerQuotationDetails.licenseNo, " +
                " BuyerQuotationDetails.sellerId, " +
                " BuyerQuotationDetails.inquiryQuantity, " +
                " BuyerQuotationDetails.quotationPrice, " +
                " BuyerQuotationDetails.quotationQuantity, " +
                " BuyerQuotationDetails.lastErpPrice, " +
                " BuyerQuotationDetails.purchaseUpset, " +
                " SellerInquiry.guid, " +
                " GoodsInfo.goodsNo AS HH," +
                " ClientSellerInfo.erpCode AS GYS"+
                " FROM %s.BuyerQuotationDetails,%s.GoodsInfo,%s.ClientSellerInfo,%s.BuyerInquiry," +
                "       %s.SellerInquiry " +
                " WHERE BuyerQuotationDetails.inquiryId = BuyerInquiry.id " +
                "   AND SellerInquiry.id = %d " +
                "   AND BuyerQuotationDetails.sellerId = %d " +
                "   AND BuyerQuotationDetails.unicode = '%s' " +
                "   AND BuyerQuotationDetails.unicode = GoodsInfo.unicode " +
                "   AND BuyerQuotationDetails.inquiryId = BuyerInquiry.id " +
                "   AND BuyerQuotationDetails.sellerId = ClientSellerInfo.enterpriseId;";
            var sql = sprintf(SQL,buyerDBName,buyerDBName,buyerDBName, buyerDBName,
                sellerDBName,inquiryId,sellerId,unicode);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });

        },
        /**
         * get seller quotations
         * @param dbName
         * @param inquiryId
         * @param callback
         */
        getSellerQuotations : function(dbName,inquiryId,callback){
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   SellerQuotationDetails.id, " +
                "   SellerQuotationDetails.inquiryId, " +
                "   SellerQuotationDetails.buyerId, " +
                "   SellerQuotationDetails.buyerName, " +
                "   SellerQuotationDetails.unicode, " +
                "   SellerQuotationDetails.packageQty, " +
                "   SellerQuotationDetails.billNo, " +
                "   SellerQuotationDetails.licenseNo, " +
                "   SellerQuotationDetails.lastErpPrice, " +
                "   SellerQuotationDetails.purchaseUpset, " +
                "   DATE_FORMAT(SellerQuotationDetails.inquiryExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS inquiryExpire," +
                "   SellerQuotationDetails.inquiryQuantity, " +
                "   SellerQuotationDetails.quotationQuantity, " +
                "   SellerQuotationDetails.quotationPrice, " +
                "   DATE_FORMAT(SellerQuotationDetails.quotationExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationExpire," +
                "   SellerQuotationDetails.clearingPeriod," +
                "   DATE_FORMAT(SellerQuotationDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn," +
                "   " +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS sellerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType" +
                "" +
                "   FROM %s.SellerQuotationDetails,%s.GoodsInfo " +
                "   WHERE SellerQuotationDetails.unicode = GoodsInfo.unicode " +
                "   AND SellerQuotationDetails.inquiryId = %d " +
                "   ; ",
                dbName,dbName,inquiryId
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },


        getNearClientQuotationHistory:function(dbName,quotation,callback){
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   SellerQuotationHistory.id, " +
                "   SellerQuotationHistory.inquiryId, " +
                "   SellerQuotationHistory.buyerId, " +
                "   SellerQuotationHistory.buyerName, " +
                "   SellerQuotationHistory.unicode, " +
                "   SellerQuotationHistory.packageQty, " +
                "   SellerQuotationHistory.billNo, " +
                "   SellerQuotationHistory.licenseNo, " +
                "   SellerQuotationHistory.lastErpPrice, " +
                "   SellerQuotationHistory.purchaseUpset, " +
                "   DATE_FORMAT(SellerQuotationHistory.inquiryExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS inquiryExpire, " +
                "   SellerQuotationHistory.inquiryQuantity, " +
                "   SellerQuotationHistory.quotationQuantity, " +
                "   SellerQuotationHistory.quotationPrice, " +
                "   DATE_FORMAT(SellerQuotationHistory.quotationExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationExpire, " +
                "   SellerQuotationHistory.clearingPeriod, " +
                "   DATE_FORMAT(SellerQuotationHistory.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
                "   " +
                "   FROM %s.SellerQuotationHistory " +
                "   WHERE  SellerQuotationHistory.unicode = '%s' " +
                "   ORDER BY SellerQuotationHistory.createdOn DESC" +
                "   LIMIT 0,1; ",
                dbName,quotation.unicode
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * select seller quotation history
         * @param dbName
         * @param quotation
         * @param callback
         */
        getNearSellerQuotationHistory : function(dbName,quotation,callback){
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   SellerQuotationHistory.id, " +
                "   SellerQuotationHistory.inquiryId, " +
                "   SellerQuotationHistory.buyerId, " +
                "   SellerQuotationHistory.buyerName, " +
                "   SellerQuotationHistory.unicode, " +
                "   SellerQuotationHistory.packageQty, " +
                "   SellerQuotationHistory.billNo, " +
                "   SellerQuotationHistory.licenseNo, " +
                "   SellerQuotationHistory.lastErpPrice, " +
                "   SellerQuotationHistory.purchaseUpset, " +
                "   DATE_FORMAT(SellerQuotationHistory.inquiryExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS inquiryExpire, " +
                "   SellerQuotationHistory.inquiryQuantity, " +
                "   SellerQuotationHistory.quotationQuantity, " +
                "   SellerQuotationHistory.quotationPrice, " +
                "   DATE_FORMAT(SellerQuotationHistory.quotationExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationExpire, " +
                "   SellerQuotationHistory.clearingPeriod, " +
                "   DATE_FORMAT(SellerQuotationHistory.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
                "   " +
                "   FROM %s.SellerQuotationHistory " +
                "   WHERE  SellerQuotationHistory.inquiryId = %d " +
                "       AND SellerQuotationHistory.buyerId = %d" +
                "       AND SellerQuotationHistory.unicode = '%s' " +
                "   ORDER BY SellerQuotationHistory.createdOn DESC" +
                "   LIMIT 0,1; ",
                dbName,quotation.inquiryId,quotation.buyerId,quotation.unicode
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * select buyer quotation history
         * @param dbName
         * @param quotation
         * @param callback
         */
        getNearBuyerQuoationHistory : function(dbName,quotation,callback){
            logger.enter();
            var sql = sprintf(
            "   SELECT " +
            "   BuyerQuotationHistory.id, " +
            "   BuyerQuotationHistory.inquiryId, " +
            "   BuyerQuotationHistory.sellerId, " +
            "   BuyerQuotationHistory.sellerName, " +
            "   BuyerQuotationHistory.unicode, " +
            "   BuyerQuotationHistory.packageQty, " +
            "   BuyerQuotationHistory.billNo, " +
            "   BuyerQuotationHistory.licenseNo, " +
            "   BuyerQuotationHistory.lastErpPrice, " +
            "   BuyerQuotationHistory.purchaseUpset, " +
            "   DATE_FORMAT(BuyerQuotationHistory.inquiryExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS inquiryExpire, " +
            "   BuyerQuotationHistory.inquiryQuantity, " +
            "   BuyerQuotationHistory.quotationQuantity, " +
            "   BuyerQuotationHistory.quotationPrice, " +
            "   DATE_FORMAT(BuyerQuotationHistory.quotationExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationExpire, " +
            "   BuyerQuotationHistory.clearingPeriod, " +
            "   DATE_FORMAT(BuyerQuotationHistory.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
            "   " +
            "   FROM %s.BuyerQuotationHistory " +
            "   WHERE  BuyerQuotationHistory.inquiryId = %d " +
            "       AND BuyerQuotationHistory.sellerId = %d" +
            "       AND BuyerQuotationHistory.unicode = '%s' " +
            "   ORDER BY BuyerQuotationHistory.createdOn DESC" +
            "   LIMIT 0,1; ",
                dbName,quotation.inquiryId,quotation.sellerId,quotation.unicode
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * get buyer quotation by id
         * @param dBName
         * @param inquiryId
         * @param callback
         */
        getBuyerQuotationById  : function(dBName,inquiryId, callback){
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   BuyerQuotationDetails.id, " +
                "   BuyerQuotationDetails.inquiryId, " +
                "   BuyerQuotationDetails.sellerId, " +
                "   BuyerQuotationDetails.sellerName, " +
                "   BuyerQuotationDetails.unicode, " +
                "   BuyerQuotationDetails.packageQty, " +
                "   BuyerQuotationDetails.billNo, " +
                "   BuyerQuotationDetails.licenseNo, " +
                "   BuyerQuotationDetails.lastErpPrice, " +
                "   BuyerQuotationDetails.purchaseUpset, " +
                "   DATE_FORMAT(BuyerQuotationDetails.inquiryExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS inquiryExpire," +
                "   BuyerQuotationDetails.inquiryQuantity, " +
                "   BuyerQuotationDetails.quotationQuantity, " +
                "   BuyerQuotationDetails.quotationPrice, " +
                "   DATE_FORMAT(BuyerQuotationDetails.quotationExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationExpire," +
                "   BuyerQuotationDetails.clearingPeriod," +
                "   DATE_FORMAT(BuyerQuotationDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn," +
                "   " +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS buyerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType," +
                "" +
                "   BuyerInquiry.guid " +
                "   FROM %s.BuyerQuotationDetails,%s.GoodsInfo,%s.BuyerInquiry " +
                "   WHERE BuyerQuotationDetails.unicode = GoodsInfo.unicode " +
                "   AND BuyerQuotationDetails.inquiryId = BuyerInquiry.id " +
                "   AND BuyerQuotationDetails.inquiryId = %d" +
                "   ; ",
                dBName,dBName,dBName,inquiryId
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * get buyer quotations
         * @param dbName
         * @param inquiryId
         * @param callback
         */
        getBuyerQuotations : function(dbName,inquiryId,callback){
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   BuyerQuotationDetails.id, " +
                "   BuyerQuotationDetails.inquiryId, " +
                "   BuyerQuotationDetails.sellerId, " +
                "   BuyerQuotationDetails.sellerName, " +
                "   BuyerQuotationDetails.unicode, " +
                "   BuyerQuotationDetails.packageQty, " +
                "   BuyerQuotationDetails.billNo, " +
                "   BuyerQuotationDetails.licenseNo, " +
                "   BuyerQuotationDetails.lastErpPrice, " +
                "   BuyerQuotationDetails.purchaseUpset, " +
                "   DATE_FORMAT(BuyerQuotationDetails.inquiryExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS inquiryExpire," +
                "   BuyerQuotationDetails.inquiryQuantity, " +
                "   BuyerQuotationDetails.quotationQuantity, " +
                "   BuyerQuotationDetails.quotationPrice, " +
                "   DATE_FORMAT(BuyerQuotationDetails.quotationExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationExpire," +
                "   BuyerQuotationDetails.clearingPeriod," +
                "   DATE_FORMAT(BuyerQuotationDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn," +
                "   " +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS buyerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType " +
                "" +
                "   FROM %s.BuyerQuotationDetails,%s.GoodsInfo " +
                "   WHERE BuyerQuotationDetails.unicode = GoodsInfo.unicode " +
                "   AND BuyerQuotationDetails.inquiryId = %d " +
                "   ; ",
                dbName,dbName,inquiryId
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * insert quotation data to buyerQuotationDetails
         * @param connect
         * @param dBName
         * @param quotation
         * @param callback
         */
        insertBuyerQuotationDetails: function(connect,dBName,quotation,callback){
            logger.enter();
            var sql = sprintf("INSERT INTO %s.BuyerQuotationDetails (inquiryId,sellerId,sellerName," +
                " unicode,packageQty,billNo,licenseNo, lastErpPrice, purchaseUpset,inquiryQuantity, inquiryExpire," +
                " quotationQuantity, quotationPrice, quotationExpire, clearingPeriod) " +
                " VALUES (%d,%d,'%s','%s', %f,'%s','%s',%f,%f,   %f,'%s',%f,%f,DATE_ADD(CURDATE(), INTERVAL 7 DAY),'%s') " +
                " ON DUPLICATE KEY UPDATE " +
                " quotationQuantity=VALUES(quotationQuantity),quotationPrice=VALUES(quotationPrice)," +
                " quotationExpire=VALUES(quotationExpire)",
                dBName,
                quotation.inquiryId,quotation.sellerId,quotation.sellerName,quotation.unicode,  quotation.packageQty,
                quotation.billNo,quotation.licenseNo,quotation.lastErpPrice,quotation.purchaseUpset,
                quotation.inquiryQuantity,quotation.inquiryExpire,quotation.quotationQuantity,quotation.quotationPrice,
                //quotation.quotationExpire,
                quotation.clearingPeriod);

            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        updateBuyerInquiryDate:function(connect,buyerDBName,guid,callback){
            logger.enter();
            var sql="UPDATE %s.BuyerInquiry set updatedOn=NOW() WHERE guid= '%s' ";
            sql=sprintf(sql,buyerDBName,guid);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,result);
                }
            })
        },

        updateSellerInquiryDate:function(connect,sellerDBName,guid,callback){
            logger.enter();
            var sql="UPDATE %s.SellerInquiry set updatedOn=NOW() WHERE guid='%s' ";
            sql=sprintf(sql,sellerDBName,guid);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,result);
                }
            })
        },

        /**
         * get buyer inquiry by seller inquiryId
         * @param connect
         * @param sellerDBName
         * @param buyerDBName
         * @param sellerinquiryId
         * @param callback
         */
        getBuyerInquiry:function(connect,sellerDBName,buyerDBName,sellerinquiryId,callback){
            logger.enter();
            var sql=" SELECT BuyerInquiry.id,BuyerInquiry.guid FROM %s.BuyerInquiry,%s.SellerInquiry" +
                " WHERE SellerInquiry.id = %d " +
                "   AND SellerInquiry.guid = BuyerInquiry.guid ;";
            sql=sprintf(sql,buyerDBName,sellerDBName,sellerinquiryId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,result);
                }
            })
        },


        /**
         * update buyer inquiry Details
         * @param connect
         * @param dBName
         * @param quotation
         * @param callback
         */
        insertBuyerInquiryDetails : function(connect,dBName,quotation,callback){
            logger.enter();
            var sql = sprintf("INSERT INTO %s.BuyerInquiryDetails (inquiryId,objectId, " +
                " unicode, quotationQuantity, quotationPrice, quotationExpire, clearingPeriod) " +
                " VALUES (%d,%d,'%s',%f,%f,DATE_ADD(CURDATE(), INTERVAL 7 DAY),'%s') " +
                " ON DUPLICATE KEY UPDATE " +
                " quotationQuantity=VALUES(quotationQuantity),quotationPrice=VALUES(quotationPrice)," +
                " quotationExpire=VALUES(quotationExpire)",
                dBName,
                quotation.inquiryId,quotation.sellerId,quotation.unicode,
                quotation.quotationQuantity,quotation.quotationPrice,
                quotation.clearingPeriod);

            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * update seller inquiry Details
         * @param connect
         * @param dBName
         * @param quotation
         * @param callback
         */
        insertSellerInquiryDetails: function(connect,dBName,quotation,callback){
            logger.enter();
            var sql = sprintf("INSERT INTO %s.SellerInquiryDetails (inquiryId,objectId, " +
                " unicode, quotationQuantity, quotationPrice, quotationExpire, clearingPeriod) " +
                " VALUES (%d,%d,'%s',%f,%f,DATE_ADD(CURDATE(), INTERVAL 7 DAY),'%s') " +
                " ON DUPLICATE KEY UPDATE " +
                " quotationQuantity=VALUES(quotationQuantity),quotationPrice=VALUES(quotationPrice)," +
                " quotationExpire=VALUES(quotationExpire)",
                dBName,
                quotation.inquiryId,quotation.buyerId,quotation.unicode,
                quotation.quotationQuantity,quotation.quotationPrice,
                //quotation.quotationExpire,
                quotation.clearingPeriod);

            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * select quotation for verify post quotation data
         * @param connect
         * @param dBName
         * @param quotation
         * @param callback
         */
        selectOneQuotationDetail : function(connect,dBName,quotation,callback){
            logger.enter();
            var sql = sprintf(
                " select quotationPrice,quotationQuantity,quotationExpire " +
                " from " +
                " %s.SellerQuotationDetails" +
                " where inquiryId = %d " +
                " and buyerId= %d  " +
                " and unicode='%s' " +
                " ;",
                dBName,
                Number(quotation.inquiryId),
                Number(quotation.buyerId),
                quotation.unicode);
            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * add history for buyer quotation
         * @param connect
         * @param dBName
         * @param quotation
         * @param callback
         */
        insertBuyerQuotationHistory : function(connect,dBName,quotation,callback){
            logger.enter();
            var sql = sprintf("INSERT INTO %s.BuyerQuotationHistory " +
                " (inquiryId,sellerId,sellerName," +
                "  unicode,packageQty,billNo,licenseNo, " +
                "  lastErpPrice, purchaseUpset,inquiryQuantity," +
                "  inquiryExpire,quotationQuantity, quotationPrice, " +
                "  quotationExpire, clearingPeriod) " +
                " VALUES (" +
                "  %d,  %d, '%s'," +
                "  '%s',%f, '%s','%s'," +
                "  %f,  %f,  %f," +
                "  '%s',  %f,  %f," +
                "  DATE_ADD(CURDATE(), INTERVAL 7 DAY)," +
                "  '%s') " +
                " ON DUPLICATE KEY UPDATE " +
                " inquiryId=VALUES(inquiryId),sellerId=VALUES(sellerId),unicode=VALUES(unicode),  " +
                " quotationQuantity=VALUES(quotationQuantity),quotationPrice=VALUES(quotationPrice)," +
                " quotationExpire=VALUES(quotationExpire);",
                dBName,
                Number(quotation.inquiryId),Number(quotation.sellerId),quotation.sellerName,
                quotation.unicode,          Number(quotation.packageQty),quotation.billNo,quotation.licenseNo,
                Number(quotation.lastErpPrice), Number(quotation.purchaseUpset),Number(quotation.inquiryQuantity),
                quotation.inquiryExpire,    Number(quotation.quotationQuantity),Number(quotation.quotationPrice),
                quotation.clearingPeriod);

            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * add history for seller quotation
         * @param connect
         * @param dBName
         * @param quotation
         * @param callback
         */
        insertSellerQuotationHistory : function(connect,dBName,quotation,callback){
        logger.enter();
        var sql = sprintf("INSERT INTO %s.SellerQuotationHistory " +
            " (inquiryId,buyerId,buyerName," +
            "  unicode,packageQty,billNo,licenseNo, " +
            "  lastErpPrice, purchaseUpset,inquiryQuantity," +
            "  inquiryExpire,quotationQuantity, quotationPrice, " +
            "  quotationExpire, clearingPeriod) " +
            " VALUES (" +
            "  %d,  %d, '%s'," +
            "  '%s',%f, '%s','%s'," +
            "  %f,  %f,  %f," +
            "  '%s',  %f,  %f," +
            "  DATE_ADD(CURDATE(), INTERVAL 7 DAY)," +
            "  '%s') " +
            " ON DUPLICATE KEY UPDATE " +
            " inquiryId=VALUES(inquiryId),buyerId=VALUES(buyerId),unicode=VALUES(unicode),  " +
            " quotationQuantity=VALUES(quotationQuantity),quotationPrice=VALUES(quotationPrice)," +
            " quotationExpire=VALUES(quotationExpire);",
            dBName,
            Number(quotation.inquiryId),Number(quotation.buyerId),quotation.buyerName,
            quotation.unicode,          Number(quotation.packageQty),quotation.billNo,quotation.licenseNo,
            Number(quotation.lastErpPrice), Number(quotation.purchaseUpset),Number(quotation.inquiryQuantity),
            quotation.inquiryExpire,    Number(quotation.quotationQuantity),Number(quotation.quotationPrice),
            quotation.clearingPeriod);

        logger.sql(sql);
        connect.query(sql, function(err, result){
            if (err) {
                logger.sqlerr(err);
                callback(err);
            } else {
                callback(null, result);
            }
        });
    },

        /**
         * insert quotation data to sellerQuotationDetails
         * @param connect
         * @param dBName
         * @param quotation
         * @param callback
         */
        insertSellerQuotationDetails: function(connect,dBName,quotation,callback){
            logger.enter();
            var sql = sprintf("INSERT INTO %s.SellerQuotationDetails " +
                " (inquiryId,buyerId,buyerName," +
                "  unicode,packageQty,billNo,licenseNo, " +
                "  lastErpPrice, purchaseUpset,inquiryQuantity," +
                "  inquiryExpire,quotationQuantity, quotationPrice, " +
                "  quotationExpire, clearingPeriod) " +
                " VALUES (" +
                "  %d,  %d, '%s'," +
                "  '%s',%f, '%s','%s'," +
                "  %f,  %f,  %f," +
                "  '%s',  %f,  %f," +
                "  DATE_ADD(CURDATE(), INTERVAL 7 DAY)," +
                "  '%s') " +
                " ON DUPLICATE KEY UPDATE " +
                " inquiryId=VALUES(inquiryId),buyerId=VALUES(buyerId),unicode=VALUES(unicode),  " +
                " quotationQuantity=VALUES(quotationQuantity),quotationPrice=VALUES(quotationPrice)," +
                " quotationExpire=VALUES(quotationExpire);",
                dBName,
                Number(quotation.inquiryId),Number(quotation.buyerId),quotation.buyerName,
                quotation.unicode,          Number(quotation.packageQty),quotation.billNo,quotation.licenseNo,
                Number(quotation.lastErpPrice), Number(quotation.purchaseUpset),Number(quotation.inquiryQuantity),
                quotation.inquiryExpire,    Number(quotation.quotationQuantity),Number(quotation.quotationPrice),
                //quotation.quotationExpire,
                quotation.clearingPeriod);

            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * get buyer inquriy details
         * @param dBName
         * @param inquiryId
         * @param callback
         */
        getBuyerInquiryDetailsById : function(dBName, inquiryId, callback) {
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   BuyerInquiryDetails.id, " +
                "   BuyerInquiryDetails.inquiryId, " +
                "   BuyerInquiryDetails.unicode, " +
                "   BuyerInquiryDetails.packageQty, " +
                "   BuyerInquiryDetails.billNo, " +
                "   BuyerInquiryDetails.licenseNo, " +
                "   BuyerInquiryDetails.objectId, " +
                "   DATE_FORMAT(BuyerInquiryDetails.inquiryExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS inquiryExpire," +
                "   BuyerInquiryDetails.inquiryQuantity, " +
                "   BuyerInquiryDetails.purchaseUpset, " +
                "   BuyerInquiryDetails.lastErpPrice, " +
                "   BuyerInquiryDetails.clearingPeriod," +
                "   DATE_FORMAT(BuyerInquiryDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn," +
                "   " +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS BuyerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType" +
                ""+
                "   FROM %s.BuyerInquiryDetails" +
                "   LEFT JOIN %s.GoodsInfo ON BuyerInquiryDetails.unicode = GoodsInfo.unicode " +
                "   WHERE " +
                "   BuyerInquiryDetails.inquiryId = %d  ;",
                dBName,dBName,inquiryId
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * get inquirys from buyer db
         * @param dBName
         * @param filter
         * @param callback
         */
        getBuyerInquirys: function(dBName, filter, callback) {
            logger.enter();

            var sql= "  SELECT DISTINCT" +
                    "   BuyerInquiry.id AS inquiryId, " +
                    "   BuyerInquiry.guid, " +
                    "   DATE_FORMAT(BuyerInquiry.updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationDate," +
                    "   DATE_FORMAT(BuyerInquiry.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn" +
                    ""+
                    "   FROM %s.BuyerInquiry" +
                    "   %s " +//where
                    "   %s " + //condition
                    "   %s" + //limit
                    "; ";
            var startTime=filter.startTime,
                endTime=filter.endTime,
                keyword=filter.keywords,
                pageIndex=filter.pageIndex,
                pageSize=filter.pageSize;
            var conditionStr = filter.type=="QUOTATION"?"AND BuyerInquiry.updatedOn <> BuyerInquiry.createdOn":"AND BuyerInquiry.updatedOn = BuyerInquiry.createdOn";
            var whereStr="",
                dateStr=filter.type=="QUOTATION"?"updatedOn":"createdOn";

            if(startTime!=""&&endTime==""){
                whereStr+= sprintf(" WHERE DATE_FORMAT(BuyerInquiry."+dateStr+",'%%Y-%%m-%%d ')>='%s'",moment(startTime).format('YYYY-MM-DD'));
            }
            if(startTime==""&&endTime!=""){
                whereStr+= sprintf(" WHERE DATE_FORMAT(BuyerInquiry."+dateStr+",'%%Y-%%m-%%d ')<='%s'",moment(endTime).format('YYYY-MM-DD'));
            }
            if(startTime!=""&&endTime!=""){
                whereStr+=sprintf(" WHERE DATE_FORMAT(BuyerInquiry."+dateStr+",'%%Y-%%m-%%d ') BETWEEN '%s' AND '%s '",
                    moment(startTime).format('YYYY-MM-DD'),moment(endTime).format('YYYY-MM-DD'));
            }
            if(whereStr.indexOf('WHERE')==-1){
                whereStr+= sprintf(" WHERE (BuyerInquiry.id LIKE '%%%s%%'  ) ",keyword);
            }else if(whereStr.indexOf('WHERE')!=-1){
                whereStr+= sprintf(" AND (BuyerInquiry.id LIKE  '%%%s%%'  ) ",keyword);
            }
            var limitStr=sprintf("LIMIT %d,%d",(pageIndex-1)*pageSize,pageSize);

            sql=sprintf(sql,dBName,whereStr,conditionStr,limitStr);

            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },



        getSellerInquiryDetailsById : function(dBName,inquiryId, callback) {
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   SellerInquiryDetails.id, " +
                "   SellerInquiryDetails.inquiryId, " +
                "   SellerInquiryDetails.unicode, " +
                "   SellerInquiryDetails.packageQty, " +
                "   SellerInquiryDetails.billNo, " +
                "   SellerInquiryDetails.licenseNo, " +
                "   SellerInquiryDetails.objectId, " +
                "   SellerInquiryDetails.inquiryExpire, " +
                "   SellerInquiryDetails.inquiryQuantity, " +
                "   SellerInquiryDetails.purchaseUpset, " +
                "   SellerInquiryDetails.lastErpPrice, " +
                "   SellerInquiryDetails.clearingPeriod," +
                "   DATE_FORMAT(SellerInquiryDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn," +
                "   " +
                "   Customer.customerName AS buyerName, " +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS sellerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType" +
                "" +
                "   FROM %s.SellerInquiryDetails" +
                "   LEFT JOIN %s.GoodsInfo ON SellerInquiryDetails.unicode = GoodsInfo.unicode " +
                "   LEFT JOIN %s.Customer ON SellerInquiryDetails.objectId = Customer.id " +
                "   WHERE " +
                "   SellerInquiryDetails.inquiryId = %d; ",
                dBName,dBName,__cloudDBName,inquiryId
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * get inquirys from seller db
         * @param dBName
         * @param filter
         * @param callback
         */
        getSellerInquirys: function(dBName,filter, callback) {
            logger.enter();
            var sql="   SELECT DISTINCT" +
                    "" +
                    "   SellerInquiry.id AS inquiryId, " +
                    "   SellerInquiry.guid, " +
                    "   DATE_FORMAT(SellerInquiry.updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationDate," +
                    "   DATE_FORMAT(SellerInquiry.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
                    ""+
                    "   FROM %s.SellerInquiry" +
                    "   %s " + //where
                    "   %s "+  //condition
                    "   %s" + //limit
                    "; ";

            var startTime=filter.startTime,
                endTime=filter.endTime,
                keyword=filter.keywords,
                pageIndex=filter.pageIndex,
                pageSize=filter.pageSize;
            var detailConditionStr = filter.type=="QUOTATION"?"AND SellerInquiry.updatedOn <>SellerInquiry.createdOn":"AND SellerInquiry.updatedOn=SellerInquiry.createdOn";
            var whereStr="",
                dateStr=filter.type=="QUOTATION"?"updatedOn":"createdOn";

            if(startTime!=""&&endTime==""){
                whereStr+= sprintf(" WHERE DATE_FORMAT(SellerInquiry."+dateStr+",'%%Y-%%m-%%d ')>='%s'",moment(startTime).format('YYYY-MM-DD'));
            }
            if(startTime==""&&endTime!=""){
                whereStr+= sprintf(" WHERE DATE_FORMAT(SellerInquiry."+dateStr+",'%%Y-%%m-%%d ')<='%s'",moment(endTime).format('YYYY-MM-DD'));
            }
            if(startTime!=""&&endTime!=""){
                whereStr+=sprintf(" WHERE DATE_FORMAT(SellerInquiry."+dateStr+",'%%Y-%%m-%%d ') BETWEEN '%s' AND '%s '",
                    moment(startTime).format('YYYY-MM-DD'),moment(endTime).format('YYYY-MM-DD'));
            }
            if(whereStr.indexOf('WHERE')==-1){
                whereStr+= sprintf(" WHERE (SellerInquiry.id LIKE '%%%s%%' ) ",keyword);
            }else if(whereStr.indexOf('WHERE')!=-1){
                whereStr+= sprintf(" AND (SellerInquiry.id LIKE  '%%%s%%'  ) ",keyword);
            }
            var limitStr=sprintf("LIMIT %d,%d",(pageIndex-1)*pageSize,pageSize);

            sql=sprintf(sql,dBName,whereStr,detailConditionStr,limitStr);

            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * get seller quotation details by Id
         * @param dBName
         * @param inquiryId
         * @param callback
         */
        getSellerQuotationById  : function(dBName,inquiryId, callback){
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   SellerQuotationDetails.id, " +
                "   SellerQuotationDetails.inquiryId, " +
                "   SellerQuotationDetails.buyerId, " +
                "   SellerQuotationDetails.buyerName, " +
                "   SellerQuotationDetails.unicode, " +
                "   SellerQuotationDetails.packageQty, " +
                "   SellerQuotationDetails.billNo, " +
                "   SellerQuotationDetails.licenseNo, " +
                "   SellerQuotationDetails.lastErpPrice, " +
                "   SellerQuotationDetails.purchaseUpset, " +
                "   DATE_FORMAT(SellerQuotationDetails.inquiryExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS inquiryExpire," +
                "   SellerQuotationDetails.inquiryQuantity, " +
                "   SellerQuotationDetails.quotationQuantity, " +
                "   SellerQuotationDetails.quotationPrice, " +
                "   DATE_FORMAT(SellerQuotationDetails.quotationExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationExpire," +
                "   SellerQuotationDetails.clearingPeriod," +
                "   DATE_FORMAT(SellerQuotationDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn," +
                "   " +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS sellerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType," +
                "" +
                "   SellerInquiry.guid " +
                "   FROM %s.SellerQuotationDetails,%s.GoodsInfo,%s.SellerInquiry " +
                "   WHERE SellerQuotationDetails.unicode = GoodsInfo.unicode " +
                "   AND SellerQuotationDetails.inquiryId = SellerInquiry.id " +
                "   AND SellerQuotationDetails.inquiryId = %d" +
                "   ; ",
                dBName,dBName,dBName,inquiryId
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },


        getBuyerInquiryById : function(dBName,inquiryId, callback) {
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   BuyerInquiryDetails.id, " +
                "   BuyerInquiryDetails.inquiryId, " +
                "   BuyerInquiryDetails.unicode, " +
                "   BuyerInquiryDetails.packageQty, " +
                "   BuyerInquiryDetails.licenseNo, " +
                "   BuyerInquiryDetails.billNo, " +
                "   BuyerInquiryDetails.objectId AS sellerId, " +
                "   DATE_FORMAT(BuyerInquiryDetails.inquiryExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS inquiryExpire," +
                "   BuyerInquiryDetails.inquiryQuantity, " +
                "   BuyerInquiryDetails.purchaseUpset, " +
                "   BuyerInquiryDetails.lastErpPrice, " +
                "   BuyerInquiryDetails.quotationPrice, " +
                "   BuyerInquiryDetails.quotationQuantity, " +
                "   DATE_FORMAT(BuyerInquiryDetails.quotationExpire,'%%Y-%%m-%%d %%H:%%i:%%S') AS quotationExpire," +
                "   BuyerInquiryDetails.clearingPeriod," +
                "   DATE_FORMAT(BuyerInquiryDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn," +
                "   " +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS buyerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType," +
                "" +
                "   BuyerInquiry.guid, " +
                "" +
                "   Customer.customerName AS sellerName " +
                ""+
                "   FROM %s.BuyerInquiryDetails" +
                "   LEFT JOIN %s.GoodsInfo ON BuyerInquiryDetails.unicode = GoodsInfo.unicode  " +
                "   LEFT JOIN %s.BuyerInquiry ON BuyerInquiryDetails.inquiryId = BuyerInquiry.id " +
                "   LEFT JOIN %s.Customer ON BuyerInquiryDetails.objectId = Customer.id" +
                "   WHERE " +
                "   BuyerInquiryDetails.inquiryId = %d; ",
                dBName,dBName,dBName,__cloudDBName,inquiryId
            );

            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * get seller inquiry by inquiryId
         * @param dBName
         * @param inquiryId
         * @param callback
         */
        getSellerInquiryById : function(dBName,inquiryId, callback) {
            logger.enter();
            var sql = sprintf(
                "   SELECT " +
                "   SellerInquiryDetails.id, " +
                "   SellerInquiryDetails.inquiryId, " +
                "   SellerInquiryDetails.unicode, " +
                "   SellerInquiryDetails.packageQty, " +
                "   SellerInquiryDetails.billNo, " +
                "   SellerInquiryDetails.licenseNo, " +
                "   SellerInquiryDetails.objectId AS buyerId, " +
                "   SellerInquiryDetails.inquiryExpire, " +
                "   SellerInquiryDetails.inquiryQuantity, " +
                "   SellerInquiryDetails.quotationPrice, " +
                "   SellerInquiryDetails.quotationQuantity, " +
                "   SellerInquiryDetails.quotationExpire, " +
                "   SellerInquiryDetails.purchaseUpset, " +
                "   SellerInquiryDetails.lastErpPrice, " +
                "   SellerInquiryDetails.clearingPeriod," +
                "   DATE_FORMAT(SellerInquiryDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn," +
                "   " +
                "   GoodsInfo.id AS goodsId," +
                "   GoodsInfo.licenseNo AS sellerPZWH," +
                "   GoodsInfo.commonName," +
                "   GoodsInfo.alias," +
                "   GoodsInfo.producer," +
                "   GoodsInfo.spec," +
                "   GoodsInfo.imageUrl," +
                "   GoodsInfo.drugsType," +
                "" +
                "   SellerInquiry.guid, " +
                "" +
                "   Customer.customerName AS buyerName " +
                ""+
                "   FROM %s.SellerInquiryDetails" +
                "   LEFT JOIN %s.GoodsInfo ON SellerInquiryDetails.unicode = GoodsInfo.unicode  " +
                "   LEFT JOIN %s.SellerInquiry ON SellerInquiryDetails.inquiryId = SellerInquiry.id " +
                "   LEFT JOIN %s.Customer ON SellerInquiryDetails.objectId = Customer.id" +
                "   WHERE " +
                "   SellerInquiryDetails.inquiryId = %d; ",
                dBName,dBName,dBName,__cloudDBName,inquiryId
            );

            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        retrieveSellerReturnInfos: function (sellerDbName, filter, callback) {
            logger.enter();

            var skipNum = (filter.page - 1) * filter.pageSize;
            var sql = "" +
                "SELECT " +
                "   guid as guid, " +
                "   billNo as billNo, " +
                "   DATE_FORMAT(billDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS billDate, " +
                "   buyerCode as buyerCode, " +
                "   returnReason as returnReason, " +
                "   stockType as stockType, " +
                "   saleType as saleType, " +
                "   Remark as Remark " +
                "FROM " +
                "   %s.SellerReturnInfo " +
                "ORDER BY " +
                "   createdOn desc " +
                "LIMIT " +
                "   %d, %d; ";
            sql = sprintf(sql, sellerDbName, skipNum, filter.pageSize);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },
    
        retrieveSellerReturnDetailsByGuid: function (sellerDbName, sellerReturnInfoGuids, callback) {
            logger.enter();

            var sql = "" +
                "select  " +
                "   I.guid          as guid, " +
                "   I.billNo        as billNo, " +
                "   DATE_FORMAT(I.billDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS billDate, " +
                "   I.buyerCode     as buyerCode, " +
                "   I.returnReason  as returnReason, " +
                "   I.stockType     as stockType, " +
                "   I.saleType      as saleType, " +
                "   I.Remark        as remark, " +
                "   D.guid          as detailGuid, " +
                "   D.detailNo      as detailNo, " +
                "   D.goodsNo       as goodsNo, " +
                "   D.unicode       as unicode, " +
                "   D.packageQty    as packageQty, " +
                "   D.batchNo       as batchNo, " +
                "   D.batchNum      as batchNum, " +
                "   DATE_FORMAT(D.goodsValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsValidDate, " +
                "   D.quantity      as quantity, " +
                "   D.taxPrice      as taxPrice, " +
                "   D.price         as price, " +
                "   D.goodsSubtotal as goodsSubtotal, " +
                "   D.taxSubtotal   as taxSubtotal, " +
                "   D.subtotal      as subtotal, " +
                "   D.Remark        as detailRemark, " +
                "   G.commonName    as commonName, " +
                "   G.alias         as alias, " +
                "   G.producer      as producer, " +
                "   G.spec          as spec, " +
                "   G.imageUrl      as imageUrl, " +
                "   G.drugsType     as drugsType, " +
                "   C.customerName  as buyerName " +
                "from " +
                "   %s.SellerReturnInfo I " +
                "left join " +
                "   %s.SellerReturnDetails D " +
                "on " +
                "   I.guid = D.BuyerReturnGuid " +
                "" +
                "left join " +
                "   %s.GoodsInfo G " +
                "on " +
                "   D.unicode = G.unicode " +
                "" +
                "left join " +
                "   %s.ClientBuyerInfo B " +
                "on " +
                "   I.buyerCode = B.erpCode " +
                "" +
                "left join " +
                "   %s.Customer C " +
                "on " +
                "   B.businessLicense = C.businessLicense " +
                "" +
                "where " +
                "   I.guid in (%s);";

            sellerReturnInfoGuids = underscore.reduce(sellerReturnInfoGuids, function (memo, item) {
                if (memo !== "") {
                    memo = memo + ",";
                }
                return memo + "'" + item + "'";
            }, "");

            if (sellerReturnInfoGuids === "") {
                sellerReturnInfoGuids = "''";
            }
            sql = sprintf(sql, sellerDbName, sellerDbName, sellerDbName, sellerDbName,　__cloudDBName, sellerReturnInfoGuids);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        }
    };

    return dbService;
};
