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
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-25    hc-romens@issue#22
 *
 */
module.exports=function(){

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
     * SQL
     */
    var SQL_CT_GOODSTYPES_SELECT =
        "SELECT parentErpId, erpId, level, name, fullname, IFNULL(displayOrder,2147483648), isDeleted " +
        "  FROM %s.GoodsTypes " +
        "  WHERE isDeleted=FALSE " +
        "  ORDER BY displayOrder ;";

    var SQL_CT_GOODSTYPESLIST_SELECT =
        "SELECT parentErpId, erpId, level, name, fullname, IFNULL(displayOrder,2147483648), isDeleted " +
        "  FROM %s.GoodsTypes " +
        "  ORDER BY displayOrder ;";

    var SQL_CT_GOODSTYPES_FULLNAME_UPDATE =
        "INSERT INTO %s.GoodsTypes (erpId, fullname) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "erpId=VALUES(erpId), fullname=VALUES(fullname);";

    var SQL_CT_GOODSTYPES_UPDATE =
        "INSERT INTO %s.GoodsTypes (erpId, name, fullname, parentErpId, level) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "erpId=VALUES(erpId), name=VALUES(name), fullname=VALUES(fullname), parentErpId=VALUES(parentErpId), level=VALUES(level);";

    var SQL_CT_GOODSTYPES_INSERT =
        "INSERT INTO %s.GoodsTypes (name, fullname, parentErpId, level) " +
        "VALUES ('%s', '%s', %d, %d);";

    var SQL_CT_GOODSTYPES_UPDATE_ODRER =
        "INSERT INTO %s.GoodsTypes (displayOrder, erpId) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "displayOrder=VALUES(displayOrder), erpId=VALUES(erpId);";

    var SQL_CT_GOODSTYPES_DELETE =
        "UPDATE %s.GoodsTypes " +
        "SET isDeleted=%d " +
        "WHERE erpId=%d";

    var SQL_CT_GOODSTYPES_CHECK_IN_ERPID =
        " SELECT goodsId  " +
        " FROM %s.GoodsTypeMap  " +
        " LEFT JOIN %s.GoodsTypes ON GoodsTypes.id = GoodsTypeMap.goodsTypeId  " +
        " WHERE GoodsTypes.erpId = %s;";
    /**
     * DB Service provider
     */
    var dbService = {
        GoodsTypesHelperFields: ["id","level","parentId","name","hierarchyName"],

        /**
         * List all goodsTypes from GoodsTypes table
         * @param customerDBName
         * @param callback
         */
        listGoodsTypes: function(customerDBName, callback){
            logger.enter();

            var sql = sprintf(SQL_CT_GOODSTYPES_SELECT, customerDBName);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        },
        listGoodsAllTypes: function(customerDBName, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODSTYPESLIST_SELECT, customerDBName);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * 批量更新GoodsTypes的fullname
         * @param customerDBName
         * @param newFullnames, [ [erpId, fullname], [erpId, fullname], ...]
         * @param callback
         */
        updateGoodsTypeFullnames: function(customerDBName, newFullnames, callback) {
            logger.enter();
            if (underscore.isEmpty(newFullnames)) {
                logger.trace("newFullname is empty");
                callback(null);
                return;
            }
            var sql = sprintf(SQL_CT_GOODSTYPES_FULLNAME_UPDATE, customerDBName);
            __mysql.query(sql, [newFullnames], function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });

        },

        /**
         * 增加一个商品类别
         * @param customerDBName
         * @param data // { name: '中西药品',fullname: '中西药品>儿童用药',parentErpId: '20',level: '2' }
         * @param callback
         */
        updateGoodsCategoryOne : function(customerDBName, data, callback){
            logger.enter();
            logger.debug(typeof data.erpId);
            if(typeof data.erpId != "undefined"){
                var values = underscore.values(data);
                var sql = sprintf(SQL_CT_GOODSTYPES_UPDATE, customerDBName);
                logger.sql(sql);
                logger.debug(values);
                __mysql.query(sql, [[values]], function(err,result){
                    if (err) {
                        logger.sqlerr(err);
                        callback(err);
                    } else {
                        callback(err, result);
                    }
                });
            }else{
                var sql = sprintf(SQL_CT_GOODSTYPES_INSERT, customerDBName, data.name, data.fullname, data.parentErpId, data.level);
                logger.sql(sql);
                __mysql.query(sql, function(err,result){
                    if (err) {
                        logger.sqlerr(err);
                        callback(err);
                    } else {
                        callback(err, result);
                    }
                });
            }

        },
        /**
         * 禁用启用一个商品类别
         * @param customerDBName
         * @param data
         * @param callback
         */
        forbiddenGoodsCategoryOne: function(customerDBName, data, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODSTYPES_DELETE, customerDBName, data.isDeleted, data.erpId);
            logger.sql(sql);
            __mysql.query(sql, function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },
        /**
         * 检查该类别下面是否有商品存在
         * @param customerDBName
         * @param data
         * @param callback
         */
        checkGoodsInErpId: function (customerDBName, erpId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_GOODSTYPES_CHECK_IN_ERPID, customerDBName, customerDBName, erpId);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result);
                }
            });
        },
        /**
         * 更新商品类别顺序
         * @param customerDBName
         * @param data
         * @param callback
         */
        updateDisplayOrderGoodsCategoryOne: function(customerDBName, data, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODSTYPES_UPDATE_ODRER, customerDBName);
            logger.sql(sql);
            __mysql.query(sql, [data], function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },
    
        insertUpdateGoodsTypesFromErp: function (customerDbName, goodsTypes, callback) {
            logger.enter();
            var sql = "" +
                "insert into " +
                "   %s.GoodsTypes(" +
                "       erpId, " +
                "       name, " +
                "       helpCode, " +
                "       parentErpId, " +
                "       LBID ) " +
                "values ? " +
                "on " +
                "   duplicate key " +
                "update " +
                "   name = values(name), " +
                "   helpCode = values(helpCode), " +
                "   parentErpId = values(parentErpId), " +
                "   LBID = values(LBID) ;";

            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            __mysql.query(sql, [goodsTypes], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            })
        },

        transactionInsertUpdateGoodsTypesFromErp: function (connection, customerDbName, goodsTypes, callback) {
            logger.enter();
            var sql = "" +
                "insert into " +
                "   %s.GoodsTypes(" +
                "       erpId, " +
                "       name, " +
                "       helpCode, " +
                "       parentErpId, " +
                "       LBID, " +
                "       isDeleted ) " +
                "values ? " +
                "on " +
                "   duplicate key " +
                "update " +
                "   name = values(name), " +
                "   helpCode = values(helpCode), " +
                "   parentErpId = values(parentErpId), " +
                "   LBID = values(LBID), " +
                "   isDeleted = values(isDeleted) ;";

            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            connection.query(sql, [goodsTypes], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            })
        },

        transactionUpdateGoodsTypesSetAllDeleted: function (connection, customerDbName, callback) {
            logger.enter();
            var sql = "update %s.GoodsTypes set isDeleted = 1;";
            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            })
        }
    };

    return dbService;
}