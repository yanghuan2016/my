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
         * 获取底部链接内容
         * @param customerDB
         * @param id
         * @param callback
         */
        getLinkRetrieveOne: function(customerDB, id, callback) {
            logger.enter();
            db.linkRetrieveOne(customerDB, id, function (err, result) {
                callback(err, result);
            });
        },


        /**
         * 添加一条底部链接信息
         * @param customerDB
         * @param linkData
         * @param callback
         */
        postLinkOne: function(customerDB, linkData, callback) {
            logger.enter();
            async.series([
                function (done) {
                    // step1.先查询出当前表格orderSeq的最大值
                    db.selectMaxOrderSeqFromLink(customerDB, linkData.columnId, function (err, result) {
                        if (err) {
                            logger.error(err);
                            return done(err);
                        }
                        var maxOrderSeq = Number(result[0].maxOrderSeq);
                        linkData.orderSeq = maxOrderSeq + 1;
                        done(null, result);
                    });
                },

                function (done) {
                    // step2.添加一条底部链接信息
                    db.linkCreateOne(customerDB, linkData.columnId, linkData.name, linkData.orderSeq, linkData.html, function (err, result) {
                        if (err) {
                            logger.error(err);
                            return done(err);
                        }
                        logger.trace(result);
                        done(null, result);
                    });
                }
            ], function(err, resultList) {
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                logger.ndump(resultList);
                callback(null, resultList);
            });
        },

        /**
         * 删除一条底部链接信息
         * @param customerDB
         * @param linkId
         * @param callback
         */
        delLinkOne: function(customerDB, linkId, callback) {
            logger.enter();
            db.linkRemoveOne(customerDB, linkId, function (error, result) {
                callback(error, result);
            });
        },

        /**
         * 更新一条底部链接信息
         * @param customerDB
         * @param linkData
         * @param callback
         */
        putLinkOne: function(customerDB, linkData, callback) {
            logger.enter();
            db.linkUpdateOne(customerDB, linkData.id, linkData.name, linkData.html, function (err, result) {
                callback(err, result);
            });
        }

    };
    
    return model;
};
