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
 * database service module: goods.js
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-25    hc-romens@issue#49     move Paginator's SQL clauses methods into module pagination
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
    var keywordsToArray = require("keywords-array");

    /**
     * SQL for customer DB, abbr. SQL_CT_***
     */

    var SQL_CT_INSERT_GOODSINFO = "" +
        "INSERT INTO %s.GoodsInfo (" +
        "       id, " +
        "       goodsNo, " +
        "       barcode, " +
        "       commonName, " +
        "       licenseNo," +
        "       filingNumberValidDate, " +
        "       producer," +
        "       spec," +
        "       imageUrl," +
        "       areaDesc," +
        "       goodsDetails," +
        "       alias," +
        "       birthPlace," +
        "       measureUnit," +
        "       largePackUnit," +
        "       largePackNum," +
        "       middlePackUnit," +
        "       middlePackNum," +
        "       smallPackUnit," +
        "       smallPackNum" +
        "   ) " +
        "VALUES (%s, '%s','%s', '%s', '%s', '%s','%s','%s','%s'," +
        "        '%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s') " +
        "ON DUPLICATE KEY " +
        "   UPDATE  goodsNo=VALUES(goodsNo)," +
        "           barcode=VALUES(barcode)," +
        "           commonName=VALUES(commonName)," +
        "           licenseNo=VALUES(licenseNo)," +
        "           filingNumberValidDate=VALUES(filingNumberValidDate)," +
        "           producer=VALUES(producer)," +
        "           spec=VALUES(spec)," +
        "           imageUrl=VALUES(imageUrl)," +
        "           areaDesc=VALUES(areaDesc)," +
        "           goodsDetails=VALUES(goodsDetails)," +
        "           alias=VALUES(alias)," +
        "           birthPlace=VALUES(birthPlace)," +
        "           measureUnit=VALUES(measureUnit)," +
        "           largePackUnit=VALUES(largePackUnit)," +
        "           largePackNum=VALUES(largePackNum)," +
        "           middlePackUnit=VALUES(middlePackUnit)," +
        "           middlePackNum=VALUES(middlePackNum)," +
        "           smallPackUnit=VALUES(smallPackUnit)," +
        "           smallPackNum=VALUES(smallPackNum);";

    var SQL_CT_INSERT_BATCH_GOODSINFO = "" +
        "INSERT INTO %s.GoodsInfo (%s) " +
        "VALUES (%s) " +
        "ON DUPLICATE KEY UPDATE %s;";

    var SQL_CT_GOODSINFO_UPDATE_BY_ID    = "" +
        "UPDATE " +
        "   %s.GoodsInfo " +
        "SET " +
        "   goodsNo='%s'," +
        "   barcode='%s', " +
        "   commonName='%s'," +
        "   producer='%s',  " +
        "   spec='%s'," +
        "   filingNumberValidDate='%s'," +
        "   imageUrl='%s'," +
        "   areaDesc='%s'," +
        "   goodsDetails = '%s'," +
        "   alias = '%s', " +
        "   birthPlace = '%s', " +
        "   measureUnit = '%s', " +
        "   largePackUnit = '%s', " +
        "   largePackNum = %d, " +
        "   middlePackUnit = '%s', " +
        "   middlePackNum = %d, " +
        "   smallPackUnit = '%s', " +
        "   smallPackNum = %d " +
        "WHERE " +
        "   id=%d;";

    var SQL_CT_GOODSGSP_BASIC_UPDATE_BY_ID   = "UPDATE %s.GoodsGsp SET filingNumberValidDate='%s' " +
        "WHERE goodsId=%d;";
    var SQL_CT_GOODS_PRICE_UPDATE_BY_ID   = "UPDATE %s.GoodsPrice SET " +
        "limitedPrice=%f," +
        "wholesalePrice=%f," +
        "refRetailPrice=%f, " +
        "price1=%f, " +
        "price2=%f, " +
        "price3=%f  " +
        "WHERE goodsId=%d;";

    var SQL_CT_GOODS_INVENTORY_UPDATE_BY_ID   = "UPDATE %s.GoodsInventory " +
        "SET %s " +
        "WHERE goodsId=%d;";

    var SQL_CT_GOODS_INVENTORY_UPDATE_ONE = "update %s.GoodsInventory set actualAmount = %s where goodsId=%d;";

    var SQL_CT_GOODS_INVENTORY_UPDATE = "insert into %s.GoodsInventory(goodsId, actualAmount) values ? on duplicate key update actualAmount = values(actualAmount);";

    var SQL_CT_GOODS_UPDATE_BY_ID   = "UPDATE %s.GoodsInfo " +
        "SET %s " +
        "WHERE id=%d;";
    var SQL_CT_GOODS_NEGSELL_UPDATE_BY_ID    = "UPDATE %s.GoodsInfo SET negSell='%s' WHERE id=%d;";

    var SQL_CT_GOODS_GSPDATA_UPDATE_BY_ID    = "UPDATE %s.GoodsGsp  " +
        "SET gmpNumber='%s', " +
        "gmpCertificationDate='%s', " +
        "gmpValidDate='%s', " +
        "importRegisCertNum='%s', " +
        "importRegisCertNumValidDate='%s', " +
        "gspType='%s', " +
        "registeredTradeMarksAndPatents='%s', " +
        "drugAdministrationEncoding='%s', " +
        //"drugsType='%s', " +
        "drugsValidDate='%s' " +
        "WHERE goodsId=%d;";
    var SQL_CT_GOODS_MARKS_UPDATE_BY_ID    = "UPDATE %s.GoodsGsp  " +
        "SET " +
        "       isNationalMedicine = '%s', " +//国家基本药物标志
        "       isMedicine = '%s', " +//药品标志
        "       isHerbalDecoctioniieces = '%s', " +//中药饮片标志
        "       isPregnancyRermination = '%s', " +//终止妊娠品标志
        "       isPrescriptionDrugs = '%s', " +//处方药标志
        "       isProteinasSimilationPreparation = '%s', " +//蛋白同化制剂标志
        "       isContainPeptidehormone = '%s', " +//含肽类激素标志
        "       isContainSpecialContent = '%s', " +//含特药品标志
        "       isSecondPsychotropicDrugs = '%s', " +//二类精神药品标志
        "       isStupefacient = '%s', " +//麻醉药品标志
        "       isMedicalToxicity = '%s', " +//医疗用毒性品标志
        "       isVaccine = '%s', " +//疫苗标志
        "       isFood = '%s', " +//食品标志
        "       isImported = '%s', " +//进口标志
        "       isCheckMedicalInstrumentCert= '%s', " +//需检查医疗器械证标志
        "       isHerbalMedicine= '%s', " +//中药材标志
        "       isContainSpecialContent= '%s', " +//含特药标志
        "       isMedicalInsuranceDrugs= '%s', " +//医保标志
        "       isContainEphedrine= '%s', " +//含麻黄碱标志
        "       isFirstPsychotropicDrugs= '%s', " +//一类精神药品标志
        "       isDiagnosticReagent= '%s', " +//诊断试剂
        "       isContainingStimulants= '%s', " +//含兴奋剂药品标志
        "       isHealthProducts= '%s', " +//保健品标志
        "       isHazardousChemicals= '%s'  " +//危险化学品标志
        "WHERE goodsId=%d;";

    var SQL_CT_INSERT_GOODSGSP =
        "INSERT INTO %s.GoodsGsp(" +
        "       goodsId," +
        "       gmpNumber, " +
        "       gmpCertificationDate, " +
        "       gmpValidDate, " +
        "       importRegisCertNum, " +
        "       importRegisCertNumValidDate," +
        "       gspType," +
        "       registeredTradeMarksAndPatents," +
        "       drugAdministrationEncoding, " +
        //"       drugsType, " +
        "       drugsValidDate, " +
        "       isNationalMedicine, " +             //国家基本药物标志
        "       isMedicine, " +                     //药品标志
        "       isHerbalDecoctioniieces, " +        //中药饮片标志
        "       isPregnancyRermination, " +         //终止妊娠品标志
        "       isPrescriptionDrugs, " +            //处方药标志
        "       isProteinasSimilationPreparation, " +//蛋白同化制剂标志
        "       isContainPeptidehormone, " +        //含肽类激素标志
        "       isContainSpecialContent, " +        //含特药品标志
        "       isSecondPsychotropicDrugs, " +      //二类精神药品标志
        "       isStupefacient, " +                 //麻醉药品标志
        "       isMedicalToxicity, " +              //医疗用毒性品标志
        "       isVaccine, " +                      //疫苗标志
        "       isFood, " +                         //食品标志
        "       isImported, " +                     //进口标志
        "       isCheckMedicalInstrumentCert, " +   //需检查医疗器械证标志
        "       isHerbalMedicine, " +               //中药材标志
        "       isMedicalInsuranceDrugs, " +        //医保标志
        "       isContainEphedrine, " +             //含麻黄碱标志
        "       isFirstPsychotropicDrugs, " +       //一类精神药品标志
        "       isDiagnosticReagent, " +            //诊断试剂
        "       isContainingStimulants, " +         //含兴奋剂药品标志
        "       isHealthProducts, " +               //保健品标志
        "       isHazardousChemicals" +             //危险化学品标志
        ") VALUES (" +
        "       %s," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        //"       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s'," +
        "       '%s' " +
        ") ON DUPLICATE KEY UPDATE " +
        "       gmpNumber=VALUES(gmpNumber), " +
        "       gmpCertificationDate=VALUES(gmpCertificationDate), " +
        "       gmpValidDate=VALUES(gmpValidDate), " +
        "       importRegisCertNum=VALUES(importRegisCertNum), " +
        "       importRegisCertNumValidDate=VALUES(importRegisCertNumValidDate)," +
        "       gspType=VALUES(gspType)," +
        "       registeredTradeMarksAndPatents=VALUES(registeredTradeMarksAndPatents)," +
        "       drugAdministrationEncoding=VALUES(drugAdministrationEncoding), " +
        //"       drugsType=VALUES(drugsType), " +
        "       drugsValidDate=VALUES(drugsValidDate), " +
        "       isNationalMedicine=VALUES(isNationalMedicine), " +//国家基本药物标志
        "       isMedicine=VALUES(isMedicine), " +//药品标志
        "       isHerbalDecoctioniieces=VALUES(isHerbalDecoctioniieces), " +//中药饮片标志
        "       isPregnancyRermination=VALUES(isPregnancyRermination), " +//终止妊娠品标志
        "       isPrescriptionDrugs=VALUES(isPrescriptionDrugs), " +//处方药标志
        "       isProteinasSimilationPreparation=VALUES(isProteinasSimilationPreparation), " +//蛋白同化制剂标志
        "       isContainPeptidehormone=VALUES(isContainPeptidehormone), " +//含肽类激素标志
        "       isContainSpecialContent=VALUES(isContainSpecialContent), " +//含特药品标志
        "       isSecondPsychotropicDrugs=VALUES(isSecondPsychotropicDrugs), " +//二类精神药品标志
        "       isStupefacient=VALUES(isStupefacient), " +//麻醉药品标志
        "       isMedicalToxicity=VALUES(isMedicalToxicity), " +//医疗用毒性品标志
        "       isVaccine=VALUES(isVaccine), " +//疫苗标志
        "       isFood=VALUES(isFood), " +//食品标志
        "       isImported=VALUES(isImported), " +//进口标志
        "       isCheckMedicalInstrumentCert=VALUES(isCheckMedicalInstrumentCert), " +//需检查医疗器械证标志
        "       isHerbalMedicine=VALUES(isHerbalMedicine), " +//中药材标志
        "       isMedicalInsuranceDrugs=VALUES(isMedicalInsuranceDrugs), " +//医保标志
        "       isContainEphedrine=VALUES(isContainEphedrine), " +//含麻黄碱标志
        "       isFirstPsychotropicDrugs=VALUES(isFirstPsychotropicDrugs), " +//一类精神药品标志
        "       isDiagnosticReagent=VALUES(isDiagnosticReagent), " +//诊断试剂
        "       isContainingStimulants=VALUES(isContainingStimulants), " +//含兴奋剂药品标志
        "       isHealthProducts=VALUES(isHealthProducts), " +//保健品标志
        "       isHazardousChemicals=VALUES(isHazardousChemicals);";

    var SQL_CT_INSERT_GOODSPRICE =
        "INSERT INTO %s.GoodsPrice(" +
        "       goodsId," +
        "       limitedPrice," +
        "       wholesalePrice," +
        "       refRetailPrice," +
        "       price1," +
        "       price2," +
        "       price3" +
        ") VALUES (" +
        "       %s," +
        "       %f," +
        "       %f," +
        "       %f," +
        "       %f," +
        "       %f," +
        "       %f" +
        ") ON DUPLICATE KEY UPDATE " +
        "       limitedPrice=VALUES(limitedPrice)," +
        "       wholesalePrice=VALUES(wholesalePrice)," +
        "       refRetailPrice=VALUES(refRetailPrice)," +
        "       price1=VALUES(price1)," +
        "       price2=VALUES(price2)," +
        "       price3=VALUES(price3);";

    var SQL_CT_INSERT_GOODSINVENTORY=
        "INSERT INTO %s.GoodsInventory(" +
        "       goodsId, " +
        "       goodsBatchTime, " +
        "       showPlanId, " +
        "       isSplit, " +
        "       onSell " +
        ") VALUES (" +
        "       %s, " +
        "       '%s', " +
        "       %d, " +
        "       %d, " +
        "       %d " +
        ") ON DUPLICATE KEY UPDATE " +
        "       goodsBatchTime=VALUES(goodsBatchTime)," +
        "       showPlanId=VALUES(showPlanId)," +
        "       onSell=VALUES(onSell)," +
        "       isSplit=VALUES(isSplit);";

    var SQL_CT_CUSTOMER_GOODS_SELECT =
        "SELECT GoodsInfo.id, " +
        "       GoodsInfo.commonName, " +
        "       GoodsInfo.spec, " +
        "       GoodsInfo.goodsNo, " +
        "       GoodsInfo.producer, " +
        "       GoodsTypes.fullname AS goodsType, " +
        "       GoodsInfo.alias, " +
        "       GoodsInfo.imageUrl, " +
        "       GoodsInfo.middlePackNum, " +
        "       GoodsInfo.largePackNum, " +
        "       GoodsInfo.measureUnit, " +
        "       GoodsInfo.negSell, " +
        "       GoodsInfo.measureUnit, " +
        "       GoodsGsp.isNationalMedicine, "  +
        "       GoodsGsp.isMedicalInsuranceDrugs, "  +
        "       GoodsGsp.isPrescriptionDrugs, "  +
        "       IFNULL(GoodsTopBuy.boughtQuantity,0) , "  +
        "       IFNULL(GoodsTopBuy.boughtAmount,0), "  +
        "       IFNULL(GoodsTopBuy.boughtTimes,0), "  +
        "       GoodsPrice.refRetailPrice, " +
        "       GoodsPrice.wholesalePrice, " +
        "       GoodsPrice.price1, " +
        "       GoodsInfo.isDeleted, " +
        "       GoodsPrice.price2, " +
        "       GoodsPrice.price3, " +
        "       GoodsInventory.amount, " +
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.onSell, " +
        "       GoodsInventory.isSplit " +
        "FROM %s.GoodsPrice, %s.GoodsInventory, %s.GoodsGsp, %s.GoodsTypeMap, %s.GoodsTypes, %s.GoodsInfo " +
        "LEFT JOIN " +
        "   (SELECT " +
        "       goodsId, " +
        "       COUNT(*) AS boughtTimes, " +
        "       SUM(amount) AS boughtAmount, " +
        "       SUM(quantity) AS boughtQuantity " +
        "   FROM " +
        "       %s.OrderDetails  " +
        "   WHERE " +
        "       DATE_SUB(CURDATE(), INTERVAL %d DAY) <= DATE(createdOn) " +
        "   GROUP BY " +
        "       goodsId " +
        "   ORDER BY " +
        "       boughtTimes DESC) AS GoodsTopBuy " +
        "ON GoodsInfo.id=GoodsTopBuy.goodsId " +
        "%s" +      // where
        "%s" +
        "   ,  GoodsInfo.id  " +      // order by
        "%s;";      // limit

    var SQL_CT_CUSTOMER_GOODS_SELECT_UNAVAILABLE =
        "SELECT GoodsInfo.id, " +
        "       GoodsInfo.commonName, " +
        "       GoodsInfo.spec, " +
        "       GoodsInfo.goodsNo, " +
        "       GoodsInfo.producer, " +
        "       GoodsInfo.alias, " +
        "       GoodsInfo.imageUrl, " +
        "       GoodsInfo.middlePackNum, " +
        "       GoodsInfo.largePackNum, " +
        "       GoodsInfo.measureUnit, " +
        "       GoodsInfo.negSell, " +
        "       GoodsGsp.isNationalMedicine, "  +
        "       GoodsGsp.isMedicalInsuranceDrugs, "  +
        "       GoodsGsp.isPrescriptionDrugs, "  +
        "       IFNULL(GoodsTopBuy.boughtQuantity,0) , "  +
        "       IFNULL(GoodsTopBuy.boughtAmount,0), "  +
        "       IFNULL(GoodsTopBuy.boughtTimes,0), "  +
        "       GoodsPrice.refRetailPrice, " +
        "       GoodsPrice.wholesalePrice, " +
        "       GoodsPrice.price1, " +
        "       GoodsInfo.isDeleted, " +
        "       GoodsPrice.price2, " +
        "       GoodsPrice.price3, " +
        "       GoodsInventory.amount, " +
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.onSell, " +
        "       GoodsInventory.isSplit " +
        "FROM %s.GoodsPrice, %s.GoodsInventory, %s.GoodsGsp, %s.GoodsInfo " +
        "LEFT JOIN " +
        "   (SELECT goodsId, " +
        "           COUNT(*) AS boughtTimes, " +
        "           SUM(amount) AS boughtAmount, " +
        "           SUM(quantity) AS boughtQuantity " +
        "      FROM %s.OrderDetails  " +
        "     WHERE DATE_SUB(CURDATE(), INTERVAL %d DAY) <= DATE(createdOn) " +
        "  GROUP BY goodsId " +
        "  ORDER BY boughtTimes DESC) AS GoodsTopBuy " +
        "ON GoodsInfo.id=GoodsTopBuy.goodsId " +
        "%s" +      // where
        "%s" +      // order by
        "%s;";      // limit

    var SQL_CT_ALL_GUEST_GOODS_SELECT =
        "SELECT GoodsInfo.id, " +
        "       GoodsInfo.commonName, " +
        "       GoodsInfo.alias, " +
        "       GoodsInfo.goodsNo, " +
        "       GoodsTypes.fullname AS goodsType, " +
        "       GoodsInfo.licenseNo, " +
        "       GoodsInfo.spec, " +
        "       GoodsInfo.supplier, " +
        "       GoodsInfo.birthPlace," +
        "       GoodsInfo.imageUrl, " +
        "       GoodsInfo.producer, " +
        "       GoodsInfo.measureUnit, " +
        "       GoodsInfo.measureUnit as largePackUnit, " +
        "       GoodsInfo.largePackNum, " +
        "       GoodsInfo.measureUnit as middlePackUnit, " +
        "       GoodsInfo.middlePackNum, " +
        "       GoodsInfo.measureUnit as smallPackUnit, " +
        "       GoodsInfo.smallPackNum, " +
        "       GoodsInfo.isDeleted, " +
        "       GoodsInfo.updatedOn, " +
        "       GoodsInfo.negSell, "   +
        "       IFNULL(GoodsTopBuy.boughtQuantity,0) , "  +
        "       IFNULL(GoodsTopBuy.boughtAmount,0), "  +
        "       IFNULL(GoodsTopBuy.boughtTimes,0), "  +
        "       GoodsGsp.isNationalMedicine, "  +
        "       GoodsGsp.isMedicalInsuranceDrugs, "  +
        "       GoodsGsp.isPrescriptionDrugs, "  +
        "       GoodsPrice.refRetailPrice, " +
        "       GoodsInventory.amount, " +
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.showPlanId, " +
        "       GoodsInventory.onSell,  " +
        "       GoodsInventory.isSplit  " +
        "FROM %s.GoodsInventory, %s.GoodsPrice, %s.GoodsGsp, %s.GoodsTypes, %s.GoodsTypeMap, %s.GoodsInfo " +
        "LEFT JOIN " +
        "   (SELECT goodsId, " +
        "           COUNT(*) AS boughtTimes, " +
        "           SUM(amount) AS boughtAmount, " +
        "           SUM(quantity) AS boughtQuantity " +
        "      FROM %s.OrderDetails " +
        "     WHERE DATE_SUB(curdate(), INTERVAL %d DAY) <= DATE(createdOn) " +
        "  GROUP BY goodsId" +
        "  ORDER BY boughtTimes DESC) AS GoodsTopBuy " +
        "ON GoodsInfo.id=GoodsTopBuy.goodsId " +
        "%s " +              // where clause
        "%s " +              // sort by clause
        "%s;";               // limit clause

    var SQL_CT_ALL_GOODS_SELECT =
        "SELECT GoodsInfo.id, " +
        "       GoodsInfo.commonName, " +
        "       GoodsInfo.alias, " +
        "       GoodsInfo.goodsNo, " +
        "       GoodsTypes.fullname AS goodsType, " +
        "       GoodsInfo.licenseNo, " +
        "       GoodsInfo.spec, " +
        "       GoodsInfo.supplier, " +
        "       GoodsInfo.birthPlace," +
        "       GoodsInfo.imageUrl, " +
        "       GoodsInfo.producer, " +
        "       GoodsInfo.measureUnit, " +
        "       GoodsInfo.measureUnit as largePackUnit, " +
        "       GoodsInfo.largePackNum, " +
        "       GoodsInfo.measureUnit as middlePackUnit, " +
        "       GoodsInfo.middlePackNum, " +
        "       GoodsInfo.measureUnit as smallPackUnit, " +
        "       GoodsInfo.smallPackNum, " +
        "       GoodsInfo.isDeleted, " +
        "       GoodsInfo.updatedOn, " +
        "       GoodsInfo.negSell, "   +
        "       IFNULL(GoodsTopBuy.boughtQuantity,0) , "  +
        "       IFNULL(GoodsTopBuy.boughtAmount,0), "  +
        "       IFNULL(GoodsTopBuy.boughtTimes,0), "  +
        "       GoodsGsp.isNationalMedicine, "  +
        "       GoodsGsp.isMedicalInsuranceDrugs, "  +
        "       GoodsGsp.isPrescriptionDrugs, "  +
        "       ClientGoodsPrice.price as clientGoodsPrice, " + //客户单品价格
        "       GoodsPrice.refRetailPrice, " +
        "       GoodsInventory.amount, " +
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.showPlanId, " +
        "       GoodsInventory.onSell,  " +
        "       GoodsInventory.isSplit  " +
        "FROM %s.GoodsInventory, %s.GoodsPrice, %s.ClientGoodsPrice, %s.GoodsGsp, %s.GoodsTypes, %s.GoodsTypeMap, %s.GoodsInfo " +
        "LEFT JOIN " +
        "   (SELECT goodsId, " +
        "           COUNT(*) AS boughtTimes, " +
        "           SUM(amount) AS boughtAmount, " +
        "           SUM(quantity) AS boughtQuantity " +
        "      FROM %s.OrderDetails  " +
        "     WHERE DATE_SUB(CURDATE(), INTERVAL %d DAY) <= DATE(createdOn) " +
        "  GROUP BY goodsId " +
        "  ORDER BY boughtTimes DESC) AS GoodsTopBuy " +
        "ON GoodsInfo.id=GoodsTopBuy.goodsId " +
        "%s " +              // where clause
        "%s " +              // sort by clause
        "%s;";               // limit clause


    var SQL_CT_GOODS_SELECT_BY_ORDERID =
        "SELECT DISTINCT " +
        "       OrderDetails.orderId as orderId, " +
        "       GoodsInfo.id as goodsId, " +
        "       GoodsInfo.commonName, " +
        "       GoodsInfo.alias, " +
        "       GoodsInfo.goodsNo, " +
        "       GoodsInfo.goodsType, " +
        "       GoodsInfo.licenseNo, " +
        "       GoodsInfo.spec, " +
        "       GoodsInfo.supplier, " +
        "       GoodsInfo.birthPlace," +
        "       GoodsInfo.imageUrl, " +
        "       GoodsInfo.producer, " +
        "       GoodsInfo.measureUnit, " +
        "       GoodsInfo.measureUnit as largePackUnit , " +
        "       GoodsInfo.largePackNum, " +
        "       GoodsInfo.measureUnit as middlePackUnit, " +
        "       GoodsInfo.middlePackNum, " +
        "       GoodsInfo.measureUnit as  smallPackUnit, " +
        "       GoodsInfo.smallPackNum, " +
        "       GoodsInfo.updatedOn, " +
        "       GoodsInventory.amount, " +
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.onSell  " +
        "FROM %s.OrderDetails,%s.GoodsInfo,%s.GoodsInventory " +
        "WHERE (GoodsInfo.id = OrderDetails.goodsId ) " +
        "AND (GoodsInfo.id = GoodsInventory.goodsId ) " +
        "AND OrderDetails.orderId = %d;";

    //sm账号以及游客筛选商品信息
    var SQL_CT_SELECT_GUEST_GOODS_BY_ID =
        "SELECT DISTINCT " +
        "       GoodsInfo.id, " +
        "       GoodsInfo.commonName, " +
        "       GoodsInfo.alias, " +
        "       GoodsInfo.spec, " +
        "       GoodsInfo.barcode, " +
        "       GoodsInfo.goodsNo, " +
        "       GoodsInfo.drugsType, " +
        "       GoodsGsp.isPrescriptionDrugs, " +
        "       GoodsInfo.licenseNo, " +
        "       GoodsInfo.supplier, " +
        "       GoodsInfo.birthPlace," +
        "       GoodsInfo.producer, " +
        "       GoodsInfo.imageUrl, " +
        "       GoodsInfo.measureUnit, " +
        "       GoodsInfo.measureUnit as largePackUnit, " +
        "       GoodsInfo.largePackNum, " +
        "       GoodsInfo.measureUnit as middlePackUnit, " +
        "       GoodsInfo.middlePackNum, " +
        "       GoodsInfo.measureUnit as smallPackUnit, " +
        "       GoodsInfo.smallPackNum, " +
        "       GoodsInfo.goodsDetails, " +
        "       GoodsInventory.amount as storage, " +
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.goodsBatchTime as goodsBatchTime, " +
        "       GoodsInventory.onSell, " +
        "       GoodsInventory.isSplit, " +
        "       GoodsPrice.wholesalePrice," +
        "       GoodsPrice.limitedPrice," +
        "       GoodsPrice.refRetailPrice, " +
        "       GoodsGsp.isNationalMedicine, " +
        "       GoodsGsp.isMedicalInsuranceDrugs " +
        "       FROM %s.GoodsInfo,%s.GoodsInventory, %s.GoodsPrice, %s.GoodsGsp " +
        "       WHERE GoodsInfo.id=GoodsPrice.goodsId " +
        "       AND GoodsInfo.id = GoodsInventory.goodsId " +
        "       AND GoodsInfo.id = GoodsGsp.goodsId " +
        "       AND GoodsInfo.id = %d";
    //登录用户(除去sm)筛选商品信息
    var SQL_CT_SELECT_GOODS_BY_ID =
        "SELECT DISTINCT " +
        "       GoodsInfo.id, " +
        "       GoodsInfo.commonName, " +
        "       GoodsInfo.alias, " +
        "       GoodsInfo.spec, " +
        "       GoodsInfo.barcode, " +
        "       GoodsInfo.goodsNo, " +
        "       GoodsGsp.isPrescriptionDrugs, " +
        "       GoodsInfo.licenseNo, " +
        "       GoodsInfo.supplier, " +
        "       GoodsInfo.birthPlace," +
        "       GoodsInfo.producer, " +
        "       GoodsInfo.imageUrl, " +
        "       GoodsInfo.measureUnit, " +
        "       GoodsInfo.measureUnit as largePackUnit , " +
        "       GoodsInfo.largePackNum, " +
        "       GoodsInfo.measureUnit as middlePackUnit , " +
        "       GoodsInfo.middlePackNum, " +
        "       GoodsInfo.measureUnit as smallPackUnit , " +
        "       GoodsInfo.smallPackNum, " +
        "       GoodsInfo.goodsDetails, " +
        "       GoodsInfo.drugsType, " +
        "       ClientGoodsPrice.price as clientGoodsPrice, " +
        "       GoodsInventory.amount as storage, " +
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.goodsBatchTime as goodsBatchTime, " +
        "       GoodsInventory.onSell, " +
        "       GoodsInventory.isSplit, " +
        "       GoodsPrice.wholesalePrice," +
        "       GoodsPrice.limitedPrice," +
        "       GoodsPrice.refRetailPrice, " +
        "       GoodsGsp.isNationalMedicine, " +
        "       GoodsGsp.isMedicalInsuranceDrugs " +
        "       FROM %s.GoodsInfo,%s.GoodsInventory, %s.GoodsPrice,%s.ClientGoodsPrice, %s.GoodsGsp  " +
        "       WHERE GoodsInfo.id=GoodsPrice.goodsId " +
        "       AND GoodsInfo.id = GoodsInventory.goodsId " +
        "       AND GoodsInfo.id = GoodsGsp.goodsId " +
        "       AND ClientGoodsPrice.goodsId=GoodsInfo.id "+
        "       AND GoodsInfo.id = %d"+
        "       AND ClientGoodsPrice.clientId=%d ";

    //商品管理表-基础信息
    var SQL_CT_GOODS_BASIC_INFO_SELECT_BY_ID =
        "SELECT  " +
        "       GoodsInfo.id, " +//商品ID
        "       GoodsInfo.goodsNo, " +//商品编号
        "       GoodsInfo.commonName, " +//商品名称
        "       GoodsInfo.alias, " +//商品别名
        "       GoodsInfo.goodsType, " +//商品类型
        "       GoodsInfo.licenseNo, " +//商品批准文号=GoodsGsp.filingNumber
        "       GoodsInfo.barcode, " +//商品条码
        "       GoodsInfo.producer, " +//商品生产厂家
        "       GoodsInfo.spec, " +//商品规格
        "       GoodsInfo.imageUrl, " +//商品图片
        "       GoodsInfo.areaDesc, " +//商品区域
        "       GoodsInfo.goodsDetails, " +//商品详情
        "       GoodsInfo.birthPlace, " +
        "       GoodsInfo.measureUnit, " +
        "       GoodsInfo.measureUnit as largePackUnit , " +
        "       GoodsInfo.largePackNum, " +
        "       GoodsInfo.measureUnit as middlePackUnit, " +
        "       GoodsInfo.middlePackNum, " +
        "       GoodsInfo.measureUnit as smallPackUnit, " +
        "       GoodsInfo.smallPackNum," +
        "       GoodsInfo.drugsType," +
        "       DATE_FORMAT(GoodsInfo.filingNumberValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS filingNumberValidDate " +//商品文号注册期限
        "FROM %s.GoodsInfo " +
        "WHERE (GoodsInfo.id = %d);";

    //商品管理表-价格设定
    var SQL_CT_GOODPRICE_SELECT_BY_ID =
        "SELECT id AS goodsPriceId, " +
        "       goodsId, " +//商品ID
        "       limitedPrice, " +//国家限价
        "       wholesalePrice, " +//批发价
        "       refRetailPrice, " +//零售价
        "       price1," +//价格一
        "       price2, " +//价格二
        "       price3 " +//价格三
        "FROM %s.GoodsPrice " +
        "WHERE goodsId =%d;";
    //商品管理表-库存设定
    var SQL_CT_GOODINVENTORY_SELECT_BY_ID =
        "SELECT GoodsInventory.id AS goodsInventoryId, " +
        "       GoodsInventory.goodsId AS goodsId, " +//商品ID
        "       GoodsInventory.showPlanId AS showPlanId, " +//商品库存方案
        "       GoodsInventory.goodsBatchTime AS goodsBatchTime, " +//商品批号
        "       GoodsInventory.amount AS amount, " +//库存数量
        "       GoodsInventory.lockedAmount as lockedAmount, " +
        "       GoodsInventory.actualAmount as actualAmount, " +
        "       GoodsInventory.onSell AS onSell, " +//上下架标志
        "       GoodsInventory.isSplit AS isSplit, " +//是否可拆分
        "       GoodsInfo.negSell AS negSell " +//库存允许负库存标志
        "FROM %s.GoodsInventory,%s.GoodsInfo " +
        "WHERE GoodsInventory.goodsId=%d " +
        "AND GoodsInventory.goodsId=GoodsInfo.id;";

    var SQL_CT_INSERT_GOODSTYPES =
        "INSERT INTO %s.GoodsTypeMap(" +
        "       goodsId," +
        "       goodsTypeId, " +
        "       isMain " +
        ") VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "       goodsId = VALUES(goodsId)," +
        "       goodsTypeId = VALUES(goodsTypeId)," +
        "       isMain = VALUES(isMain);";

    var SQL_CT_REMOVE_OTHER_GOODSTYPES =
        "DELETE FROM %s.GoodsTypeMap " +
        "      WHERE goodsId=%d AND " +
        "            goodsTypeId NOT IN (%s);";

    var SQL_CT_GOODSGSP_SELECT_BY_ID =
        "SELECT id AS GspId, " +
        "       goodsId, " +//商品ID
        "       gmpNumber, " +//GMP证书号
        "       DATE_FORMAT(gmpCertificationDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS gmpCertificationDate, " +//GMP认证日期
        "       DATE_FORMAT(gmpValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS gmpValidDate, " +//GMP有效日期
        "       importRegisCertNum, " +//进口注册号
        "       DATE_FORMAT(importRegisCertNumValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS importRegisCertNumValidDate, " +//进口注册证期限
        "       gspType, " +//GMP类别
        "       registeredTradeMarksAndPatents, " +//注册商标及专利
        "       drugAdministrationEncoding, " +//药监编码
        //"       drugsType, " +//剂型
        "       DATE_FORMAT(drugsValidDate,'%%Y-%%m-%%d %%H:%%i:%%S') AS drugsValidDate, " +//有效期
        "       isNationalMedicine, " +//国家基本药物标志
        "       isMedicine, " +//药品标志
        "       isHerbalDecoctioniieces, " +//中药饮片标志
        "       isPregnancyRermination, " +//终止妊娠品标志
        "       isPrescriptionDrugs, " +//处方药标志
        "       isProteinasSimilationPreparation, " +//蛋白同化制剂标志
        "       isContainPeptidehormone, " +//含肽类激素标志
        "       isContainSpecialContent, " +//含特药品标志
        "       isSecondPsychotropicDrugs, " +//二类精神药品标志
        "       isStupefacient, " +//麻醉药品标志
        "       isMedicalToxicity, " +//医疗用毒性品标志
        "       isVaccine, " +//疫苗标志
        "       isFood, " +//食品标志
        "       isImported, " +//进口标志
        "       isCheckMedicalInstrumentCert, " +//需检查医疗器械证标志
        "       isHerbalMedicine, " +//中药材标志
        "       isContainSpecialContent, " +//含特药标志
        "       isMedicalInsuranceDrugs, " +//医保标志
        "       isContainEphedrine, " +//含麻黄碱标志
        "       isFirstPsychotropicDrugs, " +//一类精神药品标志
        "       isDiagnosticReagent, " +//诊断试剂
        "       isContainingStimulants, " +//含兴奋剂药品标志
        "       isHealthProducts, " +//保健品标志
        "       isHazardousChemicals " +//危险化学品标志
        "FROM %s.GoodsGsp " +
        "WHERE goodsId =%d;";

    var SQL_CT_GOODPRICE_SELECT =
        "SELECT id AS goodsPriceId, " +
        "       goodsId," +
        "       wholesalePrice, " +
        "       refRetailPrice, " +
        "       price1," +
        "       price2, " +
        "       price3 " +
        "FROM %s.GoodsPrice " +
        "WHERE goodsId in (%s) " +
        "ORDER BY goodsId;";

    var SQL_CT_GOODSTYPES_BY_GOODSID_SELECT =
        "SELECT GoodsTypeMap.goodsTypeId AS erpId, " +
        "       GoodsTypes.name," +
        "       GoodsTypes.fullname " +
        "  FROM %s.GoodsTypes, %s.GoodsTypeMap " +
        " WHERE GoodsTypeMap.goodsTypeId = GoodsTypes.erpId AND" +
        "       GoodsTypeMap.goodsId=%d " +
        "ORDER BY GoodsTypeMap.isMain DESC, GoodsTypeMap.id;";

    var SQL_CT_IMPORT_GOODSINFO =
        "INSERT INTO %s.GoodsInfo " +
        "   (guid, goodsType, goodsNo, barcode, isPrescriptionDrugs, commonName, alias, licenseNo, spec, supplier, " +
        "    birthPlace, producer, measureUnit, largePackUnit, largePackNum, largePackBarcode, middlePackUnit, " +
        "    middlePackNum, middlePackBarcode, smallPackUnit, smallPackNum, smallPackBarcode, isForbidden, drugsType, isAreaLimited, " +
        "    areaDesc) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "guid=VALUES(guid), goodsType=VALUES(goodsType),goodsNo=VALUES(goodsNo),barcode=VALUES(barcode),isPrescriptionDrugs=VALUES(isPrescriptionDrugs), " +
        "commonName=VALUES(commonName),alias=VALUES(alias),licenseNo=VALUES(licenseNo),spec=VALUES(spec),supplier=VALUES(supplier), " +
        "birthPlace=VALUES(birthPlace),producer=VALUES(producer),measureUnit=VALUES(measureUnit),largePackUnit=VALUES(largePackUnit), " +
        "largePackNum=VALUES(largePackNum),largePackBarcode=VALUES(largePackBarcode),middlePackUnit=VALUES(middlePackUnit), " +
        "middlePackNum=VALUES(middlePackNum),middlePackBarcode=VALUES(middlePackBarcode),smallPackUnit=VALUES(smallPackUnit), " +
        "smallPackNum=VALUES(smallPackNum),smallPackBarcode=VALUES(smallPackBarcode),isForbidden=VALUES(isForbidden),isAreaLimited=VALUES(isAreaLimited), " +
        "areaDesc=VALUES(areaDesc);";

    //批量更新商品上下架
    var SQL_CT_UPDATEMUTIGOODS_ONSELL =  "UPDATE %s.GoodsInventory SET onSell='%s' WHERE goodsId IN ? ;";

    var SQL_CT_IMPORT_GOODSGSP =
        "INSERT INTO %s.GoodsGsp " +
        "   (goodsId, guid, gmpNumber, gmpCertificationDate, gmpValidDate, filingNumber, filingNumberValidDate, " +
        "    importRegisCertNum, importRegisCertNumValidDate, drugsType, drugsValidDate, storageCondition, " +
        "    gspType, registeredTradeMarksAndPatents, businessLicenseValidDate, instrumentProductionLicenseNum, " +
        "    drugAdministrationEncoding, isMedicalApparatus, isMedicine, isImported, isHerbalDecoctioniieces, " +
        "    isCheckMedicalInstrumentCert, isPregnancyRermination, isHerbalMedicine, isContainSpecialContent, " +
        "    isPrescriptionDrugs, isMedicalInsuranceDrugs, isProteinasSimilationPreparation, isContainEphedrine, " +
        "    isContainPeptidehormone, isSecondPsychotropicDrugs, isFirstPsychotropicDrugs, isHazardousChemicals, " +
        "    isStupefacient, isDiagnosticReagent, isMedicalToxicity, isContainingStimulants, isVaccine, isHealthProducts,  " +
        "    isFood) " +
        "VALUES ? " +
        "ON DUPLICATE KEY UPDATE " +
        "goodsId = VALUES(goodsId),guid = VALUES(guid),gmpNumber = VALUES(gmpNumber),gmpCertificationDate = VALUES(gmpCertificationDate)," +
        "gmpValidDate = VALUES(gmpValidDate),filingNumber = VALUES(filingNumber),filingNumberValidDate = VALUES(filingNumberValidDate),importRegisCertNum = VALUES(importRegisCertNum)," +
        "importRegisCertNumValidDate = VALUES(importRegisCertNumValidDate),drugsType = VALUES(drugsType),drugsValidDate = VALUES(drugsValidDate),storageCondition = VALUES(storageCondition)," +
        "gspType = VALUES(gspType),registeredTradeMarksAndPatents = VALUES(registeredTradeMarksAndPatents),businessLicenseValidDate = VALUES(businessLicenseValidDate),instrumentProductionLicenseNum = VALUES(instrumentProductionLicenseNum)," +
        "drugAdministrationEncoding = VALUES(drugAdministrationEncoding),isMedicalApparatus = VALUES(isMedicalApparatus),isMedicine = VALUES(isMedicine),isImported = VALUES(isImported)," +
        "isHerbalDecoctioniieces = VALUES(isHerbalDecoctioniieces),isCheckMedicalInstrumentCert = VALUES(isCheckMedicalInstrumentCert),isPregnancyRermination = VALUES(isPregnancyRermination), " +
        "isHerbalMedicine = VALUES(isHerbalMedicine),isContainSpecialContent = VALUES(isContainSpecialContent),isPrescriptionDrugs = VALUES(isPrescriptionDrugs),isMedicalInsuranceDrugs = VALUES(isMedicalInsuranceDrugs)," +
        "isProteinasSimilationPreparation = VALUES(isProteinasSimilationPreparation),isContainEphedrine = VALUES(isContainEphedrine),isContainPeptidehormone = VALUES(isContainPeptidehormone), " +
        "isSecondPsychotropicDrugs = VALUES(isSecondPsychotropicDrugs),isFirstPsychotropicDrugs = VALUES(isFirstPsychotropicDrugs),isHazardousChemicals = VALUES(isHazardousChemicals),isStupefacient = VALUES(isStupefacient)," +
        "isDiagnosticReagent = VALUES(isDiagnosticReagent),isMedicalToxicity = VALUES(isMedicalToxicity),isContainingStimulants = VALUES(isContainingStimulants),isVaccine = VALUES(isVaccine), " +
        "isHealthProducts = VALUES(isHealthProducts), isFood = VALUES(isFood);";

    var SQL_CT_CLIENTPRICE_SELECT =
        "SELECT Client.id AS id, " +
        "       Client.clientName AS clientName, " +
        "       Client.clientCode AS number, " +
        "       ClientCategory.categoryName AS type, " +
        "       Client.clientArea AS area, " +
        "       ClientPrice.clientPrice AS clientPrice " +
        "FROM %s.ClientPrice, %s.Client, %s.ClientCategory " +
        "WHERE ClientPrice.goodsId=%d AND " +
        "      Client.clientName LIKE '%%%s%%' AND  "+
        "      ClientPrice.clientId=Client.id AND " +
        "      Client.clientCategoryId =ClientCategory.id;";

    var SQL_CT_CLIENTPRICE_INSERT =
        "INSERT INTO %s.ClientPrice (clientId, goodsId, clientPrice) " +
        "VALUES (%d, %d, %f) " +
        "ON DUPLICATE KEY UPDATE " +
        "clientId = VALUES(clientId),goodsId = VALUES(goodsId),clientPrice = VALUES(clientPrice);";
    var SQL_CT_CLIENTPRICE_DELETE =
        "DELETE FROM %s.ClientPrice " +
        "WHERE clientId=%d AND goodsId=%d;";
    var SQL_CT_CLIENTPRICE_UPDATE =
        "UPDATE %s.ClientPrice " +
        "   SET clientPrice=%f " +
        " WHERE clientId=%d AND goodsId=%d;";


    var SQL_CT_CATEGORYPRICE_SELECT =
        "SELECT ClientCategory.categoryName," +
        "       ClientCategory.id, " +
        "       ClientCategoryPrice.clientCategoryPrice " +
        "  FROM %s.ClientCategoryPrice,%s.ClientCategory  " +
        " WHERE goodsId=%d AND ClientCategoryPrice.clientCategoryId=ClientCategory.id;" ;

    var SQL_CT_CLIENTCATEGORYPRICE_INSERT =
        "INSERT INTO %s.ClientCategoryPrice (clientCategoryId, goodsId, clientCategoryPrice) " +
        "VALUES (%d, %d, %f) " +
        "ON DUPLICATE KEY UPDATE " +
        "clientCategoryId=VALUES(clientCategoryId), goodsId=VALUES(goodsId), " +
        "clientCategoryPrice=VALUES(clientCategoryPrice);";

    var SQL_CT_CLIENTCATEGORYPRICE_DELETE =
        "DELETE FROM %s.ClientCategoryPrice " +
        " WHERE clientCategoryId=%d AND goodsId=%d;";

    var SQL_CT_CLIENTCATEGORYPRICE_UPDATE =
        "UPDATE %s. ClientCategoryPrice " +
        "   SET clientCategoryPrice=%f " +
        " WHERE clientCategoryId=%d AND goodsId=%d;";

    var SQL_CT_GOODS_BASIC_PRICE_SELECT =
        " SELECT " +
        "       GoodsInfo.id, " +//商品ID
        "       GoodsInfo.goodsNo, " +//商品编号
        "       GoodsInfo.commonName, " +//商品名称
        "       GoodsInfo.producer, " +//商品生产厂家
        "       GoodsInfo.spec, " +//商品规格
        "       GoodsPrice.limitedPrice, " +//国家限价
        "       GoodsPrice.wholesalePrice, " +//批发价
        "       GoodsPrice.refRetailPrice, " +//零售价
        "       GoodsPrice.price1," +//价格一
        "       GoodsPrice.price2, " +//价格二
        "       GoodsPrice.price3 " +//价格三
        " FROM %s.GoodsInfo,%s.GoodsPrice " +
        " WHERE GoodsInfo.id = %d " +
        " AND GoodsInfo.id = GoodsPrice.goodsId;";

    var SQL_CT_GOODS_PRICE_READJUST_INSERT =
        " INSERT INTO %s.GoodsPriceReadjust " +
        " (goodsId, applyOperatorId, approverId, readjustReason) " +
        " VALUES (%d, %d, %d, '%s' );";

    var SQL_CT_GOODS_PRICE_READJUST_DETAILS_INSERT="INSERT INTO %s.GoodsPriceReadjustDetail (%s) " +
        "VALUES (%s);";

    var SQL_CT_PRICE_SET_ENABLE_SELECT =
        " SELECT GoodsPriceReadjust.goodsId, GoodsPriceReadjustDetail.readjustType " +
        " FROM %s.GoodsPriceReadjust, %s.GoodsPriceReadjustDetail " +
        " WHERE GoodsPriceReadjust.goodsId = %d " +
        " AND GoodsPriceReadjustDetail.readjustId = GoodsPriceReadjust.id " +
        " AND GoodsPriceReadjust.status = 'CREATED' " +
        " AND GoodsPriceReadjustDetail.readjustType IN %s ;";

    var SQL_CT_PRICE_READJUSTED_SELECT =
        " SELECT DISTINCT " +
        "   GoodsPriceReadjustDetail.readjustId," +
        "   GoodsPriceReadjustDetail.wholesalePriceOrigin, " +
        "   GoodsPriceReadjustDetail.wholesalePriceNew, " +
        "   GoodsPriceReadjustDetail.refRetailPriceOrigin, " +
        "   GoodsPriceReadjustDetail.refRetailPriceNew, " +
        "   GoodsPriceReadjustDetail.limitedPriceOrigin, " +
        "   GoodsPriceReadjustDetail.limitedPriceNew, " +
        "   GoodsPriceReadjustDetail.price1Origin, " +
        "   GoodsPriceReadjustDetail.price1New, " +
        "   GoodsPriceReadjustDetail.price2Origin, " +
        "   GoodsPriceReadjustDetail.price2New, " +
        "   GoodsPriceReadjustDetail.price3Origin, " +
        "   GoodsPriceReadjustDetail.price3New, " +
        "   GoodsPriceReadjustDetail.clientCategoryId," +
        "   ClientCategory.categoryName, " +
        "   GoodsPriceReadjustDetail.clientCategoryPriceOrigin, " +
        "   GoodsPriceReadjustDetail.clientCategoryPriceNew, " +
        "   GoodsPriceReadjustDetail.clientId, " +
        "   Client.clientName, " +
        "   Client.clientCode, " +
        "   GoodsPriceReadjustDetail.clientPriceOrigin, " +
        "   GoodsPriceReadjustDetail.clientPriceNew," +
        "   GoodsPriceReadjust.readjustReason, " +
        "   DATE_FORMAT(GoodsPriceReadjust.createdOn ,'%%Y-%%m-%%d %%H:%%i:%%S') as createdOn " +
        " FROM %s.GoodsPriceReadjustDetail " +
        " LEFT JOIN %s.ClientCategory ON GoodsPriceReadjustDetail.clientCategoryId=ClientCategory.id " +
        " LEFT JOIN %s.Client ON GoodsPriceReadjustDetail.clientId = Client.id ," +
        " %s.GoodsPriceReadjust " +
        " %s" +      // where
        " %s " +
        " order by GoodsPriceReadjust.createdOn DESC   " +      // order by
        " %s;";      // limit



    var SQL_CT_ALL_PRICE_READJUST_SELECT =
        " SELECT " +
        "   GoodsPriceReadjust.id, " +
        "   GoodsPriceReadjust.showId, " +
        "   GoodsPriceReadjust.goodsId, " +
        "   GoodsPriceReadjust.status, " +
        "   GoodsPriceReadjust.applyOperatorId, " +
        "   GoodsPriceReadjust.readjustReason, " +
        "   GoodsPriceReadjust.approverId, " +
        "   GoodsPriceReadjust.approveRemark, " +
        "       GoodsInfo.goodsNo, " +//货号
        "       GoodsInfo.commonName, " +//商品名称
        "       GoodsInfo.producer, " +//商品生产厂家
        "       GoodsInfo.spec, " +//商品规格
        "           o1.operatorName as applyOperatorName, " +//申请人名
        "           IFNULL(o2.operatorName,'') as approverName, " +//审核人名
        "   DATE_FORMAT(GoodsPriceReadjust.createdOn ,'%%Y-%%m-%%d %%H:%%i:%%S') as createOn, " +
        "   DATE_FORMAT(GoodsPriceReadjust.updatedOn ,'%%Y-%%m-%%d %%H:%%i:%%S') as updateOn" +
        " FROM %s.GoodsPriceReadjust " +
        " LEFT JOIN %s.Operator AS o2 ON o2.id = GoodsPriceReadjust.approverId, " +
        " %s.GoodsInfo,%s.Operator AS o1 " +
        " %s" +      // where
        " %s" +      // order by
        " %s;";      // limit


    var SQL_CT_PRICE_READJUST_BY_ID =
        " SELECT " +
        "   GoodsPriceReadjust.id, " +
        "   GoodsPriceReadjust.showId, " +
        "   GoodsPriceReadjust.goodsId, " +
        "   GoodsPriceReadjust.status, " +
        "   GoodsPriceReadjust.applyOperatorId, " +
        "   GoodsPriceReadjust.readjustReason, " +
        "   GoodsPriceReadjust.approverId, " +
        "   GoodsPriceReadjust.approveRemark, " +
        "       GoodsInfo.goodsNo, " +//货号
        "       GoodsInfo.commonName, " +//商品名称
        "       GoodsInfo.producer, " +//商品生产厂家
        "       GoodsInfo.spec, " +//商品规格
        "           o1.operatorName as applyOperatorName, " +//申请人名
        "           IFNULL(o2.operatorName,'') as approverName, " +//审核人名
        "   DATE_FORMAT(GoodsPriceReadjust.createdOn ,'%%Y-%%m-%%d %%H:%%i:%%S') as createOn , " +
        "   DATE_FORMAT(GoodsPriceReadjust.updatedOn ,'%%Y-%%m-%%d %%H:%%i:%%S') as updateOn " +
        " FROM %s.GoodsPriceReadjust " +
        " LEFT JOIN %s.Operator AS o2 ON o2.id = GoodsPriceReadjust.approverId ," +
        " %s.GoodsInfo,%s.Operator AS o1  " +
        " WHERE GoodsPriceReadjust.id = %d " +
        " AND GoodsPriceReadjust.goodsId=GoodsInfo.id " +
        " AND o1.id = GoodsPriceReadjust.applyOperatorId;";

    var SQL_CT_PRICE_READJUST_DETAILS_SELECT =
        " SELECT " +
        "   GoodsPriceReadjustDetail.readjustId," +
        "   GoodsPriceReadjustDetail.readjustType," +
        "   GoodsPriceReadjustDetail.wholesalePriceOrigin, " +
        "   GoodsPriceReadjustDetail.wholesalePriceNew, " +
        "   GoodsPriceReadjustDetail.refRetailPriceOrigin, " +
        "   GoodsPriceReadjustDetail.refRetailPriceNew, " +
        "   GoodsPriceReadjustDetail.limitedPriceOrigin, " +
        "   GoodsPriceReadjustDetail.limitedPriceNew, " +
        "   GoodsPriceReadjustDetail.price1Origin, " +
        "   GoodsPriceReadjustDetail.price1New, " +
        "   GoodsPriceReadjustDetail.price2Origin, " +
        "   GoodsPriceReadjustDetail.price2New, " +
        "   GoodsPriceReadjustDetail.price3Origin, " +
        "   GoodsPriceReadjustDetail.price3New, " +
        "   GoodsPriceReadjustDetail.clientCategoryId, " +
        "   ClientCategory.categoryName, " +
        "   GoodsPriceReadjustDetail.clientCategoryPriceOrigin, " +
        "   GoodsPriceReadjustDetail.clientCategoryPriceNew, " +
        "   GoodsPriceReadjustDetail.clientId, " +
        "   Client.clientName, " +
        "   Client.clientCode, " +
        "   GoodsPriceReadjustDetail.clientPriceOrigin, " +
        "   GoodsPriceReadjustDetail.clientPriceNew " +
        " FROM %s.GoodsPriceReadjustDetail" +
        " LEFT JOIN %s.ClientCategory ON GoodsPriceReadjustDetail.clientCategoryId=ClientCategory.id " +
        " LEFT JOIN %s.Client ON GoodsPriceReadjustDetail.clientId = Client.id," +
        " %s.GoodsPriceReadjust " +
        " WHERE GoodsPriceReadjustDetail.readjustId = %d " +
        " AND GoodsPriceReadjust.id = GoodsPriceReadjustDetail.readjustId " +
        " AND " +
        "   CASE  " +
        "       WHEN  GoodsPriceReadjust.status = 'CREATED' THEN GoodsPriceReadjustDetail.isApproved=0 " +
        "   ELSE GoodsPriceReadjustDetail.isApproved=1 " +
        "   END ;";

    var SQL_CT_GOODS_PRICE_READJUST_UPDATE =
        " UPDATE %s.GoodsPriceReadjust " +
        "   SET status='%s',approveRemark='%s'  " +
        " WHERE id=%d;";

    var SQL_CT_GOODS_PRICE_READJUST_DETAILS_STATUS_UPDATE =
        " UPDATE %s.GoodsPriceReadjustDetail " +
        "   SET isApproved=1 " +
        " WHERE readjustId=%d;";


    var SQL_CT_GOODS_PRICE_READJUST_LIST_BY_TYPE =
        " SELECT " +
        "   GoodsPriceReadjustDetail.readjustId," +
        "   GoodsPriceReadjustDetail.readjustType," +
        "   GoodsPriceReadjustDetail.wholesalePriceOrigin, " +
        "   GoodsPriceReadjustDetail.wholesalePriceNew, " +
        "   GoodsPriceReadjustDetail.refRetailPriceOrigin, " +
        "   GoodsPriceReadjustDetail.refRetailPriceNew, " +
        "   GoodsPriceReadjustDetail.limitedPriceOrigin, " +
        "   GoodsPriceReadjustDetail.limitedPriceNew, " +
        "   GoodsPriceReadjustDetail.price1Origin, " +
        "   GoodsPriceReadjustDetail.price1New, " +
        "   GoodsPriceReadjustDetail.price2Origin, " +
        "   GoodsPriceReadjustDetail.price2New, " +
        "   GoodsPriceReadjustDetail.price3Origin, " +
        "   GoodsPriceReadjustDetail.price3New, " +
        "   GoodsPriceReadjustDetail.clientCategoryId, " +
        "   GoodsPriceReadjustDetail.clientCategoryPriceOrigin, " +
        "   GoodsPriceReadjustDetail.clientCategoryPriceNew, " +
        "   GoodsPriceReadjustDetail.clientId, " +
        "   GoodsPriceReadjustDetail.clientPriceOrigin, " +
        "   GoodsPriceReadjustDetail.clientPriceNew " +
        " FROM %s.GoodsPriceReadjustDetail" +
        " WHERE GoodsPriceReadjustDetail.readjustId = %d " +
        " AND GoodsPriceReadjustDetail.isApproved=1 " +
        " AND GoodsPriceReadjustDetail.readjustType = %s ;";

    var SQL_CT_GOODSPRICE_READJUST =
        " UPDATE %s.GoodsPrice " +
        "   SET wholesalePrice=%f, refRetailPrice=%f, limitedPrice=%f, " +
        "       price1=%f, price2=%f, price3=%f " +
        " WHERE goodsId=%d;";


    /**
     * DB Service provider
     */
    var dbService = {
        /**
         * 根据调价单新增或修改客户单品价格
         * @param connect
         * @param customerDB
         * @param updateData
         * @param callback
         */
        metaUpdateClientPrice : function(connect,customerDB,updateData,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTPRICE_INSERT,
                customerDB,
                updateData.clientId,
                updateData.goodsId,
                updateData.clientPrice
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });

        },
        /**
         * 根据调价单删除客户单品价格
         * @param connect
         * @param customerDB
         * @param goodsId
         * @param clientCategoryId
         * @param callback
         */
        metaRemoveClientPrice :function(connect,customerDB,goodsId,clientId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTPRICE_DELETE,
                customerDB,clientId,goodsId
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },


        /**
         * 根据调价单新增或修改客户类价格
         * @param connect
         * @param customerDB
         * @param updateData
         * @param callback
         */
        metaUpdateClientCategoryPrice : function(connect,customerDB,updateData,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTCATEGORYPRICE_INSERT,
                customerDB,
                updateData.clientCategoryId,
                updateData.goodsId,
                updateData.clientCategoryPrice
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });

        },
        /**
         * 根据调价单删除客户类价格
         * @param connect
         * @param customerDB
         * @param goodsId
         * @param clientCategoryId
         * @param callback
         */
        metaRemoveClientCategoryPrice :function(connect,customerDB,goodsId,clientCategoryId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTCATEGORYPRICE_DELETE,
                customerDB,clientCategoryId,goodsId
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },
        /**
         * 根据调价单更新商品基础价格表
         * @param connect
         * @param customerDB
         * @param priceData
         * @param callback
         */
        metaUpdateGoodsPrice: function(connect,customerDB,priceData,callback){
            logger.enter();

            var sql = sprintf(SQL_CT_GOODSPRICE_READJUST,
                customerDB,
                priceData.wholesalePrice,
                priceData.refRetailPrice,
                priceData.limitedPrice,
                priceData.price1,
                priceData.price2,
                priceData.price3,
                priceData.goodsId
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },
        /**
         * 获取指定ID和状态的调价单详情信息
         * @param connect
         * @param customerDB
         * @param readjustId
         * @param readjustType
         * @param callback
         */
        metaListReadjustPriceDetail: function(connect,customerDB,readjustId,readjustType,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_PRICE_READJUST_LIST_BY_TYPE,
                customerDB,readjustId,readjustType
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        /**
         * 跟新调价单总表状态和备注，可用于审核通过，拒绝和取消调价单
         * @param connect
         * @param customerDB
         * @param readjustId
         * @param status
         * @param remark
         * @param callback
         */
        metaUpdateReadjustPriceStatus : function(connect,customerDB,readjustId,status,remark,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_PRICE_READJUST_UPDATE,
                customerDB,status,remark,readjustId
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },

        metaUpdateReadjustDetailStatus:function(connect,customerDB,readjustId,callback){
        logger.enter();
        var sql = sprintf(SQL_CT_GOODS_PRICE_READJUST_DETAILS_STATUS_UPDATE,
            customerDB,readjustId
        );
        logger.sql(sql);
        connect.query(sql, function(err,results){
            if (err) {
                logger.sqlerr(err);
                callback(err);
            } else {
                callback(null, results);
            }
        });
    },


    goodsInventoryUpdate: function (DbName, values, callback) {
            logger.enter();
            var SQL = "insert into %s.GoodsInventory(goodsId, amount, lockedAmount, actualAmount) values ? " +
                " on duplicate key update amount = values(amount), lockedAmount = values(lockedAmount), actualAmount = values(actualAmount);";

            var sql = sprintf(SQL, DbName, values);

            //var sql = sprintf(SQL_CT_GOODS_INVENTORY_UPDATE, DbName, values);

            logger.sql(sql);

            __mysql.query(sql, [values], function (error, result) {
                if (error) {
                    logger.sqlerr(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        goodsInventoryUpdateOne: function (DbName, goodsId, inventory, callback) {
            logger.enter();

            var SQL = " UPDATE %s.GoodsInventory set amount = %d - lockedAmount, actualAmount = %d " +
                "   WHERE goodsId = %d ;";

            var sql = sprintf(SQL, DbName, inventory, inventory, goodsId);

            //var sql = sprintf(SQL_CT_GOODS_INVENTORY_UPDATE_ONE, DbName, inventory, goodsId);

            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    return callback(error);
                }
                callback(null, result);
            });
        },


        /**
         * 查看所有调价单（不涉及调价详情）
         * @param customerDBName
         * @param paginator
         * @param status "'CREATED'"/"'APPROVED'/"'REJECTED'",待审核/已通过/已退回
         * @param callback
         */
        listAllReadjustPrice: function(customerDBName,paginator,operatorId,status,callback){
            logger.enter();
            logger.debug(status);
            var whereStr=paginator.where(sprintf("GoodsPriceReadjust.goodsId=GoodsInfo.id " +
                " AND o1.id = GoodsPriceReadjust.applyOperatorId" +
                //" AND (GoodsPriceReadjust.applyOperatorId = %d OR GoodsPriceReadjust.approverId = %d) " +
                " AND GoodsPriceReadjust.status = '%s' ",status));
            var sql = sprintf(SQL_CT_ALL_PRICE_READJUST_SELECT,
                customerDBName,customerDBName,
                customerDBName,customerDBName,
                whereStr,
                paginator.orderby(),
                paginator.limit()
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

        /**
         * 根据Id查看调价单公共部分信息
         * @param customerDBName
         * @param readjustId
         * @param callback
         */
        listReadjustPriceCommonById:function(customerDBName,readjustId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_PRICE_READJUST_BY_ID,
                customerDBName,customerDBName,
                customerDBName,customerDBName,
                readjustId

            );
            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results[0]);
                }
            });
        },
        /**
         * 根据Id查看调价单详细价格信息
         * @param customerDBName
         * @param readjustId
         * @param callback
         */
        listReadjustPriceDetailsById:function(customerDBName,readjustId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_PRICE_READJUST_DETAILS_SELECT,
                customerDBName,customerDBName,customerDBName,customerDBName,readjustId

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


        /**
         * 获取调价历史记录
         * @param customerDB
         * @param goodsId
         * @param readjustType
         * @param paginator
         * @param callback
         */
        listReadjustedPrice: function(customerDB,goodsId,readjustType,paginator,callback){

            logger.enter();
            var whereStr=paginator.where(sprintf(
                "GoodsPriceReadjust.goodsId=%d " +
                "AND GoodsPriceReadjustDetail.readjustId = GoodsPriceReadjust.id " +
                "AND GoodsPriceReadjust.status='APPROVED' " +
                "AND GoodsPriceReadjustDetail.readjustType=%s ",goodsId,readjustType));

            var sql = sprintf(SQL_CT_PRICE_READJUSTED_SELECT,
                customerDB,customerDB,customerDB,customerDB,
                whereStr,
                paginator.orderby(),
                paginator.limit()
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



        /**
         * 检查是否已存在待审核调价单
         * @param customerDBName
         * @param goodsId
         * @param readjustTypes
         * @param callback
         */
        checkReadjustEnable: function(customerDBName,goodsId,readjustTypes,callback){
            logger.enter();
            var str = "";
            underscore.map(readjustTypes,function(item){
                str += "'"+item+"',"
            });
            var readjustTypesStr = "("+str.slice(0,-1)+")";
            var sql = sprintf(SQL_CT_PRICE_SET_ENABLE_SELECT,
                customerDBName,customerDBName, goodsId,readjustTypesStr
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


        /**
         * 插入用户调价单详情表
         * @param connect
         * @param customerDBName
         * @param insertData
         * @param callback
         */
        metaNewGoodsPriceReadjustDetail: function(connect,customerDBName,insertData,callback){
            logger.enter();
            var priceData=parseInsertInfo(insertData);
            var keys = priceData.keys;
            var values = priceData.values;
            var sql = sprintf(SQL_CT_GOODS_PRICE_READJUST_DETAILS_INSERT,
                customerDBName,keys,values
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results.insertId);
                }
            });
        },

        /**
         * 插入用户调价单总表
         * @param connect
         * @param customerDBName
         * @param goodsId
         * @param applyOperatorId
         * @param approverId
         * @param reason
         * @param callback
         */
        metaNewGoodsPriceReadjust: function (connect,customerDBName,goodsId, applyOperatorId, approverId, reason,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_PRICE_READJUST_INSERT,
                customerDBName,goodsId, applyOperatorId, approverId, reason
            );
            logger.sql(sql);
            connect.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, results.insertId);
                }
            });
        },

        listSingleGoodsPriceInfo: function(customerDBName,goodsId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_BASIC_PRICE_SELECT,
                customerDBName,customerDBName, goodsId
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


        /**
         * List all goods from viewangle of customer
         * @param customerDBName
         * @param paginator
         * @param callback
         */
        listCustomerGoods: function(customerDBName, goodsTypeIds, paginator, callback){
            logger.enter();

            var whereStr=paginator.where(
                "GoodsInfo.id=GoodsPrice.goodsId AND " +
                "GoodsInfo.id=GoodsInventory.goodsId AND " +
                "GoodsInfo.id=GoodsGsp.goodsId AND " +
                "GoodsInfo.id=GoodsTypeMap.goodsId AND " +
                "GoodsTypeMap.goodsTypeId=GoodsTypes.erpId AND " +
                "GoodsInfo.isDeleted=0 AND " +
                "GoodsTypeMap.isMain=true", "goodsSort");

            if (goodsTypeIds != 0) {

                whereStr += "AND GoodsTypes.erpId in (" + goodsTypeIds + ") ";
            }

            var sql = sprintf(SQL_CT_CUSTOMER_GOODS_SELECT,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                __goodsTopDays,
                whereStr,
                paginator.orderby(),
                paginator.limit()
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

        listCustomerGoodsAvailable:function(customerDBName, goodsTypeIds, paginator, callback){
            logger.enter();

            var whereStr=paginator.where(
                "GoodsInfo.id=GoodsPrice.goodsId AND " +
                "GoodsInfo.id=GoodsInventory.goodsId AND " +
                "GoodsInfo.id=GoodsGsp.goodsId AND " +
                "GoodsInfo.id=GoodsTypeMap.goodsId AND " +
                "GoodsTypeMap.goodsTypeId=GoodsTypes.erpId AND " +
                "GoodsInfo.isDeleted=0 AND " +
                "GoodsTypeMap.isMain=true AND " +
                "GoodsInventory.onSell=1", "goodsSort");

            if (goodsTypeIds!=0) {
                whereStr += "AND GoodsTypes.erpId in (" + goodsTypeIds + ") ";
            }

            var sql = sprintf(SQL_CT_CUSTOMER_GOODS_SELECT,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                __goodsTopDays,
                whereStr,
                paginator.orderby(),
                paginator.limit()
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

        listCustomerGoodsUnavailable: function(customerDBName, goodsTypeIds, paginator, callback){
            logger.enter();

            var whereStr=paginator.where(
                "GoodsInfo.id=GoodsPrice.goodsId AND " +
                "GoodsInfo.id=GoodsInventory.goodsId AND " +
                "GoodsInfo.id=GoodsGsp.goodsId AND " +
                "GoodsInventory.onSell=0 AND " +
                "GoodsInfo.isDeleted=0 ", "goodsSort");

            var sql = sprintf(SQL_CT_CUSTOMER_GOODS_SELECT_UNAVAILABLE,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                customerDBName,
                __goodsTopDays,
                whereStr,
                paginator.orderby(),
                paginator.limit()
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

        /**
         * list goods
         *      find all goods data from database, specified by paginator
         * @param customerDBName
         * @param clientId
         * @param paginator
         * @param callback
         */
        //listAllGoods: function( customerDBName, clientId, paginator, callback) {
        //    logger.enter();
        //    logger.ndump("paginator", paginator);
        //
        //    var sql = sprintf(SQL_CT_ALL_GOODS_SELECT,
        //        customerDBName, customerDBName, customerDBName,
        //        customerDBName, customerDBName,__goodsTopDays,
        //        customerDBName,
        //        paginator.where(sprintf("ClientGoodsPrice.clientId=%d", clientId)),
        //        paginator.orderby(),
        //        paginator.limit());
        //
        //    logger.sql(sql);
        //
        //    __mysql.query(sql, function (err, results, fields) {
        //        logger.enter();
        //        if (err) {
        //            logger.error("error query: " + err + ", " + err.stack);
        //            callback(err)
        //        }else{
        //            callback(null, results);
        //        }
        //    });
        //},

        listOnSellGoods: function( customerDBName, IdObj, isOnSell, paginator, callback) {
            logger.enter();
            logger.ndump("paginator", paginator);
            logger.ndump("clientId", IdObj.clientId);
            var clientId=IdObj.clientId;//对象里面获取
            //由于该过滤只有customer才有权限操作,所以直接在if语句块里面加上 exclude Ids
            var sql;
            if (underscore.isUndefined(clientId)) {
                var whereStr=paginator.where(sprintf(
                    "GoodsInfo.id=GoodsPrice.goodsId AND " +
                    "GoodsInfo.id=GoodsInventory.goodsId AND " +
                    "GoodsInfo.id=GoodsGsp.goodsId AND " +
                    "GoodsInfo.id=GoodsTypeMap.goodsId AND " +
                    "GoodsTypeMap.goodsTypeId=GoodsTypes.erpId AND " +
                    "GoodsTypeMap.isMain=true AND " +
                    "GoodsInventory.onSell=%d AND " +
                    "GoodsInfo.isDeleted=0 ", isOnSell), "goodsSort");

                if (IdObj.goodsTypeIds&&IdObj.goodsTypeIds.length != 0) {
                    whereStr += "AND GoodsTypes.erpId in (" + IdObj.goodsTypeIds + ") ";
                }

                if(!underscore.isUndefined(IdObj.exculuedIds)){
                    whereStr+=" AND GoodsInfo.id not in ( " + IdObj.exculuedIds + " ) ";
                }

                sql = sprintf(SQL_CT_ALL_GUEST_GOODS_SELECT,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    __goodsTopDays,
                    whereStr,
                    paginator.orderby() + ",GoodsTypeMap.isMain DESC",
                    paginator.limit()
                );
            } else {
                var whereStr = paginator.where(
                            sprintf(
                                "GoodsInfo.id=GoodsTypeMap.goodsId AND " +
                                "GoodsTypeMap.goodsTypeId=GoodsTypes.erpId AND " +
                                "GoodsTypeMap.isMain=true AND " +
                                "GoodsInfo.id=GoodsPrice.goodsId AND " +
                                "GoodsInfo.id=GoodsInventory.goodsId AND " +
                                "GoodsGsp.goodsId = GoodsInfo.id AND " +
                                "ClientGoodsPrice.goodsId=GoodsInfo.id AND " +
                                "ClientGoodsPrice.clientId=%d AND " +
                                "GoodsInventory.onSell=%d AND " +
                                "GoodsInfo.isDeleted=0 ",
                                clientId, isOnSell), "goodsSort"
                        );
                if (IdObj.goodsTypeIds&&IdObj.goodsTypeIds.length!= 0) {
                    whereStr += "AND GoodsTypes.erpId in (" + IdObj.goodsTypeIds + ") ";
                }
                sql = sprintf(SQL_CT_ALL_GOODS_SELECT,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    __goodsTopDays,
                    whereStr,
                    paginator.orderby() + ",GoodsTypeMap.isMain DESC",
                    paginator.limit());
            }
            if(IdObj.goodsTypeIds&&IdObj.goodsTypeIds.length==0){
                    logger.fatal('查询商品必须要传入分类Id,请检查代码,你的代码有问题');
            }
            logger.sql(sql);
            __mysql.query(sql, function (err, results, fields) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    callback(null, results);
                }
            });
        },

        listGoodsByOrderId: function( customerDBName, orderId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_GOODS_SELECT_BY_ORDERID,
                customerDBName,
                customerDBName,
                customerDBName,
                orderId);

            logger.sql(sql);

            __mysql.query(sql, function (err, results, fields) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    callback(err)
                } else{
                    callback(null, results);
                }
            });
        },


        //select goods by ID
        getGoodsDetail: function (customerDBName, goodsId,clientId, callback) {
            var sql;
            //若clientId为undefined,是游客或者sm
            if(underscore.isUndefined(clientId)){
                logger.enter();
                    sql= sprintf(SQL_CT_SELECT_GUEST_GOODS_BY_ID,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    goodsId);
                logger.sql(sql);
            }else{
                //客户
                logger.enter();
                sql= sprintf(SQL_CT_SELECT_GOODS_BY_ID,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    customerDBName,
                    goodsId,clientId);
                logger.sql(sql);

            }
            __mysql.query(sql, function (err, results, fields) {
                logger.enter();
                if (err) {
                    logger.error("error query: " + err + ", " + err.stack);
                    throw  err;
                }
                callback(results[0]);
            });
        },

        getGoodsBasicPrice: function(customerDBName, goodsIdArray, callback){
            logger.enter();

            var goodsIdSetStr = "";
            for (var id in goodsIdArray)
                goodsIdSetStr += ","+goodsIdArray[id];
            if (goodsIdSetStr[0]==",")
                goodsIdSetStr = goodsIdSetStr.slice(1);

            var sql = sprintf( SQL_CT_GOODPRICE_SELECT,
                                customerDBName,
                                goodsIdSetStr);
            logger.sql(sql);

            __mysql.query(sql, function(err, results){
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

        //-------customer GoodsInfo-----//
        /**
         * meta operation to get the basic goods price info by goodsId
         * @param connect
         * @param customerDBName
         * @param goodsId
         * @param paginator
         * @param callback
         */
        addGoodsInfo: function(connect, customerDBName, goodsId, goodsBasicInfo, callback){
            logger.enter();
            goodsBasicInfo.licenseNo = goodsBasicInfo.filingNumber;
            goodsBasicInfo.filingNumber = undefined;

            //相比以前的代码更灵活的插入需要插入的字段

            logger.ndump("goodsBasicInfo", goodsBasicInfo);

            var data = parseInsertOnDuplicateInfo(goodsBasicInfo);
            var sql = sprintf(SQL_CT_INSERT_BATCH_GOODSINFO,
                customerDBName,data.keyStr,data.valueStr,data.updateStr);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else if (goodsId){
                    callback(null, goodsId);
                } else {
                    callback(null, result.insertId);

                }
            });
        },

        getGoodsGspType: function(connect,customerDBName,gspTypeName,callback){
            logger.enter();
            var sql = sprintf( 'select id as GspTypeId  from %s.GoodsGspType ' +
                'where  name = "%s";',customerDBName,gspTypeName);
            logger.sql(sql);
            connect.query(sql,function(err,result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        },

        //取出指定数据库的指定表名的所有FIELD值
        listFieldListInfo: function(connect,customerDBName,tableName, callback) {
            logger.enter();
            var sqlallField = sprintf("show full columns from  %s.%s;", customerDBName, tableName);
            logger.sql(sqlallField);
            connect.query(sqlallField, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    //取出所有的表格FIELD，过滤掉自动插入的创建日期，更新日期
                    var filed_list = underscore.pluck(result, 'Field').slice(0, -2);
                    callback(null, filed_list);
                }
            });
        },

        //从yiyao365批量插入数据时可考虑使用的方法
        batchAddGoodsBasicInfo: function(connect,customerDBName,goodsId,tableFieldList,goodsBasicInfo, callback){
            logger.enter();
            logger.debug(tableFieldList);
            var goodsInfoList = [];
                //用于字段的默认值调整和导入值的映射关系调整
                goodsInfoList.push(goodsId?goodsId.toString():"NULL");// id,
                goodsInfoList.push(goodsBasicInfo.guid?goodsBasicInfo.guid:"NULL");// guid,
                goodsInfoList.push(goodsBasicInfo.goodsTypeId?goodsBasicInfo.goodsTypeId:0);// goodsTypeId,
                goodsInfoList.push(goodsBasicInfo.goodsType?goodsBasicInfo.goodsType:"NULL");// goodsType
                goodsInfoList.push(goodsBasicInfo.goodsNo?goodsBasicInfo.goodsNo:"NULL");// goodsNo,
                goodsInfoList.push(goodsBasicInfo.barcode?goodsBasicInfo.barcode:"NULL");// barcode,
                goodsInfoList.push(goodsBasicInfo.isPrescriptionDrugs?goodsBasicInfo.isPrescriptionDrugs:1);// isPrescriptionDrugs,
                goodsInfoList.push(goodsBasicInfo.commonName?goodsBasicInfo.commonName:"NULL");// commonName,
                goodsInfoList.push(goodsBasicInfo.alias?goodsBasicInfo.alias:"NULL");// alias,
                goodsInfoList.push(goodsBasicInfo.filingNumber?goodsBasicInfo.filingNumber:"NULL");// licenseNo,
                goodsInfoList.push(goodsBasicInfo.filingNumberValidDate?goodsBasicInfo.filingNumberValidDate:"NULL");// filingNumberValidDate,
                goodsInfoList.push(goodsBasicInfo.spec?goodsBasicInfo.spec:"NULL");// spec,
                goodsInfoList.push(goodsBasicInfo.supplier?goodsBasicInfo.supplier:"NULL");// supplier,
                goodsInfoList.push(goodsBasicInfo.birthPlace?goodsBasicInfo.birthPlace:"NULL");// birthPlace,
                goodsInfoList.push(goodsBasicInfo.producer?goodsBasicInfo.producer:"NULL");// producer,
                goodsInfoList.push(goodsBasicInfo.measureUnit?goodsBasicInfo.measureUnit:"NULL");// measureUnit,
                goodsInfoList.push(goodsBasicInfo.imageUrl?goodsBasicInfo.imageUrl:"NULL");// imageUrl,
                goodsInfoList.push(goodsBasicInfo.largePackUnit?goodsBasicInfo.largePackUnit:"NULL");// largePackUnit,
                goodsInfoList.push(goodsBasicInfo.largePackNum?goodsBasicInfo.largePackNum:"NULL");// largePackNum,
                goodsInfoList.push(goodsBasicInfo.largePackBarcode?goodsBasicInfo.largePackBarcode:"NULL");// largePackBarcode,
                goodsInfoList.push(goodsBasicInfo.middlePackUnit?goodsBasicInfo.middlePackUnit:"NULL");// middlePackUnit,
                goodsInfoList.push(goodsBasicInfo.middlePackNum?goodsBasicInfo.middlePackNum:"NULL");// middlePackNum,
                goodsInfoList.push(goodsBasicInfo.middlePackBarcode?goodsBasicInfo.middlePackBarcode:"NULL");// middlePackBarcode,
                goodsInfoList.push(goodsBasicInfo.smallPackUnit?goodsBasicInfo.smallPackUnit:"NULL");// smallPackUnit,
                goodsInfoList.push(goodsBasicInfo.smallPackNum?goodsBasicInfo.smallPackNum:"NULL");// smallPackNum,
                goodsInfoList.push(goodsBasicInfo.smallPackBarcode?goodsBasicInfo.smallPackBarcode:"NULL");// smallPackBarcode,
                goodsInfoList.push(goodsBasicInfo.negSell?goodsBasicInfo.negSell:1);// negSell,
                goodsInfoList.push(goodsBasicInfo.isForbidden?goodsBasicInfo.isForbidden:0);// isForbidden,
                goodsInfoList.push(goodsBasicInfo.isDeleted?goodsBasicInfo.isDeleted:0);// isDeleted,
                goodsInfoList.push(goodsBasicInfo.isCheckStore?goodsBasicInfo.isCheckStore:0);// isCheckStore,
                goodsInfoList.push(goodsBasicInfo.isAreaLimited?goodsBasicInfo.isAreaLimited:"NULL");// isAreaLimited,
                goodsInfoList.push(goodsBasicInfo.areaDesc?goodsBasicInfo.areaDesc:"NULL");// areaDesc,
                goodsInfoList.push(goodsBasicInfo.clientDesc?goodsBasicInfo.clientDesc:"NULL");// clientDesc,
                goodsInfoList.push(goodsBasicInfo.goodsDetails?goodsBasicInfo.goodsDetails:"NULL");// goodsDetails,
                logger.debug(goodsInfoList);
                var data = parseBatchInsert(tableFieldList);
                var sql = sprintf(" Insert into %s.GoodsInfo (%s) VALUES ? " +
                    " ON DUPLICATE KEY UPDATE %s;",customerDBName,data.keys,data.values);
                logger.sql(sql);
                connect.query(sql,[[goodsInfoList]],function(err,result){
                    if (err) {
                        logger.sqlerr(err);
                        callback(err);
                    } else if (goodsId){
                        callback(null, goodsId);
                    } else {
                        logger.debug(result.insertId);
                        callback(null, result.insertId);
                    }
                });
        },

        addGoodsTypeMap: function(connect, customerDBName, goodsId, goodsTypeIds, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_GOODSTYPES,
                customerDBName
            );
            logger.sql(sql);

            var dataset = [];
            var isMain = 1;
            underscore.each(goodsTypeIds, function(goodsTypeId){
                dataset.push([Number(goodsId), Number(goodsTypeId), isMain]);
                if (isMain)
                    isMain = 0;
            });

            logger.ndump("dataset",dataset);

            connect.query(sql, [dataset], function(err, result){
               if (err) {
                   logger.sqlerr(err);
                   callback(err);
               } else {
                   callback(null, result.affectedRows);
               }
            });

        },

        clearUselessGoodsTypes: function(connect, customerDBName, goodsId, goodsTypeIds, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_REMOVE_OTHER_GOODSTYPES,
                customerDBName,
                goodsId,
                goodsTypeIds
            );

            logger.sql(sql);

            connect.query(sql, function(err,result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(null, result.affectedRows);
                }
            });

        },

        addGoodsGspById: function(connect,customerDBName,goodsId,goodsGsp,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_GOODSGSP,
                customerDBName,
                goodsId,
                goodsGsp.gmpNumber || "",
                goodsGsp.gmpCertificationDate || "",
                goodsGsp.gmpValidDate || "",
                goodsGsp.importRegisCertNum || "",
                goodsGsp.importRegisCertNumValidDate || "",
                goodsGsp.gspType || "",
                goodsGsp.registeredTradeMarksAndPatents || "",
                goodsGsp.drugAdministrationEncoding || "",
                //goodsGsp.drugsType || "",
                goodsGsp.drugsValidDate || "",
                goodsGsp.isNationalMedicine =="true"?1:0,
                goodsGsp.isMedicine  =="true"?1:0,
                goodsGsp.isHerbalDecoctioniieces =="true"?1:0,
                goodsGsp.isPregnancyRermination =="true"?1:0,
                goodsGsp.isPrescriptionDrugs =="true"?1:0,
                goodsGsp.isProteinasSimilationPreparation =="true"?1:0,
                goodsGsp.isContainPeptidehormone =="true"?1:0,
                goodsGsp.isContainSpecialContent =="true"?1:0,
                goodsGsp.isSecondPsychotropicDrugs =="true"?1:0,
                goodsGsp.isStupefacient =="true"?1:0,
                goodsGsp.isMedicalToxicity =="true"?1:0,
                goodsGsp.isVaccine =="true"?1:0,
                goodsGsp.isFood =="true"?1:0,
                goodsGsp.isImported =="true"?1:0,
                goodsGsp.isCheckMedicalInstrumentCert =="true"?1:0,
                goodsGsp.isHerbalMedicine =="true"?1:0,
                goodsGsp.isMedicalInsuranceDrugs =="true"?1:0,
                goodsGsp.isContainEphedrine =="true"?1:0,
                goodsGsp.isFirstPsychotropicDrugs =="true"?1:0,
                goodsGsp.isDiagnosticReagent =="true"?1:0,
                goodsGsp.isContainingStimulants =="true"?1:0,
                goodsGsp.isHealthProducts =="true"?1:0,
                goodsGsp.isHazardousChemicals =="true"?1:0
            );
            logger.sql(sql);
            /* start to query */
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err)
                }
                callback(err, results.insertId);
            });
        },

        /**
         * Import(if exists update, otherwise insert) goods info into GoodsInfo
         * @param connect
         * @param customerDBName
         * @param goodsInfo
         * @param callback
         */
        metaImportGoodsInfo: function(connect, customerDBName, goodsInfo, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_IMPORT_GOODSINFO, customerDBName);
            logger.sql(sql);

            connect.query(sql, [[goodsInfo]], function(err, result){
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err, result);
            });
        },

        /**
         * Import(if exists then update else insert) goods GSP into GoodsGsp
         * @param connect
         * @param customerDBName
         * @param goodsGsp
         * @param callback
         */
        metaImportGoodsGsp: function(connect, customerDBName, goodsGsp, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_IMPORT_GOODSGSP,customerDBName);
            logger.sql(sql);

            connect.query(sql, [[goodsGsp]], function(err, results) {
                if (err){
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err, results.insertId);
                }
            });
        },

        //建对应goodsId的空表
        addGoodsPriceById: function(connect,customerDBName,goodsId,limitedPrice,wholesalePrice,
                                    refRetailPrice,price1,price2,price3,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_GOODSPRICE,
                customerDBName,
                goodsId,
                limitedPrice,
                wholesalePrice,
                refRetailPrice,
                price1,
                price2,
                price3);
            logger.sql(sql);

            /* start to query */
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err,results.insertId || {});
            });
        },
        //查询对应goodsId的商品的库存以及商品的零售价，批发价，价一，价二，价三
        getOldGoodsInventoryById: function(connect,customerDBName,goodsId,callback){
            logger.enter();
            var SQL_CT_CHECK_GOODS_INVENTORY = "" +
                "SELECT GoodsPrice.wholesalePrice," +
                "       GoodsPrice.refRetailPrice," +
                "       GoodsPrice.price1," +
                "       GoodsPrice.price2," +
                "       GoodsPrice.price3," +
                "       GoodsInventory.actualAmount " +
                "FROM %s.GoodsPrice,%s.GoodsInventory " +
                "WHERE GoodsPrice.goodsId=%d AND GoodsInventory.goodsId=%d;";
            var sql = sprintf(SQL_CT_CHECK_GOODS_INVENTORY, customerDBName, customerDBName, goodsId, goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err, results);
            });
        },
        //查询对应goodsId的商品的库存以及商品的零售价，批发价，价一，价二，价三
        getOldGoodsInventoryByIdNoConnect: function(customerDBName,goodsId,callback){
            logger.enter();
            var SQL_CT_CHECK_GOODS_INVENTORY = "" +
                "SELECT GoodsPrice.wholesalePrice," +
                "       GoodsPrice.refRetailPrice," +
                "       GoodsPrice.price1," +
                "       GoodsPrice.price2," +
                "       GoodsPrice.price3," +
                "       GoodsInventory.actualAmount " +
                "FROM %s.GoodsPrice,%s.GoodsInventory " +
                "WHERE GoodsPrice.goodsId=%d AND GoodsInventory.goodsId=%d;";
            var sql = sprintf(SQL_CT_CHECK_GOODS_INVENTORY, customerDBName, customerDBName, goodsId, goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err, results);
            });
        },

        //建对应goodsId的空表
        addGoodsInventoryById: function(connect,customerDBName,goodsId,inventory,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_INSERT_GOODSINVENTORY,
                customerDBName,
                goodsId,
                inventory.goodsBatchTime || "",
                inventory.showPlanId || 0,
                inventory.isSplit || 0,
                inventory.onSell || 0
            );
            logger.sql(sql);
            /* start to query */
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err, results.insertId);
            });
        },

        /**
         * 根据商品id获取所有的GoodsTypeId列表
         * @param customerDBName
         * @param goodsId
         * @param callback
         */
        listGoodsTypesById: function(customerDBName, goodsId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_GOODSTYPES_BY_GOODSID_SELECT,
                customerDBName,
                customerDBName,
                goodsId
            );
            logger.sql(sql);

            __mysql.query(sql, function(err, results){
                if (err){
                    logger.sqlerr(err);
                }
                callback(err, results);
            });
        },

        //根据goodsId取出商品基本信息
        listGoodsBasicInfoById: function(customerDBName,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_BASIC_INFO_SELECT_BY_ID,customerDBName,goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                }else{
                    callback(err,results);
                }
            });
        },
        //根据goodsId取出商品价格信息
        listGoodsPriceInfoById: function(customerDBName,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODPRICE_SELECT_BY_ID,customerDBName,goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr()
                    throw  err;
                }
                callback(results);
            });
        },
        //根据goodsId取出商品库存信息
        listGoodsInventoryInfoById: function(customerDBName,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODINVENTORY_SELECT_BY_ID,customerDBName,customerDBName,goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    throw  err;
                }
                callback(results);
            });
        },
        //根据goodsId取出商品gsp信息（包括标志信息）
        listGoodsGspInfoById: function(customerDBName,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODSGSP_SELECT_BY_ID,customerDBName,goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    throw  err;
                }
                callback(results);
            });
        },
        //根据goodsId更新商品基本信息
        updateGoodsInfoById : function(connect, goodsId, customerDBName,goodsNo, barcode, commonName, producer,spec,filingNumberValidDate,imageUrl,areaDesc,goodsDetails, alias, birthPlace, measureUnit, largePackUnit, largePackNum, middlePackUnit, middlePackNum, smallPackUnit, smallPackNum, callback){
            logger.enter();

            var largePackNum = Number(largePackNum);
            var middlePackNum=Number(middlePackNum);
            var smallPackNum=Number(smallPackNum);
            var goodsId=Number(goodsId);

            var sql = sprintf(SQL_CT_GOODSINFO_UPDATE_BY_ID,
                customerDBName,goodsNo, barcode, commonName, producer,spec,
                filingNumberValidDate,imageUrl,areaDesc,goodsDetails, alias,
                birthPlace, measureUnit, largePackUnit, largePackNum, middlePackUnit,
                middlePackNum, smallPackUnit, smallPackNum, goodsId);
            logger.sql(sql);

            connect.query(sql, function (err, results) {
                if(err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results.affectedRows);
                }
            });
        },


        updateGoodsInfo : function(customerDBName,updateInfo,goodsId,callback){
            logger.enter();
            var goodsNewInfo = parseUpdateInfo(updateInfo);
            var sql = sprintf(SQL_CT_GOODS_UPDATE_BY_ID,customerDBName,goodsNewInfo,goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });
        },
        //根据goodsId更新商品基本GSP信息
        updateGoodsBasicGspById : function(connect, customerDBName,filingNumberValidDate,goodsId,callback){
            logger.enter();

            var sql = sprintf(SQL_CT_GOODSGSP_BASIC_UPDATE_BY_ID,customerDBName,filingNumberValidDate,goodsId);
            logger.sql(sql);
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err, results);
            });
        },

        //根据goodsId更新商品价格信息
        updateGoodsPriceById : function(customerDBName,limitedPrice,wholesalePrice,refRetailPrice,price1,price2,price3,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_PRICE_UPDATE_BY_ID,customerDBName,limitedPrice,wholesalePrice,refRetailPrice,price1,price2,price3,goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)  ;
                }else {
                    callback(err, results.affectedRows);
                }
            });
        },
        //根据goodsId更新商品库存信息
        updateGoodsInventoryById : function(customerDBName,goodsInventoryData,goodsId,callback){
            logger.enter();
            logger.ndump("goodsInventoryData = " + goodsInventoryData);
            var goodsInventoryInfo = parseUpdateInfo(goodsInventoryData);
            logger.ndump("goodsInventoryInfo = " + goodsInventoryInfo);
            var sql = sprintf(SQL_CT_GOODS_INVENTORY_UPDATE_BY_ID,customerDBName,goodsInventoryInfo,goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                   logger.sqlerr(err);
                   callback(err);
                }else{
                    callback(err,results.affectedRows);
                }
            });
        },
        //根据goodsId更新商品负库存销售标志
        updateGoodsNegSellById : function(customerDBName,negSell,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_NEGSELL_UPDATE_BY_ID,customerDBName,negSell,goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err, results.affectedRows);
                }
            });
        },


        metaUpdateGoodsNegSellById : function(connect,customerDBName,negSell,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_NEGSELL_UPDATE_BY_ID,customerDBName,negSell,goodsId);
            logger.sql(sql);
            connect.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err, results.affectedRows);
                }
            });
        },
        //根据goodsId更新商品gsp文字信息
        updateGoodsGspById : function(customerDBName,gspData,goodsId,callback){
            logger.enter();
            logger.trace(JSON.stringify(gspData));
            var sql = sprintf(SQL_CT_GOODS_GSPDATA_UPDATE_BY_ID,
                customerDBName,
                gspData.gmpNumber,
                gspData.gmpCertificationDate,
                gspData.gmpValidDate,
                gspData.importRegisCertNum,
                gspData.importRegisCertNumValidDate,
                gspData.gspType,
                gspData.registeredTradeMarksAndPatents,
                gspData.drugAdministrationEncoding,
                gspData.drugsValidDate,
                goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(err, results);
                }
            });
        },

        //根据goodsId更新商品销售标志
        updateGoodsMarksById : function(customerDBName,marksData,goodsId,callback){
            logger.enter();
            var sql = sprintf(SQL_CT_GOODS_MARKS_UPDATE_BY_ID,
                customerDBName,
                       marksData.isNationalMedicine==="true"?1:0,//国家基本药物标志
                       marksData.isMedicine==="true"?1:0,//药品标志
                       marksData.isHerbalDecoctioniieces==="true"?1:0, //中药饮片标志
                       marksData.isPregnancyRermination==="true"?1:0, //终止妊娠品标志
                       marksData.isPrescriptionDrugs==="true"?1:0, //处方药标志
                       marksData.isProteinasSimilationPreparation==="true"?1:0, //蛋白同化制剂标志
                       marksData.isContainPeptidehormone==="true"?1:0, //含肽类激素标志
                       marksData.isContainSpecialContent==="true"?1:0, //含特药品标志
                       marksData.isSecondPsychotropicDrugs==="true"?1:0, //二类精神药品标志
                       marksData.isStupefacient==="true"?1:0, //麻醉药品标志
                       marksData.isMedicalToxicity==="true"?1:0, //医疗用毒性品标志
                       marksData.isVaccine==="true"?1:0, //疫苗标志
                       marksData.isFood==="true"?1:0, //食品标志
                       marksData.isImported==="true"?1:0, //进口标志
                       marksData.isCheckMedicalInstrumentCert==="true"?1:0, //需检查医疗器械证标志
                       marksData.isHerbalMedicine==="true"?1:0, //中药材标志
                       marksData.isContainSpecialContent==="true"?1:0, //含特药标志
                       marksData.isMedicalInsuranceDrugs==="true"?1:0, //医保标志
                       marksData.isContainEphedrine==="true"?1:0, //含麻黄碱标志
                       marksData.isFirstPsychotropicDrugs==="true"?1:0, //一类精神药品标志
                       marksData.isDiagnosticReagent==="true"?1:0, //诊断试剂
                       marksData.isContainingStimulants==="true"?1:0, //含兴奋剂药品标志
                       marksData.isHealthProducts==="true"?1:0, //保健品标志
                       marksData.isHazardousChemicals==="true"?1:0, //危险化学品标志
                       goodsId);
            logger.sql(sql);
            __mysql.query(sql, function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                }
                callback(err, results);
            });
        },

        //批量更新商品上下架
        updateMutiOnSell: function(customerDBName,updateGoods,onSellstatus,callback){
            logger.enter();
            onSellstatus = onSellstatus=="true"?1:0;
            var sql = sprintf(SQL_CT_UPDATEMUTIGOODS_ONSELL,customerDBName,onSellstatus);
            logger.sql(sql);
            __mysql.query(sql, [[updateGoods]],function (err, results) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                }else{
                    callback(null,results.affectedRows);
                }
            });

        },

        /**
         * 按照GoodsId加载所有的客户价格
         * @param customerDBName
         * @param goodsId
         * @param callback
         */
        listClientPriceByGoodsId: function(customerDBName, goodsId,clientName, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTPRICE_SELECT, customerDBName, customerDBName, customerDBName, goodsId,clientName);
            logger.sql(sql);
            __mysql.query(sql, function(err,results){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err,results);
                }
            });
        },

        /**
         * 新增客户单品价格
         * @param customerDBName
         * @param clientId
         * @param goodsId
         * @param price
         * @param callback
         */
        goodsAddClientPrice: function(customerDBName, clientId, goodsId, price, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTPRICE_INSERT, customerDBName, clientId, goodsId, price);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },

        /**
         * Delete a client price row
         * @param customerDBName
         * @param clientId
         * @param goodsId
         * @param callback
         */
        goodsDeleteClientPrice: function(customerDBName, clientId, goodsId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTPRICE_DELETE, customerDBName, clientId, goodsId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },

        goodsUpdateClientPrice: function(customerDBName, price, clientId, goodsId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTPRICE_UPDATE, customerDBName, price, clientId, goodsId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result) {
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },

        listClientCategoryPriceByGoodsId: function(customerDBName,goodsId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_CATEGORYPRICE_SELECT, customerDBName, customerDBName, goodsId);
            logger.sql(sql);
            __mysql.query(sql, function(err, results) {
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, results);
                }
            });
        },

        goodsAddClientCategoryPrice: function(customerDBName, goodsId, clientCategoryId, price, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTCATEGORYPRICE_INSERT, customerDBName, clientCategoryId, goodsId, price);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },

        goodsClientCategoryPriceDelete: function(customerDBName,clientCategoryId, goodsId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTCATEGORYPRICE_DELETE, customerDBName, clientCategoryId, goodsId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },
        goodsClientCategoryPriceUpdate: function(customerDBName, price, clientCategoryId, goodsId, callback){
            logger.enter();
            var sql = sprintf(SQL_CT_CLIENTCATEGORYPRICE_UPDATE, customerDBName, price, clientCategoryId, goodsId);
            logger.sql(sql);
            __mysql.query(sql, function(err, result){
                if (err){
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },

        goodsIdRetrieveByGoodsNo: function (customerDbName, goodsNo, callback) {
            var sql = '' +
                'select ' +
                '   id as goodsId, ' +
                '   goodsNo as goodsNo ' +
                'from ' +
                '   %s.GoodsInfo ' +
                'where ' +
                '   goodsNo = "%s";';
            sql = sprintf(sql, customerDbName, goodsNo);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },

        insertGoodsGspTypes: function (customerDbName, goodsGspTypesArr, callback) {
            var  sql = "" +
                "insert into %s.GoodsGspType(erpId, name, HelpCode) values ? " +
                "on duplicate key update " +
                "name = values(name)," +
                "HelpCode = values(HelpCode)" ;
            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            __mysql.query(sql, [goodsGspTypesArr], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        updateGoodsInfoWithErpUpdatedOn: function (customerDbName, erpUpdateTimeData, callback) {
            var sql = "" +
                "INSERT INTO " +
                "   %s.GoodsInfo ( " +
                "       guid, " +
                "       erpUpdatedOn) " +
                "VALUES ? " +
                "ON DUPLICATE KEY UPDATE " +
                "   erpUpdatedOn = VALUES(erpUpdatedOn); ";

            sql = sprintf(sql, customerDbName);
            logger.sql(sql);

            __mysql.query(sql, [erpUpdateTimeData], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },

        retrieveGoodsGuidNeedToSync: function (customerDbName, callback) {
            var sql = "SELECT guid FROM %s.GoodsInfo WHERE erpUpdatedOn > IFNULL(lastAsyncTime,0) ;";
            sql = sprintf(sql, customerDbName);
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },
        transactionInsertGoodsInfo: function (connection, customerDbName, insertObj, callback) {
            var sql = " INSERT INTO %s.GoodsInfo (" +
                "   guid," +
                "   unicode," +
                "   packageQty," +
                "   goodsNo," +
                "   barcode," +

                "   commonName," +
                "   alias, " +
                "   drugsType," +
                "   licenseNo," +
                "   filingNumberValidDate," +

                "   spec," +
                "   supplier," +
                "   birthPlace," +
                "   producer," +
                "   measureUnit," +

                "   largePackUnit," +
                "   largePackNum," +
                "   largePackBarcode," +
                "   middlePackUnit," +
                "   middlePackNum," +

                "   middlePackBarcode," +
                "   smallPackUnit," +
                "   smallPackNum," +
                "   negSell," +
                "   isForbidden," +

                "   isDeleted," +
                "   isCheckStore," +
                "   areaDesc," +
                "   isAreaLimited," +
                "   lastAsyncTime ) " +
                "VALUES ? " +
                "ON DUPLICATE KEY UPDATE " +
                "   guid=VALUES(guid)," +
                "   unicode=VALUES(unicode)," +
                "   packageQty=VALUES(packageQty)," +
                "   goodsNo=VALUES(goodsNo)," +
                "   barcode=VALUES(barcode)," +

                "   commonName=VALUES(commonName)," +
                "   alias=VALUES(alias)," +
                "   drugsType=VALUES(drugsType)," +
                "   licenseNo=VALUES(licenseNo)," +
                "   filingNumberValidDate=VALUES(filingNumberValidDate)," +

                "   spec=VALUES(spec)," +
                "   supplier=VALUES(supplier)," +
                "   birthPlace=VALUES(birthPlace)," +
                "   producer=VALUES(producer)," +
                "   measureUnit=VALUES(measureUnit)," +

                "   largePackUnit=VALUES(largePackUnit)," +
                "   largePackNum=VALUES(largePackNum)," +
                "   largePackBarcode=VALUES(largePackBarcode)," +
                "   middlePackUnit=VALUES(middlePackUnit)," +
                "   middlePackNum=VALUES(middlePackNum)," +


                "   middlePackBarcode=VALUES(middlePackBarcode)," +
                "   smallPackUnit=VALUES(smallPackUnit)," +
                "   smallPackNum=VALUES(smallPackNum)," +
                "   negSell=VALUES(negSell)," +
                "   isForbidden=VALUES(isForbidden)," +

                "   isDeleted=VALUES(isDeleted)," +
                "   isCheckStore=VALUES(isCheckStore)," +
                "   isAreaLimited=VALUES(isAreaLimited)," +
                "   areaDesc=VALUES(areaDesc)," +
                "   lastAsyncTime=VALUES(lastAsyncTime);";

            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            connection.query(sql, [insertObj], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },

        retrieveGoodsIdByGuid: function (customerDbName, guidOfGoodsWillSync, callback) {
            logger.enter();
            var sql = 'select guid,id from %s.GoodsInfo where guid in (%s);';
            sql = sprintf(sql, customerDbName, guidOfGoodsWillSync);
            logger.sql(sql);

            __mysql.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },

        transactionInsertGoodsGsp: function (connection, customerDbName, insertObj, callback) {
            logger.enter();

            var sql = " INSERT INTO %s.GoodsGsp " +
                " (" +
                "   goodsId," +
                "   guid," +
                "   gmpNumber," +
                "   gmpCertificationDate," +
                "   gmpValidDate," +

                "   filingNumber," +
                "   filingNumberValidDate," +
                "   importRegisCertNum," +
                "   importRegisCertNumValidDate," +
                "   drugsValidDate," +

                "   storageCondition," +
                "   gspType, " +
                "	registeredTradeMarksAndPatents, " +
                "   businessLicenseValidDate, " +
                "	instrumentProductionLicenseNum, " +

                "	drugAdministrationEncoding, " +
                "   isMedicalApparatus, " +
                "	isMedicine, " +
                "	isImported, " +
                "	isHerbalDecoctioniieces, " +

                "   isCheckMedicalInstrumentCert, " +
                "	isPregnancyRermination, " +
                "	isHerbalMedicine, " +
                "   isContainSpecialContent, " +
                "	isPrescriptionDrugs, " +

                "	isMedicalInsuranceDrugs, " +
                "   isProteinasSimilationPreparation, " +
                "	isContainEphedrine, " +
                "	isContainPeptidehormone, " +
                "   isSecondPsychotropicDrugs, " +

                "	isFirstPsychotropicDrugs, " +
                "	isHazardousChemicals, " +
                "   isStupefacient, " +
                "	isDiagnosticReagent, " +
                "	isMedicalToxicity, " +

                "	isContainingStimulants, " +
                "   isVaccine, " +
                "	isHealthProducts, " +
                "	isFood) " +

                "VALUES ? " +
                " ON DUPLICATE KEY UPDATE " +
                "	guid=VALUES(guid), " +
                "	gmpNumber=VALUES(gmpNumber), " +
                "   gmpCertificationDate=VALUES(gmpCertificationDate), " +
                "	gmpValidDate=VALUES(gmpValidDate), " +

                "	filingNumber=VALUES(filingNumber), " +
                "   filingNumberValidDate=VALUES(filingNumberValidDate), " +
                "	importRegisCertNum=VALUES(importRegisCertNum), " +
                "   importRegisCertNumValidDate=VALUES(importRegisCertNumValidDate), " +
                "	drugsValidDate=VALUES(drugsValidDate), " +

                "   storageCondition=VALUES(storageCondition), " +
                "	gspType=VALUES(gspType), " +
                "	registeredTradeMarksAndPatents=VALUES(registeredTradeMarksAndPatents), " +
                "   businessLicenseValidDate=VALUES(businessLicenseValidDate), " +
                "	instrumentProductionLicenseNum=VALUES(instrumentProductionLicenseNum), " +

                "   drugAdministrationEncoding=VALUES(drugAdministrationEncoding), " +
                "	isMedicalApparatus=VALUES(isMedicalApparatus), " +
                "   isMedicine=VALUES(isMedicine), " +
                "	isImported=VALUES(isImported), " +
                "	isHerbalDecoctioniieces=VALUES(isHerbalDecoctioniieces), " +

                "   isCheckMedicalInstrumentCert=VALUES(isCheckMedicalInstrumentCert), " +
                "	isPregnancyRermination=VALUES(isPregnancyRermination), " +
                "	isHerbalMedicine=VALUES(isHerbalMedicine), " +
                "   isContainSpecialContent=VALUES(isContainSpecialContent), " +
                "	isPrescriptionDrugs=VALUES(isPrescriptionDrugs), " +

                "	isMedicalInsuranceDrugs=VALUES(isMedicalInsuranceDrugs), " +
                "   isProteinasSimilationPreparation=VALUES(isProteinasSimilationPreparation), " +
                "	isContainEphedrine=VALUES(isContainEphedrine), " +
                "	isContainPeptidehormone=VALUES(isContainPeptidehormone), " +
                "   isSecondPsychotropicDrugs=VALUES(isSecondPsychotropicDrugs), " +

                "	isFirstPsychotropicDrugs=VALUES(isFirstPsychotropicDrugs), " +
                "	isHazardousChemicals=VALUES(isHazardousChemicals), " +
                "   isStupefacient=VALUES(isStupefacient), " +
                "	isDiagnosticReagent=VALUES(isDiagnosticReagent), " +
                "	isMedicalToxicity=VALUES(isMedicalToxicity), " +

                "	isContainingStimulants=VALUES(isContainingStimulants), " +
                "   isVaccine=VALUES(isVaccine), " +
                "	isHealthProducts=VALUES(isHealthProducts), " +
                "	isFood=VALUES(isFood);";

            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            connection.query(sql, [insertObj], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        },

        transactionInsertGoodsPrice: function (connection, customerDbName, insertObj, callback) {
            logger.enter();

            var sql = " INSERT INTO %s.GoodsPrice " +
                " (" +
                "   goodsId," +
                "   guid," +
                "   wholesalePrice," +
                "   refRetailPrice," +
                "   price1, " +

                "   price2," +
                "   price3," +
                "   limitedPrice," +
                "   basePrice," +
                "   provinceBasePrice," +

                "   guidedBasePrice) " +
                "VALUES ? " +
                " ON DUPLICATE KEY UPDATE " +
                "   guid=VALUES(guid)," +
                "   wholesalePrice=VALUES(wholesalePrice)," +
                "   refRetailPrice=VALUES(refRetailPrice)," +
                "   price1=VALUES(price1), " +

                "   price2=VALUES(price2)," +
                "   price3=VALUES(price3)," +
                "   limitedPrice=VALUES(limitedPrice)," +
                "   basePrice=VALUES(basePrice)," +
                "   provinceBasePrice=VALUES(provinceBasePrice)," +
                "   guidedBasePrice=VALUES(guidedBasePrice);";
            sql = sprintf(sql, customerDbName);
            logger.sql(sql);
            connection.query(sql, [insertObj], function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
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



    return dbService;
}