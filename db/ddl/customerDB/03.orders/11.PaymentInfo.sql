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
 * Table: PaymentInfo
 * 说明：订单支付信息表格
 * --------------------------------------------------------------
 *
 */

DROP TABLE IF EXISTS PaymentInfo;
CREATE TABLE PaymentInfo(

	/* id */
	id 					BIGINT 		   AUTO_INCREMENT PRIMARY KEY,

    /* 交易支付网关id */
    paymentGatewayId    BIGINT         NOT NULL,

    /* 对外商户订单号id，根据sccOrderId生成，仅能用大小写字母与数字，不能用特殊字符 */
    orderId             BIGINT         NOT NULL,


	displayOrderId		VARCHAR(32)     DEFAULT NULL,

	/* 交易币种 币种格式必须为3位代码，境内客户取值：RMB（人民币） */
	currencyCode 	    VARCHAR(3)     DEFAULT "RMB",

    /* 交易金额  */
    txnAmt              DECIMAL(16,2)  NOT NULL,

    /*订单发送时间  */
    txnTime             DATETIME        DEFAULT NOW(),

    /*支付超时时间  此时间建议取支付时的北京时间加15分钟。*/
    payTimeout          DATETIME        DEFAULT NULL,

    /* 持卡人IP 填写持卡人发起交易的IP地址，用于防钓鱼 */
    customerIp          VARCHAR(40)    DEFAULT NULL,

    /* 以下为支付网关回调通知SCC的信息*/
    /* 由银联返回，用于在后续类交易中唯一标识一笔交易，消费交易的流水号，供后续查询用 */
    queryId             VARCHAR(21)    DEFAULT NULL,

    /* 应答信息 	 */
    respMsg             VARCHAR(256)   DEFAULT NULL,

    /* 应答码 */
    respCode            VARCHAR(64)    DEFAULT NULL,

    /* 支付状态 */
    paymentStatus       ENUM(
                            "PAID",
                            "UNPAID"
                        ) NOT NULL DEFAULT "UNPAID",
    /* 商户推送订单后银联系统返回该流水号，商户调用支付控件时使用，长度为21字节数字 */
    tn                  BIGINT         DEFAULT NULL,

	/* 更新时间戳 */
	updatedOn 			TIMESTAMP	    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间戳 */
	createdOn 			TIMESTAMP	    DEFAULT CURRENT_TIMESTAMP


);

