var logger = global.__logService;
var connection = global.__mysql;
var sprintf = require("sprintf-js").sprintf;
var underscore = require("underscore");


var SQL_CT_COMPLAIN_CREATE_ONE = "" +
    "INSERT INTO " +
    "   %s.Complain " +
    "   (clientId, operatorId, type, content) " +
    "VALUES " +
    "   (%d,     %d,     '%s',    %s);";

var SQl_CT_COMPLAIN_SET_HAS_BEEN_READ = "" +
    "UPDATE " +
    "   %s.Complain " +
    "SET " +
    "   hasBeenRead = 1, " +
    "   readOn = CURRENT_TIMESTAMP " +
    "WHERE " +
    "   id = %d;";

var SQl_CT_COMPLAIN_SET_HAS_BEEN_READ_BY_CLIENTID = "" +
    "UPDATE " +
    "   %s.Complain " +
    "SET " +
    "   hasBeenRead = 1, " +
    "   readOn = CURRENT_TIMESTAMP " +
    "WHERE " +
    "   clientId = %d " +
    "AND " +
    "   type like '%%%s%%' " +
    "AND " +
    "   hasBeenRead = 0; ";

var SQL_CT_COMPLAIN_RETRIEVE_BY_CLIENT_ID = "" +
    "SELECT " +
    "   a.id as id, " +
    "   a.clientId as clientId, " +
    "   a.operatorId as operatorId, " +
    "   a.type as type, " +
    "   a.hasBeenRead as hasBeenRead, " +
    "   a.content as content, " +
    "   DATE_FORMAT(a.readOn,'%%Y-%%m-%%d %%H:%%i:%%S') as readOn, " +
    "   DATE_FORMAT(a.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') as createdOn, " +
    "   b.clientName as clientName, " +
    "   c.operatorName as operatorName " +
    "FROM " +
    "   %s.Complain a " +
    "LEFT  JOIN " +
    "   %s.Client b " +
    "ON " +
    "   a.clientId = b.id " +
    "LEFT  JOIN " +
    "   %s.Operator c " +
    "ON " +
    "   a.operatorId = c.id " +
    "WHERE " +
    "   a.clientId = %d;";

var SQL_CT_COMPLAIN_COUNT_UNREAD_BY_CLIENTID = "" +
    "SELECT " +
    "   count(*) as unreadComplainCount " +
    "FROM " +
    "   %s.Complain " +
    "WHERE " +
    "   clientId = %d " +
    "AND " +
    "   hasBeenRead = 0 " +
    "AND " +
    "   type = 'DOWN' ; ";

var SQL_CT_COMPLAIN_RETRIEVE_LAST_ONE_FROM_EVERY_CLIENT = "" +
    "SELECT " +
    "   a.id, " +
    "   a.clientId, " +
    "   a.operatorId, " +
    "   a.type, " +
    "   a.hasBeenRead, " +
    "   a.content, " +
    "   DATE_FORMAT(a.readOn,'%%Y-%%m-%%d %%H:%%i:%%S') as readOn, " +
    "   DATE_FORMAT(a.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') as createdOn, " +
    "   b.clientCode as clientCode, " +
    "   b.clientName as clientName, " +
    "   c.operatorName as operatorName " +
    "FROM " +
    "   %s.Complain a " +
    "JOIN " +
    "   %s.Client b " +
    "ON " +
    "   a.clientId = b.id " +
    "LEFT JOIN " +
    "   %s.Operator c " +
    "ON " +
    "   a.operatorId = c.id " +
    "WHERE " +
    "   a.id " +
    "IN " +
    "   ( " +
    "   SELECT " +
    "       MAX(id) " +
    "   FROM " +
    "       %s.Complain " +
    "   WHERE " +
    "       type = 'UP' " +
    "   GROUP BY " +
    "       clientId " +
    "   ) " +
    "AND " +
    "   (b.clientName like '%%%s%%'  " +
    "   OR b.clientCode like '%%%s%%' )" +
    "ORDER BY " +
    "   createdOn DESC; ";

var SQL_CT_COMPLAIN_RETRIEVE_LAST_ONE_BY_CLIENT_ID = "" +
    "SELECT " +
    "   id, " +
    "   clientId, " +
    "   operatorId, " +
    "   type, " +
    "   hasBeenRead, " +
    "   content, " +
    "   DATE_FORMAT(readOn,'%%Y-%%m-%%d %%H:%%i:%%S') as readOn, " +
    "   DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') as createdOn " +
    "FROM " +
    "   %s.Complain " +
    "WHERE " +
    "   clientId = %d " +
    "AND " +
    "   type = 'UP' " +
    "ORDER BY " +
    "   createdOn DESC " +
    "LIMIT 1 ; ";


function ComplainService(connection) {
    this.connection = connection;
}

ComplainService.prototype.complainCreateOne = function (dbName, clientId, operatorId, type, content, callback) {
    logger.enter();

    var sql = sprintf(SQL_CT_COMPLAIN_CREATE_ONE, dbName, clientId, operatorId, type, __mysql.escape(content));

    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            return callback(error);
        }
        callback(null, result);
    })
};

ComplainService.prototype.setComplainHasBeenRead = function (dbName, complainId, callback) {
    logger.enter();

    var sql = sprintf(SQl_CT_COMPLAIN_SET_HAS_BEEN_READ, dbName, complainId);

    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            return callback(error);
        }
        callback(null, result);
    });
};

ComplainService.prototype.setComplainHasBeenReadByClientId = function (dbName, clientId, type, callback) {
    logger.enter();

    var sql = sprintf(SQl_CT_COMPLAIN_SET_HAS_BEEN_READ_BY_CLIENTID, dbName, clientId, type);

    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            return callback(error);
        }
        callback(null, result);
    });
};

ComplainService.prototype.complainRetrieveByClientId = function (dbName, clientId, callback) {
    logger.enter();

    var sql = sprintf(SQL_CT_COMPLAIN_RETRIEVE_BY_CLIENT_ID, dbName, dbName, dbName, clientId);

    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            return callback(error);
        }
        callback(null, result);
    });
};

ComplainService.prototype.complainRetrieveLastOneFromEveryClient = function (dbName, clientCodeOrName,callback) {
    logger.enter();

    var sql = sprintf(SQL_CT_COMPLAIN_RETRIEVE_LAST_ONE_FROM_EVERY_CLIENT, dbName, dbName,dbName,dbName,clientCodeOrName,clientCodeOrName);

    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            return callback(error);
        }
        callback(null, result);
    });
};

ComplainService.prototype.complainRetrieveLastOneByClientId = function (dbName, clientId, callback) {
    logger.enter();

    var sql = sprintf(SQL_CT_COMPLAIN_RETRIEVE_LAST_ONE_BY_CLIENT_ID, dbName, clientId);

    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            return callback(error);
        }
        callback(null, result);
    });
};

ComplainService.prototype.complainCountUnreadByClientId = function (dbName, clientId, callback) {
    logger.enter();

    var sql = sprintf(SQL_CT_COMPLAIN_COUNT_UNREAD_BY_CLIENTID, dbName, clientId);

    logger.sql(sql);

    __mysql.query(sql, function(error, result) {
        if (error) {
            logger.sqlerr(error);
            return callback(error);
        }
        return callback(null, result);
    });
};
module.exports = new ComplainService(connection);

