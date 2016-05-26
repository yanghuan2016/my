/*****************************************************************
 * 青岛雨人软件有限公司@2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 * 保存的EDI统计数据
 */
DROP TABLE IF EXISTS EDIDataCount;
CREATE TABLE EDIDataCount(
    /* id */
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,

    /* 对象类型 */
    objectSide          ENUM('BUYER',					/* 采购方*/
                             'SELLER',				    /* 供应方*/
                             'BOTH')	DEFAULT 'BOTH',	/* 不区分 */
    
    /* 对象类型 */
    objectType          ENUM('ORDER',					/* 订单*/
                             'SHIP',				    /* 发货单 */
                             'RETURN',					/*  退货单*/
                             'INQUIRY',					/* 询价单 */
                             'LOGIN')	DEFAULT 'ORDER',	/* 登录信息 */
    /* 对象ID */
    objectID           VARCHAR(200)     DEFAULT NULL,

    /* 对象日期记录 */
    objectDate         TIMESTAMP        DEFAULT "0000-00-00 00:00:00",


    /* 对象统计金额 */
    objectAmount       DECIMAL(18,4)    DEFAULT NULL,


    /* 生成时间 */
    createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

