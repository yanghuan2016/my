/*
    医药直通车项目专用.
    demo模式开发:
    处方详细信息表
*/

DROP TABLE IF EXISTS PrescriptionDetail;
CREATE TABLE PrescriptionDetail (
    id                      BIGINT 			AUTO_INCREMENT PRIMARY KEY,

    prescriptionInfoId      VARCHAR(32)     NOT NULL,    /*处方编号*/

    unicode                 VARCHAR(50)     NOT NULL,       /*商品编号*/

    dose                    VARCHAR(256)    NOT NULL,      /*每次服用量: 2片*/

    dailyTimes              INT             NOT NULL,       /*每天次数*/

    takeMethods             VARCHAR(256)    NOT NULL,       /*服用方法*/

    medicationTime          VARCHAR(256)    NOT NULL,       /*用药时间*/

    quantity                INT             NOT NULL,       /*用药数量*/

    price                   DECIMAL(18,4)   DEFAULT NULL,       /*单价*/

    subtotal                DECIMAL(18,4)   DEFAULT NULL,       /*总价*/

    createdOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);