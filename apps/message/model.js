/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/
module.exports = function () {
    var logger = __logService;
    var db = __dbService;
    var MODELNAME = __dirname.split("/").pop();

    var underscore = require("underscore");
    var moment = require('moment');
    var async = require('async');
    var Paginator = require(__base + "/modules/paginator");
    var KeyMapper = require(__base + '/modules/fieldNameMapper');
    var FieldNameMapper = require(__base + '/modules/fieldNameMapper');
    var hasher = require('password-hash-and-salt');
    logger.trace("Initiating model:[" + MODELNAME + "]");
    var messageFieldMapper = new FieldNameMapper({
        'docType': '相关单据类型',
        'createdOn': '申请时间',
        'messageBody': '消息体',
        'status': '消息状态'
    });
    var model = {
        /**
         *
         * @param dbName
         * @param operator
         * @param paginator
         * @param callback
         */
        getClientMessage: function(dbName,operator,paginator,callback){
            logger.enter();
            var startPos = (paginator.page-1)*paginator.pageSize;
            var offset = paginator.pageSize;
            var clientId = operator.clientId;
            logger.debug("clientId="+clientId);
            db.listClientMessages(dbName,paginator,clientId, startPos, offset, function(err,results){
                callback(err,results);
            })
        },


        setClientNotificationRead:function(dbName,operator,msgId,docType,docId,callback){
            logger.enter();
            var redirectClientMap = {
                "DOC_ORDER":"/order/detail?orderId="+docId,   /* 订单相关的通知 */
                "DOC_SHIP":"/order/detail?orderId="+docId,    /* 发货单相关通知 */
                "DOC_RETURN":"/order/return/detail?returnId="+docId,  /* 退货相关通知 */
                "DOC_REFUND":"/message",  /* todo to build 退款相关通知 */
                "DOC_COMPLAIN":"/message",/* todo to build 投诉建议相关通知 */
                "DOC_ACCOUNT":"/portal/personal/gsp", /* 证照客户资料相关通知 */
                "DOC_OTHER": "/message"   /* 其他客户通知 */
            };
            var operatorId = operator.operatorId;
            db.updateMessageStatus(dbName,msgId,operatorId,function(err,result){
                if(err){
                    callback(err);
                }else{
                    logger.trace("update message status success,msgId="+msgId);
                    var redirectUrl = redirectClientMap[docType];
                    callback(null,redirectUrl);
                }
            });
        },

        createMessagesPaginator: function (req) {
            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'Messages';

            var categoryA = {};
            var categoryB = {};
            var keywordA = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryField: messageFieldMapper.convertToField(req.query.caf) || "docType",
                categoryValue: req.query.cav || "%",
                categoryBField: messageFieldMapper.convertToField(req.query.cbf) || "status",
                categoryBValue: req.query.cbv || "%",
                keywordField: messageFieldMapper.convertToField(req.query.kf) || "messageBody",
                keywordValue: req.query.kv || "%",
                sortField: messageFieldMapper.convertToField(req.query.sf) || "createdOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isNaN(param.categoryValue) && !underscore.isEmpty(param.categoryField)) {
                categoryA.field = param.categoryField;
                categoryA.value = param.categoryValue;
            }
            if (!underscore.isNaN(param.categoryBValue) && !underscore.isEmpty(param.categoryBField)) {
                categoryB.field = param.categoryBField;
                categoryB.value = param.categoryBValue;
            }
            if (!underscore.isEmpty(param.keywordField) && !underscore.isEmpty(param.keywordValue) || !underscore.isEmpty(param.keywordBValue)) {
                keywordA.field = param.keywordField;
                keywordA.value = param.keywordValue;
                keywordA.tableName = tableName
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
            }
            if (typeof param.page == 'number') {
                p = param.page;
            }
            if (typeof param.pageSize == 'number') {
                ps = param.pageSize;
            }

            if (!underscore.isEmpty(categoryA)) {
                categoryList.push(categoryA);
            }
            if (!underscore.isEmpty(categoryB)) {
                categoryList.push(categoryB);
            }
            if (!underscore.isEmpty(keywordA)) {
                keywordList.push(keywordA);
            }
            if (!underscore.isEmpty(s)) {
                sort = s;
            }
            if (!underscore.isNaN(p)) {
                page = p;
            }
            if (!underscore.isNaN(ps)) {
                pageSize = ps;
            }
            return new Paginator(categoryList, keywordList, sort, page, pageSize);
        },

        restoreMessagesPaginator: function (paginator) {
            var p = {};
            logger.debug(JSON.stringify(paginator.categoryList));
            p.caf = messageFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cav = paginator.categoryList[0].value;
            p.cbf = messageFieldMapper.convertToAlias(paginator.categoryList[1].field);
            p.cbv = paginator.categoryList[1].value;
            p.kf = messageFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kv = paginator.keywordList[0].value;
            p.sf = messageFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            return p;
        }
    };
    return model;
};
