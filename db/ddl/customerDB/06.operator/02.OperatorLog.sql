/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

DROP TABLE IF EXISTS OperatorLog;
CREATE TABLE OperatorLog (
    /* 唯一的自增长ID */
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,

    /* 操作员id */
    operatorId          BIGINT          NOT NULL DEFAULT 0,

    /* ip地址 */
    ipAddr              VARCHAR(15)     NOT NULL,

    /* 行为分类 */
    actionType          ENUM(
                            "LOGINOUT",         /* 用户登录 */
                            "INFOMODIFY",       /* 用户资料更改维护 */
                            "REGISTER",         /* 客户注册 */
                            "CART",             /* 购物车相关动作 */
                            "ORDER",            /* 订单相关动作 */
                            "SHIP",             /* 发货相关动作 */
                            "REJECT",           /* 拒收相关操作 */
                            "RETURN",           /* 退货相关操作 */
                            "GOODS",            /* 商品管理操作 */
                            "CLIENT",           /* 客户管理操作 */
                            "PORTAL",           /* 门户管理操作 */
                            "ADMIN",            /* 系统管理操作 */
                            "PROMOTION",        /* 促销管理操作 */
                            "OTHER"             /* 其他操作 */
                        )               NOT NULL DEFAULT "OTHER",

    /* 与actionType相关的实体ID值, 如clientId, orderId, shipId, returnId */
    entityId            BIGINT          DEFAULT NULL,

    /* JSON格式的日志 */
    log                 VARCHAR(1024)   NOT NULL DEFAULT "",

    /* 时间戳 */
    createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);