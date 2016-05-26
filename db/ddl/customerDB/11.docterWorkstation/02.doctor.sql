/*
    医药直通车项目专用.
    demo模式开发:
    医生信息表
*/

DROP TABLE IF EXISTS Doctor;
CREATE TABLE Doctor (
    doctorId                VARCHAR(32)     PRIMARY KEY,    /*doctorId*/

    name                    VARCHAR(32)     NOT NULL,       /*姓名*/

    citizenIdNum            VARCHAR(50)     NOT NULL,       /*身份证号*/

    username                VARCHAR(32)     NOT NULL,       /*登录用户名*/

    password                VARCHAR(256)    NOT NULL,       /*密码*/

    createdOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);