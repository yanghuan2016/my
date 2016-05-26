
DROP TABLE IF EXISTS GoodsWillBeExpired;
CREATE TABLE GoodsWillBeExpired (
    /* id */
	id                          BIGINT                  AUTO_INCREMENT PRIMARY KEY,

	/* 货号,商户OR客户ERP自用SKU */
	goodsNo 		            VARCHAR(50) 		    UNIQUE DEFAULT NULL,

    /* 批号  */
    batchNo                     VARCHAR(50)             DEFAULT NULL,

	/* 医药365货号 */
	skuNo 	                    VARCHAR(50) 			UNIQUE DEFAULT NULL,

    /* 批准文号 */
    licenseNo                   VARCHAR(100)            DEFAULT "",

    /* 批次号, 批号加上生产日期 */
    batchNum                    VARCHAR(50)             DEFAULT NULL,

    /* 可售库存数量 */
	amount                      INT                     DEFAULT 0,

    /* 锁定库存数量 */
	lockedAmount                INT                     DEFAULT 0,

     /* 生产日期 */
    goodsProduceDate            DATE            DEFAULT NULL,

    /* 有效期 */
    goodsValidDate              DATE            DEFAULT NULL,

    /* 上下架标志,新增的商品默认是下架标志 */
	onSell                      BOOLEAN                 DEFAULT false,

    /* 是否可拆分 */
	isSplit                     BOOLEAN                 DEFAULT true,

    /* 更新时间 */
	updatedOn                   TIMESTAMP               DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* 创建时间 */
	createdOn                   TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,

	UNIQUE KEY  (goodsNo,batchNum)
);
