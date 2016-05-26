var wechatAPI           = __wechatAPI;
var redisClient         = wechatRedisClient;
var subscriberClient    = wechatSubClient;
var wechatOauth         = __wechatOauth;
var logger              = __logService;

function ProAccessToken(){
    var that = this;
    var refreshToken = '';

    //保存refreshToken
    this.setRefreshToken = function (refreshToken) {
        that.refreshToken = refreshToken;
    };

    // 将net_access_token存放在redis
    this.saveNetAccessToken = function (accessToken) {
        redisClient.set("net_access_token", accessToken, function(err, reply) {
            console.log(reply);
        });
        redisClient.set("shadow_net_access_token", accessToken, function(err, reply) {
            console.log(reply);
        });
        redisClient.get("shadow_net_access_token", function(err, reply) {
            console.log(reply);
        });
        redisClient.expire('shadow_net_access_token', 2);
    };

    // 用shadow_net_access_token刷新net_access_token，当接收到订阅消息调用对应服务
    this.refreshAllAccessToken = function () {
        subscriberClient.on("pmessage", function (pattern, channel, expiredKey) {
            var keyName = expiredKey;
            logger.ndump('keyName:', keyName);
            logger.ndump('channel:', channel);       //通道
            logger.ndump('pattern:', pattern);       //通道匹配模式

            switch(keyName)
            {
                case 'shadow_net_access_token':
                    logger.enter('Enter shadow_net_access_token');
                    wechatOauth.refreshAccessToken(that.refreshToken, function(err, result) {
                        console.log('result=', result);
                        var accessToken = result.data.access_token;
                        that.saveNetAccessToken(accessToken);
                    });
                    break;

                case 'shadow_base_access_token':
                    logger.enter('Enter shadow_base_access_token');
                    that.saveBaseAccessToken();
                    break;

                default:
                    logger.enter('Enter keyName!');
                    break;
            }
        });
    };

    // 将base_access_token存放在redis
    this.saveBaseAccessToken = function () {
        wechatAPI.getAccessToken(function (err, tokenInfo) {
            logger.enter('enter saveBaseAccessToken!');
            if(err){
                logger.error(err);
            }

            //expireTime = (new Date().getTime()) + (data.expires_in - 10) * 1000;
            // logger.ndump('tokenInfo:', tokenInfo.expireTime);
            // logger.ndump('expire_in:', (tokenInfo.expireTime - new Date().getTime())/1000);

            redisClient.set("base_access_token", tokenInfo.accessToken, function(err, reply) {
                if(err){
                    logger.error(err);
                }
                logger.ndump('reply:', reply);
            });

            redisClient.set("shadow_base_access_token", tokenInfo.accessToken, function(err, reply) {
                if(err){
                    logger.error(err);
                }
                logger.ndump('reply:', reply);
            });

            redisClient.expire('shadow_base_access_token', 60);
        })
    };
}

module.exports = ProAccessToken;