/**
 * @license TwistJS
 * (c) 2014 Kivra AB https://kivra.com
 * License: MIT
 */

/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 *  Format-perserving Encryption
 *  用来生成displayId
 */
var PATTERN = /[0-9ACHWY]+/;
var IDLEN = 6;

// Generate rotation delta
var delta = function (x, secret) {
    var chars = secret.split('');
    var value = 0;
    for (var i = 0; i < chars.length; i++) {
        var charVal = chars[i].charCodeAt();
        value += x + (i * charVal);
    }
    return value;
};

// Rotate
var rotate = function (config, value, x, secret, revese) {
    var size = config.codeToChar.length;
    var d = delta(x, secret);
    value = config.charToCode[value];
    d %= size;
    if (revese) {
        value += size - d;
    } else {
        value += d;
    }
    value %= size;
    return config.codeToChar[value];
};

var twist = function (pattern, value, secret, reverse) {
    var config = {
        charToCode: {},
        codeToChar: []
    };
    if (!pattern.test(value)) {
        throw 'Message does not fit pattern';
    }
    for (var i = 32; i <= 382; i++) {
        var char = String.fromCharCode(i);
        if (pattern.test(char)) {
            config.charToCode[char] = config.codeToChar.length;
            config.codeToChar.push(char);
        }
    }
    value = value.split('');
    for (var j = value.length - 1; j >= 0; j--) {
        value[j] = (rotate(config, value[j], j + 1, secret, reverse));
    }
    return value.join('');
};

/**
 * 将数据库表id转换为显示id
 * @param dbId
 * @param yyyymmdd
 * @param prefix prefix string
 * @return display id
 */
var shuffle = function(dbId, yyyymmdd, prefix) {
    var sprintf = require("sprintf-js").sprintf;
    var strDBId = sprintf("%0" + IDLEN + "d", dbId).slice(-IDLEN);
    return prefix + yyyymmdd + twist(PATTERN, strDBId, yyyymmdd);
};

/**
 * NOT IMPLEMENTED YET!!!
 * 将显示id转换为数据库表id,
 * @param displayId
 * @param yyyymmdd
 * @return int table id
 */
var deShuffle = function(displayId, yyyymmdd) {
    var twistId = displayId.slice(-IDLEN);
    return parseInt(twist(PATTERN, twistId, yyyymmdd, true));
};

exports.getDisplayId = shuffle;
/*exports.getDBId = deShuffle;*/
/**
exports.encrypt = twist;
exports.decrypt = function (pattern, value, secret) {
    return twist(pattern, value, secret, true);
};
 **/
