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
 * --------------------------------------------------------------
 * 2015-09-15	hc-romens@issue#17	增加operator
 *
 */
START TRANSACTION;

INSERT INTO Operator (username, password, operatorName, operatorType, customerId, mobileNum, citizenIdNum, operatorRoles) VALUES("smcd", "pbkdf2$10000$fe903108a6ef167a866d31952d22c6fa1ed8bbd3a3203a3f2ecbd632e4c4069957226d10e544eeeef713f37d64351264e38af13350e77773c769f1ac216b110d$1607d6c2cbc93ece28eafb42eedfef7055ab7da370e0e95db02072690e106d2320276f914606f508908fb16983be24711160c24e406838e6bd8458c9ed892ac2", "操作员:smcd","CUSTOMER", 1, "18030700160","123456789012345678",'["FP_VIEW_OPERATOR", "FP_MANAGE_OPERATOR", "FP_VIEW_CLIENT", "FP_APPROVE_CLIENT", "FP_VIEW_GOODS", "FP_SALE_GOODS", "FP_PRICE_GOODS", "FP_INVENTORY_GOODS", "FP_NEW_GOODS", "FP_VIEW_PRICE", "FP_APPROVE_PRICE", "FP_VIEW_ORDER", "FP_VIEW_REJECT", "FP_VIEW_RETURN", "FP_APPROVE_ORDER", "FP_APPROVE_RETURN", "FP_SHIP_ORDER", "FP_RECEIVE_REJECT", "FP_RECEIVE_RETURN", "FP_MANAGE_CAROUSEL", "FP_MANAGE_NEWS", "FP_MANAGE_SHOPWINDOW", "FP_MANAGE_FOOTER", "FP_MANAGE_GOODSTYPE", "FP_MANAGE_INVENTORYDISPLAY", "FP_MANAGE_CLIENTCATEGORY", "FP_MANAGE_BASIC_OPTION", "FP_VIEW_LOG", "FP_MANAGE_GSP_OPTION"]');
INSERT INTO Operator (username, password, operatorName, operatorType, customerId, mobileNum, citizenIdNum, operatorRoles) VALUES("sm127","pbkdf2$10000$fe903108a6ef167a866d31952d22c6fa1ed8bbd3a3203a3f2ecbd632e4c4069957226d10e544eeeef713f37d64351264e38af13350e77773c769f1ac216b110d$1607d6c2cbc93ece28eafb42eedfef7055ab7da370e0e95db02072690e106d2320276f914606f508908fb16983be24711160c24e406838e6bd8458c9ed892ac2", "操作员:sm127","CUSTOMER", 2, "18030700160","123456789012345678",'["FP_VIEW_OPERATOR", "FP_MANAGE_OPERATOR", "FP_VIEW_CLIENT", "FP_APPROVE_CLIENT", "FP_VIEW_GOODS", "FP_SALE_GOODS", "FP_PRICE_GOODS", "FP_INVENTORY_GOODS", "FP_NEW_GOODS", "FP_VIEW_PRICE", "FP_APPROVE_PRICE", "FP_VIEW_ORDER", "FP_VIEW_REJECT", "FP_VIEW_RETURN", "FP_APPROVE_ORDER", "FP_APPROVE_RETURN", "FP_SHIP_ORDER", "FP_RECEIVE_REJECT", "FP_RECEIVE_RETURN", "FP_MANAGE_CAROUSEL", "FP_MANAGE_NEWS", "FP_MANAGE_SHOPWINDOW", "FP_MANAGE_FOOTER", "FP_MANAGE_GOODSTYPE", "FP_MANAGE_INVENTORYDISPLAY", "FP_MANAGE_CLIENTCATEGORY", "FP_MANAGE_BASIC_OPTION", "FP_VIEW_LOG", "FP_MANAGE_GSP_OPTION"]');
INSERT INTO Operator (username, password, operatorName, operatorType, customerId,clientId, mobileNum, citizenIdNum, operatorRoles) VALUES("buyer1", "pbkdf2$10000$fe903108a6ef167a866d31952d22c6fa1ed8bbd3a3203a3f2ecbd632e4c4069957226d10e544eeeef713f37d64351264e38af13350e77773c769f1ac216b110d$1607d6c2cbc93ece28eafb42eedfef7055ab7da370e0e95db02072690e106d2320276f914606f508908fb16983be24711160c24e406838e6bd8458c9ed892ac2", "bb操作员:buyer1","CLIENT", 3,1, "18030222222","1234567890987654321",'["FP_VIEW_OPERATOR", "FP_MANAGE_OPERATOR", "FP_VIEW_CLIENT", "FP_APPROVE_CLIENT", "FP_VIEW_GOODS", "FP_SALE_GOODS", "FP_PRICE_GOODS", "FP_INVENTORY_GOODS", "FP_NEW_GOODS", "FP_VIEW_PRICE", "FP_APPROVE_PRICE", "FP_VIEW_ORDER", "FP_VIEW_REJECT", "FP_VIEW_RETURN", "FP_APPROVE_ORDER", "FP_APPROVE_RETURN", "FP_SHIP_ORDER", "FP_RECEIVE_REJECT", "FP_RECEIVE_RETURN", "FP_MANAGE_CAROUSEL", "FP_MANAGE_NEWS", "FP_MANAGE_SHOPWINDOW", "FP_MANAGE_FOOTER", "FP_MANAGE_GOODSTYPE", "FP_MANAGE_INVENTORYDISPLAY", "FP_MANAGE_CLIENTCATEGORY", "FP_MANAGE_BASIC_OPTION", "FP_VIEW_LOG","FP_MANAGE_GSP_OPTION"]');
INSERT INTO Operator (username, password, operatorName, operatorType, customerId,clientId, mobileNum, citizenIdNum, operatorRoles) VALUES("buyer2", "pbkdf2$10000$fe903108a6ef167a866d31952d22c6fa1ed8bbd3a3203a3f2ecbd632e4c4069957226d10e544eeeef713f37d64351264e38af13350e77773c769f1ac216b110d$1607d6c2cbc93ece28eafb42eedfef7055ab7da370e0e95db02072690e106d2320276f914606f508908fb16983be24711160c24e406838e6bd8458c9ed892ac2", "bb操作员:buyer2","CLIENT", 4,2, "18030222222","1234567890987654321",'["FP_VIEW_OPERATOR", "FP_MANAGE_OPERATOR", "FP_VIEW_CLIENT", "FP_APPROVE_CLIENT", "FP_VIEW_GOODS", "FP_SALE_GOODS", "FP_PRICE_GOODS", "FP_INVENTORY_GOODS", "FP_NEW_GOODS", "FP_VIEW_PRICE", "FP_APPROVE_PRICE", "FP_VIEW_ORDER", "FP_VIEW_REJECT", "FP_VIEW_RETURN", "FP_APPROVE_ORDER", "FP_APPROVE_RETURN", "FP_SHIP_ORDER", "FP_RECEIVE_REJECT", "FP_RECEIVE_RETURN", "FP_MANAGE_CAROUSEL", "FP_MANAGE_NEWS", "FP_MANAGE_SHOPWINDOW", "FP_MANAGE_FOOTER", "FP_MANAGE_GOODSTYPE", "FP_MANAGE_INVENTORYDISPLAY", "FP_MANAGE_CLIENTCATEGORY", "FP_MANAGE_BASIC_OPTION", "FP_VIEW_LOG","FP_MANAGE_GSP_OPTION"]');
INSERT INTO Operator (username, password, operatorName, operatorType, customerId,clientId, mobileNum, citizenIdNum, operatorRoles) VALUES("buyer3", "pbkdf2$10000$fe903108a6ef167a866d31952d22c6fa1ed8bbd3a3203a3f2ecbd632e4c4069957226d10e544eeeef713f37d64351264e38af13350e77773c769f1ac216b110d$1607d6c2cbc93ece28eafb42eedfef7055ab7da370e0e95db02072690e106d2320276f914606f508908fb16983be24711160c24e406838e6bd8458c9ed892ac2", "bb操作员:buyer3","CLIENT", 5,3, "18030222222","1234567890987654321",'["FP_VIEW_OPERATOR", "FP_MANAGE_OPERATOR", "FP_VIEW_CLIENT", "FP_APPROVE_CLIENT", "FP_VIEW_GOODS", "FP_SALE_GOODS", "FP_PRICE_GOODS", "FP_INVENTORY_GOODS", "FP_NEW_GOODS", "FP_VIEW_PRICE", "FP_APPROVE_PRICE", "FP_VIEW_ORDER", "FP_VIEW_REJECT", "FP_VIEW_RETURN", "FP_APPROVE_ORDER", "FP_APPROVE_RETURN", "FP_SHIP_ORDER", "FP_RECEIVE_REJECT", "FP_RECEIVE_RETURN", "FP_MANAGE_CAROUSEL", "FP_MANAGE_NEWS", "FP_MANAGE_SHOPWINDOW", "FP_MANAGE_FOOTER", "FP_MANAGE_GOODSTYPE", "FP_MANAGE_INVENTORYDISPLAY", "FP_MANAGE_CLIENTCATEGORY", "FP_MANAGE_BASIC_OPTION", "FP_VIEW_LOG","FP_MANAGE_GSP_OPTION"]');
INSERT INTO Operator (username, password, operatorName, operatorType, customerId,clientId, mobileNum, citizenIdNum, operatorRoles) VALUES("xfbuyer", "pbkdf2$10000$fe903108a6ef167a866d31952d22c6fa1ed8bbd3a3203a3f2ecbd632e4c4069957226d10e544eeeef713f37d64351264e38af13350e77773c769f1ac216b110d$1607d6c2cbc93ece28eafb42eedfef7055ab7da370e0e95db02072690e106d2320276f914606f508908fb16983be24711160c24e406838e6bd8458c9ed892ac2", "现付客户1","CLIENT", 1,4, "18030222222","1234567890987654321",'["FP_VIEW_OPERATOR", "FP_MANAGE_OPERATOR", "FP_VIEW_CLIENT", "FP_APPROVE_CLIENT", "FP_VIEW_GOODS", "FP_SALE_GOODS", "FP_PRICE_GOODS", "FP_INVENTORY_GOODS", "FP_NEW_GOODS", "FP_VIEW_PRICE", "FP_APPROVE_PRICE", "FP_VIEW_ORDER", "FP_VIEW_REJECT", "FP_VIEW_RETURN", "FP_APPROVE_ORDER", "FP_APPROVE_RETURN", "FP_SHIP_ORDER", "FP_RECEIVE_REJECT", "FP_RECEIVE_RETURN", "FP_MANAGE_CAROUSEL", "FP_MANAGE_NEWS", "FP_MANAGE_SHOPWINDOW", "FP_MANAGE_FOOTER", "FP_MANAGE_GOODSTYPE", "FP_MANAGE_INVENTORYDISPLAY", "FP_MANAGE_CLIENTCATEGORY", "FP_MANAGE_BASIC_OPTION", "FP_VIEW_LOG","FP_MANAGE_GSP_OPTION"]');

