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
 * Table: ClientGspHistory
 * 说明：客户GSP历史信息表
 */

DROP TABLE IF EXISTS ClientGspHistory;
CREATE TABLE ClientGspHistory (
	/* id */
	id 							BIGINT 				AUTO_INCREMENT PRIMARY KEY,

	/* id */
	clientGspId 		   		BIGINT 				NOT NULL,

	/* GUID refer to ERP */
	guid  						VARCHAR(50)        DEFAULT NULL,

	/* Client ID refer to table Client */
	clientId					BIGINT				NOT NULL,

	/********** GSP Information *************/

	/* 法人代表 */
	legalRepresentative 		VARCHAR(50) 		DEFAULT NULL,

	/* 营业执照号 */
	businessLicense 			VARCHAR(50) 		 DEFAULT NULL,

	/* 企业负责人 */
	companyManager 				VARCHAR(50) 		 DEFAULT NULL,

	/* 执照期限 */
	businessLicenseValidateDate DATE 				 DEFAULT NULL,

	/* 注册资本 */
	registeredCapital 			VARCHAR(50) 		 DEFAULT NULL,

	/* 营业地址 */
	businessAddress 			VARCHAR(200) 		DEFAULT NULL,

	/* 控制范围 */
	limitedBusinessRange		VARCHAR(200) 		DEFAULT NULL,

	/* GSP控制类型 */
	limitedBusinessType 		VARCHAR(200) 		DEFAULT NULL,


	/* 组织机构代码证号 */
	orgCode 					VARCHAR(50) 		DEFAULT NULL,

	/* 组织机构代码证期限 */
	orgCodeValidateDate         DATE                DEFAULT NULL,

	/* 税务登记证 */
	taxRegistrationLicenseNum   VARCHAR(50)         DEFAULT NULL,

	/* 食品流通许可证 */
	foodCirculationLicenseNum   VARCHAR(50)         DEFAULT NULL,

	/* 食品流通许可证有效期 */
	foodCirculationLicenseNumValidateDate DATE      DEFAULT NULL,

	/* 质量保证协议号 */
	qualityAssuranceLicenseNum  VARCHAR(50)          DEFAULT NULL,

	/* 质量保证协议号有效期 */
	qualityAssuranceLicenseNumValidateDate DATE     DEFAULT NULL,

	/* 医疗器械许可证号 */
	medicalApparatusLicenseNum  VARCHAR(50)          DEFAULT NULL,

	/* 医疗器械许可证有效期 */
	medicalApparatusLicenseNumValidateDate DATE     DEFAULT NULL,

	/* 医疗器械类别 */
	medicalApparatusType        VARCHAR(50)         DEFAULT NULL,

	/* 保健品证书 */
	healthProductsLicenseNum    VARCHAR(50)         DEFAULT NULL,

	/* 保健品证书有效期 */
	healthProductsLicenseNumValidateDate    DATE    DEFAULT NULL,

	/* 生产经营许可证 */
	productionAndBusinessLicenseNum     VARCHAR(50) DEFAULT NULL,

	/* 生产经营许可证发证日期 */
	productionAndBusinessLicenseNumIssuedDate DATE DEFAULT NULL,

	/* 生产经营许可证有效期 */
	productionAndBusinessLicenseNumValidateDate DATE DEFAULT NULL,

	/* 生产经营许可证发证机关 */
	productionAndBusinessLicenseNumIssuedDepartment VARCHAR(100) DEFAULT NULL,

	/* 仓库地址 */
	storageAddress              VARCHAR(200)        DEFAULT NULL,

	/* 精神麻醉证 */
	mentaanesthesiaLicenseNum   VARCHAR(50)         DEFAULT NULL,


	/* 精神麻醉证书有效期 */
	mentalanesthesiaLicenseNumValidateDate DATE     DEFAULT NULL,

	/* GMP/GSP证书号 */
	gmpOrGspLicenseNum          VARCHAR(50)         DEFAULT NULL,

	/* GMP/GSP证书有效期 */
	gmpOrGspLicenseNumValidateDate DATE             DEFAULT NULL,

	/* 危化品许可证 */
	hazardousChemicalsLicenseNum    VARCHAR(50)     DEFAULT NULL,

	/* 危化品许可证有效期 */
	hazardousChemicalsLicenseNumValidateDate DATE   DEFAULT NULL,

	/* 医疗机构执业许可证号 */
	medicalInstitutionLicenseNum VARCHAR(50)        DEFAULT NULL,

	/* 医疗机构执业许可证号有效期 */
	medicalInstitutionLicenseNumValidateDate DATE   DEFAULT NULL,

	/* 母婴保健技术执业许可证号 */
	maternalLicenseNum          VARCHAR(50)         DEFAULT NULL,

	/* 母婴保健技术执业许可证号有效期 */
	maternalLicenseNumValidateDate DATE             DEFAULT NULL,

	/* 事业单位法人证书 */
	institutionLegalPersonCert  VARCHAR(50)         DEFAULT NULL,

	/* 事业单位法人证书有效期 */
	institutionLegalPersonCertValidateDate DATE     DEFAULT NULL,

	/*  原表更新时间 */
	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

	/* 原表创建时间 */
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdTime                 TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);
/**********************************************
 * Triggers
 * 用来自动保存历史数据
 *********************************************/

