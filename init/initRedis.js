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
 * initRedis.js
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-28    hc-romens@issue#73     created
 */

var logger = __logService;
exports.initRedis = function() {

    logger.enter();

    var redis = require('redis');

    var redisClient = redis.createClient(__redisConfig.port, __redisConfig.host);
    if (__redisConfig.password)
        redisClient.auth(__redisConfig.password);

    redisClient.select(__redisConfig.dbNum);

    global.__redis = redis;
    global.__redisClient = redisClient;
};

