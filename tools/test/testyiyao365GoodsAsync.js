var GoodsAsync = require('../goodsAsync/yiyao365goodsAsync');

var fs = require('fs');
var async = require('async');
describe('test yiyao365GoodsAsync', function() {
    this.timeout(6000000);

    it('final test', function(done) {
        var goodsAsync = new GoodsAsync();
        goodsAsync.getyiyao365AllGoodsNum(function(err, data) {

            goodsAsync.getPagedyiyao365GoodsInfo(data, function(err, data) {

                for(var i=0; i<data.length;i++) {
                    for(var j=0;j<data[i].length;j++) {
                        var middle = data[i][j];
                        var HH = middle.HH;
                        var UPDATEDATE = middle.UPDATEDATE;
                        data[i][j] = [HH, UPDATEDATE];
                    }
                }
                console.log(data.length);
                goodsAsync.insertCloudDBGoodInfo(data, function(err, data) {
                    goodsAsync.getCloudDBGoodsInfo(function(err, data) {

                        for(var i=0;i<data.length;i++) {
                            data[i] = data[i].skuNo;
                        }
                        console.log(data.length);
                        goodsAsync.getGoodsInfoByGuid(data, function(err, data) {
                            console.log(err);
                            //console.log(data);
                            done();
                        });
                    });
                });
            });
        });
    });
    /**
     * unit test below
     */
    //it('get num', function(done) {
    //    var goodsAsync = new GoodsAsync();
    //    goodsAsync.getyiyao365AllGoodsNum(function(err, data) {
    //        console.log(data);
    //        done();
    //    });
    //});

    //it('get info', function(done) {
    //    var goodsAsync = new GoodsAsync();
    //    goodsAsync.getPagedyiyao365GoodsInfo(178199, function(err, data) {
    //        console.log(typeof data);
    //        console.log(data.length);
    //        console.log(data[0].length);
    //        done();
    //    });
    //});
    //
    //it('insert base info', function(done) {
    //    var data = [
    //                [
    //                    ['1000001', '2016-01-20 00:00:00.000'], ['1000002', '2016-01-20 00:00:00.000']
    //                ],
    //                [
    //                    ['1000003', '2016-01-20 00:00:00.000'], ['1000004', '2016-01-20 00:00:00.000']
    //                ]
    //    ];
    //    var goodsAsync = new GoodsAsync();
    //    goodsAsync.insertCloudDBGoodInfo(data, function(err, data) {
    //        console.log(err);
    //        console.log(data);
    //        done();
    //    });
    //});

    //it('get diff', function(done) {
    //    var goodsAsync = new GoodsAsync();
    //    goodsAsync.getCloudDBGoodsInfo(function(err, data) {
    //        for(var i=0;i<data.length;i++) {
    //            data[i] = data[i].guid
    //        }
    //
    //        goodsAsync.getGoodsInfoByGuid(data, function(err, data) {
    //           // console.log(data);
    //            done();
    //        });
    //    });
    //});
    //
    //it('get info', function(done) {
    //    var goodsAsync = new GoodsAsync();
    //    var data = [1000001,1000002];
    //    goodsAsync.getGoodsInfoByGuid(data, function(err, data) {
    //       // console.log(data);
    //        done();
    //    });
    //});
    //
    //
    //it('test md5 checkcode', function() {
    //    var crypto = require('crypto');
    //    function getMD5(text){
    //        console.log(text);
    //        var nowTime = new Date().Format("yyyyMMdd");
    //        console.log(nowTime);
    //        var md5 = crypto.createHash("md5");
    //        md5.update(text+nowTime);
    //        var base64String = md5.digest().toString('base64').replace(/=/g, "-").replace(/\+/g, "_");
    //        console.log(base64String);
    //        return base64String;
    //    }
    //
    //
    //    // 对Date的扩展，将 Date 转化为指定格式的String
    //    // 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
    //    // 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
    //    // 例子：
    //    // (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
    //    // (new Date()).Format("yyyy-M-d hs.S")      ==> 2006-7-2 8:9:4.18
    //    Date.prototype.Format = function (fmt) {
    //        var o = {
    //            "M+": this.getMonth() + 1, //月份
    //            "d+": this.getDate(), //日
    //            "h+": this.getHours(), //小时
    //            "m+": this.getMinutes(), //分
    //            "s+": this.getSeconds(), //秒
    //            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    //            "S": this.getMilliseconds() //毫秒
    //        };
    //        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    //        for (var k in o)
    //            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    //        return fmt;
    //    };
    //    console.log(getMD5("SCC"));
    //});

    //it('test insert', function(done) {
    //   var data =  [ { GUID: '0000e48cf7d24939b182ab405e0b0b7b',
    //        HH: '1000002',
    //        MEDICINETITLE: '六味地黄丸',
    //        PZWH: '国药准字Z34020368',
    //        GG: '每8丸相当于原药材3克',
    //        JX: '丸剂(浓缩丸)',
    //        FACTORYADDRESS: '黄山市天目药业有限公司',
    //        FACTORYNAME: '黄山市天目药业有限公司',
    //        MEMO: '每8丸相当于原药材3克',
    //        ZCFF: '密封。',
    //        CLASSID: '501e36b4-69d5-4763-8583-d7c21d01a62a',
    //        ZZ: '滋阴补肾。用于肾阴亏损，头晕耳鸣，腰膝酸软，骨蒸潮热，盗汗遗精。',
    //        JJ: '',
    //        MEMO2: '',
    //        BLFY: '',
    //        YFYL: '口服，一次8丸，一日3次。',
    //        TYPE: '中成药',
    //        ENGLISHNAME: '',
    //        PRODUCTNAME: '',
    //        OLDPZWH: '',
    //        APPLYDATE: '2010-03-04',
    //        BWM: '86904416000855',
    //        XHZY: '如与其他药物同时使用可能会发生药物相互作用，详情请咨询医师或药师。',
    //        YLDL: '',
    //        PRICE: '0.0',
    //        IMGPATH: 'images/medicineDome.jpg',
    //        BARCODE: null,
    //        UPDATEDATE: '2016-01-20 00:00:00.000' },
    //        { GUID: '0000b4334c5948d8a68aa8a7023b646a',
    //            HH: '1000001',
    //            MEDICINETITLE: '复方联苯苄唑乳膏',
    //            PZWH: '国药准字H20066755',
    //            GG: '复方：每支10克,含联苯苄唑(C22H18N2) 0.1克、克罗米通(C13H17NO) 0.5克、利多卡因(C1',
    //            JX: '软膏剂',
    //            FACTORYADDRESS: '河南羚锐生物药业有限公司',
    //            FACTORYNAME: '河南羚锐生物药业有限公司',
    //            MEMO: '复方：每支10克,含联苯苄唑(C22H18N2) 0.1克、克罗米通(C13H17NO) 0.5克、利多卡因(C14H22N2O) 0.2克、甘草',
    //            ZCFF: '阴凉处存',
    //            CLASSID: '501e36b4-69d5-4763-8583-d7c21d01a62a',
    //            ZZ: '',
    //            JJ: null,
    //            MEMO2: null,
    //            BLFY: '',
    //            YFYL: '',
    //            TYPE: '化学药制剂',
    //            ENGLISHNAME: 'Compound Bifonazole Cream',
    //            PRODUCTNAME: '',
    //            OLDPZWH: '',
    //            APPLYDATE: '2011-08-05',
    //            BWM: '86903049000058',
    //            XHZY: '',
    //            YLDL: '',
    //            PRICE: '',
    //            IMGPATH: 'images/medicineDome.jpg',
    //            BARCODE: null,
    //            UPDATEDATE: '2016-01-20 00:00:00.000' } ];
    //
    //    var goodsAsync = new GoodsAsync();
    //    goodsAsync.batchInsertIntoGoodsCache(data, function(err, results) {
    //        console.log(err)
    //        console.log(results);
    //        done();
    //    });
    //});

});


