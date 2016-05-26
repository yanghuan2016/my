/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

DELIMITER $$

/* 存储过程，如果存在即执行删除该索引 */
DROP PROCEDURE IF EXISTS drop_index_if_exists $$
CREATE PROCEDURE drop_index_if_exists(in theTable varchar(128), in theIndexName varchar(128) )
BEGIN
 IF((SELECT COUNT(*) AS index_exists FROM information_schema.statistics WHERE TABLE_SCHEMA = DATABASE() and table_name =
theTable AND index_name = theIndexName) > 0) THEN
   SET @s = CONCAT('DROP INDEX `' , theIndexName , '` ON `' , theTable, '`');
   PREPARE stmt FROM @s;
   EXECUTE stmt;
 END IF;
END $$

DELIMITER ;

/* Table Client */
CALL drop_index_if_exists('Client', 'IdxClient1');
CREATE INDEX IdxClient1 ON Client(registerStatus);
CALL drop_index_if_exists('Client', 'IdxClient2');
CREATE INDEX IdxClient2 ON Client(enabled);
CALL drop_index_if_exists('Client', 'IdxClient3');
CREATE INDEX IdxClient3 ON Client(clientCode);
CALL drop_index_if_exists('Client', 'IdxClient4');
CREATE INDEX IdxClient4 ON Client(clientArea);

/* Table ClientGsp */
CALL drop_index_if_exists('ClientGsp', 'IdxClientGsp1');
CREATE INDEX IdxClientGsp1 ON ClientGsp(clientId);

/* Table ClientUpdate */
CALL drop_index_if_exists('ClientUpdate', 'IdxClientUpdate1');
CREATE UNIQUE INDEX IdxClientUpdate1 ON ClientUpdate(clientId, createdTime);

/* Table ClientHistory */
CALL drop_index_if_exists('ClientHistory', 'IdxClientHistory1');
CREATE INDEX IdxClientHistory1 ON ClientHistory(clientId, createdTime);

/* Table ClientGspHistory */
CALL drop_index_if_exists('ClientGspHistory', 'IdxClientGspHistory1');
CREATE INDEX IdxClientGspHistory1 ON ClientGspHistory(clientGspId, createdTime);

/* Table ClientGoodsPrice */
CALL drop_index_if_exists('ClientGoodsPrice', 'IdxClientGoodsPrice1');
CREATE INDEX IdxClientGoodsPrice1 ON ClientGoodsPrice(clientId);
CALL drop_index_if_exists('ClientGoodsPrice', 'IdxClientGoodsPrice2');
CREATE INDEX IdxClientGoodsPrice2 ON ClientGoodsPrice(goodsId);

/* Table ClientPrice */
CALL drop_index_if_exists('ClientPrice', 'IdxClientPrice1');
CREATE INDEX IdxClientPrice1 ON ClientPrice(clientId);
CALL drop_index_if_exists('ClientPrice', 'IdxClientPrice2');
CREATE INDEX IdxClientPrice2 ON ClientPrice(goodsId);

/* Table ClientCategoryPrice */
CALL drop_index_if_exists('ClientCategoryPrice', 'IdxClientCategoryPrice1');
CREATE INDEX IdxClientCategoryPrice1 ON ClientCategoryPrice(goodsId);
CALL drop_index_if_exists('ClientCategoryPrice', 'IdxClientCategoryPrice2');
CREATE INDEX IdxClientCategoryPrice2 ON ClientCategoryPrice(clientCategoryId);

/* Table ClientAddress */
CALL drop_index_if_exists('ClientAddress', 'IdxClientAddress1');
CREATE INDEX IdxClientAddress1 ON ClientAddress(clientId);

/* Table GoodsInfo */
CALL drop_index_if_exists('GoodsInfo', 'IdxGoodsInfo1');
CREATE INDEX IdxGoodsInfo1 ON GoodsInfo(goodsTypeId);
CALL drop_index_if_exists('GoodsInfo', 'IdxGoodsInfo2');
CREATE INDEX IdxGoodsInfo2 ON GoodsInfo(goodsNo);
CALL drop_index_if_exists('GoodsInfo', 'IdxGoodsInfo3');
CREATE INDEX IdxGoodsInfo3 ON GoodsInfo(commonName);
CALL drop_index_if_exists('GoodsInfo', 'IdxGoodsInfo4');
CREATE INDEX IdxGoodsInfo4 ON GoodsInfo(producer);
CALL drop_index_if_exists('GoodsInfo', 'IdxGoodsInfo5');
CREATE INDEX IdxGoodsInfo5 ON GoodsInfo(alias);

