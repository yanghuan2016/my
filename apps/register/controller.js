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
 * index/controller.js
 *
 * index controller
 * --------------------------------------------------------------
 * 2015-09-18	hc-romens@issue#22	清理代码
 *
 */

module.exports = function (app) {
    var logger = __logService;
    var dataService = __dataService;

    var path = require('path');
    var underscore = require("underscore");
    var moment = require('moment');
    var formidable = require('formidable');
    var fs = require('fs');
    var strftime = require('strftime');

    var feedback = require(__modules_path + "/feedback");
    var auth = require(__base + '/modules/auth');
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var model = require("./model")();

    var APPNAME = __dirname.split(path.sep).pop();
    var APPURL = "/" + APPNAME;
    var PAGEURL = "/page/" + APPNAME;
    var RESTURL = "/rest/" + APPNAME;
    var CONSTANTS = require(__modules_path + "/SystemConstants");
    var smsModule = require(__modules_path + "/smsModule")();
    var message = require(__modules_path + "/message");

    logger.trace("Initiating APP:[" + APPNAME + "]@" + PAGEURL);

    app.get(PAGEURL, getRegisterHandler);
    /**
     * 获取所有客户GSP类型
     * @param req
     * @param res
     * @param next
     */
    function getRegisterHandler(req, res, next) {
        logger.enter();
        if (req.session && req.session.operator) {
            res.redirect('/');
        }

        dataService.commonData(req, function (data) {
            var customerDB = req.session.customer.customerDB;
            model.getClientGspTypes(customerDB, function(err, gspTypes) {
                if (err) {
                    logger.error(err);
                    res.render('error/wrong', {err: err})
                } else {
                    data['gspTypes'] = gspTypes;
                    logger.ndump('data', data);
                    res.render('customer/center/client/register_new', {data: data});
                }
            });
        });
    }

    //app.post(RESTURL,auth.validateReq,postRigisterHandler);
    function postRigisterHandler(req, res) {
        var dbName = req.session.customer.customerDB;

        var clientData = {
            gspInfo: req.body.gspInfo,
            basicInfo: req.body.basicInfo,
            gspTypes: req.body.gspTypes,
            clientId: req.body.clientId
        };
        clientData.gspInfo.images = req.body.images;
        clientData.gspInfo.stampLink = req.body.stampLink;
        model.userRegister(dbName, clientData, function (error, result) {
            if (error) {
                logger.error(error);
                res.json(new FeedBack(FBCode.DBFAILURE, "注册失败,请重试." + error.code));
            } else {
                res.json(new FeedBack(FBCode.SUCCESS, "注册成功,请等待管理员审核."));
            }
        });
    }

    app.post(RESTURL + '/sendRegisterSMS', postRegisterMobileCaptchaHandler,message.postMsg);
    /**
     * 发送注册短信验证码
     * @param req
     * @param res
     */
    function postRegisterMobileCaptchaHandler(req, res,next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var phoneNumber = req.body.phoneNumber;
        var key = CONSTANTS.registerSMSContent.registerRedisKeyPrefix + phoneNumber;
        logger.dump('当下要接收验证码的手机号码: ' + phoneNumber);

        model.postRegisterMobileCaptcha(customerDB,phoneNumber, key, function(err, result) {
            if (err) {
                logger.error(err);
                res.json(new FeedBack(FBCode.SUCCESS, "短信发送系统出错了,请稍微再试"));
                req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                    "DOC_OTHER", null, null, "短信发送失败"+err);
                logger.ndump("msg", req.session.msg);
                next();
            }
            else {
                logger.dump('注册短信验证码:' + result.smsCode + ' 发送成功');
                res.json(new FeedBack(FBCode.SUCCESS, "注册验证码发送成功!"));
                if(!result.isMainSucc){
                    req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                        "DOC_OTHER", null, null, "首选短信网关发送失败");
                    logger.ndump("msg", req.session.msg);
                    next();
                }
            }
        });
    }


    /**
     * 验证注册信息的手机号码
     * @param phoneNumber 手机号码
     * @param captcha 验证码
     * @return true or false
     *  true: 验证码正确
     *  false: 短信验证码不正确或已过期
     */
    function validateRegisterMobileCaptcha(phoneNumber, captcha, callback) {
        model.getValidateRegisterMobCaptcha(phoneNumber, captcha, function(result) {
                callback(result);
        });
    }

    app.post(RESTURL, auth.validateReq, postSimpleRigisterHandler,message.postMsg);
    /**
     * 商户注册信息提交（精简）
     * @param req
     * @param res
     */
    function postSimpleRigisterHandler(req, res, next) {
        var dbName = req.session.customer.customerDB;
        // 短信验证码检测
        validateRegisterMobileCaptcha(req.body.basicInfo.phoneNumber, req.body.basicInfo.phoneVerify, function (result) {
            if (!result) {
                return res.json(new FeedBack(FBCode.DBFAILURE, "短信验证码有误."));
            }
            var clientData = {};
            clientData.basicInfo = req.body.basicInfo;
            clientData.gspImages = JSON.stringify(req.body.images);

            clientData.gspStampLink = req.body.stampLink;
            model.userSimpleRegister(dbName, clientData, function (error, clientId) {
                if (error) {
                    logger.error(error);
                    res.json(new FeedBack(FBCode.DBFAILURE, "注册失败,请重试." + error.code));
                } else {
                    req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_APPROVE_CLIENT, "DOC_ACCOUNT", clientId, "", "客户"+clientData.basicInfo.name+"提交了注册申请，去处理>");
                    res.json(new FeedBack(FBCode.SUCCESS, "注册成功,请等待管理员审核."));
                    next ();
                }
            });
        });
    }


    app.post(RESTURL + "/upload", registerUploadHandler);
    function registerUploadHandler(req, res) {
        dataService.commonData(req, function (data) {
            var form = new formidable.IncomingForm();   //创建上传表单
            form.encoding = 'utf-8';    //设置编辑
            form.uploadDir = __base + '/static/upload/';   //设置上传目录
            var imgRootUrl = '/static/upload/';
            form.keepExtensions = true;   //保留后缀
            form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
            form.parse(req, function (err, fields, files) {
                if (err) {
                    res.locals.error = err;
                    res.render('error/500', {data: data});
                    return;
                }

                var types = files.fulAvatar.name.split('.');
                var timestamp = new Date();
                var url = strftime(imgRootUrl + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                var filename = strftime(form.uploadDir + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                fs.renameSync(files.fulAvatar.path, filename);
                res.json(new FeedBack(FBCode.SUCCESS, url));
            });
        });
    }

    app.get(APPURL + "/operator/name/:name", getOperatorNameHandler);
    /**
     * 检查操作人是否存在
     * @param req
     * @param res
     */
    function getOperatorNameHandler(req, res) {
        var operatorName = req.param("name");
        var dbName = req.session.customer.customerDB;
        model.getOperatorIsExist(dbName, operatorName, function (error, result) {
            if (error) {
                logger.error(error);
                res.json(new FeedBack(FBCode.DBFAILURE, "验证用户名可用性失败." + error.code));
            } else {
                res.json(new FeedBack(FBCode.SUCCESS, "", result[0]));
            }
        });

    }

    app.get(RESTURL + "/download/contract", downloadContractHandler);
    function downloadContractHandler(req, res) {
        var contractFileName = __base + "/static/contract/shenmu_purchase_contract.pdf";
        res.download(contractFileName);
    }
};