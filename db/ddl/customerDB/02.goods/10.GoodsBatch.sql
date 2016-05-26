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
 * Table: GoodsBatch
 * 说明：商品批次表
 *
 *
 **********************************************************************/

DROP TABLE IF EXISTS GoodsBatch;
CREATE TABLE GoodsBatch (
    /* id */
	id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

    /* goods id */
    goodsId            			BIGINT              NOT NULL,

    /*  批次号*/
    batchNum                VARCHAR(50)      NOT NULL,

    /*  批次检验报告URL 可上传图片URL*/
    inspectReportURL            VARCHAR(500)    DEFAULT NULL,


     /* 生产日期 */
    goodsProduceDate            DATE            DEFAULT NULL,


    /* 有效期 */
    goodsValidDate              DATE            DEFAULT NULL,

    /* 更新时间 */
	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* 创建时间 */
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

	UNIQUE KEY  (goodsId,batchNum)
);
