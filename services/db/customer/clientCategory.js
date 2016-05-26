/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports = function () {

    /**
     * system service handles
     */
    var logger = global.__logService;
    var db = global.__dbService;

    /**
     * 3rd party modules
     */
    var underscore = require("underscore");
    var sprintf = require("sprintf-js").sprintf;

    /**
     * SQL template
     */
    var SQL_CT_LIST_CLIENTCATEGORY =
        "SELECT categoryName, id AS categoryId FROM %s.ClientCategory where isDeleted=0;";

    //系统设置=>客户类设置 SQL
    var SQL_CT_CLIENTCATEGORY_RETRIEVE_AVALIABLE =
        "SELECT " +
        "   id, " +
        "   categoryName, " +
        "   categoryDiscount, " +
        "   isBase, " +
        "   createdOn, " +
        "   updatedOn " +
        "FROM " +
        "   %s.ClientCategory " +
        "WHERE " +
        "   isDeleted = 0";
    var SQL_CT_CLIENTCATEGORY_CREATE = "" +
        "insert into " +
        "   %s.ClientCategory( " +
        "   categoryName ) " +
        "values " +
        "   ( '%s' )";
    var SQL_CT_LIST_CLIENTCATEGORY_UPDATE = "" +
        "update " +
        "   %s.ClientCategory " +
        "set " +
        "   categoryName = '%s' " +
        "where " +
        "   id = %d;";
    var SQL_CT_LIST_CLIENTCATEGORY_DISABLE = "" +
        "update " +
        "   %s.ClientCategory " +
        "set " +
        "   isDeleted = 1 " +
        "where " +
        "   id = %d;";

    var SQL_CT_LIST_CLIENTCATEGORY_CHECK_CLIENT_INFO =
        " SELECT clientName  " +
        " FROM %s.Client  " +
        " LEFT JOIN %s.ClientCategory ON ClientCategory.id = Client.clientCategoryId " +
        " WHERE  ClientCategory.id=%d";


    /**
     * DB Service provider
     */
    var dbService = {

        /**
         * Get all client categories
         * @param customerDBName
         * @param done(err, categoryList)
         */
        getClientCategory: function (customerDBName, done) {
            logger.enter();
            var sql = sprintf(SQL_CT_LIST_CLIENTCATEGORY, customerDBName);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                if (err) {
                    logger.sqlerr(err);
                    done(err);
                } else {
                    logger.ndump("results", results);
                    done(null, results);
                }
            });
        },

        /**
         * Add a client category
         * @param customerDBName
         * @param clientCategoryName
         * @param done
         */
        addClientCategory: function (customerDBName, clientCategoryName, done) {
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTCATEGORY_INSERT, customerDBName, clientCategoryName);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    done(err);
                } else {
                    done(null, result.insertId);
                }
            });
        },

        /**
         * Update a client category name
         * @param customerDBName
         * @param clientCategoryId
         * @param newClientCategoryName
         * @param done
         */
        updateClientCategory: function (customerDBName, clientCategoryId, newClientCategoryName, done) {
            logger.enter();
            var sql = sprintf(SQL_CT_LIST_CLIENTCATEGORY_UPDATE, customerDBName, newClientCategoryName);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    done(err);
                } else {
                    done(null, result.affectedRows);
                }
            });
        },
        /**
         * Get All ClientCategory data
         *
         * @param customerDB 数据库名
         * @param callback 回调函数
         */
        clientCategoryRetrieveAvaliable: function (customerDB, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTCATEGORY_RETRIEVE_AVALIABLE, customerDB);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * Add a client category
         * @param dbName 数据库名
         * @param clientCategory 新的客户类名
         * @param callback 回调函数
         */
        clientCategoryCreateOne: function (dbName, clientCategory, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTCATEGORY_CREATE, dbName, clientCategory);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },
        //clientCategoryCreateOne
        /**
         *update the certain ClientCategory Data
         *
         * @param dbName 数据库名
         * @param clientCategoryId 客户类ID
         * @param newClientCategoryName 新的客户类名
         * @param done 回调函数type—>function
         */
        clientCategoryUpdateOne: function (dbName, clientCategoryId, newClientCategoryName, done) {
            logger.enter();
            var sql = sprintf(SQL_CT_LIST_CLIENTCATEGORY_UPDATE, dbName, newClientCategoryName, clientCategoryId);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    done(err);
                } else {
                    done(null, result);
                }
            });
        },
        /**
         * logically delete the ClientCategory
         *
         * @param dbName 数据库名
         * @param clientCategoryId 当下客户类ID
         * @param done 回调函数
         */
        clientCategoryDisableOne: function (dbName, clientCategoryId, done) {
            logger.enter();
            var sql = sprintf(SQL_CT_LIST_CLIENTCATEGORY_DISABLE, dbName, clientCategoryId);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    done(err);
                } else {
                    done(null, result);
                }
            });
        },
        /**
         * check current clientCategory has client info
         * @param dbName
         * @param clientCategoryId
         * @param done
         */
        checkClientInCategoryId: function (dbName, clientCategoryId, done) {
            logger.enter();
            var sql = sprintf(SQL_CT_LIST_CLIENTCATEGORY_CHECK_CLIENT_INFO, dbName, dbName, Number(clientCategoryId));
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    done(err);
                } else {
                    done(null, result);
                }
            });
        },

        insertClientCategoryFromErp: function (customerDbName, clientCategorys, callback) {
            var sql = '' +
                'insert into ' +
                '   %s.ClientCategory ( ' +
                '       erpCode, ' +
                '       categoryName, ' +
                '       ParentGUID, ' +
                '       HelpCode, ' +
                '       isDeleted ' +
                '   ) ' +
                'values ? ' +
                'on duplicate key ' +
                'update ' +
                '   categoryName = values(categoryName),' +
                '   ParentGUID = values(ParentGUID),' +
                '   HelpCode = values(HelpCode),' +
                '   isDeleted = values(isDeleted);';

            sql = sprintf(sql, customerDbName);

            __mysql.query(sql, [clientCategorys], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },
        transactionInsertClientCategoryFromErp: function (connection, customerDbName, clientCategorys, callback) {
            var sql = '' +
                'insert into ' +
                '   %s.ClientCategory ( ' +
                '       erpCode, ' +
                '       categoryName, ' +
                '       ParentGUID, ' +
                '       HelpCode, ' +
                '       isDeleted ' +
                '   ) ' +
                'values ? ' +
                'on duplicate key ' +
                'update ' +
                '   categoryName = values(categoryName),' +
                '   ParentGUID = values(ParentGUID),' +
                '   HelpCode = values(HelpCode),' +
                '   isDeleted = values(isDeleted);';

            sql = sprintf(sql, customerDbName);

            connection.query(sql, [clientCategorys], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },
        transactionUpdateClientCategorySetAllDeleted: function (connection, customerDbName, callback) {
            var sql = 'update %s.ClientCategory set isDeleted = 1;';
            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },
        retrieveClientCategoryInfoByErpCode: function (customerDbName, erpCode, callback) {
            var sql = '' +
                'select' +
                '   id as clientCategoryId, ' +
                '   categoryName as categoryName, ' +
                '   ParentGUID as ParentGUID,' +
                '   HelpCode as HelpCode,' +
                '   categoryDiscount as categoryDiscount,' +
                '   isBase as isBase, ' +
                '   isDeleted as isDeleted ' +
                'from ' +
                '   %s.ClientCategory ' +
                'where ' +
                '   erpCode = "%s";';
            sql = sprintf(sql, customerDbName, erpCode);
            logger.sql(sql);
            __mysql.query(sql, function (error, clientCategory) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, clientCategory);
            });
        }
    };

    return dbService;
};
