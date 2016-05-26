'use strict';

var logger      =   __logService;
var _           =   require('lodash');
var cartModel   =   require(__base + "/apps/cart/model")();
var FBCode      =   require(__modules_path + "/feedback").FBCode;
var Feedback    =   require(__modules_path + "/feedback").FeedBack;


/**
 * 购物车地址：通过地址ID删除地址信息详情
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.deleteAddressById = function(req, args, res, next) {
    logger.enter();

    var customerDB = req.session.customer.customerDB;
    var addressId = args.addressId.value;

    cartModel.delAddressItem(customerDB, addressId, function(err, result) {
        if(err) {
            logger.error(err);
            return res.json(new Feedback(FBCode.DBFAILURE, '删除购物车地址失败'));
        }
        res.json(new Feedback(FBCode.SUCCESS, '删除购物车地址成功', {}));
    });
};

/**
 * 购物车地址：地址列表获取
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.getAddressList = function(req, args, res, next) {
    logger.enter();
    var customerDB = req.session.customer.customerDB;
    var clientId = req.session.operator.clientId;

    cartModel.getCartAddrList(customerDB, clientId, function(err, result) {
        if(err) {
            logger.error(err);
            return res.json(new Feedback(FBCode.DBFAILURE, "获取购物车地址失败."));
        }
        res.json(new Feedback(FBCode.SUCCESS, "获取购物车地址成功.", {cart: result}));
    });
};

/**
 * 购物车地址：通过地址ID获取地址信息详情
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.getAddressById = function(req, args, res, next) {
    logger.enter();
    var customerDB = req.session.customer.customerDB;
    var addressId = args.addressId.value;

    cartModel.getAddressDetail(customerDB, addressId, function(err, addrData) {
        if(err) {
            logger.error(err);
            return res.json(new Feedback(FBCode.DBFAILURE, '获取购物车地址详情失败'));
        }
        res.json(new Feedback(FBCode.SUCCESS, '获取购物车地址详情成功', {address: addrData}));
    });
};

/**
 * 购物车地址：增加新地址
 * @param req
 * @param res
 * @param next
 */
exports.postAddress = function(req, args, res, next) {
    logger.enter();

    var params = args.address.value;
    var customerDB = req.session.customer.customerDB;
    var clientId = req.session.operator.clientId;

    var postData = {
        clientId: clientId,
        receiver: params.receiver,
        telNum: params.telNum || '',
        mobileNum: params.mobileNum || '',
        postCode: params.postCode || '',
        provinceFirstStage: params.provinceFirstStage,
        citySecondStage: params.citySecondStage,
        countiesThirdStage: params.countiesThirdStage,
        detailAddress: params.detailAddress,
        remark: params.remark || ""
    };

    cartModel.addNewAddressItem(customerDB, postData, function(err, result) {
        if(err) {
            logger.error(err);
            return res.json(new Feedback(FBCode.DBFAILURE, '购物车地址添加失败'));
        }
        res.json(new Feedback(FBCode.SUCCESS, '购物车地址添加成功', {address: result}));
    });
};

/**
 * 购物车地址：通过地址ID修改地址信息详情
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.putAddressById = function(req, args, res, next) {
    logger.enter();

    var customerDB = req.session.customer.customerDB;
    var addressId = args.addressId.value;
    var addrInfo = args.address.value;
    var postData = {
        receiver: addrInfo.receiver,
        telNum: addrInfo.telNum || '',
        mobileNum: addrInfo.mobileNum || '',
        postCode: addrInfo.postCode || '',
        provinceFirstStage: addrInfo.provinceFirstStage,
        citySecondStage: addrInfo.citySecondStage,
        countiesThirdStage: addrInfo.countiesThirdStage,
        detailAddress: addrInfo.detailAddress,
        remark: addrInfo.remark || ""
    };

    cartModel.putAddressDetail(customerDB, addressId, postData, function(err, addrData) {
        if(err) {
            logger.error(err);
            return res.json(new Feedback(FBCode.DBFAILURE, '修改购物车地址详情失败'));
        }
        res.json(new Feedback(FBCode.SUCCESS, '修改购物车地址详情成功', {address: addrData}));
    });
};

