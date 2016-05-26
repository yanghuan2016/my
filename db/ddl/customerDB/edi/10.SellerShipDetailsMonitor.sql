/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

DROP TABLE IF EXISTS SellerShipDetailsMonitor;

CREATE TABLE SellerShipDetailsMonitor(
    /* unique id */
	id                      BIGINT           AUTO_INCREMENT PRIMARY KEY,

    /* 电子监管码 id */
    drugESC                 VARCHAR(128)     NOT NULL,

    /* 发货详情号: ysdh = SellerShipDetails.shipDetailNo */
    shipDetailNo            VARCHAR(50)      NOT NULL,

    /* 包装规格: bzgg */
    packingSpec             VARCHAR(50)      DEFAULT NULL,

    /* ? */
    ftype                   VARCHAR(50)      DEFAULT NULL
);
