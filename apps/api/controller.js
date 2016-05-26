module.exports = function (app) {

    var logger = __logService;
    var db = __dbService;
    var dataService = __dataService;
    var isErpMsgCheckStrict = __isErpMsgCheckStrict;

    var path = require('path');
    var underscore = require("underscore");
    var url = require('url');

    var auth = require(__base + '/modules/auth');
    var feedback = require(__modules_path + "/feedback");
    var apiModule = require("./apiModule")();
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var crypto = require("crypto");
    var md5 = require('js-md5');
    var Md5Calibrator = require(__base +"/modules/md5Calibrator");
    var md5Calibrator = new Md5Calibrator(md5);
    var async = require('async');

    var MsgRobot = require(__base + "/modules/msgRobot");

    var ApiModel = require("./model");
    var model = new ApiModel();
    var APPNAME = __dirname.split(path.sep).pop();
    var APPURL = "/" + APPNAME;

    var AppCodeRobot = require(__base + "/modules/erpAppCodeRobot");
    var redis_TTL_AppCode = __appCodeValidTime;
    var redisCli = __redisClient;
    var cacheService = __cacheService;

    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    app.post(APPURL + "/erp/appCode/:uid", postAppCodeHandler);
    function postAppCodeHandler(req, res) {
        logger.enter();
        logger.trace(req.body);
        var cloudDb = __cloudDBName;
        var redisClient = __redisClient;
        logger.debug(JSON.stringify(req.body));
        logger.ndump('ERP请求APPCODE参数:', req.body);

        var appKey = req.body.appKey.toLowerCase();
        var expectedTTL = req.body.ttl;
        var enterpriseId = req.param("uid");
        enterpriseId = Number(enterpriseId);
        logger.debug('收到请求，来自：' +  enterpriseId);
        expectedTTL = Number(expectedTTL) || redis_TTL_AppCode;
        var appCodeRobot = new AppCodeRobot(cloudDb, db, redisClient);
        var appCode = appCodeRobot.generateMsgInAppCode(enterpriseId, appKey, expectedTTL);
        var data = {appCode: appCode, ttl: expectedTTL};
        res.json(new FeedBack(FBCode.SUCCESS, "成功提交", data));
    }

    app.post(APPURL + "/erp/:uid", postERPHandler);
    function postERPHandler(req, res) {
        logger.enter();
        logger.ndump('ERP发送消息的参数:', req.body);
        logger.ndump("ERP的MSG 未处理:", req.body.msg);
        var userId = Number(req.param("uid"));
        var msg = req.body.msg;
        var operatorRobotId = 9999;
        var key = "ERP.appCode.msgIn." + userId;
        logger.debug('收到请求，来自：' +  userId);
        redisCli.get(key, function(error, appCode){
            if (error) {
                logger.error(error);
                return res.json(new FeedBack(FBCode.INVALIDAPPCODE, "无效的APPKEY"));
            }
            var msgRobot = new MsgRobot(md5Calibrator, isErpMsgCheckStrict);
            var data = {};
            try{
                msg = JSON.parse(msg);
            }catch(err){
                logger.error("ERP back msg PARSE JSON ERR");
                return;
            }

            data.msg = msg;
            data.userId = userId;
            data.operatorRobotId = operatorRobotId;
            logger.ndump('msg type: ', typeof msg);
            logger.ndump('msg: ', msg);
            logger.debug(JSON.stringify(data));
            var isValidMsg = msgRobot.isValidMsg(appCode, msg);
            model.restoreErpMsgIn(userId,data,isValidMsg,function(err,results){
                var msgRecord = "数据库记录ERP MSG SUCCESS";
                if(err){
                    logger.error(JSON.stringify(err)+"数据库记录ERP MSG IN 失败");
                    msgRecord = "数据库记录ERP MSG失败"+err;
                }
                if (!isValidMsg) {
                    return res.json(new FeedBack(FBCode.INVALIDDATA, "无效的APPCODE"+msgRecord));
                }
                logger.ndump('收到的msgType:', msg.msgType, Boolean(msg.msgType));
                if(msg.msgType){
                    res.json(new FeedBack(FBCode.SUCCESS, "接收并校验数据成功"+msgRecord));
                    apiModule[msg.msgType](data);
                }else{
                    res.json(new FeedBack(FBCode.NOTFOUND, "找不到对应的msgType"+msgRecord));
                }
            });
        });
    }
};
