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
 * unittest database service: addressbook
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-26    xdw-romens@issue#46
 *
 */


var assert = require("assert");
var app = require(__dirname+"/../../../app.js");
var sprintf = require("sprintf-js").sprintf;

describe('dbServer->customer->addressbook', function() {
    var dbService = __dbService;
    var underscore = require("underscore");
    var customerDBName = __customerDBPrefix + "_127_0_0_1";

    var ids = {};
    before(function(done) {
        var sqlTempl = "INSERT INTO %s.ClientAddress (clientId, detailAddress) VALUES (?, ?);";
        var sql = sprintf(sqlTempl, customerDBName);
        __mysql.query(sql, [1, 'ROMENS'], function(err, results){
            if(err) {
                done(err);
            }else {
                ids.clientAddressId = results.insertId;
                done();
            }
        });
    });

    after(function(done) {
        var sqlTempl = "Delete from %s.ClientAddress WHERE id = ? ;";
        var sql = sprintf(sqlTempl, customerDBName);
        __mysql.query(sql, [ids.clientAddressId], function(err, result){
            if(err) {
                done(err);
            }else {
                done();
            }
        });
    });

    /* Test cases */
    it('Testing dbService.addAddress()', function(done){
        var detailAddress = '王伟 成都市青岛市城阳区城阳街道古庙头社区 13000000000';
        var clientId = 1;
        dbService.addAddress(customerDBName, clientId, detailAddress, function(err,addressId){
            if(err) {
                assert(false);
                done();
            }else {
                var sqlTempl = "Delete from %s.ClientAddress WHERE id = ? ;";
                var sql = sprintf(sqlTempl, customerDBName);
                __mysql.query(sql, [addressId], function(err, result){
                    assert(result.affectedRows == 1);
                    done();
                });
            }
        });
    });

    it('Testing dbService.updateAddress()', function(done){
        var detailAddress = '王伟 成都市青岛市城阳区城阳街道古庙头社区 13000000000';
        dbService.updateAddressDetail(customerDBName, ids.clientAddressId, detailAddress, function(err, changedRows){
            assert(changedRows > 0);
            done()
        });
    });

    it('Testing deleteAddress with a normal address object', function(done){
        var sqlTempl = "INSERT INTO %s.ClientAddress (clientId, detailAddress) VALUES (?, ?);";
        var sql = sprintf(sqlTempl, customerDBName);
        __mysql.query(sql, [1, 'ROMENS'], function(err, results){
            if(err) {
                assert(false);
                done();
            }else {
                dbService.deleteAddress(customerDBName, results.insertId, function(err, affectedRows){
                    assert(affectedRows > 0);
                    done();
                });
            }
        });
    });
});
