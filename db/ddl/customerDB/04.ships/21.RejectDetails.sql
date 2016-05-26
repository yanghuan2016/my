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
 * Table: RejectDetails
 * 说明：拒收单详情
 * 
/**********************************************************************/

DROP TABLE IF EXISTS RejectDetails;
CREATE TABLE RejectDetails(
    /* id */
	id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

	/* guid, erp.guid */
	guid                        VARCHAR(50)         DEFAULT NULL,

	/* 拒收单号 */
	rejectId                    BIGINT                NOT NULL,


	/* 退货商品 */
    goodsId                     BIGINT                NOT NULL,

	/**拒收的商品中,由于破损，包装损坏 无法发货的  但是 申请退款的商品数量 , 不分批次  */
    goodsNotSendRefundQuantity	DECIMAL(18,6) 		  DEFAULT NULL,

	/**拒收的商品中,基于该商品id 的 拒收发货总数量, 		  			   不分批次  */
	rejectShippedQuantitySum    DECIMAL(18,6) 		  DEFAULT NULL,

	/**拒收的商品中,基于该商品id 的 商户入库总数量,该字段<=rejectShippedQuantitySum				   不分批次*/
	rejectReceiveQuantitySum	DECIMAL(18,6)		DEFAULT NULL ,

	/* 申请拒收的商品数量  分批次 */
	quantity                    DECIMAL(18,6)        NOT NULL,


	/* 客户实际退回数量  可以小于申请数量  分批次*/
	rejectQuantity             DECIMAL(18,6)        NOT NULL,


	/* 商家实际接收的拒收发过来的货物数量 分批次*/
	/*
		当前字段同 quantity rejectQuantity 的关系:
	  	quantity>=rejectQuantity>=rejectReceiveQuantity
	*/
	rejectReceiveQuantity    DECIMAL(18,6)       DEFAULT NULL,



	/* 拒收发货的实际数量   分批次  该字段和rejectQuantity 重复了 废弃  */
	rejectShippedQuantity       DECIMAL(18,6)        DEFAULT 0,

   /* drugElectronicSupervisionCode 电子监管码 简写为drugESC*/

    drugESC                    VARCHAR(8192)   DEFAULT NULL,

    rejectedDrugESC            VARCHAR(8192)   DEFAULT NULL,

	soldPrice				   DECIMAL(18,6)    DEFAULT 0 ,

    /* batchNum 批次号*/
    batchNum                  VARCHAR(50)     DEFAULT NULL,


	/* batchInspectionReportURL 批次检验报告URL 可上传图片URL*/
    inspectReportURL     VARCHAR(500)    DEFAULT NULL,



	/* 申请备注 */
	remark                      VARCHAR(200)    	  DEFAULT NULL,

	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

	UNIQUE KEY  (rejectId,goodsId,batchNum)
);
