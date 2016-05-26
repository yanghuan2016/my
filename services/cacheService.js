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

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");
    var async = require("async");

    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;

    /**
     * CACHE Service provider
     */
    var cacheService = {

        /**
         * 用于区分不同用户的redis 命名前缀
         */
        Prefix: __cacheConfig.prefix,

        /**
         * 所有的预设缓存keys
         */
        CacheKeys: {
            GoodsTypesInJSON: "goodsTypesInJSON",
            ERP: "ERP",
            /**
             * 离线任务上次同步时间戳
             */
            TASK_LastLoadTime: "TASK_LastLoadTime",
            /**
             * Redis PubSub Channel List
             */
            PubSubChannelList: "PubSubChannelList",
        },

        /**
         * 默认的缓存时间
         */
        TTL: underscore.clone(__cacheConfig.TTL),

        /**
         * 删除一个cache缓存
         * @param key
         * @param callback
         */
        deleteCache: function (key, callback) {
            logger.enter();
            if (__cacheConfig.enabled == false) {
                callback(FBCode.CACHEDISABLED);
                return;
            }

            // if (!underscore.has(cacheService.CacheKeys, key)){
            //     logger.error("Cache key: " + key + " is not defined in CacheKeys[]");
            //     callback(FBCode.CACHEKEYNOTALLOWED);
            //     return;
            // }

            __redisClient.del(cacheService.Prefix + "_" + key, function (err) {
                logger.enter();
                if (err) {
                    logger.error(err);
                    callback(FBCode.REDISERR);
                } else {
                    callback(FBCode.SUCCESS);
                }
            });
        },

        deleteAll: function (wildcard, callback) {
            logger.enter();
            if (!__cacheConfig.enabled) {
                logger.warn("Cache service is disabled");
                return callback(FBCode.CACHEDISABLED);
            }
            __redisClient.keys(cacheService.Prefix + "_" + wildcard, function (err, keys) {
                if (err) {
                    logger.error(err);
                    callback(FBCode.REDISERR);
                } else {
                    async.mapSeries(keys,
                        [
                            function (key, done) {
                                __redisClient.del(key, function (err) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    done(null);
                                });
                            }
                        ],
                        function (err, resultList) {
                            callback();
                        }
                    );
                }
            });
        },

        /**
         * 读取key指定的缓存数据
         * @param key
         * @param callback
         */
        get: function (key, callback) {
            logger.enter();
            if (__cacheConfig.enabled == false) {
                logger.warn("Cache service is disabled");
                callback(FBCode.CACHEDISABLED);
                return;
            }

            // if (!underscore.has(cacheService.CacheKeys, key)){
            //     logger.error("Cache key: " + key + " is not defined in CacheKeys[]");
            //     callback(FBCode.CACHEKEYNOTALLOWED);
            //     return;
            // }

            __redisClient.get(cacheService.Prefix + "_" + key, function (err, data) {
                if (underscore.isEmpty(data)) {
                    //logger.info("Cache Key: " + key + " is not found in REDIS");
                    callback(FBCode.NOTFOUND)
                } else {
                    //logger.trace("Cache key: " + key + " hit!");
                    callback(FBCode.SUCCESS, data);
                }
            });
        },

        /**
         * 通过useID从redis读取ERP配置信息
         * 如果redis里没有关键字useID,则从mysql取数据存到redis并返回数据
         */
        getErpConfig: function (UserID, cloudDBName, callback) {
            logger.enter();

            var ERPConfigKey = cacheService.Prefix + "_ERPConfig_" + UserID;

            // 从MySql查询ERPConfig
            var findKeyInMysql = function () {
                logger.enter();
                var sql = 'select * from ' + cloudDBName + '.Customer where id =' + UserID;
                logger.debug('sql:' + sql);
                __mysql.query(sql, function (err, rows) {
                    if (err) {
                        logger.warn("Mysql query operation fail.");
                        return callback(err);
                    }
                    logger.ndump('rows', rows);

                    var ERPConfig = null;
                    if (underscore.isEmpty(rows) == false) {
                        ERPConfig = {
                            erpIsAvailable: rows[0].erpIsAvailable,
                            hasValidErpSetting: rows[0].hasValidErpSetting,
                            erpMsgUrl: rows[0].erpMsgUrl,
                            erpAppCodeUrl: rows[0].erpAppCodeUrl,
                            appKey: rows[0].appKey
                        };
                    }

                    if ((__cacheConfig.enabled) == true && (ERPConfig != null)) {
                        __redisClient.set(ERPConfigKey, JSON.stringify(ERPConfig), __redis.print);
                    }

                    callback(null, JSON.stringify(ERPConfig));
                });
            };

            //如果redis没有启动或者redis里没有关键字则从mysql查询
            if (__cacheConfig.enabled == false) {
                findKeyInMysql();
            }else {
                __redisClient.get(ERPConfigKey, function (err, data) {
                    if (err) {
                        logger.ndump('Cache service get operation err', err);
                    }
                    if (!underscore.isEmpty(data)) {
                        logger.debug('Cache key: ' + ERPConfigKey + ' is exist in redis.');
                        return callback(null, data);
                    }
                    logger.debug("Cache Key: " + ERPConfigKey + " is not exist in REDIS");
                    findKeyInMysql();
                });
            }
        },


        /**
         * 按照通配符搜索key,并返回所有的kv
         * @param wildcard, "*abc*"匹配所有包含abc字符的key
         * @param callback
         * @returns {*}
         */
        getAll: function (wildcard, callback) {
            logger.enter();
            if (!__cacheConfig.enabled) {

            }

            __redisClient.keys(cacheService.Prefix + "_" + wildcard, function (err, keys) {
                if (err) {
                    logger.error(err);
                    callback(FBCode.REDISERR);
                } else {
                    var result = {};
                    async.mapSeries(keys,
                        [
                            function (key, done) {
                                __redisClient.get(key, function (err, data) {
                                    if (err) {
                                        logger.error(err);
                                    } else {
                                        result[key] = JSON.parse(data);
                                    }
                                    done();
                                });
                            }
                        ],
                        function (err, resultList) {
                            logger.ndump("getAll keys match '" + wildcard + "': " + JSON.stringify(result));
                            callback(err, result);
                        }
                    );
                }
            });
        },

        /**
         * 保存数据到key，并指定超时时间（秒)
         * @param key
         * @param data
         * @param ttl
         * @param callback
         */
        set: function (key, data, ttl, callback) {
            logger.enter();
            if (__cacheConfig.enabled == false) {
                callback && callback(FBCode.CACHEDISABLED);
                return FBCode.CACHEDISABLED;
            }


            // if (!underscore.has(cacheService.CacheKeys, key)){
            //     logger.error("Cache key: " + key + " is not defined in CacheKeys[]");
            //     callback(FBCode.CACHEKEYNOTALLOWED);
            //     return;
            // }
            __redisClient.set(cacheService.Prefix + "_" + key, JSON.stringify(data));
            if (!underscore.isUndefined(ttl)) {
                __redisClient.expire(key, ttl);
            }
            callback && callback();
            return FBCode.SUCCESS;

        }

    };

    return cacheService;
}
