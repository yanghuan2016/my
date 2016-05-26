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
 * Table: Order
 * 说明：订单表
 * --------------------------------------------------------------
 * 2015-09-25       hc-romens@issue#49      created
 *
 */


DROP TABLE IF EXISTS OrderInfo;
CREATE TABLE OrderInfo(

	/* id */
	id 						BIGINT 			AUTO_INCREMENT PRIMARY KEY,

	/* display order id */
	displayOrderId          VARCHAR(32)     DEFAULT NULL,

	/* guid, for ERP use */
	guid 					VARCHAR(50)		DEFAULT NULL,

	/* order creation operator id , 下单操作员id */
	operatorId 				BIGINT 			NOT NULL,

	/* client id, 客户id */
	clientId				BIGINT			NOT NULL,

	/* 客户类别 */
	clientCategory	       		VARCHAR(50) 	DEFAULT NULL,

	/* consignee name, 收货人姓名 */
	consigneeName 			VARCHAR(50) 	DEFAULT NULL,

	/* 收货地址 */
  	consigneeAddress		VARCHAR(250) 	DEFAULT NULL,

  	/* 收货人手机 */
  	consigneeMobileNum 		VARCHAR(30) 	DEFAULT NULL,
  	
  	/* status, 订单状态 */
  	status					ENUM('CREATED',					/* 已提交待审核*/
                                 'APPROVED',				/* 已受理待发货 */
  								 'SHIPPED',					/* 商家已发货 */
  								 'FINISHED',					/* 已完成订单 */
  								 'CLOSED')	DEFAULT 'CREATED',	/* 已关闭订单 */

    /* 订单备注 */
	remark 					VARCHAR(200) 	DEFAULT NULL,

    /* 关闭订单的操作人Id */
	closeOperatorId			BIGINT			DEFAULT NULL,

	/*关闭订单的日期*/
	closeOrderInfoDate 		DATETIME		DEFAULT NULL,

    /* 审核备注 */
	confirmRemark 			VARCHAR(200) 	DEFAULT NULL,

	/* 审核日期 */
	confirmDate             DATETIME        DEFAULT NULL,

	promotionSum			DECIMAL(18,4)	DEFAULT 0,

    /* 使用了优惠码标志, @see OrderCoupon */
    hasDiscount             BOOL            NOT NULL DEFAULT FALSE,

	/* 全部折扣总金额 */
	discountAmount			DECIMAL(18,4)	DEFAULT 0,

    /* 商户支付方式 */
    paymentType             ENUM("ONLINE",          /* 在线支付 */
                                 "CREDIT",          /* 授信支付 */
                                 "COD"              /* 货到付款 */
                            ) NOT NULL     DEFAULT "ONLINE",

	/* 该订单对应的最新支付消息PaymentInfo.id */
    paymentId               BIGINT         DEFAULT NULL,

    /* 商户支付状态 */
    paymentStatus           ENUM("PAID",            /* 已支付 */
                                 "UNPAID"            /* 未支付 */
                            ) NOT NULL     DEFAULT "UNPAID",

    /* 银行回调支付状态 */
    bankNotifyStatus        ENUM("PAID",
                                 "UNPAID"
                            ) NOT NULL     DEFAULT "UNPAID",


	/* 支付超时时间为:当前时间+指定超时期限(系统可配置) */
    paymentExpire           DATETIME       DEFAULT NULL,


	/* 是否有退款 */
    hasRefund               BOOL           DEFAULT FALSE,

    /* 是否索要发票 */
    hasReceipt              BOOL           DEFAULT FALSE,

	/* 保留字段	  *
	 * 运费 */
	freight					DECIMAL(18,4)	DEFAULT 0,

	/* 合计 */
	total					DECIMAL(18,4)	NOT NULL,


    /* 客户电子签名, BASE64格式 */
    clientSignature         TEXT            DEFAULT NULL,

    /* 商户电子签名, BASE64格式 */
    customerSignature       TEXT            DEFAULT NULL,

    /* 发票抬头 */
    receiptTitle            TEXT            DEFAULT NULL,

    /* 审核批准时间，即合同成立时间 */
    contractTime            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

	/* 最近更新时间 */
	updatedOn 				TIMESTAMP		DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdOn 				TIMESTAMP		DEFAULT CURRENT_TIMESTAMP
);


