/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/



var _module_name = __filename.replace(/\.js/,"").split("/").pop();

/*
 * init logger
 */
var logger = __logService;

/*
 * init 3rd libs
 */
var underscore = require("underscore");
var async = require("async");
var feedback = require(__modules_path + "/feedback");
var FBCode = feedback.FBCode;
var FeedBack = feedback.FeedBack;
var db = __dbService;
/**
 * Send a message to operator/client
 */
var sendClient = function(customerDBName, msg, callback) {
    logger.enter();

    if (msg) {
        if (!underscore.isUndefined(msg.clientId) &&
            !underscore.isUndefined(msg.docType) &&
            !underscore.isUndefined(msg.docId) &&
            !underscore.isUndefined(msg.displayDocId)) {
            db.postClientMessage(customerDBName, msg, function(err){
                if (err) {
                    logger.error(err);
                }
                callback(err);
            });
        }
    } else {
        logger.warn("No found msg object at req.session.msg");
    }
};

/**
 * Post a message at req.session.msg to an operator
 */
var sendOperator = function(customerDBName, msg, callback) {
    logger.enter();

    if (msg) {
        if (!underscore.isUndefined(msg.operatorId) &&
            !underscore.isUndefined(msg.docType) &&
            !underscore.isUndefined(msg.docId) &&
            !underscore.isUndefined(msg.displayDocId)) {
            db.postCustomerOperatorMessage(customerDBName, msg, function(err){
                if (err) {
                    logger.error(err);
                }
                callback(err);
            });
        }
    } else {
        logger.warn("No Found msg object at req.session.msg");
    }
};

/**
 * Broadcast a message to the owner who has the match previlidges
 */
var sendBroadcast = function(customerDBName, msg, callback) {
    logger.enter();
    if (msg) {
        var fps = msg.fps;
        if (!underscore.isArray(fps))
            fps = [fps];

        logger.ndump("fps", fps);
        msg['toFeature'] = JSON.stringify(fps);

        //if (!underscore.isUndefined(msg.docType) && !underscore.isUndefined(msg.docId)) {
            logger.debug("broadcasting...");
            __dbService.broadcastMessage(customerDBName, msg, function (err) {
                if (err) {
                    logger.error(err);
                }
                callback(err);
            });
        //}
    } else {
        logger.warn("No Found msg object at req.session.msg.");
    }
};

var postClinetsMsg  = function(req, res, next) {
    logger.ndump("msg", req.session.msg);
    if (!req.session.msg) {
        logger.error("No message object found at req.session.msg");
        return next();
    }
    var msg = req.session.msg;
    var customerDBName = req.session.customer.customerDB;
    var clientIds = msg.clientId;
    async.mapSeries(clientIds,
        function(clientId,mapCallback){
            msg.clientId = clientId;
            sendClient(customerDBName, msg, function(){
               mapCallback();
            });
        },
        function(errs,results){
            delete req.session.msg;
            if (errs) {
                logger.error(errs);
                next();
            }
        }
    )
};



var postMsg = function(req, res, next) {
    logger.ndump("msg", req.session.msg);
    if (!req.session.msg) {
        logger.error("No message object found at req.session.msg");
        return next();
    }

    var msg = req.session.msg;
    var customerDBName = req.session.customer.customerDB;

    async.waterfall([
            function(done){
                if (msg.clientId) {
                    sendClient(customerDBName, msg, function(){
                        done();
                    });
                } else {
                    done();
                }
            },
            function(done){
                if (msg.operatorId) {
                    sendOperator(customerDBName, msg, function(){
                        done();
                    });
                } else {
                    done();
                }

            },
            function(done){
                if (msg.fps) {
                    sendBroadcast(customerDBName, msg, function(){
                        done();
                    });
                } else {
                    done();
                }
            }
        ],
        function(err, results){
            delete req.session.msg;
            if (err) {
                logger.error(err);
                next();
            }
        }
    );
};

/**
 * 统一的用于多发目标的消息体函数
 * @param clientId
 * @param operatorId
 * @param fps
 * @param docType
 * @param docId
 * @param displayDocId
 * @param msgBody
 */
var makeMsg = function(clientId, operatorId, fps, docType, docId, displayDocId, msgBody) {
    var msg = {};
    if (clientId)
        msg.clientId = clientId;
    if (operatorId)
        msg.operatorId = operatorId;
    if (fps)
        msg.fps = fps;

    msg.docType = docType;
    msg.docId = docId;
    msg.displayDocId = displayDocId;
    msg.msgBody = msgBody;
    logger.debug("msg is made ="+JSON.stringify(msg));
    return msg;
};


exports.makeMsg = makeMsg;
exports.postMsg = postMsg;
exports.postClinetsMsg = postClinetsMsg;
