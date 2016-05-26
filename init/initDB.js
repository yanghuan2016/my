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
 * initDB.js
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-29       hc-romens@issue#73      修改dbconfig的获取方式
 *
 */

var logger = __logService;
var underscore = require("underscore");

/**
 * initDB
 *
 * @param connectionLimit, the DB connection number if applied, otherwise it uses the
 *                          sysconfig.db.connectionLimit instead
 */
exports.initDB = function(connectionLimit) {

    logger.enter();

    if (!underscore.isUndefined(connectionLimit)) {
        __dbConfig.connectionLimit = connectionLimit;
    }

    logger.info(__dbConfig.connectionLimit + " DB connection(s) are reserved!");

    var mysql = require('mysql');
    var pool  = mysql.createPool(__dbConfig);

    // TODO: needs to move into app.js
    global.__mysql = pool;
};



