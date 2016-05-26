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


    //轮播图首页
    app.get(PAGEURL, auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_CAROUSEL), getCarouselsHandler);

    function getCarouselsHandler(req, res, next){
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {

            model.getCarouselRetrieveAll(customerDB, data, function(error, result) {
                if(error) {
                    logger.error(error);
                    next();
                }
                else {
                    res.render('customer/portal/manage_advertiseSetting', {data: result});
                }
            });
        });
    }

    //编辑carousel
    app.get(PAGEURL + "/:id", auth.restrict, auth.acl(__FEATUREENUM.FP_MANAGE_CAROUSEL), getCarouselHandler);

    function getCarouselHandler(req, res) {
        var strId = req.params.id;
        var id = Number(strId);
        if (!underscore.isEmpty(strId) && !underscore.isNaN(id)) {
            var customerDB = req.session.customer.customerDB;
            dataService.commonData(req, function (data) {
                model.getCarouselRetrieveOne(customerDB, data, id, function(error, result) {
                    if(error) {
                        logger.error(error);
                        next();
                    }
                    else{
                        res.render('customer/portal/manage_addAdvertisement', {data: result});
                    }
                });
            });
        }
    }

    //添加carousel,保存的action
    app.post(RESTURL , auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_CAROUSEL), auth.validateReq,postCarouselHandler);

    function postCarouselHandler(req, res, next) {
        var customerDB = req.session.customer.customerDB;
        var caData = {
            title: req.body.title,
            imgUrl: req.body.img,
            link: req.body.url,
            beginAt: moment(req.body.startOn).format('YYYY-MM-DD HH:mm'),
            endAt: moment(req.body.endOn).format('YYYY-MM-DD HH:mm'),
            remark: req.body.remark,
            displayText:req.body.displayText
        };

        // 取得最新的orderSeq的最大值
        model.postCarouselInfo(customerDB, caData, function(error, result) {
            if (error) {
                logger.error(error);
                return res.json(new FeedBack(FBCode.DBFAILURE, '添加失败,请重试.', error));
            }
            logger.trace(result);
            res.json(new FeedBack(FBCode.SUCCESS, '保存成功', result));
        });
    }

    //修改carousel,保存的action
    app.put(RESTURL ,auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_CAROUSEL), auth.validateReq,putCarouselHandler);

    function putCarouselHandler(req, res) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var caData = {
            id: Number(req.body.id),
            //orderSeq: Number(req.body.orderSeq),//前台不传递该字段 ,更新的时候
            title: req.body.title,
            imgUrl: req.body.img,
            link: req.body.url,
            beginAt: req.body.startOn,
            endAt: req.body.endOn,
            remark: req.body.remark,
            displayText:req.body.displayText
        };

        model.putCarouselOne(customerDB, caData, function(error, result) {
            if (error) {
                return res.json(new FeedBack(FBCode.DBFAILURE, '更新失败,请重试.', error));
            }
            res.json(new FeedBack(FBCode.SUCCESS, '更新成功', result));
        });
    }

    //删除carousel action
    app.delete(RESTURL + "/:id", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_CAROUSEL), auth.validateReq,deleteCarouselHandler);

    function deleteCarouselHandler(req, res) {
        var customerDB = req.session.customer.customerDB;
        var strId = req.params.id;
        var delId = Number(strId);
        if (!underscore.isEmpty(strId) && !underscore.isNaN(delId)) {

            model.delCarouselOne(customerDB, delId, function(error, result) {
                if (error) {
                    return res.json(new FeedBack(FBCode.DBFAILURE, '删除失败,请重试.', error));
                }
                res.json(new FeedBack(FBCode.SUCCESS, '删除成功', result));
            });
        } else {
            res.json(new FeedBack(FBCode.DBFAILURE, '参数出错'))
        }
    }

    //新增carousel 跳转action
    app.get(PAGEURL + "/item/add", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_CAROUSEL), auth.validateReq,redirectToAddPageHandler);//跳转到增加轮播图页面

    function redirectToAddPageHandler(req,res){
        dataService.commonData(req, function (data) {
            data.carousel = null;
            res.render('customer/portal/manage_addAdvertisement',{data: data });
        });
    }

    //保存carousel的排序 action
    app.post(RESTURL + "/updateOrderSeq",auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_CAROUSEL), auth.validateReq, updateOrderSeqHandler);//更新轮播图的排序状态

    function updateOrderSeqHandler(req,res){
        //传递进来的是个数组,按照顺序将id传递过来了,比如[4,2,3,1] id为4的在第一个 依次走下去
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var ids=req.body.ids;
        var idLength=ids.length;
        for(var i=0;i<idLength;i++){
            var currentId=ids[i];
            currentId=Number(currentId);
            if(Number.isNaN(currentId)){
                //console.log('isNaN..即将返回错误信息')
                res.json(new FeedBack(FBCode.DBFAILURE, '参数出错'));
                return false;
            }
            var currentOrderSeq = i+1;
            model.putCarouselOrderSeq(customerDB, currentOrderSeq, currentId, function(error, result) {
               if(error) {
                   res.json(new FeedBack(FBCode.DBFAILURE, '更新失败,请重试.', error));
                   return false;
               }
            });
        }
        res.json(new FeedBack(FBCode.SUCCESS, '更新成功了', null));
    }

    //carousel 上传图片的action
    app.post(RESTURL + "/upload", auth.restrict,auth.acl(__FEATUREENUM.FP_MANAGE_CAROUSEL), function(req,res){
        dataService.commonData(req, function (data) {
            var form = new formidable.IncomingForm();   //创建上传表单
            form.encoding = 'utf-8';		//设置编辑
            form.uploadDir = __base + '/static/upload/';	 //设置上传目录
            var imgRootUrl = '/static/upload/';
            form.keepExtensions = true;	 //保留后缀
            form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
            form.parse(req, function (err, fields, files) {
                if (err) {
                    res.locals.error = err;
                    res.render('customer/center/customerProduct_add', {data: data});
                    return;
                }
                var types = files.fulAvatar.name.split('.');
                var timestamp = new Date();
                var url = strftime(imgRootUrl + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                var filename = strftime(form.uploadDir + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
                fs.renameSync(files.fulAvatar.path, filename);
                res.render('customer/center/getPicture', {url: url});
            });
        });
    });

};
