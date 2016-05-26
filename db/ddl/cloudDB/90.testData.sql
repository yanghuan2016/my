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
 *
 * 仅用于测试的数据
 * ERP 消息接口地址:	 http://erptest.romenscd.cn:8056/ClientHandler.ashx
 * ERP APPCODE 接口地址:http://erptest.romenscd.cn:8056/appCodeHandler.ashx
 * --------------------------------------------------------------
 * 2015-09-20	hc-romens@issue#23	增加测试商户customer
 *
 */

START TRANSACTION;

INSERT INTO Customer (
    id,             customerName,           enterpriseType,             customerDBSuffix,           hasPortal,
    subDomain,      siteName,               description,                businessLicense,            businessLicenseValidateDate,
    businessAddress,legalRepresentative,    stampLink,                  erpIsAvailable,             erpMsgUrl,
    erpAppCodeUrl,  appKey  ) VALUES (
    2,              "神木医药网SellerTest",            "SELLER",                   "127_0_0_1",                true,
    "127.0.0.1",    "雨人供应链协同平台©2015", "新疆神木药业股份有限公司",   "6224271561510",            "2100-01-01",
    "兰州市安宁区莫高大道35号","段保华",          "/static/img/stampls/shenmu.png", true,    "http://erptest.romenscd.cn:8057/ClientHandler.ashx",
    "http://erptest.romenscd.cn:8057/appCodeHandler.ashx",    "2ca8d935c78897bfdc02ef29c4dfd42e");
/***
INSERT INTO Customer (
    id,             customerName,           enterpriseType,             customerDBSuffix,           hasPortal,
    subDomain,      siteName,               description,                businessLicense,            businessLicenseValidateDate,
    businessAddress,legalRepresentative,    stampLink) VALUES (
    3,              "ERP测试buyer1",          "BUYER",                    "buyer1",                   true,
    "buyer1",       "bb©️2015",             "bb企业测试账号",             "65290001111111",             "2100-01-01",
    "新疆阿克苏地区阿克苏纺织工业城（开发区)温州路2号",    "测试法人2",    "/static/img/stampls/shenmu.png"
    );
INSERT INTO Customer (
    id,             customerName,           enterpriseType,             customerDBSuffix,           hasPortal,
    subDomain,      siteName,               description,                businessLicense,            businessLicenseValidateDate,
    businessAddress,legalRepresentative,    stampLink,                  erpIsAvailable,             erpMsgUrl,
    erpAppCodeUrl,  appKey
    ) VALUES (
    4,              "ERP测试buyer2",          "BUYER",                    "buyer2",                   true,
    "buyer2",       "bb©️2015",                 "bb企业测试账号",             "62010000000004",         "2100-01-01",
    "新疆阿克苏地区阿克苏纺织工业城（开发区)温州路2号",    "测试法人2",    "/static/img/stampls/shenmu.png",   true,      "http://erptest.romenscd.cn:8056/ClientHandler.ashx",
    "http://erptest.romenscd.cn:8056/appCodeHandler.ashx",    "12345678901234567890123456789012" );
INSERT INTO Customer (
    id,             customerName,           enterpriseType,             customerDBSuffix,           hasPortal,
    subDomain,      siteName,               description,                businessLicense,            businessLicenseValidateDate,
    businessAddress,legalRepresentative,    stampLink
    ) VALUES	 (
    5,              "ERP测试buyer3",          "BUYER",                   "buyer3",                   true,
    "buyer3",       "bb©️2015",                 "bb企业测试账号",          "65290003333333",          "2100-01-01",
    "新疆阿克苏地区阿克苏纺织工业城（开发区)温州路2号",    "测试法人2",    "/static/img/stampls/shenmu.png");
***/
/*
*短信网关测试数据
*/

INSERT INTO AvailableSMS (name,version,encoding,signMethod,baseUrl,smsPath,imgUrl)
    VALUES( "短信宝","v.1.0","UTF-8","MD5","api.smsbao.com","/sms?","http://7xp70i.com1.z0.glb.clouddn.com/cdromens%2Fstatic%2Fduanxinbao.png");
INSERT INTO AvailableSMS (name,version,encoding,signMethod,baseUrl,smsPath,imgUrl)
    VALUES( "中电","v.1.0","UTF-8","MD5","api.smsbao.com","/sms?","http://7xp70i.com1.z0.glb.clouddn.com/cdromens%2Fstatic%2Fzhongdianyunji.png");
INSERT INTO AvailableSMS (name,version,encoding,signMethod,baseUrl,smsPath,imgUrl)
    VALUES( "SMS","v.1.0","UTF-8","MD5","api.smsbao.com","/sms?","http://7xp70i.com1.z0.glb.clouddn.com/cdromens%2Fstatic%2Fsms.jpg");

COMMIT;