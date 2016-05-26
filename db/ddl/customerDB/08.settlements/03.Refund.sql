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
 * Table: 退款单
 */

DROP TABLE IF EXISTS Refund;
CREATE TABLE Refund(
    /* id */
    id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

    displayRefundId             VARCHAR(32)         DEFAULT NULL,

    /**
     * 客户id
     * @see Client.id
     */
    clientId                    BIGINT              NOT NULL,

    /**
     * paymentType
     * @see OrderInfo.paymentType
     * 支付方式
     */
    paymentType                 ENUM("ONLINE",
                                     "CREDIT",
                                     "COD"
                                     )              NOT NULL,

    /* 退款原因 */
    refundReason                ENUM(
                                     "ORDER_CLOSED",            /* 商户关闭订单*/
                                     "ORDER_CANCEL",            /* 客户取消订单 */
                                     "ORDER_NOT_APPROVE",       /* 订单未通过审核 */
                                     "GOODS_NOT_ENOUGH",        /* 发货不足量 */
                                     "GOODS_WHOLE_REJECTED",    /* 整单被拒收 */
                                     "RETURN_RECEIVED"          /* 退货已确认入库 */
                                     )              NOT NULL,

    /* 退款类型 */
    refundType                  ENUM("REDFLUSH",                /* 红冲 */
                                     "REFUND"                   /* 退款 */
                                     )              NOT NULL,

    /* 退款途径, 退款执行方式 */
    refundChannel               ENUM("REDFLUSH",                /* 红冲，无须执行退款 */
                                     "CASHBALANCE",             /* 退款到现金余额, 无须执行退款 */
                                     "ONLINE"                   /* 原支付通道退款 */
                                     )              DEFAULT NULL,

    /* 订单号 */
    orderId                     BIGINT              NOT NULL,
    displayOrderId              VARCHAR(32)         NOT NULL,

    /* 发货单号 */
    shipId                      BIGINT              DEFAULT NULL,
    displayShipId               VARCHAR(32)         DEFAULT NULL,

    /* 退货单号 */
    returnId                    BIGINT              DEFAULT NULL,
    displayReturnId             VARCHAR(32)         DEFAULT NULL,

    /* 退款金额 */
    refundAmount                DECIMAL(16,6)       NOT NULL,
    /* 客服确认后的退款金额 */
    verifiedAmount              DECIMAL(16,6)       DEFAULT NULL,

    /* 审核状态 */
    refundStatus                ENUM("CREATED",                 /* 新增退款单 */
                                     "VERIFIED",                /* 客服已确认 */
                                     "APPROVED",                /* 财务已审核 */
                                     "EXECUTED",                /* 退款出纳已执行 */
                                     "SUCCESS",                 /* 退款已执行成功 */
                                     "FAILED"                   /* 退款执行失败 */
                                )                   DEFAULT "CREATED",

    /* 客服确认人ID,姓名，时间 */
    verifierOperatorId          BIGINT              DEFAULT NULL,
    verifierName                VARCHAR(64)         DEFAULT NULL,
    verifiedTime                TIMESTAMP           DEFAULT 0,
    verificationComment         TEXT                DEFAULT NULL,


    /* 财务审核人ID,姓名，时间 */
    approverOperatorId          BIGINT              DEFAULT NULL,
    approverName                VARCHAR(64)         DEFAULT NULL,
    approveTime                 TIMESTAMP           DEFAULT 0,
    approveComment              TEXT                DEFAULT NULL,

    /* 支付网关id */
    refundGatewayId             BIGINT              DEFAULT NULL,

    /* 支付流水号 */
    payWaterbillNo              VARCHAR(64)         DEFAULT NULL,

    /* 退款执行记录id, @see RefundExecution.id */
    refundExecutionId           BIGINT              DEFAULT NULL,

    /**
     * Timestamps
     */
	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS RefundExecution;
CREATE TABLE RefundExecution (
    /* id */
    id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,
    displayRefExecId            VARCHAR(32)         DEFAULT NULL,

    /* 退款单id，refundId, @see Refund.id */
    refundId                    BIGINT              NOT NULL,

    /* 退款执行时间 */
    executionTime               TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,

    /* 退款执行人id */
    executedBy                  BIGINT,

    /* 退款流水单号 */
    waterbillNo                 VARCHAR(64),

    /* 退款执行状态 */
    executionStatus             ENUM("SUCCESS",                 /* 退款执行成功 */
                                     "FAILED"                   /* 退款执行失败 */
                                )                   NOT NULL,

    /* 失败原因 */
    failReason                  TEXT,

     /**
      * Timestamps
      */
    updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);




/* Trigger */

DROP TABLE IF EXISTS LOG;
CREATE TABLE LOG(
    message                     TEXT,
    timestamp                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

DELIMITER  //

-- 订单相关状态生成财务记录
DROP TRIGGER IF EXISTS updateStatementOnOrderChanged;
CREATE TRIGGER updateStatementOnOrderChanged AFTER UPDATE ON OrderInfo FOR EACH ROW
BEGIN

    DECLARE shipAmount DECIMAL(16,6);
    DECLARE orderAmount DECIMAL(16,6);
    DECLARE refundAmount DECIMAL(16,6);
    DECLARE shipId BIGINT;
    DECLARE displayShipId VARCHAR(32);
    DECLARE refundType VARCHAR(32);
    DECLARE refundChannel VARCHAR(32);

    -- 在线支付交易完成支付，生成预收财务记录
    IF NEW.status = "CREATED" AND NEW.paymentType="ONLINE" AND OLD.paymentStatus="UNPAID" AND NEW.paymentStatus="PAID" THEN
        INSERT INTO StatementDetails (clientId, orderId, displayOrderId, paymentType,billType, amount,
                                      docType, docId, displayDocId,  creditBalance, cashBalance)
        VALUES (OLD.clientId, NEW.id, NEW.displayOrderId, NEW.paymentType,"BILL_PREPAY", NEW.total,
                "ORDER", NEW.id, NEW.displayOrderId, 0, 0);

    -- 审核通过，为授信交易生成应收财务记录  COD交易在发货的时候产生交易明细
    ELSEIF NEW.status = "APPROVED" AND OLD.status <> "APPROVED" AND NEW.paymentType <> "ONLINE" AND NEW.paymentType <> "COD" AND  NEW.paymentStatus = "PAID" THEN
       INSERT INTO StatementDetails(clientId, orderId, displayOrderId, paymentType, billType, amount,
                                    docType, docId, displayDocId, creditBalance, cashBalance)
       VALUES( OLD.clientId, NEW.id, NEW.displayOrderId, OLD.paymentType, "BILL_RECEIVABLE", NEW.total,
               "ORDER", NEW.id, NEW.displayOrderId, 0, 0);

    -- 审核未通过，生成退款单
    ELSEIF NEW.status = "CLOSED" AND OLD.status = "CREATED" AND NEW.paymentType = "ONLINE" AND NEW.paymentStatus = "PAID" THEN
       INSERT INTO Refund(clientId, paymentType, refundReason, refundType, refundChannel, orderId, displayOrderId, refundAmount)
       VALUES(OLD.clientId, OLD.paymentType, "ORDER_NOT_APPROVE", "REFUND", "ORIGIN_PAYMENT", NEW.id, NEW.displayOrderId, NEW.total);

    -- 审核后订单被关闭
    ELSEIF NEW.status="CLOSED" AND OLD.status="APPROVED" AND  NEW.paymentType <> "COD"  THEN
        IF NEW.paymentType="ONLINE" THEN
            -- 现金交易的关闭订单，生成退款单
            SET refundType = "REFUND";
            SET refundChannel = "ONLINE";
            INSERT INTO Refund(clientId, paymentType, refundReason, refundType, refundChannel,
                               orderId, displayOrderId, refundAmount)
            VALUES(OLD.clientId, OLD.paymentType, "ORDER_CLOSED", refundType, refundChannel,
                                OLD.id, OLD.displayOrderId, OLD.total);
        ELSE
            -- 授信交易的关闭订单，直接生成红冲流水，不需要退款审核流程
            SET refundType = "REDFLUSH";
            SET refundChannel = "REDFLUSH";
            INSERT INTO StatementDetails(clientId, orderId, displayOrderId, paymentType, billType,
                                amount, docType, docId, displayDocId)
            VALUES(OLD.clientId, OLD.Id, OLD.displayOrderId, OLD.paymentType, "BILL_REDFLUSH",
                                OLD.total, "ORDER", OLD.id, OLD.id);
        END IF;


    -- 不足量发货时生成退款单 货到付款 不产生红冲退款这一项,增加判定条件付款方式不等于COD
    ELSEIF OLD.status<>"SHIPPED" AND NEW.status="SHIPPED" THEN
        SELECT ShipInfo.id, ShipInfo.displayShipId INTO shipId, displayShipId FROM ShipInfo WHERE orderId=OLD.id;
        SELECT SUM(amount) INTO shipAmount FROM ShipDetails WHERE ShipDetails.shipId=shipId;
        SET refundAmount = OLD.total - shipAmount;

        IF refundAmount > 0 AND OLD.paymentType<>"COD"  THEN
            IF NEW.paymentType="ONLINE" THEN
                SET refundType = "REFUND";
                SET refundChannel = "ONLINE";
            ELSE
                SET refundType = "REDFLUSH";
                SET refundChannel = "REDFLUSH";
            END IF;
            insert into Refund(clientId, paymentType, refundReason, refundType, orderId, displayOrderId, refundAmount, shipId, displayShipId)
                 values(OLD.clientId, OLD.paymentType, "goods_not_enough", refundType, OLD.id, OLD.displayOrderId, refundAmount, shipId, displayShipId);
        end IF;

        IF OLD.paymentType="COD" THEN
            insert into StatementDetails(clientId,orderId,displayOrderId,paymentType,billType,
                        amount,docType,docId,displayDocId)
            VALUES(OLD.clientId,OLD.id,OLD.displayOrderId,OLD.paymentType,"BILL_RECEIVABLE",
                       shipAmount,"SHIP",shipId,shipId);
        end IF;


    end IF;
end;

-- 为退货入库商品生成退款单
DROP TRIGGER IF EXISTS generateRefundOnReturnReceive;
CREATE TRIGGER generateRefundOnReturnReceive AFTER UPDATE ON ReturnInfo FOR EACH ROW
BEGIN
    DECLARE amount DECIMAL(16,6);
    -- 变量名称与字段名称相同时，SP是不能区分的，也不会报错
    DECLARE clientId BIGINT;
    DECLARE displayOrderId VARCHAR(64);
    DECLARE refundType VARCHAR(32);
    DECLARE refundChannel VARCHAR(32);
    DECLARE paymentType VARCHAR(32);

    -- 仅对退货收货检查
    IF NEW.status = "DELIVERED" AND OLD.status <> "DELIVERED" THEN
        -- 计算退货金额
        SELECT SUM(receiveShippedQuantity*price) INTO amount FROM ReturnInfo_Goods_Map WHERE returnId=NEW.id GROUP BY returnId;
        -- 读取显示订单id和支付方式
        SELECT OrderInfo.clientId,OrderInfo.displayOrderId,OrderInfo.paymentType INTO clientId,displayOrderId,paymentType FROM OrderInfo WHERE OrderInfo.id=NEW.orderId;

        IF paymentType="ONLINE" THEN
            SET refundType = "REFUND";
            SET refundChannel = "ONLINE";
        ELSEIF paymentType="COD" THEN
            SET refundType = "REFUND";
            SET refundChannel = "CASHBALANCE";
        ELSEIF paymentType="CREDIT" THEN
             SET refundType = "REDFLUSH";
             SET refundChannel = "REDFLUSH";
        END IF;

        -- 生成退款单
        INSERT INTO Refund(clientId, paymentType, refundReason, refundType, orderId, displayOrderId, refundAmount, returnId, displayReturnId)
             VALUES (clientId, paymentType, "RETURN_RECEIVED", refundType, OLD.orderId, displayOrderId, amount, OLD.id, OLD.displayReturnId);
    END IF;
END;

-- 财务审核通过的退款单生成结算明细 红冲退款不会从 VERIFIED状态 到 APPROVED状态
DROP TRIGGER IF EXISTS refundStatementDetail;
CREATE TRIGGER refundStatementDetail AFTER UPDATE ON Refund FOR EACH ROW
BEGIN
    IF OLD.refundStatus<>"EXECUTED" AND NEW.refundStatus="EXECUTED" AND NEW.refundType="REFUND" THEN
        INSERT INTO StatementDetails(clientId, orderId, displayOrderId, paymentType, billType,
                    amount, docType, docId, displayDocId)
             VALUES(NEW.clientId, NEW.orderId, NEW.displayOrderId, OLD.paymentType, "BILL_REFUND",
                    NEW.verifiedAmount, "REFUND", NEW.id, NEW.id);
    ELSEIF OLD.refundStatus<>"SUCCESS" AND NEW.refundStatus="SUCCESS" AND NEW.refundType="REFUND" THEN
        INSERT INTO StatementDetails(clientId, orderId, displayOrderId, paymentType, billType,
                    amount, docType, docId, displayDocId)
             VALUES(NEW.clientId, NEW.orderId, NEW.displayOrderId, OLD.paymentType, "BILL_REFUND",
                    NEW.verifiedAmount, "REFUND", NEW.id, NEW.id);
    ELSEIF OLD.refundStatus<>"APPROVED" AND NEW.refundStatus="APPROVED" AND NEW.refundType="REDFLUSH" THEN
        INSERT INTO StatementDetails(clientId, orderId, displayOrderId, paymentType, billType,
                    amount, docType, docId, displayDocId)
             VALUES(NEW.clientId, NEW.orderId, NEW.displayOrderId, OLD.paymentType, "BILL_REDFLUSH",
                    NEW.verifiedAmount, "REDFLUSH", NEW.id, NEW.id);
    ELSEIF OLD.refundStatus<>"SUCCESS" AND NEW.refundStatus="SUCCESS" AND NEW.refundType="REDFLUSH" THEN
        INSERT INTO StatementDetails(clientId, orderId, displayOrderId, paymentType, billType,
                    amount, docType, docId, displayDocId)
             VALUES(NEW.clientId, NEW.orderId, NEW.displayOrderId, OLD.paymentType, "BILL_REDFLUSH",
                    NEW.verifiedAmount, "REDFLUSH", NEW.id, NEW.id);
    END IF;
END;

//
DELIMITER ;