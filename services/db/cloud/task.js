/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports=function(){

    /**
     * system service handles
     */
    var logger = global.__logService;
    var db = global.__mysql;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");
    var _ = require("lodash");
    var keywordsToArray = require("keywords-array");
    var sqlBuilder = require("sqlobj");
    var async = require("async");

    var misc = require(__modules_path + "/misc");
    var knex = require('knex')({client: "mysql"});

    /**
     * DB Service provider
     */
    var dbService = {

        /**
         * 获取同步历史数据
         * @param dbName
         * @param enterpriseId
         * @param callback
         */
        getLastSyncTaskHistory : function(dbName,enterpriseId,callback){
            logger.enter();
            var sql = sprintf(
                "SELECT TaskHistory.taskId, TaskHistory.duration, TaskHistory.isSuccess, "+
                "  DATE_FORMAT(TaskHistory.beginAt,'%%Y-%%m-%%d %%H:%%i:%%s ') AS beginAt, "+
                "  DATE_FORMAT(TaskHistory.endAt,'%%Y-%%m-%%d %%H:%%i:%%s ') AS endAt "+
                "  FROM %s.TaskHistory,%s.Task " +
                " WHERE TaskHistory.taskId = Task.taskId" +
                "   AND Task.customerId = %d " +
                "   AND Task.taskType = 'ERP_SYNC_GOODS'" +
                "   AND Task.taskStatus = 'EXPIRED' " +
                "   AND TaskHistory.isSuccess = 1 " +
                "   ORDER BY TaskHistory.endAt DESC" +
                "   LIMIT 0,1 ",
                dbName, dbName, enterpriseId
            );

            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * 将新任务写入数据库
         * @param dbName
         * @param taskInfo
         * @param callback
         */
        insertTask: function(dbName, taskInfo, callback){
            logger.enter();
            taskInfo.taskParam = JSON.stringify(taskInfo.taskParam);
            logger.ndump('taskInfo: ', taskInfo);
            
            var sql = sqlBuilder({
                INSERT: dbName + ".Task",
                SET: taskInfo
            });
            logger.sql(sql);
            __mysql.query( sql, function(err, result){
                    if (err) {
                        logger.sqlerr(err);
                        callback(err);
                    } else {
                        callback(null, result.insertId);
                    }
                }
            )
        },

        /**
         * 从数据库表Task中删除一个任务
         * @param dbName
         * @param taskId
         * @param callback
         */
        deleteTask: function(dbName, taskId, callback){
            logger.enter();
            var sql = sqlBuilder({
                UPDATE: dbName + ".Task",
                SET: {
                    taskStatus: "DELETED"
                },
                WHERE: {
                    'taskId': taskId
                }
            });
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null);
                }
            });
        },

        /**
         * 获取一个任务信息
         * @param dbName
         * @param taskId
         * @param callback
         */
        getTask: function(dbName, taskId, callback){
            logger.enter();
            var sql = sqlBuilder({
                SELECT: [
                    'taskId', 'taskName', 'taskType', 'taskStatus', 'taskParam',
                    'isMultiEntry', 'second', 'minute', 'hour', 'dom', 'mon', 'dow', 'maxCount',
                    'pubsubChannel', 'UNIX_TIMESTAMP(startAt) AS startAt,',
                    'UNIX_TIMESTAMP(stopAt) AS stopAt'
                ],
                FROM: dbName + ".Task",
                WHERE: {
                    taskId: taskId
                }
            });
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result[0]);
                }
            });
        },

        /**
         * [定时的离线任务,并非一次性的task]
         * 判断 id为customerId的企业  是否已经存在任务类型为taskType  的离线任务
         * @param dbName            Task表所在数据库名字
         * @param taskType          任务类型
         * @param customerId        企业Id,与enterpriseId对应
         * @param callback          回调函数
         */
        judgeScheduleTaskExistOrNot:function(dbName,taskType,customerId,callback){
            logger.enter();
            var sql=knex.withSchema(dbName).select("taskId").from("Task").where(
                {
                    taskType:taskType,
                    customerId:customerId,
                    maxCount:0
                }
            ).toString();
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
               if(err){
                   logger.error(err);
                   callback(err);
               }else{
                   callback(err,result.length!=0);
               }
            });
        }
        ,
        /**
         * 根据企业ID 获取离线任务的状态
         * @param dbName  cloudDB Name
         * @param taskType  任务类型,若为空,查询的是所有的任务,不为空的则只是筛选特定的
         * @param customerId 特定企业Id
         * @param callback  回调函数
         */
        getCertainCustomerTask:function(dbName,taskType,customerId,callback){
            logger.enter();
            var sql="" +
                "SELECT " +
                "   taskId,taskName,taskType,taskStatus," +
                "   DATE_FORMAT(startAt,'%%Y-%%m-%%d %%H:%%i:%%s ') AS startAt, "+
                "   DATE_FORMAT(stopAt,'%%Y-%%m-%%d %%H:%%i:%%s ') AS stopAt "+
                "FROM %s.Task  "+
                "   WHERE " +
                " customerId=%d AND taskStatus!='DELETED' " +
                " AND maxCount<>0 ";
            if(taskType!=""){
                sql +=" AND taskType='%s' ";
                sql=sprintf(sql,dbName,customerId,taskType);
            }else{
                sql=sprintf(sql,dbName,customerId);
            }
            sql+=";";
            logger.sql(sql);
            __mysql.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(null, results);
                }
            });
        },

        /**
         * 加载指定类型的任务列表, taskType为空时表示获取所有类型的任务
         * @param dbName
         * @param taskType
         * @param timestamp, 按照更新timestamp匹配
         * @param callback
         */
        listTasks: function(dbName, taskType, timestamp, callback){
             logger.enter();
            
            var sql = sprintf(
                "SELECT taskId, taskName, taskType, taskStatus, taskParam, " +
                "       isMultiEntry, second, minute, hour, dom, mon, dow, maxCount, DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%s') as updatedOn, " +
                "       pubsubChannel,customerId, UNIX_TIMESTAMP(startAt) AS startAt," +
                "       UNIX_TIMESTAMP(stopAt) AS stopAt " +
                "  FROM %s.Task " +
                " WHERE updatedOn>='%s' "+
                (underscore.isEmpty(taskType)?"":"taskType='"+taskType+"' ") + ";",
                dbName, timestamp
            );
            
             logger.sql(sql);
            __mysql.query(sql, [taskType], function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * 编辑任务
         * @param dbName
         * @param taskId
         * @param taskInfo
         * @param callback
         */
        editTask: function(dbName, taskId, taskInfo, callback){
            logger.enter();
            var sql = sqlBuilder({
                UPDATE: dbName + ".Task",
                   SET: taskInfo,
                 WHERE: {
                    taskId: taskId   
                 }
            });
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result.affectedRows);
                }
            });
        },

        /**
         * 将任务执行情况写入数据库
         * @param dbName
         * @param taskId
         * @param taskInfo
         * @param taskResult
         * @param callback
         */
        updateTaskResult: function(dbName, taskId, taskResult, callback){
            logger.enter();
            async.series(
                [
                    function updateTaskStatistics(done) {

                        var isSuccess=taskResult.isSuccess==1,
                            sqlInsert=isSuccess?"":" errorCount, ",
                            sqlValue=isSuccess?"":"errorCount=errorCount+1,",
                            sqlInValue=isSuccess?"":",1";
                            console.log(sqlInValue);
                        var sql= sprintf(
                                "INSERT INTO %s.TaskStatistics (" +
                                " taskId, count,"+sqlInsert+" " +
                                " firstRun, lastRun, lastDuration, " +
                                " totalDuration) " +
                                "VALUES (" +
                                " " + taskId + ",1"+sqlInValue+" ,'" + taskResult.beginAt + "'," +
                                "        '" + taskResult.endTime + "'," + taskResult.lastDuration + "," + taskResult.lastDuration + ") " +
                                "ON DUPLICATE KEY UPDATE count=count+1, "+sqlValue+"lastRun=VALUES(lastRun)," +
                                "                    lastDuration=VALUES(lastDuration), totalDuration=totalDuration + VALUES(lastDuration);",
                                dbName
                            );
                        logger.sql(sql);
                        __mysql.query(sql, function (err, result) {
                            if (err) {
                                logger.sqlerr(err);
                                done(err);
                            } else {
                                done(null, result.affectedRows);
                            }
                        });
                    },

                    function insertTaskHistory(done) {
                        var sql = sprintf(
                            "INSERT INTO %s.TaskHistory " +
                            "           (taskId, beginAt, endAt, taskParam, duration, isSuccess, failureReason) " +
                            "     VALUES(?,?,?,?,?,?,?);",
                            dbName
                        );
                        logger.sql(sql);
                        __mysql.query(
                            sql,
                            [
                                taskId, taskResult.beginAt, taskResult.endAt,
                                misc.stringify(taskResult.taskParam),
                                taskResult.lastDuration, taskResult.isSuccess,
                                misc.stringify(misc.stringWithoutNull(taskResult.failureReason))
                            ],
                            function(err,result){
                                if (err) {
                                    logger.sqlerr(err);
                                    done(err);
                                } else {
                                    done(null, result.affectedRows);
                                }
                            }
                        );

                    }
                ],
                function(err, resultList){
                    if (err) {
                        logger.error("更新Task统计信息和TaskHistory失败");
                        callback(err);
                    } else {
                        callback(null);
                    }
                }
            );
        },

        /**
         * 列出taskIdList中所有任务的统计数据
         * @param dbName
         * @param taskIdList
         * @param callback
         */
        listTaskStatistics: function(dbName, taskIdList, callback){
            logger.enter();

            var sql = sprintf(
                "SELECT taskId, count, DATE_FORMAT(firstRun,'%%Y-%%m-%%d %%H:%%i:%%s') AS firstRun, " +
                "       DATE_FORMAT(lastRun,'%%Y-%%m-%%d %%H:%%i:%%s') AS lastRun, " +
                "       lastDuration, totalDuration " +
                "  FROM %s.TaskStatistics " +
                " WHERE taskId IN %s;",
                dbName, JSON.stringify(taskIdList).replace('[','(').replace(']',')')
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * 列出特定任务类型 的离线任务[状态为RUNNING]
         * @param dbName
         * @param taskType
         * @param callback
         */
        listCertainTypeTask:function(dbName,taskType,callback){
            logger.enter();
            var sql=knex
                .withSchema(dbName)
                .select([
                    'taskId',
                    'taskType',
                    'taskStatus',
                    'customerId',
                    'taskParam'
                ])
                .from('Task')
                .where({
                    taskType:taskType,
                    taskStatus:'RUNNING'
                }).toString();
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err,result);
                }else{
                    callback(err,result);
                }
            });
        }
    };

    return dbService;
};