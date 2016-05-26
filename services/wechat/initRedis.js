var redis           = require('redis');
var config          = require('./config');
var logger          = __logService;

function initRedis() {
    // 存储数据客户端，并挂载到global方便使用
    global.wechatRedisClient = redis.createClient({
        host: config.redis.host,
        port: config.redis.port
    });
    wechatRedisClient.select(config.redis.dbNum);
    wechatRedisClient.on("error", function (err) {
        logger.error('redis get or set时发生了错误'+err);
    });

    // pub/sub客户端
    global.wechatSubClient = redis.createClient({
        host: config.redis.host,
        port: config.redis.port
    });
    wechatSubClient.select(config.redis.dbNum);

    // redis 自动更新到期的token
    // keyspace events功能需要配置
    // subscribe端需要使用单独的链接
    wechatSubClient.psubscribe('__keyevent@' + config.redis.dbNum + '__:expired');
    wechatSubClient.on("error", function (err) {
        logger.error('redis keyspace notification发生错误'+err);
    });
}

module.exports = initRedis;