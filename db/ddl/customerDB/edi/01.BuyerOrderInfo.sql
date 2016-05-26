/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/


DROP TABLE IF EXISTS BuyerOrderInfo;

CREATE TABLE BuyerOrderInfo(

	/* guid */
	guid 					VARCHAR(50)		PRIMARY KEY,

	/* 单据编号 */
	billNO 				    VARCHAR(50) 	DEFAULT NULL,

	/* 单据日期 */
	billDate				DATETIME		DEFAULT NULL,

	/* 供应商编号 */
	sellerCode			    VARCHAR(50)		NOT NULL,

	/* 供应商名称 */
	sellerName			    VARCHAR(50)		DEFAULT NULL,

    /* 收货人姓名 */
    consigneeName           VARCHAR(50)     DEFAULT NULL,

    /* 收货地址 */
    consigneeAddress        VARCHAR(80)     DEFAULT NULL,

    /* 收货人联系电话 */
    consigneeMobileNum      VARCHAR(50)     DEFAULT NULL,

	/* 采购方业务员编号 */
	buyerEmployeeCode	    VARCHAR(50) 	DEFAULT NULL,

	/* 采购方业务员名称 */
	buyerEmployeeName 		VARCHAR(50) 	DEFAULT NULL,

	/* 供应商业务员名称 */
  	sellerEmployeeName	    VARCHAR(50) 	DEFAULT NULL,

	/* 订单失效期 */
  	usefulDate		        DATETIME 	    DEFAULT NULL,

	/* 预计到货日期 */
  	advGoodsArriveDate		DATETIME 	    DEFAULT NULL,

	/* 备注 */
  	remark		            VARCHAR(250) 	DEFAULT NULL,

    /* 审核相关 */
    isConfirmed             BOOLEAN         DEFAULT FALSE,
	confirmRemark 			VARCHAR(250) 	DEFAULT NULL,
	confirmDate             DATETIME        DEFAULT NULL,

    /* 关闭订单 */
    isClosed                BOOLEAN         DEFAULT FALSE,
	closeRemark 			VARCHAR(250) 	DEFAULT NULL,
	closeDate               DATETIME        DEFAULT NULL,

	/* 最近更新时间 */
	updatedOn 				TIMESTAMP		DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdOn 				TIMESTAMP		DEFAULT CURRENT_TIMESTAMP
);