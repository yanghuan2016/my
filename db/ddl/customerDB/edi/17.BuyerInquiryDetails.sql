/*****************************************************************
 * 青岛雨人软件有限公司?2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 * 采购方保存的询价明细
 */
DROP TABLE IF EXISTS BuyerInquiryDetails;
CREATE TABLE BuyerInquiryDetails(
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    inquiryId           BIGINT          NOT NULL,
    unicode             VARCHAR(50)     DEFAULT NULL,/* 平台编码 unicode */
    packageQty          decimal(18,4)   DEFAUlT 1, /* buyer的换算关系 */
    billNo              VARCHAR(50)     DEFAULT NULL,/* ERP BILLNO */
    licenseNo           VARCHAR(100)    DEFAULT "",
    objectId            BIGINT          NOT NULL,  /* sellerId */
    inquiryExpire       TIMESTAMP       DEFAULT "0000-00-00 00:00:00",
    inquiryQuantity     DECIMAL(18,4)   NOT NULL,
    purchaseUpset       DECIMAL(18,4)   DEFAULT NULL,
    lastErpPrice        DECIMAL(18,4)   DEFAULT NULL,
    quotationPrice      DECIMAL(18,4)   DEFAULT NULL,
    quotationQuantity   DECIMAL(18,4)   NOT NULL DEFAULT 0,
    quotationExpire     TIMESTAMP       DEFAULT "0000-00-00 00:00:00",
    clearingPeriod      VARCHAR(50)     DEFAULT NULL,
    createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY(inquiryId, unicode, objectId)
);

