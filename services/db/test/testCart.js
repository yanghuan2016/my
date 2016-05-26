/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

var assert = require("assert");
var async = require('async');
var app = require(__dirname+"/../../../app.js");
var sprintf = require("sprintf-js").sprintf;

var dbService = __dbService;
var logger = global.__logService;
var customerDBName = __customerDBPrefix + "_127_0_0_1";

describe('service->db->customer->cart', function() {

    var ids = {};
    before(function(done) {
        async.waterfall([
            function(cb) {
                var sqlTempl = "INSERT INTO %s.Client (clientCode, clientName ) VALUES (?, ?) ;";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query( sql, ['romens', 'romens'], function(err, results){
                    if(err) {
                        cb(err);
                    }else {
                        ids.clientId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = "INSERT INTO %s.Cart (clientId, goodsId, quantity ) VALUES (?, ?, ?) ;";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query( sql, [ids.clientId, 1, 10], function(err, results){
                    if(err) {
                        cb(err);
                    }else {
                        ids.cartId = results.insertId;
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
        });
    });

    after(function(done) {
        async.series([
            function(cb) {
                var sqlTempl = "Delete from %s.Cart WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.cartId], function(err, result){
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, result);
                    }
                });
            },
            function(cb) {
                var sqlTempl = "DELETE %s.Client, %s.ClientGsp, %s.ClientFinance, %s.ClientPrice FROM %s.Client " +
                "LEFT JOIN %s.ClientGsp ON Client.id = ClientGsp.clientId " +
                "LEFT JOIN %s.ClientFinance ON Client.id = ClientFinance.clientId " +
                "LEFT JOIN %s.ClientPrice ON Client.id = ClientPrice.clientId " +
                "WHERE Client.id = ?;";

                var sql = sprintf(sqlTempl, customerDBName,customerDBName,customerDBName,customerDBName, customerDBName,customerDBName,customerDBName,customerDBName);
                __mysql.query(sql, [ids.clientId], function(err, result){
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, result);
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

    it('Testing dbService.updateCart()', function(done) {
        dbService.updateCart(customerDBName, ids.cartId, 100, '又买了100', function(err, results) {
            assert(results > 0);
            done()
        });
    });

    it('Testing dbService.selectCartDetail()', function(done) {
        dbService.selectCartDetail(customerDBName, ids.clientId, 1, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });

    it('Testing dbService.countCartItem()', function(done) {
        dbService.countCartItem(customerDBName, ids.clientId, function(err, results) {
            assert(results > 0);
            done();
        });
    });

    it('Testing dbService.listCart()', function(done) {
        dbService.listCart(customerDBName, ids.clientId, function(err, results) {
            assert(results.length > 0);
            done();
        })
    });

    it('Testing dbService.loadCart()', function(done) {
        dbService.loadCart(customerDBName, ids.clientId, function(err, results) {
            assert(results.length > 0);
            done();
        })
    });

    it('Testing dbService.findGoodsInfoForAddToCart()', function(done) {
        dbService.findGoodsInfoForAddToCart(customerDBName, ids.clientId, 1, function(err, goods) {
            assert(goods.length > 0);
            done();
        });
    });

    it('Testing dbService.addCart()', function(done) {
        dbService.addCart(customerDBName, ids.clientId, 2, 10, 'I buy another goods', function(err, insertId) {
            if(err) {
                assert(false);
                done();
            }else {
                var sqlTempl = "Delete from %s.Cart WHERE id = ? ;";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [insertId], function(err, result){
                    assert(result.affectedRows == 1);
                    done();
                });
            }
        });
    });

    it('Testing dbService.metaBatchInsertToCart()', function(done) {
        var items = [
            {goodsId: 1, quantity: 1, remark: 'key'},
            {goodsId: 2, quantity: 1, remark: 'key'},
            {goodsId: 3, quantity: 1, remark: 'key'}
        ];
        items.clientId = ids.clientId;
        dbService.getConnection(function(conn) {
            dbService.metaBatchInsertToCart(conn, customerDBName, items, function(err, results) {
                if(err) {
                    assert(false);
                    done();
                }else {
                    var sqlTempl = "Delete from %s.Cart WHERE remark = ? ;";
                    var sql = sprintf(sqlTempl, customerDBName);
                    __mysql.query(sql, ['key'], function(err, result){
                        assert(result.affectedRows == 3);
                        done();
                    });
                }
            });
        });
    });

    it('Testing dbService.metaDeleteCartByGoodsIds()', function(done) {

        var sqlTemp = "INSERT INTO %s.Cart ( clientId, goodsId, quantity ) VALUES ? ;";
        var sql = sprintf(sqlTemp, customerDBName);
        var carts = [
            [ids.clientId, 6, 1],
            [ids.clientId, 7, 1],
            [ids.clientId, 8, 1]
        ];
        __mysql.query(sql, [carts], function(err, result){
            if(err) {
                assert(false);
                done();
            }else {
                dbService.getConnection(function(conn) {
                    dbService.metaDeleteCartByGoodsIds(conn, customerDBName, ids.clientId, [6, 7, 8], function(err, results) {
                        assert(results == 3);
                        done();
                    });
                });
            }
        });
    });
});