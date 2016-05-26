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
module.exports=function(taskInfo, callback){
     var logger = __logService,
         cloudDB = __cloudDBName,
         dbService = global.__dbService,
         redisConnection = global.__redisClient,
         _=require('underscore'),
         ERPGoodsAsync = require(__base+'/tools/goodsAsync/ERPGoodsAsync'),
         MsgTransmitter=require(__base+'/modules/msgTransmitter'),
         async = require("async");


    //taskInfo 的数据格式
    var syncGoodsProgressUpdate= function (msgObj) {
        logger.enter();


        var progress = msgObj.taskProgress;
        var errmsg="";
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
            taskId: taskInfo.taskId,
            // 任务类型, @see table CloudDB.Task.taskType
            taskType: taskInfo.taskType,
            // 子任务名称, 可选
            description: taskInfo.taskName,
            // 任务进度百分比, 0-100
            taskProgress: progress,
            // 任务完成标志
            isDone: msgObj.isDone,
            // 错误消息
            errmsg: errmsg,
            // 消息体
            msg:msgObj.msg

        };
        logger.ndump("pushInfo", pushInfo);
        __pubsubService.publish(taskInfo.pubsubChannel,pushInfo);
    };

    var taskParam=taskInfo.taskParam;


    var msgTransmitter = new MsgTransmitter(cloudDB, dbService, redisConnection);
    async.series([
        //同步商品
        function(done){
            msgTransmitter.ERI_REQUEST_GOODS_SYNC(taskParam.enterpriseId,__maxSyncGoodsCount,syncGoodsProgressUpdate,function(err,result){
                if(err){
                    logger.error(err);
                    done(err);
                }else{
                    done(err,result);
                }
            });
        },
        //同步buyer
        function(done){
            msgTransmitter.EDI_REQUEST_BUYER_ALL_TO_SELLER(taskParam.enterpriseId, function (err, feedback) {
                if(err){
                    done(err);
                } else {
                    var sendMsg = '同步采购方完成';
                    logger.dump(sendMsg);
                    syncGoodsProgressUpdate({
                        msg: sendMsg,
                        isDone: false
                    });
                    done(err, feedback);
                }
            });
        },
        //同步seller
        function(done){
            msgTransmitter.EDI_REQUEST_SELLER_ALL_TO_BUYER(taskParam.enterpriseId, function (err, feedback) {
                if(err){
                    done(err);
                }
                else {
                    var sendMsg='同步供应商完成';
                    logger.dump(sendMsg);
                    syncGoodsProgressUpdate({
                        msg:sendMsg,
                        isDone:false
                    });
                    done(err, feedback);
                }
            });
        }
    ],function(err,results){
        if(err){
            var sendMsg="同步失败!";
            logger.dump(sendMsg);
            syncGoodsProgressUpdate({
                msg:"",
                isDone:true,
                errmsg:sendMsg
            });
            callback(err);
        }else{
            var sendMsg='同步成功!';
            logger.dump(sendMsg);
            syncGoodsProgressUpdate({
                msg:sendMsg,
                isDone:true
            });
            callback(err,results);
        }
    });
    
};