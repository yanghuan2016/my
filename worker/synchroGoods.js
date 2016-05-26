module.exports=function(){

    var ERPGoodsAsync = require(__base+'/tools/goodsAsync/ERPGoodsAsync');
    var MsgTransmitter=require(__base+'/modules/msgTransmitter');
    var fs = require('fs');
    var underscore = require('underscore');
    var async = require("async");


    /**
     * Services
     **/
    var logger = __logService;

    var worker={
        synchroGoods:function(cloudDB,dbService,redisConnection,enterpriseId,callback){
            var msgTransmitter = new MsgTransmitter(cloudDB, dbService, redisConnection);
            async.series([
                //同步商品
                function(done){
                    synchroGoods(enterpriseId,function(err,results){
                         if(err){
                             logger.error(err);
                             done(err);
                         }else{
                             done(err,results);
                         }
                    })
                },
                //同步buyer
                function(done){
                    msgTransmitter.EDI_REQUEST_BUYER_ALL_TO_SELLER(enterpriseId, function (err, feedback) {
                        if(err){
                            done(err);
                        } else
                            done(err, feedback);
                    });
                },
                //同步seller
                function(done){
                    msgTransmitter.EDI_REQUEST_SELLER_ALL_TO_BUYER(enterpriseId, function (err, feedback) {
                        if(err){
                            done(err);
                        }
                        else
                            done(err, feedback);
                    });
                }
            ],function(err,results){
              if(err){
                  logger.dump('同步商品出错了');
                  callback(err);
              }else{
               callback(err,results);
              }
            })
        }
    };
    function synchroGoods(enterpriseId,done) {
        var erpGoodsAsync = new ERPGoodsAsync(enterpriseId);
        var goodsCount = undefined;
        var goodsInfokeys = undefined;
        var goodsGuids = undefined;
        var goodsDetails = undefined;
        async.series(
            [   /**
             *   step1 获取所有商品的数量
             **/
                function(cb){
                erpGoodsAsync.getAllGoodsNum(function(err,result){
                    if(err){
                        cb(err);
                    }else{
                        goodsCount = result.data.kckCount;
                        console.log("goodsCount="+goodsCount);
                        cb(null,goodsCount);
                    }
                });
            },
                /**
                 *   step2  用分页的方式获取 商品的guid和updateTime
                 **/
                    function(cb){
                    erpGoodsAsync.getBasicInfoKeys(goodsCount,function(err,basicInfokeys){
                        if(err){
                            cb(err);
                        }else{
                            console.log('basicInfokeys:,', JSON.stringify(basicInfokeys).substr(0,10000));
                            goodsInfokeys = basicInfokeys;
                            cb(null,goodsInfokeys);
                        }
                    });
                },
                /**
                 *   step3  select keys by update
                 **/
                    function(cb){
                    erpGoodsAsync.selectGoodInfoKeys(goodsInfokeys, function (err,guidlist) {
                        if(err){
                            cb(err);
                        }else{
                            goodsGuids = guidlist;
                            cb(null, goodsGuids);
                        }
                    });
                },
                /**
                 *   step4 get goodsdetails
                 **/
                    function(cb){
                    erpGoodsAsync.getBasicInfoDetails(goodsGuids,function(err,result) {
                        if(err){
                            cb(err);
                        }else{
                            goodsDetails = result;
                            cb(null,goodsDetails);
                        }
                    })
                },
                /**
                 *   step5 insert DB
                 **/
                    function(cb){
                    erpGoodsAsync.batchInsertIntoGoodsInfo(goodsDetails,function(err,result){
                        if(err){
                            cb(err);
                        }else{
                            cb(null,result);
                        }
                    })
                }
            ],
            function(err,resultList){
                if(err){
                    console.log(err);
                    console.log("同步商品数据有错"+err);
                    done(err);
                }else{
                    console.log("同步商品数据完成");
                    done(err,resultList);
                }
            }
        );
    }
    return worker;
};