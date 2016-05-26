var assert              = require("assert");
var app                 = require('./../../app');
var CacheService        = require('../../services/cacheService');

var cacheService        = new CacheService();

describe('SCC:testErpConfig', function(){
    describe('#getErpConfig()', function () {
        it('should return null', function (done) {
            cacheService.getErpConfig('0', 'CloudDB_qiuyi', function (err, result) {
                console.log('result:', result);
                done();
            });
        });

        it('should return json序列化', function (done) {
            cacheService.getErpConfig('2', 'CloudDB_qiuyi', function (err, result) {
                console.log('result:', result);
                done();
            });
        });

        it('should return json序列化', function (done) {
            cacheService.getErpConfig('3', 'CloudDB_qiuyi', function (err, result) {
                console.log('result:', result);
                done();
            });
        });
    });
});
