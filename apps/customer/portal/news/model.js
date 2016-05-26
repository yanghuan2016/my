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
         * 获取所有的新闻信息
         * @param customerDB
         * @param paginator
         * @param callback
         */
        getManageNewsLinksAll: function(customerDB, paginator, callback) {
            logger.enter();
            db.newListAll(paginator, customerDB, function (error, result) {
                if(error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                var newsList = underscore(result).map(function(item){
                    var news = {};
                    news.id = item.id;
                    news.title = item.newsTitle;
                    news.date = item.createdOn;
                    return news;
                });
                callback(null, newsList);
            });
        },

        getNewsLinksAll: function(customerDB, paginator, callback) {
            logger.enter();
            db.newListAll(paginator, customerDB, function (error, result) {
                if(error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                var newsList = underscore(result).map(function(item){
                    var news = {
                        id:item.id,
                        newsTitle:item.newsTitle,
                        createdOn:item.createdOn,
                        updatedOn:item.updatedOn
                    };
                    return news;
                });
                callback(null, newsList);
            });
        },


        /**
         * 获取一条新闻信息
         * @param customerDB
         * @param id
         * @param callback
         */
        getNewsLinksOne: function(customerDB, id, callback) {
            logger.enter();
            db.newsRetrieveOne(customerDB, id, function (error, result) {
                callback(error, result);
            });
        },


        /**
         * 增加一条新闻信息
         * @param customerDB
         * @param expectNews
         * @param callback
         */
        postNewsLinksOne: function(customerDB, expectNews, callback) {
            logger.enter();
            db.newsCreateOne(customerDB, expectNews, function (error, result) {
                callback(error, result);
            });
        },

        /**
         * 更新一条新闻信息
         * @param customerDB
         * @param expectNews
         * @param callback
         */
        putNewsLinksOne: function(customerDB, expectNews, callback) {
            logger.enter();
            db.newsUpdateOne(customerDB, expectNews, function (error, result) {
                callback(error, result);
            });
        },

        /**
         * 删除一条新闻信息
         * @param customerDB
         * @param id
         * @param callback
         */
        delNewsLinksOne: function(customerDB, id, callback) {
            logger.enter();
            db.newsDeleteOne(customerDB, id, function (error, result) {
                callback(error, result);
            });
        },

        /**
         * 获取链接数据
         * @param customerDB
         * @param id
         * @param callback
         */
        getListLinksData: function(customerDB, data, id, callback) {
            logger.enter();
            db.listLinks(customerDB, {id: id}, function(error, result){
                if(error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                data.link={
                    title:result[0].name,
                    content:result[0].html
                };
                db.listLinkColumns(customerDB, {id: result[0].columnId}, function(error, linkColumn){
                    if(error) {
                        logger.sqlerr(error);
                        return callback(error);
                    }
                    data.link.columnName=linkColumn[0].columnName;
                    callback(null, data);
                });
            });
        }

    };
    
    return model;
};
