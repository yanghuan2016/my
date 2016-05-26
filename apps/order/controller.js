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
 * order_info_controller.js
 *
 * 订单信息展示controller
 * --------------------------------------------------------------
 * 2015-09-28   hc-romens@issue#70
 * 2015-09-22	zp-romens@issue#25	create file controller.js
 *
 */

//Services
var logger = __logService;
var db = __dbService;
var dataService = __dataService;

//load 3rd party modules
var path = require('path');
var underscore = require("underscore");
var async = require("async");
var xml2js = require('xml2js');
var WXPay = require('../../services/wechat/pay');

var wxpay = WXPay({
    appid: 'wx76a929753051df64',
    mch_id: '1332296001',
    partner_key: 'chengduyunuoxinxijishugongsi2015', //微信商户平台API密钥
    //pfx: fs.readFileSync('./wxpay_cert.p12'), //微信商户平台证书
});

//load project modules
var auth = require(__base + '/modules/auth');
var feedback = require(__modules_path + "/feedback");
var FBCode = feedback.FBCode;
var FeedBack = feedback.FeedBack;
var moment = require('moment');
var sprintf = require("sprintf-js").sprintf;

var message = require(__modules_path + "/message");

//init app name etc
var APPNAME = __dirname.split(path.sep).pop();
var APPURL = "/" + APPNAME;

//load module
var model = require(__dirname + "/model")();
var customerModel=require(__base+"/apps/customer/model")();


