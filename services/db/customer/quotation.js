var logger = global.__logService;
var connection = global.__mysql;
var sprintf = require("sprintf-js").sprintf;
var underscore = require("underscore");


function DBService(connection) {
    this.connection = connection;
}




DBService.prototype.selectOperatorInfo = function (dbConnect,dbName, condition, callback) {
    logger.enter();
    var SQL = " SELECT id,username,customerId,operatorName,citizenIdNum,mobileNum,email" +
        "   FROM  %s.Operator " +
        "   %s ;";//where
    var whereStr = sprintf("WHERE %s",parseConditionInfo(condition));
    logger.debug(whereStr);
    var sql = sprintf(SQL,dbName,whereStr);
    logger.sql(sql);
    dbConnect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.updateOperatorBasic = function (dbConnect,dbName, updateInfo,condition,callback) {
    logger.enter();
    var SQL = " UPDATE %s.Operator SET %s " +
        "   %s ;";//where
    var whereStr = sprintf("WHERE %s",parseConditionInfo(condition));
    var updateStr = parseUpdateInfo(updateInfo);
    var sql = sprintf(SQL,dbName,updateStr,whereStr);
    logger.sql(sql);
    dbConnect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.checkPwdForOperator = function (dbConnect,dbName, password,condition,callback) {
    logger.enter();
    var SQL = " SELECT id FROM %s.Operator  " +
        "   %s ;";//where
    var whereStr = sprintf("WHERE password = '%s'  AND %s",password,parseConditionInfo(condition));
    var sql = sprintf(SQL,dbName,whereStr);
    logger.sql(sql);
    dbConnect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};



DBService.prototype.updatePwdForOperator = function (dbConnect,dbName, password,condition,callback) {
    logger.enter();
    var SQL = " UPDATE %s.Operator SET password = '%s'  " +
        "   %s ;";//where
    var whereStr = sprintf("WHERE %s",parseConditionInfo(condition));
    var sql = sprintf(SQL,dbName,password,whereStr);
    logger.sql(sql);
    dbConnect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};


DBService.prototype.selectQuotationDetails  = function (dbConnect,dbName,condition,callback) {
    logger.enter();
    var SQL = " SELECT id,inquiryId,buyerId,buyerName,licenseNo,lastErpPrice,purchaseUpset, " +
        " inquiryQuantity,inquiryExpire,quotationQuantity,quotationExpire," +
        " quotationPrice,clearingPeriod,createdOn,updatedOn FROM %s.QuotationDetails  " +
        "  %s ;";//where
    var whereStr = "";
    if(!underscore.isEmpty(condition)){
        whereStr = sprintf("WHERE %s",parseConditionInfo(condition));
    }
    var sql = sprintf(SQL,dbName,whereStr);
    logger.sql(sql);
    dbConnect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.getGoodsInfoBylicenseNo  = function (dbConnect,dbName,licenseNo,callback) {
    logger.enter();
    var SQL = " SELECT goodsNo,skuNo,imageUrl,commonName,producer,spec,measureUnit,drugsType FROM %s.GoodsInfo  " +
        " where licenseNo = '%s' ;";//where
    var sql = sprintf(SQL,dbName,licenseNo);
    logger.sql(sql);
    dbConnect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};

DBService.prototype.listQuotationDetailsById = function(dbConnect,dbName,quotationId,callback) {
    logger.enter();

    var SQL = "SELECT  id,inquiryId,buyerId,buyerName,licenseNo,lastErpPrice," +
        " inquiryQuantity,inquiryExpire,quotationQuantity,quotationExpire," +
        " quotationPrice,clearingPeriod,createdOn,updatedOn FROM %s.QuotationDetails " +
        " where id=%d ;"; //where str

    var sql = sprintf(SQL, dbName, quotationId);
    logger.sql(sql);
    dbConnect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    });
};

DBService.prototype.insertOnDupUpdateQuotationDetails = function (dbConnect,dbName,updateData,callback){
    logger.enter();
    var SQL = "INSERT INTO %s.QuotationDetails (%s) " +
        " VALUES ? ON DUPLICATE KEY UPDATE %s ;";
    var keyObj = {
        id:"",
        quotationQuantity:"",
        quotationPrice:""
    };
    var insertInfo = [];
    underscore.map(updateData,function(item){
        var itemInfo = [];
        itemInfo.push(Number(item.quotationId));
        itemInfo.push(Number(item.quotationQuantity));
        itemInfo.push(Number(item.quotationPrice));
        insertInfo.push(itemInfo);
    });
    var data = parseInsertOnDuplicateInfo(keyObj);
    logger.debug(JSON.stringify(insertInfo));
    var sql = sprintf(SQL,dbName,data.keyStr,data.updateStr);
    logger.sql(sql);
    dbConnect.query(sql,[insertInfo], function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })
};


    DBService.prototype.queryQuotationDetails = function(dbConnect,dbName,conditions,callback){
    logger.enter();

    var SQL = "SELECT  id,inquiryId,buyerId,buyerName,licenseNo,lastErpPrice," +
    " inquiryQuantity,inquiryExpire,quotationQuantity,quotationExpire," +
    " quotationPrice,clearingPeriod,createdOn,updatedOn FROM %s.QuotationDetails " +
        "  %s ;"; //where str
    logger.debug(JSON.stringify(conditions));
    var whereStr = "";
    if(!underscore.isEmpty(conditions)){
        var orData = conditions.orData;
        var andData = conditions.andData;
        var orStr = "( buyerName = " + orData.buyerName+" OR "+ "inquiryId = " + Number(orData.inquiryId)+" )" ;
        var andStr = andData.keyStr + " BETWEEN '" + andData.startValue + "' AND '" + andData.endValue + "'";

        whereStr = sprintf("WHERE %s",andStr + " AND "+orStr);
    }
    var sql = sprintf(SQL,dbName,whereStr);
    logger.sql(sql);
    dbConnect.query(sql, function (error, result) {
        if (error) {
            logger.sqlerr(error);
            callback(error);
        } else {
            callback(error, result);
        }
    })



};

