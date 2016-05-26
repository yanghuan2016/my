var config              = require('./config');
var logger              = __logService;
var OAuth = require('wechat-oauth');
var wechatOauth   = new OAuth(config.pub_options.appid, config.pub_options.secret);

exports.toWechatUrl = function(url){
    logger.enter('toWechatUrl');
    
    var wechatUrl = wechatOauth.getAuthorizeURL(config.domain + '/docWorkStation/callback', url, 'snsapi_base');  //state=url
    logger.ndump('wechatUrl:', wechatUrl);
    
    return wechatUrl;
};

