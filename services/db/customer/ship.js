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
 * database service module: ship.js
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-28    xdw-romens@issue#66
 *
 */
module.exports=function(){

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
    var keywordsToArray = require("keywords-array");
    var knex=require('knex')({client:'mysql'});
    /**
     * project modules
     */

    /**
     * SQL for customer DB, abbr. SQL_CT_***
     */

    //var SQL_CT_SHIPINFO_INSERT = "INSERT INTO %s.ShipInfo ( orderId, isShipped, logisticsNo,remark ) " +
    //    "VALUES ( %d,%s,'%s','%s');";
    //var SQL_CT_SHIPDETAILS_INSERT = "INSERT INTO %s.ShipDetails ( shipId, goodsId, quantity ) " +
    //    "VALUES ( %d,%d,%d);";
    //var SQL_CT_RETURNINFO_INSERT = "INSERT INTO %s.ReturnInfo ( shipId,  orderId, operatorId,  remark) " +
    //    "VALUES ( %d, %d, %d, '%s');";
    //var SQL_CT_RETURNDETAILS_INSERT = "INSERT INTO %s.ReturnDetails ( returnId,  orderId, goodsId,quantity) " +
    //    "VALUES ( %d, %d, %d, %d);";


    var SQL_CT_INSERT_BATCH_SHIPINFO = "INSERT INTO %s.ShipInfo ( orderId, isShipped, logisticsNo, remark, clientId,autoSwitchToReceivedDate,enableDelayReceived,receiverId) " +
        "VALUES ? ;";

    var SQL_CT_SET_DISPLAY_SHIPID = "UPDATE %s.ShipInfo SET displayShipId=? WHERE id=?;";

    var SQL_CT_INSERT_BATCH_SHIPDETAILS = "INSERT INTO %s.ShipDetails ( shipId, goodsId,remark, batchNum,goodsProduceDate,goodsValidDate,quantity,drugESC,inspectReportURL,orderDetailQuantity,shippedQuantitySum) " +
        "VALUES ? ;";

    var SQL_CT_INSERT_BATCH_RETURNINFO = "INSERT INTO %s.ReturnInfo ( shipId,  orderId, operatorId,  remark) " +
        "VALUES ? ;";
    //discard 废弃
    var SQL_CT_INSERT_BATCH_RETURNDETAILS = "INSERT INTO %s.ReturnDetails ( returnId,  orderId, goodsId, batchNum,quantity) " +
        "VALUES ? ;";
    //离线任务需要执行操作 查询出还未收货的发货信息,并且自动关闭时间小于当前时间 的发货信息
    var SQL_CT_SHIPINFO_SELECT_NOT_RECEIVED="" +
        "SELECT " +
        "   id AS shipId, " +
        "   displayShipId, " +
        //"   autoSwitchToReceivedDate AS autoSwitchToReceivedDate " +
        "DATE_FORMAT(autoSwitchToReceivedDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS autoSwitchToReceivedDate " +
        "FROM " +
        "   %s.ShipInfo " +
        "WHERE " +
        "   isReceived=false " +
        "AND " +
        "   autoSwitchToReceivedDate<now()";
    var SQL_CT_SHIPINFO_SELECT_BY_STATUS="" +
        "SELECT status, Count(ShipInfo.id AS shipId) " +
        "  FROM " +
        "%s.ShipInfo  " +
        "   WHERE " +
        "ShipInfo.clientId=%d " +
        "   AND " +
        "ShipInfo.isReceived=%s";

    var SQL_CT_COUNT_SHIPS_BY_STATUS =  "SELECT status, COUNT(*) AS num  FROM %s.ShipInfo " +
        " WHERE clientId = %d GROUP BY status;";

    var SQL_CT_SHIPINFO_SELECT =
        "SELECT ShipInfo.id AS shipId, " +
        "ShipInfo.displayShipId," +
        "ShipInfo.billNo AS billNo, " +
        "DATE_FORMAT(ShipInfo.shipTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipTime," +
        "ShipInfo.orderId AS orderId, " +
        "DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderTime," +
        "OrderInfo.clientId AS clientId, " +
        "OrderInfo.status AS orderStatus, " +
        "OrderInfo.displayOrderId AS displayOrderId, " +
        "Client.clientName AS clientName, " +
        "ShipInfo.shipDescription AS shipDescription," +
        "ShipInfo.isShipped AS isShipped, " +
        "ShipInfo.senderId AS senderId," +
        "ShipInfo.senderName AS senderName," +
        "ShipInfo.shipDate AS shipDate," +
        "ShipInfo.logisticsNo AS logisticsNo," +
        "ShipInfo.isReceived AS isReceived," +
        "ShipInfo.receiverId AS receiverId, "  +
        "ShipInfo.receiverName AS receiverName," +
        "ShipInfo.receivedDate AS receivedDate," +
        "ShipInfo.receiveRemark AS receiveRemark," +
        "ShipDetails.quantity    AS quantity, " +
        "ShipDetails.amount      AS amount " +
        "FROM %s.ShipInfo " +
        "LEFT JOIN %s.OrderInfo ON ShipInfo.orderId=OrderInfo.id  " +
        "LEFT JOIN %s.Client ON Client.id=OrderInfo.clientId " +
        "LEFT JOIN " +
        "   %s.ShipDetails " +
        "ON " +
        "   ShipDetails.shipId = ShipInfo.id " +
        "%s " +              // where clause
        "%s " +              // sort by clause
        "%s;";               // limit clause

    var SQL_CT_SHIPINFO_SELECT_ALL = "" +
        "SELECT " +
        "   DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderTime," +
        "   OrderInfo.clientId      AS clientId, " +
        "   OrderInfo.status        AS orderStatus, " +
        "   OrderInfo.displayOrderId        AS displayOrderId, " +
        "" +
        "   Client.clientName       AS clientName, " +
        "" +
        "   ShipInfo.id             AS shipId, " +
        "   ShipInfo.displayShipId, " +
        "   ShipInfo.billNo         AS billNo, " +
        "   DATE_FORMAT(ShipInfo.shipTime, '%%Y-%%m-%%d %%H:%%i:%%S') AS shipTime," +
        "   ShipInfo.orderId        AS orderId, " +
        "   ShipInfo.shipDescription AS shipDescription," +
        "   ShipInfo.isShipped      AS isShipped, " +
        "   ShipInfo.senderId       AS senderId," +
        "   ShipInfo.senderName     AS senderName," +
        "   DATE_FORMAT(ShipInfo.shipDate, '%%Y-%%m-%%d %%H:%%i:%%S') AS shipDate," +
        "   ShipInfo.logisticsNo    AS logisticsNo," +
        "   ShipInfo.isReceived     AS isReceived," +
        "   ShipInfo.receiverId     AS receiverId, "  +
        "   ShipInfo.receiverName   AS receiverName," +
        "   DATE_FORMAT(ShipInfo.receivedDate, '%%Y-%%m-%%d %%H:%%i:%%S') AS receivedDate," +
        "   ShipInfo.receiveRemark  AS receiveRemark, " +
        "" +
        "   ShipDetails.quantity    AS quantity,  " +
        "   ShipDetails.shippedQuantitySum    AS shippedQuantitySum,  " +
        "   ShipDetails.amount      AS amount " +
        "" +
        "FROM " +
        "   %s.ShipInfo " +
        "LEFT JOIN " +
        "   %s.OrderInfo " +
        "ON " +
        "   ShipInfo.orderId=OrderInfo.id  " +
        "LEFT JOIN " +
        "   %s.Client " +
        "ON " +
        "   Client.id=OrderInfo.clientId " +
        "LEFT JOIN " +
        "   %s.ShipDetails " +
        "ON " +
        "   ShipDetails.shipId = ShipInfo.id " +
        "%s " +              // where clause
        "%s " +              // sort by clause
        "%s;";               // limit clause

    var SQL_CT_SHIPINFO_SELECTBY_ORDERID = "SELECT " +
        "ShipInfo.id AS shipId, " +
        "ShipInfo.displayShipId, " +
        "ShipInfo.billNo AS billNo, " +
        "DATE_FORMAT(ShipInfo.shipTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipTime," +
        "ShipInfo.orderId AS orderId, " +
        "ShipInfo.shipDescription AS shipDescription," +
        "ShipInfo.isShipped AS isShipped, " +
        "ShipInfo.senderId AS senderId," +
        "ShipInfo.senderName AS senderName," +
        "ShipInfo.shipDate AS shipDate," +
        "ShipInfo.logisticsNo AS logisticsNo," +
        "ShipInfo.isReceived AS isReceived," +
        "ShipInfo.receiverId AS receiverId, "  +
        "ShipInfo.receiverName AS receiverName," +
        "ShipInfo.receivedDate AS receivedDate," +
        "ShipInfo.receiveRemark AS receiveRemark, " +
        "ShipInfo.remark AS shipRemark, " +
        "ShipDetails.quantity AS quantity, " +
        "ShipDetails.batchNum AS batchNum, " +
        "ShipDetails.batchNo AS batchNo, " +
        "ShipDetails.shippedQuantitySum AS shippedQuantitySum, " +
        "ShipDetails.soldPrice AS soldPrice,  " +
        "DATE_FORMAT(ShipDetails.goodsProduceDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsProduceDate," +
        "DATE_FORMAT(ShipDetails.goodsValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsValidDate," +
        "ShipDetails.inspectReportURL AS inspectReportURL, " +
        "ShipDetails.drugESC AS drugESC, " +
        "ShipDetails.receivedQuantity AS receivedQuantity, " +
        "ShipDetails.remark AS shipDetailRemark, " +
        "Client.clientName AS clientName, " +
        "GoodsInfo.commonName AS commonName," +
        "GoodsInfo.goodsNo AS goodsNo," +
        "GoodsInfo.alias AS alias," +
        "GoodsInfo.spec AS spec," +
        "GoodsInfo.licenseNo AS licenseNo," +
        "GoodsInfo.measureUnit AS measureUnit," +
        "GoodsInfo.largePackNum as largePackNum," +
        "GoodsInfo.measureUnit as largePackUnit," +
        "GoodsInfo.middlePackNum as middlePackNum," +
        "GoodsInfo.measureUnit as middlePackUnit," +
        "GoodsInfo.smallPackNum as smallPackNum," +
        "GoodsInfo.measureUnit as smallPackUnit," +
        "GoodsInfo.imageUrl AS imageUrl," +
        "GoodsInfo.supplier AS supplier," +
        "GoodsInfo.producer AS producer," +
        "OrderInfo.hasReceipt AS hasReceipt," +
        "OrderInfo.receiptTitle AS receiptTitle," +
        "OrderDetails.goodsId AS goodsId, " +
        "OrderDetails.quantity AS orderQuantity, " +
        "OrderDetails.shippedQuantity AS shippedQuantity, " +
        "DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderTime " +
        "FROM %s.ShipInfo " +
        "CROSS JOIN %s.OrderDetails " +
        "CROSS JOIN %s.OrderInfo " +
        "CROSS JOIN %s.Client " +
        "CROSS JOIN %s.ShipDetails " +
        "CROSS JOIN %s.GoodsInfo " +
        "WHERE ShipInfo.orderId= %d " +
        "AND ShipInfo.orderId = OrderDetails.orderId " +
        "AND ShipInfo.orderId = OrderInfo.id " +
        "AND Client.id=OrderInfo.clientId " +
        "AND ShipInfo.id=ShipDetails.shipId " +
        "AND OrderDetails.goodsId=ShipDetails.goodsId " +
        "AND OrderDetails.goodsId=GoodsInfo.Id " +
        "ORDER BY ShipInfo.id DESC;";

    //todo 这里大中小包没有去掉，只是加入了measureUnit
    var SQL_CT_SHIPDETAILS_SELECT_BY_ID = "SELECT " +
        "ShipDetails.shipId AS shipId," +
        "ShipDetails.goodsId AS goodsId," +
        "ShipDetails.detailNo AS detailNo," +
        "ShipDetails.quantity AS quantity, " +
        "ShipDetails.batchNum AS batchNum, " +
        "ShipDetails.soldPrice AS soldPrice , " +
        "ShipDetails.remark AS shipDetailRemark, " +
        "DATE_FORMAT(ShipDetails.goodsProduceDate,'%%Y-%%m-%%d') AS goodsProduceDate," +
        "DATE_FORMAT(ShipDetails.goodsValidDate,'%%Y-%%m-%%d') AS goodsValidDate," +
        "ShipDetails.drugESC AS drugESC, " +
        "ShipDetails.inspectReportURL AS inspectReportURL, " +
        "ShipDetails.receivedQuantity AS receivedQuantity, " +
        "DATE_FORMAT(ShipInfo.shipTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipTime," +
        "ShipInfo.logisticsNo AS logisticsNo," +
        "ShipInfo.isReceived AS isReceived," +
        "ShipInfo.remark AS remark," +
        "ShipInfo.clientId AS clientId, " +
        "ShipInfo.orderId as orderId, " +
        "ShipDetails.receivedRemark AS receiveRemark, " +
        "OrderDetails.soldPrice AS soldPrice,  " +
        "OrderDetails.quantity AS orderGoodQuantity," +
  /*      "OrderDetails.shippedQuantity AS shippedGoodQuantity," +*/
        "ShipDetails.orderDetailQuantity AS orderQuantity," +
        "ShipDetails.shippedQuantitySum AS shippedQuantitySum," +

        "DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderTime, " +
        "OrderInfo.status AS status," +
        "OrderInfo.id AS orderId," +
        "OrderInfo.displayOrderId, " +
        "OrderInfo.paymentType AS paymentType," +
        "OrderInfo.hasReceipt AS hasReceipt," +
        "OrderInfo.receiptTitle AS receiptTitle," +
        "Client.clientName AS clientName, " +
        "GoodsGsp.isNationalMedicine as isNationalMedicine, "  +
        "GoodsGsp.isMedicalInsuranceDrugs as isMedicalInsuranceDrugs, "  +
        "GoodsGsp.isPrescriptionDrugs as isPrescriptionDrugs , "  +
        "GoodsInventory.isSplit as isSplit, " +
        "GoodsInfo.commonName AS commonName," +
        "GoodsInfo.goodsNo AS goodsNo," +
        "GoodsInfo.alias AS alias," +
        "GoodsInfo.licenseNo AS licenseNo," +
        "GoodsInfo.spec AS spec," +
        "GoodsInfo.measureUnit as measureUnit," +
        "GoodsInfo.largePackNum as largePackNum," +
        "GoodsInfo.measureUnit as largePackUnit," +
        "GoodsInfo.middlePackNum as middlePackNum," +
        "GoodsInfo.measureUnit as middlePackUnit," +
        "GoodsInfo.smallPackNum as smallPackNum," +
        "GoodsInfo.measureUnit as smallPackUnit," +
        "GoodsInfo.imageUrl AS imageUrl," +
        "GoodsInfo.supplier AS supplier," +
        "GoodsInfo.producer AS producer," +
        "GoodsInfo.measureUnit AS measureUnit " +
        "FROM %s.ShipDetails " +
        "LEFT JOIN %s.ShipInfo ON ShipDetails.shipId = ShipInfo.id " +
        "LEFT JOIN %s.GoodsInfo ON ShipDetails.goodsId = GoodsInfo.id " +
        "LEFT JOIN %s.GoodsGsp ON GoodsGsp.goodsId = GoodsInfo.id " +
        "LEFT JOIN %s.GoodsInventory ON GoodsInfo.id = GoodsInventory.goodsId " +
        "LEFT JOIN %s.OrderInfo ON ShipInfo.orderId = OrderInfo.id " +
        "LEFT JOIN %s.OrderDetails ON ShipInfo.orderId = OrderDetails.orderId " +
        "   AND ShipDetails.goodsId =OrderDetails.goodsId  " +
        "LEFT JOIN %s.Client ON Client.id=OrderInfo.clientId  " +
        "WHERE ShipDetails.shipId = %d  "+//AND OrderDetails.goodsId = ShipDetails.goodsId " +
        "ORDER BY ShipDetails.goodsId DESC;";


    var SQL_CT_SELECT_BATCHNUM_FROM_SHIPDETAILS_BY_ID = "SELECT " +
        "ShipDetails.shipId AS shipId," +
        "ShipDetails.goodsId AS goodsId," +
        "ShipDetails.batchNum AS batchNum " +
        "FROM %s.ShipDetails " +
        "WHERE ShipDetails.shipId = %d ;";

    var SQL_CT_SHIPDETAILS_SELECT_BY_ORDERID = "SELECT " +
        "ShipDetails.shipId AS shipId," +
        "ShipDetails.goodsId AS goodsId," +
        "ShipDetails.drugESC AS drugESC, " +
        "ShipDetails.batchNum AS batchNum, " +
        "ShipDetails.inspectReportURL AS inspectReportURL, " +
        "DATE_FORMAT(ShipDetails.goodsProduceDate,'%%Y-%%m-%%d') AS goodsProduceDate," +
        "DATE_FORMAT(ShipDetails.goodsValidDate,'%%Y-%%m-%%d') AS goodsValidDate," +
        "ShipDetails.detailNo AS detailNo," +
        "ShipDetails.orderBillOutDetailUid AS orderBillOutDetailUid," +
        "ShipDetails.quantity AS shippedQuantity, " +//实际发货数量
        "ShipDetails.shippedQuantitySum AS shippedQuantitySum, " +//发货数量合计
        "ShipDetails.receivedQuantity AS receivedQuantity, " +//实际收货数量
        "ShipDetails.orderDetailQuantity AS orderDetailQuantity, " +//订单数量
        "ShipDetails.receivedRemark AS receiveRemark, " +
        "ShipDetails.soldPrice AS soldPrice, " +//下定单的时候的价格
        "ShipDetails.amount AS amount, " +//下定单的时候的小计
        "ShipDetails.remark AS shipDetailRemark, " +
        "ShipDetails.inspectReportURL AS inspectReportURL, " +
        "DATE_FORMAT(ShipInfo.shipTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipTime," +
        "ShipInfo.logisticsNo AS logisticsNo," +
        "ShipInfo.remark AS remark," +
        "OrderDetails.quantity AS orderQuantity," +
        "DATE_FORMAT(OrderDetails.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderTime," +
        "OrderInfo.status AS status," +
        "OrderInfo.id AS orderId," +
        "OrderInfo.displayOrderId, " +
        "Client.clientName AS clientName, " +
        "GoodsGsp.isNationalMedicine as isNationalMedicine, "  +
        "GoodsGsp.isMedicalInsuranceDrugs as isMedicalInsuranceDrugs, "  +
        "GoodsGsp.isPrescriptionDrugs as isPrescriptionDrugs , "  +
        "GoodsInventory.isSplit as isSplit, " +
        "GoodsInfo.commonName AS commonName," +
        "GoodsInfo.goodsNo AS goodsNo," +
        "GoodsInfo.alias AS alias," +
        "GoodsInfo.spec AS spec," +
        "GoodsInfo.licenseNo AS licenseNo," +
        "GoodsInfo.largePackNum as largePackNum," +
        "GoodsInfo.measureUnit as largePackUnit," +
        "GoodsInfo.middlePackNum as middlePackNum," +
        "GoodsInfo.measureUnit as middlePackUnit," +
        "GoodsInfo.smallPackNum as smallPackNum," +
        "GoodsInfo.measureUnit as smallPackUnit," +
        "GoodsInfo.imageUrl AS imageUrl," +
        "GoodsInfo.supplier AS supplier," +
        "GoodsInfo.producer AS producer," +
        "GoodsInfo.measureUnit AS measureUnit " +
        "FROM %s.ShipDetails " +
        "LEFT JOIN %s.ShipInfo ON ShipDetails.shipId = ShipInfo.id " +
        "LEFT JOIN %s.GoodsInfo ON ShipDetails.goodsId = GoodsInfo.id " +
        "LEFT JOIN %s.GoodsGsp ON GoodsGsp.goodsId = GoodsInfo.id " +
        "LEFT JOIN %s.GoodsInventory ON GoodsInfo.id = GoodsInventory.goodsId " +
        "LEFT JOIN %s.OrderInfo ON ShipInfo.orderId = OrderInfo.id " +
        "LEFT JOIN %s.OrderDetails ON (ShipInfo.orderId = OrderDetails.orderId  AND OrderDetails.goodsId=ShipDetails.goodsId) " +
        "LEFT JOIN %s.Client ON Client.id=OrderInfo.clientId  " +
        "WHERE ShipInfo.orderId = %d " +
        "ORDER BY ShipDetails.shipId DESC;";

        /*    var SQL_CT_RETURNINFO_SELECT = "SELECT " +
        "ReturnInfo.id AS id," +
        "ReturnInfo.shipId AS shipId," +
        "ReturnInfo.orderId AS orderId," +
        "ReturnInfo.operatorId AS operatorId, " +
        "ReturnInfo.status AS status," +
        "ReturnInfo.confirmDate AS confirmDate," +
        "ReturnInfo.remark AS remark, " +
        "Client.clientName AS clientName, " +
        "DATE_FORMAT(ReturnInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn,  " +
        "ReturnDetails.quantity as quantity " +
        "FROM  %s.ReturnInfo " +
        "LEFT JOIN %s.Operator ON ReturnInfo.operatorId=Operator.id " +
        "LEFT JOIN %s.Client ON Operator.clientId=Client.id " +
        "LEFT JOIN %s.ReturnDetails ON ReturnInfo.id = ReturnDetails.returnId " +
        //"WHERE Client.id = %d " +
        "%s " +              // where clause
        "%s " +              // sort by clause
        "%s;"; */              // limit clause



    var SQL_CT_RETURNINFO_SELECT = "SELECT " +
        "ReturnInfo.id AS id," +
        "ReturnInfo.displayReturnId AS displayReturnId," +
        "ReturnInfo.shipId AS shipId," +
        "ReturnInfo.orderId AS orderId," +
        "ReturnInfo.operatorId AS operatorId, " +
        "ReturnInfo.status AS status, " +
        "ReturnInfo.beforeCloseStatus AS beforeCloseStatus, " +
        //"ReturnInfo.createdOn AS applyDate, " +
        "ReturnInfo.confirmDate AS confirmDate," +
        "ReturnInfo.remark AS applyReturnRemark, " +
        "" +
        "ReturnInfo_Goods_Map.price AS returnPrice, " +
        "ReturnInfo_Goods_Map.goodsId AS goodsId, " +
        "ReturnInfo_Goods_Map.applyQuantity AS applyQuantity, " +
        "ReturnInfo_Goods_Map.approvedQuantity AS approvedQuantity, " +
        "ReturnInfo_Goods_Map.returnShippedQuantity AS returnShippedQuantity, " +
        "ReturnInfo_Goods_Map.receiveShippedQuantity AS receiveShippedQuantity ," +
        "" +
        "OrderInfo.displayOrderId, " +
        "" +
        "ClientGoodsPrice.price AS price, " +
        "Client.clientName AS clientName, " +
        "DATE_FORMAT(ReturnInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn,  " +
        //"ReturnDetails.quantity as quantity " +
        "ReturnDetails.quantity as returnDetailApplyQuantity,  " +
        "ReturnDetails.approvedQuantity as returnApprovedQuantity, " +
        "ReturnDetails.returnQuantity as returnDetailShippedQuantity, " +
        "ReturnDetails.returnDeliveredQuantity as returnDeliveredQuantity  "+
        "FROM  %s.ReturnInfo  " +
        "LEFT JOIN %s.ReturnInfo_Goods_Map on ReturnInfo.id=ReturnInfo_Goods_Map.returnId " +
        "LEFT JOIN %s.Operator ON ReturnInfo.operatorId=Operator.id " +
        "LEFT JOIN %s.Client ON Operator.clientId=Client.id " +
        "LEFT JOIN %s.OrderInfo ON OrderInfo.id=ReturnInfo.orderId " +
        "LEFT JOIN %s.ClientGoodsPrice ON ClientGoodsPrice.clientId=Client.id " +
        "   AND " +
        "ClientGoodsPrice.goodsId=ReturnInfo_Goods_Map.goodsId  " +
        "" +
        "LEFT JOIN %s.ReturnDetails ON ReturnInfo.id = ReturnDetails.returnId AND " +
        "  ReturnInfo_Goods_Map.goodsId = ReturnDetails.goodsId " +
        "  " +
            //"WHERE Client.id = %d " +
        "%s " +              // where clause
        "%s " +              // sort by clause
        "%s;";

    //退货单详情  modify 0325
    var SQL_CT_APPLY_RETURNINFO="" +
        "SELECT " +
        "   ReturnInfo.id AS id, " +
        "   ReturnInfo.orderId AS orderId, " +
        "   ReturnInfo.displayReturnId AS displayReturnId, " +
        "   ReturnInfo.shipId AS shipId, " +
        "   ReturnInfo.operatorId AS operatorId, " +
        "   ReturnInfo.status AS returnStatus, " +
        "   ReturnInfo.beforeCloseStatus AS beforeCloseStatus, " +//关闭前退货单状态
        "   ReturnInfo.remark AS remark, " + //申请退货的时候退货单的备注
        "   ReturnInfo.replyRemark AS replyRemark, " + //商家审核备注
        "   ReturnInfo.returnShipRemark AS returnShipRemark, "+//客户退货发货的时候退货单的备注
        "   ReturnInfo.returnDeliveredRemark AS returnDeliveredRemark, "+//商户退货收货的时候填写的备注
        "   ReturnInfo.logisticsNo AS logisticsNo, "+//退货单的物流信息
        "   DATE_FORMAT(ReturnInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS applyDate, " + //申请退货的时间
        "" +
        "   ReturnDetails.detailNo AS detailNo," +//退货详情数据
        "   ReturnDetails.quantity AS quantity, " + //申请退货数量
        "   ReturnDetails.approvedQuantity AS batchApprovedQuantity,  " + //实际允许退回的批次数量
        "   ReturnDetails.returnDeliveredQuantity AS returnDeliveredQuantity,  " + //特定批次实际收货数量
        "   ReturnDetails.returnQuantity AS batchNumQuantity, " + //特定批次实际退回数量
        "   ReturnDetails.batchNum AS batchNum,  " +
        "   ReturnDetails.inspectReportURL  AS inspectReportURL ," +
        "   ReturnDetails.drugESC AS  drugESC,  " + //客户发货的时候的电子监管码
        "   DATE_FORMAT(ReturnDetails.goodsProduceDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsProduceDate, " +
        "   DATE_FORMAT(ReturnDetails.goodsValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsValidDate, " +
        "   ReturnDetails.deliveredDrugESC AS deliveredDrugESC,  " +  //商户确认退货收货时录入的电子监管码
        "   ReturnDetails.inspectReportURL AS returnInspectReportURL, " +
        "" +
        "   ReturnInfo_Goods_Map.price AS returnPrice, " +
        "   ReturnInfo_Goods_Map.goodsId AS goodsId, " +
        "   ReturnInfo_Goods_Map.approvedQuantity as approvedQuantity, " +//商家允许某商品退货的总数量
        "   ReturnInfo_Goods_Map.applyQuantity AS applyQuantity, " +//某商品申请退货的总数量
        "   ReturnInfo_Goods_Map.returnShippedQuantity as returnShippedQuantity, " +   //客户实际退回的商品的总数量
        "   ReturnInfo_Goods_Map.receiveShippedQuantity as receiveShippedQuantity, " + //商户实际接收的商品的总数量
        "   ReturnInfo_Goods_Map.remark AS returnGoodsRemark, " +//申请退货的时候 单个商品的备注
        "" +
        "   Client.clientName AS applyClientName, " + //申请退货的客户名称
        "   Client.id AS clientId, " + //clientId
        "" +
        "GoodsGsp.isNationalMedicine as isNationalMedicine, "  +
        "GoodsGsp.isMedicalInsuranceDrugs as isMedicalInsuranceDrugs, "  +
        "GoodsGsp.isPrescriptionDrugs as isPrescriptionDrugs , "  +
        "GoodsInventory.isSplit as isSplit, " +
        "" +
        "   GoodsInfo.commonName AS commonName, " +   //商品数据
        "   GoodsInfo.alias AS alias," +
        "   GoodsInfo.goodsNo AS goodsNo," +
        "   GoodsInfo.spec AS spec," +
        "   GoodsInfo.licenseNo AS licenseNo," +
        "   GoodsInfo.measureUnit as measureUnit," +
        "   GoodsInfo.largePackNum as largePackNum," +
        "   GoodsInfo.measureUnit as largePackUnit," +
        "   GoodsInfo.middlePackNum as middlePackNum," +
        "   GoodsInfo.measureUnit as middlePackUnit," +
        "   GoodsInfo.smallPackNum as smallPackNum," +
        "   GoodsInfo.measureUnit as smallPackUnit," +
        "   GoodsInfo.imageUrl AS imageUrl," +
        "   GoodsInfo.supplier AS supplier," +
        "   GoodsInfo.producer AS producer," +
        "   GoodsInfo.measureUnit AS measureUnit  " +
        "   FROM %s.ReturnInfo,%s.ReturnDetails,%s.ReturnInfo_Goods_Map,%s.GoodsInfo,%s.Client,%s.Operator,%s.GoodsGsp,%s.GoodsInventory" +
        "   WHERE " +
        "   ReturnInfo.id=%d  " +
        "   AND ReturnDetails.returnId = ReturnInfo.id" +
        "   AND ReturnInfo_Goods_Map.returnId = ReturnInfo.id AND ReturnInfo_Goods_Map.goodsId = ReturnDetails.goodsId " +
        "   AND ReturnDetails.goodsId = GoodsInfo.id" +
        "   AND ReturnInfo.operatorId = Operator.id" +
        "   AND GoodsGsp.goodsId = GoodsInfo.id" +
        "   AND GoodsInventory.goodsId = Operator.id" +
        "   AND Operator.clientId = Client.id" +
        ";";



    var SQL_CT_RETURNINFO_SELECT_ALL = "" +
        "SELECT " +
        "   ReturnInfo.id AS id," +
        "   ReturnInfo.shipId AS shipId," +
        "   ReturnInfo.orderId AS orderId," +
        "   ReturnInfo.operatorId AS operatorId, " +
        "   ReturnInfo.status AS status," +
        "   ReturnInfo.confirmDate AS confirmDate," +
        "   ReturnInfo.remark AS remark, " +
        "" +
        "   Client.clientName AS clientName, " +
        "   DATE_FORMAT(ReturnInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn,  " +
        "" +
        "   ReturnDetails.quantity as quantity, " +
        "   ReturnDetails.approvedQuantity as approvedQuantity, " +
        "   ReturnDetails.returnQuantity as returnQuantity, " +
        "   ReturnDetails.returnDeliveredQuantity as returnDeliveredQuantity " +
        "" +
        "FROM  %s.ReturnInfo " +
        "LEFT JOIN %s.Operator ON ReturnInfo.operatorId=Operator.id " +
        "LEFT JOIN %s.Client ON Operator.clientId=Client.id " +
        "LEFT JOIN %s.ReturnDetails ON ReturnInfo.id = ReturnDetails.returnId " +
        "%s " +              // where clause
        "%s " +              // sort by clause
        "%s;";               // limit clause

    //todo 这里大中小包没有去掉，只是加入了measureUnit
    var SQL_CT_RETURNDETAILS_SELECT_BY_ID = "SELECT " +
        "ReturnInfo.id AS id," +
        "ReturnInfo.shipId AS shipId," +
        "ReturnInfo.orderId AS orderId," +
        "ReturnDetails.goodsId AS goodsId," +
        "ReturnInfo.operatorId AS operatorId, " +
        "ReturnInfo.customerReply AS customerReply, " +
        "ReturnDetails.quantity AS returnQuantity, " +
        "ReturnDetails.approvedQuantity AS approvedQuantity, " +
        "ReturnInfo.status AS status," +
        "DATE_FORMAT(ReturnInfo.confirmDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS confirmDate, " +
        "ReturnInfo.remark AS remark, " +
        "ReturnInfo.logisticsNo AS logisticsInfo ,"+
        "DATE_FORMAT(ReturnInfo.returnLogisticsDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS returnLogisticsApplyTime ,"+
        "ReturnInfo.returnShipRemark AS returnShipRemark, " +
        "GoodsInfo.commonName AS commonName," +
        "GoodsInfo.alias AS alias," +
        "GoodsInfo.goodsNo AS goodsNo," +
        "GoodsInfo.spec AS spec," +
        "GoodsInfo.licenseNo AS licenseNo," +
        "GoodsInfo.measureUnit as measureUnit," +
        "GoodsInfo.largePackNum as largePackNum," +
        "GoodsInfo.measureUnit as largePackUnit," +
        "GoodsInfo.middlePackNum as middlePackNum," +
        "GoodsInfo.measureUnit as middlePackUnit," +
        "GoodsInfo.smallPackNum as smallPackNum," +
        "GoodsInfo.measureUnit as smallPackUnit," +
        "GoodsInfo.imageUrl AS imageUrl," +
        "OrderDetails.quantity AS orderQuantity," +
        "ShipInfo.logisticsNo AS logisticsNo," +
        "DATE_FORMAT(ShipInfo.shipTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipTime," +
        "GoodsInfo.supplier AS supplier," +
        "GoodsInfo.producer AS producer," +
        "GoodsInfo.measureUnit AS measureUnit, " +
        "DATE_FORMAT(ReturnInfo.updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn,  " +
        "DATE_FORMAT(ReturnInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn  " +
        "FROM  %s.ReturnInfo " +
        "LEFT JOIN %s.ReturnDetails ON ReturnInfo.id = ReturnDetails.returnId " +
        "LEFT JOIN %s.GoodsInfo ON ReturnDetails.goodsId = GoodsInfo.id " +
        "LEFT JOIN %s.OrderDetails ON  (ReturnDetails.goodsId=OrderDetails.goodsId AND ReturnInfo.orderId = OrderDetails.orderId) " +
        "LEFT JOIN %s.ShipInfo ON  ReturnInfo.shipId = ShipInfo.id " +
        "WHERE ReturnInfo.id= %d " +
        "GROUP BY ReturnDetails.goodsId;";

    //todo 这里大中小包没有去掉，只是加入了measureUnit
    var SQL_CT_BATCH_RETURNDETAILS_SELECT_BY_ID = "SELECT  " +
        "ReturnDetails.returnId AS returnId, " +
        "ReturnDetails.goodsId AS goodsId, " +
        "ReturnDetails.batchNum AS batchNum, " +
        "ReturnDetails.drugESC AS drugESC, " +
        "ReturnDetails.deliveredDrugESC AS deliveredDrugESC, " +
        "ShipDetails.inspectReportURL AS inspectReportURL, " +
        "DATE_FORMAT(ShipDetails.goodsProduceDate,'%%Y-%%m-%%d') AS goodsProduceDate,  " +
        "DATE_FORMAT(ShipDetails.goodsValidDate,'%%Y-%%m-%%d') AS goodsValidDate,  " +
        "ReturnDetails.quantity AS returnQuantity, " +
        "ReturnDetails.approvedQuantity AS approvedQuantity, " +
        "ReturnDetails.returnQuantity AS finalReturnQuantity, " +
        "ReturnDetails.returnDeliveredQuantity  AS returnDeliveredQuantity, " +
        "ReturnInfo.status AS status," +
        "DATE_FORMAT(ReturnInfo.confirmDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS confirmDate, " +
        "GoodsInfo.commonName AS commonName," +
        "GoodsInfo.alias AS alias," +
        "GoodsInfo.goodsNo AS goodsNo," +
        "GoodsInfo.spec AS spec," +
        "GoodsInfo.licenseNo AS licenseNo," +
        "GoodsInfo.measureUnit as measureUnit," +
        "GoodsInfo.largePackNum as largePackNum," +
        "GoodsInfo.measureUnit as largePackUnit," +
        "GoodsInfo.middlePackNum as middlePackNum," +
        "GoodsInfo.measureUnit as middlePackUnit," +
        "GoodsInfo.smallPackNum as smallPackNum," +
        "GoodsInfo.measureUnit as smallPackUnit," +
        "GoodsInfo.imageUrl AS imageUrl," +
        "Client.clientName AS clientName, " +
        "GoodsInfo.supplier AS supplier," +
        "GoodsInfo.producer AS producer," +
        "GoodsInfo.measureUnit AS measureUnit, " +
        "DATE_FORMAT(ReturnInfo.updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn,  " +
        "DATE_FORMAT(ReturnInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn  " +
        "FROM  %s.ReturnDetails " +
        "LEFT JOIN %s.ReturnInfo ON ReturnInfo.id = ReturnDetails.returnId " +
        "LEFT JOIN %s.GoodsInfo ON ReturnDetails.goodsId = GoodsInfo.id " +
        "LEFT JOIN %s.Operator ON ReturnInfo.operatorId=Operator.id  " +
        "LEFT JOIN %s.Client ON Operator.clientId=Client.id " +
        "LEFT JOIN %s.ShipDetails ON ShipDetails.batchNum=ReturnDetails.batchNum " +
        "WHERE ReturnDetails.returnId = %d;";

    var SQL_CT_RETURNDETAILS_QTY_SELECT_BY_SHIPID = "SELECT " +
        "SUM(ReturnDetails.returnQuantity) as returnQuantity, " +
        "ReturnDetails.goodsId " +
        "FROM %s.ReturnDetails, %s.ReturnInfo  " +
        "WHERE ReturnDetails.returnId = ReturnInfo.id " +
        "AND ReturnInfo.status<>'ClOSED'" +
        "AND ReturnInfo.status<>'REJECTED' " +
        "AND ReturnInfo.shipId = %d " +
        "GROUP BY ReturnDetails.goodsId ;";


    var SQL_CT_RETURNSTATUS_UPDATE_WITH_CONFIRMDATE = "UPDATE %s.ReturnInfo SET %s, confirmDate=CURRENT_TIMESTAMP WHERE id=%d;";

    var SQL_CT_RETURNSTATUS_UPDATE = "UPDATE %s.ReturnInfo SET %s  WHERE id=%d;";

    var SQL_CT_RETURNDETAILS_UPDATE = "UPDATE %s.ReturnDetails SET approvedQuantity=%d  WHERE returnId=%d AND goodsId=%d ;";

    var SQL_CT_SHIPINFO_UPDATE = "UPDATE %s.ShipInfo SET %s WHERE id=%d;";

    var SQL_CT_SHIPDETAILS_UPDATE_RECEIVE = "INSERT INTO %s.ShipDetails (shipId,goodsId,batchNum,receivedQuantity,drugESC,receivedRemark) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "shipId=VALUES(shipId),goodsId=VALUES(goodsId),batchNum=VALUES(batchNum),receivedQuantity=VALUES(receivedQuantity),drugESC=VALUES(drugESC), receivedRemark=VALUES(receivedRemark) ;";

    var SQL_CT_META_RETURNDETAILS_UPDATE = "INSERT INTO %s.ReturnDetails (returnId,goodsId,batchNum,returnQuantity,drugESC) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "returnId=VALUES(returnId),goodsId=VALUES(goodsId),batchNum=VALUES(batchNum),returnQuantity=VALUES(returnQuantity),drugESC=VALUES(drugESC);";

    var SQL_CT_META_RETURNDETAILS_DELIVERED = "INSERT INTO %s.ReturnDetails (returnId,goodsId,batchNum,returnDeliveredQuantity,deliveredDrugESC) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "returnId=VALUES(returnId),goodsId=VALUES(goodsId),batchNum=VALUES(batchNum),returnDeliveredQuantity=VALUES(returnDeliveredQuantity),deliveredDrugESC=VALUES(deliveredDrugESC);";



    var SQL_CT_SElECT_BATCHINFO_BY_BATCHNUM = "SELECT " +
        "batchNum, " +
        "inspectReportURL, " +
        "DATE_FORMAT(goodsProduceDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsProduceDate, " +
        "DATE_FORMAT(goodsValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsValidDate " +
        "FROM %s.ShipDetails " +
        "WHERE batchNum='%s' " +
        "LIMIT 1;";

    var SQL_CT_REJECTSTATUS_UPDATE = "UPDATE %s.RejectInfo SET %s ,receivedDate=CURRENT_TIMESTAMP  WHERE id=%d;";

    var SQL_CT_REJECTINFO_UPDATE   = "UPDATE %s.RejectInfo SET %s ,rejectShipDate=CURRENT_TIMESTAMP where id=%d ";

    //rejectShippedQuantity 字段和 之前定义的 rejectQuantity 重复 ,使用旧的字段
    var SQL_CT_REJECTDETAIL_UPDATE =" INSERT INTO %s.RejectDetails(rejectId,goodsId,batchNum,goodsNotSendRefundQuantity,rejectShippedQuantitySum,rejectQuantity,rejectedDrugESC) " +
        "VALUES ?  " +
        "ON DUPLICATE KEY UPDATE " +
        "goodsNotSendRefundQuantity=VALUES(goodsNotSendRefundQuantity),rejectShippedQuantitySum=VALUES(rejectShippedQuantitySum),rejectQuantity=VALUES(rejectQuantity),rejectedDrugESC=VALUES(rejectedDrugESC)";
                                                                                                     //rejectReceiveQuantity
    var SQL_CT_META_REJECTDETAILS_DELIVERED = "INSERT INTO %s.RejectDetails (rejectId,goodsId,batchNum,rejectReceiveQuantity,rejectedDrugESC,rejectReceiveQuantitySum) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "rejectId=VALUES(rejectId),goodsId=VALUES(goodsId),batchNum=VALUES(batchNum),rejectReceiveQuantity=VALUES(rejectReceiveQuantity),rejectedDrugESC=VALUES(rejectedDrugESC),rejectReceiveQuantitySum=VALUES(rejectReceiveQuantitySum);";
    var SQL_CT_UPDATE_SOLDPRICE_SHIPDETAIL="" +
        "UPDATE " +
        "   %s.ShipDetails " +
        "SET " +
        "   soldPrice= %d " +
        "WHERE " +
        "   shipId= %d " +
        "AND " +
        "   goodsId=%d";
    var SQL_CT_GOODS_INVENTORY_PLAN_DETAILS_UPDATE_TT   = "INSERT INTO %s.GoodsInventoryPlanDetails (id,threshold, content ) " +
        " VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "id=VALUES(id),threshold=VALUES(threshold),content=VALUES(content);";
    var SQL_CT_UPDATE_SOLDPRICE_AND_AMOUNT_SHIPDETAIL="" +
        "INSERT INTO " +
        "   %s.ShipDetails" +
        "   (shipId,goodsId,batchNum,soldPrice ) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "amount=(VALUES(soldPrice)*quantity), soldPrice=VALUES(soldPrice) ";
    //批量更新ReturnInfo_Goods_Map 各个商品总的可退数量 实退数量 以及实收数量
    var SQL_CT_BATCH_INSERT_GGM_QUANTYTY="INSERT INTO %s.ReturnInfo_Goods_Map(returnId,goodsId,price,approvedQuantity,returnShippedQuantity,receiveShippedQuantity)" +
        " VALUES ?" +
        " ON DUPLICATE KEY UPDATE returnId=VALUES(returnId),goodsId=VALUES(goodsId),price=VALUES(price)," +
        " approvedQuantity=VALUES(approvedQuantity),returnShippedQuantity=VALUES(returnShippedQuantity),receiveShippedQuantity=VALUES(receiveShippedQuantity)";
    //批量插入ReturnDetails
    var SQL_CT_BATCH_INSERT_RETURNDETAILS="INSERT INTO %s.ReturnDetails(returnId,goodsId,batchNum,returnQuantity,approvedQuantity,goodsProduceDate,goodsValidDate,drugESC,inspectReportURL) " +
        " VALUES ?" +
        " ON DUPLICATE KEY UPDATE " +
        " returnId=VALUES(returnId),goodsId=VALUES(goodsId),batchNum=VALUES(batchNum),approvedQuantity=VALUES(approvedQuantity),returnQuantity=VALUES(returnQuantity)," +
        " goodsProduceDate=VALUES(goodsProduceDate),goodsValidDate=VALUES(goodsValidDate),drugESC=VALUES(drugESC),inspectReportURL=VALUES(inspectReportURL)";
    //商户退货收货入库
    var SQL_CT_BATCH_UPDATE_RETURNDETAILS="INSERT INTO %s.ReturnDetails(ReturnId,goodsId,batchNum,returnDeliveredQuantity,drugESC) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "returnId=VALUES(returnId),goodsId=VALUES(goodsId),batchNum=VALUES(batchNum),returnDeliveredQuantity=VALUES(returnDeliveredQuantity),drugESC=VALUES(drugESC)";


    //商户和客户关闭退货单,更新状态
    var SQL_CT_CLOSE_RETURNINFO="INSERT INTO %s.ReturnInfo(id,status,closeReturnCustomerId) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "beforeCloseStatus=status,status=VALUES(status),closeDate=now(),closeReturnCustomerId=VALUES(closeReturnCustomerId)";

    //获取退货单历史  连接顺序 先取clientName 然后 各个管理员的操作ID  然后关闭订单的操作人员ID
    var SQL_CT_GET_RETURNINFO_LOG="SELECT " +
        "ReturnInfo.id AS returnId,  " +
        "ReturnInfo.status AS currentStatus, " +
        "a.clientId as applyClientId, " +
        "b.clientName as clientName, " +
        "" +
        "DATE_FORMAT(ReturnInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS applyDate, " +
        "DATE_FORMAT(ReturnInfo.shipDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipDate, " +
        "" +
        "ReturnInfo.beforeCloseStatus AS beforeCloseStatus,  " +
        "DATE_FORMAT(ReturnInfo.closeDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS closeDate, " +
        "ReturnInfo.closeReturnCustomerId as closeReturnCustomerId, " +
        "e.operatorName as closeReturnCustomerName,  " +
        ""+
        "DATE_FORMAT(ReturnInfo.confirmDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS confirmDate, " +
        "ReturnInfo.confirmReturnCustomerId as confirmReturnCustomerId, " +
        "c.operatorName as confirmReturnCustomerName, " +
        "" +
        "DATE_FORMAT(ReturnInfo.receiveDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS receiveDate, " +
        "ReturnInfo.receiveReturnCustomerId AS receiveReturnCustomerId, " +
        "d.operatorName as receiveReturnCustomerName " +
        " " +
        "FROM  " +
        "   %s.ReturnInfo LEFT JOIN (SELECT id,clientId FROM %s.Operator) as a ON a.id=ReturnInfo.operatorId " +
        "   LEFT JOIN %s.Client as b  ON a.clientId=b.id   " +
        "" +
        "   LEFT JOIN (select id,operatorName FROM %s.Operator) as c ON c.id=ReturnInfo.confirmReturnCustomerId " +
        "" +
        "   LEFT JOIN (select id,operatorName FROM %s.Operator) as d ON d.id=ReturnInfo.receiveReturnCustomerId " +
        "" +
        "   LEFT JOIN (select id,operatorName From %s.Operator) as e ON e.id=ReturnInfo.closeReturnCustomerId " +
        "WHERE" +
        "   ReturnInfo.id=%d ;" ;

        /***
         * 新的退货流程相关SQL start
         * 以前的授信退货流程有变化,退货申请的时候需要填写批次信息,所有sql写到这里.
         * 2016.03.18
         */
         var SQL_CT_RETURNINFO_INSERT=
            "INSERT INTO %s.ReturnInfo(operatorId,orderId,shipId,status,remark) " +
            "  VALUES" +
            " (%d,%d,%d,'%s','%s');";
        //比起上一版本多了 price字段
        var SQL_CT_RETURN_GOODS_MAP_INSERT_BATCH="" +
            "INSERT INTO %s.ReturnInfo_Goods_Map(returnId,goodsId,applyQuantity,price) " +
            "VALUES ?";
        //比起上一版本多了 quantity字段
        var SQL_CT_RETURNDETAILS_INSERT_BATCH="" +
            "INSERT INTO " +
            "   %s.ReturnDetails(returnId,goodsId,batchNum,quantity,goodsProduceDate,goodsValidDate,drugESC,inspectReportURL)" +
            "VALUES ?";
        //审核 发货 收货 更新SQL
        var SQL_CT_RETURNINFO_UPDATE=
            "UPDATE %s.ReturnInfo SET %s WHERE id=%d;";
        //审核 发货 收货 更新Return_Goods_Map 中的商品数量
        var SQL_CT_RETURNINFO_GOODS_MAP_UPDATE_BATCH="" +
            "INSERT INTO"+
            "    %s.ReturnInfo_Goods_Map(returnId,goodsId,approvedQuantity,returnShippedQuantity,receiveShippedQuantity)" +
            "VALUES ?" +
            "   ON DUPLICATE KEY UPDATE " +
            "approvedQuantity=VALUES(approvedQuantity),returnShippedQuantity=VALUES(returnShippedQuantity),receiveShippedQuantity=VALUES(receiveShippedQuantity)";

        var SQL_CT_RETURNINFO_DETAILS_UPDATE_BATCH_CHECK="" +
            "INSERT INTO " +
            "   %s.ReturnDetails(returnId,goodsId,batchNum,approvedQuantity,drugESC) " +
            "   VALUES ? " +
            "   ON DUPLICATE KEY UPDATE returnId=VALUES(returnId), goodsId=VALUES(goodsId), batchNum=VALUES(batchNum)," +
            " approvedQuantity=VALUES(approvedQuantity),drugESC=VALUES(drugESC)";
        var SQL_CT_RETURNINFO_DETAILS_UPDATE_BATCH_SHIP="" +
            "INSERT INTO " +
            "   %s.ReturnInfoDetails(returnId,goodsId,batchNum,returnQuantity) " +
            "VALUES ? " +
            "   ON DUPLICATE KEY UPDATE " +
            "returnQuantity=VALUES(returnQuantity)";
        var SQL_CT_RETURNINFO_DETAILS_UPDATE_BATCH_RECIEVE="" +
            "INSERT INTO " +
            "   %s.ReturnInfoDetails(returnId,goodsId,batchNum,returnDeliveredQuantity) " +
            "VALUES ? " +
            "   ON DUPLICATE KEY UPDATE " +
            "returnDeliveredQuantity=VALUES(returnDeliveredQuantity)";





        /**
         *新的退货流程相关SQL  end
         *
         */



    /**
     * DB Service provider
     */
    var dbService = {

        metaUpdateReturnDetailsCheck:function(connect,customerDB,batchData,callback){
            logger.enter();
            logger.debug(JSON.stringify(batchData));
            var sql=sprintf(SQL_CT_RETURNINFO_DETAILS_UPDATE_BATCH_CHECK,customerDB);
            logger.sql(sql);
            connect.query(sql,[batchData],function(error,result){
                if(error){
                    logger.sqlerr(error);
                    return callback(error);
                }else{
                    callback(null,result);
                }
            });
        },
        metaUpdateReturnDetailsShip:function(connect,customerDB,batchData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_RETURNINFO_DETAILS_UPDATE_BATCH_SHIP,customerDB);
            logger.sql(sql);
            connect.query(sql,[batchData],function(error,result){
                if(error){
                    logger.sqlerr(error);
                    return callback(error);
                }else{
                    callback(null,result);
                }
            });
        },
        metaUpdateReturnDetailsReceive:function(connect,customerDB,batchData,callback){
            logger.enter();
            logger.enter();
            var sql=sprintf(SQL_CT_RETURNINFO_DETAILS_UPDATE_BATCH_RECIEVE,customerDB);
            logger.sql(sql);
            connect.query(sql,[batchData],function(error,result){
                if(error){
                    logger.sqlerr(error);
                    return callback(error);
                }else{
                    callback(null,result);
                }
            });
        },
        //最新的新增退货单0324
        metaReturnInfoInsert:function(connect,customerDB,operatorId,orderId,shipId,status,remark,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_RETURNINFO_INSERT,customerDB,operatorId,orderId,shipId,status,remark);
            logger.sql(sql);
            connect.query(sql,function(error,result){
                if(error){
                    return callback(error);
                }else{
                    callback(null,result.insertId);
                }
            });
        },
        //最新的新增ReturnInfo_Goods_Map
        metaReturnInfoGoodsMapBatchInsert:function(connect,customerDB,insertData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_RETURN_GOODS_MAP_INSERT_BATCH,customerDB);
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
        //新增新的ReturnDetail数据
        metaReturnDetailsBatchInsert:function(connect,customerDB,updateBatchReturnDetailsData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_RETURNDETAILS_INSERT_BATCH,customerDB);
            logger.sql(sql);

            connect.query(sql,[updateBatchReturnDetailsData],function(err,result){
                if(err){
                    callback(err);
                }
                else{
                    callback(err,result.affectedRows);
                }
            });
        },


        //通过状态和clientId 查询 发货单的条数
        metaRetreiveShipCountsByStatusAndClient:function(customerDB,clientId,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_COUNT_SHIPS_BY_STATUS,customerDB,clientId);
            logger.sql(sql);
            __mysql.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    logger.dump(results.length);
                    callback(err,results);
                }
            });
        },

        //查询出还未收货的所有ShipInfo
        metaRetreiveShipInfosNotReceived:function(customerDB,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_SHIPINFO_SELECT_NOT_RECEIVED,customerDB);
            logger.sql(sql);
            __mysql.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    logger.dump(results.length);
                    callback(err,results);
                }
            });
        },

        //批量更新ReturnDetails
        metaBatchUpdateReturnDetails:function(connect,customerDB,updateBatchReturnDetailsData,callback){
          logger.enter();
          var sql=sprintf(SQL_CT_BATCH_UPDATE_RETURNDETAILS,customerDB);
            logger.sql(sql);
            connect.query(sql,[updateBatchReturnDetailsData],function(err,result){
                if(err){
                    logger.debug(err);
                    callback(err);
                }
                else{
                    callback(err,result.affectedRows);

                }
            });
        },
        //批量插入ReturnDetails
        metaBatchInsertReturnDetails:function(connect,customerDB,updateBatchReturnDetailsData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_BATCH_INSERT_RETURNDETAILS,customerDB);
            logger.sql(sql);

            connect.query(sql,[updateBatchReturnDetailsData],function(err,result){
                    if(err){
                        callback(err);
                    }
                    else{
                        callback(err,result.affectedRows);
                    }
            });
        },
        //获取订单历史信息
        metaGetReturnInfoHistory:function(connect,customerDB,returnId,callback){
            logger.enter();
            logger.sql(SQL_CT_GET_RETURNINFO_LOG);
            var sql=sprintf(SQL_CT_GET_RETURNINFO_LOG,customerDB,customerDB,customerDB,customerDB,customerDB,customerDB,returnId);
            logger.sql(sql);

            connect.query(sql,function(err,result){
               if(err){
                   callback(err);
               } else{

                   callback(null,result);
               }
            });


        },

        metaGetAllreturnReceiveQty :function(connect,customerDB,orderId,callback){
            logger.enter();
            var SQL = " SELECT " +
                "  ReturnInfo_Goods_Map.goodsId, " +
                "  SUM(ReturnInfo_Goods_Map.returnShippedQuantity) AS totalReturnedQty " +
                "  FROM %s.ReturnInfo_Goods_Map "+
                "  WHERE returnId IN (SELECT id FROM %s.ReturnInfo WHERE ReturnInfo.orderId = %d)  group by ReturnInfo_Goods_Map.goodsId;";
            var sql=sprintf(SQL,customerDB,customerDB,orderId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if(err){
                    callback(err);
                } else{
                    callback(null,result);
                }
            });
        },




        metaBatchUpdateReturnInventorys:function(connect,customerDB,goodsId,returnQty,callback){
            logger.enter();
            var SQL = " UPDATE %s.GoodsInventory set amount = amount + %d, actualAmount = actualAmount + %d " +
                "   WHERE goodsId = %d ;";
            var sql=sprintf(SQL,customerDB,returnQty,returnQty,goodsId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if(err){
                    callback(err);
                } else{
                    callback(null,result);
                }
            });





        },
        metaRetrieveOrderShipInfoCheckPending :function(connect,customerDB,returnId,callback){
            logger.enter();
            var SQL = " select " +
                "  ReturnDetails.goodsId, " +
                "  OrderInfo.status as orderStatus, " +
                "  DATE_FORMAT(OrderInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS orderTime," +
                "  ShipDetails.shippedQuantitySum," +
                "  DATE_FORMAT(ShipInfo.shipTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS shipTime" +
                "  From %s.ReturnInfo,%s.OrderInfo,%s.ShipInfo,%s.ShipDetails,%s.ReturnDetails" +
                "  Where ReturnInfo.id = %d " +
                "  AND ReturnInfo.id = ReturnDetails.returnId" +
                "  AND ReturnInfo.orderId = OrderInfo.id" +
                "  AND ShipInfo.orderId = OrderInfo.id" +
                "  AND ShipInfo.id = ShipDetails.shipId AND ShipDetails.goodsId = ReturnDetails.goodsId" +
                "  GROUP BY goodsId;";
            var sql=sprintf(SQL,customerDB,customerDB,customerDB,customerDB,customerDB,returnId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if(err){
                    callback(err);
                } else{
                    callback(null,result);
                }
            });
        },


        //商户和客户关闭退货单
        metaCloseReturnInfo:function(customerDB,closeReturnInfoData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_CLOSE_RETURNINFO,customerDB);
            logger.sql(sql);
            __mysql.query(sql,[[closeReturnInfoData]],function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(null,result.affectedRows);
                }

            });
        }
        ,
        /**
         * 批量更新退货的商品 可退总数量 实退总数量  实收总数量
         * @param customerDB
         * @param insertBatchData
         * @param callback
         */
        metaInsertBatchRGMquantity:function(connection,customerDB,insertBatchData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_BATCH_INSERT_GGM_QUANTYTY,customerDB);
            logger.sql(sql);

            connection.query(sql,[insertBatchData],function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,result.affectedRows);
                }
            });
        },
        /**
         *
         * ERP审核通过时调用,更新商品的可退数量
         * @param connection
         * @param customerDB
         * @param returnId
         * @param callback
         */
        metaUpdateApprovedReturnGoodsQty: function(connection,customerDB,returnId,callback){
            logger.enter();
            var SQL_CT_UPDATE_GGM_QUANTYTY = "UPDATE %s.ReturnInfo_Goods_Map SET approvedQuantity =  applyQuantity" +
                " WHERE returnId = %d;";
            var sql=sprintf(SQL_CT_UPDATE_GGM_QUANTYTY,customerDB,returnId);
            logger.sql(sql);
            connection.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,result.affectedRows);
                }
            });
        },

        metaRetrieveReturnInfoCheckPending:function(connect,customerDB,returnId,callback){
           logger.enter();
           var  sql=sprintf(SQL_CT_APPLY_RETURNINFO,
               customerDB,customerDB,customerDB,customerDB,customerDB,
               customerDB,customerDB,customerDB,
               Number(returnId));
            logger.sql(sql);
            connect.query(sql,function(err,result){
               if(err){
                   logger.error(err);
                   callback(err);
               }
                else{
                   callback(null,result);
               }
            });
        },

        metaUpdateSoldPriceAndAmountShipDetail:function(connection,customerDBName,insertDataArray,callback){

            logger.enter();
            var sql = sprintf(SQL_CT_UPDATE_SOLDPRICE_AND_AMOUNT_SHIPDETAIL,customerDBName
            );
            logger.sql(sql);
            connection.query(sql,[insertDataArray], function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results.affectedRows);
                }
            });



        }

        ,
        metaUpdateShipDetailsSoldPrice:function(connection,customerDBName,soldPrice,shipId,goodsId,callback){
            logger.enter();
            var updateSql=sprintf(SQL_CT_UPDATE_SOLDPRICE_SHIPDETAIL,customerDBName,soldPrice,shipId,goodsId);
            connection.query(updateSql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });
        }
        ,
        metaUpdateRejectStatus: function (connection,customerDBName, updateData,rejectId,callback) {
            logger.enter();
            var updateSql = parseUpdateInfo(updateData);
            logger.debug(JSON.stringify(updateSql));
            var sql = sprintf(SQL_CT_REJECTSTATUS_UPDATE,
                customerDBName,
                updateSql,
                rejectId
            );
            logger.sql(sql);

            connection.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });

        },


        /**
         *
         * 更新 RejectInfo 最新的
         * @param connection
         * @param customerDBName 数据库名字
         * @param updateData     更新的字段 json对象
         * @param rejectId       拒收单ID
         * @param callback
         */
        metaUpdateRejectInfo:function(connection,customerDBName,updateData,rejectId,callback){
            logger.enter();
            var updateSql = parseUpdateInfo(updateData);
            logger.debug(JSON.stringify(updateSql));
            var sql = sprintf(SQL_CT_REJECTINFO_UPDATE,
                customerDBName,
                updateSql,
                rejectId
            );
            logger.sql(sql);

            connection.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });

        },
        /***
         * 新的 更新RejectDetails 数据
         * @param connection
         * @param customerDBName
         * @param updateData
         * @param rejectId
         */
        metaUpdateRejectDetailsNew:function(connection,customerDBName,updateData,rejectId,callback){
            //SQL_CT_REJECTDETAIL_UPDATE
            logger.enter();
            var sql = sprintf(SQL_CT_REJECTDETAIL_UPDATE, customerDBName
            );
            logger.sql(sql);
            connection.query(sql,[updateData],function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }

            });
        }
        ,
        metaUpdateRejectDetails: function (connection,customerDB,updateDatas,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_META_REJECTDETAILS_DELIVERED, customerDB
            );
            logger.sql(sql);
            connection.query( sql,[updateDatas], function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });

        },
        /**
         * 通过批号自动获取其他批号对应信息
         * @param customerDB
         * @param batchNum
         * @param callback
         */
        getBatchInfoByBatchNum: function(customerDB,batchNum,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_SElECT_BATCHINFO_BY_BATCHNUM,customerDB,batchNum);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results[0]);
                }
            });
        },
        /**
         * addShipInfo
         * add a shipinfo data to DB
         * @param customerDBName
         * @param shipInfo={
         * "shipData":[{"goodsId":"1","quantity":"2"},{"goodsId":"2","quantity":"2"}],
         * "logisticsCompany":"111",
         * "logisticsNo":"111",
         * "orderId":"1"
         * }
         * @param callback
         */
        metaBatchInsertShip: function(connection, customerDB, shipInfo,autoSwitchToDeliveredDate,enableReceiveDelay, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_BATCH_SHIPINFO,customerDB);
            var insertData = [];
            insertData.push(shipInfo.orderId);
            insertData.push(true);
            insertData.push(shipInfo.logisticsCompany+shipInfo.logisticsNo);
            insertData.push(shipInfo.remark);
            insertData.push(shipInfo.clientId);
            insertData.push(autoSwitchToDeliveredDate);
            insertData.push(enableReceiveDelay);
            insertData.push(shipInfo.operatorId);

            connection.query(sql, [[insertData]],function(err, result) {
                if(err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,result);
                }
            });
        },

        /**
         * Set Display ShipId
         * @param connection
         * @param customerDB
         * @param orderInfo
         * @param callback
         */
        metaBatchSetDisplayShipId: function(connection, customerDB, shipInfo, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SET_DISPLAY_SHIPID, customerDB);
            logger.sql(sql);
            connection.query(sql, [shipInfo.displayShipId, shipInfo.shipId], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err);
            });
        },

        /**
         * addShipDetails
         *      add a shipDetails data to DB
         * @param customerDBName
         * @param shipId
         * @param goodsId
         * @param quantity
         * @param callback
         */
        metaBatchInsertShipDetails: function (connection, customerDB, shipInfo, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_BATCH_SHIPDETAILS, customerDB);

            var shipData = shipInfo.shipData;

            var shipId = shipInfo.shipId;
            var insertData = underscore(shipData).map(function (item) {
                var temp = [];
                var goodsId = item.goodsId;
                var goodsRemark = item.remark;
                var batchDatas = item.batchDatas;
                temp.push(shipId);
                temp.push(goodsId);
                temp.push(goodsRemark);
                var baData = underscore(batchDatas).map(function (element) {
                    return temp.concat(element);
                });
                return baData;
            });
            insertData = underscore(insertData).reduce(function (memo, item) {
                return underscore.union(memo, item);
            }, []);


            //return false;

            logger.sql(sql);
            logger.debug((JSON.stringify(insertData)));
            connection.query(sql, [insertData],function(err, result) {
                if(err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,result);
                }
            });
        },



        getSumShipQtyByOrderId: function (connect,customerDBName, orderId, callback) {
            logger.enter();
            var SQL_CT_SELECT_SUM_SHIPPED_QTY  =  " SELECT ShipDetails.goodsId, SUM(ShipDetails.quantity) as sumShipQty FROM %s.ShipDetails,%s.ShipInfo" +
                " WHERE ShipDetails.shipId = ShipInfo.id AND ShipInfo.orderId = %d ;";
            var sql = sprintf(SQL_CT_SELECT_SUM_SHIPPED_QTY,
                customerDBName,customerDBName,
                orderId);
            logger.sql(sql);
            /* start to query */
            connect.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         * getShipInfo BY orderId
         *      Get the ship and ship detail data from DB special by orderId
         * @param customerDBName
         * @param callback
         */
        getShipInfoByOrderId: function (customerDBName, orderId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SHIPINFO_SELECTBY_ORDERID,
                customerDBName,customerDBName,customerDBName,
                customerDBName,customerDBName,customerDBName,
                orderId
            );
            logger.sql(sql);

            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }
            });

        },
        /**
         *
         * get ShipDetails info
         *      find ShipDetails from database by shipId
         * @param customerDBName
         * @param callback
         */
        getShipDetails: function (customerDBName, shipId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SHIPDETAILS_SELECT_BY_ID,
                customerDBName,customerDBName,customerDBName,customerDBName,customerDBName,customerDBName,
                customerDBName, customerDBName,
                shipId);
            logger.sql(sql);

            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    logger.debug("results", results);
                    logger.debug(results.length);
                    callback(err,results);
                }
            });
        },


        //todo
        //仅用于订单包含多个发货单，默认从第一个发货单发起退货
        getShipIdByOrderId : function (customerDBName, orderId, callback) {
            logger.enter();
            var SQL = "SELECT id,displayShipId FROM %s.ShipInfo WHERE orderId = %d;";
            var sql = sprintf(SQL,customerDBName, orderId);
            logger.sql(sql);
            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    logger.debug("results", results);
                    callback(err,results);
                }
            });
        },


        /**
         *
         * get ShipDetails info
         *      find ShipDetails from database by orderId
         * @param customerDBName
         * @param callback
         */
        getShipDetailsByOrderId: function (customerDBName, orderId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SHIPDETAILS_SELECT_BY_ORDERID,
                customerDBName,customerDBName,customerDBName,
                customerDBName, customerDBName, customerDBName,
                customerDBName,customerDBName,
                orderId);
            logger.sql(sql);

            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    logger.ndump("results", results);
                    callback(err,results);
                }
            });
        },

        /**
         * getShipInfo
         *      Get the ship data from DB
         * @param customerDBName
         * @param callback
         */
        getShipInfo: function (customerDBName, clientId,paginator,isReceived,callback) {
            logger.enter();
            var str = (typeof isReceived == "undefined") ? "" : (" AND " + sprintf("ShipInfo.isReceived = %s", isReceived));
            var sql = sprintf(SQL_CT_SHIPINFO_SELECT,
                customerDBName,customerDBName,customerDBName, customerDBName,
                paginator.where(sprintf("OrderInfo.clientId = %d",clientId) + str),
                paginator.orderby(),
                paginator.limit());
            logger.sql(sql);

            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                   callback(err);
                }else{
                    callback(err,results);
                }
            });

        },

        /**
         * getShipInfo
         *      Get the ship data from DB
         * @param customerDBName
         * @param callback
         */
        getAllShipInfo: function (customerDBName, paginator, isReceived, callback) {
            logger.enter();
            logger.ndump("paginator", paginator);
            var sql = sprintf(SQL_CT_SHIPINFO_SELECT_ALL,
                customerDBName,customerDBName,customerDBName,customerDBName,
                paginator.where(sprintf("ShipInfo.isReceived = %s",isReceived), "shipInfo"),
                paginator.orderby(),
                paginator.limit());
            logger.sql(sql);

            __mysql.query( sql, function(err, results){
                if (err) {

                    callback(err);
                }else{
                    //logger.fatal(results);
                    callback(err,results);
                }
            });

        },


        getOrderIdByShipId : function(customerDB,shipId,callback){
            logger.enter();
            var SQL = " SELECT ShipInfo.orderId as orderId " +
                "   From %s.ShipInfo " +
                "   WHERE ShipInfo.id = %d ;";
            var sql = sprintf(SQL,customerDB,shipId);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.error(err);
                    callback(err);
                }else{
                    logger.ndump(results);
                    callback(err,results);
                }
            });




        },


        /**
         * addReturnInfo
         *      add a return data to DB
         * @param customerDBName
         * @param returnData=
         * {returnData:items,
         *orderId :orderId,
         *remarks: remarks
         *}
         * @param operatorId
         * @param callback  returnId
         */

        metaBatchInsertReturn: function(connection, customerDB, returnInfo, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_BATCH_RETURNINFO,customerDB);
            var insertData = [];
            insertData.push(returnInfo.shipId);
            insertData.push(returnInfo.orderId);
            insertData.push(returnInfo.operatorId);
            insertData.push(returnInfo.remarks);
            connection.query(sql, [[insertData]],function(err, result) {
                if(err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,result);
                }
            });
        },

        //discard 废弃
        metaBatchInsertReturnDetails_old: function(connection, customerDB, returnInfo, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_BATCH_RETURNDETAILS,customerDB);
            //{"returnData":[{"itemId":"returnItem_0","goodsId":"2","quantity":"1"},{"itemId":"returnItem_2","goodsId":"1","quantity":"1"}],"orderId":"3","shipId":"1","remarks":"1212","operatorId":2,"action":"REQUEST-RETURN","returnId":12}
            var returnId = returnInfo.returnId;
            var orderId = returnInfo.orderId;
            var shipId = returnInfo.shipId;
            var inner_sql = sprintf(SQL_CT_SELECT_BATCHNUM_FROM_SHIPDETAILS_BY_ID, customerDB,shipId);
            __mysql.query(inner_sql,function(err,select_result){
                if(err){
                    callback(err);
                }else{
                    var batchItems = select_result;
                    var returnItems = returnInfo.returnData;
                    var insertData = underscore.map(batchItems,function(item){
                        var temp = [];
                        for(var i in returnItems){
                            if(Number(item.goodsId) == Number(returnItems[i].goodsId)){
                                temp.push(returnId);
                                temp.push(orderId);
                                temp.push(item.goodsId);
                                temp.push(item.batchNum);
                                temp.push(Number(returnItems[i].quantity));
                            }
                        }
                        return temp;
                    });

                    logger.debug(JSON.stringify(insertData));
                    connection.query(sql, [insertData],function(err, result) {
                        if(err) {
                            logger.sqlerr(err);
                            callback(err)
                        }else{
                            callback(err,result);
                        }
                    });
                }
            });
        },

        /**
         * getReturnInfo
         *      Get the return data from DB  客户端
         * @param customerDBName
         * @param callback
         */
        getReturnInfo: function (customerDBName,clientId,paginator, callback) {
            logger.debug(JSON.stringify(paginator));
            logger.enter();
            var sql = sprintf(SQL_CT_RETURNINFO_SELECT,
                customerDBName,customerDBName,customerDBName,customerDBName,customerDBName,customerDBName,customerDBName,
                /* "WHERE Client.id = %d " +*/
                paginator.where(sprintf("Client.id = %d", clientId),'ReturnListclientFilter'),
                paginator.orderby(),''
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }
            });

        },

        /**
         * getAllReturnInfo
         *      Get the return data from DB  商家端
         * @param customerDBName
         * @param paginator
         * @param condition
         * @param callback
         */
        getAllReturnInfo: function (customerDBName, paginator, condition, callback) {
            logger.debug(JSON.stringify(paginator));
            logger.enter();
            var whereStr = paginator.where("", "ReturnListclientFilter");
            if(whereStr == "" && !underscore.isEmpty(condition)){
                whereStr = "WHERE"+parseUpdateInfo(condition);
            }else if(whereStr != ""&&!underscore.isEmpty(condition)){
                whereStr += "AND "+parseUpdateInfo(condition);
            }
            var sql = sprintf(SQL_CT_RETURNINFO_SELECT,
                customerDBName,customerDBName,customerDBName,customerDBName,customerDBName,customerDBName,customerDBName,
                whereStr,
                paginator.orderby(),''
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }
            });


 /*           logger.enter();
            var sql = sprintf(SQL_CT_RETURNINFO_SELECT_ALL,
                customerDBName,customerDBName,customerDBName,customerDBName,
                paginator.where(),
                paginator.orderby(),
                paginator.limit()
            );
            logger.sql(sql);

            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }
            });*/

        },

        /**
         * getReturnDetail by returnId
         *      Get the return data from DB
         * @param customerDBName
         * @param callback
         */
        getReturnDetailsById: function (customerDBName, returnId,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETURNDETAILS_SELECT_BY_ID,
                customerDBName,customerDBName,customerDBName,
                customerDBName,customerDBName,
                returnId
            );
            logger.sql(sql);

            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }


            });

        },

        getReturnBatchDetailsById: function (customerDBName, returnId,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_BATCH_RETURNDETAILS_SELECT_BY_ID,
                customerDBName,customerDBName,customerDBName,
                customerDBName,customerDBName,customerDBName,
                returnId
            );
            logger.sql(sql);

            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }


            });

        },

        getReturnQtyByShipId: function (customerDBName, shipId,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETURNDETAILS_QTY_SELECT_BY_SHIPID,
                customerDBName, customerDBName,
                shipId
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }


            });

        },
        /**
         * 通过operatorId从ClientBuyerInfo中取出ERPCODE
         * @param customerDB
         * @param operatorId
         * @param callbak
         */
        getErpCodeByOperatorId : function(customerDB,operatorId,callback){
            logger.enter();
            var SQL = " SELECT  erpCode From %s.ClientBuyerInfo,%s.Operator" +
                " WHERE ClientBuyerInfo.enterpriseId = Operator.customerId " +
                " AND Operator.id = %d;";
            var sql = sprintf(SQL,customerDB,customerDB,operatorId);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         * 通过operatorId从cloudDB获取营业执照号
         * @param customerDB
         * @param cloudDBName
         * @param operatorId
         * @param callback
         */
        getLicenseNoByOperatorId :function(customerDB,cloudDBName,operatorId,callback){
            logger.enter();

            var SQL = " SELECT  businessLicense From %s.Customer,%s.Operator" +
                " WHERE Customer.id = Operator.customerId " +
                " AND Operator.id = %d;";
            var sql = sprintf(SQL,cloudDBName,customerDB,operatorId);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         * updateReturnStatus by returnId
         *      Get the return data from DB
         * @param customerDBName
         * @param callback
         */
        metaUpdateReturnStatus: function (connection,customerDBName, returnId,updateData,callback) {

            logger.enter();
            var updateSql = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_RETURNSTATUS_UPDATE,
                customerDBName,
                updateSql,
                returnId
            );
            logger.sql(sql);

            connection.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });

        },


        metaGetShipReturnInfoForApplyReturn : function (connection,customerDBName, orderId,callback) {
            logger.enter();
            var SQL = "SELECT ShipDetails.goodsId , ShipDetails.shippedQuantitySum, ReturnInfo_Goods_Map.returnShippedQuantity" +
                " FROM %s.ShipDetails,%s.ReturnInfo_Goods_Map,%s.ReturnInfo,%s.ShipInfo " +
                " WHERE ShipDetails.shipId = ShipInfo.id AND ShipInfo.orderId = ReturnInfo.orderId " +
                " AND ReturnInfo.id = ReturnInfo_Goods_Map.returnId " +
                " AND ShipDetails.goodsId = ReturnInfo_Goods_Map.goodsId " +
                " AND ShipInfo.orderId = %d GROUP BY goodsId;";
            var sql = sprintf(SQL,customerDBName,customerDBName,
                customerDBName,customerDBName,orderId
            );
            logger.sql(sql);
            connection.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });

        },


        metaUpdateReturnStatusWithConfirmDate: function (connection,customerDBName, returnId,updateData,callback) {
            logger.enter();
            var updateSql = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_RETURNSTATUS_UPDATE_WITH_CONFIRMDATE,
                customerDBName,
                updateSql,
                returnId
            );
            logger.sql(sql);

            connection.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });

        },

        metaUpdateReturnDetails: function (connection,customerDB,returnId,approvedItem,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETURNDETAILS_UPDATE, customerDB,
                approvedItem.approvedQuantity,
                returnId,
                approvedItem.goodsId
                );
            logger.sql(sql);
            connection.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });

        },


        /**
         *ERP退货审核后更新ReturnDetail的信息
         * @param connection
         * @param customerDB
         * @param returnId
         * @param callback
         */
        metaUpdateReturnDetailsFromErp : function(connection,customerDB,returnId,callback){
            logger.enter();
            var SQL = "UPDATE %s.ReturnDetails set approvedQuantity=quantity WHERE id = %d;";
            var sql = sprintf(SQL,customerDB, returnId);
            logger.sql(sql);
            connection.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        metaUpdateShippedReturnDetails: function (connection,customerDB,updateDatas,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_META_RETURNDETAILS_UPDATE, customerDB);
            logger.sql(sql);
            logger.debug(JSON.stringify(updateDatas));
            connection.query(sql,[updateDatas],function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });

        },


        metaUpdateDeliveredReturnDetails: function (connection,customerDB,updateDatas,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_META_RETURNDETAILS_DELIVERED, customerDB);
            logger.sql(sql);
            logger.debug(JSON.stringify(updateDatas));
            connection.query(sql,[updateDatas],function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });

        },


        /**
         * updateShipInfo by returnId
         *      Get the return data from DB
         * @param customerDBName
         * @param callback
         */

        metaUpdateShipInfo: function (connection,customerDBName, shipId,updateData,callback) {
            logger.enter();
            var updateSql = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_SHIPINFO_UPDATE,
                customerDBName,
                updateSql,
                shipId
            );
            logger.sql(sql);

            connection.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });
        },

        updateShipInfo: function (customerDBName, shipId,updateData,callback) {
            logger.enter();
            var updateSql = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_SHIPINFO_UPDATE,
                customerDBName,
                updateSql,
                shipId
            );
            logger.sql(sql);

            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         *
         * 更新ERP的发货详情数据
         * @param customerDBName
         * @param shipId
         * @param detailData
         * @param callback
         */
        updateErpShipDetails : function(customerDBName, shipId,detailData,callback){
            logger.debug(JSON.stringify(detailData));
            var SQL = " UPDATE %s.ShipDetails SET detailNo = '%s', batchNo ='%s' ,orderBillOutDetailUid = '%s'," +
                " remark = '%s' WHERE shipId = %d AND goodsId = %d AND batchNum = '%s';";
            var sql = sprintf(SQL,
                customerDBName,
                detailData.detailNo,
                detailData.batchNo,
                detailData.orderBillOutDetailUid,
                detailData.remark,
                shipId,
                detailData.goodsId,
                detailData.batchNum
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        getCustomerIdByClientId : function(customerDB,clientId,callback){
            logger.enter();
            var SQL = " SELECT  customerId From %s.Operator where clientId = %d;";
            var sql = sprintf(SQL, customerDB, clientId );
            logger.sql(sql);
            __mysql.query( sql,function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        getCustomerIdByOperatorId: function(customerDB,operatorId,callback){
            logger.enter();
            var SQL = " SELECT  customerId From %s.Operator where id = %d;";
            var sql = sprintf(SQL, customerDB, operatorId );
            logger.sql(sql);
            __mysql.query( sql,function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        metaUpdateReceivedShipDetails: function (connection,customerDBName, updateData,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SHIPDETAILS_UPDATE_RECEIVE,
                customerDBName
            );
            logger.sql(sql);
            connection.query( sql, [updateData],function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        listReturnInfoById : function (customerDB,returnId,callback){
            logger.enter();
            var SQL = "SELECT id,displayReturnId,shipId,orderId,operatorId," +
                " status,shipDate, confirmDate,confirmReturnCustomerId, " +
                " closeDate,closeReturnCustomerId,receiveDate, customerReply," +
                " logisticsId,logisticsNo,returnLogisticsDate,returnShipRemark," +
                " returnDeliveredRemark,remark,createdOn" +
                " FROM %s.ReturnInfo WHERE id = %d;";
            var sql = sprintf(SQL, customerDB,returnId);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        listReturnDetailsById : function (customerDB,returnId,callback){
            logger.enter();
            var SQL = "SELECT id,returnId,orderId,goodsId,quantity,approvedQuantity," +
                " returnQuantity,returnDeliveredQuantity,drugESC,detailNo,batchNum," +
                " batchNo,goodslicenseNo,inspectReportURL,deliveredDrugESC,remark," +
                " shipRemark,goodsProduceDate,goodsValidDate,createdOn" +
                " FROM %s.ReturnDetails WHERE returnId = %d;";
            var sql = sprintf(SQL, customerDB,returnId);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        listReturnGoodsMapById : function (customerDB,returnId,callback){
            logger.enter();
            var SQL = "SELECT " +
                "   ReturnInfo_Goods_Map.id," +
                "   ReturnInfo_Goods_Map.returnId," +
                "   ReturnInfo_Goods_Map.goodsId," +
                "   GoodsInfo.goodsNo," +
                "   ReturnInfo_Goods_Map.price," +
                "   ReturnInfo_Goods_Map.applyQuantity," +
                "   ReturnInfo_Goods_Map.approvedQuantity," +
                "   ReturnInfo_Goods_Map.returnShippedQuantity," +
                "   ReturnInfo_Goods_Map.receiveShippedQuantity" +
                " FROM %s.ReturnInfo_Goods_Map,%s.GoodsInfo " +
                " WHERE returnId = %d" +
                "   AND  ReturnInfo_Goods_Map.goodsId = GoodsInfo.id ;";
            var sql = sprintf(SQL, customerDB,customerDB,returnId);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },
        getClientBuyerInfo : function (customerDB,buyerId,callback){
            logger.enter();
            var SQL = "SELECT id,enterpriseId,enabled,erpCode,businessLicense," +
                " buyerOperatorId, createdOn " +
                " FROM %s.ClientBuyerInfo WHERE enterpriseId = %d;";
            var sql = sprintf(SQL, customerDB,buyerId);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         * 更新来自ERP的退货发货
         * @param customerDB
         * @param returnId
         * @param status
         * @param shipTime
         * @param remark
         * @param callback
         */
        updateReturnShipFromERP : function(customerDB,returnId,status,shipTime,remark,callback){
            logger.enter();
            var SQL = "UPDATE %s.ReturnInfo SET status = '%s', shipDate = '%s', " +
                "returnShipRemark='%s' WHERE id = %d;";
            var sql = sprintf(SQL, customerDB,status,shipTime,remark,returnId);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },
        /**
         * 更新来自ERP收到退货
         * @param customerDB
         * @param returnId
         * @param status
         * @param receiveTime
         * @param remark
         * @param callback
         */
        updateReturnReceiveFromERP: function(customerDB,returnId,status,receiveTime,remark,callback){
            logger.enter();
            var SQL = "UPDATE %s.ReturnInfo SET status = '%s', receiveDate = '%s', " +
                "returnDeliveredRemark='%s' WHERE id = %d;";
            var sql = sprintf(SQL, customerDB,status,receiveTime,remark,returnId);
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         * 更新来自ERP退货单详情
         * @param customerDB
         * @param returnId
         * @param returnItems
         * @param callback
         */
        updateShipReturnDetailsFromErp: function(customerDB,returnId,returnItems,callback){
            //returnItems = [
            //    {
            //        "guid": "detailshipguid",
            //        "goodsId": "724",
            //        "batchNo":"batNO1",
            //        "drugESC": "drugesctest1",
            //        "batchNum": "batchNum1",
            //        "inspectReportURL": "url:123",
            //        "goodsProduceDate": "2016-01-01",
            //        "goodsValidDate": "20116-10-10",
            //        "detailNo": 2,
            //        "quantity": 1,
            //        "remark": "detailreamrk1"
            //    },
            //    {
            //        //
            //    }
            //];
            logger.enter();
            var returnDetailsData = [];
            underscore.map(returnItems,function(item){
                var rObj = [];
                rObj.push(returnId);//退货单号
                rObj.push(item.goodsId);//SCC商品Id
                rObj.push(item.batchNo);//批号
                rObj.push(item.drugESC);//电子监管码
                rObj.push(item.batchNum);//批次号
                rObj.push(item.inspectReportURL);//批次检验报告
                rObj.push(item.goodsProduceDate);//生产日期
                rObj.push(item.goodsValidDate);//效期
                rObj.push(item.quantity);//发货数量returnQuantity
                rObj.push(item.remark);//发货备注
                returnDetailsData.push(rObj);
            });
            var SQL = " INSERT INTO %s.ReturnDetails (returnId,goodsId,batchNo,drugESC," +
                " batchNum,inspectReportURL,goodsProduceDate,goodsValidDate,returnQuantity" +
                " remark) VALUES ?  ON DUPLICATE KEY UPDATE returnId=VALUES(returnId)," +
                " goodsId=VALUES(goodsId),batchNo=VALUES(batchNo),drugESC=VALUES(drugESC)," +
                " batchNum=VALUES(batchNum),inspectReportURL=VALUES(inspectReportURL)," +
                " goodsProduceDate=VALUES(goodsProduceDate),goodsValidDate=VALUES(goodsValidDate)," +
                " returnQuantity=VALUES(returnQuantity),shipRemark=VALUES(shipRemark);";
            var sql = sprintf(SQL, customerDB);
            logger.sql(sql);
            __mysql.query( sql,[returnDetailsData], function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        updateReceiveReturnDetailsFromErp : function(customerDB,returnId,returnItems,callback){
            logger.enter();
            var returnDetailsData = [];

            underscore.map(returnItems,function(item){
                var rObj = [];
                rObj.push(returnId);//退货单号
                rObj.push(item.goodsId);//SCC商品Id
                rObj.push(item.PH1);//批号
                rObj.push(item.MonitorCode);//电子监管码deliveredDrugESC
                rObj.push(item.PCDH);//批次号
                rObj.push(Number(item.SL));//收货数量returnDeliveredQuantity
                returnDetailsData.push(rObj);
            });
            var SQL = " INSERT INTO %s.ReturnDetails (returnId,goodsId,batchNo,deliveredDrugESC," +
                " batchNum,returnDeliveredQuantity " +
                " ) VALUES ?  ON DUPLICATE KEY UPDATE returnId=VALUES(returnId)," +
                " goodsId=VALUES(goodsId),batchNo=VALUES(batchNo),deliveredDrugESC=VALUES(deliveredDrugESC)," +
                " batchNum=VALUES(batchNum),returnDeliveredQuantity=VALUES(returnDeliveredQuantity);";
            var sql = sprintf(SQL, customerDB);
            logger.sql(sql);
            __mysql.query( sql,[returnDetailsData], function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        /**
         * ERP退货发货时更新RETURN_GOODS_MAP
         * @param customerDB
         * @param insertArr
         * @param callback
         */
        updateShipReturnGoodsMap:function(customerDB,insertArr,callback){
            logger.enter();
            var SQL = " INSERT INTO %s.ReturnInfo_Goods_Map (returnId,goodsId,returnShippedQuantity"+
                " ) VALUES ?  ON DUPLICATE KEY UPDATE returnId=VALUES(returnId)," +
                " goodsId=VALUES(goodsId),returnShippedQuantity=VALUES(returnShippedQuantity);";
            var sql = sprintf(SQL, customerDB);
            logger.sql(sql);
            __mysql.query( sql,[insertArr], function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });

        },

        /**
         * ERP退货收货时更新RETURN_GOODS_MAP
         * @param customerDB
         * @param insertArr
         * @param callback
         */
        updateReceiveReturnGoodsMap : function(customerDB,insertArr,callback){
            logger.enter();
            var SQL = " INSERT INTO %s.ReturnInfo_Goods_Map (returnId,goodsId,receiveShippedQuantity"+
                " ) VALUES ?  ON DUPLICATE KEY UPDATE returnId=VALUES(returnId)," +
                " goodsId=VALUES(goodsId),receiveShippedQuantity=VALUES(receiveShippedQuantity);";
            var sql = sprintf(SQL, customerDB);
            logger.sql(sql);
            __mysql.query( sql,[insertArr], function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });

        },

        /**
         * 查询实际退货单价与数量
         * @param customerDB
         * @param returnId
         * @param callback
         */
        selectReturnGoodsMap: function(customerDB, returnId, callback) {
            logger.enter();
            var SQL = "SELECT " +
                "ReturnInfo_Goods_Map.price, ReturnInfo_Goods_Map.applyQuantity, OrderInfo.clientId " +
                "FROM %s.ReturnInfo_Goods_Map, %s.ReturnInfo, %s.OrderInfo " +
                "WHERE returnId=%d AND ReturnInfo_Goods_Map.returnId=ReturnInfo.id AND ReturnInfo.orderId=OrderInfo.id;";
            var sql = sprintf(SQL, customerDB, customerDB, customerDB, returnId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err, results);
                }
            });
        },

        /**
         * 离线任务获取 ShipInfo 主表里面的内容
         * @param customerDB
         * @param shipId
         * @param callback
         */
        metaRetrieveShipInfo: function(customerDB,shipId,callback){
            logger.enter();
            var sql=knex.withSchema(customerDB)
                    .select([
                        'id',
                        'status',
                        'displayShipId',
                        'isReceived'
                    ])
                    .from('ShipInfo')
                    .where({id:shipId})
                    .toString();
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                    if(err){
                        logger.error(err);
                        return callback(err);
                    }
                    callback(err,result);
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
    return dbService;
};