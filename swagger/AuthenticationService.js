'use strict';

var logger      =   __logService;
var _           =   require('lodash');
var indexModel  =   require(__base + "/apps/index/model")();
var FBCode      =   require(__modules_path + "/feedback").FBCode;
var Feedback    =   require(__modules_path + "/feedback").FeedBack;

/**
 * 用户登录
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.postAuthentication = function(req, args, res, next) {
    logger.enter();
    logger.debug(req.method + " : " + req.url);

    // 获取用户名&密码
    var operatorName = args.userInfo.value.username;
    var password = args.userInfo.value.password;
    var nextTo = req.body.nextTo;
    var isTokenAuthentication = req.body.tokenAuthentication;

    if (_.isEmpty(nextTo))
        nextTo = "";

    logger.ndump("nextTo", nextTo);
    logger.ndump("req.ipv4", req.ipv4);

    password = new Buffer(password,'base64').toString();

    var customerDB = req.session.customer.customerDB;

    indexModel.operatorLogin(__cloudDBName, customerDB, operatorName, password, req.ipv4, function(err, data) {
        switch(err) {
            case FBCode.SUCCESS:
                if (data && data.operatorType==='CUSTOMER'){
                    nextTo = "/customer";
                }
                req.session.operator = data;
                req.session.ExpireLicensetip = true;

                /**
                 * 设置该客户的功能点
                 */
                if (!_.isEmpty(req.session.operator.operatorRoles)) {
                    logger.ndump("operatorRoles", req.session.operator.operatorRoles);
                    req.session.operator.operatorRoles = JSON.parse(req.session.operator.operatorRoles);

                }
                // 添加登录日志
                var logContent = {};
                logContent.operatorId = data.operatorId;
                logContent.ipAddr = req.ipv4;
                logContent.actionType = 'LOGINOUT';
                logContent.entityId = '';
                delete req.session.operator['password'];
                logContent.log = {
                    actionFlag: "LOGIN",
                    customer: req.session.customer,
                    operator: req.session.operator,
                    client: req.session.client
                };
                indexModel.addOperatorLog(customerDB, logContent, function(err, results){
                    if(err){
                        logger.error(err);
                    }

                    res.header("access-token", req.cookies['connect.sid']);
                    var feedbackData = {
                        nextTo: nextTo,
                        token: req.cookies['connect.sid'],
                        operaterInfo: data
                    };
                    res.json(new Feedback(FBCode.SUCCESS, "登录成功", feedbackData));
                    // 判断是不是用token登录的
                    if  (isTokenAuthentication === 'true') {
                        var sessionKey = 'sess:' + req.sessionID;
                        __redisClient.expire(sessionKey, __tokenTTL);
                        logger.debug('set redis ttl, key:' + sessionKey + ' ttl:' + __tokenTTL);
                        feedbackData.ttl = __tokenTTL;
                    }
                });
                return ;
            case FBCode.DBFAILURE:
                return res.json(new Feedback(FBCode.DBFAILURE, "服务器开小差了，请稍后再试."));
            case FBCode.LOGINFAILURE:
                if(data){
                    return res.json(new Feedback(FBCode.LOGINFAILURE,data));
                }else{
                    return res.json(new Feedback(FBCode.LOGINFAILURE,"该账户名与密码不匹配,请确认"))
                }

            case FBCode.CLIENTDISABLED:
                return res.json(new Feedback(FBCode.CLIENTDISABLED, "客户被禁用了"));
            case FBCode.MAXPASSWDFAIL:
                return res.json(new Feedback(FBCode.MAXPASSWDFAIL, "连续" + __securityConfig.maxLoginFailCount + "次密码错误, 该账号被锁定，请" + Math.floor((data+59)/60) + "分钟后再登录!"));
            default:
                return res.json(new Feedback(err, "数据操作出现错误，请稍后重试"));
        }
    });
};

