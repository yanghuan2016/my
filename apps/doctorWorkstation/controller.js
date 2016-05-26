/*****************************************************************
 * 青岛雨人软件有限公司©2016版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

// global variables:
var modulesPath = __modules_path;
var logger = __logService;
var db = __dbService;
var cloudDbName = __cloudDBName;
var redisConn = __redisClient;
var cacheService = __cacheService;

// third modules:
var path = require("path");
var _ = require('lodash');
var md5 = require('js-md5');
var async = require('async');
var moment=require('moment');

// scc modules:
var model = require('./model');
var sccPath = require(modulesPath + '/mypath');
var Md5Calibrator = require(modulesPath + "/md5Calibrator");
var MsgRobot = require(modulesPath + "/msgRobot");
var FBCode = require(modulesPath + "/feedback").FBCode;
var Feedback = require(modulesPath + "/feedback").FeedBack;
var MsgTransmitter = require(__modules_path + '/msgTransmitter');
var QRGenerator = require(__base + '/services/wechat/wechatToSccApi.js').toWechatUrl;

// initialize
var doctorWorkstationPath = "/" + sccPath.getAppName(__dirname);
var md5Calibrator = new Md5Calibrator(md5);
var msgRobot = new MsgRobot(md5Calibrator);

module.exports = function (app) {

    // 身份认证
    app.route(doctorWorkstationPath + '/authentication')
        .post(postAuthentication);
    function postAuthentication(req, res) {
        logger.enter();

        var userName = req.body.username;
        var password = req.body.password;

        var customerDbName = req.session.customer.customerDB;
        model.checkDoctor(customerDbName, userName, password, function (error, doctorInfo) {
            if (error) {
                logger.error(error);
                return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙请稍后再试.'));
            }

            if (doctorInfo.length === 0) {
                logger.trace('没有找到对应的doctor数据, username:' + userName + ', password:' + password);
                req.session.destroy();
                return res.json(new Feedback(FBCode.INVALIDDATA, '用户名或者密码错误,请检查后再试.'));
            }

            var feedbackData = {
                doctorInfo: doctorInfo[0],
                token: req.sessionID
            };
            req.session.doctorInfo = doctorInfo[0];
            res.json(new Feedback(FBCode.SUCCESS, '登录成功!', feedbackData));
        });
    }
    app.route(doctorWorkstationPath + '/authentication/:doctorId')
        .delete(LogoutAuthentication);
    function LogoutAuthentication(req, res) {
        logger.enter();
        // clear cookies and access-token
        res.header("cookies", undefined);
        res.header("access-token", undefined);
        req.session.destroy();

        res.json(new Feedback(FBCode.SUCCESS, "登出成功."));
    }

    // 某位医生的所有诊断单数据
    app.route(doctorWorkstationPath + '/doctor/:doctorId/diagnosis')
        .get(getDiagnosisByDoctorId);
    function getDiagnosisByDoctorId(req, res) {
        logger.enter();
        var doctorId = req.params.doctorId;
        var customerDbName = req.session.customer.customerDB;
        db.retrieveDiagnosisByDoctorId(customerDbName, doctorId, function (error, diagnosis) {
            if (error) {
                logger.error(error);
                return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙, 请稍后再试.'));
            }

            var feedbackData = {
                diagnosis: diagnosis
            };
            res.json(new Feedback(FBCode.SUCCESS, '成功返回诊断单数据.', feedbackData));
        });
    }

    // 隶属于某位医生的某诊断单数据(将包含处方的列表)
    app.route(doctorWorkstationPath + '/doctor/:doctorId/diagnosis/:diagnosisId')
        .get(getDiagnosisById);
    function getDiagnosisById(req, res) {
        logger.enter();
        var doctorId = req.params.doctorId;
        var diagnosisId = req.params.diagnosisId;
        var customerDbName = req.session.customer.customerDB;
        db.retrieveDiagnosisBy_doctorId_diagnosisId(customerDbName, doctorId, diagnosisId, function (error, diagnosis) {
            if (error) {
                logger.error(error);
                return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙, 请稍后再试.'));
            }

            var feedbackData = {
                diagnosis: diagnosis
            };
            res.json(new Feedback(FBCode.SUCCESS, '成功返回诊断单数据.', feedbackData));
        });
    }

    // 某条处方信息
    app.route(doctorWorkstationPath + '/doctor/:doctorId/diagnosis/:diagnosisId/prescription/:prescriptionId')
        .get(getPrescriptionById);
    function getPrescriptionById(req, res) {
        logger.enter();

        var prescriptionId = req.params.prescriptionId;
        var customerDbName = req.session.customer.customerDB;

        model.retrievePrescriptionById(customerDbName, prescriptionId, function (error, prescription) {
            if (error) {
                logger.error(error);
                return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙, 请稍后再试.'));
            }

            var feedbackData = {
                prescription: prescription
            };
            res.json(new Feedback(FBCode.SUCCESS, '获取处方信息成功.', feedbackData));
        });
    }

    // 处方:
    app.route(doctorWorkstationPath + '/doctor/:doctorId/diagnosis/:diagnosisId/prescription')
        .post(postPrescription);
    // 添加处方:
    function postPrescription(req, res) {
        logger.enter();

        var doctorId = req.params.doctorId;
        var diagnosisId = req.params.diagnosisId;

        // TODO:  做权限判断
        var customerDbName = req.session.customer.customerDB;
        var prescription = req.body.prescription;
        /*prescription = {
         prescriptionId: 'string',       // 处方单号
         diagnosisId: 'string',          // 诊断单Id
         prescriptionType: 'type1',      // 处方类型
         prescriptionStatus: 'status1',  // 处方状态
         remark: 'string',               // 备注
         prescriptionDetail: [
         {
         unicode: 'string',      // 平台编码
         dose: 'string',         // 每次用量
         dailyTimes: 'string',   // 频次
         takeMethods: 'string',  // 服用方法
         medicationTime: 'string',   // 用药时间
         quantity: 'string',     // 购买数量
         price: 'string',        // 单价
         subtotal: 'string'      // 小计
         }
         ]
         };*/

        model.createPrescription(customerDbName, prescription, function (error, result) {
            if (error) {
                logger.error(error);
                return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙, 请稍后再试.'));
            }

            res.json(new Feedback(FBCode.SUCCESS, '成功创建处方.', {}));
        });
    }


    app.route(doctorWorkstationPath + '/goods')
        .get(getGoods);
    // 查询商品信息
    function getGoods(req, res) {
        logger.enter();

        var goodsName = req.query.search;
        var customerDbName = req.session.customer.customerDB;

        db.retrieveGoodsByCommonName(customerDbName, goodsName, goodsName, function (error, goods) {
            if (error) {
                logger.error(error);
                return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙,请稍后再试.'));
            }

            var feedbackData = {
                goods: goods
            };

            res.json(new Feedback(FBCode.SUCCESS, '成功匹配到药品信息.', feedbackData));
        });
    }

    //根据处方单信息获取数据
    app.route(doctorWorkstationPath + '/prescription/:prescriptionId')
        .get(getPrescriptionByPrescriptionId);
    function getPrescriptionByPrescriptionId(req, res) {
        var prescriptionId = req.params.prescriptionId;
        var customerDbName = req.session.customer.customerDB;

        model.getPrescriptionByprescriptionId(customerDbName, prescriptionId, function (error, results) {
            if (error) {
                logger.error(error);
                return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙, 请稍后再试.'));
            }

            var feedbackData = {
                prescription: results[0],
                diagnosis: results[1],
                patient: results[2]
            };
            res.json(new Feedback(FBCode.SUCCESS, '获取处方信息成功.', feedbackData));
        });


    }

    //根据处方单号 构造到要配送的 数据
    app.route(doctorWorkstationPath + '/sendGrab/:prescriptionId')
        .get(getPrescriptionDataByPrescriptionId);
    function getPrescriptionDataByPrescriptionId(req, res) {
        logger.enter();
        var prescriptionId = req.params.prescriptionId;
        var customerDbName = req.session.customer.customerDB;



        model.getPrescriptionByprescriptionId(customerDbName, prescriptionId, function (error, results) {
            if (error) {
                logger.error(error);
                return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙, 请稍后再试.'));
            }
            var orderDetails=[],
                orderInfo = {
                    orderNo: prescriptionId.substr(0,8),       //# 电商订单号，必填
                    amount: 0,             //# 订单金额，必填
                    grabberDeadline: moment().add(4,'hours').format('YYYY-MM-DD HH:mm:ss'),         //# 订单抢单截止时间，可为空，如有要求可获取
                    shippedDeadline: moment().add(2,'days').format('YYYY-MM-DD HH:mm:ss'),         //# 订单配送截止时间，可为空，如有要求可获取
                    remark: ""             //# 电商订单备注，可为空，如有要求可获取
                };
            var tempAmount=0;
            _.map(results[0],function(item){
                tempAmount+= Number(item.quantity)*Number(item.price);
                var tempObj={
                    skuId:item.goodsNo,         //# 商品货号，必填
                    skuName:item.commonName,            //# 商品名称，必填
                    price:item.price,                //# 商品价格，必填
                    spec:item.spec,               //# 规格，必填
                    quantity:item.quantity,                 //# 数量，必填
                    unit:item.measureUnit,                  //# 单位，必填
                    producer:item.supplier,         //# 生产厂家，必填
                    thumbUrl:item.imageUrl      //# 商品缩略图，必填
                };
                orderDetails.push(tempObj);
            });
            orderInfo.amount=tempAmount;

            var orderData={
                orderInfo:orderInfo,
                orderDetails:orderDetails,
                userId:results[2][0].patientCardId
            };
            res.json(new Feedback(FBCode.SUCCESS, '获取处方信息成功.', orderData));
        });


        //model.retrievePrescriptionById(customerDbName, prescriptionId, function (error, prescription) {
        //    if (error) {
        //        logger.error(error);
        //        return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙, 请稍后再试.'));
        //    }
        //
        //    //格式化prescription
        //    var orderDetails=[],
        //        orderInfo = {
        //        orderNo: prescriptionId.substr(0,8),       //# 电商订单号，必填
        //        amount: null,             //# 订单金额，必填
        //        grabberDeadline: "",         //# 订单抢单截止时间，可为空，如有要求可获取
        //        shippedDeadline: "",         //# 订单配送截止时间，可为空，如有要求可获取
        //        remark: ""             //# 电商订单备注，可为空，如有要求可获取
        //    };
        //    var tempAmount=0;
        //    _.map(prescription,function(item){
        //            tempAmount+= Number(item.quantity)*Number(item.price);
        //            var tempObj={
        //                skuId:item.goodsNo,         //# 商品货号，必填
        //                skuName:item.commonName,            //# 商品名称，必填
        //                price:item.price,                //# 商品价格，必填
        //                spec:item.spec,               //# 规格，必填
        //                quantity:item.quantity,                 //# 数量，必填
        //                unit:item.measureUnit,                  //# 单位，必填
        //                producer:item.supplier,         //# 生产厂家，必填
        //                thumbUrl:item.imageUrl      //# 商品缩略图，必填
        //            };
        //            orderDetails.push(tempObj);
        //    });
        //    orderInfo.amount=tempAmount;
        //
        //    var orderData={
        //        orderInfo:orderInfo,
        //        orderDetails:orderDetails
        //    };
        //    res.json(new Feedback(FBCode.SUCCESS, '获取处方信息成功.', orderData));
        //});

    }



    //更改处方单的状态
    app.route(doctorWorkstationPath + '/prescriptionInfo/updateStatus/:prescriptionId')
        .post(updatePrescriptionStatus);
    function updatePrescriptionStatus(req,res){
        var presscriptionId=req.params.prescriptionId,
            status=req.body.status,
            customerDbName = req.session.customer.customerDB;

        model.updatePrescriptionStatusById(customerDbName,presscriptionId,status,function(err,result){
             if(err){
                 logger.error(err);
                 return res.json(new Feedback(FBCode.DBFAILURE, '数据库忙, 请稍后再试.'));
             }
            res.json(new Feedback(FBCode.SUCCESS, '更新处方信息成功.', result));

        });

    }

    app.route(doctorWorkstationPath + "/prescription/QRCode/:prescriptionId")
        .get(getPrescriptionQRCode);
    function getPrescriptionQRCode(req, res) {
        logger.enter();

        var prescriptionId = req.params.prescriptionId;
        var url = QRGenerator(prescriptionId);
        logger.ndump(url);

        var feedbackData = {
            url: url
        };
        res.json(new Feedback(FBCode.SUCCESS, '成功获取到二维码url.', feedbackData));
    }

};









