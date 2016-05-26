var base_options = {
    token: 'CDROMENS',
    appid: 'wx76a929753051df64',
    secret:'83a3776e681a9e0e13d4094858eede6b',
    encodingAESKey: '6k2ovoGrkSGBxIaD8jRaO77Z8XAVOnANyefbplcRIZ8'
};

module.exports = {
    pub_options: {
        token: base_options.token,
        appid: base_options.appid,
        secret: base_options.secret,
        encodingAESKey: base_options.encodingAESKey
    },

    wechat_options: {
        token: base_options.token,
        appid: base_options.appid,
        encodingAESKey: base_options.encodingAESKey
    },

    redis: {
        host: __redisConfig.host,
        port: __redisConfig.port,
        dbNum: __redisConfig.dbNum
    },

    domain: 'http://wx.romenscd.cn'
};