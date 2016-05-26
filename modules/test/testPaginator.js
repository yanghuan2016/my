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
 * unittest module:
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-20   zp-romens@issue#217     modify
 * 2015-10-05   hc-romens@issue#97     created
 *
 */


var assert1  = require("assert");
var assert = require("chai").assert;

var app = require(__dirname+"/../../app.js");
var logger = __logService;

var underscore = require("underscore");

var Paginator = require(__modules_path + "/paginator");
var customerDBName = "CustomerDB";

describe('testPaginator',function() {
    it('-> where 1', function () {
        var paginator = new Paginator(
            [{field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'}],
            [{field: 'goodsName', value: "六", tableName: customerDBName + '.' + 'GoodsInfo'}],
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert(paginator.where() === " WHERE  (CustomerDB.GoodsInfo.goodsTypes LIKE '%西药%') AND (CustomerDB.GoodsInfo.goodsName LIKE '%六%') AND TRUE ");
    });

    it('-> where 2', function () {
        var paginator = new Paginator(
            [],
            [{field: 'goodsName', value: "六", tableName: customerDBName + '.' + 'GoodsInfo'}],
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert(paginator.where() === " WHERE  (CustomerDB.GoodsInfo.goodsName LIKE '%六%') AND TRUE ");
    });

    it('-> where 3', function () {
        var paginator = new Paginator(
            [],
            [],
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert(paginator.where() === "");
    });

    it('-> where 4', function () {
        var paginator = new Paginator(
            undefined,
            undefined,
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert(paginator.where() === "");
    });

    it('-> where 5', function () {
        var paginator = new Paginator(
            [{field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'},
                {field: 'status', value: 'sold', tableName: customerDBName + '.' + 'GoodsInventory'}
            ],
            [],
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert.equal(paginator.where() , " WHERE  (CustomerDB.GoodsInfo.goodsTypes LIKE '%西药%') AND (CustomerDB.GoodsInventory.status LIKE '%sold%') AND TRUE ");
    });

    it('-> where 6', function () {
        var paginator = new Paginator(
            [{field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'},
                {field: undefined, value: 'sold', tableName: customerDBName + '.' + 'GoodsInventory'}
            ],
            [],
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert.equal(paginator.where() , " WHERE  (CustomerDB.GoodsInfo.goodsTypes LIKE '%西药%') AND TRUE ");
    });

    it('-> where 7', function () {
        var paginator = new Paginator(
            [
                {field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'},
                {field: 'status', value: 'sold', tableName: customerDBName + '.' + 'GoodsInventory'}
            ],
            [{field: 'goodsName', value: "六", tableName: customerDBName + '.' + 'GoodsInfo'}],
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert.equal(paginator.where() , " WHERE  (CustomerDB.GoodsInfo.goodsTypes LIKE '%西药%') AND (CustomerDB.GoodsInventory.status LIKE '%sold%') AND (CustomerDB.GoodsInfo.goodsName LIKE '%六%') AND TRUE ");
    });

    it('-> orderby 1', function () {
        var paginator = new Paginator(
            [
                {field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'},
                {field: 'status', value: 'sold', tableName: customerDBName + '.' + 'GoodsInventory'}
            ],
            [{field: 'goodsName', value: "六", tableName: customerDBName + '.' + 'GoodsInfo'}],
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert(paginator.orderby() === " ORDER BY CustomerDB.GoodsInfo.goodsName ASC");
    });

    it('-> orderby 2', function () {
        var paginator = new Paginator(
            [
                {field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'},
                {field: 'status', value: 'sold', tableName: customerDBName + '.' + 'GoodsInventory'}
            ],
            [{field: 'goodsName', value: "六", tableName: customerDBName + '.' + 'GoodsInfo'}],
            {},
            1,
            10
        );
        assert(paginator.orderby() === "");
    });

    it('-> orderby 3', function () {
        var paginator = new Paginator(
            [
                {field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'},
                {field: 'status', value: 'sold', tableName: customerDBName + '.' + 'GoodsInventory'}
            ],
            [{field: 'goodsName', value: "六", tableName: customerDBName + '.' + 'GoodsInfo'}],
            {field: 'goodsName', tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert(paginator.orderby() === " ORDER BY CustomerDB.GoodsInfo.goodsName ASC");
    });

    it('-> orderby 4', function () {
        var paginator = new Paginator(
            [
                {field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'},
                {field: 'status', value: 'sold', tableName: customerDBName + '.' + 'GoodsInventory'}
            ],
            [{field: 'goodsName', value: "六", tableName: customerDBName + '.' + 'GoodsInfo'}],
            {field: 'goodsName', value: "DESC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert(paginator.orderby() === " ORDER BY CustomerDB.GoodsInfo.goodsName DESC");
    });

    it('-> limit 1', function () {
        var paginator = new Paginator(
            [
                {field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'},
                {field: 'status', value: 'sold', tableName: customerDBName + '.' + 'GoodsInventory'}
            ],
            [{field: 'goodsName', value: "六", tableName: customerDBName + '.' + 'GoodsInfo'}],
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            1,
            10
        );
        assert(paginator.limit() === " LIMIT 0, 10");
    });

    it('-> limit 2', function () {
        var paginator = new Paginator(
            [
                {field: 'goodsTypes', value: '西药', tableName: customerDBName + '.' + 'GoodsInfo'},
                {field: 'status', value: 'sold', tableName: customerDBName + '.' + 'GoodsInventory'}
            ],
            [{field: 'goodsName', value: "六", tableName: customerDBName + '.' + 'GoodsInfo'}],
            {field: 'goodsName', value: "ASC", tableName: customerDBName + "." + "GoodsInfo"},
            2,
            10
        );
        assert(paginator.limit() === " LIMIT 10, 10");
    });



});

//    /** //     * Test Case : createFromReq);
//     */
//    describe('#createFromReq', function () {
//        it("Tesing normal data on createFromReq()#1", function (done) {
//            var req = {
//                query: {
//                    categoryField: "GoodsType",
//                    categoryValue: "西药",
//                    keywordsField: "commonName",
//                    keywordsValue: "感冒",
//                    sortField: "soldPrice",
//                    sortOrder: "asc",
//                    pageSize: 10,
//                    page: 2
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//            assert.strictEqual(JSON.stringify(paginator) , JSON.stringify(req.query));
//            done();
//        });
//
//        it("Testing normal data on createFromReq()#2", function (done) {
//            var req = {
//                query: {
//                    pageSize: 20,
//                    page: 3
//                }
//            };
//
//            var paginator = pagination.createFromReq(req);
//            assert.strictEqual(JSON.stringify(paginator),JSON.stringify({
//                    categoryField: '',
//                    categoryValue: '',
//                    keywordsField: '',
//                    keywordsValue: '',
//                    sortField: '',
//                    sortOrder: '',
//                    pageSize: 20,
//                    page: 3
//                }));
//            done();
//        });
//
//        it("Testing abnormal data on createFromReq()#1", function (done) {
//            var req = {
//                query: {
//                    pageSize: "123",
//                    page: 2
//                }
//            };
//
//            try {
//                var paginator = paginator.createFromReq(req);
//            } catch (err) {
//                done();
//            }
//        });
//
//        it("Testing abnormal data on createFromReq()#2", function (done) {
//            var req = {
//                query: {
//                    pageSize: 123,
//                    page: "2s"
//                }
//            };
//
//            try {
//                var paginator = paginator.createFromReq(req);
//            } catch (err) {
//                done();
//            }
//        });
//
//        it("Testing abnormal data on createFromReq()#3", function (done) {
//            var req = {
//                query: {
//                    pageSize: "123",
//                    page: "2X"
//                }
//            };
//
//            try {
//                var paginator = paginator.createFromReq(req);
//            } catch (err) {
//                done();
//            }
//        });
//    });
//
//    describe('#makeWhere', function () {
//        it("When req.query is a null Object", function () {
//            var req = {query:{}};
//            var paginator = pagination.createFromReq(req);
//
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where, "");
//        });
//
//        it("When req.query is a null Object", function () {
//            var req = {query:{}};
//            var paginator = pagination.createFromReq(req);
//
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where, "");
//        });
//
//        it("When req.query is normal data", function (done) {
//            var req = {
//                query: {
//                    categoryField: "GoodsType",
//                    categoryValue: "西药",
//                    keywordsField: "commonName",
//                    keywordsValue: "感冒",
//                    sortField: "soldPrice",
//                    sortOrder: "asc",
//                    pageSize: 10,
//                    page: 2
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//            var where = pagination.makeWhere(paginator);
//            logger.ndump("where", where);
//            assert.strictEqual(where, " WHERE  (GoodsType='西药') AND (commonName LIKE '%感冒%') AND TRUE");
//            done();
//        });
//
//        it("Tesing normal data on makeWhereClauseByPaginator()#2", function (done) {
//            var req = {
//                query: {
//                    categoryField: "GoodsType",
//                    categoryValue: "西药",
//                    keywordsField: "commonName",
//                    keywordsValue: "感冒,胶囊",
//                    sortField: "soldPrice",
//                    sortOrder: "asc",
//                    pageSize: 10,
//                    page: 2
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where , " WHERE  (GoodsType='西药') AND (commonName LIKE '%感冒%') AND (commonName LIKE '%胶囊%') AND TRUE");
//            done();
//        });
//
//        it("Testing normal data on makeWhere with the param:tableName", function(done) {
//            var req = {
//                query: {
//                    categoryField: "GoodsType",
//                    categoryValue: "西药",
//                    keywordsField: "commonName",
//                    keywordsValue: "感冒,胶囊",
//                    sortField: "soldPrice",
//                    sortOrder: "asc",
//                    pageSize: 10,
//                    page: 2
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//            var where = pagination.makeWhere(paginator, "", "GoodsInfo");
//            assert.strictEqual(where, " WHERE  (GoodsInfo.GoodsType='西药') AND (GoodsInfo.commonName LIKE '%感冒%') AND (GoodsInfo.commonName LIKE '%胶囊%') AND TRUE");
//            done();
//        });
//
//        it("When req.query is normal, keywordsValue ='感冒,胶囊'", function (done) {
//            var req = {
//                query: {
//                    categoryField: "GoodsType",
//                    categoryValue: "西药",
//                    keywordsField: "commonName",
//                    keywordsValue: "感冒,胶囊",
//                    sortField: "soldPrice",
//                    sortOrder: "asc",
//                    pageSize: 10,
//                    page: 2
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where, " WHERE  (GoodsType='西药') AND (commonName LIKE '%感冒%') AND (commonName LIKE '%胶囊%') AND TRUE");
//            done();
//        });
//
//        it("When keywords is undefined", function () {
//            var req = {
//                query: {
//                    categoryField: "GoodsType",
//                    categoryValue: "西药"
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where, " WHERE  (GoodsType='西药')");
//        });
//
//        it("When keywords is undefined", function () {
//            var req = {
//                query: {
//                    categoryField: "GoodsType",
//                    categoryValue: "西药"
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where, " WHERE  (GoodsType='西药')");
//        });
//
//        it("When category is undefined", function () {
//            var req = {
//                query: {
//                    keywordsField: "commonName",
//                    keywordsValue: "感冒,胶囊"
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where, " WHERE  (commonName LIKE '%感冒%') AND (commonName LIKE '%胶囊%') AND TRUE");
//        });
//
//        it("When category is undefined", function () {
//            var req = {
//                query: {
//                    keywordsField: "commonName",
//                    keywordsValue: "感冒,胶囊"
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where, " WHERE  (commonName LIKE '%感冒%') AND (commonName LIKE '%胶囊%') AND TRUE");
//        });
//
//        it("When categoryValue or keywordsValue is undefined", function () {
//            var req = {
//                query: {
//                    categoryField: "GoodsType",
//                    keywordsField: "commonName"
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where, '');
//        });
//
//        it("When categoryField or keywordsField is undefined", function () {
//            var req = {
//                query: {
//                    categoryValue: "西药",
//                    keywordsValue: "感冒"
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//
//            var where = pagination.makeWhere(paginator);
//            assert.strictEqual(where, '');
//        });
//    });
//
//    describe('#makeOrderby', function () {
//        it("Tesing normal data #1", function (done) {
//            var req = {
//                query: {
//                    sortField: "soldPrice",
//                    sortOrder: "asc"
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//
//            var orderby = pagination.makeOrderby(paginator);
//
//            assert.strictEqual(orderby , " ORDER BY soldPrice ASC");
//            done();
//        });
//
//        it("Tesing normal data #2", function (done) {
//            var req = {
//                query: {
//                    sortField: "soldPrice",
//                    sortOrder: "desc"
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//
//            var orderby = pagination.makeOrderby(paginator);
//
//            assert.strictEqual(orderby , " ORDER BY soldPrice DESC");
//            done();
//        });
//
//        it("Tesing when sortField & sortOrder are undefined.", function (done) {
//            var req = { query: {} };
//            var paginator = pagination.createFromReq(req);
//
//            var orderby = pagination.makeOrderby(paginator);
//
//            assert.strictEqual(orderby , "");
//            done();
//        });
//
//        it("Tesing when sortField is undefined.", function (done) {
//            var req = { query: { sortOrder: "desc" } };
//            var paginator = pagination.createFromReq(req);
//
//            var orderby = pagination.makeOrderby(paginator);
//
//            assert.strictEqual(orderby , "");
//            done();
//        });
//
//        it("Tesing when sortOrder is undefined.", function (done) {
//            var req = {query: {sortField: "soldPrice"}};
//            var paginator = pagination.createFromReq(req);
//
//            var orderby = pagination.makeOrderby(paginator);
//
//            assert.strictEqual(orderby , " ORDER BY soldPrice ASC");
//            done();
//        });
//    });
//
//    describe('#makeLimit', function () {
//        it("Tesing normal data on makeLimit()#1", function (done) {
//            var req = {
//                query: {
//                    pageSize: 15,
//                    page: 3
//                }
//            };
//            var paginator = pagination.createFromReq(req);
//
//            var page = pagination.makeLimit(paginator);
//
//            assert.strictEqual(page, " LIMIT 30, 15");
//            done();
//        });
//
//        it("Tesing when req.page & req.pageSize are undefined", function (done) {
//            var req = {query: {}};
//            var paginator = pagination.createFromReq(req);
//
//            var page = pagination.makeLimit(paginator);
//
//            assert.strictEqual(page, " LIMIT 0, 10");
//            done();
//        });
//
//        it("Tesing when req.page is undefined ", function (done) {
//            var req = {query: {
//                pageSize: 15
//            }};
//            var paginator = pagination.createFromReq(req);
//
//            var page = pagination.makeLimit(paginator);
//
//            assert.strictEqual(page, " LIMIT 0, 15");
//            done();
//        });
//
//        it("Tesing when req.pageSize is undefined", function (done) {
//            var req = {query: { page: 2 }};
//            var paginator = pagination.createFromReq(req);
//
//            var page = pagination.makeLimit(paginator);
//
//            assert.strictEqual(page, " LIMIT 0, 10");
//            done();
//        });
//    });
