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
 * Table: ShipDetails
 * 说明：出货单详情
 * 
/**********************************************************************/

DROP TABLE IF EXISTS ShipDetails;
CREATE TABLE ShipDetails(
    /* id */
	id                          BIGINT          AUTO_INCREMENT PRIMARY KEY,

	/* guid for ERP.GUID */
	guid                        VARCHAR(50)     DEFAULT NULL,

	/* shipId */
    shipId                      BIGINT          NOT NULL,

    /* goodsId */
    goodsId                     BIGINT          NOT NULL,

   /* drugElectronicSupervisionCode 电子监管码 简写为drugESC*/
   drugESC                    VARCHAR(8192)   DEFAULT NULL,


    /* batchNum 批次号*/
    batchNum                  VARCHAR(50)     DEFAULT NULL,

    /* batchNo批号 ERP中标志商品用*/
    batchNo                   VARCHAR(50)     DEFAULT NULL,

    /* batchInspectionReportURL 批次检验报告URL 可上传图片URL*/
    inspectReportURL     VARCHAR(500)    DEFAULT NULL,


     /* 生产日期 */
    goodsProduceDate           DATE            DEFAULT NULL,


    /* 有效期 */
    goodsValidDate              DATE            DEFAULT NULL,

    /* detail no, ERP */
    detailNo                    DECIMAL(6,0) DEFAULT NULL  COMMENT '序号',

    /* 订单明细内码, ERP */
    orderBillOutDetailUid       VARCHAR(50) DEFAULT NULL  COMMENT '订单明细内码',

    /* 实际发货数量 可以不等于订单详情数量 */
    quantity                    DECIMAL(18,6)   DEFAULT 0,

    /**订单数量 发货时候 新增的商品 这个字段为0  */
    orderDetailQuantity         DECIMAL(18,6)   DEFAULT 0,

    /**下定单的时候的价格*/
    soldPrice                   DECIMAL(18,4)   NOT NULL,


	/* 小计 */
	amount                      DECIMAL(18,4)   NOT NULL,
    /* 发货数量合计 */
    shippedQuantitySum         DECIMAL(18,4)    DEFAULT 0,


    /* 实际收货数量 可以不等于实际发货数量 */
    receivedQuantity            DECIMAL(18,6)   DEFAULT 0,


   /* 实际收货客户录入电子监管码*/
    receivedDrugESC             TEXT   DEFAULT NULL,


    /* 实际拒收退货数量 可以不等于拒收申请数量（=实际发货数量-实际收货数量） */
    rejectedQuantity            DECIMAL(18,6)   DEFAULT 0,


    /* 拒收客户录入电子监管码*/
    rejectedDrugESC             TEXT   DEFAULT NULL,

    /* 发货详情备注 */
    remark 					    VARCHAR(200) 	DEFAULT NULL,

    /* 收货备注 */
    receivedRemark 			    VARCHAR(200) 	DEFAULT NULL,

    /* 拒收备注 实际收货数量不等于实际发货数量时不可为空*/
    rejectRemark 			    VARCHAR(200) 	DEFAULT NULL,

    updatedOn                   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    createdOn                   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY  (shipId,goodsId,batchNum)
);

/**********************************************
 * Triggers
 * 用来保证数据的完整性
 *********************************************/

DELIMITER //

/**
 * 新增记录时，触发新增GoodsBatch
 */
DROP TRIGGER IF EXISTS insertGoodsBatch;
CREATE TRIGGER insertGoodsBatch AFTER INSERT ON ShipDetails FOR EACH ROW
BEGIN
    INSERT INTO GoodsBatch (goodsId,batchNum,inspectReportURL,goodsProduceDate,goodsValidDate)
     VALUES (NEW.goodsId,NEW.batchNum,NEW.inspectReportURL,NEW.goodsProduceDate,NEW.goodsValidDate)
     ON DUPLICATE KEY UPDATE goodsId=VALUES(goodsId),batchNum=VALUES(batchNum),inspectReportURL=VALUES(inspectReportURL),
     goodsProduceDate=VALUES(goodsProduceDate),goodsValidDate=VALUES(goodsValidDate);
END;
/**
 * 更新记录时，触发更新GoodsBatch
 */
DROP TRIGGER IF EXISTS updateGoodsBatch;
CREATE TRIGGER updateGoodsBatch AFTER UPDATE ON ShipDetails FOR EACH ROW
BEGIN
    INSERT INTO GoodsBatch (goodsId,batchNum,inspectReportURL,goodsProduceDate,goodsValidDate)
        VALUES (NEW.goodsId,NEW.batchNum,NEW.inspectReportURL,NEW.goodsProduceDate,NEW.goodsValidDate)
        ON DUPLICATE KEY UPDATE goodsId=VALUES(goodsId),batchNum=VALUES(batchNum),inspectReportURL=VALUES(inspectReportURL),
        goodsProduceDate=VALUES(goodsProduceDate),goodsValidDate=VALUES(goodsValidDate);
END;

//
DELIMITER ;
