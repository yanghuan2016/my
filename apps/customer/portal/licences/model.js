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
         * 获取所有 Licences 信息
         * @param customerDB
         * @param data
         * @param callback
         */
        getAllLicences: function(customerDB, data, callback) {
            logger.enter();
            db.getAllLicences(customerDB, function(err, result){
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                data.licences = result;
                callback(null, data);
            });
        },

        /**
         * 添加商户的证照管理信息
         * @param customerDB
         * @param newLicence
         * @param data
         * @param callback
         */
        postAnewLicence: function(customerDB, newLicence, data, callback) {
            logger.enter();
            db.addAnewLicence(customerDB, newLicence, function(err, results){
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                data.licData = {
                    id: results.insertId,
                    url: newLicence.licUrl,
                    type: newLicence.licType,
                    name: newLicence.licName,
                    expireTime: newLicence.expireTime
                };
                callback(null, data);
            });
        },

        /**
         * 删除一条证照管理信息
         * @param customerDB
         * @param id
         * @param callback
         */
        delOneLicence: function(customerDB, id, callback) {
            logger.enter();
            db.removeOneLicence(customerDB, id, function(err, results){
                callback(err, results);
            });
        },

        /**
         * 修改一条证照管理信息
         * @param customerDB
         * @param data
         * @param newLicence
         * @param callback
         */
        putOneLicence: function(customerDB, data, newLicence, callback) {
            logger.enter();
            db.editOneLicence(customerDB, newLicence, function(err, results){
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                if(results.affectedRows == 1){
                    data.licData = {
                        id: newLicence.id,
                        url: newLicence.licUrl,
                        name: newLicence.licName,
                        expireTime: newLicence.expireTime
                    };
                }
                callback(null, data);
            });
        }

    };

    return model;
};
