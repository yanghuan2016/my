/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

DROP TABLE IF EXISTS BuyerShipDetails;

CREATE TABLE BuyerShipDetails (

    /* unique id */
	id                      BIGINT           AUTO_INCREMENT PRIMARY KEY,

	/* 发货单号: LSH=BuyerShipInfo.billNo */
	shipNo   			    VARCHAR(50)     NOT NULL,

	/* 发货详情号: DH */
	shipDetailNo  		    VARCHAR(50)     NOT NULL,

	/* 单据日期: KDRQ */
	shipDetailDate         VARCHAR(50)       	DEFAULT NULL,

    /* 商品编号: HH */
	buyerGoodsNo           VARCHAR(50)     NOT NULL,

    /* 平台编码 unicode */
    unicode                 VARCHAR(50)     DEFAULT NULL,

    /* 换算关系 */
    packageQty              decimal(18,4)   DEFAUlT 1,

	/* 含税价: SJ */
	taxPrice   			    decimal(18,4)   DEFAULT NULL,

    /* 批号: BATCHNO */
    batchNo                 VARCHAR(50)     DEFAULT NULL,

    /* 批次号: BATCHNUM */
    batchNum                VARCHAR(50)     DEFAULT NULL,

    /* 有效期: GOODSVALIDDATE*/
	goodsValidDate          VARCHAR(50)     NOT NULL,

    /* 生产日期: GOODSVALIDDATE */
	goodsProduceDate        VARCHAR(50)     NOT NULL,

    /* 数量 */
	quantity                decimal(18,4)     NOT NULL,

    /* 备注 */
	remark                  VARCHAR(50)     NOT NULL,

	/* 质检报告单: INSPECTREPORTURL*/
	inspectReportUrl   	    VARCHAR(512)  	 NOT NULL,

	/* 销售方式: TYBZ */
	salesType   			VARCHAR(50)    	 NOT NULL,

    /* 订单明细 guid: SBZ2 */
	orderDetailGuid        	VARCHAR(50)    	 NOT NULL,

	/* 更新时戳 */
	updatedOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时戳 */
	createdOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

