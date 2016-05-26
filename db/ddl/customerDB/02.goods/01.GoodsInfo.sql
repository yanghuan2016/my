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
 * Table: GoodsInfo
 * 说明：商品的基本信息
 *
 * ------------------------------------------------------------
 * 2015-09-24   hc-romens@issue#45      re-constructed
 *
 */

DROP TABLE IF EXISTS GoodsInfo;
CREATE TABLE GoodsInfo (

	/* ID */
	id	 			BIGINT 					AUTO_INCREMENT PRIMARY KEY,

	/* GUID */
	guid  			VARCHAR(50) 			UNIQUE DEFAULT NULL,

	/* 平台编码 unicode */
	unicode         VARCHAR(50)             UNIQUE DEFAULT NULL,

	/* 换算关系 */
	packageQty      decimal(18,4)           DEFAUlT 1,

    /* 已弃用！商品类别id, 0 表示没有归类 */
  goodsTypeId     BIGINT                  DEFAUlT 0,

	/* 已弃用！类别描述, 复制GoodsTypes.fullname到这里 ,例如: 重要产品->心脑血管 */
	goodsType 		VARCHAR(50) 			DEFAULT NULL,

	/* 货号,商户OR客户ERP自用SKU */
	goodsNo 		VARCHAR(50) 			UNIQUE DEFAULT NULL,

	/* 医药365货号 */
	skuNo 	        VARCHAR(50) 			UNIQUE DEFAULT NULL,

	/* 条形码 */
	barcode 		VARCHAR(50) 			DEFAULT NULL,

	/* 是否是处方药 */
	isPrescriptionDrugs		BOOL 			DEFAULT true,

	/* 商品通用名称 */
	commonName 		VARCHAR(50) 			DEFAULT NULL,

    /* 拼音首字母缩写 */
    pinyinInitials  VARCHAR(256)            DEFAULT NULL,

	/* 商品别名 */
	alias 			VARCHAR(50) 			DEFAULT "",

    /* 批准文号 */
    licenseNo       VARCHAR(100)            DEFAULT "",

	/* 文号或备案号有效期限 */
	filingNumberValidDate           DATE    DEFAULT NULL,

	/* 规格 */
	spec 			VARCHAR(50) 			DEFAULT NULL,

	/* 供应商 */
	supplier 		VARCHAR(50) 			DEFAULT NULL,

	/* 产地 */
	birthPlace 		VARCHAR(50) 			DEFAULT NULL,

	/* 生产企业 */
	producer        VARCHAR(50)             DEFAULT NULL,

	/* 单位 */
	measureUnit     VARCHAR(50)             DEFAULT NULL,

	/* 图片url地址 */
    imageUrl     	VARCHAR(500)            DEFAULT NULL,

	/* 大包装单位 */
	largePackUnit   VARCHAR(50)             DEFAULT NULL,

	/* 大包装量 */
	largePackNum    VARCHAR(50)             DEFAULT NULL,

	/* 大包装条形码 */
	largePackBarcode VARCHAR(50)            DEFAULT NULL,

	/* 中包装单位 */
	middlePackUnit  VARCHAR(50)             DEFAULT NULL,

	/* 中包装量 */
	middlePackNum   VARCHAR(50)             DEFAULT NULL,

	/* 中包装条形码 */
	middlePackBarcode VARCHAR(50)           DEFAULT NULL,

    /* 小包装单位 */
	smallPackUnit   VARCHAR(50)             DEFAULT NULL,

	/* 小包装量 */
	smallPackNum    VARCHAR(50)             DEFAULT NULL,

	/* 小包装条形码 */
	smallPackBarcode VARCHAR(50)            DEFAULT NULL,

	/* 药剂类型 */
    drugsType       VARCHAR(50)                DEFAULT NULL,

    /**
     * GSP控制范围ID, @see GoodsGspType.id */
    gspTypeId       BIGINT                  DEFAULT NULL,

    /* 允许负库存销售 */
	negSell         BOOL                    DEFAULT FALSE,

    /* 禁用标志, 表示商品不能购买 */
	isForbidden     BOOL                    DEFAULT FALSE,

	/* 删除标志,商品不再可见 */
	isDeleted     	BOOL                    DEFAULT FALSE,

	/* 入库检查库存上线标志, ERP used only,SCC暂时没有用到 */
    isCheckStore    BOOL                    DEFAULT FALSE,

    /* 需要控制销售范围标志, SCC暂时没有用到 */
    isAreaLimited   BOOL                    DEFAULT NULL,

    /* 商品销售范围 */
    areaDesc        VARCHAR(200)            DEFAULT NULL,

 	/* 可以购买商品的客户类范围 */
    clientDesc      VARCHAR(200)            DEFAULT NULL,

	/* 商品详情描述 */
	goodsDetails    VARCHAR(2048)           DEFAULT NULL,

	/* ERP更新时间 */
	erpUpdatedOn    DATE              DEFAULT NULL,

	/* 最近同步时间 */
	lastAsyncTime   DATE               DEFAULT NULL,

	/* 最近更新时间 */
	updatedOn       TIMESTAMP               DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdOn       TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,

	/* Full Text Search Index */
	FULLTEXT(goodsNo,commonName,alias,pinyinInitials,licenseNo,producer)
);

/**********************************************
 * Triggers
 * 用来保证数据的完整性
 *********************************************/

DELIMITER //

/**
 * Add GoodsInventory and GoodsPrice and ClientGoodsPrice
 * on new GoodsInfo is insert.
 */
DROP TRIGGER IF EXISTS beforeAddGoods;
CREATE TRIGGER beforeAddGoods BEFORE INSERT ON GoodsInfo FOR EACH ROW
BEGIN
    DECLARE goodsTypeId VARCHAR(120);
    IF NEW.goodsType<>"" THEN
        SELECT erpId into goodsTypeId FROM GoodsTypes WHERE fullname=NEW.goodsType;
        SET NEW.goodsTypeId=goodsTypeId;
    END IF;
END;

//
DELIMITER ;
