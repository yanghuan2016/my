var ERPCutomersAsync = require('../goodsAsync/ERPCutomersAsync');
var async = require('async');
var TYPE = 'ASYNC_CUSTOMERSBASICINFO';

var EventProxy = require('eventproxy');

describe('test customer', function() {
    this.timeout(6000000);
    /**
     * unit test below
     */
    //it('get data', function(done){
    //    var erpCutomersAsync = new ERPCutomersAsync(6);
    //    ��ERP����ͬ�����е�BUYER ���ݻ�SELLER����
    //    //erpCutomersAsync.sendMsg('SELLER_ALL', {}, function(err, data) {
    //    erpCutomersAsync.sendMsg('BUYER_ALL', {}, function(err, data) {
    //        console.log(data.data);
    //        done();
    //    });
    //});
    //
    //it('insert buyer', function(done) {
    //    var erpCutomersAsync = new ERPCutomersAsync(6);
    //    var data = [
    //        ['10001', '10001', '10001']
    //    ];
    //    erpCutomersAsync.insertClientBuyerInfo(data, function(err, data) {
    //        console.log(data);
    //        console.log(err);
    //        done();
    //    })
    //});
    //
    //it('insert seller', function(done) {
    //    var erpCutomersAsync = new ERPCutomersAsync(6);
    //    var data = [
    //        ['10001', '10001', '10001']
    //    ];
    //    erpCutomersAsync.insertClientSellerInfo(data, function(err, data) {
    //        console.log(data);
    //        console.log(err);
    //        done();
    //    })
    //});
    /**
     * unit test end
     */

    //
    //it(' test  buyer async ', function(done) {
    //    var erpCutomersAsync = new ERPCutomersAsync(6);
    //    erpCutomersAsync.sendMsg('BUYER_ALL', {}, function(err, _data) {
    //        var data = JSON.parse(_data.data).GL_Super;
    //        var buyer = [];
    //        for(var i=0; i<data.length; i++) {
    //            var arr = [];
    //            arr.push(data[i].TJBH);
    //            arr.push(data[i].FDELETED);
    //            arr.push(data[i].YYZZ);
    //            buyer.push(arr);
    //        }
    //        console.log(buyer);
    //
    //        erpCutomersAsync.insertClientBuyerInfo(buyer, function(err, data) {
    //            console.log(data);
    //            console.log(err);
    //            done();
    //        })
    //    });
    //});

    it('test async both ', function(done) {

        //var types = ['SELLER_ALL', 'BUYER_ALL'];
        var types = ['SELLER_ALL'];

        var ep = new EventProxy();
        ep.fail(function(err) {
            console.log(err);
        });

        ep.after('data', types.length, function (list) {
            console.log(list);
            done();
        });

         types.forEach(function(type) {
             asyncCustomer(type, ep.group('data'));
         });

         function asyncCustomer(_type, cb) {
            var type = _type || 'SELLER_ALL';

             var erpCutomersAsync = new ERPCutomersAsync();
             erpCutomersAsync.getCustomerIds(erpCutomersAsync.cloudDBName, function (err, data) {
                if(err) {
                    return cb(err);
                }
                if(data.length == 0){
                    return cb("���ݿ�ȱʧ��ǰcloudDBName��Ϣ");
                }
                var idObj = data[0];
                //erpCutomersAsync.enterpriseId = idObj.id;
                erpCutomersAsync.enterpriseId = 6;
                erpCutomersAsync.sendMsg(type, {}, function(err, _data) {
                    var data = JSON.parse(_data.data).SELLER;
                    //var data = JSON.parse(_data.data);
                    console.log(data[0]);

                    var buySeller = [];
                    for(var i=0; i<data.length; i++) {
                        var arr = [];
                        arr.push(data[i].TJBH);
                        arr.push(data[i].FDELETED);
                        arr.push(data[i].YYZZ);
                        buySeller.push(arr);
                    }
                    erpCutomersAsync.restoreIntoDB(buySeller,type, function(err, dataObj) {
                       if(err){
                           logger.error(err);
                           done();
                       } else{
                           erpCutomersAsync.sendMsg( dataObj.msgType,dataObj.data,function(err,result){
                               if(err){logger.error(err);}
                               console.log(result);
                           });
                           done();
                       }
                    });
                });
            });
        }
    });
});


