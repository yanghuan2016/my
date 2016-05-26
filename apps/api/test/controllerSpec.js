var expect = require("chai").expect;
var sinon = require("sinon");

var app = require("../../../app");
var controller = require("../controller");
var ApiModel = require("../model");
var express = require("express");


describe("api/model", function () {
    var apiModel = null;

    beforeEach(function () {
        apiModel = new ApiModel(__dbService);
    });

    describe("#getAppKeyHandler", function () {
        it("should return 'object:feedback' when input userId:1, userType:'client'", function () {
            //given
            var func = function () {
            };

            var req = { param: func };
            var stub = sinon.stub(req, "param");
            stub.withArgs("userId").returns("1");
            stub.withArgs("userType").returns("client");

            var res = { json: func };
            var spy = sinon.spy(res, "json");

            //when
            apiModel.getAppKeyHandler(req, res);

            //when
            expect(spy.calledOnce).to.be.true;
        })
    });
});

