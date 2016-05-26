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
 * 2015-09-26    hc-romens@issue#51
 *
 */


var assert = require("assert");
var app = require(__dirname+"/../../../app.js");

describe('dbServer->customer->order', function() {

    var dbService = __dbService;
    var underscore = require("underscore");

    /**
     * Test case#1: loadCustomerDBInfo()
     *
     */
    describe('#loadCustomerDBInfo()', function(){
        it('Testing dbService.loadCustomerDBInfo(): subdomain="127.0.0.1"', function (done) {
            dbService.loadCustomerDBInfo('127.0.0.1', function(err,results){
                __logService.dump(results[0].customerDBSuffix);
                assert( results[0].customerDBSuffix === '127_0_0_1');
                done();
            });
        });

    });

});
