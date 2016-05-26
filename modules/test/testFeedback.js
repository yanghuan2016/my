var assert = require('chai').assert;
var app = require(__dirname+"/../../app.js");
var Feedback = require('../feedback');

describe("Feedback", function () {
    var feedback;

    beforeEach(function () {

    });

    //it('-> generator test input: success, ok, {abc: 123}', function () {
    //    feedback = new Feedback('success', 'ok', {abc: 123});
    //    console.log(feedback.status);
    //    console.log(assert.equal(feedback.status, 200));
    //    assert.equal(feedback.status, 200);
    //});
    //
    //it('-> generator test input: success, ok, {abc: 123}', function () {
    //    feedback = new Feedback('success', 'ok', {abc: 123});
    //    assert.equal(feedback.data.abc, 123);
    //});
    //
    //it('-> generator test input "",ok,{},', function () {
    //    feedback = new Feedback('','ok',{});
    //    assert.equal(feedback.status, 1599);
    //});
    //
    //it('-> generator test input "abc",ok,{},', function () {
    //    feedback = new Feedback('');
    //    assert.equal(feedback.status, 1599);
    //});
    //
    //it('-> generator test input nothing', function () {
    //    feedback = new Feedback();
    //    assert.equal(feedback.status, 1599);
    //});
});
