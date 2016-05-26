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
 * 2015-09-26    xdw-romens@issue#56
 *
 */


var assert = require("assert");
var app = require(__dirname+"/../../../app.js");
var sprintf = require("sprintf-js").sprintf;

var dbService = __dbService;
var underscore = require("underscore");
var customerDBName = __customerDBPrefix + "_127_0_0_1";

describe('dbServer->customer->client', function() {
    var ids = {}
    before(function(done) {
        /**
         * 由于Client创建，触发了ClientGsp,CLientFinance和生成ClientGoodsPrice创建
         * 所以后面都要删除
         *
         */
        var sqlTempl = "INSERT INTO %s.ClientGsp (clientId, orgCode) VALUES (?, ?);";
        var sql = sprintf(sqlTempl, customerDBName);
        __mysql.query(sql, [100, 'romens'], function(err, results) {
            if(err) {
                done(err);
            }else {
                ids.clientGspId = results.insertId;
                done();
            }
        });
    });

    after(function(done) {
        var sqlTempl = "Delete from %s.ClientGsp WHERE id = ?";
        var sql = sprintf(sqlTempl, customerDBName);
        __mysql.query(sql, [ids.clientGspId], function(err, result){
            if(err) {
                console.log(err)
                done(err);
            }else {
                done();
            }
        });
    });

    it('Testing dbService.addClientGsp()', function(done) {
        var gspData = {legalRepresentative:"abc",
            businessLicense:"123"};
        dbService.addClientGsp(customerDBName,gspData,10000,function(err, insertId){
            if(err) {
                assert(false);
                done();
            }else {
                var sqlTempl = "Delete from %s.ClientGsp WHERE id = ?";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [insertId], function(err, results){
                    assert(results.affectedRows > 0);
                    done();
                });
            }
        });
    });

    it('Testing dbService.getGSP()', function(done) {
        dbService.getGSP(customerDBName, 100, function(err,result){
            assert(result != null);
            done();
        });
    });

    it('Testing dbService.updateGSP()', function(done) {
        var gspInfo = {
            "companyManager":"testUpdateName2",
            "orgCode":"testORGcode1234667"
        };
        dbService.updateGSP(customerDBName,  gspInfo, 100, function(err, affectedRows){
            assert(affectedRows > 0);
            done();
        });
    });

});
