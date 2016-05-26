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
 * Table: OrderDetails
 * 说明：订单商品表
 * --------------------------------------------------------------
 * 2015-09-25       hc-romens@issue#49      created
 *
 */

DROP TABLE IF EXISTS OrderDetails;
CREATE TABLE OrderDetails(
    /* id */
	id 							BIGINT 			AUTO_INCREMENT PRIMARY KEY,

	/* guid , for ERP */
	guid 						VARCHAR(50)		DEFAULT NULL,

	/* orderId, from OrderInfo.id */
	orderId 					BIGINT 			NOT NULL,

    /* 商品id, from Goods.id */
	goodsId 					BIGINT 			NOT NULL,

	/* pricePlan 价格方案 */
	pricePlan                   ENUM(	"wholesalePrice",
										"price1",
										"price2",
										"price3",
										"categoryPrice",
										"clientPrice")
										NOT NULL DEFAULT "wholesalePrice",

    /* 实际销售价格 */
	soldPrice                   DECIMAL(18,4)   NOT NULL,

	/* 数量 */
	quantity                    DECIMAL(18,6)   NOT NULL,

	/* 审核标志 */
	status		              	ENUM("APPROVED","DISAPPROVED","STOCKOUT") DEFAULT NULL,

	/* 发货数量 = sum(shipDetail.quantity) */
	shippedQuantity             DECIMAL(18,6)   DEFAULT 0,

	/* 小计 */
	amount                      DECIMAL(18,4)   NOT NULL,

	/* 商品备注 */
	remark                      VARCHAR(512)    DEFAULT NULL,

	/* 最近更新时间 */
	updatedOn                   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdOn                   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

