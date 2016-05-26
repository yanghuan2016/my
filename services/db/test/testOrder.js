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
 * unittest database service: order
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-26    hc-romens@issue#49
 *
 */


var assert = require("assert");
var async = require('async');
var app = require(__dirname+"/../../../app.js");
var sprintf = require("sprintf-js").sprintf;
var Paginator = require(__base + '/modules/paginator');

describe('dbServer->customer->order', function() {

    var dbService = __dbService;
    var underscore = require("underscore");
    var customerDBName = __customerDBPrefix + "_127_0_0_1";

    var ids = {};
    before(function(done) {
        async.waterfall([
            function(cb) {
                var sqlTempl = "INSERT INTO %s.OrderInfo (operatorId, clientId, total) VALUES (?, ?, ?)";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [1, 1, 20], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.orderInfoId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = "INSERT INTO %s.OrderDetails (orderId, goodsId, soldPrice, quantity, amount) VALUES (?, ?, 20, 20, 20)";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.orderInfoId, 1], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.OrderDetailId = results.insertId;
                        cb(null, ids);
                    }
                });
            }
        ], function(err, results) {
            if(err) {
                done(err);
            }else {
                done();
            }
        })
    });

    after(function(done) {
        async.series([
            function(cb) {
                var sqlTempl = "DELETE FROM %s.OrderInfo WHERE id = ?"
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.orderInfoId], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, results);
                    }
                });
            },
            function(cb) {
                var sqlTempl = "DELETE FROM %s.OrderDetails WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.OrderDetailId], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, results);
                    }
                });
            }
        ], function(err, results) {
            if(err) {
                done(err);
            }else {
                done();
            }
        })
    });

    it('Testing dbService.newOrder()', function(done) {
        var orderData = {
            items:[
                { goodsId:1, soldPrice:3.72, quantity:8, remark:"2014包装款" },
            ],
            address: "成都高新区天府五街美年广场C座875, 八剑, 13999999999",
            remark: ""
        };

        var operatorData = {
            operatorId:1,
            clientId:1
        };

        dbService.newOrder(customerDBName, orderData, operatorData, function(err,orderId){
            if(err) {
                assert(false);
                done();
            }else {
                //删除插入的数据
                var sqlTempl = "DELETE FROM %s.OrderDetails WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [orderId], function(err, resutls) {
                    if(err) {
                        assert(false);
                        done();
                    }else {
                        var sqlTempl = "DELETE FROM %s.OrderInfo WHERE id = ?"
                        var sql = sprintf(sqlTempl, customerDBName);
                        __mysql.query(sql, [orderId], function(err, results) {
                            assert(orderId != 0);
                            done();
                        });
                    }
                });
            }
        });

    });

    it("Testing dbService.listOrders()", function(done){

        var paginator = new Paginator([], [], {}, 1, 10);
        dbService.listOrders(customerDBName, 1, paginator, function(err, results){
            assert(results.length > 0);
            done();
        });
    });

    it("Test normal case", function(done){
        dbService.getOrderDetail(customerDBName, ids.orderInfoId, function(err, results){
            assert(results.length > 0);
            done();
        });
    });

});