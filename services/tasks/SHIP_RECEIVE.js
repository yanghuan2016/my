
module.exports=function(taskParam, callback){
    var logger = __logService,
        underscore = require('underscore'),
        async = require("async"),
        dbService=__dbService,
        taskParam=taskParam.taskParam;
        logger.notImplemented();

    logger.dump(JSON.stringify(taskParam));
    var shipId=taskParam.shipId,
        customerDB=taskParam.customerDB,
        isNotReceived=false;

    logger.enter();
    async.series([
            //获取该订单信息
            function(done){
                dbService.metaRetrieveShipInfo(customerDB,shipId,function(err,result){
                    if(err){
                        logger.error(err);
                        return done(err);
                    }
                    var shipItem=result[0];
                    isNotReceived=shipItem.status=='CREATED';
                    done(err,result);
                });
            },
            function(done){
                if(!isNotReceived){
                    return done();
                }else{
                    //更新ShipInfo的状态
                    var updateObj={
                            status:'DELIVERED',
                            isReceived:1
                    };
                    dbService.updateShipInfo(customerDB,shipId,updateObj,function(err,result){
                        if(err){
                            logger.error(err);
                            return done(err);
                        }
                        done(err,result);
                    });
                }
            }
    ],function(err,result){
            if(err){
                logger.error(err);
                return callback(err);
            }
                return callback(err,result);

    });


};