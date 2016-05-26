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
 * Table: Clients
 * 说明：客户信息表
 */

DROP TABLE IF EXISTS Client;
CREATE TABLE Client (

	/* id */
	id 					BIGINT 		AUTO_INCREMENT PRIMARY KEY,

	/* guid, referred by ERP */
	guid 				VARCHAR(50)	DEFAULT NULL,

    /* 客户类别id, refer to ClientCategory.id */
	clientCategoryId    BIGINT  DEFAULT NULL,

	/* 客户编号 */
	clientCode 			VARCHAR(50) UNIQUE NOT NULL,

	/* 客户所属区域 */
	clientArea 			VARCHAR(50) DEFAULT NULL,

	/* 客户名称 */
	clientName 			VARCHAR(50)  UNIQUE NOT NULL,

	/* 价格方案 */
	pricePlan 			ENUM("wholesalePrice",
							 "price1",
	                         "price2",
	                         "price3",
	                         "refRetailPrice") DEFAULT 'refRetailPrice',

	/* 电子邮箱 */
	email 				VARCHAR(80) DEFAULT NULL,

	/* 手机号 */
	mobile 				VARCHAR(80) DEFAULT NULL,

	/*  传真号 */
	fax					VARCHAR(80) DEFAULT NULL,

    defaultAddressId    BIGINT      DEFAULT NULL,

	/* 默认收货地址 */
	defaultAddress    	TEXT		DEFAULT NULL,

	/* 回款提醒通知消息 */
	paymentReminderMsg 	VARCHAR(50) DEFAULT NULL,


    /* 商户支付方式 */
    paymentType               ENUM(
                                "ONLINE",   /* 在线支付 */
                                "CREDIT"    /* 授信客户 */
                            ) NOT NULL DEFAULT "ONLINE",

	/* 公章图片URL */
	stampLink           VARCHAR(256) DEFAULT NULL,

    /* 审核标志*/
    registerStatus      ENUM('CREATED',
                            'APPROVED',
                            'UPDATED',
                          	'REJECTED'
                          	)	DEFAULT 'CREATED',
    /*审核意见*/
    checkComments  TEXT DEFAULT NULL  ,

    /* 医院级别 */
    hospitalLevel       VARCHAR(64)     DEFAULT NULL,

    /* 医院等次 */
    hospitalGrades      VARCHAR(64)     DEFAULT NULL,

	/* 停购标志, 对应ERP的ISVALID，不可下新订单，老订单仍可处理 */
	readOnly			BOOL		DEFAULT FALSE,

	/* 禁用标志，对应ERP的ISDISABLE */
	enabled				ENUM("NEEDAPPROVAL", /* 待审核未启用*/
                             "DISABLED", /* 禁用 */
                             "ENABLED" /* 启用 */
                             ) DEFAULT "NEEDAPPROVAL",

    /* 是否启用ERP  avaliableERP -> erpIsAvailable */
    erpIsAvailable        BOOL        DEFAULT FALSE,

    /* ERP接口的URL , ERPURL -> erpMsgUrl*/
    erpMsgUrl                      VARCHAR(500)        DEFAULT NULL,

    /* AppCode Url */
    erpAppCodeUrl       VARCHAR(500)    DEFAULT NUll,

    /* 用户对接ERP用的KEy */
    appKey              CHAR(32)    DEFAULT NULL,

	/* 更新时间戳 */
	updatedOn 			TIMESTAMP	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间戳 */
	createdOn 			TIMESTAMP	DEFAULT CURRENT_TIMESTAMP
);


/**********************************************
 * Triggers
 * 用来保证数据的完整性
 *********************************************/

DELIMITER //



/**
 * 为新增客户在ClientGoodsPrice中生成商品价格
 */
DROP TRIGGER IF EXISTS addClientGsp;
CREATE TRIGGER addClientGsp AFTER INSERT ON Client FOR EACH ROW
BEGIN
    /* 生成空ClientGsp记录 */
    INSERT INTO ClientGsp(clientId) VALUES (NEW.id);
     /* 生成空ClientFinance记录 */
    INSERT INTO ClientFinance(clientId) VALUES (NEW.id);

    /* 生成ClientGoodsPrice */
    INSERT INTO ClientGoodsPrice(clientId, goodsId, pricePlan, price)
        SELECT NEW.id, goodsId, NEW.pricePlan,
               CASE
                    WHEN NEW.pricePlan='wholesalePrice' THEN wholesalePrice
                    WHEN NEW.pricePlan='price1' THEN price1
                    WHEN NEW.pricePlan='price2' THEN price2
                    WHEN NEW.pricePlan='price3' THEN price3
                    WHEN NEW.pricePlan='refRetailPrice' THEN refRetailPrice
               END
        FROM GoodsPrice
    ON DUPLICATE KEY UPDATE clientId=VALUES(clientId),goodsId=VALUES(goodsId),pricePlan=VALUES(pricePlan),price=VALUES(price);

