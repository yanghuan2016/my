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
 * mypath.js
 *      识别APPURL的模块
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-29    hc-romens@issue#357   created
 *
 */
var path = require('path');
var logger = __logService;

var ROOTPATH = 'apps';

/**
 * 本函数过滤aPath中apps之前的部分
 *
 *      appName('/home/dialox/scc-src/apps/customer/client')        返回: customer/client
 *
 * @param aPath
 * @returns {string}
 */
function appName(aPath) {
    var pathArray = aPath.split(path.sep);
    while (pathArray.length && pathArray.shift() !== ROOTPATH);
    if (pathArray.length == 0) {
        logger.fatal("This is not a controller!");
        throw "Path " + aPath + " is not a valid app path!";
    }

    return pathArray.join('/');
}

exports.getAppName = appName;
exports.getModelName = appName;