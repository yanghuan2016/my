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

DROP TABLE IF EXISTS StatementMonthly;
CREATE TABLE StatementMonthly(
    /* id */
    id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

    /**
     * 客户id
     * @see Client.id
     */
    clientId                    BIGINT              NOT NULL,

    /**
     * 结账日期, 以月为准, 如：2016－03
     */
    billMonth                   DATE                NOT NULL,

    originAmount                DECIMAL(16,6)       NOT NULL DEFAULT 0,

    ultimateAmount              DECIMAL(16,6)       NOT NULL DEFAULT 0,

    status                  ENUM("PENDING",             /* 未出账单*/
                                 "UNCLEARED",           /* 未结清 */
                                 "CLEARED"              /* 已结清 */
                                 )                  NOT NULL DEFAULT "UNCLEARED",

    /*是否出账 默认为0  待每月25号  离线任务 更新为1 */
    isChargeOff            BOOL                    NOT NULL DEFAULT 0,
    /**
     * 订单金额、笔数
     */
    orderAmount                 DECIMAL(16,6)       NOT NULL DEFAULT 0,
    orderCount                  INT                 NOT NULL DEFAULT 1,

    /**
     * 出库金额、笔数
     */
    shipAmount                  DECIMAL(16,6)       NOT NULL DEFAULT 0,
    shipCount                   INT                 NOT NULL DEFAULT 0,

    /**
     * 应收金额、笔数
     * 包括授信交易和货到付款交易
     */
    receivableAmount            DECIMAL(16,6)       NOT NULL DEFAULT 0,
    receivableCount             INT                 NOT NULL DEFAULT 0,

    /**
     * 预付金额、笔数
     */
    prepayAmount                DECIMAL(16,6)       NOT NULL DEFAULT 0,
    prepayCount                 INT                 NOT NULL DEFAULT 0,

    /**
     * 红冲金额、笔数
     */
    redflushAmount              DECIMAL(16,6)       NOT NULL DEFAULT 0,
    redflushCount               INT                 NOT NULL DEFAULT 0,

    /**
     * 退款金额、笔数
     */
    refundAmount                DECIMAL(16,6)       NOT NULL DEFAULT 0,
    refundCount                 INT                 NOT NULL DEFAULT 0,

    /**
     * 结款金额、笔数
     */
    clearAmount                 DECIMAl(16,6)       NOT NULL DEFAULT 0,
    clearCount                  INT                 NOT NULL DEFAULT 0,

	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY                  (clientId, billMonth)

);
