/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports=function(app){

    /*
     * Services
     */
    var logger = __logService;
    var dataService = __dataService;

    /*
     * load 3rd party modules
     */
    var path = require('path');
    var myPath = require(__modules_path + "/mypath");
    var underscore = require("underscore");
    var formidable = require('formidable');
    var strftime = require('strftime');
    var fs = require('fs');
    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var model = require('./model')();
    var moment=require('moment');
    /*
     * init app name etc
     */
    //var APPNAME = __dirname.split(path.sep).pop();
    var APPNAME = myPath.getAppName(__dirname);

    var APPURL = "/" + APPNAME;
    var PAGEURL = "/page/" + APPNAME;
    var RESTURL = "/rest/" + APPNAME;
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);
    /*
     * load module
     */

    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */


    app.get(PAGEURL, auth.restrict, getLicencesHandler);

    function getLicencesHandler(req, res){
        dataService.commonData(req, function(data){
            var customerDB = req.session.customer.customerDB;

            model.getAllLicences(customerDB, data, function(err, result) {
                if(err) {
                    logger.error(err);
                    res.render('error/500');
                }
                else {
                    res.render('customer/portal/manage_licences', {data: result});
                }
            });
        })
    }

    app.post(RESTURL + "/add", auth.restrict, postAddLicencesHandler);
    function postAddLicencesHandler(req, res){
        var customerDB = req.session.customer.customerDB;
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';    //设置编辑
        form.uploadDir = __base + '/static/upload/';   //设置上传目录
        var imgRootUrl = '/static/upload/';
        form.keepExtensions = true;   //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
        form.parse(req, function (err, fields, files) {
            if (err) {
                res.locals.error = err;
                res.json(new FeedBack(FBCode.INVALIDDATA, '数据错误'));
                return;
            }
            var newLicence = {
                licName: fields.licName,
                expireTime: fields.expireTime,
                licType: fields.licType
            };
            if( fields.licType === 'licImg' ){
                var types = files.licImg.name.split('.');
                var timestamp = new Date();
                var url = strftime(imgRootUrl + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                var filename = strftime(form.uploadDir + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                fs.renameSync(files.licImg.path, filename);
                newLicence.licUrl = url;
            } else {
                newLicence.licUrl = fields.licUrl;
            }

            dataService.commonData(req, function (data) {

                model.postAnewLicence(customerDB, newLicence, data, function(err, results) {
                    var feedback;
                    if(err) {
                       feedback = new FeedBack(FBCode.DBFAILURE, {});
                    }
                    else {
                       feedback = new FeedBack(FBCode.SUCCESS, {data: results});
                    }
                    res.json(feedback);
                });
            });
        });
    }

    app.post(RESTURL + "/delete", auth.restrict, postDeleteLicencesHandler);

    function postDeleteLicencesHandler(req, res){
        // 去数据库删除证书
        var customerDB = req.session.customer.customerDB;

        model.delOneLicence(customerDB, req.body.id, function (err, result) {
            if(err) {
                res.json(new FeedBack(FBCode.DBFAILURE, {}));
            }
            else {
                if(results.affectedRows == 1){
                    res.json(new FeedBack(FBCode.SUCCESS, {
                            data: {
                                licData:'deleted'
                            }
                        })
                    );
                }
            }
        });
    }

    app.post(RESTURL + "/edit", auth.restrict, postEditLicencesHandler);

    function postEditLicencesHandler(req, res){
        var customerDB = req.session.customer.customerDB;
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
            var newLicence = {
                id: fields.id,
                licName: fields.licName,
                licType: fields.licType,
                expireTime: fields.expireTime
            };
            if ( fields.licType === 'licImg' ) {
                var types = files.licImg.name.split('.');
                var timestamp = new Date();
                var url = strftime(imgRootUrl + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                var filename = strftime(form.uploadDir + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                fs.renameSync(files.licImg.path, filename);
                newLicence.licUrl = url;
            } else {
                newLicence.licUrl = fields.licUrl;
            }

            dataService.commonData(req, function (data) {
                model.putOneLicence(customerDB, data, newLicence, function(err, results) {
                    var feedback;
                    if(err) {
                        feedback = new FeedBack(FBCode.DBFAILURE, {});
                    }
                    else {
                        feedback = new FeedBack(FBCode.SUCCESS, {data: results});
                    }
                    res.json(feedback);
                });
            });
        });

    }

};
