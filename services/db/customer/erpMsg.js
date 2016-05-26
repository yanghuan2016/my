var logger = global.__logService;
var connection = global.__mysql;
var sprintf = require("sprintf-js").sprintf;
var underscore = require("underscore");
var moment=require('moment');

var SQL_CT_ERPMSG_CREATE_ONE = "" +
    "INSERT INTO %s.ErpMsg " +
    "( userId, userType, version, msgId, msgType, msgData, msgRoute, handleStatus) " +
    "VALUES " +
    "( %d,     '%s',     '%s',    '%s',  '%s',    '%s',    '%s',     '%s');";

var SQL_CT_SELECT_LICENSENO_BY_GOODSNO =
    " SELECT licenseNo From %s.GoodsInfo " +
    " WHERE goodsNo = '%s' ;";

var SQL_CT_SELECT_SELLERID_BY_ERPCODE =
    " SELECT id,enterpriseId From %s.ClientSellerInfo " +
    " WHERE erpCode = '%s' ;";

function DBService(connection) {
    this.connection = connection;
}


DBService.prototype.getSellerOrderByOrderId=function(customerDbName,orderId,callback){
    logger.enter();
    var sql="" +
        "SELECT " +
        "   SellerOrderInfo.guid," +
        "   billNO," +
        "   DATE_FORMAT(billDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS billDate," +
        "   buyerCode," +
        "   buyerName," +
        "   consigneeName," +
        "   consigneeAddress," +
        "   consigneeMobileNum," +
        "   buyerEmployeeCode," +
        "   buyerEmployeeName," +
        "   sellerEmployeeName," +
        "   DATE_FORMAT(usefulDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS usefulDate," +
        "   DATE_FORMAT(advGoodsArriveDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS advGoodsArriveDate," +
        "   SellerOrderInfo.remark AS remark," +
        "   isConfirmed," +
        "   confirmRemark," +
        "   confirmDate," +
        "   isClosed," +
        "   closeRemark," +
        "   closeDate, " +
        "" +
        "   sellerGoodsNo," +
        "   quantity," +
        "   SellerOrderDetail.price," +
        "   SellerOrderDetail.licenseNo," +
        "   amountTax," +
        "   SellerOrderDetail.unicode," +
        "   SellerOrderDetail.packageQty, " +
        "" +
        "   GoodsInfo.id AS goodId," +
        "   commonName," +
        "   alias," +
        "   producer," +
        "   spec," +
        "   imageUrl," +
        "   drugsType " +
        "FROM " +
        "   %s.SellerOrderInfo " +
        "LEFT JOIN " +
        "   %s.SellerOrderDetail ON SellerOrderInfo.guid=SellerOrderDetail.orderInfoGuid " +
        "LEFT JOIN " +
        "   %s.GoodsInfo ON SellerOrderDetail.unicode=GoodsInfo.unicode  " +
        "WHERE billNO='%s'";

    sql=sprintf(sql,customerDbName,customerDbName,customerDbName,orderId);
    logger.sql(sql);
    __mysql.query(sql,function(err,results){
        if(err){
            logger.error(err);
            callback(err);
        }else{
            callback(err,results);
        }

    });


};


 DBService.prototype.getSellerOrderDetailsByGuid=function(customerDbName,guid,callback){
     logger.enter();
     var sql="" +
         "SELECT " +
         "" +
         "   SellerOrderDetail.sellerGoodsNo," +
         "   SellerOrderDetail.quantity," +
         "   SellerOrderDetail.price," +
         "   SellerOrderDetail.licenseNo," +
         "   SellerOrderDetail.amountTax," +
         "   SellerOrderDetail.unicode," +
         "   SellerOrderDetail.packageQty, " +
         "" +
         "   GoodsInfo.id AS goodId," +
         "   GoodsInfo.commonName," +
         "   GoodsInfo.alias," +
         "   GoodsInfo.producer," +
         "   GoodsInfo.spec," +
         "   GoodsInfo.imageUrl," +
         "   GoodsInfo.drugsType " +
         "FROM " +
         "   %s.SellerOrderDetail  " +
         "LEFT JOIN  " +
         "  %s.GoodsInfo ON SellerOrderDetail.unicode = GoodsInfo.unicode " +
         "WHERE " +
         "   SellerOrderDetail.orderInfoGuid = '%s' ;";
         sql=sprintf(sql,customerDbName,customerDbName,guid);
         logger.sql(sql);
         __mysql.query(sql,function(err,results){
             if(err){
                 logger.error(err);
                 callback(err);
             }else{
                 callback(err,results);
             }

         });
 };

 DBService.prototype.getSellerOrderInfo=function(customerDbName,filterCondition,callback){

    var startTime=filterCondition.startTime,
        endTime=filterCondition.endTime,
        keywords=filterCondition.keywords,
        pageIndex=filterCondition.pageIndex,
        pageSize=filterCondition.pageSize;
    logger.enter();
    var sql="" +
        "SELECT " +
        "   guid," +
        "   billNO," +
        "   DATE_FORMAT(billDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS billDate," +
        "   buyerCode," +
        "   buyerName," +
        "   consigneeName," +
        "   consigneeAddress," +
        "   consigneeMobileNum," +
        "   buyerEmployeeCode," +
        "   buyerEmployeeName," +
        "   sellerEmployeeName," +
        "   DATE_FORMAT(usefulDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS usefulDate," +
        "   DATE_FORMAT(advGoodsArriveDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS advGoodsArriveDate," +
        "   remark," +
        "   isConfirmed," +
        "   confirmRemark," +
        "   confirmDate," +
        "   isClosed," +
        "   closeRemark," +
        "   closeDate " +
        "FROM " +
        "   %s.SellerOrderInfo " +
        "   %s "+ //whereStr
        "   %s;";   //limitStr

        var whereStr="",
            limitStr="";

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
        if(keywords!=""&&whereStr.indexOf('WHERE')==-1){
            whereStr+= sprintf(" WHERE (billNO LIKE '%%%s%%' OR buyerName LIKE  '%%%s%%'  ) ",keywords,keywords);
        }else if(keywords!=""&&whereStr.indexOf('WHERE')!=-1){
            whereStr+= sprintf(" AND (billNO LIKE  '%%%s%%'  OR buyerName LIKE  '%%%s%%'  ) ",keywords,keywords);
        }
        limitStr+=sprintf(" limit %s,%s",(pageIndex-1)*pageSize,pageSize);

        sql=sprintf(sql,customerDbName,whereStr,limitStr);
        logger.sql(sql);
        __mysql.query(sql,function(err,results){
            if(err){
                logger.error(err);
                callback(err);
            }else{
                callback(err,results);
            }

        });

};

