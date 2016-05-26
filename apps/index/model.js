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
 * 产品信息展示model
 * --------------------------------------------------------------
 * 2015-10-08   hc-romens@issue#79  added addGoodsPrice method
 * 2015-09-21	hc-romens@issue#18  created
 *
 */

module.exports = function () {
    var logger = __logService;
    var db = __dbService;

    var MODELNAME = __dirname.split("/").pop();

    var underscore = require("underscore");
    var moment = require('moment');
    var url = require('url');
    var querystring = require('querystring');
    var http = require('http');
    var crypto = require('crypto');

    var passwdEnc = require('password-hash-and-salt');
    var async = require('async');
    var sprintf = require("sprintf-js").sprintf;
    var hasher = require('password-hash-and-salt');
    var smsModule = require(__modules_path + "/smsModule")();
    
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;

    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {


        getExprieLiceseData: function (req, customerid, clientid, data, callback) {
            logger.enter();
            var popMsg = {};
            var detail = {};
            var datas = [];
            //var expireLicense = "";
            db.getCustomerDBList(function (err, cb) {
                if (err) {
                    callback(err);
                }
                db.getClientGspList(cb, function (err, result) {
                    for (var k = 0; k < result.length; k++) {
                        if (result[k].customerId == customerid) {
                            popMsg = result[k];
                        }
                    }
                    for (var i = 0; i < popMsg.details.length; i++) {
                        if (popMsg.details[i].clientId == clientid) {
                            detail = popMsg.details[i];
                        }
                    }
                    //筛选证照的deadline以及剩余天数
                    db.compareExpireLicense(detail, function (err, feedback) {
                        for (var j = 0; j < feedback.length; j++) {
                            if (feedback[j].leftDays in {
                                    '30': '',
                                    '15': '',
                                    '7': '',
                                    '5': '',
                                    '3': '',
                                    '2': '',
                                    '1': '',
                                    '0': ''
                                } ||
                                feedback[j].leftDays <= 0) {
                                datas.push(feedback[j]);
                                //var licenseNameMap = {
                                //    "businessLicenseValidateDate"   :"营业执照",
                                //    "orgCodeValidateDate"           :"组织机构代码证",
                                //    "taxRegistrationLicenseNumValidateDate": "税务登记证",
                                //    "foodCirculationLicenseNumValidateDate": "食品流通许可证",
                                //    "qualityAssuranceLicenseNumValidateDate": "质量保证协议",
                                //    "medicalApparatusLicenseNumValidateDate": "医疗器械许可证",
                                //    "healthProductsLicenseNumValidateDate": "保健品证书",
                                //    "productionAndBusinessLicenseNumValidateDate": "生产经营许可证",
                                //    "mentalanesthesiaLicenseNumValidateDate": "精神麻醉证",
                                //    "gmpOrGspLicenseNumValidateDate": "GMP/GSP证书",
                                //    "hazardousChemicalsLicenseNumValidateDate": "危化品许可证",
                                //    "medicalInstitutionLicenseNumValidateDate": "医疗机构执业许可证",
                                //    "maternalLicenseNumValidateDate": "母婴保健技术执业许可证",
                                //    "institutionLegalPersonCertValidateDate": "事业单位法人证书"
                                //};
                                //expireLicense += licenseNameMap[feedback[j].licenseName]+",";
                                data.needPop = true;
                            }
                            if (feedback[j].leftDays <= 0) {
                                req.session.expire = true;
                            }
                        }
                        data.popMsg = {
                            type: 'licAlert',
                            datas: datas
                        };
                        //data.expireLicense = expireLicense;
                        req.session.ExpireLicensetip = false;
                        callback(null, data);
                    });

                });
            });
        },
        /**
         * 发送新密码的短信
         * @param customerDB
         * @param newPwd
         * @param mobileNum
         * @param callback
         */
        sendMobileMSG: function (customerDB, newPwd, mobileNum, callback) {
            logger.enter();
            smsModule.sendClientSMS(customerDB,mobileNum, newPwd, function (smsErr, result) {
                callback(smsErr, result);
            });
        },
        /**
         * 验证手机号并生成新密码保存到数据库
         * @param customerDB
         * @param data
         * @param callback
         */
        getVerifyMobileResult: function (customerDB, data, callback) {
            logger.enter();
            db.verifyMobile(customerDB, data.username, data.mobileNum, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    if (underscore.isEmpty(result)) {
                        callback(null, []);
                    } else {
                        var operatorId = result[0].operatorId;
                        var randomPwd = sprintf("%06d", Math.floor(Math.random() * 100000));
                        var newPwd = "您的新密码是:" + randomPwd + ",【神木医药网】";
                        hasher(randomPwd).hash(function (err, hashedPwd) {
                            var updateOperatorInfo = {password: hashedPwd};
                            db.updateOperatorInfo(customerDB, updateOperatorInfo, operatorId, function (error, affectedRows) {
                                if (error) {
                                    logger.error(error);
                                    callback(error);
                                } else {
                                    callback(null, newPwd);
                                }
                            })
                        })
                    }
                }
            });
        },


        getPortalInfo: function (callback) {
            callback(null, {});
        },

        userLoginCheck: function (cloudDb, customerDb, operatorType, customerId, clientId, callback) {
            logger.enter();

            if (operatorType === 'CUSTOMER') {
                var temp = '';

                var sql = sprintf(temp);

                logger.sql(sql);

                __mysql.query(sql, function (error, result) {
                    if (error) {
                        logger.sqlerr(error);
                        return callback(error);
                    }
                    callback(null, result);
                });
            } else if (operatorType === "CLIENT") {

            }
        },

        operatorLogin: function (cloudDBName, customerDBName, operatorName, password, ipaddr, callback) {

            logger.enter();

            // Step 1. 加载操作员信息
            var found = false;
            var operatorInfo = undefined;
            var customerInfo = undefined;
            async.series(
                [
                    /**
                     * 按照username搜索客户操作员资料
                     * @param done
                     */
                        function getClientOperator(done) {
                        db.loadClientOperatorInfo(customerDBName, operatorName, function (err, operatorList) {
                            if (err) {
                                logger.sqlerr(err);
                                done(FBCode.DBFAILURE);
                            } else {
                                if (operatorList.length > 0) {
                                    found = true;
                                    operatorInfo = operatorList[0];
                                }
                                done();
                            }
                        });
                    },

                    /**
                     * 按username搜索商户操作员资料
                     * @param done
                     */
                        function getCustomerOperator(done) {
                        if (found) { // 已经匹配成功客户操作员，不再搜索商户操作员
                            done();
                        } else {
                            db.loadCustomerOperatorInfo(cloudDBName, customerDBName, operatorName, function (err, operatorList) {
                                if (err) {
                                    logger.sqlerr(err);
                                    done(FBCode.DBFAILURE);
                                } else {
                                    if (operatorList && operatorList.length > 0) {
                                        found = true;
                                        operatorInfo = operatorList[0];
                                        done();
                                    } else {
                                        done(FBCode.LOGINFAILURE);
                                    }
                                }
                            });
                        }
                    }
                ],

                function (err, resultList) {
                    if (err && operatorInfo === undefined) {

                        callback(FBCode.LOGINFAILURE, operatorInfo);
                        return;
                    } else {
                        logger.ndump("operatorInfo", operatorInfo);

                        // 检查是否在禁止登录期
                        var maxLoginFailCount = __securityConfig.maxLoginFailCount;
                        var loginFailBanTime = __securityConfig.loginFailBanTime;

                        if (operatorInfo && operatorInfo.failCount >= maxLoginFailCount && operatorInfo.bannedTime < loginFailBanTime) {
                            var leftBanTime = loginFailBanTime - operatorInfo.bannedTime;
                            logger.info("Operator <" + operatorInfo.username + "> is banned in coming " +
                                leftBanTime + " seconds");
                            callback(FBCode.MAXPASSWDFAIL, leftBanTime);
                            return;
                        }

                        // 如果是商户操作员, 检查商户是否禁用
                        if (operatorInfo.operatorType === "CUSTOMER" && operatorInfo.enabled == false) {
                            logger.info(operatorInfo.operatorType + " service has been stopped.");
                            callback(FBCode.CUSTOMERDISABLED);
                            return;
                        }

                        // 如果是客户操作员，检查客户是否被禁用
                        if (operatorInfo.operatorType === "CLIENT" && operatorInfo.enabled == false) {
                            logger.info(operatorInfo.operatorType + " <" + operatorInfo.operatorName + "> is disabled!");
                            callback(FBCode.CLIENTDISABLED);
                            return;
                        }

                        // 开始验证密码
                        passwdEnc(password).verifyAgainst(operatorInfo.password, function (err, verified) {
                            if (err) {
                                logger.error(err);
                                callback(FBCode.INTERNALERROR);
                            } else {
                                logger.ndump("verified", verified);

                                var execFunc = (verified) ? db.updateOperatorLoginOnSuccess : db.updateOperatorLoginOnFailure;
                                execFunc(customerDBName, operatorName, ipaddr, function (err, result) {
                                    if (err) {
                                        logger.sqlerr(err);
                                    }
                                    if (verified) {
                                        callback(FBCode.SUCCESS, operatorInfo);
                                    } else {
                                        callback(FBCode.LOGINFAILURE,
                                            "密码错误! 连续错误" + __securityConfig.maxLoginFailCount + "次后," +
                                            "账户将被锁定" + Math.floor((__securityConfig.loginFailBanTime + 59) / 60) +
                                            "分钟! 您还有" + (__securityConfig.maxLoginFailCount - (operatorInfo ? operatorInfo.failCount : (__securityConfig.maxLoginFailCount + 1)) - 1) + "次机会。"
                                        );
                                    }
                                });
                            }
                        });
                    }

                }
            );
        },

        addOperatorLog: function (customerDB, logContent, callback) {
            logger.enter();
            db.insertOperatorLog(customerDB, logContent, function (err, results) {
                if (err) {
                    logger.error(err);
                    callback(err);
                }
                else {
                    callback(err, results);
                }
            });
        },

        retrievePortalData: function (customerDB, data, clientId, callback) {
            var date = moment().format('YYYY-MM-DD HH:mm:ss');
            db.carouselRetrieveAvailable(customerDB, date, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    data.carousels = result;
                    db.newsRetrieveAvailable(customerDB, function (error, result) {
                        if (error) {
                            callback(error);
                        } else {
                            data.news = processNews(result);
                            db.showcaseRetrieveAvailable(customerDB, clientId, function (error, result) {
                                if (error) {
                                    callback(error);
                                } else {
                                    data.showcases = processShowcase(result);
                                    callback(null, data);
                                }
                            });
                        }
                    });
                }
            });
        }

    };




    var processNews = function (news) {
        return underscore(news).map(function (item) {
            item.createdOn = moment(item.createdOn).format('YYYY-MM-DD');
            item.updatedOn = moment(item.updatedOn).format('YYYY-MM-DD');
            return item
        });
    };

    var processShowcase = function (showcase) {
        showcase = underscore.chain(showcase)
            .groupBy(function (item) {
                return item.showcaseOrderSeq;
            })
            .values()
            .map(function(item) {
                var showcase = {
                    id: item[0].showcaseId,
                    title: item[0].title,
                    orderSeq: item[0].showcaseOrderSeq,
                    size: item[0].showcaseSize,
                    mode: item[0].mode,
                    advertiseImg:item[0].advertiseImg,
                    advertiseHref:item[0].advertiseHref,
                    createdOn: moment(item[0].showcaseCreatedOn).format('YYYY-MM-DD')
                };
                showcase.detail = underscore(item).map(function (item) {
                    return {
                        detailId: item.showcaseDetailId,
                        orderSeq: item.showcaseDetailOrderSeq,
                        createdOn: moment(item.showcaseDetailCreatedOn).format('YYYY-MM-DD'),
                        goodsId: item.goodsId,
                        goodsType: item.goodsType,
                        goodsNumber: item.goodsNumber,
                        commonName: item.goodsCommonName,
                        alias: item.goodsAlias,
                        spec: item.goodsSpec,
                        supplier: item.goodsSupplier,
                        producer: item.goodsProducer,
                        img: item.goodsImg,
                        negSell: item.negSell,
                        isSplit: item.isSplit,
                        price: item.goodsPrice,
                        clientGoodPrice:item.clientGoodsPrice,
                        storage: item.storage,
                        inventory: item.inventory,
                        middlePackNum:item.middlePackNum,
                        measureUnit:item.measureUnit
                    }
                });
                return showcase;
            })
            .value();
        return showcase;
    };

    return model;
};