module.exports = function(app) {

    //Set url mapping handlers, used in this app
    /**************************
     * Handlers
     **************************/

    app.post(APPURL + "/returnInfo/add", auth.restrict, insertReturnGoodsHandler);
    /**
     * 现付客户，创建退货单的时候  与订单相关联的时候  默认是APPROVED
     * 授信客户
     * 与订单有关联的时候 默认是APPROVED
     * 与订单无关联的时候 默认是CREATED  创建退货单 无ReturnDetails的创建
     * @deprecated 弃用 见metaNewReturnHandler
     * @param req
     * @param res
     * @param next
     */
    function insertReturnGoodsHandler(req,res,next){
        var data=req.body;
        var customerDB = req.session.customer.customerDB;
        var operatorId = req.session.operator.operatorId;
        var remark=data.remark;
        model.insertNewReturnInfo(customerDB,operatorId,'CREATED',remark,data.goodsArr,function(err,result){
            var feeback;
            if(err){
                feedback=new FeedBack(FBCode.DBFAILURE,'内部错误,'+err,null);
            }else{
                feedback=new FeedBack(FBCode.SUCCESS,'退货申请成功',result);
            }
            res.json(feedback);
        });
    }

    app.post(APPURL+"/return/new", metaNewReturnHandler,message.postMsg);
    /**
     * 新的退货单生成 2016 03 18
     * @param req
     * @param res
     * @param next
     */
    function metaNewReturnHandler(req,res,next){
        var data=req.body;
        var customerDB = req.session.customer.customerDB;
        var operatorId = req.session.operator.operatorId;
        var clientId = req.session.operator.clientId;
        var remark=data.remark;
        var orderId=data.orderId;
        var shipId =data.shipId;
        var goodsArr=data.goodsArr;
        model.insertNewReturnItem(customerDB,operatorId,orderId,shipId,'CREATED',remark,goodsArr,clientId,function(err,result){
            var feeback;
            if(err){
                feedback=new FeedBack(FBCode.DBFAILURE,'内部错误,'+err,null);
                res.json(feedback);
            }else{
                if(req.session.customer.erpIsAvailable){
                    var returnId = result.newReturnId;
                    model.returnApplyNotify(req.session,returnId,function(err,result){
                      if(err){
                          logger.error(err);
                          feedback=new FeedBack(FBCode.DBFAILURE,'退货申请成功但同步ERP失败',result);
                          res.json(feedback);
                      } else{
                          feedback=new FeedBack(FBCode.SUCCESS,'退货申请成功并传到ERP',result);
                          res.json(feedback);
                      }
                    })
                }else{
                    feedback=new FeedBack(FBCode.SUCCESS,'退货申请成功',result.newReturnId);
                    res.json(feedback);
                }
                req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_APPROVE_RETURN,
                    "DOC_RETURN", result.newReturnId, result.displayReturnId, "客户"+req.session.operator.clientName+"提交了新的退货单"+result.displayReturnId+"，去处理>");
                return next();
            }

        });
    }

    app.get(APPURL, auth.restrict, getOrdersHandler);
    /**
     * getOrdersHandler List all orders
     *      This method lists all orders
     * @param req
     * @param res
     */
    function getOrdersHandler(req, res, next) {
        logger.enter();
        var paginator = model.createOrderPaginator(req);
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        dataService.commonData(req, function (data) {
            model.listOrderForClient(customerDB, operatorData.clientId, paginator, function (err, results){
                if(err){
                    logger.error(err);
                    return next();
                }
                data['orders'] = results;
                var paginatorOrder = model.restorePaginator(paginator);
                paginatorOrder.cv = (paginatorOrder.cv == "CREATED") ? req.query.cv : paginatorOrder.cv;
                data.paginator = paginatorOrder;
                logger.debug(JSON.stringify(data.orders));
                if(__entryFromOrderOnly){
                    res.render('client/order/order', {data: data});
                }else{
                    res.render('customer/order/order', {data: data});
                }

            });
        });
    }

    app.get(APPURL + "/payment/Query/*",auth.restrict, getPayQueryHandler);
    /**
     * 查询支付结果数据
     * (*=/paymentKey/）
     * @param req
     * @param res
     * @param next
     */
    function getPayQueryHandler(req,res,next){
        logger.enter();
        var customer = req.session.customer;
        var customerId = customer.customerId;
        var customerDB = customer.customerDB;
        var paymentOnCloud = customer.paymentOnCloud;
        var cloudDB = __cloudDBName;

        var partPaths = req.url.split(path.sep);
        var payGateKey = partPaths[4];
        if(payGateKey == "ecpay"){
            /**
             * payGateId == ecpay 按联行支付接口查询
             * dealQuery 是前端页面提交的查询条件字段，支持2种方式
             * 1.订单号displayOrderId，一个或多个，逗号分割："00001,00002"
             * 2.起始日期+截止日期，按yyyy-MM-DD格式直接拼接，如"2012-10-102012-10-11"
             */

            var dealQuery = req.param("dealQuery");
            logger.debug(dealQuery);
            dataService.commonData(req, function (data) {
                if(underscore.isEmpty(dealQuery)){
                    data.msg = "没有查询条件";
                    res.render("error/building",{data: data})
                }else{
                    if(paymentOnCloud){
                        model.getPayGateIdByName(cloudDB,customerDB,paymentOnCloud,payGateKey,function(err,payGateId){
                            model.formPaymentQuery(cloudDB,payGateId,customerId,dealQuery,function(err,queryData){
                                if(err) {
                                    logger.error(err);
                                    data.msg = "获取查询数据失败";
                                    res.render("error/building",{data: data})
                                }else{
                                    logger.debug(JSON.stringify(queryData));
                                    data.queryData = queryData;
                                    //fb = new FeedBack(FBCode.SUCCESS,"获取退款数据成功",{data:data});
                                    //res.json(fb)
                                    data.msg = queryData;
                                    res.render("error/building",{data: data})
                                }
                            })
                        });
                    }else{
                        model.getPayGateIdByName(cloudDB,customerDB,paymentOnCloud,payGateKey,function(err,payGateId){
                            model.formClientPaymentQuery(customerDB,payGateId,customerId,dealQuery,function(err,queryData){
                                if(err) {
                                    logger.error(err);
                                    data.msg = "获取查询数据失败";
                                    res.render("error/building",{data: data})
                                }else{
                                    logger.debug(JSON.stringify(queryData));
                                    data.queryData = queryData;
                                    //fb = new FeedBack(FBCode.SUCCESS,"获取退款数据成功",{data:data});
                                    //res.json(fb)
                                    data.msg = queryData;
                                    res.render("error/building",{data: data})
                                }
                            })
                        });
                    }
                }
            });
        }else{
            res.json(" Not support query");
        }
    }

    app.get(APPURL + "/payRefund",auth.restrict, getPayRefundHandler);
    /**
     * 退款申请数据
     * @param req
     * @param res
     * @param next
     */
    function getPayRefundHandler(req,res,next){
        logger.enter();
        var orderId = Number(req.param('orderId'));
        var customer = req.session.customer;
        var customerId = customer.customerId;
        var customerDB = customer.customerDB;
        var paymentOnCloud = customer.paymentOnCloud;
        var cloudDB = __cloudDBName;
        logger.debug(orderId);
        var fb;
        //需要提交到页面的信息有：所有的支付方式的基本信息（商户代码），签名信息，订单号，原订单金额（可空），退款金额，退款手续费（可空），退款原因(在ejs上获取或生成)
        dataService.commonData(req, function (data) {
            if(underscore.isNaN(orderId)){
                data.msg = "没有订单号";
                res.render("error/building",{data: data});
            }else{
                if(paymentOnCloud) {
                    model.formRefundInfo(cloudDB, customerDB, orderId, customerId, function (err, refundData) {
                        if (err) {
                            logger.error(err);
                            data.msg = "获取退款数据失败";
                            res.render("error/building", {data: data})
                        } else {
                            logger.debug(JSON.stringify(refundData));
                            data.orderId = orderId;
                            data.refundData = refundData;
                            fb = new FeedBack(FBCode.SUCCESS, "获取退款数据成功", {data: data});
                            res.json(fb)
                        }
                    })
                }else{
                    model.formClientRefundInfo( customerDB, orderId, customerId, function (err, refundData) {
                        if (err) {
                            logger.error(err);
                            data.msg = "获取退款数据失败";
                            res.render("error/building", {data: data})
                        } else {
                            logger.debug(JSON.stringify(refundData));
                            data.orderId = orderId;
                            data.refundData = refundData;
                            fb = new FeedBack(FBCode.SUCCESS, "获取退款数据成功", {data: data});
                            res.json(fb)
                        }
                    })
                }
            }
        });
    }

    app.post(APPURL + "/payRefund", postPayRefundHandler);
    /**
     * 退款支付处理，退款的信息组织给后台POST
     * @param req
     * @param res
     * @param next
     */
    function postPayRefundHandler(req, res, next){
        logger.enter();
        var orderId = Number(req.body.orderId);
        var refundId = Number(req.body.refundId);
        var customer = req.session.customer;
        var customerId = customer.customerId;
        var customerDB = customer.customerDB;
        var paymentOnCloud = customer.paymentOnCloud;
        var cloudDB = __cloudDBName;
        var fb;
        if(paymentOnCloud) {
            model.formRefundInfo(cloudDB, customerDB, orderId, customerId, function (err, refundData) {
                if (err) {
                    logger.error(err);
                    fb = new FeedBack(FBCode.DBFAILURE, "获取退款数据失败");
                    res.json(fb)
                } else {
                    logger.debug(JSON.stringify(refundData));
                    var paymentModule = require(__base + "/modules/paymentModule");
                    paymentModule.postRefund(refundData,function(err,result){
                        if(err){
                            logger.error(JSON.stringify(err));
                            fb = new FeedBack(FBCode.INVALIDACTION, "退款失败");
                            res.json(fb)
                        }else{
                            logger.debug(JSON.stringify(result));
                            fb = new FeedBack(FBCode.SUCCESS, "退款成功");
                            res.json(fb)
                        }
                    });
                }
            })
        }else{
            model.formClientRefundInfo( customerDB, orderId, refundId, customerId, function (err, refundData) {
                if (err) {
                    logger.error(err);
                    fb = new FeedBack(FBCode.DBFAILURE, "获取退款数据失败");
                    res.json(fb)
                } else {
                    logger.debug(JSON.stringify(refundData));
                    var paymentModule = require(__base + "/modules/paymentModule");
                    var refundConfirmURL = "/customer/bill/refundConfirm?refundId=%s&status=%s&mess=%s&remaining=%s&sign=%s";
                    var urlStr;
                    paymentModule.postRefund(refundData,function(err,result){
                        if(err){
                            logger.error(JSON.stringify(err));
                            /*fb = new FeedBack(FBCode.INVALIDACTION, "退款失败");
                            res.json(fb)*/
                            urlStr = sprintf(refundConfirmURL, refundId, 0, 'ERR', 0, '');
                        }else{
                            logger.debug(JSON.stringify(result));

                            urlStr = sprintf(refundConfirmURL, refundId, result.status, result.mess, result.remaining, result.sign);
                            logger.ndump('URLSTR: ', urlStr);

                        }
                        res.redirect(urlStr);
                    });

                }
            })
        }
    }

    app.get(APPURL+ "/unionPayment",getUnionPaymentHandler);
    function getUnionPaymentHandler(req,res,next){
        logger.enter();
        res.json("OK")
    }

    var tmp = '';
    app.route(APPURL + "/wechatPayment/notify")
        .get(getNotifyHandler)
        .post(postNotifyHandler);
    function postNotifyHandler(req, res, next) {
        logger.enter();
        var buf = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk) {
            buf += chunk;
        });

        // 内容接收完毕
        req.on('end', function() {
            logger.ndump('buf', buf);
            xml2js.parseString(buf, function(err, json) {
                if (err) {
                    err.status = 400;
                    req.session.result_code = 'FAIL';
                } else {
                    logger.ndump('json', json);

                    req.session.result_code = json.xml.result_code;
                    tmp = json.xml.result_code;
                    if (!req.session.result_code){
                        return res.end(buf);
                    }
                    req.session.save(function(err){
                        res.end(buf);
                    });
                    logger.ndump('json.xml.result_code', json.xml.result_code);
                    logger.ndump('req.session.result_code', req.session.result_code);



                    // wxpay.queryOrder({ transaction_id:json.xml.transaction_id }, function(err, order){
                    //     logger.ndump('order', order);
                    //     req.session.result_code = order.result_code;
                    //     req.session.save();
                    // });
                    // res.end(buf);
                }
            });
        })
    }
    function getNotifyHandler(req, res) {
        logger.ndump('req.session.result_code', req.session.result_code);
        logger.ndump('tmp', tmp);
        res.json(new FeedBack(FBCode.SUCCESS, "", tmp || ""));
    }

    app.get(APPURL + "/WchatPayment", creatWechatPayQRcode);
