var expect = require("chai").expect;
var sinon = require("sinon");

var app = require("../../../app");
var controller = require("../controller");
var ApiModel = require("../model");
var express = require("express");

var model = new ApiModel();

var db = __dbService;


describe("test module: api/model", function () {

    it("测试scc发送报价单函数", function () {

        var enterpriseId = 6;



        var csutomerInfo = {
            customerId = 6,
            customerDB =
        };
        model.sendQuotation();
    });

});
