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
 * model.js
 *
 * 产品信息展示model
 * --------------------------------------------------------------
 * 2015-10-08   hc-romens@issue#79  added addGoodsPrice method
 * 2015-09-21	hc-romens@issue#18  created
 *
 */

module.exports = function () {
    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;

    /*
     * init model name etc
     */
    var MODELNAME = __dirname.split("/").pop();

    var underscore = require("underscore");
    var async = require("async");
    var Paginator = require(__base + '/modules/paginator');
    var FieldNameMapper = require(__base + '/modules/fieldNameMapper');

    var goodsFieldMapper = new FieldNameMapper({
        'commonName': '商品名',
        'goodsType': '产品类别',
        'goodsNo': '货号',
        'alias': '别名',
        'licenseNo': '批准文号',
        'producer': '生产企业',
        'boughtTimes':'人气',
        'boughtAmount':'销售额',
        'isNationalMedicine':'基药',
        'isMedicalInsuranceDrugs':'医保',
        'isPrescriptionDrugs':'处方',
        'price': '客户价格',
        'isSplit': '可拆零',
        'updatedOn': '更新时间',
        'refRetailPrice': '零售价格'
    });

    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {

        /**
         * 添加商品的常购清单
         * @param customerDBName
         * @param goodsId
         * @param clientId
         * @param data
         * @param callback
         */
        putGoodsFaovrList: function(customerDBName,goodsId,clientId,data,callback){
            logger.enter();
            db.getFavorIdByClientIdAndGoodId(customerDBName,goodsId,clientId,function(err,result){
                if(err){
                    callback(err);
                }else{
                    if(underscore.isEmpty(result)){
                        db.mateUpdateListByGoods(customerDBName, data, function(err,result){
                            callback(err,result)
                        })
                    }else{
                        db.deleteOldListByGoodsId(customerDBName, goodsId, result.favorId, function (err,result) {
                            db.mateUpdateListByGoods(customerDBName, data, function (err2,result) {
                                if(err||err2){
                                    callback("add favor list err");
                                }else{
                                    callback(null,"add favor list success");
                                }
                            });
                        })
                    }
                }
            })
        },

        /**
         * 根据查询条件取得商品数据,并做出分页处理
         * @param customerDBName
         * @param IdObj
         * @param paginator
         * @param callback
         */
        getGoods: function (customerDBName, IdObj, paginator, callback) {
            logger.enter();
            //前台显示的商品都是上架商品，所以isOnSell = 1;
            var isOnSell = 1;
            db.listOnSellGoods(customerDBName, IdObj, isOnSell, paginator, function (err, goods) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err);
                }else{
                    goods = underscore.isEmpty(goods) ? {} : goods;
                    var results = [];
                    for (var i in goods) {
                        var good = goods[i];
                        Object.keys(good).forEach(function (key) {
                            if(good[key]!=0){
                                good[key] = good[key] || "";
                            }
                        });
                        results.push(good);
                    }
                    callback(null, results);
                }
            });
        },

        /**
         * 查询商品的详情数据
         * @param customerDBName
         * @param goodsId
         * @param clientId
         * @param callback
         */
        getGoodsDetails : function (customerDBName,goodsId,clientId, callback){
            db.getGoodsDetail(customerDBName, goodsId,clientId, function (goods) {
                db.listGoodsTypesById(customerDBName, goodsId, function(err, goodsTypeList) {
                    if(underscore.isEmpty(goods)) {
                        callback("404");
                    }else{
                        goods['goodsType'] = goodsTypeList;
                        callback(err,goods);
                    }
                })
            })
        },

        loadGoods: function(customerDBName, goodsTypeId, IdObj, paginator, callback) {
            /* load commonData */
            logger.ndump("goodsTypeId", goodsTypeId);
                var goodsTypeIds = [];
                var inventoryPlanDetail = [];
                var goodsList = [];
                async.series(
                    [
                        function fetchGoodsTypeDescendants(done){
                            logger.enter();
                                __dataService.getGoodsTypeDescendants(customerDBName, goodsTypeId, function (err, data) {
                                    if (err) {
                                        logger.error(err);
                                    } else {
                                        goodsTypeIds = data;
                                        logger.ndump("goodsTypeIds", goodsTypeId);
                                    }
                                    done();
                                });
                        },

                        function fetchGoodsInventoryPlanDetails(done) {
                            logger.enter();
                            db.listGoodsInventoryPlanDetails(customerDBName, function(err, data){
                                if (err){
                                    logger.error(err);
                                }  else {
                                    inventoryPlanDetail = data;
                                    logger.ndump("inventoryPlanDetail", inventoryPlanDetail);
                                }
                                done();
                            });
                        },

                        function fetchGoods(done) {
                            logger.enter();
                            IdObj.goodsTypeIds = goodsTypeIds;
                            model.getGoods(customerDBName, IdObj, paginator, function(err, data){
                                logger.enter();
                                if (err) {
                                    logger.error(err);
                                } else {
                                    goodsList = data;
                                    logger.ndump("goodsList", goodsList);
                                    underscore.each(goodsList, function(item) {
                                        item.storage = item.amount;
                                        //按库存显示方案更新显示信息
                                        item.content = '暂无信息';
                                        for (var i = 0; i < inventoryPlanDetail.length; i++) {
                                            if (item.showPlanId == inventoryPlanDetail[i].goodsInventoryPlanId) {
                                                if (Number(item.amount) < Number(inventoryPlanDetail[i].threshold)) {
                                                    item.content = inventoryPlanDetail[i].content == "实际数量" ? item.amount : inventoryPlanDetail[i].content;
                                                    break;
                                                }
                                            }
                                        }
                                    });
                                }
                                done();
                            });
                        }
                    ],
                    function(err, resultList) {
                        if (err && typeof(err)==="object") {
                            logger.error(err);
                        }
                        callback(null, goodsList);
                    }
                );
        },

        createOnSellGoodsPaginator: function (req) {

            var categoryList = [];
            var keywordList = [];
            var sort = {};
            var page = 1;
            var pageSize = 10;

            var tableName = 'GoodsInfo';
            var tableNameCategory = 'GoodsGsp';
            var tableNameInventory = 'GoodsInventory';
            var categoryA = {};
            var categoryB = {};
            var categoryC = {};
            var categoryD = {};
            var categoryf = {};
            var keywordA = {};
            var keywordB = {};
            var s = {};
            var p = 1;
            var ps = 10;
            var param = {
                categoryAField: goodsFieldMapper.convertToField(req.query.caf) || "goodsType",
                categoryAValue: Number(req.query.cav || "%"),
                categoryBField: goodsFieldMapper.convertToField(req.query.cbf) ||"isNationalMedicine",
                categoryBValue: req.query.cbv ||"%",
                categoryCField: goodsFieldMapper.convertToField(req.query.ccf)||"isMedicalInsuranceDrugs",
                categoryCValue: req.query.ccv ||"%",
                categoryDField: goodsFieldMapper.convertToField(req.query.cdf)||"isPrescriptionDrugs",
                categoryDValue: req.query.cdv ||"%",
                categoryFField: goodsFieldMapper.convertToField(req.query.cff)||"isSplit",
                categoryFValue: req.query.cfv ||"%",
                keywordField: goodsFieldMapper.convertToField(req.query.kaf) || "commonName",
                keywordValue: req.query.kav || "%",
                keywordBField: goodsFieldMapper.convertToField(req.query.kbf) || "commonName",
                keywordBValue: req.query.kbv || "%",
                sortField: goodsFieldMapper.convertToField(req.query.sf) || "updatedOn",
                sortValue: req.query.sv || "DESC",
                pageSize: Number(req.query.ps) < 101 && Number(req.query.ps) > 0 ? Number(req.query.ps) : 10,
                page: Number(req.query.p) || 1
            };
            if (!underscore.isEmpty(param.categoryAValue) && !underscore.isEmpty(param.categoryAField)) {
                categoryA.field = param.categoryAField;
                categoryA.value = param.categoryAValue.trim();
                categoryA.tableName = tableName;
            }

            if (!underscore.isEmpty(param.categoryBValue) && !underscore.isEmpty(param.categoryBField)) {
                categoryB.field = param.categoryBField;
                categoryB.value = param.categoryBValue.trim()== 'true' ? 1:0;
                categoryB.tableName = tableNameCategory;
            }
            if (!underscore.isEmpty(param.categoryCValue) && !underscore.isEmpty(param.categoryCField)) {
                categoryC.field = param.categoryCField;
                categoryC.value = param.categoryCValue.trim() == 'true' ? 1:0;
                categoryC.tableName = tableNameCategory;
            }
            if (!underscore.isEmpty(param.categoryDValue) && !underscore.isEmpty(param.categoryDField)) {
                categoryD.field = param.categoryDField;
                categoryD.value = param.categoryDValue.trim() == 'true' ? 1:0;
                categoryD.tableName = tableNameCategory;
            }
            if (!underscore.isEmpty(param.categoryFValue) && !underscore.isEmpty(param.categoryFField)) {
                categoryf.field = param.categoryFField;
                categoryf.value = param.categoryFValue.trim() == 'true' ? 1:0;
                categoryf.tableName = tableNameInventory;
            }

            if (!underscore.isEmpty(param.keywordField) && !underscore.isEmpty(param.keywordValue) || !underscore.isEmpty(param.keywordBValue)) {
                keywordA.field = param.keywordField;
                keywordA.value = param.keywordValue;
                keywordA.tableName = tableName;
            }
            if (!underscore.isEmpty(param.keywordBValue)) {
                keywordB.field = param.keywordBField;
                keywordB.value = param.keywordBValue;
                keywordB.tableName = tableName;
            }
            if (!underscore.isEmpty(param.sortField)) {
                s.field = param.sortField;
                s.value = param.sortValue;
                s.tableName = tableName;
                if(/(price)$/.test(param.sortField)) {
                    s.tableName = 'ClientGoodsPrice';

                }else if(/(refRetailPrice)$/.test(param.sortField)) {
                    s.tableName = 'GoodsPrice';
                }
                if(/(commonName)/.test(param.sortField)){
                    s.tableName="";
                    s.field="CONVERT(commonName USING gb2312)";
                }
                if(/(producer)/.test(param.sortField)){
                    s.tableName="";
                    s.field="CONVERT(producer USING gb2312)";
                }
                if(/(boughtTimes)$/.test(param.sortField) || /(boughtAmount)$/.test(param.sortField)) {
                    s.tableName = 'GoodsTopBuy';
                }
            }
            if (typeof param.page == 'number') {
                p = param.page;
            }
            if (typeof param.pageSize == 'number') {
                ps = param.pageSize;
            }

            categoryList.push(categoryA);
            categoryList.push(categoryB);
            categoryList.push(categoryC);
            categoryList.push(categoryD);
            categoryList.push(categoryf);

            if (!underscore.isEmpty(keywordA)) {
                keywordList.push(keywordA);
            }
            if (!underscore.isEmpty(keywordB)) {
                keywordList.push(keywordB);
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

        restorePaginator: function (paginator) {
            var p = {};
            p.caf = goodsFieldMapper.convertToAlias(paginator.categoryList[0].field);
            p.cav = "0";
            p.cbf = paginator.categoryList[1]? goodsFieldMapper.convertToAlias(paginator.categoryList[1].field):'';
            p.cbv = paginator.categoryList[1]? paginator.categoryList[1].value == 1:'';
            p.ccf = paginator.categoryList[2]? goodsFieldMapper.convertToAlias(paginator.categoryList[2].field):'';
            p.ccv = paginator.categoryList[2]? paginator.categoryList[2].value == 1:'';
            p.cdf = paginator.categoryList[3]? goodsFieldMapper.convertToAlias(paginator.categoryList[3].field):'';
            p.cdv = paginator.categoryList[3]? paginator.categoryList[3].value ==1 :'';
            p.cff = paginator.categoryList[4]? goodsFieldMapper.convertToAlias(paginator.categoryList[4].field):'';
            p.cfv = paginator.categoryList[4]? paginator.categoryList[4].value ==1 :'';
            p.kaf = goodsFieldMapper.convertToAlias(paginator.keywordList[0].field);
            p.kav = paginator.keywordList[0].value;
            p.kbf = goodsFieldMapper.convertToAlias(paginator.keywordList[1].field);
            p.kbv = paginator.keywordList[1].value;
            p.sf = goodsFieldMapper.convertToAlias(paginator.sort.field);
            p.sv = paginator.sort.value;
            p.p = paginator.page;
            p.ps = paginator.pageSize;
            if(paginator.sort.field　== "CONVERT(commonName USING gb2312)"){
                p.sf = "商品名";
            }
            if(paginator.sort.field　== "CONVERT(producer USING gb2312)"){
                p.sf = "生产企业";
            }
            return p;
        },
        /**
         * newGoods
         *      新增一个商品到数据库中
         * @param customerDBName
         * @param goodsInfo
         * @param callback
         */
        newGoods: function (customerDBName, goodsInfo, callback) {

        },

        /**
         * addGoodsPrice
         *      新增商品的价格信息到GoodsPrice
         * @param customerDBName
         * @param goodsPriceInfo
         * @param callback, success - callback(true), or failure - callback(false)
         */
        addGoodsPrice: function (customerDBName, goodsPriceInfo, callback) {
            logger.enter();

            db.beginTrans(function (connect) {
                async.series([
                        function newGoodsPrice(done) {
                            /* insert into GoodsPrice */
                            db.metaGoodsPriceInsert(connect, customerDBName, goodsPriceInfo, function DoneMetaGoodsPriceInsert(err, id) {
                                done(err, id);
                            });
                        },
                        function newClientGoodsPrice(done) {
                            /* insert into ClientGoodsPrice for all  */
                            db.metaNewClientGoodsPriceByPrice(connect, customerDBName, goodsPriceInfo, function DoneAddClientGoodsPrice() {
                                db.commitTrans(connect, function () {
                                    logger.enter();
                                    callback(true);
                                });
                            });
                        }
                    ],
                    function(err, resultList){
                        if (typeof err === "object") {
                            db.rollbackTrans(connect, function(){
                                callback(err);
                            });
                        } else {
                            db.commitTrans(connect, function(errTrans) {
                                callback(errTrans);
                            });
                        }
                    });
            });
        }
    };

    return model;
};
