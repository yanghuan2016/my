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
 * unittest database service
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-08   hc-romens@issue#79     created
 *
 */


var assert = require("assert");
var app = require(__dirname+"/../../app.js");

describe('dbServer->trans', function() {
    var dbService = __dbService;
    var logger = __logService;
    var underscore = require("underscore");
    var customerDBName = __customerDBPrefix + "_127_0_0_1";

    /**
     * Test case#1: Transaction wrapper test
     *
     */
    describe('#beginTrans()', function(){
        it('Testing dbService.beginTrans(): subdomain="127.0.0.1"', function (done) {
            __dbService.beginTrans(function(connect){
                assert(connect);
                __dbService.commitTrans(connect, function(){
                    done();
                });
            });
        });
    });

    describe('#rollbackTrans()', function(){
        it('Testing dbService.rollbackTrans(): subdomain="127.0.0.1"', function (done) {
            logger.dump(Object.keys(dbService));
            __dbService.beginTrans(function(connect){
                assert(connect);
                __dbService.rollbackTrans(connect, function(){
                    done();
                });
            });
        });
    });


    ///**
    // * Test case : syncQuery
    // */
    //describe('#syncQuery()', function(){
    //    it('Testing dbService.syncQuery(): subdomain=127.0.0.1', function(done){
    //        logger.ndump("dbService", dbService);
    //
    //        __dbService.syncQuery(__dbService.getGoodsTypes, customerDBName, function(ret){
    //
    //            logger.ndump("ret", ret);
    //            done();
    //        });
    //        logger.footprint();
    //
    //    }) ;
    //});


});
