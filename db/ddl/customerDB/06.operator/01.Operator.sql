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
 * Table: Operator
 * 说明：商户操作员、客户操作员的信息
 */

DROP TABLE IF EXISTS Operator;
CREATE TABLE Operator(
	/* id */
	id 					BIGINT 		                AUTO_INCREMENT PRIMARY KEY,

    /* guid */
    guid                VARCHAR(50)                 DEFAULT NULL,

	/* username, login name */
	username            VARCHAR(32)                 UNIQUE NOT NULL,

	/* password */
	password            VARCHAR(300)                NOT NULL,

    /* isReserved, 确保本操作员账户为隐身账户, 不在操作员管理功能列表出现 */
    isReserved          BOOL                        NOT NULL DEFAULT FALSE,

    /* isMandatory, 为TRUE的账户不可以被修改权限 */
    isMandatory         BOOL                        NOT NULL DEFAULT FALSE,

    /* 是否必须修改密码 */
    mustChangePwd       BOOL                        NOT NULL DEFAULT FALSE,

    /* operator type */
    operatorType        ENUM("CUSTOMER", "CLIENT")  DEFAULT "CLIENT" NOT NULL,

	/* if operatorType == CUSTOMER, customerId, refer to id in table CustomerBasicInfo */
	customerId 			BIGINT 		                DEFAULT NULL,

	/* if operatorType==CLIENT, clientId refer to Client.id */
	clientId            BIGINT                      DEFAULT NULL,

    /* 是否管理员 */
    isAdmin             BOOL                        DEFAULT FALSE,

	/* 操作员编号 */
	operatorCode        VARCHAR(50)                 DEFAULT NULL,

	/* 操作员部门 */
	department       	VARCHAR(50)                 DEFAULT NULL,

	/* 启用标志 */
	enable				BOOL						 DEFAULT TRUE,

	/* 操作员姓名 */
	operatorName        VARCHAR(50)               DEFAULT NULL,

	/* 操作员权限描述，以json数组标示 */
	operatorRoles       VARCHAR(1024)             DEFAULT "[]" ,

	/* 操作员身份证号码 */
	citizenIdNum        VARCHAR(50)                 DEFAULT  NULL,

	/* 操作员手机号码 */
	mobileNum           VARCHAR(50)                 DEFAULT NULL,

	/* 操作员email */
	email               VARCHAR(100)                DEFAULT NULL,

	/* 授权药物类型 */
	authorizedDrugsType VARCHAR(100)                DEFAULT NULL,

	/* 授权委托书起始日期 */
	authorizedBeginDate DATE                        DEFAULT NULL,

	/* 授权委托书结束日期 */
	authorizedEndDate   DATE                        DEFAULT NULL,

	/* 上次成功登录IP地址 */
	lastSuccessIPAddr   VARCHAR(16)                 DEFAULT NULL,

	/* 上次成功登录时间 */
	lastSuccessAt       TIMESTAMP                   DEFAULT 0,

    /* 上次失败登录IP地址 */
    lastFailureIPAddr   VARCHAR(16)                 DEFAUlT NULL,

    /* 上次失败登录时间 */
    lastFailureAt       TIMESTAMP                   DEFAULT 0,

	/* 登录失败计数器 */
	failCount           INT                         DEFAULT 0,

	/* 更新时间 */
	updatedOn           TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdOn           TIMESTAMP                   DEFAULT CURRENT_TIMESTAMP
);


