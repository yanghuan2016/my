module.exports = function () {
    var logger = __logService;
    var db = __dbService;
    var MODELNAME = __dirname.split("/").pop();
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var CONSTANTS = require(__modules_path + "/SystemConstants");
    var smsModule = require(__modules_path + "/smsModule")();

    var underscore = require("underscore");
    var moment = require('moment');
    var async = require('async');
    var hasher = require('password-hash-and-salt');

    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {

        /**
         * 客户注册
         * @param dbName
         * @param registerData
         * @param callback
         */
        userRegister: function (dbName, registerData, callback) {
            logger.enter();

            /* prepare clientData */
            var clientData = {
                clientCode: registerData.basicInfo.loginAcctount,
                clientName: registerData.basicInfo.name,
                clientMobile: registerData.basicInfo.phoneNumber,
                stampLink: registerData.gspInfo.stampLink
            };

            var gspTypes = registerData.gspTypes;
            /* prepare operator data */
            //base64 decode password
            var p = new Buffer(registerData.basicInfo.password,'base64');
            hasher(p.toString()).hash(function(hasherr, hashedPassword) {
                if (hasherr) {
                    callback(FBCode.INTERNALERROR);
                    return;
                }
                registerData.basicInfo.password = hashedPassword;

                var operatorData = {
                    login_id: registerData.basicInfo.loginAcctount,
                    login_pwd: registerData.basicInfo.password
                };

                if (underscore.isEmpty(registerData.gspInfo.images)) {
                    registerData.gspInfo.images = "";
                }

            var clientGSP = {
                legalRepresentative:                        underscore.isEmpty(registerData.basicInfo.legalReprent) ? null : "'" +  registerData.basicInfo.legalReprent+ "'" ,
                registeredCapital:                          underscore.isEmpty(registerData.basicInfo.registeredCapital) ? null : "'" +  registerData.basicInfo.registeredCapital+ "'" ,
                businessAddress:                            underscore.isEmpty(registerData.basicInfo.address) ? null : "'" +  registerData.basicInfo.address+ "'" ,
                limitedBusinessRange:                       underscore.isEmpty(registerData.gspInfo.limitedBusinessRange) ? null : "'" +  registerData.gspInfo.limitedBusinessRange+ "'" ,
                limitedBusinessType:                        underscore.isEmpty(registerData.gspInfo.limitedBusinessType) ? null : "'" +  registerData.gspInfo.limitedBusinessType+ "'" ,
                businessLicense:                            underscore.isEmpty(registerData.gspInfo.businessLicense) ? null : "'" +  registerData.gspInfo.businessLicense+ "'" ,
                businessLicenseValidateDate:                underscore.isEmpty(registerData.gspInfo.businessLicenseEndDate) ? null : "'" +  registerData.gspInfo.businessLicenseEndDate+ "'" ,
                orgCode:                                    underscore.isEmpty(registerData.gspInfo.orgCodeCertificate) ? null : "'" +  registerData.gspInfo.orgCodeCertificate+ "'" ,
                orgCodeValidateDate:                        underscore.isEmpty(registerData.gspInfo.orgCodeCertificateEndDate) ? null : "'" +  registerData.gspInfo.orgCodeCertificateEndDate+ "'" , 
                taxRegistrationLicenseNum:                  underscore.isEmpty(registerData.gspInfo.taxRegcertificate) ? null : "'" +  registerData.gspInfo.taxRegcertificate+ "'" , 
                taxRegistrationLicenseNumValidateDate:      underscore.isEmpty(registerData.gspInfo.taxRegcertificateEndDate) ? null : "'" +  registerData.gspInfo.taxRegcertificateEndDate+ "'" , 
                gmpOrGspLicenseNum:                         underscore.isEmpty(registerData.gspInfo.GMPandGSPcertificate) ? null : "'" +  registerData.gspInfo.GMPandGSPcertificate+ "'" ,
                gmpOrGspLicenseNumValidateDate:             underscore.isEmpty(registerData.gspInfo.GMPandGSPcertificateEndDate) ? null : "'" +  registerData.gspInfo.GMPandGSPcertificateEndDate+ "'" , 
                medicalInstitutionLicenseNum:               underscore.isEmpty(registerData.gspInfo.medInsOccCertifacate) ? null : "'" +  registerData.gspInfo.medInsOccCertifacate+ "'" , 
                medicalInstitutionLicenseNumValidateDate:   underscore.isEmpty(registerData.gspInfo.medInsOccCertifacateEndDate) ? null : "'" +  registerData.gspInfo.medInsOccCertifacateEndDate+ "'" , 
                institutionLegalPersonCert:                 underscore.isEmpty(registerData.gspInfo.InsLegalPersonCertifacate) ? null : "'" +  registerData.gspInfo.InsLegalPersonCertifacate+ "'" , 
                institutionLegalPersonCertValidateDate:     underscore.isEmpty(registerData.gspInfo.InsLegalPersonCertifacateEndDate) ? null : "'" +  registerData.gspInfo.InsLegalPersonCertifacateEndDate+ "'" , 
                productionAndBusinessLicenseNum:            underscore.isEmpty(registerData.gspInfo.proAndBusOperationCertifacate) ? null : "'" +  registerData.gspInfo.proAndBusOperationCertifacate+ "'" ,
                productionAndBusinessLicenseNumValidateDate:underscore.isEmpty(registerData.gspInfo.proAndBusOperationCertifacateEndDate) ? null : "'" +  registerData.gspInfo.proAndBusOperationCertifacateEndDate+ "'" , 
                foodCirculationLicenseNum:                  underscore.isEmpty(registerData.gspInfo.foodCirclePermit) ? null : "'" +  registerData.gspInfo.foodCirclePermit+ "'" , 
                foodCirculationLicenseNumValidateDate:      underscore.isEmpty(registerData.gspInfo.foodCirclePermitEndDate) ? null : "'" +  registerData.gspInfo.foodCirclePermitEndDate+ "'" , 
                medicalApparatusLicenseNum:                 underscore.isEmpty(registerData.gspInfo.medDevLicense) ? null : "'" +  registerData.gspInfo.medDevLicense+ "'" , 
                medicalApparatusLicenseNumValidateDate:     underscore.isEmpty(registerData.gspInfo.medDevLicenseEndDate) ? null : "'" +  registerData.gspInfo.medDevLicenseEndDate+ "'" , 
                healthProductsLicenseNum:                   underscore.isEmpty(registerData.gspInfo.healthCertifacate) ? null : "'" +  registerData.gspInfo.healthCertifacate+ "'" ,
                healthProductsLicenseNumValidateDate:       underscore.isEmpty(registerData.gspInfo.healthCertifacateEndDate) ? null : "'" +  registerData.gspInfo.healthCertifacateEndDate+ "'" , 
                mentaanesthesiaLicenseNum:                  underscore.isEmpty(registerData.gspInfo.spiritualNarcoticCard) ? null : "'" +  registerData.gspInfo.spiritualNarcoticCard+ "'" , 
                mentalanesthesiaLicenseNumValidateDate:     underscore.isEmpty(registerData.gspInfo.spiritualNarcoticCardEndDate) ? null : "'" +  registerData.gspInfo.spiritualNarcoticCardEndDate+ "'" , 
                hazardousChemicalsLicenseNum:               underscore.isEmpty(registerData.gspInfo.dangerChemicalLicense) ? null : "'" +  registerData.gspInfo.dangerChemicalLicense+ "'" , 
                hazardousChemicalsLicenseNumValidateDate:   underscore.isEmpty(registerData.gspInfo.dangerChemicalLicenseEndDate) ? null : "'" +  registerData.gspInfo.dangerChemicalLicenseEndDate+ "'" , 
                maternalLicenseNum:                         underscore.isEmpty(registerData.gspInfo.maternalOccuLicense) ? null : "'" +  registerData.gspInfo.maternalOccuLicense+ "'" ,
                maternalLicenseNumValidateDate:             underscore.isEmpty(registerData.gspInfo.maternalOccuLicenseEndDate) ? null : "'" +  registerData.gspInfo.maternalOccuLicenseEndDate+ "'" , 
                images:                                     underscore.isEmpty(registerData.gspInfo.images) ? null : "'" +  registerData.gspInfo.images + "'",
            };


            db.beginTrans(function (connection) {
                var clientId = null;
                async.series(
                    [
                        /***
                         * 创建客户数据记录
                         * @param done
                         */
                        function clientCreate(done) {
                            logger.enter();
                            db.metaClientRegisterCreateOne(connection, dbName, clientData, function (error, id) {
                                if(error) {
                                    logger.error(error);
                                    done(error);
                                } else {
                                    clientId = id;
                                    done(error, id);
                                }
                            });
                        },
                        /**
                         * 创建客户初始操作员
                         * @param done
                         */
                        function operatorCreate(done) {
                            logger.enter();
                            db.metaNewAdminOperator(
                                connection, dbName, operatorData, clientId,
                                true, clientData.clientMobile,
                                function (error, id) {
                                    if (error) {
                                        logger.error(error);
                                        done(error);
                                    } else {
                                        logger.trace("New operator insert successfully");
                                        done(error, id);
                                    }
                                }
                            );
                        },

                        /**
                         * 创建客户gsp控制类型数据
                         * @param done
                         */
                        function operatorGspControlLink(done) {
                        logger.enter();
                        async.mapSeries(
                            gspTypes,
                            function(item, callback) {
                                db.metaNewClientGspLinks(connection, dbName, clientId,Number(item),
                                    function (error, result) {
                                        if (error) {
                                            logger.error(error);
                                            callback(error);
                                        } else {
                                            logger.trace("New gspId="+item+" gsp contol link successfully");
                                            callback(error, result);
                                        }
                                    }
                                );
                            },
                            function(err,results) {
                                if(err){
                                    done(err);
                                }else{
                                   done(err,results)
                                }
                            });

                        },


                        /**
                         * 创建客户GSP数据
                         * @param done
                         */
                        function clientGspCreate(done) {
                            logger.enter();
                            db.metaClientGspCreateOne(connection, dbName , clientId, clientGSP, function (error, result) {
                                if(error) {
                                    logger.error(error);
                                    done(error);
                                } else {
                                    logger.trace("new clientGSP insert success:" + result.toString());
                                    done(null, result);
                                }
                            });
                        }
                    ],
                    function finalization(error) {
                        logger.enter();

                            if (error && (typeof error === "object")) {
                                logger.trace("Found ERROR, rollback Transaction");
                                logger.ndump("err", error);
                                db.rollbackTrans(connection, function () {
                                    callback(error);
                                });
                            } else {
                                logger.trace("All SQL passed, commit transaction");
                                db.commitTrans(connection, function () {
                                    callback(null, clientId);
                                });
                            }
                        }
                    );
                });
            });
        },

        /**
         * 用户注册（精简）
         * @param dbName
         * @param registerData
         * @param callback
         */
        userSimpleRegister: function (dbName, registerData, callback) {
            logger.enter();

            /* prepare clientData */
            var clientData = {
                clientCode: registerData.basicInfo.loginAcctount,
                clientName: registerData.basicInfo.name,
                clientMobile: registerData.basicInfo.phoneNumber,
                clientAddr: registerData.basicInfo.address,
                stampLink: registerData.gspStampLink
            };

            /* prepare operator data */
            //base64 decode password
            var p = new Buffer(registerData.basicInfo.password,'base64');
            hasher(p.toString()).hash(function(hasherr, hashedPassword) {
                if (hasherr) {
                    callback(FBCode.INTERNALERROR);
                    return;
                }
                registerData.basicInfo.password = hashedPassword;

                var operatorData = {
                    login_id: registerData.basicInfo.loginAcctount,
                    login_pwd: registerData.basicInfo.password
                };

                if (underscore.isEmpty(registerData.gspImages)) {
                    registerData.gspImages = "";
                }
                var clientGSP = {};
                clientGSP.legalRepresentative = registerData.basicInfo.legalReprent;
                clientGSP.gspImages = underscore.isEmpty(registerData.gspImages) ? null : "'" +  registerData.gspImages + "'";

                db.beginTrans(function (connection) {
                    var clientId = null;
                    async.series([
                            // step1.创建客户数据记录
                            function (done) {
                                logger.enter();
                                db.metaClientRegisterCreateOne(connection, dbName, clientData, function (error, id) {
                                    if(error) {
                                        logger.error(error);
                                        done(error);
                                    } else {
                                        clientId = id;
                                        done(error, id);
                                    }
                                });
                            },
                            // step2.创建客户初始操作员
                            function (done) {
                                logger.enter();
                                db.metaNewAdminOperator(
                                    connection, dbName, operatorData, clientId,
                                    true, clientData.clientMobile,
                                    function (error, id) {
                                        if (error) {
                                            logger.error(error);
                                            done(error);
                                        } else {
                                            logger.trace("New operator insert successfully");
                                            done(error, id);
                                        }
                                    }
                                );
                            },
                            // step3.更新客户GSP证书合同执照
                            function (done) {
                                logger.enter();
                                db.updateClientGspImage(connection, dbName , clientId, clientGSP, function (error, result) {
                                    if(error) {
                                        logger.error(error);
                                        done(error);
                                    } else {
                                        logger.trace("new clientGSP insert success:" + result.toString());
                                        done(null, result);
                                    }
                                });
                            }
                        ],
                        function finalization(error) {
                            logger.enter();

                            if (error && (typeof error === "object")) {
                                logger.trace("Found ERROR, rollback Transaction");
                                logger.ndump("err", error);
                                db.rollbackTrans(connection, function () {
                                    callback(error);
                                });
                            } else {
                                logger.trace("All SQL passed, commit transaction");
                                db.commitTrans(connection, function () {
                                    callback(null, clientId);
                                });
                            }
                        }
                    );
                });
            });
        },

        clientAddUpdatedInfo : function(dbName,clientData,callback){
            logger.enter();

            //目前账号 和名字 不允许改
            var clientBasicInfo= {
                clientMobile: clientData.basicInfo.phoneNumber
            };
            if (!clientData.gspInfo.images) {
                clientData.gspInfo.images = "";
            } else {
                clientData.gspInfo.images = clientData.gspInfo.images.toString();
            }
            var clientGSP = {
                clientId:                                   clientData.clientId,
                mobile:                                     clientData.basicInfo.phoneNumber,
                legalRepresentative:                        underscore.isEmpty(clientData.gspInfo.legalReprent) ? null : "'" +  clientData.gspInfo.legalReprent+ "'" ,
                registeredCapital:                          underscore.isEmpty(clientData.gspInfo.registeredCapital) ? null : "'" +  clientData.gspInfo.registeredCapital+ "'" ,
                businessAddress:                            underscore.isEmpty(clientData.gspInfo.address) ? null : "'" +  clientData.gspInfo.address+ "'" ,
                limitedBusinessRange:                       underscore.isEmpty(clientData.gspInfo.limitedBusinessRange) ? null : "'" +  clientData.gspInfo.limitedBusinessRange+ "'" ,
                limitedBusinessType:                        underscore.isEmpty(clientData.gspInfo.limitedBusinessType) ? null : "'" +  clientData.gspInfo.limitedBusinessType+ "'" ,
                businessLicense:                            underscore.isEmpty(clientData.gspInfo.businessLicense) ? null : "'" +  clientData.gspInfo.businessLicense+ "'" ,
                businessLicenseValidateDate:                underscore.isEmpty(clientData.gspInfo.businessLicenseEndDate) ? null : "'" +  clientData.gspInfo.businessLicenseEndDate+ "'" ,
                orgCode:                                    underscore.isEmpty(clientData.gspInfo.orgCodeCertificate) ? null : "'" +  clientData.gspInfo.orgCodeCertificate+ "'" ,
                orgCodeValidateDate:                        underscore.isEmpty(clientData.gspInfo.orgCodeCertificateEndDate) ? null : "'" +  clientData.gspInfo.orgCodeCertificateEndDate+ "'" ,
                taxRegistrationLicenseNum:                  underscore.isEmpty(clientData.gspInfo.taxRegcertificate) ? null : "'" +  clientData.gspInfo.taxRegcertificate+ "'" ,
                taxRegistrationLicenseNumValidateDate:      underscore.isEmpty(clientData.gspInfo.taxRegcertificateEndDate) ? null : "'" +  clientData.gspInfo.taxRegcertificateEndDate+ "'" ,

                gmpOrGspLicenseNum:                         underscore.isEmpty(clientData.gspInfo.GMPandGSPcertificate) ? null : "'" +  clientData.gspInfo.GMPandGSPcertificate+ "'" ,
                gmpOrGspLicenseNumValidateDate:             underscore.isEmpty(clientData.gspInfo.GMPandGSPcertificateEndDate) ? null : "'" +  clientData.gspInfo.GMPandGSPcertificateEndDate+ "'" ,
                medicalInstitutionLicenseNum:               underscore.isEmpty(clientData.gspInfo.medInsOccCertifacate) ? null : "'" +  clientData.gspInfo.medInsOccCertifacate+ "'" ,
                medicalInstitutionLicenseNumValidateDate:   underscore.isEmpty(clientData.gspInfo.medInsOccCertifacateEndDate) ? null : "'" +  clientData.gspInfo.medInsOccCertifacateEndDate+ "'" ,
                institutionLegalPersonCert:                 underscore.isEmpty(clientData.gspInfo.InsLegalPersonCertifacate) ? null : "'" +  clientData.gspInfo.InsLegalPersonCertifacate+ "'" ,
                institutionLegalPersonCertValidateDate:     underscore.isEmpty(clientData.gspInfo.InsLegalPersonCertifacateEndDate) ? null : "'" +  clientData.gspInfo.InsLegalPersonCertifacateEndDate+ "'" ,

                productionAndBusinessLicenseNum:            underscore.isEmpty(clientData.gspInfo.proAndBusOperationCertifacate) ? null : "'" +  clientData.gspInfo.proAndBusOperationCertifacate+ "'" ,
                productionAndBusinessLicenseNumValidateDate:underscore.isEmpty(clientData.gspInfo.proAndBusOperationCertifacateEndDate) ? null : "'" +  clientData.gspInfo.proAndBusOperationCertifacateEndDate+ "'" ,
                foodCirculationLicenseNum:                  underscore.isEmpty(clientData.gspInfo.foodCirclePermit) ? null : "'" +  clientData.gspInfo.foodCirclePermit+ "'" ,
                foodCirculationLicenseNumValidateDate:      underscore.isEmpty(clientData.gspInfo.foodCirclePermitEndDate) ? null : "'" +  clientData.gspInfo.foodCirclePermitEndDate+ "'" ,
                medicalApparatusLicenseNum:                 underscore.isEmpty(clientData.gspInfo.medDevLicense) ? null : "'" +  clientData.gspInfo.medDevLicense+ "'" ,
                medicalApparatusLicenseNumValidateDate:     underscore.isEmpty(clientData.gspInfo.medDevLicenseEndDate) ? null : "'" +  clientData.gspInfo.medDevLicenseEndDate+ "'" ,

                healthProductsLicenseNum:                   underscore.isEmpty(clientData.gspInfo.healthCertifacate) ? null : "'" +  clientData.gspInfo.healthCertifacate+ "'" ,
                healthProductsLicenseNumValidateDate:       underscore.isEmpty(clientData.gspInfo.healthCertifacateEndDate) ? null : "'" +  clientData.gspInfo.healthCertifacateEndDate+ "'" ,
                mentaanesthesiaLicenseNum:                  underscore.isEmpty(clientData.gspInfo.spiritualNarcoticCard) ? null : "'" +  clientData.gspInfo.spiritualNarcoticCard+ "'" ,
                mentalanesthesiaLicenseNumValidateDate:     underscore.isEmpty(clientData.gspInfo.spiritualNarcoticCardEndDate) ? null : "'" +  clientData.gspInfo.spiritualNarcoticCardEndDate+ "'" ,
                hazardousChemicalsLicenseNum:               underscore.isEmpty(clientData.gspInfo.dangerChemicalLicense) ? null : "'" +  clientData.gspInfo.dangerChemicalLicense+ "'" ,
                hazardousChemicalsLicenseNumValidateDate:   underscore.isEmpty(clientData.gspInfo.dangerChemicalLicenseEndDate) ? null : "'" +  clientData.gspInfo.dangerChemicalLicenseEndDate+ "'" ,

                maternalLicenseNum:                         underscore.isEmpty(clientData.gspInfo.maternalOccuLicense) ? null : "'" +  clientData.gspInfo.maternalOccuLicense+ "'" ,
                maternalLicenseNumValidateDate:             underscore.isEmpty(clientData.gspInfo.maternalOccuLicenseEndDate) ? null : "'" +  clientData.gspInfo.maternalOccuLicenseEndDate+ "'" ,
                gspImages:                                     underscore.isEmpty(clientData.gspInfo.images) ? null : "'" +  clientData.gspInfo.images + "'"
            };

            db.updateGSPtoTableCLientUpdate(dbName,clientGSP,function(err,result){
                if(err){
                    logger.error(err);
                }else{
                    callback(null,result);
                }
            });
        }
        ,
        clientUpdateRegisterInfo:function(dbName,clientData,callback){
            logger.enter();
            //目前账号 和名字 不允许改
            var clientBasicInfo= {
                clientMobile: clientData.basicInfo.phoneNumber
            };
            if (!clientData.gspInfo.images) {
                clientData.gspInfo.images = "";
            } else {
                clientData.gspInfo.images = clientData.gspInfo.images.toString();
            }
            var clientGSP = {
                legalRepresentative:                        underscore.isEmpty(clientData.gspInfo.legalReprent) ? null : "'" +  clientData.gspInfo.legalReprent+ "'" ,
                registeredCapital:                          underscore.isEmpty(clientData.gspInfo.registeredCapital) ? null : "'" +  clientData.gspInfo.registeredCapital+ "'" ,
                businessAddress:                            underscore.isEmpty(clientData.gspInfo.address) ? null : "'" +  clientData.gspInfo.address+ "'" ,
                limitedBusinessRange:                       underscore.isEmpty(clientData.gspInfo.limitedBusinessRange) ? null : "'" +  clientData.gspInfo.limitedBusinessRange+ "'" ,
                limitedBusinessType:                        underscore.isEmpty(clientData.gspInfo.limitedBusinessType) ? null : "'" +  clientData.gspInfo.limitedBusinessType+ "'" ,
                businessLicense:                            underscore.isEmpty(clientData.gspInfo.businessLicense) ? null : "'" +  clientData.gspInfo.businessLicense+ "'" ,
                businessLicenseValidateDate:                underscore.isEmpty(clientData.gspInfo.businessLicenseEndDate) ? null : "'" +  clientData.gspInfo.businessLicenseEndDate+ "'" ,
                orgCode:                                    underscore.isEmpty(clientData.gspInfo.orgCodeCertificate) ? null : "'" +  clientData.gspInfo.orgCodeCertificate+ "'" ,
                orgCodeValidateDate:                        underscore.isEmpty(clientData.gspInfo.orgCodeCertificateEndDate) ? null : "'" +  clientData.gspInfo.orgCodeCertificateEndDate+ "'" ,
                taxRegistrationLicenseNum:                  underscore.isEmpty(clientData.gspInfo.taxRegcertificate) ? null : "'" +  clientData.gspInfo.taxRegcertificate+ "'" ,
                taxRegistrationLicenseNumValidateDate:      underscore.isEmpty(clientData.gspInfo.taxRegcertificateEndDate) ? null : "'" +  clientData.gspInfo.taxRegcertificateEndDate+ "'" ,

                gmpOrGspLicenseNum:                         underscore.isEmpty(clientData.gspInfo.GMPandGSPcertificate) ? null : "'" +  clientData.gspInfo.GMPandGSPcertificate+ "'" ,
                gmpOrGspLicenseNumValidateDate:             underscore.isEmpty(clientData.gspInfo.GMPandGSPcertificateEndDate) ? null : "'" +  clientData.gspInfo.GMPandGSPcertificateEndDate+ "'" ,
                medicalInstitutionLicenseNum:               underscore.isEmpty(clientData.gspInfo.medInsOccCertifacate) ? null : "'" +  clientData.gspInfo.medInsOccCertifacate+ "'" ,
                medicalInstitutionLicenseNumValidateDate:   underscore.isEmpty(clientData.gspInfo.medInsOccCertifacateEndDate) ? null : "'" +  clientData.gspInfo.medInsOccCertifacateEndDate+ "'" ,
                institutionLegalPersonCert:                 underscore.isEmpty(clientData.gspInfo.InsLegalPersonCertifacate) ? null : "'" +  clientData.gspInfo.InsLegalPersonCertifacate+ "'" ,
                institutionLegalPersonCertValidateDate:     underscore.isEmpty(clientData.gspInfo.InsLegalPersonCertifacateEndDate) ? null : "'" +  clientData.gspInfo.InsLegalPersonCertifacateEndDate+ "'" ,

                productionAndBusinessLicenseNum:            underscore.isEmpty(clientData.gspInfo.proAndBusOperationCertifacate) ? null : "'" +  clientData.gspInfo.proAndBusOperationCertifacate+ "'" ,
                productionAndBusinessLicenseNumValidateDate:underscore.isEmpty(clientData.gspInfo.proAndBusOperationCertifacateEndDate) ? null : "'" +  clientData.gspInfo.proAndBusOperationCertifacateEndDate+ "'" ,
                foodCirculationLicenseNum:                  underscore.isEmpty(clientData.gspInfo.foodCirclePermit) ? null : "'" +  clientData.gspInfo.foodCirclePermit+ "'" ,
                foodCirculationLicenseNumValidateDate:      underscore.isEmpty(clientData.gspInfo.foodCirclePermitEndDate) ? null : "'" +  clientData.gspInfo.foodCirclePermitEndDate+ "'" ,
                medicalApparatusLicenseNum:                 underscore.isEmpty(clientData.gspInfo.medDevLicense) ? null : "'" +  clientData.gspInfo.medDevLicense+ "'" ,
                medicalApparatusLicenseNumValidateDate:     underscore.isEmpty(clientData.gspInfo.medDevLicenseEndDate) ? null : "'" +  clientData.gspInfo.medDevLicenseEndDate+ "'" ,

                healthProductsLicenseNum:                   underscore.isEmpty(clientData.gspInfo.healthCertifacate) ? null : "'" +  clientData.gspInfo.healthCertifacate+ "'" ,
                healthProductsLicenseNumValidateDate:       underscore.isEmpty(clientData.gspInfo.healthCertifacateEndDate) ? null : "'" +  clientData.gspInfo.healthCertifacateEndDate+ "'" ,
                mentaanesthesiaLicenseNum:                  underscore.isEmpty(clientData.gspInfo.spiritualNarcoticCard) ? null : "'" +  clientData.gspInfo.spiritualNarcoticCard+ "'" ,
                mentalanesthesiaLicenseNumValidateDate:     underscore.isEmpty(clientData.gspInfo.spiritualNarcoticCardEndDate) ? null : "'" +  clientData.gspInfo.spiritualNarcoticCardEndDate+ "'" ,
                hazardousChemicalsLicenseNum:               underscore.isEmpty(clientData.gspInfo.dangerChemicalLicense) ? null : "'" +  clientData.gspInfo.dangerChemicalLicense+ "'" ,
                hazardousChemicalsLicenseNumValidateDate:   underscore.isEmpty(clientData.gspInfo.dangerChemicalLicenseEndDate) ? null : "'" +  clientData.gspInfo.dangerChemicalLicenseEndDate+ "'" ,

                maternalLicenseNum:                         underscore.isEmpty(clientData.gspInfo.maternalOccuLicense) ? null : "'" +  clientData.gspInfo.maternalOccuLicense+ "'" ,
                maternalLicenseNumValidateDate:             underscore.isEmpty(clientData.gspInfo.maternalOccuLicenseEndDate) ? null : "'" +  clientData.gspInfo.maternalOccuLicenseEndDate+ "'" ,
                images:                                     underscore.isEmpty(clientData.gspInfo.images) ? null : "'" +  clientData.gspInfo.images + "'"
            };
            //todo 没有更新图片 有问题
            db.beginTrans(function (connection) {
                var clientId = null;
                async.series(
                    [
                        function updateBasicInfo(done){
                            logger.enter();
                            db.ClientUpdateBasicInfo(connection,dbName,clientData.clientId,clientBasicInfo.clientMobile,function(error,affectRows){
                                //todo update mobil to Operator.sql
                              if(error){
                                  logger.error(error);
                                  done(error);
                              }
                              else{
                                done(null,affectRows);
                              }
                            })
                        },
                        function updateGspInfo(done){
                            logger.enter();
                            db.clientUpdateGspInfo(connection,dbName,clientGSP,clientData.clientId,function(err,affectRows){
                                if(err){
                                    logger.error(err);
                                    done(err);
                                }
                                else{
                                    done(null,affectRows);
                                }
                            });
                        }
                    ],
                    function error(error) {
                        logger.enter();
                        logger.ndump("err", error);
                        if ( error && (typeof error === "object")) {
                            logger.trace("Found ERROR, rollback Transaction");
                            db.rollbackTrans(connection, function () {
                                callback(error);
                            });
                        } else {
                            logger.trace("All SQL passed, commit transaction");
                            db.commitTrans(connection, function () {
                                callback(null, clientId);
                            });
                        }
                    }
                );
            });

        },

        /**
         * 获取所有客户GSP类型
         * @param dbName
         * @param callback
         */
        getClientGspTypes: function(dbName, callback){
            db.listClientGspTypes(dbName, function (err, gspTypes) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(null, gspTypes);
                }
            });
        },

        /**
         * 检查指定操作人是否存在
         * @param dbName
         * @param operatorName
         * @param callback
         */
        getOperatorIsExist: function(dbName, operatorName, callback) {
            db.operatorIsExist(dbName, operatorName, function (error, result) {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * 发送短信验证码
         * @param customerDB
         * @param phoneNumber
         * @param key
         * @param callback
         */
        postRegisterMobileCaptcha: function(customerDB,phoneNumber, key, callback) {
            logger.enter();
            var smsCode;
            __cacheService.get(key, function (resultCode, result) {
                if (resultCode == FBCode.NOTFOUND) {
                    logger.dump('该手机号码' + phoneNumber + ' 第一次获取验证码或者已经过期:');
                    smsCode = Math.floor(Math.random() * 9000) + 1000;
                    __cacheService.set(key, smsCode, CONSTANTS.registerSMSContent.TTL, function(err,result){
                        if(err){logger.error(err)};
                    });//该短信验证码生存时间
                } else {
                    logger.dump('从redis里面获取的验证码:' + result);
                    smsCode = result;
                }
                var smsContent = CONSTANTS.registerSMSContent.sendSMSContent.replace('mobileCode', smsCode);
                logger.dump('手机号码:' + phoneNumber);
                logger.dump('短信内容:' + smsContent);
                smsModule.sendClientSMS(customerDB,phoneNumber, smsContent, function (err,feedback) {
                    if (err) {
                        logger.error(err);
                        callback(err);
                    }
                    else {
                        callback(null, {smsCode: smsCode,isMainSucc:feedback.isMainSucc});
                    }
                });
            });
        },

        /**
         * 验证短信注册码
         * @param phoneNumber
         * @param captcha
         * @param callback
         */
        getValidateRegisterMobCaptcha: function(phoneNumber, captcha, callback) {
            logger.enter();
            if(__enableCaptcha) {
                var key = CONSTANTS.registerSMSContent.registerRedisKeyPrefix + phoneNumber;
                __cacheService.get(key, function (resultCode, result) {

                    if (resultCode == FBCode.NOTFOUND) {
                        callback(false);
                    } else {
                        callback(captcha == result);
                    }

                });
            }else{
                callback(true);
            }
        },

    };

    return model;
};
