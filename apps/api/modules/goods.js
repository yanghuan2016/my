/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 * apiModule.js
 *
 */
var logger = __logService;

module.exports = function() {
    /**
     * Service
     */
    var logger = __logService;
    var db = __dbService;
    var underscore = require("underscore");
    var async = require('async');
    var apiModel = require( __base + "/apps/api/model");
    var model = new apiModel;
    /**
     *  modules
     */
    var apiModule = {

        /**
         * 同步ERP库存记录
          * @param data
         * @constructor
         */
        B2B_SKU_INVENTORY_UPDATE: function(data) {
            var msg = data.msg;
            var customerDBName = msg.customerDBName;
            var goodsId = msg.goodsId;
            var goodsInventoryData = {
                "showPlanId":msg.stock_case,
                "goodsBatchTime":msg.goodsBatchTime,
                "amount":msg.amount,
                "onSell":msg.onSell
            };
            var negSell = msg.negSell;
            db.updateGoodsInventoryById(customerDBName,goodsInventoryData,goodsId,function(err, affectedRows){
                if(!err){
                    db.updateGoodsNegSellById(customerDBName,negSell,goodsId,function(err2, affectedRows){
                        if (!err2) {
                            //todo
                        } else {
                            //todo
                        }
                    });
                }
            });
        },

        /**
         * @deprecated
         * ERP向SCC提交询价申请
         * SCC接收后存数据库并直接转发给对应的报价方ERP或存入QuotationDetails给WEB报价
         * @param data
         * @constructor
         */
        EDI_INQUIRY_CREATE_OLD : function(data){
            console.log('INQUIRY_CREATE:', data);
            var msg = data.msg;
            var userId = data.userId;
            var operatorId = data.operatorRobotId;
            var cloudDBName= __cloudDBName;
            logger.debug("enter GOODS QUOTATION");
            var erpMsgs = msg.msgData.PURCHASEPLANTEMP;
            logger.debug(JSON.stringify(erpMsgs));

            var inquiryIds = [];
            async.mapSeries(erpMsgs,
                function(erpMsg,mapCallback){
                    model.goodsQuotationOld(erpMsg,cloudDBName,userId,function(err,inqId){
                        if(err){
                            logger.error(err);
                            mapCallback();
                        }
                        if(inquiryIds.indexOf(inqId)==-1 && !underscore.isUndefined(inqId)){
                            inquiryIds.push(inqId);
                        }
                        mapCallback(null,inqId);

                    });
                },
                function(err,result){
                    if(err){
                        return logger.error(err);
                    }
                    logger.debug("生成询价单"+JSON.stringify(inquiryIds));
                    async.mapSeries(
                        inquiryIds,
                        function (inquiryId, mapCallback) {
                            model.sendQuotation( cloudDBName,userId, inquiryId, function (err, result) {
                                if (err) {
                                    logger.error(err);
                                } else {
                                    logger.debug("询价单No" + inquiryId + "  SEND quotation" + result);
                                }
                            });
                            mapCallback();
                        },
                        function(err,result){
                            if(err){
                                logger.error(err);
                            }
                            logger.debug(result)
                        });
                }

            );

        },

        EDI_INQUIRY_CREATE : function(data){
            var msg = data.msg;
            var userId = data.userId;
            var operatorId = data.operatorRobotId;
            var cloudDBName= __cloudDBName;
            logger.debug("enter EDI INQUIRY CREATE");
            var erpMsgs = msg.msgData.PURCHASEPLANTEMP;
            logger.debug(JSON.stringify(erpMsgs));

            var inquiryIds = [];
            async.mapSeries(erpMsgs,
                function(erpMsg,mapCallback){
                    model.goodsInquiry(erpMsg,cloudDBName,userId,function(err,inqId){
                        if(err){
                            logger.error(err);
                        }
                        if(inquiryIds.indexOf(inqId)==-1 && !underscore.isUndefined(inqId)){
                            inquiryIds.push(inqId);
                        }
                        mapCallback(null,inqId);

                    });
                },
                function(err,result){
                    if(err){
                        return logger.error(err);
                    }
                    logger.debug("生成询价单，单号："+JSON.stringify(inquiryIds));
                }
            );
        },

        /**
         * to completed
         * SCC接收报价方的报价数据并汇总后发给询价方(erp暂无此接口)
         * @param data
         * @constructor
         */
        EDI_QUOTATION_CREATED : function(data){

            var msg = data.msg;
            var userId = data.userId;
            model.returnQuotationResult(__cloudDBName,userId,msg,function (err,result) {
                if(err){
                    logger.error(err);
                    return;
                }else{
                    logger.debug("向ERP返回报价单结果:"+result);
                    return;
                }
            })
        }


    };
    return apiModule;
};

