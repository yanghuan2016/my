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
 * database service module: ship.js
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-30    hc-romens@issue#60
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
    var keywordsToArray = require("keywords-array");

    /**
     * SQL for customer DB, abbr. SQL_CT_***
     */

    var SQL_CT_KVLIST_REPLACE = "REPLACE INTO %s.KVList ( aKey, aValue ) VALUES ( '%s', '%s');";
    var SQL_CT_KVLIST_UPDATE = "UPDATE %s.KVList SET aValue='%s' WHERE aKey='%s';";
    var SQL_CT_KVLIST_SELECT = "SELECT aValue FROM %s.KVList WHERE aKey='%s';";
    var SQL_CT_KVLIST_SELECT_ALL=
        "SELECT  " +
        "aKey AS _key, " +
        "aValue AS value, " +
        "KeyAlias AS keyAlias  " +
        "FROM %s.KVList ;";
    var SQL_CT_KVLIST_UPDATE_BATCH="" +
        "INSERT INTO %s.KVList(aKey,aValue) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "aValue=VALUES(aValue)";

    var SQL_CT_DELETE_KVLIST = "DELETE FROM %s.KVList WHERE aKey IN (?, ?, ?, ?, ?, ?);";

    var SQL_CT_INSERT_KVLIST = "INSERT INTO %s.KVList(aKey, KeyAlias, aValue) VALUES %s ;";

    logger.info("Init kvList.js");
    /**
     * DB Service provider
     */
    var dbService = {
        /* All available keys defined here */
        KEYS: {
            /**
             * CONSTANTS
            */
            GOODSTYPES : "GOODSTYPES"

        },

        /**
         * getValue
         *      Get the value by key
         * @param key
         */
        getKeyValue: function(customerDBName, key, callback) {

            logger.enter();
            var sql = sprintf(SQL_CT_KVLIST_SELECT, customerDBName, key);
            logger.sql(sql);

            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    throw err;
                }
                logger.ndump("results", results);

                if (underscore.isEmpty(results))
                    callback(undefined);
                else
                    callback(results[0].aValue);
            });


        },

        /**
         * Set the key and value
         *      Save the KV pair into KVList, if it already exists, update it otherwise insert it.
         * @param key
         * @param value
         */
        setKeyValue: function(customerDBName, key, value, callback) {
            logger.enter();

            var strValue = (typeof value === "object")? JSON.stringify(value): value;

            var sql;
            sql = sprintf(SQL_CT_KVLIST_REPLACE, customerDBName, key, strValue);

            logger.sql(sql);

            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    throw err;
                }

                var success = result.affectedRows > 0 || result.changedRows > 0;
                logger.debug("KVList: Set <key,value> = <" + key + ", " + value + "> " + success ? "success" : "failure");

                callback(success);
            });
        },


        _getValue: function(dbName, key, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_KVLIST_SELECT, dbName, key);
            logger.sql(sql);
            __mysql.query( sql, function(error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else if (underscore.isEmpty(result)) {
                    callback(null, {});
                } else {
                    callback(null, result[0].aValue);
                }
            });
        },

        _setValue: function(dbName, key, value, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_KVLIST_REPLACE, dbName, key, value);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        goodsCategoryRetrieveAll: function(dbName, callback) {
            var key = 'GOODSTYPES';
            this._getValue(dbName, key, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        goodsCategoryUpdateAll: function(dbName, value, callback) {
            var key = 'GOODSTYPES';
            value = (typeof value === "object") ? JSON.stringify(value) : value;
            this._setValue(dbName, key, value, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },


        getAllKV:function(dbName,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_KVLIST_SELECT_ALL, dbName);
            logger.sql(sql);

            __mysql.query(sql,function(err,results){
                 if(err){
                     logger.error(err);
                     callback(err);
                 }
                 else{

                     callback(err,results);
                 }
            });
        },

        batchUpdateKV:function(dbName,updateDatas,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_KVLIST_UPDATE_BATCH,dbName);
            logger.sql(sql);
            logger.debug(JSON.stringify(updateDatas));
            __mysql.query(sql,[updateDatas],function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }


            });
        },

        /**
         * 清除之前的设置信息
         * @param dbName
         * @param kvListData
         * @param callback
         */
        clearKVListInfo: function(dbName, kvListData, callback) {
            logger.enter();
            var condition = [];
            underscore.each(kvListData, function(kvData) {
                condition.push(kvData.aKey);
            });
            var sql = sprintf(SQL_CT_DELETE_KVLIST, dbName );
            logger.sql(sql);
            logger.ndump('condition: ', condition);
            __mysql.query(sql, condition, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },
        /**
         * 添加最新的设置信息
         * @param dbName
         * @param kvListData
         * @param callback
         */
        insertKVlistInfo: function(dbName, kvListData, callback) {
            logger.enter();
            var condition = "";
            underscore.each(kvListData, function(kvData) {
                condition += "('"+ kvData.aKey +"', '"+ kvData.KeyAlias +"', '"+ kvData.aValue +"'),";
            });
            var sql = sprintf(SQL_CT_INSERT_KVLIST, dbName, condition.substring(0, condition.length-1) );
            logger.sql(sql);
            logger.ndump('condition: ', condition);
            __mysql.query(sql, function(err, results) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err, results);
                }
            });
        }


    };

    return dbService;
}