DBService.prototype.getBuyerOrderByOrderId=function(customerDbName,orderId,callback){
    logger.enter();

    var sql="" +
        "SELECT " +
        "   BuyerOrderInfo.guid," +
        "   billNO," +
        "   DATE_FORMAT(billDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS billDate," +
        "   sellerCode," +
        "   sellerName," +
        "   consigneeName," +
        "   consigneeAddress," +
        "   consigneeMobileNum," +
        "   buyerEmployeeCode," +
        "   buyerEmployeeName," +
        "   sellerEmployeeName," +
        "   DATE_FORMAT(usefulDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS usefulDate," +
        "   DATE_FORMAT(advGoodsArriveDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS advGoodsArriveDate," +
        "   remark AS remark," +
        "   isConfirmed," +
        "   confirmRemark," +
        "   confirmDate," +
        "   isClosed," +
        "   closeRemark," +
        "   closeDate, " +
        "" +
        "   buyerGoodsNo," +
        "   quantity," +
        "   inPrice," +
        "   BuyerOrderDetail.licenseNo," +
        "   amountTax," +
        "   BuyerOrderDetail.unicode," +
        "   BuyerOrderDetail.packageQty, " +
        "" +
        "   GoodsInfo.id AS goodId," +
        "   commonName," +
        "   alias," +
        "   producer," +
        "   spec," +
        "   imageUrl," +
        "   drugsType " +
        "FROM " +
        "   %s.BuyerOrderInfo " +
        "LEFT JOIN " +
        "   %s.BuyerOrderDetail ON BuyerOrderInfo.guid=BuyerOrderDetail.orderInfoGuid " +
        "LEFT JOIN " +
        "   %s.GoodsInfo ON BuyerOrderDetail.unicode=GoodsInfo.unicode  " +
        "WHERE billNO='%s'";

    sql=sprintf(sql,customerDbName,customerDbName,customerDbName,orderId);
    logger.sql(sql);
    __mysql.query(sql,function(err,results){
        if(err){
            logger.error(err);
            callback(err);
        }else{
            callback(err,results);
        }

    });
};
DBService.prototype.getBuyerOrderDetailsByGuid=function(customerDbName,guid,callback){
    logger.enter();
    var sql="" +
        "SELECT " +
        "" +
        "   BuyerOrderDetail.buyerGoodsNo," +
        "   BuyerOrderDetail.quantity," +
        "   BuyerOrderDetail.inPrice," +
        "   BuyerOrderDetail.licenseNo," +
        "   BuyerOrderDetail.amountTax," +
        "   BuyerOrderDetail.unicode," +
        "   BuyerOrderDetail.packageQty, " +
        "" +
        "   GoodsInfo.id AS goodId," +
        "   GoodsInfo.commonName," +
        "   GoodsInfo.alias," +
        "   GoodsInfo.producer," +
        "   GoodsInfo.spec," +
        "   GoodsInfo.imageUrl," +
        "   GoodsInfo.drugsType " +
        "FROM " +
        "   %s.BuyerOrderDetail " +
        "LEFT JOIN " +
        "   %s.GoodsInfo ON BuyerOrderDetail.unicode=GoodsInfo.unicode " +
        "WHERE " +
        "   BuyerOrderDetail.orderInfoGuid = '%s' ";
    sql=sprintf(sql,customerDbName,customerDbName,guid);
    logger.sql(sql);
    __mysql.query(sql,function(err,results){
        if(err){
            logger.error(err);
            callback(err);
        }else{
            callback(err,results);
        }

    });
};


