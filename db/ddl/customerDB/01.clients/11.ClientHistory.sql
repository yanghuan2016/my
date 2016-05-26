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
 * Table: ClientsHistory
 * 说明：客户历史信息表
 */

DROP TABLE IF EXISTS ClientHistory;
CREATE TABLE ClientHistory (

	/* id */
	id 					BIGINT 		AUTO_INCREMENT PRIMARY KEY,

    /* 客户类别id, refer to Client.id */
    clientId            BIGINT      NOT NULL,


	/* guid, referred by ERP */
	guid 				VARCHAR(50)	DEFAULT NULL,

	/* 客户类别, refer to ClientCategory */
	clientCategory	    VARCHAR(50) DEFAULT NULL,

    /* 客户类别id, refer to ClientCategory.id */
	clientCategoryId    BIGINT  DEFAULT NULL,

	/* 客户编号 */
	clientCode 			VARCHAR(50) NOT NULL,

	/* 客户所属区域 */
	clientArea 			VARCHAR(50) DEFAULT NULL,

	/* 客户名称 */
	clientName 			VARCHAR(50) NOT NULL,

	/* 价格方案 */
	pricePlan 			ENUM("wholesalePrice",
							 "price1",
	                         "price2",
	                         "price3") DEFAULT NULL,
	 /* 审核标志*/
	 registerStatus      ENUM('CREATED',
							 'APPROVED',
							 'UPDATED',
							'REJECTED'
							)	DEFAULT 'CREATED',

	/* 电子邮件地址 */
	email 				VARCHAR(80) DEFAULT NULL,

	/* 手机号码 */
	mobile 				VARCHAR(80) DEFAULT NULL,

	/* Fax number */
	fax					VARCHAR(80) DEFAULT NULL,

	/* 默认地址ID, refer to ClientAddress.id */
	defaultAddress    	TEXT		DEFAULT NULL,

	/* 回款提醒通知消息 */
	paymentReminderMsg 	VARCHAR(50) DEFAULT NULL,

	/* 停购标志, 对应ERP的ISVALID，不可下新订单，老订单仍可处理 */
	readOnly			BOOL		DEFAULT FALSE,

	/* 禁用标志，对应ERP的ISDISABLE */
	enabled				ENUM("NEEDAPPROVAL", /* 待审核未启用*/
                             "DISABLED", /* 禁用 */
                             "ENABLED" /* 启用 */
                             ) DEFAULT "NEEDAPPROVAL",
    updatedOn			TIMESTAMP	DEFAULT CURRENT_TIMESTAMP,

    createdOn 		    TIMESTAMP	DEFAULT CURRENT_TIMESTAMP,

	/* 创建时间戳 */
	createdTime 		TIMESTAMP	DEFAULT CURRENT_TIMESTAMP
);


