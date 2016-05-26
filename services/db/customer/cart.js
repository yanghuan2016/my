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
 * database service module: cart.js
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-25    hc-romens@issue#45
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

    var SQL_CT_CART_SELECT_BY_CLIENTID = "SELECT " +
        "       Cart.id as id, " +
        "       GoodsInfo.id as goodsId, " +
        "       GoodsInfo.commonName as commonName," +
        "       GoodsInfo.alias as alias," +
        "       GoodsInfo.producer as producer," +
        "       GoodsInfo.spec as spec," +
        "       GoodsGsp.isNationalMedicine as isNationalMedicine, "  +
        "       GoodsGsp.isMedicalInsuranceDrugs as isMedicalInsuranceDrugs, "  +
        "       GoodsGsp.isPrescriptionDrugs as isPrescriptionDrugs , "  +
        "       GoodsInfo.imageUrl as imageUrl," +
        "       GoodsInfo.measureUnit as measureUnit," +
        "       GoodsInfo.measureUnit as largePackUnit," +
        "       GoodsInfo.largePackNum as largePackNum," +
        "       GoodsInfo.measureUnit as middlePackUnit," +
        "       GoodsInfo.middlePackNum as middlePackNum," +
        "       GoodsInfo.measureUnit as smallPackUnit," +
        "       GoodsInfo.smallPackNum as smallPackNum," +
        "       ClientGoodsPrice.price as clientGoodsPrice," +
        "       GoodsInventory.amount as storage, " +
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.onSell as onSell, " +
        "       GoodsInventory.isSplit as isSplit, " +
        "       GoodsInventory.showPlanId as showPlanId, " +
        "       GoodsInfo.goodsType as category," +
        "       GoodsInfo.negSell as negSell," +
        "       Temp.cartFavorName," +
        "       Temp.cartFavorId," +
        "       Temp.cartFavorQuantity," +
        "       Cart.quantity as quantity, " +
        "       Cart.remark as remarks " +
        " FROM %s.Cart " +
        " INNER JOIN %s.GoodsInfo ON Cart.goodsId=GoodsInfo.id " +
        " INNER JOIN %s.ClientGoodsPrice ON Cart.goodsId=ClientGoodsPrice.goodsId " +
        " INNER JOIN %s.GoodsInventory ON Cart.goodsId=GoodsInventory.goodsId " +
        " INNER JOIN %s.GoodsGsp ON GoodsInventory.goodsId=GoodsGsp.goodsId " +
        " LEFT JOIN (SELECT  ClientFavorDetails.goodsId as cartFavorGoodsId ," +
        "					 ClientFavorDetails.quantity as cartFavorQuantity," +
        "					 ClientFavor.id as cartFavorId, " +
        "					 ClientFavor.name as cartFavorName " +
        "			FROM  %s.ClientFavorDetails " +
        "			LEFT JOIN %s.ClientFavor ON ClientFavor.id = ClientFavorDetails.favorId  " +
        "			WHERE ClientFavor.clientId=%d )AS Temp ON Cart.goodsId =Temp.cartFavorGoodsId " +
        " WHERE  " +
        "      ClientGoodsPrice.clientId=%d AND " +
        "      Cart.clientId=ClientGoodsPrice.clientId " +
        "ORDER BY Cart.id DESC;";

    var SQL_CT_CART_INSERT = "INSERT INTO %s.Cart ( clientId, goodsId, quantity, remark ) " +
        "VALUES ( %d, %d, %d, '%s');";

    var SQL_CT_CART_DELETE_BY_ID_ARR    = "DELETE FROM %s.Cart WHERE id IN ( %s ) AND clientId = %d ;";

    var SQL_CT_DELETE_CART_BY_GOOOSID_CLIENTID = "DELETE FROM %s.Cart WHERE goodsId IN ( %s ) AND clientId = %d;";

    var SQL_CT_CART_DELETE_BY_CLIENTID = "DELETE FROM %s.Cart WHERE clientId=%d;";

    var SQL_CT_CART_UPDATE_BY_ID    = "UPDATE %s.Cart SET quantity=%d, remark='%s' WHERE id=%d;";

    var SQL_CT_CART_COUNT_BY_CLIENTID = "SELECT COUNT(*) FROM %s.Cart WHERE clientId=%d;";

    var SQL_CT_CART_BATCH_INSERT = "INSERT INTO %s.Cart ( clientId, goodsId, quantity, remark ) VALUES ? ;";

    var SQL_CT_SELECT_CART_DETAIL = "SELECT " +
        "Cart.id as cartItemId, " +
        "Cart.goodsId as goodsId, " +
        "Cart.quantity as quantity, " +
        "Cart.remark as remark, " +
        "ClientGoodsPrice.pricePlan as pricePlan, " +
        "ClientGoodsPrice.Price as soldPrice, " +
        "ClientGoodsPrice.Price * Cart.quantity as amount " +
        "FROM %s.Cart " +
        "LEFT JOIN %s.ClientGoodsPrice " +
        "ON Cart.goodsId = ClientGoodsPrice.goodsId " +
        "WHERE Cart.goodsId in (%s) AND Cart.clientId = ClientGoodsPrice.clientId " +
        "AND ClientGoodsPrice.clientId = %d ";
    var SQL_CT_SELECT_BY_GOODSID_FROM_CART_GOODS_INVENTORY = "SELECT" +
        " GoodsInfo.id as goodsId," +
        " Cart.id as cartId," +
        " Cart.clientId as clientId," +
        " Cart.quantity as existing," +
        " GoodsInfo.negSell as negSell," +
        " GoodsInventory.amount as inventory, " +
        " GoodsInventory.lockedAmount as lockedAmount, " +
        " GoodsInventory.actualAmount as actualAmount, " +
        " GoodsInventory.onSell as onSell " +
        " FROM %s.GoodsInfo " +
        " LEFT JOIN %s.GoodsInventory " +
        " ON GoodsInfo.id = GoodsInventory.goodsId " +
        " LEFT JOIN %s.Cart  ON  Cart.goodsId = GoodsInfo.id  " +
        " WHERE GoodsInfo.id = %d AND Cart.clientId = %d;";

    var SQL_CT_SHOPPING_CART_RETRIEVE_ALL = "select goodsId, quantity, remark from %s.Cart where clientId = %d;";

    var SQL_CT_SHOPPING_CART_UPDATE_GOODS_QUANTITY = "" +
        "INSERT INTO " +
        "   %s.Cart ( " +
        "       clientId, " +
        "       goodsId, " +
        "       quantity, " +
        "       remark) " +
        "   VALUES ( %d, %d, %d, '%s') " +
        "ON DUPLICATE KEY UPDATE " +
        "   quantity = quantity + %d, " +
        "   remark = '%s'; ";

    var SQL_CT_SHOPPINGCART_REMOVE_WHEN_QUANTITY_LESS_THAN_0 = "" +
        "DELETE FROM " +
        "   %s.Cart " +
        "WHERE " +
        "   clientId = %d " +
        "AND " +
        "   quantity <= 0; ";

    var SQL_CT_SHOPPINGCART_UPDATE_BATCH="" +
        "INSERT INTO " +
        "   %s.Cart(" +
        "       clientId, " +
        "       goodsId, " +
        "       quantity " +
        "           )" +
        "   VALUES %s  " +
        "ON DUPLICATE KEY UPDATE " +
        "   quantity=quantity+values(quantity)";

    var SQL_CT_GOODSGSP_FIND =  "SELECT  GoodsInfo.gspTypeId as goodsGspid ," +
        " GoodsInfo.negSell as negSell," +
        " GoodsInventory.onSell as onSell," +
        " GoodsInventory.amount as inventory " +
        " FROM %s.GoodsInfo " +
        " LEFT JOIN %s.GoodsInventory" +
        " ON GoodsInfo.id = GoodsInventory.goodsId " +
        " WHERE GoodsInfo.id = %d;" ;
    /**
     * DB Service provider
     */
    var dbService = {
        updateCartInBatch:function(customerDB,CartInBatch,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_SHOPPINGCART_UPDATE_BATCH,customerDB,CartInBatch);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                logger.enter();
                if(err){

                    logger.sqlerr(err);
                    callback(err,"failed");
                }
                callback(null,result);
            })
        },
        shoppingCartRemoveGoodsQuantityLessThan0: function (customerDb, clientId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_SHOPPINGCART_REMOVE_WHEN_QUANTITY_LESS_THAN_0, customerDb, clientId);

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(err);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        shoppingCartUpdateGoodsQuantity: function (customerDb, clientId, goodsId, quantity, remark, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_SHOPPING_CART_UPDATE_GOODS_QUANTITY, customerDb, clientId, goodsId, quantity, remark, quantity, remark);

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        shoppingCartRetrieveAll: function (customerDb, clientId, callback) {

            var sql = sprintf(SQL_CT_SHOPPING_CART_RETRIEVE_ALL, customerDb, clientId);

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(err);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        findClientGspType: function (customerDB,clientId,callback){
            logger.enter();
            var SQL = "SELECT goodsGspTypeId  FROM %s.ClientSaleScope  WHERE clientId = %d ;" ;
            var sql=sprintf(SQL,customerDB,clientId);
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


        findGoodsInfoForAddToCart: function (customerDB, clientId, goodsId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_BY_GOODSID_FROM_CART_GOODS_INVENTORY,
                customerDB,
                customerDB,
                customerDB,
                goodsId,
                clientId

            );
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

        findGoodsGspInfo: function(customerDB, goodsId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODSGSP_FIND,customerDB,customerDB,goodsId);
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


        // TODO add function :selectCartDetail
        selectCartDeloadCarttail: function (customerDB, clientId, goodsIds, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_CART_DETAIL, customerDB, customerDB, [[goodsIds]], clientId);
            logger.sql(sql);

            __mysql.query(sql, function (err, result, fields) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,result);
                }

            });
        },

        /**
         *
         * list cart
         *      find cart data from database
         * @param customerDBName
         * @param callback
         */
        listCart: function( customerDBName, clientId,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CART_SELECT_BY_CLIENTID,
                customerDBName,customerDBName,customerDBName,
                customerDBName,customerDBName,customerDBName,customerDBName,
                clientId,clientId);
            logger.sql(sql);

            /* start to query */
            __mysql.query(sql, function(err, results, fields) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    logger.ndump("results", results);
                    callback(err,results);
                }
            });
        },

        /**
         * deleteGoodsFromCart
         *      Delete the specified item from the cart by cartId
         * @param customerDBName
         * @param cartId
         * @param callback
         */
        deleteGoodsFromCart: function(customerDBName, goodsIds, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_DELETE_CART_BY_GOOOSID_CLIENTID, customerDBName, goodsIds.toString(), clientId);
            logger.sql(sql);

            /* execute sql */
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err) ;
                }else{
                    callback(err,result.affectedRows>0);
                }
            });
        },

        clearCart: function(customerDBName, clientId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_CART_DELETE_BY_CLIENTID, customerDBName, clientId);
            logger.sql(sql);

            /* execute sql */
            __mysql.query(sql, function(err,result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(result.affectRows>0);
                }

            });
        },

        updateCart: function(customerDBName, cartId, quantity, remark, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CART_UPDATE_BY_ID, customerDBName,quantity,remark,cartId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(null, result.affectedRows);
                }

            });
        },

        addCart: function(customerDBName, clientId, goodsId, quantity, remarks, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CART_INSERT, customerDBName, clientId, goodsId, quantity, remarks);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(null, result.insertId);
                }

            })
        },


        loadCart: function(customerDBName, clientId, callback){
            logger.enter();

            var sql = sprintf(SQL_CT_CART_SELECT_BY_CLIENTID,
                customerDBName, customerDBName, customerDBName,
                customerDBName,customerDBName, customerDBName,
                clientId, clientId);
            logger.sql(sql);

            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(null, results);
                }


            });
        },

        /**
         *
         * @param customerDBName
         * @param clientId
         * @param callback
         */
        countCartItem: function (customerDBName, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CART_COUNT_BY_CLIENTID, customerDBName, clientId);
            logger.sql(sql);
            __mysql.query(sql, function (err, count) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(null, count[0]['COUNT(*)']);
                }
            });
        },

        metaDeleteCartByGoodsIds: function (connection, customerDB, clientId, goodsIds, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_DELETE_CART_BY_GOOOSID_CLIENTID, customerDB, [[goodsIds]], clientId );
            logger.sql(sql);

            /* execute sql */
            connection.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    logger.trace('metaDeleteCartByIds  result:' + JSON.stringify(result));
                    callback(err,result.affectedRows);
                }
            });
        },

        metaBatchInsertToCart: function (connection,customerDB,cartItems,callback ) {
            logger.enter();
            var insertItems = underscore(cartItems).map(function (item) {
                var tempArr = [];
                tempArr.push(Number(cartItems.clientId));
                tempArr.push(Number(item.goodsId));
                tempArr.push(Number(item.quantity));
                tempArr.push(item.remark);
                return tempArr;
            });
            logger.debug(JSON.stringify(insertItems));
            var sql = sprintf(SQL_CT_CART_BATCH_INSERT, customerDB);
            logger.sql(sql);
            connection.query(sql, [insertItems], function (err,result) {
                if(err) {
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