DBService.prototype.getBuyerOrderInfo=function(customerDbName,filterCondition,callback){
    logger.enter();

    var startTime=filterCondition.startTime,
        endTime=filterCondition.endTime,
        keywords=filterCondition.keywords,
        pageIndex=filterCondition.pageIndex,
        pageSize=filterCondition.pageSize;

    var sql="" +
        "SELECT " +
        "   guid," +
        "   billNO," +
        "   DATE_FORMAT(billDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS billDate," +
        "   sellerCode," +
        "   sellerName," +
        "   consigneeName," +
        "   consigneeAddress," +
        "   consigneeMobileNum," +
        "   buyerEmployeeCode," +
        "   buyerEmployeeName," +
        "   sellerEmployeeName," +
        "   DATE_FORMAT(usefulDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS usefulDate," +
        "   DATE_FORMAT(advGoodsArriveDate,'%%Y-%%m-%%d %%H:%%i:%%s') AS advGoodsArriveDate," +
        "   remark," +
        "   isConfirmed," +
        "   confirmRemark," +
        "   confirmDate," +
        "   isClosed," +
        "   closeRemark," +
        "   closeDate " +
        "FROM " +
        "   %s.BuyerOrderInfo " +
        "   %s"+// where
        "   %s";// limit
        var whereStr="",
            limitStr="";

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
        if(keywords!=""&&whereStr.indexOf('WHERE')==-1){
            whereStr+= sprintf(" WHERE (billNO LIKE '%%%s%%' OR sellerName LIKE  '%%%s%%'  ) ",keywords,keywords);
        }else if(keywords!=""&&whereStr.indexOf('WHERE')!=-1){
            whereStr+= sprintf(" AND (billNO LIKE  '%%%s%%'  OR sellerName LIKE  '%%%s%%'  ) ",keywords,keywords);
        }
        limitStr+=sprintf(" limit %s,%s", (pageIndex-1)*pageSize,pageSize);

        sql=sprintf(sql,customerDbName,whereStr,limitStr);
        logger.sql(sql);
        __mysql.query(sql,function(err,results){
            if(err){
                logger.error(err);
                callback(err);
            }else{
                callback(err,results);
            }

        });
};

DBService.prototype.updateErpMsgOutByMsgId = function (customerDbName, msgId, erpFeedback, erpFeedbackStatus, callback) {
    logger.enter();
    var sql = "" +
        "update " +
        "   %s.ErpMsgOut " +
        "set " +
        "   erpFeedback = '%s', " +
        "   erpFeedbackStatus = %d " +
        "where " +
        "   msgId = '%s'; ";
    sql = sprintf(sql, customerDbName, erpFeedback, erpFeedbackStatus, msgId);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, result);
    });
};

