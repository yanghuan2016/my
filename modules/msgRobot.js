var underscore = require("underscore");

function MsgRobot(calibrator, strict) {
    this.calibrator = calibrator;
    this.strict = strict;
}

MsgRobot.prototype.generateAppKey = function (userId) {
    return this.calibrator.calculateMd5ChecksumWithTime(userId);
};

MsgRobot.prototype.generateAppCode = function (appKey) {
    return this.calibrator.calculateMd5ChecksumWithTime(appKey);
};

MsgRobot.prototype.checksum = function (objMsg) {
    if (typeof objMsg !== "string") {
        return this.calibrator.calculateMd5Checksum(JSON.stringify(objMsg));
    }
    return this.calibrator.calculateMd5Checksum(objMsg);
};

MsgRobot.prototype.isValidMsg = function (appCode, receivedMsg) {
    if(!this.strict) {
        return true;
    }
    var receivedCheckSum = receivedMsg.checksum;
    var receiveMsgStr = JSON.stringify(receivedMsg);
    var tempMsg = receiveMsgStr.replace(/"checksum":"([a-z0-9]){32}"}$/, '"checksum":"' + appCode + '"}');
    var checksum =  this.checksum(tempMsg);
    return checksum === receivedCheckSum;
};

var getCounter = (function (timeSign) {
    var counter = 0;
    var timeStamp = timeSign;
    return function (timeSign) {
        if (timeSign === timeStamp) {
            counter += 1;
        } else {
            counter = 1;
            timeStamp = timeSign;
        }
        return counter;
    };
})();

MsgRobot.prototype.generateMsgId = function (userId) {
    var senderSign = "20";
    var userIdSign = (new Array(7).join("0") + userId).slice(-6);
    var timeSign = new Date().getTime().toString();
    var counterSign = (new Array(6).join("0") + getCounter(timeSign)).slice(-5);

    return senderSign + userIdSign + timeSign + counterSign;
};

MsgRobot.prototype.generateMsg = function(version, userId, msgType, appCode, msgData) {
    var msgId = this.generateMsgId(userId);
    var msg = {
        version: version,
        userId: userId,
        msgId: msgId,
        msgType: msgType,
        msgData: msgData,
        checksum: appCode
    };
    msg.checksum = this.checksum(msg);
    return msg;
};

module.exports = MsgRobot;