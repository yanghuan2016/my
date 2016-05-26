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
 * 2015-09-18    hc-romens@issue#22
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


    var SQL_CT_OPERATOR_SELECT_BY_MOBILE = "SELECT " +
        "Operator.id AS operatorId, " +
        "Operator.operatorName, " +
        "Operator.operatorType, " +
        "Operator.clientId, " +
        "Operator.username " +
        "FROM %s.Operator " +
        "WHERE username='%s' AND  mobileNum='%s';";


    var SQL_CT_OPERATOR_SELECT = "SELECT  DISTINCT " +
        "Operator.id AS operatorId, " +
        "Operator.operatorName, " +
        "Operator.operatorType, " +
        "Operator.clientId, " +
        "Operator.customerId, " +
        "Operator.username, " +
        "Client.readOnly, " +
        "Client.clientName, " +
        "Client.enabled	" +
        "FROM %s.Operator " +
        "LEFT JOIN %s.Client ON Operator.clientId = Client.id " +
        "WHERE username='%s' AND password='%s';";

    var SQL_CT_OPERATOR_RETRIEVE_BY_UID_PWD = "" +
        "SELECT " +
        "   id AS operatorId, " +
        "   operatorName, " +
        "   operatorType, " +
        "   clientId, " +
        "   customerId, " +
        "   enable,	" +
        "   username	" +
        "FROM " +
        "   %s.Operator " +
        "WHERE " +
        "   username='%s' AND password='%s';";

    var SQL_CT_OPERATOR_SELECT_BY_ID = "SELECT  DISTINCT " +
        "Operator.id AS operatorId, " +
        "Operator.operatorName, " +
        "Operator.operatorType, " +
        "Operator.customerId," +
        "Operator.clientId," +
        "Operator.password, " +
        "Client.readOnly, " +
        "Client.clientName, " +
        "Client.enabled, " +
        "Client.paymentType, " +
        "Operator.enable AS operatorEnabled " +
        "FROM %s.Operator " +
        "LEFT JOIN %s.Client ON Operator.clientId = Client.id " +
        "WHERE Operator.id = %d ";
    var SQL_CT_INSERT_OPERATOR = "INSERT INTO %s.Operator(operatorRoles,username,mobileNum,operatorName,department," +
        "enable,operatorType,customerId,password) " +
        "VALUES ('%s','%s','%s','%s','%s','%s','%s','%s','%s');";

    var SQL_CT_OPERATOR_SELECT_BY_CLIENTID = "SELECT id AS operatorId, operatorName, operatorType, username,password " +
        "FROM %s.Operator " +
        "WHERE clientId= %d;";

    var SQL_CT_CLIENT_SELECT_BY_ID = "SELECT id, clientId " +
        "FROM %s.Operator " +
        "WHERE id=%d;";

    var SQL_CT_OPERATOR_SELECT_BY_OPEARATORID_AND_PASSWORD="SELECT id AS operatorId, operatorName, operatorType, username " +
        "FROM %s.Operator " +
        "WHERE id= %d AND password='%s' ;";

    var SQL_CT_CUSTOMER_OPERATOR_SELECT = "SELECT id AS operatorId, operatorName, operatorType, username,password " +
        "FROM %s.Operator " +
        "WHERE id= %d;";

    var SQL_CT_ALL_CUSTOMER_OPERATOR_SELECT =
        "SELECT Operator.id AS operatorId, " +
        "       Operator.operatorName, " +
        "       Operator.operatorType, " +
        "       Operator.clientId, " +
        "       Operator.username, " +
        "       Operator.password, " +
        "       Operator.customerId, " +
        "       Operator.department, " +
        "       Operator.enable, " +
        "       Operator.citizenIdNum, " +
        "       Operator.mobileNum, " +
        "       Operator.email " +
        "  FROM %s.Operator " +
        " WHERE operatorType='CUSTOMER' " +
        "ORDER BY operatorName;";


    var SQL_CT_CUSTOMER_OPERATOR_SELECT_BY_ID = "SELECT  " +
        " Operator.id AS operatorId, " +
        " Operator.operatorName, " +
        " Operator.operatorType, " +
        " Operator.clientId, " +
        " Operator.username, " +
        " Operator.password, " +
        " Operator.customerId, " +
        " Operator.department, " +
        " Operator.enable, " +
        " Operator.citizenIdNum, " +
        " Operator.mobileNum, " +
        " Operator.email, " +
        " Operator.operatorRoles " +
        " From %s.Operator " +
        " WHERE Operator.id = %d;";

    var SQL_CT_OPERATOR_UPDATE_BY_ID   = "UPDATE %s.Operator " +
        "SET %s " +
        "WHERE id=%d;";
    var SQL_CT_OPERTOR_UPDATE_BY_CUSTOMERID="UPDATE %s.Operator " +
        "SET %s " +
        "WHERE id=%d;";

    var SQL_CT_CUSTOMER_OPERATOR_LOGIN =
        "SELECT Operator.id AS operatorId," +
        "       Operator.username," +
        "       Operator.password," +
        "       Operator.failCount," +
        "       Operator.operatorName, " +
        "       Operator.operatorType, " +
        "       Operator.operatorRoles, " +
        "       Operator.mobileNum, " +
        "       Operator.customerId, " +
        "       UNIX_TIMESTAMP(CURRENT_TIMESTAMP)-UNIX_TIMESTAMP(Operator.updatedOn) AS bannedTime " +
        "  FROM %s.Operator,%s.Customer " +
        " WHERE Operator.operatorType='CUSTOMER' AND " +
        "       Operator.customerId=Customer.id AND " +
        "       Operator.username='%s';";

    var SQL_CT_CLIENT_OPERATOR_LOGIN =
        "SELECT Operator.id AS operatorId," +
        "       Operator.username," +
        "       Operator.password, " +
        "       Operator.failCount, " +
        "       Operator.operatorName, " +
        "       Operator.operatorType, " +
        "       Operator.operatorRoles, " +
        "       Operator.clientId, " +
        "       Operator.customerId, " +
        "       Client.clientName AS clientName, " +
        "       UNIX_TIMESTAMP(CURRENT_TIMESTAMP)-UNIX_TIMESTAMP(Operator.lastFailureAt) AS bannedTime " +
        "  FROM %s.Operator,%s.Client " +
        " WHERE Operator.operatorType='CLIENT' AND " +
        "       Operator.clientId=Client.id AND" +
        "       Operator.username='%s';";

    var SQL_CT_OPERATOR_LOGIN_SUCCESS =
        "UPDATE %s.Operator " +
        "   SET failCount=0," +
        "       lastSuccessIPAddr='%s'," +
        "       lastSuccessAt=CURRENT_TIMESTAMP " +
        " WHERE username='%s';";

    var SQL_CT_OPERATOR_LOGIN_FAILURE =
        "UPDATE %s.Operator " +
        "   SET failCount=failCount+1," +
        "       lastFailureIPAddr='%s'," +
        "       lastFailureAt=CURRENT_TIMESTAMP " +
        " WHERE username='%s';";

    var SQL_CT_INSERT_OPERATORLOG = "INSERT INTO " +
        " %s.OperatorLog ( operatorId, ipAddr, actionType, entityId, log ) VALUES (%s, '%s', '%s', '%s', '%s'); ";

    var SQL_CT_SELECT_OPERATORLOG = "SELECT " +
        " OperatorLog.operatorId, OperatorLog.ipAddr, OperatorLog.actionType, OperatorLog.entityId, OperatorLog.log, OperatorLog.createdOn " +
        " FROM %s.OperatorLog, %s.Operator " +
        " WHERE OperatorLog.operatorId = Operator.id " +
        " %s " +            // 若操作人是‘CLIENT’，则仅筛选CLIENT类型的日志
        " AND Operator.operatorName LIKE '%%%s%%' " +
        " %s ;";            // limit 分页

    var SQL_CT_OPERATOR_RETRIEVE_CUSTOMER_ID = "select customerId from %s.Operator where id = %d; ";

    var SQL_CT_OPERATORS_CREATE = "" +
        "insert %s.Operator( " +
        "   guid, " +
        "   username, " +
        "   password, " +
        "   operatorType, " +
        "   customerId, " +
        "   operatorCode, " +
        "   enable, " +
        "   operatorName, " +
        "   citizenIdNum) " +
        "values ? " +
        "on duplicate key " +
        "update " +
        "   operatorName = values(operatorName), " +
        "   enable = values(enable), " +
        "   operatorName = values(operatorName); ";

    //根据operatorName 查询Operator
    var SQL_CT_RETRIVE_OPERATOR_BY_NAME="" +
        "SELECT " +
        "  id AS id, " +
        "  operatorName AS operatorName " +
        "FROM " +
        "  %s.Operator " +
        "WHERE " +
        "  operatorName='%s'";

    var SQL_CT_ADD_SYSTEMROBOT="" +
        "INSERT INTO  " +
        "%s.Operator(username,password,operatorName) " +
        "VALUES('%s','%s','%s') " +
        "";

    /**
     * DB Service provider
     */
    var dbService = {
        //获取是否有自动处理收货的机器人管理员账号,该方法目前只有离线自动收货的时候用到
        systemRobotOperatorRetrieve:function(customerDBName,operatorName,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_RETRIVE_OPERATOR_BY_NAME,customerDBName,operatorName);
            logger.sql(sql);

            __mysql.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,result);
                }
            })
        },
        //插入新的Operator,该方法目前只有离线自动收货的时候用到
         insertNewOperator:function(customerDBName,userName,passWord,operatorName,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_ADD_SYSTEMROBOT,customerDBName,userName,passWord,operatorName);
             logger.sql(sql);

             __mysql.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,result.insertId);
                }
             });
         },
        operatorCreateByBatch: function (customerDbName, operators, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_OPERATORS_CREATE, customerDbName);
            logger.sql(sql);

            __mysql.query(sql, [operators], function (error, result) {
                if (error) {
                    logger.error(error);
                    return error;
                }

                callback(null, result);
            });

        },



        retrieveCustomerIdByOperatorId: function (dbName, operatorId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_OPERATOR_RETRIEVE_CUSTOMER_ID, dbName, operatorId);
            logger.sql(sql);

            __mysql.query(sql, function (error, results) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }

                callback(null, results[0].customerId);
            });
        },

        /**
         * 按照Operator.username加载商户操作员信息
         * @param cloudDBName
         * @param customerDBName
         * @param username
         * @param callback
         */
        loadCustomerOperatorInfo: function(cloudDBName, customerDBName, username, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CUSTOMER_OPERATOR_LOGIN, customerDBName, cloudDBName, username);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(null, results);
                }
            });
        },
        /**
         * 按照操作员username加载客户操作员信息
         * @param customerDBName
         * @param username
         * @param callback
         */
        loadClientOperatorInfo: function(customerDBName, username, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENT_OPERATOR_LOGIN, customerDBName, customerDBName, username);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        /**
         * 登录成功后，清除错误计数
         * @param customerDBName
         * @param operatorName
         * @param ipAddr
         * @param callback
         */
        updateOperatorLoginOnSuccess: function(customerDBName, operatorName, ipAddr, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_OPERATOR_LOGIN_SUCCESS, customerDBName, ipAddr, operatorName);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result.affectedRows);
                }
            });
        },

        /**
         * 登录失败，增加错误计数
         * @param customerDBName
         * @param operatorName
         * @param ipAddr
         * @param callback
         */
        updateOperatorLoginOnFailure: function(customerDBName, operatorName, ipAddr, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_OPERATOR_LOGIN_FAILURE, customerDBName, ipAddr, operatorName);
            logger.sql(sql);
            __mysql.query(sql, function(err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result.affectedRows);
                }
            });
        },

        /**
         * 添加操作员日志
         * @param customerDB
         * @param logContent
         * @param callback
         */
        insertOperatorLog: function(customerDB, logContent, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_OPERATORLOG, customerDB,
                logContent.operatorId,
                logContent.ipAddr,
                logContent.actionType,
                logContent.entityId,
                JSON.stringify(logContent.log)
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        /**
         * 获取所有操作员日志
         * @param customerDB
         * @param callback
         */
        selectOperatorLog: function(customerDB, isClient, operatorName, paginator, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_OPERATORLOG,
                customerDB,
                customerDB,
                isClient ? " AND Operator.operatorType='CLIENT' AND Operator.operatorName='"+operatorName+"'" : "",
                operatorName,
                paginator.limit()
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    underscore.map(results, function(result){
                        result.log = JSON.parse(result.log);
                    });
                    callback(null, results);
                }
            });
        },

        verifyMobile: function (customerDBName, username, mobile, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_OPERATOR_SELECT_BY_MOBILE, customerDBName, username, mobile);
            logger.sql(sql);

            __mysql.query(sql, function (err, results, fields) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"sql err");
                }else{
                    callback(null,results);
                }
            });
        },

        operatorLoginCheck: function (customerDB, operatorName, password, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_OPERATOR_RETRIEVE_BY_UID_PWD, customerDB, operatorName, password);

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },


        getOperatorByClientIdAndPassword:function(customerDBName,operatorData,password,callback){
            logger.enter();
            //CUSTOMER 或者 CLIENT 在OPERATOR表里面 都有OPERATORID
            var sql=sprintf(SQL_CT_OPERATOR_SELECT_BY_OPEARATORID_AND_PASSWORD, customerDBName, operatorData.operatorId,password);
            logger.sql(sql);
            __mysql.query(sql, function (err, results, fields) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results[0]);
                }
            });


        },
        getAllOperator: function(customerDBName,callback){
          logger.enter();
            var sql = sprintf(SQL_CT_ALL_CUSTOMER_OPERATOR_SELECT, customerDBName);
            logger.sql(sql);

            __mysql.query(sql, function (err, results) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(null,results);
                }
            });
        },

        getCustomerOperatorById: function(customerDBName,operatorId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CUSTOMER_OPERATOR_SELECT_BY_ID, customerDBName,operatorId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(null,results[0]);
                }
            });
        },

        /**
         * 获取用操作员id获取操作员信息
         * @param customerDBName
         * @param operatorData
         * @param callback
         */
        getOperatorByClientId: function(customerDBName,operatorData,callback) {
            logger.enter();
            if(underscore.isEmpty(operatorData.clientId)){
                var id = operatorData.operatorId;
                var sql = sprintf(SQL_CT_OPERATOR_SELECT_BY_ID,customerDBName,customerDBName, Number(id));
            }else{
                var clientId = operatorData.clientId;
                var sql = sprintf(SQL_CT_OPERATOR_SELECT_BY_CLIENTID, customerDBName, Number(clientId));
            }
            logger.sql(sql);
            __mysql.query(sql, function (err, results, fields) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results[0]);
                }
            });
        },

        getOperatorById: function(customerDBName,operatorId,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_OPERATOR_SELECT_BY_ID, customerDBName,customerDBName, Number(operatorId));
            logger.sql(sql);
            __mysql.query(sql, function (err, results, fields) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"sql err")
                }else{
                    callback(null,results[0]);
                }
            });
        },

        insertOperatorInfo: function(customerDBName,operatorInfo,callback) {
            logger.enter();
            //var operatorData = parseInsertInfo(operatorInfo);
            //console.log('operatorData');
            //console.log(operatorData);
            var sql = sprintf(SQL_CT_INSERT_OPERATOR, customerDBName, operatorInfo.operatorRoles,operatorInfo.username,
                operatorInfo.mobileNum,operatorInfo.operatorName,operatorInfo.department,
                operatorInfo.enable,operatorInfo.operatorType,operatorInfo.customerId,operatorInfo.password);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results.insertId);
                }

            });
        },


        updateOperatorInfo: function(customerDBName,operatorInfo,operatorId,callback) {
            logger.enter();
            var operatorData = parseUpdateInfo(operatorInfo);

            var sql = sprintf(SQL_CT_OPERATOR_UPDATE_BY_ID, customerDBName, operatorData,Number(operatorId));
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results.affectedRows);
                }

            });
        },
        transactionInsertOperator: function (connection, customerDbName, insertObj, callback) {
            logger.enter();
            //insertObj = {
            //    username: clientItemInfo.mobile,
            //    password: clientItemInfo.mobile,
            //    customerId: enterpriseId,
            //    clientId: clientId,
            //    operatorName: clientItemInfo.clientName,
            //    mobileNum: clientItemInfo.mobile,
            //    email: clientItemInfo.email
            //};
            var sql = "" +
                "insert %s.Operator(" +
                "   username, " +
                "   password, " +
                "   customerId, " +
                "   clientId, " +
                "   operatorName, " +
                "   mobileNum, " +
                "   email) " +
                "values( " +
                "   '%s', '%s', %d, %d, '%s', '%s', '%s');";
            sql = sprintf(sql, customerDbName,
                insertObj.username,
                insertObj.password,
                insertObj.customerId,
                insertObj.clientId,
                insertObj.operatorName,
                insertObj.mobileNum,
                insertObj.email
            );
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },
        getClientIdById: function(customerDbName, id, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENT_SELECT_BY_ID, customerDbName, id);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,results);
                }
            });
        }
    };

    function parseInsertInfo(data){
        logger.enter();
        var result = {keys:"",values:""};
        for(var key in data){
            if(data[key]) {
                result.keys += key + "," ;
                result.values += data[key]+ ",";
            }
        }
        result.keys = result.keys.slice(0,-1);
        result.values = result.values.slice(0,-1);
        return result;
    }

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
