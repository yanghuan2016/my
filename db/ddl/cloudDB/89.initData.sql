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
 * 此文件中放置商户初始化所需数据
 * ERP 消息接口地址:	 http://erptest.romenscd.cn:8056/ClientHandler.ashx
 * ERP APPCODE 接口地址:http://erptest.romenscd.cn:8056/appCodeHandler.ashx
 * --------------------------------------------------------------
 * 2015-09-20	hc-romens@issue#23	增加测试商户customer
 *
 */
START TRANSACTION;
INSERT INTO Customer (id, customerName, enterpriseType, customerDBSuffix, hasPortal, subDomain, siteName, description,
					businessLicense,businessLicenseValidateDate,businessAddress,legalRepresentative,stampLink ) VALUES
					 (1, "神木医药网", "SELLER", "wx_romenscd_cn", true, "wx.romenscd.cn", "神木医药网©2015", "新疆神木药业股份有限公司",
					 "652900050002027","2100-01-01","新疆阿克苏地区阿克苏纺织工业城（开发区)温州路1号","段保华","/static/img/stampls/shenmu.png");
COMMIT;