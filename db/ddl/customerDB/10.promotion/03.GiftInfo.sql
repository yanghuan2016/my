-- 赠品方案
CREATE TABLE GiftPlan(
        id              BIGINT              AUTO_INCREMENT PRIMARY KEY,

        /* 赠品方案名称 */
        name            VARCHAR(256)        NOT NULL,

        /* 赠品方案描述 */
        description     TEXT                DEFAULT NULL,

        /* 满足条件后可得赠品总件数 */
        giftQty         INT                 NOT NULL DEFAULT 1,

        /**
         * 启用／禁用标志
         */
        isEnabled       BOOL                NOT NULL DEFAULT TRUE,

        /* timestamps */
        createdOn       TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
        updatedOn       TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);

-- 赠品方案详情
CREATE TABLE GiftPlanDetail(
        id              BIGINT              AUTO_INCREMENT PRIMARY KEY,

        /**
         * @see GiftPlan.id
         */
        giftPlanId      BIGINT              NOT NULL,

        /**
         * @see GoodsInfo.id
         */
        goodsId         BIGINT              NOT NULL,

        /* 赠品组合标志，为true表示必选品种，为false标示客户可以自由选择 */
        isBundle        BOOL                NOT NULL DEFAULT FALSE,
        /* 赠品组合数量，isBundle为true时有效，表示必选该品种的数量 */
        bundleQty       INT                 NOT NULL DEFAULT 1,
        
        /**
         * @see GoodsPrice.retailPrice, GoodsPrice.wholesalePrice
         */
        retailPrice     DECIMAL(16,6)       DEFAULT NULL,
        wholesalePrice  DECIMAL(16,6)       DEFAULT NULL,

        /**
         * 该品种可赠总数
         */
        availableQty    INT                 NOT NULL,

        /* timestamps */
        createdOn       TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
        updatedOn       TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
