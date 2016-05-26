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
 * unittest database service: price
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-06   hc-romens@issue#79     created
 *
 */


var assert = require("assert");
var app = require(__dirname+"/../../../app.js");
var sprintf = require("sprintf-js").sprintf;

describe('dbServer->customer->price', function() {
    var dbService = __dbService;
    var underscore = require("underscore");
    var customerDBName = __customerDBPrefix + "_127_0_0_1";

    it('Testing dbService.metaClientPriceInsert', function(done) {
        dbService.getConnection(function(conn) {
            dbService.metaClientPriceInsert(conn, customerDBName, 1, 1, 1, function(err, id) {
                if(err) {
                    assert(false);
                    done();
                }else {
                    var sqlTempl = "DELETE FROM %s.ClientPrice WHERE id = ?";
                    var sql = sprintf(sqlTempl, customerDBName);
                    __mysql.query(sql, [id], function(err, results1) {
                        assert(id > 0);
                        done();
                    });
                }
            });
        })
    });

    it('Testing dbService.metaClientPriceUpdate()', function(done) {
        var sqlTempl = "INSERT INTO %s.ClientPrice (goodsId, clientId, clientPrice) VALUES (?, ?, ?) ";
        var sql = sprintf(sqlTempl, customerDBName);
        __mysql.query(sql, [1, 1, 1], function(err, results) {
            if(err) {
                assert(false);
                done()
            }else {
                dbService.getConnection(function(conn) {
                    dbService.metaClientPriceUpdate(conn, customerDBName, 1, 1, 3, function(err, affectedRows) {
                        if(err) {
                            assert(false);
                            done();
                        }else {
                            var sqlTempl = "DELETE FROM %s.ClientPrice WHERE id = ?";
                            var sql = sprintf(sqlTempl, customerDBName);
                            __mysql.query(sql, [results.insertId], function(err, results) {
                                assert(affectedRows > 0);
                                done();
                            });
                        }
                    });
                });
            }
        });
    });

    it('Testing dbService.metaClientPriceDeletePrice()', function(done) {
        var sqlTempl = "INSERT INTO %s.ClientPrice (goodsId, clientId, clientPrice) VALUES (?, ?, ?) ";
        var sql = sprintf(sqlTempl, customerDBName);
        __mysql.query(sql, [1, 1, 1], function(err, results) {
            if (err) {
                assert(false);
                done()
            } else {
                dbService.getConnection(function(conn) {
                    dbService.metaClientPriceDeletePrice(conn, customerDBName, 1, 1, function(err, results) {
                        assert(results > 0);
                        done();
                    });
                });
            }
        });
    });

});
