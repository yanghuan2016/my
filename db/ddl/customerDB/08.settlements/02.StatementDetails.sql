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
 * Table: 结款结算表
 */

DROP TABLE IF EXISTS StatementDetails;
CREATE TABLE StatementDetails(
    /* id */
    id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

    /**
     * 客户id
     * @see Client.id
     */
    clientId                    BIGINT              NOT NULL,

    /**
     * 记账日期
     */
    transDate                   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,

    /**
     * 订单id
     */
    orderId                     BIGINT              NOT NULL,
    displayOrderId              VARCHAR(32)         NOT NULL,
    paymentType                 ENUM("ONLINE",
                                     "CREDIT",
                                     "COD"
                                     )              NOT NULL,

    /**
     * 记账类型
     */
    billType                    ENUM("BILL_RECEIVABLE",         /* 应收款 */
                                     "BILL_REDFLUSH",           /* 红冲 */
                                     "BILL_PREPAY",             /* 预收款 */
                                     "BILL_REFUND",             /* 退款 */
                                     "BILL_CLEAR",              /* 结款 */
                                     "BILL_SHIP"                /* 发货款 */
                                )                   NOT NULL,
    /**
     * 金额
     */
    amount                      DECIMAL(16,6)       NOT NULL,

    /**
     * 单据类型
     * 单据ID, 比如orderId, paymentId, returnId
     */
    docType                     ENUM("ORDER",
                                     "SHIP",
                                     "RETURN",
                                     "REFUND",
                                     "CLEAR")       NOT NULL,
    docId                       BIGINT              NOT NULL,
    displayDocId                VARCHAR(32)         NOT NULL,

    /**
     * 授信余额
     */
    creditBalance               DECIMAL(16,6)       NOT NULL DEFAULT 0,

    /**
     * 现金余额
     */
    cashBalance                 DECIMAL(16,6)       NOT NULL DEFAULT 0,

    /**
     * Timestamps
     */
	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

	KEY                         (clientId, orderId, docType, docId)
);

/**********************************************
 * Triggers
 * 用来保证数据的完整性
 *********************************************/

DELIMITER //

DROP FUNCTION IF EXISTS GetBillDate;
CREATE FUNCTION GetBillDate()
    RETURNS DATE
BEGIN
    DECLARE billDay INT;
    DECLARE yyyy INT;
    DECLARE mm INT;
    DECLARE dd INT;
    DECLARE billDate CHAR(10);

    -- 读取当前日期
    SET yyyy = DATE_FORMAT(NOW(),"%Y");
    SET mm = DATE_FORMAT(NOW(),"%m");
    SET dd = DATE_FORMAT(NOW(),"%d");

    -- 读取结账日
    SELECT aValue INTO billDay FROM KVList WHERE aKey="checkOutDays";

    -- 判断是否在结账日前, 否则计入下月
    IF dd > billDay THEN
        SET mm = mm + 1;
        IF mm > 12 THEN
            SET yyyy = yyyy + 1;
        END IF;
    END IF;
    SET dd = billDay;

    SET billDate = CONCAT(LPAD(yyyy,4,0), "-", LPAD(mm,2,0), "-", LPAD(dd,2,0));
    RETURN billDate;
END;

-- 按照明细记录汇总更新授信客户的月结单StatementMonthly
DROP TRIGGER IF EXISTS updateStatementMonthly;
CREATE TRIGGER updateStatementMonthly AFTER INSERT ON StatementDetails FOR EACH ROW
BEGIN
    DECLARE billDate CHAR(10);
    DECLARE currentClientId BIGINT;
    SELECT GetBillDate() INTO billDate;
    SET currentClientId=NEW.ClientId;
    IF NEW.paymentType = "CREDIT" THEN
        IF NEW.billType = "BILL_RECEIVABLE" THEN
            INSERT INTO StatementMonthly(clientId, billMonth, status, receivableAmount, receivableCount)
                 VALUES (NEW.clientId, billDate, "PENDING", NEW.amount, 1)
            ON DUPLICATE KEY UPDATE receivableAmount=receivableAmount+NEW.amount, receivableCount=receivableCount+1;
        ELSEIF NEW.billType = "BILL_REDFLUSH" THEN
            INSERT INTO StatementMonthly(clientId, billMonth, status, redflushAmount, redflushCount)
                 VALUES (NEW.clientId, billDate, "PENDING", NEW.amount, 1)
            ON DUPLICATE KEY UPDATE redflushAmount=redflushAmount+NEW.amount, redflushCount=redflushCount+1;
        END IF;
    END IF;
END;

//
DELIMITER ;

