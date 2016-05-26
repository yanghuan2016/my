'use strict';

exports.getOrderlist = function(args, res, next) {
  /**
   * parameters expected in the args:
  * enterpriseId (Long)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "oeder" : [ {
      "returnSize" : 123456789,
      "clientId" : 123456789,
      "remark" : "aeiou",
      "paymentType" : "aeiou",
      "consigneeName" : "aeiou",
      "total" : 1.3579000000000001069366817318950779736042022705078125,
      "consigneeMobileNum" : "aeiou",
      "createdTime" : "2000-01-23T04:56:07.000+0000",
      "id" : 123456789,
      "operatorId" : 123456789,
      "displayOrderId" : "aeiou",
      "paymentStatus" : "aeiou",
      "consigneeAddress" : "aeiou",
      "status" : "aeiou"
    } ]
  },
  "status" : 123
};
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }
  
}

