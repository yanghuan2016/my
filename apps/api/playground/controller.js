function Playground(app) {
    var logger = __logService;
    var db = __dbService;
    var dataService = __dataService;

    var path = require('path');
    var underscore = require("underscore");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var async = require('async');

    var ApiRobot = require(__base + "/modules/apiRobot");
    var auth = require(__base + '/modules/auth');
    var AppCodeRobot = require(__base + "/modules/erpAppCodeRobot");
    var redisClient = __redisClient;

    var APPNAME = __dirname.split(path.sep).pop();
    var APPURL = "/" + APPNAME;

    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    var playgroundModel = require("./model");
    var model = new playgroundModel();

    app.get(APPURL, getClientPlaygroundHandler);
    function getClientPlaygroundHandler(req, res, next) {
        logger.enter();
        var customerDb = req.session.customer.customerDB;
        var operatorId = req.session.operator.operatorId;
        var cloudDBName = __cloudDBName;

        dataService.commonData(req, function commonDataCallback(data) {
            db.retrieveCustomerIdByOperatorId(customerDb, operatorId, function retrieveCustomerIdByOperatorIdCallback(error, enterpriseId) {
                if (error) {
                    logger.error(error);
                    return next(error);
                }
                data.enterpriseId = enterpriseId;

                db.enterpriseRetrieveAppKey(Number(enterpriseId), cloudDBName, function (error, appKey) {
                    if (error) {
                        logger.error(error);
                        return next(error);
                    }
                    data.appKey = appKey;

                    var appCodeRobot = new AppCodeRobot(cloudDBName, db, redisClient);

                    appCodeRobot.getAppCode(enterpriseId, function (error, appCode) {
                        if (error) {
                            logger.error(error);
                            return next();
                        }

                        data.appCode = appCode;
                        res.render('api/playground/client', {data: data});
                    });
                });
            });
        });
    }

    app.post(APPURL + "/startSendDataToErp", getStartSendDataToErpHandler);
    function getStartSendDataToErpHandler(req, res) {
        logger.enter();

        var customerDbName = req.session.customer.customerDB;
        var cloudDbName = __cloudDBName;
        var dbService = __dbService;
        var redisConn = __redisClient;
        var isErpMsgCheckStrict = __isErpMsgCheckStrict;
        var version = __erpApiVersion;

        var enterpriseId = Number(req.body.enterpriseId);
        var msgType = 'testMsg';
        var msgData = {
            name:'zhaopeng',
            age:23
        };
        var apiRobot = new ApiRobot(cloudDbName, dbService, redisConn, isErpMsgCheckStrict, version);
        apiRobot.sendMsg(enterpriseId, msgType, msgData, function sendMsgCallback(error, result) {
            if (error) {
                logger.error(error);
                return res.json(new FeedBack(FBCode.DBFAILURE, "发送消息失败", error));
            }
            res.json(new FeedBack(FBCode.SUCCESS, "发送消息成功", result));
        });
    }
}

module.exports = Playground;