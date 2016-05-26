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

module.exports=function(app) {

    /*
     * Services
     */
    var logger = __logService;
    var dataService = __dataService;

    /*
     * load 3rd party modules
     */
    var path = require('path');
    var underscore = require("underscore");
    var _ = require("lodash");
    var formidable = require('formidable');
    var strftime = require('strftime');
    var sprintf = require("sprintf-js").sprintf;
    var fs = require('fs');
    var moment = require('moment');

    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var model = require('./model')();
    var message = require(__modules_path + "/message");
    /*
     * init app name etc
     */
    var APPNAME = __dirname.split(path.sep).pop();
    var APPURL = "/";
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load module
     */
    
    app.post('/token', function (req, res, next) {
        var token = req.body.token;
        var sessionKey = 'sess:' + req.sessionID;
        res.json({
            token: token,
            ttl: __tokenTTL
        });
        __redisClient.expire(sessionKey, __tokenTTL);
        logger.debug('set redis ttl, key:' + sessionKey + ' ttl:' + __tokenTTL);
    });
    
    // 用来供手机端测试是否登陆成功
    app.post('/testlogin', function (req, res) {
        if (req.session.operator) {
            res.json(new FeedBack(FBCode.SUCCESS, '登陆成功', {hello:'SB'}));
            logger.debug(req.sessionID);
            return;
        }
        res.json(new FeedBack(FBCode.LOGINFAILURE, '失败', {hello: "SB"}));
    });
    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */

    app.post(APPURL + "forgot_pwd/verifyMobile",auth.validateReq, postPwdForgotVerifyMobileHandler,message.postMsg);
    /**
     * 忘记密码提交手机验证
     * @param req
     * @param res
     */
    function postPwdForgotVerifyMobileHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var data = req.body;
        var fb;
        model.getVerifyMobileResult(customerDB,data,function(err,result){
            if(err){
                fb = new FeedBack(FBCode.DBFAILURE, "系统数据库错误"+err.code );
                res.json(fb);
            }else{
                if(underscore.isEmpty(result)){
                    fb = new FeedBack(FBCode.INVALIDDATA, "账号与预留手机号不相符，请重新输入");
                    res.json(fb);
                }else{
                    logger.debug("send sms msg");
                    var mobileNum = data.mobileNum;
                    var newPwd = result;
                    model.sendMobileMSG(customerDB,newPwd,mobileNum,function(err,results){
                        fb = new FeedBack(FBCode.SUCCESS, "客户信息验证通过");
                        res.json(fb);
                        if (err) {
                            logger.error(err);
                            req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                                "DOC_OTHER", null, null, "短信发送失败"+err);
                            logger.ndump("msg", req.session.msg);
                            next();
                        } else {
                            logger.debug("sms send result=" + results);
                            if(!results.isMainSucc){
                                req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                                    "DOC_OTHER", null, null, "首选短信网关发送失败");
                                logger.ndump("msg", req.session.msg);
                                next();
                            }
                        }

                    });
                }
            }

        });
    }

    app.post(APPURL + 'expireLicense' ,postExpireLicenseHandler,message.postMsg);
    /**
     * 证照预警
     * @type {{}}
     */
    function postExpireLicenseHandler(req,res,next){
        var data = {};
        // 判断证照是否提示过预警
        if(req.session.ExpireLicensetip === false){
            logger.ndump("req.session", req.session);
            req.session.ExpireLicensetip = false;
            data.neddPop=false;
            return res.json(data);
        }
        if(typeof (req.session.operator) === 'undefined') {
            req.session.ExpireLicensetip = false;
            data.neddPop=false;
            return res.json(data);
        }


        var customerid = req.session.customer.customerId;
        var clientid = req.session.operator.clientId;
        model.getExprieLiceseData(req,customerid,clientid,data,function(err,data){
            if (err) {
                logger.error(err);
                req.session.ExpireLicensetip = false;
                data.neddPop=false;
                return res.json(data);
            }else{
                res.json(data);
                //if(data.needPop){
                //    req.session.msg  = message.makeMsg(clientid,null,__FEATUREENUM.FP_APPROVE_CLIENT,
                //        "DOC_ACCOUNT", clientid, "", req.session.operator.clientName+"的（"+data.expireLicense.slice(0,-1)+"）即将过期，查看详情>");
                //    next();
                //}
            }
        });
    }



    app.get(APPURL + 'closure', getClosureHandler);
    /**
     *  请求前台不变数据
     * @param req
     * @param res
     */
    function getClosureHandler(req, res){
        var data = {
            __verifyShipNum: __verifyShipNum
        };
        res.json(new FeedBack(FBCode.SUCCESS, "", data));
    }

    app.post(APPURL + "upload", postUploadFileHandler);
    /**
     * 文件上传
     * @param req
     * @param res
     */
    function postUploadFileHandler(req, res){
        logger.enter();
        var form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.uploadDir = __base + '/static/upload/';
        var imgRootUrl = '/static/upload/';
        form.keepExtensions = true;
        form.maxFieldsSize = 2 * 1024 * 1024;
        form.parse(req, function (err, fields, files) {
            if (err) {
                return;
            }
            var urlArr = [];
            for (var i in files){
                if (files[i].size == 0){
                    fs.unlinkSync(files[i].path);
                }else{
                    var types = files[i].name.split(".");
                    var timestamp = new Date();
                    var url = Math.random() + '.' + types[1];
                    var filename = form.uploadDir + url;
                    fs.renameSync(files[i].path, filename);
                    urlArr.push(imgRootUrl+url);
                }
            }
            var status = "";
            if(url.length == 0){
                status = "上传失败";
            }else{
                status = "上传成功"
            }
            res.render('customer/center/getPicture', {url: urlArr,status : status});
        });
    }

    app.get("/", getIndexHandler);

    function getIndexHandler(req, res, next) {
        switch(__mode){
            case "B2B": getB2BIndexHandler(req,res,next);
                break;
            case "EDI": getEDIIndexHandler(req,res,next);
                break;
        }
    }

    /**
     * react跳转询价报价移动页面
     */
    function getEDIIndexHandler(req, res, next){
        res.redirect('static/react/index.html')
    }

    /**
     * getIndexHandler 显示主页
     *      handler for HTTP GET index
     * @param req
     * @param res
     * @param next
     */
    function getB2BIndexHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var clientId = undefined;
        var operatorType = undefined;
        //首页橱窗商品价格  游客和登录用户应该显示不一样的价格
        if (req.session && req.session.operator) {
            operatorType = req.session.operator.operatorType;
            clientId = (operatorType =="CUSTOMER")?undefined:req.session.operator.clientId;
        }
        dataService.commonData(req,function(data){
            //logger.ndump('data', data);
            data.paginator = {};
            model.retrievePortalData(customerDB, data,clientId, function(error, data) {
                if (error) {
                    logger.error();
                    next();
                } else {
                    res.render('index', { data: data });
                }
            });
        });
    }

    app.get(APPURL + "login", getLoginHandler);
    /**
     * getLoginHandler sm用户登录
     *      handler for HTTP GET login
     * @param req
     * @param res
     */
    function getLoginHandler(req, res) {
        logger.enter();

        var nextTo = req.param('nextTo');
        logger.ndump("nextTo", nextTo);
        if (!nextTo)
            nextTo = APPURL;

        nextTo = encodeURIComponent(nextTo);

        dataService.commonData(req, function (data) {
            data = underscore.extend(data, {passHolder: "", nextTo: nextTo});
            data['paginator'] = {};
            res.render("sm_login", {data: data});
        });
    }

    app.get(APPURL + "login_sub_item", getLoginSubHandler);
    /**
     * getLoginHandler
     *      handler for HTTP GET login
     * @param req
     * @param res
     */
    function getLoginSubHandler(req, res) {
        logger.enter();

        var nextTo = req.param('nextTo');
        logger.ndump("nextTo", nextTo);
        if (!nextTo)
            nextTo = APPURL;

        nextTo = encodeURIComponent(nextTo);

        dataService.commonData(req, function (data) {
            data = underscore.extend(data, {passHolder: "", nextTo: nextTo});
            data['paginator'] = {};
            res.render("sm_login_sub", {data: data});
        });
    }

    app.post(APPURL + "login", auth.validateReq, postLoginHandler);
    app.post(APPURL + "loginMobile",postLoginHandler);
    /**
     * postLoginHandler
     *      handler for HTTP POST login
     * @param req
     * @param res
     */
    function postLoginHandler(req, res){
        logger.enter();
        var operatorName = req.body.username;
        var password = req.body.password;
        var nextTo = req.body.nextTo;
        var isTokenAuthentication = req.body.tokenAuthentication;
        if (underscore.isEmpty(nextTo))
            nextTo = "";

        logger.ndump("nextTo", nextTo);
        logger.ndump("req.ipv4", req.ipv4);

        password = new Buffer(password,'base64').toString();
        var customerDB = req.session.customer.customerDB;

        model.operatorLogin(__cloudDBName, customerDB, operatorName, password, req.ipv4, function(err, data) {
            switch(err) {
                case FBCode.SUCCESS:
                    if (data && data.operatorType==='CUSTOMER'){
                        nextTo = "/customer";
                    }
                    req.session.operator = data;
                    req.session.ExpireLicensetip = true;

                    /**
                     * 设置该客户的功能点
                     */
                    if (!underscore.isEmpty(req.session.operator.operatorRoles)) {
                        logger.ndump("operatorRoles", req.session.operator.operatorRoles);
                        req.session.operator.operatorRoles = JSON.parse(req.session.operator.operatorRoles);

                    }
                    // 添加登录日志
                    var logContent = {};
                    logContent.operatorId = data.operatorId;
                    logContent.ipAddr = req.ipv4;
                    logContent.actionType = 'LOGINOUT';
                    logContent.entityId = '';
                    delete req.session.operator['password'];
                    logContent.log = {
                        actionFlag: "LOGIN",
                        customer: req.session.customer,
                        operator: req.session.operator,
                        client: req.session.client
                    };
                    model.addOperatorLog(customerDB, logContent, function(err, results){
                        if(err){
                            logger.error(err);
                        }

                        res.header("access-token", req.cookies['connect.sid']);
                        var feedbackData = {
                            nextTo: nextTo,
                            token: req.cookies['connect.sid']
                        };

                        res.json(new FeedBack(FBCode.SUCCESS, "登录成功", feedbackData));
                        // 判断是不是用token登录的
                        if  (isTokenAuthentication === 'true') {
                            var sessionKey = 'sess:' + req.sessionID;
                            __redisClient.expire(sessionKey, __tokenTTL);
                            logger.debug('set redis ttl, key:' + sessionKey + ' ttl:' + __tokenTTL);
                            feedbackData.ttl = __tokenTTL;
                        }
                    });
                    return ;
                case FBCode.DBFAILURE:
                    return res.json(new FeedBack(FBCode.DBFAILURE, "服务器开小差了，请稍后再试."));
                case FBCode.LOGINFAILURE:
                    if(data){
                        return res.json(new FeedBack(FBCode.LOGINFAILURE,data));
                    }else{
                        return res.json(new FeedBack(FBCode.LOGINFAILURE,"该账户名与密码不匹配,请确认"))
                    }

                case FBCode.CLIENTDISABLED:
                    return res.json(new FeedBack(FBCode.CLIENTDISABLED, "客户被禁用了"));
                case FBCode.MAXPASSWDFAIL:
                    return res.json(new FeedBack(FBCode.MAXPASSWDFAIL, "连续" + __securityConfig.maxLoginFailCount + "次密码错误, 该账号被锁定，请" + Math.floor((data+59)/60) + "分钟后再登录!"));
                default:
                    return res.json(new FeedBack(err, "数据操作出现错误，请稍后重试"));
            }
        });
    }

    app.post(APPURL + "validateLogIn",postValidateLogInHandler);
    /**
     * token方式登录的验证
     * @param req
     * @param res
     * @returns {*}
     */
    function postValidateLogInHandler(req, res) {
        logger.enter();
        var token = req.body.token;
        var logintoken = req.session.logintoken;
        if (token == logintoken) {
            return res.json(new FeedBack(FBCode.SUCCESS));
        } else {
            return res.json(new FeedBack(FBCode.LOGINFAILURE));
        }
    }

    app.get(APPURL + "logout", getLogoutHandler);
    /**
     * getLogoutHandler 登出
     *      handler for HTTP GET logout
     * @param req
     * @param res
     */
    function getLogoutHandler(req, res) {
        logger.enter();

        var customerDB = req.session.customer.customerDB;
        if(underscore.isUndefined(req.session.operator)){
            res.redirect(APPURL);
        }else{
            // 添加注销日志
            var logContent = {};
            logContent.operatorId = req.session.operator.operatorId;
            logContent.ipAddr = req.ipv4;
            logContent.actionType = 'LOGINOUT';
            logContent.entityId = '';
            delete req.session.operator['password'];
            logContent.log = {
                actionFlag: "LOGOUT",
                customer: req.session.customer,
                operator: req.session.operator,
                client: req.session.client
            };
            model.addOperatorLog(customerDB, logContent, function(err, results){
                if(err){
                    logger.error(err);
                }
                /**
                 * remove the roles
                 */
                req.session.destroy();
                res.redirect(APPURL);
            });
        }

    }

    app.get(APPURL + "no_permission", getPermissionDeniedHandler);
    /**
     * 跳转到没有权限页面
     * @param req
     * @param res
     */
    function getPermissionDeniedHandler(req, res) {
        logger.enter();
        res.render('permissionDenied');

    }

    app.get(APPURL + "building", getBuildingHandler);
    /**
     * 跳转到正在建设中页面
     * @param req
     * @param res
     */
    function getBuildingHandler(req, res) {
        logger.enter();
        res.render('error/building', {data: {}});
    }

    app.get(APPURL + "forgot_pwd", getPwdForgotHandler);
    /**
     * 忘记密码页面
     * @param req
     * @param res
     */
    function getPwdForgotHandler(req, res) {
        logger.enter();
        dataService.clearCommonData(req);
        dataService.commonData(req,function(data){
            res.render('forgetPwdInputAccount',{data: data});
        });
    }

    app.get(APPURL + "forgot_pwd/verifyMobile", getPwdForgotVerifyMobileHandler);
    /**
     * 忘记密码验证手机号页面
     * @param req
     * @param res
     */
    function getPwdForgotVerifyMobileHandler(req, res) {
        logger.enter();
        dataService.clearCommonData(req);
        res.render('forgetPwdVerifyMobile',{data: {}});
    }

    app.get(APPURL + "forgot_pwd/verifySuccess", getPwdForgotVerifySuccessHandler);
    /**
     * 忘记密码验证通过
     * @param req
     * @param res
     */
    function getPwdForgotVerifySuccessHandler(req, res) {
        logger.enter();
        dataService.clearCommonData(req);
        dataService.commonData(req, function (data) {
            res.render('forgetPwdAffirmChangePwd',{data: data});
        });
    }

    app.get(APPURL+"aboutUs",getAboutUsHandler);
    /**
     * 关于我们页面
     * @param req
     * @param res
     */
    function getAboutUsHandler(req,res){
        logger.enter();
        dataService.commonData(req,function(data){
            logger.ndump('data', data);
            data.paginator = {};
            res.render('customer/aboutUs',{data:data});
        });
    }


};