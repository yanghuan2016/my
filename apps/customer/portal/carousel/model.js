module.exports = function () {
    var logger = __logService;
    var db = __dbService;
    var MODELNAME = __dirname.split("/").pop();

    var underscore = require("underscore");

    var Paginator = require(__base + '/modules/paginator');
    var KeyMapper = require(__base + '/modules/fieldNameMapper');


    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {
        getPortalInfo:function(callback) {
            callback(null, {});
        },

        /**
         *  获取轮播数据
         * @param customerDB
         * @param data
         * @param callback
         */
        getCarouselRetrieveAll: function(customerDB, data, callback) {
            logger.enter();
            db.carouselRetrieveAll(customerDB, function (error, result) {
                if(error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                data.carousels = underscore(result).map(function(item) {
                    var temp = {};
                    temp.id = item.id;
                    temp.orderSeq = item.orderSeq;
                    temp.imgurl = item.imgUrl;
                    temp.url = item.link;
                    temp.name = item.title;
                    temp.remark = item.remark;
                    temp.beginAt = item.beginAt;
                    temp.endAt = item.endAt;
                    temp.deleted = item.deleted;
                    temp.createdOn = item.createdOn;
                    temp.updatedOn = item.updatedOn;
                    return temp;
                });
                callback(null, data);
            });
        },

        /**
         *
         * @param customerDB
         * @param data
         * @param id
         * @param callback
         */
        getCarouselRetrieveOne: function(customerDB, data, id, callback) {
            logger.enter();
            db.carouselRetrieveOne(customerDB, id, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                var ca = result[0];
                var carousel = {};
                carousel.id = ca.id;
                carousel.imgurl = ca.imgUrl;
                carousel.name = ca.title;
                carousel.url = ca.link;
                carousel.beginAt = moment(ca.beginAt).format('YYYY-MM-DD HH:mm');
                carousel.endAt = moment(ca.endAt).format('YYYY-MM-DD HH:mm');
                carousel.remark = ca.remark;
                carousel.orderSeq = ca.orderSeq;
                carousel.displayText=ca.displayText;
                data.carousel = carousel;

                callback(null, data);
            });
        },

        /**
         *
         * @param customerDB
         * @param caData
         * @param callback
         */
        postCarouselInfo: function(customerDB, caData, callback) {
            logger.enter();
            db.selectMaxOrderSeqFromCarousel(customerDB, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                caData.orderSeq = Number(result[0].maxOrderSeq) + 1;
                db.carouselCreateOne(customerDB,
                    caData.orderSeq, caData.title, caData.imgUrl, caData.link,
                    caData.beginAt, caData.endAt, caData.remark, caData.displayText, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);

                    }
                    logger.trace(result);
                    callback(null, result);
                })
            });
        },

        /**
         * 更新一条轮播数据
         * @param customerDB
         * @param caData
         * @param callback
         */
        putCarouselOne: function(customerDB, caData, callback) {
            logger.enter();
            db.carouselUpdateOne(customerDB,
                caData.id, caData.title, caData.imgUrl, caData.link,
                caData.beginAt, caData.endAt, caData.remark, caData.displayText, function (error, result) {
                if (error) {
                    return callback(error);
                }
                callback(null, result);
            });
        },

        /**
         * 删除一条轮播数据
         * @param customerDB
         * @param delId
         * @param callback
         */
        delCarouselOne: function(customerDB, delId, callback) {
            logger.enter();
            db.carouselDeleteOne(customerDB, delId, function (error, result) {
                if (error) {
                    return callback(error);
                }
                callback(null, result);
            });
        },

        /**
         * 更新轮播 OrderSeq 数据
         * @param customerDB
         * @param currentOrderSeq
         * @param currentId
         * @param callback
         */
        putCarouselOrderSeq: function(customerDB, currentOrderSeq, currentId, callback) {
            logger.enter();
            db.updateCarouselOrderSeq(customerDB, currentOrderSeq, currentId, function(error,result){
                callback(error, result);
            })
        }


    };

    return model;
};
