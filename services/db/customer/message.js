/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

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
     * DB Service provider
     */
    var dbService = {

        /**
         * Post a message to client
         * @param customerDBName
         * @param msg
         * @param callback
         */
        postClientMessage: function (customerDBName, msg, callback) {
            logger.enter();

            var sql = sprintf("" +
                "INSERT INTO %s.Messages(toClientId, messageBody, docType, docId, displayDocId)" +
                "     VALUES (?,?,?,?,?);", customerDBName
            );
            logger.sql(sql);

            __mysql.query(sql, [msg.clientId, msg.msgBody, msg.docType, msg.docId, msg.displayDocId],
                function(err, result){
                    if (err) {
                        logger.sqlerr(err);
                        callback(err);
                    } else {
                        callback();
                    }
                }
            );
        },

        /**
         * Post a message to customer operator
         * @param customerDB
         * @param callback
         */
        postCustomerOperatorMessage: function(customerDBName, msg, callback){
            logger.enter();

            var sql = sprintf("" +
                "INSERT INTO %s.Messages(toOperatorId, messageBody, docType, docId, displayDocId)" +
                "     VALUES (?,?,?,?,?);", customerDBName
            );
            logger.sql(sql);

            __mysql.query(sql, [msg.operatorId, msg.msgBody, msg.docType, msg.docId, msg.displayDocId],
                function(err, result){
                    if (err) {
                        logger.sqlerr(err);
                        callback(err);
                    } else {
                        callback();
                    }
                }
            );
        },

        /**
         * Broadcast a message to the operator, who has the privileges
         * @param customerDBName
         * @param msgBody
         * @param callback
         */
        broadcastMessage: function (customerDBName, msg, callback) {
            logger.enter();

            var sql = sprintf("" +
                "INSERT INTO %s.Messages(toFeature, messageBody, docType, docId, displayDocId)" +
                "     VALUES (?,?,?,?,?);", customerDBName
            );
            logger.sql(sql);

            __mysql.query(sql, [msg.toFeature, msg.msgBody, msg.docType, msg.docId, msg.displayDocId],
                function(err, result){
                    if (err) {
                        logger.sqlerr(err);
                        callback(err);
                    } else {
                        callback();
                    }
                }
            );
        },

        /**
         * 加载当前客户的未读消息数
         * @param customerDBName
         * @param clientId
         * @param callback
         */
        hasNewClientMessage: function(customerDBName, clientId, callback) {
            logger.enter();

            var sql = sprintf("" +
                "SELECT count(*) AS COUNTS FROM %s.Messages " +
                " WHERE toClientId=%d AND status='UNREAD';", customerDBName,
                clientId
            );
            logger.sql(sql);

            __mysql.query(sql, [clientId], function(err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err,result[0]);
                }
            });
        },

        /**
         * 加载操作员的消息数
         * @param customerDBName
         * @param operatorFPs
         * @param operatorId
         * @param callback
         */
        hasNewOperatorMessage: function(customerDBName, operatorId, operatorFPs, callback){
            logger.enter();
            var fpCondition = "false";
            for (var fp in operatorFPs) {
                fpCondition += " OR toFeature LIKE '%" + operatorFPs[fp] + "%'";
            }
            logger.ndump("fpCondition", fpCondition);
            var sql = sprintf("" +
                "SELECT count(*) AS COUNTS FROM %s.Messages " +
                " WHERE (toOperatorId=%d OR (%s)) AND " +
                "       status='UNREAD';", customerDBName,operatorId,fpCondition
            );
            logger.sql(sql);
            __mysql.query(sql, [operatorId, fpCondition], function(err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err,result[0]);
                }
            });
        },

        /**
         * set message read
         * @param customerDBName
         * @param msgId
         * @param operatorId
         * @param callback
         */
        updateMessageStatus: function(customerDBName,msgId,operatorId, callback){
            logger.enter();
            var SQL = "UPDATE %s.Messages set status='READ', firstReadTime=CURRENT_TIMESTAMP," +
                "   firstReadBy=%d WHERE id=%d ;";
            var sql = sprintf(SQL, customerDBName,operatorId,msgId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err,result);
                }
            });
        },


        /**
         * List all the client messages by clientId
         * @param customerDBName
         * @param paginator
         * @param clientId
         * @param startPos
         * @param offset
         * @param callback
         */
        listClientMessages: function(customerDBName,paginator,clientId, startPos, offset, callback){
            logger.enter();

            var categorys = paginator.categoryList;
            var categoryCondition = " ";
            underscore.map(categorys,function(item){
                if(item.value!='%'){
                    categoryCondition += sprintf(" AND %s ='%s' ",item.field,item.value);
                }
            });
            var sql = sprintf("" +
                "  SELECT id,messageBody, docType, docId, displayDocId, " +
                "   DATE_FORMAT(sentTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS sentTime," +
                "   DATE_FORMAT(firstReadTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS firstReadTime," +
                "   firstReadBy,status " +
                "    FROM %s.Messages " +
                "   WHERE (toClientId=?)  %s " +
                "   ORDER BY sentTime DESC " +
                "   LIMIT ?,?;",
                customerDBName,categoryCondition);

            logger.sql(sql);
            __mysql.query(sql, [clientId, startPos, offset], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * List all the messages to operator
         * @param customerDBName
         * @param operatorId
         * @param startPos
         * @param offset
         * @param callback
         */
        listOperatorMessages: function(customerDBName,paginator, operatorId,  callback) {
            logger.enter();
            var categorys = paginator.categoryList;
            var categoryCondition = " ";
            underscore.map(categorys,function(item){
                if(item.value!='%'){
                    categoryCondition += sprintf(" AND %s ='%s' ",item.field,item.value);
                }
            });
            logger.debug("operatorId="+operatorId);
            var sql = sprintf(
                "  SELECT id, messageBody, docType, docId, displayDocId," +
                "   DATE_FORMAT(sentTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS sentTime," +
                "   DATE_FORMAT(firstReadTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS firstReadTime," +
                "   firstReadBy,status " +
                "    FROM %s.Messages " +
                "   WHERE (toOperatorId=?)  %s " +
                "   ORDER BY sentTime DESC " +
                "   ;",
                customerDBName,categoryCondition
            );

            logger.sql(sql);
            __mysql.query(sql, [operatorId], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    logger.debug(JSON.stringify(result));
                    callback(null, result);
                }
            });
        },


        listOperatorFPMessages: function(customerDBName,paginator, operatorFPs, callback) {
            logger.enter();

            var fpCondition = "false";
            for (var fp in operatorFPs) {
                fpCondition += " OR toFeature LIKE '%" + operatorFPs[fp] + "%'";
            }
            logger.ndump("fpCondition", fpCondition);

            var categorys = paginator.categoryList;
            var categoryCondition = " ";
            underscore.map(categorys,function(item){
                if(item.value!='%'){
                    categoryCondition += sprintf(" AND %s ='%s' ",item.field,item.value);
                }
            });

            var sql = sprintf(
                "  SELECT id, messageBody, docType, docId, displayDocId," +
                "   DATE_FORMAT(sentTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS sentTime," +
                "   DATE_FORMAT(firstReadTime,'%%Y-%%m-%%d %%H:%%i:%%S') AS firstReadTime," +
                "   firstReadBy,status " +
                "    FROM %s.Messages " +
                "   WHERE  (%s)  %s " +
                "   ORDER BY sentTime DESC " +
                "  ;",
                customerDBName,fpCondition,categoryCondition
            );

            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        }
    };

    return dbService;
};
