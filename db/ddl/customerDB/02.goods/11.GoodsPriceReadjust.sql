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
 * Table: GoodsPriceReadjust
 * 说明：商品的价格调整信息
 * 
 **********************************************************************/

DROP TABLE IF EXISTS GoodsPriceReadjust;
CREATE TABLE GoodsPriceReadjust(
    /* id */
	id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

    /* showId */
	showId                      BIGINT              DEFAULT NULL,

	/* goodId */
	goodsId                     BIGINT              NOT NULL,


	/* 状态 */
	status          			ENUM('CREATED',
									'APPROVED',
									'CANCEL',
									'REJECTED'
									)	DEFAULT 'CREATED',

	/* 调价单申请人Id */
	applyOperatorId			    BIGINT              DEFAULT NULL,

	/* 审核人Id */
	approverId					BIGINT              DEFAULT NULL,

 	/* 调价原因 */
	readjustReason 			    VARCHAR(200) 		DEFAULT NULL,

 	/* 审核意见 */
	approveRemark 			    VARCHAR(200) 		DEFAULT NULL,

	/* 更新时间 */
    updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);


/**********************************************
 * Triggers
 * 用来保证数据的完整性
 *********************************************/


DROP TABLE IF EXISTS GoodsPriceReadjustDetail;
CREATE TABLE GoodsPriceReadjustDetail(
		/* id */
		id                          BIGINT              AUTO_INCREMENT PRIMARY KEY,

		/* ReadjustId */
		readjustId                  BIGINT              NOT NULL,


		/* 是否通过审核 */
		isApproved                  BOOL                DEFAULT FALSE,

		/* 调整价格类型 */
		readjustType            	ENUM('BASIC',
										'SINGLECLIENT',
										'CLIENTCATEGORY'
										)	DEFAULT 'BASIC',

	    /* 原始批发价 */
    	wholesalePriceOrigin        DECIMAL(18,4)       DEFAULT 0,

        /* 批发价 */
    	wholesalePriceNew           DECIMAL(18,4)       DEFAULT 0,

    	/* 原始参考零售价 */
    	refRetailPriceOrigin        DECIMAL(18,4)       DEFAULT 0,

    	/* 参考零售价 */
    	refRetailPriceNew           DECIMAL(18,4)       DEFAULT 0,

    	/* 原始售价一 */
    	price1Origin                DECIMAL(18,4)       DEFAULT 0,

    	/* 售价一 */
    	price1New                   DECIMAL(18,4)       DEFAULT 0,

    	/* 原始售价二 */
    	price2Origin                DECIMAL(18,4)       DEFAULT 0,

    	/* 售价二 */
    	price2New                   DECIMAL(18,4)       DEFAULT 0,


    	/* 原始售价三 */
    	price3Origin                DECIMAL(18,4)       DEFAULT 0,

    	/* 售价三 */
    	price3New                   DECIMAL(18,4)       DEFAULT 0,

    	/* 原始国家限价 */
    	limitedPriceOrigin          DECIMAL(18,4)       DEFAULT 0,

    	/* 国家限价 */
    	limitedPriceNew             DECIMAL(18,4)       DEFAULT 0,

    	/* 原始国家基药价 */
    	basePriceOrigin             DECIMAL(18,4)       DEFAULT 0,

    	/* 国家基药价 */
    	basePriceNew                DECIMAL(18,4)       DEFAULT 0,

    	/* 原始省管基药价 */
    	provinceBasePriceOrigin     DECIMAL(18,4)       DEFAULT 0,

    	/* 省管基药价 */
    	provinceBasePriceNew        DECIMAL(18,4)       DEFAULT 0,

    	/* 原始基药指导价 */
    	guidedBasePriceOrigin       DECIMAL(18,4)       DEFAULT 0,

    	/* 基药指导价 */
    	guidedBasePriceNew          DECIMAL(18,4)       DEFAULT 0,


    	/* 客户类价格对应客户类Id */
    	clientCategoryId			BIGINT              DEFAULT NULL,
    	/* 原始客户类价 */

    	clientCategoryPriceOrigin	DECIMAL(18,4)       DEFAULT 0,
    	/* 客户类价 */

    	clientCategoryPriceNew 		DECIMAL(18,4)       DEFAULT 0,

    	/* 客户单品价对应客户ID */
    	clientId 					BIGINT              DEFAULT NULL,

    	/* 原始客户单品价 */
    	clientPriceOrigin			DECIMAL(18,4)       DEFAULT 0,

    	/* 客户单品价 */
    	clientPriceNew				DECIMAL(18,4)       DEFAULT 0,

		/* 更新时间 */
		updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

		/* 创建时间 */
		createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);
