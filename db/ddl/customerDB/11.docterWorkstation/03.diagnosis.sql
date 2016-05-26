/*
    医药直通车项目专用.
    demo模式开发:
    就诊信息
*/

DROP TABLE IF EXISTS Diagnosis;
CREATE TABLE Diagnosis (
    diagnosisId      VARCHAR(32)     PRIMARY KEY,        /* 就诊编号 */

    patientCardId   VARCHAR(32)     NOT NULL,           /* 就诊卡号 */

    doctorId        VARCHAR(32)     NOT NULL,            /*医生编号*/

    diagnoseDate    TIMESTAMP       NOT NULL,       /*就诊时间*/

    diseaseDescription  TEXT        DEFAULT '',       /*病情描述*/

    diagnosis       TEXT            DEFAULT '',       /*诊断结果*/

    createdOn       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);