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
var clientModel = require(__base+"/apps/customer/client/model")();
var billModel=require(__base+"/apps/customer/bill/model")();

/*describe('dbService->customer->report', function() {
    var ids = {};
    before(function(done) {
        async.waterfall([
            function(cb) {
                var sqlTempl = 'INSERT INTO %s.Client (clientCode, clientName) VALUES (?, ?);';
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, ['romens', 'romens'], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.clientId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = 'INSERT INTO %s.OrderInfo (operatorId, clientId) VALUES (?, ?);';
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [1, ids.clientId ], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.orderInfoId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = 'INSERT INTO %s.OrderDetails (orderId, goodsId) VALUES (?, ?);';
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.orderInfoId, 1], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.orderDetailId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = 'INSERT INTO %s.ShipInfo (orderId, logisticsNo) VALUES (?, ?);';
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.orderInfoId, 'romens'], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.shipInfoId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = 'INSERT INTO %s.ShipDetails (shipId, goodsId, batchNum) VALUES (?, ?, ?);';
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.shipInfoId, 1, 'romens'], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.shipDetailsId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = 'INSERT INTO %s.ReturnInfo (shipId, orderId, operatorId) VALUES (?, ?, ?);';
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.shipInfoId, ids.orderInfoId, 1], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.returnInfoId = results.insertId;
                        cb(null, ids);
                    }
                });
            },
            function(ids, cb) {
                var sqlTempl = 'INSERT INTO %s.ReturnDetails (returnId, orderId, goodsId, quantity) VALUES (?, ?, ?, ?);';
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.returnInfoId, ids.orderInfoId, 1, 1], function(err, results) {
                    if(err) {
                        cb(err);
                    }else {
                        ids.returnDetailId = results.insertId;
                        cb(null, ids);
                    }
                });
            }
        ], function(err, results) {
            if(err) {
                console.log(err)
                done(err);
            }else {
                done();
            }
        });
    });

    after(function(done) {
        async.series([
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
            },
            function(cb) {
                var sqlTempl = "Delete from %s.OrderInfo WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.orderInfoId], function(err, result){
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
                __mysql.query(sql, [ids.orderDetailId], function(err, result){
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
                __mysql.query(sql, [ids.shipInfoId], function(err, result){
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, result);
                    }
                });
            },
            function(cb) {
                var sqlTempl = "Delete from %s.ShipDetails WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.shipDetailsId], function(err, result){
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
                __mysql.query(sql, [ids.returnInfoId], function(err, result){
                    if(err) {
                        cb(err);
                    }else {
                        cb(null, result);
                    }
                });
            },
            function(cb) {
                var sqlTempl = "Delete from %s.ReturnDetails WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [ids.returnDetailId], function(err, result){
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

    it('Testing dbService.getReportOrder()', function(done) {
        dbService.getReportOrder(customerDBName, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });

    it('Testing dbService.getReportShip()', function(done) {
        dbService.getReportShip(customerDBName, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });

    it('Testing dbService.getReportReturn()', function(done) {
        dbService.getReportReturn(customerDBName, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });
});*/

describe('get the refundList',function(){

    var filterCondition={
        startDate:''||'',
        endDate:''||'',
        refundReason:'ORDER_NOT_APPROVE'||'ALL',
        refundType:'ALL'||'ALL',
        refundStatus:'ALL'||'ALL',
        keyWord:'003'||''
    };
    logger.enter();
    var dbName = customerDBName;
    var paginator = clientModel.createPurePaginator({query:{}});
/*    before(function(done){
        var sqlInsert = 'INSERT INTO %s.Refund(id,displayRefundId,clientId,refundReason,refundType,orderId,displayOrderId,refundAmount,createdOn)' +
            ' VALUES(1,"TKD001",1,"ORDER_CANCEL","REDFLUSH",1,"DD001",2000,now()),(2,"TKD003",1,"ORDER_NOT_APPROVE","REFUND",2,"DD002",5000,now())';
            sqlInsert=sprintf(sqlInsert,dbName);
        __mysql.query(sqlInsert, function(err, results) {
            if(err) {
                logger.error(err);
                done(err);
            }else {
                done(null, results);
            }
        });

    });*/

/*    after(function(done){
       var sql=sprintf('DELETE FROM %s.Refund',dbName);
        __mysql.query(sql, function(err, results) {
            if(err) {
                logger.error(err);
                done(err);
            }else {
                done(null, results);
            }
        });
    });*/
    it('get refundList',function(done){
            dbService.listRefundData(dbName,filterCondition,paginator,function(err,result){
                if(err){
                    logger.error(err);
                }else{
                    assert(result[0].displayRefundId=='TKD003');
                    done(err,result);
                }
            })
    });
});

describe('get there fundDetail',function(){
    it('get RefundDetail by id TK003',function(done){
        billModel.getRefundDetail(customerDBName,'TKD003',function(err,result){
            if(err){
                logger.error('err');
            }
            else{
                assert(result);
                done(err,result);
            }

        });
    });
});

describe('客服 审核 退款金额测试',function(){
    it.only('update Refund Info ,客服审核退款',function(done){

       var displayRefundId='TKD003',
       updateObj={
               amount:4000,
               operatorId:2,
               operatorName:'操作员:sm2',
               remark:'我是客服,退款最多是4000',
               attchmentUrl:'/static/img/arrows.png,/static/img/bank.png'
           };
        billModel.callCenterVerifyRefund(customerDBName,displayRefundId,updateObj,function(err,result){
            if(err){
                logger.error(err);
                done(err);
            }else{
                done(err,result);
            }
        })
    });
});

describe('财务审核 同意 ',function(){

    var displayRefundId='TKD003',
        updateObj={
            operatorId:2,
            operatorName:'操作员:sm2',
            remark:'你说4000 就是4000 如果多退了 请负责',
        };
    it('db.financeStaffVerifyRefund  财务同意审核 ',function(done){
        billModel.financeStaffVerifyRefund(customerDBName,displayRefundId,updateObj,function(err,result){
                if(err){
                    logger.error(err);
                    done(err);
                }else{
                    assert(result[0]==1);
                    done(err,result);
                }
        });
    })



});

describe.only('财务审核 退回',function(){
    var displayRefundId='TKD003',
        updateObj={
            operatorId:2,
            operatorName:'操作员:sm2',
            remark:'4000 太多了 给你退回去'
        };
        it('db 审核退回',function(done){
            billModel.financeStaffRejectVerifyRefund(customerDBName,displayRefundId,updateObj,function(err,result){
                if(err){
                    logger.error(err);
                    done(err);
                }else{
                    done(err,result);
                }
            });
        })
});


