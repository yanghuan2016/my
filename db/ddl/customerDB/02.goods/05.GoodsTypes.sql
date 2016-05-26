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
 * Table: goodsTypes
 * 说明：商品的分类信息
 */

DROP TABLE IF EXISTS GoodsTypes;
CREATE TABLE GoodsTypes (

    /* erpId */
    erpId       BIGINT 			    AUTO_INCREMENT PRIMARY KEY,

    /* erpIdGoodsTypesCode */
    erpIdGoodsTypesCode       VARCHAR(30)         UNIQUE NULL,

	/* 类别名称 */
	name 			VARCHAR(80) 	DEFAULT "",

    /* help code*/
    helpCode        VARCHAR(50)    DEFAULT "",

    /* LBID */
    LBID            VARCHAR(30)          DEFAULT 0,

    /* 包含父类和分隔符号的全名称，如："西药>心脑血管" */
    fullname        VARCHAR(200)    DEFAULT "",

	/* 上级分类Id */
	parentErpId 	    VARCHAR(30) 			DEFAULT 0,

	/* 级别 */
	level 			INT 			DEFAULT 0,

    /* 删除标志 */
    isDeleted       BOOLEAN         DEFAULT FALSE,

	/* 最近更新时间 */
	updatedOn 		TIMESTAMP 		DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdOn 		TIMESTAMP 		DEFAULT CURRENT_TIMESTAMP,

	/* 显示顺序 */
	displayOrder 	INT 			DEFAULT 9999999
);


DELIMITER //

/* Trigger */

/************************
DROP TRIGGER IF EXISTS updateGoodsTypes;
CREATE TRIGGER updateGoodsTypes AFTER UPDATE ON GoodsTypes FOR EACH ROW
BEGIN
    IF OLD.fullname <> NEW.fullname AND NEW.fullname<>"" THEN
        UPDATE GoodsInfo SET goodsType=NEW.fullname WHERE goodsTypeId=NEW.erpId;
    END IF;
END;
*************************/

//
DELIMITER ;

/**
 * Table: GoodsTypesMap
 * 商品类别对应表
 */
DROP TABLE IF EXISTS GoodsTypeMap;
CREATE TABLE GoodsTypeMap(
    /* id */
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,

    /* goodsType ID, refer to GoodsTypes.id */
    goodsTypeId         BIGINT          NOT NULL,

    /* goods ID, refer to GoodsInfo.id */
    goodsId             BIGINT          NOT NULL,

    /* is this the main type*/
    isMain              BOOLEAN         NOT NULL DEFAULT FALSE,

    /* a timestamp on creation */
    createdOn           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);