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
 * Table: ClientAddress
 * 说明：收货地址表
 * --------------------------------------------------------------
 * 2015-09-25       xdw-romens@issue#46      created
 *
 */

DROP TABLE IF EXISTS ClientAddress;
CREATE TABLE ClientAddress(

	/* id */
	id 					BIGINT 		    AUTO_INCREMENT PRIMARY KEY,

	/* 客户id */
	clientId			BIGINT 		    NOT NULL,

	/* 收货人姓名 */
	receiver			VARCHAR(256)   DEFAULT NULL,

	/* 收货人电话 */
	telNum   			VARCHAR(50)    DEFAULT NULL,

	/* 收货人手机 */
	mobileNum			VARCHAR(50)    DEFAULT NULL,

	/* 邮编 */
	postCode			VARCHAR(20)    DEFAULT NULL,

	/* 国标收货地址第一级：省，直辖市 */
	provinceFirstStage	VARCHAR(50)    DEFAULT NULL,

	/* 国标收货地址第二级：市 */
	citySecondStage		VARCHAR(50)    DEFAULT NULL,

	/* 国标收货地址第三级：县，镇，村 */
	countiesThirdStage	VARCHAR(128)   DEFAULT NULL,

	/* 详细收货地址 */
	detailAddress	    VARCHAR(512)   NOT NULL,

	/* 备注 */
	remark              VARCHAR(512)   DEFAULT NULL,

	/* 更新时间戳 */
	updatedOn 			TIMESTAMP	    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间戳 */
	createdOn 			TIMESTAMP	    DEFAULT CURRENT_TIMESTAMP
);