/*插入对应与buyer1，buyer2,buyer3,xfbuyer的client表*/
INSERT INTO `Client` VALUES (1,NULL,1,'buyer1','成都','授信buyer1','price2',NULL,'13671371678',NULL,NULL,'金利科技',NULL,'CREDIT','/static/img/5.jpg','APPROVED','','请选择医疗级别',NULL,0,'ENABLED',0,NULL,NULL,NULL,'2016-04-01 03:17:04','2016-04-01 03:15:39');
INSERT INTO `Client` VALUES (2,NULL,1,'buyer2','成都','授信buyer2','price2',NULL,'13671371678',NULL,NULL,'金利科技',NULL,'CREDIT','/static/img/5.jpg','APPROVED','','请选择医疗级别',NULL,0,'ENABLED',0,NULL,NULL,NULL,'2016-04-01 03:17:04','2016-04-01 03:15:39');
INSERT INTO `Client` VALUES (3,NULL,1,'buyer3','成都','授信buyer3','price2',NULL,'13671371678',NULL,NULL,'金利科技',NULL,'CREDIT','/static/img/5.jpg','APPROVED','','请选择医疗级别',NULL,0,'ENABLED',0,NULL,NULL,NULL,'2016-04-01 03:17:04','2016-04-01 03:15:39');
INSERT INTO `Client` VALUES (4,NULL,1,'xfbuyer','成都','现付buyer','price1',NULL,'13671371678',NULL,NULL,'现付二楼5号',NULL,'ONLINE','/static/img/5.jpg','APPROVED','','请选择医疗级别',NULL,0,'ENABLED',0,NULL,NULL,NULL,'2016-04-01 07:44:41','2016-04-01 07:39:32');

