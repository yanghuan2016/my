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
 * address/model.js
 *
 * --------------------------------------------------------------
 * 2015-10-06   dawei-romens@issue#106
 *
 */

module.exports = function () {
    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;
    /*
     * load 3rd party modules
     */
    /*
     * init model name etc
     */
    var MODELNAME = __dirname.split("/").pop();
    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {
        /**
         * add address to cart
         * @param customerDB
         * @param clientId
         * @param addressDetail
         * @param callback
         */
        postAddress:function(customerDB,clientId,addressDetail,callback){
            logger.enter();
            db.addAddress(customerDB,clientId,addressDetail,function(err,addressId) {
               callback(err,addressId);
            })
        },

        /**
         * update address to cart
         * @param customerDB
         * @param addressId
         * @param addressDetail
         * @param callback
         */
        putAddress: function(customerDB,addressId,addressDetail,callback){
            logger.enter();
            db.updateAddressDetail(customerDB,addressId,addressDetail,function(err,affectedRows){
                callback(err,affectedRows);
            });
        },

        /**
         * delete address by id
         * @param customerDB
         * @param addressId
         * @param callback
         */
        deleteAddress : function(customerDB,addressId,callback){
            logger.enter();
            db.deleteAddress(customerDB,addressId,function(err,affectedRows){
                callback(err,affectedRows);
            })
        }
    };
    return model;
};