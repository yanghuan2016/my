'use strict';

var logger      =   __logService;
var _           =   require('lodash');
var cartModel   =   require(__base + "/apps/cart/model")();
var FBCode      =   require(__modules_path + "/feedback").FBCode;
var Feedback    =   require(__modules_path + "/feedback").FeedBack;


/**
 * 购物车： 删除购物车商品
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.deleteCart = function(req, args, res, next) {
    logger.enter();

    var goodsIds = args.goodsIds.value;
    var customerDB = req.session.customer.customerDB;
    var clientId = req.session.operator.clientId;

    // 删除购物车商品
    cartModel.deleteCartItems(customerDB, goodsIds, clientId, function(err, result) {
        var fb;
        if(err) {
            fb = new Feedback(FBCode.DBFAILURE, err.code);
        }
        else {
            fb = new Feedback(FBCode.SUCCESS, "成功删除商品", {
                cartItemCount: result,
                goodsId: goodsIds
            });
        }
        res.json(fb);
    });
};

/**
 * 购物车：购物列表获取
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.getCartlist = function(req, args, res, next) {
    logger.enter();

    var customerDB = req.session.customer.customerDB;
    var clientId = req.session.operator.clientId;

    cartModel.getCartListInfo(customerDB, clientId, function(err, result) {
        if(err) {
            logger.error(err);
            return res.json(new Feedback(FBCode.DBFAILURE, "获取购物车列表失败."));
        }
        res.json(new Feedback(FBCode.SUCCESS, "获取购物车列表成功.", result));
    });
};

/**
 * 购物车： 修改购物车商品数量
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.patchCart = function(req, args, res, next) {
    logger.enter();

    var params = args.cartItem.value;
    var customerDB = req.session.customer.customerDB;
    var clientId = Number(req.session.operator.clientId);

    var postData = {
        quantity: params.quantity,
        goodsId: params.goodsId,
        remark: params.remark
    };

    cartModel.postCartGoods(customerDB, clientId, postData, function(error, result) {
        if(error) {
            logger.sqlerr(error);
            res.json(new Feedback(FBCode.DBFAILURE, "数据库开小差了呢,重新试试吧."));
        }
        else {
            res.json(new Feedback(FBCode.SUCCESS, "修改商品成功"));
        }
    });
};

/**
 * 购物车： 新增购物车商品
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.postCart = function(req, args, res, next) {
    logger.enter();
    var params = args.cartItem.value;
    var customerDB = req.session.customer.customerDB;
    var clientId = req.session.operator.clientId;

    var postData = {
        quantity: params.quantity,
        goodsId: params.goodsId,
        remark: params.remarks || ""
    };

    cartModel.postCartItems(customerDB, clientId, postData, function(err, result) {
        if(err) {
            logger.error(err);
            switch (err) {
                case 'VERIFAILED':
                    return res.json(new Feedback(FBCode.AUTHFAILURE, '价格信息验证失败，无法添加购物车.'));
                    break;
                case 'OUTOFSCOPE':
                    return res.json(new Feedback(FBCode.DBFAILURE, '存在商品不在您的GSP控制范围内,无法加入购物车'));
                    break;
                case 'LIMITREPE':
                    return res.json(new Feedback(FBCode.DBFAILURE, '商品由于库存限制不允许加入!'));
                    break;
                case 'ADDGOODSNUM':
                    return res.json(new Feedback(FBCode.DBFAILURE, '商品已经存在购物车,试图增加数量时出错.请重试!'));
                    break;
                case 'ADDCARTFAIL':
                    return res.json(new Feedback(FBCode.DBFAILURE, '添加失败'));
                    break;
                case 'FINDITEMFAIL':
                    return res.json(new Feedback(FBCode.SUCCESS, '添加成功,但是查询购物车条数失败.'));
                    break;
                case 'LIMITEDNUM':
                    return res.json(new Feedback(FBCode.DBFAILURE, result.msg, result.fbData));
                    break;
                default:
                    return res.json(new Feedback(FBCode.DBFAILURE, '商品由于库存限制不允许加入!'));
                    break;
            }
        }
        else {
            res.json(new Feedback(FBCode.SUCCESS, '加入购物车成功', {cartItemCount: result.cartItemCount}));
        }
    });
};

