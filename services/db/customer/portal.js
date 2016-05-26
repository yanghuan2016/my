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
 * portal
 *      scc's startup initialization
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015/10/22     dawei@romens
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

    /**
     * sql
     */

    //carousel.sql
    var SQL_CT_CAROSEL_INSERT  = "INSERT INTO %s.Carousel ( orderSeq, imgUrl, link, beginAt,endAt,remark,deleted ) " +
        "VALUES ( %d, '%s', '%s', '%s', '%s', '%s', '%s');";

    var SQL_CT_CAROUSEL_UPDATE_ONE = "UPDATE %s.Carousel" +
        " SET title = '%s'," +
        " imgUrl = '%s'," +
        " link = '%s'," +
        " beginAt ='%s'," +
        " endAt ='%s'," +
        " remark = '%s' ," +
        " displayText ='%s' " +
        " WHERE id = %d;";
    var SQL_CT_CAROUSEL_UPDATE_ORDERSEQ="UPDATE %s.Carousel set orderSeq=%d where id=%d ";
    var SQL_CT_CAROUSEL_INSERT_ONE  = "INSERT INTO %s.Carousel ( orderSeq, title, imgUrl, link, beginAt,endAt,remark,displayText) " +
        "VALUES ( %d, '%s', '%s', '%s', '%s', '%s', '%s','%s');";

    var SQL_CT_CAROUSEL_SET_DELETE_TRUE = "UPDATE %s.Carousel SET deleted = 1, orderSeq = 0 WHERE id = %d ; ";

    var SQL_CT_CAROSEL_SELECT =
        "SELECT  id, orderSeq, imgUrl, link, beginAt,endAt, remark,  deleted, " +
        "       DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn, " +
        "       DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn " +
        "FROM %s.Carousel " +
        "%s "   + // where clause
        "ORDER BY orderSeq;";

    var SQL_CT_CAROSEL_SELECT_ALL =
        "SELECT  id, orderSeq, title, imgUrl, link, beginAt, endAt, remark, deleted, createdOn, updatedOn" +
        " FROM %s.Carousel" +
        " where deleted = 0" +
        " ORDER BY orderSeq;";

    var SQL_CT_NEWS_SELECT_ALL =
        "SELECT id, newsTitle, html, alwaysOnTop, isAnnouncement, announceTo, isDeleted," +
        "       DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn, " +
        "       DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn " +
        " FROM %s.NewsLinks" +
        " where isDeleted = 0 " +
        " ORDER BY createdOn DESC " +
        "  %s ";

    var SQL_CT_CAROUSEL_RETRIEVE_BY_ID = "SELECT id, orderSeq, title, imgUrl, link, beginAt, endAt, remark, displayText, deleted, createdOn, updatedOn" +
        " FROM %s.Carousel" +
        " where deleted = 0" +
        " AND id = %d;";
    var SQL_CT_CAROUSEL_RETRIEVE_AVAILABLE = "" +
        "select" +
        "   id, orderSeq, title, imgUrl, link, remark, displayText " +
        "from " +
        "   %s.Carousel " +
        "where deleted = 0" +
        "   and beginAt < '%s'" +
        "   and endAt > '%s' " +
        "order by" +
        "   orderSeq asc; ";
    var SQL_CT_NEWS_RETRIEVE_AVAILABLE = "" +
        "select " +
        "   id, newsTitle, alwaysOnTop, createdOn, updatedOn " +
        "from " +
        "   %s.NewsLinks " +
        "where isDeleted = 0 " +
        "order by " +
        "   alwaysOnTop desc, " +
        "   updatedOn desc " +
        "limit "+ __newsMaxCounts+";";
    var SQL_CT_SHOWCASE_GUEST_RETRIEVE_AVAILABLE = "" +
        "select " +
        "   showcase.id as  showcaseId, " +
        "   showcase.title as  title, " +
        "   showcase.orderSeq as  showcaseOrderSeq, " +
        "   showcase.size as  showcaseSize, " +
        "   showcase.createdOn as  showcaseCreatedOn, " +
        "   showcase.mode as mode, " +
        "   showcase.advertiseImg as advertiseImg, " +
        "   showcase.advertiseHref as advertiseHref, " +
        "   showcaseDetail.id as showcaseDetailId, " +
        "   showcaseDetail.goodsId as goodsId, " +
        "   showcaseDetail.orderSeq as showcaseDetailOrderSeq, " +
        "   showcaseDetail.createdOn as showcaseDetailCreatedOn, " +
        "   goods.goodsType as goodsType, " +
        "   goods.goodsNo as goodsNumber, " +
        "   goods.commonName as goodsCommonName, " +
        "   goods.alias as goodsAlias, " +
        "   goods.spec as goodsSpec, " +
        "   goods.supplier as goodsSupplier, " +
        "   goods.producer as goodsProducer, " +
        "   goods.imageUrl as goodsImg, " +
        "   goods.negSell as negSell, " +
        "   goods.middlePackNum as middlePackNum, " +
        "   goods.measureUnit as measureUnit, " +
        "   price.refRetailPrice as goodsPrice, " +
        "   inventory.isSplit as isSplit, " +
        "   inventory.amount as storage, " +
        "   inventory.amount as inventory " +
        "from " +
        "   %s.ShopWindow showcase " +
        "left join " +
        "   %s.ShowWindowDetail showcaseDetail " +
        "on " +
        "   showcase.id = showcaseDetail.shopWindowId " +
        "left join " +
        "   %s.GoodsInfo goods " +
        "on " +
        "   showcaseDetail.goodsId = goods.id " +
        "left join " +
        "   %s.GoodsPrice price " +
        "on " +
        "   goods.id = price.goodsId " +
        "left join " +
        "   %s.GoodsInventory inventory " +
        "on " +
        "   goods.id = inventory.goodsId " +
        "where " +
        "   showcase.isDeleted = 0 " +
        "and " +
        "   showcaseDetail.isDeleted = 0 " +
        "order by " +
        "   showcase.orderSeq, " +
        "   showcaseDetail.orderSeq asc; ";
    var SQL_CT_SHOWCASE_RETRIEVE_AVAILABLE = "" +
        "select " +
        "   showcase.id as  showcaseId, " +
        "   showcase.title as  title, " +
        "   showcase.orderSeq as  showcaseOrderSeq, " +
        "   showcase.size as  showcaseSize, " +
        "   showcase.createdOn as  showcaseCreatedOn, " +
        "   showcase.mode as mode, " +
        "   showcase.advertiseImg as advertiseImg,  " +
        "   showcase.advertiseHref as advertiseHref, " +
        "   showcaseDetail.id as showcaseDetailId, " +
        "   showcaseDetail.goodsId as goodsId, " +
        "   showcaseDetail.orderSeq as showcaseDetailOrderSeq, " +
        "   showcaseDetail.createdOn as showcaseDetailCreatedOn, " +
        "   goods.goodsType as goodsType, " +
        "   goods.goodsNo as goodsNumber, " +
        "   goods.commonName as goodsCommonName, " +
        "   goods.alias as goodsAlias, " +
        "   goods.spec as goodsSpec, " +
        "   goods.supplier as goodsSupplier, " +
        "   goods.producer as goodsProducer, " +
        "   goods.imageUrl as goodsImg, " +
        "   goods.negSell as negSell, " +
        "   goods.measureUnit as measureUnit, " +
        "   goods.middlePackNum as middlePackNum, " +
        "   price.refRetailPrice as goodsPrice, " +
        "   clientgoodsprice.price as clientGoodsPrice ,"+
        "   inventory.isSplit as isSplit, " +
        "   inventory.amount as storage, " +
        "   inventory.amount as inventory " +
        "from " +
        "   %s.ShopWindow showcase " +
        "left join " +
        "   %s.ShowWindowDetail showcaseDetail " +
        "on " +
        "   showcase.id = showcaseDetail.shopWindowId " +
        "left join " +
        "   %s.GoodsInfo goods " +
        "on " +
        "   showcaseDetail.goodsId = goods.id " +
        "left join " +
        "   %s.GoodsPrice price " +
        "on " +
        "   goods.id = price.goodsId " +
        "left join " +
        "   %s.GoodsInventory inventory " +
        "on " +
        "   goods.id = inventory.goodsId " +
        "left join " +
        "   %s.ClientGoodsPrice clientgoodsprice "  +
        "on " +
        "   clientgoodsprice.goodsId=goods.Id "+
        "where " +
        "   showcase.isDeleted = 0 " +
        "and " +
        "   showcaseDetail.isDeleted = 0 " +
        "and" +
        "  clientgoodsprice.clientId =%d  "+
        "order by " +
        "   showcase.orderSeq, " +
        "   showcaseDetail.orderSeq asc; ";
    var SQL_CT_LINKCOLUMN_RETRIEVE_AVAILABLE = "" +
        "select " +
        "   linkColumn.id as columnId, " +
        "   linkColumn.columnName as columnName, " +
        "   linkColumn.columnIcon as columnIcon, " +
        "   linkColumn.orderSeq as columnOrderSeq, " +
        "   linkColumn.createdOn as columnCreatedOn, " +
        "   link.id as linkId, " +
        "   link.name as linkName, " +
        "   link.orderSeq as linkOrderSeq, " +
        "   link.createdOn as linkCreatedOn ," +
        "   length(link.html) as linkContentLength "+
        "from " +
        "   %s.LinkColumns linkColumn " +
        "join " +
        "   %s.Links link " +
        "on " +
        "   linkColumn.id = link.columnId " +
        "where " +
        "   linkColumn.isDeleted = 0 " +
        "and " +
        "   link.isDeleted = 0 " +
        "order by " +
        "   linkColumn.orderSeq asc, " +
        "   link.orderSeq asc; ";
    var SQL_CT_CAROSEL_UPDATE    = "UPDATE %s.Carousel SET %s  WHERE id=%d;";
    var SQL_CT_LINKCOLUMNS_INSERT  = "INSERT INTO %s.LinkColumns ( columnName, columnIcon, orderSeq, isDeleted ) " +
        "VALUES ( '%s', '%s',%d, '%s' );";
    var SQL_CT_LINKS_INSERT  = "INSERT INTO %s.Links ( columnId, name, orderSeq, html,isDeleted ) " +
        "VALUES ( %d, '%s', %d, '%s', '%s');";
    var SQL_CT_LINK_INSERT_ONE  = "INSERT INTO %s.Links ( columnId, name, orderSeq, html) " +
        "VALUES ( %d, '%s', %d, '%s');";

    var SQL_CT_LINKCOLUMNS_SELECT =
        "SELECT id,columnName,columnIcon,orderSeq,isDeleted, " +
        "       DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn, " +
        "       DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn " +
        "FROM %s.LinkColumns " +
        "%s "   + // where clause
        "ORDER BY orderSeq;";
    var SQL_CT_LINKS_SELECT =
        "SELECT id,columnId,name ,orderSeq,html,isDeleted, " +
        "       DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn, " +
        "       DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn " +
        "FROM %s.Links " +
        "%s "   + // where clause
        "ORDER BY orderSeq;";

    var SQL_CT_LINKCOLUMNS_UPDATE    = "UPDATE %s.LinkColumns SET %s  WHERE id=%d;";

    var SQL_CT_LINKS_UPDATE    = "UPDATE %s.Links SET %s  WHERE id=%d;";

    //NewsLinks.sql
    var SQL_CT_NEWSLINKS_INSERT  = "INSERT INTO %s.NewsLinks ( newsTitle, html, alwaysOnTop,clientCategoryIdList, " +
        " isAnnouncement,announceTo,isDeleted ) " +
        "VALUES ( '%s', '%s', '%s', '%s', '%s','%s','%s');";
    var SQL_CT_NEWSLINKS_CREATE  = "INSERT INTO %s.NewsLinks ( newsTitle, html) " +
        "VALUES ( '%s', '%s');";

    var SQL_CT_NEWSLINKS_RETRIEVE_BY_ID = "SELECT id, newsTitle, html, alwaysOnTop,clientCategoryIdList,isAnnouncement,announceTo,isDeleted createdOn, updatedOn" +
        " FROM %s.NewsLinks" +
        " where isDeleted = 0" +
        " AND id = %d;";
    var SQL_CT_NEWS_SET_DELETE_TRUE = "UPDATE %s.NewsLinks SET isDeleted = 1 WHERE id = %d ; ";

    var SQL_CT_NEWSLINKS_SELECT =
        "SELECT  id, newsTitle, html, alwaysOnTop,clientCategoryIdList, " +
        " isAnnouncement,announceTo,isDeleted, " +
        "       DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn, " +
        "       DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn " +
        "FROM %s.NewsLinks " +
        "%s;"; // where clause

    var SQL_CT_NEWSLINKS_UPDATE    = "UPDATE %s.NewsLinks SET %s  WHERE id=%d;";

    var SQL_CT_NEWSLINKS_UPDATE_ONE = "UPDATE %s.NewsLinks" +
        " SET newsTitle = '%s'," +
        " html = '%s'" +
        " WHERE id = %d;";

    //showcase .sql
    var SQL_CT_SHOPWINDOW_INSERT  = "INSERT INTO %s.ShopWindow ( title, orderSeq, mode, size, advertiseImg, advertiseHref) " +
        "VALUES (  '%s', %d, '%s', %d,%s, %s);";
    var SQL_CT_SHOWWINDOWDETAIL_INSERT  = "INSERT INTO %s.ShowWindowDetail ( shopWindowId,type,goodsId,promotionId, orderSeq,isDeleted ) " +
        "VALUES ( %d, '%s', %d, %d, %d, '%s');";

    var SQL_CT_SHOPWINDOW_SELECT =
        "SELECT id,title, orderSeq, mode, size,isDeleted,advertiseImg,advertiseHref, " +
        "       DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn, " +
        "       DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn " +
        "FROM %s.ShopWindow " +
        "%s "   + // where clause
        "ORDER BY orderSeq;";
    var SQL_CT_SHOWWINDOWDETAIL_SELECT =
        "SELECT id,shopWindowId,type,goodsId,promotionId, orderSeq,isDeleted,  " +
        "       DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn, " +
        "       DATE_FORMAT(updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn " +
        "FROM %s.ShowWindowDetail " +
        "%s "   + // where clause
        "ORDER BY orderSeq;";

    ///"INSERT INTO %s.Cart ( clientId, goodsId, quantity, remark ) VALUES ? ;";
    var SQL_CT_SHOPWINDOW_BATCH_INSERT="INSERT INTO %s.ShowWindowDetail (shopWindowId,goodsId,orderSeq) VALUES ? ;";
    var SQL_CT_SHOPWINDOW_UPDATE    = "UPDATE %s.ShopWindow SET %s  WHERE id=%d;";
    var SQL_CT_SHOPWINDOW_UPDATE_ORDERSEQ="UPDATE %s.ShopWindow set orderSeq=%d where id=%d ";
    var SQL_CT_SHOPWINDOW_SELECT_MAX_ORDERSEQ="SELECT MAX(orderSeq) AS maxOrderSeq  FROM %s.ShopWindow WHERE isDeleted = 0;";
    var SQL_CT_SHOWWINDOWDETAIL_UPDATE    = "UPDATE %s.ShowWindowDetail SET %s  WHERE id=%d;";
    var SQL_CT_CAROSEL_SELECT_MAX_ORDERSEQ = "SELECT MAX(orderSeq) AS maxOrderSeq  FROM %s.Carousel WHERE deleted = 0;";
    var SQL_CT_LINKCOLUMN_SELECT_MAX_ORDERSEQ="SELECT MAX(orderSeq) AS maxOrderSeq  FROM %s.LinkColumns WHERE isDeleted = 0;";
    var SQL_CT_LINK_SELECT_MAX_ORDERSEQ_BY_COLUMNID="SELECT MAX(orderSeq) AS maxOrderSeq  FROM %s.Links WHERE isDeleted = 0 and columnId = %d;";
    var SQL_CT_LINKS_SELECT_MAX_ORDERSEQ="SELECT MAX(orderSeq) AS maxOrderSeq  FROM %s.Links WHERE isDeleted = 0;";
    var SQL_CT_LINKCOLUMN_UPDATE="update %s.LinkColumns set columnName = '%s' ,columnIcon = '%s' where id=%d;";
    var SQL_CT_LINKCOLUMN_DELETE="update %s.LinkColumns set isDelete=0 where id=%d;";//暂时没有用到
    var SQL_CT_LINKCOLUMNS_SELECTALL="select id ,columnName,columnIcon,orderSeq from %s.LinkColumns";
    var SQL_CT_BASIC_GOOD_SELECT="SELECT GI.id AS productId,GI.goodsNo AS productCode,GI.imageUrl AS imgSrc,"+
        "GI.producer as producer,GI.commonName as commonName,GI.spec AS spec,GI.measureUnit AS measureUnit ,GIN.amount AS amount "+
        "from %s.GoodsInfo GI LEFT JOIN %s.GoodsInventory GIN on GI.id=GIN.goodsid where GI.id in %s";
    var SQL_CT_DELETESHOWWINDOWDETAILBYSWID="UPDATE %s.ShowWindowDetail SET isDeleted=1 where shopWindowId=%d";

    var SQL_CT_SELECTSHOWWINDOWDETAILBY_SCID_GOODID="SELECT id  from  %s.ShowWindowDetail where shopWindowId=%d and goodsId=%d and isDeleted=0 "
    var SQL_CT_SUBLINKS_SELECT="select id,name,orderSeq from %s.Links where columnId=%d";
    var SQL_CT_SELECT_LINKCOLUMNS_AND_LINKS_NOT_DELETED = "" +
        "select" +
        " LinkColumns.id as columnId," +
        " LinkColumns.columnName as columnName ," +
        " LinkColumns.columnIcon as columnIcon ," +
        " LinkColumns.orderSeq as columnOrderSeq," +
        " Links.id as linkId," +
        " Links.name as linkName," +
        " Links.orderSeq as linkOrderSeq," +
        " Links.isDeleted as linkIsDeleted" +
        //" Links.html as html" +
        " from %s.LinkColumns" +
        " left join %s.Links" +
        " on LinkColumns.id = Links.columnId" +
        " where LinkColumns.isDeleted = 0" ;//+
        //过滤条件有问题，若linkColumn只有一个link,删除这个link，该linkColumn将不会被查询出来
        //" and (Links.isDeleted = 0 or Links.isDeleted is null);";

    var SQL_CT_SELECT_LINKCOLUMNS_AND_LINKS_NOT_DELETED_BY_ID = "" +
        "select" +
        " LinkColumns.id as columnId," +
        " LinkColumns.columnName as columnName ," +
        " LinkColumns.columnIcon as columnIcon ," +
        " LinkColumns.orderSeq as columnOrderSeq," +
        " Links.id as linkId," +
        " Links.name as linkName," +
        " Links.orderSeq as linkOrderSeq" +
        " from %s.LinkColumns" +
        " left join %s.Links" +
        " on LinkColumns.id = Links.columnId" +
        " where LinkColumns.isDeleted = 0" +
        " and (Links.isDeleted = 0 or Links.isDeleted is null)" +
        " and LinkColumns.id = %d;";
    var SQL_CT_SELECT_LINKCOLUMNS_BY_ID = "" +
        "select" +
        " LinkColumns.id as id," +
        " LinkColumns.columnName as columnName ," +
        " LinkColumns.columnIcon as columnIcon ," +
        " LinkColumns.orderSeq as columnOrderSeq" +
        " from %s.LinkColumns" +
        " where LinkColumns.id = %d;";
    var SQL_CT_SELECT_LINK_BY_ID = "" +
        "select" +
        " Links.id," +
        " Links.name," +
        " Links.html," +
        " Links.orderSeq" +
        " from %s.Links" +
        " where Links.id = %d;";
    var SQL_CT_UPDATE_LINK_BY_ID = "" +
        "update " +
        " %s.Links " +
        " set name = '%s'," +
        " html = '%s'" +
        " where id = %d;";
    var SQL_CT_UPDATE_LINKS = "" +
        "insert into %s.Links" +
        "   (id,orderSeq) " +
        "values ? " +
        "on duplicate key update" +
        "   id = values(id)," +
        "   orderSeq = values(orderSeq);";
    var SQL_CT_UPDATE_LINKCOLUMNS = "" +
        "insert into %s.LinkColumns" +
        "   (id,orderSeq) " +
        "values ? " +
        "on duplicate key update" +
        "   id = values(id)," +
        "   orderSeq = values(orderSeq);";

    var SQL_CT_REMOVE_LINK_BY_ID = "" +
        "update " +
        "   %s.Links " +
        "set" +
        "   isDeleted = 1 " +
        "where id = %d;";

    var SQL_CT_REMOVE_LINKCOLUMN_BY_ID = "" +
        "update " +
        "   %s.LinkColumns " +
        "set" +
        "   isDeleted = 1 " +
        "where " +
        "   id = %d;";

    var SQL_CT_INSERT_PACKUNIT = " " +
        "insert into %s.GoodsPackUnit" +
        "   (name) " +
        "values ('%s') ;";

    var SQL_CT_SELECT_PACKUNIT = " " +
        " SELECT id,name," +
        " DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn  " +
        " FROM %s.GoodsPackUnit " +
        " ORDER BY createdOn DESC ";

    var SQL_CT_DELETE_PACKUNIT = "DELETE FROM %s.GoodsPackUnit WHERE id=%d;";

    var SQL_CT_LICENCE_INSERT = " " +
        " INSERT INTO %s.Licences ( licName, licType, licUrl, expireTime )" +
        "VALUES ( '%s', '%s', '%s', '%s' );";

    var SQL_CT_LICENCE_SELECT = " " +
        " SELECT id,licName,licType,licUrl,DATE_FORMAT(expireTime, '%%Y-%%m-%%d') AS expireTime FROM %s.Licences ";

    var SQL_CT_LICENCE_DELETE = " " +
        " DELETE FROM %s.Licences WHERE id = %d LIMIT 1;";

    var SQL_CT_LICENCE_UPDATE = " " +
        " UPDATE %s.Licences SET licName='%s', licUrl='%s', expireTime='%s' WHERE id=%d;";

    var SQL_CT_CONTRACT_SELECT = " " +
        " SELECT id,name,content FROM %s.ContractInfo; ";

    var SQL_CT_CONTRACT_SELECT_ONE = " " +
        " SELECT id,name,content FROM %s.ContractInfo WHERE id=%d; ";

    var SQL_CT_CONTRACT_UPDATE = " " +
        " UPDATE %s.ContractInfo SET content='%s' WHERE id=%d; ";

    var SQL_CTCONTRACT_INSERT = " " +
        " INSERT INTO %s.ContractInfo (name, content) VALUES ('%s', '%s');";
    /**
     * DB Service provider
     */
    var dbService = {


        listPackUnit: function (customerDB, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_PACKUNIT, customerDB);
            logger.sql(sql);
            __mysql.query(sql, function (error, results) {
                if(error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, results);
                }
            });
        },

        deletePackUnit: function (customerDB, packUnitId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_DELETE_PACKUNIT, customerDB,packUnitId);
            logger.sql(sql);
            __mysql.query(sql, function (error, results) {
                if(error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, results);
                }
            });
        },

        insertPackUnit: function (customerDB, packUnit,callback){
            logger.enter();

            var sql = sprintf(SQL_CT_INSERT_PACKUNIT, customerDB, packUnit);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if(error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result.insertId);
                }
            });
        },

        carouselRetrieveAvailable: function(customerDB, date, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CAROUSEL_RETRIEVE_AVAILABLE, customerDB, date, date);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if(error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        newsRetrieveAvailable: function(customerDB, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_NEWS_RETRIEVE_AVAILABLE, customerDB);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if(error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        showcaseRetrieveAvailable: function(customerDB, clientId,callback) {

            var sql;
            if(underscore.isUndefined(clientId)){
                logger.enter();
                sql = sprintf(SQL_CT_SHOWCASE_GUEST_RETRIEVE_AVAILABLE, customerDB, customerDB, customerDB, customerDB, customerDB);
                logger.sql(sql);
            }
            else{
                logger.enter();
                sql = sprintf(SQL_CT_SHOWCASE_RETRIEVE_AVAILABLE, customerDB, customerDB, customerDB, customerDB, customerDB,customerDB,clientId);
                logger.sql(sql);
            }
            __mysql.query(sql, function (error, result) {
                if(error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        linkColumnRetrieveAvailable: function(customerDB, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_LINKCOLUMN_RETRIEVE_AVAILABLE, customerDB, customerDB);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if(error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        carouselRetrieveOne: function (customerDB, id, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CAROUSEL_RETRIEVE_BY_ID, customerDB, id);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                    return;
                }
                callback(null, result);
            });
        },

        newsRetrieveOne:function(customerDB, id, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_NEWSLINKS_RETRIEVE_BY_ID, customerDB, id);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if(error) {
                    logger.sqlerr(error);
                    callback(error);
                    return;
                }
                callback(null, result);
            });
        },

        carouselRetrieveAll: function (customerDB, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CAROSEL_SELECT_ALL, customerDB);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(null, results);
            });
        },
        updateCarouselOrderSeq:function(customerDB,orderSeq,id,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_CAROUSEL_UPDATE_ORDERSEQ,customerDB,orderSeq,id);
            logger.sql(sql);
            __mysql.query(sql,function(error,result){
                  if(error){
                      logger.error(error);
                      callback(error);
                      return;
                  }
                 logger.trace(result);
                 callback(null,result);
            })
        },

        selectMaxOrderSeqFromCarousel:function(customerDB, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CAROSEL_SELECT_MAX_ORDERSEQ, customerDB);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }
                callback(err, result);
            });
        },
        //Carousel 轮播走马灯图
        carouselCreateOne:function(customerDB, orderSeq, title, imgUrl, link, beginAt, endAt, remark,displayText, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CAROUSEL_INSERT_ONE,
                customerDB,
                orderSeq,
                title,
                imgUrl,
                link,
                beginAt,
                endAt,
                remark,
                displayText
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                    return;
                }
                callback(null,results.insertId);
            });
        },

        carouselUpdateOne:function(customerDB, id, title, imgUrl, link, beginAt, endAt, remark,displayText,callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CAROUSEL_UPDATE_ONE,
                customerDB,
                title,
                imgUrl,
                link,
                beginAt,
                endAt,
                remark,
                displayText,
                id
            );
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if(error) {
                    logger.error(error);
                    callback(error);
                    return;
                }
                logger.trace(result);
                callback(null,result);
            })
        },

        carouselDeleteOne:function(customerDB, id, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CAROUSEL_SET_DELETE_TRUE, customerDB, id);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if(error) {
                    logger.sqlerr(error);
                    callback(error);
                    return;
                }
                callback(null, result);
            });
        },

        addCarousel:function (customerDB,carouselData, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CAROSEL_INSERT,
                customerDB,
                carouselData.orderSeq,
                carouselData.imgUrl,
                carouselData.link,
                carouselData.beginAt,
                carouselData.endAt,
                carouselData.remark,
                carouselData.deleted
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }

                callback(null,results.insertId);
            });
        },

        listCarousel:function (customerDB, condition, callback) {
            logger.enter();
            //conditon 为查询条件对象类似{id : 1,orderSeq : 2}
            if(!underscore.isEmpty(condition)){
                condition = " WHERE " + parseUpdateInfo(condition);
            }
            var sql = sprintf(SQL_CT_CAROSEL_SELECT,customerDB,condition)
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                logger.debug(JSON.stringify(results));
                callback(null,results);
            });

        },

        updateCarousel:function(customerDB,updateData,id,callback){
            logger.enter();
            var upData = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_CAROSEL_UPDATE,customerDB,upData,id);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,result.affectedRows);
            });
        },

        linksRetrieveAll: function (customerDB, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_LINKCOLUMNS_AND_LINKS_NOT_DELETED, customerDB, customerDB);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }
                callback(err, result)
            });
        },

        columnRetrieveOne: function(customerDB, id, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_LINKCOLUMNS_BY_ID, customerDB, id);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                logger.enter();
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }
                callback(err, result);
            });
        },
        linkColumnRemoveOne: function(customerDB, id, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_REMOVE_LINKCOLUMN_BY_ID, customerDB, id);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                logger.enter();
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }
                callback(err, result);
            });
        },

        linkRetrieveOne: function(customerDB, id, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_LINK_BY_ID, customerDB, id);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                logger.enter();
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }
                callback(err, result);
            });
        },
        linkUpdateOne: function(customerDB, id, name, html, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_UPDATE_LINK_BY_ID, customerDB, name, html, id);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                logger.enter();
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }
                callback(err, result);
            });
        },
        linksOrderUpdateAll: function(customerDB, values, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_UPDATE_LINKS, customerDB);
            logger.sql(sql);
            __mysql.query(sql, [values], function (error, result) {
                if(error) {
                    logger.error(error);
                    callback(error);
                }else{
                    callback(null, result);
                }
            });
        },

        linkRemoveOne: function(customerDB, id, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_REMOVE_LINK_BY_ID, customerDB, id);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                logger.enter();
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }
                callback(err, result);
            });
        },


        selectAllLinksByLCID:function(customerDB,id,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_SUBLINKS_SELECT,customerDB,id);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
               logger.enter();
               if(err){
                   logger.sqlerr(err);
                   callback(err);
               }
               callback(err,result);
            });
        },
        selectMaxOrderSeqFromLinkColumn:function(customerDB,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_LINKCOLUMN_SELECT_MAX_ORDERSEQ,customerDB);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                logger.enter();
                if(err){
                logger.sqlerr(err);
                callback(err);
                }
                callback(err,result);
            });

        },
        selectMaxOrderSeqFromLink:function(customerDB, columnId, callback){
            logger.enter();
            var sql=sprintf(SQL_CT_LINK_SELECT_MAX_ORDERSEQ_BY_COLUMNID, customerDB, columnId);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                logger.enter();
                if(err){
                logger.sqlerr(err);
                callback(err);
                }
                callback(err,result);
            });

        },


        selectMaxOrderSeqFromSubLink:function(customerDB,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_LINKS_SELECT_MAX_ORDERSEQ,customerDB);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                logger.enter();
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }
                callback(err,result);
            });
        },

        addLinkColumns:function (customerDB,linkColumnsData, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_LINKCOLUMNS_INSERT,
                customerDB,
                linkColumnsData.columnName, linkColumnsData.columnIcon,
                linkColumnsData.orderSeq, linkColumnsData.isDeleted
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results.insertId);
            });
        },


        linkColumnUpdateOne:function(customerDB,clientId,updateLinkColumnData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_LINKCOLUMN_UPDATE,
                customerDB,
                updateLinkColumnData.columnName,
                updateLinkColumnData.columnIcon,
                updateLinkColumnData.id);
            logger.sql(sql);
            __mysql.query(sql,function(error,result){
               logger.enter();
                if(error){
                    logger.sqlerr(error);
                    callback(error,"failed");
                }
                callback(null);
            });
        },

        linkColumsOrderUpdate: function(customerDB, values, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_UPDATE_LINKCOLUMNS, customerDB);
            logger.sql(sql);
            __mysql.query(sql, [values], function (error, result) {
                if(error) {
                    logger.error(error);
                    callback(error);
                }else{
                    callback(null, result);
                }
            });
        },

        deleteLinkColumnOne:function(customerDB,clientId,deleteLinkColumnId,callback){

        },

        addLinks:function (customerDB,linksData, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_LINKS_INSERT,
                customerDB,
                linksData.columnId, linksData.name, linksData.orderSeq, linksData.html,linksData.isDeleted
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results.insertId);
            });
        },
        linkCreateOne: function(customerDB, columnId, name, orderSeq, html, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_LINK_INSERT_ONE, customerDB, columnId, name, orderSeq, html);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results.insertId);
            });
        },

        listLinkColumns:function (customerDB, condition, callback) {
            logger.enter();
            //conditon 为查询条件对象类似{id : 1,orderSeq : 2}
            if(!underscore.isEmpty(condition)){
                condition = " WHERE " + parseUpdateInfo(condition);
            }
            var sql = sprintf(SQL_CT_LINKCOLUMNS_SELECT,customerDB,condition);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });

        },
        listLinks:function (customerDB, condition, callback) {
            logger.enter();
            //conditon 为查询条件对象类似{id : 1,orderSeq : 2}
            if(!underscore.isEmpty(condition)){
                condition = " WHERE " + parseUpdateInfo(condition);
            }
            var sql = sprintf(SQL_CT_LINKS_SELECT,customerDB,condition);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });

        },

        updateLinkColumns:function(customerDB,updateData,id,callback){
            logger.enter();
            var upData = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_LINKCOLUMNS_UPDATE,customerDB,upData,id);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,result.affectedRows);
            });
        },
        updateLinks:function(customerDB,updateData,id,callback){
            logger.enter();
            var upData = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_LINKS_UPDATE,customerDB,upData,id);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,result.affectedRows);
            });
        },
        newListeAll: function (customerDB, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_NEWS_SELECT_ALL, customerDB,'');

            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(null, results);
            });
        }
        ,
        newListAll: function (paginator, customerDB, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_NEWS_SELECT_ALL, customerDB, paginator.limit());
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                    return;
                }
                callback(null, results);
            });
        },

        newsCreateOne:function (dbName,newsData, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_NEWSLINKS_CREATE, dbName, newsData.newsTitle, newsData.html);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,result.insertId);
            });
        },

        newsUpdateOne:function(customerDB, expectNews, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_NEWSLINKS_UPDATE_ONE,
                customerDB,
                expectNews.title,
                expectNews.html,
                expectNews.id);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });
        },

        listNewsLink:function (customerDB, condition, callback) {
            logger.enter();
            //conditon 为查询条件对象类似{id : 1,orderSeq : 2}
            if(!underscore.isEmpty(condition)){
                condition = " WHERE " + parseUpdateInfo(condition);
            }
            var sql = sprintf(SQL_CT_NEWSLINKS_SELECT,customerDB,condition)
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });

        },

        updateNewsLink:function(customerDB,updateData,id,callback){
            logger.enter();
            var upData = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_NEWSLINKS_UPDATE,customerDB,upData,id);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,result.affectedRows);
            });
        },

        newsDeleteOne:function(customerDB, id, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_NEWS_SET_DELETE_TRUE, customerDB, id);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if(error) {
                    logger.sqlerr(error);
                    callback(error);
                    return;
                }
                callback(null, result);
            });
        },

        //Showcase

        listShowWindowGoods:function(customerDB,ids,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_BASIC_GOOD_SELECT,customerDB,customerDB,ids);
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
        addShowWindowDetailBatch:function(customerDB,shopwindowGoods,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_SHOPWINDOW_BATCH_INSERT,customerDB);
            logger.sql(sql);
            __mysql.query(sql,[shopwindowGoods],function(err,result){
                logger.enter();
                if(err){
                    logger.sqlerr(err);
                    callback(err,"failed");
                }
                callback(null,result);
            })

        },
        selectShopWindowMaxOrderSeq:function(customerDB,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_SHOPWINDOW_SELECT_MAX_ORDERSEQ,customerDB);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                    logger.enter();
                    if(err){
                        logger.sqlerr(err);
                        callback(err,"failed");
                    }
                    callback(null,result)
            });
        },
        addShopWindow:function (customerDB,shopWindowData, callback) {
            logger.enter();

            var advertiseImg=shopWindowData.advertiseImg!=null?'\''+shopWindowData.advertiseImg+'\'':shopWindowData.advertiseImg;
            var advertiseHref=shopWindowData.advertiseHref!=null?'\''+shopWindowData.advertiseHref+'\'':shopWindowData.advertiseHref;
            var sql = sprintf(SQL_CT_SHOPWINDOW_INSERT,
                customerDB,
                shopWindowData.title,
                shopWindowData.orderSeq,
                underscore.isUndefined(shopWindowData.mode)?'LIST':shopWindowData.mode,
                shopWindowData.size,
                advertiseImg,
                advertiseHref
            );
            
            logger.sql(sql);
            __mysql.query(sql, function (err,result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,result.insertId);
            });
        },
        addShowWindowDetail:function (customerDB,showWindowDetailData, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SHOWWINDOWDETAIL_INSERT,
                customerDB,
                showWindowDetailData.shopWindowId,
                showWindowDetailData.type,
                showWindowDetailData.goodsId,
                showWindowDetailData.promotionId,
                showWindowDetailData.orderSeq,
                showWindowDetailData.isDeleted
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,result.insertId);
            });
        },

        listShopWindow:function (customerDB, condition, callback) {
            logger.enter();
            //conditon 为查询条件对象类似{id : 1,orderSeq : 2}
            if(!underscore.isEmpty(condition)){
                condition = " WHERE " + parseUpdateInfo(condition)+" and isDeleted=0 ";
            }
            else{
                condition = " WHERE isDeleted=0 ";
            }
            var sql = sprintf(SQL_CT_SHOPWINDOW_SELECT,customerDB,condition)//,condition
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });

        },
        listShowWindowDetail:function (customerDB, condition, callback) {
            logger.enter();
            //conditon 为查询条件对象类似{id : 1,orderSeq : 2}
            if(!underscore.isEmpty(condition)){
                condition = " WHERE " + parseUpdateInfo(condition)+" and isDeleted=0 ";
            }
            else{
                condition = " WHERE isDeleted=0 ";
            }
            var sql = sprintf(SQL_CT_SHOWWINDOWDETAIL_SELECT,customerDB,condition)
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });

        },
        GetShopwindowDetailByGoodsIdandShopWindowId:function(customerDB,swId,goodId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_SELECTSHOWWINDOWDETAILBY_SCID_GOODID,customerDB,swId,goodId);
              __mysql.query(sql, function (err, result) {
                  logger.enter();
                  if (err) {
                      logger.sqlerr(err);
                      callback(err,"failed")
                  }
                  callback(null,result);
              });

        }
        ,
        updateShopWindow:function(customerDB,updateData,id,callback){
            logger.enter();
            var upData = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_SHOPWINDOW_UPDATE,customerDB,upData,id);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,result.affectedRows);
            });
        },
        updateShowWindowDetail:function(customerDB,updateData,id,callback){
            logger.enter();
            var upData = parseUpdateInfo(updateData);
            var sql = sprintf(SQL_CT_SHOWWINDOWDETAIL_UPDATE,customerDB,upData,id);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,result.affectedRows);
            });
        },

        updateShowWindowDetailGoodsToDeltedBySWID:function(customerDB,showWindowId,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_DELETESHOWWINDOWDETAILBYSWID,customerDB,showWindowId);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                logger.enter();
                if(err){
                    logger.sqlerr(err);
                    callback(err,"failed");
                }
                callback(null,result);
            });
        },

        addAnewLicence: function(customerDB, licData, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_LICENCE_INSERT, customerDB, licData.licName, licData.licType, licData.licUrl, licData.expireTime);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });
        },

        getAllLicences: function(customerDB, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_LICENCE_SELECT, customerDB);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });
        },

        removeOneLicence: function(customerDB, id, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_LICENCE_DELETE, customerDB, id);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });
        },

        editOneLicence: function(customerDB, licData, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_LICENCE_UPDATE, customerDB, licData.licName, licData.licUrl, licData.expireTime, licData.id);
            __mysql.query(sql, function (err, results) {
                logger.sql(sql);
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });
        },

        getAllContractPhone:function(customerDB, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CONTRACT_SELECT, customerDB);
            __mysql.query(sql, function (err, results) {
                logger.sql(sql);
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });
        },

        getOneContractPhone:function(customerDB, newData, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CONTRACT_SELECT_ONE, customerDB, newData.id);
            __mysql.query(sql, function (err, results) {
                logger.sql(sql);
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });
        },

        editOneContractPhone: function(customerDB, newData, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CONTRACT_UPDATE, customerDB, newData.content, newData.id);
            __mysql.query(sql, function (err, results) {
                logger.sql(sql);
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });
        },

        addOneContractPhone: function(customerDB, newData, callback){
            logger.enter();
            var sql = sprintf(SQL_CTCONTRACT_INSERT, customerDB, newData.name, newData.content);
            __mysql.query(sql, function (err, results) {
                logger.sql(sql);
                if (err) {
                    logger.sqlerr(err);
                    callback(err,"failed")
                }
                callback(null,results);
            });
        }

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
};
