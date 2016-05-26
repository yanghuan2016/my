/*****************************************************************
 * 青岛雨人软件有限公司2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

-- 离线任务表
CREATE TABLE Task(
        /**
         * task id
         */
        taskId          BIGINT              AUTO_INCREMENT PRIMARY KEY,

        /**
         * 任务名称
         */
        taskName        VARCHAR(128)        NOT NULL,

        /**
         * 任务类型
         */
        taskType        ENUM("INIT_ENTERPRISE_DB",         /* 初始化客户数据库 */
                             "ORDER_CLOSE_UNPAID",         /* 关闭未付款订单 */
                             "SHIP_RECEIVE",               /* 自动收货确认 */
                             "REFUND_EXECUTE",             /* 执行退款 */
                             "ERP_SYNC_GSP",               /* ERP同步GSP控制范围 */
                             "ERP_SYNC_GOODSCATEGORY",     /* ERP同步商品分类 */
                             "ERP_SYNC_INVENTORY",         /* ERP同步库存 */
                             "ERP_SYNC_CLIENTCATEGORY",    /* ERP同步客户分类 */
                             "ERP_SYNC_CLIENT",            /* ERP同步客户 */
                             "ERP_SYNC_PRICE",             /* ERP同步基础价格 */
                             "ERP_SYNC_CLIENTCATEGORYPRICE", /* ERP同步客户类价格 */
                             "ERP_SYNC_CLIENTPRICE",        /* ERP同步客户价格 */
                             "ERP_SYNC_GOODS"              /*ERP同步商品*/
                        )                   NOT NULL,

        /**
         * 任务状态
         */
        taskStatus      ENUM("PENDING",                         /* 等待启动执行 */
                             "RUNNING",                         /* 任务正在执行中 */
                             "EXPIRED",                         /* 已经过期 */
                             "DELETED"                          /* 已被删除 */
                            )               NOT NULL DEFAULT "RUNNING",

        /**
         * 任务的pubsub频道名称,一般可以用uuid来唯一标示
         */
        pubsubChannel   VARCHAR(256)        DEFAULT NULL,

        /* 通知范围 */
        pubsubScope     ENUM("OPERATOR",                        /* 任务通知发送范围, 操作员 */
                             "ENTERPRISE")                      /* 任务通知范围: 客户所有在线操作员 */
                                            DEFAULT "OPERATOR",

        /* 接收该离线任务通知的操作员id, pubsubScope为OPERATOR时有效 */
        operatorId      BIGINT              DEFAULT NULL,

        /* 是否允许多重进入标志 */
        isMultiEntry    BOOLEAN             NOT NULL DEFAULT FALSE,

        /**
         * 任务执行参数, json字符串格式, 经过JSON.parse()
         * 后可以直接作为任务执行器参数
         */
        taskParam       VARCHAR(2048)       DEFAULT NULL,

        /**
         * crontab like control string
         */
        second          VARCHAR(32)         NOT NULL DEFAULT "0",   /* second */
        minute          VARCHAR(32)         NOT NULL DEFAULT "0",   /* minute */
        hour            VARCHAR(32)         NOT NULL DEFAULT "1",   /* hour */
        dom             VARCHAR(32)         NOT NULL DEFAULT "*",   /* day of month */
        mon             VARCHAR(32)         NOT NULL DEFAULT "*",   /* month */
        dow             VARCHAR(32)         NOT NULL DEFAULT "*",   /* day of month */

        /**
         * 任务开始执行时间
         * 0 表示立即开始执行
         */
        startAt         TIMESTAMP           NOT NULL DEFAULT 0,

        /**
         * 任务停止执行时间,
         * 当前时间超过停止执行时间后,不再执行
         * 0 表示没有停止执行时间
         */
        stopAt          TIMESTAMP           NOT NULL DEFAULT 0,

        /**
         * 最大执行次数, 当count达到maxCount时, taskStatus变为CLOSED
         */
        maxCount        INT                 NOT NULL DEFAULT 0,

        customerId      BIGINT              NOT NULL DEFAULT 0,

        /* timestamps */
        createdOn       TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedOn       TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE TaskStatistics(
        /**
         * taskId
         * @see Task.taksId
         */
        taskId          BIGINT              PRIMARY KEY NOT NULL,

        /**
         * 执行次数计数器 执行成功的总次数
         */
        count           INT                 NOT NULL DEFAULT 0,
        /**
        *  执行失败的总次数
        */
        errorCount      INT                 NOT NULL DEFAULT 0,

        /**
         * 首次执行时刻
         */
        firstRun        TIMESTAMP           NOT NULL DEFAULT 0,

        /**
         * 上次执行时刻
         */
        lastRun         TIMESTAMP           NOT NULL DEFAULT 0,

        /**
         * 上次成功执行时长
         */
        lastDuration    DECIMAL(16,3)       NOT NULL DEFAULT 0,

        /**
         * 成功执行总时长
         */
        totalDuration   DECIMAL(16,3)       NOT NULL DEFAULT 0
);

/**
 * 任务执行情况记录
 */
CREATE TABLE TaskHistory(
        /**
         * 任务id, @see Task.id
         */
        taskId          BIGINT              NOT NULL,

        /**
         * 本次任务开始时刻
         */
        beginAt         TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,

        /**
         * 本次任务完成时刻
         */
        endAt           TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,

        /**
         * 任务执行参数, @see Task.taskParam
         */
        taskParam       VARCHAR(2048)       DEFAULT NULL,

        /**
         * 本次执行时间
         */
        duration        DECIMAL(16,3)       DEFAULT 0,

        /**
         * 任务执行标志
         */
        isSuccess       BOOL                NOT NULL DEFAULT TRUE,

        /**
         * 任务执行失败原因
         */
        failureReason   VARCHAR(2048)       DEFAULT NULL
);