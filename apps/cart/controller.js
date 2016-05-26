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
 * cart/controller.js
 *
 * --------------------------------------------------------------
 * 2015-09-18	zp-romens@sro-doc-17#17	完成产品页面上购物车增减功能的响应
 *
 */

/*
 * Services
 */
var logger = __logService;
var db = __dbService;
var dataService = __dataService;


/*
 * load 3rd party modules
 */
var path = require('path');
var underscore = require('underscore');
var async = require('async');

/*
 * load project modules
 */
var auth = require(__base + '/modules/auth');
var mypath = require(__modules_path + "/mypath");
var feedback = require(__modules_path + "/feedback");
var FBCode = feedback.FBCode;
var FeedBack = feedback.FeedBack;
/*
 * init app name etc
 */
var APPNAME = mypath.getAppName(__dirname);
var APPURL = "/" + APPNAME;
logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

/*
 * load module
 */
var model = require( __dirname + "/model")();

module.exports = function (app) {
    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */
    app.get(APPURL, auth.restrict, listCartHandler);



    app.post(APPURL + "/goods/add", auth.validateReq, postCartGoodsAddHandler);
    /**
     * 向购物车中增加商品, 使用商品ID和数量, 数量可以为负数.
     * @param req
     * @param res
     */
    function postCartGoodsAddHandler(req, res) {
        logger.enter();

        var customerDB = req.session.customer.customerDB;
        var clientId = Number(req.session.client.id);

        var postData = {
            quantity: req.body.quantity,
            goodsId: req.body.goodsId,
            remark: req.body.remark
        };

        // 添加购物车商品
        model.postCartGoods(customerDB, clientId, postData, function(error, result) {
            if(error) {
                logger.sqlerr(error);
                res.json(new FeedBack(FBCode.DBFAILURE, "数据库开小差了呢,重新试试吧. "));
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS, "修改商品成功"));
            }
        });
    }


    app.post(APPURL + '/remove', auth.validateReq, postRemoveCartItemsHandler);
    /** 删除购物车商品
     * Remove an item from Cart
     * @param req
     * @param res
     */
    function postRemoveCartItemsHandler(req, res) {
        logger.enter();

        var goodsIds = req.body.goodsIds;
        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;

        // 删除购物车商品
        model.deleteCartItems(customerDB, goodsIds, clientId, function(err, result) {
            var fb;
            if(err) {
                fb = new FeedBack(FBCode.DBFAILURE, err.code);
            }
            else {
                fb = new FeedBack(FBCode.SUCCESS, "成功删除商品", {"cartItemCount": result});
            }
            res.json(fb);
        });
    }

    // 此 Handler 待调ing
    app.post(APPURL + '/add', auth.restrict, auth.validateReq, postCartItemAddHandler);
    /**
     * 新增商品到购物车
     * 1. 检查库存数量，如果超过库存且不允许负库存销售，则设置为最大允许数量
     * 2. 如果已经在cart中，则增加计数
     * 3. 否则新增到Cart中
     * 4. 刷新购物车中商品品种数量
     * @param req
     * @param res
     */
    function postCartItemAddHandler(req, res) {
        logger.enter();

        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;

        var postData = {
            quantity: req.body.quantity,
            goodsId: req.body.goodsId,
            remark: req.body.remarks || ""
        };

        model.postCartItems(customerDB, clientId, postData, function(err, result) {
            console.log(err);
            if(err) {
                logger.error(err);
                if('VERIFAILED' == err) {
                    res.json(new FeedBack(FBCode.AUTHFAILURE, '价格信息验证失败，无法添加购物车.'));
                    return;
                }
                else if ('OUTOFSCOPE' == err) {
                    res.json(new FeedBack(FBCode.DBFAILURE, '存在商品不在您的GSP控制范围内,无法加入购物车'));
                    return;
                }
                else if ('LIMITREPE' == err) {
                    res.json(new FeedBack(FBCode.DBFAILURE, '商品由于库存限制不允许加入!'));
                    return;
                }
                else if ('ADDGOODSNUM' == err) {
                    res.json(new FeedBack(FBCode.DBFAILURE, '商品已经存在购物车,试图增加数量时出错.请重试!'));
                    return;
                }
                else if ('ADDCARTFAIL' == err) {
                    res.json(new FeedBack(FBCode.DBFAILURE, '添加失败'));
                    return;
                }
                else if ('FINDITEMFAIL' == err) {
                    res.json(new FeedBack(FBCode.SUCCESS, '添加成功,但是查询购物车条数失败.'));
                    return;
                }
                else if ('LIMITEDNUM' == err) {
                    res.json(new FeedBack(FBCode.DBFAILURE, result.msg, result.fbData));
                    return;
                }
                res.json(new FeedBack(FBCode.DBFAILURE, '商品由于库存限制不允许加入!'));
            }
            else {
                res.json(new FeedBack(FBCode.SUCCESS, '加入购物车成功', {cartItemCount: result.cartItemCount}));
            }
        });
    }


    /**
     * 列出购物车中的商品
     * @param req
     * @param res
     */
    function listCartHandler(req, res, next) {
        logger.enter();
        var customerDB  = req.session.customer.customerDB;
        var clientId    = req.session.operator.clientId;
        var customerId = req.session.customer.customerId;
        var isExpire  = req.session.expire;
        dataService.commonData(req, function(data) {

            model.getCartList(customerDB, data, clientId, customerId, function(err, result) {
                if(err) {
                    logger.error(err);
                    next();
                }
                else {
                    res.render('customer/cart/cart', {data: result.data, tip: result.tip ,isexpire: isExpire});
                }
            });
        });
    }
};
