'use strict';

// global variables:
var logger          =   __logService;
var _               =   require('lodash');
var clientModel     =   require(__base + "/apps/customer/client/model")();
var customerModel   =   require(__base + "/apps/customer/model")();
var registerModel   =   require(__base + "/apps/register/model")();
var FBCode          =   require(__modules_path + "/feedback").FBCode;
var Feedback        =   require(__modules_path + "/feedback").FeedBack;

/**
 * 客户审核：【资料更新查看/已退回资料查看/待审资料查看/已审核资料查看】
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.getClientById = function(req, args, res, next) {
    logger.enter();
    var clientId = Number(args.clientId.value);
    var dbName = req.session.customer.customerDB;
    var data = {};
    clientModel.getClientDetailData(dbName, clientId, data, function(err,data){
        if(err){
            logger.error(err);
            res.json(new Feedback(FBCode.DBFAILURE, '加载异常', {}));
        }else{
            res.json(new Feedback(FBCode.SUCCESS, '加载成功', data));
        }
    });
};

/**
 * 客户审核：【待审、已审、退回 客户列表】获取不同审核状态下的客户列表
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.getClientList = function(req, args, res, next) {
    logger.enter();
    var dbName = req.session.customer.customerDB;
    var keywords = args.keywords.value;
    keywords = keywords==undefined||keywords==null?'':keywords;

    console.log('args: ', args);

    var filter = {
        pageIndex: args.pageIndex.value||1,             // 当前页
        pageSize: args.pageSize.value||10,              // 每页条数
        registerStatus: args.registerStatus.value||"",  // 审核查询状态
        clientArea: args.clientArea.value||"",          // 按地区查询
        enabled: args.enabled.value||"",                // 是否启用
        readOnly: args.readOnly.value||"",              // 是否启购
        keywords: keywords                              // 客户编号或客户名称查询
    };
    var data = {};
    clientModel.getRegisterStatusClientList(dbName, data, filter, function(error, results) {
        if(error) {
            logger.error(error);
            return res.json(new Feedback(FBCode.DBFAILURE, "获取信息异常"));
        }
        data.clientsSumsGroupByStatus = customerModel.getClientsSumByRegisterStatus(results.clientStatusNum);
        res.json(new Feedback(FBCode.SUCCESS, "获取退回客户信息成功", data));
    });
};

exports.patchClientById = function(req, args, res, next) {

};

/**
 * 客户注册：用户注册信息提交
 */
exports.postClient = function(req, args, res, next) {
    logger.enter();
    var dbName = req.session.customer.customerDB;
    // 短信验证码检测
    registerModel.getValidateRegisterMobCaptcha(req.body.basicInfo.phoneNumber, req.body.basicInfo.phoneVerify, function (result) {
        if (!result) {
            return res.json(new Feedback(FBCode.DBFAILURE, "短信验证码有误."));
        }
        var clientData = {};
        clientData.basicInfo = req.body.basicInfo;
        clientData.gspImages = JSON.stringify(req.body.images);

        clientData.gspStampLink = req.body.stampLink;
        registerModel.userSimpleRegister(dbName, clientData, function (error, clientId) {
            if (error) {
                logger.error(error);
                res.json(new Feedback(FBCode.DBFAILURE, "注册失败,请重试." + error.code));
            } else {
                req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_APPROVE_CLIENT, "DOC_ACCOUNT", clientId, "", "客户"+clientData.basicInfo.name+"提交了注册申请，去处理>");
                res.json(new Feedback(FBCode.SUCCESS, "注册成功,请等待管理员审核."));
                next ();
            }
        });
    });
};

/**
 * 客户审核：【已审 -> 修改 -> 更新】更新提交已审核客户详情信息
 * @param req
 * @param args
 * @param res
 * @param next
 */
exports.putClientById = function(req, args, res, next) {
    logger.enter();

    var clientId = Number(args.clientId.value);
    var customerDBName = req.session.customer.customerDB;
    var clientInfo = args.client.value.clientInfo;
    var gspInfo = args.client.value.clientGsp;
    var saleScope = args.client.value.clientSaleScope;
    var gspTypeIds = args.client.value.clientGspTypes;
    var credits = args.client.value.clientCredits;
    var oldCredit = args.client.value.oldCredits;
    var operatorId = req.session.operator.operatorId;

    clientModel.customerUpdateClient(customerDBName, clientInfo, gspInfo, gspTypeIds, clientId, saleScope, credits, oldCredit, operatorId, function(err, clientAffectedRows){
        var fb;
        if (err) {
            if (err.code == "ER_DUP_ENTRY")
                fb = new Feedback(FBCode.DUPDATA, "客户名称或者证照已经存在, 请核对");
            else
                fb = new Feedback(FBCode.DBFAILURE, "客户信息修改失败，" + err.code);
        }
        else {
            fb = new Feedback(FBCode.SUCCESS, "客户信息修改成功", {clientId: clientId});
        }
        res.json(fb);
    });
};

