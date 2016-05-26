/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports = function (app) {
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
    var fs = require('fs');
    var strftime = require('strftime');
    var myPath = require(__modules_path + "/mypath");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var express = require("express");
    var moment = require("moment");
    var formidable = require('formidable');
    var async=require('async');
    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var message = require(__modules_path + "/message");

    /*
     * init app name etc
     */
    var APPNAME = myPath.getAppName(__dirname);
    var APPURL = "/" + APPNAME;
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    /*
     * load module
     */
    var model = require(__dirname + "/model")();

    /*
     * Set url mapping handlers, used in this app
     * URL mapping in this APP, app.HTTP_METHOD(URL, auth, handler) format
     */
    var clientModel = require(__base+"/apps/customer/client/model")();



    //财务报表-销售报表
    app.get(APPURL+'/List', auth.restrict, getBillSellHandler);
    //财务报表-销售报表
    function getBillSellHandler(req,res){
        logger.enter();
        dataService.commonData(req,function(data){
            res.render('customer/center/bill/billList', {data: data});
        })
    }

    //财务报表-品种报表
    app.get(APPURL+'/goodsList', auth.restrict, getBillGoodsHandler);
    //财务报表-品种报表
    function getBillGoodsHandler(req, res) {
        logger.enter();
        dataService.commonData(req,function(data){
            res.render('customer/center/bill/goodsList', {data: data});
        })
    }

    //财务报表-在途货物报表
    app.get(APPURL+'/onwayList', auth.restrict, getBillOnwayHandler);
    //财务报表-在途货物报表
    function getBillOnwayHandler(req, res) {
        logger.enter();
        dataService.commonData(req,function(data){
            res.render('customer/center/bill/onwayList', {data: data});
        })
    }

    //财务报表-销售详情报表
    app.get(APPURL+'/list_detail', auth.restrict, getBillHandler);
    //财务报表-销售详情报表
    function getBillHandler(req,res){
        logger.enter();
        dataService.commonData(req,function(data){
            res.render('customer/center/bill/billList_detail', {data: data});
        })
    }


    app.get(APPURL, auth.restrict, getBillListHandler);
    /**
     * 生成商户结款数据
     * @param req
     * @param res
     * @param next
     */
    function getBillListHandler(req,res,next){


        //req.param() 可以获取get 和post 但是官方会提示 deprecated

        //req.params 获取不到get 和post提交的数据
        logger.enter();


        var beginDate=req.query.beginDate;
        var endDate=req.query.endDate;
        var clientName=req.query.clientName;


        //三个参数都有可能为空
        beginDate=(underscore.isUndefined(beginDate)||beginDate=="")?"":beginDate;
        endDate=(underscore.isUndefined(endDate)||endDate=="")?"":endDate;
        clientName=(underscore.isUndefined(clientName)||clientName=="")?"":clientName;

        var pageData={
            beginDate:beginDate,
            endDate:endDate,
            clientName:clientName
        };


        dataService.commonData(req,function(data){
            data.pageData=pageData;
            data.billList=null;
           /* res.render('customer/center/bill/bill', {data: data});*/
         if(beginDate!=""){
                 beginDate=moment(beginDate);
                 if(!beginDate.isValid()){
                     res.render('err/500');
                     return;
                 }
                 // Set beginDate to YYYY-MM-DD 00:00:00 and endDate to the time 00:00:00 on the next day
                 beginDate.hour(0);
                 beginDate.minute(0);
                 beginDate.second(0);
             }
             if(endDate!=""){
                 endDate=moment(endDate);
                 if(!beginDate.isValid()){
                     res.render('err/500');
                     return;
                 }
                 // Set beginDate to YYYY-MM-DD 00:00:00 and endDate to the time 00:00:00 on the next day
                 endDate.add(1,'days');
                 endDate.hour(0);
                 endDate.minute(0);
                 endDate.second(0);
             }

             var customerDBName = req.session.customer.customerDB;
            //三个 查询条件都有可能为空
             model.getClearingList(
                     customerDBName,
                     clientName,
                     beginDate!=""?beginDate.format("YYYY-MM-DD HH:mm:ss"):"2000-01-01 00:00:00",
                     endDate!=""?endDate.format("YYYY-MM-DD HH:mm:ss"):"2100-01-01 00:00:00",
                     function(err, result) {
                         if (err) {
                         res.render('res/500');
                             return;
                         }
                         //format Date
                         data.billList=underscore(result).map(function(item){
                             item.clearingDate=moment(item.clearingDate).format('YYYY-MM-DD');
                             return item;
                         });
                         logger.ndump('result', result);
                         res.render('customer/center/bill/bill', {data: data});
                     }
             );
        });

    }

    /**
     *  获取结款页面所需要的数据
     */
    app.get(APPURL+'/financeCenter',auth.restrict,getFinanceCenterHandler);
    function getFinanceCenterHandler(req,res,next){

        var currentYear=new Date().getUTCFullYear();
        var currentMonth=(new Date().getMonth() + 1) >= 10 ? (new Date().getMonth() + 1) : ("0" + (new Date().getMonth() + 1));
        var startMonth=req.query.startMonth||(currentYear+'-'+currentMonth);
        var endMonth=req.query.endMonth||new Date().getUTCFullYear()+'-'+'12';
        var clientName=req.query.clientName||'';
        var status=req.query.status||'ALL';

        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        var queryObj = {
            startMonth:startMonth,
            endMonth:endMonth,
            clientName:clientName,
            status:status

        };
        logger.debug(JSON.stringify(queryObj));
        dataService.commonData(req, function (data) {
            model.getFinanceData(dbName,paginator,queryObj,function(err,results){
               if(err){
                   logger.error(JSON.stringify(err));
                   data.financeData = [];
               }else{
                   data.financeData = results;
               }
               data.paginator = clientModel.restorePurePaginator(paginator);
               var startArray=startMonth.split('-');
               var endArray=endMonth.split('-');
               data.startYear=startArray[0];
               data.startMonth=startArray[1];
               data.endYear=endArray[0];
               data.endMonth=endArray[1];
               data.clientName=clientName;
               data.status=status;

               res.render('customer/center/finance/creditClient/bill_reports',{data:data});

            });
        })
    }



    /*授信客户结款列表     点击 某个特定用户的 应结款 跳转页面  */
    app.get(APPURL+'/creditClientFigure',auth.restrict,getAccountDueHandler);
    function getAccountDueHandler(req,res,next){

        var clientId=req.query.clientId;
        var certainMonth=req.query.filterMonth;
        var queryObj = {
            clientId:clientId,
            certainMonth:certainMonth
        };
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            model.getCreditMonthData(dbName,paginator,queryObj,function(err,results){
                if(err){
                    logger.error(JSON.stringify(err));
                    res.render('error/500');
                }else{
                    data.paginator = clientModel.restorePurePaginator(paginator);
                    //获取年月
                    data.chooseYear=certainMonth.split('-')[0];
                    data.chooseMonth=certainMonth.split('-')[1];


                    data.clientCreditDetail=results.monthClear;

                    logger.debug(JSON.stringify(data.clientCreditDetail));
                    res.render('customer/center/finance/creditClient/bill_detail.ejs',{data:data});
                }
            });
        })
    }

    /*授信客户结款列表 点击 某个特定用户的 已结款 跳转页面  */
    app.get(APPURL+'/creditClientReceive',auth.restrict,getCreditClientReceiveHandler);
    function getCreditClientReceiveHandler(req,res,next){
        var clientId=req.query.clientId;
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            model.getClientReceiveData(dbName,paginator,clientId,function(err,results){
                if(err){
                    logger.error(JSON.stringify(err));
                    data.clientReceiveData = [];
                }else{
                    data.clientReceiveData = results;
                }
                logger.debug(JSON.stringify(results));
                data.paginator = clientModel.restorePurePaginator(paginator);
                data.clientId=clientId;
                res.render('customer/center/finance/creditClient/bill_detail_receivable.ejs',{data:data});
            });
        })
    }


    app.get(APPURL+'/cod',auth.restrict,getCashOnDeliveryHandler);
    function getCashOnDeliveryHandler(req,res){
        var startDate=req.query.startDate||'',
            endDate=req.query.endDate||'',
            orderNoOrClientName=req.query.keyWord||'',
            status=req.query.status||'ALL';

        var queryObj = {
            startDate:startDate,
            endDate:endDate,
            orderNoOrClientName:orderNoOrClientName,
            status:status
        };
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);

        dataService.commonData(req, function (data) {
            model.getCODclearData(dbName,paginator,queryObj,function(err,results){
                if(err){
                     logger.error(err);
                     data.finaceData = [];
                }else{
                    logger.debug(JSON.stringify(results));
                    data.finaceData = results;
                }
                data.filterCondition={
                    startDate: startDate,
                    endDate: endDate,
                    orderNoOrClientName: orderNoOrClientName,
                    status: status
                };
                data.paginator = clientModel.restorePurePaginator(paginator);
                res.render('customer/center/finance/cashOnDelivery/cod_statistics.ejs',{data:data});
            });

        });

    }

    // 货到付款结算确认
    app.post(APPURL+'/codClearConfirm',auth.restrict, postCodClearConfirmHandler);
    function postCodClearConfirmHandler(req, res) {
        logger.enter();
        var dbName = req.session.customer.customerDB;

        var clearData = req.body;

        model.updateCODClearFinishInfo(dbName, clearData, function(err, result){
            var feedback;
            if(err){
                logger.error(err);
                feedback=new FeedBack(FBCode.INTERNALERROR,'结款失败，请重新检查结款数据再提交');
                res.json(feedback);
            }else{
                feedback=new FeedBack(FBCode.SUCCESS,'结款成功',result);
                res.json(feedback);
            }
        });
    }


    //暂时废弃
    app.get(APPURL+'/settleDetail',auth.restrict,getSettleDetailHandler);
    function getSettleDetailHandler(req,res){
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {

            data.paginator = clientModel.restorePurePaginator(paginator);
            res.render('customer/center/finance/finance_center_bill_detail.ejs',{data:data});

        })


    }



    //冲红记录
    app.get(APPURL+'/bonusReports',auth.restrict,getBonusReportsHandler);
    function getBonusReportsHandler(req,res){

        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            data.paginator = clientModel.restorePurePaginator(paginator);
            res.render('customer/center/finance/bonus_report.ejs',{data:data});

        })

    }


    app.get(APPURL+'/tradeDetail',auth.restrict,getTraderDetailHandler);
    function getTraderDetailHandler(req,res){


        logger.enter();
        var queryObj={
            startDate:req.query.startDate||'',
            endDate:req.query.endDate||'',
            bType:req.query.bType||'ALL',
            pType:req.query.pType||'ALL',
            keyWord:req.query.keyWord||''
        };

        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            data.paginator = clientModel.restorePurePaginator(paginator);
            data.filterCondition=queryObj;
            model.getTradeList(dbName,paginator,queryObj,function(err,result){
                if(err){
                    logger.error(err);
                    res.render('error/500');
                }
                else{
                    data.tradeList=result;
                    res.render('customer/center/finance/trade_detail.ejs',{data:data});
                }
            });
        })
    }

    //退款执行
    app.get(APPURL+'/refundPerform',auth.restrict,getTraderRefundPerformHandler);
    /**
     * 退款执行
     * @param req
     * @param res
     */
    function getTraderRefundPerformHandler(req,res){
        logger.enter();

        var startDate = req.query.startDate||'',
            endDate = req.query.endDate||'',
            refundReason = req.query.refundReason||'ALL',
            refundType = req.query.refundType||'ALL',
            refundStatus = req.query.refundStatus||'ALL',
            keyWord = req.query.keyWord||'';

        var queryObj = {
            startDate: startDate,
            endDate: endDate,
            refundReason: refundReason,
            refundType: refundType,
            refundStatus: refundStatus,
            keyWord: keyWord
        };

        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);

        dataService.commonData(req, function (data) {
            model.getRefundExecutionData(dbName, paginator, queryObj, function(err, results){
                if(err){
                    logger.error(err);
                    data.finaceData = [];
                }else{
                    logger.debug(JSON.stringify(results));
                    data.finaceData = results;
                }

                data.filterCondition = queryObj;
                data.paginator = clientModel.restorePurePaginator(paginator);
                data.refundData = results;
                res.render('customer/center/finance/refund_perform.ejs', {data: data});
            });
        });
    }

    // 退款确认
    app.get(APPURL+'/refundConfirm', auth.restrict, getRefundConfirmHandler);
    function getRefundConfirmHandler(req, res){
        logger.enter();
        var getData=req.query;
        var dbName = req.session.customer.customerDB;
        var operatorData=req.session.operator;

        var operatorId = operatorData.operatorId;

        var refundDict = {
            '9011': '商户号不能为空.',
            '9012': '没有此用户.',
            '9013': '订单号不能为空.',
            '9024': '订单号不存在.',
            '9014': '退款金额不能为空.',
            '9015': '退款金额不符合规定格式.',
            '9016': '金额超过限制.',
            '9017': '手续费金额不符合规定格式.',
            '9018': '手续费金额超过限制.',
            '9021': '退款原因超过规定长度.',
            '9023': '验证签名值失败.',
            '9019': '该订单不能退款.',
            '9020': '商户账户余额不足,不能退款.'
        };

        logger.ndump('GetData: ', getData);

        if(true != getData.status) {
            return res.json(new FeedBack(FBCode.INTERNALERROR,'退款支付操作失败, '+refundDict[getData.mess]));
        }

        // 1、调用退款支付操作接口（应返回：1、支付成功失败状态； 2、支付流水号）
        var RefundData = {
            executedBy: operatorId,
            executionStatus: ('1' == getData.status) ? 'SUCCESS' : 'FAIL',
            waterbillNo: ('1' == getData.status) ? getData.sign : ''
        };

        var operatorObj={
            excuterOperatorId:operatorData.operatorId,
            excuterName:operatorData.operatorName,
            excuterMobile:operatorData.mobileNum
        };

        // 2、添加退款执行数据，更新退款状态信息
        model.updateRefundExecution(dbName, getData, RefundData, operatorObj,function(err, result){
            var feedback;
            if(err){
                logger.error(err);
                feedback=new FeedBack(FBCode.INTERNALERROR,'结款失败，请重新检查结款数据再提交');
                res.json(feedback);
            }else{
                feedback=new FeedBack(FBCode.SUCCESS,'结款成功',result);
                res.json(feedback);
            }
        });
    }

    //退款审核
    app.get(APPURL+'/refundCheck',auth.restrict,getTraderRefundCheckHandler);
    function getTraderRefundCheckHandler(req,res){

        var filterCondition={
            startDate:req.query.startDate||'',
            endDate:req.query.endDate||'',
            refundReason:req.query.refundReason||'ALL',
            refundType:req.query.refundType||'ALL',
            refundStatus:req.query.refundStatus||'ALL',
            keyWord:req.query.keyWord||'',
            status:'VERIFIED'
        };
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            data.paginator = clientModel.restorePurePaginator(paginator);
            model.getListRefund(dbName, data, filterCondition, paginator, function(err, results) {
                if(err) {
                    logger.error(err);
                    res.render('error/500');
                }
                else {
                    res.render('customer/center/finance/refund_check.ejs',{data: results});
                }
            });
        })
    }

    /**财务同意 退款*/
    app.post(APPURL+'/refundCheckAccept', auth.restrict, financeAcceptVerifyHandler);
    function financeAcceptVerifyHandler(req,res){
        var refundId=req.body.refundId;
        var dbName = req.session.customer.customerDB;
        var operatorData=req.session.operator;
        var obj={
            operatorId:operatorData.operatorId,
            operatorName:operatorData.operatorName,
            mobile:operatorData.mobileNum,
            remark:req.body.remark,
            refundType:req.body.refundType
        };
        var isCredit=req.body.isCredit;

        model.financeStaffVerifyRefund(dbName,refundId,obj,function(err,result){
            var feedback=null;
           if(err){
               logger.error(err);
               feedback=new FeedBack(FBCode.INTERNALERROR,'内部错误,请稍后再试',null);
               res.json(feedback);
           }else{
               // 如果是授信用户恢复确认金额的授信余额
               if("true" == req.body.isCredit) {
                   model.putClientFinanceBalance(dbName, req.body.clientId, req.body.refundAmount, function(err, results) {
                       if(err) {
                           logger.error(err);
                           feedback=new FeedBack(FBCode.INTERNALERROR,'内部错误,请稍后再试',null);
                       }
                       else {
                           feedback=new FeedBack(FBCode.SUCCESS,'审核成功',results);
                       }
                       res.json(feedback);
                   });
               }
               else{
                   feedback=new FeedBack(FBCode.SUCCESS,'审核成功',result);
                   res.json(feedback);
               }
           }
        });
    }

    /**财务同意 退款*/
    app.post(APPURL+'/refundCheckReject',auth.restrict,financeRejectVerifyHandler);
    function financeRejectVerifyHandler(req,res){
        var refundId=req.body.refundId;
        var dbName = req.session.customer.customerDB;
        var operatorData=req.session.operator;
        var obj={
            operatorId:operatorData.operatorId,
            operatorName:operatorData.operatorName,
            mobile:operatorData.mobileNum,
            remark:req.body.remark
        };
        model.financeStaffRejectVerifyRefund(dbName,refundId,obj,function(err,result){
            var feedback=null;
            if(err){
                logger.error(err);
                feedback=new FeedBack(FBCode.INTERNALERROR,'内部错误,请稍后再试',null);
            }else{
                feedback=new FeedBack(FBCode.SUCCESS,'退回成功',result);
            }
            res.json(feedback);
        });
    }

    //退款审核详情 财务人员
    app.get(APPURL+'/refundCheckDetail',auth.restrict,getTraderRefundCheckDetailHandler);
    function getTraderRefundCheckDetailHandler(req,res){


        var refundNo=req.query.refundId;
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            data.paginator = clientModel.restorePurePaginator(paginator);
            model.getRefundDetail(dbName,refundNo,function(err,results){
                if(err){
                    logger.error(err);
                    res.render('error/500');
                }
                else{
                    data.refundInfo=results;
                    res.render('customer/center/finance/refund_check_detail.ejs',{data:data});
                }
            });

        })


    }


    /**
     * 提交结款数据
     */
    app.post(APPURL+'/creditSettle',auth.restrict,postCreditHandler);
    function postCreditHandler(req,res){
        logger.enter();
        var postData=req.body;
        var dbName = req.session.customer.customerDB;
        var operatorId=req.session.operator.operatorId;
        model.updateFinanceData(dbName,postData,operatorId,function(err,result){
            var feedback;
            if(err){
                logger.error(err);
                feedback=new FeedBack(FBCode.INTERNALERROR,'结款失败，请重新检查结款数据再提交');
                res.json(feedback);
            }else{
                feedback=new FeedBack(FBCode.SUCCESS,'结款成功',result);
                res.json(feedback);
            }

        });
    }

    //客服中心 审核退款列表
    app.get(APPURL+'/verifyRefund', auth.restrict, getVerifyRefundHandler);
    function getVerifyRefundHandler(req, res) {
        var filterCondition={
            startDate:req.query.startDate||'',
            endDate:req.query.endDate||'',
            refundReason:req.query.refundReason||'ALL',
            refundType:req.query.refundType||'ALL',
            refundStatus:req.query.refundStatus||'ALL',
            keyWord:req.query.keyWord||'',
            status:'CREATED'
        };
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            data.paginator = clientModel.restorePurePaginator(paginator);
            model.getListRefund(dbName, data, filterCondition, paginator, function(err, results) {
                if(err) {
                    logger.error(err);
                    res.render('error/500');
                }
                else {
                    res.render('customer/center/callcenter/refund_verify.ejs',{data: results});
                }
            });
        })
    }


    //客服 审核单个退款单
    app.get(APPURL+'/verifyRefundItem', auth.restrict,auth.restrict, getVerifyRefundItemHandler, message.postMsg);
    function getVerifyRefundItemHandler(req,res,next){

        var refundNo=req.query.refundId;
        var displayId=req.query.displayId;
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            data.paginator = clientModel.restorePurePaginator(paginator);
            model.getRefundDetail(dbName,refundNo,function(err,results){
                if(err){
                    logger.error(err);
                    res.render('error/500');
                }
                else{
                    data.refundInfo=results;
                    res.render('customer/center/callcenter/refund_verify_item.ejs',{data:data});
                    req.session.msg = message.makeMsg(null,null,__FEATUREENUM.FP_APPROVE_RETURN, "DOC_REFUND", refundNo, displayId, "您有新的退款单"+displayId+"待审核，去处理>");
                    return next();
                }
            });

        })


    }


    app.post(APPURL+'/postVerifyRefundItem',auth.restrict,postVerifyRefundCallCenterHandler);
    function postVerifyRefundCallCenterHandler(req, res) {
        logger.enter();
        var form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.uploadDir = __base + '/static/upload/';
        var imgRootUrl = '/static/upload/';
        form.keepExtensions = true;
        form.maxFieldsSize = 2 * 1024 * 1024;
        var parameters={};
        var urlArr = [];
        var dbName = req.session.customer.customerDB;
        var operatorData=req.session.operator;

        form.on('field', function (field, value) {
            parameters[field]=value;
        }).on('end',function(){
        });

        form.parse(req, function (err, fields, files) {
            if (err) {
                return;
            }
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

            urlArr=urlArr.length==0?'':urlArr.join(',');
            //获取operator信息

            var updateObj={
                amount:parameters['verifiedSum'],
                operatorId:operatorData.operatorId,
                operatorName:operatorData.operatorName,
                remark:parameters['verificationComment'],
                mobile:operatorData.mobileNum,
                attachmentUrl:urlArr
            };

            model.callCenterVerifyRefund(dbName,parameters['refundNo'],updateObj,function(err,result){
                if(err){
                    logger.error(err);
                    res.render('error/500');
                }
                else{
                    res.redirect('/customer/bill/verifyRefund');
                }
            });
        });
    }


    app.get(APPURL+'/viewRefundDetail', auth.restrict, getRefundDetailHandler);
    function getRefundDetailHandler(req, res) {
        var refundNo=req.query.refundId;
        logger.enter();
        var dbName = req.session.customer.customerDB;
        var paginator = clientModel.createPurePaginator(req);
        dataService.commonData(req, function (data) {
            data.paginator = clientModel.restorePurePaginator(paginator);
            model.getRefundDetail(dbName, refundNo, function(err,results){
                if(err){
                    logger.error(err);
                    res.render('error/500');
                }
                else{
                    data.refundInfo = results;
                    res.render('customer/center/callcenter/refund_detail.ejs', {data: data});
                }
            });
        })
    }
};