END;

/**
 * 客户价格方案更新时，需要同步价格数据
 */
DROP TRIGGER IF EXISTS updatePricePlan;
CREATE TRIGGER updatePricePlan AFTER UPDATE ON Client FOR EACH ROW
BEGIN
    INSERT INTO ClientHistory (clientId,guid,clientCategoryId,clientCode,clientArea,clientName,pricePlan,email,
    mobile,fax,defaultAddress,paymentReminderMsg,registerStatus,readOnly,enabled,updatedOn,createdOn)
    VALUES (NEW.id,NEW.guid,NEW.clientCategoryId,NEW.clientCode,NEW.clientArea,NEW.clientName,NEW.pricePlan,NEW.email,
    NEW.mobile,NEW.fax,NEW.defaultAddress,NEW.paymentReminderMsg,NEW.registerStatus,NEW.readOnly,NEW.enabled,NEW.updatedOn,NEW.createdOn);

    IF OLD.pricePlan <> NEW.pricePlan THEN
        /* 恢复GoodsPrice中设定的价格 */
        IF NEW.pricePlan="wholesalePrice" THEN
            /* 设置为wholesalePrice */
            UPDATE ClientGoodsPrice, GoodsPrice
               SET ClientGoodsPrice.pricePlan='wholesalePrice',
                   ClientGoodsPrice.price=GoodsPrice.wholesalePrice
             WHERE ClientGoodsPrice.clientId=OLD.id AND
                   GoodsPrice.goodsId=ClientGoodsPrice.goodsId AND
                   ClientGoodsPrice.pricePlan<>'clientPrice' AND
                   ClientGoodsPrice.pricePlan<>'clientCategoryPrice' AND
                   ClientGoodsPrice.goodsId IN (SELECT id FROM GoodsInfo);
        ELSEIF NEW.pricePlan="price1" THEN
            /* 设置为price1 */
            UPDATE ClientGoodsPrice, GoodsPrice
               SET ClientGoodsPrice.pricePlan='price1',
                   ClientGoodsPrice.price=GoodsPrice.price1
             WHERE ClientGoodsPrice.clientId=OLD.id AND
                   GoodsPrice.goodsId=ClientGoodsPrice.goodsId AND
                   ClientGoodsPrice.pricePlan<>'clientPrice' AND
                   ClientGoodsPrice.pricePlan<>'clientCategoryPrice' AND
                   ClientGoodsPrice.goodsId IN (SELECT id FROM GoodsInfo);
        ELSEIF NEW.pricePlan="price2" THEN
            /* 设置为 price2 */
            UPDATE ClientGoodsPrice, GoodsPrice
               SET ClientGoodsPrice.pricePlan='price2',
                   ClientGoodsPrice.price=GoodsPrice.price2
             WHERE ClientGoodsPrice.clientId=OLD.id AND
                   GoodsPrice.goodsId=ClientGoodsPrice.goodsId AND
                   ClientGoodsPrice.pricePlan<>'clientPrice' AND
                   ClientGoodsPrice.pricePlan<>'clientCategoryPrice' AND
                   ClientGoodsPrice.goodsId IN (SELECT id FROM GoodsInfo);
        ELSEIF NEW.pricePlan="price3" THEN
            /* 设置为price3 */
            UPDATE ClientGoodsPrice, GoodsPrice
               SET ClientGoodsPrice.pricePlan='price3',
                   ClientGoodsPrice.price=GoodsPrice.price3
             WHERE ClientGoodsPrice.clientId=OLD.id AND
                   GoodsPrice.goodsId=ClientGoodsPrice.goodsId AND
                   ClientGoodsPrice.pricePlan<>'clientPrice' AND
                   ClientGoodsPrice.pricePlan<>'clientCategoryPrice' AND
                   ClientGoodsPrice.goodsId IN (SELECT id FROM GoodsInfo);
        END IF;
    END IF;
END;
//
DELIMITER ;

