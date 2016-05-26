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
 * Table: ClientCategory
 * 说明：客户类别表
 */
DROP TABLE IF EXISTS ClientCategory;
CREATE TABLE ClientCategory (

    /* unique id */
	id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,

	/* erpCode, refer to ERP */
	erpCode                VARCHAR(30)     DEFAULT NULL UNIQUE,

    /* 类别名称 */
	categoryName        VARCHAR(80)     NOT NULL ,

    /* from ERP  本分类上级id 目前scc未使用该功能*/
    ParentGUID          VARCHAR(30)     DEFAULT "",

    /* from erp 速记码 */
    HelpCode            VARCHAR(50)     DEFAULT "",

	/* 类别折扣 */
	categoryDiscount    DECIMAL(10,2)   DEFAULT '1.00',

	/* 基础必备标识, SCC暂时无用 */
	isBase              BOOL            DEFAULT FALSE,

	/* 删除标志 */
	isDeleted           BOOL            NOT NULL DEFAULT FALSE,

	/* 更新时戳 */
	updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时戳 */
	createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

