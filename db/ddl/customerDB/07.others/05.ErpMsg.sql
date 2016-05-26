/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

DROP TABLE IF EXISTS ErpMsg;
CREATE TABLE ErpMsg (
	id 					BIGINT 		AUTO_INCREMENT PRIMARY KEY,

    /** 用户Id, 如果userType为Client，则此userId为clientId
     *  如果userType是Customer，则为customerId
     */
	userId 			    BIGINT      NOT NULL,

    /* 用户类型 */
	userType            ENUM("CLIENT","CUSTOMER") NOT NULL,

    /* 消息版本 */
    version             VARCHAR(20) NOT NULL,

    /* 消息Id */
    msgId               CHAR(26)    NOT NULL,

    /* 消息类型 */
    msgType             VARCHAR(50) NOT NULL,

    /* 消息的数据 */
    msgData             TEXT        NOT NULL,

    /* 消息传输路径, 分别对应SCC_TO_CLIENT,SCC_TO_CUSTOMER等 */
    msgRoute            ENUM("SCCTOCL", "SCCTOCU", "CUTOSCC", "CLTOSCC") NOT NULL,

    /* 消息处理状态 */
    handleStatus        ENUM("RECEIVED", "EXECFAILUER", "EXECSUCCESS", "CREATED", "SENDSUCCESS", "SENDFAILUER") NOT NULL,

    /* 错误码 */
    errorCode           VARCHAR(255)    DEFAULT NULL,

    /* 创建时间 */
    createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    /* 最近更新时间 */
    updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
