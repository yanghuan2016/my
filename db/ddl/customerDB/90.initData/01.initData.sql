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
 * 这里放置客户所需初始数据。测试数据放入testData文件夹
 * --------------------------------------------------------------
 * 2015-09-15	hc-romens@issue#17	增加operator
 *
 */
START TRANSACTION;
INSERT INTO KVList VALUES('autoReceiveDays','自动确认收货天数',7);
INSERT INTO KVList VALUES('maxAutoReceiveDays','自动确认收货最大天数',14);
INSERT INTO KVList VALUES('checkOutDays','结帐日',25);
INSERT INTO KVList VALUES('maxCheckOutDays','最大结帐日',28);
INSERT INTO KVList VALUES('maxAutoCloseOrderDays','未付款自动关闭订单最大天数',7);
INSERT INTO KVList VALUES('autoCloseOrderDays','未付款自动关闭订单天数',3);

/* 默认账户 */
INSERT INTO Operator (username, isMandatory, password, operatorName, operatorType, customerId, mobileNum, citizenIdNum, operatorRoles) VALUES("admin", TRUE, "pbkdf2$10000$fe903108a6ef167a866d31952d22c6fa1ed8bbd3a3203a3f2ecbd632e4c4069957226d10e544eeeef713f37d64351264e38af13350e77773c769f1ac216b110d$1607d6c2cbc93ece28eafb42eedfef7055ab7da370e0e95db02072690e106d2320276f914606f508908fb16983be24711160c24e406838e6bd8458c9ed892ac2", "系统管理员", "CUSTOMER", 1, "","",'["FP_VIEW_OPERATOR", "FP_MANAGE_OPERATOR", "FP_VIEW_GOODS", "FP_VIEW_ORDER", "FP_VIEW_REJECT", "FP_VIEW_RETURN", "FP_VIEW_LOG"]');
INSERT INTO Operator (username, isMandatory, password, operatorName, operatorType, customerId, mobileNum, citizenIdNum, operatorRoles) VALUES("supervisor", TRUE, "", "监管员","CUSTOMER", 1, "","",'["FP_VIEW_ORDER"]');
INSERT INTO Operator (username, isReserved, isMandatory, password, operatorName, operatorType, customerId, mobileNum, citizenIdNum, operatorRoles) VALUES("ERP", TRUE,TRUE, "", "ERP","CUSTOMER", 1, "","",'[]');

/*GSP控制范围*/
INSERT INTO `GoodsGspType` VALUES (1,NULL,'gsp类别一',NULL,'2016-03-31 11:42:03','2016-03-31 11:42:03'),(2,NULL,'gsp类别二',NULL,'2016-03-31 11:42:08','2016-03-31 11:42:08');

/* 库存计划详情 */
INSERT INTO GoodsInventoryPlan(id,name, isDefault, isSystem) VALUES(1,'实际库存', true, true);
INSERT INTO GoodsInventoryPlanDetails(goodsInventoryPlanId,threshold,content) VALUES(1,0,'缺货');
INSERT INTO GoodsInventoryPlanDetails(goodsInventoryPlanId,threshold,content) VALUES(1,99999999999999.9999,'实际数量');

INSERT INTO GoodsInventoryPlan(id,name, isDefault, isSystem) VALUES(2,'最低下架库存', false, false);
INSERT INTO GoodsInventoryPlanDetails(goodsInventoryPlanId,threshold,content) VALUES(2,10,'已售罄');
INSERT INTO GoodsInventoryPlanDetails(goodsInventoryPlanId,threshold,content) VALUES(2,99999999999999.9999,'实际数量');

/*客户类型*/
INSERT INTO ClientCategory(categoryName) VALUES("A类医院");
INSERT INTO ClientCategory(categoryName) VALUES("B类医院");
INSERT INTO ClientCategory(categoryName) VALUES("C类医院");
INSERT INTO ClientCategory(categoryName) VALUES("连锁药店");
INSERT INTO ClientCategory(categoryName) VALUES("诊所");
INSERT INTO ClientCategory(categoryName) VALUES("代销方");

/* gsp类型 */
INSERT INTO ClientGspTypes(name) VALUES("批发企业");
INSERT INTO ClientGspTypes(name) VALUES("生产企业");
INSERT INTO ClientGspTypes(name) VALUES("连锁药店");
INSERT INTO ClientGspTypes(name) VALUES("医疗机构");

/* 企业所属地区 */
INSERT INTO ClientArea(name) VALUES("成都");
INSERT INTO ClientArea(name) VALUES("四川");
INSERT INTO ClientArea(name) VALUES("山东");
INSERT INTO ClientArea(name) VALUES("重庆");
INSERT INTO ClientArea(name) VALUES("新疆");
COMMIT;