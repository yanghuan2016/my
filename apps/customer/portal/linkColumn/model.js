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
         *
         * @param customerDB
         * @param callback
         */
        getLinksRetrieveAll: function (customerDB, callback) {
            logger.enter();
            db.linksRetrieveAll(customerDB, function (err, results) {
                if (err) {
                    logger.error(err);
                    return callback(err);
                }
                var columns = underscore.chain(results)
                    .groupBy(function (item) {
                        return item.columnId;
                    })
                    .values()
                    .map(function (item) {
                        var links = underscore.chain(item)
                            .filter(function(linkItem){
                                return Number(linkItem.linkIsDeleted)!=1;
                            })
                            .filter(function (linkItem) {
                                return Number(linkItem.linkOrderSeq) >= 1;
                            })
                            .map(function (linkItem) {
                                return underscore.pick(linkItem, 'linkId', "linkName", "linkOrderSeq");
                            })
                            .sortBy(function (linkItem) {
                                return linkItem.linkOrderSeq;
                            })
                            .value();
                        var i = item[0];
                        return {
                            columnId: i.columnId,
                            columnName: i.columnName,
                            columnIcon: i.columnIcon,
                            columnOrderSeq: i.columnOrderSeq,
                            links: links
                        };
                    })
                    .sortBy(function (item) {
                        return item.columnOrderSeq;
                    })
                    .value();

                callback(null, columns);
            });
        },

        /**
         * 获取一个底部位置信息
         * @param customerDB
         * @param id
         * @param callback
         */
        getLinkColumOne: function(customerDB, id, callback) {
            logger.enter();
            db.columnRetrieveOne(customerDB, id, function (err, result) {
                callback(err, result);
            });
        },

        /**
         * 添加一条底部位置信息
         * @param customerDB
         * @param objLinkObj
         * @param callback
         */
        postLinkColumns: function(customerDB, objLinkObj, callback) {
            logger.enter();
            //先查询出当前表格orderSeq的最大值
            db.selectMaxOrderSeqFromLinkColumn(customerDB, function (err, result) {
                if (err) {
                    logger.error(err);
                    return callback(err);
                }
                objLinkObj.orderSeq = (result[0] == null ? -1 : result[0].maxOrderSeq) + 1;
                db.addLinkColumns(customerDB, objLinkObj, function (err, result) {
                    if (err) {
                        logger.error(err);
                        return callback(err);
                    }
                    logger.trace(result);
                    callback(null, result);
                });
            });
        },

        /**
         * 更新一条底部位置信息
         * @param customerDB
         * @param clientId
         * @param updateLinkColumn
         * @param callback
         */
        putLinkColumnOne: function(customerDB, clientId, updateLinkColumn, callback) {
            logger.enter();
            db.linkColumnUpdateOne(customerDB, clientId, updateLinkColumn, function (error, result) {
                callback(error, result);
            });
        },

        /**
         * 删除一条底部位置信息
         * @param customerDB
         * @param id
         * @param callback
         */
        delLinkColumnOne: function(customerDB, id, callback) {
            logger.enter();
            db.linkColumnRemoveOne(customerDB, id, function (error, result) {
                callback(error, result);
            });
        },


        /**
         * 更新底部链接信息
         * @param customerDB
         * @param columns
         * @param links
         * @param callback
         */
        putLinkColumsOrder: function(customerDB, columns, links, callback) {
            logger.enter();
            db.linkColumsOrderUpdate(customerDB, columns, function (error, result) {
                if (error) {
                    logger.error(error);
                    callback(error);
                }
                else {
                    //判断子节点,若子节点不存在就不更新
                    if(links.length==0){
                        return callback(null, result);
                    }
                    db.linksOrderUpdateAll(customerDB, links, function (error, result) {
                        if (error) {
                            logger.error(error);
                            callback(error);
                        }
                        else {
                            callback(null, result);
                        }
                    });
                }
            });
        }

    };
    
    return model;
};
