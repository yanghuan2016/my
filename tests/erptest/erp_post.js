var http = require('http');
var crypto = require('crypto');
var md5 = require('js-md5');

var Md5Calibrator = require("../../modules/md5Calibrator");
var md5Calibrator = new Md5Calibrator(md5);
var MsgRobot = require("../../modules/msgRobot.js");
msgRobot = new MsgRobot(md5Calibrator, true);
function get_appCode(host,port){
    var post_get_appCode_data = JSON.stringify({
        appKey : 'a92cc5ce8feba1db4c32aaba2291fa2e',
        ttl : '600'
    });
    var get_appCode_options = {
        host: host,
        path: '/api/erp/appCode/6',
        port: port,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_get_appCode_data.length
        }
    };
    var req = http.request(get_appCode_options,function(res){
        var body = [];

        res.on('data',function(chunk){
            body.push(chunk)
        });
        res.on('end',function(){
            console.log('body',body[0].toString());
            if(JSON.parse(body[0]).status == 200) {
                var appCode = JSON.parse(body).data.appCode;
                console.log(appCode);
                quotationPost(host,port,appCode)
            }else{
                console.log(JSON.parse(body))
            }

        })
    });
    req.write(post_get_appCode_data);
    req.end();

}
get_appCode("buyer1",3300);


var quotationMsgData = [{
    guid:2, //询价单ERP内码
    HH:"1150201080",//询价商品货号
    supplierLicenseNo:"65290002222222",//询价企业的营业执照号
    purchaseset:9.99,//参考底价
    balancePeriod:30,//结算期天数
    planQuantity:100//计划数量
}];
//quotationMsgData = quotationMsgDatasrc[0];
//var G2S4R = JSON.parse('['+JSON.stringify(quotationMsgData[0]) +','+ JSON.stringify(quotationMsgData[1]) +','+ JSON.stringify(quotationMsgData[0])  +','+  JSON.stringify(quotationMsgData[1])+']')
//G2S4R[0].HH = G2S4R[1].HH = "1150201081"
//console.log(JSON.stringify(G2S4R))
function quotationPost(host,port,appCode){
    var quotationMd5 = crypto.createHash('md5');
    var quotationList = JSON.stringify(quotationMsgData);
    var quotationData = {
        version: 1.0,
        userId: 6,
        msgId: 1,
        msgType: 'INQUIRY_CREATE',
        msgData: quotationList,
        checksum: appCode
    };
    var postData = msgRobot.generateMsg(quotationData.version,quotationData.userId,quotationData.msgType,quotationData.checksum,quotationData.msgData)
    postData = JSON.stringify({msg: JSON.stringify(postData)});
    var post_quotationData = JSON.stringify(quotationData);
    var quotation_options = {
        host: host,
        path: '/api/erp/6',
        port: port,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };
    setTimeout(function() {
        var req = http.request(quotation_options, function(res) {
            var body = [];
            res.on('data', function(chunk){
                body.push(chunk);
            });

            res.on('end', function(){
                console.log(body.concat().toString());
            });
        });
        req.write(postData);
        req.end();

    }, 1000);

}



//http.createServer(function(req, res){
//
//    var body = '';
//    req.on('data', function(chunk) {
//        body += chunk;
//    });
//
//    req.on('end', function() {
//        console.log("body="+body);
//        try {
//            //var userId = Number(req.param("uid"));
//            var msgData = JSON.parse(req.body.msg);
//            console.log(msgData)
//            console.log(JSON.stringify(msgData.msg))
//        } catch (error) {
//            console.log(error)
//        }
//        res.writeHeader(200, {'Content-Type': 'text/plain'});
//        res.write('back to you');
//        res.end();
//    });
//}).listen(9527);