/*更新客户Gsp信息*/
update ClientGsp set legalRepresentative = 'buyer1法人', businessLicense = "123123",businessLicenseValidateDate='2100-04-01',registeredCapital='123123',businessAddress='金利科技',limitedBusinessRange="控制范围",gmpOrGspLicenseNum="asdasdasd1",gmpOrGspLicenseNumValidateDate="2100-03-31",gspImages='{\"bussines_lic\":\"/static/img/1.jpg\",\"GSP_lic\":\"/static/img/2.jpg\",\"contract1\":\"/static/img/3.jpg\",\"contract2\":\"/static/img/4.jpg\"}' where id = 1;
update ClientGsp set legalRepresentative = 'buyer2法人', businessLicense = "222222",businessLicenseValidateDate='2100-04-01',registeredCapital='123123',businessAddress='金利科技',limitedBusinessRange="控制范围",gmpOrGspLicenseNum="asdasdasd2",gmpOrGspLicenseNumValidateDate="2100-03-31",gspImages='{\"bussines_lic\":\"/static/img/1.jpg\",\"GSP_lic\":\"/static/img/2.jpg\",\"contract1\":\"/static/img/3.jpg\",\"contract2\":\"/static/img/4.jpg\"}' where id = 2;
update ClientGsp set legalRepresentative = 'buyer3法人', businessLicense = "1333323",businessLicenseValidateDate='2100-04-01',registeredCapital='123123',businessAddress='金利科技',limitedBusinessRange="控制范围",gmpOrGspLicenseNum="asdasdasd3",gmpOrGspLicenseNumValidateDate="2100-03-31",gspImages='{\"bussines_lic\":\"/static/img/1.jpg\",\"GSP_lic\":\"/static/img/2.jpg\",\"contract1\":\"/static/img/3.jpg\",\"contract2\":\"/static/img/4.jpg\"}' where id = 3;
update ClientGsp set legalRepresentative = 'xf法人', businessLicense = "444444",businessLicenseValidateDate='2100-04-01',registeredCapital='123123',businessAddress='金利科技',limitedBusinessRange="控制范围",gmpOrGspLicenseNum="asdasdasd4",gmpOrGspLicenseNumValidateDate="2100-03-31",gspImages='{\"bussines_lic\":\"/static/img/1.jpg\",\"GSP_lic\":\"/static/img/2.jpg\",\"contract1\":\"/static/img/3.jpg\",\"contract2\":\"/static/img/4.jpg\"}' where id = 4;

