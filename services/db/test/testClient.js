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
 * unittest database service: client
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-28    hc-romens@issue#65
 *
 */


var assert = require("assert");
var app = require(__dirname+"/../../../app.js");
var async = require("async");
var sprintf = require("sprintf-js").sprintf;

describe('dbServer->customer->client', function() {
    var dbService = __dbService;
    var logger = __logService;
    var underscore = require("underscore");
    var customerDBName = __customerDBPrefix + "_127_0_0_1";

    var ids = {};
    before(function(done) {
        var sqlTempl = "INSERT INTO %s.Client (clientCode, clientName ) VALUES (?, ?) ;";
        var sql = sprintf(sqlTempl, customerDBName);
        __mysql.query( sql, ['romens', 'romens'], function(err, results){
            if(err) {
                done(err);
            }else {
                ids.clientId = results.insertId;
                done();
            }
        });
    });

    after(function(done) {
        var sqlTempl = "DELETE %s.Client, %s.ClientGsp, %s.ClientFinance, %s.ClientPrice FROM %s.Client " +
            "LEFT JOIN %s.ClientGsp ON Client.id = ClientGsp.clientId " +
            "LEFT JOIN %s.ClientFinance ON Client.id = ClientFinance.clientId " +
            "LEFT JOIN %s.ClientPrice ON Client.id = ClientPrice.clientId " +
            "WHERE Client.id = ?;";

        var sql = sprintf(sqlTempl, customerDBName,customerDBName,customerDBName,customerDBName, customerDBName,customerDBName,customerDBName,customerDBName);
        __mysql.query(sql, [ids.clientId], function(err, result){
            if(err) {
                done(err);
            }else {
                done();
            }
        });
    });

    it('Testing dbService.getClientById()', function (done) {
        dbService.getClientById(customerDBName, ids.clientId, function (err,client) {
            assert(client);
            done();
        });
    });

    it('Testing dbService.updateClientFinance()', function(done) {
        var financeInfo = {
            credits: 100
        };
        dbService.updateClientFinance(customerDBName,financeInfo, ids.clientId, function(err, rows) {
            assert(rows > 0);
            done();
        });
    });

    it('Testing dbService.getClientFinance()', function(done) {
        dbService.getClientFinance(customerDBName, ids.clientId, function(err, results) {
            assert(results.length > 0);
            done();
        });
    });

    it('Testing dbService.metaNewClientInfo()', function(done){
        var clientInfo = {
            categoryName : "连锁零售类",
            clientCode : "bajian",
            clientName : "八剑大药房",
            clientArea : "成都",
            pricePlan : "PRICE2"
        };
        dbService.getConnection(function(connect) {
            dbService.metaNewClientInfo(connect, customerDBName, clientInfo, function(err, clientId) {
                if(err) {
                    assert(false);
                    done();
                }else {
                    var sqlTempl = "DELETE %s.Client, %s.ClientGsp, %s.ClientFinance, %s.ClientPrice FROM %s.Client " +
                        "LEFT JOIN %s.ClientGsp ON Client.id = ClientGsp.clientId " +
                        "LEFT JOIN %s.ClientFinance ON Client.id = ClientFinance.clientId " +
                        "LEFT JOIN %s.ClientPrice ON Client.id = ClientPrice.clientId " +
                        "WHERE Client.id = ?;";

                    var sql = sprintf(sqlTempl, customerDBName,customerDBName,customerDBName,customerDBName, customerDBName,customerDBName,customerDBName,customerDBName);
                    __mysql.query(sql, [clientId], function(err, results){
                        assert(results.affectedRows > 0);
                        done();
                    });
                }
            });
        });
    });
});



//db 方法已经改变,单元测试没有修改 可能需要修改
describe('test deleteGspTypesByClientId and insert newGspTypes ',function(){
    this.timeout(5000);
    var db = __dbService;
    var customerDBName = __customerDBPrefix + "_127_0_0_1";

    var logger = __logService;
    logger.enter();
    before(function(done){
        logger.debug('单元测试,删除旧的GSP控制类型 插入新的GSP控制类型');
        db.metaGspTypesDeleteByClientId(customerDBName,3,function(err,result) {
                if (err) {
                   done(err)
                }
                else{
                    logger.debug('删除成功,删除条数: '+ result.affectedRows);
                    done();
                }
        });
    });
    it('Testing metaGspTypesBatchInsert ',function(){
        logger.debug("现在进入了 批量插入gsp类型控制 方法");
        var insertData=[[3,1],[3,3]];
            db.metaGspTypesBatchInsert(customerDBName,insertData,function(err,result){
                if(err){
                    logger.error('批量插入Gsp类型出错');
                    logger.error(err);
                }
                else{
                    logger.debug('批量插入数据的条数: '+result.affectedRows);
                    assert.equal(true,result.affectedRows>0);
                    done();
                }
            });
    });




  /*  it(' delete first and update ',function(){

    });*/




});
