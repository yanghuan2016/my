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
 * goodBasicInfo_controller.js
 *
 * 产品信息展示controller
 * --------------------------------------------------------------
 * 2015-09-15	hc-romens@issue#17	增加产品列表
 *
 */

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
    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;
    var async = require('async');
    /*
     * load project modules
     */
    var auth = require(__base + '/modules/auth');
    var URL = require('url');
    /*
     * init app name etc
     */
    var APPNAME = __dirname.split(path.sep).pop();
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
    app.get(APPURL + "/goodsList", getGoodsListHandler);
    /**
     * 获取商品列表
     * @param req
     * @param res
     */
    function getGoodsListHandler(req, res) {
        logger.enter();
        var paginator = model.createOnSellGoodsPaginator(req);
        paginator.findGoodsNo = true;
        var customerDB = req.session.customer.customerDB;
        var nextToUrl = req.query.nextToUrl;
        var clientId = undefined;
        var operatorType = undefined,
            filterKey = req.query.kav || '';
        if (req.session && req.session.operator) {
            operatorType = req.session.operator.operatorType;
            clientId = (operatorType == "CUSTOMER") ? undefined : req.session.operator.clientId;
        }
        var goodsTypeId = Number(req.query.cav) | 0;
        var IdObj = {
            clientId: clientId
        };
        dataService.commonData(req, function (data) {
            model.loadGoods(customerDB, goodsTypeId, IdObj, paginator, function (err, products) {
                if (err) {
                    res.render("/error/500");
                } else {
                    data['paginator'] = model.restorePaginator(paginator);
                    data['paginator'].cav = req.query.cav || '0';
                    data['nextToUrl'] = nextToUrl;
                    data['filterKey'] = filterKey;
                    res.render('customer/public/selectProductDialog', {data: data, products: products});
                }
            });
        });
    }

    app.get(APPURL + "/detail", getDetailHandler);
    /**
     * 获取商品详情
     * @param req
     * @param res
     */
    function getDetailHandler(req, res) {
        logger.enter();
        var goodsId = req.param('goodsId');
        var customerDBName = req.session.customer.customerDB;
        var clientId = undefined;
        var operatorType = undefined;
        if (req.session && req.session.operator) {
            operatorType = req.session.operator.operatorType;
            clientId = (operatorType == "CUSTOMER") ? undefined : req.session.operator.clientId;
        }
        dataService.commonData(req, function (data) {
            model.getGoodsDetails(customerDBName, goodsId, clientId, function (err, results) {
                if (err) {
                    res.redirect('404');
                } else {
                    data.goods = results;
                    res.render('customer/goods/detail', {data: data});
                }
            });
        });
    }

    app.get(APPURL, goodsHandler);
    /**
     *  显示产品中心
     *
     *  load all goods categories
     *  load goods info
     */
    function goodsHandler(req, res) {
        logger.enter();

        var nextTo = req.param('nextTo');
        if (!nextTo)
            nextTo = APPURL;
        nextTo = encodeURIComponent(nextTo);

        var filterKey = req.query.sf;


        var paginator = model.createOnSellGoodsPaginator(req);
        paginator.findGoodsNo = true;

        var customerDBName = req.session.customer.customerDB;
        var clientId = undefined;
        var operatorType = undefined;

        if (req.session && req.session.operator) {
            operatorType = req.session.operator.operatorType;
            clientId = (operatorType == "CUSTOMER") ? undefined : req.session.operator.clientId;
        }
        logger.ndump('Goods-New-paginator:', paginator);
        logger.ndump('req.customerDB:', customerDBName);
        var goodsTypeId = Number(req.query.cav) | 0;
        var IdObj = {
            clientId: clientId
        };
        dataService.commonData(req, function (data) {
            model.loadGoods(customerDBName, goodsTypeId, IdObj, paginator, function (err, products) {
                if (err) {
                    logger.error(err);
                    res.render("/error/500");
                } else {
                    data['products'] = products;
                    data['paginator'] = model.restorePaginator(paginator);
                    data['paginator'].cav = req.query.cav || '0';

                    data['nextTo'] = nextTo;
                    data['sf'] = filterKey;
                    //logger.dump(JSON.stringify(data._goodsTypes));

                    var goodTypeName = '';
                    var currentQueryParams = URL.parse(req.url).query;
                    if (goodsTypeId != 0) {
                        goodTypeName = getCategoryNameByCategoryId(data._goodsTypes.children, goodsTypeId);
                    }
                    data['currentTypeName'] = goodTypeName;
                    data['currentQueryParams'] = currentQueryParams;
                    data['nextTo'] = nextTo;
                    res.render('customer/goods/goods', {data: data});
                }
            });
        });
    }

    app.get(APPURL + "/showcase", showcaseGoodsHandler);
    /**
     * //LIST橱窗筛选商品所需要的 controller
     * @param req
     * @param res
     */
    function showcaseGoodsHandler(req, res) {
        logger.enter();

        var nextTo = req.param('nextTo');
        if (!nextTo)
            nextTo = APPURL;
        nextTo = encodeURIComponent(nextTo);

        var paginator = model.createOnSellGoodsPaginator(req);
        paginator.findGoodsNo = true;
        var showcaseGoodsIds = req.query.ids;

        var customerDBName = req.session.customer.customerDB;
        var clientId = undefined;
        var operatorType = undefined;

        if (req.session && req.session.operator) {
            operatorType = req.session.operator.operatorType;
            clientId = (operatorType == "CUSTOMER") ? undefined : req.session.operator.clientId;
        }
        logger.ndump('Goods-New-paginator:', paginator);
        logger.ndump('req.customerDB:', customerDBName);
        var IdObj = {
            clientId: clientId
        };
        if (!underscore.isUndefined(showcaseGoodsIds) && showcaseGoodsIds != "") {
            //过滤掉商品
            IdObj.exculuedIds = showcaseGoodsIds;
        }
        /* load commonData */
        dataService.commonData(req, function (data) {
            //由于橱窗选择商品 需要过滤掉已经选择过的商品,但是不能在做分页之后再来过滤,故将已经存在的商品ID传入数据库层过滤
            model.getGoods(customerDBName, IdObj, paginator, function (error, goods) {
                if (error) {
                    logger.error("error query: " + error + ", " + error.stack);
                    return;
                }
                var goodsList = [];
                var planDetails = data.inventoryDetails;
                logger.ndump("planDetails", planDetails);
                async.mapSeries(
                    goods,
                    function (item, callback) {
                        item.storage = item.amount;
                        //按库存显示方案更新显示信息
                        item.content = '暂无信息';
                        for (var i = 0; i < planDetails.length; i++) {
                            if (item.showPlanId == planDetails[i].goodsInventoryPlanId) {
                                if (Number(item.amount) < Number(planDetails[i].threshold)) {
                                    item.content = planDetails[i].content == "实际数量" ? item.amount : planDetails[i].content;
                                    break;
                                }
                            }
                        }
                        goodsList.push(item);
                        callback(null, item);
                    },
                    function (err, results) {
                        if (err) {
                            res.render("/error/500");
                        } else {
                            data['products'] = goodsList;
                            data['paginator'] = model.restorePaginator(paginator);
                            data['nextTo'] = nextTo;
                            res.render('customer/portal/chooseGoods', {data: data});

                        }


                    });
            });
        });
    }

    app.get(APPURL + "/showcaseIcon", showcaseIconGoodsHandler);
    /**
     * ICON橱窗筛选商品所需要的 controller
     * @param req
     * @param res
     */
    function showcaseIconGoodsHandler(req, res) {
        logger.enter();

        var nextTo = req.param('nextTo');
        if (!nextTo)
            nextTo = APPURL;
        nextTo = encodeURIComponent(nextTo);

        var paginator = model.createOnSellGoodsPaginator(req);
        paginator.findGoodsNo = true;
        var showcaseGoodsIds = req.query.ids;

        var customerDBName = req.session.customer.customerDB;
        var clientId = undefined;
        var operatorType = undefined;

        if (req.session && req.session.operator) {
            operatorType = req.session.operator.operatorType;
            clientId = (operatorType == "CUSTOMER") ? undefined : req.session.operator.clientId;
        }
        logger.ndump('Goods-New-paginator:', paginator);
        logger.ndump('req.customerDB:', customerDBName);
        var IdObj = {
            clientId: clientId
        };
        if (!underscore.isUndefined(showcaseGoodsIds) && showcaseGoodsIds != "") {
            //过滤掉商品
            IdObj.exculuedIds = showcaseGoodsIds;
        }

        /* load commonData */
        dataService.commonData(req, function (data) {
            //由于橱窗选择商品 需要过滤掉已经选择过的商品,但是不能在做分页之后再来过滤,故将已经存在的商品ID传入数据库层过滤
            model.getGoods(customerDBName, IdObj, paginator, function (error, goods) {
                if (error) {
                    logger.error("error query: " + error + ", " + error.stack);
                    return;
                }
                var goodsList = [];
                var planDetails = data.inventoryDetails;
                logger.ndump("planDetails", planDetails);
                async.mapSeries(
                    goods,
                    function (item, callback) {
                        item.storage = item.amount;
                        //按库存显示方案更新显示信息
                        item.content = '暂无信息';
                        for (var i = 0; i < planDetails.length; i++) {
                            if (item.showPlanId == planDetails[i].goodsInventoryPlanId) {
                                if (Number(item.amount) < Number(planDetails[i].threshold)) {
                                    item.content = planDetails[i].content == "实际数量" ? item.amount : planDetails[i].content;
                                    break;
                                }
                            }
                        }
                        goodsList.push(item);
                        callback(null, item);
                    },
                    function (err, results) {
                        if (err) {
                            res.render("/error/500");
                        } else {
                            data['products'] = goodsList;
                            data['paginator'] = model.restorePaginator(paginator);
                            data['nextTo'] = nextTo;
                            res.render('customer/portal/chooseGoodsIcon', {data: data});

                        }


                    });
            });
        });
    }

    app.post(APPURL + "/goodsAddList", postGoodsAddListHandler);
    /**
     * 更新商品常购清单
     * @param req
     * @param res
     */
    function postGoodsAddListHandler(req, res) {
        logger.enter();
        var data = req.body.list;
        var goodsId = data[0][0];
        var customerDBName = req.session.customer.customerDB;
        var clientId;
        if (req.session && req.session.operator) {
            var operatorType = req.session.operator.operatorType;
            clientId = (operatorType == "CUSTOMER") ? undefined : req.session.operator.clientId;
        }
        model.putGoodsFaovrList(customerDBName, goodsId, clientId, data, function (err, result) {
            if (err) {
                res.json(new FeedBack(FBCode.DBFAILURE, "加入清单失败"));
            } else {
                res.json(new FeedBack(FBCode.SUCCESS, "加入清单成功"));
            }
        });
    }

    /**
     * 辅助方法，根据分类Id获取数组的分类名字
     * @param typeArray
     * @param erpId
     * @returns {undefined}
     */
    function getCategoryNameByCategoryId(typeArray, erpId) {
        var fullname = undefined;
        for (var i = 0; i < typeArray.length; i++) {
            if (typeArray[i].erpId == erpId) {
                fullname = typeArray[i].fullname;
                break;
            }
            if (typeArray[i].children.length != 0) {
                fullname = getCategoryNameByCategoryId(typeArray[i].children, erpId);
            }
            if (fullname != undefined) {
                break;
            }
        }
        return fullname;
    }

};