DBService.prototype.insertErpMsgOut = function (customerDbName, erpMsgOutInfo, callback) {
    logger.enter();

    var sql = "" +
        "insert into " +
        "   %s.ErpMsgOut(" +
        "       version, " +
        "       msgId, " +
        "       isEDIMsg, " +
        "       erpMsgInMsgId, " +
        "       msgType, " +
        "       msgData, " +
        "       enterpriseId, " +
        "       enterpriseType, " +
        "       erpMsgUrl, " +
        "       erpAppCodeUrl, " +
        "       appKey) " +
        "values(" +
        "   '%s', " +   // version
        "   '%s', " +   // msgId
        "   %d, " +     // isEDIMsg
        "   '%s', " +   // erpMsgInMsgId
        "   '%s', " +   // msgType
        "   '%s', " +   // msgData
        "   %d, " +     // enterpriseId
        "   '%s', " +   // enterpriseType
        "   '%s', " +   // erpMsgUrl
        "   '%s', " +   // erpAppCodeUrl
        "   '%s') " +   // appKey
        "on duplicate key " +
        "update " +
        "   appKey = values(appKey), " +
        "   erpFeedback = '', " +
        "   erpFeedbackStatus = 0, " +
        "   appCodeValidity = 0 ;";
    sql = sprintf(
        sql,
        customerDbName,
        erpMsgOutInfo.version,
        erpMsgOutInfo.msgId,
        erpMsgOutInfo.isEDIMsg,
        erpMsgOutInfo.erpMsgInMsgId,
        erpMsgOutInfo.msgType,
        erpMsgOutInfo.msgData.replace(/'/g,'@@@'),
        erpMsgOutInfo.enterpriseId,
        erpMsgOutInfo.enterpriseType,
        erpMsgOutInfo.erpMsgUrl,
        erpMsgOutInfo.erpAppCodeUrl,
        erpMsgOutInfo.appKey
    );

    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};
DBService.prototype.listBuyerInfo = function(dbName,erpCode,callback){
    logger.enter();
    var SQL = " SELECT id,enterpriseId,enabled, erpCode,businessLicense " +
        "   From %s.ClientBuyerInfo WHERE erpCode = '%s' ;";
    var sql = sprintf(SQL, dbName, erpCode);
    logger.sql(sql);
    //this.connection.query(sql, function (error, result) {
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.listBuyerInfoById = function(dbName,enterpriseId,callback){
    logger.enter();
    var SQL = " SELECT id,enterpriseId,enabled, erpCode,businessLicense " +
        "   From %s.ClientBuyerInfo WHERE enterpriseId = %d ;";
    var sql = sprintf(SQL, dbName, enterpriseId);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};


DBService.prototype.listSupplierInfo = function(dbName,erpCode,callback){
    logger.enter();
    var SQL = " SELECT id,enterpriseId,enabled, erpCode,businessLicense " +
        "   From %s.ClientSellerInfo WHERE erpCode = '%s' ;";
    var sql = sprintf(SQL, dbName, erpCode);
    logger.sql(sql);
    //this.connection.query(sql, function (error, result) {
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.insertErpMsgIn = function(dbName,insertData,callback){
    logger.enter();
    var SQL = " INSERT INTO %s.ErpMsgIn (version,msgId,msgType,isEDIMsg,appCodeValidity,msgData,enterpriseId) " +
        "   VALUES ('%s','%s','%s',%s,%s,'%s',%d)";
    var sql = sprintf(SQL,dbName,insertData.version,insertData.msgId,insertData.msgType,
            insertData.isEDIMsg,insertData.appCodeValidity,insertData.msgData,
            insertData.enterpriseId);
    logger.sql(sql);
    //this.connection.query(sql, function (error, result) {
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};



DBService.prototype.createErpMsg = function (dbName, userId, userType, version, msgId, msgType, msgData, msgRoute, handleStatus, callback) {
    logger.enter();

    var sql = sprintf(SQL_CT_ERPMSG_CREATE_ONE, dbName, userId, userType, version, msgId, msgType, msgData, msgRoute, handleStatus);

    logger.sql(sql);

    //this.connection.query(sql, function (error, result) {
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.getlicenseNoByGoodsNo = function (connect,dbName, goodsNo,  callback) {
    logger.enter();

    var sql = sprintf(SQL_CT_SELECT_LICENSENO_BY_GOODSNO, dbName,goodsNo);

    logger.sql(sql);

    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.getSellerIdByErpCode = function(connect,dbName,sellerERPcode,callback){
    logger.enter();
    var sql = sprintf(SQL_CT_SELECT_SELLERID_BY_ERPCODE, dbName,sellerERPcode);
    logger.sql(sql);
    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};


var SQL_CT_INSERT_INQUIRY = "INSERT INTO %s.Inquiry (guid) " +
    " VALUES ('%s')  " +
    " ON DUPLICATE KEY UPDATE guid=VALUES(guid) ;";

DBService.prototype.addInquiry = function(connect,dbName, guid, callback){

    var sql = sprintf(SQL_CT_INSERT_INQUIRY, dbName,guid);
    logger.sql(sql);
    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

var SQL_CT_INSERT_INQUIRY = "INSERT INTO %s.%s (guid) " +
    " VALUES ('%s') ;";

DBService.prototype.insertInquiry = function(connect,dbName,tableName, guid, callback){

    var sql = sprintf(SQL_CT_INSERT_INQUIRY, dbName,tableName,guid);
    logger.sql(sql);
    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

var SQL_CT_INSERT_INQUIRY_DETAILS = "INSERT INTO %s.%s " +
    " (inquiryId,unicode,packageQty,billNo,licenseNo,lastErpPrice,objectId,inquiryQuantity,purchaseUpset,clearingPeriod," +
    "  inquiryExpire,quotationExpire) " +
    " VALUES (%d,'%s',%f,'%s', '%s',%f, %d, %f, %f, '%s', " +
    "   DATE_ADD(CURDATE(), INTERVAL 7 DAY),  DATE_ADD(CURDATE(), INTERVAL 30 DAY))  " +
    " ON DUPLICATE KEY UPDATE inquiryId=VALUES(inquiryId),unicode=VALUES(unicode),packageQty=VALUES(packageQty)," +
    " licenseNo=VALUES(licenseNo),lastErpPrice=VALUES(lastErpPrice), objectId=VALUES(objectId)," +
    " inquiryQuantity =VALUES(inquiryQuantity),purchaseUpset=VALUES(purchaseUpset),clearingPeriod=VALUES(clearingPeriod)," +
    " inquiryExpire=VALUES(inquiryExpire),quotationExpire=VALUES(quotationExpire);";


DBService.prototype.addInquiryDetails = function(connect,dbName,tableName,inquiryId,unicode,packageQty,billNo,licenseNo,lastErpPrice,objectId,planQuantity,purchaseset,balancePeriod,callback){

    var sql = sprintf(SQL_CT_INSERT_INQUIRY_DETAILS,
        dbName,tableName,inquiryId,unicode,packageQty,billNo,licenseNo,lastErpPrice,objectId,planQuantity,purchaseset,balancePeriod);
    logger.sql(sql);
    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.getPackageQty= function(connect,dbName,unicode,callback){
    var SQL = " SELECT id, packageQty,licenseNo,goodsNo " +
        "   From %s.GoodsInfo WHERE unicode = '%s' ;";
    var sql = sprintf(SQL,dbName, unicode);
    logger.sql(sql);
    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.getBuyerOrSellerInfoById = function(connect,cloudDB,enterpriseId,callback) {
    var SQL_CT_GET_BUYER_SELLER_INFO = " SELECT " +
        " Customer.customerName as buyerName, " +
        " Customer.businessLicense as businessLicense,  " +
        " Customer.enabled as enabled,  " +
        " Customer.customerDBSuffix as dbSuffix  " +
        " From %s.Customer " +
        " WHERE Customer.id = %d ;";

    var sql = sprintf(SQL_CT_GET_BUYER_SELLER_INFO, cloudDB, enterpriseId);
    logger.sql(sql);
    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.listSupplierInfoById= function(dbName,enterpriseId,callback){
    var SQL = " SELECT id,enterpriseId,enabled, erpCode " +
        "   From %s.ClientSellerInfo WHERE enterpriseId = %d ;";
    var sql = sprintf(SQL,dbName, enterpriseId);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};
DBService.prototype.listSupplierInfoByLicenseNo= function(dbName,licenseNo,callback){
    var SQL = " SELECT id,enterpriseId,enabled, erpCode " +
        "   From %s.ClientSellerInfo WHERE businessLicense = '%s' ;";
    var sql = sprintf(SQL,dbName, licenseNo);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.listClientBuyerInfoBylicenseNo = function(dbName,licenseNo,callback){
    var SQL = " SELECT id,enterpriseId,enabled, erpCode " +
        "   From %s.ClientBuyerInfo WHERE businessLicense = '%s' ;";
    var sql = sprintf(SQL,dbName, licenseNo);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};


DBService.prototype.getGoodsNoByPZWH = function(dBName,PZWH,callback){
    var SQL = "SELECT goodsNo FROM %s.GoodsInfo " +
        "   WHERE licenseNo  = '%s' ;";
    var sql = sprintf(SQL,dBName,PZWH);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};


DBService.prototype.getPZWHfromBuyerByHH = function(dBName,HH,callback){
    var SQL = "SELECT licenseNo FROM %s.GoodsInfo " +
        "   WHERE goodsNo  = '%s' ;";
    var sql = sprintf(SQL,dBName,HH);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};


DBService.prototype.getClientCodeBylicenseNo = function(dBName,businessLicense,callback){
    var SQL = "SELECT clientCode FROM %s.Client,%s.ClientGsp " +
        "   WHERE Client.id = ClientGsp.clientId AND " +
        "   ClientGsp.businessLicense  = '%s' ;";
    var sql = sprintf(SQL,
        dBName,dBName, businessLicense);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};
DBService.prototype.getClientCodeBylicenseNoFromClientBuyerInfo = function(dBName,businessLicense,callback){
    var SQL = "SELECT erpCode as clientCode FROM %s.ClientBuyerInfo " +
        "   where businessLicense  = '%s' ;";
    var sql = sprintf(SQL,
        dBName, businessLicense);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

var SQL_CT_INSERT_QUOTATION = "INSERT INTO %s.QuotationDetails " +
    " (inquiryId,buyerId,buyerName,licenseNo,lastErpPrice,inquiryQuantity,inquiryExpire,quotationExpire,clearingPeriod) " +
    " VALUES (%d,%d, '%s', '%s', %f,%f,DATE_ADD(CURDATE(), INTERVAL 7 DAY),  DATE_ADD(CURDATE(), INTERVAL 30 DAY), '%s')  " +
    " ON DUPLICATE KEY UPDATE inquiryId=VALUES(inquiryId),buyerId=VALUES(buyerId),buyerName=VALUES(buyerName),licenseNo=VALUES(licenseNo)," +
    " lastErpPrice=VALUES(lastErpPrice),inquiryExpire=VALUES(inquiryExpire),quotationExpire=VALUES(quotationExpire), " +
    " inquiryQuantity=VALUES(inquiryQuantity), clearingPeriod=VALUES(clearingPeriod) ;";


DBService.prototype.addQuotataion = function(connect,dbName,inquiryId,buyerId,buyerName,licenseNo,lastErpPrice,inquiryQuantity,clearingPeriod,callback){
    var sql = sprintf(SQL_CT_INSERT_QUOTATION,
        dbName,inquiryId,buyerId,buyerName,
        licenseNo,lastErpPrice,inquiryQuantity,clearingPeriod);

    logger.sql(sql);
    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

var SQL_CT_SELECT_CUSTOMERNAME = " SELECT customerName From %s.Customer WHERE id = %d;";


DBService.prototype.getCustomerNameById = function(connect,cloudDBName,customerId,callback){
    var sql = sprintf(SQL_CT_SELECT_CUSTOMERNAME, cloudDBName,customerId);
    logger.sql(sql);
    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result[0]);
        }
    })
};

var SQL_CT_SELECT_INQUIRYID = " SELECT id From %s.%s WHERE guid = '%s';";


DBService.prototype.getInquiryId = function(connect,dBName,tableName,guid,callback){
    var sql = sprintf(SQL_CT_SELECT_INQUIRYID,dBName,tableName,guid);
    logger.sql(sql);
    connect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result[0]);
        }
    })
};

var SQL_CT_SELECT_INQUIRYDETAILS_BY_ID = "" +
    " SELECT inquiryId,licenseNo ,sellerId, inquiryExpire, inquiryQuantity, purchaseUpset, lastErpPrice, quotationPrice, " +
    "       quotationQuantity, quotationExpire, clearingPeriod ," +
    " DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn, " +
    " DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
    " FROM %s.InquiryDetails " +
    " WHERE inquiryId = %d ;";

DBService.prototype.listInquiryDetailsById = function(customerDBName,inquiryId,callback){
    var sql = sprintf(SQL_CT_SELECT_INQUIRYDETAILS_BY_ID, customerDBName,inquiryId);
    logger.sql(sql);
    __mysql.query(sql, function (error, results) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, results);
        }
    })
};



var SQL_CT_UPDATE_QUOTATION = "INSERT INTO %s.QuotationDetails (inquiryId,buyerId,licenseNo,quotationQuantity,quotationPrice,quotationExpire) " +
    " VALUES ? " +
    " ON DUPLICATE KEY UPDATE inquiryId=VALUES(inquiryId),buyerId=VALUES(buyerId),licenseNo=VALUES(licenseNo), " +
    " quotationQuantity=VALUES(quotationQuantity),quotationPrice=VALUES(quotationPrice),quotationExpire=VALUES(quotationExpire);";


DBService.prototype.updateQuotationResult = function(connect,dbName,quotationResults,callback){
    logger.debug(JSON.stringify(quotationResults));
    var insertOndupData = [];
    underscore.map(quotationResults,function(item){
            insertOndupData.push(underscore.values(item));
        }
    );
    logger.debug(JSON.stringify(insertOndupData));
    var sql = sprintf(SQL_CT_UPDATE_QUOTATION, dbName);
    logger.sql(sql);
    connect.query(sql, [insertOndupData],function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};


var SQL_CT_SELECT_QUOTATIONDETAILS_BY_ID = "" +
    " SELECT " +
    " QuotationDetails.inquiryId," +
    " QuotationDetails.licenseNo, " +
    " QuotationDetails.buyerId, " +
    " QuotationDetails.inquiryQuantity, " +
    " QuotationDetails.quotationPrice, " +
    " QuotationDetails.quotationQuantity, " +
    " QuotationDetails.lastErpPrice, " +
    " GoodsInfo.goodsNo AS HH," +
    " ClientBuyerInfo.erpCode AS GYS"+
    " FROM %s.QuotationDetails " +
    " LEFT JOIN %s.GoodsInfo ON GoodsInfo.licenseNo=QuotationDetails.licenseNo  " +
    " LEFT JOIN %s.ClientBuyerInfo ON ClientBuyerInfo.enterpriseId = QuotationDetails.buyerId " +
    " WHERE QuotationDetails.inquiryId = %d AND QuotationDetails.licenseNo = '%s' AND QuotationDetails.buyerId = %d ;";

DBService.prototype.listQuotationDetails = function(sellerDBName,customerDBName,inquiryId,licenseNo ,buyerId,callback){
    var sql = sprintf(SQL_CT_SELECT_QUOTATIONDETAILS_BY_ID,
        sellerDBName,customerDBName,sellerDBName,
        inquiryId,licenseNo ,buyerId);
    logger.sql(sql);
    __mysql.query(sql, function (error, results) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, results);
        }
    })
};

var SQL_CT_SELECT_BUYERINFO_BY_ID = " SELECT " +
    " customerDBSuffix as dbSuffix " +
    " FROM %s.Customer " +
    " WHERE id = %d";

DBService.prototype.getBuyerInfoById = function(cloudDB,buyerId,callback){
    var sql = sprintf(SQL_CT_SELECT_BUYERINFO_BY_ID,
        cloudDB ,buyerId);
    logger.sql(sql);
    __mysql.query(sql, function (error, results) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, results);
        }
    })
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


/**
 * use:
 *  var sqlObj =parseInsertInfo(insertData)
 *  var SQL = " INSERT INTO %s.tableName (%s) VALUES (%s);";
 *  var sql = sprintf(SQL,dbName,sqlStrObj.keys,sqlStrObj.values);
 * @param data
 * @returns {{keys: string, values: string}}
 */
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

module.exports = new DBService(connection);

