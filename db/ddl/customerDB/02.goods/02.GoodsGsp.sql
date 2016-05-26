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
 * Table: GoodsGsp
 * 说明：商品GSP信息
 *
 **********************************************************************/

DROP TABLE IF EXISTS GoodsGsp;
CREATE TABLE GoodsGsp (
    /* id */
	id                              BIGINT              AUTO_INCREMENT PRIMARY KEY,

	/* guid , for ERP */
	guid                            VARCHAR(50)         UNIQUE  DEFAULT NULL,

	/* goods id 商品编号 */
	goodsId                         BIGINT              UNIQUE NOT NULL,

	/* GMP证书号 */
	gmpNumber                       VARCHAR(50)         DEFAULT NULL,

	/* GMP认证日期 */
	gmpCertificationDate            DATE                DEFAULT NULL,

	/* GMP有效日期 */
	gmpValidDate                    DATE                DEFAULT NULL,

	/* 批准文号或者器械注册备案号 */
	filingNumber                    VARCHAR(50)         DEFAULT NULL,

	/* 文号或备案号有效期限 */
	filingNumberValidDate           DATE                DEFAULT NULL,

	/* 进口注册证号 */
	importRegisCertNum              VARCHAR(50)         DEFAULT NULL,

	/* 进口注册证期限 */
	importRegisCertNumValidDate     DATE                DEFAULT NULL,

	/* 药剂类型 */
/*	drugsType                       VARCHAR(50)         DEFAULT NULL,*/

	/* 药剂有效期 */
	drugsValidDate                  DATE                DEFAULT NULL,

	/* 存储条件 */
	storageCondition                VARCHAR(50)         DEFAULT NULL,

	/* GSP类别 */
	gspType                         VARCHAR(50)         DEFAULT NULL,

	/* 注册商标以及专利 */
	registeredTradeMarksAndPatents  VARCHAR(50)         DEFAULT NULL,

	/* 生产企业营业执照年检有效期 */
	businessLicenseValidDate        DATE                DEFAULT NULL,

	/* 器械生产许可证号 */
	instrumentProductionLicenseNum  VARCHAR(50)         DEFAULT NULL,

	/* 药监编码 */
	drugAdministrationEncoding      VARCHAR(50)         DEFAULT NULL,

	/* 医疗器械类别 */
	isMedicalApparatus              BOOL                DEFAULT NULL,

	/* 药品标志 */
    isMedicine                      BOOL                DEFAULT NULL,

    /* 进口标志 */
    isImported                      BOOL                DEFAULT NULL,

    /* 中药饮片标志 */
    isHerbalDecoctioniieces         BOOL                DEFAULT NULL,

    /* 需检查医疗器械证标志 */
    isCheckMedicalInstrumentCert    BOOL                DEFAULT NULL,

    /* 终止妊娠品标志 */
    isPregnancyRermination          BOOL                DEFAULT NULL,

    /* 中药材标志 */
    isHerbalMedicine                BOOL                DEFAULT NULL,

    /* 含特药品标志 */
    isContainSpecialContent         BOOL                DEFAULT NULL,

    /* 是否处方药品标志 */
    isPrescriptionDrugs             BOOL                DEFAULT NULL,

    /* 医保药品标志 */
    isMedicalInsuranceDrugs         BOOL                DEFAULT NULL,

    /* 国家基本药物标志 */
    isNationalMedicine         BOOL                DEFAULT NULL,

    /* 蛋白同化制剂标志 */
    isProteinasSimilationPreparation BOOL               DEFAULT NULL,

    /* 含麻黄碱标志 */
    isContainEphedrine              BOOL                DEFAULT NULL,

    /* 含肽类激素标志 */
    isContainPeptidehormone         BOOL                DEFAULT NULL,

    /* 二类精神药品标志 */
    isSecondPsychotropicDrugs       BOOL                DEFAULT NULL,

    /* 一类精神药品标志 */
    isFirstPsychotropicDrugs        BOOL                DEFAULT NULL,

    /* 危险化学品标志 */
    isHazardousChemicals            BOOL                DEFAULT NULL,

    /* 麻醉药品标志 */
    isStupefacient	                BOOL                DEFAULT NULL,

    /* 诊断试剂药品标志 */
    isDiagnosticReagent             BOOL                DEFAULT NULL,

    /* 医疗用毒性品标志 */
    isMedicalToxicity               BOOL                DEFAULT NULL,

    /* 含兴奋剂药品标志 */
    isContainingStimulants          BOOL                DEFAULT NULL,

    /* 是否疫苗标志 */
    isVaccine                       BOOL                DEFAULT NULL,

    /* 是否保健品标志 */
    isHealthProducts                BOOL                DEFAULT NULL,

    /* 食品标识 */
    isFood                          BOOL                DEFAULT NULL,

    /* 更新时间 */
    updatedOn                       TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* 创建时间 */
    createdOn                       TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);
