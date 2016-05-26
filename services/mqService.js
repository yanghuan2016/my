/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * message queue service
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-10    hc-romens@issue#168
 *
 */
module.exports=function() {

    /**
     * system service handles
     */
    var logger = global.__logService;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");
    var mq = require("bull");
    var Enum = require("enum");

    var OfflineTaskQueue;

    var queues = {};

    /**
     * DB Service provider
     */
    var mqService = {

        /* Offline Task Types */
        TaskTypes: new Enum({
            TaskTypeImportGoodsXLS: 0,   // import goods xls file into db
            TaskTypeImportClientXLS: 1,  // import client xls file into db
            TaskTypeSendSMS: 2,
            TaskTypePostEmail: 3
        }, {ignoreCase: true}),

        /**
         * Get a queue, if nonexist, initiates it
         * @param queueName
         */
        getQueue: function(queueName){
            logger.enter();

            logger.ndump("queueName", queueName);

            /* validate the queue name */
            if (0 > underscore.values(__queues).indexOf(queueName)) {
                logger.error("Unknown queue name: " + queueName);
                return undefined;
            }

            if (underscore.isEmpty(queues[queueName])) {
                logger.trace("Initiating the queue: " + queueName);
                queues[queueName] = mq(queueName, __redis.host);
            }

            return queues[queueName];
        },

        /**
         * push a Task
         *      kickoff a task into mq
         * @param taskInfo
         * @returns {*}
         */
        pushTask: function(taskInfo) {
            logger.enter();

            return this.getQueue(__queues.OfflineTask).add(taskInfo);
        },

        /**
         * popTask
         *      pop up a task from queue
         * @param doSomething, function(taskInfo, done)
         */
        popTask: function(doSomething){
            logger.enter();

            var queue = this.getQueue(__queues.OfflineTask);
            if (!underscore.isUndefined(queue)) {
                queue.process(function (taskInfo, done) {
                    if (this.TaskTypes.has(taskInfo.taskType)) {
                        doSomething(taskInfo, done);
                    } else {
                        logger.error("Tasktype: " + taskInfo.taskType + " is not supported");
                        done();
                    }
                });
                return true;
            }

            return false;
        }

    };

    return mqService;
}
