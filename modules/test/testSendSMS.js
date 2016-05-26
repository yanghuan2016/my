var expect = require("chai").expect;
var initEnv = require("./initEnv")();
var smsModule = require('../smsModule')();
var logger = global.__logService;

describe("testSmsModel", function () {

    xit("sendSMS by sysconfig ", function (done) {
        var mobile  = 18980712136;   // test mobile num
        var msg =" msg from sysconfig :123 ";    // test msg
        smsModule.sendSMS(mobile,msg,function(error,result){
            if (error) {
                logger.error(error);
            }
            expect(result).equal("OK");
            done();
        });
    });

    xit("sendSMS by client smsconfig", function (done) {
        var customerDB = "CustomerDB_dawei_127_0_0_1";
        var mobile  = 18980712136;   // test mobile num
        var msg =" msg from client config :123 ";    // test msg
        smsModule.sendClientSMS( customerDB,mobile,msg,function(error,result){
            if (error) {
                logger.error(error);
            }
            expect(result).not.equal(undefined);
            done();
        });
    });

});