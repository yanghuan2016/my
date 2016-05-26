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
 * Table: GoodsPrice
 * 说明：商品的价格信息
 * 
 **********************************************************************/

DROP TABLE IF EXISTS GoodsPrice;
CREATE TABLE GoodsPrice(
    /* id */
	id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

	/* guid , for ERP */
	guid                        VARCHAR(50)         UNIQUE  DEFAULT NULL,

	/* goodId */
	goodsId                     BIGINT              UNIQUE NOT NULL,

    /* 批发价 */
	wholesalePrice              DECIMAL(18,4)       DEFAULT 0,

	/* 参考零售价 */
	refRetailPrice              DECIMAL(18,4)       DEFAULT 0,

	/* 售价一 */
	price1                      DECIMAL(18,4)       DEFAULT 0,

	/* 售价二 */
	price2                      DECIMAL(18,4)       DEFAULT 0,

	/* 售价三 */
	price3                      DECIMAL(18,4)       DEFAULT 0,

	/* 国家限价 */
	limitedPrice                DECIMAL(18,4)       DEFAULT 0,

	/* 国家基药价 */
	basePrice                   DECIMAL(18,4)       DEFAULT 0,

	/* 省管基药价 */
	provinceBasePrice           DECIMAL(18,4)       DEFAULT 0,

	/* 基药指导价 */
	guidedBasePrice             DECIMAL(18,4)       DEFAULT 0,

	/* 更新时间 */
    updatedOn                    TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);


/**********************************************
 * Triggers
 * 用来保证数据的完整性
 *********************************************/

DELIMITER //

DROP TRIGGER IF EXISTS addGoodsPrice;
CREATE TRIGGER addGoodsPrice AFTER INSERT ON GoodsPrice FOR EACH ROW
BEGIN
    INSERT INTO ClientGoodsPrice(goodsId, clientId, pricePlan, price)
        SELECT NEW.goodsId, id, "wholesalePrice", NEW.wholesalePrice FROM Client WHERE pricePlan="wholesalePrice" UNION
        SELECT NEW.goodsId, id, "price1", NEW.price1 FROM Client WHERE pricePlan="price1" UNION
        SELECT NEW.goodsId, id, "price2", NEW.price2 FROM Client WHERE pricePlan="price2" UNION
        SELECT NEW.goodsId, id, "price3", NEW.price3 FROM Client WHERE pricePlan="price3" UNION
        SELECT NEW.goodsId, id, "refRetailPrice", NEW.refRetailPrice FROM Client WHERE pricePlan="refRetailPrice"
    ON DUPLICATE KEY UPDATE goodsId=VALUES(goodsId),clientId=VALUES(clientId),pricePlan=VALUES(pricePlan),price=VALUES(price);
END;

/**
 * Update ClientGoodsPrice on GoodsPrice updated
 */
DROP TRIGGER IF EXISTS updateGoodsPrice;
CREATE TRIGGER updateGoodsPrice AFTER UPDATE ON GoodsPrice FOR EACH ROW
BEGIN
    UPDATE ClientGoodsPrice SET price=NEW.wholeSalePrice
        WHERE goodsId=NEW.goodsId AND pricePlan="wholesalePrice";
    UPDATE ClientGoodsPrice SET price=NEW.price1
        WHERE goodsId=NEW.goodsId AND pricePlan="price1";
    UPDATE ClientGoodsPrice SET price=NEW.price2
        WHERE goodsId=NEW.goodsId AND pricePlan="price2";
    UPDATE ClientGoodsPrice SET price=NEW.price3
        WHERE goodsId=NEW.goodsId AND pricePlan="price3";
    UPDATE ClientGoodsPrice SET price=NEW.refRetailPrice
        WHERE goodsId=NEW.goodsId AND pricePlan="refRetailPrice";
END;


//
DELIMITER ;