var expect = require('chai').expect;

var Md5Calibrator = require("../md5Calibrator");
var md5 = require('js-md5');

var md5Calibrator = new Md5Calibrator(md5);

var MsgRobot = require("../msgRobot");
var msgRobot = new MsgRobot(md5Calibrator, true);


describe('md5calibrator', function () {
    it('test number md5', function () {
        var a = '1234567890';
        var b = 'e807f1fcf82d132f9bb018ca6738a19f';

        var result = md5Calibrator.calculateMd5Checksum(a);
        expect(result).to.equal(b);
    });

    it('test char md5', function () {
        var a = 'abcd';
        var b = 'e2fc714c4727ee9395f324cd2e7f331f';

        var result = md5Calibrator.calculateMd5Checksum(a);
        expect(result).to.equal(b);
    });

    it('test 中文 md5', function () {
        var a = '中文';
        var b = 'a7bac2239fcdcb3a067903d8077c4a07';

        var result = md5Calibrator.calculateMd5Checksum(a);
        expect(result).to.equal(b);
    });
});