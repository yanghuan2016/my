/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

DROP TABLE IF EXISTS SellerReturnInfo;

CREATE TABLE SellerReturnInfo(
    /* id */
	guid                        VARCHAR(50)         PRIMARY KEY,

    /* 流水号 */
    billNo                      VARCHAR(50)         NOT NULL,

	/* 单据日期 */
	billDate                    DATETIME            NOT NULL,

	/* 客户编号:CustomerCode */
	buyerCode                   VARCHAR(50)         NOT NULL,

	/* 退回原因 */
	returnReason                VARCHAR(250)        DEFAULT NULL,

    /* 入库方式 */
    stockType                   VARCHAR(50)         DEFAULT NULL,

    /* 销售方式 */
    saleType                   VARCHAR(50)         DEFAULT NULL,

    /* 备注 */
    Remark                      VARCHAR(250)        DEFAULT NULL,

    /* 更新时间 */
	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/**申请退货的时间*/
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);
