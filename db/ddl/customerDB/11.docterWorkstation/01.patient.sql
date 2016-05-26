/*
    医药直通车项目专用.
    demo模式开发:
    病人信息表
*/

DROP TABLE IF EXISTS Patient;
CREATE TABLE Patient (
    citizenIdNum    VARCHAR(50)     PRIMARY KEY,    /* 身份证号 */

    patientCardId   VARCHAR(30)     DEFAULT NULL,   /* 就诊卡号 */

    weChartOpenId   VARCHAR(50)     DEFAULT NULL,   /* 微信OpenId */

    name            VARCHAR(50)     NOT  NULL,

    gender          ENUM('MALE', "FEMALE")  NOT NULL,

    birthDate       TIMESTAMP       NOT NULL
);