/*更新授信客户授信额度，授信余额，账期*/
update ClientFinance set credits = 100000,arrearsBalance=100000,accountDays=30 where id=1;
update ClientFinance set credits = 100000,arrearsBalance=100000,accountDays=30 where id=2;
update ClientFinance set credits = 100000,arrearsBalance=100000,accountDays=30 where id=3;

/*插入历史*/
INSERT INTO `ClientHistory` VALUES (1,1,NULL,NULL,1,'111111','成都','授信','price2','APPROVED',NULL,'13671371678',NULL,'金利科技',NULL,0,'ENABLED','2016-04-01 03:17:03','2016-04-01 03:15:39','2016-04-01 03:17:03');
INSERT INTO `ClientHistory` VALUES (2,1,NULL,NULL,1,'111111','成都','授信','price2','APPROVED',NULL,'13671371678',NULL,'金利科技',NULL,0,'ENABLED','2016-04-01 03:17:04','2016-04-01 03:15:39','2016-04-01 03:17:04');

/*插入客户和GSP控制类型的关联*/
INSERT INTO `ClientGspIdLinks` VALUES (1,1,2,'2016-04-01 03:17:03','2016-04-01 03:17:03');
INSERT INTO `ClientGspIdLinks` VALUES (2,2,2,'2016-04-01 03:17:03','2016-04-01 03:17:03');
INSERT INTO `ClientGspIdLinks` VALUES (3,3,2,'2016-04-01 03:17:03','2016-04-01 03:17:03');
INSERT INTO `ClientGspIdLinks` VALUES (4,4,2,'2016-04-01 07:44:41','2016-04-01 07:44:41');

/**初始化支付配置的参数 **/

