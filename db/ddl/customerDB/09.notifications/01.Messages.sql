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
 * Table: 消息
 */
DROP TABLE IF EXISTS Messages;
CREATE TABLE Messages(
    /* id */
    id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

    toClientId                  BIGINT              DEFAULT NULL,

    /* 接收人操作员id */
    toOperatorId                BIGINT              DEFAULT NULL,

    /*
     * 广播给拥有权限的操作员, 仅在toOperatorId为null时有效
     * "[FP_PRICE_APPROVE, FP_PRICE_VIEW]"
     */
    toFeature                   VARCHAR(256)        DEFAULT NULL,

    /* 消息体 */
    messageBody                 VARCHAR(256)        DEFAULT NULL,

    /* 消息状态 */
    status                      ENUM("UNREAD",      /* 未读 */
                                     "READ"         /* 已读 */
                                )                   NOT NULL DEFAULT "UNREAD",

    /* 相关单据类型 */
    docType                     ENUM("DOC_ORDER",   /* 订单相关的通知 */
                                     "DOC_SHIP",    /* 发货单相关通知 */
                                     "DOC_RETURN",  /* 退货相关通知 */
                                     "DOC_REFUND",  /* 退款相关通知 */
                                     "DOC_COMPLAIN",/* 投诉建议相关通知 */
                                     "DOC_ACCOUNT", /* 证照客户资料相关通知 */
                                     "DOC_PRICE",   /* 调价单相关通知 */
                                     "DOC_OTHER"    /* 其他客户通知 */
                                     )              NOT NULL,

    /* 相关单据id、显示id */
    docId                       BIGINT              DEFAULT NULL,
    displayDocId                VARCHAR(32)         DEFAULT NULL,

    /* 发送时间 */
    sentTime                    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,

    /* 读取时间 */
    firstReadTime               TIMESTAMP           DEFAULT 0,

    /* 首位阅读者操作员id */
    firstReadBy                 BIGINT              DEFAULT NULL,

    UNIQUE KEY                  (toClientId, toOperatorId, toFeature(100), docType, docId, sentTime)
);

