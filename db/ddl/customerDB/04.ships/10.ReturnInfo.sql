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
 * Table: ReturnInfo
 * 说明：退单信息
 * 
/**********************************************************************/

DROP TABLE IF EXISTS ReturnInfo;
CREATE TABLE ReturnInfo(
    /* id */
	id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

    /* display return id */
    displayReturnId             VARCHAR(32)         DEFAULT NULL,

	/* guid, erp.guid */
	guid                        VARCHAR(50)         DEFAULT NULL,

	/* 发货单号 */
	shipId                      BIGINT              NOT NULL,

	/* 订单号 */
	orderId                     BIGINT              NOT NULL,

    /* 退货申请人id */
    operatorId                  BIGINT              NOT NULL,

    /* operator UID, EPR */
    operatorUid                 VARCHAR(50)         DEFAULT NULL,


  	/* 审核标志 */
  	status                      ENUM("CREATED",
  	                                 "APPROVED",
  	                                 "SHIPPED",
  	                                 "DELIVERED",
  	                                 "CLOSED")      DEFAULT "CREATED",

	/*关闭退货单的时候 当下的退货单状态*/
	beforeCloseStatus      ENUM("CREATED",
								 "APPROVED",
								 "SHIPPED",
								 "DELIVERED")      DEFAULT NULL,
	/*关闭退货单的时间*/
	closeDate				DATETIME 		DEFAULT NULL,

	/*关闭退货的商户管理员Id,若是被客户自己关闭掉 该字段就为空*/
	closeReturnCustomerId  BIGINT 			DEFAULT NULL,

	/**审核用户的退货申请的管理员ID*/
	confirmReturnCustomerId BIGINT 			DEFAULT NULL,

  	/* 审核时间 */
  	confirmDate                 DATETIME             DEFAULT NULL,

	/*退货发货时间*/
	shipDate					DATETIME			 DEFAULT NULL,

	/**商户接收用户退货的管理员ID*/
	receiveReturnCustomerId BIGINT			 DEFAULT NULL,

	/*商户收货时间*/
	receiveDate					DATETIME			  DEFAULT NULL,

    /* 商户回复 */
	customerReply	            TEXT       DEFAULT NULL,

    /* 物流公司内码 ERP.LOGISTICSGUID */
    logisticsId                 VARCHAR(50)     DEFAULT NULL,

    /* 物流单编号 */
    logisticsNo                 VARCHAR(50)     DEFAULT NULL,

	/*退货物流信息提交到scc的时间*/
	returnLogisticsDate               DATETIME        DEFAULT NULL,

	/* 客户 退货发货备注 */
	returnShipRemark            TEXT       DEFAULT NULL,

	/* 商户 退货收货备注 */
	returnDeliveredRemark      TEXT       DEFAULT NULL,

	/* 商户审核退货申请的时候填的备注*/
	replyRemark					TEXT				DEFAULT NULL,

	/* 客户申请退货时候填的备注 */
	remark	                    TEXT        DEFAULT NULL,

	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/**申请退货的时间*/
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP

);
