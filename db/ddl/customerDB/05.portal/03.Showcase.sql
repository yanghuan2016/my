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
 * Table: 橱窗的显示
 */

DROP TABLE IF EXISTS ShopWindow;
CREATE TABLE ShopWindow(
        /* id */
        id              BIGINT          AUTO_INCREMENT  PRIMARY KEY,

        /* 橱窗标题：西药，中药，。。。*/
        title           VARCHAR(40)     NOT NULL,

        /* 排列顺序，从小到大 */
        orderSeq        INT             NOT NULL DEFAULT 0,

        /* 橱窗模式 */
        mode            ENUM("SCROLL",                                  /* 多个ICON方式，可以左右换一组 */
                             "ICONLIST",                                /* 一个icon 加 六个信息列表 */
                             "LIST")    NOT NULL DEFAULT "ICONLIST",    /* 信息列表 */

        /* size, 橱窗内信息容量 */
        size            INT             NOT NULL,

        /* 删除标志 */
        isDeleted       BOOL            NOT NULL DEFAULT FALSE,

        /* 创建时间 */
        createdOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

        /* 最后更新时间*/
        updatedOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        advertiseImg    TEXT              DEFAULT NULL,

        advertiseHref   TEXT            DEFAULT NULL

);

DROP TABLE IF EXISTS ShowWindowDetail;
CREATE TABLE ShowWindowDetail (
        /* id */
        id              BIGINT          AUTO_INCREMENT  PRIMARY KEY,

        /* shopWindowId */
        shopWindowId    BIGINT          NOT NULL,

        /* type */
        type            ENUM("GOODS",
                             "PROMOTION")   NOT NULL DEFAULT "GOODS",

        /* goodsId */
        goodsId         BIGINT          DEFAULT 0,

        /* promotion id, to be determined */
        promotionId     BIGINT          DEFAULT 0,

        /* 在本橱窗内的排列顺序，从小到大 */
        orderSeq        INT             NOT NULL DEFAULT 0,

        /* 橱窗推荐标志 */
        isRecommended   BOOL            NOT NULL DEFAULT FALSE,

        /* 删除标志 */
        isDeleted       BOOL            NOT NULL DEFAULT FALSE,

        /* 创建时间 */
        createdOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

        /* 最近更新时间 */
        updatedOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);

/**********************************************
 * Triggers
 * 用来保证数据的完整性
 * 删除父元素的时候同时更新子元素
 *********************************************/

DELIMITER //

DROP TRIGGER IF EXISTS removeLinks;
CREATE TRIGGER removeLinks AFTER UPDATE ON ShopWindow FOR EACH ROW
BEGIN
    update  ShowWindowDetail SET isDeleted = 1 WHERE shopWindowId = NEW.id and NEW.isDeleted = 1 and OLD.isDeleted = 0 ;
END;
//
DELIMITER ;