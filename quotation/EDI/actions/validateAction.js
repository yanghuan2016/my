/**
 * validateAction
 */
var Dispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');

module.exports = {
    //验证单个字段是否符合要求
    validateFunc: function (type, data) {
        logger.info("开始验证");
        logger.info("验证的字段是：");
        logger.ndump('type', type);
        logger.ndump('data', data);
        var temp = {
            type: type,
            data: data
        };
        Dispatcher.dispatch(new Action(actionConstants.VALIDATE, temp));
    }
};