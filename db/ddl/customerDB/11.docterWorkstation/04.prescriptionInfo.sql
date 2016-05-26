/*
    医药直通车项目专用.
    demo模式开发:
    处方表
*/

DROP TABLE IF EXISTS PrescriptionInfo;
CREATE TABLE PrescriptionInfo (

    prescriptionInfoId      VARCHAR(32)     PRIMARY KEY,    /*处方编号*/

    diagnoseId              VARCHAR(32)     NOT NULL,   /*就诊编号*/

    prescriptionType        ENUM('type1', 'type2')  DEFAULT NULL,

    prescriptionStatus      ENUM('PICKUP', 'COD') DEFAULT NULL, /*PICKUP 到店自提 COD 货到付款*/

    remark                  TEXT            DEFAULT NULL,

    createdOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);