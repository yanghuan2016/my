/*****************************************************************
 * 青岛雨人软件有限公司?2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * Table: GoodsCache
 * 说明：商品的基础信息备份
 *
 * ------------------------------------------------------------
 * 源于yiyao365的商品信息，其中skuNo通过批准文号licenseNo 和ERP的GoodsInfo.goodsNo对应
 *
 */
DROP TABLE IF EXISTS GoodsCache;
 CREATE TABLE GoodsCache (

 	/* ID */
 	id	 			BIGINT 					AUTO_INCREMENT PRIMARY KEY,

 	/* GUID 对应医药365 -GUID */
 	guid  			VARCHAR(50) 	        DEFAULT NULL,

 	/* 医药365内码-HH */
 	skuNo 	        VARCHAR(50) 			UNIQUE DEFAULT NULL,

 	/* 条形码 医药365-BARCODE */
	barcode 		VARCHAR(50) 			DEFAULT NULL,

 	/* 商品通用名称 医药365-MEDICINETITLE*/
 	commonName 		VARCHAR(50) 			DEFAULT NULL,

 	/* 商品英文名 医药365-ENGLISHNAME  */
 	englishName 	VARCHAR(50) 			DEFAULT "",

    /* 批准文号 医药365-PZWH*/
     licenseNo      VARCHAR(100)            DEFAULT "",

    /* 旧批准文号 医药365-OLDPZWH*/
     oldLicenseNo   VARCHAR(100)            DEFAULT "",

 	/* 品牌 医药365-PRODUCTNAME*/
 	productName	    VARCHAR(50) 			DEFAULT NULL,

    /* 类型 医药365-TYPE*/
     type		    VARCHAR(50) 			DEFAULT NULL,

 	/* 规格 医药365-GG */
 	spec 			VARCHAR(50) 			DEFAULT NULL,

 	/* 产地 医药365-FACTORYADDRESS */
 	birthPlace 		VARCHAR(50) 			DEFAULT NULL,

 	/* 生产企业 医药365-FACTORYNAME */
 	producer        VARCHAR(50)             DEFAULT NULL,

 	/* 本位码  医药365-BWM */
 	bwm             VARCHAR(50)             DEFAULT NULL,

 	/* 功能主治  医药365-ZZ  */
 	zz              VARCHAR(500)             DEFAULT NULL,

 	/* 禁忌  医药365-JJ  */
 	taboo           VARCHAR(500)             DEFAULT NULL,


 	/* 药物相互作用  医药365-XHZY  */
 	drugInteraction VARCHAR(500)             DEFAULT NULL,

 	/* 药理毒理  医药365-YLDL  */
 	pharmaToxicology     VARCHAR(500)            DEFAULT NULL,


 	/* 不良反应  医药365-BLFY  */
 	adverseReaction      VARCHAR(500)            DEFAULT NULL,

	/* 注意事项  医药365-MEMO2  */
 	notes               VARCHAR(500)             DEFAULT NULL,

	/* 用法用量  医药365-YFYL  */
 	usageAndDosage      VARCHAR(500)             DEFAULT NULL,

 	/* 图片url地址 医药365-IMGPATH */
     imageUrl     	    VARCHAR(500)            DEFAULT NULL,

    /* 药剂类型  医药365-JX*/
     drugsType          VARCHAR(50)             DEFAULT NULL,

    /* 存储条件 医药365-ZCFF */
    storageCondition    VARCHAR(50)             DEFAULT NULL,


    /* 申请日期 医药365-APPLYDATE */
    yiyao365Applydate   TIMESTAMP               DEFAULT 0,

    /* 参考价格 医药365-PRICE  */
 	referencePrice      DECIMAL(18,4)           DEFAULT 0,

	/* 更新时间戳 医药365-UPDATEDATE */
 	yiyao365Update      TIMESTAMP               DEFAULT 0,

    /* 同步数据时间  */
    lastAsyncDate       TIMESTAMP               DEFAULT 0,

 	/* 最近更新时间 */
 	updatedOn           TIMESTAMP               DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

 	/* 创建时间 */
 	createdOn           TIMESTAMP               DEFAULT CURRENT_TIMESTAMP
 );