//    app.get(APPURL + "/payment", creatWechatPayQRcode);
    /**
     * 生成微信支付二维码
     * @param req
     * @param res
     * @param next
     */
    function creatWechatPayQRcode(req, res, next) {
        logger.enter();

        wxpay.getPostParamete({
            body: '这里是商品的简单描述',
            out_trade_no: '20140703'+Math.random().toString().substr(2, 10),
            total_fee: 1,
            spbill_create_ip: '192.168.2.210',
            notify_url: 'http://wx.romenscd.cn/order/wechatPayment/notify',
            trade_type: 'NATIVE',
            product_id: '1234567890'
        }, function(err, result){
            console.log(result);
        });

        wxpay.createUnifiedOrder({
            body: '这里是商品的简单描述',
            detail: '这里是商品的详细描述',
            out_trade_no: '20140703'+Math.random().toString().substr(2, 10),
            total_fee: 1,
            spbill_create_ip: '192.168.2.210',
            notify_url: 'http://wx.romenscd.cn/order/wechatPayment/notify',
            trade_type: 'NATIVE',
            product_id: '1234567890'
        }, function(err, result){
            console.log(result);
            logger.ndump('url_code', result.code_url);
        });
    }

    app.get(APPURL + "/payment", auth.restrict, getPaymentHandler);
    /**
     * 跳转到支付页面的接口
     * @param req
     * @param res
     * @param next
     *
     */
    function getPaymentHandler(req, res, next){
        logger.enter(req.url);
        var orderId = Number(req.param('o'));
        var clientId=Number(req.param('c'));//该订单的clientId
        var customer = req.session.customer;
        var customerId = customer.customerId;
        var customerDB = customer.customerDB;
        var paymentOnCloud = customer.paymentOnCloud;//使用CLIENT自己的支付端口还是使用云平台提供的支付端口
        var cloudDB = __cloudDBName;
        //需要提交到页面的信息有：所有的支付方式的基本信息（商户代码），签名信息，订单号，订单金额，订单第一个商品的名字，支付完成的URL，接收通知的URL
        dataService.commonData(req, function (data) {
            if(paymentOnCloud){
                model.formPaymentInfo(cloudDB,customerDB,orderId,customerId,function(err,paymentData){
                    if(err || paymentData.length == 0){
                        res.render('error/wrong',{err:err});
                    }else {
                        logger.debug(JSON.stringify(paymentData));
                        data.orderId = orderId;
                        data.paymentData = paymentData;
                        logger.ndump('data', data);
                        res.render("customer/cart/paybank_select", {data: data});
                    }
                })
            }else{
               model.formPaymentInfoOnClient(req, customerDB,orderId,customerId,function(err,paymentData){
                   if(err || paymentData.length == 0){
                       res.render('error/wrong',{err:err});
                   }else {
                       logger.debug(JSON.stringify(paymentData));
                       data.orderId = orderId;
                       data.paymentData = paymentData;
                       logger.ndump('data', data);
                       res.render("customer/cart/paybank_select", {data: data});
                   }
               })
            }
        });

    }

    app.post(APPURL + "/payment", auth.restrict, postPaymentHandler, message.postMsg);
    /**
     * 支付post请求 只对授信和货到付款客户使用
     * //CRT = 授信客户， COD=货到付款
     * @param req
     * @param res
     */
    function postPaymentHandler(req,res,next){
        logger.enter();
        var payData = req.body;
        logger.debug(JSON.stringify(payData));
        var orderId = Number(payData.orderId);
        var payType = payData.paytype;
        var customerDB = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;
        model.payForCredit(customerDB, orderId, clientId, payType, function(err,results){
            var fb;
            if(err){
                fb= new FeedBack(FBCode.DBFAILURE,"支付失败",{err:err});
                res.json(fb);
            }else{
                fb= new FeedBack(FBCode.SUCCESS,"支付成功",{orderId:orderId});
                res.json(fb);
                req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_APPROVE_ORDER,
                    "DOC_ORDER", orderId, payData.displayId, "客户"+req.session.operator.clientName+"提交了新的订单"+payData.displayId+"，去处理>");
                logger.ndump("msg", req.session.msg);
                next();
            }
        });
    }

    app.get(APPURL + "/payment/Return/*",  getPaymentReturnHandler);
    /**
     * 支付返回借口(不做业务处理)
     * @param req
     * @param res
     * @param next
     */
    function getPaymentReturnHandler(req,res,next){
        logger.enter();
        logger.debug(JSON.stringify(req.query));
        var dealOrder = req.param('dealOrder');
        var dealFee = req.param('dealFee');
        var dealState = req.param('dealState');
        var dealSignature = req.param('dealSignure');

        //通过URL路径解析出paymentId，customerId
        //http://localhost:3000/order/payment/Return/3/3/?dealId=20015102&dealOrder=00000000000001&dealFee=31.30&dealState=SUCCESS&dealSignure=9c9010ffc6139a56100ffd0e651818c59a6c2b0b
        var partPaths = req.url.split(path.sep);
        var paymentId = partPaths[4];
        var customerId = partPaths[5];
        var customerDB = undefined;
        var cloudDB = __cloudDBName;
        var paymentOnCloud = undefined;
        var isNotified = false;
        async.series([
            function(done){
                model.getCustomerDBsuffix(cloudDB,customerId,function(err,results){
                    if(!err && results.length>0){
                        var suffix = results[0].customerDBsuffix;
                        paymentOnCloud = results[0].paymentOnCloud;
                        customerDB = __customerDBPrefix + "_"+suffix;
                        logger.debug(customerDB);
                        done();
                    }else{
                        done(err+"获取对应客户的数据库错误");
                    }
                });
            },
            function(done){
                if(dealState == "SUCCESS"){
                    model.checkNotifyStatus(customerDB,dealOrder,function(success){
                        isNotified = success;
                        if(isNotified){
                            done("msg already notified");
                        }else{
                            done();
                        }
                    })
                }else{
                    done("dealState is FAILURE");
                }
            },
            //1.校验订单支付金额
            function(done){
                model.checkDealFee(customerDB,dealOrder,dealFee,function(success){
                    if(success){
                        done();
                    }else{
                        done("check dealFee or status failed");
                    }
                })
            },
            //2.校验签名信息
            function(done){
                if(paymentOnCloud){
                    model.checkDealSignature(cloudDB,customerId,paymentId,dealOrder,dealState,dealSignature,function(success){
                        if(success){
                            done();
                        }else{
                            done("check Signature failed");
                        }
                    })
                }else{
                    model.checkClientDealSignature(customerDB,customerId,paymentId,dealOrder,dealState,dealSignature,function(success){
                        if(success){
                            done();
                        }else{
                            done("check Signature failed");
                        }
                    })
                }

            }

        ],
        function(errs,results){
            if(errs){
                logger.error(JSON.stringify(errs));
                if(isNotified){
                    dataService.commonData(req, function (data) {
                        res.render('customer/cart/paySuccess', {data: data});
                    });
                }else{
                    res.render('customer/cart/payFailed', {data: data});
                }
            }else{
                logger.debug("支付返回结果校验通过");
                //向用户展示支付结果
                var status = "SUCCESS";
                model.setOrderHistoryForPayment(cloudDB,customerId,dealOrder,dealFee,status,function(err,result){
                    dataService.commonData(req, function (data) {
                        //todo 支付成功发消息
                        req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_APPROVE_ORDER,
                            "DOC_ORDER", result, result, "客户"+customerId+"提交了新的订单"+result+"，去处理>");
                        data.orderId = result;
                        res.render('customer/cart/paySuccess', {data: data});
                        return next();
                    });
                })
            }
        })


    }

    app.get(APPURL + "/payment/Notify/*",  getPaymentNotifyHandler);
    /**
     * 支付通知借口
     * @param req
     * @param res
     * @param next
     */
    function getPaymentNotifyHandler(req,res,next){
        logger.enter();
        logger.debug(JSON.stringify(req.query));
        var dealOrder = req.param('dealOrder');
        var dealFee = req.param('dealFee');
        var dealState = req.param('dealState');
        var dealSignature = req.param('dealSignure');

        //通过URL路径解析出paymentId，customerId
        var partPaths = req.url.split(path.sep);
        var paymentId = partPaths[4];
        var customerId = partPaths[5];
        var customerDB = undefined;
        var cloudDB = __cloudDBName;
        var paymentOnCloud = undefined;
        var isNotified = false;
        async.series([
                function(done){
                    model.getCustomerDBsuffix(cloudDB,customerId,function(err,results){
                        if(!err && results.length>0){
                            var suffix = results[0].customerDBsuffix;
                            paymentOnCloud = results[0].paymentOnCloud;
                            customerDB = __customerDBPrefix + "_"+suffix;
                            logger.debug(customerDB);
                            done();
                        }else{
                            done(err+"获取对应客户的数据库错误");
                        }
                    });
                },
                function(done){
                    if(dealState == "SUCCESS"){
                        model.checkNotifyBankStatus(customerDB,dealOrder,function(result){
                            isNotified = result;
                            if(isNotified){
                                done("msg already notified");
                            }else{
                                done();
                            }
                        })
                    }else{
                        done("dealState is FAILURE");
                    }
                },
                //1.校验订单支付金额
                function(done){
                    model.checkDealFee(customerDB,dealOrder,dealFee,function(success){
                        if(success){
                            done();
                        }else{
                            done("check dealFee or order status failed");
                        }
                    })
                },
                //2.校验签名信息
                function(done){
                    if(paymentOnCloud){
                        model.checkDealSignature(cloudDB,customerId,paymentId,dealOrder,dealState,dealSignature,function(success){
                            if(success){
                                done();
                            }else{
                                done("check Signature failed");
                            }
                        })
                    }else{
                        model.checkClientDealSignature(customerDB,customerId,paymentId,dealOrder,dealState,dealSignature,function(success){
                            if(success){
                                done();
                            }else{
                                done("check Signature failed");
                            }
                        })
                    }
                }
            ],
            function(errs,results){
                if(errs){
                    logger.error(JSON.stringify(errs));
                    if(isNotified){
                        next();
                    }else{
                        logger.debug("支付通知结果出错");
                        //错误处理标记通知出错
                        res.json("notify_fail");
                    }
                }else{
                    logger.debug("支付通知结果校验通过");
                    //更新订单和支付信息的支付结果;
                    var status = "SUCCESS";
                    model.notifyPaidStatus(cloudDB,customerId,dealOrder,dealFee,status,function(err,result){
                       if(!err){
                          res.json("notify_success");
                       }
                    });
                }
            })
    }

    app.post(APPURL + "/pay", auth.restrict, postPayInfoHandler);
    /**
     * post pay info
     * @param req
     * @param res
     * @param next
     */
    function postPayInfoHandler(req, res, next) {
        logger.enter();
        var fb;
        var payData = req.body;
        logger.debug(JSON.stringify(payData));
        var customerDBName = req.session.customer.customerDB;
        model.restorePayInfo(customerDBName,payData,function(err,result){
            if(err) {
                fb= new FeedBack(FBCode.DBFAILURE);
            }else{
                fb = new FeedBack(FBCode.SUCCESS);
            }
            res.json(fb);
        })
    }

    app.post(APPURL + '/add', auth.restrict, auth.validateReq, postNewOrderHandler);
    /**
     * SCC提交新订单数据
     * @param req
     * @param res
     * @param next
     */
    function postNewOrderHandler(req, res, next) {
       logger.enter();
        var fb;
        var orderData = req.body;

        var customerDBName = req.session.customer.customerDB;
        var operatorId = req.session.operator.operatorId;
        var clientId = req.session.operator.clientId;
        var sessionData = req.session;
        model.validateOrder(customerDBName,orderData,operatorId,clientId,function(err,result){
            if(err){
                if(err == "DBFAILURE"){
                    fb=new FeedBack(FBCode.DBFAILURE,err.code);
                }else if (err == "AUTHFAILURE"){
                    fb= new FeedBack(FBCode.AUTHFAILURE,"当前账号已被禁购，请联系管理员");
                }else if (err == "INVALIDACTION"){
                    fb = new FeedBack(FBCode.INVALIDACTION, '存在商品不在您的GSP控制范围内,无法下单');
                }
                res.json(fb);
            }else{
                model.makeNewOrder(customerDBName, clientId, operatorId, orderData, sessionData,function (error,orderId) {
                    if (error) {
                        fb = new FeedBack(FBCode.DBFAILURE, "添加订单失败" + error.toString);
                    } else {
                        logger.info("Order created!");
                        fb = new FeedBack(FBCode.SUCCESS, "添加订单成功", {orderId: orderId});
                    }
                    res.json(fb);
                });
            }
        });
    }

    app.post(APPURL + '/close', auth.restrict,auth.validateReq, postCloseOrderHandler);
    /**
     * 买家客户取消订单
     * @param req
     * @param res
     */
    function postCloseOrderHandler(req, res) {
        logger.enter();
        var fb;
        var orderData = req.body;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        // 检测当前订单状态是否为"CLOSED"
        model.orderStatusCheck(customerDB,orderData.orderId,"CLOSED",function(success){
            if(success){
                fb=new FeedBack(FBCode.INVALIDACTION,"订单已取消，不能重复操作");
                res.json(fb);
                return;
            }
            //取消当前订单
            model.transCloseOrder(customerDB,orderData.orderId,operatorData,function(err,resultList){
                if(err){
                    fb=new FeedBack(FBCode.INVALIDACTION,"订单取消失败");
                    res.json(fb);
                    return;
                }
                model.refundOrder(customerDB,orderData.orderId,function(err,result){
                    if(req.session.customer.erpIsAvailable){
                        model.notifyERPOrderClosed(req.session,orderData.orderId,function(err,results){
                            fb=new FeedBack(FBCode.SUCCESS,"订单已取消");
                            res.json(fb);
                        })
                    }else{
                        fb=new FeedBack(FBCode.SUCCESS,"订单已取消");
                        res.json(fb);
                    }
                });
            })
        });

    }

    app.get(APPURL + '/detail', auth.restrict, getOrderDetailHandler);
    /**
     *
     * @param req
     * @param res
     * @param next
     */
    function getOrderDetailHandler(req, res, next) {
        logger.enter();
        var paystatus = req.param('paystatus');
        var orderId = Number(req.param('orderId'));
        logger.ndump('orderId', orderId);
        if(underscore.isNaN(orderId)) {
            res.redirect('/order');
            return
        }
        var clientId = req.session.operator.clientId;
        var customerId = req.session.customer.customerId;
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getClientOrderDetails(customerDB,orderId,clientId,customerId,function(err,details){
                if(err){
                    logger.error(err);
                    res.render("error/wrong",{err:err});
                    return;
                }
                data.order = details.order;
                data.orderContractInfo=details.orderContractInfo;
                data.payStatus=paystatus;
                data.order.cartItems=details.cartItems;
                data.orderhistorys=details.orderhistorys;
                data.customerContractInfo=details.customerContractInfo;
                data.clientContractInfo=details.clientContractInfo;
                data.contractStage=details.contractStage;
                data.returnInfo=details.returnInfo;
                data.paymentInfo=details.paymentInfo;
                data.shipInfo=[];
                if(details.shipInfo.length!=0){
                    data.shipInfo=formatOrderDetailsShipInfo(details.shipInfo);
                }
                data.paystatus=paystatus;
                res.render('customer/order/detail', {data: data});
            })
        });
    }

    app.post(APPURL+"/return/close",auth.restrict,auth.validateReq,postCloseReturnHandler);
    /**
     * 取消退货单
     * @param req
     * @param res
     */
    function postCloseReturnHandler(req,res){
        /**
         * 传递过来的数据
         * {
         *     returnId:14,
         *      status:'CLOSED'
         * }
         */
        logger.enter();
        var returnData = req.body;
        var returnId = returnData.returnId;
        var customerDB = req.session.customer.customerDB;
        var operatorDataId = req.session.operator.operatorId;
        if(req.session.operator.operatorType=='CLIENT'){
            operatorDataId=null;
        }else{
            operatorDataId=Number(operatorDataId);
        }
        model.closeReturnInfo(customerDB,returnId,'CLOSED',operatorDataId,function(err,affectedResult){
            var fb;
            if (!err) {
                fb=new FeedBack(FBCode.SUCCESS,"退货单已关闭",{results : affectedResult});
            } else {
                fb=new FeedBack(FBCode.DBFAILURE,"退货单关闭失败"+err.code);
            }
            res.json(fb)
        });

    }

    app.get(APPURL + "/paySuccess",auth.restrict, getPaySuccessHandler);
    /**
     * 支付成功跳转页面
     * @param req
     * @param res
     */
    function getPaySuccessHandler(req,res){
        logger.enter();
        dataService.commonData(req, function (data) {
            res.render('customer/cart/paySuccess',{data:data})
        })
    }

    app.get(APPURL + "/payFailed",auth.restrict, getPayFailedHandler);
    /**
     * 支付失败
     * @param req
     * @param res
     */
    function getPayFailedHandler(req,res){
        logger.enter();
        dataService.commonData(req, function (data) {
            res.render('customer/cart/payFailed',{data:data})
        })
    }

    app.post(APPURL + "/ship/update", auth.restrict,auth.validateReq,updateShipInfoHandler);
    /**
     * 发货信息的更新
     * @param req
     * @param res
     */
    function updateShipInfoHandler(req,res){
        logger.enter();
        var fb;
        var receivedData = req.body;
        var shipId = receivedData.shipId;
        var customerDBName = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        var remark = receivedData.remark;
        logger.ndump("receivedData", receivedData);
        if(underscore.isEmpty(receivedData.orData)){
            fb=new FeedBack(FBCode.INVALIDACTION,"收货信息为空，不能提交");
            res.json(fb)
        }
        model.shipStatusCheck(customerDBName,shipId,function(success){
            if(success){
                model.updateShipReceived(customerDBName,operatorData,receivedData,function(err, shipId, rejectId){
                    if(!err){
                        if(req.session.customer.erpIsAvailable){
                            model.notifyERPShipReceived(req.session,shipId,function(error,result){
                                fb=new FeedBack(FBCode.SUCCESS,"确认收货信息成功",{shipId : shipId});
                                res.json(fb);
                            });
                        }else{
                            fb=new FeedBack(FBCode.SUCCESS,"确认收货信息成功",{shipId : shipId});
                            res.json(fb);
                        }
                    }else{
                        logger.error(err);
                        fb=new FeedBack(FBCode.DBFAILURE,err.code);
                        res.json(fb);
                    }

                });
            }else{
                fb=new FeedBack(FBCode.INVALIDACTION,"收货已确认，不能重复提交");
                res.json(fb);
            }
        })
    }

    app.get(APPURL + "/ship",auth.restrict, getShipInfoHandler);
    /**
     * 发货信息
     * @param req
     * @param res
     */
    function getShipInfoHandler(req,res){
        logger.enter();
        var shipPaginator =  model.getShipInfoPaginator(req);
        var type = req.query.type;
        var isReceived = (typeof type != "undefined") ? (type == "received") : undefined;
        dataService.commonData(req, function (data) {
            var customerDB = req.session.customer.customerDB;
            var operatorData = req.session.operator;
            model.getShipInfos(customerDB,operatorData,isReceived,shipPaginator,data,function(err,data) {
                  if(err){
                      res.render('error/wrong',{err:err});
                  }else{
                      logger.ndump('data', data);
                      data["paginator"] = model.restoreShipPaginator(shipPaginator);
                      res.render('customer/order/ship/ship', {data: data});
                  }

            });
        });
    }

    app.get(APPURL + "/ship/details",auth.restrict, getShipDetailsHandler);
    /**
     *获取发货详情
     * @param req
     * @param res
     */
    function getShipDetailsHandler(req,res){
        logger.enter();
        var shipId = req.param("shipId");
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getShipDetailsInfo(customerDB,shipId,function(err,shipDetails){
                if(err){
                    logger.error(err);
                    res.render("error/500");
                }else{
                    data["shipDetails"] = shipDetails;
                    data.paginator = {};
                    if(shipDetails[0].isReceived == 1){
                        //已收货
                        res.render('customer/order/ship/recevied', {data: data});
                    }else if(shipDetails[0].isReceived == 0){
                        //待收货
                        res.render('customer/order/ship/recevie', {data: data});
                    }
                }
            });
        });

    }

    app.get(APPURL + "/return/apply",auth.restrict, getReturnApplyDetailsHandler);
    /**
     * 申请退货页面数据加载
     * 修改：0324
     * @param req
     * @param res
     */
    function  getReturnApplyDetailsHandler(req,res){
        logger.enter();
        var orderId = req.param("orderId");
        var shipId=req.param('shipId');
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getReturnApplyInfo(customerDB,orderId,shipId,function(err,result){
                if(err){
                    logger.error(err);
                    res.render("error/500");
                }
                data.paginator = {};
                data["shipDetails"] = result;
                res.render('customer/order/return/apply', {data: data});
            });
        });
    }

    app.get(APPURL + "/getShipInfoByBatchNum", auth.restrict, getShipInfoByBatchNumHandler);
    /**
     * 获取发货批次信息
     * @param req
     * @param res
     */
    function getShipInfoByBatchNumHandler(req, res){
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var batchNum = req.query.batchNum;
        model.getBatchInfo(customerDB, batchNum, function (err, result) {
            var fb;
            if(!err){
                fb=new FeedBack(FBCode.SUCCESS, "获取成功", result);
            }else{
                fb=new FeedBack(FBCode.DBFAILURE, "获取失败"+err.code);
            }
            res.json(fb);
        });
    }

    app.get(APPURL + "/return/add", auth.restrict, addReturnGoodsHandler);
    /**
     * @deprecated 弃用 add  return apply action见metaNewReturnHandler
     * @param req
     * @param res
     */
    function addReturnGoodsHandler(req, res){
        logger.enter();
        dataService.commonData(req, function (data) {
            res.render('customer/order/return/sm_return_add', {data: data});
        });
    }

    app.post(APPURL + "/return/add", auth.restrict,auth.validateReq, addReturnInfoHandler);
    /**
     * @deprecated 弃用，见metaNewReturnHandler
     * @param req
     * @param res
     */
    function addReturnInfoHandler(req,res){
        logger.enter();
        var returnData = underscore.filter(req.body.returnData, function(item){
            return Number(item.quantity) != 0;
        });
        if(returnData.length <= 0){
            res.json(new FeedBack(FBCode.DBFAILURE,"不能退0个商品"));
            return;
        }
        var returnInfo = req.body;
        returnInfo.returnData = returnData;

        var customerDBName = req.session.customer.customerDB;
        var customerId = req.session.customer.customerId;
        var operatorData = req.session.operator;
        logger.trace(JSON.stringify(returnInfo));
        model.returnOverLimit(customerDBName,returnInfo,function(success){
            var fb;
            if(success){
                model.addReturnInfo(customerDBName,returnInfo,operatorData,function(err,returnId){
                    if(!err){
                        fb=new FeedBack(FBCode.SUCCESS,"创建退货信息成功",{results : returnId});
                    }else{
                        fb=new FeedBack(FBCode.DBFAILURE,"创建退货信息失败"+err.code);
                    }
                    res.json(fb);
                });
            }else{
                fb=new FeedBack(FBCode.INVALIDACTION,"每种商品的退货数量不能超过发货数,请重新提交");
                res.json(fb);
            }
        })

    }

    app.get(APPURL + "/return",auth.restrict, getReturnInfoHandler);
    /**
     * get return info
     * @param req
     * @param res
     */
    function getReturnInfoHandler(req,res){
        logger.enter();
        var paginator = model.createReturnPaginator(req);
        logger.debug(JSON.stringify(paginator));
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        dataService.commonData(req, function (data) {
            model.getReturnInfos(customerDB,operatorData,paginator,data,function(err,data){
                if(err){
                    logger.error(err);
                    res.render("error/500");
                }else{
                    data['paginator'] = model.restoreReturnPaginator(paginator);
                    logger.ndump("data", data);
                    res.render('customer/order/return/return', {data: data});
                }
            });
        });
    }

    app.get(APPURL + "/return/detail", auth.restrict, getReturnDetailInfoHandler);//退货发货页面
    /**
     * get and build return detailInfo;
     * @param req
     * @param res
     */
    function getReturnDetailInfoHandler(req, res) {
        logger.enter();
        var returnId = req.param("returnId");
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            customerModel.getReturnInfoById(customerDB, returnId, function (err, result) {
                if (err) {
                    logger.error(err);
                    res.render("error/500");
                } else {
                    data['returnHistory'] = result[1];//退货单历史
                    data.applyRemark = result[0][0].remark;//退货单详情
                    data["returnInfo"] = result[0];
                    logger.debug(JSON.stringify(data.returnInfo));
                    var status = result[0][0].returnStatus;
                    logger.debug(JSON.stringify(result[0][0].beforeCloseStatus));
                    if (status == 'APPROVED' || (result[0][0].beforeCloseStatus=="APPROVED" && status == "CLOSED")) {
                        //退货审核通过，待发货
                        res.render('customer/order/return/return_approved', {data: data, returns: result[0]});
                    }
                    else if (status == 'DELIVERED' || (result[0][0].beforeCloseStatus=="DELIVERED" && status == "CLOSED")) {
                        //退货已送达
                        res.render('customer/order/return/return_delivered', {data: data});
                    }
                    else if (status == "CREATED" || (result[0][0].beforeCloseStatus=="CREATED" && status == "CLOSED")) {
                        //退货待审核
                        logger.debug(" 退货待审核");
                        res.render('customer/order/return/return_pending', {data: data, returns: result[0]});
                    }
                    else if (status == "SHIPPED" || (result[0][0].beforeCloseStatus=="SHIPPED" && status == "CLOSED")) {
                        //退货已发货
                        res.render('customer/order/return/return_shipped', {data: data});
                    }
                }
            });
        });
    }

    app.post(APPURL + "/return/ship", auth.restrict,auth.validateReq, shipReturnInfoHandler,message.postMsg);
    /**
     * return ship
     * @param req
     * @param res
     * @param next
     */
    function shipReturnInfoHandler(req, res, next) {
        logger.enter();
        var returnData = req.body;
        var returnId = returnData.returnId;
        var customerDB = req.session.customer.customerDB;
        var displayId = returnData.returnDisplayId;
        //生成发货时间
        returnData.logisticsDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        model.returnStatusCheck(customerDB, returnId, "APPROVED", function (success) {
            var fb;
            if (success) {
                model.clientReturnGoodsShip(customerDB, returnData, function (err, affectedRows) {
                    if (!err) {
                        req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_RECEIVE_RETURN, "DOC_RETURN", returnId, displayId, "客户"+req.session.operator.clientName+"的退货单("+returnData.returnDisplayId+")已发货，查看详情>");
                        if(req.session.customer.erpIsAvailable){
                            model.notifyERPReturnShipped(req.session,returnId,function(err,result){
                                fb = new FeedBack(FBCode.SUCCESS, "退货单已发货", {results: affectedRows});
                                res.json(fb);
                                return next();
                            });
                        }else{
                            fb = new FeedBack(FBCode.SUCCESS, "退货单已发货", {results: affectedRows});
                            res.json(fb);
                            return next();
                        }
                    } else {
                        fb = new FeedBack(FBCode.DBFAILURE, "退货单发货失败" + err.code);
                        res.json(fb);
                    }
                })
            } else {
                fb = new FeedBack(FBCode.INVALIDACTION, "退货单已发货，不能重复操作");
                res.json(fb)
            }
        })
    }

    app.post(APPURL + "/return/close", auth.restrict,auth.validateReq, closeReturnInfoHandler);
    /**
     *  close return
     * @param req
     * @param res
     */
    function closeReturnInfoHandler(req,res){
        logger.enter();
        var returnData = req.body;
        var returnId = returnData.returnId;
        var customerDB = req.session.customer.customerDB;
        var operatorDataId = req.session.operator.operatorId;
        if(req.session.operator.operatorType=='CLIENT'){
            operatorDataId=null;
        }else{
            operatorDataId=Number(operatorDataId);
        }
        model.closeReturnInfo(customerDB,returnId,'CLOSED',operatorDataId,function(err,affectedResult){
            var fb;
            if (!err) {
                fb=new FeedBack(FBCode.SUCCESS,"退货单已关闭",{results : affectedResult});
            } else {
                fb=new FeedBack(FBCode.DBFAILURE,"退货单关闭失败"+err.code);
            }
            res.json(fb);
        });
    }

    app.get(APPURL + "/refuse", auth.restrict, getOrderRefuseListHandler);
    /**
     * 客户端  拒收记录列表  [三种状态]  CREATED SHIPPED FINISHED
     * @param req
     * @param res
     */
    function getOrderRefuseListHandler(req, res){
        //获取数据库的拒收单列表
        var type = req.query.type;
        var operatorType="CREATED";

        if(type=='received'){
            operatorType='FINISHED';
        } else if(type=='receive'){
            operatorType='SHIPPED'
        }
        dataService.commonData(req, function (data) {
            //test data
            var customerDB = req.session.customer.customerDB;
            var operatorData = req.session.operator;
            var paginator=model.createPurePaginator(req);

            model.getRefuseInfo(customerDB,operatorData,operatorType,paginator,data,function(err,data){
                if(err) {
                    res.render('error/wrong', {err: err});
                }else{
                    data['paginator']=model.restorePurePaginator(paginator);
                    res.render('customer/order/refuse/refuse',{data: data});
                }
            });
        });
    }

    app.get(APPURL + "/refuse/detail", auth.restrict, getOrderRefuseDetailHandler);
    /**
     * get Order Refuse Detail
     * @param req
     * @param res
     */
    function getOrderRefuseDetailHandler(req, res){
        logger.enter();
        var refuseId = req.param("refuseId");
        var customerDB = req.session.customer.customerDB;
        dataService.commonData(req, function (data) {
            model.getRefuseDetail(customerDB,refuseId,function(err,refuseDetails){
                logger.debug(JSON.stringify(refuseDetails));
                data.refuseDetails = refuseDetails;
                var status = refuseDetails[0].status;
                if(status == "CREATED"){
                    res.render("customer/order/refuse/waitInStorage", {data: data});
                } else {
                    res.render("customer/order/refuse/storage", {data: data});
                }
            });

        })
    }

    app.post(APPURL+"/refuse/ship",auth.restrict,auth.validateReq, postRefuseInfoHandler);
    /**
     * ship for reject
     * @param req
     * @param res
     */
    function postRefuseInfoHandler(req,res){
        var data = req.body;
        var customerDB = req.session.customer.customerDB;
        var operatorData = req.session.operator;
        model.rejectShipData(customerDB,operatorData,data,function(err,result){
            var feedback;
            if(err){
                feedback = new FeedBack(FBCode.DBFAILURE,"发货失败,"+ err.toString());
            }else{
                feedback = new FeedBack(FBCode.SUCCESS, "拒收发货成功",{rejectId:result});
            }
            res.json(feedback);
        });

    }

    function formatOrderDetailsShipInfo(shipDetailArray){
       var initialData= underscore.chain(shipDetailArray).groupBy(function(item){
            return item.shipId;
        }).value();
        var shipDetails=[];
        var keys=Object.keys(initialData);
        for (var index in  keys){
            var key=keys[index];
            shipDetails.push(initialData[key]);
        }
        return shipDetails;
    }


};
