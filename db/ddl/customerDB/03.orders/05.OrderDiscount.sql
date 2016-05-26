/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

CREATE TABLE OrderDiscount(
        /**
         * 订单折扣id
         */
        id                      BIGINT              AUTO_INCREMENT PRIMARY KEY,

        /**
         * 订单号id
         * @see OrderInfo.id
         */
        orderId                 BIGINT              NOT NULL,

        /**
         * 优惠券id
         * @see Coupon.id
         */
        couponId                BIGINT              NOT NULL,

        /**
         * 促销id
         * @see Promotion.id
         * 为NULL时表示优惠码没有关联的促销活动
         */
        promotionId             BIGINT              DEFAULT NULL,

        /**
         * 优惠码
         */
        couponCode              VARCHAR(128)        NOT NULL,

        /**
         * 本优惠码优惠金额
         */
        discountAmount          DECIMAL(12,6)       NOT NULL,

        /**
         * 时间戳
         */
        createdOn               TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
        updatedOn               TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE OrderDiscountDetails(
        /**
         * 订单折扣id
         * @see OrderDiscount.id
         */
        orderDiscountId         BIGINT              NOT NULL,

        /**
         * 商品id
         * @see GoodsInfo.id
         */
        goodsId                 BIGINT              NOT NULL,

        /* timestamps */
        createdOn               TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
        updatedOn               TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
