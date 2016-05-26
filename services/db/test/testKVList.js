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
 * unittest database service: kvList
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-05   hc-romens@issue#97     Simplified for db connection
 * 2015-09-30   hc-romens@issue#60
 *
 */


var assert = require("assert");
var app = require(__dirname+"/../../../app.js");

describe('dbServer->customer->kvList', function() {
    var dbService = __dbService;
    var underscore = require("underscore");
    var customerDBName = __customerDBPrefix + "_127_0_0_1";

    /**
     * Test case#1: loadCustomerDBInfo()
     *
     */
    describe('#setKeyValue()', function(){
        it('Testing dbService.setKeyValue(): subdomain="127.0.0.1"', function (done) {
            dbService.setKeyValue(customerDBName, 'key1', 'value1', function(success){
                assert(success);
                    dbService.getKeyValue(customerDBName,"key1", function(value){
                        assert(value==="value1");
                        dbService.setKeyValue(customerDBName, "key1", "value2", function(success){
                            assert(success);
                            dbService.getKeyValue(customerDBName, "key1", function(value){
                                assert(value==="value2");
                                done();
                            });
                        });
                    });
            });
        });

    });

});
