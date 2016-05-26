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
 * data service
 *
 *      Provide the fundam4ental data service
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-12   hc-romens@issue#182
 * 2015-09-24   hc-romens@issue#47
 *
 */
module.exports=function() {

    /**
     * Constants
     */
    var REDIS_TTL_GOODSTYPES = 60*60*24;
    //var REDIS_TTL_GOODSTYPES=60;
    /**
     * system service handles
     */
    var logger  = __logService;
    var db      = __dbService;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");
    var moment = require('moment');
    var async = require('async');

    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;

    /**
     * Project modules
     */
    var purchaseListModel=require("../apps/portal/purchaseList/"+'model')();
    /**
     * Data Service provider
     */
    var helperFields;
    var helperFieldsForFullname;

    var dataService = {
        /**
         * commonData
         *      This methods aggreegates the needed data for all templates,
         *      like, logged-in operator name, Goods Types, Cart info, etc.
         *      all kv pairs generated in commonData() starts the key name
         *      with an underscore char ("_").
         * @param req
         * @param done  The callback function(data),
         *              data的格式为：
         *              {
         *                  _userInfo:  操作员信息,
         *                  _goodsTypes:商品分类,
         *                  _shoppingCart: 购物车信息
         *              }
         */
        commonData: function(req, done) {
            logger.enter();
            var data = {};
            async.series([
                    function(done){
                        //step1 getUserInfo
                        getUserInfo(req, data, function(result){
                            data = result;
                            done();
                        })
                    },
                    function(done) {
                        //step2 getClientInfo
                        getClientInfo(req, data, function (result) {
                            data = result;
                            done();
                        });
                    },
                    function(done){
                        //step3 getGoodsTypes
                        var customerDB =req.session.customer.customerDB;
                        getGoodsTypes(customerDB , data, function (err, result) {
                            data = result;
                            done();
                        })
                    },
                    function(done){
                        //step4  countCartItem
                        countCartItem(req, data, function (result) {
                            data = result;
                            done();
                        })
                    },
                    function(done){
                        //step5  staticData
                        staticData(req, data, function(result){
                            data = result;
                            done();
                        })
                    },
                    function(done){
                        //step6  getColumns
                        getColumns(req, data, function(error, result){
                            data = result;
                            done();
                        })
                    },
                    function(done){
                        //step7  getInventoryDetails
                        getInventoryDetails(req,data,function(error,result){
                            data = result;
                            done();
                        })
                    },
                    function(done){
                        //step8  getCustomerInfo
                        getCustomerInfo(req, data, function(error, result){
                            data = result;
                            done();
                        })
                    }
                ],
                function(errs,results){
                    data.entryFromOrderOnly = __entryFromOrderOnly;
                    data.pointDigit=__pointDigit;
                    data.msgCheckSec = __msgCheckSec;
                    done(data);
                }
            );
            //getUserInfo(req, data, function(data1){
            //    getClientInfo(req, data1, function(data2) {
            //        getGoodsTypes(req.session.customer.customerDB, data2, function (err, data3) {
            //            countCartItem(req, data3, function (data4) {
            //                staticData(req, data4, function(data5){
            //                    getColumns(req, data5, function(error, data6){
            //                        getInventoryDetails(req,data6,function(error,data7){
            //                            getCustomerInfo(req, data7, function(error, data8){
            //                                data8.entryFromOrderOnly = __entryFromOrderOnly;
            //                                data8.pointDigit=__pointDigit;
            //                                data8.msgCheckSec = __msgCheckSec;
            //                                done(data8);
            //                            })
            //                        });
            //                    });
            //                });
            //            });
            //        });
            //    });
            //});
        },
        /**
         * 根据GoodsTypesList，按照erpId，erpParentId，Level构建JSON树
         * 采用先查找定位，后插入的策略；查找用递归遍历的方法。
         * @param goodsTypesList
         */
        buildJSON: function(customerDBName, goodsTypesList, callback) {
        logger.enter();

        // 构建root node
        var root = {
            erpId: 0,
            parentErpId: 0,
            level: 0,
            name: "",
            fullname: "",
            isDeleted: false,
            children: []
        };
        helperFields = Object.keys(root);
        helperFieldsForFullname = helperFields.slice();
        delete helperFieldsForFullname[-1];
        delete helperFieldsForFullname[0];

        // 用来记录需要更新fullname的Erp记录
        var fullnamesChanged = [];

        async.mapSeries( goodsTypesList,
            function addIntoGoodsTypeTree(row, done) {
                var node = {
                    erpId: row.erpId,
                    parentErpId: row.parentErpId,
                    level: row.level,
                    name: row.name,
                    fullname: row.fullname,
                    isDeleted: row.isDeleted,
                    children:[]
                };

                // 插入树中
                addIntoTree(root, node);
                //logger.ndump("root", root);
                done();
            },
            function onFinish(err, results){
                logger.enter();
                //filterHelperFields(root);
                makeErpIdFullnameArray(root);
                //logger.ndump('fullnamesChanged', fullnamesChanged);
                db.updateGoodsTypeFullnames(customerDBName, fullnamesChanged, function(err, result){
                    if (err) {
                        logger.error("Failed to update GoodsTypes fullname in " + JSON.stringify(fullnamesChanged));
                    }
                    callback(root);
                });
            }
        );

        function makeErpIdFullnameArray(obj) {
            if (typeof(obj)!=='object')
                return;

            var tuple = [];
            if (!underscore.isEmpty(obj['erpId']) &&
                !underscore.isEmpty(obj['fullname']) &&
                obj['fullname'] !== "" ){
                tuple.push(obj['erpId']);
                tuple.push(obj['fullname']);
                fullnamesChanged.push(tuple);
            }
            Object.keys(obj).forEach(function(key){
                makeErpIdFullnameArray(obj[key]);
            });
        }

        // use a recursive way to relayout the goodsType in TREE hierarchy
        function addIntoTree(holderNode, node){
            /* set parentId to zero if level is zero */
            if (!node.level)
                node.parentErpId = 0;

            if (holderNode && (typeof holderNode === "object")) {
                if (holderNode.erpId == node.parentErpId) {
                    // 将node加入该holderNode中
                    //logger.ndump("holderNode", holderNode);
                    holderNode["children"].push(node);

                    // make the hierarchy name for this type
                    var newFullname = holderNode.fullname +
                        (holderNode.erpId? "{" + holderNode.erpId+ ">": "") +
                        node.name;
                    if ( node.fullname !== newFullname ) {
                        fullnamesChanged.push([node.erpId, newFullname]);
                        node.fullname = newFullname;
                    }
                } else {
                    underscore.each(holderNode.children, function(childNode){
                        addIntoTree(childNode, node);
                    });
                }
            }
        }

        function filterHelperFields(obj) {
            Object.keys(obj).forEach(function(key){
                if (helperFields.indexOf(key) >= 0) {
                    delete obj[key];
                } else {
                    filterHelperFields(obj[key]);
                }
            });
        }
    },

        /**
         * clearCommonData
         *      Remove the session related data
         * @param req
         */
        clearCommonData: function(req) {
            delete req.session.operator;
            delete req.session.client;
            delete req.session.goodsTypes;
            delete req.session.shoppingCart;
        },

        /**
         * 获取商品分类节点下的所有后代节点id
         * @param goodsTypeId
         * @param callback
         */
        getGoodsTypeDescendants: function(customerDBName, goodsTypeId, callback) {
            logger.enter();

            var goodsTypeIdList = [];
            /*
            if ( underscore.isUndefined(goodsTypeId)) {
                logger.footprint();
                return callback(null, goodsTypeIdList);
            }
            */

            logger.footprint();
            var data = {};
            getGoodsTypes(customerDBName, data, function (err, data) {
                logger.enter();

                var aNode = null;
                var found = false;

                findNode(data._goodsTypes, Number(goodsTypeId));
                if (aNode) {
                    addDescendants(aNode);
                }


                if (underscore.isEmpty(goodsTypeIdList)) {
                    callback(FBCode.NOTFOUND);
                } else {
                    callback(null, goodsTypeIdList);
                }

                /**
                 * Inner functions
                 */
                function findNode(node, goodsTypeId) {
                    //logger.enter();
                    //logger.ndump("erpId", node.erpId);
                    //logger.ndump("goodsTypeId", goodsTypeId);
                    if (node.erpId.toString() === goodsTypeId.toString()) {
                        aNode = node;
                        found = true;
                        logger.trace("found node <" + node.erpId + ">");
                        return;
                    }

                    underscore.each(node.children, function (child) {
                        if (found)
                            return;
                        findNode(child, goodsTypeId);
                    });
                }

                function addDescendants(node) {
                    goodsTypeIdList.push(node.erpId);
                    underscore.each(node.children, function (child) {
                        //logger.trace("adding node <" + child.erpId + ">");
                        addDescendants(child);
                    });
                }
            });
        }
    };

    /**
     * getUserInfo
     *      Get the operator info
     * @param req
     * @param data
     * @param done
     */
    function getUserInfo(req, data, done) {
        logger.enter();
        data._userInfo = req.session.operator;
        done(data);
    }

    /**
     * getClientInfo
     * @param req
     * @param data
     * @param done
     */
    function getClientInfo(req, data, done) {
        logger.enter();
        if (underscore.isEmpty(req.session.operator) || req.session.operator.operatorType !== 'CLIENT') {
            // not login or operator is not a CLIENT operator
            logger.footprint();
            data._client = undefined;
            done(data);
        } else if (underscore.isUndefined(req.session.client)){
            logger.footprint();
            // client尚未获得，需要从数据库中读取
            logger.ndump("operator", req.session.operator);
            if (underscore.isNaN(req.session.operator.clientId)) {
                logger.footprint();
                // operator.client 是NaN么？
                data._client = undefined;
                done (data);
            } else {
                logger.footprint();
                /* This is a CLIENT type operator */
                db.getClientById(req.session.customer.customerDB, req.session.operator.clientId, function (err,client) {
                    req.session.client = client;
                    data._client = client;
                    //查询购物清单
                    purchaseListModel.retrieveFavorList(req.session.customer.customerDB, req.session.operator.clientId, function(error, result){
                        if (error) {
                            logger.error(error);
                        } else {
                            data._client.purchaseList = result;
                            done(data);
                        }
                    });
                });
            }
        } else {
            logger.footprint();
            // load client object from session
            data._client = req.session.client; //update session in client/controller 594  not work
            // get info from DB again
            db.getClientById(req.session.customer.customerDB, req.session.operator.clientId, function (err,client) {
                req.session.client = client;
                data._client = client;
                //查询购物清单
                purchaseListModel.retrieveFavorList(req.session.customer.customerDB, req.session.operator.clientId, function(error, result){
                    if (error) {
                        logger.error(error);
                    } else {
                        data._client.purchaseList = result;
                        done(data);
                    }
                });
            });
            //done(data);
        }
    }

    /**
     * getGoodsTypes
     *      读取商品分类信息
     * @param customerDBName
     * @param data
     * @param done
     *
     * 1. check redis flag for reload goodstypes from db
     * 2. if not, read from redis
     * 3. if read fails, or need to reload, then load from DB, and save into redis
     */
    function getGoodsTypes(customerDBName, data, callback) {
        logger.enter();

        var CacheKeys = __cacheService.CacheKeys;
        // load cached GoodsTypes from redis
        __cacheService.get(CacheKeys.GoodsTypesInJSON, function (err, goodsTypes) {
            if(goodsTypes){
                var tempObj=JSON.parse(goodsTypes);
            }

            if (err == FBCode.SUCCESS && !underscore.isUndefined(goodsTypes)&&tempObj.children.length!=0) {
                data._goodsTypes = JSON.parse(goodsTypes);
                logger.debug("Reloading GoodsTypes from cache");
                callback(FBCode.SUCCESS, data);
            } else {
                // cache已经失效，重新从数据库中加载
                logger.debug("Reloading GoodsTypes from DB");
                db.listGoodsTypes(customerDBName, function (err, goodsTypesList) {
                    if (err) {
                        logger.sqlerr(err);
                        callback(FBCode.DBFAILURE, err);
                    } else {
                        dataService.buildJSON(customerDBName, underscore.sortBy(goodsTypesList, "displayOrder"), function (goodsTypes) {
                            __cacheService.set(CacheKeys.GoodsTypesInJSON, goodsTypes, __cacheService.TTL.SHORT,function(err,result){
                                if(err){logger.error(err)};
                                // set to data
                                data._goodsTypes = goodsTypes;
                                callback(FBCode.SUCCESS, data);
                            });
                        });
                    }
                });
            }
        });
    }

    function getColumns(req, data, callback) {
        db.linkColumnRetrieveAvailable(req.session.customer.customerDB, function (error, result) {
            logger.enter();
            if(error) {
                logger.error(error);
                callback(error);
            }
            data.linkColumns = underscore.sortBy(processLinkColumn(result),function(item){
                return Math.max(item.orderSeq);
            });
            callback(null, data);
        });
    }

    function getInventoryDetails(req, data, callback) {
        db.listGoodsInventoryPlanDetails(req.session.customer.customerDB, function (error, results) {
            logger.enter();
            if(error) {
                logger.error(error);
                callback(error);
            }
            data.inventoryDetails = results;
            callback(null, data);
        });
    }

    var processLinkColumn = function (linkColumn) {
        linkColumn = underscore.chain(linkColumn)
            .groupBy(function (item) {
                return item.columnId;
            })
            .values()
            .map(function(item) {
                var column = {
                    id: item[0].columnId,
                    name: item[0].columnName,
                    icon: item[0].columnIcon,
                    orderSeq: item[0].columnOrderSeq,
                    createdOn: moment(item[0].columnCreatedOn).format('YYYY-MM-DD')
                };
                column.links = underscore(item).map(function (item) {
                    return {
                        id: item.linkId,
                        name: item.linkName,
                        orderSeq: item.linkOrderSeq,
                        createdOn: moment(item.linkCreatedOn).format('YYYY-MM-DD'),
                        linkContentLength:item.linkContentLength
                    }
                });
                return column;
            })
            .sort(function(item){return item.orderSeq;})
            .value();
        return linkColumn;
    };

    /**
     *
      * @param req
     * @param data
     * @param done
     */
    function countCartItem(req, data, done) {
        logger.enter();
        //从session中读数据
        //if (!underscore.isUndefined(req.session._cartItemCount)) {
        //    data._cartItemCount = req.session._cartItemCount;
        //    done(data);
        //    return;
        //}
        if(underscore.isEmpty(req.session.operator) || req.session.operator.operatorType !== 'CLIENT') {
            data._cartItemCount = 0;
            //暂时不放入session
            //req.session._cartItemCount = 0;
            done(data);
            return;
        }
        var customerDBName = req.session.customer.customerDB;
        var clientId = req.session.operator.clientId;
        db.countCartItem(customerDBName, clientId, function (error, cartItemCount) {
            logger.enter();
            data._cartItemCount = cartItemCount;
            //暂时不放入session
            //req.session._cartItemCount = cartItemCount;
            done(data);
        });
    }

    /**
     * 加载数据库中状态字段对应的翻译表
     * @see db/ddl/customerDB/OrderInfo.sql
     * @param req
     * @param data
     * @param done
     */
    function staticData(req, data, done) {
        logger.enter();
        data._version = __version;
        var orderStatusDict = {};
        if(__entryFromOrderOnly){
            orderStatusDict = {                   // OrderInfo.status
                "UNPAID": "待支付",//待支付：去付款、取消订单、查看详情
                "PAID": "待审核",// 待审核：查看详情
                "APPROVED": "待发货",// 待发货：查看详情
                "SHIPPED": "已发货",//已发货：确认收货、发起退货、查看详情
                "FINISHED": "已收货",//已收货：申请退货、评价商品、查看详情
                'RETURNED':"有退货",//有退货：再次申请退货、查看详情
                "CLOSED": "已关闭" //已关闭：查看详情
            };
        }else{
            orderStatusDict = {
                "PAID": "已提交待审核",
                "UNPAID": "已提交待支付",
                "APPROVED": "已受理待发货",
                "SHIPPED": "商家已发货",
                'FINISHED':"已完成订单",
                "CLOSED": "已关闭订单"
            }
        }
        data._translation = {
            "OrderStatus" : orderStatusDict,   // OrderInfo.status
            "ReturnStatus" : {                 // ReturnInfo.status
                "CREATED": "退货待审核",
                "APPROVED": "退货审核通过",
                //"REJECTED": "审核未通过",
                "SHIPPED": "退货已发货",
                "DELIVERED": "退货已送达",
                "CLOSED": "退货已关闭"
            },
            "OrderAction": {                    // OrderHistory.action
                'CREATE': "创建订单",
                'PAID': "已支付" ,
                'PAID-FAIL':"支付失败",
                'APPROVE': "审核通过订单",
                'REJECT': "审核拒绝订单",
                'SHIP': "发货",
                'RECEIVE':	"收货",
                'REQUEST-RETURN': "申请退货",
                'APPROVE-RETURN': "批准退货申请",
                'REJECT-RETURN': "拒绝退货申请",
                'SHIP-RETURN': "退货发货",
                'RECEIVE-RETURN': "退货收货",
                'CLOSE': "关闭订单"
            },
            "PricePlan" : {                     // ClientGoodsPrice.pricePlan
                "WHOLESALE": "批发价",
                "PRICE1": "价格一",
                "PRICE2": "价格二",
                "PRICE3": "价格三",
                "CATEGORYPRICE": "客户类价格",
                "CLIENTPRICE": "客户价格"
            },
            "refundStatus":{
                "CREATED":"待处理",                 /* 新增退款单 */
                "VERIFIED":"待财务审核",                /* 客服已确认 */
                "APPROVED":"待出纳退款",                /* 财务已审核 */
                "EXECUTED":"退款中",                /* 退款出纳已执行 */
                "SUCCESS":"退款成功",                /* 退款出纳已执行 */
                "FAILED":"退款失败"                   /* 退款执行失败 */
            },
            "refundType":{
                "REDFLUSH":"冲红退款",
                 "REFUND":"现金退款"
            },
            "refundReason":{
                "ORDER_CLOSED":"订单被关闭",
                //"ORDER_CANCEL":"客户取消订单",            /* 客户取消订单 */
                "ORDER_NOT_APPROVE":"订单未通过审核",       /* 订单未通过审核 */
                "GOODS_NOT_ENOUGH":"发货量不足",        /* 发货不足量 */
                "GOODS_WHOLE_REJECTED":"整单被拒收",    /* 整单被拒收 */
                "RETURN_RECEIVED":"退货"          /* 退货已确认入库 */
            },
            StatementMonthlyStatus:{
                "PENDING":   "未出账单",
                "UNCLEARED":  "未结清 ",
                "CLEARED":   "已结清"
            },
            StatementMonthDetailDigest:{
                "BILL_RECEIVABLE":"应收款 ",
                "BILL_REDFLUSH":"红冲 ",
                "BILL_PREPAY":"预收款" ,
                "BILL_REFUND":"退款 " ,
                "BILL_CLEAR":"结款 " ,
                "BILL_SHIP":"发货款"
            },
            StatementMonthDetailPaymentType:{
                "ONLINE":"在线支付",
                "CREDIT":"授信支付",
                "COD":"货到付款"

            }
        };
        done(data);
    }

    /**
     * 加载商户信息，页脚的证照/客服电话等
     * @param req
     * @param data
     * @param done
     */
    function getCustomerInfo(req, data, done){
        db.getAllLicences(req.session.customer.customerDB, function(error, results){
            if( error ) {
                done(error);
                return;
            }
            data._customerInfo = {
                licences: results
            };
            db.getAllContractPhone(req.session.customer.customerDB, function(err, phones){
                if( err ){
                    done(err);
                    return;
                }
                data._customerInfo.contracts = phones;
                done(null, data);
            });
        });
    }

    return dataService;
};