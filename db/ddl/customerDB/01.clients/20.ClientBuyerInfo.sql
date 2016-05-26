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
 * Table: ClientBuyerInfo
 * 说明：采购客户信息表，用于供货方向采购方同步数据使用
 */

DROP TABLE IF EXISTS ClientBuyerInfo;
CREATE TABLE ClientBuyerInfo (

	/* id */
	id 			    BIGINT 		AUTO_INCREMENT PRIMARY KEY,

    /* 企业id, 对应到CloudDB.Enterprise.id */
    enterpriseId        BIGINT      UNIQUE DEFAULT NULL,

    /* 启用标志，用于标示该企业已经入驻SCC,企业信息以CUSTOMER表为准， 默认为false */
    enabled             BOOLEAN     NOT NULL DEFAULT FALSE,

	/* 客户编号 ,采购方客户ERP编号 CLIENTCODE*/
	erpCode 			VARCHAR(50) UNIQUE NOT NULL,

	/* 营业执照号 BUSINESSLICENSE*/
	businessLicense     VARCHAR(50)  DEFAULT NULL,

	/* 企业名 CLIENTNAME*/
	enterpriseName      VARCHAR(80)  DEFAULT NULL,

	/* 执照期限 BUSINESSLICENSEVALIDATEDATE*/
	businessLicenseValidate   VARCHAR(80)  DEFAULT NULL,

	/* 营业地址 BUSINESSADDRESS*/
	businessAddress           VARCHAR(200)  DEFAULT NULL,

	/* 法人代表 LEGALREPRESENTATIVE*/
	legalRepresentative       VARCHAR(50)  DEFAULT NULL,

	/* ERP更新时间 UPDATEDON*/
	erpUpdateTime             VARCHAR(80)  DEFAULT NULL,

	/* 对接该采购企业的本企业销售代表id,对应某个

	Operator.id */
	buyerOperatorId     BIGINT      DEFAULT NULL,

	/* 更新时间戳 */
	updatedOn 			TIMESTAMP	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间戳 */
	createdOn 			TIMESTAMP	DEFAULT CURRENT_TIMESTAMP
);