/* Table GoodsTypeMap */
CALL drop_index_if_exists('GooodsTypeMap', 'IdxGoodsTypeMap1');
CREATE UNIQUE INDEX IdxGoodsTypeMap1 ON GoodsTypeMap(goodsTypeId,goodsId);

/* Table GoodsGsp */
CALL drop_index_if_exists('GoodsGsp', 'IdxGoodsGsp1');
CREATE INDEX IdxGoodsGsp1 ON GoodsGsp(goodsId);

/* Table GoodsInventory */
CALL drop_index_if_exists('GoodsInventory', 'IdxGoodsInventory1');
CREATE INDEX IdxGoodsInventory1 ON GoodsInventory(goodsId);
CALL drop_index_if_exists('GoodsInventory', 'IdxGoodsInventory2');
CREATE INDEX IdxGoodsInventory2 ON GoodsInventory(onSell);

/* Table GoodsPrice */
CALL drop_index_if_exists('GoodsPrice', 'IdxGoodsPrice1');
CREATE INDEX IdxGoodsPrice1 ON GoodsPrice(goodsId);

/* Table GoodsTypes */
CALL drop_index_if_exists('GoodsTypes', 'IdxGoodsTypes1');
CREATE INDEX IdxGoodsTypes1 ON GoodsTypes(level, parentErpId);
CALL drop_index_if_exists('GoodsTypes', 'IdxGoodsTypes2');
CREATE INDEX IdxGoodsTypes2 ON GoodsTypes(fullname);

/* Table Cart */
CALL drop_index_if_exists('Cart', 'IdxCart1');
CREATE INDEX IdxCart1 ON Cart(clientId);
CALL drop_index_if_exists('Cart', 'IdxCart2');
CREATE INDEX IdxCart2 ON Cart(goodsId);

/* Table OrderInfo */
CALL drop_index_if_exists('OrderInfo', 'IdxOrderInfo1');
CREATE INDEX IdxOrderInfo1 ON OrderInfo(clientId, status);

/* Table OrderDetails */
CALL drop_index_if_exists('OrderDetails', 'IdxOrderDetails1');
CREATE INDEX IdxOrderDetails1 ON OrderDetails(orderId, goodsId);

/* Table OrderHistory */
CALL drop_index_if_exists('OrderHistory', 'IdxOrderHistory1');
CREATE INDEX IdxOrderHistory1 ON OrderHistory(clientId, orderId);

/* Table ShipInfo */
CALL drop_index_if_exists('ShipInfo', 'IdxShipInfo1');
CREATE INDEX IdxShipInfo1 ON ShipInfo(orderId);

/* Table ShipDetails */
CALL drop_index_if_exists('ShipDetails', 'IdxShipDetails1');
CREATE UNIQUE INDEX IdxShipDetails1 ON ShipDetails(shipId, goodsId, batchNum);

/* Table ReturnInfo */
CALL drop_index_if_exists('ReturnInfo', 'IdxReturnInfo1');
CREATE INDEX IdxReturnInfo1 ON ReturnInfo(shipId);
CALL drop_index_if_exists('ReturnInfo', 'IdxReturnInfo2');
CREATE INDEX IdxReturnInfo2 ON ReturnInfo(orderId);
CALL drop_index_if_exists('ReturnInfo', 'IdxReturnInfo3');
CREATE INDEX IdxReturnInfo3 ON ReturnInfo(status);

/* Table ReturnDetails */
CALL drop_index_if_exists('ReturnDetails', 'IdxReturnDetails1');
CREATE INDEX IdxReturnDetails1 ON ReturnDetails(returnId);
CALL drop_index_if_exists('ReturnDetails', 'IdxReturnDetails2');
CREATE INDEX IdxReturnDetails2 ON ReturnDetails(orderId);


/* Table ErpMsg */
CALL drop_index_if_exists('ErpMsg', 'IdxErpMsg1');
CREATE INDEX IdxErpMsg1 ON ErpMsg(userType, userId, createdOn);
CALL drop_index_if_exists('ErpMsg', 'IdxErpMsg2');
CREATE INDEX IdxErpMsg2 ON ErpMsg(msgRoute, handleStatus);

/* Table UserLog */
CALL drop_index_if_exists('OperatorLog', 'IdxOperatorLog1');
CREATE INDEX IdxOperatorLog1 ON OperatorLog(operatorId, createdOn);









