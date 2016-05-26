/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/


DROP TABLE IF EXISTS SellerOrderDetail;

CREATE TABLE SellerOrderDetail (

	/* guid */
	guid 						VARCHAR(50)		PRIMARY KEY,

	/* OrderInfoGuid */
	orderInfoGuid 				VARCHAR(50)		NOT NULL,

	/* 货号 */
	sellerGoodsNo 				VARCHAR(50) 	NOT NULL,

    /* 平台编码 unicode */
    unicode                     VARCHAR(50)     DEFAULT NULL,

    /* 换算关系 */
    packageQty                  decimal(18,4)   DEFAUlT 1,

	/* 数量 */
	quantity 					DECIMAL(18,2) 	NOT NULL,

    /* 价格 */
	price 					    DECIMAL(18,2)   DEFAULT NULL,

    /* 批准文号 */
	licenseNo 					DECIMAL(18,2)     DEFAULT NULL,

    /* 税额 */
	amountTax 					DECIMAL(18,2)   DEFAULT NULL,

    /* 总价 */
    amount              DECIMAL(18,2)   DEFAULT NULL,

    /* 备注 */
    remark              VARCHAR(250) 	DEFAULT NULL,

	/* 更新时戳 */
	updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时戳 */
	createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
