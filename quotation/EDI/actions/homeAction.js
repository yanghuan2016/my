/**
 * 首页home Action
 * Created by time on 16-5-4.
 */
var Dispatcher = require('ediDispatcher');
var URL = require('edi/constantsUrl')();
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');
var RestService = require('util/restService');


module.exports = {
   homeAction:function(enterpriseId, enterpriseType){
       var url = URL.getHomeUrl.replace("enterpriseId", enterpriseId).replace("enterpriseType", enterpriseType);
       var service = new RestService(url);
       service.findAll(function(feedback){
           if (feedback.status == "200") {
               Dispatcher.dispatch(new Action(actionConstants.HOME_INFO, feedback.data));
           }
       });
   }
};