/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * Table: 月度结算表
 */

DROP TABLE IF EXISTS ClearDetails;
CREATE TABLE ClearDetails(
    /* id */
    id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

    /**
     * 客户id
     * @see Client.id
     */
    clientId                    BIGINT              NOT NULL,

    /**
     * 月结单id, @see StatementMonthly.id
     * 仅对月结客户生效
     */
    statementMonthlyId          BIGINT              DEFAULT NULL,

    /*结款人的Id*/
    operatorId                  BIGINT              DEFAULT NULL,

    /**
     * 订单结款单id, @see StatementDetails.id
     * 仅对COD客户生效
     */
    statementDetailsId          BIGINT              DEFAULT NULL,

    /**
     * 结款时间、金额、备注
     */
    clearTime                   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clearAmount                 DECIMAL(16,6)       NOT NULL,
    clearRemark                 TEXT,

    /* 时间戳 */
	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);