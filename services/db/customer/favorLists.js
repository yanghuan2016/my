/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

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

    //筛选出有商品的常购清单的信息[包括商品总类和总价格]
    //todo 改名字  请注意 这个可能影响其他的
    var SQL_CT_FAVOR_LIST_NOTEMPTY_SELECT_BY_CLIENTID = "SELECT  " +
        "ClientFavor.updatedOn as updateOn , " +
        "ClientFavor.clientId as clientId , " +
        "ClientFavor.id as clientFavorId,  " +
        "ClientFavor.name as name ," +
        "ClientFavorDetails.goodsId as goodsId, " +
        "ClientFavorDetails.quantity as quantity, " +
        "ClientGoodsPrice.price as price  " +
        //"Client.pricePlan as pricePlan " +
        "FROM %s.ClientFavor  " +
        "LEFT JOIN %s.ClientFavorDetails ON ClientFavor.id=ClientFavorDetails.favorId  " +
        "LEFT JOIN %s.ClientGoodsPrice ON ClientFavorDetails.goodsId =ClientGoodsPrice.goodsId " + //customerDB
        //"LEFT JOIN %s.Client ON ClientFavor.clientId =Client.id " +
        "WHERE ClientFavor.clientId=%d  " +
        "AND ClientGoodsPrice.clientId=%d  " +
        "ORDER BY ClientFavor.updatedOn DESC;";

    //筛选出没有商品的空的常购清单
    // SELECT ClientFavor.id as id ,name  from ClientFavor left join ClientFavorDetails on ClientFavor.id=ClientFavorDetails.favorId where ClientFavor.clientId=1 and ClientFavorDetails.goodsId is null ;

    var SQL_CT_FAVOR_LIST_EMPTY_SELECT_BY_CLIENTID_OLD="SELECT " +
        " ClientFavor.updatedOn as updateOn , " +
        " ClientFavor.clientId as clientId , " +
        " ClientFavor.id as clientFavorId ,  " +
        " ClientFavor.name as name  " +
        " FROM " +
        " %s.ClientFavor " +
        " LEFT JOIN" +
        " %s.ClientFavorDetails " +
        " ON " +
        " ClientFavorDetails.favorId=ClientFavor.id " +
        " WHERE " +
        " ClientFavor.clientId =%d " +
        " AND " +
        " ClientFavorDetails.goodsId is null" ;
    var SQL_CT_FAVOR_LIST_SELECT_BY_CLIENTID = "SELECT " +
        "ClientFavor.id as id,  " +
        "ClientFavor.name as name " +
        "FROM %s.ClientFavor " +
        "WHERE clientId=%d " +
        "ORDER BY updatedOn DESC;";

    var SQL_CT_FAVOR_LIST_Name_SELECT_BY_FAVOR = "SELECT " +
        "ClientFavor.name as name, " +
        "ClientFavor.id as id " +
        "FROM %s.ClientFavor " +
        "WHERE clientId=%d " +
        "AND id=%d";

    var SQL_CT_FAVOR_LIST_INSERT = "INSERT INTO %s.ClientFavor ( clientId , name ) " +
        "VALUES ( %d, '%s');";
    var SQL_CT_FAVOR_LIST_UPDATE_NAME = "UPDATE %s.ClientFavor " +
        "SET name='%s' " +
        "WHERE id=%d;";
    var SQL_CT_FAVOR_LIST_FAVOR_UPDATE_DETAIL = "INSERT INTO %s.ClientFavorDetails (favorId, id, goodsId, quantity, remark) " +
        " VALUES ? " +
        " ON DUPLICATE KEY UPDATE " +
        " favorId=VALUES(favorId),id=VALUES(id),goodsId=VALUES(goodsId),quantity=VALUES(quantity),remark=VALUES(remark);";

    var SQL_CT_FAVOR_LIST_REMOVE_ONE = "DELETE " +
        " FROM %s.ClientFavor " +
        " WHERE ClientFavor.id=%d " +
        " AND ClientFavor.clientId=%d";

    var SQL_CT_FAVOR_LIST_REMOVE_ONE_GOODS = "DELETE " +
        " FROM %s.ClientFavorDetails " +
        " WHERE ClientFavorDetails.favorId=%d " +
        " AND ClientFavorDetails.goodsId=%d";

    var SQL_CT_FAVOR_LIST_REMOVE_BY_GOODSID = "DELETE " +
        "FROM " +
        " %s.ClientFavorDetails " +
        "WHERE " +
        " ClientFavorDetails.goodsId=%d " +
        "AND " +
        " ClientFavorDetails.favorId=%d";

    var SQL_CT_FAVOR_LIST_MATE_UPDATE_GOODSID = "INSERT INTO %s.ClientFavorDetails (goodsId, quantity, favorId) " +
        " VALUES ? " +
        " ON DUPLICATE KEY UPDATE " +
        " goodsId = VALUES(goodsId),quantity = VALUES(quantity),favorId = VALUES(favorId)";

    var SQL_CT_SELECT_FAVOR_LIST = "SELECT favorId, goodsId FROM %s.ClientFavorDetails";

    var SQL_CT_SELECT_FAVOR_DETAIL = "" +
        "SELECT  " +
        "   ClientFavor.clientId as clientId,  " +
        "   ClientFavor.id as favorId,  " +
        "   ClientFavor.name as name,  " +
        "" +
        "   ClientFavorDetails.quantity as quantity,  " +
        "   ClientFavorDetails.id as id,  " +
        "   ClientFavorDetails.id as detailId,  " +
        "   ClientFavorDetails.remark as remark,  " +
        "" +
        "   GoodsGsp.isNationalMedicine as isNationalMedicine, "  +
        "   GoodsGsp.isMedicalInsuranceDrugs as isMedicalInsuranceDrugs, "  +
        "   GoodsGsp.isPrescriptionDrugs as isPrescriptionDrugs , "  +
        "" +
        "   GoodsInfo.commonName as commonName,  " +
        "   GoodsInfo.id as goodsId,  " +
        "   GoodsInfo.alias as alias,  " +
        "   GoodsInfo.producer as producer,  " +
        "   GoodsInfo.spec as spec,  " +
        "   GoodsInfo.measureUnit as measureUnit,  " +
        "   GoodsInfo.imageUrl as imageUrl,  " +
        "   GoodsInfo.measureUnit as largePackUnit," +
        "   GoodsInfo.largePackNum as largePackNum," +
        "   GoodsInfo.measureUnit as middlePackUnit," +
        "   GoodsInfo.middlePackNum as middlePackNum," +
        "   GoodsInfo.measureUnit as smallPackUnit," +
        "   GoodsInfo.smallPackNum as smallPackNum," +
        "   GoodsInfo.goodsType as category, " +
        "   GoodsInfo.negSell as negSell, " +
        "" +
        "   ClientGoodsPrice.price as clientGoodsPrice," +
        "" +
        "   GoodsInventory.amount as storage, " +
        "   GoodsInventory.lockedAmount as lockedAmount, " +
        "   GoodsInventory.actualAmount as actualAmount, " +
        "   GoodsInventory.onSell as onSell, " +
        "   GoodsInventory.isSplit as isSplit, " +
        "   GoodsInventory.showPlanId as showPlanId, " +
        "" +
        "   IFNULL(Cart.quantity,0) as CartQuantity  " +
        "FROM " +
        "   %s.ClientFavorDetails " +
        "LEFT JOIN " +
        "   %s.ClientFavor " +
        "ON " +
        "   ClientFavor.id = ClientFavorDetails.favorId  " +
        "LEFT JOIN " +
        "   %s.GoodsInfo  " +
        "ON " +
        "   GoodsInfo.id = ClientFavorDetails.goodsId  " +
        "LEFT JOIN " +
        "   %s.GoodsGsp  " +
        "ON " +
        "   GoodsGsp.goodsId = ClientFavorDetails.goodsId  " +
        "LEFT JOIN " +
        "   %s.ClientGoodsPrice " +
        "ON " +
        "   GoodsInfo.id = ClientGoodsPrice.goodsId " +
        "AND" +
        "   ClientGoodsPrice.clientId = ClientFavor.clientId " +
        "LEFT JOIN " +
        "   %s.GoodsInventory " +
        "ON " +
        "   GoodsInfo.id = GoodsInventory.goodsId " +
        "LEFT JOIN %s.Cart " +
        "ON GoodsInfo.id = Cart.goodsId and Cart.clientId=  ClientFavor.clientId " +
        "WHERE  " +
        "   ClientFavor.clientId = %d  " +
        "AND " +
        "   ClientFavor.id = %d;";

    var SQL_CT_SELECT_FAVOR_ID_BY_GOODSID_AND_CLIENTID = "" +
        "SELECT " +
        "   ClientFavor.id as favorId  " +
        "FROM  " +
        "   %s.ClientFavorDetails " +
        "LEFT JOIN " +
        "   %s.ClientFavor " +
        "ON" +
        "   ClientFavorDetails.favorId = ClientFavor.id " +
        "WHERE " +
        "   ClientFavorDetails.goodsId=%d  " +
        "AND " +
        "   ClientFavor.clientId=%d";
    /**
     * DB Service provider
     */
    var dbService = {
        getFavorIdByClientIdAndGoodId:function(customerDB,goodsId,clientId,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_SELECT_FAVOR_ID_BY_GOODSID_AND_CLIENTID,customerDB,customerDB,goodsId,clientId);
            logger.sql(sql);

            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        }
        ,

        /**
         *
         * list favor
         *      find favor list data from database
         * @param customerDBName
         * @param callback
         */
        listNotEmptyFavor: function(customerDBName, clientId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_NOTEMPTY_SELECT_BY_CLIENTID,customerDBName,customerDBName,customerDBName,clientId,clientId);
            logger.sql(sql);
            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },
        listAllFavor:function(customerDBName,clientId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_SELECT_BY_CLIENTID,customerDBName,clientId);
            logger.sql(sql);
            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });


        }
        ,
        listEmptyFavor:function(customerDBName,clientId,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_FAVOR_LIST_EMPTY_SELECT_BY_CLIENTID_OLD,customerDBName,customerDBName,clientId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });


        },
        getListName: function(customerDBName, clientId,  id, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_Name_SELECT_BY_FAVOR,customerDBName, clientId, id);
            logger.sql(sql);

            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results[0]);
                }
            });
        },

        addFavor: function(customerDBName, clientId, name, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_INSERT, customerDBName, clientId, name);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(null, result.insertId);
            })
        },

        updateClientFavor: function(customerDBName, id, name, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_UPDATE_NAME, customerDBName, name, id);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(null, result.insertId);
            })
        },

        updateClientFavorDetail: function(customerDBName, goods, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_FAVOR_UPDATE_DETAIL, customerDBName);
            logger.sql(sql);
            __mysql.query(sql, [goods], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(null, result.insertId);
            })
        },
        removeFavorOne: function(customerDBName, data, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_REMOVE_ONE, customerDBName, data.listId, data.clientId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(err, result);
            })
        },
        removeFavorGoodsOne: function(customerDBName, data, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_REMOVE_ONE_GOODS, customerDBName, data.listId, data.goodsId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(err, result);
            })
        },
        deleteOldListByGoodsId: function(customerDBName, goodsId,favorId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_REMOVE_BY_GOODSID, customerDBName, goodsId,favorId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(err, result);
            })
        },
        mateUpdateListByGoods: function(customerDBName, data, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_FAVOR_LIST_MATE_UPDATE_GOODSID, customerDBName, data);
            logger.sql(sql);
            __mysql.query(sql, [data], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(err, result);
            })
        },

        selectFavorDetailList: function(customerDBName, clientId, favorId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_FAVOR_DETAIL,
                customerDBName, customerDBName, customerDBName, customerDBName, customerDBName, customerDBName,customerDBName,clientId, favorId);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,result);
                }
            });
        },

        selectFavorList: function(customerDBName, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_FAVOR_LIST,customerDBName);
            logger.sql(sql);

            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,result);
                }
            });
        }
    };

    return dbService;
};