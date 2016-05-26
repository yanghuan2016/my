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
 * 2015-09-28    xdw-romens@issue#66
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
     * project modules
     */

    /**
     * SQL for customer DB, abbr. SQL_CT_***
     */
    var SQL_CT_USERLOG_INSERT =
        "INSERT INTO %s.OperatorLog (ipaddr, operatorId, action, log) " +
        "     VALUES ?;";

    var SQL_CT_USERLOG_SELECT =
        "SELECT Operator.operatorName, " +
        "       OperatorLog.ipaddr, " +
        "       OperatorLog.action, " +
        "       OperatorLog.log " +
        "  FROM %s.Operator, " +
        "       %s.OperatorLog " +
        " WHERE Operator.id=OperatorLog.operatorId;";

    /**
     * DB Service provider
     */
    var dbService = {

        /**
         * 用户日志类型定义
         */
        ULOG_ACTION_LOGINOUT    : "LOGINOUT",
        ULOG_ACTION_INFOMODIFY  : "INFOMODIFY",
        ULOG_ACTION_REGISTER    : "REGISTER",
        ULOG_ACTION_CART        : "CART",
        ULOG_ACTION_ORDER       : "ORDER",
        ULOG_ACTION_SHIP        : "SHIP",
        ULOG_ACTION_REJECT      : "REJECT",
        ULOG_ACTION_RETURN      : "RETURN",
        ULOG_ACTION_GOODS       : "GOODS",
        ULOG_ACTION_CLIENT      : "CLIENT",
        ULOG_ACTION_PORTAL      : "PORTAL",
        ULOG_ACTION_ADMIN       : "ADMIN",
        ULOG_ACTION_PROMOTION   : "PROMOTION",
        ULOG_ACTION_OTHER       : "OTHER",


        /**
         * 写用户日志到数据库中
         * @param customerDBName
         * @param ipAddr
         * @param operatorId
         * @param action
         * @param logObj
         * @param callback
         */
        writeUserLog: function( customerDBName, ipAddr, operatorId, action, entityId, logObj, callback) {
            logger.enter();

            var sql = sprintf("SQL_CT_USERLOG_INSERT", customerDBName);
            logger.sql(sql);

            __mysql.query(sql, [ipAddr, operatorId, action, entityId, JSON.stringify(logObj)], function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(null, result.affectedRows);
                }
            });
        },

        /**
         * 加载用户日志
         * @param customerDBName
         * @param operatorId, 过滤条件
         * @param ipaddr, 过滤条件
         * @param action, 过滤条件
         * @param entityId, 过滤条件
         * @param callback
         */
        loadUserLog: function(customerDBName, operatorId, ipaddr, action, entityId, callback){
            // todo
            logger.enter();
            var sql = sprintf(SQL_CT_USERLOG_SELECT, customerDBName);

            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        }
    };

    return dbService;
}