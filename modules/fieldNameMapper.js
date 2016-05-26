var _ = require("underscore");

var _inverse = function (map) {
    return _.invert(map);
};

function ParamMapper(map) {
    this.aliasMap = map;
    this.fieldMap = _inverse(map);
    this.fieldKeys = _.keys(this.aliasMap);
    this.aliasKeys = _.keys(this.fieldMap)

}

ParamMapper.prototype.convertToField = function (alias) {

    var temp = alias ? alias.trim() : '';
    if (_.contains(this.aliasKeys, temp)) {
        return this.fieldMap[temp];
    }
    return '';
};

ParamMapper.prototype.convertToAlias = function (field) {
    var temp = field ? field.trim() : '';
    if(/^CONVERT\(\b(\w)*\b USING gb2312\)$/.test(field)) {
        temp = temp.replace(/^CONVERT\(\b/,'');
        temp = temp.replace(/\b USING gb2312\)/,'');
    }
    if (_.contains(this.fieldKeys, temp)) {
        return this.aliasMap[temp];
    }
    return '';
};

module.exports = ParamMapper;