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
    var underscore = require("underscore");
    var formidable = require('formidable');
    var strftime = require('strftime');
    var fs = require('fs');
    var moment=require('moment');
    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var model = require('./model')();
    var myPath = require(__modules_path + "/mypath");
    /*
     * init app name etc
     */
    //var APPNAME = __dirname.split(path.sep).pop();
    var APPNAME = myPath.getAppName(__dirname);

    var APPURL = "/";
    var PAGEURL = "/page/" + APPNAME;
    var RESTURL = "/rest/" + APPNAME;
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    var clientModel = require(__base + "/apps/customer/client/model")();

    /*
     * load module
     */

    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */
    app.get(PAGEURL , auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_NEWS), getAllNewsHandler);
    /**
     * 新闻列表
     * @param req
     * @param res
     */
    function getAllNewsHandler(req, res){
        var customerDB = req.session.customer.customerDB;
        var paginator=clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            model.getManageNewsLinksAll(customerDB, paginator, function(err, result) {
                if(err) {
                    logger.error(err);
                    return res.render('error/500');
                }
                data.news = result;
                data.paginator = clientModel.restorePurePaginator(paginator);
                res.render('customer/portal/manage_newsList',{data: data});
            });
        });
    }

    app.get(PAGEURL + "/:id", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_NEWS), auth.validateReq, getNewsHandler);
    /**
     * 编辑(查看)新闻
     * @param req
     * @param res
     */
    function getNewsHandler(req, res) {
        var strId = req.params.id;
        var id = Number(strId);
        var customerDB = req.session.customer.customerDB;
        if (!underscore.isEmpty(strId) && !underscore.isNaN(id)) {
            dataService.commonData(req, function (data) {
                model.getNewsLinksOne(customerDB, id, function(err, result) {
                    if(err) {
                        next();
                    }
                    data.news = result[0];
                    res.render('customer/portal/manage_addNews', {data: data});
                });
            });
        } else {
            //没有ID进来则是 在请求新闻列表  页面
            var paginator=clientModel.createPurePaginator(req);

            dataService.commonData(req, function (data) {
                model.getManageNewsLinksAll(customerDB, paginator, function(err, result) {
                    if(err) {
                        logger.error(err);
                        return res.render('error/500');
                    }
                    data.news = result;
                    data.paginator = clientModel.restorePurePaginator(paginator);
                    res.render('customer/portal/manage_newsList',{data: data});
                });
            });
        }
    }

    app.post(RESTURL + "/newsHtmlContent/:id", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_NEWS),  auth.validateReq,getNewsHtmlHandler);
    /**
     * 获取新闻内容
     * @param req
     * @param res
     */
    function getNewsHtmlHandler(req, res) {
        var strId = req.params.id;
        var id = Number(strId);
        var customerDB = req.session.customer.customerDB;
        if (!underscore.isEmpty(strId) && !underscore.isNaN(id)) {
            model.getNewsLinksOne(customerDB, id, function(err, result) {
                if(err) {
                    res.send(new FeedBack(FBCode.DBFAILURE, '获取新闻内容失败', err));
                    next();
                }
                var data = {};
                data.content = result[0].html;
                res.send(new FeedBack(FBCode.SUCCESS, '成功', data));
            });
        }
    }

    app.post(RESTURL , auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_NEWS), auth.validateReq, postNewsHandler);
    /**
     * 保存新闻
     * @param req
     * @param res
     */
    function postNewsHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        //TODO:参数待 类型校验 & 转化.
        var expectNews = {
            newsTitle: req.body.title,
            html: req.body.Content
        };

        model.postNewsLinksOne(customerDB, expectNews, function(err, result) {
            var feed = {};
            if (err) {
                feed = new FeedBack(FBCode.DBFAILURE, "添加失败，请重试", err);
            }else{
                feed = new FeedBack(FBCode.SUCCESS, "添加新闻成功", result);
            }
            res.json(feed);
        });
    }

    app.put(RESTURL , auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_NEWS),  auth.validateReq, putNewsHandler);
    /**
     * 更新新闻
     * @param req
     * @param res
     */
    function putNewsHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        //TODO:参数待 类型校验 & 转化.
        var expectNews = {
            id: req.body.id,
            title: req.body.title,
            html: req.body.Content
        };

        model.putNewsLinksOne(customerDB, expectNews, function(err, result) {
            var feed = {};
            if (err) {
                feed = new FeedBack(FBCode.DBFAILURE, "更新失败，请重试", err);
            }else{
                feed = new FeedBack(FBCode.SUCCESS, "更新新闻成功", result);
            }
            res.json(feed);
        });
    }

    app.delete(RESTURL + "/:id", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_NEWS), auth.validateReq, deleteNewsHandler);
    /**
     * 删除新闻
     * @param req
     * @param res
     */
    function deleteNewsHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var strId = req.params.id;
        var id = Number(strId);
        if (!underscore.isEmpty(strId) && !underscore.isNaN(id)) {
            //如果有ID传进来就调用删除信息的API,虽然是删除请求,但是执行的是update操作.将删除字段的值改为true

            model.delNewsLinksOne(customerDB, id, function(err, result) {
                var feed = {};
                if (err) {
                    feed = new FeedBack(FBCode.DBFAILURE, "删除失败，请重试", err);
                }else{
                    feed = new FeedBack(FBCode.SUCCESS, "删除新闻成功", result);
                }
                res.json(feed);
            });
        } else {
            res.json(new FeedBack(FBCode.DBFAILURE, '参数出错', ''));
        }
    }

    app.get(PAGEURL + "/item/add", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_NEWS), auth.validateReq, addNewsHandler);
    /**
     * 跳转到新增新闻列表
     * @param req
     * @param res
     */
    function addNewsHandler(req,res){
        //返回假数据
        dataService.commonData(req, function (data) {
            data.news = null;
            res.render('customer/portal/manage_addNews',{data: data});
        });
    }

    //以下的controller游客可以进入

    app.get("/news/:id",auth.validateReq,renderNewsHandler);
    /**
     * 获取新闻内容
     * @param req
     * @param res
     */
    function renderNewsHandler(req,res){
        var strId = req.params.id;
        var id = Number(strId);
        var customerDB = req.session.customer.customerDB;
        if (!underscore.isEmpty(strId) && !underscore.isNaN(id)) {

           dataService.commonData(req,function(data){
               model.getNewsLinksOne(customerDB, id, function (err, result) {
                   if(err) {
                       res.send(new FeedBack(FBCode.DBFAILURE, '获取新闻内容失败', err));
                       next();
                   }
                   data.news={
                       id: id,
                       title: result[0].newsTitle,
                       content:result[0].html
                   };
                   res.render('customer/news/news', {data:data});

               });

           })
        }

    }

    app.get(APPURL+"newsList",auth.validateReq,displayNewsListHandler);
    /**
     * 显示新闻列表
     * @param req
     * @param res
     */
    function displayNewsListHandler(req,res){
        var customerDB = req.session.customer.customerDB;
        var paginator=clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {

            model.getNewsLinksAll(customerDB, paginator, function (error, result) {
                if(error) {
                    logger.error(error);
                    return res.render('error/500');
                }
                data.news = result;
                data.paginator = clientModel.restorePurePaginator(paginator);
                res.render('customer/news/newsList',{data: data});
            });
        });
    }


    app.get("/staticcontent/:id",displayLinkContent);
    /**
     * 获取链接列表数据
     * @param req
     * @param res
     */
    function displayLinkContent(req, res) {
        var customerDB = req.session.customer.customerDB;
        var id=req.params.id;
        dataService.commonData(req, function (data) {

           model.getListLinksData(customerDB, data, id, function(err, result) {
                if(err) {
                    logger.error(err);
                    res.render('error/500');
                }
                else {
                    res.render('customer/news/footerContent',{data: result});
                }
           });
        });
    }


};
