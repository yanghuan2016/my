CREATE TABLE PromotionInfo (

    /* 促销方案id */
    id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,

    /* 促销方案名称 */
    promotionName           VARCHAR(256)    NOT NULL,

    /* 促销描述信息，rich texthtml */
    promotionDescription    TEXT,

    /* 促销类型 */
    promotionType           ENUM("SPECIAL_OFFER",           /* 特价促销 */
                                 "BATCH_OFFER",             /* 特价批号促销*/
                                 "SET_OFFER",               /* 集合促销 */
                                 "BUNDLE_OFFER",            /* 组合促销 */
                                 "ORDER_OFFER",             /* 整单促销 */
                                 "BXGYF_OFFER"              /* 买免促销: 买二免一，买第二件半价等 */
                                 )          NOT NULL,

    /* 显示优先级, 越小越靠前 */
    displayOrder            INT             DEFAULT 0,

    /* 是否有优惠券 */
    hasCoupon               BOOL            NOT NULL DEFAULT TRUE,
    /* 放优惠码数量，0表示不限量 */
    couponTotal             INT             NOT NULL DEFAULT 0,
    /* 每个客户可以领取优惠码的最大数量，0标示不限制 */
    couponLimit             INT             NOT NULL DEFAULT 1,
    /* 已经被领取的优惠码张数 */
    couponTakenCount        INT             NOT NULL DEFAULT 0,
    couponUsedCount         INT             NOT NULL DEFAULT 0,
    couponCancelledCount    INT             NOT NULL DEFAULT 0,
    
    /* 预热时间 */
    warmUpTime              DATETIME        DEFAULT NULL,
    /* 生效时间 */
    effectTime              DATETIME        NOT NULL,
    /* 关闭时间 */
    closeTime               DATETIME        NOT NULL,

    /* 组合价格, 仅组合促销有效 */
    bundleSetPrice             DECIMAL(16,6)   DEFAULT NULL,
    /* 组合套数, 仅组合促销有效 */
    bundleSetQty               INT             DEFAULT NULL,

    /* 限售控制, 0标示不限售 */
    limitQty                DECIMAL(16,6)   DEFAULT 0,

    /* Timestamps */
    createdOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updatedOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

/* 促销适用范围 */
CREATE TABLE PromotionApply(
    /* id */
    id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,

    /**
     * 促销id
     */
    promotionId             BIGINT          NOT NULL,

    /* 启用／禁用标志 */
    isEnabled               BOOL            NOT NULL DEFAULT TRUE,

    /* 控制类型 */
    applyType               ENUM("AREA_APPLY",              /* 适用区域 */
                                 "CLIENT_CATEGORY_APPLY"    /* 适用客户类别 */
                                 )          NOT NULL,

    /* area id, 当applyType为AREA_APPLY时有效 */
    areaId                  BIGINT,

    /* client category id, 当applyType为CLIENT_CATEGORY_APPLY时有效 */
    clientCategoryId        BIGINT,

    /* 时间戳 */
    createdOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updatedOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

/* 促销规则表 */
CREATE TABLE PromotionRule(
    /* id */
    id                      BIGINT          AUTO_INCREMENT PRIMARY KEY,

    /* promotion id */
    promotionId             BIGINT          NOT NULL,

    /* 规则优先级，越大越高 */
    rulePriority            INT             NOT NULL DEFAULT 0,

    /* 规则类型 */
    ruleType                ENUM("RULE_RATIO",              /* 满折 */
                                 "RULE_SUBTRACT",           /* 满减 */
                                 "RULE_GIFT"                /* 满赠 */
                                 )          NOT NULL,

    /* 触发本条规则成立的数量单位 */
    conditionUnit           ENUM("AMOUNT",                  /* 金额 */
                                 "PCS"                      /* 件数 */
                                 )          NOT NULL,
    /* 触发本条规则成立的数量 */
    conditionalQty          DECIMAL(16,6)   NOT NULL,

    /**
     * 优惠额度, ruleType为RULE_RATIO时,为折扣比例0.9表示9折
     * ruleType为RULE_SUBTRACT时,为减少的金额
     */
    discountAmount          DECIMAL(12,4)   DEFAULT 0,
    discountRatio           DECIMAL(12,4)   DEFAULT 1.0,

    /* 赠品方案id, ruleType为RULE_GIFT时有效 */
    giftPlanId              BIGINT          DEFAULT NULL,

    /* 启用／禁用标志 */
    isEnabled               BOOL            DEFAULT TRUE,

    /* timestamps */
    createdOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updatedOn               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
