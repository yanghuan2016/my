var md5 = require('js-md5');

var expect = require('chai').expect;

var Md5Calibrator = require("../md5Calibrator");
var md5Calibrator = new Md5Calibrator(md5);

var MsgRobot = require("../msgRobot");
var msgRobot = new MsgRobot(md5Calibrator, true);

describe("SCC: msgRobot", function () {
    describe("#generateAppKey()", function () {
        it("should return string", function () {
            var wants = "string";
            var userId = 'hello';

            var actual = msgRobot.generateAppKey(userId);

            expect(typeof actual).to.equal(wants);
        });

        it("result.length should equal 32", function() {
            var wants = 32;
            var userId = 'hello';

            var actual = msgRobot.generateAppKey(userId);

            expect(actual.length).to.equal(wants);
        });
    });

    describe("#generateAppCode", function () {
        it("should return appCode", function () {
            var appKey = "d4df4965017256228a09095a43ddd1b3";

            var actual = msgRobot.generateAppCode(appKey);

            expect(actual.length).to.equal(32);
            expect(typeof actual).to.equal("string");

        });
    });

    describe("#checksum", function () {
        it("should return '5d41402abc4b2a76b9719d911017c592' when input: 'hello' ", function () {
            var input = 'hello';
            var wants = "5d41402abc4b2a76b9719d911017c592";

            var actual = msgRobot.checksum(input);

            expect(actual).to.equal(wants);
        });

        it("should return '776529a603e5e23f24489d0cb151f18d' when input is object", function () {
            var input = {
                msgId: "000011448961782353",
                msgType: "ORDER_NEW",
                msgData: {
                    name: "zp",
                    age: 23
                },
                checksum: "ABCDEFG"
            };
            var wants = "776529a603e5e23f24489d0cb151f18d";

            var actual = msgRobot.checksum(input);

            expect(actual).to.equal(wants);
        });
    });


    describe("#checkMsg", function () {
        it("should return true when input is real msg.", function () {
            var wants = true;
            var appCode = "801653014629eca3f4598ef04772a822";
            var inputMsg = "{\"version\":\"1.0\",\"msgId\":\"12f5d63f42-ab2f-4157-844c-9f7e551c6bcd1454555601454000001\",\"msgType\":\"INQUIRY_CREATE\",\"msgData\":{\"PurchasePlanTemp\":[{\"GUID\":\"0A418613-F210-4972-87B3-AEBC02DD4D5C\",\"MaterielCode\":\"10002\",\"SupplierCode\":\"10001\",\"PurchaseUpset\":0.0,\"UnitPriceTax\":10.0,\"BalancePeriod\":0.0,\"PlanQuantity\":200.0}]},\"checksum\":\"cae97cde5f9f27ecff12fe9be411290e\"}";

            var actual = msgRobot.isValidMsg(appCode, inputMsg);

            expect(actual).to.equal(wants);
        });

        xit("should return true when input is '776529a603e5e23f24489d0cb151f18d' & 'ABCDEFG' & object .", function () {
            var wants = true;
            var inputChecksum = "776529a603e5e23f24489d0cb151f18d";
            var appCode = "ABCDEFG";
            var inputMsg = {
                msgId: "000011448961782353",
                msgType: "ORDER_NEW",
                msgData: {
                    name: "zp",
                    age: 23
                },
                checksum: "776529a603e5e23f24489d0cb151f18d"
            };

            var actual = msgRobot.isValidMsg(inputChecksum, appCode, inputMsg);

            expect(actual).to.equal(wants);
        });
        var a = {
            "msg": "{\"version\":\"1.0\",\"msgId\":\"12f5d63f42-ab2f-4157-844c-9f7e551c6bcd1454555601454000001\",\"msgType\":\"INQUIRY_CREATE\",\"msgData\":{\"PurchasePlanTemp\":[{\"GUID\":\"0A418613-F210-4972-87B3-AEBC02DD4D5C\",\"MaterielCode\":\"10002\",\"SupplierCode\":\"10001\",\"PurchaseUpset\":0.0,\"UnitPriceTax\":10.0,\"BalancePeriod\":0.0,\"PlanQuantity\":200.0}]},\"checksum\":\"cae97cde5f9f27ecff12fe9be411290e\"}"
        }
    });
    describe("#generateMsgId", function () {
        it("should return a string length 26 when input: client, 1", function () {
            var userType = "client";
            var userId = 1;
            var wants = 26;
            var actual = msgRobot.generateMsgId(userType, userId);

            expect(actual.length).to.equal(wants);
            expect(typeof actual).to.equal('string');
        });
    });
});