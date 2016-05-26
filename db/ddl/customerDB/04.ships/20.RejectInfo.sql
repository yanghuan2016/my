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
 * Table: RejectInfo
 * 说明：拒收单信息
 * 
/**********************************************************************/

DROP TABLE IF EXISTS RejectInfo;
CREATE TABLE RejectInfo(
    /* id */
	id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

	/* guid, erp.guid */
	guid                        VARCHAR(50)         DEFAULT NULL,

	/* 发货单号 */
	shipId                      BIGINT              NOT NULL,

	/* 订单号 */
	orderId                     BIGINT              NOT NULL,

    /* 拒收申请人id */
    operatorId                  BIGINT              NOT NULL,

    /* operator UID, EPR */
    operatorUid                 VARCHAR(50)         DEFAULT NULL,


	/** 拒收发货时间*/
	rejectShipDate              DATETIME           DEFAULT NULL,

	/**拒收发货备注*/
	rejectShipRemark		 	TEXT 			   DEFAULT NULL,


  	/* 收货标志 */
  	isReceived                 BOOL      			DEFAULT FALSE,

    /* 拒收单状态标志 */
  	status					ENUM('CREATED',				/* 已受理待发货 */
  								 'SHIPPED',					/* 客户已发货(商户待收货(待入库)) */
  								 'FINISHED') DEFAULT 'CREATED' /* 商户已收货(已入库) */
	,
	/**拒收物流信息*/
 	logisticsNo                TEXT     			DEFAULT NULL,

  	/* 拒收收货时间 */
  	receivedDate               DATETIME             DEFAULT NULL,

    /* 拒收收货备注 = OrderInfo.remark */
	remark	                    VARCHAR(200)        DEFAULT NULL,

	 /* 拒收入库备注 = OrderInfo.remark */
    receivedRemark	            VARCHAR(200)        DEFAULT NULL,

     /* 拒收附件(图片) */
    rejectImg  				VARCHAR(200)        DEFAULT NULL,

	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP

);