INSERT INTO ClientPaymentGateway (name,version,encoding,signMethod,baseUrl,imgUrl) VALUES ("授信支付","v.1.0","UTF-8","SHA1","/order/payment", "/static/img/customer/paymentType/credit.png");
INSERT INTO ClientPaymentGateway (name,version,encoding,signMethod,baseUrl, imgUrl) VALUES ("货到付款","v.1.0","UTF-8","SHA1","/order/payment", "/static/img/customer/paymentType/cod.png");
INSERT INTO ClientPaymentGateway (name,version,encoding,signMethod,baseUrl,imgUrl,applyUrl) VALUES ("联行支付","v.1.0","UTF-8","SHA1","http://user.sdecpay.com/", "/static/img/customer/paymentType/lianhang.jpg", "http://www.ecpay.cn/");
INSERT INTO ClientPaymentGateway (name,version,encoding,signMethod,baseUrl,imgUrl, applyUrl) VALUES ("微信支付","v3","UTF-8","MD5","", "/static/img/customer/paymentType/weixin.jpg", "https://pay.weixin.qq.com/");

INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (1,1,'{"payType":"CRT"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (1,2,'{"payType":"CRT"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (1,3,'{"payType":"CRT"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (1,4,'{"payType":"CRT"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (1,5,'{"payType":"CRT"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (2,1,'{"payType":"COD"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (2,2,'{"payType":"COD"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (2,3,'{"payType":"COD"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (2,4,'{"payType":"COD"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (2,5,'{"payType":"COD"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (3,1,'{"merId":"439459","key":"sBLe0LpcOfoY9srbZfNXc3bTwxZvO0XLwB4W0JiQOxPtP1djX7svMOfOCJqCYlZZP3LBIhLi4bnGxizfh5yXlIakE0d9aOns2M73402PP4mMlg8oKXje9ZJsHULVriOX"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (3,2,'{"merId":"439459","key":"sBLe0LpcOfoY9srbZfNXc3bTwxZvO0XLwB4W0JiQOxPtP1djX7svMOfOCJqCYlZZP3LBIhLi4bnGxizfh5yXlIakE0d9aOns2M73402PP4mMlg8oKXje9ZJsHULVriOX"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (3,3,'{"merId":"439459","key":"sBLe0LpcOfoY9srbZfNXc3bTwxZvO0XLwB4W0JiQOxPtP1djX7svMOfOCJqCYlZZP3LBIhLi4bnGxizfh5yXlIakE0d9aOns2M73402PP4mMlg8oKXje9ZJsHULVriOX"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (3,4,'{"merId":"439459","key":"sBLe0LpcOfoY9srbZfNXc3bTwxZvO0XLwB4W0JiQOxPtP1djX7svMOfOCJqCYlZZP3LBIhLi4bnGxizfh5yXlIakE0d9aOns2M73402PP4mMlg8oKXje9ZJsHULVriOX"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (3,5,'{"merId":"439459","key":"sBLe0LpcOfoY9srbZfNXc3bTwxZvO0XLwB4W0JiQOxPtP1djX7svMOfOCJqCYlZZP3LBIhLi4bnGxizfh5yXlIakE0d9aOns2M73402PP4mMlg8oKXje9ZJsHULVriOX"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (4,1,'{"appid":"wx76a929753051df64","mch_id":"1332296001","partner_key":"chengduyunuoxinxijishugongsi2015"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (4,2,'{"appid":"wx76a929753051df64","mch_id":"1332296001","partner_key":"chengduyunuoxinxijishugongsi2015"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (4,3,'{"appid":"wx76a929753051df64","mch_id":"1332296001","partner_key":"chengduyunuoxinxijishugongsi2015"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (4,4,'{"appid":"wx76a929753051df64","mch_id":"1332296001","partner_key":"chengduyunuoxinxijishugongsi2015"}');
INSERT INTO ClientPaymentKeys (paymentId,customerId,configValue) VALUES (4,5,'{"appid":"wx76a929753051df64","mch_id":"1332296001","partner_key":"chengduyunuoxinxijishugongsi2015"}');


/**初始化短信网关的参数 **/
INSERT INTO ClientSMSKeys (smsId,isMain,isStandby,configValue) VALUES (1,"0","0","eyJ1Ijoicm9tZW5zY2QiLCJwIjoicm9tZW5zIn0=");
INSERT INTO ClientSMSKeys (smsId,isMain,isStandby,configValue) VALUES (2,"0","0","eyJ1Ijoicm9tZW5zY2QiLCJwIjoicm9tZW5zIn0=");
INSERT INTO ClientSMSKeys (smsId,isMain,isStandby,configValue) VALUES (3,"0","0","eyJ1Ijoicm9tZW5zY2QiLCJwIjoicm9tZW5zIn0=");
COMMIT;
