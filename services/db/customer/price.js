/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * database service
 *      价格相关的数据库操作
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-06    hc-romens@issue#79         created
 *
 */
module.exports=function() {

    /**
     * system service handles
     */
    var logger = global.__logService;
    var db = global.__mysql;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");

    /**
     * SQL for customer DB, abbr. SQL_CT_***
     */

    /* For ClientPrice */
    var SQL_CT_CLIENTPRICE_SELECT = "SELECT ClientPrice.goodsId AS goodsId, " +
                                    "       ClientPrice.clientPriace, " +
                                    "       GoodsInfo.commonName, " +
                                    "       GoodsInfo.licenseNo " +
                                    "FROM %s.ClientPrice, %s.GoodsInfo " +
                                    "WHERE ClientPrice.clientId=%d AND ClientPrice.goodsId=GoodsInfo.id " +
                                    "%s " +     // sort by
                                    "%s;";      // limit
    var SQL_CT_CLIENTPRICE_INSERT = "INSERT INTO %s.ClientPrice(clientId, goodsId, clientPrice) VALUES (%d, %d, %f);";
    var SQL_CT_CLIENTPRICE_UPDATE = "UPDATE %s.ClientPrice SET clientPrice=%f WHERE clientId=%d AND goodsId=%d;";
    var SQL_CT_CLIENTPRICE_DELETE_PRICE = "DELETE FROM %s.ClientPrice WHERE clientId=%d AND goodsId=%d;";
    var SQL_CT_CLIENTPRICE_DELETE_CLIENT = "DELETE FROM %s.ClientPrice WHERE clientId=%d;";
    var SQL_CT_CLIENTPRICE_DELETE_GOODS = "DELETE FROM %s.ClientPrice WHERE goodsId=%d;";

    /* For ClientCategoryPrice */
    var SQL_CT_CATEGORYPRICE_SELECT = "";
    var SQL_CT_CATEGORYPRICE_INSERT = "";
    var SQL_CT_CATEGORYPRICE_UPDATE = "";
    var SQL_CT_CATEGORYPRICE_DELETE_PRICE = "";
    var SQL_CT_CATEGORYPRICE_DELETE_CATEGORY = "";
    var SQL_CT_CATEGORYPRICE_DELETE_GOODS = "";

    /* For GoodsPrice */
    var SQL_CT_GOODSPRICE_SELECT = "";
    var SQL_CT_GOODSPRICE_INSERT = "INSERT INTO %s.GoodsPrice (goodsId, wholesalePrice, refRetailPrice, price1, price2, price3) " +
                                   "VALUES (%d, %f, %f, %f, %f, %f);";
    var SQL_CT_GOODSPRICE_UPDATE = "";
    var SQL_CT_GOODSPRICE_DELETE = "";


    var SQL_CT_CLIENTGOODSPRICE_INSERT = "INSERT INTO %s.ClientGoodsPrice(clientId, goodsId,pricePlan,price) " +
                                         "VALUES (%d, %d, '%s', %f);";

    var SQL_CT_CLIENTGOODSPRICE_SELECT = "SELECT " +
        "clientId, goodsId,pricePlan,price " +
        "FROM %s.ClientGoodsPrice " +
        "WHERE clientId = %d AND goodsId IN ?;";

    /**
     * DB Service provider
     */
    var dbService = {

        /**
         *
         * @param customerDBName
         * @param clientId
         * @param goodsId
         * @param callback
         * @constructor
         */
        ClientGoodsPriceList: function(customerDBName,clientId,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTGOODSPRICE_SELECT, customerDBName,
                clientId);

            logger.sql(sql);
            __mysql.query(sql, [[[goodsId]]], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(err, result[0]);
            });
        },

        /**
         * list goods price by paginator
         * @param connect
         * @param customerDBName
         * @param paginator
         * @param callback
         *
         * This method is used to
         */
        GoodsPriceList: function(connect, customerDBName, paginator, callback){

        },

        /**
         * meta operation to get the basic goods price info by goodsId
         * @param connect
         * @param customerDBName
         * @param goodsId
         * @param paginator
         * @param callback
         */
        metaGoodsPriceSelect: function(connect, customerDBName, goodsId, paginator, callback){

        },

        /**
         * Meta operation to insert goods price information
         * @param connect
         * @param customerDBName
         * @param goodsPriceInfo
         * @param callback
         */
        metaGoodsPriceInsert: function(connect, customerDBName, goodsPriceInfo, callback){
            logger.enter();
            logger.ndump("goodsPriceInfo", goodsPriceInfo);

            var sql = sprintf(SQL_CT_GOODSPRICE_INSERT, customerDBName,
                              goodsPriceInfo.goodsId, goodsPriceInfo.wholesalePrice,
                              goodsPriceInfo.refRetailPrice, goodsPriceInfo.price1,
                              goodsPriceInfo.price2, goodsPriceInfo.price3);

            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(err, result.id);
            });
        },

        /**
         * Meta operation to update the goods price information
         * @param connect
         * @param customerDBName
         * @param goodsId
         * @param goodsPriceInfo
         * @param callback
         */
        metaGoodsPriceUpdate: function(connect, customerDBName, goodsId, goodsPriceInfo, callback){

        },

        /**
         * Meta operation to delete a goods price information
         * @param connect
         * @param customerDBName
         * @param goodsId
         * @param callback
         */
        metaGoodsPriceDelete: function(connect, customerDBName, goodsId, callback){

        },

        /**
         * Meta operation to select record from ClientPrice by clientId
         * @param connect
         * @param customerDBName
         * @param clientId
         * @param paginator
         * @param callback
         */
        metaClientPriceSelect: function(connect, customerDBName, clientId, paginator, callback){
            logger.enter();

            /**
             * TODO: Fixme
             */
            var sql = sprintf(SQL_CT_CLIENTPRICE_SELECT, customerDBName, customerDBName, clientId);
            logger.sql(sql);

            connect.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    throw err;
                }

                callback(results);
            });
        },

        /**
         * Meta operation to insert a record in table ClientPrice
         * @param connect
         * @param customerDBName
         * @param clientId
         * @param goodsId
         * @param price
         * @param callback      callback(insertId)
         */
        metaClientPriceInsert: function(connect, customerDBName, clientId, goodsId, price, callback){
            logger.enter();

            var sql = sprintf(SQL_CT_CLIENTPRICE_INSERT, customerDBName, clientId, goodsId, price);
            logger.sql(sql);

            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else {
                    callback(err, result.insertId);
                }
            });
        },

        /**
         * Meta operation to update price in table ClientPrice, by goodsId and clientId
         * @param connect
         * @param customerDBName
         * @param clientId
         * @param goodsId
         * @param price
         * @param callback      callback(affectedRows)
         */
        metaClientPriceUpdate: function(connect, customerDBName, clientId, goodsId, price, callback){
            logger.enter();

            var sql = sprintf(SQL_CT_CLIENTPRICE_UPDATE, customerDBName, price, clientId, goodsId);
            logger.sql(sql);

            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else {
                    callback(err, result.affectedRows);
                }
            });
        },

        /**
         * Meta operation to delete a price in table ClientPrice
         * @param connect
         * @param customerDBName
         * @param clientId
         * @param goodsId
         * @param callback
         */
        metaClientPriceDeletePrice: function(connect, customerDBName, clientId, goodsId, callback){
            logger.enter();

            var sql = sprintf(SQL_CT_CLIENTPRICE_DELETE_PRICE, customerDBName, clientId, goodsId);
            logger.sql(sql);

            connect.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                }else {
                    callback(err, result.affectedRows);
                }
            });
        },

        /**
         * Meta operation to delete a client in table ClientPrice
         * @param connect
         * @param customerDBName
         * @param clientId
         * @param callback
         */
        metaClientPriceDeleteClient: function(connect, customerDBName, clientId, callback){

            logger.enter();

            var sql = sprintf(SQL_CT_CLIENTPRICE_DELETE_CLIENT, customerDBName, clientId);
            logger.sql(sql);

            connect.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    throw err;
                }
                callback(result.affectedRows);
            });
        },

        /**
         * Meta operation to delete a goods in table ClientPrice
         * @param connect
         * @param customerDBName
         * @param goodsId
         * @param callback
         */
        metaClientPriceDeleteGoods: function(connect, customerDBName, goodsId, callback){
            logger.enter();

            var sql = sprintf(SQL_CT_CLIENTPRICE_DELETE_GOODS, customerDBName, goodsId);
            logger.sql(sql);

            connect.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    throw err;
                }
                callback(result.affectedRows);
            });
        },


        /**
         * Meta operation to insert a record in table ClientCategoryPrice
         * @param connect
         * @param customerDBName
         * @param clientCategoryId
         * @param goodsId
         * @param price
         * @param callback
         */
        metaClientCategoryPriceInsert: function(connect, customerDBName, clientCategoryId, goodsId, price, callback){

        },

        /**
         * Meta operation to update a ClientCategoryPrice
         * @param connect
         * @param customerDBName
         * @param clientCategoryId
         * @param goodsId
         * @param price
         * @param callback
         */
        metaClientCategoryPriceUpdate: function(connect, customerDBName, clientCategoryId, goodsId, price, callback){

        },

        /**
         * Meta operation to delete price by clientCategoryId + goodsId combination
         * @param connect
         * @param customerDBName
         * @param clientCategoryId
         * @param goodsId
         * @param callback
         */
        metaClientCategoryPriceDeletePrice: function(connect, customerDBName, clientCategoryId, goodsId, callback){

        },

        /**
         * Meta operation to delete all prices by goodsId
         * @param connect
         * @param customerDBName
         * @param goodsId
         * @param callback
         */
        metaClientCategoryPriceDeleteGoods: function(connect, customerDBName, goodsId, callback) {

        },

        /**
         * Meta operation to delete all price by clientCategoryId
         * @param connect
         * @param customerDBName
         * @param clientCategoryId
         * @param callback
         */
        metaClientCategoryPriceDeleteCategory: function(connect, customerDBName, clientCategoryId, callback) {

        },

        /**
         * metaClientGoodsPriceInsert
         *      meta operation to insert a record into table ClientGoodsPrice
         * @param connect
         * @param customerDBName
         * @param clientGoodsPrice
         * @param callback
         */
        metaClientGoodsPriceInsert: function(connect, customerDBName, clientGoodsPrice, callback){
            logger.enter();

            logger.dump(clientGoodsPrice);

            var sql = sprintf(SQL_CT_CLIENTGOODSPRICE_INSERT,
                              customerDBName,
                              clientGoodsPrice.clientId,
                              clientGoodsPrice.goodsId,
                              clientGoodsPrice.pricePlan,
                              clientGoodsPrice.price
            );

            logger.sql(sql);

            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    throw err;
                }

                callback(null, result.insertId);
            });

        },
        /**
         * 加载goodsIds和clientId所指定的商品价格和价格方案
         * @param customerDBName
         * @param clientId
         * @param goodsIds
         * @param callback
         */
        getClientGoodsPrice: function(customerDBName, clientId, goodsIds, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_CLIENTGOODSPRICE_SELECT, customerDBName,
                clientId);


           

            logger.sql(sql);
            logger.ndump("goodsIds", goodsIds);
            __mysql.query(sql, [[goodsIds]], function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(err, results);
            });
        }
    };

    return dbService;
}
