/**
 * Created by renzhaotian on 16-3-31.
 */
//var db = require(__services_path + "/dbService")();
var mysql = require('mysql');
var dbConfig = {
    "connectionLimit"     : 1,
    "host"                : "cd",
    "user"                : "root",
    "password"            : "romens@2015",
    "logSql"		      : true
};
var pool  = mysql.createPool(dbConfig);
var _mysql = pool;
var async = require('async');
var sprintf = require("sprintf-js").sprintf;
var underscore = require("underscore");

//从数据库中取出GoodsTypes,组合成3级目录，目录中位置用displayOrder标示
var getGoodsTypeList = function(){
    var SQL_CT_GOODSTYPES_SELECT =
        "SELECT parentErpId, erpId, name,IFNULL(displayOrder,2147483648) as displayOrder" +
        "  FROM %s.GoodsTypes " +
        "  WHERE isDeleted=FALSE ";
    var sql = sprintf(SQL_CT_GOODSTYPES_SELECT, 'CustomerDB_3500_jenkins_sm_romenscd_cn');
    _mysql.query(sql, function(err, results){
        if (err){
            console.log(err);
        } else {
            console.log(results)
            return
            var groupedResult = underscore.groupBy(results,'parentErpId');
            underscore.each(results,function(){})
            var root = {
                erpId:'0',
                parentErpId:'0',
                displayOrder:0,
                children:[]
            };
            root.children = underscore.sortBy(groupedResult[0],"displayOrder");
            underscore.each(root.children,function(ele){
                ele.children = underscore.sortBy(groupedResult[ele.erpId],"displayOrder")
            });
            console.log(root);

            //var sortedResult = underscore.sortBy(results,function(item){
            //    var x = Number(item.parentErpId)*1000000000+Number(item.displayOrder);
            //    return x;
            //});
            //var tree = addIntoTree(sortedResult);
            //
            //underscore.each(sortedResult,function(ele,idx){
            //    console.log(idx + ':' + "parentErpId" + ele.parentErpId + "dis" + ele.displayOrder)
            //})


        }
    });
};
//插入一条GoodsType进入数据库，传入参数：{name，erpId，PerantErpId，displayOrder}
var insertGoodsType = function(){};
//删除一条GoodsType，传入参数ErpId
//更新一条GoodsType，传入参数
//

//console.log(
//    underscore.map([1, 2, 3], function(num){
//        return {a:num,b:num+1};
//    })
//);
//step1 read from GoodsType
//step2 sort
//step3 add into tree
