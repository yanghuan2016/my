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
 * model.js
 *
 * 商品model
 * --------------------------------------------------------------
 * 2015-10-30	hc-romens@issue#267  created
 *
 */

module.exports=function() {
    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;
    var dataService = __dataService;
    /*
     * load 3rd party modules
     */
    var underscore = require("underscore");
    var async = require("async");
    /*
     * load project modules
     */
    var Paginator = require(__base + "/modules/paginator");
    var myPath = require(__modules_path + "/mypath");

    /*
     * init model name etc
     */
    var MODELNAME = myPath.getModelName(__dirname);
    logger.trace("Initiating model:[" + MODELNAME + "]");

    //model
    var model = {

        /**
         * todo 目前 商品的分类属性 没有实现
         * 新增或者更新商品,该方法只负责保存或者更新一些基本信息[GoodsInfo表的字段]
         * @param connect            数据库连接
         * @param customerDB         数据库名字
         * @param goodsId            商品Id,若是新增则没有
         * @param goodsBasicInfo     商品信息的json对象
         * @param callback           回调函数
         */
        addOrUpdateGoodsBasicInfo:function(connect,customerDB,goodsId,goodsBasicInfo,callback){
            logger.enter();
            db.addGoodsInfo(connect,customerDB,goodsId,goodsBasicInfo,function(err,result){
                 if(err){
                     logger.error(err);
                     callback(err);
                 }
                 else{
                     callback(err,result);
                 }
            })
        },
        /**
         * 修改单品客户类价格
         * @param customerDBName
         * @param price
         * @param clientCategoryId
         * @param goodsId
         * @param callback
         */
        postClientCategoryPriceUpdate : function(customerDBName,price, clientCategoryId, goodsId,callback){
            logger.enter();
            db.goodsClientCategoryPriceUpdate(customerDBName,price, clientCategoryId, goodsId, function(err,result){
                callback(err,result);
            });
        },


        /**
         * 删除客户类单品价格
         * @param customerDBName
         * @param clientCategoryId
         * @param goodsId
         * @param callback
         */
        deleteCategoryPrice: function(customerDBName, clientCategoryId, goodsId,callback){
            logger.enter();
            db.goodsClientCategoryPriceDelete(customerDBName, clientCategoryId, goodsId, function(err, result){
                callback(err,result);
            });
        },

        /**
         * 新增ClientCategoryPrice
         * @param customerDBName
         * @param goodsId
         * @param clientCategoryId
         * @param price
         * @param callback
         */
        postClientCategoryPrice: function(customerDBName, goodsId, clientCategoryId, price, callback){
            logger.enter();
            db.goodsAddClientCategoryPrice(customerDBName, goodsId, clientCategoryId, price, function(err, result){
                callback(err,result);
            });
        },

        /**
         * 显示客户类价格添加窗口
         * @param customerDBName
         * @param goodsId
         * @param callback
         */
        getCategoryPriceAdd: function(customerDBName, goodsId,callback){
            logger.enter();
            db.getClientCategory(customerDBName, function (err, clientCategories) {
                if(err){
                    callback(err);
                }else{
                    var data = {};
                    data.clientCategorys = clientCategories;
                    db.getGoodsBasicPrice(customerDBName, [goodsId], function (err, results) {
                        if(err){
                            callback(err);
                        }else{
                            callback(null,{data: data, goodsPrice: results[0]});
                        }

                    });
                }
            });
        },

        /**
         * 加载所有客户类价格
         * @param customerDBName
         * @param goodsId
         * @param callback
         */
        getCategoyPrice : function(customerDBName, goodsId,callback){
            logger.enter();
            db.listClientCategoryPriceByGoodsId(customerDBName, goodsId, function(err, results){
                callback(err,results);
            });
        },
        /**
         * 更新客户单品价格
         * @param customerDBName
         * @param price
         * @param clientId
         * @param goodsId
         * @param callback
         */
        postClientPrice: function(customerDBName, price, clientId, goodsId,callback){
            logger.enter();
            db.goodsUpdateClientPrice(customerDBName, price, clientId, goodsId, function(err,result){
                callback(err,result);
            });
        },
        /**
         * 删除客户单品价格
         * @param customerDBName
         * @param clientId
         * @param goodsId
         * @param callback
         */
        deleteClietPrice: function(customerDBName, clientId, goodsId,callback){
            logger.enter();
            db.goodsDeleteClientPrice(customerDBName, clientId, goodsId, function(err,result){
                callback(err,result);
            });
        },


        /**
         * 添加客户价格
         * @param customerDBName
         * @param clientId
         * @param goodsId
         * @param price
         * @param callback
         */
        postAddClientPrice: function(customerDBName, clientId, goodsId, price,callback){
            logger.enter();
            db.goodsAddClientPrice(customerDBName, clientId, goodsId, price, function(err,result){
                callback(err,result);
            });
        },
        /**
         * 显示新增客户价格页面
         * @param customerDBName
         * @param goodsId
         * @param callback
         */
        getClientPriceAdd : function(customerDBName,goodsId,callback){
            logger.enter();
            db.getGoodsBasicPrice(customerDBName, [goodsId], function(err, results){
                callback(err,results);
            });
        },

        /**
         * 按照关键词过滤客户名称
         * @param customerDBName
         * @param keyword
         * @param callback
         */
        postClientNameFilter : function(customerDBName,keyword,callback){
            logger.enter();
            db.filterClientNameByKeyword(customerDBName, keyword, function(err, clientNameList){
                callback(err, clientNameList);
            });
        },

        /**
         * get all clientPrice
         * @param customerDBName
         * @param goodsId
         * @param clientName
         * @param callback
         */
        getClientPriceList : function(customerDBName,goodsId, clientName,callback){
            logger.enter();
            db.listClientPriceByGoodsId(customerDBName,goodsId, clientName,function(err, results){
                callback(err,results);
            });
        }

    };

    return model;
}
