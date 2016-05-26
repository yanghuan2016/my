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
 * authentication model
 * --------------------------------------------------------------
 *
 *
 */

module.exports = function () {
    var logger = __logService;
    var db = __dbService;
    var cache = __cacheService;

    var MODELNAME = __dirname.split("/").pop();

    var underscore = require("underscore");
    var moment = require('moment');
    var url = require('url');
    var querystring = require('querystring');
    var http = require('http');
    var crypto = require('crypto');
    var md5 = require('js-md5');

    var async = require('async');
    var sprintf = require("sprintf-js").sprintf;
    var smsModule = require(__modules_path + "/smsModule")();
    var ERPGoodsAsync = require(__base + '/tools/goodsAsync/ERPGoodsAsync');
    var MsgTransmitter = require(__modules_path + '/msgTransmitter');
    var cloudTask = require(__services_path + "/db/cloud/task")();

    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;

    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {

        /**
         * 加载企业数据
         * @param cloudDB
         * @param identityInfo, 医药3650Auth返回的身份信息
         * @param callback
         */
        getLoginEnterpriseInfo: function(cloudDB, identityInfo, callback) {
            logger.enter();

            var isExisting = false;
            var enterpriseInfo = {};
            logger.ndump("identityInfo",identityInfo);

            var bizLic = identityInfo.LicenseNo.trim().toUpperCase();
            var dbName = __cloudDBName;
            var customerDBName;

            async.series([
                // 检测该企业是否已经存在
                function checkEnterpriseExistance(done) {
                    logger.enter();
                    logger.ndump('Checking existence of Business License', bizLic);
                    db.enterpriseInfoRetrieve(__cloudDBName, {businessLicense:bizLic}, function(err, result) {
                        if (err) {
                            logger.error(err);
                            return done(err);
                        }
                        if(result.length > 0) {
                            isExisting = true;
                            enterpriseInfo = result[0];
                            logger.ndump("enterprieseInfo", enterpriseInfo);
                        }
                        done(null, result);
                    });
                },

                // 若企业已存在，则更新企业信息
                function updateEnterprise(done) {
                    logger.enter();
                    if (!isExisting) {
                        logger.info("企业营业执照号<" + bizLic + ">对应的数据库不存在, 需要重新建立数据库");
                        done(null);
                    } else {
                        // find out the differences to update the enterprise
                        var customerData = {
                            customerName: identityInfo.USERCompanyName,
                            businessAddress: identityInfo.Address,
                            legalRepresentative: identityInfo.EnterpriceEntity,
                        };
                        var updateData = {};
                        for (var key in customerData){
                            if (customerData[key] !== enterpriseInfo[key])
                                updateData[key] = customerData[key];
                        }
                        logger.ndump("updateData", updateData);

                        // update the changed fields into database
                        if (!underscore.isEmpty(updateData)) {
                            db.enterpriseInfoUpdate(dbName, updateData, {id: enterpriseInfo.enterpriseId}, function(err, result){
                                if (err){
                                    logger.error("update Enterprise data error with enterpriseId=" + enterpriseInfo.enterpriseId);
                                    done(err);
                                } else {
                                    // merge updated data back into enterpriseInfo
                                    for (var key in updateData){
                                        if (!underscore.isEmpty(updateData[key])) {
                                            enterpriseInfo[key] = updateData[key];
                                        }
                                    }
                                    done(null);
                                }
                            });
                        } else {
                            done(null);
                        }
                    }
                },

                function updateOperator(done){
                    logger.enter();
                    if (!isExisting) {
                        logger.info("Customer DB doesn't exist!");
                        return done(null);
                    }
                    
                    // 继续检查操作员信息
                    model.insertOperator(enterpriseInfo, identityInfo, function(err, operatorId){
                        if (err){
                            logger.error("保存操作员信息出错");
                        }
                        done(err);
                    });
                },

                function(done){
                    //添加登录成功统计数据
                    if (isExisting) {
                        var dbName = __customerDbPrefix + "_" + enterpriseInfo.customerDBSuffix;
                        db.putLoginSuccessData(dbName, enterpriseInfo.enterpriseId, function (err, result) {
                            done(err, result);
                        })
                    } else {
                        done(null);
                    }
                }
            ], function(err, resultList) {
                if(err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    callback(null, enterpriseInfo, isExisting);
                }
            });
        },
        
        insertOperator: function(enterpriseInfo, identityInfo, callback){
            logger.enter();

            // 继续检查操作员信息
            var customerDBName = __customerDbPrefix + "_" + enterpriseInfo.customerDBSuffix;
            logger.ndump("identityInfo", identityInfo);
            db.enterpriseOperatorUpdate(
                customerDBName,
                {
                    username: identityInfo.UserCode,
                    password: "",
                    operatorType: "CUSTOMER",
                    customerId: enterpriseInfo.enterpriseId,
                    isAdmin: underscore.has(identityInfo, "Role") && identityInfo.Role==="1",
                    operatorName: identityInfo.UserName,
                    mobileNum: identityInfo.Phone,
                    email: identityInfo.EMail
                },
                function(err, result){
                    if (err) {
                        logger.error("更新操作员信息失败");
                        callback(err);
                    } else {
                        callback(null);
                    }
                }
            );
        },

        addEnterpriseInfo: function(enterpriseInfo, identityInfo, callback) {
            logger.enter();

            var dbName = __cloudDBName;

            if (underscore.isUndefined(enterpriseInfo))
                enterpriseInfo = {};

            if (!underscore.isEmpty(identityInfo.EntCode)) enterpriseInfo.orgId = identityInfo.EntCode;
            if (!underscore.isEmpty(identityInfo.USERCompanyName)) enterpriseInfo.customerName = identityInfo.USERCompanyName;
            if (underscore.isEmpty(enterpriseInfo.customerDBSuffix)) enterpriseInfo.customerDBSuffix = require("js-md5")(enterpriseInfo.orgId);
            if (!underscore.isEmpty(identityInfo.LicenseNo)) enterpriseInfo.businessLicense = identityInfo.LicenseNo;
            if (!underscore.isEmpty(identityInfo.Address)) enterpriseInfo.businessAddress = identityInfo.Address;
            if (!underscore.isEmpty(identityInfo.EnterpriseEntity)) enterpriseInfo.legalRepresentative = identityInfo.EnterpriseEntity;

            logger.ndump("enterpriseInfo", enterpriseInfo);

            __dbService.insertCustomer(dbName, enterpriseInfo, function(err, enterpriseId){
                if (err) {
                    logger.error("保存企业信息出错!");
                    callback(err);
                } else {
                    __dbService.getEnterpriseInfo(dbName, enterpriseId, function(err, enterpriseInfo) {
                        callback(null, enterpriseInfo);
                    });
                }
            });
        }
    };



    return model;
};
