/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

var assert = require('assert');
var async = require('async');
var app = require(__dirname+"/../../../app.js");
var Paginator = require(__base + '/modules/paginator');
var sprintf = require("sprintf-js").sprintf;

var dbService = __dbService;
var logService = __logService;
var customerDBName = __customerDBPrefix + "_127_0_0_1";

/**
 * before用来在测试前插入必要的数据，after在测试完成后删除测试数据
 * 测试的正确性以来于测试数据的可靠性，所以这里存在一个假设before不会出错
 */
describe('service->db->customer->ship', function() {
    this.timeout(2500);

    var ids = {};
    ids.goodsInfoId = 1;
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
                var sqlTempl = "INSERT INTO %s.Operator (username, password, clientId ) VALUES (?, ?, ?)";
                var sql = sprintf(sqlTempl, customerDBName);

                __mysql.query( sql, ['romens', 'romens', ids.clientId], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.operatorId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = "INSERT INTO %s.OrderInfo (operatorId, clientId, total) VALUES (?, ?, ?)";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.operatorId, ids.clientId, 20], function(err, results) {
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
                __mysql.query(sql, [ids.orderInfoId, ids.goodsInfoId], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.OrderDetailId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = "INSERT INTO %s.ShipInfo (orderId, logisticsNo) VALUES (?, ?)";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.orderInfoId, 'romens'], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.ShipInfoId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = "INSERT INTO %s.ShipDetails (shipId, goodsId, batchNum) VALUES (?, ?, ?)";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.ShipInfoId, ids.goodsInfoId, 'romens1'], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.ShipDetailId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = "INSERT INTO %s.ReturnInfo (shipId, orderId, operatorId) VALUES (?, ?, ?)";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.ShipInfoId, ids.orderInfoId, ids.operatorId], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.ReturnInfoId = results.insertId;
                        cb(null, ids);
                    }
                });

            },

            function(ids, cb) {
                var sqlTempl = "INSERT INTO %s.ReturnDetails (returnId, orderId, goodsId, quantity) VALUES (?, ?, ?, ?)";
                var sql = sprintf(sqlTempl, customerDBName);
                 __mysql.query(sql, [ids.ReturnInfoId,ids.orderInfoId, ids.goodsInfoId, 10], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.ReturnDetailId = results.insertId;
                        cb(null, ids);
                    }
                });
            }
        ], function(err, results) {
            if(err) {
                logService.error(err);
                done(err);
            }
            done();
        })
    });

    after(function(done) {
        async.series([
            function(cb) {
                var sqlTempl = "Delete from %s.ReturnDetails WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.ReturnDetailId], function(err, result){
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, result);
                    }
                });
            },
            function(cb) {
                var sqlTempl = "Delete from %s.ReturnInfo WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.ReturnInfoId], function(err, result){
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, result);
                    }
                });
            },
            function(cb) {
                var sqlTempl = "Delete %s.ShipDetails, %s.GoodsBatch from %s.ShipDetails " +
                    "LEFT JOIN %s.GoodsBatch ON ShipDetails.goodsId = GoodsBatch.goodsId "+
                    "WHERE ShipDetails.goodsId = ?";
                var sql = sprintf(sqlTempl, customerDBName, customerDBName, customerDBName, customerDBName);
                __mysql.query(sql, [ids.goodsInfoId], function(err, result){
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, result);
                    }
                });
            },
            function(cb) {
                var sqlTempl = "Delete from %s.ShipInfo WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.ShipInfoId], function(err, result){
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, result);
                    }
                });
            },
            function(cb) {
                var sqlTempl = "Delete from %s.OrderDetails WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.OrderDetailId], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, results);
                    }
                });
            },
            function(cb) {
                var sqlTempl = "Delete from %s.OrderInfo WHERE id = ?";
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
                var sqlTempl = "Delete from %s.Operator WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.operatorId], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, results);
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
                __mysql.query(sql, [ids.clientId], function(err, results) {
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

    //it('Testing dbService.metaBatchInsertShip()', function(done) {
    //    var shipInfo = {
    //            orderId: 10,
    //            logisticsCompany: 'romens',
    //            logisticsNo: 'NO',
    //            remark: 'romens software company'
    //        };
    //    dbService.getConnection(function(conn) {
    //        dbService.metaBatchInsertShip(conn, customerDBName, shipInfo, function(err, results) {
    //            if(err) {
    //                assert(false);
    //                done();
    //            }else {
    //                var sqlTempl = "Delete from %s.ShipInfo WHERE id = ?";
    //                var sql = sprintf(sqlTempl, customerDBName);
    //                __mysql.query(sql, [results.insertId], function(err, results){
    //                    assert(results.affectedRows == 1 );
    //                    done();
    //                });
    //            }
    //        });
    //    });
    //});

    it('Testing dbService.metaBatchInsertShipDetails()', function(done) {
        var shipDetail = {
            shipData: [
                {goodsId: 10, goodsRemark: 'romens', batchDatas:[['1233456','2015-11-30','2015-11-30',1,'123456','http://www.baidu.com']]}
            ],
            shipId: ids.ShipInfoId
        }
        dbService.getConnection(function(conn) {
            dbService.metaBatchInsertShipDetails(conn, customerDBName, shipDetail, function(err, results) {
                if(err) {
                    assert(false);
                    done();
                }else {
                    var sqlTempl = "Delete %s.ShipDetails, %s.GoodsBatch from %s.ShipDetails " +
                        "LEFT JOIN %s.GoodsBatch ON ShipDetails.goodsId = GoodsBatch.goodsId "+
                        "WHERE ShipDetails.goodsId = 10";
                    console.log(sqlTempl)
                    var sql = sprintf(sqlTempl, customerDBName, customerDBName, customerDBName, customerDBName);
                    __mysql.query(sql, function(err, results1){
                        assert(results.affectedRows > 0 );
                        done();
                    });
                }
            });
        });
    });

    it('Testing dbService.getSumShipQtyByOrderId()', function(done) {
        dbService.getShipInfoByOrderId(customerDBName, ids.orderInfoId, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });

    it('Testing dbService.getShipDetails()', function(done) {
        dbService.getShipDetails(customerDBName,ids.ShipInfoId, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });

    it('Testing dbService.getShipDetailsByOrderId()', function(done) {
        dbService.getShipDetailsByOrderId(customerDBName, ids.orderInfoId, function(err, result) {
            assert(result.length > 0);
            done();
        });
    });

    it('Testing dbService.getShipInfo()', function(done) {
        var paginator = new Paginator([], [], {}, 1, 10);
        dbService.getShipInfo(customerDBName, ids.clientId, paginator, function(err, results) {
            assert(results.length>0);
            done();
        });
    });

    it('Testing dbService.getAllShipInfo()', function(done) {
        var paginator = new Paginator([], [], {}, 1, 10);
        dbService.getAllShipInfo(customerDBName, paginator, function(err, results) {
            assert(results.length>0);
            done();
        });
    });

    it('Testing dbService.getReturnInfo()', function(done) {
        var paginator = new Paginator([], [], {}, 1, 10);
        dbService.getReturnInfo(customerDBName,ids.clientId, paginator, function(err, results) {
            assert(results.length>0);
            done();
        });
    });

    it('Testing dbService.getAllReturnInfo()', function(done) {
        var paginator = new Paginator([], [], {}, 1, 10);
        dbService.getAllReturnInfo(customerDBName, paginator,{}, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });

    it('Testing dbService.getReturnDetailsById()', function(done) {
        dbService.getReturnDetailsById(customerDBName, ids.ReturnInfoId, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });

    it('Testing dbService.getReturnQtyByShipId()', function(done){
        dbService.getReturnQtyByShipId(customerDBName, ids.ShipInfoId, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });

    it('Testing dbService.metaUpdateReturnStatus()', function(done) {
        dbService.getConnection(function(conn) {
            dbService.metaUpdateReturnStatus(conn, customerDBName, ids.ReturnInfoId, {remark: '退货啦'}, function(err, results) {
                assert(results > 0);
                done();
            });
        });
    });

    it('Testing dbService.metaUpdateReturnStatusWithConfirmDate()', function(done) {
        dbService.getConnection(function(conn) {
            dbService.metaUpdateReturnStatus(conn, customerDBName, ids.ReturnInfoId, {remark: '再次退货啦'}, function(err, results) {
                assert(results > 0);
                done();
            });
        });
    });

    it('Testing dbService.metaUpdateShipInfo()', function(done) {
        dbService.getConnection(function(conn) {
            dbService.metaUpdateShipInfo(conn, customerDBName, ids.ShipInfoId, {receiverName: 'romens'}, function(err, results) {
                assert(results > 0);
                done();
            });
        });
    });
});
