var WXPay = require('../../node_modules/weixin-pay');
var util  = require('../../node_modules/weixin-pay/lib/util');

/**
 * 扩展的WXPay接口
 */
WXPay.mix('getPostParamete', function(opts, fn){

    opts.nonce_str = opts.nonce_str || util.generateNonceString();
    util.mix(opts, this.wxpayID);
    opts.sign = this.sign(opts);

    var xmlData = util.buildXML(opts)
    
    fn(null, xmlData);
});

module.exports = WXPay;