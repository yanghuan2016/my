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
 * database service module: customer.js
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
    var _ = require("lodash");
    var keywordsToArray = require("keywords-array");
    var sqlBuilder = require("sqlobj");
    var knex = require("knex")({client:'mysql'});

    /**
     * SQL for cloud DB, abbr. SQL_CL_***
     */
    var SQL_CL_CUSTOMERDB_SELECT    =
        "SELECT id AS customerId, " +
        "   customerDBSuffix," +
        "   hasPortal, " +
        "   enabled," +
        "   customerName," +
        "   paymentIsOnCloud," +
        "   businessLicense," +
        "   erpIsAvailable," +
        "   CASE" +
        "       WHEN businessLicenseValidateDate >= '2100-01-01 00:00:00' THEN '长期'" +
        "       ELSE DATE_FORMAT(businessLicenseValidateDate,'%%Y-%%m-%%d %%H:%%i:%%S') " +
        "   END AS businessLicenseValidateDate," +
        "   businessAddress," +
        "   legalRepresentative  " +
        "FROM " + __cloudDBName + ".Customer " +
        "WHERE subDomain='%s';";
    var SQL_CL_CUSTOMER_SELECT =
        "SELECT customerDBSuffix," +
        "       hasPortal, " +
        "       enabled," +
        "       customerName," +
        "       businessLicense," +
        "   CASE" +
        "       WHEN businessLicenseValidateDate >= '2100-01-01 00:00:00' THEN '长期'" +
        "       ELSE DATE_FORMAT(businessLicenseValidateDate,'%%Y-%%m-%%d %%H:%%i:%%S') " +
        "   END AS businessLicenseValidateDate," +
        "   businessAddress," +
        "   legalRepresentative  " +
        "FROM " + __cloudDBName + ".Customer " +
        "WHERE id=%d;";

    var SQL_CL_UPDATE_ERP_SETTING = "" +
        "update %s.Customer " +
        "SET " +
        "   erpIsAvailable = %d, " +
        "   erpAppCodeUrl = '%s', " +
        "   erpMsgUrl = '%s', " +
        "   appKey = '%s', " +
        "   hasValidErpSetting = '%s' " +
        "WHERE" +
        "   id = %d;";
    var SQL_CL_RETRIEVE_APPKEY = "SELECT EXISTS(SELECT * FROM %s.Customer WHERE id = %d AND appKey = '%s') AS isExist;";

    var SQL_CL_RETRIEVE_CUSTOMER_ERP_SETTING = "" +
        "select " +
        "   erpIsAvailable as erpIsAvailable, " +
        "   erpMsgUrl as erpMsgUrl, " +
        "   erpAppCodeUrl as erpAppCodeUrl, " +
        "   appKey as appKey " +
        "from " +
        "   %s.Customer " +
        "where " +
        "   id = %d;";
    var SQL_CT_RETRIEVE_CUSTOMER_INFO_FOR_CONTRACT =
        "SELECT " +
        "   id as customerId, " +
        "   customerName as customerName, " +
        "   legalRepresentative as legalRepresentative, " +
        "   stampLink as stampLink " +
        "FROM " +
        "   %s.Customer " +
        "WHERE " +
        "   id = %d; ";

    var SQL_CT_CUSTOMER_LOGIN_CHECK = "" +
        "SELECT " +
        "   customerName, " +
        "   enabled, " +
        "   customerDBSuffix, " +
        "   siteName, " +
        "   erpIsAvailable " +
        "FROM " +
        "   %s.Customer " +
        "where " +
        "   id = %d; ";

    var SQL_CT_CUSTOMER_DBINIT_CHECK = "SELECT " +
        " id, orgId, customerName, enterpriseType, description, enabled, customerDBSuffix, " +
        " businessLicense, businessLicenseValidateDate, erpIsAvailable, erpMsgUrl, erpAppCodeUrl, appKey, hasValidErpSetting " +
        " FROM %s.Customer WHERE businessLicense='%s'; ";

    var SQL_CT_RETRIEVE_dB_NAME = "select customerDBSuffix from %s.Customer where id = %d;";

    var SQL_CT_RETRIEVE_DB_BUSINESS_LICENSE = "select businessLicense from %s.Customer where id = %d;";

    var SQL_CT_RETRIEVE_ENTERPRISE_TYPE_ = "select enterpriseType from %s.Customer where id = %d;";

    var SQL_CT_RETRIEVE_DB_APPKEY = "select appKey from %s.Customer where id = %d;";

    var SQL_CT_RETRIEVE_DB_APPCODE_URL = "select erpAppCodeUrl from %s.Customer where id = %d;";

    var SQL_CT_BUYER_INSERT_UPDATE_SELLER = '' +
        'insert ' +
        '   %s.ClientSellerInfo(enabled, erpCode, businessLicense, updatedOn) ' +
        'values ? ' +
        'on ' +
        '   duplicate key' +
        'update ' +
        '   enabled = values(enabled), ' +
        '   erpCode = values(erpCode), ' +
        '   businessLicense = values(businessLicense), ' +
        '   updatedOn = values(updatedOn);';

    var SQL_CT_CUSTOMER_RETRIEVE_DB_NAME_BY_BUSINESS_LICENSE = "select businessLicense, customerDBSuffix from %s.Customer where businessLicense in (%s);";

    var SQL_CT_BUYER_UPDATE_DISABLE_BUSINESS_LICENSE = "update %s.ClientBuyerInfo set enabled = 0 where businessLicense = $s; ";

    var SQL_CT_CUSTOMER_SELECT_ALL = "select id from %s.Customer where erpIsAvailable=1";

    var SQL_CT_CUSTOMER_SELLER_SELECT="" +
        "SELECT " +
        "  id AS id, " +
        "  customerName AS customerName, " +
        "  customerDBSuffix AS customerDBSuffix " +
        "FROM" +
        "  %s.Customer " +
        "WHERE " +
        "  enterpriseType='SELLER' " +
        "AND " +
        "  enabled=1" +
        "";
        var SQL_CT_CUSTOMER_SELLER_SELECT_BY_ENTERPRISE_ID="" +
            "SELECT " +
            "  id AS id, " +
            "  customerName AS customerName, " +
            "  customerDBSuffix AS customerDBSuffix " +
            "FROM" +
            "  %s.Customer " +
            "WHERE " +
            "  enabled=1 " +
            "AND" +
            "  id=%d ";

    /**
     * DB Service provider
     */
    var dbService = {
        //通过enterpriseId获取数据库名字
        RetrieveSingleSeller:function(cloudDbName,enterpriseId,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_CUSTOMER_SELLER_SELECT_BY_ENTERPRISE_ID,cloudDbName,enterpriseId);
            logger.sql(sql);

            __mysql.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    logger.dump(result);
                    callback(null,result[0]);
                }
            });

        },
        //获取所有类型为SELLER的企业
        RetrieveAllSeller:function(cloudDbName,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_CUSTOMER_SELLER_SELECT,cloudDbName);
            logger.sql(sql);
            __mysql.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(null,results);
                }
            });
        },
        // 在指定数据库中禁用 指定营业执照的的买家
        BuyerUpdateDisableBusinessLicense: function (sellerDbName, buyerBusinessLicense, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_BUYER_UPDATE_DISABLE_BUSINESS_LICENSE, sellerDbName, buyerBusinessLicense);
            logger.sql(sql);

            __mysql(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(result);
            });
        },

        // 在cloudDb中通过一组营业执照拿到数据库一组数据库名称
        customerRetrieveByBusinessLicense: function (cloudDbName, disabledBusinessLicenses, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_CUSTOMER_RETRIEVE_DB_NAME_BY_BUSINESS_LICENSE, cloudDbName, disabledBusinessLicenses);
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                return callback(null, result);
            });
        },

        // 用 on duplicate 的方法更新 buyer 的 sellerInfo 表.
        sellerInsertUpdate: function (corporateDbName, arrNewSeller, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_BUYER_INSERT_UPDATE_SELLER, corporateDbName);
            logger.sql(sql);

            __mysql.query(sql, [arrNewSeller], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },

        customerRetrieveDbName: function (enterpriseId, cloudDb, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETRIEVE_dB_NAME, cloudDb, enterpriseId);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result[0].customerDBSuffix);
            });
        },

        customerRetrieveBusinessLicense: function (enterpriseId, cloudDb, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETRIEVE_DB_BUSINESS_LICENSE, cloudDb, enterpriseId);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result[0].businessLicense);
            });
        },

        customerRetrieveUserType: function (enterpriseId, cloudDb, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETRIEVE_ENTERPRISE_TYPE_, cloudDb, enterpriseId);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result[0].enterpriseType);
            });
        },

        customerRetrieveIds: function (cloudDb, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CUSTOMER_SELECT_ALL, cloudDb);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        enterpriseRetrieveAppKey: function (enterpriseId, cloudDb, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETRIEVE_DB_APPKEY, cloudDb, enterpriseId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result[0].appKey);
            });
        },

        enterpriseRetrieveAppCodeUrl: function (enterpriseId, cloudDb, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETRIEVE_DB_APPCODE_URL, cloudDb, enterpriseId);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result[0].erpAppCodeUrl);
            });
        },

        customerLoginCheck: function (cloudDB, customerId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_CUSTOMER_LOGIN_CHECK, cloudDB, customerId);

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                }
                callback(null, result);
            });
        },

        retrieveCustomerERPSetting: function (dbName, userId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CL_RETRIEVE_CUSTOMER_ERP_SETTING, dbName, userId);
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    return callback(error);
                }
                callback(null, result);
            });
        },

        retrieveCustomerAppKey: function(dbName, userId, appKey, callback) {
            logger.enter();
            var sql = sprintf(SQL_CL_RETRIEVE_APPKEY, dbName, userId, appKey);
            logger.sql(sql);

            __mysql.query(sql, function (error, result){
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         */
        retrieveCustomerInfoForContract: function (cloudDbName, customerId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETRIEVE_CUSTOMER_INFO_FOR_CONTRACT, cloudDbName, customerId);
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                callback(error, result[0]);
            });
        },

        loadCustomerDBInfo: function(subDomain, callback) {
            logger.enter();

            var sql = sprintf(SQL_CL_CUSTOMERDB_SELECT, subDomain);
            logger.sql(sql);

            /* execute sql */
            __mysql.query(sql, function(err, results, fields){
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        loadCustomer: function(customerId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CL_CUSTOMER_SELECT, customerId);
            logger.sql(sql);

            /* execute sql */
            __mysql.query(sql, function(err, results, fields){
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        updateCustomerERPSetting: function (dbName, userId, erpIsAvailable, erpAppCodeUrl, erpMsgUrl, appKey,hasvalidErpSetting, callback) {
            logger.enter();

            var sql = sprintf(SQL_CL_UPDATE_ERP_SETTING,dbName, erpIsAvailable, erpAppCodeUrl, erpMsgUrl, appKey,hasvalidErpSetting, userId);

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },


        /**
         * 获取单一企业信息
         * @param cloudDB
         * @param businessLicense
         * @param callback
         */
        getEnterpriseInfo: function(cloudDB, enterpriseId, callback) {
            logger.enter();
            var sql = sqlBuilder(
                {
                    SELECT: [
                        'id AS enterpriseId',
                        'orgId AS orgId',
                        'customerName AS customerName',
                        'customerDBSuffix',
                        'enterpriseType',
                        'siteName',
                        'description',
                        'businessLicense',
                        'businessAddress',
                        'legalRepresentative',
                        'erpIsAvailable',
                        'hasValidErpSetting',
                        'erpMsgUrl',
                        'erpAppCodeUrl',
                        'appKey'
                    ],
                      FROM: cloudDB + ".Customer",
                     WHERE: {
                         id: enterpriseId
                     }
                }
            );

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    if (result.length>0)
                        callback(null, result[0]);
                    else
                        callback(null);
                }
            });
        },

        /**
         * EDI 添加一条企业信息
         * @param dbName
         * @param customerInfo
         * @param callback
         */
        insertCustomer: function(dbName, customerInfo, callback) {
            logger.enter();

            var sql = sqlBuilder(
                {
                    INSERT: dbName + ".Customer",
                       SET: customerInfo
                }
            );
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err)
                    callback(error);
                } else {
                    callback(null, result.insertId);
                }
            });
        },

        /**
         * EDI 更新一条企业信息
         * @param cloudDB
         * @param customerInfo
         * @param callback
         */
        updateCloudCustomerOne: function(cloudDB, customerInfo, callback) {
            logger.enter();
            var customerData = {
                /* 企业id, RESERVED */
                orgId: customerInfo.orgId,

                /* 企业名称 */
                customerName: customerInfo.enterpriseName,

                /* 商户对应数据库后缀名称 */
                customerDBSuffix: customerInfo.customerDBSuffix,

                /* 营业执照号 */
                businessLicense: customerInfo.businessLicense,

                /* 营业地址 */
                businessAddress: customerInfo.businessAddress,

                /* 法人代表 */
                legalRepresentative: customerInfo.legalRepresentative

            };

            var SQL_CT_CUSTOMER_UPDATE_ONE = "UPDATE %s.Customer " +
                " SET orgId=%s, customerName='%s', customerDBSuffix='%s', " +
                " businessAddress='%s', legalRepresentative='%s' " +
                " WHERE businessLicense='%s'; ";

            var sql = sprintf(SQL_CT_CUSTOMER_UPDATE_ONE, cloudDB,
                customerData.orgId, customerData.customerName, customerData.customerDBSuffix,
                customerData.businessAddress, customerData.legalRepresentative,
                customerData.businessLicense
            );

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * 更新/添加企业用户信息
         * @param cloudDB
         * @param customerInfo
         * @param callback
         */
        updateCloudCustomerInfoByDupKey: function(cloudDB, customerInfo, callback) {
            logger.enter();

            var customerData = {
                /* 企业id, RESERVED */
                orgId: customerInfo.orgId,

                /* 企业名称 */
                customerName: customerInfo.enterpriseName,

                /* 商户对应数据库后缀名称 */
                customerDBSuffix: customerInfo.customerDBSuffix,

                /* 营业执照号 */
                businessLicense: customerInfo.businessLicense,

                /* 营业地址 */
                businessAddress: customerInfo.businessAddress,

                /* 法人代表 */
                legalRepresentative: customerInfo.legalRepresentative
            };


            var SQL_CL_CUSTOMER_UPATE = "INSERT INTO " +
                " %s.Customer (orgId, customerName, customerDBSuffix, " +
                " enabled, businessLicense, businessAddress, legalRepresentative) " +
                " VALUES( %s, '%s', '%s', 1, '%s', '%s', '%s' ) " +
                " ON DUPLICATE KEY UPDATE " +
                " orgId=%s, customerName='%s', customerDBSuffix='%s', " +
                " enabled=1, businessLicense='%s', businessAddress='%s', legalRepresentative='%s'; ";

            var sql = sprintf(SQL_CL_CUSTOMER_UPATE, cloudDB,
                customerData.orgId, customerData.customerName, customerData.customerDBSuffix,
                customerData.businessLicense, customerData.businessAddress, customerData.legalRepresentative,
                customerData.orgId, customerData.customerName, customerData.customerDBSuffix,
                customerData.businessLicense, customerData.businessAddress, customerData.legalRepresentative
            );

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {

                    callback(null, result);
                }
            });
        },

        /**
         * 更新ERP配置参数有效状态
         * @param cloudDB
         * @param customerId
         * @param isEffective
         * @param callback
         */
        updateHasValidErpSetting: function(cloudDB, customerId, isEffective, callback) {
            logger.enter();
            logger.ndump('isEffective', isEffective);

            var SQL_CL_CUSTOMER_UPATE_ERPEFFECTIVEFLAG = "UPDATE %s.Customer SET hasValidErpSetting=%d where id=%d;";
            var sql = sprintf(SQL_CL_CUSTOMER_UPATE_ERPEFFECTIVEFLAG, cloudDB,
                isEffective ? 1 : 0, customerId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        listGoodsGspTypes : function(dbName,callback){
            logger.enter();
            var SQL =   " SELECT id,name," +
                " DATE_FORMAT(createdOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS createdOn  " +
                " FROM %s.GoodsGspType " +
                " ORDER BY createdOn DESC ";
            var sql = sprintf(SQL, dbName);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        addGoodsGspType : function(dbName,gspValue,callback){
            logger.enter();
            var SQL = "insert into %s.GoodsGspType" +
                "   (name) " +
                "values ('%s') ;";
            var sql = sprintf(SQL, dbName,gspValue);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        deleteGoodsGspType : function(dbName,gspId,callback){
            logger.enter();
            var SQL =   " DELETE FROM %s.GoodsGspType WHERE id=%d;";
            var sql = sprintf(SQL, dbName,gspId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * 检查是否有商品的gsp等于该gsp类别
         * @param dbName
         * @param gspId
         * @param callback
         */
        checkProductGspInGspId: function (dbName, gspId, callback) {
            logger.enter();
            var SQL =
                " SELECT commonName  " +
                " FROM %s.GoodsInfo " +
                " LEFT JOIN %s.GoodsGspType ON GoodsGspType.id = GoodsInfo.gspTypeId " +
                " WHERE GoodsGspType.id = %d";

            var sql = sprintf(SQL, dbName, dbName, gspId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        enterpriseInfoRetrieveByEnterpriseId: function (cloudDbName, enterpriseId, callback) {
            logger.enter();

            var sql = "" +
                "select " +
                "   id as enterpriseId, " +
                "   orgId as orgId, " +
                "   customerName as customerName, " +
                "   enterpriseType as enterpriseType, " +
                "   customerDBSuffix as customerDBSuffix, " +
                "   hasPortal as hasPortal, " +
                "   subDomain as subDomain, " +
                "   siteName as siteName, " +
                "   enabled as enabled, " +
                "   description as description, " +
                "   stampLink as stampLink, " +
                "   businessLicense as businessLicense, " +
                "   businessLicenseValidateDate as businessLicenseValidateDate, " +
                "   businessAddress as businessAddress, " +
                "   legalRepresentative as legalRepresentative, " +
                "   paymentIsOnCloud as paymentIsOnCloud, " +
                "   erpIsAvailable as erpIsAvailable, " +
                "   hasValidErpSetting as hasValidErpSetting, " +
                "   erpMsgUrl as erpMsgUrl, " +
                "   erpAppCodeUrl as erpAppCodeUrl, " +
                "   appKey as appKey " +
                "from " +
                "   %s.Customer " +
                "where id = %d;";
            if (typeof enterpriseId !== 'number') {
                enterpriseId = Number(enterpriseId);
            }
            sql = sprintf(sql, cloudDbName, Number(enterpriseId));
            logger.sql(sql);
            __mysql.query(sql, function (error, enterpriseInfo) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, enterpriseInfo);
            });
        }

        ,
        enterpriseInfoRetrieve: function (dbName, condition, callback) {
            logger.enter();

            // var sql = "" +
            //     "select " +
            //     "   id as enterpriseId, " +
            //     "   orgId as orgId, " +
            //     "   customerName as customerName, " +
            //     "   enterpriseType as enterpriseType, " +
            //     "   customerDBSuffix as customerDBSuffix, " +
            //     "   hasPortal as hasPortal, " +
            //     "   subDomain as subDomain, " +
            //     "   siteName as siteName, " +
            //     "   enabled as enabled, " +
            //     "   description as description, " +
            //     "   stampLink as stampLink, " +
            //     "   businessLicense as businessLicense, " +
            //     "   businessLicenseValidateDate as businessLicenseValidateDate, " +
            //     "   businessAddress as businessAddress, " +
            //     "   legalRepresentative as legalRepresentative, " +
            //     "   paymentIsOnCloud as paymentIsOnCloud, " +
            //     "   erpIsAvailable as erpIsAvailable, " +
            //     "   hasValidErpSetting as hasValidErpSetting, " +
            //     "   erpMsgUrl as erpMsgUrl, " +
            //     "   erpAppCodeUrl as erpAppCodeUrl, " +
            //     "   appKey as appKey " +
            //     "from " +
            //     "   %s.Customer " +
            //     "where id = %d;";
            var whereClause = '';
            for (var field in condition){
                if (!_.isUndefined(field))
                whereClause += "`" + field.toString() + "` = '" + condition[field] + "' AND ";
            }
            whereClause += "TRUE ";
            var sql = sqlBuilder({
                SELECT: [
                    "id as enterpriseId",
                    "orgId as orgId",
                    "customerName as customerName",
                    "enterpriseType as enterpriseType",
                    "customerDBSuffix as customerDBSuffix",
                    "hasPortal as hasPortal",
                    "subDomain as subDomain",
                    "siteName as siteName",
                    "enabled as enabled",
                    "description as description",
                    "stampLink as stampLink",
                    "businessLicense as businessLicense",
                    "businessLicenseValidateDate as businessLicenseValidateDate",
                    "businessAddress as businessAddress",
                    "legalRepresentative as legalRepresentative",
                    "paymentIsOnCloud as paymentIsOnCloud",
                    "erpIsAvailable as erpIsAvailable",
                    "hasValidErpSetting as hasValidErpSetting",
                    "erpMsgUrl as erpMsgUrl",
                    "erpAppCodeUrl as erpAppCodeUrl",
                    "appKey as appKey"
                ],
                FROM: dbName + ".Customer",
                WHERE: whereClause
            });
            logger.sql(sql);
            __mysql.query(sql, function (error, enterpriseInfo) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                callback(null, enterpriseInfo);
            });
        },
        /**
         * ADD COUNT DATA FOR RETURN SUCCESS
         * @param connect
         * @param dbName
         * @param objectSide
         * @param returnId
         * @param returnDate
         * @param returnAmount
         * @param callback
         */
        putCountForReturn: function(connect,dbName,objectSide,returnId,returnDate,returnAmount,callback){
            logger.enter();
            var SQL = "INSERT INTO %s.EDIDataCount" +
                "   (objectType, objectSide,objectID, objectDate,objectAmount) " +
                "VALUES ('RETURN','%s', '%s','%s',%f ) ;";
            var sql = sprintf(SQL, dbName,objectSide,returnId,returnDate,returnAmount);
            logger.sql(sql);
            connect.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * ADD COUNT DATA FOR SHIP SUCCESS
         * @param connect
         * @param dbName
         * @param objectSide
         * @param shipId
         * @param shipDate
         * @param shipAmount
         * @param callback
         */
        putCountForShip: function(connect,dbName,objectSide,shipId,shipDate,shipAmount,callback){
            logger.enter();
            var SQL = "INSERT INTO %s.EDIDataCount" +
                "   (objectType, objectSide,objectID, objectDate,objectAmount) " +
                "VALUES ('SHIP','%s', '%s','%s',%f ) ;";
            var sql = sprintf(SQL, dbName,objectSide,shipId,shipDate,shipAmount);
            logger.sql(sql);
            connect.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * ADD COUNT DATA FOR ORDER SUCCESS
         * @param connect
         * @param dbName
         * @param objectSide
         * @param orderId
         * @param orderDate
         * @param orderAmount
         * @param callback
         */
        putCountForOrder: function(connect,dbName,objectSide,orderId,orderDate,orderAmount,callback){
            logger.enter();
            var SQL = "INSERT INTO %s.EDIDataCount" +
                "   (objectType, objectSide,objectID, objectDate,objectAmount) " +
                "VALUES ('ORDER','%s', '%s','%s',%f ) ;";
            var sql = sprintf(SQL, dbName,objectSide,orderId,orderDate,orderAmount);
            logger.sql(sql);
            connect.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * select count data form inquiry
         * @param connect
         * @param dbName
         * @param objectSide
         * @param inquiryId
         * @param callback
         */
        selectInquiryCount: function(connect,dbName,objectSide,inquiryId,callback){
            logger.enter();
            var SQL = "select  " +
                "   objectSide,objectType, objectID, objectDate " +
                "   from %s.EDIDataCount " +
                "   where objectType = 'INQUIRY' " +
                "   and objectSide = '%s' " +
                "   and objectID = '%s' ;";
            var sql = sprintf(SQL, dbName,objectSide,inquiryId);
            logger.sql(sql);
            connect.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * ADD COUNT DATA FOR INQUIRY SUCCESS
         * @param connect
         * @param dbName
         * @param inquiryId
         * @param objectSide
         * @param callback
         */
        putInquiryCountData : function(connect,dbName,inquiryId,objectSide,callback){
            logger.enter();
            var SQL = "INSERT INTO %s.EDIDataCount" +
                "   (objectType, objectID, objectDate,objectSide) " +
                "VALUES ('INQUIRY', '%s',  NOW(),'%s') ;";
            var sql = sprintf(SQL, dbName,inquiryId,objectSide);
            logger.sql(sql);
            connect.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * ADD COUNT DATA FOR LOGIN SUCCESS
         * @param dbName
         * @param enterpriseId
         * @param callback
         */
        putLoginSuccessData : function(dbName,enterpriseId,callback){
          logger.enter();
            var SQL = "INSERT INTO %s.EDIDataCount" +
                "   (objectType, objectID, objectDate) " +
                "VALUES ('LOGIN', %d,  NOW()) ;";
            var sql = sprintf(SQL, dbName,enterpriseId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        /**
         * 插入操作员信息到Operator表中
         * @param dbName
         * @param operatorData
         * @param callback
         */
        enterpriseOperatorUpdate: function(dbName, operatorData, callback){
            logger.enter();

            var values = "";
            for (var key in operatorData){
                if (values.length > 0)
                    values += ",";
                values += sprintf("%s=VALUES(%s)", key, key);
            }
            logger.ndump("values", values);

            var sql = knex(dbName + ".Operator").insert(operatorData).toString() +
                      " ON DUPLICATE KEY UPDATE " + values;
            
            logger.sql(sql);
            
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result.insertId);
                }
            });

           
        },

        enterpriseInfoUpdate: function(dbName, dataSet, condition, callback){
            logger.enter();
            var sql = sqlBuilder(
                {
                    UPDATE: dbName + ".Customer",
                    SET: dataSet,
                    WHERE: condition
                }
            );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null);
                }
            });
            
        },
        
        transactionInsertCustomer: function(connection, cloudDbName, insertObj, callback) {
            logger.enter();
            // insertObj data schema
            //insertObj = {
            //    customerName: clientItemInfo.clientName,
            //    enterpriseType: enterpriseType,
            //    enabled: Number(!Boolean(clientItemInfo.readOnly)),
            //    description: clientItemInfo.checkComments,
            //    stampLink: clientItemInfo.stampLink,
            //    businessLicense: clientItemInfo.businessLicense,
            //    businessLicenseValidateDate: clientItemInfo.businessLicenseValidateDate,
            //    businessAddress: clientItemInfo.businessAddress,
            //    legalRepresentative: clientItemInfo.legalRepresentative
            //};
            var sql = "" +
                "insert %s.Customer(" +
                "   customerName, " +
                "   enterpriseType, " +
                "   enabled, " +
                "   description, " +
                "   stampLink, " +
                "   businessLicense, " +
                "   businessLicenseValidateDate, " +
                "   businessAddress, " +
                "   legalRepresentative) " +
                "values(" +
                "   '%s', '%s', %d, '%s', '%s', '%s', '%s', '%s', '%s'); ";
            sql = sprintf(sql,
                cloudDbName,
                insertObj.customerName,
                insertObj.enterpriseType,
                insertObj.enabled,
                insertObj.description,
                insertObj.stampLink,
                insertObj.businessLicense,
                insertObj.businessLicenseValidateDate,
                insertObj.businessAddress,
                insertObj.legalRepresentative
            );
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });

        },
        transactionUpdateCustomerFromErp: function(connection, cloudDbName, update, callback){
            logger.enter();
            // insertObj data schema
            //updateObj = {
            //    customerName: clientItemInfo.clientName,
            //    enterpriseType: enterpriseType,
            //    enabled: Number(!Boolean(clientItemInfo.readOnly)),
            //    description: clientItemInfo.checkComments,
            //    stampLink: clientItemInfo.stampLink,
            //    businessLicense: businessLicense,
            //    businessLicenseValidateDate: clientItemInfo.businessLicenseValidateDate,
            //    businessAddress: clientItemInfo.businessAddress,
            //    legalRepresentative: clientItemInfo.legalRepresentative
            //};

            var sql = "" +
                "update %s.Customer " +
                "set " +
                "   customerName = '%s', " +
                "   enabled = '%s', " +
                "   description = '%s', " +
                "   stampLink = '%s', " +
                "   businessLicenseValidateDate = '%s', " +
                "   businessAddress = '%s', " +
                "   legalRepresentative = '%s'" +
                "where businessLicense = '%s';";
            sql = sprintf(sql,
                cloudDbName,
                update.customerName,
                update.enabled,
                update.description,
                update.stampLink,
                update.businessLicenseValidateDate,
                update.businessAddress,
                update.legalRepresentative,
                update.businessLicense
            );
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });

        },

        retrieveBusinessLicenses: function (cloudDbName, businessLicenses, callback) {
            var bl = _.reduce(businessLicenses, function (memo, item) {
                if (!_.isEmpty(memo)) {
                    memo += ",";
                }
                return memo + "'" + item + "'";
            }, "");
            var sql = "" +
                "select id as enterpriseId, businessLicense from %s.Customer where businessLicense in (" + bl + ")";
            sql = sprintf(sql, cloudDbName);
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        }



    };

    return dbService;
};