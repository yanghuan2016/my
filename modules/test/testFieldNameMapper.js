

var assert1  = require("assert");
var assert = require("chai").assert;

var app = require(__dirname+"/../../app.js");
var logger = __logService;

var underscore = require("underscore");

var FieldNameMapper = require(__modules_path + "/fieldNameMapper");
var customerDBName = "CustomerDB";

describe('test for fieldNameMapper', function () {
    var map = {
        'commonName':'商品名',
        'goodsType': '产品类别',
        'goodsNo':'货号',
        'alias':'别名',
        'licenseNo':'批准文号',
        'producer':'生产企业'
    };
    var fieldNameMapper;

    before(function () {
    });

    it('-> test generator', function () {
        fieldNameMapper = new FieldNameMapper(map);

        assert.equal(fieldNameMapper.convertToField('商品名'), 'commonName');
        assert.equal(fieldNameMapper.convertToAlias('commonName'), '商品名');
    });

    it('-> should return empty string when input unknown param', function () {
        fieldNameMapper = new FieldNameMapper(map);

        assert.equal(fieldNameMapper.convertToAlias('123'), '');
        assert.equal(fieldNameMapper.convertToField('123'), '');
    });

    it('-> should return empty string when input empty string', function () {
        fieldNameMapper = new FieldNameMapper(map);

        assert.equal(fieldNameMapper.convertToAlias(''), '');
        assert.equal(fieldNameMapper.convertToField(''), '');
    });

});