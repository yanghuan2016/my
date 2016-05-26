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
 * Table: ClientGoodsPrice.sql
 * 说明：客户产品价格表,每个用户对每一个商品的价格
 */

DROP TABLE IF EXISTS ClientGoodsPrice;
CREATE TABLE ClientGoodsPrice (

    /* id */
    id                      BIGINT                  AUTO_INCREMENT PRIMARY KEY,

    /* client id */
    clientId                BIGINT                  NOT NULL,

    /* goods id */
    goodsId                 BIGINT                  NOT NULL,

    /* price plan
     * WHOLESALEPRICE- 批发价
     * PRICE1   - 价格一
     * PRICE2   - 价格二
     * PRICE3   - 价格三
     * CATEGORYPRICE - 客户类价格
     * CLIENTPRICE - 客户价格
     */
    pricePlan               ENUM("refRetailPrice",
                                 "wholesalePrice",
                                 "price1",
                                 "price2",
                                 "price3",
                                 "categoryPrice",
                                 "clientPrice")     NOT NULL DEFAULT "refRetailPrice",

    /* price */
    price                   DECIMAL(18,4)           DEFAULT 0,

    /* updatedOn */
    updatedOn               TIMESTAMP               DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* createdOn */
    createdOn               TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY  (clientId,goodsId)
);