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
 * database service module: goods.js
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-25    hc-romens@issue#45
 *
 */
module.exports=function() {

    /**
     * system service handles
     */
    var logger = global.__logService;
    var db = global.__mysql;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");

    /**
     * project modules
     */

    /**
     * SQL for customer DB, abbr. SQL_CT_***
     */


    /**
     *Insert Action
     */
    var SQL_CT_INSERT_ORDERINFO = "INSERT INTO %s.OrderInfo (operatorId, clientId, consigneeAddress, remark) " +
        "VALUES (%d, %d, '%s', '%s');";

    var SQL_CT_INSERT_BATCH_ORDERINFO = "INSERT INTO %s.OrderInfo (operatorId, clientId,  consigneeAddress, remark, total, paymentType, clientSignature, hasReceipt, receiptTitle) " +
        "VALUES ? ";

    var SQL_CT_SET_DISPLAY_ORDERID = "UPDATE %s.OrderInfo SET displayOrderId=? WHERE id=?;";
    var SQL_CT_INSERT_ORDERDETAILS = "INSERT INTO %s.OrderDetails(orderId, goodsId, soldPrice, quantity, amount, remark) " +
        "VALUES (%d, %d, %f, %d, %f, '%s');";

    var SQL_CT_BATCH_INSERT_ORDERDETAILS = "INSERT INTO %s.OrderDetails(orderId, goodsId, soldPrice, quantity, amount, pricePlan, remark) " +
        "VALUES ? ";
    var SQL_CT_INSERT_ORDERHISTORY = "INSERT INTO %s.OrderHistory (%s) " +
        "VALUES (%s);";

    var SQL_CT_INSERT_ORDERHISTORY_SIMPLE = "INSERT INTO %s.OrderHistory (clientId, operatorId, orderId,action, remark  ) " +
        "VALUES ? ;";

    var SQL_CT_SAVE_ORDERDETAILS_TO_CART =
        "INSERT INTO %s.Cart(clientId, goodsId, quantity, remark) " +
        "     VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "     quantity=VALUES(quantity), remark=VALUES(remark);";

    /**
     *Select Action
     */
    //select orderinfo by clientId
    var SQL_CT_SELECT_ORDERINFO = "SELECT " +
        "OrderInfo.id," +
        "OrderInfo.displayOrderId, " +
        "OrderInfo.clientId," +
        "OrderInfo.operatorId, " +
        "OrderInfo.consigneeName, " +
        "OrderInfo.consigneeAddress, " +
        "OrderInfo.consigneeMobileNum, " +
        "OrderInfo.total, "+
        "OrderInfo.status, " +
        "OrderInfo.paymentType, "+
        "OrderInfo.paymentStatus, "+
        "(SELECT COUNT(ReturnInfo.id) FROM %s.ReturnInfo WHERE ReturnInfo.orderId = OrderInfo.id) AS returnSize, " +
        "DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdTime," +//orderInfo
        "OrderInfo.remark " +
        "FROM %s.OrderInfo " +
        "%s" +                            // Where clause
        "%s " +                           // Order By clause
        "%s;";                           // Limit clause

    var SQL_CT_SELECT_ORDERINFO_BY_DISPLAYID = "SELECT " +
        "id, " +
        "displayOrderId, " +
        "clientId, " +
        "operatorId, " +
        "clientCategory, " +
        "clientSignature, " +
        "customerSignature, " +
        "consigneeName, " +
        "consigneeAddress, " +
        "consigneeMobileNum, " +
        "paymentStatus, " +
        "paymentType, " +
        "promotionSum, " +
        "freight, " +
        "total, " +
        "status, " +
        "remark, " +
        "hasRefund, " +
        "hasReceipt, " +
        "receiptTitle, " +
        "DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdTime " +
        "FROM %s.OrderInfo " +
        "WHERE displayOrderId = '%s' " +
        "%s " +                    // Where clause
        "%s " +                  // Order By clause
        "%s;";                  // Limit clause

    var SQL_CT_SELECT_ORDERINFO_BY_ID = "SELECT " +
        "id, " +
        "displayOrderId, " +
        "clientId, " +
        "operatorId, " +
        "clientCategory, " +
        "clientSignature, " +
        "customerSignature, " +
        "consigneeName, " +
        "consigneeAddress, " +
        "consigneeMobileNum, " +
        "paymentStatus, " +
        "paymentType, " +
        "promotionSum, " +
        "freight, " +
        "total, " +
        "status, " +
        "remark, " +
        "hasRefund, " +
        "hasReceipt, " +
        "receiptTitle, " +
        "DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdTime " +
        "FROM %s.OrderInfo " +
        "WHERE id = %s " +
        "%s " +                    // Where clause
        "%s " +                  // Order By clause
        "%s;";                  // Limit clause

    var SQL_CT_SELECT_ORDERINFO_PAYMENT = "SELECT " +
        "id, " +
        "displayOrderId, " +
        "clientId, " +
        "operatorId, " +
        "clientCategory, " +
        "clientSignature, " +
        "customerSignature, " +
        "consigneeName, " +
        "consigneeAddress, " +
        "consigneeMobileNum, " +
        "paymentType, " +
        "total, " +
        "status, " +
        "remark, " +
        "DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdTime " +
        "FROM %s.OrderInfo " +
        "WHERE id = %s " +
        "%s " +                    // Where clause
        "%s " +                  // Order By clause
        "%s;";                  // Limit clause

    var SQL_APPLY_RETURN = " SELECT id, displayReturnId, remark as applyReturnRemak FROM %s.ReturnInfo " +
        " WHERE ReturnInfo.orderId =%d ;";

    var SQL_CT_SELECT_ORDER_SHIP_INFO = "SELECT " +
        "OrderInfo.id as orderId, " +
        "OrderInfo.displayOrderId, " +
        "ShipInfo.id as shipId, " +
        "SUM(ShipDetails.quantity) as quantity, " +
        "ShipDetails.goodsId as goodsId " +
        "FROM %s.OrderInfo  " +
        "CROSS JOIN %s.ShipInfo " +
        "CROSS JOIN %s.ShipDetails " +
        "WHERE OrderInfo.id = %d AND ShipInfo.id=%d AND ShipInfo.orderId = OrderInfo.id AND ShipDetails.shipId = ShipInfo.id " +
        "GROUP BY goodsId;";

    var SQL_CT_SELECT_SUM_RETURN_INFO = "SELECT SUM( CASE " +
        "   WHEN ReturnInfo.status='CREATED' THEN ReturnDetails.quantity " +
        "   WHEN ReturnInfo.status='APPROVED' THEN ReturnDetails.approvedQuantity " +
        "   WHEN ReturnInfo.status='SHIPPED' THEN ReturnDetails.returnQuantity " +
        "   WHEN ReturnInfo.status='DELIVERED' THEN ReturnDetails.returnQuantity " +
        "   END " +
        ") as quantity, ReturnDetails.goodsId," +
        "ReturnInfo.shipId as shipId, " +
        "ReturnDetails.orderId from %s.ReturnDetails,%s.ReturnInfo  " +
        "where ReturnDetails.orderId = %d " +
        "AND ReturnDetails.returnId = ReturnInfo.id " +
        "AND ReturnInfo.shipId = %d " +
        "AND ReturnInfo.status<>'ClOSED'" +
        "AND ReturnInfo.status<>'REJECTED' " +
        "GROUP BY goodsId; ";

    var SQL_CT_ORDERQTY_SELECT = "SELECT quantity, goodsId,shippedQuantity  " +
        "FROM %s.OrderDetails " +
        "WHERE orderId=%d;";

    var SQL_CT_SHIPPEDORDERQTY_SELECT = "SELECT shippedQuantity , quantity as totalQuantity , soldPrice as soldPrice  " +
        "FROM %s.OrderDetails " +
        "WHERE orderId=%d AND goodsId = %d";

    //select all orders info for customer order page
    var SQL_CT_SELECT_ALL_ORDERINFO = "SELECT distinct " +
        "OrderInfo.id AS id, " +
        "OrderInfo.displayOrderId, " +
        "OrderInfo.clientId AS clientId, " +
        "Client.clientName AS clientName, " +
        "OrderInfo.consigneeName AS consigneeName, " +
        "OrderInfo.consigneeAddress AS consigneeAddress, " +
        "OrderInfo.consigneeMobileNum AS consigneeMobileNum, " +
        "OrderInfo.paymentType AS paymentType, " +
        "OrderInfo.paymentStatus AS paymentStatus, " +
        "OrderInfo.status AS status, " +
        "OrderInfo.total AS total, " +
        "OrderInfo.remark AS remark," +
        "(SELECT COUNT(ReturnInfo.id) FROM %s.ReturnInfo WHERE ReturnInfo.orderId = OrderInfo.id) AS returnSize, " +
        "DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderTime," +//orderInfo
        "Operator.operatorName as operatorName " +
        "FROM %s.OrderInfo " +
        "LEFT JOIN %s.Operator ON (OrderInfo.clientId=Operator.clientId AND OrderInfo.operatorId=Operator.id) " +
        "LEFT JOIN %s.Client ON (OrderInfo.clientId=Client.id) " +
        "%s" +                           // Where clause
        "%s " +                           // Order By clause
        "%s;";                           // Limit clause

    //select orderInfo for customer order pending page
    var SQL_CT_SELECT_ORDER_PENDINGINFO = "SELECT " +
        "OrderInfo.id AS id," +
        "OrderInfo.displayOrderId, " +
        "OrderInfo.clientId AS clientId," +
        "OrderInfo.status AS status, " +
        "OrderInfo.paymentType AS paymentType, " +
        "OrderInfo.paymentStatus AS paymentStatus, " +
        "OrderInfo.hasRefund AS hasRefund, " +
        "OrderInfo.promotionSum AS promotionSum, " +
        "OrderInfo.freight AS freight, " +
        "OrderInfo.total AS total, " +
        "OrderInfo.consigneeName AS consigneeName, " +
        "OrderInfo.consigneeAddress AS consigneeAddress, " +
        "OrderInfo.consigneeMobileNum AS consigneeMobileNum, " +
        "OrderInfo.remark AS remark," +
        "OrderInfo.hasReceipt AS hasReceipt," +
        "OrderInfo.receiptTitle AS receiptTitle," +
        "DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderTime," +
        "OrderDetails.soldPrice as soldPrice, " + //实际销售价格
        "OrderDetails.quantity as quantity, " +  //数量
        "OrderDetails.amount as amount, " +       //小计
        "OrderDetails.remark as goodsRemark, " +       //小计
        "GoodsInventory.amount as goodsInventory, " +
        "GoodsInventory.lockedAmount as lockedAmount, " +
        "GoodsInventory.actualAmount as actualAmount, " +
        "GoodsInfo.negSell as negSell," +  //负库存销售标志
        "GoodsInfo.goodsNo as goodsNo," +  //货号
        "GoodsInfo.measureUnit as measureUnit," +  //单位
        "OrderDetails.goodsId as goodsId " +
        "FROM %s.OrderInfo " +
        "LEFT JOIN %s.OrderDetails ON OrderInfo.id=OrderDetails.orderId " +
        "LEFT JOIN %s.GoodsInfo ON OrderDetails.goodsId=GoodsInfo.id " +
        "CROSS JOIN %s.GoodsInventory  " +
        "WHERE OrderInfo.id= %d " +
        "AND GoodsInventory.goodsId = OrderDetails.goodsId;";                   // Where clause

    //select orderInfo for customer order wating ship page
    var SQL_CT_SELECT_ORDER_WAITINGSHIP = "SELECT " +
        "OrderInfo.id AS id," +
        "OrderInfo.displayOrderId, " +
        "OrderInfo.clientId AS clientId," +
        "OrderInfo.status AS status, " +
        "OrderInfo.paymentStatus AS paymentStatus, " +
        "OrderInfo.paymentType AS paymentType, " +
        "OrderInfo.consigneeName AS consigneeName, " +
        "OrderInfo.consigneeAddress AS consigneeAddress, " +
        "OrderInfo.consigneeMobileNum AS consigneeMobileNum, " +
        "OrderInfo.remark AS remark," +
        "OrderInfo.hasReceipt AS hasReceipt," +
        "OrderInfo.receiptTitle AS receiptTitle," +
        "DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderTime," +
        "OrderDetails.soldPrice as soldPrice, " + //实际销售价格
        "OrderDetails.quantity as quantity, " +  //数量
        "OrderDetails.amount as amount, " +       //小计
        "GoodsInfo.commonName as commonName," +
        "GoodsInfo.imageUrl as imageUrl," +
        "GoodsInfo.alias as alias," +
        "GoodsInfo.licenseNo as licenseNo," +
        "GoodsInfo.goodsNo as goodsNo," +
        "GoodsInfo.producer as producer," +
        "GoodsInfo.measureUnit as measureUnit," +
        "GoodsInfo.largePackNum as largePackNum," +
        "GoodsInfo.measureUnit as largePackUnit," +
        "GoodsInfo.middlePackNum as middlePackNum," +
        "GoodsInfo.measureUnit as middlePackUnit," +
        "GoodsInfo.smallPackNum as smallPackNum," +
        "GoodsInfo.measureUnit as smallPackUnit," +
        "GoodsInfo.spec as spec," +
        "OrderDetails.goodsId as goodsId, " +
        "OrderDetails.shippedQuantity as shippedQuantity " +
        "FROM %s.OrderInfo " +
        "LEFT JOIN %s.OrderDetails ON OrderInfo.id=OrderDetails.orderId " +
        "LEFT JOIN %s.GoodsInfo ON goodsId = GoodsInfo.id " +
        "WHERE OrderInfo.id= %d;";                             // Where clause


    var SQL_CT_SELECT_SIMPLE_ORDERDETAIL = "" +
        "SELECT " +
        "OrderDetails.id            as detailno, " +
        "OrderDetails.orderId       as orderId, " +
        "OrderDetails.goodsId       as goodsId, " +
        "OrderDetails.pricePlan     as pricePlan, " +
        "OrderDetails.soldPrice     as soldPrice, " +
        "OrderDetails.quantity      as quantity, " +
        "OrderDetails.amount        as amount, " +
        "OrderDetails.remark        as remark" +
        " FROM %s.OrderDetails " +
        " WHERE OrderDetails.orderId = %d;";

    var SQL_CT_SELECT_ORDERDETAIL = "" +
        "SELECT " +
        "OrderDetails.id            as itemId, " +
        "OrderDetails.goodsId       as goodsId, " +
        "OrderDetails.pricePlan     as pricePlan, " +
        "OrderDetails.soldPrice     as soldPrice, " +
        "OrderDetails.quantity      as quantity, " +
        "OrderDetails.shippedQuantity as shippedQuantity, " +
        "OrderDetails.amount        as amount, " +
        "OrderDetails.remark        as remark," +
        "OrderDetails.updatedOn     as updatedOn," +
        "GoodsGsp.isNationalMedicine as isNationalMedicine, "  +
        "GoodsGsp.isMedicalInsuranceDrugs as isMedicalInsuranceDrugs, "  +
        "GoodsGsp.isPrescriptionDrugs as isPrescriptionDrugs , "  +
        "GoodsInventory.isSplit as isSplit, " +
        "GoodsInfo.commonName       as commonName," +
        "GoodsInfo.alias            as alias," +
        "GoodsInfo.producer         as producer," +
        "GoodsInfo.goodsNo         as goodsNo," +
        "GoodsInfo.spec             as spec," +
        "GoodsInfo.imageUrl         as img, " +
        "GoodsInfo.measureUnit      as measureUnit " +
        " FROM %s.OrderDetails " +
        " LEFT JOIN %s.GoodsInfo ON GoodsInfo.id = OrderDetails.goodsId " +
        " LEFT JOIN %s.GoodsGsp ON GoodsGsp.goodsId = OrderDetails.goodsId " +
        " LEFT JOIN %s.GoodsInventory ON GoodsInfo.id = GoodsInventory.goodsId " +
        " WHERE OrderDetails.orderId = %d " +
        "%s " +                         // Where clause
        "%s" +                         // orderby clause
        "%s;";                        // Limit clause
    
    var SQL_CT_SELECT_ORDERHISTORY = "SELECT OrderHistory.id as historyId, " +
         "OrderHistory.shipId as shipId, " +
         "OrderHistory.returnId as returnId, " +
         "OrderHistory.clientId as clientId, " +
         "OrderHistory.operatorId as operatorId, " +
         "OrderHistory.action as action, " +
         "OrderHistory.remark as remark, " +
         "Operator.operatorName as operatorName, " +
         "DATE_FORMAT(OrderHistory.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
         "FROM %s.OrderHistory " +
         "LEFT JOIN %s.Operator ON OrderHistory.operatorId = Operator.id " +
         "WHERE orderId=%d %s " +     // Where clause
         "ORDER BY historyId DESC " +// Order By clause
         "%s;";                         // Limit clause


    var SQL_CT_SELECT_ORDERHISTORY_STATUS = "SELECT action FROM %s.OrderHistory WHERE orderId=%d ORDER BY id DESC";

    var SQL_CT_SELECT_ORDERHISTORY_DETAILS = "SELECT " +
        "OrderHistory.id as historyId, " +
        "OrderHistory.orderId as orderId, " +
        "OrderHistory.shipId as shipId, " +
        "OrderHistory.returnId as returnId, " +
        "OrderHistory.clientId as clientId, " +
        "OrderHistory.operatorId as operatorId, " +
        "OrderHistory.action as action, " +
        "OrderHistory.remark as remark, " +
        "OrderInfo.status as orderStatus, " +//订单当前状态信息
        "OrderInfo.remark as orderRemark, " +//订单备注信息
        "OrderInfo.displayOrderId as displayOrderId, " +//订单显示ID
        "ShipInfo.isReceived as isShipReceived, " +//发货单当前状态信息
        "ShipInfo.logisticsNo as logisticsNo, " + //发货物流单号
        "ShipInfo.shipTime as shipTime, " +     //发货时间
        "ShipInfo.remark as shipRemark, " +     //发货时间
        "ReturnInfo.status as returnStatus, " +     //退货单状态信息
        "ReturnInfo.confirmDate as confirmDate, " +     //退货单审核时间信息
        "ReturnInfo.customerReply as customerReply, " +     //退货商家回复
        "ReturnInfo.remark as returnRemark, " +     //退货备注
        "Operator.operatorName as operatorName, " +
        "Client.clientName as clientName, " +
        "DATE_FORMAT(OrderHistory.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
        "FROM %s.OrderHistory " +
        "LEFT JOIN %s.OrderInfo ON (OrderHistory.orderId = OrderInfo.id) " +
        "LEFT JOIN %s.ShipInfo ON (OrderHistory.shipId = ShipInfo.id) " +
        "LEFT JOIN %s.ReturnInfo ON (OrderHistory.shipId = ReturnInfo.id) " +
        "LEFT JOIN %s.Operator ON (OrderHistory.operatorId = Operator.id) " +
        "LEFT JOIN %s.Client ON (OrderHistory.clientId = Client.id) " +
        "WHERE OrderHistory.orderId=%d " +     // Where clause
        "ORDER BY OrderHistory.id DESC;";// Order By clause

    /**
     *Update Action
     */
    var SQL_CT_STATUS_UPDATE_BY_ID    = "UPDATE %s.OrderInfo SET %s WHERE id=%d;";

    var SQL_CT_ORDER_CONTRACT_INFO_UPDATE    = "UPDATE %s.OrderInfo SET customerSignature='%s', contractTime = CURRENT_TIMESTAMP  WHERE id=%d;";

    var SQL_CT_SHIPPEDQTY_UPDATE      = "UPDATE %s.OrderDetails SET shippedQuantity=%d WHERE orderId=%d AND goodsId=%d;";

    var SQL_CT_UPDATEGOODS_INVENTORY =  "UPDATE %s.GoodsInventory SET amount=%d, lockedAmount=%d WHERE goodsId=%d;";


    var SQL_CT_COUNT_ORDERS_BY_STATUS =  "SELECT status, COUNT(*) AS num  FROM %s.OrderInfo " +
        " WHERE clientId = %d GROUP BY status;";
    // 与order关联起来
    var SQL_CT_COUNT_RETURNS_BY_STATUS =  "SELECT COUNT(*) AS num  FROM %s.ReturnInfo,%s.OrderInfo " +
        " WHERE ReturnInfo.orderId = OrderInfo.id AND OrderInfo.clientId = %d ;";

    // 不与order关联起来
    var SQL_CT_COUNT_RETURNS_BY_STATUS_NOT_RELATED_WITH_ORDERINFO="" +
        "SELECT COUNT(*) AS num " +
        "   FROM "+
        "%s.ReturnInfo  " +
        "LEFT JOIN " +
        "   %s.Operator ON ReturnInfo.operatorId=Operator.id " +
        "LEFT JOIN " +
        "   %s.Client ON Operator.clientId=Client.id " +
        "WHERE " +
        "  Client.id=%d " +
        "AND " +
        "  ReturnInfo.status='%s'";


    var SQL_CT_RETRIEVE_ORDER_INFO_FOR_CONTRACT = "" +
        "SELECT " +
        "   id as orderId, " +
        "   displayOrderId, " +
        "   clientSignature as clientSignature, " +
        "   customerSignature as customerSignature, " +
        "   DATE_FORMAT(OrderInfo.contractTime,'%%Y-%%m-%%d') AS customerSignatureDate, " +
        "   DATE_FORMAT(createdOn,'%%Y-%%m-%%d') as clientSignatureDate, " +
        "" +
        "   status ," +
        "   paymentStatus ," +
        "   paymentType " +
        "FROM " +
        "   %s.OrderInfo " +
        "WHERE " +
        "   id = %d;";

    var SQL_CT_NEW_CLEARINGDETAILS =
        "INSERT INTO %s.ClearingDetails(clientId, orderId, clearingType, shipId, amount) " +
        "       SELECT OrderInfo.clientId, " +
        "              OrderInfo.id, " +
        "              'SHIP', " +
        "              ShipDetails.shipId, " +
        "              SUM(ShipDetails.quantity*OrderDetails.soldPrice) " +
        "         FROM %s.OrderInfo,%s.ShipInfo,%s.OrderDetails,%s.ShipDetails " +
        "        WHERE ShipDetails.shipId=%d AND " +
        "              OrderInfo.id=ShipInfo.orderId AND " +
        "              OrderDetails.goodsId=ShipDetails.goodsId AND " +
        "              OrderInfo.id=OrderDetails.orderId AND " +
        "              ShipInfo.id=ShipDetails.shipId AND " +
        "              OrderInfo.status='SHIPPED' " +
        "     GROUP BY ShipDetails.shipId " +
        "ON DUPLICATE KEY UPDATE " +
        "       amount=VALUES(amount);";
    var SQL_CT_NEW_RETURNINFO="" +
        "INSERT INTO %s.ReturnInfo(orderId,shipId,operatorId,status,remark,createdOn) " +
        "   VALUES(" +
        " %d,%d,%d,'%s','%s',now()" +
        "         ) " ;

    var SQL_CT_SET_DISPLAY_RETURNID =
        "UPDATE %s.ReturnInfo " +
        "   SET displayReturnId=? " +
        " WHERE id=?;";

    //  废弃
    var SQL_CT_NEW_RETURNDETAIL_BATCH="" +
        "INSERT INTO %s.ReturnDetail(returnId,returnId,quantity) " +
        "VALUES ?";
    var SQL_CT_BATCH_RETURN_GOODS_MAP="" +
        "INSERT INTO %s.ReturnInfo_Goods_Map(returnId,goodsId,applyQuantity,remark) " +
        "VALUES ?";

    /**
     * DB Service provider
     */
    var dbService = {

        /**
         * get lack part data for sellerOrderDetails
         * @param sellerCustomerDB
         * @param unicode
         * @param callback
         */
        getPartSellerOrderDetailData: function(sellerCustomerDB,unicode,callback){
            logger.enter();
            var SQL="" +
                "   SELECT " +
                "       packageQty ," +
                "       goodsNo " +
                "   FROM %s.GoodsInfo " +
                "   WHERE unicode='%s';";
            var sql=sprintf(SQL,sellerCustomerDB,unicode);

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


        getSellerPackInfo :function(sellerCustomerDB,cloudDBName,sellerId,callback){
            logger.enter();
            var SQL="" +
                "   SELECT " +
                "       ClientSellerInfo.erpCode," +
                "       Customer.customerName" +
                "   FROM %s.ClientSellerInfo,%s.Customer" +
                "   WHERE ClientSellerInfo.enterpriseId= %d " +
                "       AND ClientSellerInfo.enterpriseId = Customer.id;";
            var sql=sprintf(SQL,sellerCustomerDB,cloudDBName,sellerId);
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
         * get unicode and packageQty for seller or buyer goods by HH
         * @param CustomerDB
         * @param HH
         * @param callback
         */
        getGoodsPackInfoByHH : function(CustomerDB,HH,callback){
            logger.enter();
            var SQL="" +
                "   SELECT " +
                "       unicode," +
                "       packageQty" +
                "   FROM %s.GoodsInfo " +
                "   WHERE GoodsInfo.goodsNo= '%s';";
            var sql=sprintf(SQL,CustomerDB,HH);

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
         * get lack part data for sellerOrderInfo
         * @param sellerCustomerDB
         * @param buyerId
         * @param callback
         */
        getSellerOrderInfoPartData : function(sellerCustomerDB,buyerId,callback){
            logger.enter();
            var SQL="" +
                "   SELECT " +
                "       ClientBuyerInfo.erpCode as buyerCode," +
                "       Customer.customerName as buyerName" +
                "   FROM %s.ClientBuyerInfo,%s.Customer " +
                "   WHERE  ClientBuyerInfo.enterpriseId=%d" +
                "       AND  ClientBuyerInfo.enterpriseId = Customer.id;";
            var sql=sprintf(SQL,sellerCustomerDB,__cloudDBName,buyerId);

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
         * get BuyerOrderDetails according to guid
         * @param buyerCustomerDB
         * @param guid
         * @param callback
         */
        getBuyerOrderDetailByGuid :function(buyerCustomerDB,guid,callback){
            logger.enter();
            var SQL="" +
                "   SELECT guid,orderInfoGuid,unicode,packageQty,buyerGoodsNo," +
                "       quantity, inPrice,licenseNo,amountTax" +
                "   FROM %s.BuyerOrderDetail WHERE orderInfoGuid = '%s';";
            var sql=sprintf(SQL,buyerCustomerDB,guid);
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
         * get BuyerOrderInfo according to guid
         * @param buyerCustomerDB
         * @param guid
         * @param callback
         */
        getBuyerOrderInfoByGuid: function(buyerCustomerDB,guid,callback){
            logger.enter();
            var SQL="" +
                "   SELECT guid,billNO,billDate,sellerCode,sellerName," +
                "       consigneeName, consigneeAddress,consigneeMobileNum," +
                "       buyerEmployeeCode,buyerEmployeeName,sellerEmployeeName," +
                "       usefulDate,advGoodsArriveDate,remark " +
                "   FROM %s.BuyerOrderInfo WHERE guid = '%s' ;";
            var sql=sprintf(SQL,buyerCustomerDB,guid);

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
         * 存入到sellerOrderInfo里面
         * @param connect
         * @param dbName
         * @param insertObj
         * @param callback
         */
        metaInsertOrderInfoToSellerOrder:function(connect,dbName,insertObj,callback){
            logger.enter();
            var sql="" +
                "INSERT INTO %s.SellerOrderInfo (%s) VALUES(%s) ";
            insertObj=parseInsertInfoNew(insertObj);
            sql=sprintf(sql,dbName,insertObj.keys,insertObj.values);
            logger.sql(sql);
            connect.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results.insertId);
                }
            });
        },

        /**
         * 存入到buyerShipInfo里面
         * @param connect
         * @param dbName
         * @param insertObj
         * @param callback
         */
        metaInsertShipInfoToBuyer:function(connect,dbName,insertObj,callback){
            logger.enter();
            var sql="" +
                "INSERT INTO %s.BuyerShipInfo (%s) " +
                "   VALUES (%s) " +
                "   ON DUPLICATE KEY UPDATE" +
                "   %s ;";
            insertObj=parseInsertOnDuplicateInfo(insertObj);
            sql=sprintf(sql,dbName,insertObj.keyStr,insertObj.valueStr,insertObj.updateStr);
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
         * 存入到buyerShipDetail里面
         * @param connect
         * @param dbName
         * @param insertObj
         * @param callback
         */
        metaInsertShipDetailsToBuyer: function (connect,dbName,insertObj,callback){
            logger.enter();
            var sql="" +
                "INSERT INTO %s.BuyerShipDetails (%s) " +
                "   VALUES (" +
                "   '%s','%s','%s'," +
                "   '%s','%s',%f," +
                "    %f,'%s','%s'," +
                "   '%s','%s',%f," +
                "   '%s','%s','%s'," +
                "   '%s') " +
                "   ON DUPLICATE KEY UPDATE" +
                "   %s ;";
            var insertObjStr=parseInsertOnDuplicateInfo(insertObj);
            sql=sprintf(sql,dbName,insertObjStr.keyStr,
                insertObj.shipNo,       insertObj.shipDetailNo, insertObj.shipDetailDate,
                insertObj.buyerGoodsNo,insertObj.unicode,      insertObj.packageQty,
                insertObj.taxPrice,     insertObj.batchNo,      insertObj.batchNum,
                insertObj.goodsValidDate,insertObj.goodsProduceDate, insertObj.quantity,
                insertObj.remark,       insertObj.inspectReportUrl, insertObj.salesType,
                insertObj.orderDetailGuid,
                insertObjStr.updateStr);
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
         * 存入到sellerShipInfo里面
         * @param connect
         * @param dbName
         * @param insertObj
         * @param callback
         */
        metaInsertShipInfoToSeller:function(connect,dbName,insertObj,callback){
            logger.enter();
            var sql="" +
                "INSERT INTO %s.SellerShipInfo (%s) " +
                "   VALUES (%s) " +
                "   ON DUPLICATE KEY UPDATE" +
                "   %s ;";
            insertObj=parseInsertOnDuplicateInfo(insertObj);
            sql=sprintf(sql,dbName,insertObj.keyStr,insertObj.valueStr,insertObj.updateStr);
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
         * 存入到sellerShipDetails里面
         * @param connect
         * @param dbName
         * @param insertObj
         * @param callback
         */
        metaInsertShipDetailsToSeller: function (connect,dbName,insertObj,callback){
            logger.enter();
            var sql="" +
                "INSERT INTO %s.SellerShipDetails (%s) " +
                "   VALUES (" +
                "   '%s','%s','%s'," +
                "   '%s','%s',%f," +
                "    %f,'%s','%s'," +
                "   '%s','%s',%f," +
                "   '%s','%s','%s'," +
                "   '%s') " +
                "   ON DUPLICATE KEY UPDATE" +
                "   %s ;";
            logger.debug(JSON.stringify(insertObj));
            var insertObjStr=parseInsertOnDuplicateInfo(insertObj);
            sql=sprintf(sql,dbName,insertObjStr.keyStr,
                insertObj.shipNo,       insertObj.shipDetailNo, insertObj.shipDetailDate,
                insertObj.sellerGoodsNo,insertObj.unicode,      insertObj.packageQty,
                insertObj.taxPrice,     insertObj.batchNo,      insertObj.batchNum,
                insertObj.goodsValidDate,insertObj.goodsProduceDate, insertObj.quantity,
                insertObj.remark,       insertObj.inspectReportUrl, insertObj.salesType,
                insertObj.orderDetailGuid,
                insertObjStr.updateStr);
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
         * insert ship monitors
         * @param connect
         * @param dbName
         * @param insertArr
         * @param callback
         */
        metaInsertShipMonitorsToSeller : function (connect,dbName,insertArr,callback){
            logger.enter();
            var insertObj={
                drugESC:"",
                shipDetailNo:"",
                packingSpec:"",
                ftype:""
            };
            var sql="" +
                "INSERT INTO %s.SellerShipDetailsMonitor (%s) " +
                "   VALUES ? " +
                "   ON DUPLICATE KEY UPDATE" +
                "   %s ;";
            insertObj=parseInsertOnDuplicateInfo(insertObj);
            sql=sprintf(sql,dbName,insertObj.keyStr,insertObj.updateStr);
            logger.sql(sql);
            connect.query(sql,[insertArr],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         * 客户erp订单上来之后 存入到BuyerOrderInfo里面
         * @param dbName
         * @param insertObj
         * @param callback
         */
        metaInsertOrderInfoToBuyerOrder:function(connect,dbName,insertObj,callback){
            logger.enter();
            var sql="" +
                "INSERT INTO %s.BuyerOrderInfo(%s) VALUES(%s) ";
            insertObj=parseInsertInfoNew(insertObj);
            sql=sprintf(sql,dbName,insertObj.keys,insertObj.values);
            logger.sql(sql);
            connect.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results.insertId);
                }
            });
        },
        /**
         * insert buyer ship monitors
         * @param connect
         * @param dbName
         * @param insertArr
         * @param callback
         */
        metaInsertShipMonitorsToBuyer: function (connect,dbName,insertArr,callback){
            logger.enter();
            var insertObj={
                drugESC:"",
                shipDetailNo:"",
                packingSpec:"",
                ftype:""
            };
            var sql="" +
                "INSERT INTO %s.BuyerShipDetailsMonitor (%s) " +
                "   VALUES ? " +
                "   ON DUPLICATE KEY UPDATE" +
                "   %s ;";
            insertObj=parseInsertOnDuplicateInfo(insertObj);
            sql=sprintf(sql,dbName,insertObj.keyStr,insertObj.updateStr);
            logger.sql(sql);
            connect.query(sql,[insertArr],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         * 存入到sellerOrderDetails里面
         * @param connect
         * @param dbName
         * @param batchData
         * @param callback
         */
        metaInsertOrderDetailsToSellerOrderDetails:function(connect,dbName,batchData,callback){
            logger.enter();
            var sql="" +
                "INSERT INTO " +
                "   %s.SellerOrderDetail(guid,orderInfoGuid,unicode,packageQty,sellerGoodsNo,quantity,price,licenseNo,amountTax,amount)" +
                "VALUES ? ";
            sql=sprintf(sql,dbName);
            logger.sql(sql);
            connect.query(sql,[batchData],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * 客户erp订单上来之后 存入到BuyerOrderDetails里面
         * @param connect
         * @param dbName
         * @param batchData
         * @param callback
         */
        metaInsertOrderDetailsToBuyerOrderDetails:function(connect,dbName,batchData,callback){
            logger.enter();
            var sql="" +
                "INSERT INTO " +
                "   %s.BuyerOrderDetail(guid,orderInfoGuid,unicode,packageQty,buyerGoodsNo,quantity,inPrice,licenseNo,amountTax)" +
                "VALUES ? ";
            sql=sprintf(sql,dbName);
            logger.sql(sql);
            connect.query(sql,[batchData],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(null,results);
                }
            });
        },
        /**
         * insert return info to seller db
         * @param connect
         * @param dbName
         * @param batchData
         * @param callback
         */
        metaInsertReturnInfoToSeller : function(connect,dbName,batchData,callback){
            logger.enter();
            var SQL = " INSERT INTO %s.SellerReturnInfo " +
                " (guid,billNo,buyerCode,billDate,returnReason,stockType,Remark)" +
                " VALUES ? " +
                " ON DUPLICATE KEY UPDATE " +
                " billNo=VALUES(billNo),buyerCode=VALUES(buyerCode),billDate=VALUES(billDate),returnReason=VALUES(returnReason)," +
                " stockType=VALUES(stockType), Remark=VALUES(Remark) ;";
            var sql=sprintf(SQL,dbName);
            logger.sql(sql);
            connect.query(sql,[batchData],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        metaInsertReturenDetailsToSeller : function(connect,dbName,batchData,callback){
            logger.enter();
            var SQL = " INSERT INTO %s.SellerReturnDetails " +
                " (guid,detailNo,BuyerReturnGuid,goodsNo,unicode,packageQty,batchNo,batchNum,quantity," +
                " taxPrice,price,goodsSubtotal,taxSubtotal,subtotal,Remark)" +
                " VALUES ? " +
                " ON DUPLICATE KEY UPDATE " +
                " detailNo=VALUES(detailNo),BuyerReturnGuid=VALUES(BuyerReturnGuid), goodsNo=VALUES(goodsNo)," +
                " unicode=VALUES(unicode), packageQty=VALUES(packageQty),batchNo=VALUES(batchNo)," +
                " batchNum=VALUES(batchNum),quantity=VALUES(quantity),taxPrice=VALUES(taxPrice),price=VALUES(price)," +
                " goodsSubtotal=VALUES(goodsSubtotal),taxSubtotal=VALUES(taxSubtotal),subtotal=VALUES(subtotal)," +
                " Remark=VALUES(Remark);";
            var sql=sprintf(SQL,dbName);
            logger.sql(sql);
            connect.query(sql,[batchData],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         * insert return info to buyer db
         * @param connect
         * @param dbName
         * @param batchData
         * @param callback
         */
        metaInsertReturnInfoToBuyer : function(connect,dbName,batchData,callback){
            logger.enter();
            var SQL = " INSERT INTO %s.BuyerReturnInfo " +
                " (guid,billNo,sellerCode,billDate,returnReason,stockType,Remark)" +
                " VALUES ? " +
                " ON DUPLICATE KEY UPDATE " +
                " billNo=VALUES(billNo),sellerCode=VALUES(sellerCode),billDate=VALUES(billDate),returnReason=VALUES(returnReason)," +
                " stockType=VALUES(stockType), Remark=VALUES(Remark) ";
            var sql=sprintf(SQL,dbName);
            logger.sql(sql);
            connect.query(sql,[batchData],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        metaInsertReturenDetailsToBuyer : function(connect,dbName,batchData,callback){
            logger.enter();
            var SQL = " INSERT INTO %s.BuyerReturnDetails " +
            " (guid,detailNo,BuyerReturnGuid,goodsNo,unicode,packageQty,batchNo,batchNum,quantity," +
            " taxPrice,price,goodsSubtotal,taxSubtotal,subtotal,Remark)" +
            " VALUES ? " +
            " ON DUPLICATE KEY UPDATE " +
            " detailNo=VALUES(detailNo),BuyerReturnGuid=VALUES(BuyerReturnGuid), goodsNo=VALUES(goodsNo)," +
            " unicode=VALUES(unicode), packageQty=VALUES(packageQty),batchNo=VALUES(batchNo)," +
            " batchNum=VALUES(batchNum),quantity=VALUES(quantity),taxPrice=VALUES(taxPrice),price=VALUES(price)," +
            " goodsSubtotal=VALUES(goodsSubtotal),taxSubtotal=VALUES(taxSubtotal),subtotal=VALUES(subtotal)," +
            " Remark=VALUES(Remark);";
            var sql=sprintf(SQL,dbName);
            logger.sql(sql);
            connect.query(sql,[batchData],function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },


        /**
         * 数据库记录orderInfo支付信息
          * @param customerDB
         * @param payInfo
         * @param callback
         */
        restorePayInfoToOrder:function(customerDB,payInfo,callback){
            logger.enter();
            var SQL = "UPDATE  %s.OrderInfo " +
                " SET paymentId = %d,  paymentExpire ='%s' " +
                " WHERE  displayOrderId = '%s' ;";
            var sql=sprintf(SQL,customerDB,
                payInfo.payId,  //支付InfoId
                payInfo.payTimeout,
                payInfo.displayOrderId
            ); // 支付超时时间
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },


        /**
         * 数据库记录当次支付信息
         * @param customerDB
         * @param paymentInfo
         * @param callback
         */
        restorePaymentInfo : function(customerDB,paymentInfo,callback){
        logger.enter();
        var SQL = "Insert into %s.PaymentInfo " +
            " (paymentGatewayId,orderId,displayOrderId,currencyCode,txnAmt,payTimeout)" +
            " VALUES  " +
            " (%d,%d,'%s','%s',%f,'%s') ;";
        var sql=sprintf(SQL,customerDB,
            Number(paymentInfo.paymentId),  //支付网关Id
            paymentInfo.orderId,    //订单Id
            paymentInfo.displayOrderId,    //订单displayorderId
            paymentInfo.currencyCode,//支付货币
            paymentInfo.txnAmt,  //支付金额
            paymentInfo.payTimeout); // 支付超时时间
        logger.sql(sql);
        __mysql.query(sql,function(error,results){
            if(error){
                logger.sqlerr(error);
                callback(error);
            }else{
                callback(null,results);
            }
        });
        },


        getPayIdByName : function(cloudDB,paymentName,callback){
            logger.enter();
            var SQL = "SELECT id,name,version,encoding,baseUrl,signMethod " +
                " FROM %s.PaymentGateway  WHERE name = '%s';";
            var sql=sprintf(SQL,cloudDB,paymentName);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        getClientPayIdByName: function(customerDB,paymentName,callback){
            logger.enter();
            var SQL = "SELECT id,name,version,encoding,baseUrl,signMethod,imgUrl, applyUrl " +
                " FROM %s.ClientPaymentGateway  WHERE name = '%s';";
            var sql=sprintf(SQL,customerDB,paymentName);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * get paymentInfo by paymentId
         * @param cloudDB
         * @param paymentId
         * @param callback
         */
        getPaymentInfoById: function(cloudDB,paymentId,callback){
            logger.enter();
            var SQL = "SELECT id,name,version,encoding,baseUrl,signMethod " +
                " FROM %s.PaymentGateway  WHERE id = %d;";
            var sql=sprintf(SQL,cloudDB,paymentId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results[0]);
                }
            });
        },
        /**
         * get paymentInfo by paymentId (CLIENT)
         * @param customerDB
         * @param paymentId
         * @param callback
         */
        getClientPaymentInfoById : function(customerDB,paymentId,callback){
            logger.enter();
            var SQL = "SELECT id,name,version,encoding,baseUrl,signMethod " +
                " FROM %s.ClientPaymentGateway  WHERE id = %d;";
            var sql=sprintf(SQL,customerDB,paymentId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results[0]);
                }
            });
        },

        /**
         * update hasRefund in OrderInfo
         * @param customerDB
         * @param orderId
         * @param status
         * @param callback
         */
        updateOrderInfoRefund: function(customerDB,orderId,status,callback){
            logger.enter();
            var SQL = "UPDATE %s.OrderInfo SET hasRefund = '%s' " +
                " WHERE id = %d;";
            var sql=sprintf(SQL,customerDB,status,orderId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * get paymentInfo by id
         * @param customerDB
         * @param paymentId
         * @param callback
         */
        getOrderPayment : function(customerDB,paymentId,callback){
            logger.enter();
            var SQL = "SELECT * FROM %s.PaymentInfo " +
                " WHERE id = %d;";
            var sql=sprintf(SQL,customerDB,paymentId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * get paymentInfo by OrderId
         * @param customerDB
         * @param paymentId
         * @param callback
         */
        getPaymentInfoByOrderId : function(customerDB, orderId, callback){
            logger.enter();
            var SQL = "SELECT " +
                " id, paymentGatewayId, currencyCode, txnAmt, txnTime, payTimeout, " +
                " customerIp, queryId, respMsg, respCode, paymentStatus, tn, " +
                " DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn, " +
                " DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
                " FROM %s.PaymentInfo " +
                " WHERE orderId = %d;";

            var sql=sprintf(SQL, customerDB, orderId);
            logger.sql(sql);
            __mysql.query(sql,function(error, results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null, results);
                }
            });
        },

        /**
         * insert data into RefundInfo,仅适用于全额退款
         * @param customerDB
         * @param paymentInfo
         * @param callback
         */
        restoreRefundInfo :  function(customerDB,refundInfo,callback){
            logger.enter();
            var SQL = "INSERT INTO %s.RefundInfo (paymentGatewayId,orderId,currencyCode,txnAmt,orderAmt) " +
                " VALUES (%d,%d,'%s',%f,%f);";
            var sql=sprintf(SQL,customerDB,
                refundInfo.paymentGatewayId,
                refundInfo.orderId,
                refundInfo.currencyCode,
                refundInfo.txnAmt,
                refundInfo.orderAmt
            );
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },


        /**
         * 插入待退款列表
         * @param customerDB
         * @param refundId
         * @param callback
         */
        restoreRefundList :  function(customerDB,refundId,callback){
            logger.enter();
            var time = new Date();
            var expireMin = __refundExpireMin;
            time.setMinutes(time.getMinutes() + expireMin, time.getSeconds(), 0);
            logger.debug(time.toLocaleString());
            var payTimeout = time.toLocaleString();
            var SQL = "INSERT INTO %s.RefundList (refundId,payTimeout) " +
                " VALUES (%d,'%s');";
            var sql=sprintf(SQL,customerDB,refundId,payTimeout);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * 获取支付验证数据
         * @param cloudDB
         * @param customerId
         * @param paymentId
         * @param callback
         */
        getPayConfig: function(cloudDB,customerId,paymentId,callback){
            logger.enter();
            var SQL = "SELECT configValue " +
                " FROM %s.PaymentKeys" +
                " WHERE paymentId = %d " +
                " AND customerId = %d ;";
            var sql=sprintf(SQL,cloudDB,paymentId,customerId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * 获取支付验证数据(client)
         * @param customerDB
         * @param customerId
         * @param paymentId
         * @param callback
         */
        getClientPayConfig : function(customerDB,customerId,paymentId,callback){
            logger.enter();
            var SQL = "SELECT configValue " +
                " FROM %s.ClientPaymentKeys" +
                " WHERE paymentId = %d " +
                " AND customerId = %d ;";
            var sql=sprintf(SQL,customerDB,paymentId,customerId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },
        /**
         * 获取支付需要的商品名字
         * @param customerDB
         * @param orderId
         * @param callback
         */
        listOrderDetailsForPay: function(customerDB,orderId,callback){
            logger.enter();
            var SQL = "SELECT GoodsInfo.commonName, GoodsInfo.id as goodsId" +
                " FROM %s.OrderDetails,%s.GoodsInfo" +
                " WHERE OrderDetails.orderId = %d " +
                " AND GoodsInfo.id = OrderDetails.goodsId;";
            var sql=sprintf(SQL,customerDB,customerDB,orderId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },


        listFinaceInfoByClientId: function(customerDB,clientId,callback){
            logger.enter();
            var SQL = "SELECT id,clientId,credits,arrearsBalance,accountDays," +
                " DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn" +
                " FROM %s.ClientFinance WHERE clientId = %d ;";
            var sql=sprintf(SQL,customerDB,clientId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },


        /**
         * 获取支付所需的订单数据
         * @param customerDB
         * @param orderId
         * @param callback
         */

        listPayOrderInfo : function(customerDB,orderId,callback){
            logger.enter();
            var SQL = "SELECT id, displayOrderId, clientId,total, paymentType, paymentStatus " +
                " FROM %s.OrderInfo where id = %d ;";
            var sql=sprintf(SQL,customerDB,orderId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },
        /**
         * 取出所有支付方式
         * @param cloudDB
         * @param callback
         */
        listPayments: function(cloudDB,callback){
            logger.enter();
            var SQL = "SELECT id,name,version,encoding,baseUrl,signMethod " +
                " FROM %s.AvailablePaymentGateway ;";
            var sql=sprintf(SQL,cloudDB);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * 取出所有支付方式(CLIENT)
         * @param customerDB
         * @param customerId
         * @param callback
         */
        listClientPayments :  function(customerDB,customerId,callback){
            logger.enter();
            var SQL = "SELECT " +
                " ClientPaymentGateway.id," +
                " ClientPaymentGateway.name," +
                " ClientPaymentGateway.version," +
                " ClientPaymentGateway.encoding," +
                " ClientPaymentGateway.baseUrl," +
                " ClientPaymentGateway.applyUrl," +
                " ClientPaymentGateway.signMethod " +
                " FROM %s.ClientPaymentGateway,%s.ClientPaymentKeys " +
                " WHERE ClientPaymentGateway.id = ClientPaymentKeys.paymentId" +
                " AND  ClientPaymentKeys.customerId = %d " +
                " AND  ClientPaymentKeys.isForbidden = '0' ;";
            var sql=sprintf(SQL,customerDB,customerDB,customerId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * get paymentId in OrderInfo
         * @param customerDB
         * @param orderId
         * @param callback
         */
        getPaymentIdForRefund: function(customerDB,orderId,callback){
            logger.enter();
            var SQL = "SELECT paymentId FROM %s.OrderInfo " +
                " WHERE id = %d AND paymentType='ONLINE' " +
                "   AND paymentStatus = 'PAID';";
            var sql=sprintf(SQL,customerDB,orderId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * check order total for payment
         * @param customerDB
         * @param displayOrderId
         * @param amount
         * @param callback
         */
        checkOrderFee : function(customerDB,displayOrderId,amount,callback){
            logger.enter();
            var SQL = "SELECT id,displayOrderId " +
                " FROM %s.OrderInfo WHERE displayOrderId='%s' " +
                " AND total = %f  ;";
            var sql=sprintf(SQL,customerDB,displayOrderId,amount);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * check order is notified
         * @param customerDB
         * @param displayOrderId
         * @param callback
         */
        checkOrderStatus : function(customerDB,displayOrderId,callback){
            logger.enter();
            var SQL = "SELECT id,displayOrderId " +
                " FROM %s.OrderInfo WHERE displayOrderId='%s' " +
                " AND paymentStatus = 'PAID' ;";
            var sql=sprintf(SQL,customerDB,displayOrderId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        checkOrderBankStatus: function(customerDB,displayOrderId,callback){
            logger.enter();
            var SQL = "SELECT id,displayOrderId " +
                " FROM %s.OrderInfo WHERE displayOrderId='%s' " +
                " AND bankNotifyStatus = 'PAID' ;";
            var sql=sprintf(SQL,customerDB,displayOrderId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * get CustomerDBsuffix by id
         * @param cloudDB
         * @param customerId
         * @param callback
         */
        listCustomerDBsuffixById : function(cloudDB,customerId,callback){
            logger.enter();
            var SQL = "SELECT customerDBsuffix,paymentIsOnCloud " +
                " FROM %s.Customer WHERE id= %d ;";
            var sql=sprintf(SQL,cloudDB,customerId);
            logger.sql(sql);
            __mysql.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * update  pay status in OrderInfo
         * @param customerDB
         * @param orderId
         * @param status
         * @param callback
         */
        updateOrderPayInfo : function(connect,customerDB,orderId,status,callback){
            logger.enter();
            var SQL = "UPDATE %s.OrderInfo SET paymentStatus = '%s'   " +
                "  WHERE id= %d ;";
            var sql=sprintf(SQL,customerDB,status,orderId);
            logger.sql(sql);
            connect.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },
        /**
         * 更新订单的paymentStatus and paymentType
         * @param connect
         * @param customerDB
         * @param orderID
         * @param status
         * @param paymentType
         * @param callback
         */
        updateOrderPayStatusAndPayType:function(connect,customerDB,orderID,status,paymentType,callback){
             logger.enter();
             var SQL="UPDATE %s.OrderInfo SET paymentStatus='%s' " +
                 " , paymentType='%s' " +
                 " WHERE id= %d" ;
             var sql=sprintf(SQL,customerDB,status,paymentType,orderID);
             logger.sql(sql);
             connect.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(null,results)
                }
             });
        }
        ,
        updateOnlineOrderPayInfo : function(connect,customerDB,orderId,status,callback){
            logger.enter();
            var SQL = "UPDATE %s.OrderInfo SET paymentStatus = '%s' ,paymentType='ONLINE'  " +
                "  WHERE id= %d ;";
            var sql=sprintf(SQL,customerDB,status,orderId);
            logger.sql(sql);
            connect.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        updateOrderBankCbInfo : function(connect,customerDB,orderId,status,callback){
            logger.enter();
            var SQL = "UPDATE %s.OrderInfo SET bankNotifyStatus = '%s' " +
                "  WHERE id= %d ;";
            var sql=sprintf(SQL,customerDB,status,orderId);
            logger.sql(sql);
            connect.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * update  pay type in OrderInfo
         * @param customerDB
         * @param orderId
         * @param type
         * @param callback
         */
        updateOrderPayType : function(connect,customerDB,orderId,type,callback){
            logger.enter();
            var SQL = "UPDATE %s.OrderInfo SET paymentType = '%s' " +
                "  WHERE id= %d ;";
            var sql=sprintf(SQL,customerDB,type,orderId);
            logger.sql(sql);
            connect.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * update  status in PaymentInfo
         * @param customerDB
         * @param orderId
         * @param status
         * @param callback
         */
        updatePaymentInfoStatus : function(connect,customerDB,orderId,status,callback){
            logger.enter();
            var SQL = "UPDATE %s.PaymentInfo,%s.OrderInfo SET PaymentInfo.paymentStatus = '%s' " +
                "  WHERE OrderInfo.id= %d  AND OrderInfo.paymentId = PaymentInfo.id ;";
            var sql=sprintf(SQL,customerDB,customerDB,status,orderId);
            logger.sql(sql);
            connect.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * 设定商品的锁定库存数量
         * @param connect
         * @param customerDB
         * @param updateData
         * @param callback
         */
        metaUpdateSetLockedInventory: function(connect,customerDB,updateData,callback){
            logger.enter();
            var SQL = "INSERT INTO %s.GoodsInventory (goodsId,lockedAmount) " +
                " VALUES ? ON DUPLICATE KEY UPDATE goodsId=VALUES(goodsId)," +
                " amount = amount-VALUES(lockedAmount), lockedAmount = lockedAmount+VALUES(lockedAmount);";
            var sql=sprintf(SQL,customerDB);
            logger.sql(sql);
            connect.query(sql,[updateData],function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        //关闭订单库存变化
        metaReturnInventory : function(connect,customerDB,goodsId,quantity,callback){
            logger.enter();
            var SQL = "UPDATE %s.GoodsInventory SET amount=amount+%d,lockedAmount=lockedAmount-%d WHERE  goodsId = %d;";
            var sql=sprintf(SQL,customerDB,quantity,quantity,goodsId);
            logger.sql(sql);
            connect.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },

        /**
         * 发货库存的变化
         * @param connect
         * @param customerDB
         * @param goodsId
         * @param shippedNum
         * @param callback
         */
        metaUpdateShippedLockedInventory: function(connect,customerDB,goodsId,shippedNum,orderNum, callback){
            logger.enter();
            var SQL = " UPDATE %s.GoodsInventory  " +
                " SET actualAmount = actualAmount - %d," +
                " amount = amount + %d - %d," +
                " lockedAmount = lockedAmount - %d " +
                " WHERE  goodsId = %d;";
            var sql = sprintf(SQL, customerDB, shippedNum, orderNum, shippedNum, orderNum, goodsId);
            logger.sql(sql);
            connect.query(sql,function(error,results){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,results);
                }
            });
        },


        //新建一条退货单  ReturnInfo
        metaInsertNewReturnInfo:function(connect,customerDB,orderId,shipId,operatorId,status,remark,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_NEW_RETURNINFO,customerDB,orderId,shipId,operatorId,status,remark);
            logger.sql(sql);
            connect.query(sql,function(error,result){
                if(error){
                    return callback(error);
                }else{
                    callback(null,result.insertId);
                }
            });
        },
        /**
         * 针对ERP发起的全单拒收生成退货的方法
         * @param connect
         * @param customerDB
         * @param insertData
         * @param callback
         */
        metaInsertRejectReturnInfo:function(connect,customerDB,insertData,callback){
            logger.enter();
            var SQL="" +
                "INSERT INTO %s.ReturnInfo(orderId,shipId,operatorId,status,remark,receiveDate,returnDeliveredRemark) " +
                "   VALUES(" +
                " %d,%d,%d,'%s','%s','%s','%s' ) " ;
            var sql=sprintf(SQL,
                customerDB,
                insertData.orderId,
                insertData.shipId,
                insertData.operatorId,
                insertData.status,
                insertData.remark,
                insertData.receiveDate,
                insertData.returnDeliveredRemark
            );
            logger.sql(sql);
            connect.query(sql,function(error,result){
                if(error){
                    return callback(error);
                }else{
                    callback(null,result.insertId);
                }
            });
        },


        //插入退货单详情表
        meatInsertOnDupReturnDetails:function(connect,customerDB,orderId,returnId,goodsArr,callback){
            //goodsArr=[["754","11","11111","国药准字H34020418","bNum12","bNo12","9,9"],
            // ["772","22","2222","国药准字H10940176","bNum22","bNo22","8.8"]]
            logger.enter();
            var returnDetailInfo={
                returnId:"",
                orderId:"",
                goodsId:"",
                quantity:"",
                remark:"",
                goodsLicenseNo:"",
                batchNum:"",
                batchNo:"",
                returnPrice:""
            };
            var sqlStr = parseInsertOnDuplicateInfo(returnDetailInfo);
            var returnDetailsData = [];
            underscore.map(goodsArr,function(item){
                var updateArr = [];
                updateArr.push(returnId);
                updateArr.push(orderId);
                updateArr.push(item[0]);//goodsId
                updateArr.push(item[1]);//quantity
                updateArr.push(item[2]);//remark
                updateArr.push(item[3]);//goodsLicenseNo
                updateArr.push(item[4]);//batchNum
                updateArr.push(item[5]);//batchNo
                updateArr.push(item[6]);//returnPrice
                returnDetailsData.push(updateArr);
            });
            var SQL_CT_INSERT_BATCH_RETURN_DETAIL =
                "INSERT INTO %s.ReturnDetails (%s) " +
                "VALUES ? " +
                "ON DUPLICATE KEY UPDATE %s;";
            var sql = sprintf(SQL_CT_INSERT_BATCH_RETURN_DETAIL,
                customerDB,sqlStr.keyStr,sqlStr.updateStr);

            logger.sql(sql);
            connect.query(sql,[returnDetailsData],function(error,result){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    logger.ndump("sqlresult",result);
                    callback(null,result);
                }
            });

        },


        getShipInfoById:function(customerDB,shipId,callback){
            logger.enter();
            var SQL = " SELECT " +
                " ShipInfo.id AS id, " +
                " ShipInfo.displayShipId, " +
                " ShipInfo.billNo AS billNo, " +
                " DATE_FORMAT(ShipInfo.shipTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipTime," +
                " ShipInfo.orderId AS orderId, " +
                " ShipInfo.shipDescription AS shipDescription," +
                " ShipInfo.isShipped AS isShipped, " +
                " ShipInfo.senderId AS senderId," +
                " ShipInfo.senderName AS senderName," +
                " ShipInfo.shipDate AS shipDate," +
                " ShipInfo.logisticsNo AS logisticsNo," +
                " ShipInfo.isReceived AS isReceived," +
                " ShipInfo.receiverId AS receiverId, "  +
                " ShipInfo.receiverName AS receiverName," +
                " ShipInfo.receivedDate AS receivedDate," +
                " ShipInfo.receiveRemark AS receiveRemark, " +
                " ShipInfo.remark AS shipRemark  " +
                " FROM %s.ShipInfo WHERE id = %d;";
            var sql=sprintf(SQL,customerDB,shipId);
            logger.sql(sql);
            __mysql.query(sql,function(error,result){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,result);
                }
            });
        },

        getShipDetailsById:function(customerDB,shipId,callback){
            logger.enter();
            var SQL = " SELECT " +
                " ShipDetails.id AS shipDetailsId," +
                " ShipDetails.shipId AS shipId," +
                " ShipDetails.goodsId AS goodsId," +
                " ShipDetails.detailNo AS detailNo," +
                " ShipDetails.quantity AS quantity, " +
                " ShipDetails.batchNum AS batchNum, " +
                " ShipDetails.soldPrice AS soldPrice , " +
                " ShipDetails.remark AS shipDetailRemark, " +
                " DATE_FORMAT(ShipDetails.goodsProduceDate,'%%Y-%%m-%%d') AS goodsProduceDate," +
                " DATE_FORMAT(ShipDetails.goodsValidDate,'%%Y-%%m-%%d') AS goodsValidDate," +
                " ShipDetails.drugESC AS drugESC, " +
                " ShipDetails.inspectReportURL AS inspectReportURL, " +
                " ShipDetails.receivedQuantity AS receivedQuantity " +
                " FROM %s.ShipDetails WHERE shipId = %d;";
            var sql=sprintf(SQL,customerDB,shipId);
            logger.sql(sql);
            __mysql.query(sql,function(error,result){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,result);
                }
            });
        },

        getReturnInfoByReturnId:function(customerDB,returnId,callback){
            logger.enter();
            var SQL = " SELECT " +
                " ReturnInfo.id AS id," +
                " ReturnInfo.displayReturnId AS displayReturnId," +
                " ReturnInfo.shipId AS shipId," +
                " ReturnInfo.orderId AS orderId," +
                " ReturnInfo.operatorId AS operatorId, " +
                " ReturnInfo.status AS status, " +
                " ReturnInfo.shipDate AS shipDate, " +
                " ReturnInfo.returnShipRemark AS returnShipRemark, " +
                " ReturnInfo.logisticsNo AS logisticsNo, " +
                " ReturnInfo.beforeCloseStatus AS beforeCloseStatus, " +
                " ReturnInfo.confirmDate AS confirmDate," +
                " ReturnInfo.remark AS applyReturnRemark " +
                " FROM %s.ReturnInfo WHERE id = %d;";
            var sql=sprintf(SQL,customerDB,returnId);
            logger.sql(sql);
            __mysql.query(sql,function(error,result){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,result);
                }
            });
        },

        getComplimentForERPshipInfo:function(customerDB,shipDetailsId,callback){
            logger.enter();
            var SQL = " SELECT GoodsInfo.goodsNo AS hh,OrderDetails.soldPrice AS sj, " +
                "  ClientSellerInfo.erpCode AS Suppliercode  " +
                "   FROM  %s.ShipDetails,%s.GoodsInfo,%s.OrderDetails,%s.ClientSellerInfo," +
                "   %s.Operator, %s.OrderInfo,%s.ShipInfo" +
                "   WHERE ShipDetails.id = %d  " +
                "   AND ShipDetails.goodsId = GoodsInfo.id " +
                "   AND ClientSellerInfo.enterpriseId = Operator.customerId " +
                "   AND ShipDetails.shipId = ShipInfo.id " +
                "   AND ShipInfo.orderId = OrderInfo.id " +
                "   AND OrderDetails.orderId = OrderInfo.id " +
                "   AND Operator.clientId = OrderInfo.clientId; ";
            var sql=sprintf(SQL,customerDB,customerDB,customerDB,
                customerDB,customerDB,customerDB,customerDB,shipDetailsId);
            logger.sql(sql);
            __mysql.query(sql,function(error,result){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,result);
                }
            });
        },

        getReturnDetailsByReturnId:function(customerDB,returnId,callback){
            logger.enter();
            var SQL = " SELECT " +
                "   ReturnDetails.detailNo AS returnId," +
                "   ReturnDetails.orderId AS orderId," +
                "   ReturnDetails.goodsId AS goodsId," +
                "   ReturnInfo_Goods_Map.price AS returnPrice," +
                "   ReturnDetails.detailNo AS detailNo," +//退货详情数据
                "   ReturnDetails.quantity AS quantity, " + //申请退货数量
                "   ReturnDetails.approvedQuantity AS batchApprovedQuantity,  " + //实际允许退回的批次数量
                "   ReturnDetails.returnDeliveredQuantity AS returnDeliveredQuantity,  " + //特定批次实际收货数量
                "   ReturnDetails.returnQuantity AS returnQuantity, " + //特定批次实际退回数量
                "   ReturnDetails.batchNum AS batchNum,  " +
                "   ReturnDetails.goodsLicenseNo  AS goodsLicenseNo ," +
                "   ReturnDetails.drugESC AS  drugESC,  " + //客户发货的时候的电子监管码
                "   DATE_FORMAT(ReturnDetails.goodsProduceDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsProduceDate, " +
                "   DATE_FORMAT(ReturnDetails.goodsValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsValidDate, " +
                "   ReturnDetails.deliveredDrugESC AS deliveredDrugESC,  " +  //商户确认退货收货时录入的电子监管码
                "   ReturnDetails.inspectReportURL AS inspectReportURL " +
                "" +
                " FROM %s.ReturnDetails,%s.ReturnInfo_Goods_Map WHERE ReturnDetails.returnId = %d" +
                "   AND ReturnDetails.returnId = ReturnInfo_Goods_Map.returnId " +
                "   AND ReturnInfo_Goods_Map.goodsId = ReturnDetails.goodsId;";
            var sql=sprintf(SQL, customerDB, customerDB, returnId);
            logger.sql(sql);
            __mysql.query(sql,function(error,result){
                if(error){
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null,result);
                }
            });
        },










        metaBatchSetDisplayReturnId: function(connect, customerDB, returnInfo, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SET_DISPLAY_RETURNID, customerDB);
            logger.sql(sql);
            connect.query(sql, [returnInfo.displayReturnId, returnInfo.returnId], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err);
            });
        },

        //退货单和商品映射表插入新的数据
        metaBatchInsertReturnInfoGoodsMap:function(connect,customerDB,insertData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_BATCH_RETURN_GOODS_MAP,customerDB);
            logger.sql(sql);
            connect.query(sql,[insertData],function(error,result){
                if(error){
                    logger.sqlerr(error);
                    return callback(error);
                }else{
                    callback(null,result);
                }
            });
        },

        metaBatchInsertRejectReturnDetails:function(connect,customerDB,insertData,callback){
            logger.enter();
            var SQL = " INSERT INTO %s.ReturnDetails (returnId,orderId,goodsId," +
                " quantity,returnDeliveredQuantity,drugESC,batchNum,batchNo," +
                " goodslicenseNo,inspectReportURL,deliveredDrugESC,goodsProduceDate,goodsValidDate" +
                " ) VALUES ?  " +
                " ON DUPLICATE KEY UPDATE returnId=VALUES(returnId),orderId=VALUES(orderId)," +
                " goodsId=VALUES(goodsId),quantity=VALUES(quantity),deliveredDrugESC=VALUES(deliveredDrugESC)," +
                " returnDeliveredQuantity=VALUES(returnDeliveredQuantity)," +
                " drugESC=VALUES(drugESC),batchNum=VALUES(batchNum),batchNo=VALUES(batchNo)," +
                " goodslicenseNo=VALUES(goodslicenseNo),inspectReportURL=VALUES(inspectReportURL)," +
                " goodsProduceDate=VALUES(goodsProduceDate),goodsValidDate=VALUES(goodsValidDate);";
            var sql = sprintf(SQL, customerDB);
            logger.sql(sql);
            connect.query(sql,[insertData],function(error,result){
                if(error){
                    logger.sqlerr(error);
                    return callback(error);
                }else{
                    callback(null,result);
                }
            });
        },


        metaBatchInsertRejectReturnInfoGoodsMap:function(connect,customerDB,insertData,callback){
            logger.enter();
             var SQL =  "INSERT INTO %s.ReturnInfo_Goods_Map(returnId,goodsId,price,receiveShippedQuantity) " +
                        "VALUES ?";
            var sql=sprintf(SQL,customerDB);
            logger.sql(sql);
            connect.query(sql,[insertData],function(error,result){
                if(error){
                    logger.sqlerr(error);
                    return callback(error);
                }else{
                    callback(null,result);
                }
            });
        },

        retrieveOrderInfoForContract: function (customerDB, orderId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_RETRIEVE_ORDER_INFO_FOR_CONTRACT, customerDB, orderId);
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    return callback(error);
                }
                callback(null, result[0]);
            });
        },

        countOrdersByStatus: function(customerDB, clientId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_COUNT_ORDERS_BY_STATUS,customerDB,clientId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result) {
                if(err) {
                    logger.sqlerr(err)
                    callback(err);
                }else{
                    callback(err,result);
                }
            });
        },
        countReturnInfoByStatusNotRelatedWithOrder:function(customerDB,clientId,returnInfoStatus,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_COUNT_RETURNS_BY_STATUS_NOT_RELATED_WITH_ORDERINFO,customerDB,customerDB,customerDB,Number(clientId),returnInfoStatus);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result);
                }
            });
        }
        ,
        //DISCARD
        countReturnsByStatus: function(customerDB, clientId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_COUNT_RETURNS_BY_STATUS,customerDB,customerDB,clientId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result) {
                if(err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result);
                }
            });
        },



        //TODO:实现 getOrderTrack,等待商户修好发货再来继续做
        getOrderTrackInfo: function(customerDB, clientId, orderId,callback) {
            console.log('[start]\n','[customerDB]:',customerDB,'\n[clientId]',clientId,'\n[orderId]',orderId,'\n[end]');
        },

        /**
         * newOrder
         *      Save an order into DB, @see https:///
         * @param customerDBName
         * @param orderData
         * @param callback
         */
        newOrder: function(customerDBName, orderData, operatorData, callback) {
            logger.enter();

            /* fetch a Mysql connect from connection pool */
            __mysql.getConnection(function(err, connect) {

                if (err){
                    logger.sqlerr(err);
                    throw err;
                }

                /* begin transaction */
                connect.beginTransaction(function (err) {

                    if (err) {
                        logger.sqlerr(err);
                        throw err;
                    }

                    /* step 1 : insert into OrderInfo */
                    var sql = sprintf(SQL_CT_INSERT_ORDERINFO,
                                  customerDBName,
                                  operatorData.operatorId,
                                  operatorData.clientId,
                                  orderData.address,
                                  "");
                    logger.sql(sql);
                    connect.query(sql, function (err, result, fields) {
                            if (err) {
                                logger.sqlerr(err);

                                /* rollback the transaction */
                                connect.rollback(function(){
                                    logger.warn("rollback the transaction");
                                    callback(err);
                                });
                                return;
                            }
                            if (!underscore.isEmpty(result)) {
                                var orderId = result.insertId;

                                /* step 2 : insert details into OrderDetails */
                                var orderItems = orderData.items;
                                var count = orderItems.length;

                                var i = 0;

                                /**
                                 * insert the order detail items recursively, until all the data inserted
                                 * @param index
                                 */

                                // TODO: fixme: low performance

                                var insertOrderItem = function (index) {
                                    sql = sprintf(SQL_CT_INSERT_ORDERDETAILS,
                                                  customerDBName,
                                                  orderId,
                                                  orderItems[index].goodsId,
                                                  orderItems[index].soldPrice,
                                                  orderItems[index].quantity,
                                                  orderItems[index].quantity * orderItems[index].soldPrice,
                                                  orderItems[index].remark
                                    );

                                    logger.sql(sql);

                                    connect.query(sql, function (err, result) {
                                        if (err) {
                                            logger.sqlerr(err);
                                            /* rollback the transaction */
                                            connect.rollback(function(){
                                                logger.warn("rollback the transaction");
                                                callback(err);
                                            });
                                            return;
                                        }

                                        logger.ndump("result", result);
                                        /* set back itemId */
                                        orderItems[index].detailId = result.insertId;

                                        if (++index < count) {
                                            logger.trace("do next insert");

                                            insertOrderItem(index);
                                        }
                                        else {
                                            /**
                                             * commit transaction
                                             */
                                            connect.commit(function (err) {
                                                if (err) {
                                                    logger.sqlerr(err);
                                                    connect.rollback(function() {
                                                        logger.warn("rollback the transaction");
                                                        callback(err);
                                                    });
                                                    return;
                                                }

                                                /**
                                                 * Done !
                                                 */
                                                logger.trace("Commit transaction success");
                                                callback(err, orderId);
                                            });
                                        }
                                    });
                                };

                                /**
                                 * Start insert order items
                                 */
                                insertOrderItem(i);
                            } else
                                callback("DBError");
                        });
                });
            });
        },

        metaBatchInsertOrder: function(connection, customerDB, orderInfo, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_BATCH_ORDERINFO,customerDB);
            var insertOrder = [];
            insertOrder.push(orderInfo.operatorId);
            insertOrder.push(orderInfo.clientId);
            insertOrder.push(orderInfo.consigneeAddress);
            insertOrder.push(orderInfo.remark);
            insertOrder.push(orderInfo.total);
            insertOrder.push(orderInfo.paymentType);
            insertOrder.push(orderInfo.clientSignature);
            insertOrder.push(orderInfo.hasReceipt);
            insertOrder.push(orderInfo.receiptTitle);
            connection.query(sql, [[insertOrder]],function(err, result) {
                if(err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result);
                }
            });
        },

        metaBatchSetDisplayOrderId: function(connection, customerDB, orderInfo, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SET_DISPLAY_ORDERID, customerDB);
            logger.sql(sql);
            connection.query(sql, [orderInfo.displayOrderId, orderInfo.orderId], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err);
            });
        },

        metaBatchInsertOrderDetail:function(connection, customerDB, orderDetail,callback) {
            var sql = sprintf(SQL_CT_BATCH_INSERT_ORDERDETAILS, customerDB);
            logger.sql(sql);
            connection.query(sql, [orderDetail], function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result);
                }
            });
        },

        saveOrderDetailsToCart: function(customerDB, cartDetails, callback) {
            var sql = sprintf(SQL_CT_SAVE_ORDERDETAILS_TO_CART, customerDB);
            logger.sql(sql);
            __mysql.query(sql, [cartDetails], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err,result.affectedRows);
                }
            });

        },

        /**
         * list all orders
         *      find all orders data from database, specified by paginator for CustoerManager use
         * @param customerDBName
         * @param paginator
         * @param callback
         */
        listAllOrders: function( customerDBName, paginator, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ALL_ORDERINFO,
                customerDBName,customerDBName,customerDBName,customerDBName,
                paginator.where("","clientName"),
                paginator.orderby(),
                paginator.limit()
            );


            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    throw err;
                }

                logger.trace("found " + results.length + " orders.");

                callback(results);
            });
        },

        /**
         * list orders
         *      find all goods data from database, specified by paginator
         * @param customerDBName
         * @param paginator
         * @param callback
         */
        listOrders: function( customerDBName, clientId, paginator, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDERINFO,
                              customerDBName,customerDBName,
                              paginator.where(sprintf('OrderInfo.clientId=%d', clientId)), //pagination.makeWhereClauseByPaginator(paginator, true),
                              paginator.orderby(), //pagination.makeOrderbyClauseByPaginator(paginator),
                              paginator.limit() //pagination.makePageClauseByPaginator(paginator)
            );
            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else {
                    callback(err, results);
                }
            });
        },


        listOrderDetailsById : function(customerDBName, orderId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_SIMPLE_ORDERDETAIL,
                customerDBName,orderId
            );

            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else {
                    callback(err, results);
                }
            });
        },
        getClientByCustomerId : function(customerDB, customerId,callback){
            logger.enter();
            var SQL = "SELECT clientId FROM %s.Operator where customerId = %d;";
            var sql = sprintf(SQL,customerDB,customerId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    logger.trace("Found " + results.length + " items.");
                    callback(null,results);
                }
            });
        },

        /**
         *根据商品的货号取得商品ID
         * @param customerDB
         * @param HH
         * @param callback  GoodsInfo.id  OR ""
         */
        getGoodsIdbyGoodsNo:function(customerDB, HH,callback){
            logger.enter();
            var SQL = "SELECT id FROM %s.GoodsInfo where goodsNo = '%s';";
            var sql = sprintf(SQL,customerDB,HH);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback("") ;
                }else{
                    logger.trace("Found " + results.length + " items.");
                    if(results&&results.length>0){
                        callback(results[0].id);
                    }else{
                        callback("") ;
                    }
                }
            });
        },



        //根据批准文号获取SCC系统的商品编号
        getGoodsIdByPZWH : function(customerDB, PZWH,callback){
            logger.enter();
            var SQL = "SELECT id FROM %s.GoodsInfo where licenseNo = '%s';";
            var sql = sprintf(SQL,customerDB,PZWH);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    logger.trace("Found " + results.length + " items.");
                    callback(null,results);
                }
            });
        },
        getOrderPaymentTypeById:function(customerDBName, orderId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDERINFO_PAYMENT,
                customerDBName,
                orderId,
                "",   // where clause
                "",   // orderBy clause
                ""    // page clause
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }

                logger.trace("Found " + results.length + " items.");
                if(!underscore.isEmpty(results)) {
                    callback(null,results[0]);
                    return;
                }
                callback("NOT FOUND");
            });
        },


        getOrderInfoBydisplayOrderId: function(customerDBName, displayOrderId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDERINFO_BY_DISPLAYID,
                customerDBName,
                displayOrderId,
                "",   // where clause
                "",   // orderBy clause
                ""    // page clause
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }

                logger.trace("Found " + results.length + " items.");
                if(!underscore.isEmpty(results)) {
                    callback(results[0]);
                    return;
                }
                callback(results);
            });
        },


        getOrderInfo: function(customerDBName, orderId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDERINFO_BY_ID,
                customerDBName,
                orderId,
                "",   // where clause
                "",   // orderBy clause
                ""    // page clause
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }

                logger.trace("Found " + results.length + " items.");
                if(!underscore.isEmpty(results)) {
                    callback(results[0]);
                    return;
                }
                callback(results);
            });
        },

        /**
         * get return info by orderId
         * @param customerDB
         * @param orderId
         * @param callback
         */

        getReturnInfoByOrderId : function(customerDB,orderId,callback){
            logger.enter();

            var sql = sprintf(SQL_APPLY_RETURN, customerDB, orderId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results);
                }
            });
        },

        getErpClientGuidbyClientId : function(customerDBName,clientId,callback){
            logger.enter();
            var SQL = " SELECT erpCode  FROM %s.ClientBuyerInfo,%s.Operator" +
                " WHERE ClientBuyerInfo.enterpriseId = Operator.customerId" +
                " AND Operator.clientId = %d AND ClientBuyerInfo.enabled = 1;";

            var sql = sprintf(SQL, customerDBName, customerDBName,clientId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results);
                }
            });
        },

        getOrderShipInfo:function(customerDBName, orderId, shipId,callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_SELECT_ORDER_SHIP_INFO,
                customerDBName,customerDBName,customerDBName,
                orderId,shipId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results);
                }
            });
        },

        getOrderReturnInfo:function(customerDBName, orderId,shipId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_SELECT_SUM_RETURN_INFO,
                customerDBName,       customerDBName,
                orderId,shipId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results);
                }
            });
        },



        /**
         * list pending order
         *      find all orders data from database, specified by paginator for CustoerManager use
         * @param customerDBName
         * @param orderId
         * @param callback
         */
        listPendingOrders: function( customerDBName, orderId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDER_PENDINGINFO,
                customerDBName,customerDBName,
                customerDBName,customerDBName,
                orderId
            );

            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    logger.trace("found " + results.length + " orders.");
                    callback(err,results);
                }

            });
        },

        /**
         * list pending order
         *      find all orders data from database, specified by paginator for CustoerManager use
         * @param customerDBName
         * @param paginator
         * @param callback
         */
        listWatingShipOrders: function( customerDBName, orderId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDER_WAITINGSHIP,
                customerDBName,customerDBName,customerDBName,orderId
            );

            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    throw err;
                }

                logger.trace("found " + results.length + " orders.");

                callback(results);
            });
        },

        /**
         * getOrderDetail
         *      get an order detail information
         * @param customerDBName
         * @param orderId
         * @param callback
         */
        getOrderDetail: function(customerDBName, orderId, callback) {

            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDERDETAIL,
                              customerDBName,
                              customerDBName,
                              customerDBName,
                              customerDBName,
                              orderId,
                              "",   // where clause
                              "",   // orderBy clause
                              ""    // page clause
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else {
                    callback(err, results);
                }
            });
        },

        /**
         * getOrderHistory
         * @param customerDBName
         * @param orderId
         * @param paginator
         * @param callback
         */
        getOrderHistory: function(customerDBName, orderId,  callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDERHISTORY,
                customerDBName,  customerDBName,
                orderId,
                "",   // where clause
                ""    // page clause
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    logger.trace("Found " + results.length + " items.");
                    callback(err,results);
                }
            });
        },

        /**
         * 获取当前订单的所有历史状态
         * @param customerDBName
         * @param orderId
         * @param callback
         */
        getOrderHistoryAction: function(customerDBName, orderId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDERHISTORY_STATUS, customerDBName, orderId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }
                else{
                    logger.trace("Found " + results.length + " items.");
                    callback(err, results);
                }
            });
        },

        getOrderHistoryDetails: function(customerDBName, orderId,  callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_ORDERHISTORY_DETAILS,
                customerDBName,  customerDBName, customerDBName,
                customerDBName,  customerDBName, customerDBName,
                orderId
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    logger.trace("Found " + results.length + " items.");
                    callback(err,results);
                }
            });
        },
        /**
         * updata order Status
         * @param customerDBName
         * @param orderId
         * @param status
         * @param callback
         */
        updateStatus: function(customerDBName, orderId, status, callback) {
            logger.enter();
            var updateStr= "status='"+status+"'";
            var sql = sprintf(SQL_CT_STATUS_UPDATE_BY_ID, customerDBName, updateStr, orderId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    throw err;
                }
                callback(result.affectedRows);
            });
        },


        metaUpdateStatus: function(connection,customerDBName, orderId, status,remark, callback) {
            logger.enter();
            var updateStr= "";
            if(underscore.isEmpty(remark)){
                updateStr= "status='"+status+"'";
            }else{
                updateStr= "status='"+status+"',confirmRemark='"+remark+"'";
            }
            var sql = sprintf(SQL_CT_STATUS_UPDATE_BY_ID, customerDBName, updateStr, orderId);
            logger.sql(sql);
            connection.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,result);
                }
            });
        },
        metaCloseOrder:function(connection,customerDBName,orderId,operatorId,callback){
            logger.enter();
            var sql="UPDATE %s.OrderInfo set status='CLOSED',closeOrderInfoDate=now(),closeOperatorId=%d WHERE id= %d";
            sql=sprintf(sql,customerDBName,Number(operatorId),Number(orderId));
            logger.sql(sql);
            connection.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,result);
                }
            });
        },
        metaUpdateOrderContractInfo: function (connection, customerDBName, orderId, customerSignature, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_ORDER_CONTRACT_INFO_UPDATE, customerDBName, customerSignature, orderId);
            logger.sql(sql);
            connection.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },

        metaUpdateInventory: function(connection,customerDBName,goodsInventoryData, callback) {
            logger.enter();
            var goodsId = goodsInventoryData.goodsId;
            var amount = goodsInventoryData.goodsInventory;
            var lockedAmount = goodsInventoryData.lockedInventory;
            var sql = sprintf(SQL_CT_UPDATEGOODS_INVENTORY, customerDBName,amount,lockedAmount,goodsId);
            logger.sql(sql);
            connection.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,result.affectedRows);
                }
            });
        },


        /**
         * update shippedQty
         * @param customerDBName
         * @param orderId
         * @param goodsId
         * @param quantity
         * @param callback
         */
        metaUpdateShippedQuantity: function(connection,customerDBName, orderId, goodsId,quantity, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SHIPPEDQTY_UPDATE, customerDBName, quantity,orderId, goodsId);
            logger.sql(sql);
            connection.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result.affectedRows);
                }
            });
        },

        /**
         * show shipped qunatity in orderDetails by orderId and goodsId
         * @param customerDBName
         * @param orderId
         * @param goodsId
         * @param callback
         */
        listOrderDetailsShippedQty:function(customerDBName, orderId,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_SHIPPEDORDERQTY_SELECT,
                customerDBName,
                orderId,
                goodsId
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results[0]);
                }
            });
        },

        /**
         * show  qunatity in orderDetails by orderId and goodsId
         * @param customerDBName
         * @param orderId
         * @param goodsId
         * @param callback
         */
        listOrderDetailsQty:function(customerDBName, orderId,callback){
            logger.enter();
            sql = sprintf(SQL_CT_ORDERQTY_SELECT,
                customerDBName,
                orderId
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }

            });
        },


        /**
         * newOrderHistoty
         *      Save an order history into DB, @see https:///
         * @param customerDBName
         * @param orderHistoryData
         * @param callback
         */
        metaNewOrderHistory: function(connection, customerDBName,  orderHistoryData, callback) {
            logger.enter();
            var clientId = orderHistoryData['clientId'];
            var operatorId = orderHistoryData['operatorId'];
            var orderId = orderHistoryData['orderId'];
            var shipId = orderHistoryData['shipId'];
            var returnId = orderHistoryData['returnId'];
            var action = orderHistoryData['action'];
            var remark = orderHistoryData['remark'];

            //var SQL_CT_INSERT_ORDERHISTORY = "INSERT INTO %s.OrderHistory (clientId, operatorId, orderId, shipId, returnId, action, remark) " +
            //    "VALUES (%d, %d, %d, %d, %d, '%s','%s');";
            var keys = "clientId, operatorId, orderId ";
            var values = clientId+","+operatorId+","+orderId;

            if(Number(shipId)>0){
                keys = keys + ",shipId";
                values = values + ","+shipId;
            }
            if(Number(returnId)>0){
                keys = keys + ",returnId";
                values = values + ","+returnId;
            }
            if(!underscore.isEmpty(action)){
                keys = keys + ",action";
                values = values + ",'"+action+"'";
            }
            if(!underscore.isEmpty(remark)){
                keys = keys + ",remark";
                values = values + ",'"+remark+"'";
            }
            logger.debug(keys);
            var sql = sprintf(SQL_CT_INSERT_ORDERHISTORY, customerDBName, keys,values);
            logger.sql(sql);
            connection.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }
                callback(err,result.affectedRows>0);
            });

        },

        metaBatchInsertOrderHistory: function (connection, customerDB, orderInfo, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_ORDERHISTORY_SIMPLE, customerDB);
            logger.sql(sql);
            var orderHistoryValues = [];
            orderHistoryValues.push(orderInfo.clientId);
            orderHistoryValues.push(orderInfo.operatorId);
            orderHistoryValues.push(orderInfo.orderId);
            orderHistoryValues.push(orderInfo.action);
            orderHistoryValues.push(orderInfo.remark);
            logger.trace('orderHistoryValues: ' + JSON.stringify(orderHistoryValues));
            connection.query(sql, [[orderHistoryValues]], function (err, result) {
                logger.trace('result of insert orderHistory' + JSON.stringify(result));
                if (err) {
                    callback(err)
                }else{
                    callback(err,result);
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