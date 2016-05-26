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
 * Table: 新闻
 */


DROP TABLE IF EXISTS NewsLinks;
CREATE TABLE NewsLinks (
        /* id */
        id              BIGINT          AUTO_INCREMENT  PRIMARY KEY,

        /* 链接名称：关于我们，加盟合作 */
        newsTitle       VARCHAR(256)    NOT NULL,

        /* 网页html部分 */
        html            TEXT         NOT NULL,

        /* 置顶标志 */
        alwaysOnTop     BOOLEAN            NOT NULL DEFAULT FALSE,

        /* 供未来使用! 可以阅读本新闻的客户类别, 如:1,2. */
        clientCategoryIdList    VARCHAR(256)      DEFAULT NULL,

        /* 公告标志 */
        isAnnouncement  BOOLEAN            DEFAULT FALSE,

        /* 公告对象 */
        announceTo      TEXT         DEFAUlT NULL,

        /* 删除标志 */
        isDeleted       BOOLEAN            NOT NULL DEFAULT FALSE,

        /* 创建时间 */
        createdOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

        /* 最近更新时间 */
        updatedOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);