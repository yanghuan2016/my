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
var _ = require('underscore');

var async = require('async');
var sprintf = require("sprintf-js").sprintf;
var smsModule = require(__modules_path + "/smsModule")();
var ERPGoodsAsync = require(__base + '/tools/goodsAsync/ERPGoodsAsync');
var MsgTransmitter = require(__modules_path + '/msgTransmitter');
var cloudTask = require(__services_path + "/db/cloud/task")();

var feedback = require(__modules_path + "/feedback");
var FBCode = feedback.FBCode;


function DoctorWorkStationModel() {
}

// 身份验证,检查用户名&密码
DoctorWorkStationModel.prototype.checkDoctor = function (customerDbName, userName, password, callback) {
    logger.enter();

    db.getDoctorInfoBy_username_password(customerDbName, userName, password, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

// 创建&更新一个prescription(包括prescriptionInfo&prescriptionDetail)
DoctorWorkStationModel.prototype.createPrescription = function (customerDbName, prescription, callback) {
    logger.enter();

    // todo:
    // 1. add prescriptionInfo

    var prescriptionInfo = [];
    prescriptionInfo.push(prescription.prescriptionId);
    prescriptionInfo.push(prescription.diagnosisId);
    prescriptionInfo.push(prescription.prescriptionType);
    prescriptionInfo.push(prescription.prescriptionStatus);
    prescriptionInfo.push(prescription.remark);

    // 2. add prescriptionDetail
    var prescriptionDetail = _.map(prescription.prescriptionDetail, function (item) {
        var temp = [];
        temp.push(prescription.prescriptionId);
        temp.push(item.unicode);
        temp.push(item.dose);
        temp.push(item.dailyTimes);
        temp.push(item.takeMethods);
        temp.push(item.medicationTime);
        temp.push(item.quantity);
        temp.push(item.price);
        temp.push(item.subtotal);
        return temp;
    });

    db.beginTrans(function (conn) {
        async.series(
            [
                // 将处方保存下来:
                function seriesFunCreatePrescriptionInfo(callback) {
                    logger.enter();

                    db.createPrescriptionInfo(conn, customerDbName, [prescriptionInfo], function (error, result) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }

                        callback(null, result);
                    });
                },

                // 将处方详情中的数据删掉
                function seriesFuncRemovePrescriptionDetail(callback) {
                    logger.enter();

                    db.deletePrescriptionDetail(conn, customerDbName, prescription.prescriptionId, function (error, result) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }

                        callback(null, result);
                    });
                },

                // 将处方详情写入数据库
                function createPrescriptionDetail(callback) {
                    logger.enter();

                    if (prescriptionDetail.length ===0) {
                        return callback(null, '');
                    }
                    db.createPrescriptionDetail(conn, customerDbName, prescriptionDetail, function (error, result) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }

                        callback(null, result);
                    });
                }
            ],
            function seriesCallback(error, result) {
                if (error) {
                    logger.error(error);
                    conn.rollback(function () {
                        conn.release();
                        callback(error);
                    });
                } else {
                    conn.commit(function (error) {
                        if (error) {
                            logger.sqlerr(error);
                            conn.release();
                            return callback(error)
                        }

                        callback(null, result);
                    });

                }
            }
        )
    });
};

// 通过prescriptionInfoId查询prescription信息
DoctorWorkStationModel.prototype.retrievePrescriptionById = function (customerDbName, prescriptionId, callback) {
    logger.enter();

    db.retrievePrescriptionById(customerDbName, prescriptionId, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

// 更新病人的weChatOpenId
DoctorWorkStationModel.prototype.updatePatientWeChatOpenId = function (customerDbName, prescriptionInfoId, weChartOpenId, callback) {
    logger.enter();
    // 先找出病人Id,
    // 更新病人信息
    var patient = null;
    var pId=null;
    async.series(
        [
            // 查询patient信息
            function (done) {
                db.retrievePatientByPrescriptionInfoId(customerDbName, prescriptionInfoId, function (error, patient) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }
                    if (patient.length === 0 ) {
                        return callback(new Error('没有查到对应的数据。'));
                    }
                    logger.ndump('patient:', patient[0].patientCardId);
                    pId=patient[0].patientCardId;
                    //patient = patient[0];
                    done(null, patient);
                });
            },
            // 将patient的weChatOpenId更新到patient表中
            function (callback) {
                logger.dump('pId ', patient);
                db.updatePatientWeChatOpenId(customerDbName, pId, weChartOpenId, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    callback(null, result);
                });
            }
        ],
        function (error, result) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            callback(null, result);
        }
    );
};

