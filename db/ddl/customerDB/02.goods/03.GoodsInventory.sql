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
 * Table: GoodsInventory
 * 说明：商品的库存信息
 *
 *
 **********************************************************************/

DROP TABLE IF EXISTS GoodsInventory;
CREATE TABLE GoodsInventory (
    /* id */
	id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

    /* goods id */
    goodsId            			BIGINT              UNIQUE NOT NULL,

    /* 商品批次信息,用于展示商品批次信息,例如: 一年以上 */
    goodsBatchTime              VARCHAR(50)         DEFAULT NULL,

    /* 可售库存数量 */
	amount                      INT                 DEFAULT 0,

    /* 锁定库存数量 */
	lockedAmount                INT                 DEFAULT 0,

    /* 实际库存数量 */
	actualAmount                INT                 DEFAULT 0,

    /* 库存显示方案Id refer to GoodsInventoryPlan.id */
    showPlanId                  INT                 DEFAULT 1,

    /* 上下架标志,新增的商品默认是下架标志 */
	onSell                      BOOLEAN             DEFAULT true,

    /* 是否可拆分 */
	isSplit                     BOOLEAN             DEFAULT false,

    /* 更新时间 */
	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* 创建时间 */
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);
