
DROP TABLE IF EXISTS ErpMsgOut;
CREATE TABLE ErpMsgOut (
	id 					BIGINT 		AUTO_INCREMENT PRIMARY KEY,

    /* 消息版本 */
    version             VARCHAR(20) DEFAULT NULL,

    /* 消息Id */
    msgId               VARCHAR(50) NOT NULL UNIQUE,

    /* 是否EDI */
    isEDIMsg            BOOL        DEFAULT FALSE,

    /* 消息Id */
    erpMsgInMsgId       VARCHAR(50)       DEFAULT NULL,

    /* 消息类型 */
    msgType             VARCHAR(80) DEFAULT NULL,

    /* 消息的数据 */
    msgData             TEXT        DEFAULT NULl,

    /* 用户在cloudDb.customer的ID号 */
	enterpriseId 	    BIGINT      DEFAULT NULL,

    /* 用户类型 */
	enterpriseType      ENUM("CLIENT","CUSTOMER") DEFAULT NULL,

    erpMsgUrl           varchar(512)    DEFAULT NULL,

    erpAppCodeUrl       varchar(512)    DEFAULT NULL,

    appKey              varchar(32)    DEFAULT NULL,

    /* erp 返回的feedback */
    erpFeedback          TEXT        DEFAULT NULL,

    /* scc 返回的feedback状态码 */
    erpFeedbackStatus    BIGINT        DEFAULT NULL,

    /* 是否通过appCode的校验 */
    appCodeValidity     BOOL        DEFAULT FALSE,

    /* 创建时间 */
    createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    /* 最近更新时间 */
    updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