DELIMITER //
DROP TRIGGER IF EXISTS insertClientGspHistory;
CREATE TRIGGER insertClientGspHistory AFTER UPDATE ON ClientGsp FOR EACH ROW
BEGIN
    /**
     *
     */
    INSERT INTO ClientGspHistory (clientGspId,guid,clientId,legalRepresentative,businessLicense,companyManager,businessLicenseValidateDate,
    registeredCapital,businessAddress,limitedBusinessRange,limitedBusinessType,orgCode,orgCodeValidateDate,taxRegistrationLicenseNum,
    foodCirculationLicenseNum,foodCirculationLicenseNumValidateDate,qualityAssuranceLicenseNum,qualityAssuranceLicenseNumValidateDate,
    medicalApparatusLicenseNum,medicalApparatusLicenseNumValidateDate,medicalApparatusType,healthProductsLicenseNum,
    healthProductsLicenseNumValidateDate,productionAndBusinessLicenseNum,productionAndBusinessLicenseNumIssuedDate,
    productionAndBusinessLicenseNumValidateDate,productionAndBusinessLicenseNumIssuedDepartment,storageAddress,mentaanesthesiaLicenseNum,
    mentalanesthesiaLicenseNumValidateDate,gmpOrGspLicenseNum,gmpOrGspLicenseNumValidateDate,hazardousChemicalsLicenseNum,
    hazardousChemicalsLicenseNumValidateDate, maternalLicenseNum,	maternalLicenseNumValidateDate, institutionLegalPersonCert,
    institutionLegalPersonCertValidateDate,updatedOn,createdOn)
    VALUES (NEW.id,NEW.guid,NEW.clientId,NEW.legalRepresentative,NEW.businessLicense,NEW.companyManager,NEW.businessLicenseValidateDate,
                NEW.registeredCapital,NEW.businessAddress,NEW.limitedBusinessRange,NEW.limitedBusinessType,NEW.orgCode,NEW.orgCodeValidateDate,NEW.taxRegistrationLicenseNum,
                NEW.foodCirculationLicenseNum,NEW.foodCirculationLicenseNumValidateDate,NEW.qualityAssuranceLicenseNum,NEW.qualityAssuranceLicenseNumValidateDate,
                NEW.medicalApparatusLicenseNum,NEW.medicalApparatusLicenseNumValidateDate,NEW.medicalApparatusType,NEW.healthProductsLicenseNum,
                NEW.healthProductsLicenseNumValidateDate,NEW.productionAndBusinessLicenseNum,NEW.productionAndBusinessLicenseNumIssuedDate,
                NEW.productionAndBusinessLicenseNumValidateDate,NEW.productionAndBusinessLicenseNumIssuedDepartment,NEW.storageAddress,NEW.mentaanesthesiaLicenseNum,
                NEW.mentalanesthesiaLicenseNumValidateDate,NEW.gmpOrGspLicenseNum,NEW.gmpOrGspLicenseNumValidateDate,NEW.hazardousChemicalsLicenseNum,
                NEW.hazardousChemicalsLicenseNumValidateDate,NEW.maternalLicenseNum,NEW.maternalLicenseNumValidateDate,NEW.institutionLegalPersonCert,
                NEW.institutionLegalPersonCertValidateDate,NEW.updatedOn,NEW.createdOn);
END;
//
DELIMITER ;