function parseConditionInfo(data){
    logger.enter();
    var result = "";
    if(underscore.isEmpty(data)) {
        return result;
    }

    for(var key in data){
        result += key + "="+data[key] +", AND " ;
    }
    result = result.slice(0,-6);
    return result;
}


function parseUpdateInfo(data){
    logger.enter();
    var result = "";
    if(underscore.isEmpty(data)) {
        return result;
    }
    for(var key in data){
        if(!underscore.isUndefined(data[key])){
            result += key + "='"+data[key] +"'," ;
        }
    }
    result = result.slice(0,-1);
    return result;
}

function parseInsertInfo(data){
    logger.enter();
    var result = {keys:"",values:""};
    for(var key in data){
        if(data[key]) {
            result.keys += key + "," ;
            result.values += data[key]+ ",";
        }
    }
    result.keys = result.keys.slice(0,-1);
    result.values = result.values.slice(0,-1);
    return result;
}



function parseInsertOnDuplicateInfo(data){
    logger.enter();
    var result = {
        keyStr:"",
        valueStr:"",
        updateStr:""};
    for(var key in data){
        if(!underscore.isUndefined(data[key])) {
            result.keyStr += key + "," ;
            result.valueStr += "'"+data[key]+ "',";
            result.updateStr += key +"=Values("+key+"),";
        }
    }
    result.keyStr = result.keyStr.slice(0,-1);
    result.valueStr = result.valueStr.slice(0,-1);
    result.updateStr = result.updateStr.slice(0,-1);
    return result;
}

function parseBatchInsert(keyList){
    logger.enter();
    var result = {keys:"",values:""};
    for(var i in keyList){
        result.keys += keyList[i] + "," ;
        result.values += keyList[i]+ "=VALUES("+keyList[i]+"),";

    }
    result.keys = result.keys.slice(0,-1);
    result.values = result.values.slice(0,-1);
    return result;
}

module.exports = new DBService(connection);