//通过处方单号查询处方信息 患者信息  诊断时间
DoctorWorkStationModel.prototype.getPrescriptionByprescriptionId = function (customerDbName, prescriptionInfoId, callback) {
    logger.enter();
    async.series([

            function(done){
                db.retrievePrescriptionById(customerDbName,prescriptionInfoId,function(err,result){
                    if(err){
                        done(err);
                    }else{
                        done(err,result);
                    }
                })
            },
            function(done){
                db.retrieveDiagnosisByPreDescriptionId(customerDbName,prescriptionInfoId,function(err,result){
                    if(err){
                        done(err);
                    }else{
                        done(err,result);
                    }
                })
            },
            function(done){
                db.retrievePatientByPreDescriptionId(customerDbName,prescriptionInfoId,function(err,result){
                    if(err){
                        done(err);
                    }else{
                        done(err,result);
                    }
                });
            }

    ],function(err,results){
        if(err){
            callback(err);
        }else{
            callback(err,results);
        }
    });
};

DoctorWorkStationModel.prototype.retrieveNearlyPrescriptionInfoByWeChatOpenId = function (customerDbName, weChatOpenId, callback) {
    logger.enter();

    var prescription = {
        prescriptionInfo: null,
        prescriptionDetail: null,
        diagnosis: null,
        patient: null,
        doctor: null
    };
    async.series(
        [
            // retrieve patientCardId
            function (callback) {
                logger.enter();

                db.retrievePatientByWeChatOpenId(customerDbName, weChatOpenId, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    if (result.length === 0 ) {
                        return callback(new Error('没有找Id对应的病人信息。'));
                    }
                    prescription.patient = result[0];
                    logger.ndump(result[0]);
                    callback(null, result);
                });
            },
            // retrieve last diagnosis
            function (callback) {
                logger.enter();

                var patientCardId = prescription.patient.patientCardId;
                db.retrieveLastDiagnosisByPatientCardId(customerDbName, patientCardId, function (error, diagnosis) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    prescription.diagnosis = diagnosis[0];
                    logger.ndump(diagnosis[0]);
                    callback(null, diagnosis);
                });
            },
            // get last prescriptionInfo
            function (callback) {
                logger.enter();

                var diagnosisId = prescription.diagnosis.diagnosisId;
                db.retrieveLastPrescriptionByDiagnosisId(customerDbName, diagnosisId, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    prescription.prescriptionInfo = result[0];
                    logger.ndump('diagnosis:', result[0]);
                    callback(null, result);
                })
            },
            //get prescriptionDetail by prescriptionId
            function (callback) {
                logger.ndump(':', prescription.prescriptionInfo);
                var prescriptionId = prescription.prescriptionInfo.prescriptionInfoId;
                db.retrievePrescriptionDetailByPrescriptionId(customerDbName, prescriptionId, function (error, prescriptionDetail) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    prescription.prescriptionDetail = prescriptionDetail;
                    logger.ndump('prescriptionDetail',prescriptionDetail);
                    callback(null, prescriptionDetail);
                });
            }
        ],
        function (error) {
            if (error) {
                logger.error(error);
                return callback(error);
            }
            logger.ndump('result:', prescription);
            callback(null, prescription);
        }
    );
};

//通过处方单号更新处方单状态
DoctorWorkStationModel.prototype.updatePrescriptionStatusById=function(customerDbName,prescriptionInfoId,status,callback){
    logger.enter();
    db.updatePrescriptionStatusByPreDescriptionId(customerDbName,prescriptionInfoId,status,function(err,result){
        if(err){
            logger.error(err);
            return callback(err);
        }
        callback(err,result);
    })
};



module.exports = new DoctorWorkStationModel();


