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
 * Table: 显示底部位置的链接及内容
 */

DROP TABLE IF EXISTS LinkColumns;
CREATE TABLE LinkColumns(
        /* id */
        id              BIGINT          AUTO_INCREMENT  PRIMARY KEY,

        /* 列标题：公司介绍、采购指南、售后服务、联系我们 */
        columnName      VARCHAR(40)     NOT NULL,

        /* 列图标, fontawesome字符集 */
        columnIcon      VARCHAR(40)     DEFAULT NULL,

        /* 排列顺序，从小到大 */
        orderSeq        INT             NOT NULL DEFAULT 0,

        /* 删除标志 */
        isDeleted       BOOL            NOT NULL DEFAULT FALSE,

        /* 创建时间 */
        createdOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

        /* 最后更新时间*/
        updatedOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS Links;
CREATE TABLE Links (
        /* id */
        id              BIGINT          AUTO_INCREMENT  PRIMARY KEY,

        /* 列Id */
        columnId        BIGINT          NOT NULL,

        /* 链接名称：关于我们，加盟合作 */
        name            VARCHAR(64)     NOT NULL,

        /* 在本列内的排列顺序，从小到大 */
        orderSeq        INT             NOT NULL DEFAULT 0,

        /* 网页html部分 */
        html            TEXT         NOT NULL,

        /* 删除标志 */
        isDeleted       BOOLEAN            NOT NULL DEFAULT FALSE,

        /* 创建时间 */
        createdOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

        /* 最近更新时间 */
        updatedOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

/**********************************************
 * Triggers
 * 用来保证数据的完整性
 * 在删除column的时候删除link中columnId=被删除的LinkColumn.id的元素
 *********************************************/

DELIMITER //

DROP TRIGGER IF EXISTS removeLinks;
CREATE TRIGGER removeLinks AFTER UPDATE ON LinkColumns FOR EACH ROW
BEGIN
    IF OLD.isDeleted = 0 AND NEW.isDeleted = 1 THEN
        update  Links SET isDeleted = NEW.isDeleted WHERE columnId = NEW.id;
    END IF;
END;
//
DELIMITER ;
