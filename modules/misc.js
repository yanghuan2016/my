var underscore = require("underscore");

exports.stringify = function(obj) {
    return underscore.isObject(obj)?JSON.stringify(obj):obj;
}

exports.stringWithoutNull = function(obj) {
    return underscore.isNull(obj)?"":obj;
}

