/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

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

    /*
     * init model name etc
     */
    var MODELNAME = myPath.getModelName(__dirname);
    logger.trace("Initiating model:[" + MODELNAME + "]");

    //model
    var model = {
        /**
         *提交结算数据
         * @param customerDBName
         * @param clearingDetailId
         * @param callback
         */
        putClearDetails:function(customerDBName, clearingDetailId, callback){
            logger.enter();
            db.setClearDetailsCleared(customerDBName, clearingDetailId, function(err, result){
                callback(err,result);
            });
        },

        /**
         * 获取指定时间段内的结款表表
         * @param customerDBName
         * @param beginDate
         * @param endDate
         * @param clientName
         * @param callback
         */
        getClearingList: function(customerDBName, clientName, beginDate, endDate, callback) {
            logger.enter();
            if (underscore.isEmpty(clientName))
                clientName = "";

            async.series([
                    function updateIncome(done) {
                        logger.enter();
                        db.updateClearingIncome(customerDBName, function(err, rows){
                            done();
                        });
                    },
                    function updateRefund(done) {
                        logger.enter();
                        db.updateClearingRefund(customerDBName, function(err, rows){
                            done();
                        });
                    }
                ],
                function(err, results) {
                    logger.enter();
                    db.getClearingBills(customerDBName, clientName, beginDate, endDate, function (err, results) {
                        callback(err, results);
                    });
                });
        },

        /**
         * 加载结算明细数据
         * @param customerDBName
         * @param clientName
         * @param beginDate
         * @param endDate
         * @param status
         * @param callback
         */
        getClearingDetails: function(customerDBName, clientName, beginDate, endDate, status, callback) {
            logger.enter();
            db.getClearingDetails(customerDBName, clientName, beginDate, endDate, status, function(err, clearingDetails){
                callback(err, clearingDetails);
            });
        }
    };

    return model;
}