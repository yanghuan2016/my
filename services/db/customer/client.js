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
 * database service module: client.js
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-10-05   hc-romens@issue#99      bugfix on updateGSP
 * 2015-09-25   xdw-romens@issue#56
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
    var async = require('async');
    var keywordsToArray = require("keywords-array");
    var knex = require('knex')({client: "mysql"});
    /**
     * project modules
     */
    /**
     * SQL for customer DB, abbr. SQL_CT_***
     */

    /* Client operations */

    var SQL_CT_INSERT_CLIENT =
        "INSERT INTO %s.Client (clientCategoryId, clientCode, clientName,clientArea,mobile, pricePlan) " +
        "VALUES ((SELECT id FROM %s.ClientCategory WHERE categoryName='%s'),'%s','%s','%s','%s','%s');";
    var SQL_CL_RETRIEVE_CLIENT_ERP_SETTING = "" +
        "select " +
        "   erpIsAvailable as erpIsAvailable, " +
        "   erpMsgUrl as erpMsgUrl, " +
        "   erpAppCodeUrl as erpAppCodeUrl, " +
        "   appKey as appKey " +
        "from " +
        "   %s.Client " +
        "where " +
        "   id = %d;";
    var SQL_CT_CLIENT_REGISTER =
        "INSERT INTO %s.Client ( " +
        "   clientCode, " +
        "   clientName, " +
        "   mobile," +
        "   defaultAddress," +
        "   stampLink ) " +
        "VALUES ( " +
        "   '%s', " +
        "   '%s', " +
        "   '%s', " +
        "   '%s', " +
        "   '%s' );";
    var SQL_CT_CLIENT_UPDATE_BASIC_INFO=
            "UPDATE %s.Client  "+
            "SET mobile= '%s' " +
            "WHERE id=%d"
        ;
    var SQL_CT_CLIENT_UPDATE_STAMPLINK_INFO=
            "UPDATE %s.Client  "+
            "SET stampLink= '%s' " +
            "WHERE id=%d"
        ;
    var SQL_CT_CLIENT_GET_REGISTER_STATUS_COUNTS=""+
        "SELECT registerStatus AS REGISTERSTATUS ,count(*) AS SUMS "+
        "FROM %s.Client GROUP BY registerStatus";
    var SQL_CT_SELECT_EXIST_BY_OPERATORNAME = "" +
        "SELECT EXISTS(SELECT * FROM %s.Operator WHERE username  = '%s') AS isExist;";

    //当前版本单操作员operatorName = username
    var SQL_CT_INSERT_OPERATOR =
        "INSERT INTO %s.Operator (username,password,operatorName,clientId,isAdmin,mobileNum) " +
        "VALUES ('%s','%s','%s',%d,%d,'%s');";
    var SQL_CT_INSERT_ClIENTGSPIDLINKS =
        " INSERT INTO %s.ClientGspIdLinks (clientId,gspTypeId) " +
        " VALUES (%d,%d);";


    var SQL_CT_IMPORT_CLIENTINFO =  "INSERT INTO %s.Client " +
        "   (guid, clientCategory, clientCode,clientArea, clientName, pricePlan, email, mobile, fax, " +
        "    defaultAddressId, paymentReminderMsg, readOnly,enabled ) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "guid=VALUES(guid),clientCategory=VALUES(clientCategory),clientCode=VALUES(clientCode),clientArea=VALUES(clientArea), " +
        "clientName=VALUES(clientName),pricePlan=VALUES(pricePlan),email=VALUES(email),mobile=VALUES(mobile),fax=VALUES(fax), " +
        "defaultAddressId=VALUES(defaultAddressId),paymentReminderMsg=VALUES(paymentReminderMsg),readOnly=VALUES(readOnly),enabled=VALUES(enabled) ;";

    var SQL_CT_IMPORT_CLIENTGSP =  "INSERT INTO %s.ClientGsp " +
        "   (guid, clientId,legalRepresentative, businessLicense,companyManager, businessLicenseValidateDate," +
        " registeredCapital, businessAddress, limitedBusinessRange, limitedBusinessType, " +
        " orgCode, orgCodeValidateDate, taxRegistrationLicenseNum,foodCirculationLicenseNum, " +
        " foodCirculationLicenseNumValidateDate, qualityAssuranceLicenseNum, qualityAssuranceLicenseNumValidateDate, medicalApparatusLicenseNum," +
        " medicalApparatusLicenseNumValidateDate,medicalApparatusType, " +
        " healthProductsLicenseNum, healthProductsLicenseNumValidateDate, productionAndBusinessLicenseNum,productionAndBusinessLicenseNumIssuedDate, " +
        " productionAndBusinessLicenseNumValidateDate, productionAndBusinessLicenseNumIssuedDepartment, storageAddress, mentaanesthesiaLicenseNum, " +
        " mentalanesthesiaLicenseNumValidateDate, gmpOrGspLicenseNum, gmpOrGspLicenseNumValidateDate, " +
        " hazardousChemicalsLicenseNum, hazardousChemicalsLicenseNumValidateDate, medicalInstitutionLicenseNum,medicalInstitutionLicenseNumValidateDate , " +
        " maternalLicenseNum, maternalLicenseNumValidateDate, institutionLegalPersonCert,institutionLegalPersonCertValidateDate ) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "guid=VALUES(guid),clientId=VALUES(clientId),legalRepresentative=VALUES(legalRepresentative),businessLicense=VALUES(businessLicense), " +
        "companyManager=VALUES(companyManager),businessLicenseValidateDate=VALUES(businessLicenseValidateDate),registeredCapital=VALUES(registeredCapital), " +
        "businessAddress=VALUES(businessAddress),limitedBusinessRange=VALUES(limitedBusinessRange),limitedBusinessType=VALUES(limitedBusinessType), " +
        "orgCode=VALUES(orgCode),orgCodeValidateDate=VALUES(orgCodeValidateDate),taxRegistrationLicenseNum=VALUES(taxRegistrationLicenseNum), " +
        "foodCirculationLicenseNum=VALUES(foodCirculationLicenseNum),foodCirculationLicenseNumValidateDate=VALUES(foodCirculationLicenseNumValidateDate),qualityAssuranceLicenseNum=VALUES(qualityAssuranceLicenseNum), " +
        "qualityAssuranceLicenseNumValidateDate=VALUES(qualityAssuranceLicenseNumValidateDate),medicalApparatusType=VALUES(medicalApparatusType),healthProductsLicenseNum=VALUES(healthProductsLicenseNum), " +
        "healthProductsLicenseNumValidateDate=VALUES(healthProductsLicenseNumValidateDate),productionAndBusinessLicenseNum=VALUES(productionAndBusinessLicenseNum),productionAndBusinessLicenseNumIssuedDate=VALUES(productionAndBusinessLicenseNumIssuedDate), " +
        "productionAndBusinessLicenseNumValidateDate=VALUES(productionAndBusinessLicenseNumValidateDate),productionAndBusinessLicenseNumIssuedDepartment=VALUES(productionAndBusinessLicenseNumIssuedDepartment),storageAddress=VALUES(storageAddress), " +
        "mentaanesthesiaLicenseNum=VALUES(mentaanesthesiaLicenseNum),mentalanesthesiaLicenseNumValidateDate=VALUES(mentalanesthesiaLicenseNumValidateDate),gmpOrGspLicenseNum=VALUES(gmpOrGspLicenseNum), " +
        "gmpOrGspLicenseNumValidateDate=VALUES(gmpOrGspLicenseNumValidateDate),medicalInstitutionLicenseNum=VALUES(medicalInstitutionLicenseNum),medicalInstitutionLicenseNumValidateDate=VALUES(medicalInstitutionLicenseNumValidateDate), " +
        "maternalLicenseNum=VALUES(maternalLicenseNum),maternalLicenseNumValidateDate=VALUES(maternalLicenseNumValidateDate), " +
        "institutionLegalPersonCert=VALUES(institutionLegalPersonCert),institutionLegalPersonCertValidateDate=VALUES(institutionLegalPersonCertValidateDate);";

    var SQL_CT_ADD_CLIENTGSP = "update  %s.ClientGsp " +
        "SET  " +
        "   legalRepresentative = %s," +
        "   registeredCapital = %s," +
        "   businessAddress = %s," +
        "   limitedBusinessRange=%s,"+
        "   limitedBusinessType=%s,"+
        "   businessLicense = %s," +
        "   businessLicenseValidateDate = %s, " +
        "   orgCode = %s," +
        "   orgCodeValidateDate = %s," +
        "   taxRegistrationLicenseNum = %s," +
        "   taxRegistrationLicenseNumValidateDate = %s," +

        "   gmpOrGspLicenseNum = %s," +
        "   gmpOrGspLicenseNumValidateDate = %s," +
        "   medicalInstitutionLicenseNum = %s," +
        "   medicalInstitutionLicenseNumValidateDate = %s," +
        "   institutionLegalPersonCert = %s," +
        "   institutionLegalPersonCertValidateDate = %s," +

        "   productionAndBusinessLicenseNum = %s," +
        "   productionAndBusinessLicenseNumValidateDate = %s," +
        "   foodCirculationLicenseNum = %s," +
        "   foodCirculationLicenseNumValidateDate = %s," +
        "   medicalApparatusLicenseNum = %s," +
        "   medicalApparatusLicenseNumValidateDate = %s," +

        "   healthProductsLicenseNum = %s," +
        "   healthProductsLicenseNumValidateDate = %s," +
        "   mentaanesthesiaLicenseNum = %s," +
        "   mentalanesthesiaLicenseNumValidateDate = %s," +
        "   hazardousChemicalsLicenseNum = %s," +
        "   hazardousChemicalsLicenseNumValidateDate = %s," +

        "   maternalLicenseNum = %s," +
        "   maternalLicenseNumValidateDate = %s," +
        "   gspImages = %s " +
        "WHERE" +
        "   clientId = %d";

    var SQL_CT_UPDATE_CLIENTGSP_IMG = "UPDATE %s.ClientGsp SET legalRepresentative = '%s', gspImages = %s WHERE clientId = %d";



    var SQL_CT_UPDATE_CLIENT = "UPDATE %s.Client SET %s " +
        "WHERE id=%d;";

    var SQL_CT_DELETE_CLIENT = "DELETE FROM %s.Client WHERE id=%d;";

    var SQL_CT_ADD_PRICE_FOR_CLIENT =
        "INSERT INTO %s.ClientGoodsPrice(clientId, goodsId, pricePlan, price)  " +
        "SELECT %d, GoodsInfo.id, '%s', GoodsPrice.%s FROM %s.GoodsInfo,%s.GoodsPrice WHERE GoodsInfo.id=GoodsPrice.goodsId;";

    var SQL_CT_ADD_PRICE_FOR_CLIENT_BY_GOODSPRICE =
        "INSERT INTO %s.ClientGoodsPrice(goodsId, clientId, pricePlan, price) " +
        "SELECT %d, id, pricePlan, " +
        "       CASE " +
        "            WHEN pricePlan='wholesalePrice' THEN %f" +
        "            WHEN pricePlan='price1' THEN %f" +
        "            WHEN pricePlan='price2' THEN %f" +
        "            WHEN pricePlan='price3' THEN %f" +
        "       END " +
        "FROM %s.Client;";

    var SQL_CT_UPDATESTATUS_CLIENT = "UPDATE %s.Client SET %s " +
        "WHERE id=%d;";

    var SQL_CT_UPDATESTATUS_MUTICLIENT = "UPDATE %s.Client SET %s " +
        "WHERE id in ? ;";

    var SQL_CT_UPDATE_OPERATOR = "UPDATE %s.Operator  SET password='%s' " +
        "WHERE clientId=%d;";

    var SQL_CT_UPDATE_CLIENTFINANCE_CREDITS = "UPDATE %s.ClientFinance SET arrearsBalance=(%d-credits)+arrearsBalance, credits=%d WHERE clientId=%d;";

    var SQL_CT_UPDATE_CLIENTFINANCE_BALANCE = "UPDATE %s.ClientFinance SET arrearsBalance=arrearsBalance%s WHERE clientId=%d;";

    var SQL_CT_UPDATE_CLIENTFINANCE = "UPDATE %s.ClientFinance SET %s " +
        "WHERE clientId=%d;";

    var SQL_CT_GET_CLIENTFINANCE = "SELECT " +
        "id, guid, clientId, cashBalance, credits, arrearsBalance, " +
        "accountDays, updatedOn, createdOn " +
        "FROM %s.ClientFinance " +
        "WHERE clientId = %d";

    var SQL_CT_CLIENT_LIST   = "SELECT Client.id AS clientId, ClientCategory.categoryName AS clientCategory, Client.clientCode, Client.clientName, Client.clientArea, Client.pricePlan, Client.readOnly, Client.enabled, Client.createdOn " +
        "FROM %s.Client,%s.ClientCategory " +
        "%s " +       // where clause
        "%s " +       // order by clause
        "%s;";        // limit clause
    var SQL_CT_NEW_REGISTER_CLIENT_RETRIEVE_ALL = "" +
        "SELECT * from  %s.Client where registerStatus = 'CREATED' and clientName LIKE '%%%s%%' " +
        " %s ;";

    var SQL_CT_UPDATED_CLIENT_RETRIEVE_ALL = "" +
        "SELECT * from  %s.Client where registerStatus = 'UPDATED' and clientName LIKE '%%%s%%' " +
        " %s ;";

    var SQL_CT_NEW_REJECTED_REGISTER_CLIENT_RETRIEVE_ALL = "" +
        "SELECT * from  %s.Client where registerStatus = 'REJECTED' and clientName LIKE '%%%s%%' " +
        " %s ;";

    var SQL_CT_NEW_REGISTER_CLIENT_RETRIEVE_BY_ID = "" +
        "SELECT " +
        "   a.id as id," +
        "   a.clientCategoryId as clientCategoryId," +
        "   a.clientCode as clientCode," +
        "   a.clientArea as clientArea," +
        "   a.clientName as clientName," +
        "   a.pricePlan as pricePlan," +
        "   a.email as email," +
        "   a.mobile as mobile," +
        "   a.fax as fax," +
        "   a.defaultAddressId as defaultAddressId," +
        "   a.paymentReminderMsg as paymentReminderMsg," +
        "   a.registerStatus as registerStatus," +
        "   a.readOnly as readOnly," +
        "   a.enabled as enabled," +
        "   a.updatedOn as updatedOn," +
        "   a.createdOn as createdOn," +
        "   b.username as username, " +
        "   b.password as password, " +
        "   b.operatorType as operatorType, " +
        "   b.customerId as customerId, " +
        "   b.clientId as clientId, " +
        "   b.operatorCode as operatorCode, " +
        "   b.operatorName as operatorName, " +
        "   b.citizenIdNum as citizenIdNum, " +
        "   c.legalRepresentative as legalRepresentative, " +
        "   c.businessLicense as businessLicense, " +
        "   c.companyManager as companyManager, " +
        "   CASE" +
        "       WHEN businessLicenseValidateDate >= '2100-01-01 00:00:00' THEN '长期'" +
        "       ELSE DATE_FORMAT(businessLicenseValidateDate,'%%Y/%%m/%%d') " +
        "   END AS businessLicenseValidateDate, " +
        "   c.registeredCapital as registeredCapital, " +
        "   c.businessAddress as businessAddress, " +
        "   c.limitedBusinessRange as limitedBusinessRange, " +
        "   c.limitedBusinessType as limitedBusinessType, " +
        "   c.orgCode as orgCode, " +
        "   DATE_FORMAT(c.orgCodeValidateDate,'%%Y-%%m-%%d') as orgCodeValidateDate, " +
        "   c.taxRegistrationLicenseNum as taxRegistrationLicenseNum, " +
        "   DATE_FORMAT(c.taxRegistrationLicenseNumValidateDate,'%%Y/%%m/%%d') as taxRegistrationLicenseNumValidateDate, " +
        "   c.foodCirculationLicenseNum as foodCirculationLicenseNum, " +
        "   DATE_FORMAT(c.foodCirculationLicenseNumValidateDate,'%%Y/%%m/%%d') as foodCirculationLicenseNumValidateDate, " +
        "   c.qualityAssuranceLicenseNum as qualityAssuranceLicenseNum, " +
        "   DATE_FORMAT(c.qualityAssuranceLicenseNumValidateDate,'%%Y/%%m/%%d') as qualityAssuranceLicenseNumValidateDate, " +
        "   c.medicalApparatusLicenseNum as medicalApparatusLicenseNum, " +
        "   DATE_FORMAT(c.medicalApparatusLicenseNumValidateDate,'%%Y/%%m/%%d') as medicalApparatusLicenseNumValidateDate, " +
        "   c.medicalApparatusType as medicalApparatusType, " +
        "   c.healthProductsLicenseNum as healthProductsLicenseNum, " +
        "   DATE_FORMAT(c.healthProductsLicenseNumValidateDate,'%%Y/%%m/%%d') as healthProductsLicenseNumValidateDate, " +
        "   c.productionAndBusinessLicenseNum as productionAndBusinessLicenseNum, " +
        "   DATE_FORMAT(c.productionAndBusinessLicenseNumIssuedDate,'%%Y/%%m/%%d') as productionAndBusinessLicenseNumIssuedDate, " +
        "   DATE_FORMAT(c.productionAndBusinessLicenseNumValidateDate,'%%Y/%%m/%%d') as productionAndBusinessLicenseNumValidateDate, " +
        "   c.productionAndBusinessLicenseNumIssuedDepartment as productionAndBusinessLicenseNumIssuedDepartment, " +
        "   c.storageAddress as storageAddress, " +
        "   c.mentaanesthesiaLicenseNum as mentaanesthesiaLicenseNum, " +
        "   DATE_FORMAT(c.mentalanesthesiaLicenseNumValidateDate,'%%Y/%%m/%%d') as mentalanesthesiaLicenseNumValidateDate, " +
        "   c.gmpOrGspLicenseNum as gmpOrGspLicenseNum, " +
        "   DATE_FORMAT(c.gmpOrGspLicenseNumValidateDate,'%%Y/%%m/%%d') as gmpOrGspLicenseNumValidateDate, " +
        "   c.hazardousChemicalsLicenseNum as hazardousChemicalsLicenseNum, " +
        "   DATE_FORMAT(c.hazardousChemicalsLicenseNumValidateDate,'%%Y/%%m/%%d') as hazardousChemicalsLicenseNumValidateDate, " +
        "   c.medicalInstitutionLicenseNum as medicalInstitutionLicenseNum, " +
        "   DATE_FORMAT(c.medicalInstitutionLicenseNumValidateDate,'%%Y/%%m/%%d') as medicalInstitutionLicenseNumValidateDate, " +
        "   c.maternalLicenseNum as maternalLicenseNum, " +
        "   DATE_FORMAT(c.maternalLicenseNumValidateDate,'%%Y/%%m/%%d') as maternalLicenseNumValidateDate, " +
        "   c.institutionLegalPersonCert as institutionLegalPersonCert, " +
        "   DATE_FORMAT(c.institutionLegalPersonCertValidateDate,'%%Y/%%m/%%d') as institutionLegalPersonCertValidateDate, " +
        "   c.gspImages as gspImages " +
        "FROM  %s.Client a " +
        "JOIN %s.Operator b " +
        "ON  a.id = b.clientId " +
        "JOIN %s.ClientGsp c " +
        "ON a.id = c.clientId " +
        "WHERE a.id = %d;";

    var SQL_CT_NEW_REGISTER_CLIENT_SET_ENABLE = "update %s.Client SET %s" +
        "WHERE id = %d and registerStatus != 'APPROVED'  ;";

    var SQL_CT_NEW_REGISTER_CLIENT_SET_DISABLE = "" +
        "update %s.Client " +
        "SET " +
        "   registerStatus = '%s' " +
        "WHERE" +
        "   id = %d;";

    //REJECT->CRETEATED
    var SQL_CT_NEW_REGISTER_STATUS_FROM_REJECTED_TO_CREATED=""+
        "update %s.Client " +
        "SET " +
        "   registerStatus = 'CREATED' " +
        "WHERE" +
        "   id = %d;";

    var SQL_CT_NEW_REGISTER_STATUS_FROM_APPROVED_TO_UPDATED = ""+
        "update %s.Client " +
        "SET " +
        "   registerStatus = 'UPDATED' " +
        "WHERE" +
        "   id = %d;";
    var SQL_CT_CLIENT_SELECT_BY_ID = "SELECT a.id AS id,  b.categoryName As clientCategory,a.clientCategoryId As clientCategoryId, a.hospitalLevel, a.hospitalGrades, checkComments,clientCode, clientName,clientArea, pricePlan, email,mobile,fax," +
        "defaultAddress, paymentReminderMsg, paymentType, readOnly, enabled, registerStatus, stampLink  " +
        "FROM %s.Client a " +
        "LEFT JOIN %s.ClientCategory b " +
        "on a.clientCategoryId = b.id " +
        "WHERE a.id = %d;";

    var SQL_CT_CLIENT_PRICE_SELECT_BY_ID = "SELECT goodsId " +
        " FROM %s.ClientPrice " +
        " WHERE clientId = %d;";

    var SQL_CT_SELECT_CLIENT_FREQ_BUY = "SELECT " +
        " ClientFreqBuy.id as CFBid," +
        " ClientFreqBuy.clientId as clientId, " +
        " ClientFreqBuy.goodsId as goodsId, " +
        " ClientFreqBuy.orderFreq as orderFreq, " +
        "       GoodsInfo.commonName, " +
        "       GoodsInfo.alias, " +
        "       GoodsInfo.goodsNo, " +
        "       GoodsInfo.spec, " +
        "       GoodsInfo.imageUrl, " +
        "       GoodsInfo.producer, " +
        "       GoodsInfo.negSell as negSell, " +
        "       GoodsInfo.measureUnit as measureUnit, " +
        "       GoodsInfo.middlePackNum as middlePackNum, " +
        "       ClientGoodsPrice.price as wholesalePrice, " +
        "       GoodsPrice.refRetailPrice, " +
        "       GoodsInventory.amount as storage, " +
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.onSell, " +
        "       GoodsInventory.isSplit, " +
        " DATE_FORMAT(ClientFreqBuy.updatedOn,'%%Y-%%m-%%d %%H:%%i:%%S') AS updatedOn " +
        " FROM %s.ClientFreqBuy " +
        " LEFT JOIN %s.GoodsInfo ON ClientFreqBuy.goodsId = GoodsInfo.id " +
        " LEFT JOIN %s.GoodsPrice ON ClientFreqBuy.goodsId = GoodsPrice.id " +
        " LEFT JOIN %s.ClientGoodsPrice ON (ClientFreqBuy.goodsId = ClientGoodsPrice.goodsId  " +
        "           AND  ClientFreqBuy.clientId = ClientGoodsPrice.clientId) " +
        " LEFT JOIN %s.GoodsInventory ON ClientFreqBuy.goodsId = GoodsInventory.goodsId " +
        " WHERE  ClientFreqBuy.clientId = %d ORDER BY ClientFreqBuy.orderFreq DESC;";
    /* Client GSP operations */


    var SQL_CT_GSPTYPES_SELECT_BY_ID = " SELECT " +
        " ClientGspIdLinks.clientId as clientId, " +
        " ClientGspIdLinks.gspTypeId as gspTypeId, " +
        " ClientGspTypes.name as gspType " +
        " FROM %s.ClientGspIdLinks,%s.ClientGspTypes " +
        " WHERE ClientGspIdLinks.clientId = %d " +
        " AND ClientGspIdLinks.gspTypeId = ClientGspTypes.id ;";

    var SQL_CT_GSPTYPESUPDATE_SELECT_BY_ID= " SELECT " +
        " ClientGspIdLinksUpdate.clientId as clientId, " +
        " ClientGspIdLinksUpdate.gspTypeId as gspTypeId, " +
        " ClientGspTypes.name as gspType, " +
        " ClientGspIdLinksUpdate.groupGuid, " +
        " ClientGspIdLinksUpdate.createdOn " +
        " FROM %s.ClientGspIdLinksUpdate,%s.ClientGspTypes " +
        " WHERE ClientGspIdLinksUpdate.clientId = %d " +
        " AND ClientGspIdLinksUpdate.gspTypeId = ClientGspTypes.id " +
        " ORDER BY ClientGspIdLinksUpdate.createdOn DESC" +
        " ;";

    /* delete delete timestamp*/
    var SQL_CT_GSPINFO_SELECT_BY_ID = "SELECT ClientGsp.id,clientId, legalRepresentative, businessLicense, companyManager, gspImages, mobile ,registerStatus," +
        "   CASE" +
        "       WHEN businessLicenseValidateDate >= '2100-01-01 00:00:00' THEN '长期'" +
        "       ELSE DATE_FORMAT(businessLicenseValidateDate,'%%Y/%%m/%%d') " +
        "   END AS businessLicenseValidateDate, " +
            /*" DATE_FORMAT(businessLicenseValidateDate,'%%Y/%%m/%%d') AS businessLicenseValidateDate, " +*/
        " registeredCapital,businessAddress,limitedBusinessRange,limitedBusinessType, orgCode, " +
        "DATE_FORMAT(orgCodeValidateDate,'%%Y/%%m/%%d') AS orgCodeValidateDate, " +
        " taxRegistrationLicenseNum, " +
        "DATE_FORMAT(taxRegistrationLicenseNumValidateDate,'%%Y/%%m/%%d') AS taxRegistrationLicenseNumValidateDate, "   +
        " foodCirculationLicenseNum, " +
        "DATE_FORMAT(foodCirculationLicenseNumValidateDate,'%%Y/%%m/%%d') AS foodCirculationLicenseNumValidateDate, " +
        "qualityAssuranceLicenseNum, " +
        "DATE_FORMAT(qualityAssuranceLicenseNumValidateDate,'%%Y/%%m/%%d') AS qualityAssuranceLicenseNumValidateDate, " +
        "medicalApparatusLicenseNum, " +
        "DATE_FORMAT(medicalApparatusLicenseNumValidateDate,'%%Y/%%m/%%d') AS medicalApparatusLicenseNumValidateDate, " +
        " medicalApparatusType, " +
        " healthProductsLicenseNum, " +
        "DATE_FORMAT(healthProductsLicenseNumValidateDate,'%%Y/%%m/%%d') AS healthProductsLicenseNumValidateDate, " +
        " productionAndBusinessLicenseNum, " +
        "DATE_FORMAT(productionAndBusinessLicenseNumIssuedDate,'%%Y/%%m/%%d') AS productionAndBusinessLicenseNumIssuedDate, " +
        "DATE_FORMAT(productionAndBusinessLicenseNumValidateDate,'%%Y/%%m/%%d') AS productionAndBusinessLicenseNumValidateDate, " +
        " productionAndBusinessLicenseNumIssuedDepartment, " +
        " storageAddress, " +
        " mentaanesthesiaLicenseNum, " +
        "DATE_FORMAT(mentalanesthesiaLicenseNumValidateDate,'%%Y/%%m/%%d') AS  mentalanesthesiaLicenseNumValidateDate, " +
        "gmpOrGspLicenseNum, " +
        "DATE_FORMAT(gmpOrGspLicenseNumValidateDate,'%%Y/%%m/%%d') AS gmpOrGspLicenseNumValidateDate, " +
        "hazardousChemicalsLicenseNum, " +
        "DATE_FORMAT(hazardousChemicalsLicenseNumValidateDate,'%%Y/%%m/%%d') AS hazardousChemicalsLicenseNumValidateDate, " +
        " medicalInstitutionLicenseNum, " +
        "DATE_FORMAT(medicalInstitutionLicenseNumValidateDate,'%%Y/%%m/%%d') AS medicalInstitutionLicenseNumValidateDate, " +
        "maternalLicenseNum, " +
        "DATE_FORMAT(maternalLicenseNumValidateDate,'%%Y/%%m/%%d') AS maternalLicenseNumValidateDate, " +
        "institutionLegalPersonCert, " +
        "DATE_FORMAT(institutionLegalPersonCertValidateDate,'%%Y/%%m/%%d') AS institutionLegalPersonCertValidateDate,  " +
        "Client.defaultAddress AS defaultAddress " +
        "FROM %s.ClientGsp left join %s.Client " +
        "on ClientGsp.ClientId = Client.id "+
        "WHERE clientId=%d;";

    var SQL_CT_QUALINFO_SELECT_BY_ID = "SELECT " +
        //" Client.id, Client.clientName, Client.clientCategoryId, " +
        " ClientCategory.categoryName, Client.paymentType, Client.clientArea, ClientGsp.businessLicense, " +
        " ClientGsp.limitedBusinessType, ClientGsp.limitedBusinessRange, ClientGspTypes.name as limitedBusinessType, " +
        " DATE_FORMAT(ClientGsp.taxRegistrationLicenseNumValidateDate,'%%Y/%%m/%%d') AS taxRegistrationLicenseNumValidateDate, " +
        " CASE " +
        " WHEN ClientGsp.businessLicenseValidateDate >= '2100-01-01 00:00:00' THEN '长期'" +
        " ELSE DATE_FORMAT(ClientGsp.businessLicenseValidateDate,'%%Y/%%m/%%d') " +
        " END AS businessLicenseValidateDate, " +
        " DATE_FORMAT(ClientGsp.mentalanesthesiaLicenseNumValidateDate,'%%Y/%%m/%%d') AS mentalanesthesiaLicenseNumValidateDate, " +
        " DATE_FORMAT(ClientGsp.gmpOrGspLicenseNumValidateDate,'%%Y/%%m/%%d') AS gmpOrGspLicenseNumValidateDate, " +
        " DATE_FORMAT(ClientGsp.medicalInstitutionLicenseNumValidateDate,'%%Y/%%m/%%d') AS medicalInstitutionLicenseNumValidateDate, " +
        " DATE_FORMAT(ClientGsp.medicalApparatusLicenseNumValidateDate,'%%Y/%%m/%%d') AS medicalApparatusLicenseNumValidateDate, " +
        " DATE_FORMAT(ClientGsp.institutionLegalPersonCertValidateDate,'%%Y/%%m/%%d') AS institutionLegalPersonCertValidateDate, " +
        " DATE_FORMAT(ClientGsp.orgCodeValidateDate,'%%Y/%%m/%%d') AS orgCodeValidateDate, " +
        " DATE_FORMAT(ClientGsp.foodCirculationLicenseNumValidateDate,'%%Y/%%m/%%d') AS foodCirculationLicenseNumValidateDate, " +
        " DATE_FORMAT(ClientGsp.maternalLicenseNumValidateDate,'%%Y/%%m/%%d') AS maternalLicenseNumValidateDate, " +
        " DATE_FORMAT(ClientGsp.productionAndBusinessLicenseNumValidateDate,'%%Y/%%m/%%d') AS productionAndBusinessLicenseNumValidateDate, " +
        " DATE_FORMAT(ClientGsp.hazardousChemicalsLicenseNumValidateDate,'%%Y/%%m/%%d') AS hazardousChemicalsLicenseNumValidateDate, " +
        " DATE_FORMAT(ClientGsp.healthProductsLicenseNumValidateDate,'%%Y/%%m/%%d') AS healthProductsLicenseNumValidateDate " +
        " FROM %s.ClientGsp, %s.Client, %s.ClientCategory, %s.ClientGspIdLinks, %s.ClientGspTypes " +
        " WHERE ClientGsp.clientId=%d " +
        " AND ClientGsp.ClientId = Client.id " +
        " AND Client.clientCategoryId=ClientCategory.id"+
        " AND ClientGspIdLinks.clientId=Client.id " +
        " AND ClientGspTypes.id=ClientGspIdLinks.gspTypeId ;";



    var SQL_CT_GSPINFO_FROM_CLIENTUPDATE_SELECT_BY_ID="SELECT id,clientId, legalRepresentative, businessLicense, gspImages , mobile ," +
        "   CASE" +
        "       WHEN businessLicenseValidateDate >= '2100-01-01 00:00:00' THEN '长期'" +
        "       ELSE DATE_FORMAT(businessLicenseValidateDate,'%%Y/%%m/%%d') " +
        "   END AS businessLicenseValidateDate, " +
            /*" DATE_FORMAT(businessLicenseValidateDate,'%%Y/%%m/%%d') AS businessLicenseValidateDate, " +*/
        " registeredCapital,businessAddress,limitedBusinessRange,limitedBusinessType, orgCode, " +
        "DATE_FORMAT(orgCodeValidateDate,'%%Y/%%m/%%d') AS orgCodeValidateDate, " +
        " taxRegistrationLicenseNum, " +
        "DATE_FORMAT(taxRegistrationLicenseNumValidateDate,'%%Y/%%m/%%d') AS taxRegistrationLicenseNumValidateDate, "   +
        " foodCirculationLicenseNum, " +
        "DATE_FORMAT(foodCirculationLicenseNumValidateDate,'%%Y/%%m/%%d') AS foodCirculationLicenseNumValidateDate, " +
        "qualityAssuranceLicenseNum, " +
        "DATE_FORMAT(qualityAssuranceLicenseNumValidateDate,'%%Y/%%m/%%d') AS qualityAssuranceLicenseNumValidateDate, " +
        "medicalApparatusLicenseNum, " +
        "DATE_FORMAT(medicalApparatusLicenseNumValidateDate,'%%Y/%%m/%%d') AS medicalApparatusLicenseNumValidateDate, " +
        " medicalApparatusType, " +
        " healthProductsLicenseNum, " +
        "DATE_FORMAT(healthProductsLicenseNumValidateDate,'%%Y/%%m/%%d') AS healthProductsLicenseNumValidateDate, " +
        " productionAndBusinessLicenseNum, " +
        "DATE_FORMAT(productionAndBusinessLicenseNumIssuedDate,'%%Y/%%m/%%d') AS productionAndBusinessLicenseNumIssuedDate, " +
        "DATE_FORMAT(productionAndBusinessLicenseNumValidateDate,'%%Y/%%m/%%d') AS productionAndBusinessLicenseNumValidateDate, " +
        " productionAndBusinessLicenseNumIssuedDepartment, " +
        " storageAddress, " +
        " mentaanesthesiaLicenseNum, " +
        "DATE_FORMAT(mentalanesthesiaLicenseNumValidateDate,'%%Y/%%m/%%d') AS  mentalanesthesiaLicenseNumValidateDate, " +
        "gmpOrGspLicenseNum, " +
        "DATE_FORMAT(gmpOrGspLicenseNumValidateDate,'%%Y/%%m/%%d') AS gmpOrGspLicenseNumValidateDate, " +
        "hazardousChemicalsLicenseNum, " +
        "DATE_FORMAT(hazardousChemicalsLicenseNumValidateDate,'%%Y/%%m/%%d') AS hazardousChemicalsLicenseNumValidateDate, " +
        " medicalInstitutionLicenseNum, " +
        "DATE_FORMAT(medicalInstitutionLicenseNumValidateDate,'%%Y/%%m/%%d') AS medicalInstitutionLicenseNumValidateDate, " +
        "maternalLicenseNum, " +
        "DATE_FORMAT(maternalLicenseNumValidateDate,'%%Y/%%m/%%d') AS maternalLicenseNumValidateDate, " +
        "institutionLegalPersonCert, " +
        "DATE_FORMAT(institutionLegalPersonCertValidateDate,'%%Y/%%m/%%d') AS institutionLegalPersonCertValidateDate " +
        "FROM %s.ClientUpdate  " +
        "WHERE clientId=%d order by id DESC LIMIT 1 ;";

    var SQL_CT_GSPINFO_UPDATE = "UPDATE %s.ClientGsp SET %s" +
        " WHERE clientId=%d;";

    var SQL_CT_GSPINFO_CLEAR_BY_ID = "DELETE FROM %s.ClientGspIdLinks " +
        " WHERE clientId=%d;";

    var SQL_CT_GSPINFO_UPDATE_TO_TABLE_CLIENTUPDATE="INSERT INTO %s.ClientUpdate (%s) " +
        "VALUES (%s);";
    var SQL_CT_GSPINFO_INSERT = "INSERT INTO %s.ClientGsp (%s) " +
        "VALUES (%s);";

    var SQL_CT_CLIENT_BYNAME_SELECT =
        "SELECT id, clientName,pricePlan,clientCode " +
        "  FROM %s.Client " +
        " WHERE clientName like '%%%s%%' " +
        " AND (registerStatus='APPROVED' OR registerStatus='UPDATED') ; ";
    var SQL_CT_GLIENT_RETRIEVE_BASICINFO =
        "SELECT id,clientCode,clientName,stampLink ," +
        "registerStatus  " +
        "From %s.Client  " +
        "WHERE id= %d; ";

    var SQL_CT_RETRIEVE_CLIENT_INFO_FOR_CONTRACT =
        "SELECT " +
        "   a.id as clientId, " +
        "   a.clientName as clientName, " +
        "   a.stampLink as stampLink, " +
        "   a.paymentType as paymentType, " +
        "   b.legalRepresentative as legalRepresentative, " +
        "   a.defaultAddress as defaultAddress, " +
        "   b.businessAddress as businessAddress " +
        "FROM " +
        "   %s.Client a " +
        "LEFT JOIN " +
        "   %s.ClientGsp b " +
        "ON " +
        "   a.id = b.clientId " +
        "WHERE " +
        "   a.id = %d; ";


    var SQL_CT_CLIENT_UPDATE_CHECKCOMMENTS=
        "UPDATE %s.Client set checkComments " +
        "='%s' " +
        "WHERE id=%d;";
    var SQL_CT_CLIENTGOODS_INSERT = "INSERT INTO %s.ClientPrice (clientId,goodsId,clientPrice) " +
        "VALUES (%d,%d,%f);";

    var SQL_CT_CLIENTGOODS_UPDATE = "UPDATE %s.ClientPrice SET clientPrice=%f " +
        "WHERE clientId = %d AND goodsId = %d;";

    var SQL_CT_CLIENTGOODS_DELETE = "DELETE FROM %s.ClientPrice " +
        "WHERE clientId = %d AND goodsId = %d;";

    var SQL_CT_CLIENTGOODS_SELECT = "SELECT " +
        " ClientPrice.clientId," +
        " ClientPrice.goodsId, " +
        "       GoodsInfo.commonName, " +
        "       GoodsInfo.alias, " +
        "       GoodsInfo.goodsNo, " +
        "       GoodsInfo.spec, " +
        "       GoodsInfo.imageUrl, " +
        "       GoodsInfo.producer, " +
        " ClientPrice.clientPrice " +
        " FROM %s.ClientPrice " +
        " LEFT JOIN %s.GoodsInfo ON ClientPrice.goodsId=GoodsInfo.id " +
        " WHERE ClientPrice.clientId = %d  " +
        " %s";

    var SQL_CT_UPDATE_ERP_SETTING = "" +
        "UPDATE %s.Client " +
        "SET " +
        "   erpIsAvailable = %d, " +
        "   erpAppCodeUrl = '%s', " +
        "   erpMsgUrl = '%s', " +
        "   appKey = '%s' " +
        "WHERE" +
        "   id = %d;";

    var SQL_CT_RETRIEVE_APPKEY_BY_ID = "select appKey from %s.Client where id = %d;";

    var SQL_CT_RETRIEVE_APPKEY = "" +
        "SELECT EXISTS(SELECT * FROM %s.Client WHERE id = %d AND appKey = '%s') AS isExist;";

    var SQL_CT_RETRIEVE_USER_ERP_INFO = "" +
        "select " +
        "   customerDBSuffix as customerDBSuffix, " +
        "   enterpriseType as enterpriseType, " +
        "   erpMsgUrl as erpMsgUrl, " +
        "   erpAppCodeUrl as  erpAppCodeUrl, " +
        "   appKey as appKey " +
        "from " +
        "   %s.Customer " +
        "where " +
        "   id = %d ;";

    //客户区域设置 ClientArea.sql
    var SQL_CT_CLIENTAREAS_INSERT = "INSERT INTO %s.ClientArea (name) " +
        "VALUES ('%s');";

    var SQL_CT_CLIENTAREAS_UPDATE = "UPDATE %s.ClientArea SET name='%s' " +
        "WHERE id = %d;";

    var SQL_CT_CLIENTAREAS_DELETE = "DELETE FROM %s.ClientArea " +
        "WHERE id = %d;";

    var SQL_CT_CLIENTAREAS_SELECT = "SELECT " +
            " id, " +
            " name, " +
            " clientId, " +
            " DATE_FORMAT(updatedOn,'%%Y/%%m/%%d'), " +
            " DATE_FORMAT(createdOn,'%%Y/%%m/%%d') " +
        " FROM %s.ClientArea;";

    var SQL_CT_CLIENT_LOGIN_CHECK = "" +
        "SELECT " +
        "   clientName, " +
        "   registerStatus, " +
        "   readOnly, " +
        "   enabled, " +
        "   erpIsAvailable " +
        "FROM " +
        "   %s.Client " +
        "where " +
        "   id = %d; ";

    var SQL_CT_CLIENT_FREQBUY_UPDATE =
        "INSERT INTO %s.ClientFreqBuy(clientId, goodsId, orderFreq) " +
        "     SELECT OrderInfo.clientId, OrderDetails.goodsId, 1 " +
        "       FROM %s.OrderDetails,%s.OrderInfo " +
        "      WHERE OrderInfo.id = OrderDetails.orderId AND " +
        "            OrderDetails.orderId=%d " +
        "ON DUPLICATE KEY UPDATE orderFreq=orderFreq+1;";

    var SQL_CT_CLIENT_GSP_TYPES = " select " +
        "id, name, updatedOn " +
        "FROM %s.ClientGspTypes " +
        "Order By id ASC";

    var SQL_CT_OTHTER_CUSTOMER_OPERATOR_SELECT =
        " SELECT " +
        " Operator.id AS operatorId, " +
        " Operator.operatorName, " +
        " Operator.operatorType, " +
        " Operator.customerId, " +
        " Operator.department  " +
        " From %s.Operator " +
        " WHERE Operator.operatorType='CUSTOMER' " +
        " AND Operator.operatorRoles LIKE '%%FP_APPROVE_PRICE%%' " +
        " AND Operator.id <> %d " +
        " AND Operator.enable = TRUE;";
    var SQL_CT_DELETE_GSPTYPES_BY_CLIENTID="" +
        "DELETE FROM  " +
        "%s.ClientGspIdLinks " +
        "WHERE " +
        "clientId=%d";
    var SQL_CT_BATCH_INSERT_GSPTYPES="" +
        "INSERT INTO %s.ClientGspIdLinks(clientId,gspTypeId) " +
        "VALUES ?";
    var SQL_CT_BATCH_INSERT_GSPTYPES_UPDATETABLE="" +
        "INSERT INTO %s.ClientGspIdLinksUpdate(clientId,gspTypeId,groupGuid) " +
        "VALUES ?";

    var SQL_CT_SELECT_DRUGSTYPE= "SELECT id, name, updatedOn FROM %s.GoodsDrugsType;";
    var SQL_CT_INSERT_DRUGSTYPE= "INSERT INTO %s.GoodsDrugsType (name) VALUES ('%s');";
    var SQL_CT_DELETE_DRUGSTYPE= "DELETE FROM %s.GoodsDrugsType WHERE id=%d;";
    var SQL_CT_DELETE_DRUGSTYPE_CHECK_IN_JXID =
        " SELECT commonName  " +
        " FROM %s.GoodsInfo  " +
        " LEFT JOIN %s.GoodsDrugsType " +
        " ON GoodsDrugsType.name = GoodsInfo.drugsType  " +
        " WHERE GoodsDrugsType.id = %d;";
    var SQL_CT_SELECT_CLOUDDB_FROM_CLIENT = " SELECT"  +
        "   Client.stampLink, " +
        "   ClientGsp.legalRepresentative, " +
        "   ClientGsp.businessLicense," +
        "   ClientGsp.businessLicenseValidateDate" +
        "   FROM %s.Client,%s.ClientGsp" +
        "   WHERE Client.id = ClientGsp.clientId" +
        "   AND Client.id = %d ;";
    var SQL_CT_INSERT_CLOUDDB_FROM_CLIENT = "" +
        "   INSERT INTO %s.Customer (customerName,customerDBSuffix,enterpriseType," +
        "   businessLicense,businessLicenseValidateDate,stampLink)" +
        "   VALUES( '%s','%s','%s','%s','%s','%s')   " +
        "   ON DUPLICATE KEY UPDATE " +
        "   customerName=VALUES(customerName)," +
        "   customerDBSuffix=VALUES(customerDBSuffix)," +
        "   enterpriseType=VALUES(enterpriseType)," +
        "   businessLicense=VALUES(businessLicense)," +
        "   businessLicenseValidateDate=VALUES(businessLicenseValidateDate)," +
        "   stampLink=VALUES(stampLink);";

    var SQL_CT_DELETE_CLIENTSALESCOPE = "DELETE FROM %s.ClientSaleScope WHERE ClientSaleScope.clientId=%s;";

    var SQL_CT_INSERT_CLIENTSALESCOPE = "INSERT INTO %s.ClientSaleScope (clientId,goodsGspTypeId) VALUES %s ;";

    var SQL_CT_SELECT_CLIENTSALESCOPE = " SELECT " +
        " GoodsGspType.id, GoodsGspType.name " +
        " FROM %s.ClientSaleScope, %s.GoodsGspType " +
        " WHERE ClientSaleScope.clientId=%d " +
        " AND ClientSaleScope.goodsGspTypeId=GoodsGspType.id; ";

    /**
     * DB Service provider
     */
    var dbService = {


        /**
         * 客户支付参数插入
         * @param customerDB
         * @param paymentData
         * @param callback
         */
        insertClientPayment : function(customerDB,paymentData,callback){
            logger.enter();
            var SQL = "INSERT INTO %s.ClientPaymentGateway (name,version,encoding,signMethod,baseUrl)" +
                " VALUES ('%s','%s','%s','%s','%s')  ";
            var sql=sprintf(SQL,customerDB,
                paymentData.name,
                paymentData.version,
                paymentData.encoding,
                paymentData.signMethod,
                paymentData.baseUrl);
            logger.sql(sql);

            __mysql.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err, result);
                }
            })
        },

        /**
         * 客户支付select
         * @param customerDB
         * @param paymentData
         * @param callback
         */
        selectClientPaymentId : function(customerDB,paymentData,callback){
            logger.enter();
            var SQL = "SELECT id FROM %s.ClientPaymentGateway " +
                "   WHERE name = '%s' AND version = '%s' ;";
            var sql=sprintf(SQL,customerDB,
                paymentData.name,
                paymentData.version);
            logger.sql(sql);

            __mysql.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err, result);
                }
            })
        },
        /**
         * 客户支付核心数据插入
         * @param customerDB
         * @param configData
         * @param paymentId
         * @param callback
         */
        insertUPdateClientPaymentKeys : function(customerDB,configData,paymentId,callback){
            logger.enter();
            var SQL = "INSERT INTO %s.ClientPaymentKeys (customerId,paymentId,isForbidden,configValue)" +
                " VALUES (%d, %d, '%s','%s') ON DUPLICATE KEY UPDATE customerId=VALUES(customerId)," +
                " paymentId=VALUES(paymentId),  isForbidden=VALUES(isForbidden),configValue=VALUES(configValue);";
            var sql=sprintf(SQL,customerDB,
                configData.customerId,
                paymentId,
                configData.isForbidden,
                configData.configValue);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err, result);
                }
            })
        },

        /**
         * 获取剂型信息
         * @param customerDB
         * @param callback
         */
        selectDrugsTypeInfo: function(customerDB, callback) {
            logger.enter();
            var sql=sprintf(SQL_CT_SELECT_DRUGSTYPE, customerDB);
            logger.sql(sql);

            __mysql.query(sql, function(err, result) {
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err, result);
                }
            });
        },

        /**
         * 添加剂型信息
         * @param customerDB
         * @param jxValue
         * @param callback
         */
        insertDrugsTypeInfo: function(customerDB, jxValue, callback){
            logger.enter();
            var sql=sprintf(SQL_CT_INSERT_DRUGSTYPE, customerDB, jxValue);
            logger.sql(sql);

            __mysql.query(sql, function(err, result) {
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err, result);
                }
            });
        },

        /**
         * 删除剂型信息
         * @param customerDB
         * @param jxId
         * @param callback
         */
        deleteDrugsTypeInfo: function(customerDB, jxId, callback) {
            logger.enter();
            var sql=sprintf(SQL_CT_DELETE_DRUGSTYPE, customerDB, jxId);
            logger.sql(sql);

            __mysql.query(sql, function(err, result) {
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err, result);
                }
            });
        },


        /**
         * 检查该剂型下面是否有商品信息
         * @param customerDB
         * @param jxId
         * @param callback
         */
        checkGoodsInDrugsType: function (customerDB, jxId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_DELETE_DRUGSTYPE_CHECK_IN_JXID, customerDB, customerDB, jxId);
            logger.sql(sql);

            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err);
                } else {
                    callback(err, result);
                }
            });
        },

        //删除 clientId 的所有控制类型
        metaGspTypesDeleteByClientId:function(connect,customerDB,clientId,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_DELETE_GSPTYPES_BY_CLIENTID,customerDB,clientId);
            logger.sql(sql);

            connect.query(sql,function(err,result){
                if(err){
                        logger.error(err);
                        callback(err);
                }else{
                    callback(err, result);
                }
            })
        },
        //ClientGspIdLinks 批量插入
        metaGspTypesBatchInsert:function(connect,customerDB,batchClientGspTypesData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_BATCH_INSERT_GSPTYPES,customerDB);
            logger.sql(sql);

            connect.query(sql,[batchClientGspTypesData],function(err,result){
                    if(err){
                        logger.error(err);
                        callback(err);
                    }
                    else{
                        callback(err,result);
                        }
            })
        },


        //select data for insert into CloudDB.customer
        metaCloudDBInfoSelect:function(connect,customerDB,clientId,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_SELECT_CLOUDDB_FROM_CLIENT,
                customerDB,customerDB,clientId);
            logger.sql(sql);

            connect.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,result);
                }
            })
        },


        metaInsertCloudDB : function(connect,cloudDB,cloudDBInfo,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_INSERT_CLOUDDB_FROM_CLIENT,
                cloudDB,
                cloudDBInfo.customerName,
                cloudDBInfo.customerDBSuffix,
                cloudDBInfo.enterpriseType,
                cloudDBInfo.businessLicense,
                cloudDBInfo.businessLicenseValidateDate,
                cloudDBInfo.stampLink
            );
            logger.sql(sql);

            connect.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,result);
                }
            })
        },

        //更新Operator表中的CustomerId
        metaUpdateOperatorCustomerId: function(connect,customerDBName,cloudDBName,clientId,licenseNo,callback){
            var SQL = " UPDATE %s.Operator " +
                " LEFT JOIN %s.Customer ON Customer.businessLicense = '%s' " +
                " SET customerId = Customer.id " +
                " WHERE Operator.clientId = %d;";
            var sql=sprintf(SQL,customerDBName,
                cloudDBName,licenseNo,clientId
            );
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,result);
                }
            });
        },


        //ClientGspIdLinksUpdate表格 批量插入
        metaGspTypesUpdateBatchInsert:function(customerDB,batchClientGspTypesData,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_BATCH_INSERT_GSPTYPES_UPDATETABLE,customerDB);
            logger.sql(sql);
            __mysql.query(sql,[batchClientGspTypesData],function(err,result){
                if(err){
                    logger.error(err);
                    callback(err);
                }
                else{
                    callback(err,result);
                }
            })
        }
        ,
        listOthterCustomerOperator: function(customerDB,operatorId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_OTHTER_CUSTOMER_OPERATOR_SELECT,
                customerDB,operatorId);
            logger.sql(sql);

            __mysql.query(sql, function (error, results) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    logger.debug(JSON.stringify(results));
                    callback(null, results);
                }
            });
        },

        listClientGspTypes: function (customerDB, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_CLIENT_GSP_TYPES, customerDB);
            logger.sql(sql);

            __mysql.query(sql, function (error, results) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(null, results);
                }
            });
        },

        clientLoginCheck: function (customerDB, clientId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_CLIENT_LOGIN_CHECK, customerDB, clientId);
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                }
                callback(null, result);
            });
        },

        //客户区域设置 ClientArea.sql
        addClientArea : function(customerDBName, areaName, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTAREAS_INSERT,customerDBName,areaName);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(error, result.insertId);
                }

            });
        },

        getClientArea : function(customerDBName, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTAREAS_SELECT,customerDBName);
            logger.sql(sql);
            __mysql.query(sql, function (error, results) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(error, results);
                }

            });
        },

        updateClientArea: function(customerDBName, clientAreaId, areaName, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTAREAS_UPDATE,customerDBName,areaName,clientAreaId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(error, result.affectedRows);
                }

            });
        },

        deleteClientArea: function(customerDBName, clientAreaId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTAREAS_DELETE,customerDBName,clientAreaId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                }else{
                    callback(error, result.affectedRows);
                }

            });
        },

        retrieveClientInfoForContract: function(customerDBName, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETRIEVE_CLIENT_INFO_FOR_CONTRACT, customerDBName, customerDBName, clientId);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                callback(error, result[0]);
            });
        },

        retrieveUserErpInfo: function (cloudDbName, enterpriseId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_RETRIEVE_USER_ERP_INFO, cloudDbName, enterpriseId);

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error();
                    return callback(error);
                }
                callback(null, result);
            });
        },

        retrieveClientErpSetting:function(dbName,id,callback){
            logger.enter();
            var sql=sprintf(SQL_CL_RETRIEVE_CLIENT_ERP_SETTING, dbName, id);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                } else{
                    callback(null,result);
                }
            });
        },
        updateClientERPSetting: function (dbName, clientId, erpIsAvailable, erpAppCodeUrl, erpMsgUrl, appKey, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_UPDATE_ERP_SETTING, dbName, erpIsAvailable, erpAppCodeUrl, erpMsgUrl, appKey, clientId);

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        retrieveClientAppKey: function (dbName, userId, appKey, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_RETRIEVE_APPKEY, dbName, userId, appKey);
            __mysql.query(sql, function (error, result){
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        clientDeleteGoods: function(customerDB,clientId,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTGOODS_DELETE,
                customerDB, clientId,goodsId
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });
        },

        clientUpdatePrice: function(customerDB,price,clientId,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTGOODS_UPDATE,
                customerDB, price,clientId,goodsId
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });
        },

        listClientGoods:function(customerDB,clientId,paginator,callback){
            logger.enter();
            var limitCondition=paginator.limit();
            var sql = sprintf(SQL_CT_CLIENTGOODS_SELECT,
                customerDB, customerDB,clientId,limitCondition
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },

        clientAddGoods: function(customerDB,data,callback){
          logger.enter();
            var sql = sprintf(SQL_CT_CLIENTGOODS_INSERT,
                customerDB,
                data.clientId,
                data.goodsId,
                data.price
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.insertId);
                }
            });

        },

        updateCheckComments:function(dbName,comments,clientId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENT_UPDATE_CHECKCOMMENTS, dbName, comments, clientId );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result.affectedRows);
                }
            });

        },
        /**
         * 获取Client基本信息
         * @param dbName
         * @param clientId
         * @param callback
         */
        getClientBasicInfo:function(dbName,clientId,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_GLIENT_RETRIEVE_BASICINFO,dbName,clientId);
            logger.sql(sql);
            __mysql.query( sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(null, result);
            });

        }
        ,
        /**
         * NOW JUST retrieve the clients whose registerStatus is 'APPROVED'
         * listClients
         *      List the client by paginator
         * @param connect
         * @param customerDBName
         * @param paginator
         * @param callback
         */
        listClients: function(connect, customerDBName, paginator, clientName,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENT_LIST,
                customerDBName,
                customerDBName,
                paginator.where("Client.clientCategoryId=ClientCategory.id and registerStatus in('APPROVED','UPDATED')  " +
                    " and (clientName like '%"+clientName+"%' OR clientCode LIKE '%"+clientName+"%'" +
                    " OR clientArea LIKE '%"+clientName+"%') "),
                paginator.orderby(),
                paginator.limit());
            logger.sql(sql);
            connect.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(null, results);
            });

        },

        newRegisteredClientRetrieveAll: function(dbName,clientName,paginator, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_NEW_REGISTER_CLIENT_RETRIEVE_ALL, dbName ,clientName,paginator.limit());

            logger.sql(sql);

            __mysql.query(sql, function (error, clients) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, clients);
                }
            });
        },
        updatedClientRetrieveAll: function(dbName,clientName,paginator,callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_UPDATED_CLIENT_RETRIEVE_ALL, dbName ,clientName,paginator.limit());

            logger.sql(sql);

            __mysql.query(sql, function (error, clients) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {

                    callback(null, clients);
                }
            });
        },
        rejectedRegisterClientRetrieveAll: function(dbName,clientName,paginator, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_NEW_REJECTED_REGISTER_CLIENT_RETRIEVE_ALL, dbName ,clientName,paginator.limit());
            logger.sql(sql);
            __mysql.query(sql, function (error, clients) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, clients);
                }
            });
        },

        getRegisterClientRetrieveAll: function(dbName, paginator, callback) {
            logger.enter();

            var SQL_CT_NEW_REGISTER_CLIENT_RETRIEVE_ALL = "" +
                " SELECT id, guid, clientCategoryId, clientCode, clientArea, clientName, pricePlan, " +
                " email, mobile, fax, defaultAddressId, defaultAddress, paymentReminderMsg, paymentType, " +
                " stampLink, registerStatus, checkComments, hospitalLevel, hospitalGrades, readOnly, " +
                " enabled, erpIsAvailable, erpMsgUrl, erpAppCodeUrl, appKey, updatedOn, createdOn " +
                " FROM %s.Client " +
                " WHERE registerStatus = '%s' " +
                " AND clientName LIKE '%%%s%%' " +
                " %s " +        // whereStr
                " %s; ";        // limit

            var whereStr = "";
            var filter= paginator.condition;

            if(filter.clientArea != "") {
                whereStr += sprintf(" AND clientArea = '%s' ", filter.clientArea);
            }
            if(filter.enabled != "") {
                whereStr += sprintf(" AND enabled = '%s' ", filter.enabled);
            }
            if(filter.readOnly != "") {
                whereStr += sprintf(" AND readOnly = '%s' ", filter.readOnly);
            }

            var sql = sprintf(SQL_CT_NEW_REGISTER_CLIENT_RETRIEVE_ALL, dbName,
                filter.registerStatus, filter.clientName, whereStr, paginator.limit());

            logger.sql(sql);

            __mysql.query(sql, function (error, clients) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, clients);
                }
            });
        },

        /**
         * 筛选审核客户列表信息
         * @param dbName
         * @param paginator
         * @param callback
         */
        getRegisterClientRetrieveAllByKnex: function(dbName, filter, callback) {
            logger.enter();

            var column = ['id', 'guid', 'clientCategoryId', 'clientCode', 'clientArea', 'clientName', 'pricePlan',
                'email', 'mobile', 'fax', 'defaultAddressId', 'defaultAddress', 'paymentReminderMsg', 'paymentType',
                'stampLink', 'registerStatus', 'checkComments', 'hospitalLevel', 'hospitalGrades', 'readOnly',
                'enabled', 'erpIsAvailable', 'erpMsgUrl', 'erpAppCodeUrl', 'appKey', 'updatedOn', 'createdOn'];

            var sql = knex.withSchema(dbName).column(column).select().from("Client")
                .where('registerStatus', filter.registerStatus)
                .andWhere('clientName', 'like', '%%'+ filter.keywords +'%%');

            if(filter.clientArea != "") {
                sql.andWhere('clientArea', filter.clientArea);
            }
            if(filter.enabled != "") {
                sql.andWhere('enabled', filter.enabled);
            }
            if(filter.readOnly != "") {
                filter.readOnly = (filter.readOnly == 'true')? 1 : 0;
                sql.andWhere('readOnly', filter.readOnly);
            }
            sql.limit(filter.pageSize).offset((filter.pageIndex-1)*filter.pageSize);

            logger.sql(sql.toString());

            __mysql.query(sql.toString(), function (error, clients) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, clients);
                }
            });
        },


        newRegisteredClientRetrieveById: function(dbName, clientId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_NEW_REGISTER_CLIENT_RETRIEVE_BY_ID, dbName, dbName, dbName, clientId);

            logger.sql(sql);

            __mysql.query(sql, function (error, client) {
                if(error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, client);
                }
            });
        },

        setNewRegisterClientEnable: function (connect, dbName, stampLink,clientInfo, clientId, callback) {
            logger.enter();
            clientInfo.stampLink=stampLink;
            var gspData = parseUpdateInfo(clientInfo);
            logger.error(gspData);
            var sql = sprintf(SQL_CT_NEW_REGISTER_CLIENT_SET_ENABLE, dbName, gspData,Number(clientId));

            logger.sql(sql);

            connect.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },

        setNewRegisterClientDisable: function (dbName, clientId,clientStatus,callback) {
            logger.enter();

             var sql="";
            if(clientStatus=="CREATED") {
                 sql = sprintf(SQL_CT_NEW_REGISTER_CLIENT_SET_DISABLE, dbName,'REJECTED', clientId);
            }
            else if(clientStatus=="UPDATED") {
                sql = sprintf(SQL_CT_NEW_REGISTER_CLIENT_SET_DISABLE, dbName, 'APPROVED',clientId);
            }
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });
        },
        /**
         * 客户状态由 rejected ->created 重新审核
         * @param dbName
         * @param clientId
         * @param callback
         */
        setClientStatusFromREJECTEDtoCREATED:function(dbName, clientId,status, callback){
            logger.enter();
            var sql = "";
            if(status=="APPROVED"){
                sql = sprintf(SQL_CT_NEW_REGISTER_STATUS_FROM_APPROVED_TO_UPDATED, dbName, clientId);
            }else{
                sql = sprintf(SQL_CT_NEW_REGISTER_STATUS_FROM_REJECTED_TO_CREATED, dbName, clientId);
            }
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    callback(error);
                } else {
                    callback(null, result);
                }
            });

        }
        ,
        /***
         * 根据不同的registerStatus,获取各个状态下的用户数量
         * @param dbName
         * @param callback
         */
        getClientSumsByRegisterStatus:function(dbName,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_CLIENT_GET_REGISTER_STATUS_COUNTS,dbName);

            logger.sql(sql);
            __mysql.query(sql,function(error,result){
                if(error){
                    logger.error(error);
                    callback(error);
                }
                else{
                    callback(null,result);
                }
            });
        }
        ,
        /**
         * getClientByOperatorId
         *      Get the client data by the specific operatorId
         * @param customerDBName
         * @param clientId
         * @param callback
         */
        getClientById: function(customerDBName, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENT_SELECT_BY_ID,
                customerDBName,customerDBName,
                clientId
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    if (underscore.isEmpty(results))
                        callback(err,undefined);
                    else
                        callback(err,results[0]);
                }
            });
        },
        getCLientPrice: function(customerDBName, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENT_PRICE_SELECT_BY_ID,
                customerDBName,
                clientId
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    if (underscore.isEmpty(results))
                        callback(err,undefined);
                    else
                        callback(err,results);
                }
            });
        },

        addClientFreqBuy: function(connect, customerDBName, orderId, callback) {
            logger.enter();
            logger.ndump('customerDBName',customerDBName);
            logger.ndump('orderId', orderId);
            var sql = sprintf(SQL_CT_CLIENT_FREQBUY_UPDATE,
                customerDBName, customerDBName, customerDBName, orderId
            );
            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(null, result.affectedRows);
                }
            });
        },

        /**
         * 根据ClientId清除上一次销售范围设置
         * @param connect
         * @param customerDBName
         * @param clientId
         * @param callback
         * @returns {*}
         */
        clearClientSaleScope: function(connect, customerDBName, clientId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_DELETE_CLIENTSALESCOPE,
                customerDBName,
                clientId
            );
            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(null, result);
                }
            });
        },

        /**
         * 添加更新客户销售范围
         * @param connect
         * @param customerDBName
         * @param goodsGspTypeList
         * @param callback
         */
        addClientSaleScope: function(connect, customerDBName, clientId, goodsGspTypeList, callback){
            logger.enter();
            var data = '';
            if(!underscore.isUndefined(goodsGspTypeList)){
                underscore.each(goodsGspTypeList, function(goodsGspType){
                    data += "("+ clientId +", "+ goodsGspType +"),";
                });
            }else{
                logger.error('暂无任何销售范围设置.');
                return callback();
            }

            var sql = sprintf(SQL_CT_INSERT_CLIENTSALESCOPE,
                customerDBName,
                data.substring(0, data.length-1)
            );
            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(null, result);
                }
            });
        },

        /**
         * 获取当前用户的经营范围
         * @param customerDBName
         * @param clientId
         * @param callback
         */
        selectClientSaleScope: function(customerDBName, clientId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_CLIENTSALESCOPE, customerDBName, customerDBName, clientId );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else {
                    callback(null, result);
                }
            });
        },

        getClientFreqBuyById: function (customerDBName, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_SELECT_CLIENT_FREQ_BUY,
                customerDBName, customerDBName, customerDBName,
                customerDBName, customerDBName,
                clientId
            );
            logger.sql(sql);
            __mysql.query( sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },


        /**
         *
         * get client GSP info
         *      find GSP from database
         * @param customerDBName
         * @param clientId
         * @param callback
         */
        getGSP: function (customerDBName, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_GSPINFO_SELECT_BY_ID, customerDBName,customerDBName, clientId);
            logger.sql(sql);

            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results[0]);
                }
            });
        },

        /**
         * 待审订单客户资质信息
         * @param customerDBName
         * @param keyword
         * @param callback
         */
        getClientQualInfo: function(customerDBName, clientId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_QUALINFO_SELECT_BY_ID,
                customerDBName, customerDBName, customerDBName, customerDBName, customerDBName, clientId);
            logger.sql(sql);

            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    if(results.length > 0){
                        var data =[];
                        underscore.map(results[0], function(value, key){
                            if(!underscore.isNull(value)){
                                data.push({
                                    itemKey: key,
                                    itemVal: value
                                });
                            }
                        });
                    }
                    callback(err, data);
                }
            });
        },

        /**
         * 从ClientGspIdLinks表格获取gsp控制类型
         * get client GSPTYPES info
         *      find GSP from database
         * @param customerDBName
         * @param clientId
         * @param callback
         */
        getGSPTypesById: function (customerDBName, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_GSPTYPES_SELECT_BY_ID, customerDBName,customerDBName, clientId);
            logger.sql(sql);

            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results);
                }
            });
        },
        //从gsptypesUpdate获取数据
        getGSPTypesFromUpdateById:function(customerDBName,clientId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GSPTYPESUPDATE_SELECT_BY_ID, customerDBName,customerDBName, clientId);
            logger.sql(sql);

            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results);
                }
            });

        }
        ,

        getGSPfromClientUpdate:function(customerDBName,clientId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GSPINFO_FROM_CLIENTUPDATE_SELECT_BY_ID,customerDBName, clientId);
            logger.sql(sql);

            /* start to query */
            __mysql.query(sql, function(err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results[0]);
                }
            });

        }
        ,

        /**
         * updateGSP
         *      update client's GSP information
         * @param customerDBName
         * @param clientId
         * @param gspInfo  json format data like
         *        {
         *          companyManager:"zhang3",
         *          orgCode:"ORGcode123456"
         *        }
         * @param callback
         */

        updateGSP: function (connect, customerDBName, gspInfo, clientId, callback) {
            logger.enter();
            var gspData = parseUpdateInfo(gspInfo);
            if(!gspData) {
                callback(null);
            }else {
                var sql = sprintf(SQL_CT_GSPINFO_UPDATE, customerDBName, gspData, clientId );
                logger.sql(sql);
                connect.query(sql, function(err, result){
                    if (err) {
                        logger.sqlerr(err);
                        callback(err);
                    }else{
                        callback(err,result.affectedRows);
                    }
                });
            }
        },
        metaClearGSPTypes:function (connect, customerDBName, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_GSPINFO_CLEAR_BY_ID, customerDBName, clientId );
            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result.affectedRows);
                }
            });

        },

        updateGSPtoTableCLientUpdate:function(customerDBName,gspInfo,callback){
            logger.enter();
            var gspData=parseInsertInfo(gspInfo);

            var keys = gspData.keys;
            var values = gspData.values;
            var sql = sprintf(SQL_CT_GSPINFO_UPDATE_TO_TABLE_CLIENTUPDATE, customerDBName, keys, values );
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result.insertId);
                }
            });



        },

        /**
         * Add a new client into ClientInfo
         * @param connect
         * @param customerDB
         * @param clientInfo
         * @param callback
         */
        metaNewClientInfo: function(connect,customerDB,clientInfo,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_CLIENT,
                customerDB,
                customerDB,
                clientInfo.categoryName,
                clientInfo.clientCode,
                clientInfo.clientName,
                clientInfo.clientArea,
                clientInfo.clientMobile,
                clientInfo.pricePlan);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    logger.ndump("result", result);
                    callback(err, result.insertId);
                }
            })
        },

        metaClientRegisterCreateOne: function (conn, dbName, clientData, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENT_REGISTER,
                dbName,
                clientData.clientCode,
                clientData.clientName,
                clientData.clientMobile,
                clientData.clientAddr,
                clientData.stampLink);
            logger.sql(sql);
            conn.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    logger.ndump("result", result);
                    callback(err, result.insertId);
                }
            })
        },
        ClientUpdateBasicInfo:function(conn,dbName,clientId,newMobile,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_CLIENT_UPDATE_BASIC_INFO,dbName,newMobile,clientId);
            logger.sql(sql);
            conn.query(sql,function(err,result){
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    logger.ndump("result", result);
                    callback(err, result.affectedRows);
                }

            });
        },
        ClientUpdateStampLinkInfo:function(dbName,clientId,stampLink,callback){
            logger.enter();
            var sql=sprintf(SQL_CT_CLIENT_UPDATE_STAMPLINK_INFO,dbName,stampLink,clientId);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    logger.ndump("result", result);
                    callback(err, result.affectedRows);
                }

            });
        },
        clientUpdateGspInfo:function(conn,dbName,clientGSP,clientId,callback){
            logger.enter();

            var sql = sprintf(SQL_CT_ADD_CLIENTGSP,
                dbName,
                clientGSP.legalRepresentative,
                clientGSP.registeredCapital,
                clientGSP.businessAddress,
                clientGSP.limitedBusinessRange,
                clientGSP.limitedBusinessType,
                clientGSP.businessLicense,
                clientGSP.businessLicenseValidateDate,
                clientGSP.orgCode,
                clientGSP.orgCodeValidateDate,
                clientGSP.taxRegistrationLicenseNum,
                clientGSP.taxRegistrationLicenseNumValidateDate,

                clientGSP.gmpOrGspLicenseNum,
                clientGSP.gmpOrGspLicenseNumValidateDate,
                clientGSP.medicalInstitutionLicenseNum,
                clientGSP.medicalInstitutionLicenseNumValidateDate,
                clientGSP.institutionLegalPersonCert,
                clientGSP.institutionLegalPersonCertValidateDate,

                clientGSP.productionAndBusinessLicenseNum,
                clientGSP.productionAndBusinessLicenseNumValidateDate,
                clientGSP.foodCirculationLicenseNum,
                clientGSP.foodCirculationLicenseNumValidateDate,
                clientGSP.medicalApparatusLicenseNum,
                clientGSP.medicalApparatusLicenseNumValidateDate,

                clientGSP.healthProductsLicenseNum,
                clientGSP.healthProductsLicenseNumValidateDate,
                clientGSP.mentaanesthesiaLicenseNum,
                clientGSP.mentalanesthesiaLicenseNumValidateDate,
                clientGSP.hazardousChemicalsLicenseNum,
                clientGSP.hazardousChemicalsLicenseNumValidateDate,

                clientGSP.maternalLicenseNum,
                clientGSP.maternalLicenseNumValidateDate,
                clientGSP.images,
                clientId
            );
            logger.sql(sql);
            conn.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(error, result);
                }
            });


        }
        ,
        operatorIsExist: function (dbName, operatorName, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_SELECT_EXIST_BY_OPERATORNAME, dbName, operatorName);

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
         * Select  client LicenseExpire
         * @param cloudDB
         * @param callback
         */

        //遍历出CloudDB下的所有Customer
        getCustomerDBList: function (callback) {
            logger.enter();
            var cloudDB = __cloudDBName;
            var SQL = "SELECT id,customerName,customerDBSuffix FROM %s.Customer WHERE enabled = 1;";
            var sql = sprintf(SQL, cloudDB);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    callback(this.error, results);
                }
            });
        },

        //遍历出Customer下，所有的clientGsp数据
        getClientGspList: function (customerList, callback) {
            logger.enter();
            async.mapSeries(customerList,
                function (customer, mapcallback) {
                    var customerId = customer.id;
                    var customerName = customer.customerName;
                    var customerDB = __customerDBPrefix + "_" + customer.customerDBSuffix;
                    getAllClientGsp(customerDB, function (err, results) {
                        if (err) {
                            var msg = "customerId=" + customerId + "," + customerName + " get clientGsp failed";
                            mapcallback(null, err + msg);
                        } else {
                            var clientGsp = {};
                            clientGsp.customerId = customerId;
                            clientGsp.customerName = customerName;
                            clientGsp.details = results;
                            mapcallback(null, clientGsp);
                        }
                    })
                },
                function (errs, resultlist) {
                    if (errs) {
                        callback(errs);
                    } else {
                        callback(this.error, resultlist);
                    }
                });
        },


        compareExpireLicense: function (clientGspList, callback) {
            logger.enter();
            var expireList = [];

            for (var key in clientGspList) {
                var obj = {};
                if (key.indexOf("Date") > -1 && clientGspList[key] != null) {
                    logger.debug(key);
                    logger.debug(clientGspList[key]);
                    var licenseDate = new Date(clientGspList[key]);
                    var now = new Date();
                    var expireDays = (licenseDate.getTime() - now.getTime()) / 1000 / 3600 / 24;
                    licenseDate = convert(licenseDate);
                    var  leftDays = Math.ceil(expireDays);
                    obj.leftDays=leftDays;
                    logger.debug(expireDays);
                    obj.licenseName = key;
                    obj.licenseDate = licenseDate ;
                    expireList.push(obj);
                }
            }
            callback(null, expireList);
        },

        /**
         * Delete a row from Client by client id
         *      Used for unittest only
         * @param connect
         * @param customerDB
         * @param clientId
         * @param callback
         */
        metaDeleteClientInfo: function(connect, customerDB, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_DELETE_CLIENT, customerDB, clientId);
            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(err, result.affectedRows);
            });
        },

        /**
         * Add price records for the new client
         * @param connect
         * @param customerDBName
         * @param clientId
         * @param pricePlan
         * @param callback
         * "INSERT INTO %s.ClientGoodsPrice VALUES " +
         "SELECT %d, goodsId, '%s', %s FROM %s.GoodsInfo;"
         */
        metaNewClientGoodsPrice: function(connect, customerDBName, clientId, pricePlan, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_ADD_PRICE_FOR_CLIENT,
                customerDBName, clientId, pricePlan, pricePlan, customerDBName, customerDBName);
            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(err, result.affectedRows);
            });
        },

        /**
         * Create ClientGoodsPrice rows by new goods price
         * @param connect
         * @param customerDBName
         * @param goodsPriceInfo
         * @param callback
         */
        metaNewClientGoodsPriceByPrice: function(connect, customerDBName, goodsPriceInfo, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_ADD_PRICE_FOR_CLIENT_BY_GOODSPRICE,
                customerDBName,
                goodsPriceInfo.goodsId,
                goodsPriceInfo.wholesalePrice,
                goodsPriceInfo.price1,
                goodsPriceInfo.price2,
                goodsPriceInfo.price3
            );
            logger.sql(sql);
            connect.query(sql, function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }  else
                    callback(null, result.affectedRows);

            });
        },

        /**
         * Import Client from XLS file
         *      UPDATE IF EXISTS ELSE INSERT
         * @param connect
         * @param customerDBName
         * @param clientInfo
         * @param callback
         */
        metaImportClientInfo:function(connect,customerDBName,clientInfo,callback){
            logger.enter();

            var sql = sprintf(SQL_CT_IMPORT_CLIENTINFO,customerDBName);
            logger.sql(sql);
            connect.query(sql, [[clientInfo]], function(err, results) {
                if (err) {
                    callback(err);
                }else{
                    callback(err, results.insertId);
                }
            });
        },

        /**
         * Import client GSP info from XLS
         *      UPDATE IF EXISTS ELSE INSERT
         * @param connect
         * @param customerDBName
         * @param clientGspInfo
         * @param callback
         */
        metaImportClientGspInfo:function(connect,customerDBName,clientGspInfo,callback){
            logger.enter();

            var sql = sprintf(SQL_CT_IMPORT_CLIENTGSP,customerDBName);
            logger.sql(sql);
            connect.query(sql, [[clientGspInfo]], function(err, results) {
                if (err)
                    logger.sqlerr(err);
                callback(err, results.insertId);
            });
        },

        metaClientGspCreateOne: function (connection, dbName, clientId, clientGSP,callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_ADD_CLIENTGSP,
                dbName,
                clientGSP.legalRepresentative,
                clientGSP.registeredCapital,
                clientGSP.businessAddress,

                clientGSP.limitedBusinessRange,
                clientGSP.limitedBusinessType,
                clientGSP.businessLicense,
                clientGSP.businessLicenseValidateDate,
                clientGSP.orgCode,
                clientGSP.orgCodeValidateDate,
                clientGSP.taxRegistrationLicenseNum,
                clientGSP.taxRegistrationLicenseNumValidateDate,

                clientGSP.gmpOrGspLicenseNum,
                clientGSP.gmpOrGspLicenseNumValidateDate,
                clientGSP.medicalInstitutionLicenseNum,
                clientGSP.medicalInstitutionLicenseNumValidateDate,
                clientGSP.institutionLegalPersonCert,
                clientGSP.institutionLegalPersonCertValidateDate,

                clientGSP.productionAndBusinessLicenseNum,
                clientGSP.productionAndBusinessLicenseNumValidateDate,
                clientGSP.foodCirculationLicenseNum,
                clientGSP.foodCirculationLicenseNumValidateDate,
                clientGSP.medicalApparatusLicenseNum,
                clientGSP.medicalApparatusLicenseNumValidateDate,

                clientGSP.healthProductsLicenseNum,
                clientGSP.healthProductsLicenseNumValidateDate,
                clientGSP.mentaanesthesiaLicenseNum,
                clientGSP.mentalanesthesiaLicenseNumValidateDate,
                clientGSP.hazardousChemicalsLicenseNum,
                clientGSP.hazardousChemicalsLicenseNumValidateDate,

                clientGSP.maternalLicenseNum,
                clientGSP.maternalLicenseNumValidateDate,
                clientGSP.images,
                clientId
            );
            logger.sql(sql);
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(error, result);
                }
            });
        },

        /**
         * 更新ClientGsp的证书合同执照
         * @param connection
         * @param dbName
         * @param clientId
         * @param clientGSP
         * @param callback
         */
        updateClientGspImage: function (connection, dbName, clientId, clientGSP, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_UPDATE_CLIENTGSP_IMG,
                dbName,
                clientGSP.legalRepresentative,
                clientGSP.gspImages,
                clientId
            );
            logger.sql(sql);
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(error, result);
                }
            });
        },

        /**
         * 创建客户默认管理员账号
         * @param connection
         * @param dbName
         * @param operator
         * @param clientId
         * @param mobileNum
         * @param callback
         */
        metaNewAdminOperator: function(connection, dbName, operator, clientId,isAdmin, mobileNum, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_OPERATOR,
                dbName,
                operator.login_id,
                operator.login_pwd,
                operator.login_id,
                clientId,
                1,
                mobileNum

            );
            logger.sql(sql);
            connection.query(sql, function(error, result){
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, result.insertId);
                }
            })
        },
        /**
         * 创建客户GSP控制类型
         * @param connect
         * @param customerDB
         * @param clientId
         * @param gspTypeId
         * @param callback
         */
        metaNewClientGspLinks: function(connect,customerDB,clientId,gspTypeId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_ClIENTGSPIDLINKS,customerDB,clientId,gspTypeId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(err,result.insertId);
                })
        },


        metaNewOperatorInfo: function(connect,customerDB,clientInfo,clientId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_OPERATOR,customerDB,
                clientInfo.login_id,
                clientInfo.login_pwd,
                clientInfo.login_id,
                clientId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(result.insertId);
            })
        },

        /**
         * This is the meta operation to update ClientInfo by clientId
         * @param connect
         * @param customerDB
         * @param clientInfo
         * @param clientId
         * @param callback
         */
        metaUpdateClientInfo: function(connect,customerDB,clientInfo,clientId,callback){
            logger.enter();
            var clientData = parseUpdateInfo(clientInfo);
            var sql = sprintf(SQL_CT_UPDATE_CLIENT,customerDB, clientData, clientId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result.affectedRows);
                }
            });
        },


        updateClientStatus: function(customerDB,clientId,statusName,status,callback){
            logger.enter();
            var updateStatus = statusName + "='" + status + "'";
            var sql = sprintf(SQL_CT_UPDATESTATUS_CLIENT,customerDB,
                updateStatus,
                clientId
            );
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result.affectedRows);
                }
            })
        },

        mutiUpdateClientStatus: function(customerDB,clientIds,statusName,status,callback){
            logger.enter();
            if(statusName == 'readOnly') {
                status = (status ==="ON") ? 1 : 0;
            }
            else if(statusName == 'enabled') {
                status = (status ==="ON") ? '\'ENABLED\'' : '\'DISABLED\'';
            }
            var updateStatus = statusName + "=" + status;

            var sql = sprintf(SQL_CT_UPDATESTATUS_MUTICLIENT,customerDB,
                updateStatus
            );
            logger.sql(sql);
            __mysql.query(sql, [[clientIds]], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    throw err;
                }
                callback(result.affectedRows);
            })
        },

        updateClientFinance: function(customerDB, financeInfo, clientId,callback){
            logger.enter();
            var params = parseUpdateInfo(financeInfo);
            var sql = sprintf(SQL_CT_UPDATE_CLIENTFINANCE, customerDB, params, clientId);
            logger.sql(sql);
            __mysql.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result.affectedRows);
                }
            })
        },

        updateClientFinanceByConnect: function(connect, customerDB, credits, clientId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_UPDATE_CLIENTFINANCE_CREDITS, customerDB, credits, credits, clientId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result.affectedRows);
                }
            })
        },
        /**
         * 商户更新客户资料,若授信额度变化,更新此历史表
         * @param connect
         * @param operatorId
         * @param oldCredits
         * @param credits
         * @param clientId
         * @param callback
         */
        insertClientCreditHistory:function(connect,customerDB,insertObj,callback){
            //operatorId,oldCredits,credits,clientId
            logger.enter();
            var sql="INSERT INTO " +
                "%s.ClientCreditHistory( %s ) " +
                "VALUES( %s )";
            var insertItem=parseInsertInfoNew(insertObj);
            sql=sprintf(sql,customerDB,insertItem.keys,insertItem.values);
            connect.query(sql,function(err,results){
                if(err){
                    logger.error(err);
                    callback(err);
                }else{
                    callback(err,results);
                }
            });
        },
        /**
         * 更新授信用户欠款余额
         * @param connect
         * @param customerDB
         * @param clientId
         * @param callback
         */
        updateClientFinanceBalance: function(connect, customerDB, clientId, orderPrice, isMinus, callback){
            logger.enter();
            var priceStr = isMinus ? "-"+orderPrice : "+"+orderPrice;
            var sql = sprintf( SQL_CT_UPDATE_CLIENTFINANCE_BALANCE, customerDB, priceStr, clientId );
            logger.sql(sql);
            connect.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result.affectedRows);
                }
            });
        },

        getClientFinance: function(customerDB, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_GET_CLIENTFINANCE, customerDB, clientId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results) {
                if(err) {
                    logger.sqlerr(err);
                    callback(err);
                }else {
                    callback(null, results[0]);
                }
            });
        },

        /**
         * This is a meta update OperatorInfo by clientId
         * @param connect
         * @param customerDB
         * @param clientInfo
         * @param clientId
         * @param callback
         */
        metaUpdateOperatorInfo: function(connect,customerDB,clientInfo,clientId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_UPDATE_OPERATOR,
                customerDB,
                //clientInfo.login_id,
                clientInfo.login_pwd,
                clientId);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else
                    callback(err, result.affectedRows);
            });
        },

        addClientGsp:function(customerDBName,gspData,clientId,callback){
            logger.enter();
            var gspDataKeys = getKeysFrom(gspData);
            var gspDataValues = getValuesFrom(gspData);
            gspDataKeys += ",clientId";
            gspDataValues += ","+clientId;
            var sql = sprintf(SQL_CT_GSPINFO_INSERT, customerDBName, gspDataKeys,gspDataValues);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,result.insertId);
                }
            });
        },

        /**
         * 按照关键词过滤客户名称筛选客户
         *
         * @param customerDBName
         * @param keyword
         * @param callback
         */
        filterClientNameByKeyword: function(customerDBName, keyword, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENT_BYNAME_SELECT, customerDBName, keyword);
            logger.sql(sql);
            __mysql.query(sql, function(err, results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        },

        clientInfoRetrieveByClientId: function (customerDbName, clientId, callback) {
            logger.enter();

            var sql = "" +
                "select " +
                "   a.id as clientId, " +
                "   a.clientCategoryId as clientCategoryId, " +
                "   d.erpCode as clientCategoryErpCode, " +
                "   a.clientCode as clientCode, " +
                "   a.clientArea as clientArea, " +

                "   a.clientName as clientName, " +
                "   a.pricePlan as pricePlan, " +
                "   a.email as email, " +
                "   a.mobile as mobile, " +
                "   a.fax as fax, " +

                "   a.defaultAddressId as defaultAddressId, " +
                "   c.receiver as defaultAddressReceiver, " +
                "   c.telNum as defaultAddressTelNum, " +
                "   c.mobileNum as defaultAddressMobileNum, " +
                "   c.postCode as defaultAddressPostCode, " +

                "   c.provinceFirstStage as defaultAddressProvinceFirstStage, " +
                "   c.citySecondStage as defaultAddressCitySecondStage, " +
                "   c.countiesThirdStage as defaultAddressCountiesThirdStage, " +
                "   c.detailAddress as defaultAddressDetailAddress, " +
                "   c.remark as defaultAddressRemark, " +

                "   a.paymentReminderMsg as paymentReminderMsg, " +
                "   a.stampLink as stampLink, " +
                "   a.registerStatus as registerStatus, " +
                "   a.checkComments as checkComments, " +
                "   a.readOnly as readOnly, " +

                "   a.enabled as enabled, " +
                "   b.legalRepresentative as legalRepresentative, " +
                "   b.businessLicense as businessLicense, " +
                "   b.companyManager as companyManager, " +
                "   b.businessLicenseValidateDate as businessLicenseValidateDate, " +

                "   b.registeredCapital as registeredCapital, " +
                "   b.businessAddress as businessAddress, " +
                "   b.limitedBusinessRange as limitedBusinessRange, " +
                "   b.limitedBusinessType as limitedBusinessType, " +
                "   b.orgCode as orgCode, " +

                "   b.orgCodeValidateDate as orgCodeValidateDate, " +
                "   b.taxRegistrationLicenseNum as taxRegistrationLicenseNum, " +
                "   b.taxRegistrationLicenseNumValidateDate as taxRegistrationLicenseNumValidateDate, " +
                "   b.foodCirculationLicenseNum as foodCirculationLicenseNum, " +
                "   b.foodCirculationLicenseNumValidateDate as foodCirculationLicenseNumValidateDate, " +

                "   b.qualityAssuranceLicenseNum as qualityAssuranceLicenseNum, " +
                "   b.qualityAssuranceLicenseNumValidateDate as qualityAssuranceLicenseNumValidateDate, " +
                "   b.medicalApparatusLicenseNum as medicalApparatusLicenseNum, " +
                "   b.medicalApparatusLicenseNumValidateDate as medicalApparatusLicenseNumValidateDate, " +
                "   b.medicalApparatusType as medicalApparatusType, " +

                "   b.healthProductsLicenseNum as healthProductsLicenseNum, " +
                "   b.healthProductsLicenseNumValidateDate as healthProductsLicenseNumValidateDate, " +
                "   b.productionAndBusinessLicenseNum as productionAndBusinessLicenseNum, " +
                "   b.productionAndBusinessLicenseNumIssuedDate as productionAndBusinessLicenseNumIssuedDate, " +
                "   b.productionAndBusinessLicenseNumValidateDate as productionAndBusinessLicenseNumValidateDate, " +

                "   b.productionAndBusinessLicenseNumIssuedDepartment as productionAndBusinessLicenseNumIssuedDepartment, " +
                "   b.storageAddress as storageAddress, " +
                "   b.mentaanesthesiaLicenseNum as mentaanesthesiaLicenseNum, " +
                "   b.mentalanesthesiaLicenseNumValidateDate as mentalanesthesiaLicenseNumValidateDate, " +
                "   b.gmpOrGspLicenseNum as gmpOrGspLicenseNum, " +

                "   b.gmpOrGspLicenseNumValidateDate as gmpOrGspLicenseNumValidateDate, " +
                "   b.hazardousChemicalsLicenseNum as hazardousChemicalsLicenseNum, " +
                "   b.hazardousChemicalsLicenseNumValidateDate as hazardousChemicalsLicenseNumValidateDate, " +
                "   b.medicalInstitutionLicenseNum as medicalInstitutionLicenseNum, " +
                "   b.medicalInstitutionLicenseNumValidateDate as medicalInstitutionLicenseNumValidateDate, " +

                "   b.maternalLicenseNum as maternalLicenseNum, " +
                "   b.maternalLicenseNumValidateDate as maternalLicenseNumValidateDate, " +
                "   b.institutionLegalPersonCert as institutionLegalPersonCert, " +
                "   b.institutionLegalPersonCertValidateDate as institutionLegalPersonCertValidateDate, " +
                "   b.gspImages as gspImages " +
                "from " +
                "   %s.Client a " +
                "left join " +
                "   %s.ClientGsp b " +
                "on a.id = b.ClientId " +
                "left join " +
                "   %s.ClientAddress c " +
                "on a.defaultAddressId = c.id " +
                "left join " +
                "   %s.ClientCategory d " +
                "on a.clientCategoryId = d.id " +
                "where " +
                "   a.id = %d;";
            sql = sprintf(sql, customerDbName, customerDbName, customerDbName, customerDbName, clientId);
            logger.sql(sql);

            __mysql.query(sql, function (error, clientInfo) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, clientInfo);
            });

        },
        retrieveClientInfoByBusinessLicense: function (customerDbName, businessLicense, callback) {
            logger.enter();

            var sql = "" +
                "select " +
                "   a.id as clientId, " +
                "   a.clientCategoryId as clientCategoryId, " +
                "   d.erpCode as clientCategoryErpCode, " +
                "   a.clientCode as clientCode, " +
                "   a.clientArea as clientArea, " +

                "   a.clientName as clientName, " +
                "   a.pricePlan as pricePlan, " +
                "   a.email as email, " +
                "   a.mobile as mobile, " +
                "   a.fax as fax, " +

                "   a.defaultAddressId as defaultAddressId, " +
                "   c.receiver as defaultAddressReceiver, " +
                "   c.telNum as defaultAddressTelNum, " +
                "   c.mobileNum as defaultAddressMobileNum, " +
                "   c.postCode as defaultAddressPostCode, " +

                "   c.provinceFirstStage as defaultAddressProvinceFirstStage, " +
                "   c.citySecondStage as defaultAddressCitySecondStage, " +
                "   c.countiesThirdStage as defaultAddressCountiesThirdStage, " +
                "   c.detailAddress as defaultAddressDetailAddress, " +
                "   c.remark as defaultAddressRemark, " +

                "   a.paymentReminderMsg as paymentReminderMsg, " +
                "   a.stampLink as stampLink, " +
                "   a.registerStatus as registerStatus, " +
                "   a.checkComments as checkComments, " +
                "   a.readOnly as readOnly, " +

                "   a.enabled as enabled, " +
                "   b.legalRepresentative as legalRepresentative, " +
                "   b.businessLicense as businessLicense, " +
                "   b.companyManager as companyManager, " +
                "   b.businessLicenseValidateDate as businessLicenseValidateDate, " +

                "   b.registeredCapital as registeredCapital, " +
                "   b.businessAddress as businessAddress, " +
                "   b.limitedBusinessRange as limitedBusinessRange, " +
                "   b.limitedBusinessType as limitedBusinessType, " +
                "   b.orgCode as orgCode, " +

                "   b.orgCodeValidateDate as orgCodeValidateDate, " +
                "   b.taxRegistrationLicenseNum as taxRegistrationLicenseNum, " +
                "   b.taxRegistrationLicenseNumValidateDate as taxRegistrationLicenseNumValidateDate, " +
                "   b.foodCirculationLicenseNum as foodCirculationLicenseNum, " +
                "   b.foodCirculationLicenseNumValidateDate as foodCirculationLicenseNumValidateDate, " +

                "   b.qualityAssuranceLicenseNum as qualityAssuranceLicenseNum, " +
                "   b.qualityAssuranceLicenseNumValidateDate as qualityAssuranceLicenseNumValidateDate, " +
                "   b.medicalApparatusLicenseNum as medicalApparatusLicenseNum, " +
                "   b.medicalApparatusLicenseNumValidateDate as medicalApparatusLicenseNumValidateDate, " +
                "   b.medicalApparatusType as medicalApparatusType, " +

                "   b.healthProductsLicenseNum as healthProductsLicenseNum, " +
                "   b.healthProductsLicenseNumValidateDate as healthProductsLicenseNumValidateDate, " +
                "   b.productionAndBusinessLicenseNum as productionAndBusinessLicenseNum, " +
                "   b.productionAndBusinessLicenseNumIssuedDate as productionAndBusinessLicenseNumIssuedDate, " +
                "   b.productionAndBusinessLicenseNumValidateDate as productionAndBusinessLicenseNumValidateDate, " +

                "   b.productionAndBusinessLicenseNumIssuedDepartment as productionAndBusinessLicenseNumIssuedDepartment, " +
                "   b.storageAddress as storageAddress, " +
                "   b.mentaanesthesiaLicenseNum as mentaanesthesiaLicenseNum, " +
                "   b.mentalanesthesiaLicenseNumValidateDate as mentalanesthesiaLicenseNumValidateDate, " +
                "   b.gmpOrGspLicenseNum as gmpOrGspLicenseNum, " +

                "   b.gmpOrGspLicenseNumValidateDate as gmpOrGspLicenseNumValidateDate, " +
                "   b.hazardousChemicalsLicenseNum as hazardousChemicalsLicenseNum, " +
                "   b.hazardousChemicalsLicenseNumValidateDate as hazardousChemicalsLicenseNumValidateDate, " +
                "   b.medicalInstitutionLicenseNum as medicalInstitutionLicenseNum, " +
                "   b.medicalInstitutionLicenseNumValidateDate as medicalInstitutionLicenseNumValidateDate, " +

                "   b.maternalLicenseNum as maternalLicenseNum, " +
                "   b.maternalLicenseNumValidateDate as maternalLicenseNumValidateDate, " +
                "   b.institutionLegalPersonCert as institutionLegalPersonCert, " +
                "   b.institutionLegalPersonCertValidateDate as institutionLegalPersonCertValidateDate, " +
                "   b.gspImages as gspImages " +
                "from " +
                "   %s.Client a " +
                "left join " +
                "   %s.ClientGsp b " +
                "on a.id = b.ClientId " +
                "left join " +
                "   %s.ClientAddress c " +
                "on a.defaultAddressId = c.id " +
                "left join " +
                "   %s.ClientCategory d " +
                "on a.clientCategoryId = d.id " +
                "where " +
                "   b.businessLicense = '%s';";
            sql = sprintf(sql, customerDbName, customerDbName, customerDbName, customerDbName, businessLicense);
            logger.sql(sql);

            __mysql.query(sql, function (error, clientInfo) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, clientInfo);
            });

        },
        transactionInsertClient: function (connection, customerDbName, insertObj, callback) {
            logger.enter();
            //insertObj 格式:
            //insertObj = {
            //    clientCategoryId: clientCategoryId,
            //    clientCode: clientItemInfo.clientCode,
            //    clientArea: clientItemInfo.clientArea,
            //    clientName: clientItemInfo.clientName,
            //    pricePlan: clientItemInfo.pricePlan,
            //    email: clientItemInfo.email,
            //    mobile: clientItemInfo.mobile,
            //    fax: clientItemInfo.fax,
            //    paymentReminderMsg: clientItemInfo.paymentReminderMsg,
            //    stampLink: clientItemInfo.stampLink,
            //    registerStatus: clientItemInfo.registerStatus,  // CREATED, APPROVED, UPDATED, REJECTED
            //    checkComments: clientItemInfo.checkComments,
            //    readOnly: Number(Boolean(clientItemInfo.readOnly)),              // bool
            //    enabled: clientItemInfo.enabled                 // ENUM NEEDAPPROVAL, DISABLED, ENABLED
            //};

            var sql = "" +
                "insert into %s.Client" +
                "   (clientCategoryId, " +
                "   clientCode," +
                "   clientArea," +
                "   clientName," +
                "   pricePlan," +
                "   email," +
                "   mobile," +
                "   fax," +
                "   paymentReminderMsg," +
                "   stampLink," +
                "   registerStatus," +
                "   checkComments," +
                "   readOnly," +
                "   enabled) " +
                "values(" +
                "   %d," +
                "   '%s'," +
                "   '%s'," +
                "   '%s'," +
                "   '%s'," +
                "   '%s'," +
                "   '%s'," +
                "   '%s'," +
                "   '%s'," +
                "   '%s'," +
                "   '%s'," +
                "   '%s'," +
                "   %d," +
                "   '%s'" +
                "   ) ;";
            sql = sprintf(
                sql,
                customerDbName,
                Number(insertObj.clientCategoryId),
                insertObj.clientCode,
                insertObj.clientArea,
                insertObj.clientName,
                insertObj.pricePlan,
                insertObj.email,
                insertObj.mobile,
                insertObj.fax,
                insertObj.paymentReminderMsg,
                insertObj.stampLink,
                insertObj.registerStatus,
                insertObj.checkComments,
                Number(Boolean(insertObj.readOnly)),
                insertObj.enabled
            );

            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },
        transactionUpdateClientFromErp: function (connection, customerDbName, updateObj, callback) {
            logger.enter();
            //insertObj 格式:
            //var updateObj = {
            //    clientId: clientId,
            //    clientCategoryId: clientCategoryId,
            //    clientCode: clientItemInfo.clientCode,
            //    clientArea: clientItemInfo.clientArea,
            //    clientName: clientItemInfo.clientName,
            //    pricePlan: clientItemInfo.pricePlan,
            //    email: clientItemInfo.email,
            //    mobile: clientItemInfo.mobile,
            //    fax: clientItemInfo.fax,
            //    paymentReminderMsg: clientItemInfo.paymentReminderMsg,
            //    stampLink: clientItemInfo.stampLink,
            //    registerStatus: clientItemInfo.registerStatus.toString().toUpperCase(),  // CREATED, APPROVED, UPDATED, REJECTED
            //    checkComments: clientItemInfo.checkComments,
            //    readOnly: Number(Boolean(clientItemInfo.readOnly)),         // bool
            //    enabled: clientItemInfo.enabled.toString().toUpperCase()    // ENUM NEEDAPPROVAL, DISABLED, ENABLED
            //};
            var sql = "" +
                "update %s.Client " +
                "set " +
                "   clientCategoryId = %d, " +
                "   clientCode = '%s', " +
                "   clientArea = '%s', " +
                "   clientName = '%s', " +
                "   pricePlan = '%s', " +
                "   email = '%s', " +
                "   mobile = '%s', " +
                "   fax = '%s', " +
                "   paymentReminderMsg = '%s', " +
                "   stampLink = '%s', " +
                "   registerStatus = '%s', " +
                "   checkComments = '%s', " +
                "   readOnly = %d, " +
                "   enabled = '%s' " +
                "where " +
                "   id = %d;";
            sql = sprintf(
                sql,
                customerDbName,
                updateObj.clientCategoryId,
                updateObj.clientCode,
                updateObj.clientArea,
                updateObj.clientName,
                updateObj.pricePlan,
                updateObj.email,
                updateObj.mobile,
                updateObj.fax,
                updateObj.paymentReminderMsg,
                updateObj.stampLink,
                updateObj.registerStatus,
                updateObj.checkComments,
                updateObj.readOnly,
                updateObj.enabled,
                updateObj.clientId
            );
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },
        transactionInsertClientGsp: function (connection, customerDbName, insertObj, callback) {
            //insertObj DataSchema:
            //insertObj = {
            //    clientId: clientId,
            //    legalRepresentative: clientItemInfo.legalRepresentative,
            //    businessLicense: clientItemInfo.businessLicense,
            //    companyManager: clientItemInfo.companyManager,
            //    businessLicenseValidateDate: moment(new Date(clientItemInfo.businessLicenseValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    registeredCapital: clientItemInfo.registeredCapital,
            //    businessAddress: clientItemInfo.businessAddress,
            //    limitedBusinessRange: clientItemInfo.limitedBusinessRange,
            //    limitedBusinessType: clientItemInfo.limitedBusinessType,
            //    orgCode: clientItemInfo.orgCode,
            //    orgCodeValidateDate: moment(new Date(clientItemInfo.orgCodeValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    taxRegistrationLicenseNum: clientItemInfo.taxRegistrationLicenseNum,
            //    taxRegistrationLicenseNumValidateDate: moment(new Date(clientItemInfo.taxRegistrationLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    foodCirculationLicenseNum: clientItemInfo.foodCirculationLicenseNum,
            //    foodCirculationLicenseNumValidateDate: moment(new Date(clientItemInfo.foodCirculationLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    qualityAssuranceLicenseNum: clientItemInfo.qualityAssuranceLicenseNum,
            //    qualityAssuranceLicenseNumValidateDate: moment(new Date(clientItemInfo.qualityAssuranceLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    medicalApparatusLicenseNum: clientItemInfo.medicalApparatusLicenseNum,
            //    medicalApparatusLicenseNumValidateDate: moment(new Date(clientItemInfo.medicalApparatusLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    medicalApparatusType: clientItemInfo.medicalApparatusType,
            //    healthProductsLicenseNum: clientItemInfo.healthProductsLicenseNum,
            //    healthProductsLicenseNumValidateDate: moment(new Date(clientItemInfo.healthProductsLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    productionAndBusinessLicenseNum: clientItemInfo.productionAndBusinessLicenseNum,
            //    productionAndBusinessLicenseNumIssuedDate: moment(new Date(clientItemInfo.productionAndBusinessLicenseNumIssuedDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    productionAndBusinessLicenseNumValidateDate: moment(new Date(clientItemInfo.productionAndBusinessLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    productionAndBusinessLicenseNumIssuedDepartment: clientItemInfo.productionAndBusinessLicenseNumIssuedDepartment,
            //    storageAddress: clientItemInfo.storageAddress,
            //    mentaanesthesiaLicenseNum: clientItemInfo.mentaanesthesiaLicenseNum,
            //    mentalanesthesiaLicenseNumValidateDate: moment(new Date(clientItemInfo.mentalanesthesiaLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    gmpOrGspLicenseNum: clientItemInfo.gmpOrGspLicenseNum,
            //    gmpOrGspLicenseNumValidateDate: moment(new Date(clientItemInfo.gmpOrGspLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    hazardousChemicalsLicenseNum: clientItemInfo.hazardousChemicalsLicenseNum,
            //    hazardousChemicalsLicenseNumValidateDate: moment(new Date(clientItemInfo.hazardousChemicalsLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    medicalInstitutionLicenseNum: clientItemInfo.medicalInstitutionLicenseNum,
            //    medicalInstitutionLicenseNumValidateDate: moment(new Date(clientItemInfo.medicalInstitutionLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    maternalLicenseNum: clientItemInfo.maternalLicenseNum,
            //    maternalLicenseNumValidateDate: moment(new Date(clientItemInfo.maternalLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    institutionLegalPersonCert: clientItemInfo.institutionLegalPersonCert,
            //    institutionLegalPersonCertValidateDate: moment(new Date(clientItemInfo.institutionLegalPersonCertValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    gspImages: clientItemInfo.gspImages
            //};
            var sql = "" +
                "insert into %s.ClientGsp(" +
                "   clientId,   " +

                "   legalRepresentative,   " +
                "   businessLicense,    " +
                "   companyManager, " +
                "   businessLicenseValidateDate,    " +
                "   registeredCapital, " +
                "   businessAddress,   " +
                "   limitedBusinessRange, " +
                "   limitedBusinessType,   " +
                "   orgCode,   " +
                "   orgCodeValidateDate,   " +

                "   taxRegistrationLicenseNum, " +
                "   taxRegistrationLicenseNumValidateDate," +
                "   foodCirculationLicenseNum, " +
                "   foodCirculationLicenseNumValidateDate, " +
                "   qualityAssuranceLicenseNum, " +
                "   qualityAssuranceLicenseNumValidateDate," +
                "   medicalApparatusLicenseNum," +
                "   medicalApparatusLicenseNumValidateDate," +
                "   medicalApparatusType, " +
                "   healthProductsLicenseNum, " +

                "   healthProductsLicenseNumValidateDate," +
                "   productionAndBusinessLicenseNum," +
                "   productionAndBusinessLicenseNumIssuedDate, " +
                "   productionAndBusinessLicenseNumValidateDate, " +
                "   productionAndBusinessLicenseNumIssuedDepartment, " +
                "   storageAddress, " +
                "   mentaanesthesiaLicenseNum, " +
                "   mentalanesthesiaLicenseNumValidateDate, " +
                "   gmpOrGspLicenseNum," +
                "   gmpOrGspLicenseNumValidateDate, " +

                "   hazardousChemicalsLicenseNum," +
                "   hazardousChemicalsLicenseNumValidateDate, " +
                "   medicalInstitutionLicenseNum," +
                "   medicalInstitutionLicenseNumValidateDate, " +
                "   maternalLicenseNum, " +
                "   maternalLicenseNumValidateDate, " +
                "   institutionLegalPersonCert," +
                "   institutionLegalPersonCertValidateDate, " +
                "   gspImages) " +
                "values (" +
                "   %d, '%s', '%s', '%s', " +
                "   '%s', '%s', '%s', '%s', " +
                "   '%s', '%s', '%s', '%s', " +
                "   '%s', '%s', '%s', '%s', " +
                "   '%s', '%s', '%s', '%s', " +
                "   '%s', '%s', '%s', '%s', " +
                "   '%s', '%s', '%s', '%s', " +
                "   '%s', '%s', '%s', '%s', " +
                "   '%s', '%s', '%s', '%s', " +
                "   '%s', '%s', '%s', '%s') " +
                "on duplicate key update" +
                "   legalRepresentative = values(legalRepresentative)," +
                "   businessLicense = values(businessLicense)," +
                "   companyManager = values(companyManager)," +
                "   registeredCapital = values(registeredCapital)," +
                "   businessAddress = values(businessAddress)," +

                "   limitedBusinessRange = values(limitedBusinessRange)," +
                "   orgCode = values(orgCode)," +
                "   taxRegistrationLicenseNum = values(taxRegistrationLicenseNum)," +
                "   taxRegistrationLicenseNumValidateDate = values(taxRegistrationLicenseNumValidateDate)," +
                "   foodCirculationLicenseNum = values(foodCirculationLicenseNum)," +

                "   foodCirculationLicenseNumValidateDate = values(foodCirculationLicenseNumValidateDate)," +
                "   qualityAssuranceLicenseNum = values(qualityAssuranceLicenseNum)," +
                "   qualityAssuranceLicenseNumValidateDate = values(qualityAssuranceLicenseNumValidateDate)," +
                "   medicalApparatusLicenseNum = values(medicalApparatusLicenseNum)," +
                "   medicalApparatusLicenseNumValidateDate = values(medicalApparatusLicenseNumValidateDate)," +

                "   medicalApparatusType = values(medicalApparatusType)," +
                "   healthProductsLicenseNum = values(healthProductsLicenseNum)," +
                "   healthProductsLicenseNumValidateDate = values(healthProductsLicenseNumValidateDate)," +
                "   productionAndBusinessLicenseNum = values(productionAndBusinessLicenseNum)," +
                "   productionAndBusinessLicenseNumIssuedDate = values(productionAndBusinessLicenseNumIssuedDate)," +

                "   productionAndBusinessLicenseNumValidateDate = values(productionAndBusinessLicenseNumValidateDate)," +
                "   productionAndBusinessLicenseNumIssuedDepartment = values(productionAndBusinessLicenseNumIssuedDepartment)," +
                "   storageAddress = values(storageAddress)," +
                "   mentaanesthesiaLicenseNum = values(mentaanesthesiaLicenseNum)," +
                "   mentalanesthesiaLicenseNumValidateDate = values(mentalanesthesiaLicenseNumValidateDate)," +

                "   gmpOrGspLicenseNum = values(gmpOrGspLicenseNum)," +
                "   gmpOrGspLicenseNumValidateDate = values(gmpOrGspLicenseNumValidateDate)," +
                "   hazardousChemicalsLicenseNum = values(hazardousChemicalsLicenseNum)," +
                "   hazardousChemicalsLicenseNumValidateDate = values(hazardousChemicalsLicenseNumValidateDate)," +
                "   medicalInstitutionLicenseNum = values(medicalInstitutionLicenseNum)," +

                "   medicalInstitutionLicenseNumValidateDate = values(medicalInstitutionLicenseNumValidateDate)," +
                "   maternalLicenseNum = values(maternalLicenseNum)," +
                "   maternalLicenseNumValidateDate = values(maternalLicenseNumValidateDate)," +
                "   institutionLegalPersonCert = values(institutionLegalPersonCert)," +
                "   institutionLegalPersonCertValidateDate = values(institutionLegalPersonCertValidateDate)," +
                "   gspImages = values(gspImages);";
            sql = sprintf(sql, customerDbName,
                insertObj.clientId, insertObj.legalRepresentative, insertObj.businessLicense, insertObj.companyManager,
                insertObj.businessLicenseValidateDate, insertObj.registeredCapital, insertObj.businessAddress, insertObj.limitedBusinessRange,
                insertObj.limitedBusinessType, insertObj.orgCode, insertObj.orgCodeValidateDate, insertObj.taxRegistrationLicenseNum,
                insertObj.taxRegistrationLicenseNumValidateDate, insertObj.foodCirculationLicenseNum, insertObj.foodCirculationLicenseNumValidateDate, insertObj.qualityAssuranceLicenseNum,
                insertObj.qualityAssuranceLicenseNumValidateDate, insertObj.medicalApparatusLicenseNum, insertObj.medicalApparatusLicenseNumValidateDate, insertObj.medicalApparatusType,
                insertObj.healthProductsLicenseNum, insertObj.healthProductsLicenseNumValidateDate, insertObj.productionAndBusinessLicenseNum, insertObj.productionAndBusinessLicenseNumIssuedDate,
                insertObj.productionAndBusinessLicenseNumValidateDate, insertObj.productionAndBusinessLicenseNumIssuedDepartment, insertObj.storageAddress, insertObj.mentaanesthesiaLicenseNum,
                insertObj.mentalanesthesiaLicenseNumValidateDate, insertObj.gmpOrGspLicenseNum, insertObj.gmpOrGspLicenseNumValidateDate, insertObj.hazardousChemicalsLicenseNum,
                insertObj.hazardousChemicalsLicenseNumValidateDate, insertObj.medicalInstitutionLicenseNum, insertObj.medicalInstitutionLicenseNumValidateDate, insertObj.maternalLicenseNum,
                insertObj.maternalLicenseNumValidateDate, insertObj.institutionLegalPersonCert, insertObj.institutionLegalPersonCertValidateDate, insertObj.gspImages
            );
            logger.sql(sql);
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },
        transactionUpdateClientGspFromErp: function (connection, customerDbName, updateObj, callback) {
            //updateObj = {
            //    legalRepresentative: clientItemInfo.legalRepresentative,
            //    businessLicense: businessLicense,
            //    companyManager: clientItemInfo.companyManager,
            //    businessLicenseValidateDate: moment(new Date(clientItemInfo.businessLicenseValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    registeredCapital: clientItemInfo.registeredCapital,
            //    businessAddress: clientItemInfo.businessAddress,
            //    limitedBusinessRange: clientItemInfo.limitedBusinessRange,
            //    limitedBusinessType: clientItemInfo.limitedBusinessType,
            //    orgCode: clientItemInfo.orgCode,
            //    orgCodeValidateDate: moment(new Date(clientItemInfo.orgCodeValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    taxRegistrationLicenseNum: clientItemInfo.taxRegistrationLicenseNum,
            //    taxRegistrationLicenseNumValidateDate: moment(new Date(clientItemInfo.taxRegistrationLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    foodCirculationLicenseNum: clientItemInfo.foodCirculationLicenseNum,
            //    foodCirculationLicenseNumValidateDate: moment(new Date(clientItemInfo.foodCirculationLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    qualityAssuranceLicenseNum: clientItemInfo.qualityAssuranceLicenseNum,
            //    qualityAssuranceLicenseNumValidateDate: moment(new Date(clientItemInfo.qualityAssuranceLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    medicalApparatusLicenseNum: clientItemInfo.medicalApparatusLicenseNum,
            //    medicalApparatusLicenseNumValidateDate: moment(new Date(clientItemInfo.medicalApparatusLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    medicalApparatusType: clientItemInfo.medicalApparatusType,
            //    healthProductsLicenseNum: clientItemInfo.healthProductsLicenseNum,
            //    healthProductsLicenseNumValidateDate: moment(new Date(clientItemInfo.healthProductsLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    productionAndBusinessLicenseNum: clientItemInfo.productionAndBusinessLicenseNum,
            //    productionAndBusinessLicenseNumIssuedDate: moment(new Date(clientItemInfo.productionAndBusinessLicenseNumIssuedDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    productionAndBusinessLicenseNumValidateDate: moment(new Date(clientItemInfo.productionAndBusinessLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    productionAndBusinessLicenseNumIssuedDepartment: clientItemInfo.productionAndBusinessLicenseNumIssuedDepartment,
            //    storageAddress: clientItemInfo.storageAddress,
            //    mentaanesthesiaLicenseNum: clientItemInfo.mentaanesthesiaLicenseNum,
            //    mentalanesthesiaLicenseNumValidateDate: moment(new Date(clientItemInfo.mentalanesthesiaLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    gmpOrGspLicenseNum: clientItemInfo.gmpOrGspLicenseNum,
            //    gmpOrGspLicenseNumValidateDate: moment(new Date(clientItemInfo.gmpOrGspLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    hazardousChemicalsLicenseNum: clientItemInfo.hazardousChemicalsLicenseNum,
            //    hazardousChemicalsLicenseNumValidateDate: moment(new Date(clientItemInfo.hazardousChemicalsLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    medicalInstitutionLicenseNum: clientItemInfo.medicalInstitutionLicenseNum,
            //    medicalInstitutionLicenseNumValidateDate: moment(new Date(clientItemInfo.medicalInstitutionLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    maternalLicenseNum: clientItemInfo.maternalLicenseNum,
            //    maternalLicenseNumValidateDate: moment(new Date(clientItemInfo.maternalLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    institutionLegalPersonCert: clientItemInfo.institutionLegalPersonCert,
            //    institutionLegalPersonCertValidateDate: moment(new Date(clientItemInfo.institutionLegalPersonCertValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
            //    gspImages: clientItemInfo.gspImages
            //};
            var sql = "" +
                "update %s.ClientGsp " +
                "set " +
                "   legalRepresentative = '%s',    " +
                "   companyManager = '%s', " +
                "   businessLicenseValidateDate = '%s',    " +
                "   registeredCapital = '%s',  " +
                "   businessAddress = '%s',    " +
                "   limitedBusinessRange = '%s', " +
                "   limitedBusinessType = '%s',    " +
                "   orgCode = '%s', " +
                "   orgCodeValidateDate = '%s', " +

                "   taxRegistrationLicenseNum = '%s', " +
                "   taxRegistrationLicenseNumValidateDate = '%s'," +
                "   foodCirculationLicenseNum = '%s'," +
                "   foodCirculationLicenseNumValidateDate = '%s'," +
                "   qualityAssuranceLicenseNum = '%s', " +
                "   qualityAssuranceLicenseNumValidateDate = '%s'," +
                "   medicalApparatusLicenseNum = '%s'," +
                "   medicalApparatusLicenseNumValidateDate = '%s'," +
                "   medicalApparatusType = '%s', " +
                "   healthProductsLicenseNum = '%s'," +

                "   healthProductsLicenseNumValidateDate = '%s'," +
                "   productionAndBusinessLicenseNum = '%s'," +
                "   productionAndBusinessLicenseNumIssuedDate = '%s', " +
                "   productionAndBusinessLicenseNumValidateDate = '%s'," +
                "   productionAndBusinessLicenseNumIssuedDepartment = '%s'," +
                "   storageAddress = '%s', " +
                "   mentaanesthesiaLicenseNum = '%s', " +
                "   mentalanesthesiaLicenseNumValidateDate = '%s', " +
                "   gmpOrGspLicenseNum = '%s'," +
                "   gmpOrGspLicenseNumValidateDate = '%s'," +

                "   hazardousChemicalsLicenseNum = '%s'," +
                "   hazardousChemicalsLicenseNumValidateDate = '%s'," +
                "   medicalInstitutionLicenseNum = '%s'," +
                "   medicalInstitutionLicenseNumValidateDate = '%s'," +
                "   maternalLicenseNum = '%s', " +
                "   maternalLicenseNumValidateDate = '%s'," +
                "   institutionLegalPersonCert = '%s'," +
                "   institutionLegalPersonCertValidateDate = '%s'," +
                "   gspImages = '%s' " +
                "where " +
                "   businessLicense = '%s'; ";
            sql = sprintf(sql,
                customerDbName,
                updateObj.legalRepresentative,
                updateObj.companyManager,
                updateObj.businessLicenseValidateDate,
                updateObj.registeredCapital,
                updateObj.businessAddress,
                updateObj.limitedBusinessRange,
                updateObj.limitedBusinessType,
                updateObj.orgCode,
                updateObj.orgCodeValidateDate,

                updateObj.taxRegistrationLicenseNum,
                updateObj.taxRegistrationLicenseNumValidateDate,
                updateObj.foodCirculationLicenseNum,
                updateObj.foodCirculationLicenseNumValidateDate,
                updateObj.qualityAssuranceLicenseNum,
                updateObj.qualityAssuranceLicenseNumValidateDate,
                updateObj.medicalApparatusLicenseNum,
                updateObj.medicalApparatusLicenseNumValidateDate,
                updateObj.medicalApparatusType,
                updateObj.healthProductsLicenseNum,

                updateObj.healthProductsLicenseNumValidateDate,
                updateObj.productionAndBusinessLicenseNum,
                updateObj.productionAndBusinessLicenseNumIssuedDate,
                updateObj.productionAndBusinessLicenseNumValidateDate,
                updateObj.productionAndBusinessLicenseNumIssuedDepartment,
                updateObj.storageAddress,
                updateObj.mentaanesthesiaLicenseNum,
                updateObj.mentalanesthesiaLicenseNumValidateDate,
                updateObj.gmpOrGspLicenseNum,
                updateObj.gmpOrGspLicenseNumValidateDate,

                updateObj.hazardousChemicalsLicenseNum,
                updateObj.hazardousChemicalsLicenseNumValidateDate,
                updateObj.medicalInstitutionLicenseNum,
                updateObj.medicalInstitutionLicenseNumValidateDate,
                updateObj.maternalLicenseNum,
                updateObj.maternalLicenseNumValidateDate,
                updateObj.institutionLegalPersonCert,
                updateObj.institutionLegalPersonCertValidateDate,
                updateObj.gspImages,
                updateObj.businessLicense
            );
            logger.sql(sql);
            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },
        transactionUpdateClientSetDefaultAddressId: function (connection, customerDbName, defaultAddressId, clientId, callback) {
            logger.enter();
            var sql = "update %s.Client set defaultAddressId = %d where id = %d;";
            sql = sprintf(sql, customerDbName, defaultAddressId, clientId);

            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });

        },

        insertInToClientBuyer: function (customerDbName, buyerInfo, callback) {
            var sql = "" +
                "insert into " +
                "   %s.ClientBuyerInfo(enterpriseId, enabled, erpCode, businessLicense,enterpriseName,businessLicenseValidate,businessAddress,legalRepresentative,erpUpdateTime) " +
                "values ? " +
                "on duplicate key update " +
                "   enterpriseId = values(enterpriseId)," +
                "   enabled = values(enabled)," +
                "   erpCode = values(erpCode)," +
                "   businessLicense = values(businessLicense)," +
                "   enterpriseName = values(enterpriseName)," +
                "   businessLicenseValidate = values(businessLicenseValidate)," +
                "   businessAddress = values(businessAddress)," +
                "   legalRepresentative = values(legalRepresentative)," +
                "   erpUpdateTime = values(erpUpdateTime); ";
            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            __mysql.query(sql, [buyerInfo], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },

        insertInToClientSeller: function (customerDbName, sellerInfo, callback) {
            var sql = "" +
                "insert into " +
                "   %s.ClientSellerInfo(enterpriseId, enabled, erpCode, businessLicense,enterpriseName,businessLicenseValidate,businessAddress,legalRepresentative,erpUpdateTime)" +
                "values ? " +
                "on duplicate key update " +
                "   enterpriseId = values(enterpriseId)," +
                "   enabled = values(enabled)," +
                "   erpCode = values(erpCode)," +
                "   businessLicense = values(businessLicense)," +
                "   enterpriseName = values(enterpriseName)," +
                "   businessLicenseValidate = values(businessLicenseValidate)," +
                "   businessAddress = values(businessAddress)," +
                "   legalRepresentative = values(legalRepresentative)," +
                "   erpUpdateTime = values(erpUpdateTime); ";
            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            __mysql.query(sql, [sellerInfo], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },

        /**
         * get sms list from db
         * @param customerDB
         * @param callback
         */
        getSmsList : function(customerDB,callback){
            logger.enter();
            var sql = "" +
                "SELECT " +
                "   ClientSMSKeys.id,"+
                "   ClientSMSKeys.smsId,"+
                "   ClientSMSKeys.isMain,"+
                "   ClientSMSKeys.isStandby,"+
                "   "+
                "   AvailableSMS.name, "+
                "   AvailableSMS.version, "+
                "   AvailableSMS.encoding, "+
                "   AvailableSMS.signMethod, "+
                "   AvailableSMS.baseUrl, "+
                "   AvailableSMS.smsPath, "+
                "   AvailableSMS.imgUrl "+
                "   FROM %s.ClientSMSKeys,%s.AvailableSMS " +
                "   WHERE ClientSMSKeys.smsId = AvailableSMS.id ; ";
            sql = sprintf(sql, customerDB,__cloudDBName);
            logger.sql(sql);
            __mysql.query(sql,function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        /**
         * update sms status for db
         * @param customerDB
         * @param dataArr
         * @param callback
         */
        updateSmsStatus : function(customerDB,dataArr,callback){
            var sql = "" +
                "insert into " +
                "   %s.ClientSMSKeys(smsId, isMain, isStandby )" +
                "values ? " +
                "on duplicate key update " +
                "   smsId = values(smsId)," +
                "   isMain = values(isMain)," +
                "   isStandby = values(isStandby); ";
            sql = sprintf(sql, customerDB);
            logger.sql(sql);
            __mysql.query(sql, [dataArr], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        /**
         * update sms config value in db
         * @param customerDB
         * @param smsId
         * @param configValue
         * @param callback
         */
        updateSmsConfig : function(customerDB,smsId,configValue,callback){
            var sql = "" +
                "insert into " +
                "   %s.ClientSMSKeys(smsId, configValue) " +
                "values (%d,'%s') " +
                "on duplicate key update " +
                "   smsId = values(smsId)," +
                "   configValue = values(configValue) " +
                "; ";
            sql = sprintf(sql, customerDB,smsId,configValue);
            logger.sql(sql);
            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },
        /**
         *
         * get one sms setting
         * @param customerDB
         * @param smsId
         * @param callback
         */
        getSmsSetting : function(customerDB,smsId,callback){
            logger.enter();
            var sql = "" +
                "SELECT " +
                "   ClientSMSKeys.id,"+
                "   ClientSMSKeys.smsId,"+
                "   ClientSMSKeys.isMain,"+
                "   ClientSMSKeys.isStandby,"+
                "   ClientSMSKeys.configValue"+
                "   "+
                "   FROM %s.ClientSMSKeys " +
                "   WHERE ClientSMSKeys.smsId = %d ; ";
            sql = sprintf(sql, customerDB,smsId);
            logger.sql(sql);
            __mysql.query(sql,function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },
        /**
         * get client payments
         * @param customerDB
         * @param callback
         */
        getclientPayments : function(customerDB,customerId,callback){
            logger.enter();
            var sql = "" +
                "SELECT " +
                "   ClientPaymentGateway.id as paymentId,"+
                "   ClientPaymentGateway.name,"+
                "   ClientPaymentGateway.version,"+
                "   ClientPaymentGateway.encoding,"+
                "   ClientPaymentGateway.signMethod,"+
                "   ClientPaymentGateway.baseUrl,"+
                "   ClientPaymentGateway.imgUrl," +
                "   ClientPaymentGateway.applyUrl," +
                "   "+
                "   ClientPaymentKeys.configValue, "+
                "   ClientPaymentKeys.isForbidden "+
                "   "+
                "   FROM %s.ClientPaymentGateway,%s.ClientPaymentKeys" +
                "   WHERE ClientPaymentGateway.id = ClientPaymentKeys.paymentId " +
                "   AND ClientPaymentKeys.customerId = %d ;";
            sql = sprintf(sql, customerDB, customerDB, customerId);
            logger.sql(sql);
            __mysql.query(sql,function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },
        /**
         * get payment configvalue by id
         * @param customerDB
         * @param customerId
         * @param paymentId
         * @param callback
         */
        getclientPaymentConfig  : function(customerDB,customerId,paymentId,callback){
            logger.enter();
            var sql = "" +
                "SELECT " +
                "   ClientPaymentGateway.id,"+
                "   ClientPaymentGateway.name,"+
                "   ClientPaymentGateway.version,"+
                "   ClientPaymentGateway.encoding,"+
                "   ClientPaymentGateway.signMethod,"+
                "   ClientPaymentGateway.baseUrl,"+
                "   ClientPaymentGateway.imgUrl," +
                "   ClientPaymentGateway.applyUrl," +
                "   "+
                "   ClientPaymentKeys.configValue," +
                "   ClientPaymentKeys.isForbidden "+
                "   "+
                "   FROM %s.ClientPaymentGateway,%s.ClientPaymentKeys" +
                "   WHERE ClientPaymentGateway.id = ClientPaymentKeys.paymentId " +
                "   AND ClientPaymentKeys.customerId = %d  "+
                "   AND ClientPaymentKeys.paymentId = %d ;";
            sql = sprintf(sql, customerDB, customerDB, customerId,paymentId);
            logger.sql(sql);
            __mysql.query(sql,function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },
        /**
         * update isFrobidden
         * @param customerDB
         * @param updateData
         * @param callback
         */
        updateClientPaymentIsForbidden : function(customerDB,updateData,callback){
            logger.enter();
            var sql = "" +
                "UPDATE  " +
                "   %s.ClientPaymentKeys " +
                "   SET isForbidden= '%s' " +
                "   "+
                "   WHERE ClientPaymentKeys.customerId = %d  "+
                "   AND ClientPaymentKeys.paymentId = %d ;";
            sql = sprintf(sql,
                    customerDB,
                    updateData.isForbidden,
                    updateData.customerId,
                    updateData.paymentId);
            logger.sql(sql);
            __mysql.query(sql,function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },
        /**
         * update configValue for one payment
         * @param customerDB
         * @param customerId
         * @param paymentId
         * @param configValue
         * @param callback
         */
        updateConfigValue : function(customerDB,customerId,paymentId,configValue,callback){
            logger.enter();
            var sql = "" +
                "UPDATE  " +
                "   %s.ClientPaymentKeys " +
                "   SET configValue = '%s' " +
                "   "+
                "   WHERE ClientPaymentKeys.customerId = %d  "+
                "   AND ClientPaymentKeys.paymentId = %d ;";
            sql = sprintf(sql,
                customerDB,
                configValue,
                customerId,
                paymentId);
            logger.sql(sql);
            __mysql.query(sql,function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        }
    };

    /**
     *
     * @param data={
     * companyManager:'zhang3',
     * orgCode:'ORGcode123456'
     * }
     * @returns {string}
     * UPDATE CustomerDB_romens_127_0_0_1.ClientGsp SET companyManager='zhang3',orgCode='ORGcode123456';
     */
    function parseUpdateInfo(data){
        logger.enter();
        var result = "";

        if(underscore.isEmpty(data)) {
            return result;
        }

        for(var key in data){
            if(data[key]) {
                if(key.indexOf('Id')>-1){
                    result += key + "="+data[key] +"," ;
                }else{
                    result += key + "='"+data[key] +"'," ;
                }
            }

        }
        result = result.slice(0,-1);
        return result;

    }
    function parseInsertInfoNew(data){
        logger.enter();
        var result = {keys:"",values:""};
        for(var key in data){
            if(data[key]) {
                result.keys += key + ',' ;
                result.values +='"'+ data[key]+ '",';
            }
        }
        result.keys = result.keys.slice(0,-1);
        result.values = result.values.slice(0,-1);
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

    var getAllClientGsp = function(customerDB,cb){
        var SQL = "SELECT * FROM %s.ClientGsp;";
        var sql = sprintf(SQL, customerDB);
        logger.sql(sql);
        __mysql.query(sql,function(err,results){
            if(err){
                cb(err);
            } else{
                cb(this.error,results);
            }
        });
    };

    function convert(str) {
        var date = new Date(str),
            mnth = ("0" + (date.getMonth()+1)).slice(-2),
            day  = ("0" + date.getDate()).slice(-2);
        return [ date.getFullYear(), mnth, day ].join("-");
    }

    function getKeysFrom(data){
        logger.enter();
        var result = "";
        for(var key in data){
            result += key+"," ;
        }
        result = result.slice(0,-1);
        return result;
    }
    function getValuesFrom(data){
        logger.enter();
        var result = "";
        for(var key in data){
            result += "'"+data[key]+"'," ;
        }
        result = result.slice(0,-1);
        return result;
    }

    return dbService;
}