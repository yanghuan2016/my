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
 * Table: ClientCategoryPrice
 * 说明：商品客户类价格表
 *
 **********************************************************************/

DROP TABLE IF EXISTS ClientCategoryPrice;
CREATE TABLE ClientCategoryPrice(
    /* id */
    id                  BIGINT              AUTO_INCREMENT PRIMARY KEY,

    /* goods id */
    goodsId             BIGINT              NOT NULL,

    /* clientCategory Id */
    clientCategoryId    BIGINT              NOT NULL,

    /* 客户类价格 */
    clientCategoryPrice DECIMAL(18,4)       NOT NULL,

    /* 备注 */
    remark              VARCHAR(200)        DEFAULT NULL,

    /* 修改时间 */
    updatedOn           TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* 创建时间 */
    createdOn           TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY  (goodsId,clientCategoryId)

);

/**********************************************
 * Triggers
 * 用来保证数据的完整性
 *********************************************/

DELIMITER //

/**
 * 新增ClientCategoryPrice记录时，触发更新该类客户下对应goodsId的价格更新
 */
DROP TRIGGER IF EXISTS insertClientCategoryPrice;
CREATE TRIGGER insertClientCategoryPrice AFTER INSERT ON ClientCategoryPrice FOR EACH ROW
BEGIN
    /**
     * 因为所有的GoodsPrice都已经在ClientGoodsPrice中存在，所以去更新价格而不是INSERT。
     * 由于"clientPrice"价格方案有更高的处理级别，所以跳过"clientPrice"
     */
    UPDATE ClientGoodsPrice SET pricePlan="categoryPrice", price=NEW.clientCategoryPrice
        WHERE goodsId=NEW.goodsId AND pricePlan<>"clientPrice" AND
              clientId IN (SELECT id FROM Client WHERE clientCategoryId=NEW.clientCategoryId);
END;

/**
 * 更新ClietCategoryPrice中价格时，触发更新该类客户下对应goodsId的价格更新
 */
DROP TRIGGER IF EXISTS updateClientCategoryPrice;
CREATE TRIGGER updateClientCategoryPrice AFTER UPDATE ON ClientCategoryPrice FOR EACH ROW
BEGIN
    /* 当价格不同时才去更新 */
    IF OLD.clientCategoryPrice <> NEW.clientCategoryPrice THEN
        UPDATE ClientGoodsPrice SET price=NEW.clientCategoryPrice
            WHERE pricePlan="categoryPrice" AND goodsId=NEW.goodsId AND
                  clientId IN (SELECT id FROM Client WHERE clientCategoryId=NEW.id);
    END IF;
END;

/**
 * 删除ClientCategoryPrice一条记录是，触发采用GoodsPrice中价格方案更新ClientGoodsPrice
 */
DROP TRIGGER IF EXISTS delClientCategoryPrice;
CREATE TRIGGER delClientCateogryPrice AFTER DELETE ON ClientCategoryPrice FOR EACH ROW
BEGIN
    /* 恢复GoodsPrice中设定的价格 */
    UPDATE ClientGoodsPrice, GoodsPrice
       SET ClientGoodsPrice.pricePlan='wholesalePrice', ClientGoodsPrice.price=GoodsPrice.wholesalePrice
     WHERE ClientGoodsPrice.pricePlan='categoryPrice' AND ClientGoodsPrice.goodsId=OLD.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id from Client WHERE clientCategoryId=OLD.id AND pricePlan='wholesalePrice');
    UPDATE ClientGoodsPrice, GoodsPrice
       SET ClientGoodsPrice.pricePlan='price1', ClientGoodsPrice.price=GoodsPrice.price1
     WHERE ClientGoodsPrice.pricePlan='categoryPrice' AND ClientGoodsPrice.goodsId=OLD.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id from Client WHERE clientCategoryId=OLD.id AND pricePlan='price1');
    UPDATE ClientGoodsPrice, GoodsPrice
       SET ClientGoodsPrice.pricePlan='price2', ClientGoodsPrice.price=GoodsPrice.price2
     WHERE ClientGoodsPrice.pricePlan='categoryPrice' AND ClientGoodsPrice.goodsId=OLD.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id from Client WHERE clientCategoryId=OLD.id AND pricePlan='price2');
    UPDATE ClientGoodsPrice, GoodsPrice
       SET ClientGoodsPrice.pricePlan='price3', ClientGoodsPrice.price=GoodsPrice.price3
     WHERE ClientGoodsPrice.pricePlan='categoryPrice' AND ClientGoodsPrice.goodsId=OLD.goodsId AND
           ClientGoodsPrice.clientId IN (SELECT id from Client WHERE clientCategoryId=OLD.id AND pricePlan='price3');
END;
//
DELIMITER ;