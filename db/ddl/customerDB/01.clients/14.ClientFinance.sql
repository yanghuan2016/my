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
 * Table: ClientFinance
 * 说明：客户财务信息表
 */
DROP TABLE IF EXISTS ClientFinance;
CREATE TABLE ClientFinance (

    /* unique id  Id*/
	id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,

	/* GUID, refer to ERP */
	guid                VARCHAR(50)    DEFAULT NULL,

 	/* 客户id */
	clientId        	BIGINT         NOT NULL,

	/* 现金余额 */
	cashBalance         DECIMAL(16,6)   NOT NULL DEFAULT 0,

	/* 信用额度  */
	credits   			DECIMAL(16,6)   DEFAULT 0,

	/* 欠款余额,等同于可用采购额度   */
	arrearsBalance  	DECIMAL(16,6)   DEFAULT 0,

	/* 账期天数   */
	accountDays			INT             DEFAULT 0,

	/* 信用额度  refer to ERP */
	erpCredits   		DECIMAL(16,6)   DEFAULT 0,

	/* 欠款余额  refer to ERP */
	erpArrearsBalance  	DECIMAL(16,6)   DEFAULT 0,

	/* 账期天数  refer to ERP */
	erpAccountDays		INT             DEFAULT 0,


	/* 更新时戳 */
	updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时戳 */
	createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

	UNIQUE KEY(clientId)
);

