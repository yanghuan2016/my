/**
 * Created by kevin on 16-2-1.
 */

module.exports = function (app) {

    //service
    var logger = __logService;

    //third library
    var path = require('path');
    var underscore = require("underscore");

    //customered library
    var auth = require(__modules_path + '/auth');
    var myPath = require(__modules_path + "/mypath");
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var Feedback = feedback.FeedBack;
    var hasher = require('password-hash-and-salt');

    var APPNAME = myPath.getAppName(__dirname);
    var APPURL = "/" + APPNAME;
    var model = require( __dirname + "/model")();
    logger.trace("Initiating APP:[" + APPNAME + "]@" + APPURL);

    app.get(APPURL + '/getUserInfo', getOperatorHandler);
    /**
     * 获取个人信息
     * @param req
     * @param res
     * @param next
     */
    function getOperatorHandler(req, res, next) {
        logger.enter();
        logger.debug(JSON.stringify(req.session));
        var customerDB = req.session.customer.customerDB;
        var operatorId=req.session.operator.operatorId;
        var dbConnect = __mysql;
        var condition = {id:Number(operatorId)};
        model.getOperatorInfo(dbConnect,customerDB,condition,function(err,OperatorInfo){
               if(err){
                   feedback = new Feedback(FBCode.DBFAILURE, '内部错误', {});
                   res.json(feedback);
               } else{
                   feedback = new Feedback(FBCode.SUCCESS, '查询成功', OperatorInfo);
                   res.json(feedback);
               }
        });
    }

    app.post(APPURL + '/updateBasicInfo', updateBasicOperatorInfoHandler);
    /**
     * 更新基本信息
     * @param req
     * @param res
     * @param next
     */
    function updateBasicOperatorInfoHandler(req, res, next) {
        var customerDB = req.session.customer.customerDB;
        var updateInfo = req.body;
        var operatorId = req.session.operator.operatorId;
        logger.debug(JSON.stringify(updateInfo));


        var dbConnect = __mysql;
        var feedback;
        var condition = {id:Number(operatorId)};
        model.updateOperatorBasicInfo(dbConnect,customerDB,updateInfo,condition,function(err,result){
            if(err){
                logger.error(err);
                feedback = new Feedback(FBCode.DBFAILURE, '内部错误', {});
                res.json(feedback);
            }else{
                logger.debug(JSON.stringify(result));
                feedback = new Feedback(FBCode.SUCCESS, '更新成功', updateInfo);
                res.json(feedback);
            }
        });

    }

    app.post(APPURL + '/validateUserOldPwd', validateOldPwdHandler);
    /**
     * 验证用户旧密码
     * @param req
     * @param res
     * @param next
     */
    function validateOldPwdHandler(req, res, next) {
        logger.enter();
        logger.debug(JSON.stringify(req.body));
        var password = req.body.pwd;
        var customerDB = req.session.customer.customerDB;
        var operatorId = req.session.operator.operatorId;
        var dbConnect = __mysql;
        var feedback;
        var condition = {id:Number(operatorId)};

        hasher(password).hash(function(err1, hashedPwd) {
            if (err1) {
                logger.error(err1);
                feedback = new Feedback(FBCode.INTERNALERROR, "加密失败, 请稍后重试");
                return res.json(feedback)
            }
            //todo add right hasher remove this
            if(password == "123456"){
                hashedPwd = "pbkdf2$10000$246bbfb18c08787c22a284d96b6f06205d84404634f32474c10e77d6ecd40bb2143ee3c49b1737000464b43cc70224039a1c1c26bb9f814b2a20809f02bc319c$8c1e3785596479a82ff0a3fc910b25e578c47ceed46f97b3a9ea1e9e74349c392001be2e9c57b3b36e38aae6d264d9c0cebe0f746491c886cb6e3ecdda68bd8f";
            }
            //todo remove above test hashpwd
            model.verifyPwd(dbConnect,customerDB,hashedPwd,condition,function(err,isSucc){
                if(!err){
                    var msg =isSucc?"旧密码输入正确":"旧密码输入错误";
                    feedback = new Feedback(FBCode.SUCCESS,msg , {});
                    res.json(feedback)
                }else{
                    feedback = new Feedback(FBCode.DBFAILURE, '网络错误,请稍后再试', {});
                    res.json(feedback)
                }
            });
        });


    }

    app.post(APPURL + '/updatePwd', updatePwdHandler);
    /**
     * 更新密码
     * @param req
     * @param res
     * @param next
     */
    function updatePwdHandler(req, res, next) {
        logger.enter();
        logger.debug(JSON.stringify(req.body));
        var password = req.body.pwd;
        var customerDB = req.session.customer.customerDB;
        var operatorId = req.session.operator.operatorId;
        hasher(password).hash(function(err1, hashedPwd) {
            if (err1) {
                logger.error(err1);
                feedback = new Feedback(FBCode.INTERNALERROR, "加密失败, 请稍后重试");
                return res.json(feedback)
            }
            logger.debug(hashedPwd);
            //todo next
        });
        var dbConnect = __mysql;
        var feedback;
        var condition = {id:Number(operatorId)};
        //更新密码
        model.updateOperatorPwd(dbConnect,customerDB,hashedPwd,condition,function(err,isSucc){
            if(!err && isSucc){
                feedback = new Feedback(FBCode.SUCCESS, '更新密码成功');
            }else{
                feedback = new Feedback(FBCode.DBFAILURE, '更新密码失败了');
            }
            res.json(feedback);
        });
    }

    app.get(APPURL + '/getAllQuotation', /*auth.restrict, */ pendingQuotationHandler);
    /**
     *获取所有的报价单
     *
     *
     *判断是否已报价通过筛选：根据quotationPrice是否为空
     * 这个列表包含两个大类,已报价finished 和 未报价pending
     *
     */
    function pendingQuotationHandler(req, res, next) {
        logger.enter();
        var customerDB = req.session.customer.customerDB;
        var dbConnect = __mysql;
        var feedback;
        var condition = {};

        model.listAllQuotationDetails(dbConnect,customerDB,condition,function(err,data){
            if(!err) {
                logger.debug(JSON.stringify(data));
                feedback = new Feedback(FBCode.SUCCESS, "查询成功", data);
                logger.debug(JSON.stringify(feedback));
                res.json(feedback);
            } else {
                feedback = new Feedback(FBCode.DBFAILURE, '内部错误', null);
                res.json(feedback);
            }
        });

    }

    app.get(APPURL + '/:id', getQuotationDetailHandler);
    /**
     * 获取某个特定的询价单详细信息
     */
    function getQuotationDetailHandler(req, res, next) {
        logger.enter();

        var customerDB = req.session.customer.customerDB;
        var inquiryId = req.params.id;
        var dbConnect = __mysql;
        var feedback;

        if(inquiryId){
            var condition = {inquiryId:inquiryId};
            logger.ndump("inquiryId: " + inquiryId);
            model.getQuoationDetailsByCondition(dbConnect,customerDB,condition,function(err,data){
                if(!err){
                    logger.ndump("data: " + data);
                    feedback = new Feedback(FBCode.SUCCESS, "查询成功", data);
                    res.json(feedback);
                } else{
                    feedback = new Feedback(FBCode.DBFAILURE, '内部错误', null);
                    res.json(feedback);
                }
            })
        } else {
            res.json(new Feedback(FBCode.INVALIDDATA, '缺少参数'))
        }

    }

    app.post(APPURL + '/quotationUpdate', postQuotationUpdateHandler);
    /**
     * 更新报价单
     * @param req
     * @param res
     * @param next
     */
    function postQuotationUpdateHandler(req, res, next) {
        logger.enter();
        var data = req.body;
        //过滤传递过来的数据:
        logger.debug(JSON.stringify(data));
        var updateData = [];
        var customerDB = req.session.customer.customerDB;
        var customerId = req.session.customer.customerId;
        data.quotaGoods.map(function (item) {
            var tempObj = {
                quotationId:item.quotationId,
                goodsNo: item.goodsNo,
                quotationQuantity: item.quoteNum,
                quotationPrice: item.quotePrice
            };
            updateData.push(tempObj);
        });
        var dbConnect = __mysql;
        var feedback;
        model.updateQuotationDetails(dbConnect,customerDB,updateData,function(err,results){
           if(!err){
               model.sendQuotationResult(dbConnect,customerDB,customerId,data,function(err,results){
                   logger.debug(JSON.stringify(results));
                   var sendResult = "发送报价结果"+JSON.stringify(results);
                   feedback=new Feedback(FBCode.SUCCESS,'修改成功'+sendResult);
                   res.json(feedback);
               });
           } else{
               feedback=new Feedback(FBCode.DBFAILURE,'修改失败');
               res.json(feedback);
           }
        });
    }

    app.post(APPURL+'/queryQuation',postQuotationHandler);
    /**
     * 提交报价信息
     * @param req
     * @param res
     * @param next
     */
    function postQuotationHandler(req,res,next){
        logger.enter();
            var filterCondition=req.body;

            var customerDB = req.session.customer.customerDB;
            var dataStr= filterCondition.name;//客户名 或者 询价单号
            var startValue= (new Date(filterCondition.startValue)).toLocaleString(); //起始时间
            var endValue  = (new Date(filterCondition.endValue)).toLocaleString();     //终止时间

            var conditions = {
                orData: {buyerName:dataStr,inquiryId:dataStr},
                andData: {keyStr:"createdOn",startValue:startValue,endValue:endValue}
            };

            var dbConnect = __mysql;
            var feedback;
            model.queryQuotation(dbConnect,customerDB,conditions,function(err,results){
                if(err){
                    feedback=new Feedback(FBCode.DBFAILURE,'查询出错', data);
                    res.json(feedback);
                }else{
                    feedback=new Feedback(FBCode.SUCCESS,'查询成功', data);
                    res.json(feedback);
                }
            }) ;

    }

};