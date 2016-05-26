module.exports=function() {
    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;
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
    var moment=require('moment');
    var idGen = require(__modules_path + "/idTwister");

    /*
     * init model name etc
     */
    var MODELNAME = myPath.getModelName(__dirname);
    logger.trace("Initiating model:[" + MODELNAME + "]");


    //model
    var model = {
        /**
         * 更新商品库存
         * @param customerDB
         * @param values
         * @param callback
         */
        postGoodsInventory: function(customerDB, values, callback) {
            logger.enter();
            db.goodsInventoryUpdate(customerDB, values, function (error, result) {
                callback(error, result);
            });
        },

        /**
         * 更新单品库存
         * @param customerDB
         * @param goodsId
         * @param inventory
         * @param callback
         */
        putGoodsInventoryOne: function(customerDB, goodsId, inventory, callback) {
            logger.enter();
            db.goodsInventoryUpdateOne(customerDB, goodsId, inventory, function (error, result) {
                callback(error, result);
            });
        },

        /**
         * 获取客户类别
         * @param customerDB
         * @param callback
         */
        getClientCategory: function(customerDB, callback) {
            logger.enter();
            db.getClientCategory(customerDB, function (err, clientCategories) {
                callback(err, clientCategories);
            });
        },

        /**
         * 查看所有调价单（不涉及调价详情）
         * @param customerDB
         * @param paginator
         * @param operatorId
         * @param status
         * @param callback
         */
        getAllReadjustPrice: function(customerDB, paginator, operatorId, status, callback) {
            db.listAllReadjustPrice(customerDB, paginator, operatorId, status, function(err,results){
                callback(err, results);
            });
        },

        /**
         * 获取商品的 基本价格信息
         * @param customerDB
         * @param goodsId
         * @param callback
         */
        getSingleGoodsPrice: function(customerDB, goodsId, callback) {
            logger.enter();
            db.listSingleGoodsPriceInfo(customerDB,goodsId,function(err,goodsBasicPriceInfo){
                callback(err, goodsBasicPriceInfo);

            });
        }

    };
    return model;
};