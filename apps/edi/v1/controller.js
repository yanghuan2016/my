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
var db = __dbService;
var cloudDbName = __cloudDBName;
var redisConn = __redisClient;
var cacheService = __cacheService;


// third modules:
var path = require("path");
var _ = require('lodash');
var md5 = require('js-md5');
var async = require('async');

// scc modules:
var model = require('./model')();
var sccPath = require(modulesPath + '/mypath');
var Md5Calibrator = require(modulesPath + "/md5Calibrator");
var MsgRobot = require(modulesPath + "/msgRobot");
var FBCode = require(modulesPath + "/feedback").FBCode;
var Feedback = require(modulesPath + "/feedback").FeedBack;
var MsgTransmitter = require(__modules_path + '/msgTransmitter');

// initialize
var v1Path = "/" + sccPath.getAppName(__dirname);
var md5Calibrator = new Md5Calibrator(md5);
var msgRobot = new MsgRobot(md5Calibrator);

module.exports = function (app) {


    //保存ERP设置
    app.route(v1Path + '/erpConfig/:enterpriseId')
        .post(postErpConfig);
    function postErpConfig(req, res) {

        logger.enter();
        var enterpriseId = req.params.enterpriseId;
        // 检查 enterpriseId = 是否有效,
        if (!req.session || !req.session.identityInfo || !req.session.identityInfo.isAdmin || !req.session.enterpriseInfo || !req.session.enterpriseInfo.enterpriseId || enterpriseId !== req.session.enterpriseInfo.enterpriseId.toString()) {
            // 释放redis的session
            req.session = {};
            return res.json(new Feedback(FBCode.LOGINFAILURE, "请没有权限, 请重新登录!"));
        }
        logger.debug(JSON.stringify(req.body));
        var erpConfig = {
            erpMsgUrl: req.body.erpMsgUrl,
            erpAppCodeUrl: req.body.erpAppCodeUrl,
            appKey: req.body.appKey
        };
        logger.debug(JSON.stringify(erpConfig));
        var erpIsAvailable = 1;     // 默认为true.

        var userName = req.session.identityInfo.UserCode;
        var password = req.body.password;
        password = new Buffer(password, 'base64').toString();

        logger.ndump('>>>>>>>username', userName);
        logger.ndump('>>>>>>>password', password);

        var isVerified = false;
        async.series([
            // 用户密码验证
            function (done) {
                __yy365Service.login(userName, password, function (err, userData) {
                    if (err) {
                        logger.error('Password Verify Fail...', err);
                        return done(err);
                    }
                    logger.ndump('Result Data: ', userData);
                    // 如果返回没有报错
                    if (userData.search('!ERROR!') == -1) {
                        isVerified = true;
                    }
                    done();
                });
            },
            // 测试链接成功，点击保存后密码验证通过
            function (done) {
                if (isVerified) {
                    var hasValidErpSetting = true;
                    db.updateCustomerERPSetting(cloudDbName, enterpriseId, erpIsAvailable, erpConfig.erpAppCodeUrl, erpConfig.erpMsgUrl, erpConfig.appKey, hasValidErpSetting,function (err, result) {
                        done(err, result);
                    });
                }
                else {
                    done();
                }
            }
        ], function (err) {
            if (err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, '数据库出错了,请重试.', {erpConfig: erpConfig}));
            }
            logger.ndump('isVerified', isVerified);
            if (!isVerified) {
                return res.json(new Feedback(FBCode.LOGINFAILURE, '密码校验有误', {erpConfig: erpConfig}));
            }

            res.json(new Feedback(FBCode.SUCCESS, "恭喜!ERP连接配置成功.", {erpConfig: erpConfig}));
        });

    }

    app.route(v1Path + '/erpConfig/:enterpriseId/appKey')
        .get(getAppKey);
    function getAppKey(req, res) {
        var enterpriseId = req.params.enterpriseId;
        // 检查 enterpriseId = 是否有效,
        logger.dump("requested enterpriseId <'" + enterpriseId + "'>");

        if (req.session && req.session.identityInfo && req.session.identityInfo.isAdmin && req.session.enterpriseInfo && req.session.enterpriseInfo.enterpriseId && enterpriseId === req.session.enterpriseInfo.enterpriseId.toString()) {
            var key = msgRobot.generateAppKey(enterpriseId);
            var feedback = new Feedback(FBCode.SUCCESS, '生成成功', {appKey: key});
            res.json(feedback);
        } else {
            req.session.destroy();
            return res.json(new Feedback(FBCode.LOGINFAILURE, "生产失败,请重新登录"));
        }

    }

    //查询同步商品离线任务的进度
    app.route(v1Path + '/erpAsync/:enterpriseId/status').get(getSynchroProcess);
    function getSynchroProcess(req, res) {
        logger.enter();
        var enterpriseId = req.params.enterpriseId;
        if (_.isUndefined(enterpriseId) || !req.session.identityInfo || !req.session.identityInfo.isAdmin) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var taskType = req.body.taskType || "ERP_SYNC_GOODS";
        model.getSyncProcessStatus(cloudDbName, taskType, enterpriseId, function (err, result) {
            if (err) {
                logger.enter();
                res.json(new Feedback(FBCode.DBFAILURE, "获取同步状态失败", {syncDataStatus: 'ERROR'}));
            }
            else {
                logger.ndump('result', result);
                if (result.length > 0) {
                    var isExist = _.find(result, function (item) {
                        if ('RUNNING' == item.taskStatus) {
                            return true;
                        }
                    });
                    if (isExist) {
                        // 若任务列表中存在 'RUNNING' 状态，则同步进行中
                        res.json(new Feedback(FBCode.SUCCESS, "同步数据进行中", {syncDataStatus: 'DOING'}));
                    }
                    else {
                        res.json(new Feedback(FBCode.SUCCESS, "同步数据已完成", {syncDataStatus: 'FINISHED'}));
                    }
                }
                else {
                    res.json(new Feedback(FBCode.DBFAILURE, "获取同步状态失败,任务不存在", {syncDataStatus: 'ERROR'}));
                }
            }
        });
    }

    /**
     * 同步数据前测试链接
     */
    app.route(v1Path + '/erpConfig/:enterpriseId/connection')
        .post(testConnect);
    function testConnect(req, res) {
        logger.enter();
        var enterpriseId = req.params.enterpriseId;
        var erpConfig = req.body;
        logger.debug(JSON.stringify(erpConfig));
        if (_.isUndefined(enterpriseId) || !req.session.identityInfo || !req.session.identityInfo.isAdmin) {
            // 未登录用户
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }
        var msgTransmitter = new MsgTransmitter(cloudDbName, db, redisConn);

        var socketId = req.session.socketId;
        logger.ndump('socketId', socketId);
        var ping = Math.random() * 10000;
        ping = Math.floor(ping);
        logger.ndump('ping', ping);
        res.json(new Feedback(FBCode.WAIT, '连接测试中 请稍后.'));

        var ERPConfigKey = cacheService.Prefix + "_ERPConfig_" + enterpriseId;

        var ERPConfig = {
            erpMsgUrl: erpConfig.erpMsgUrl,
            erpAppCodeUrl: erpConfig.erpAppCodeUrl,
            appKey: erpConfig.appKey
        };

        //clear appCode in redis
        var appCodeKey = "ERP.appCode.msgOut." + enterpriseId;
        __redisClient.del(appCodeKey,function(err){
            if(err){
                return logger.error(err);
            }
            logger.debug("clear appcode in redis");
            __redisClient.set(ERPConfigKey, JSON.stringify(ERPConfig));
            // 利用SCC_id做key,把socketID ping 一起存入redis
            var temp = {
                ping: ping,
                socketId: socketId
            };
            logger.debug("set _ping_ temp="+JSON.stringify(temp));
            cacheService.set("_ping_" + enterpriseId, temp, 60);

            msgTransmitter.EDI_PING_TO_ERP(enterpriseId, ping, function (error, feedback) {
                logger.ndump('feedback', feedback);
                if (error) {
                    return logger.error(error);
                }
            });
        });
    }

    //更新APPKEY到ERP
    app.post(v1Path + '/updateAppkey/:enterpriseId', function (req, res) {
        logger.enter();
        var enterpriseId = req.params.enterpriseId;
        // 判断是否已登录
        if (_.isUndefined(req.session.enterpriseInfo) || !req.session.identityInfo || !req.session.identityInfo.isAdmin) {
            // 未登录用户 直接返回提示未登录没有权限初始化 DB
            return res.json(new Feedback(FBCode.NOTFOUND, "用户未登录,不能进行此项操作."));
        }
        var erpConfig = req.body;
        var appKey = erpConfig.appKey;
        var socketId = req.session.socketId;
        if(appKey){
            var msgTransmitter = new MsgTransmitter(cloudDbName, db, redisConn);
            msgTransmitter.EDI_APPKEY_TO_ERP(enterpriseId, appKey, function (error, feedback) {
                logger.ndump('feedback', feedback);
                var errmsg = "";
                var isDone = true;
                var msg = "";
                if (error) {
                    errmsg = "同步APPKEY到ERP失败"+error.toString();
                    isDone = false;
                    logger.error(error);
                    var socketConn = __socketIO.sockets.connected[socketId];
                    if (!socketConn) {
                        logger.error(new Error('无法拿到socket连接'));
                        return;
                    }
                    var pushInfo = {
                        // 任务id, @see table CloudDB.Task.taskId
                        taskId: "",
                        // 任务类型, @see table CloudDB.Task.taskType
                        taskType: "",
                        // 子任务名称, 可选
                        description: "",
                        // 任务进度百分比, 0-100
                        taskProgress: "",
                        // 任务完成标志
                        isDone: isDone,
                        // 错误消息
                        errmsg: errmsg,
                        // 消息体
                        msg:msg
                    };
                    logger.debug(JSON.stringify(pushInfo));
                    socketConn.emit("updateAppkey-ERP", pushInfo);
                }else{
                    msg = feedback.msg;
                    model.putAppKeyToCustomer(enterpriseId,appKey,function(err,result){
                        if(err){
                            logger.error(err)
                            msg+=";保存APPKEY"+appKey+"到数据库失败，请联系管理员"
                        }else{
                            msg+=";保存APPKEY成功"
                            logger.debug(msg)
                        }
                        var socketConn = __socketIO.sockets.connected[socketId];
                        if (!socketConn) {
                            logger.error(new Error('无法拿到socket连接'));
                            return;
                        }
                        var pushInfo = {
                            // 任务id, @see table CloudDB.Task.taskId
                            taskId: "",
                            // 任务类型, @see table CloudDB.Task.taskType
                            taskType: "",
                            // 子任务名称, 可选
                            description: "",
                            // 任务进度百分比, 0-100
                            taskProgress: "",
                            // 任务完成标志
                            isDone: isDone,
                            // 错误消息
                            errmsg: errmsg,
                            // 消息体
                            msg:msg
                        };
                        logger.debug(JSON.stringify(pushInfo));
                        socketConn.emit("updateAppkey-ERP", pushInfo);
                    })
                }
            });
            res.json(new Feedback(FBCode.WAIT, "正在同步"));
        }
    });


    /**
     * EDI 数据库同步接口(同步当前登录用户)
     */
    app.post(v1Path + '/erpAsync/:enterpriseId', function (req, res) {
        logger.enter();
        var enterpriseId = req.params.enterpriseId;
        // 判断是否已登录
        if (_.isUndefined(req.session.enterpriseInfo) || !req.session.identityInfo || !req.session.identityInfo.isAdmin) {
            // 未登录用户 直接返回提示未登录没有权限初始化 DB
            return res.json(new Feedback(FBCode.NOTFOUND, "用户未登录,不能进行此项操作."));
        }

        var userName = req.session.identityInfo.UserCode;
        var password = req.body.password;
        password = new Buffer(password, 'base64').toString();

        logger.dump('点击同步商品 后 的socketId:');
        logger.dump(req.session.socketId);

        // --- test data ---
        //password = 'cloud@romens';
        // --- test data ---
        var isVerified = false;
        var syncResult = undefined;
        async.series([
            // 用户密码验证
            function (done) {
                __yy365Service.login(userName, password, function (err, userData) {
                    if (err) {
                        logger.error('Password Verify Fail...', err);
                        return done(err);
                    }
                    logger.ndump('Result Data: ', userData);
                    // 如果返回没有报错
                    if (userData.search('!ERROR!') == -1) {
                        isVerified = true;
                    }
                    done();
                });
            },
            // 启动数据库同步
            function (done) {
                if (isVerified) {
                    model.ediTablesDataSync(enterpriseId, req.session.socketId, function (err, result) {
                        if (err) {
                            logger.error(err);
                            return done(err);
                        }
                        syncResult = result;
                        done();
                    });
                }
                else {
                    done();
                }
            }
        ], function (err) {
            if (err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.LOGINFAILURE, '内部异常', {uid: userName, taskId: -1}));
                ;
            }
            if (!isVerified) {
                return res.json(new Feedback(FBCode.LOGINFAILURE, '密码校验有误', {uid: userName, taskId: -1}));
            }
            else if (isVerified && syncResult.status == 'REJECT') {
                return res.json(new Feedback(FBCode.INVALIDACTION, "当前存在进行中的同步任务,请稍后再试.", {uid: userName, taskId: -1}));
            }
            else if (isVerified && syncResult.status == 'ALLOW') {
                res.json(new Feedback(FBCode.SUCCESS, "启动同步数据", {uid: userName, taskId: syncResult.taskId}));
            }
        });
    });

    /**
     * EDI 数据库同步历史
     */
    app.get(v1Path + '/erpSettingHistory/:enterpriseId', function (req, res) {
        logger.enter();
        var enterpriseId = req.params.enterpriseId;
        // 判断是否已登录
        if (_.isUndefined(req.session.enterpriseInfo) || !req.session.identityInfo || !req.session.identityInfo.isAdmin) {
            // 未登录用户
            return res.json(new Feedback(FBCode.NOTFOUND, "用户未登录,不能进行此项操作."));
        }

        // 获取同步历史数据
        model.getErpSyncHistory(enterpriseId, function (err, result) {
            if (err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, "数据库异常.", {}));

            }
            res.json(new Feedback(FBCode.SUCCESS, "启动同步数据", result));
        });

    });

    /**
     * EDI 数据homepage
     */
    app.get(v1Path + '/:enterpriseType/home/:enterpriseId', function (req, res) {
        logger.enter();
        var enterpriseId = req.params.enterpriseId;
        // 判断是否已登录
        if (_.isUndefined(req.session.enterpriseInfo) || !req.session.identityInfo || !req.session.identityInfo.isAdmin) {
            // 未登录用户
            return res.json(new Feedback(FBCode.NOTFOUND, "用户未登录,不能进行此项操作."));
        }
        var enterpriseType = req.params.enterpriseType||"SELLER";
        //quotation: "昨日询价笔数",
        //number: "昨日订单笔数",
        //amount: "昨日订单金额",
        //ship: "昨日出库笔数",
        //returns: "昨日退货笔数",
        //lastlogin:"上次登陆日期时间",
        //clientBuyerTotal:"采购客户总数"
        //clientBuyerMatched:"采购客户匹配数"
        //clientSellerTotal:"供应商总数"
        //clientSellerMatched:"供应商匹配数"
        //goodsInfoTotal:"商品同步总数"
        //goodsInfoMatched:"商品匹配数"
        //data:[
        //    ["日期":金额]
        //]
        model.getHomePageData(enterpriseId, enterpriseType,function (err, result) {
            if (err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, "数据库异常.", {}));

            }
            res.json(new Feedback(FBCode.SUCCESS, "获取数据成功", result));
        });

    });


    /**
     *首页我的客户 列表跳转
     */
    app.get(v1Path + '/seller/client/:enterpriseId', function (req, res) {
        logger.enter();
        var enterpriseId = req.params.enterpriseId;
        var page = req.query.page||1;
        var pageSize = req.query.pageSize||10;
        var keywords = req.query.keyWords||"";
        var status = req.query.status||"";//-1：全部 0：未匹配 1：已匹配
        var filter = {
            pageIndex: page,
            pageSize: pageSize,
            status: status,
            keywords: keywords
        };
        // 判断是否已登录
        if (_.isUndefined(req.session.enterpriseInfo) || !req.session.identityInfo || !req.session.identityInfo.isAdmin) {
            // 未登录用户
            return res.json(new Feedback(FBCode.NOTFOUND, "用户未登录,不能进行此项操作."));
        }
        model.getMyClients(enterpriseId, filter,function (err, result) {
            if (err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, "数据库异常.", {}));

            }
            var feedbackData = {
                filter: filter,
                clients: result
            };
            res.json(new Feedback(FBCode.SUCCESS, "获取我的客户数据成功", feedbackData));
        });

    });

    /**
     *首页我的供应商 列表跳转
     */
    app.get(v1Path + '/buyer/supplier/:enterpriseId', function (req, res) {
        logger.enter();
        var enterpriseId = req.params.enterpriseId;
        var page = req.query.page||1;
        var pageSize = req.query.pageSize||10;
        var keywords = req.query.keyWords||"";
        var status = req.query.status||"";
        var filter = {
            pageIndex: page,
            pageSize: pageSize,
            status: status,
            keywords: keywords
        };
        // 判断是否已登录
        if (_.isUndefined(req.session.enterpriseInfo) || !req.session.identityInfo || !req.session.identityInfo.isAdmin) {
            // 未登录用户
            return res.json(new Feedback(FBCode.NOTFOUND, "用户未登录,不能进行此项操作."));
        }
        model.getMySuppliers(enterpriseId, filter,function (err, result) {
            if (err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, "数据库异常.", {}));

            }
            var feedbackData = {
                filter: filter,
                suppliers: result
            };
            res.json(new Feedback(FBCode.SUCCESS, "获取我的供应商数据成功", feedbackData));
        });

    });
};