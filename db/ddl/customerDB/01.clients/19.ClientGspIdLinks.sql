/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * Table: ClientGspIdLinks
 * 说明：客户gspType id对应表
 */
DROP TABLE IF EXISTS ClientGspIdLinks;
CREATE TABLE ClientGspIdLinks (

    /* unique id  Id*/
	id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,


 	/* Client ID refer to table Client */
	clientId			BIGINT		    NOT NULL,


 	/* gspType  ID refer to table ClientGspTypes */
	gspTypeId			BIGINT		    NOT NULL,


	/* 更新时戳 */
	updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时戳 */
	createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

	UNIQUE KEY  (clientId,gspTypeId)
);

/**
客户自己更新资料的时候 Gsp控制类型的更新历史
此时 clientId和gspTypeId 不能联合唯一
*/
DROP TABLE IF EXISTS ClientGspIdLinksUpdate;
CREATE TABLE ClientGspIdLinksUpdate (

    /* unique id  Id*/
	id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,


 	/* Client ID refer to table Client */
	clientId			BIGINT		    NOT NULL,


 	/* gspType  ID refer to table ClientGspTypes */
	gspTypeId			BIGINT		    NOT NULL,

	/* 更新时戳 */
	updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时戳 */
	createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

	groupGuid			varchar(50)		DEFAULT NULL

);
