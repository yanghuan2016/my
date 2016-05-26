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
 * unittest
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-14   hc-romens@issue#129     created
 *
 */


var assert = require("assert");
var app = require(__dirname+"/../../app.js");

describe('dbServer->trans', function() {
    var dbService = __dbService;
    var logger = __logService;
    var underscore = require("underscore");
    var customerDBName = __customerDBPrefix + "_127_0_0_1";
    var worker = require(__dirname + "/../goodsImporter.js")();

    /**
     * Test case#1: import GoodsTypes.xls file
     *
     */
    //describe('#importGoodsTypes()', function(){
    //    it('Testing importGoodsTypes(): subdomain="127.0.0.1"', function (done) {
    //        worker.importGoodsTypes(__dirname + "/商品类别.xls", customerDBName, function(){
    //            done();
    //        });
    //    });
    //});
    /**
     * Test case#2: import Goods.xls file
     *
     */
    describe('#importGoods()', function(){
        it('Testing importGoodsTypes(): subdomain="127.0.0.1"', function (done) {
            this.timeout(2000000); // add this code
            worker.importGoods(__dirname + "/商品.xls", customerDBName, function(){
                done();
            });
        });
    });
});
