CREATE TABLE PromotionDetail(

        /**
         * 自增长id
         */
        id                  BIGINT              AUTO_INCREMENT PRIMARY KEY,

        /**
         * @see Promotion.id
         */
        promotionId         BIGINT              NOT NULL,

        /**
         * @see GoodsInfo.id
         * @see GoodsPrice.retailPrice, GoodsPrice.wholesalePrice
         */
        goodsId             BIGINT              NOT NULL,

        /**
         * 促销价格
         */
        promotionPrice      DECIMAL(16,6)       DEFAULT NULL,

        /**
         * 批号，仅批次特价促销适用
         */
        batchNumber         VARCHAR(128)        DEFAULT NULL,

        /**
         * 促销总数；
         */
        availableQty        INT                 NOT NULL,

        /**
         * 组合促销，每套组合中该品种的件数
         */
        qtyInBundle         INT                 DEFAULT 1,

        /**
         * BXGYF促销的数量条件;
         * 买一送一／买二免一：bxgyfXQty=2,bxgyfYQty=1
         * 买一第二件半价／买二免半：bxgyfXQty=2, bxgyfYQty=0.5
         * 买三第四件6折：bxgyfXQty＝4， bxgyfYQty＝0.4
         */
        bxgyfXQty           DECIMAL(12,4)       DEFAULT NULL,
        bxgyfYQty           DECIMAL(12,4)       DEFAULT NULL,

        /* timestamps */
        createdOn           TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

        UNIQUE KEY          (promotionId, goodsId, batchNumber)

);
