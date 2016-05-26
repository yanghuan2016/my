/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports=function() {

    /**
     * Constants
     */

    // 默认Task表所在数据库
    var DBNAME = __cloudDBName;
    
    // Redis的Key名前缀, <TASK_PREFIX>_<taskId>, 作为键名
    var TASK_PREFIX = "TASK_";
    // task redis 保存一周
    var TASK_CACHE_TTL = 3600*24*7;
    
    // Pubsub Service channel name prefix
    var TASK_PUBSUB_PREFIX = "PUBSUB_TASK_";
    
    var TASK_HANDLER_PATH = __services_path + "/tasks/";
    /**
     * system service handles
     */
    var logger = __logService;
    var cache = __cacheService;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");
    var moment = require('moment');
    var async = require('async');
    var uuid = require('uuid').v1;

    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    
    var cronjob = require("cron").CronJob;
    
    var JobList = {};
    var daemonJob = null;

    /**
     * Project modules
     */

    logger.info("Initializing Task Service ...");
    


    /**
     * 将任务由Pending转为Running的提前量
     */
    var PREPARE_SECONDS = 60;
    var LAST_LOADTIME = moment(0);
    
    var taskService = {

        /**
         * Add a task into database
         * @param taskInfo
         * @param socketId, a socket.io socket id for receiving messages on this task
         * @param onPubSub, 当收到任务执行pubsub消息的回调函数
         * @param callback
         */
        insertTask: function(taskInfo, socketId, onPubSub, callback){
            logger.enter();
            
            var pubsubChannel = uuid();
            
            taskInfo.pubsubChannel = pubsubChannel;
            __dbService.insertTask(DBNAME, taskInfo, function(err, taskId){
                if (err){
                    logger.err("Add task into database error");
                    callback(err);
                } else {
                    logger.ndump(pubsubChannel);
                    __pubsubService.subscribe(pubsubChannel, function onPubSubMsg(data){
                        logger.enter();
                        
                        var msg = data;
                        logger.ndump("msg", msg);

                        // 如果有订阅消息handler,则执行
                        if (onPubSub)
                            onPubSub(msg);
                    });

                    callback(null, taskId);
                }
            });
        },
    
        /**
         * scheduleTask
         *      设置一个定时任务到scheduler中
         * @param taskInfo      任务
         *
         * 执行任务时:
         * 1. 记载本次执行的起止时间
         * 2. 记录本次执行的结果, 如果成功,则更新任务的平均执行时间
         */
        scheduleTask: function(taskInfo) {
            logger.enter();

            var cronTime;
            async.series([
                function checkTasksShouldStarted(done) {
                    switch (taskInfo.taskStatus) {
                        case taskService.enum.taskStatus.PENDING:
                            var prepareTime = moment(taskInfo.startAt).subtract(PREPARE_SECONDS,'s');
                            logger.info("TaskId <" + taskInfo.taskId + "> is not required to start, it will start at " + prepareTime.format("YYYY-MM-DD HH:mm:ss"));

                            var now = moment();
                            logger.ndump("now", now);
                            logger.ndump("prepareTime", prepareTime);

                            if (now.unix() < prepareTime.unix()) {
                                // 提前50秒唤醒
                                cronTime = prepareTime.add(10,'s').toDate();
                                logger.ndump("cronTime", cronTime);
                                return done();
                            } else {
                                __dbService.editTask(DBNAME, taskInfo.taskId, {taskStatus: taskService.enum.taskStatus.Running}, function(err, result){
                                    if (err) {
                                        logger.error("Fail to set TaskStatus to RUNNING on taskId <" + taskInfo.taskId + ">");
                                    }
                                    return done("Task Status Changed to RUNNING");
                                });
                            }
                            break;
                            
                        case taskService.enum.taskStatus.RUNNING:
                            cronTime = makeCronTimeByTaskInfo(taskInfo);
                            return done();
                        
                        case taskService.enum.taskStatus.EXPIRED:
                        case taskService.enum.taskStatus.DELETED:
                            logger.info("TaskId <" + taskInfo.taskStatus + "> should not be scheduled!!!");
                            
                            if (JobList[taskInfo.taskId] && JobList[taskInfo.taskId].jobInfo ) {
                                logger.info("stopping task <" + taskInfo.taskId + "> ...");
                                JobList[taskInfo.taskId].jobInfo.stop();
                                delete JobList[taskInfo.taskId];
                            }
                    }
                }],
                function(err, result) {
                    logger.footprint();
                    if (!err) {
                        logger.footprint();
                        if (cronTime) {
                            logger.ndump("cronTime", cronTime);
                            var job = new cronjob(
                                cronTime,
                                function () {
                                    switch (taskInfo.taskStatus) {

                                        /**
                                         * 任务未到开始时间,设置定时器唤醒任务执行
                                         */
                                        case taskService.enum.taskStatus.PENDING:
                                            taskAlarm(taskInfo);
                                            break;

                                        /**
                                         * 任务已到执行时间,定时执行逻辑
                                         */
                                        case taskService.enum.taskStatus.RUNNING:
                                            taskRunner(taskInfo);
                                            break;
                                    }
                                }
                            );

                            // 保存jobinfo和taskinfo
                            JobList[taskInfo.taskId] = {
                                jobInfo: job,
                                taskInfo: taskInfo
                            };

                            job.start();
                        }
                    }
                }
            );
        },

        startScheduler: function(){
            logger.enter();
            
            // 启动守护定时任务,该任务用来加载新修改的任务
            daemonJob = new cronjob("* * * * * *", function(){
                taskService.refreshTasks();
            });

            daemonJob.start();
        },

        /**
         * 在redis中设置任务的进度, 0-1间的小数
         * @param taskId
         * @param value
         */
        setProgress: function(taskId, value) {
            logger.enter();
            if ( value > 1 ) {
                logger.error("The progress value cannot be bigger than 1");
                return false;
            }
            
            if (JobList[taskId] && JobList[taskId].taskInfo) {
                (JobList[taskId].taskInfo)['progress'] = value;
                taskService.setCachedTaskInfo(JobList[taskId].taskInfo);
            }
        },

        /**
         * Publish a message to pubsub service
         * @param taskId
         * @param message
         */
        publishTask: function(taskId, message){
            logger.enter();
            
            __pubsubService.publish(TASK_PUBSUB_PREFIX + taskId, message);
        },

        /**
         * Publish task progresss information
         * @param taskId
         * @param value, 0..1, 0.92 for 92%
         * @param description
         */
        publishProgress: function(taskId, value, description){
            logger.enter();
            taskService.publishTask(
                taskId, 
                {
                    progress: value,
                    description: description,
                }
            );
        },

        /**
         * 从redis中读取任务的属性和状态
         * @param taskId
         */
        getCachedTaskInfo: function(taskId, callback) {
            logger.enter();
            cache.get(TASK_PREFIX+taskId, function(fbcode, taskData){
                if (fbcode!=FBCode.SUCCESS) {
                    logger.error("Fail to get redis value from key <" + TASK_PREFIX+taskId + ">.");
                    callback(FBCode.REDISERR);
                } else {
                    callback(null, JSON.parse(taskData));
                }
            });
        },
        
        setCachedTaskInfo: function(taskInfo) {
            logger.enter();
            if (taskInfo) {
                cache.set(TASK_PREFIX+taskInfo.taskId, taskInfo, TASK_CACHE_TTL);
            }
        },
        
        /**
         * reload the task from db
         */
        refreshTasks: function(){
            logger.enter();
            var taskList = {};
            var taskIdList = [];
            var now = moment();
            async.series(
                [
                    // 加载自上次加载后变化的任务
                    function loadModifiedTasksFromDB(done){
                        // logger.enter();
                        __dbService.listTasks(DBNAME, null, LAST_LOADTIME.format("YYYY-MM-DD HH:mm:ss"), function(err, result){
                            LAST_LOADTIME = now;

                            if (err){
                                logger.error("获取任务数据失败");
                                done(err);
                            } else {
                                taskList = underscore.indexBy(result, "taskId");
                                taskIdList = underscore.pluck(result, "taskId");
                                // logger.ndump('taskList', taskList);
                                done(null);
                            }
                        });
                    },

                    // 加载任务的统计数据
                    function loadTaskStatistics(done){
                        // logger.enter();
                        // logger.ndump("taskIdList", taskIdList);
                        if (taskIdList.length) {
                            __dbService.listTaskStatistics(DBNAME, taskIdList, function (err, result) {
                                if (err) {
                                    logger.error("读取任务状态失败");
                                } else {
                                    var taskStatistics = underscore.indexBy(result, "taskId");
                                    if (taskStatistics) {
                                        for (var taskId in taskList) {
                                            logger.ndump('taskId', taskId);
                                            if (taskStatistics[taskId]) {
                                                taskList[taskId].count = taskStatistics[taskId].count || 0;
                                                taskList[taskId].firstRun = taskStatistics[taskId].firstRun || "";
                                                taskList[taskId].lastRun = taskStatistics[taskId].lastRun || "";
                                                taskList[taskId].lastDuration = taskStatistics[taskId].lastDuration || 0;
                                                taskList[taskId].totalDuration = taskStatistics[taskId].totalDuration || 0;
                                            } else {
                                                taskList[taskId].count = 0;
                                                taskList[taskId].firstRun = "";
                                                taskList[taskId].lastRun = "";
                                                taskList[taskId].lastDuration = 0;
                                                taskList[taskId].totalDuration = 0;
                                            }
                                            taskList[taskId].isHibernating = true;
                                        }
                                    }
                                }
                                done(err);
                            });
                        }
                    }
                ],
                // 执行新任务
                function(err, resultList) {
                    logger.ndump("taskList", taskList);
                    async.eachSeries(taskList,
                        function (task, cb) {
                            logger.ndump('task', task);
                            var taskId = task.taskId;
                            async.series(
                                [
                                    // 终止任务
                                    function stopModifiedJobs(finish) {
                                        logger.enter();

                                        if (JobList[taskId]) {
                                            var job = JobList[taskId].jobInfo;
                                            if (job)
                                                job.stop();

                                        }
                                        finish();
                                    },

                                    // 重新设定任务
                                    function startSchedule(finish) {
                                        logger.enter();
                                        if (isActiveTask(task.taskStatus)) {
                                            taskService.scheduleTask(task);
                                        }
                                        finish(null);
                                    }
                                ],
                                function (err) {
                                    cb(null);
                                }
                            );
                        } 
                    );
                }
            );
        }
    };

    /**
     * 每个任务类别对应一个handler
     * @type {{ORDER_CLOSE_UNPAID: TaskHandler.ORDER_CLOSE_UNPAID, SHIP_RECEIVE: TaskHandler.SHIP_RECEIVE, REFUND_EXECUTE: TaskHandler.REFUND_EXECUTE}}
     */
    var TaskHandler = {};
    //     TASK_ORDER_CLOSE_UNPAID: "/tasks/orderCloseUnpaid",
    //     TASK_SHIP_RECEIVE: "/tasks/shipReceive",
    //     TASK_REFUND_EXECUTE: "/tasks/refundExecute",
    //    
    // };

    /**
     * 到了Task启动时间,开始执行任务
     * @param taskInfo
     */
    var taskAlarm = function(taskInfo) {
        logger.enter();

        // 删除对应task的job
        JobList[taskInfo.taskId].jobInfo.stop();
        
        // 修改任务状态,下次刷新后启动
        __dbService.editTask(DBNAME, taskInfo.taskId, {taskStatus: taskService.enum.taskStatus.RUNNING}, function(err, result){
            if (err) {
                logger.error("DBFailure on changing TaskStatus=RUNNING");
            } 
        });
    };

    /**
     * 任务执行器
     * @param taskInfo
     */
    var taskRunner = function(taskInfo) {
        logger.enter();

        var now = moment();
        var startAt = moment(taskInfo.startAt);
        var stopAt = moment(taskInfo.stopAt);
        var isMultiEntry = taskInfo.isMultiEntry;

        if (now.unix() < startAt.unix() && startAt.unix() != 0) {
            // 尚未到达启动时刻
            logger.info("Check startAt not reached! Skip executing ...");
            
        } else if ( (stopAt.unix() && now.unix() >= stopAt.unix()) ||
                    (taskInfo.maxCount && taskInfo.count>=taskInfo.maxCount) ) {
            // 到达结束时刻, 或到达最大计数
            logger.info("Check stopAt reached! or maxCount reached! stop job");

            // update db
            __dbService.editTask(DBNAME, taskInfo.taskId, {taskStatus: taskService.enum.taskStatus.EXPIRED}, function (err, result) {
                logger.debug("taskId <" + taskInfo.taskId + "> set to Expired");
                if (!err) {
                    taskInfo.taskStatus = taskService.enum.taskStatus.EXPIRED;
                    taskService.setCachedTaskInfo(taskInfo);
                    JobList[taskInfo.taskId].jobInfo.stop();
                }
            });
        } else {
            var beginTime = moment();
            logger.ndump("taskInfo", taskInfo);
      
            // 判断是否重复进入正在执行的任务
            if ( underscore.has(taskInfo, 'isHibernating') && !taskInfo.isHibernating && 
                 underscore.has(taskInfo, 'isMultiEntry') && !taskInfo.isMultiEntry ){
                logger.warn("Task <" + taskInfo.taskId + "> is not allowed to execute in multiple entries");    
                return;
            }
            
            if (!underscore.has(TaskHandler, taskInfo.taskType)) {
                logger.fatal("TaskType <" + taskInfo.taskType + "> doesn't have a handler!!!");
                return;
            }
            
            // load the handler
            var handler = require(TaskHandler[taskInfo.taskType]);
            if (underscore.isUndefined(handler)){
                logger.fatal("TaskType <" + taskInfo.taskType + "> doesn't have a handler!!!");
                return;
            }
            
            // update cache
            taskInfo.isHibernating = false;
            taskInfo.progress = 0;
            taskService.setCachedTaskInfo(taskInfo);
            
            // execute the handler
            if (!underscore.isObject(taskInfo.taskParam))
            {
                taskInfo.taskParam = JSON.parse(taskInfo.taskParam);
            }
            logger.warn(">>>>>>>>>>>>> BEGIN OF Task Execution for taskId<" + taskInfo.taskId + "> <<<<<<<<<<<<<");

            handler(taskInfo, function(err, message){
                logger.enter("Task <" + taskInfo.taskId + "> is finished");
                var endTime = moment();
                var duration = (endTime - beginTime) / 1000;
                var taskResult = {
                    beginAt: beginTime.format("YYYY-MM-DD HH:mm:ss"),
                    endAt: endTime.format("YYYY-MM-DD HH:mm:ss"),
                    taskParam: taskInfo.taskParam,
                    lastDuration: duration,
                    isSuccess: underscore.isNull(err),
                    failureReason:underscore.isNull(err)?"":err.toString()
                };

                // 更新taskInfo
                taskInfo.isHibernating = true;
                taskInfo.progress = 1.0;
                taskInfo.count++;
                taskInfo.lastRun = taskResult.endTime;
                taskInfo.firstRun = taskInfo.firstRun || taskInfo.lastRun;
                taskInfo.lastDuration = duration;
                taskInfo.totalDuration += duration;
                JobList[taskInfo.taskId].taskInfo = taskInfo;
                taskService.setCachedTaskInfo(taskInfo.taskId);
                
                if (err) {
                    logger.error(err + message);
                } else {
                    logger.ndump("taskResult", taskResult);
                }
                // 去更新数据库
                __dbService.updateTaskResult(DBNAME, taskInfo.taskId, taskResult, function (err, result) {
                    if (err) {
                        logger.error(err);
                    } else {
                        logger.debug("Task<" + taskInfo.taskId + "> statistic data updated!");

                        if(taskInfo.maxCount==taskInfo.count){
                            __dbService.editTask(DBNAME, taskInfo.taskId, {taskStatus: taskService.enum.taskStatus.EXPIRED}, function (err, result) {
                                logger.debug("taskId <" + taskInfo.taskId + "> set to Expired");
                                if (!err) {
                                    taskInfo.taskStatus = taskService.enum.taskStatus.EXPIRED;
                                    taskService.setCachedTaskInfo(taskInfo);
                                    JobList[taskInfo.taskId].jobInfo.stop();
                                }
                            });

                        }}
                });
                logger.warn(">>>>>>>>>>>>> END OF Task Execution for taskId<" + taskInfo.taskId + "> <<<<<<<<<<<<<");
                logger.info();
                logger.info();
            });
        }
    };

    /**
     * 拼接crontab 时间控制字符串
     * @param taskInfo
     * @returns {string}
     */
    var makeCronTimeByTaskInfo = function(taskInfo){
        logger.enter();
        
        // logger.ndump("taskInfo", taskInfo);
        
        if (underscore.isEmpty(taskInfo.second) ||
            underscore.isEmpty(taskInfo.minute) ||
            underscore.isEmpty(taskInfo.hour) ||
            underscore.isEmpty(taskInfo.dom) ||
            underscore.isEmpty(taskInfo.mon) ||
            underscore.isEmpty(taskInfo.dow)) {
            logger.error("crontab时间字段信息不全: " + JSON.stringify(taskInfo));
            return null;
        }
        var ret=taskInfo.second + " " + 
               taskInfo.minute + " " +
               taskInfo.hour + " " +
               taskInfo.dom + " " +
               taskInfo.mon + " " +
               taskInfo.dow;
        logger.ndump("ret", ret);
        return ret;
    };
    
    var isActiveTask = function(taskStatus) {
        return  taskStatus===taskService.enum.taskStatus.RUNNING ||
                taskStatus===taskService.enum.taskStatus.PENDING;
    };
    
    /**
     * 延迟加载数据库表结构的枚举列后选项
     */
    setTimeout(lateInit, 3000);
    function lateInit(){
        __dbService.makeEnumObjFromDB(DBNAME, "Task", function(err, enums){
            if (!err) {
                __taskService.enum = enums;
                logger.ndump("__taskService.enum", __taskService.enum);
                // init task handlers path mapping
                var taskType = __taskService.enum.taskType;
                underscore.map(taskType, function(key, value){
                    TaskHandler[key] = TASK_HANDLER_PATH + "" + value;
                });
            }
        });
    }
    
    return taskService;
}
