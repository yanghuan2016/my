var ERPGoodsAsync = require('../goodsAsync/ERPGoodsAsync');
var fs = require('fs');
var async = require('async');

describe('test ERPGoodsAsync', function(){
    it('send msg', function(done) {
        var enterpriseId= 2;
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
                  erpGoodsAsync.getAllGoodsNum(function(error,result){
                      if(error){
                          cb(error);
                      }else{
                          console.log(result);
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
            function(err,resultlist){
                if(err){
                    console.log(err);
                    console.log("同步商品数据有错"+err);
                    done();
                }else{
                    console.log("同步商品数据完成");
                    done();
                }
            }
        );
    });


});
