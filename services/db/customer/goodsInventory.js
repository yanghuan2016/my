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

    var SQL_CT_GOODS_INVENTORY_PLAN_SELECT   = "SELECT " +
        " id," +
        " name," +
        " isDefault," +
        " isSystem, "  +
        " DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn " +
        " FROM %s.GoodsInventoryPlan " +
        " ORDER BY createdOn DESC ;";

    var SQL_CT_GOODS_INVENTORY_PLAN_DETAILS_SELECT   = "SELECT " +
        " GoodsInventoryPlanDetails.id, " +
        " GoodsInventoryPlan.isDefault, " +
        " GoodsInventoryPlanDetails.goodsInventoryPlanId, " +
        " GoodsInventoryPlan.name, " +
        " GoodsInventoryPlanDetails.threshold, " +
        " GoodsInventoryPlanDetails.content " +
        " FROM %s.GoodsInventoryPlanDetails " +
        " LEFT JOIN %s.GoodsInventoryPlan ON GoodsInventoryPlanDetails.goodsInventoryPlanId = GoodsInventoryPlan.id " +
        " ORDER BY GoodsInventoryPlanDetails.threshold ASC;";

    var SQL_CT_GOODS_INVENTORY_PLAN_DETAILS_SELECT_BY_ID   = "SELECT " +
        " GoodsInventoryPlanDetails.id, " +
        " GoodsInventoryPlan.isDefault, " +
        " GoodsInventoryPlanDetails.goodsInventoryPlanId, " +
        " GoodsInventoryPlan.name, " +
        " GoodsInventoryPlanDetails.threshold, " +
        " GoodsInventoryPlanDetails.content " +
        " FROM %s.GoodsInventoryPlanDetails " +
        " LEFT JOIN %s.GoodsInventoryPlan ON GoodsInventoryPlanDetails.goodsInventoryPlanId = GoodsInventoryPlan.id " +
        " WHERE GoodsInventoryPlanDetails.goodsInventoryPlanId = %d "+
        " ORDER BY GoodsInventoryPlanDetails.threshold ASC;";



    var SQL_CT_GOODS_INVENTORY_PLAN_INSERT   = "INSERT INTO %s.GoodsInventoryPlan (name)" +
        " VALUES ('%s') ;";

    var SQL_CT_GOODS_INVENTORY_PLAN_DELETE_DEFAULT   = "UPDATE %s.GoodsInventoryPlan " +
        " SET isDefault=0 ";

    var SQL_CT_GOODS_INVENTORY_PLAN_UPDATE   = "UPDATE %s.GoodsInventoryPlan " +
        " SET %s " +
        " WHERE id=%d ;";

    var SQL_CT_GOODS_INVENTORY_SHOW_PLAN   = "UPDATE %s.GoodsInventory " +
        " SET showPlanId=%d ";

    var SQL_CT_GOODS_INVENTORY_PLAN_DELETE   = "DELETE FROM %s.GoodsInventoryPlan " +
        " WHERE id=%d ;";

    var SQL_CT_GOODS_INVENTORY_PLAN_DETAILS_INSERT   = "INSERT INTO %s.GoodsInventoryPlanDetails (goodsInventoryPlanId,threshold, content ) " +
        " VALUES ? ;";

    var SQL_CT_GOODS_INVENTORY_PLAN_DETAILS_UPDATE   = "INSERT INTO %s.GoodsInventoryPlanDetails (id,threshold, content ) " +
        " VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "id=VALUES(id),threshold=VALUES(threshold),content=VALUES(content);";

    var SQL_CT_GOODS_DISABLE_GOODS = "update %s.GoodsInventory set onSell = 0 where goodsId in (%s)";

    var SQL_CT_GOODS_ENABLE_GOODS = "update %s.GoodsInventory set onSell = 1 where goodsId in (%s)";

    /**
     * DB Service provider
     */
    var dbService = {

        disableGoodsByIds: function (customerDB, goodsIds, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_DISABLE_GOODS, customerDB, goodsIds.toString());
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        enableGoodsByIds: function (customerDB, goodsIds, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_ENABLE_GOODS, customerDB, goodsIds.toString());
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        listAllGoodsInventoryPlan: function(customerDBName,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_SELECT,customerDBName
            );
            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        listGoodsInventoryPlanDetails: function(customerDBName,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_DETAILS_SELECT,
                customerDBName,customerDBName
            );
            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        listGoodsInventoryPlanDetailsById: function(customerDBName,id,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_DETAILS_SELECT_BY_ID,
                customerDBName,customerDBName,id
            );
            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        metaAddGoodsInventoryPlan: function(connect,customerDBName, name, callback){
            logger.enter();

            var sql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_INSERT,customerDBName,name
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results.insertId);
                }
            });

        },

        metaAddGoodsInventoryPlanDetails: function(connect,customerDBName, detailData, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_DETAILS_INSERT,customerDBName);
            logger.sql(sql);
            connect.query(sql, [detailData],function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results.insertId);
                }
            });

        },

        removeInventoryPlan: function(customerDBName,id,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_DELETE,customerDBName,id
            );
            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },
        updateInventoryPlan: function(customerDBName,updateData,id,callback){
            logger.enter();
            var updata = parseUpdateInfo(updateData);
            var deleteDefaultSql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_DELETE_DEFAULT, customerDBName);
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_UPDATE,customerDBName,updata,id );

            logger.sql(deleteDefaultSql);
            __mysql.query(deleteDefaultSql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    logger.sql(sql);
                    __mysql.query(sql, function(err,results){
                        if (err) {
                            logger.sqlerr(err);
                            callback(err);
                        } else {
                            callback(null, results);
                        }
                    });
                }
            });
        },

        updateGoodsInventoryShowPlan: function(customerDBName,id,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_SHOW_PLAN,customerDBName,id );
            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        metaUpdateInventoryPlan: function(connect,customerDBName,updateData,id,callback){
            logger.enter();

            var updata = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_UPDATE,customerDBName,updata,id
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },


        metaUpdateInventoryPlanDetails: function (connect,customerDBName,updataData,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_PLAN_DETAILS_UPDATE,customerDBName
            );
            logger.sql(sql);
            connect.query(sql,[updataData], function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        insertUpdateGoodsInventory: function (customerDbName, goodsInventoryArr, callback) {
            logger.enter();
            var sql = "insert into %s.GoodsInventory(goodsId, amount) values ? on duplicate key update amount = values(amount)";
            sql = sprintf(sql, customerDbName);

            __mysql.query(sql, [goodsInventoryArr], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        }
    };
    function parseUpdateInfo(data){
        logger.enter();
        var result = "";
        if(underscore.isEmpty(data)) {
            return result;
        }

        for(var key in data){
            result += key + "='"+data[key] +"'," ;
        }
        result = result.slice(0,-1);
        return result;
    }

    return dbService;
}