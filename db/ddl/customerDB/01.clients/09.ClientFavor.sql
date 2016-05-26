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
 * Table: ClientFavor
 * 说明：客户关注商品表 对应客户常购清单功能实现
 */
DROP TABLE IF EXISTS ClientFavor;
CREATE TABLE ClientFavor (

    /* unique id 关注列表id*/
	id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,

	/* 关注列表名 */
	name   				VARCHAR(250)    NOT NULL,

    /* 客户id */
	clientId        	BIGINT      	NOT NULL,


	/* 更新时戳 */
	updatedOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时戳 */
	createdOn           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

	unique (name,clientId)
);


/**********************************************
 * Triggers
 * 用来保证数据的完整性
 *********************************************/

DELIMITER //
/**
 * 删除清单的时候，触发删除清单详情里面相应的条目
 */
DROP TRIGGER IF EXISTS deleteClientFavorDetail;
CREATE TRIGGER deleteClientFavorDetail AFTER DELETE ON ClientFavor FOR EACH ROW
BEGIN
    DELETE FROM ClientFavorDetails
        WHERE ClientFavorDetails.favorId=OLD.id;
END;

//
DELIMITER ;