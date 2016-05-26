/*****************************************************************
 * 青岛雨人软件有限公司@2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * Table: AvailableSMS
 * 说明：平台可用的短信服务商信息
 *
 * ------------------------------------------------------------
 *以短信宝文档为基础构建
 *
 */
 DROP TABLE IF EXISTS AvailableSMS;
 CREATE TABLE AvailableSMS (

 	/* ID */
 	id	 			    BIGINT 					AUTO_INCREMENT PRIMARY KEY,

    /* 网关名字 */
    name                VARCHAR(100)            NOT NULL,

    /* 网关版本号 例如：5.0.0*/
 	version             VARCHAR(5)              NOT NULL,

    /* 编码方式 例如：UTF-8或GBK*/
 	encoding            VARCHAR(20)             DEFAULT 'UTF-8',

    /* 签名方法 例如RSA */
 	signMethod          ENUM("SHA1",
                             "MD5",
                             "SHA",
                             "RSA-SHA512"
                             )                  DEFAULT 'MD5',

 	/* 接口地址 */
 	baseUrl             VARCHAR(256)            NOT NULL,

 	/* 短信网关路由 */
 	smsPath             VARCHAR(256)            NOT NULL,

 	/* 短信网关图片url*/
 	imgUrl              VARCHAR(512)            DEFAULT NULL,

 	/* 最近更新时间 */
 	updatedOn           TIMESTAMP               DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

 	/* 创建时间 */
 	createdOn           TIMESTAMP               DEFAULT CURRENT_TIMESTAMP
 );
