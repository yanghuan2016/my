/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 *
 * @param taskParam 调用该离线任务的参数 type->Object,包含的属性cloudDB,dbService,redisConnection,sellerEnterpriseId
 * @param callback  回调函数
 *
 */


module.exports = function (taskInfo, callback) {

    var logger = __logService;
    var sprintf = require("sprintf-js").sprintf;
    var taskParam = taskInfo.taskParam;
    var exec = require('child_process').exec;
    var async= require('async');
    var v1Model= require(__base+'/apps/edi/v1/model')(),
        moment=require('moment');
    logger.enter();
    var command = sprintf(
        __bin_path + "/createDB.sh -d %s -h %s -n %d -p '%s'",
        taskParam.dbName,
        taskParam.redisConfig.host,
        taskParam.redisConfig.dbNum,
        taskInfo.pubsubChannel
    );
    logger.ndump("Executing shell command: ", command);

    exec(command, function (err, stdout, stderr) {
        var errmsg = null;
        if(err){
            logger.error("Shell command \"" + command + "\" executed with error: " + stderr);
            switch (err.code) {
                case 1:
                    errmsg = "数据库初始化失败,请稍后重试, 或者联系客服";
                    break;

                case 2:
                    errmsg = "该企业的数据库已经存在,请联系客服解决";
                    break;

            }
            __pubsubService.publish(taskInfo.pubsubChannel, {errcode: err.code, errmsg: errmsg});
            callback(err, errmsg);
        }
        else {
            callback(err, errmsg);
        }
    });

};