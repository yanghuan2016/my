/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/
// global variables:
var modulesPath = __modules_path;
var logger = __logService;

// initialize
var config = require('./../../services/wechat/config');
var sccPath = require(modulesPath + '/mypath');
var docPath = "/" + sccPath.getAppName(__dirname);

// third modules:
global.__wechat = require('wechat');
var WechatAPI = require('wechat-api');
global.__wechatAPI = new WechatAPI(config.pub_options.appid, config.pub_options.secret);
var OAuth = require('wechat-oauth');
global.__wechatOauth = new OAuth(config.pub_options.appid, config.pub_options.secret);
var wechatOauth = __wechatOauth;
var wechat = __wechat;
var wechatAPI = __wechatAPI;

// self modules:
var menuInfo = require('./../../services/wechat/menuInfo');
var redisInit = require('./../../services/wechat/initRedis');
var remindDrug = require('./../../services/wechat/remindDrug');

// partner modules:
var docWorkstationDB = require('./../doctorWorkstation/model');


// 初始化数据库
redisInit();

// 保存base_access_token
var ProAccessToken = require('./../../services/wechat/proAccessToken');
var proAccessToken = new ProAccessToken();
proAccessToken.saveBaseAccessToken();
proAccessToken.refreshAllAccessToken();

// 创建菜单
menuInfo.createMenu();

// 定时发送服药提醒
var remindMedic = function (customerDbName, openid) {

    logger.ndump('customerDbName:', customerDbName);
    logger.ndump('openid:', openid);
    setTimeout(function () {
        remindDrug.pushMsg(customerDbName, openid);
    }, 8 * 1000);

    setTimeout(function () {
        remindDrug.pushMsg(customerDbName, openid);
    }, 28 * 1000);

    setTimeout(function () {
        remindDrug.pushMsg(customerDbName, openid);
    }, 48 * 1000);
}

// 请求路由
module.exports = function (app) {
    // 接入验证
    app.get('/docWorkStation/msg', function (req, res) {
        if (wechat.checkSignature(req.query, config.wechat_options.token)) {
            res.status(200).send(req.query.echostr);
        } else {
            res.status(200).send('fail');
        }
    });

    // 接收消息
    app.post(docPath + '/msg', wechat(config.wechat_options, function (req, res) {
        // 微信输入信息都在req.weixin上
        var message = req.weixin;
        logger.ndump('message', message);

        var url = wechatOauth.getAuthorizeURL(config.domain + docPath + '/callback', 'state', 'snsapi_base');
        if (message.MsgType == 'text') {
            switch (message.Content) {
                case  '文本':
                    res.reply({
                        content: '微信 Welcome!',
                        type: 'text'
                    });
                    break;

                case '跳转':
                    res.reply({
                        content: url,
                        type: 'text'
                    });
                    break;

                default:
                    break;
            }
        }
        else if (message.MsgType == 'event') {
            var eventType = message.Event;
            var customerDbName = req.session.customer.customerDB;
            logger.debug('message.Event:' + message.Event);
            logger.debug('message.EventKey' + message.EventKey);
            switch (eventType) {
                case 'subscribe':
                    logger.enter('enter subscribe.');
                    res.reply({
                        type: 'text',
                        content: '欢迎来到雨诺微信公众号，小雨将竭诚为你服务。以下将演示每隔20秒钟发送一次服药提醒，总共发送3次。'
                    });

                    remindMedic(customerDbName, message.FromUserName);
                    break;

                case 'unsubscribe':
                    logger.enter('enter unSubscribe.');
                    res.reply({
                        type: 'text',
                        content: ''
                    });
                    break;

                case 'SCAN':
                    break;

                case 'LOCATION':
                    break;

                case 'CLICK':
                    logger.enter('enter CLICK.');
                    if (message.EventKey == 'V1001_REMIND_DRUG') {
                        remindDrug.pushMsg(customerDbName, message.FromUserName);

                        res.status(200).end();
                    }
                    if (message.EventKey == 'V1001_DRUG_DELIVERY') {
                        res.reply({
                            type: 'text',
                            content: '您的药物已送出，送货员【小张：12345678912】正在马不停蹄的送药途中'
                        });
                    }
                    if (message.EventKey == 'V1001_DOC_ADVICE') {
                        res.reply({
                            type: 'text',
                            content: '多喝温水，注意休息，祝您早日康复！'
                        });
                    }
                    break;

                case 'VIEW':
                    logger.enter('enter VIEW.');
                    res.reply({
                        type: 'text',
                        content: ''
                    });
                    break;

                case 'TEMPLATESENDJOBFINISH':
                    logger.enter('enter TEMPLATESENDJOBFINISH');
                    break;

                default:
                    logger.enter('enentType is err!');
            }
        }
    }));

    // 网页授权跳转测试
    app.get(docPath + '/callback', function (req, res) {
        logger.debug('----weixin callback -----');
        logger.debug(JSON.stringify(req.query));
        logger.ndump('req.query.code:', req.query.code);
        logger.ndump('req.query.state:', req.query.state);

        wechatOauth.getAccessToken(req.query.code, function (err, result) {
            logger.debug('result:' + JSON.stringify(result));
            var accessToken = result.data.access_token;
            var openid = result.data.openid;
            var refreshToken = result.data.refresh_token;

            logger.ndump('result.data:', result.data);
            logger.ndump('accessToken:', accessToken);
            logger.ndump('refreshToken:', refreshToken);
            logger.ndump('openid:', openid);

            //proAccessToken.setRefreshToken(refreshToken);
            //proAccessToken.saveNetAccessToken(accessToken);

            // 传递openid和处方单id, 将opened和病人绑定
            var customerDbName = req.session.customer.customerDB;
            var prescriptionInfoId = req.query.state;
            logger.ndump('customerDbName:', customerDbName);
            docWorkstationDB.updatePatientWeChatOpenId(customerDbName, prescriptionInfoId, openid, function (err, result) {
                if (err) {
                    logger.error(err);
                }
                logger.ndump('result:', result);
            });
            res.redirect(config.domain + '/static/react/index.html#/weChatRecipe/' + prescriptionInfoId);
        });

    });
};