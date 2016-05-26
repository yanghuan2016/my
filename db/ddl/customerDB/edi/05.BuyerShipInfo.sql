/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

DROP TABLE IF EXISTS BuyerShipInfo;

CREATE TABLE BuyerShipInfo (

    /* 流水号 */
	billNo              VARCHAR(50)     PRIMARY KEY,

	/* 单据日期 */
	billDate			VARCHAR(50)		DEFAULT NULL,

	/* 单据时间 */
	billTime			VARCHAR(50)		DEFAULT NULL,

	/* 订单号 */
	orderBillNo			VARCHAR(50)		DEFAULT NULL,

	/* 订单guid */
	orderGuid			VARCHAR(50)		DEFAULT NULL,

	/* 备注 */
	notes			    VARCHAR(50)		DEFAULT NULL,

	/*  */
	FHRY			    VARCHAR(50)		DEFAULT NULL,

	/*  */
	FHRQ			    VARCHAR(50)		DEFAULT NULL,

    /* 状态相关 */
    isShipped           BOOLEAN         DEFAULT FALSE,
	confirmRemark 	    VARCHAR(250) 	DEFAULT NULL,
	confirmDate         DATETIME        DEFAULT NULL,

	/* 供应商名称:  */
	sellerName			VARCHAR(50)		DEFAULT NULL,

	/* 供应商编号:  */
	sellerCode   		VARCHAR(50)     	 NOT NULL,

	/* 更新时戳 */
	updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时戳 */
	createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
