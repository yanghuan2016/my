'use strict';

exports.deleteCommonGoodsById = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsId (Integer)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsId" : 123456789
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

exports.getCommonGoodsById = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsId (Integer)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsInfo" : {
      "goodsNo" : "aeiou",
      "filingNumber" : "aeiou",
      "commonName" : "aeiou",
      "birthPlace" : "aeiou",
      "goodsDetails" : "aeiou",
      "imageUrl" : "aeiou",
      "producer" : "aeiou",
      "id" : 123,
      "goodsType" : "aeiou"
    }
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

exports.getDrugTypeList = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : "",
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

exports.getGoodsById = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsId (Integer)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsInventoryPlans" : [ {
      "isSystem" : true,
      "isDefault" : true,
      "name" : "aeiou",
      "id" : 123,
      "createdOn" : "aeiou"
    } ],
    "drugsTypeList" : [ "aeiou" ],
    "listPackUnit" : [ {
      "name" : "aeiou",
      "id" : 123,
      "createdOn" : "aeiou"
    } ],
    "goodsPriceInfo" : {
      "goodsPriceId" : 123,
      "refRetailPrice" : 1.3579000000000001069366817318950779736042022705078125,
      "goodsId" : 123,
      "limitedPrice" : 123,
      "price3" : 1.3579000000000001069366817318950779736042022705078125,
      "wholesalePrice" : 1.3579000000000001069366817318950779736042022705078125,
      "price1" : 1.3579000000000001069366817318950779736042022705078125,
      "price2" : 1.3579000000000001069366817318950779736042022705078125
    },
    "goodsInventory" : {
      "goodsBatchTime" : "aeiou",
      "isSplit" : true,
      "amount" : 123,
      "goodsInventoryId" : 123456789,
      "lockedAmount" : 123,
      "goodsId" : 123456789,
      "showPlanId" : 123456789,
      "actualAmount" : 123,
      "negSell" : true,
      "onSell" : true
    }
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

exports.getGoodsInventoryPlans = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : "",
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

exports.getGoodsTypes = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "isDeleted" : true,
    "level" : 123,
    "children" : [ {
      "isDeleted" : true,
      "level" : 123,
      "parentErpId" : "aeiou",
      "name" : "aeiou",
      "erpId" : 123,
      "fullname" : "aeiou"
    } ],
    "parentErpId" : "aeiou",
    "name" : "aeiou",
    "erpId" : 123,
    "fullname" : "aeiou"
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

exports.getListPackUnit = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : "",
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

exports.managerGoodsGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * page (Integer)
  * pageSize (Integer)
  * sort (String)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsList" : [ {
      "goodsNo" : "aeiou",
      "filingNumber" : "aeiou",
      "commonName" : "aeiou",
      "birthPlace" : "aeiou",
      "goodsDetails" : "aeiou",
      "imageUrl" : "aeiou",
      "producer" : "aeiou",
      "id" : 123,
      "goodsType" : "aeiou"
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

exports.managerGoodsGoodsIdCheckGET = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsId (Integer)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsQuotationInfo" : {
      "supplierName" : "aeiou",
      "supplyCycle" : "aeiou",
      "price" : 1.3579000000000001069366817318950779736042022705078125,
      "inventory" : 123456789,
      "payCycle" : "aeiou"
    },
    "defaultQuotationInfo" : "",
    "baseGoodsInfo" : {
      "goodsNo" : "aeiou",
      "filingNumber" : "aeiou",
      "commonName" : "aeiou",
      "birthPlace" : "aeiou",
      "goodsDetails" : "aeiou",
      "imageUrl" : "aeiou",
      "producer" : "aeiou",
      "id" : 123,
      "goodsType" : "aeiou"
    },
    "gspInfo" : {
      "gmpNumber" : "aeiou",
      "importRegisCertNum" : "aeiou",
      "registeredTradeMarksAndPatents" : "aeiou",
      "gmpValidDate" : "aeiou",
      "importRegisCertNumValidDate" : "aeiou"
    }
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

exports.managerGoodsGoodsIdCheckPOST = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsId (Integer)
  * checkQuotationObj (CheckQuotationObj)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsId" : ""
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

exports.managerGoodsGoodsIdPUT = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsId (Integer)
  * goodsInfo (BaseGoodsInfo)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsId" : ""
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

exports.managerGoodsGoodsIdPay_typePOST = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsId (Integer)
  * postPaymentTypeAndOnObj (UpdateActualPaymentTypeObj)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsId" : ""
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

exports.managerGoodsPOST = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsInfo (BaseGoodsInfo)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsId" : ""
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

exports.postGoods = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsInfo (SmPostGoodsInfo)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsId" : ""
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

exports.postGoodsById = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsId (String)
  * goodsInfo (SmPostGoodsInfo)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsId" : ""
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

exports.postGoodsQuotaion = function(args, res, next) {
  /**
   * parameters expected in the args:
  * goodsId (Integer)
  * goodsQuotation (PostSupplierGoodsQuotationInfo)
  **/
    var examples = {};
  examples['application/json'] = {
  "msg" : "aeiou",
  "data" : {
    "goodsId" : ""
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

