-- 优惠券
CREATE TABLE Coupon(
        /* coupon id */
        id                  BIGINT              AUTO_INCREMENT PRIMARY KEY,

        /* 促销方案id, @see Promotion.id */
        promotionId         BIGINT              NOT NULL,

        /* 优惠码 */
        couponCode          VARCHAR(32)         UNIQUE NOT NULL,

        /* 优惠码类型，来源 */
        couponType          ENUM("PROMOTION",       /* 促销活动 */
                                 "CUSTOMERSERVICE"  /* 客服生成 */
                                 )              DEFAULT "PROMOTION",

        /* 优惠码状态 */
        couponStatus        ENUM("TAKEN",       /* 已被领取 */
                                 "USED",        /* 已被使用 */
                                 "EXPIRED",     /* 已经过期 */
                                 "CANCELLED"    /* 已被取消 */
                            )                   NOT NULL DEFAULT "TAKEN",

        /* 领用客户id @see Client.id */
        clientId            BIGINT              DEFAULT NULL,

        /* 领取时间 */
        takenAt             TIMESTAMP           DEFAULT 0,
        /* 使用时间 */
        usedAt              TIMESTAMP           DEFAULT 0,
        /* 过期时间, 0标示不过期 */
        expireAt            TIMESTAMP           DEFAULT 0,

        /* 使用的订单号 */
        orderId             BIGINT              DEFAULT NULL,

        /* 发码操作员id, couponType为"CUSTOMERSERVICE"时有效 */
        issuedBy            BIGINT              DEFAULT NULL,

        /* timestamps */
        createdOn           TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
        updatedOn           TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
