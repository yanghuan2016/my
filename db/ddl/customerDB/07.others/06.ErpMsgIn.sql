
DROP TABLE IF EXISTS ErpMsgIn;
CREATE TABLE ErpMsgIn (
	id 					BIGINT 		AUTO_INCREMENT PRIMARY KEY,

    /* 消息版本 */
    version             VARCHAR(20) DEFAULT NULl,

    /* 消息Id */
    msgId               VARCHAR(50) NOT NULL UNIQUE,

    /* 消息类型 */
    msgType             VARCHAR(80) DEFAULT NULl,

    /* 是否EDI */
    isEDIMsg            BOOL        DEFAULT FALSE,

    /* 消息的数据 */
    msgData             TEXT        DEFAULT NULL,

    /* 是否通过appCode的校验 */
    appCodeValidity     BOOL        DEFAULT FALSE,

    /* 用户在cloudDb.customer的ID号 */
	enterpriseId 	    BIGINT      DEFAULT NULL,

    /* 用户类型 */
	enterpriseType      ENUM("CLIENT","CUSTOMER") DEFAULT NULL,

    /* scc 返回的feedback */
    sccFeedback          TEXT        DEFAULT NULL,

    /* scc 返回的feedback状态码 */
    sccFeedbackStatus    BIGINT        DEFAULT 0,

    /* 创建时间 */
    createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    /* 最近更新时间 */
    updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
