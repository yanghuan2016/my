/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**********************************************************************
 * Table: CUSTOMER, 在代码中同Enterprise
 * 说明：企业数据库名信息，包括销售企业和采购企业
 *
 * 修订历史：
 * --------------------------------------------------------------------
 * 2015-09-20   hc-romens@issue#23      修改DATABASELIST为CUSTOMER
 *
 * 
 * */
/**********************************************************************/

DROP TABLE IF EXISTS Customer;
CREATE TABLE Customer (

    /* auto increment: enterpriseId primary key */
	id                      BIGINT AUTO_INCREMENT PRIMARY KEY,

	/* 企业id, RESERVED */
	orgId                   BIGINT DEFAULT NULL,

    /* 企业名称 */
    customerName            VARCHAR(80) NOT NULL,

    /*
     * 企业类型:销售企业（商户）, 采购企业(客户), 或者兼而有之。
     * 可以通过位运算获取企业的类型
     */
    enterpriseType          ENUM(
                                "SELLER",   /* 销售企业 */
                                "BUYER",    /* 采购企业 */
                                "BOTH"      /* 销售＋采购*/
                            ) NOT NULL DEFAULT "BOTH",

	/* 商户对应数据库后缀名称 */
	customerDBSuffix        VARCHAR(45) NOT NULL,

    /* 商户是否托管门户标志 */
    hasPortal               BOOL DEFAULT FALSE,

    /* 商户托管门户入口域名 */
    subDomain               VARCHAR(16) DEFAULT NULL,

    /* 商户站点名称 */
    siteName                VARCHAR(256) DEFAULT NULL,

    /* 商户启用/禁用标志 */
    enabled                 BOOL DEFAULT TRUE,

    /* 商户描述 */
	description             VARCHAR(256) DEFAULT NULL,

    /* 公章图片link,用于电子合同 */
    stampLink               VARCHAR(512) DEFAULT NULL,

	/* 营业执照号 */
	businessLicense 		VARCHAR(50) NOT NULL,

    /* 执照期限 */
    businessLicenseValidateDate DATE DEFAULT NULL,

	/* 营业地址 */
	businessAddress 		VARCHAR(200) DEFAULT NULL,

	/* 法人代表 */
  	legalRepresentative 	VARCHAR(50) DEFAULT NULL,

    /* 是否启用平台支付 */
    paymentIsOnCloud        BOOL DEFAULT FALSE,

    /* 是否启用ERP */
    erpIsAvailable          BOOL DEFAULT FALSE,

    /* ERP测试 */
    hasValidErpSetting      BOOL DEFAULT FALSE,

    /* ERP接口的URL , ERPURL -> erpMsgUrl*/
    erpMsgUrl               VARCHAR(500) DEFAULT NULL,

    /* AppCode Url */
    erpAppCodeUrl           VARCHAR(500) DEFAULT NUll,

    /* appKey */
    appKey                  CHAR(32) DEFAULT NULL,

    /* 创建时间 */
	createdOn    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

	/* 最近更新时间 */
	updatedOn    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	UNIQUE KEY  (businessLicense)
);
