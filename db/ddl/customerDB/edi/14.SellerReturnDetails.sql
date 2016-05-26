/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

DROP TABLE IF EXISTS SellerReturnDetails;

CREATE TABLE SellerReturnDetails(
	/* guid */
	guid                        VARCHAR(50)         PRIMARY KEY,

	/* 序号 */
	detailNo                    VARCHAR(50)         DEFAULT NULL,

	/* 主表Guid: MainGuid */
	BuyerReturnGuid             VARCHAR(50)         NOT NULL,

	/* 商品货号; materielcode */
    goodsNo                     VARCHAR(50)         NOT NULL,

    /* 平台编码 unicode */
    unicode                 VARCHAR(50)             DEFAULT NULL,

    /* 换算关系 */
    packageQty              decimal(18,4)           DEFAUlT 1,

	/* 批号: batchno */
	batchNo                     VARCHAR(50)         DEFAULT NULL,

	/* 批次号: Batchnumber */
	batchNum                    VARCHAR(50)         DEFAULT NULL,

    /* 批次效期: UsefulDate */
    goodsValidDate              DATETIME            DEFAULT NULL,

	/* 申请数量 */
    quantity                    DECIMAL(18,6)       NOT NULL,

	/* 含税单价: Taxunitprice */
	taxPrice                    DECIMAL(18,6)       DEFAULT NULL,

    /* 无税单价: Unitprice */
    price                       DECIMAL(18,6)       DEFAULT NULL,

    /* 金额: Amount */
    goodsSubtotal               DECIMAL(18,6)       DEFAULT NULL,

    /* 税额: Taxamount */
    taxSubtotal                 DECIMAL(18,6)       DEFAULT NULL,

    /* 价税合计: Amounttax */
    subtotal                    DECIMAL(18,6)       DEFAULT NULL,

     /* 备注 */
    Remark                      VARCHAR(250)        DEFAULT NULL,

	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);
