// global variables:
var logger = __logService;
var dataService = __dataService;

// third modules:
var path = require("path");
var _ = require('lodash');

// scc modules:
var auth            =   require(__modules_path + '/auth');
var sccPath         =   require(__modules_path + '/mypath');
var clientModel     =   require(__base + "/apps/customer/client/model")();
var customerModel   =   require(__base + "/apps/customer/model")();
var registerModel   =   require(__base + "/apps/register/model")();
var cartModel       =   require(__base + "/apps/cart/model")();

// initialize
var clientPath = "/" + sccPath.getAppName(__dirname);

var FBCode          =   require(__modules_path + "/feedback").FBCode;
var Feedback        =   require(__modules_path + "/feedback").FeedBack;
var message         =   require(__modules_path + "/message");
var smsModule       =   require(__modules_path + "/smsModule")();
var CONSTANTS       =   require(__modules_path + "/SystemConstants");

module.exports = function (app) {

    /**
     * 客户审核：【已开通 -> 修改 -> 更新】更新提交已审核客户详情信息_
     */
    app.put(clientPath + "/:clientId", postClientUpdateHandler);
    function postClientUpdateHandler(req, res){
        logger.enter();
        var clientId = Number(req.param("clientId"));
        var customerDBName = req.session.customer.customerDB;

        var clientInfo = req.body.clientInfo;
        var gspInfo = req.body.clientGsp;
        var saleScope = req.body.clientSaleScope;
        var gspTypeIds = req.body.clientGspTypes;
        var credits = req.body.clientCredits;
        var oldCredit = req.body.oldCredits;
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
                fb = new Feedback(FBCode.SUCCESS, "客户信息修改成功", clientId);
            }
            res.json(fb);
        });
    }

    /**
     * 客户审核：【已开通 -> 禁用启用/禁购启购】客户权限状态设置
     */
    app.post(clientPath + "/status/update", postClientStatusUpdateHandler, message.postClinetsMsg);
    function postClientStatusUpdateHandler(req, res, next){
        logger.enter();
        var feedback = {
            status: FBCode.INVALIDACTION,
            msg: '',
            data: {}
        };
        var bodyData = req.body;
        var clientIds = req.body.clientIds;
        var statusName = req.body.statusName;
        var status = req.body.status;
        logger.debug(JSON.stringify(req.body));
        if(_.isEmpty(clientIds)){
            feedback.msg="您没有选中任何客户";
            res.json(feedback);
            return;
        }
        var updateClientIds = [];
        for(var i in clientIds){ updateClientIds.push(Number(clientIds[i]));}
        var customerDB = req.session.customer.customerDB;

        clientModel.putClientStatus(customerDB, bodyData, updateClientIds, function(affectedRows) {
            if(affectedRows){
                feedback.status = FBCode.SUCCESS;
                feedback.msg = "成功";
            }
            res.json(feedback);
            if(statusName == "ReadOnly" && status == "ON"){
                req.session.msg = message.makeMsg(clientIds,null,null, "DOC_ACCOUNT", null, "", "您的帐号已被禁购，请联系我们（客服电话:40002125441）重新启购后方可购买商品");
                next();
            }
        });

    }

    /**
     * 客户审核：【待审核 -> 审核 -> 通过】审核通过提交信息
     */
    app.post(clientPath + "/review/:clientId", postClientsReviewHandler,message.postMsg);
    function postClientsReviewHandler(req, res, next) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var clientId = Number(req.param('clientId'));

        var clientInfo = req.body.clientInfo;
        clientInfo.enabled = 'ENABLED';
        clientInfo.registerStatus = 'APPROVED';
        var loginAccount = clientInfo.clientCode;
        var phoneNumber = clientInfo.mobile;
        var stampLink = clientInfo.stampLink;

        var gspInfo = req.body.clientGsp;

        var saleScope = req.body.clientSaleScope;
        var approveReason = req.body.approveReason || '';
        var gspTypes= req.body.clientCspTypes;
        var credits = req.body.clientCredits;
        var status = req.body.status;

        clientModel.customerReviewClient(dbName, stampLink, gspTypes, credits, clientInfo, gspInfo, clientId, saleScope, function(err, result) {
            if (err) {
                if (err.code == "ER_DUP_ENTRY") {
                    return res.json(new Feedback(FBCode.DUPDATA, "客户名称或者证照已经存在, 请核对"));
                } else {
                    return res.json(new Feedback(FBCode.DBFAILURE, "客户信息修改失败，", err.code));
                }
            } else {
                if (result.affectedRows != '1') {
                    return res.json(new Feedback(FBCode.DBFAILURE, "审核通过失败,请重试."));
                }
                //将checkComments存到Client
                clientModel.putCheckComments(dbName, approveReason, clientId, function(err, result){
                    if (err) {
                        logger.error(error);
                        return res.json(new Feedback(FBCode.DBFAILURE, "保存审核意见失败" + error.code));
                    }
                    if (result == "1") {
                        //send SMS to user
                        var initialSMSContent;
                        if (status == "CREATED") {
                            initialSMSContent = CONSTANTS.CheckClientResult.ApprovedSMS;
                        }
                        else if (status == "UPDATED") {
                            initialSMSContent = CONSTANTS.CheckClientResult.UpdatedToApprovedSMS;
                        }
                        var smsContent = "";
                        logger.ndump('approveReason ', approveReason);

                        var temp = approveReason ? "，备注：" + approveReason : "";
                        initialSMSContent.replace('account', loginAccount).replace('reasonContent', temp);

                        logger.ndump('smsContent ', smsContent);
                        smsModule.sendClientSMS(dbName,phoneNumber, smsContent, function (err,feedback) {
                            if (err) {
                                logger.error(err);
                                res.json(new Feedback(FBCode.SUCCESS, "审核成功,短信发送系统出错了,用户可能不会收到短信提示!"));
                                req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                                    "DOC_OTHER", null, null, "短信发送失败"+err);
                                logger.ndump("msg", req.session.msg);
                                next();
                            }
                            else {
                                res.json(new Feedback(FBCode.SUCCESS, "审核成功,短信发送成功!"));
                                if(!feedback.isMainSucc){
                                    req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                                        "DOC_OTHER", null, null, "首选短信网关发送失败");
                                    logger.ndump("msg", req.session.msg);
                                    next();
                                }
                            }
                        });
                    }

                });

            }
        });
    }

    /**
     * 客户审核：【待审核 -> 审核 -> 退回】审核退回
     */
    app.post(clientPath + "/reject", postRejectClientHandler,message.postMsg);
    function postRejectClientHandler(req, res, next) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var clientId = Number(req.body.clientId);
        var phoneNumber=req.body.phoneNumber;
        var rejectReason=req.body.rejectReson;
        var loginAccount=req.body.loginAccount;
        var clientStatus=req.body.clientStatus;
        clientModel.putClientApplyReject(dbName, clientId, rejectReason, clientStatus, function(err,results){
            if(results=="1"){
                //should send SMS to user
                var initialRejectContent;
                if(clientStatus=="CREATED"){
                    initialRejectContent=CONSTANTS.CheckClientResult.RejectedSMS;
                }else if(clientStatus=="UPDATED"){
                    initialRejectContent=CONSTANTS.CheckClientResult.UpdatedToApproved_R_SMS;
                }
                var contentSms=initialRejectContent.replace('account',loginAccount).replace('reasonContent',rejectReason);
                logger.ndump("contentSms==> ", contentSms);
                smsModule.sendClientSMS(dbName,phoneNumber, contentSms, function(err,feedback){
                    if(err){
                        logger.error(err);
                        res.json(new Feedback(FBCode.SUCCESS, "退回成功,短信发送系统出错了,用户可能不会收到短信提示!"));
                        req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                            "DOC_OTHER", null, null, "短信发送失败"+err);
                        logger.ndump("msg", req.session.msg);
                        next();
                    }
                    else{
                        res.json(new Feedback(FBCode.SUCCESS, "退回成功,短信发送成功!"));
                        if(!feedback.isMainSucc){
                            req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                                "DOC_OTHER", null, null, "首选短信网关发送失败");
                            logger.ndump("msg", req.session.msg);
                            next();
                        }
                    }
                });
            }else{
                res.json(new Feedback(FBCode.DBFAILURE, "更改数据失败,错误码" + error.code));
            }
        });
    }

    /**
     * 客户审核：【待审、已审、退回 客户列表】获取不同审核状态下的客户列表_
     */
    app.get(clientPath, getClientListHandler);
    function getClientListHandler(req, res, next) {
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var keywords = req.query.keywords;
        keywords = keywords==undefined||keywords==null?'':keywords;

        var filter = {
             pageIndex: req.query.pageIndex||1,                          // 当前页
             pageSize: req.query.pageSize||10,                      // 每页条数
             deviceType: req.query.deviceType||"",                  // 设备类型
             registerStatus: req.query.registerStatus||"",          // 审核查询状态
             clientArea: req.query.clientArea||"",                  // 按地区查询
             enabled: req.query.enabled||"",                        // 是否启用
             readOnly: req.query.readOnly||"",                      // 是否启购
             keywords: keywords                                     // 客户编号或客户名称查询
        };

        dataService.commonData(req, function (data) {
            clientModel.getRegisterStatusClients(dbName, data, filter, function(error, results) {
                if(error) {
                    logger.error(error);
                    res.json(new Feedback(FBCode.DBFAILURE, "获取信息异常"));
                }
                else {
                    data.clientsSumsGroupByStatus = customerModel.getClientsSumByRegisterStatus(results.clientStatusNum);
                    res.json(new Feedback(FBCode.SUCCESS, "获取退回客户信息成功", data));
                }
            });
        });
    }

    /**
     * 客户审核：【资料更新查看/已退回资料查看/待审资料查看/已审核资料查看】 审核客户管理_
     */
    app.get(clientPath + "/:clientId", function(req, res, next) {
        logger.enter();
        var clientId = Number(req.param('clientId'));
        var dbName = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            clientModel.getClientDetailData(dbName, clientId, data, function(err,data){
                if(err){
                    logger.error(err);
                    res.json(new Feedback(FBCode.DBFAILURE, '加载异常', {}));
                }else{
                    res.json(new Feedback(FBCode.SUCCESS, '加载成功', data));
                }
            });
        });
    });


    /**
     * 注册：检测操作员名称是否存在
     */
    app.get(clientPath + "/operator/:name", getOperatorNameHandler);
    function getOperatorNameHandler(req, res) {
        logger.enter();
        var operatorName = req.param("name");
        var dbName = req.session.customer.customerDB;
        registerModel.getOperatorIsExist(dbName, operatorName, function (error, result) {
            if (error) {
                logger.error(error);
                res.json(new Feedback(FBCode.DBFAILURE, "验证用户名可用性失败." + error.code));
            } else {
                res.json(new Feedback(FBCode.SUCCESS, "", result[0]));
            }
        });
    }

    /**
     * 注册：发送注册短信验证码
     */
    app.post(clientPath + '/smsCaptcha', postRegisterMobileCaptchaHandler, message.postMsg);
    function postRegisterMobileCaptchaHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var phoneNumber = req.body.phoneNumber;
        var key = CONSTANTS.registerSMSContent.registerRedisKeyPrefix + phoneNumber;
        logger.dump('当下要接收验证码的手机号码: ' + phoneNumber);

        registerModel.postRegisterMobileCaptcha(customerDB,phoneNumber, key, function(err, result) {
            if (err) {
                logger.error(err);
                res.json(new Feedback(FBCode.SUCCESS, "短信发送系统出错了,请稍后再试"));
                req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_MANAGE_SMSGW,
                    "DOC_OTHER", null, null, "短信发送失败"+err);
                logger.ndump("msg", req.session.msg);
                next();
            }
            else {
                logger.dump('注册短信验证码:' + result.smsCode + ' 发送成功');
                res.json(new Feedback(FBCode.SUCCESS, "注册验证码发送成功!"));
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
     * 注册：下载电子合同
     */
    app.get(clientPath + "/download/contract", downloadContractHandler);
    function downloadContractHandler(req, res) {
        var contractFileName = __base + "/static/contract/shenmu_purchase_contract.pdf";
        res.download(contractFileName);
    }

    /**
     * 注册：用户注册信息提交
     */
    app.post(clientPath, auth.validateReq, postRigisterHandler, message.postMsg);
    function postRigisterHandler(req, res, next) {
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
    }


    /**
     * 购物车：购物列表获取
     * @param req
     * @param res
     */
    app.get(clientPath + "/:enterpriseId/cart", listCartHandler);
    function listCartHandler(req, res, next) {
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

    }

    /**
     * 购物车： 新增购物车商品
     * @param req
     * @param res
     */
    app.post(clientPath + '/:enterpriseId/cart', auth.validateReq, postCartItemAddHandler);
    function postCartItemAddHandler(req, res) {
        logger.enter();

        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;
        var postData = {
            quantity: req.body.quantity,
            goodsId: req.body.goodsId,
            remark: req.body.remarks || ""
        };

        cartModel.postCartItems(customerDB, clientId, postData, function(err, result) {
            console.log(err);
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
    }

    /**
     * 购物车： 修改购物车商品数量
     * @param req
     * @param res
     */
    app.patch(clientPath + "/:enterpriseId/cart", auth.validateReq, patchCartGoodsAddHandler);
    function patchCartGoodsAddHandler(req, res) {
        logger.enter();

        var customerDB = req.session.customer.customerDB;
        var clientId = Number(req.session.client.id);

        var postData = {
            quantity: req.body.quantity,
            goodsId: req.body.goodsId,
            remark: req.body.remark
        };

        // 添加购物车商品
        cartModel.postCartGoods(customerDB, clientId, postData, function(error, result) {
            if(error) {
                logger.sqlerr(error);
                res.json(new Feedback(FBCode.DBFAILURE, "数据库开小差了呢,重新试试吧."));
            }
            else {
                res.json(new Feedback(FBCode.SUCCESS, "修改商品成功"));
            }
        });
    }

    /**
     * 购物车： 删除购物车商品
     * @param req
     * @param res
     */
    app.delete(clientPath + '/:enterpriseId/cart', auth.validateReq, deleteCartItemsHandler);
    function deleteCartItemsHandler(req, res) {
        logger.enter();

        var goodsIds = req.query.goodsIds;
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
    }


    /**
     * 购物车地址：地址列表获取
     * @param req
     * @param res
     * @param next
     */
    app.get(clientPath + '/:enterpriseId/address', getAddressListHandler);
    function getAddressListHandler(req, res, next) {
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
    }

    /**
     * 购物车地址：添加新地址
     * @param req
     * @param res
     * @param next
     */
    app.post(clientPath + '/:enterpriseId/address', postAddressItemAddHandler);
    function postAddressItemAddHandler(req, res, next) {
        logger.enter();

        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;
        //var clientId = 3;
        var postData = {
            clientId: clientId,
            receiver: req.body.receiver,
            telNum: req.body.telNum || '',
            mobileNum: req.body.mobileNum || '',
            postCode: req.body.postCode || '',
            provinceFirstStage: req.body.provinceFirstStage,
            citySecondStage: req.body.citySecondStage,
            countiesThirdStage: req.body.countiesThirdStage,
            detailAddress: req.body.detailAddress,
            remark: req.body.remark || ""
        };

        cartModel.addNewAddressItem(customerDB, postData, function(err, result) {
            if(err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, '购物车地址添加失败'));
            }
            res.json(new Feedback(FBCode.SUCCESS, '购物车地址添加成功', {address: result}));
        });
    }

    /**
     * 购物车地址：通过地址ID获取地址信息详情
     * @param req
     * @param res
     * @param next
     */
    app.get(clientPath + '/:enterpriseId/address/:addressId', getAddressDetailHandler);
    function getAddressDetailHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var addressId = req.param('addressId');

        cartModel.getAddressDetail(customerDB, addressId, function(err, addrData) {
            if(err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, '获取购物车地址详情失败'));
            }
            res.json(new Feedback(FBCode.SUCCESS, '获取购物车地址详情成功', {address: addrData}));
        });
    }

    /**
     * 购物车地址：通过地址ID修改地址信息详情
     * @param req
     * @param res
     * @param next
     */
    app.put(clientPath + '/:enterpriseId/address/:addressId', putAddressDetailHandler);
    function putAddressDetailHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var addressId = req.param('addressId');
        var postData = {
            receiver: req.body.receiver,
            telNum: req.body.telNum || '',
            mobileNum: req.body.mobileNum || '',
            postCode: req.body.postCode || '',
            provinceFirstStage: req.body.provinceFirstStage,
            citySecondStage: req.body.citySecondStage,
            countiesThirdStage: req.body.countiesThirdStage,
            detailAddress: req.body.detailAddress,
            remark: req.body.remark || ""
        };

        cartModel.putAddressDetail(customerDB, addressId, postData, function(err, addrData) {
            if(err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, '修改购物车地址详情失败'));
            }
            res.json(new Feedback(FBCode.SUCCESS, '修改购物车地址详情成功', {address: addrData}));
        });
    }

    /**
     * 购物车地址：通过地址ID删除地址信息详情
     * @param req
     * @param res
     * @param next
     */
    app.delete(clientPath + '/:enterpriseId/address/:addressId', delAddressItemHandler);
    function delAddressItemHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var addressId = req.param('addressId');

        cartModel.delAddressItem(customerDB, addressId, function(err, result) {
            if(err) {
                logger.error(err);
                return res.json(new Feedback(FBCode.DBFAILURE, '删除购物车地址失败'));
            }
            res.json(new Feedback(FBCode.SUCCESS, '删除购物车地址成功', {}));
        });
    }
};
