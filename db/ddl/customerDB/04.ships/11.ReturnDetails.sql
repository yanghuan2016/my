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
 * Table: ReturnDetails
 * 说明：退单详情
 * 
/**********************************************************************/

DROP TABLE IF EXISTS ReturnDetails;
CREATE TABLE ReturnDetails(
    /* id */
	id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

	/* guid, erp.guid */
	guid                        VARCHAR(50)         DEFAULT NULL,

	/* 退货单号 */
	returnId                    BIGINT                NOT NULL,

	/* 订单号 */
	orderId                     BIGINT                NOT NULL,

	/* 退货商品 */
    goodsId                     BIGINT                NOT NULL,


	/* 当下版本申请退货的时候   需要填写批次数量 该字段在使用中 2016-03-18 mark*/
	quantity                    DECIMAL(18,6)        NOT NULL,

	/* 当下版本商户审核的时候   该字段在使用中 			   2016-03-18 mark*/
	approvedQuantity            DECIMAL(18,6)        DEFAULT 0,


	/* 客户实际退回数量  可小于可退数量  */
    returnQuantity             DECIMAL(18,6)        DEFAULT NULL,

	/* 商户确认退货收货入库数量*/
	returnDeliveredQuantity    DECIMAL(18,6)        DEFAULT NULL,

    /* drugElectronicSupervisionCode 电子监管码 简写为drugESC*/
    drugESC                    VARCHAR(8192)        DEFAULT NULL,

    /* detail no, ERP */
    detailNo                   VARCHAR(50)          DEFAULT NULL  COMMENT '序号',


    /* batchNum 批次号*/
    batchNum                   VARCHAR(50)     DEFAULT NULL,

   /* batchNo 批号*/
    batchNo                  VARCHAR(50)     DEFAULT NULL,

     /* 生产日期 */
    goodsProduceDate           DATE            DEFAULT NULL,


    /* 有效期 */
    goodsValidDate              DATE            DEFAULT NULL,

   /* goodslicenseNo 商品批准文号,用于ERP同步数据*/
    goodslicenseNo           VARCHAR(50)     DEFAULT NULL,


	/* batchInspectionReportURL 批次检验报告URL 可上传图片URL*/
	inspectReportURL         VARCHAR(500)    DEFAULT NULL,


   /* 商户确认退货收货时录入的电子监管码 */
    deliveredDrugESC           VARCHAR(8192)   DEFAULT NULL,

	/* 退货申请备注 */
	remark                           TEXT    	  DEFAULT NULL,

	/* 退货发货备注 */
    shipRemark                      TEXT    	  DEFAULT NULL,

	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,



	UNIQUE KEY  (returnId,goodsId,batchNum)
);

DROP TABLE IF EXISTS ReturnInfo_Goods_Map;
CREATE TABLE ReturnInfo_Goods_Map(
	/* id */
    id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

	/*退货单Id*/
	returnId					BIGINT              NOT NULL,

	/* guid, erp.guid */
	guid                        VARCHAR(50)         DEFAULT NULL,

	/*退货商品的价格 对于现付客户 该价格为购买此商品的价格 对于授信客户 该价格为用户自己填写的价格*/
	price						DECIMAL(18,4)  		DEFAULT NULL,

	/* 退货商品 */
    goodsId                     BIGINT                NOT NULL,

	/* 申请退货的商品总数量，对应goodsId的所有商品数之和  只和商品有关系,和批次没有关系 */
	applyQuantity               DECIMAL(18,6)        DEFAULT NULL,

	/* 商户审核批准后实际可退货数量  可小于申退数量       只和商品有关系,和批次没有关系 */
	approvedQuantity            DECIMAL(18,6)        DEFAULT NULL,

	/* 客户实际退回的商品的总数量                       只和商品有关系,和批次没有关系 */
	returnShippedQuantity       DECIMAL(18,6)        DEFAULT NULL,

	/*商户实际接收的商品总数量  						 只和商品有关系,和批次没有关系*/
	receiveShippedQuantity      DECIMAL(18,6)        DEFAULT NULL,

	/*申请退货的时候 对商品的备注*/
	remark						TEXT  				 DEFAULT NULL,

	UNIQUE KEY  (returnId,goodsId)
)