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
var logger = __logService;
var port = __port;

// third modules:
var path = require("path");
var _ = require('lodash');

// scc modules:
var sccPath = require(__modules_path + '/mypath');
var model = require('./model')();
var v1Model= require(__base+'/apps/edi/v1/model')(),
    moment=require('moment'),
    async = require('async');

// initialize
var appRoot = "/" + sccPath.getAppName(__dirname);
var FBCode = require(__modules_path + "/feedback").FBCode;
var Feedback = require(__modules_path + "/feedback").FeedBack;

module.exports = function (app) {
    /**
     * EDI 登录认证接口
     */
    app.route(appRoot)
        .post(ediLoginHandler)
        .delete(ediLogoutHandler);

    function ediLoginHandler(req, res) {
        logger.enter();
        var cloudDB = __cloudDBName;
        var userName = req.body.username;
        var password = req.body.password;

        // todo: 验证用户名&密码

        password = new Buffer(password, 'base64').toString();

        // 大平台登录第三方认证
        __yy365Service.login(userName, password, function (err, userData) {
            if (err) {
                logger.error('OAuth Login Failure...' + err);
                return res.json(new Feedback(FBCode.LOGINFAILURE, "登录失败, 请输入正确的账号密码!"));
            }
            logger.ndump('Result Data: ', userData);
            // 如果返回报错
            if (userData.search('!ERROR!') >= 0) {
                return res.json(new Feedback(FBCode.LOGINFAILURE, userData.substring(7), {uid: userName}));
            }

            /**
             * 检查UserIdentityInfo
             */
            userData = JSON.parse(userData);
            if (!_.has(userData, 'UserIdentityInfo')) {
                logger.warn("医药365OAuth接口返回的数据中没有UserIdentityInfo信息");
                return res.json(new Feedback(FBCode.LOGINFAILURE, "医药365返回信息中缺少企业信息"));
            }

            if (userData.UserIdentityInfo.length < 1) {
                logger.warn("医药365OAuth返回UserIdentityInfo为空");
                return res.json(new Feedback(FBCode.LOGINFAILURE, "医药365返回的企业信息为空"));
            }

            var identityInfo = userData.UserIdentityInfo[0];
            _.extend(identityInfo, userData.UserBaseInfo[0], userData.UserType[0]);
            // 设置是否管理员标志
            identityInfo.isAdmin = _.has(identityInfo, "Role") && identityInfo.Role==="1";

            // 返回数据必填信息检测
            var missingFields = [];
            if (!_.has(identityInfo, 'LicenseNo'))
                missingFields.push("营业执照号码");
            if (!_.has(identityInfo, 'EntCode'))
                missingFields.push('企业编号');
            if (!_.has(identityInfo, 'USERCompanyName'))
                missingFields.push("企业名称");
            if (!_.has(identityInfo, 'Address'))
                missingFields.push("地址");
            if (!_.isEmpty(missingFields))
                return res.json(
                    new Feedback(
                        FBCode.LOGINFAILURE,
                        '企业信息不完整, 请联系医药365平台补充以下资料: ' + JSON.stringify(missingFields),
                        {uid: userName}
                    )
                );

            // 处理并获取用户信息
            model.getLoginEnterpriseInfo(cloudDB, identityInfo, function (err, enterpriseInfo, isExistingEnterprise) {
                logger.ndump('enterpriseInfo', enterpriseInfo);
                logger.ndump('isExistingEnterprise', isExistingEnterprise);
                if (err) {
                    logger.error('读取客户信息出错!');
                    return res.json(new Feedback(FBCode.DBFAILURE, "读取客户信息出错,请稍后再尝试;或者联系系统管理员"));
                }
                // 当非初次认证
                if (enterpriseInfo.enterpriseId) {
                    var portStr = "";
                    if (port !== 80) {
                        portStr = ":" + port.toString();
                    }
                    enterpriseInfo.SccMsgUrl = req.protocol + '://' + req.hostname + portStr + "/api/erp/" + enterpriseInfo.enterpriseId;
                    enterpriseInfo.SccAppCodeUrl = req.protocol + '://' + req.hostname + portStr + "/api/erp/appCode/" + enterpriseInfo.enterpriseId;
                }
                req.session.enterpriseInfo = enterpriseInfo;
                req.session.identityInfo = identityInfo;

                var feedback = {
                    // FIXME: no need to pass access-token here
                    "access-token": req.cookies['connect.sid'],
                    // 是否需要初始化数据库 
                    needInitDB: !isExistingEnterprise,
                    // 在CloudDB.Customer表中的企业信息
                    enterpriseInfo: enterpriseInfo,           // 当needInitDB为TRUE时, 本字段为空
                    // 医药365返回的客户信息级
                    identityInfo: identityInfo
                };
                logger.ndump("feedback", feedback);
                res.json(new Feedback(FBCode.SUCCESS, "登录成功", feedback));
            });
        });
    }

    function ediLogoutHandler(req, res) {
        logger.enter();
        // clear cookies and access-token
        res.header("cookies", undefined);
        res.header("access-token", undefined);
        req.session.destroy();

        res.json(new Feedback(FBCode.SUCCESS, "登出成功."));
    }


    /**
     * 更新socket.io id
     */
    app.route(appRoot + '/socket')
        .post(uploadSocketId);
    function uploadSocketId(req, res) {
        logger.enter();
        req.session.socketId = req.body.socketId;
        req.session.save(function () {
            res.json(new Feedback(FBCode.SUCCESS));
        });
    }

    /**
     * EDI 初始化数据库, url为base64化的营业执照号
     */
    app.post(appRoot + '/db/init', function (req, res) {
        logger.enter();

        logger.ndump("session", req.session);
        var identityInfo = {};
        if (_.has(req.session, "identityInfo"))
            identityInfo = req.session.identityInfo;

        // 判断是否已登录
        logger.ndump('identityInfo', identityInfo);
        if (_.isEmpty(identityInfo)) {
            // 未登录用户 直接返回提示未登录没有权限初始化 DB
            return res.json(new Feedback(FBCode.LOGINFAILURE, "您未获得初始化<" + identityInfo.USERCompanyName + ">数据库的权限!"));
        }

        // start to init database
        var dbSuffix = require("js-md5")(identityInfo.EntCode);
        req.session.enterpriseInfo.customerDBSuffix = dbSuffix;
        var customerDBName = __customerDBPrefix + "_" + dbSuffix;


        // 构造数据
        var taskData = {
            taskName: "初始化企业数据库<" + identityInfo.USERCompanyName + ">",
            taskType: __taskService.enum.taskType.INIT_ENTERPRISE_DB,
            taskStatus: __taskService.enum.taskStatus.RUNNING,
            taskParam: {
                dbName: customerDBName,
                redisConfig: __redisConfig
            },
            maxCount: 1,
            second: "*",
            minute: "*",
            hour: "*",
            dom: "*",
            mon: "*",
            dow: "*"
        };

        // Save the task into database
        var socketId = null;
        if (_.has(req.session, "socketId"))
            socketId = req.session.socketId;
        logger.ndump("taskData", taskData);
        logger.ndump("socketId", socketId);

        // save to task table
        __taskService.insertTask(
            taskData,
            socketId,
            /**
             * Task的PubSub消息接收器
             * @param msg
             */
            function progressUpdate(msgObj) {
                logger.enter();

                logger.ndump('msgObj', msgObj);


                var progress = msgObj.taskProgress;
                var errcode = "";

                if (_.has(msgObj, "errcode")) {
                    errcode = msgObj.errcode;
                }
                var errmsg = "";
                if (_.has(msgObj, "errmsg")) {
                    errmsg = msgObj.errmsg;
                } else {
                    if (progress < 0 || progress > 100) {
                        logger.error("taskId <" + taskInfo.taskId + ">'s progress is illegal: " + progress);
                        return;
                    }
                }
                // transform to socket.io message format
                var pushInfo = {
                    // 任务id, @see table CloudDB.Task.taskId
                    taskId: taskData.taskId,
                    // 任务类型, @see table CloudDB.Task.taskType
                    taskType: taskData.taskType,
                    // 子任务名称, 可选
                    description: taskData.taskName,
                    // 任务进度百分比, 0-100
                    taskProgress: progress,
                    // 任务完成标志
                    isDone: (progress == 100) || errmsg || errmsg.length > 0,
                    // 错误消息码
                    errcode: errcode,
                    // 错误消息
                    errmsg: errmsg
                };
                logger.ndump("pushInfo", pushInfo);

                /**
                 * 处理任务完成的工作
                 */


                if (pushInfo.isDone && pushInfo.errmsg.length == 0) {
                    logger.footprint();
                    model.addEnterpriseInfo(req.session.enterpriseInfo, req.session.identityInfo, function (err, enterpriseInfo) {
                        // logger.ndump("enterpriseInfo", enterpriseInfo);
                        // 当非初次认证
                        if (enterpriseInfo.enterpriseId) {
                            var portStr = "";
                            if (port !== 80) {
                                portStr = ":" + port.toString();
                            }
                            enterpriseInfo.SccMsgUrl = req.protocol + '://' + req.hostname + portStr + "/api/erp/" + enterpriseInfo.enterpriseId;
                            enterpriseInfo.SccAppCodeUrl = req.protocol + '://' + req.hostname + portStr + "/api/erp/appCode/" + enterpriseInfo.enterpriseId;
                        }
                        //添加一个定时的同步商品的离线任务
                        if(!err){
                            insertScheduleModel(enterpriseInfo.enterpriseId);
                        }
                        // 将enterpriseInfo送回前端
                        pushInfo.enterpriseInfo = enterpriseInfo;
                        req.session.enterpriseInfo = enterpriseInfo;
                        // logger.ndump("req.session.enterpriseInfo", req.session.enterpriseInfo);
                        req.session.save();
                        logger.ndump('pushInfo', pushInfo);
                        if (socketId && __socketIO.sockets.connected[socketId]) __socketIO.sockets.connected[socketId].emit("task", pushInfo);
                        model.insertOperator(req.session.enterpriseInfo, req.session.identityInfo, function(err, result) {
                            if (err) {
                                logger.error("保存操作员信息出错");
                            }
                        });
                    });
                } else {
                    logger.ndump('pushInfo', pushInfo);
                    if (socketId && __socketIO.sockets.connected[socketId]) __socketIO.sockets.connected[socketId].emit("task", pushInfo);
                }

            },
            function (err, taskId) {

                if (err) {
                    logger.error(err);
                    res.json(new Feedback(FBCode.DBFAILURE, "数据库初始化失败,请稍后重试或联系管理员"));
                }
                else {
                    taskData.taskId = taskId;
                    res.json(new Feedback(FBCode.SUCCESS, "正在初始化数据库中"));
                }
            }
        );
    });


    /**
     * EDI 数据库同步接口(同步当前登录用户)
     */
    app.get(appRoot + '/db/sync/:enterpriseId', function (req, res) {
        logger.enter();
        var enterpriseInfo = req.params.enterpriseInfo;

        // 判断是否已登录
        if (_.isEmpty(req.session.enterpriseInfo)) {
            // 未登录用户 直接返回提示未登录没有权限初始化 DB
            return res.json(new Feedback(FBCode.LOGINFAILURE, "用户未登录,不能进行此项操作."));
        }

        // 启动数据库同步
        model.ediTablesDataSync(enterpriseInfo.enterpriseId, req.session.socketId, function (err, taskId) {
            if (err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, "同步数据库异常.", {taskId: -1}));
            }
            res.json(new Feedback(FBCode.SUCCESS, "启动同步数据", {taskId: taskId}));
        });
    });

    function insertNewScheduleSyncGoodsTask(enterpriseId,callback){
        var now=moment().format('YYYY-MM-DD '),
            startTime=now +__syncGoodsPeriod.startTime +":00",
            endTime=  now +__syncGoodsPeriod.endTime +":00",
            minutes=(new Date(endTime)-new Date(startTime))/1000/60,
            randomMinutes=Math.random()*minutes,
            ultimateRandomTime=
                moment(new Date(startTime)).add(randomMinutes,'minutes').format('H:m');

        logger.dump('startTime in config:'+startTime);
        logger.dump('endTime in config:'+endTime);

        var hour=ultimateRandomTime.split(':')[0],
            minute=ultimateRandomTime.split(':')[1];

        logger.enter();
        var taskData={};
        taskData.taskName = 'EDI_Tables_Data_Sync';                         // 任务名称
        taskData.taskType = 'ERP_SYNC_GOODS';                               // 任务类型
        taskData.taskStatus = 'RUNNING';                                    // 任务状态
        taskData.taskParam = {enterpriseId: enterpriseId};                  // 任务参数
        taskData.maxCount = 0;                                              // 最大执行数
        taskData.second = '00';                                             // 秒定时任务
        taskData.minute = minute;                                           // 分定时任务
        taskData.hour = hour;                                               // 时定时任务
        taskData.dom = '*';                                                 // 日定时任务
        taskData.mon = '*';                                                 // 月定时任务
        taskData.customerId=enterpriseId;                                   // 执行人ID

        __taskService.insertTask(taskData,0,null,function(err,result){
            if(err){
                logger.error(err);
                callback(err);
            }else{
                callback(err,result);
            }
        })
    }

    function insertScheduleModel(enterpriseId){
        var isExistSameTask=false;
        async.series([
            //判断是否存在同样的离线任务
            function(done){
                v1Model.judgeScheduleTaskExistOrNot(__cloudDBName,"ERP_SYNC_GOODS",enterpriseId,function(err,result){
                    logger.enter();
                    if(err){
                        done(err);
                    }else{
                        isExistSameTask=result;
                        done(err,result);
                    }
                })
            },
            //若存在,则直接回调,否则则添加任务
            function(done){
                logger.enter();
                if(isExistSameTask){
                    done();
                }else{
                    insertNewScheduleSyncGoodsTask(enterpriseId,function(err,result){
                        if(err){
                            logger.error(err);
                            done(err);
                        }else{
                            done(err,result);
                        }
                    });
                }
            }
        ],function(err,result){
            if(err){
                logger.error(err);
                logger.dump('插入同步商品的定时离线任务失败');
            }else{
                logger.dump('插入同步商品的定时离线任务成功');
            }
        });
    }

};
