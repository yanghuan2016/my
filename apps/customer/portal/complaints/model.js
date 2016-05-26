/**
 * Created by jiangbo on 16-4-11.
 */
module.exports = function () {
    var logger = __logService;
    var db = __dbService;
    var MODELNAME = __dirname.split("/").pop();


    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {
        /**
         * 获取所有商户证照信息
         * @param customerDB
         * @param callback
         */
        getAllContractPhone: function(customerDB, callback) {
            logger.enter();
            db.getAllContractPhone(customerDB, function(err, result){
                callback(err, result);
            });
        },

        /**
         * 添加或者修改门户信息
         * @param customerDB
         * @param newData
         * @param callback
         */
        postOneContractPhone: function(customerDB, newData, callback) {
            logger.enter();
            db.getOneContractPhone(customerDB, newData, function(err, result){
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                if(result.length > 0){
                    db.editOneContractPhone(customerDB, newData, function(err, result){
                        if(err) {
                            logger.error(err);
                            return callback(err);
                        }
                        if(result.affectedRows === 1){
                            callback(null, newData);
                        }
                    })
                } else {
                    db.addOneContractPhone(customerDB, newData, function(err, result){
                        if(err) {
                            logger.error(err);
                            return callback(err);
                        }
                        if(result.affectedRows === 1){
                            newData.id = result.insertId;
                            callback(null, newData);
                        }
                    })
                }
            });
        }

    };

    return model;
};
