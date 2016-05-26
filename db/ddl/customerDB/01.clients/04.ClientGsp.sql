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
 * Table: ClientGsp
 * 说明：客户GSP信息表
 */
DROP TABLE IF EXISTS ClientGsp;
CREATE TABLE ClientGsp (
	/* id */
	id 							BIGINT 				AUTO_INCREMENT PRIMARY KEY,

	/* GUID refer to ERP */
	guid  						VARCHAR(50)        DEFAULT NULL,

	/* Client ID refer to table Client */
	clientId					BIGINT				UNIQUE NOT NULL,

	/********** GSP Information *************/

	/* 法人代表 */
	legalRepresentative 		VARCHAR(50) 		DEFAULT NULL,

	/* 营业执照号 */
	businessLicense 			VARCHAR(50) 		 UNIQUE DEFAULT NULL,

	/* 企业负责人 */
	companyManager 				VARCHAR(50) 		 DEFAULT NULL,

	/* 执照期限 */
	businessLicenseValidateDate DATE 				 DEFAULT NULL,

	/* 注册资本 */
	registeredCapital 			VARCHAR(50) 		 DEFAULT NULL,

	/* 营业地址 */
	businessAddress 			VARCHAR(200) 		DEFAULT NULL,

	/* 控制范围，指营业执照经营范围描述 */
	limitedBusinessRange		VARCHAR(200) 		DEFAULT NULL,

	/* GSP控制类型,ERP数据，不在SCC内使用，SCC用ClientGspIdlinks表来显示1对多情况 */
	limitedBusinessType 		VARCHAR(200) 		DEFAULT NULL,

	/* 组织机构代码证号 */
	orgCode 					VARCHAR(50) 		UNIQUE DEFAULT NULL,

	/* 组织机构代码证期限 */
	orgCodeValidateDate         DATE                DEFAULT NULL,

	/* 税务登记证 */
	taxRegistrationLicenseNum   VARCHAR(50)         UNIQUE DEFAULT NULL,

	/* 税务登记证期限 */
	taxRegistrationLicenseNumValidateDate   DATE         DEFAULT NULL,

	/* 食品流通许可证 */
	foodCirculationLicenseNum   VARCHAR(50)         UNIQUE DEFAULT NULL,

	/* 食品流通许可证有效期 */
	foodCirculationLicenseNumValidateDate DATE      DEFAULT NULL,

	/* 质量保证协议号 */
	qualityAssuranceLicenseNum  VARCHAR(50)          DEFAULT NULL,

	/* 质量保证协议号有效期 */
	qualityAssuranceLicenseNumValidateDate DATE     DEFAULT NULL,

	/* 医疗器械许可证号 */
	medicalApparatusLicenseNum  VARCHAR(50)          UNIQUE DEFAULT NULL,

	/* 医疗器械许可证有效期 */
	medicalApparatusLicenseNumValidateDate DATE     DEFAULT NULL,

	/* 医疗器械类别 */
	medicalApparatusType        VARCHAR(50)         DEFAULT NULL,

	/* 保健品证书 */
	healthProductsLicenseNum    VARCHAR(50)         UNIQUE DEFAULT NULL,

	/* 保健品证书有效期 */
	healthProductsLicenseNumValidateDate    DATE    DEFAULT NULL,

	/* 生产经营许可证 */
	productionAndBusinessLicenseNum     VARCHAR(50) UNIQUE DEFAULT NULL,

	/* 生产经营许可证发证日期 */
	productionAndBusinessLicenseNumIssuedDate DATE DEFAULT NULL,

	/* 生产经营许可证有效期 */
	productionAndBusinessLicenseNumValidateDate DATE DEFAULT NULL,

	/* 生产经营许可证发证机关 */
	productionAndBusinessLicenseNumIssuedDepartment VARCHAR(100) DEFAULT NULL,

	/* 仓库地址 */
	storageAddress              VARCHAR(200)        DEFAULT NULL,

	/* 精神麻醉证 */
	mentaanesthesiaLicenseNum   VARCHAR(50)         UNIQUE DEFAULT NULL,


	/* 精神麻醉证书有效期 */
	mentalanesthesiaLicenseNumValidateDate DATE     DEFAULT NULL,

	/* GMP/GSP证书号 */
	gmpOrGspLicenseNum          VARCHAR(50)         UNIQUE DEFAULT NULL,

	/* GMP/GSP证书有效期 */
	gmpOrGspLicenseNumValidateDate DATE             DEFAULT NULL,

	/* 危化品许可证 */
	hazardousChemicalsLicenseNum    VARCHAR(50)     UNIQUE DEFAULT NULL,

	/* 危化品许可证有效期 */
	hazardousChemicalsLicenseNumValidateDate DATE   DEFAULT NULL,

	/* 医疗机构执业许可证号 */
	medicalInstitutionLicenseNum VARCHAR(50)        UNIQUE DEFAULT NULL,

	/* 医疗机构执业许可证号有效期 */
	medicalInstitutionLicenseNumValidateDate DATE   DEFAULT NULL,

	/* 母婴保健技术执业许可证号 */
	maternalLicenseNum          VARCHAR(50)         UNIQUE DEFAULT NULL,

	/* 母婴保健技术执业许可证号有效期 */
	maternalLicenseNumValidateDate DATE             DEFAULT NULL,

	/* 事业单位法人证书 */
	institutionLegalPersonCert  VARCHAR(50)         UNIQUE DEFAULT NULL,

	/* 事业单位法人证书有效期 */
	institutionLegalPersonCertValidateDate DATE     DEFAULT NULL,

    /* 证书图像*/
    gspImages                   VARCHAR(8192)   DEFAULT NULL,

	/* 更新时间 */
	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* 创建时间 */
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);