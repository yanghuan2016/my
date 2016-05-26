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
 * Table: GoodsInventoryPlan
 * 说明：商品的库存信息
 *
 *
 **********************************************************************/

DROP TABLE IF EXISTS GoodsInventoryPlan;
CREATE TABLE GoodsInventoryPlan (
    /* id  显示方案id 通过GoodsInventory 关联 */
	id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,


    /* 库存显示方案名 */
	name                        VARCHAR(50)        UNIQUE NOT NULL ,


    /*默认方案标志 */
	isDefault                   BOOLEAN             DEFAULT FALSE,

    /*默认方案标志 */
    isSystem                    BOOLEAN             DEFAULT FALSE,

    /* 更新时间 */
	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* 创建时间 */
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

DELIMITER //

DROP TRIGGER IF EXISTS deleteGoodsInventoryPlan;
CREATE TRIGGER deleteGoodsInventoryPlan AFTER DELETE ON GoodsInventoryPlan FOR EACH ROW
BEGIN
    DELETE FROM GoodsInventoryPlanDetails
    WHERE goodsInventoryPlanId = OLD.id;
END;
//
DELIMITER ;