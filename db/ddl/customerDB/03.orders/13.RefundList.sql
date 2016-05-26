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
 * Table: RefundList
 * 说明：退款队列表
 *
 */

DROP TABLE IF EXISTS RefundList;
CREATE TABLE RefundList(

	/* id */
	id 					BIGINT 		    AUTO_INCREMENT PRIMARY KEY,


    /* SCC RefundInfo.id */
    refundId            BIGINT 	        NOT NULL,

    /* 退款状态 */
    status              ENUM('CREATED',
                             'APPROVED',
                             'REJECTED',
                             'FINISHED'
                             )	DEFAULT 'CREATED',

    /*退款发送时间  */
    txnTime             DATETIME    DEFAULT NOW(),


    /*退款超时时间  */
    payTimeout          DATETIME     DEFAULT NULL,

    /* 以下为支付网关回调通知SCC的信息*/
    /* 由银联返回，用于在后续类交易中唯一标识一笔交易，消费交易的流水号，供后续查询用 */
    queryId             VARCHAR(21)    DEFAULT NULL,

    /* 应答信息 	 */
    respMsg             VARCHAR(256)   DEFAULT NULL,

    /* 应答码 */
    respCode            VARCHAR(64)     DEFAULT NULL,

    /* 收单机构对账时使用，该域由银联系统产生 */
    traceNo             INT(6)         DEFAULT NULL,

    /* 交易传输时间 24小时制收单机构对账时使用，该域由银联系统产生 */
    traceTime           VARCHAR(14)    DEFAULT NULL,

	/* 更新时间戳 */
	updatedOn 			TIMESTAMP	    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间戳 */
	createdOn 			TIMESTAMP	    DEFAULT CURRENT_TIMESTAMP
);

