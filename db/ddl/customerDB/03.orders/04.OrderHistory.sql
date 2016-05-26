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
 * Table: OrderHistory
 * 说明：订单历史
 * --------------------------------------------------------------
 * 2015-09-25       hc-romens@issue#49      created
 *
 */

DROP TABLE IF EXISTS OrderHistory;
CREATE TABLE OrderHistory(
    /* id */
	id 							BIGINT 			AUTO_INCREMENT PRIMARY KEY,

	/* clientId */
	clientId					BIGINT			DEFAULT NULL,

	/* operator ID */
	operatorId					BIGINT			NOT NULL,

	/* orderId, from OrderInfo.id */
	orderId 					BIGINT 			DEFAULT NULL,

	/* shipId */
	shipId						BIGINT			DEFAULT NULL,

	/* returnId */
	returnId					BIGINT			DEFAULT NULL,

	/* rejectId */
	rejectId					BIGINT			DEFAULT NULL,

	/* action */
	action						ENUM('CREATE',					/* 已创建 */
	                                 'PAID',				    /* 已支付 */
	                                 'PAID-FAIL',				/* 支付失败 */
                                     'APPROVE',				    /* 通过审核 */
                                     'REJECT',					/* 审核未通过 */
                                     'SHIP',					/* 发货 */
                                     'RECEIVE',					/* 收货 */
                                     'REQUEST-RETURN',			/* 申请退货 */
									 'APPROVE-RETURN',					/* 退货审核已通过 */
                                     'REJECT-RETURN',					/* 退货审核未通过 */
                                     'SHIP-RETURN',				/* 退货发货 */
                                     'RECEIVE-RETURN',			/* 退货收货 */
                                     'SHIP-REJECT',				/* 拒收发货*/
								     'RECEIVE-REJECT',			/* 拒收收货 */
                                     'CLOSE')	NOT NULL DEFAULT 'CREATE',	/* 关闭订单 */
	/* 操作备注 */
	remark                      VARCHAR(512)    DEFAULT NULL,

	/* 创建时间 */
	createdOn                   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);