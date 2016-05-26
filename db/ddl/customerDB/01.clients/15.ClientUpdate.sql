/*****************************************************************
 * �ൺ����������޹�˾?2015��Ȩ����
 *
 * �����֮���У������������ڣ�Դ���롢���ͼ��Ч��ͼ����������־��
 * �ű�����ݿ⡢�ĵ���Ϊ�ൺ����������丽���ӹ�˾���С��κ���֯
 * ���߸��ˣ�δ���ൺ�������������Ȩ�����ø��ơ�ʹ�á��޸ġ��ַ���
 * ������������κβ��֡��ൺ����������޹�˾�������κ�Υ��������
 * ����֯�͸��˲�ȡ�����ֶ�ά���Ϸ�Ȩ���Ȩ��
 *****************************************************************/

/*
 * Table: ClientUpdate
 * ˵�����ͻ�������Ϣ��
 */

DROP TABLE IF EXISTS ClientUpdate;
CREATE TABLE ClientUpdate (

	/* id */
	id 					BIGINT 		AUTO_INCREMENT PRIMARY KEY,

    /********** client Information *************/

    /* �ͻ����id, refer to Client.id */
    clientId            BIGINT      NOT NULL,



	/* �����ʼ���ַ */
	email 				VARCHAR(80) DEFAULT NULL,

	/* �ֻ���� */
	mobile 				VARCHAR(80) DEFAULT NULL,

	/* Fax number */
	fax					VARCHAR(80) DEFAULT NULL,

	/* Ĭ�ϵ�ַID, refer to ClientAddress.id */
	defaultAddressId	BIGINT		DEFAULT NULL,

	/* �ؿ�����֪ͨ��Ϣ */
	paymentReminderMsg 	VARCHAR(50) DEFAULT NULL,



	/********** GSP Information *************/

	/* ���˴�� */
	legalRepresentative 		VARCHAR(50) 		DEFAULT NULL,

	/* Ӫҵִ�պ� */
	businessLicense 			VARCHAR(50) 		 DEFAULT NULL,

	/* ��ҵ������ */
	companyManager 				VARCHAR(50) 		 DEFAULT NULL,

	/* ִ������ */
	businessLicenseValidateDate DATE 				 DEFAULT NULL,

	/* ע���ʱ� */
	registeredCapital 			VARCHAR(50) 		 DEFAULT NULL,

	/* Ӫҵ��ַ */
	businessAddress 			VARCHAR(200) 		DEFAULT NULL,

	/* ���Ʒ�Χ */
	limitedBusinessRange		VARCHAR(200) 		DEFAULT NULL,

	/* GSP�������� */
	limitedBusinessType 		VARCHAR(200) 		DEFAULT NULL,

	/* ��֯�����֤�� */
	orgCode 					VARCHAR(50) 		DEFAULT NULL,

	/* ��֯�����֤���� */
	orgCodeValidateDate         DATE                DEFAULT NULL,

	/* ˰��Ǽ�֤ */
	taxRegistrationLicenseNum   VARCHAR(50)         DEFAULT NULL,

	taxRegistrationLicenseNumValidateDate  DATE DEFAULT NULL,


	/* ʳƷ��ͨ���֤ */
	foodCirculationLicenseNum   VARCHAR(50)         DEFAULT NULL,

	/* ʳƷ��ͨ���֤��Ч�� */
	foodCirculationLicenseNumValidateDate DATE      DEFAULT NULL,

	/* ������֤Э��� */
	qualityAssuranceLicenseNum  VARCHAR(50)          DEFAULT NULL,

	/* ������֤Э�����Ч�� */
	qualityAssuranceLicenseNumValidateDate DATE     DEFAULT NULL,

	/* ҽ����е���֤�� */
	medicalApparatusLicenseNum  VARCHAR(50)          DEFAULT NULL,

	/* ҽ����е���֤��Ч�� */
	medicalApparatusLicenseNumValidateDate DATE     DEFAULT NULL,

	/* ҽ����е��� */
	medicalApparatusType        VARCHAR(50)         DEFAULT NULL,

	/* ����Ʒ֤�� */
	healthProductsLicenseNum    VARCHAR(50)         DEFAULT NULL,

	/* ����Ʒ֤����Ч�� */
	healthProductsLicenseNumValidateDate    DATE    DEFAULT NULL,

	/* ���Ӫ���֤ */
	productionAndBusinessLicenseNum     VARCHAR(50) DEFAULT NULL,

	/* ���Ӫ���֤��֤���� */
	productionAndBusinessLicenseNumIssuedDate DATE DEFAULT NULL,

	/* ���Ӫ���֤��Ч�� */
	productionAndBusinessLicenseNumValidateDate DATE DEFAULT NULL,

	/* ���Ӫ���֤��֤��� */
	productionAndBusinessLicenseNumIssuedDepartment VARCHAR(100) DEFAULT NULL,

	/* �ֿ��ַ */
	storageAddress              VARCHAR(200)        DEFAULT NULL,

	/* ��������֤ */
	mentaanesthesiaLicenseNum   VARCHAR(50)         DEFAULT NULL,


	/* ��������֤����Ч�� */
	mentalanesthesiaLicenseNumValidateDate DATE     DEFAULT NULL,

	/* GMP/GSP֤��� */
	gmpOrGspLicenseNum          VARCHAR(50)         DEFAULT NULL,

	/* GMP/GSP֤����Ч�� */
	gmpOrGspLicenseNumValidateDate DATE             DEFAULT NULL,

	/* Σ��Ʒ���֤ */
	hazardousChemicalsLicenseNum    VARCHAR(50)     DEFAULT NULL,

	/* Σ��Ʒ���֤��Ч�� */
	hazardousChemicalsLicenseNumValidateDate DATE   DEFAULT NULL,

	/* ҽ�ƻ�ִҵ���֤�� */
	medicalInstitutionLicenseNum VARCHAR(50)        DEFAULT NULL,

	/* ҽ�ƻ�ִҵ���֤����Ч�� */
	medicalInstitutionLicenseNumValidateDate DATE   DEFAULT NULL,

	/* ĸӤ��������ִҵ���֤�� */
	maternalLicenseNum          VARCHAR(50)         DEFAULT NULL,

	/* ĸӤ��������ִҵ���֤����Ч�� */
	maternalLicenseNumValidateDate DATE             DEFAULT NULL,

	/* ��ҵ��λ����֤�� */
	institutionLegalPersonCert  VARCHAR(50)         DEFAULT NULL,

	/* ��ҵ��λ����֤����Ч�� */
	institutionLegalPersonCertValidateDate DATE     DEFAULT NULL,

    updatedOn			TIMESTAMP	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

	/* ����ʱ��� */
	createdTime 		TIMESTAMP	DEFAULT CURRENT_TIMESTAMP,
	 /* 证书图像*/

    gspImages                   VARCHAR(8192)   DEFAULT NULL

);
