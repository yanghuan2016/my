var c =1;
console.log(c);
var moment = require('moment');
var a = moment("2016-03-28 00:00:00");
var b = moment();
console.log(b.diff(a,'days'));
//data = {
//
//
//    "businessLicenseValidateDate"   :"营业执照",
//    "orgCodeValidateDate"           :"组织机构代码证",
//    "taxRegistrationLicenseNumValidateDate": "税务登记证",
//    "foodCirculationLicenseNumValidateDate": "食品流通许可证",
//    "qualityAssuranceLicenseNumValidateDate": "质量保证协议",
//    "medicalApparatusLicenseNumValidateDate": "医疗器械许可证",
//    "healthProductsLicenseNumValidateDate": "保健品证书",
//    "productionAndBusinessLicenseNumValidateDate": "生产经营许可证",
//    "mentalanesthesiaLicenseNumValidateDate": "精神麻醉证",
//    "gmpOrGspLicenseNumValidateDate": "GMP/GSP证书",
//    "hazardousChemicalsLicenseNumValidateDate": "危化品许可证",
//    "medicalInstitutionLicenseNumValidateDate": "医疗机构执业许可证",
//    "maternalLicenseNumValidateDate": "母婴保健技术执业许可证",
//    "institutionLegalPersonCertValidateDate": "事业单位法人证书"
//
//}
//var results = [{"goodsId": 77, "shippedQuantitySum": 9, "returnShippedQuantity": null}, {
//    "goodsId": 159,
//    "shippedQuantitySum": 22,
//    "returnShippedQuantity": null
//}];
//var goodsArr = [{
//    "goodsId": "77",
//    "allowReturnQuantity": "9",
//    "price": "1176",
//    "batchDatas": [["77", "123", "9", "9", "2016-04-28 00:00:00", "2016-06-28 00:00:00", "123", "/static/upload/0.630785112734884.jpg"]]
//}, {
//    "goodsId": "159",
//    "allowReturnQuantity": "22",
//    "price": "1069.8",
//    "batchDatas": [["159", "123", "22", "22", "2016-05-28 00:00:00", "2016-09-28 00:00:00", "1231", "/static/upload/0.5126949620898813.jpg"]]
//}];
//
//var __returnStrictly = true;
//underscore.map(results,function(checkItem){
//    console.log(underscore.pluck(goodsArr,"goodsId").indexOf(checkItem.goodsId));
//    console.log((checkItem.goodsId).toString());
//    if(underscore.pluck(goodsArr,"goodsId").indexOf((checkItem.goodsId).toString())==-1&& __returnStrictly){
//        overGoodsLimit = true;
//        return;
//    }
//});
//console.log(overGoodsLimit);
//console.log(underscore.pluck(goodsArr,"goodsId"));

//function creatGuid(inquiryId,licenseNo){
//    var crypto = require('crypto');
//    var buffer=inquiryId+licenseNo;
//    crypto = crypto.createHash('md5');
//    crypto.update(buffer);
//    return crypto.digest('hex');
//}
//


//
//var results = [{
//    "id": 1,
//    "inquiryId": 1,
//    "buyerId": 6,
//    "buyerName": "ERP测试下游",
//    "licenseNo": "国药准字TEST",
//    "inquiryQuantity": 100,
//    "inquiryExpire": "2016-03-14T16:00:00.000Z",
//    "quotationQuantity": 0,
//    "quotationPrice": null,
//    "quotationExpire": "2016-03-10T09:05:27.000Z",
//    "clearingPeriod": null,
//    "createdOn": "2016-02-29T16:00:00.000Z",
//    "updatedOn": "2016-03-09T16:00:00.000Z"
//}, {
//    "id": 2,
//    "inquiryId": 1,
//    "buyerId": 6,
//    "buyerName": "ERP测试下游",
//    "licenseNo": "国药准字TEST2",
//    "inquiryQuantity": 200,
//    "inquiryExpire": "2016-03-14T16:00:00.000Z",
//    "quotationQuantity": 0,
//    "quotationPrice": null,
//    "quotationExpire": "2016-03-10T09:50:38.000Z",
//    "clearingPeriod": null,
//    "createdOn": "2016-02-29T16:00:00.000Z",
//    "updatedOn": "2016-03-09T16:00:00.000Z"
//}, {
//    "id": 3,
//    "inquiryId": 2,
//    "buyerId": 6,
//    "buyerName": "ERP测试下游",
//    "licenseNo": "国药准字TEST1",
//    "inquiryQuantity": 300,
//    "inquiryExpire": "2016-03-14T16:00:00.000Z",
//    "quotationQuantity": 0,
//    "quotationPrice": null,
//    "quotationExpire": "2016-03-11T00:54:25.000Z",
//    "clearingPeriod": null,
//    "createdOn": "2016-02-29T16:00:00.000Z",
//    "updatedOn": "2016-03-09T16:00:00.000Z"
//}];
//
//var underscore = require('underscore');
//var inquiryId = 2;
//var goodsSum = underscore.reduce(results, function (memo, obj) {
//    if(obj.inquiryId == inquiryId){
//        memo.inquiryQuantity+=obj.inquiryQuantity;
//    }
//    return memo;
//
//},{inquiryQuantity:0});
//console.log(goodsSum);

//var quotationExpire="2016-04-10T09:05:27.000Z";
//var target = new Date(quotationExpire).getMonth();
//var targetY = new Date(quotationExpire).getFullYear();
//var nowY = (new Date()).getFullYear();
//var now = (new Date()).getMonth();
//console.log(now);
//console.log(nowY);
//console.log(target);
//console.log(targetY);

//var time = new Date();
//var expireMin = 15;
//time.setMinutes(time.getMinutes() + expireMin, time.getSeconds(), 0);
//console.log(time.toLocaleString());
//var insertArrlist = [];
//var returnId = 1;
//underscore.map(returnItems,function(item){
//    var itemlist = [];
//    itemlist.push(returnId);
//    itemlist.push(item.goodsId);
//    itemlist.push(item.quantity);
//    if(insertArrlist.length>0){
//        underscore.map(insertArrlist,function(obj){
//            if( obj[1] == itemlist[1]){
//                obj[2] += itemlist[2];
//            } else{
//                insertArrlist.push(itemlist);
//            }
//        });
//    } else{
//        insertArrlist.push(itemlist);
//    }
//});
//console.log(insertArrlist);