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
 * Table: ClientPrice
 * 说明：商品客户价格表
 *
 **********************************************************************/

DROP TABLE IF EXISTS ClientPrice;
CREATE TABLE ClientPrice(
    /* id */
    id                  BIGINT              AUTO_INCREMENT PRIMARY KEY,

    /* goods id */
    goodsId             BIGINT              NOT NULL,

    /* client Id */
    clientId            BIGINT              NOT NULL,

    /* 客户类价格` */
    clientPrice         DECIMAL(18,6)       NOT NULL,

    /* 备注 */
    remark              VARCHAR(200)        DEFAULT NULL,

    /* 修改时间 */
    updatedOn           TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* 创建时间 */
    createdOn           TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY  (clientId,goodsId)
);

/**********************************************
 * Triggers
 * 用来保证数据的完整性
 *********************************************/

DELIMITER //

/**
 * 新增ClientPrice记录时，触发更新该客户下对应goodsId的价格更新
 */
DROP TRIGGER IF EXISTS insertClientPrice;
CREATE TRIGGER insertClientPrice AFTER INSERT ON ClientPrice FOR EACH ROW
BEGIN
    /**
     * 因为所有的GoodsPrice都已经在ClientGoodsPrice中存在，所以去更新价格而不是INSERT。
     */
    UPDATE ClientGoodsPrice SET pricePlan="clientPrice", price=NEW.clientPrice
        WHERE goodsId=NEW.goodsId AND clientId=NEW.clientId;
END;

/**
 * 更新ClietPrice中价格时，触发更新该客户下对应goodsId的价格更新
 */
DROP TRIGGER IF EXISTS updateClientPrice;
CREATE TRIGGER updateClientPrice AFTER UPDATE ON ClientPrice FOR EACH ROW
BEGIN
    /* 当价格不同时才去更新 */
    IF OLD.clientPrice <> NEW.clientPrice THEN
        UPDATE ClientGoodsPrice SET price=NEW.clientPrice
            WHERE pricePlan="clientPrice" AND goodsId=NEW.goodsId AND clientId=NEW.clientId;
    END IF;
END;

/**
 * 删除ClientPrice一条记录是，触发采用GoodsPrice中价格方案更新ClientGoodsPrice
 */
DROP TRIGGER IF EXISTS delClientPrice;
CREATE TRIGGER delClientPrice AFTER DELETE ON ClientPrice FOR EACH ROW
BEGIN
    /* 恢复GoodsPrice中设定的价格 */
    UPDATE ClientGoodsPrice, GoodsPrice
       SET ClientGoodsPrice.pricePlan='wholesalePrice', ClientGoodsPrice.price=GoodsPrice.wholesalePrice
     WHERE ClientGoodsPrice.goodsId=OLD.goodsId AND GoodsPrice.goodsId=OLD.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id FROM Client WHERE id=OLD.clientId AND pricePlan='wholesalePrice');
    UPDATE ClientGoodsPrice, GoodsPrice
       SET ClientGoodsPrice.pricePlan='price1', ClientGoodsPrice.price=GoodsPrice.price1
     WHERE ClientGoodsPrice.goodsId=OLD.goodsId AND GoodsPrice.goodsId=OLD.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id FROM Client WHERE id=OLD.clientId AND pricePlan='price1');
    UPDATE ClientGoodsPrice, GoodsPrice
       SET ClientGoodsPrice.pricePlan='price2', ClientGoodsPrice.price=GoodsPrice.price2
     WHERE ClientGoodsPrice.goodsId=OLD.goodsId AND GoodsPrice.goodsId=OLD.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id FROM Client WHERE id=OLD.clientId AND pricePlan='price2');
    UPDATE ClientGoodsPrice, GoodsPrice
       SET ClientGoodsPrice.pricePlan='price3', ClientGoodsPrice.price=GoodsPrice.price3
     WHERE ClientGoodsPrice.goodsId=OLD.goodsId AND GoodsPrice.goodsId=OLD.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id FROM Client WHERE id=OLD.clientId AND pricePlan='price3');
    UPDATE ClientGoodsPrice, GoodsPrice
       SET ClientGoodsPrice.pricePlan='refRetailPrice', ClientGoodsPrice.price=GoodsPrice.refRetailPrice
     WHERE ClientGoodsPrice.goodsId=OLD.goodsId AND GoodsPrice.goodsId=OLD.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id FROM Client WHERE id=OLD.clientId AND pricePlan='refRetailPrice');

    /* 恢复ClientCategoryPrice */
    UPDATE ClientGoodsPrice, ClientCategoryPrice
       SET ClientGoodsPrice.pricePlan='categoryPrice', ClientGoodsPrice.price=ClientCategoryPrice.ClientCategoryPrice
     WHERE ClientGoodsPrice.goodsId=OLD.goodsId AND ClientGoodsPrice.goodsId=ClientCategoryPrice.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id FROM Client WHERE clientCategoryId=ClientCategoryPrice.clientCategoryId);

END;
//
DELIMITER ;