/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/
module.exports =function() {
    var logger = __logService;
    var db = __dbService;

    var underscore = require("underscore");
    var moment = require('moment');
    var async = require('async');


    var MODELNAME = __dirname.split("/").pop();
    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {


        /**
         * post update purchase list
         * @param customerDB
         * @param data
         * @param callback
         */
        postUpdatePurchaseList : function(customerDB,data,callback){
            logger.enter();
            db.updateClientFavor(customerDB, data.listId, data.listName, function(err,insertId){
                if(!err){
                    if(data.goods == null){
                        callback();
                    }else{
                        db.updateClientFavorDetail(customerDB, data.goods, function (err,result) {
                            if (!err) {
                                callback();
                            } else {
                                callback(err);
                            }
                        });
                    }
                }else{
                    callback(err);
                }
            })
        },

        /**
         * put purchase list to Cart
         * @param customerDB
         * @param reqData
         * @param clientId
         * @param callback
         */
        putPurchaseListToCart : function(customerDB,reqData,clientId,callback){
            logger.enter();
            var purchaseListGoods=null;
            async.series(
                [
                    function ConverToPurchaseListToCartItem(done){
                        db.selectFavorDetailList(customerDB, clientId, reqData.listId, function (err,result) {
                            logger.ndump("result", result);
                            purchaseListGoods=result;
                            if(err){
                                logger.error(err);
                                done(err);
                            }
                            else{
                                purchaseListGoods=result;
                                done(err,result);
                            }
                        });
                    },
                    //加到购物车里面去.
                    function addPurcharseGoodsToCart(done){
                        var cartItems;
                        var GoodsID = [];
                        cartItems=formatFavorListToCartItem(clientId,purchaseListGoods);
                        for(var i = 0;i< purchaseListGoods.length;i++){
                            GoodsID.push(purchaseListGoods[i].goodsId);
                        }
                        db.findGoodsGSP(customerDB,GoodsID,function(err,findGoodsGsp) {
                            //获取ClientGSP控制范围
                            db.findClientGspType(customerDB, clientId, function (error, ClientGspType) {
                                if (__gspScopeCheck == true && ClientGspType.length !== 0) { //开关控制
                                    var gsp = [];
                                    var isGspArea = false;
                                    underscore.map(ClientGspType,function(item){
                                        gsp.push(item.goodsGspTypeId);
                                    });
                                    if(findGoodsGsp.length == 0 ||findGoodsGsp.length !== GoodsID.length ){
                                        done("INVALIDACTION");
                                        return;
                                    }
                                    underscore.map(findGoodsGsp,function(item){
                                        var cartbuy = underscore.some(gsp, function (gspid) {
                                            return gspid == item.id;
                                        });
                                        if (!cartbuy) {
                                            isGspArea = true;
                                        }
                                    });
                                    if(isGspArea){
                                        done("INVALIDACTION");
                                        return;
                                    }
                                }
                                db.updateCartInBatch(customerDB,cartItems,function(err,updateCartInBatchResults){
                                    if(err){
                                        logger.error(err);
                                        done(err);
                                    }
                                    done(err,updateCartInBatchResults);
                                })
                            })
                        })

                    }
                ],
                function(errs,result){
                    if (errs) {
                        logger.error(errs);
                        callback(errs);
                    } else {
                        callback();
                    }
                });
        },


        /**
         * delete one goods in purchase list
         * @param customerDB
         * @param data
         * @param callback
         */
        deleteOneGoodInPurchaseList : function(customerDB, data,callback){
            logger.enter();
            db.removeFavorGoodsOne(customerDB, data, function (err,result) {
                callback(err,result);
            });
        },

        /**
         * delete purchase list
         * @param customerDB
         * @param data
         * @param callback
         */
        deletePurchaseList : function(customerDB, data,callback){
            logger.enter();
            db.removeFavorOne(customerDB, data, function (err,result) {
                callback(err,result);
            })
        },


        /**
         * post new Purchase list
         * @param customerDB
         * @param clientId
         * @param name
         * @param callback
         */
        postNewPurchaseList : function(customerDB, clientId, name,callback){
            logger.enter();
            db.addFavor(customerDB, clientId, name, function (err, result) {
                callback(err,result);
            })
        },

        /**
         * get eidt purchase list view
         * @param customerDB
         * @param type
         * @param id
         * @param clientId
         * @param data
         * @param callback
         */
        getEditPurchaseList : function(customerDB,type,id,clientId,data,callback){
            logger.enter();
            db.getListName(customerDB, clientId, id, function (err, list) {
                db.selectFavorDetailList(customerDB, clientId, id, function (err1, result) {
                    db.listGoodsInventoryPlanDetails(customerDB,function(err2,planDetails) {
                        if(err||err1||err2){
                            logger.error(err+err1+err2);
                            callback(err+err1+err2);
                        }else{
                            //库存方案显示:
                            var purchaseListItems=underscore(result).map(function(item){
                                //按库存显示方案更新显示信息
                                for(var i=0;i<planDetails.length;i++){
                                    if(item.showPlanId == planDetails[i].goodsInventoryPlanId){
                                        if(item.storage<planDetails[i].threshold){
                                            item.content = planDetails[i].content=="实际数量"?item.storage:planDetails[i].content;
                                            break;
                                        }
                                    }
                                }
                                return item;
                            });
                            data.type = type;
                            data.list = purchaseListItems;
                            data.favor = list;
                            callback(null,data);
                        }
                    });
                });
            });
        },



        /**
         * get favor list
         * @param customerDB
         * @param clientId
         * @param goodsId
         * @param callback
         */
        getPurchaseList:function(customerDB,clientId,goodsId, callback){
            logger.enter();
            db.listAllFavor(customerDB, clientId, function (err, result) {
                if(!err){
                    db.selectFavorList(customerDB, function(error, goodsList){
                        if(error){
                            callback(error);
                        }else{
                            underscore.map(result, function (item) {
                                item.checkGood = [];
                                underscore.map(goodsList, function(list){
                                    if(list.favorId==item.id){
                                        item.checkGood.push(list.goodsId);
                                    }
                                });
                                if(item.checkGood.indexOf(Number(goodsId))!=-1){
                                    item.isAdded=true;
                                }else{
                                    item.isAdded=false;
                                }
                            });
                            logger.ndump("result", result);
                            callback(null, result);
                        }
                    });
                }else{
                   callback(err);
                }
            });
        },

        retrieveFavorList:function(customerDB,clientId,callback){
                db.listNotEmptyFavor(customerDB, clientId, function (err, result) {
                    //对result 做一个处理.
                    if(err){
                        callback(err);
                    }else{
                        var result=formatFavorList(result);
                        //callback(null,result);
                        //请求为空的List列表
                        db.listEmptyFavor(customerDB,clientId,function(err,emptyResult){
                            if(err){
                                callback(err);
                            }else{
                                for(var i=0;i<emptyResult.length;i++){
                                        var obj={
                                            clientFavorId:emptyResult[i].clientFavorId,
                                            clientId:emptyResult[i].clientId,
                                            name:emptyResult[i].name,
                                            goodsTypeCount:0,
                                            goodsPriceSum:0,
                                            updateOn:emptyResult[i].updateOn
                                        }
                                    result.push(obj);
                                }
                                callback(null,result);

                            }
                        });
                    }
                });
            }
    };
    var formatFavorList=function(favorListDetails){
            favorListDetails=underscore.chain(favorListDetails)
                             .groupBy(function(item){
                                return item.clientFavorId;
                             }).values()
                            .map(function(item){
                                var favorListItem={
                                    clientFavorId:item[0].clientFavorId,
                                    clientId:item[0].clientId,
                                    name:item[0].name,
                                    updateOn:item[0].updateOn,
                                    goodsTypeCount:item.length
                                }
                                var sumPrice=0;
                                underscore(item).map(function(goodsItem){
                                   var goodsQuanity=goodsItem.quantity;
                                    var goodsPrice  =goodsItem.price;
                                    sumPrice+=Number(goodsQuanity)*Number(goodsPrice);
                                });
                                favorListItem.goodsPriceSum=sumPrice;
                                return favorListItem;
                            }).value();


        return favorListDetails;
    };

    var formatFavorListToCartItem=function(clientId,favorListGoods){
        var cartItemsStr='';
        underscore.map(favorListGoods,(function(item){
            var obj=[];
            obj.push(clientId);
            obj.push(item.goodsId);
            obj.push(item.quantity);
            cartItemsStr+='('+obj.join(',')+')'+',';
            //return obj;
        }));
        cartItemsStr=cartItemsStr.substr(0,cartItemsStr.length-1);
        return cartItemsStr;
    };

    return model;
};
