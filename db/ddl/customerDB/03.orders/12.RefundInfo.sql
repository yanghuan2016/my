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
 * Table: RefundInfo
 * 说明：退款信息表格
 * --------------------------------------------------------------
 *
 */

DROP TABLE IF EXISTS RefundInfo;
CREATE TABLE RefundInfo(

	/* id */
	id 					BIGINT 		   AUTO_INCREMENT PRIMARY KEY,

    /* display refund id */
    displayRefundId     VARCHAR(32)     DEFAULT NULL,

    /* 交易支付网关id */
    paymentGatewayId    BIGINT         NOT NULL,

	/* 对外商户订单号id，根据sccOrderId生成，仅能用大小写字母与数字，不能用特殊字符 */
	orderId		        BIGINT         NOT NULL,

	/* 交易币种 币种格式必须为3位代码，境内客户取值：RMB（人民币） */
	currencyCode 	    VARCHAR(3)     DEFAULT "RMB",

    /* 退款金额  */
    txnAmt              DECIMAL(16,2)  NOT NULL,

   /* 原订单金额  */
    orderAmt            DECIMAL(16,2)  NOT NULL,

    /* 后续类交易（如退货、消费撤销等）送原交易的queryId */
    origQryId           VARCHAR(21)    DEFAULT NULL,

    /* 退款原因 */
    rmReason            VARCHAR(200)   DEFAULT NULL,


	/* 更新时间戳 */
	updatedOn 			TIMESTAMP	    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间戳 */
	createdOn 			TIMESTAMP	    DEFAULT CURRENT_TIMESTAMP

);
