/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 * feedback.js
 *
 * --------------------------------------------------------------
 * 2015-10-28   hc-romens@issue#357 optimiazed
 */

var _module_name = __filename.replace(/\.js/,"").split("/").pop();
/**
 * Service
 */
var logger = __logService;

/**
 *  modules
 */
var sprintf = require("sprintf-js").sprintf;
var crypto = require('crypto');
var moment = require('moment');


exports.postRefund = function(data,callback){
    var http = require('http');
    var url = require('url');
    var querystring = require('querystring');
    var xmlParse = require('xml2js').parseString;
    logger.debug(JSON.stringify(data));
    // {"merId":"439459",
    // "dealOrder":"00000000000001",
    // "dealAmount":"10584.00",
    // "refundAmount":"10584.00",
    // "dealSignure":"a60e2cb809800ed88d9cd8819a308c38b2b23dde",
    // "baseUrl":"http://user.sdecpay.com/"}
    var post_data = querystring.stringify({
        'merId' : data.merId,
        'dealOrder': data.dealOrder,
        'dealAmount': data.dealAmount,
        'refundAmount' : data.refundAmount,
        'rmReason' : "system_Refund",
        'dealSignure' : data.dealSignure
    });

    var sendhost = url.parse(data.baseUrl).hostname;
    var post_options = {
        host: sendhost,
        path: '/gaterefund.html',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data, 'utf8')
        }
    };
    // Set up the request
    var post_req = http.request(post_options, function (res) {
        var strBuffer = "";
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            strBuffer += chunk;
        });
        res.on('end', function () {
            xmlParse(strBuffer, function(err, result){
                if(err){
                    callback(err);
                }
                else{
                    logger.ndump('xmlToJson: ', result);

                    var data = {
                        status: result.GATERES.REFUND[0].HEAD[0].STATUS[0],
                        mess: result.GATERES.REFUND[0].HEAD[0].MESS[0],
                        remaining: result.GATERES.REFUND[0].BODY[0].REMAINING[0],
                        sign: result.GATERES.REFUND[0].BODY[0].SIGN[0]
                    };
                    callback(null, data);
                }
            });

        });
    });
    post_req.on('error', function (err) {
        callback(err);
    });
    post_req.write(post_data);
    post_req.end();
};



exports.getSignure =function (payment,orderInfo,dealReturn,configValue) {
    logger.enter();
    var id = payment.id;
    var version = payment.version;
    var name = payment.name;
    var result = "";
    if( version == "v.1.0" && name == "联行支付"){
        logger.debug("current payment =" + name + version);
        var dealOrder = orderInfo.id;
        var dealFee = Number(orderInfo.amount).toFixed(2);
        var key = configValue.key;
        var merId = configValue.merId;
        logger.debug(key);
        var Data = merId + dealOrder + dealFee + dealReturn;
        logger.debug(Data);
        var signMethod = payment.signMethod;
        logger.debug(signMethod);
        var hash = crypto.createHash(signMethod);
        hash.update(Data+key);
        result = hash.digest('hex');
    }
    logger.debug(result);
    return result;
};


exports.getReturnSignure =function (payment,dealOrder,dealState,configValue) {
    logger.enter();
    logger.debug(JSON.stringify(payment));
    var version = payment.version;
    var name = payment.name;
    var result = "";
    if( version == "v.1.0" && name == "联行支付"){
        logger.debug("current payment =" + name + version);
        var key = configValue.key;
        logger.debug(key);
        var Data = dealOrder + dealState;
        logger.debug(Data);
        var signMethod = payment.signMethod;
        logger.debug(signMethod);
        var hash = crypto.createHash(signMethod);
        hash.update(Data+key);
        result = hash.digest('hex');
    }
    logger.debug(result);
    return result;
};

exports.getRefundSignure = function(payment,data,configValue){
    logger.enter();
    logger.debug(JSON.stringify(payment));
    var version = payment.version;
    var name = payment.name;
    var result = "";
    if( version == "v.1.0" && name == "联行支付"){
        logger.debug("current payment =" + name + version);
        var key = configValue.key;
        var merId = configValue.merId;
        var dealOrder = data.dealOrder;
        var refundAmount = data.refundAmount;
        var Data = merId + dealOrder + refundAmount;
        logger.debug(Data);
        var time = new Date();
        var date = moment(time).format('YYYYMMDD');
        logger.debug(date);
        var signMethod = payment.signMethod;
        logger.debug(signMethod);
        var hash = crypto.createHash(signMethod);
        hash.update(Data+key+date);
        result = hash.digest('hex');
    }
    logger.debug(result);
    return result;
};


exports.getQuerySignure = function(payment,data,configValue){
    logger.enter();
    logger.debug(JSON.stringify(payment));
    var version = payment.version;
    var name = payment.name;
    var result = "";
    if( version == "v.1.0" && name == "联行支付"){
        logger.debug("current payment =" + name + version);
        var key = configValue.key;
        var merId = configValue.merId;
        var dealQuery = data.dealQuery;
        var Data = merId + dealQuery;
        logger.debug(Data);
        var signMethod = payment.signMethod;
        logger.debug(signMethod);
        var hash = crypto.createHash(signMethod);
        hash.update(Data+key);
        result = hash.digest('hex');
    }
    logger.debug(result);
    return result;
};

exports.getClientIp = function(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};