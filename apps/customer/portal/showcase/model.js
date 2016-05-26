module.exports = function () {
    var logger = __logService;
    var db = __dbService;
    var MODELNAME = __dirname.split("/").pop();

    var underscore = require("underscore");

    var Paginator = require(__base + '/modules/paginator');
    var KeyMapper = require(__base + '/modules/fieldNameMapper');


    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {
        getPortalInfo:function(callback) {
            callback(null, {});
        },

        /**
         * 获取橱窗信息列表
         * @param customerDB
         * @param callback
         */
        getShowcaseList: function(customerDB, callback) {
            logger.enter();
            db.listShopWindow(customerDB, {}, function(err, results){
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                var allShowCases=underscore.map(results, function(item){
                    var obj={
                        id:item.id,
                        title:item.title,
                        mode:item.mode
                    };
                    return obj;
                });
                callback(null, allShowCases);
            });
        },

        /**
         * 获取橱窗信息
         * @param customerDB
         * @param commonData
         * @param returnData
         * @param callback
         */
        getShowcaseNew: function(customerDB, commonData, returnData, callback) {
            logger.enter();
            db.listShopWindow(customerDB, {id: returnData.showcase.id}, function(err,result){
                var shopWindowMode=result[0].mode;
                returnData.showcase.name=result[0].title;
                returnData.showcase.advertiseImg=result[0].advertiseImg;
                returnData.showcase.advertiseHref=result[0].advertiseHref;
                db.listShowWindowDetail(customerDB, {shopWindowId: returnData.showcase.id}, function(err,results){
                    var showWindowGoodsDetail = results;
                    var ids=underscore.map(results,function(item){
                        return item.goodsId;
                    });
                    if(underscore.isNull(ids)||underscore.isUndefined(ids)){
                        ids=[];
                    }
                    commonData.showCaseGoodsIds=ids;
                    if(ids.length==0){
                        commonData.showcase = returnData.showcase;
                        commonData.showcaseGoods = returnData.showcaseGoods;
                        if(shopWindowMode=='LIST'){
                            callback(null, {
                                url: 'customer/portal/manage_addShopwindow',
                                data: commonData
                            });
                        }else if(shopWindowMode=='ICONLIST'){
                            callback(null, {
                                url: 'customer/portal/manage_addShopwindowIcon',
                                data: commonData
                            });
                        }
                    } else {
                        var insertStr='('+ ids.join(',')+')';
                        db.listShowWindowGoods(customerDB,insertStr,function(err,results){
                            ids=underscore.map(showWindowGoodsDetail,function(item){
                                return {
                                    id: item.goodsId
                                }

                            });
                            var goodsLength=results.length; //橱窗商品的总数
                            for(var j=0;j<ids.length;j++){
                                for(var i=0;i<goodsLength;i++){
                                    var currentGood=results[i];
                                    if(ids[j]['id']==currentGood.productId){
                                        var obj = {
                                            productId: currentGood.productId,
                                            productCode: currentGood.productCode,
                                            imgSrc: currentGood.imgSrc,
                                            producer: currentGood.producer,
                                            commonName: currentGood.commonName,
                                            spec: currentGood.spec,
                                            measureUnit: currentGood.measureUnit,
                                            amount: currentGood.amount
                                        };
                                        returnData.showcaseGoods.push(obj);
                                    }
                                }
                            }
                            commonData.showcase = returnData.showcase;
                            commonData.showcaseGoods = returnData.showcaseGoods;
                            if(shopWindowMode=='LIST'){
                                callback(null, {
                                    url: 'customer/portal/manage_addShopwindow',
                                    data: commonData
                                });
                            }else if(shopWindowMode=='ICONLIST'){
                                callback(null, {
                                    url: 'customer/portal/manage_addShopwindowIcon',
                                    data: commonData
                                });
                            }
                        });
                    }
                });
            });
        },

        /**
         *
         * @param customerDB
         * @param goodsIds
         * @param goodsIdsLength
         * @param shopWindowData
         * @param callback
         */
        postShowcase: function(customerDB, goodsIds, goodsIdsLength, shopWindowData, callback) {
            logger.enter();
            db.selectShopWindowMaxOrderSeq(customerDB, function(err,result){
                if(err){
                    logger.error(err);
                    return callback(err);
                }
                shopWindowData.orderSeq=(result[0]==null||result[0]==undefined?0:result[0].maxOrderSeq)+1;
                db.addShopWindow(customerDB, shopWindowData, function(err,result){
                    if(err){
                        logger.error(err);
                        return callback(err);
                    }
                    if(goodsIdsLength==0){
                        return callback(null, result);
                    }
                    var newShopWindowId=result;
                    //构造批量插入的字符串
                    var insertArray=[];
                    for(var i=0;i<goodsIdsLength;i++){
                        var obj=[];
                        obj.push(newShopWindowId);
                        obj.push(Number(goodsIds[i]));
                        obj.push(i+1);
                        insertArray.push(obj);
                    }
                    db.addShowWindowDetailBatch(customerDB, insertArray, function(err,result){
                        if(err){
                            logger.error(err);
                            return callback(err);
                        }
                        callback(null, result);
                    })
                });
            });
        },


        /**
         * 更新橱窗信息
         * @param customerDB
         * @param bodyData
         * @param goodsIdsLength
         * @param callback
         */
        putShopWindowInfo: function(customerDB, bodyData, goodsIdsLength, callback) {
            logger.enter();
            //step1 更新shopWindow 的title
            db.updateShopWindow(customerDB, {title: bodyData.showcaseName}, bodyData.showcaseId, function(err,result){
                if(err){
                    logger.error(err);
                    return callback(err);
                }
                //step2
                //删除ShopDetail所有的数据
                db.updateShowWindowDetailGoodsToDeltedBySWID(customerDB, bodyData.showcaseId, function(err,result){
                    if(err){
                        logger.error(err);
                        return callback(err);
                    }
                    if(goodsIdsLength == 0){
                        return callback(null, result);
                    }
                    //step3  批量加入数据
                    var insertNewShopWindowDetailArray = [];
                    var newIdsLength = goodsIds.length;
                    for(var i=0; i<newIdsLength; i++){
                        var obj=[];
                        obj.push(bodyData.showcaseId);
                        obj.push(goodsIds[i]);
                        obj.push(i+1);
                        insertNewShopWindowDetailArray.push(obj);
                    }
                    db.addShowWindowDetailBatch(customerDB, insertNewShopWindowDetailArray, function(err,result) {
                        if(err) {
                            logger.error(err);
                            return callback(err);
                        }
                        callback(null, result);
                    })
                });
            });
        },

        /**
         *
         * @param customerDB
         * @param shopWindowData
         * @param goodsIds
         * @param goodsIdsLength
         * @param callback
         */
        postShowcaseIcon: function(customerDB, shopWindowData, goodsIds, goodsIdsLength, callback) {
            logger.enter();
            db.selectShopWindowMaxOrderSeq(customerDB, function(err, result){
                if(err){
                    logger.error(err);
                    return callback(err);
                }
                shopWindowData.orderSeq=(result[0]==null||result[0]==undefined?0:result[0].maxOrderSeq)+1;
                db.addShopWindow(customerDB, shopWindowData, function(err,result){
                    if(err){
                        logger.error(err);
                        return callback(err);
                    }
                    if(goodsIdsLength==0){
                        return callback(null, result);
                    }
                    var newShopWindowId=result;
                    //构造批量插入的字符串
                    var insertArray=[];
                    for(var i=0;i<goodsIdsLength;i++){
                        var obj=[];
                        obj.push(newShopWindowId);
                        obj.push(Number(goodsIds[i]));
                        obj.push(i+1);
                        insertArray.push(obj);
                    }
                    db.addShowWindowDetailBatch(customerDB, insertArray, function(err, result){
                        if(err){
                            logger.error(err);
                            return callback(err);
                        }
                        callback(null, result);
                    });
                });
            });
        },

        /**
         *
         * @param customerDB
         * @param updateobj
         * @param bodyData
         * @param goodsIdsLength
         * @param callback
         */
        putShowcaseIcon: function(customerDB, updateobj, bodyData, goodsIdsLength, callback) {
            logger.enter();
            //step1 更新shopWindow 的title
            db.updateShopWindow(customerDB, updateobj, bodyData.showcaseId, function(err, result){
                if(err){
                    logger.error(err);
                    return callback(err);
                }
                //step2
                //删除ShopDetail所有的数据
                db.updateShowWindowDetailGoodsToDeltedBySWID(customerDB, bodyData.showcaseId, function(err, result){
                    if(err){
                        logger.error(err);
                        return callback(err);
                    }
                    if(goodsIdsLength == 0){
                        return callback(null, result);
                    }
                    //step3  批量加入数据
                    var insertNewShopWindowDetailArray=[];
                    var newIdsLength=goodsIds.length;
                    for(var i=0;i<newIdsLength;i++){
                        var obj=[];
                        obj.push(bodyData.showcaseId);
                        obj.push(goodsIds[i]);
                        obj.push(i+1);
                        //obj.push('LIST');
                        //todo 当前图片的宣传图片 没有则为空
                        insertNewShopWindowDetailArray.push(obj);
                    }
                    db.addShowWindowDetailBatch(customerDB, insertNewShopWindowDetailArray, function(err, result){
                        if(err){
                            logger.error(err);
                            return callback(err);
                        }
                        callback(null, result);

                    });
                });
            });
        },

        /**
         * 删除一条橱窗信息
         * @param customerDB
         * @param id
         * @param callback
         */
        delShowcase: function(customerDB, id, callback) {
            logger.enter();
            db.updateShopWindow(customerDB, {isDeleted: 1}, id, function(err, result){
                if(err){
                    logger.error(err);
                    return callback(err);
                }
                db.updateShowWindowDetailGoodsToDeltedBySWID(customerDB, id, function(err, result){
                    if(err){
                        logger.error(err);
                        return callback(err);
                    }
                    callback(null, result);
                });
            });
        },

        /**
         * 更新橱窗显示
         * @param customerDB
         * @param currentOrderSeq
         * @param currentShopWindowId
         * @param callback
         */
        postShopWindow: function(customerDB, currentOrderSeq, currentShopWindowId, callback) {
            logger.enter();
            db.updateShopWindow(customerDB, {orderSeq: currentOrderSeq}, currentShopWindowId, function(err, result){
                callback(err, result);
            });
        },

        /**
         * 删除指定的橱窗信息
         * @param customerDB
         * @param scId
         * @param id
         * @param callback
         */
        delShowcaseGoods: function(customerDB, scId, id, callback) {
            logger.enter();
            db.GetShopwindowDetailByGoodsIdandShopWindowId(customerDB, scId, id, function(err, result) {
                if (err) {
                    logger.error(err);
                    return callback(err);
                }
                var currentShopWindowDetail=result[0].id;
                db.updateShowWindowDetail(customerDB, {isDeleted: 1}, currentShopWindowDetail, function (error, result) {
                    if (error) {
                        logger.error(err);
                        return callback(err);
                    }
                    callback(null, result);
                });
            });
        }

    };

    return model;
};
