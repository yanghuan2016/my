/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports=function(redisConfig) {

    /**
     * system service handles
     */
    var logger = global.__logService;
    
    /**
     * 3rd party modules
     */
    var underscore = require("underscore");

    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    
    /**
     * Init pubsub service
     */
    var pubsub = require("node-redis-pubsub");
    var _pubsub;
    
    var _pubsubChannelList = [];

    var pubsubService = {
        
        /**
         * 发布消息到channel
         * @param channelName
         * @param obj
         */
        publish: function(channelName, obj){
            logger.enter();
            _pubsub.emit(channelName, obj);
        },

        /**
         * 注册接收消息
         * @param channelName
         * @param callback
         */
        subscribe: function(channelName, callback){
            logger.enter();
            
            logger.debug("Subscribe on channel<" + channelName + ">");
            if (underscore.isEmpty(_pubsub))
                logger.error("_pubsub is EMPTY");
            _pubsub.on(channelName, function(data){
                logger.enter();
                logger.ndump("channelName", channelName);
                logger.ndump("data", data);

                callback(data);
            });

            if (underscore.indexOf(_pubsubChannelList, channelName) < 0) {
                // 增加
                _pubsubChannelList.push(channelName);
                // 更新cache中的注册频道列表 
                var cache = __cacheService;
                cache.set(cache.CacheKeys.PubSubChannelList, _pubsubChannelList);
            }
            logger.ndump("_pubsubChannelList",_pubsubChannelList);
        },

        /**
         * 取消注册消息
         * @param channelName
         */
        unsubscribe: function(channelName) {
            logger.enter();
            _pubsub.off(channelName);
            if (underscore.indexOf(_pubsubChannelList, channelName) >= 0) {
                _pubsubChannelList = underscore.without(_pubsubChannelList, channelName);
                var cache = __cacheService;
                cache.set(cache.CacheKeys.PubSubChannelList, _pubsubChannelList);
            }
        },

        /**
         * 从redis中读取pubsub频道列表
         */
        loadPubSubChannelListFromCache: function() {
            logger.enter();
            
            if (underscore.isUndefined(global.__cacheService) || underscore.isUndefined(global.__redisClient)) {
                setTimeout(pubsubService.loadPubSubChannelListFromCache, 5000);
            } else {
                var cache = __cacheService;
                cache.get(cache.CacheKeys.PubSubChannelList, function (fbcode, data) {
                    if (fbcode != FBCode.SUCCESS) {
                        logger.enter("No PubSubChannelList in Cache");
                    } else {
                        _pubsubChannelList = JSON.parse(data);
                    }
                });
            }
                
        }
    };
    
    setTimeout(lateInit, 3000);
    
    function lateInit() {
        _pubsub = pubsub(redisConfig);

        // reload pubsubChannelList from cache, avoid channel lost while restarting scc
        pubsubService.loadPubSubChannelListFromCache();
    }
    
    return pubsubService;
};
