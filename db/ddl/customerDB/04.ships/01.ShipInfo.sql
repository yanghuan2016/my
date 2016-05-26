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
 * Table: ShipInfo
 * 说明：出货单基本信息
 * 
 **********************************************************************/

DROP TABLE IF EXISTS ShipInfo;
CREATE TABLE ShipInfo (

	id                          BIGINT          AUTO_INCREMENT PRIMARY KEY,

    /* 显示id */
    displayShipId               VARCHAR(32)     DEFAULT NULL,

    /* GUID from ERP */
	guid                        VARCHAR(50)     DEFAULT NULL,

    /* 出库编号, ERP.BILLOUTERNO */
    billNo                      VARCHAR(50)     DEFAULT NULL,

    /* 出库时间, ERP.BILLOUTDATETIME */
    shipTime                    DATETIME        DEFAULT CURRENT_TIMESTAMP,

    /* 订单id */
    orderId                     BIGINT          NOT NULL,

    /* 订单内码 ERP */
    orderBill_id VARCHAR(50)   DEFAULT NULL  COMMENT '订单内码',

    /* 出库描述 */
    shipDescription             VARCHAR(200)    DEFAULT NULL  COMMENT '订单出库描述',

    /* 发货标志，ERP.ISSENDOUT */
    isShipped                   BOOL            DEFAULT FALSE,

    /* 发货人operator id, 如有 */
    senderId                    BIGINT          DEFAULT NULL,

    /* 发货人内码 ERP.SENDERUID */
    senderUid                   VARCHAR(50)     DEFAULT NULL,

    /* 发货人 */
    senderName                  VARCHAR(50)     DEFAULT NULL,

	/* client id, 客户id */
	clientId				BIGINT			NOT NULL,

    /* 发货日期, ERP.SENDEDDATE */
    shipDate                    DATETIME        DEFAULT CURRENT_TIMESTAMP,

    /* 物流公司内码 ERP.LOGISTICSGUID */
    logisticsId                 VARCHAR(50)     DEFAULT NULL,

    /* 物流单编号 */
    logisticsNo                 VARCHAR(50)     NOT NULL,

    /* 确认收货标志 */
    isReceived                  BOOL            DEFAULT FALSE,

    /*自动收货时间*/
    autoSwitchToReceivedDate        DATETIME            NOT NULL,

    /*是否允许收货延期,默认不允许延期*/
    enableDelayReceived         BOOL            DEFAULT FALSE,

    /* 发货单状态标志 */
  	status                      ENUM("CREATED",  /* 创建发货单 发货 */
  		                             "DELIVERED",/* 发货单完成 实收等于实发 isReceived=true */
  	                                 "REJECT-REQUEST", /* 拒收申请 实收小于实发 */
  	                                 "REJECT-APPROVE"  /* 拒收确认 确认拒收数量isReceived=true */
  	                                 )      DEFAULT "CREATED",

    /* 收货人operatorId， 如有 */
    receiverId                  BIGINT          DEFAULT NULL,

    /* 收货人内码 */
    receiverUid                 VARCHAR(50)     DEFAULT NULL,

    /* 收货人姓名 */
    receiverName                VARCHAR(50)     DEFAULT NULL,

    /* 收货日期 */
    receivedDate                DATETIME        DEFAULT NULL,

    /* 收货描述 */
    receiveRemark               VARCHAR(200)    DEFAULT NULL,

    /* 发货备注 */
	remark 					    VARCHAR(200) 	DEFAULT NULL,

    /* 更新时间 */
    updatedOn                   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* 创建时间 */
    createdOn                   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
