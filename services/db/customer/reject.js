/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * database service
 *
 * 操作拒收和拒收详情表的相关方法
 * -----------------------------------------------------------------------------
 * 2015-09-25    hc-romens@issue#22
 *
 */
module.exports=function(){

    /**
     * system service handles
     */
    var logger = global.__logService;
    var db = global.__mysql;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");


    var SQL_CT_REJECTINFO_INSERT   = "INSERT INTO %s.RejectInfo (orderId,operatorId,shipId,remark) " +
        " VALUES ? ;";

    //发货的价格 质检报告 也要插入到 detail里面
    var SQL_CT_REJECTDETAILS_INSERT   = "INSERT INTO %s.RejectDetails (rejectId,goodsId,batchNum,quantity,drugESC,soldPrice,inspectReportURL) " +
        " VALUES ? ;";


      /*  'CREATED'
        'SHIPPED'
        'FINISHED*/

    var SQL_CT_REJECTINFO_SELECT   = "" +
        "SELECT " +
        "   RejectInfo.id as refuseId, " +
        "   RejectInfo.shipId, " +
        "   RejectInfo.orderId, " +
        "   RejectInfo.operatorId, " +
        "" +
        "   Client.clientName,"+
        "" +
        "   RejectInfo.isReceived, " +
        "   RejectInfo.remark, " +
        "   DATE_FORMAT(RejectInfo.receivedDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS receivedDate, " +
        "   DATE_FORMAT(RejectInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn,  " +
        "" +
        "   RejectDetails.quantity as quantity ," +
        "   RejectDetails.soldPrice as soldPrice ," +
        "   RejectDetails.rejectQuantity as rejectQuantity, " +
        "   RejectDetails.rejectReceiveQuantity as rejectReceiveQuantity " +
        "" +
        "FROM  " +
        "   %s.RejectInfo " +
        "LEFT JOIN " +
        "   %s.Operator " +
        "ON " +
        "   RejectInfo.operatorId = Operator.id " +
        "" +
        "LEFT JOIN " +
        "   %s.Client " +
        "ON " +
        "   Client.id = Operator.clientId " +
        "LEFT JOIN " +
        "   %s.RejectDetails " +
        "ON " +
        "   RejectInfo.id = RejectDetails.rejectId " +
        " %s   " +   //where
        " %s  ;";    //limit

    //todo 这里没有去掉大中小包，只是添加了measureUit
    var SQL_CT_REJECTDETAILS_SELECT   = "SELECT " +
        " RejectDetails.rejectId as rejectId, " +
        " RejectDetails.goodsId as goodsId, " +
        " RejectDetails.quantity as quantity, " +                           //拒收数量       >=
        " RejectDetails.rejectQuantity as refusedQty, " +                   //拒收退回数量    >=
        " RejectDetails.rejectReceiveQuantity as rejectReceiveQuantity, " + //拒收商家实际接收数量
        ""+
        " RejectDetails.goodsNotSendRefundQuantity as goodsNotSendRefundQuantity, " + //拒收的不能发货的数量
        " RejectDetails.rejectShippedQuantitySum as rejectShippedQuantitySum, " +      //该商品的拒收退回的总数量
        " RejectDetails.rejectReceiveQuantitySum as rejectReceiveQuantitySum,  " +      //在拒收总数量中 商家实际入库的数量
        " RejectDetails.drugESC as receivedDrugESC, " +
        " RejectDetails.rejectedDrugESC as rejectedDrugESC, " +
        " RejectDetails.batchNum as batchNum, " +
        " ShipDetails.quantity AS shippedQty, " +
        " ShipDetails.drugESC AS drugESC, " +
        " ShipDetails.inspectReportURL AS inspectReportURL, " +
        " DATE_FORMAT(ShipDetails.goodsProduceDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsProduceDate,  " +
        " DATE_FORMAT(ShipDetails.goodsValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS goodsValidDate,  " +
        " Client.clientName,"+
        " GoodsInfo.commonName AS commonName," +
        " GoodsInfo.alias AS alias," +
        " GoodsInfo.goodsNo AS goodsNo," +
        " GoodsInfo.spec AS spec," +
        " GoodsInfo.producer AS producer," +
        " GoodsInfo.licenseNo AS licenseNo," +
        " GoodsInfo.measureUnit AS measureUnit," +
        " GoodsInfo.largePackNum as largePackNum," +
        " GoodsInfo.measureUnit as largePackUnit," +
        " GoodsInfo.middlePackNum as middlePackNum," +
        " GoodsInfo.measureUnit as middlePackUnit," +
        " GoodsInfo.smallPackNum as smallPackNum," +
        " GoodsInfo.measureUnit as smallPackUnit," +
        " GoodsInfo.imageUrl AS imageUrl," +
        " RejectInfo.orderId, " +
        " RejectInfo.shipId, " +
        " RejectInfo.operatorId, " +
        " RejectInfo.isReceived, " +
        " RejectInfo.rejectImg as imgUrl, " +                           //拒收附件
        " RejectInfo.status, " +
        " RejectInfo.remark, " +
        " RejectInfo.receivedRemark, " +
        " DATE_FORMAT(RejectInfo.receivedDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS receivedDate, " +
        " DATE_FORMAT(RejectInfo.createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn  " +
        " FROM  %s.RejectDetails " +
        " LEFT JOIN %s.RejectInfo ON RejectInfo.id = RejectDetails.rejectId " +
        " LEFT JOIN %s.GoodsInfo ON RejectDetails.goodsId = GoodsInfo.id " +
        " LEFT JOIN %s.Operator ON RejectInfo.operatorId = Operator.id " +
        " LEFT JOIN %s.Client ON Client.id = Operator.clientId " +
        " LEFT JOIN %s.ShipDetails ON ShipDetails.batchNum=RejectDetails.batchNum " +
        " AND ShipDetails.goodsId=RejectDetails.goodsId    " +
        " AND RejectInfo.shipId=ShipDetails.shipId   " +
        " WHERE RejectDetails.rejectId=%d ;";  //where

    var SQL_CT_GOODSGSP_SELECT = "SELECT GoodsGspType.id  FROM %s.GoodsGspType  " +
        "LEFT JOIN %s.GoodsInfo ON GoodsGspType.id = GoodsInfo.gspTypeId " +
        " WHERE GoodsInfo.id in %s ;" ;

    /**
     * DB Service provider
     */
    var dbService = {
        /**
         * 根据rejectId 获取对应的details
         * @param customerDBName
         * @param rejectId
         * @param callback
         */
        listRefuseDetailsById : function(customerDBName, rejectId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_REJECTDETAILS_SELECT,
                customerDBName,customerDBName,customerDBName,
                customerDBName,customerDBName,customerDBName,
                rejectId
            );
            logger.sql(sql);
            __mysql.query(sql,function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        //商家端查看所有拒收单
        listAllRefuseInfo :function(customerDBName,type,paginator,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_REJECTINFO_SELECT,
                customerDBName,customerDBName,customerDBName,customerDBName,
                " where status='"+type+"'",paginator.limit()
            );
      /*      var sql = sprintf(SQL_CT_REJECTINFO_SELECT,
                customerDBName,customerDBName,customerDBName,customerDBName,
                "",""
            );*/
            logger.sql(sql);
            __mysql.query(sql,function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {

                    callback(null, results);
                }
            });

        },
        //客户端查看本客户拒收单
        listRefuseInfoByOperatorId :function(customerDBName,operatorId,type,paginator,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_REJECTINFO_SELECT,
                customerDBName,customerDBName,customerDBName,customerDBName,
                "WHERE operatorId="+operatorId+" and status='"+type+"'",paginator.limit()
            );
            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },


        metaNewRejectInfo : function (connect,customerDBName,insertData,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_REJECTINFO_INSERT,customerDBName
            );
            logger.sql(sql);
            connect.query(sql,[[insertData]], function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results.insertId);
                }
            });
        },

        findGoodsGSP : function(customerDBName,GoodId,callback){
            logger.enter();
            var goodid ="('"+ GoodId.join("','")+"')";
            var sql = sprintf(SQL_CT_GOODSGSP_SELECT,
                customerDBName,customerDBName,goodid);
            logger.sql(sql);
            __mysql.query(sql,function(error,result) {
                if(error) {
                    callback(error);
                    logger.sqlerr(error);
                }else{
                    callback(null, result);
                }
            });
        },

        metaNewRejectDetails : function (connect,customerDBName,insertData,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_REJECTDETAILS_INSERT,customerDBName
            );
            logger.sql(sql);
            connect.query(sql,[insertData], function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results.insertId);
                }
            });
        },
    };
    function parseUpdateInfo(data){
        logger.enter();
        var result = "";
        if(underscore.isEmpty(data)) {
            return result;
        }

        for(var key in data){
            result += key + "='"+data[key] +"'," ;
        }
        result = result.slice(0,-1);
        return result;
    }

    return dbService;
}