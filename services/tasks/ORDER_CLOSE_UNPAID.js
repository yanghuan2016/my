
module.exports=function(taskParam, callback){
    var logger = __logService,
        cloudDB = __cloudDBName,
        dbService = global.__dbService,
        underscore=require('underscore'),
        async = require("async"),
        tParam=taskParam.taskParam;


    var orderId=tParam.orderId,
        customerDB=tParam.customerDB;



    logger.fatal(orderId);



    //查询该订单是否是 ONLINE && UNPAID
    var closeOrder=false;
    async.series([
            //查询该订单的信息
            function(done){
                dbService.getOrderInfo(customerDB,orderId,function(result){
                    if(underscore.isError(result)){
                        logger.error(result);
                        return done(result);
                    }else{
                        //若订单提交成功 一定时间 没有处理 支付状态则一定是UNPAID 状态,并且不是关闭状态
                        //存在一直为UNPAID 但是订单被关闭的情况
                        var orderInfo=result,
                            error=null;
                        if(!underscore.isArray(orderInfo)
                            &&orderInfo.paymentStatus=='UNPAID'
                            &&orderInfo.status!='CLOSED'){
                                closeOrder=true;
                        }
                        if(underscore.isArray(orderInfo)){
                                logger.fatal('该订单数据没有查询到,请确认');
                                error=new Error('处理自动关闭订单任务的时候,没有找到即将关闭的订单信息,请确认');
                        }
                        done(error,result);
                    }
                })
            },
            //更新订单状态
            function(done){
                if(!closeOrder){
                    done();
                }else{
                    //更新 OrderInfo 为CLOSED
                    dbService.updateStatus(customerDB,orderId,'CLOSED',function(result){
                        if(underscore.isError(result)){
                            logger.error(result);
                            done(result);
                        }else{
                            done(null,result);
                        }
                    });
                }
            }
    ],function(err,result){
            if(err){
                logger.error(err);
                return callback(err);
            }else{
                return callback(err,result);
            }
        }
    );

};