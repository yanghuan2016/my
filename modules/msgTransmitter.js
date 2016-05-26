var _ = require("underscore");
var async = require('async');
var hasher = require('password-hash-and-salt');
var sysconf = require(__base + '/config/sysconfig.json');
var sprintf = require("sprintf-js").sprintf;

var cacheService = __cacheService;


var ApiRobot = require(__base + '/modules/apiRobot.js');
var logger = __logService;
var moment = require('moment');

function MsgTransmitter(cloudDbName, dbService, redisConnection) {
    this.cloudDbName = cloudDbName;
    this.dbService = dbService;
    this.redisConnection = redisConnection;
    this.apiRobot = new ApiRobot(cloudDbName, dbService, redisConnection, sysconf.isErpMsgCheckStrict, sysconf.erpApiVersion);
}

MsgTransmitter.prototype.B2B_CLIENT_NEW_TO_SELLER = function (newClientId, sellerEnterpriseId, callback) {
    logger.enter();

    var msgType = "B2B_CLIENT_NEW_TO_SELLER";
    var cloudDbName = this.cloudDbName;
    var dbService = this.dbService;
    var apiRobot = this.apiRobot;

    dbService.enterpriseInfoRetrieve(
        cloudDbName, 
        { enterprieseId:sellerEnterpriseId}, 
        function (error, sellerEnterpriseInfo) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            sellerEnterpriseInfo = sellerEnterpriseInfo[0];
            if (sellerEnterpriseInfo === undefined) {
                return callback(new Error('没有找到卖家有对应的数据库!!'));
            }
            var sellerCustomerDbName = sysconf.customerDBPrefix + '_' + sellerEnterpriseInfo.customerDBSuffix;
            dbService.clientInfoRetrieveByClientId(sellerCustomerDbName, newClientId, function (error, clientInfo) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                var clientInfo = clientInfo[0];
                if (clientInfo === undefined) {
                    return callback(new Error('没有找到新客户的数据!!'));
                }

                var msgData = {
                    clientId: clientInfo.clientId,
                    clientCategoryErpCode: clientInfo.clientCategoryErpCode,
                    clientCode: clientInfo.clientCode,
                    clientArea: clientInfo.clientArea,
                    clientName: clientInfo.clientName,

                    pricePlan: clientInfo.pricePlan,
                    email: clientInfo.email,
                    mobile: clientInfo.mobile,
                    fax: clientInfo.fax,
                    defaultAddressId: clientInfo.defaultAddressId,

                    defaultAddressReceiver: clientInfo.defaultAddressReceiver,
                    defaultAddressTelNum: clientInfo.defaultAddressTelNum,
                    defaultAddressMobileNum: clientInfo.defaultAddressMobileNum,
                    defaultAddressPostCode: clientInfo.defaultAddressPostCode,
                    defaultAddressProvinceFirstStage: clientInfo.defaultAddressProvinceFirstStage,

                    defaultAddressCitySecondStage: clientInfo.defaultAddressCitySecondStage,
                    defaultAddressCountiesThirdStage: clientInfo.defaultAddressCountiesThirdStage,
                    defaultAddressDetailAddress: clientInfo.defaultAddressDetailAddress,
                    defaultAddressRemark: clientInfo.defaultAddressRemark,
                    paymentReminderMsg: clientInfo.paymentReminderMsg,

                    stampLink: clientInfo.stampLink,
                    registerStatus: clientInfo.registerStatus,
                    checkComments: clientInfo.checkComments,
                    readOnly: clientInfo.readOnly,
                    enabled: clientInfo.enabled,

                    legalRepresentative: clientInfo.legalRepresentative,
                    businessLicense: clientInfo.businessLicense,
                    companyManager: clientInfo.companyManager,
                    businessLicenseValidateDate: clientInfo.businessLicenseValidateDate,
                    registeredCapital: clientInfo.registeredCapital,

                    businessAddress: clientInfo.businessAddress,
                    limitedBusinessRange: clientInfo.limitedBusinessRange,
                    limitedBusinessType: clientInfo.limitedBusinessType,
                    orgCode: clientInfo.orgCode,
                    orgCodeValidateDate: clientInfo.orgCodeValidateDate,

                    taxRegistrationLicenseNum: clientInfo.taxRegistrationLicenseNum,
                    taxRegistrationLicenseNumValidateDate: clientInfo.taxRegistrationLicenseNumValidateDate,
                    foodCirculationLicenseNum: clientInfo.foodCirculationLicenseNum,
                    foodCirculationLicenseNumValidateDate: clientInfo.foodCirculationLicenseNumValidateDate,
                    qualityAssuranceLicenseNum: clientInfo.qualityAssuranceLicenseNum,

                    qualityAssuranceLicenseNumValidateDate: clientInfo.qualityAssuranceLicenseNumValidateDate,
                    medicalApparatusLicenseNum: clientInfo.medicalApparatusLicenseNum,
                    medicalApparatusLicenseNumValidateDate: clientInfo.medicalApparatusLicenseNumValidateDate,
                    medicalApparatusType: clientInfo.medicalApparatusType,
                    healthProductsLicenseNum: clientInfo.healthProductsLicenseNum,

                    healthProductsLicenseNumValidateDate: clientInfo.healthProductsLicenseNumValidateDate,
                    productionAndBusinessLicenseNum: clientInfo.productionAndBusinessLicenseNum,
                    productionAndBusinessLicenseNumIssuedDate: clientInfo.productionAndBusinessLicenseNumIssuedDate,
                    productionAndBusinessLicenseNumValidateDate: clientInfo.productionAndBusinessLicenseNumValidateDate,
                    productionAndBusinessLicenseNumIssuedDepartment: clientInfo.productionAndBusinessLicenseNumIssuedDepartment,

                    storageAddress: clientInfo.storageAddress,
                    mentaanesthesiaLicenseNum: clientInfo.mentaanesthesiaLicenseNum,
                    mentalanesthesiaLicenseNumValidateDate: clientInfo.mentalanesthesiaLicenseNumValidateDate,
                    gmpOrGspLicenseNum: clientInfo.gmpOrGspLicenseNum,
                    gmpOrGspLicenseNumValidateDate: clientInfo.gmpOrGspLicenseNumValidateDate,

                    hazardousChemicalsLicenseNum: clientInfo.hazardousChemicalsLicenseNum,
                    hazardousChemicalsLicenseNumValidateDate: clientInfo.hazardousChemicalsLicenseNumValidateDate,
                    medicalInstitutionLicenseNum: clientInfo.medicalInstitutionLicenseNum,
                    medicalInstitutionLicenseNumValidateDate: clientInfo.medicalInstitutionLicenseNumValidateDate,
                    maternalLicenseNum: clientInfo.maternalLicenseNum,

                    maternalLicenseNumValidateDate: clientInfo.maternalLicenseNumValidateDate,
                    institutionLegalPersonCert: clientInfo.institutionLegalPersonCert,
                    institutionLegalPersonCertValidateDate: clientInfo.institutionLegalPersonCertValidateDate,
                    gspImages: clientInfo.gspImages
                };
                apiRobot.sendMsg(sellerEnterpriseId, msgType, msgData, function (error, feedback) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    callback(null, feedback);
                });
            });
        }
    );
};

MsgTransmitter.prototype.B2B_REQUEST_CLIENT_TO_SELLER = function (enterpriseId, callback) {
    var msgType = "B2B_REQUEST_CLIENT_TO_SELLER";

    var cloudDbName = this.cloudDbName;
    var dbService = this.dbService;
    var apiRobot = this.apiRobot;

    dbService.enterpriseInfoRetrieve(cloudDbName, {enterprieseId:enterpriseId}, function (error, sellerEnterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        sellerEnterpriseInfo = sellerEnterpriseInfo[0];
        if (sellerEnterpriseInfo === undefined) {
            return callback(new Error('没有找到卖家有对应的数据库!!'));
        }
        var customerDbName = sysconf.customerDBPrefix + '_' + sellerEnterpriseInfo.customerDBSuffix;
        var msgData = {};
        apiRobot.sendMsg(enterpriseId, msgType, msgData, function (error, feedback) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            //console.log('REQUEST_CLIENT_TO_SELLER:', feedback);
            try{
                var clients = JSON.parse(feedback.data).BUYER;
            }catch(err){
                logger.error(err);
                return callback(err);
            }

            //console.log(clients[3]);
            clients = _.map(clients, function (item) {
                if (_.isEmpty(item.BusinessLicense) || _.isEmpty(item.Mobile) || _.isEmpty(item.ClientCode)) {
                    return;
                }
                // todo: 保证上层进来的数据有值后, 删掉下面三行补全数据的代码
                if (_.isEmpty(item.clientCategoryErpCode)) {
                    item.clientCategoryErpCode = '1';
                }
                return item;
            });
            clients = _.compact(clients);

            //console.log('REQUEST_CLIENT_TO_SELLER:', clients[2]);
            //var clients = JSON.parse(feedback.data).clients;
            //clients = [
            //    {
            //        businessLicense: "123456813",        // 必须&唯一 营业执照 VARCHAR(50)
            //        clientCode: "buyer1ClientCode13",    // 必须&唯一 客户编号 VARCHAR(50)
            //        mobile: "18202835113",               // 必须&唯一 手机号 VARCHAR(80)
            //
            //        clientCategoryErpCode: "1",          // 客户分类id VARCHAR(30)
            //        clientArea: "四川成都",               // 客户所属区域  VARCHAR(50)
            //        clientName: "神木客户1",              // 客户名称 VARCHAR(50)
            //
            //        pricePlan: "price1",                 // 客户价格方案 enum: wholesalePrice,price1,price2,price3,refRetailPrice
            //        email: "zhaopeng@qq.com",            // 邮箱 VARCHAR(80)
            //        fax: "0817-5835990",                 // 传真 VARCHAR(80)
            //        defaultAddressId: "1",               // 默认收货地址id INT
            //
            //        defaultAddressReceiver: "赵鹏",       // 默认收货人 VARCHAR(256)
            //        defaultAddressTelNum: "18202835971", // 收货人电话  VARCHAR(50)
            //        defaultAddressMobileNum: "18202835971", // 收货人手机 VARCHAR(50)
            //        defaultAddressPostCode: "610000",    // 邮编 VARCHAR(20)
            //        defaultAddressProvinceFirstStage: "四川", // 国标收货地址第一级 VARCHAR(50)
            //
            //        defaultAddressCitySecondStage: "成都",// 国标收货地址第二级 VARCHAR(50)
            //        defaultAddressCountiesThirdStage: "高新区",    // 国标收货地址第三级 VARCHAR(50)
            //        defaultAddressDetailAddress: "美年广场",    // 详细地址 VARCHAR(512)
            //        defaultAddressRemark: "仅工作日收货",  // 地址备注 VARCHAR(512)
            //
            //        paymentReminderMsg: "付款信息",       // 回款提醒通知消息 VARCHAR(50)
            //        stampLink: "/upload/2015122815032658.png",  // 公章图片URL  VARCHAR(256)
            //        registerStatus: "APPROVED",          // 审核标志 ENUM('CREATED','APPROVED','UPDATED','REJECTED')
            //        checkComments: "同意",                // 审核意见 TEXT
            //        readOnly: "false",                   // 停购标志  BOOL
            //        enabled: "ENABLED",                  // 禁用标志 ENUM("NEEDAPPROVAL", /* 待审核未启用*/  "DISABLED", /* 禁用 */ "ENABLED" /* 启用 */)
            //
            //        legalRepresentative: "赵鹏",          // 法人代表 VARCHAR(50)
            //        companyManager: "赵鹏",               // 企业负责人 VARCHAR(50)
            //        businessLicenseValidateDate: "2015-12-12",  // 执照期限
            //        registeredCapital: "1000000",        // 注册资本 VARCHAR(50)
            //
            //        businessAddress: "四川成都美年广场",    // 营业地址 VARCHAR(200)
            //        limitedBusinessRange: "仅限普通药品",  // 控制范围 VARCHAR(200)
            //        limitedBusinessType: "号",           // GSP控制类型 VARCHAR(200)
            //        orgCode: "组织机构代码号",             // 组织机构代码证号 // VARCHAR(50)
            //        orgCodeValidateDate: "2016-12-17",   // 组织机构代码证期限
            //
            //        taxRegistrationLicenseNum: "税务登记证号",    // VARCHAR(50)
            //        taxRegistrationLicenseNumValidateDate: "2017-9-12", // 税务登记证期限
            //        foodCirculationLicenseNum: "食品流通许可证号",  // VARCHAR(50)
            //        foodCirculationLicenseNumValidateDate: "2017-9-13", // 食品流通许可证号期限
            //        qualityAssuranceLicenseNum: "质量保证协议号",  // VARCHAR(50)
            //
            //        qualityAssuranceLicenseNumValidateDate: "2017-9-14",    // 质量保证协议号期限
            //        medicalApparatusLicenseNum: "医疗器械许可证号", // VARCHAR(50)
            //        medicalApparatusLicenseNumValidateDate: "2017-9-15",    // 医疗器械许可证号期限
            //        medicalApparatusType: "医疗器械类号",         // VARCHAR(50)
            //        healthProductsLicenseNum: "保健品证书号",     // VARCHAR(50)
            //
            //        healthProductsLicenseNumValidateDate: "2017-9-16",  // 保健品证书号期限
            //        productionAndBusinessLicenseNum: "生产经营许可证号",    // VARCHAR(50)
            //        productionAndBusinessLicenseNumIssuedDate: "2017-9-17", // 生产经营许可证发证日期
            //        productionAndBusinessLicenseNumValidateDate: "2017-9-18",   // 生产经营许可证有效期
            //        productionAndBusinessLicenseNumIssuedDepartment: "生产经营许可证发证机关号", // 生产经营许可证发证机关 // VARCHAR(100)
            //
            //        storageAddress: "仓库地址",     // 仓库地址 // VARCHAR(200)
            //        mentaanesthesiaLicenseNum: "精神麻醉证号",        // 精神麻醉证号 VARCHAR(50)
            //        mentalanesthesiaLicenseNumValidateDate: "2017-9-19",        // 精神麻醉证书有效期
            //        gmpOrGspLicenseNum: "GMP/GSP证书号",           // VARCHAR(50)
            //        gmpOrGspLicenseNumValidateDate: "2017-9-20",    // GMP/GSP证书有效期
            //
            //        hazardousChemicalsLicenseNum: "危化品许可证号",        // VARCHAR(50)
            //        hazardousChemicalsLicenseNumValidateDate: "2017-9-21",      // 危化品许可证有效期
            //        medicalInstitutionLicenseNum: "医疗机构执业许可证号号",    // VARCHAR(50)
            //        medicalInstitutionLicenseNumValidateDate: "2017-9-22",      // 医疗机构执业许可证号有效期
            //        maternalLicenseNum: "母婴保健技术执业许可证号号",        // VARCHAR(50)
            //
            //        maternalLicenseNumValidateDate: "2017-9-23",        // 母婴保健技术执业许可证号有效期
            //        institutionLegalPersonCert: "事业单位法人证书号",        // VARCHAR(50)
            //        institutionLegalPersonCertValidateDate: "2017-9-24",    // 事业单位法人证书有效期
            //        gspImages: "/img/pages/about-personal.png,/img/pages/about-personal.png,/img/pages/about-personal.png,/img/pages/about-personal.png,/img/pages/about-personal.png"  //证书图像 VARCHAR(8192)
            //    },
            //    {
            //        businessLicense: "123456723",
            //        clientCode: "buyer4ClientCode23",
            //        mobile: "18202835213",
            //
            //        clientCategoryErpCode: "2",
            //        clientArea: "四川成都美年",
            //        clientName: "神木客户4",
            //
            //        pricePlan: "price3",
            //        email: "zhaopeng@qq.com",
            //        fax: "0817-5835990",
            //        defaultAddressId: "1",
            //
            //        defaultAddressReceiver: "赵鹏",
            //        defaultAddressTelNum: "18202835971",
            //        defaultAddressMobileNum: "18202835971",
            //        defaultAddressPostCode: "610000",
            //        defaultAddressProvinceFirstStage: "四川",
            //
            //        defaultAddressCitySecondStage: "成都",
            //        defaultAddressCountiesThirdStage: "高新区",
            //        defaultAddressDetailAddress: "美年广场",
            //        defaultAddressRemark: "仅工作日收货",
            //        paymentReminderMsg: "付款信息",
            //
            //        stampLink: "/upload/2015122815032658.png",
            //        registerStatus: "APPROVED",
            //        checkComments: "同意",
            //        readOnly: "false",
            //        enabled: "ENABLED",
            //
            //        legalRepresentative: "赵鹏",
            //        companyManager: "赵鹏",
            //        businessLicenseValidateDate: "2015-12-12",
            //        registeredCapital: "1000000",
            //
            //        businessAddress: "四川成都美年广场",
            //        limitedBusinessRange: "仅限普通药品",
            //        limitedBusinessType: "balabala",
            //        orgCode: "组织机构代码balabala",
            //        orgCodeValidateDate: "2016-12-17",
            //
            //        taxRegistrationLicenseNum: "税务登记证balabala",
            //        taxRegistrationLicenseNumValidateDate: "2017-9-12",
            //        foodCirculationLicenseNum: "食品流通许可证balabala",
            //        foodCirculationLicenseNumValidateDate: "2017-9-13",
            //        qualityAssuranceLicenseNum: "质量保证协议号labala",
            //
            //        qualityAssuranceLicenseNumValidateDate: "2017-9-14",
            //        medicalApparatusLicenseNum: "医疗器械许可证号balabala",
            //        medicalApparatusLicenseNumValidateDate: "2017-9-15",
            //        medicalApparatusType: "医疗器械类别balabala",
            //        healthProductsLicenseNum: "保健品证书balabala",
            //
            //        healthProductsLicenseNumValidateDate: "2017-9-16",
            //        productionAndBusinessLicenseNum: "生产经营许可证balabalaa",
            //        productionAndBusinessLicenseNumIssuedDate: "2017-9-17",
            //        productionAndBusinessLicenseNumValidateDate: "2017-9-18",
            //        productionAndBusinessLicenseNumIssuedDepartment: "生产经营许可证发证机关balabala",
            //
            //        storageAddress: "仓库地址balabla",
            //        mentaanesthesiaLicenseNum: "精神麻醉证balabala",
            //        mentalanesthesiaLicenseNumValidateDate: "2017-9-19",
            //        gmpOrGspLicenseNum: "GMP/GSP证书号balabala",
            //        gmpOrGspLicenseNumValidateDate: "2017-9-20",
            //
            //        hazardousChemicalsLicenseNum: "危化品许可证balabala",
            //        hazardousChemicalsLicenseNumValidateDate: "2017-9-21",
            //        medicalInstitutionLicenseNum: "医疗机构执业许可证号balabala",
            //        medicalInstitutionLicenseNumValidateDate: "2017-9-22",
            //        maternalLicenseNum: "母婴保健技术执业许可证号balabala",
            //
            //        maternalLicenseNumValidateDate: "2017-9-23",
            //        institutionLegalPersonCert: "事业单位法人证书balabala",
            //        institutionLegalPersonCertValidateDate: "2017-9-24",
            //        gspImages: "/img/pages/about-personal.png,/img/pages/about-personal.png,/img/pages/about-personal.png,/img/pages/about-personal.png,/img/pages/about-personal.png"
            //    }
            //];
            var asyncFailedClient = [];
            async.mapSeries(
                clients,
                function mapSeriesIteration(clientItemInfo, callback) {
                    // 0. 先取营业执照号码
                    // 1. 先用营业执照号搜索
                    // 2. 若不存在, 则插入新的用户(现在clientAddress中写入一条记录,拿到id, 在再client中clientgsp中写入一条信息)
                    // 3. 若存在,用营业执照号做唯一键更新clientGsp表, 再更新client表(先用营业执照在ClientCsp表中找到clientId, 再用clientId更新client信息)
                    // 4. 再从client中查出clientAddressId, 更新clientAddress表
                    var businessLicense = clientItemInfo.businessLicense;               // 营业执照
                    var clientCategoryErpCode = clientItemInfo.clientCategoryErpCode;   // 客户分类Code
                    var isClientExist = false;                                          // 标志客户是否存在
                    var clientId = null;                                                // 客户ID
                    var clientCategoryId = null;                                        // 客户分类在SCC中对应的ID
                    var clientAddressId = null;                                         // 客户地址Id
                    var enterpriseId = null;                                            // 企业Id

                    // 通过分类的erpCode查询客户分类信息,取客户分类id
                    dbService.retrieveClientCategoryInfoByErpCode(customerDbName, clientCategoryErpCode, function (error, clientCategoryInfo) {
                        if (error) {
                            logger.error(error);
                            asyncFailedClient.push(clientItemInfo);
                            return callback(null, '同步客户时访问数据库出现错误');
                        }

                        if (clientCategoryInfo.length!==1 || !clientCategoryInfo[0] || !clientCategoryInfo[0].clientCategoryId) {
                            return callback(null, '同步客户时客户分类数据不正确,已取消,' + businessLicense);
                        }
                        clientCategoryId = clientCategoryInfo[0].clientCategoryId;

                        // 用businessLicense查clientId
                        dbService.retrieveClientInfoByBusinessLicense(customerDbName, businessLicense, function (error, clientInfo) {
                            if (error) {
                                logger.error(error);
                                asyncFailedClient.push(clientItemInfo);
                                return callback(null, '同步客户时访问数据库出现错误');
                            }

                            if (clientInfo.length > 1) {
                                return callback(null, '同步客户时数据库出现相同的营业执照,已取消,' + businessLicense);
                            }
                            if (clientInfo.length === 1 && !clientInfo[0].clientId) {
                                return callback(null, '同步客户时没有有效的ClientId,' + businessLicense);
                            }
                            isClientExist = clientInfo.length === 1;
                            if (!isClientExist) {
                                // 添加一个新客户  顺序是:  client -> clientGsp -.clientAddress -> cloudDb.customer -> operator
                                dbService.beginTrans(function (connection) {
                                    async.series(
                                        [
                                            function (done) {
                                                var insertObj = {
                                                    clientCategoryId: clientCategoryId,
                                                    clientCode: clientItemInfo.clientCode,
                                                    clientArea: clientItemInfo.clientArea,
                                                    clientName: clientItemInfo.clientName,
                                                    pricePlan: clientItemInfo.pricePlan,
                                                    email: clientItemInfo.email,
                                                    mobile: clientItemInfo.mobile,
                                                    fax: clientItemInfo.fax,
                                                    paymentReminderMsg: clientItemInfo.paymentReminderMsg,
                                                    stampLink: clientItemInfo.stampLink,
                                                    registerStatus: clientItemInfo.registerStatus.toString().toUpperCase(),  // CREATED, APPROVED, UPDATED, REJECTED
                                                    checkComments: clientItemInfo.checkComments,
                                                    readOnly: Number(Boolean(clientItemInfo.readOnly)),         // bool
                                                    enabled: clientItemInfo.enabled.toString().toUpperCase()    // ENUM NEEDAPPROVAL, DISABLED, ENABLED
                                                };
                                                // 将地址信息写入数据库
                                                dbService.transactionInsertClient(connection, customerDbName, insertObj, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done(error);
                                                    }
                                                    clientId = result.insertId;
                                                    done(error, result);
                                                });
                                            },
                                            function (done) {
                                                var insertObj = {
                                                    clientId: clientId,
                                                    legalRepresentative: clientItemInfo.legalRepresentative,
                                                    businessLicense: clientItemInfo.businessLicense,
                                                    companyManager: clientItemInfo.companyManager,
                                                    businessLicenseValidateDate: moment(new Date(clientItemInfo.businessLicenseValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    registeredCapital: clientItemInfo.registeredCapital,
                                                    businessAddress: clientItemInfo.businessAddress,
                                                    limitedBusinessRange: clientItemInfo.limitedBusinessRange,
                                                    limitedBusinessType: clientItemInfo.limitedBusinessType,
                                                    orgCode: clientItemInfo.orgCode,
                                                    orgCodeValidateDate: moment(new Date(clientItemInfo.orgCodeValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    taxRegistrationLicenseNum: clientItemInfo.taxRegistrationLicenseNum,
                                                    taxRegistrationLicenseNumValidateDate: moment(new Date(clientItemInfo.taxRegistrationLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    foodCirculationLicenseNum: clientItemInfo.foodCirculationLicenseNum,
                                                    foodCirculationLicenseNumValidateDate: moment(new Date(clientItemInfo.foodCirculationLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    qualityAssuranceLicenseNum: clientItemInfo.qualityAssuranceLicenseNum,
                                                    qualityAssuranceLicenseNumValidateDate: moment(new Date(clientItemInfo.qualityAssuranceLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    medicalApparatusLicenseNum: clientItemInfo.medicalApparatusLicenseNum,
                                                    medicalApparatusLicenseNumValidateDate: moment(new Date(clientItemInfo.medicalApparatusLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    medicalApparatusType: clientItemInfo.medicalApparatusType,
                                                    healthProductsLicenseNum: clientItemInfo.healthProductsLicenseNum,
                                                    healthProductsLicenseNumValidateDate: moment(new Date(clientItemInfo.healthProductsLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    productionAndBusinessLicenseNum: clientItemInfo.productionAndBusinessLicenseNum,
                                                    productionAndBusinessLicenseNumIssuedDate: moment(new Date(clientItemInfo.productionAndBusinessLicenseNumIssuedDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    productionAndBusinessLicenseNumValidateDate: moment(new Date(clientItemInfo.productionAndBusinessLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    productionAndBusinessLicenseNumIssuedDepartment: clientItemInfo.productionAndBusinessLicenseNumIssuedDepartment,
                                                    storageAddress: clientItemInfo.storageAddress,
                                                    mentaanesthesiaLicenseNum: clientItemInfo.mentaanesthesiaLicenseNum,
                                                    mentalanesthesiaLicenseNumValidateDate: moment(new Date(clientItemInfo.mentalanesthesiaLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    gmpOrGspLicenseNum: clientItemInfo.gmpOrGspLicenseNum,
                                                    gmpOrGspLicenseNumValidateDate: moment(new Date(clientItemInfo.gmpOrGspLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    hazardousChemicalsLicenseNum: clientItemInfo.hazardousChemicalsLicenseNum,
                                                    hazardousChemicalsLicenseNumValidateDate: moment(new Date(clientItemInfo.hazardousChemicalsLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    medicalInstitutionLicenseNum: clientItemInfo.medicalInstitutionLicenseNum,
                                                    medicalInstitutionLicenseNumValidateDate: moment(new Date(clientItemInfo.medicalInstitutionLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    maternalLicenseNum: clientItemInfo.maternalLicenseNum,
                                                    maternalLicenseNumValidateDate: moment(new Date(clientItemInfo.maternalLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    institutionLegalPersonCert: clientItemInfo.institutionLegalPersonCert,
                                                    institutionLegalPersonCertValidateDate: moment(new Date(clientItemInfo.institutionLegalPersonCertValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    gspImages: clientItemInfo.gspImages
                                                };
                                                dbService.transactionInsertClientGsp(connection, customerDbName, insertObj, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done(error);
                                                    }
                                                    done(null, result);
                                                });
                                            },
                                            function (done) {
                                                var insertObj = {
                                                    clientId: clientId,
                                                    receiver: clientItemInfo.defaultAddressReceiver,
                                                    telNum: clientItemInfo.defaultAddressTelNum,
                                                    mobileNum: clientItemInfo.defaultAddressMobileNum,
                                                    postCode: clientItemInfo.defaultAddressPostCode,
                                                    provinceFirstStage: clientItemInfo.defaultAddressProvinceFirstStage,
                                                    citySecondStage: clientItemInfo.defaultAddressCitySecondStage,
                                                    countiesThirdStage: clientItemInfo.defaultAddressCountiesThirdStage,
                                                    detailAddress: clientItemInfo.defaultAddressDetailAddress,
                                                    remark: clientItemInfo.defaultAddressRemark
                                                };
                                                dbService.transactionInsertClientAddress(connection, customerDbName, insertObj, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done();
                                                    }
                                                    clientAddressId = result.insertId;
                                                    done(null, result);
                                                });
                                            },
                                            function (done) {
                                                //"   customerName, " +
                                                //"   enterpriseType, " +
                                                //"   enabled, " +
                                                //"   description, " +
                                                //"   stampLink, " +
                                                //"   businessLicense, " +
                                                //"   businessLicenseValidateDate, " +
                                                //"   businessAddress, " +
                                                //"   legalRepresentative) " +
                                                var enterpriseType = "BUYER";
                                                var insertObj = {
                                                    customerName: clientItemInfo.clientName,
                                                    enterpriseType: enterpriseType,
                                                    enabled: Number(!Boolean(clientItemInfo.readOnly)),
                                                    description: clientItemInfo.checkComments,
                                                    stampLink: clientItemInfo.stampLink,
                                                    businessLicense: clientItemInfo.businessLicense,
                                                    businessLicenseValidateDate: clientItemInfo.businessLicenseValidateDate,
                                                    businessAddress: clientItemInfo.businessAddress,
                                                    legalRepresentative: clientItemInfo.legalRepresentative
                                                };
                                                dbService.transactionInsertCustomer(connection, cloudDbName, insertObj, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done(error);
                                                    }
                                                    enterpriseId = result.insertId;
                                                    done(null, result);
                                                });
                                            },
                                            function (done) {
                                                var insertObj = {
                                                    username: clientItemInfo.mobile,
                                                    password: clientItemInfo.mobile,
                                                    customerId: enterpriseId,
                                                    clientId: clientId,
                                                    operatorName: clientItemInfo.clientName,
                                                    mobileNum: clientItemInfo.mobile,
                                                    email: clientItemInfo.email
                                                };
                                                dbService.transactionInsertOperator(connection, customerDbName, insertObj, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done(error);
                                                    }
                                                    done(null, result);
                                                });
                                            },
                                            function (done) {
                                                dbService.transactionUpdateClientSetDefaultAddressId(connection, customerDbName, clientAddressId, clientId, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done(error);
                                                    }
                                                    done(null, result);
                                                })
                                            }
                                        ],
                                        function seriesErrorHandler(error, results) {
                                            if (error) {
                                                logger.error(error);
                                                dbService.rollbackTrans(connection, function () {
                                                    asyncFailedClient.push(clientItemInfo);
                                                    callback(null, '同步失败(写入时):' + businessLicense);
                                                });
                                            } else {
                                                dbService.commitTrans(connection, function () {
                                                    callback(null, results);
                                                });
                                            }
                                        }
                                    );
                                });
                            } else if (isClientExist) {
                                clientId = clientInfo[0].clientId;
                                var defaultAddressId = clientInfo[0].defaultAddressId;
                                var businessLicense = clientInfo[0].businessLicense;
                                // 将客户信更新
                                dbService.beginTrans(function (connection) {
                                    // 更新顺序是: client, clientGsp, clientAddress, cloudDb.customer
                                    async.series(
                                        [
                                            // 更新client表
                                            function (done) {
                                                var updateObj = {
                                                    clientId: clientId,
                                                    clientCategoryId: clientCategoryId,
                                                    clientCode: clientItemInfo.clientCode,
                                                    clientArea: clientItemInfo.clientArea,
                                                    clientName: clientItemInfo.clientName,
                                                    pricePlan: clientItemInfo.pricePlan,
                                                    email: clientItemInfo.email,
                                                    mobile: clientItemInfo.mobile,
                                                    fax: clientItemInfo.fax,
                                                    paymentReminderMsg: clientItemInfo.paymentReminderMsg,
                                                    stampLink: clientItemInfo.stampLink,
                                                    registerStatus: clientItemInfo.registerStatus.toString().toUpperCase(),  // CREATED, APPROVED, UPDATED, REJECTED
                                                    checkComments: clientItemInfo.checkComments,
                                                    readOnly: Number(Boolean(clientItemInfo.readOnly)),         // bool
                                                    enabled: clientItemInfo.enabled.toString().toUpperCase()    // ENUM NEEDAPPROVAL, DISABLED, ENABLED
                                                };
                                                dbService.transactionUpdateClientFromErp(connection, customerDbName, updateObj, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done(error);
                                                    }
                                                    done(null, result);
                                                });
                                            },
                                            // 更新clientGsp
                                            function (done) {
                                                var updateObj = {
                                                    legalRepresentative: clientItemInfo.legalRepresentative,
                                                    businessLicense: businessLicense,
                                                    companyManager: clientItemInfo.companyManager,
                                                    businessLicenseValidateDate: moment(new Date(clientItemInfo.businessLicenseValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    registeredCapital: clientItemInfo.registeredCapital,
                                                    businessAddress: clientItemInfo.businessAddress,
                                                    limitedBusinessRange: clientItemInfo.limitedBusinessRange,
                                                    limitedBusinessType: clientItemInfo.limitedBusinessType,
                                                    orgCode: clientItemInfo.orgCode,
                                                    orgCodeValidateDate: moment(new Date(clientItemInfo.orgCodeValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    taxRegistrationLicenseNum: clientItemInfo.taxRegistrationLicenseNum,
                                                    taxRegistrationLicenseNumValidateDate: moment(new Date(clientItemInfo.taxRegistrationLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    foodCirculationLicenseNum: clientItemInfo.foodCirculationLicenseNum,
                                                    foodCirculationLicenseNumValidateDate: moment(new Date(clientItemInfo.foodCirculationLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    qualityAssuranceLicenseNum: clientItemInfo.qualityAssuranceLicenseNum,
                                                    qualityAssuranceLicenseNumValidateDate: moment(new Date(clientItemInfo.qualityAssuranceLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    medicalApparatusLicenseNum: clientItemInfo.medicalApparatusLicenseNum,
                                                    medicalApparatusLicenseNumValidateDate: moment(new Date(clientItemInfo.medicalApparatusLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    medicalApparatusType: clientItemInfo.medicalApparatusType,
                                                    healthProductsLicenseNum: clientItemInfo.healthProductsLicenseNum,
                                                    healthProductsLicenseNumValidateDate: moment(new Date(clientItemInfo.healthProductsLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    productionAndBusinessLicenseNum: clientItemInfo.productionAndBusinessLicenseNum,
                                                    productionAndBusinessLicenseNumIssuedDate: moment(new Date(clientItemInfo.productionAndBusinessLicenseNumIssuedDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    productionAndBusinessLicenseNumValidateDate: moment(new Date(clientItemInfo.productionAndBusinessLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    productionAndBusinessLicenseNumIssuedDepartment: clientItemInfo.productionAndBusinessLicenseNumIssuedDepartment,
                                                    storageAddress: clientItemInfo.storageAddress,
                                                    mentaanesthesiaLicenseNum: clientItemInfo.mentaanesthesiaLicenseNum,
                                                    mentalanesthesiaLicenseNumValidateDate: moment(new Date(clientItemInfo.mentalanesthesiaLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    gmpOrGspLicenseNum: clientItemInfo.gmpOrGspLicenseNum,
                                                    gmpOrGspLicenseNumValidateDate: moment(new Date(clientItemInfo.gmpOrGspLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    hazardousChemicalsLicenseNum: clientItemInfo.hazardousChemicalsLicenseNum,
                                                    hazardousChemicalsLicenseNumValidateDate: moment(new Date(clientItemInfo.hazardousChemicalsLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    medicalInstitutionLicenseNum: clientItemInfo.medicalInstitutionLicenseNum,
                                                    medicalInstitutionLicenseNumValidateDate: moment(new Date(clientItemInfo.medicalInstitutionLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    maternalLicenseNum: clientItemInfo.maternalLicenseNum,
                                                    maternalLicenseNumValidateDate: moment(new Date(clientItemInfo.maternalLicenseNumValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    institutionLegalPersonCert: clientItemInfo.institutionLegalPersonCert,
                                                    institutionLegalPersonCertValidateDate: moment(new Date(clientItemInfo.institutionLegalPersonCertValidateDate)).format('YYYY-MM-DD HH:mm:ss'),
                                                    gspImages: clientItemInfo.gspImages
                                                };
                                                dbService.transactionUpdateClientGspFromErp(connection, customerDbName, updateObj, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done(error);
                                                    }
                                                    done(null, result);
                                                });
                                            },
                                            // 更新clientAddress
                                            function (done) {
                                                var updateObj = {
                                                    defaultAddressId: defaultAddressId,
                                                    receiver: clientItemInfo.defaultAddressReceiver,
                                                    telNum: clientItemInfo.defaultAddressTelNum,
                                                    mobileNum: clientItemInfo.defaultAddressMobileNum,
                                                    postCode: clientItemInfo.defaultAddressPostCode,
                                                    provinceFirstStage: clientItemInfo.defaultAddressProvinceFirstStage,
                                                    citySecondStage: clientItemInfo.defaultAddressCitySecondStage,
                                                    countiesThirdStage: clientItemInfo.defaultAddressCountiesThirdStage,
                                                    detailAddress: clientItemInfo.defaultAddressDetailAddress,
                                                    remark: clientItemInfo.defaultAddressRemark
                                                };
                                                dbService.transactionUpdateClientAddressFromErp(connection, customerDbName, updateObj, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done(error);
                                                    }
                                                    done(null, result);
                                                });
                                            },
                                            // 更新cloudDb.customer
                                            function (done) {
                                                var updateObj = {
                                                    customerName: clientItemInfo.clientName,
                                                    enabled: Number(!Boolean(clientItemInfo.readOnly)),
                                                    description: clientItemInfo.checkComments,
                                                    stampLink: clientItemInfo.stampLink,
                                                    businessLicense: businessLicense,
                                                    businessLicenseValidateDate: clientItemInfo.businessLicenseValidateDate,
                                                    businessAddress: clientItemInfo.businessAddress,
                                                    legalRepresentative: clientItemInfo.legalRepresentative
                                                };
                                                dbService.transactionUpdateCustomerFromErp(connection, cloudDbName, updateObj, function (error, result) {
                                                    if (error) {
                                                        logger.error(error);
                                                        return done(error);
                                                    }
                                                    done(null, result);
                                                });
                                            }
                                        ],
                                        function (error, results) {
                                            if (error) {
                                                logger.error(error);
                                                dbService.rollbackTrans(connection, function () {
                                                    asyncFailedClient.push(clientItemInfo);
                                                    callback(null, '同步失败(更新时):' + businessLicense);
                                                });
                                            } else {
                                                dbService.commitTrans(connection, function () {
                                                    callback(null, results);
                                                });
                                            }
                                        }
                                    );
                                });
                            }
                        });
                    });
                },
                function mapSeriesErrorHandler(error, results) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    callback(null, results, asyncFailedClient);
                }
            );
        });
    });
};

MsgTransmitter.prototype.B2B_REQUEST_CLIENT_CATEGORY_TO_SELLER = function (enterpriseId, callback) {
    logger.enter();

    var msgType = "B2B_REQUEST_CLIENT_CATEGORY_TO_SELLER";
    var cloudDbName = this.cloudDbName;
    var dbService = this.dbService;
    var apiRobot = this.apiRobot;

    dbService.enterpriseInfoRetrieve(cloudDbName, {enterpriseId:enterpriseId}, function (error, sellerEnterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        sellerEnterpriseInfo = sellerEnterpriseInfo[0];
        if (sellerEnterpriseInfo === undefined) {
            return callback(new Error('没有找到卖家有对应的数据库!!'));
        }
        var customerDbName = sysconf.customerDBPrefix + '_' + sellerEnterpriseInfo.customerDBSuffix;
        var msgData = {};
        apiRobot.sendMsg(enterpriseId, msgType, msgData, function (error, feedback) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            try{
                var clientCategorys = JSON.parse(feedback.data).DataItem;
            }catch(err){
                logger.error(err);
                return callback(err);
            }

            var isDeleted = 0;
            clientCategorys = _.map(clientCategorys, function (item) {
                var temp = [];
                temp.push(item.CODE);           // erpCode
                temp.push(item.Name);           // category name
                temp.push(item.ParentGUID);     // parentCode
                temp.push(item.HelpCode);       // shorthand code
                temp.push(isDeleted);           // isDeleted
                return temp;
            });
            dbService.beginTrans(function (connection) {
                async.series(
                    [
                        function (callback) {
                            dbService.transactionUpdateClientCategorySetAllDeleted(connection, customerDbName, function (error, result) {
                                if (error) {
                                    logger.error(error);
                                    return callback(error);
                                }

                                callback(null, result);
                            });
                        },
                        function (callback) {
                            dbService.transactionInsertClientCategoryFromErp(connection, customerDbName, clientCategorys, function (error, result) {
                                if (error) {
                                    logger.error(error);
                                    return callback(error);
                                }

                                callback(null, result);
                            });
                        }
                    ],
                    function (error, results) {
                        if (error) {
                            logger.error(error);
                            dbService.rollbackTrans(connection, function () {
                                callback(error);
                            });
                        } else {
                            dbService.commitTrans(connection, function () {
                                callback(null, results);
                            });
                        }
                    }
                );
            });
        });
    });
};

MsgTransmitter.prototype.B2B_REQUEST_SKU_TO_SELLER = function (enterpriseId, callback) {
    logger.enter();

    var msgType = "B2B_REQUEST_SKU_TO_SELLER";
    var cloudDbName = this.cloudDbName;
    var dbService = this.dbService;
    var apiRobot = this.apiRobot;

    dbService.enterpriseInfoRetrieve(cloudDbName, {enterpriseId:enterpriseId}, function (error, sellerEnterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        sellerEnterpriseInfo = sellerEnterpriseInfo[0];
        if (sellerEnterpriseInfo === undefined) {
            return callback(new Error('没有找到卖家有对应的数据库!!'));
        }
        var customerDbName = sysconf.customerDBPrefix + '_' + sellerEnterpriseInfo.customerDBSuffix;
        var now = new Date();

        var msgData = {
            updateTime: now.toLocaleDateString() + ' ' + now.toLocaleTimeString()
        };

        msgData.updateTime = '2016-03-23 10:30:20';
        var start = new Date();
        apiRobot.sendMsg(enterpriseId, msgType, msgData, function (error, feedback) {
            if (error) {
                logger.error(error);
                return callback(error);
            }
            var end = new Date();
            try{
                var goodsInventoryItems = JSON.parse(feedback.data).OnLineStockSet;
            }catch(err){
                logger.error(err);
                return callback(err);
            }


            //goodsInventoryItems = [
            //    {
            //        HH: '7070704017',
            //        PZWH: '国药准字Z20026560',
            //        OffLineQuantity: 366,
            //        UpdateDate: '2016-03-23T16:36:20.81'
            //    },
            //    {
            //        HH: '7070704016',
            //        PZWH: '国药准字H20065761',
            //        OffLineQuantity: 367,
            //        UpdateDate: '2016-03-23T16:36:20.81'
            //    },
            //    {
            //        HH: '7090103001',
            //        PZWH: '国药准字H10960139',
            //        OffLineQuantity: 368,
            //        UpdateDate: '2016-03-23T16:36:20.81'
            //    },
            //    {
            //        HH: 'abc',
            //        PZWH: '国药准字H20051858',
            //        OffLineQuantity: '369',
            //        UpdateDate: '2016-03-23T16:36:20.81'
            //    }
            //];

            async.mapSeries(goodsInventoryItems, function(goodsInventoryItem, callback) {
                var goodsNo = goodsInventoryItem.HH;

                dbService.goodsIdRetrieveByGoodsNo(customerDbName, goodsNo, function (error, goodsInfo) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    if (goodsInfo.length === 0) {
                        return callback(null, '没有找到goodsId');
                    }
                    var goodsId = goodsInfo[0].goodsId;
                    var goodsInventoryArr = [[goodsId, goodsInventoryItem.OffLineQuantity]];
                    dbService.insertUpdateGoodsInventory(customerDbName, goodsInventoryArr, function(error, result) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }

                        callback(null, result);
                    });
                });
            }, function (error, results) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, results)
            });
        });
    });
};

MsgTransmitter.prototype.B2B_REQUEST_GOODS_TYPES_TO_SELLER = function (enterpriseId, callback) {
    logger.enter();

    var dbService = this.dbService;
    var cloudDbName = this.cloudDbName;
    var apiRobot = this.apiRobot;
    var msgType = "B2B_REQUEST_GOODS_TYPES_TO_SELLER";
    var msgData = {};

    dbService.enterpriseInfoRetrieve(cloudDbName, {enterpriseId:enterpriseId}, function (error, enterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        enterpriseInfo = enterpriseInfo[0];
        if (enterpriseInfo === undefined) {
            return callback(new Error('没有找到卖家有对应的数据库!!'));
        }
        var enterpriseDbName = sysconf.customerDBPrefix + '_' + enterpriseInfo.customerDBSuffix;
        apiRobot.sendMsg(enterpriseId, msgType, msgData, function (error, feedback) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            try{
                var goodsTypes = JSON.parse(feedback.data).KCLB;
            }catch(err){
                logger.error(err);
                return callback(err);
            }

            var isDeleted = 0;
            goodsTypes = _.map(goodsTypes, function (item) {
                var temp = [];
                temp.push(item.ID);
                temp.push(item.Name);
                temp.push(item.HelpCode);
                temp.push(item.FParentID);
                temp.push(item.LBID);
                temp.push(isDeleted);
                return temp;
            });
            dbService.beginTrans(function (connection) {
                async.series(
                    [
                        function (callback) {
                            dbService.transactionUpdateGoodsTypesSetAllDeleted(connection, enterpriseDbName, function (error, result) {
                                if (error) {
                                    logger.error(error);
                                    return callback(error);
                                }

                                callback(null, result);
                            });
                        },
                        function (callback) {
                            dbService.transactionInsertUpdateGoodsTypesFromErp(connection, enterpriseDbName, goodsTypes, function (error, result) {
                                if (error) {
                                    logger.error(error);
                                    return callback(error);
                                }

                                callback(null, result);
                            });
                        }
                    ],
                    function (error, result) {
                        if (error) {
                            logger.error(error);
                            dbService.rollbackTrans(connection, function () {
                                callback(error);
                            });
                        } else {
                            dbService.commitTrans(connection, function () {
                                callback(null, result);
                            });
                        }
                    }
                );
            });
        });
    });
};

MsgTransmitter.prototype.B2B_REQUEST_GOODS_WILL_BE_EXPIRED_TO_SELLER = function (enterpriseId, expirationDate, callback) {
    logger.enter();

    var dbService = this.dbService;
    var cloudDbName = this.cloudDbName;
    var apiRobot = this.apiRobot;
    var msgType = "REQUEST_GOODS_WILL_BE_EXPIRED_TO_SELLER";
    var msgData = {expirationDate: expirationDate};

    dbService.enterpriseInfoRetrieve(cloudDbName, {enterpriseId:enterpriseId}, function (error, enterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        enterpriseInfo = enterpriseInfo[0];
        if (enterpriseInfo === undefined) {
            return callback(new Error('没有找到卖家有对应的数据库!!'));
        }
        var enterpriseDbName = sysconf.customerDBPrefix + '_' + enterpriseInfo.customerDBSuffix;

        apiRobot.sendMsg(enterpriseId, msgType, msgData, function sendMsgCallback(error, feedback) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            try{
                var goods = JSON.parse(feedback.data).PHK;
            }catch(err){
                logger.error(err);
                return callback(err);
            }

            saveGoodsWillExpired(enterpriseDbName, goods, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        });
    });
};

MsgTransmitter.prototype.B2B_REQUEST_GSP_RANGE_TO_SELLER = function (enterpriseId, callback) {
    var dbService = this.dbService;
    var cloudDbName = this.cloudDbName;
    var apiRobot = this.apiRobot;
    var msgType = "B2B_REQUEST_GSP_RANGE_TO_SELLER";
    var msgData = {};

    dbService.enterpriseInfoRetrieve(cloudDbName, {enterprieseId:enterpriseId}, function (error, enterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        enterpriseInfo = enterpriseInfo[0];
        if (enterpriseInfo === undefined) {
            return callback(new Error('没有找到卖家有对应的数据库!!'));
        }
        var customerDbName = sysconf.customerDBPrefix + '_' + enterpriseInfo.customerDBSuffix;

        apiRobot.sendMsg(enterpriseId, msgType, msgData, function (error, feedback) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            try{
                var goodsGspTypes = JSON.parse(feedback.data).DataItem;
            }catch(err){
                logger.error(err);
                return callback(err);
            }

            goodsGspTypes = _.map(goodsGspTypes, function (item) {
                var temp = [];
                temp.push(item.CODE);
                temp.push(item.Name);
                temp.push(item.HelpCode);
                return temp;
            });
            dbService.insertGoodsGspTypes(customerDbName, goodsGspTypes, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                callback(null, result);
            });
        });
    });
};

MsgTransmitter.prototype.B2B_INSERT_CLIENT_SALE_SCOPE = function (enterpriseId, callback) {
    var dbService = this.dbService;
    var cloudDbName = this.cloudDbName;
    var apiRobot = this.apiRobot;
    var msgType = "B2B_INSERT_CLIENT_SALE_SCOPE";
    var msgData = {};

    dbService.enterpriseInfoRetrieve(cloudDbName, {enterpriseId:enterpriseId}, function (error, enterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        enterpriseInfo = enterpriseInfo[0];
        if (enterpriseInfo === undefined) {
            return callback(new Error('没有找到卖家有对应的数据库!!'));
        }
        var customerDbName = sysconf.customerDBPrefix + '_' + enterpriseInfo.customerDBSuffix;

        dbService.retrieveClientLimitedBusinessRangeAll(customerDbName, function (error, clientInfo) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            var clientInfoItems = _.map(clientInfo, function (item) {
                return _.pick(item, function (key, value) {
                    return key === "limitedBusinessRange" || key === "clientId";
                });
            });

            // test data
            clientInfoItems = [
                {
                    clientId: 1,
                    limitedBusinessRange: "精神药品A类,疫苗类,冷藏类"
                },
                {
                    clientId: 1,
                    limitedBusinessRange: "疫苗类,冷藏类"
                }
            ];
            async.mapSeries(
                clientInfoItems,
                function (clientInfoItem, callback) {
                    var limitedBusinessRange = clientInfoItem.limitedBusinessRange;
                    var clienId = clientInfoItem.clientId;

                    var goodsGspTypeNames = limitedBusinessRange.split(",");
                    goodsGspTypeNames = _.compact(goodsGspTypeNames);

                    dbService.retrieveGoodsGspTypeIdGoodsGspTypeName(customerDbName, goodsGspTypeNames, function () {

                    });
                }
            );

        });
    });





};

MsgTransmitter.prototype.EDI_REQUEST_BUYER_ALL_TO_SELLER = function (enterpriseId, callback) {
    var dbService = this.dbService;
    var cloudDbName = this.cloudDbName;
    var apiRobot = this.apiRobot;
    var msgType = "REQUEST_CLIENT_TO_SELLER";

    dbService.enterpriseInfoRetrieve(cloudDbName, {id:enterpriseId}, function (error, sellerEnterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        sellerEnterpriseInfo = sellerEnterpriseInfo[0];
        if (sellerEnterpriseInfo === undefined) {
            logger.warn('没有找到卖家有对应的数据库!!');
            return callback(null);
        }
        var customerDbName = sysconf.customerDBPrefix + '_' + sellerEnterpriseInfo.customerDBSuffix;
        var msgData = {};

        apiRobot.sendMsg(enterpriseId, msgType, msgData, function sendMsgCallback(error, feedback) {
            if (error) {
                logger.error(error);
                return callback(error);
            }
            try{
                var buyers = JSON.parse(feedback.data).BUYER;
            }catch(err){
                // feedback ={"status":1006,"msg":"无效的APPCODE","data":{}}
                logger.error(err);
                logger.warn('没有收到没有有效的的数据');
                return callback(null);
            }
            // 从收到的数据中筛选出营业执照号,客户编号不为空的数据,
            buyers = validBuyerFilter(buyers);
            logger.trace("拉取buyers时候收到的有效数据的条数: "+  buyers.length);
            if (!buyers || buyers.length == 0) {
                logger.warn('没有收到没有有效的的数据');
                return callback(null);
            }
            var businessLicenses = _.pluck(buyers, 'BUSINESSLICENSE');

            // 1. 先检查这个营业执照是不是存在,存在则写入当前用户的库的ClientBuyerInfo中, 不存在则设置enabled = false;
            dbService.retrieveBusinessLicenses(cloudDbName, businessLicenses, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error)
                }

                // 遍历要添加的buyer数据, 给他们每一项加入数据库查出来的enterpriseId
                buyers = _.map(buyers, function (item) {
                    // 用item.BusinessLicense 匹配result中的序号
                    if(_.isEmpty(result)) {
                        logger.warn('同步来的营业执照的客户未在SCC平台上注册, 没有对应的Customer信息');
                        item.isBuyerEnabled = 0;
                        item.enterpriseId = null;
                    }else{
                        var index = _.findIndex(result, function (resultItem) {
                            return resultItem.businessLicense === item.BUSINESSLICENSE;
                        });
                        // 代表数据库中没有这个businessLicense, 这时候此条数据无效
                        var enterpriseId = null;
                        if (index !== -1) {
                            enterpriseId = result[index].enterpriseId;
                            item.isBuyerEnabled = 1;
                        }else{
                            item.isBuyerEnabled = 0;
                        }

                        // 存在时候给item.enterpriseId 复制并返回
                        item.enterpriseId = enterpriseId;
                    }
                    return item;
                });

                //\"GUID\":\"06EB2300EC784C1FA032379251358CF5\",
                //\"CLIENTCATEGORYERPCODE\":\"1\",
                //\"CLIENTCODE\":\"00001\",
                //\"CLIENTAREA\":null,
                //\"CLIENTNAME\":\"雨人健康城(兰州店)\",
                //\"PRICEPLAN\":\"5\",\"EMAIL\":\"\",\"MOBILE\":\"12345678910\",\"FAX\":\"\",
                //\"BUSINESSLICENSE\":\"620100000023871\",
                //\"BUSINESSLICENSEVALIDATEDATE\":\"2050-12-31T00:00:00\",
                //\"REGISTERSTATUS\":1,\"ENABLED\":0,
                //\"UPDATEDON\":\"2016-01-13T00:00:00\",\"HEADCUSTOMERGUID\":null,
                //\"LEGALREPRESENTATIVE\":\"Romens\",
                //\"BUSINESSLICENSE1\":\"620100000023871\",
                //\"COMPANYMANAGER\":\"张萍\",
                //"BUSINESSADDRESS\":\"城关区张掖路13号\

                // 接下来写入buyer表中
                buyers = _.map(buyers, function (item) {
                    var temp = [];
                    temp.push(item.enterpriseId);
                    temp.push(item.isBuyerEnabled);
                    temp.push(item.CLIENTCODE);
                    temp.push(item.BUSINESSLICENSE);
                    temp.push(item.CLIENTNAME||"");
                    temp.push(item.BUSINESSLICENSEVALIDATEDATE||"");
                    temp.push(item.BUSINESSADDRESS||"");
                    temp.push(item.LEGALREPRESENTATIVE||"");
                    temp.push(item.UPDATEDON||"");
                    return temp;
                });
                dbService.insertInToClientBuyer(customerDbName, buyers, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }
                    logger.trace('成功将: ' + enterpriseId + "的 buyer数据写进数据库");

                    callback(null, feedback);
                });
            });
        });
    });
};

function validBuyerFilter(items) {
    return _.filter(items, function (item) {
        return !!item.BUSINESSLICENSE && !!item.CLIENTCODE;
    });
}

MsgTransmitter.prototype.EDI_REQUEST_SELLER_ALL_TO_BUYER = function (enterpriseId, callback) {
    var dbService = this.dbService;
    var cloudDbName = this.cloudDbName;
    var apiRobot = this.apiRobot;
    var msgType = "SELLER_ALL";
    var msgData = {};

    dbService.enterpriseInfoRetrieve(cloudDbName, {id:enterpriseId}, function (error, buyerEnterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        buyerEnterpriseInfo = buyerEnterpriseInfo[0];
        if (buyerEnterpriseInfo === undefined) {
            logger.warn('没有找到买家有对应的数据库!!');
            return callback(null);
        }
        var customerDbName = sysconf.customerDBPrefix + '_' + buyerEnterpriseInfo.customerDBSuffix;

        apiRobot.sendMsg(enterpriseId, msgType, msgData, function sendMsgCallback(error, feedback) {
            if (error) {
                logger.error(error);
                return callback(error);
            }
            try {
                var sellers = JSON.parse(feedback.data).SELLER;
            } catch (err) {
                logger.error(error);
                return callback(err);
            }

            sellers = validSellerFilter(sellers);
            if (sellers.length !== _.values(_.groupBy(sellers, 'YYZZ')).length) {
                logger.warn("操作失败, 获取到的数据中有相同的businessLicense");
                return callback(null);
            }

            var sellersBusinessLicense = _.pluck(sellers, 'YYZZ');
            if (_.isEmpty(sellersBusinessLicense)) {
                logger.warn('没有收到没有有效的的数据');
                return callback(null);
            }

            // 1. 先检查这个营业执照是不是存在,存在则写入当前用户的库的ClientBuyerInfo中, 不存在则放弃该条数据
            dbService.retrieveBusinessLicenses(cloudDbName, sellersBusinessLicense, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error)
                }

                if (_.isEmpty(result)) {
                    logger.warn('拥有该营业执照的客户未在SCC平台上注册, 没有对应的Customer信息');
                    return callback(null);
                }

                // 遍历要添加的seller数据, 给他们每一项加入数据库查出来的enterpriseId
                var sellersInScc = _.map(sellers, function (item) {

                    // 用item.BusinessLicense 匹配result中的序号
                    var index = _.findIndex(result, function (resultItem) {
                        return resultItem.businessLicense === item.YYZZ;
                    });
                    // 代表数据库中没有这个businessLicense, 这时候此条数据无效,丢掉.
                    var enterpriseId = null;
                    if (index !== -1) {
                        enterpriseId = result[index].enterpriseId;
                    }
                    // 存在时候给item.enterpriseId 复制并返回
                    item.enterpriseId = enterpriseId;
                    return item;
                });
                sellersInScc = _.compact(sellersInScc);
//{\"GUID\":\"60002\",\"TJBH\":\"60002\",\"MC\":\"湖北贝克药业有限公司(陆华炎)\",\"FDELETED\":false,\"YYZZ\":\"420100000020904\",\"ZZQX\":\"2034-09-18T00:00:00\",\"ADDR\":null,\"FRDB\":\"崔孝洪\",\"UPDATEDATE\":\"2015-11-04T00:00:00\"},
                // 构建批量操作执行的数组
                sellersInScc = _.map(sellersInScc, function (item) {
                    var temp = [];
                    var isBuyerEnabled = 0;
                    if (item.enterpriseId !== null) {
                        isBuyerEnabled = Number(item.FDELETED.toString().toUpperCase() === 'FALSE');
                    }
                    temp.push(item.enterpriseId);
                    temp.push(isBuyerEnabled);
                    temp.push(item.TJBH);
                    temp.push(item.YYZZ||"");
                    temp.push(item.MC||"");
                    temp.push(item.ZZQX||"");
                    temp.push(item.ADDR||"");
                    temp.push(item.FRDB||"");
                    temp.push(item.UPDATEDATE||"");
                    return temp;
                });

                dbService.insertInToClientSeller(customerDbName, sellersInScc, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }
                    logger.trace('成功将: ' + enterpriseId + "的 buyer数据写进数据库");

                    callback(null, feedback);
                });
            });
        });
    });
};

function validSellerFilter(items) {
    return _.filter(items, function (item) {
        return !!item.YYZZ && !!item.TJBH;
    });
}

MsgTransmitter.prototype.EDI_REQUEST_SALESMAN_ALL_TO_SELLER = function (enterpriseId, callback) {
    var dbService = this.dbService;
    var cloudDbName = this.cloudDbName;
    var apiRobot = this.apiRobot;
    var msgType = "SALESMAN_ALL";
    var businessLicense = null;



    dbService.enterpriseInfoRetrieve(cloudDbName, {enterpriseId:enterpriseId}, function (error, sellerEnterpriseInfo) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        sellerEnterpriseInfo = sellerEnterpriseInfo[0];
        if (sellerEnterpriseInfo === undefined) {
            return callback(new Error('没有找到卖家有对应的数据库!!'));
        }
        var customerDbName = sysconf.customerDBPrefix + '_' + sellerEnterpriseInfo.customerDBSuffix;

        businessLicense = sellerEnterpriseInfo.businessLicense;
        var msgData = {
            businessLicense: businessLicense
        };
        apiRobot.sendMsg(enterpriseId, msgType, msgData, function sendMsgCallback(error, feedback) {
            if (error) {
                logger.error(error);
                return callback(error);
            }
            logger.debug(feedback);

            try{
                var msg = JSON.parse(feedback.data);
            }catch(err){
                logger.error(err);
                return callback(err);
            }

            var operators = msg.SupplyEmployees;
            if (operators.length == 0) {
                logger.trace('没有数据:id ' + enterpriseId + '  businessLicense: ' + msgData.businessLicense);
                return callback(error);
            }

            //var operators = [{
            //    Guid: 'fcf6cfa3-890f-4e8c-89f0-8522bc928d38',
            //    name: '江英',
            //    IDENTITYCODE: '620105197208112066',
            //    CODE: '201309180001',
            //    MOBILEPHONE: '',
            //    POST: '',
            //    ISSTOP: false
            //}];
            var operatorType = "CUSTOMER";
            var customerId = enterpriseId;

            async.map(
                operators,
                function (item, callback) {
                    hasher(item.IDENTITYCODE).hash(function (error, hashedPwd) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }

                        item.pwd = hashedPwd;
                        callback(null, item);
                    });
                },
                function (error, operators) {
                    if (error) {
                        return callback(error);
                    }

                    operators = _.map(operators, function (item) {
                        var temp = [];
                        temp.push(item.Guid);           // GUID
                        temp.push(item.IDENTITYCODE);   // username
                        temp.push(item.pwd);   // password
                        temp.push(operatorType);        // operatorType
                        temp.push(customerId);          // customerId
                        temp.push(item.CODE);           // operatorCode
                        temp.push(1);                   // enable
                        temp.push(item.name);           // operatorName
                        temp.push(item.IDENTITYCODE);   // citizenIdNum
                        return temp;
                    });

                    dbService.operatorCreateByBatch(customerDbName, operators, function operatorCreateByBatch(error, result) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }
                        logger.trace("完成同步商户(enterpriseId): " + enterpriseId + ' 的供应商代表.');
                        callback(null, result);
                    });
                }
            );
        });
    });
};

MsgTransmitter.prototype.EDI_RETUEST_TEST_CONNECT = function (enterpriseId, callback) {
    var apiRobot = this.apiRobot;
    var msgType = "ASYNC_GOODS_COUNT";
    var msgData = {};
    apiRobot.sendMsg(enterpriseId, msgType, msgData, function sendMsgCallback(error, feedback) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, feedback);
    });
};

function saveGoodsWillExpired(customerDbName, goods, callback) {
    logger.enter();
    var sql = "insert into %s.GoodsWillBeExpired(" +
        "   goodsNo , " +
        "   batchNo , " +
        "   licenseNo , " +
        "   amount ," +
        "   goodsProduceDate ," +
        "   goodsValidDate " +
        ") values ? " +
        "on duplicate key update" +
        "   amount = values(amount);";
    sql = sprintf(sql, customerDbName);
    logger.sql(sql);
    //goods = [{
    //    HH: '103532',               // 货号
    //    PH: '15031001',             // 批号
    //    XQ: '2016-03-09T00:00:00',  // 有效期
    //    SCRQ: null,                 // 生产日期
    //    SL: 0,                      // 数量
    //    PZWH: '国药准字H20013024'     // 批准文号
    //}];
    goods = underscore(goods).map(function (item) {
        var temp = [];
        temp.push(item.HH);
        temp.push(item.PH);
        temp.push(item.PZWH);
        temp.push(item.SL);
        temp.push(item.SCRQ);
        temp.push(item.XQ);
        return temp;
    });
    __mysql.query(sql, [goods], function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, result);
    });
}
function customerDbNameRetrieve(enterpriseId, cloudDBName, callback) {
    logger.enter();
    var LIST_CUSTOMER_SUFFIX = " SELECT customerDBSuffix FROM %s.Customer WHERE id = %d;";
    var sql = sprintf(LIST_CUSTOMER_SUFFIX, cloudDBName, enterpriseId);
    __mysql.query(sql, function (eror, result) {
        if (eror) {
            logger.error(eror);
            return callback(eror);
        }
        var customerDBName = __customerDBPrefix + "_" + result[0].customerDBSuffix;
        callback(null, customerDBName);
    });
}

MsgTransmitter.prototype.B2B_REQUEST_GOODS_COUNTS = function (enterpriseId, callback) {
    var msgType = "ASYNC_GOODS_COUNT";
    var apiRobot = this.apiRobot;
    var data = {};

    apiRobot.sendMsg(enterpriseId, msgType, data, function (error, feedback) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        if(feedback.status !== 200) {
            callback(new Error(feedback.msg));
        }
        callback(null, feedback.data.kckCount);
    });
};

MsgTransmitter.prototype.B2B_REQUEST_GOODS_UPDATE_TIME = function (enterpriseId, startNo, endNo, callback) {
    var apiRobot = this.apiRobot;
    var msgType = "ASYNC_GOODSBASICINFO_KEYS";
    var data = {
        "startNo": startNo,    //开始序号
        "endNo": endNo         //结束序号
    };

    apiRobot.sendMsg(enterpriseId, msgType, data, function (error, feedback) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        var parseError=null;
        try {
            var data = JSON.parse(feedback.data);
        }catch(e){
            parseError=e;
            logger.dump('非法的json串');
            logger.error(e);
            callback(e);
        }
        if(!parseError){
            callback(null, data.YW_KCK);
        }
    });
};

MsgTransmitter.prototype.B2B_REQUEST_GOODS_INFO = function (enterpriseId, guids, callback) {
    var msgType = "ASYNC_GOODSBASICINFO_DETAILS";
    var apiRobot = this.apiRobot;

    if (guids.length ===0) {
        return callback(null, []);
    }
    var guidStr = _.reduce(guids, function (memo, item) {
        if (memo !== "") {
            memo += ','
        }
        return memo + "'" + item + "'";
    }, "");

    apiRobot.sendMsg(enterpriseId, msgType, {'GUID': guidStr}, function (error, feedback) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        var goodsInfo = null;
        try {
            goodsInfo = JSON.parse(feedback.data).YW_KCK;
        } catch (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, goodsInfo);
    });
};

MsgTransmitter.prototype.ERI_REQUEST_GOODS_SYNC = function (enterpriseId, pageSize,syncGoodsProgressUpdate,callback) {
    var dbService = this.dbService;
    var cloudDbName = this.cloudDbName;
    var self = this;

    this.B2B_REQUEST_GOODS_COUNTS(enterpriseId, function (error, count) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        if (count < 1) {
            callback(new Error("收到的商品数量是0"));
        }
        var goodsLimits = [];

        var i = 1;
        do {
            var temp = {
                startNo: (i - 1) * pageSize + 1,
                endNo: pageSize * i
            };
            if (temp.endNo > count) {
                temp.endNo = count;
            }
            goodsLimits.push(temp);
            i++;
        } while ((i-1) * pageSize <count);
        async.mapSeries(
            goodsLimits,
            function (goodsLimitItem, cb1) {
                var goodsUpdateTimeData = null;
                var guidOfGoodsWillSync = null;
                var goodsDetails = null;
                async.series(
                    [
                        // 拉取商品更新时间
                        function (cb2) {
                            self.B2B_REQUEST_GOODS_UPDATE_TIME(enterpriseId, goodsLimitItem.startNo, goodsLimitItem.endNo, function (error, result) {
                                logger.enter();
                                if (error) {
                                    logger.error(error);
                                    return cb2(error);
                                }
                                goodsUpdateTimeData = result;
                                cb2(null, result);
                            });
                        },
                        // 查询带同步商品guid
                        function (cb2) {
                            retrieveGoodsGuidWillSync(cloudDbName, dbService, enterpriseId, goodsUpdateTimeData, function (error, result) {

                                if (error) {
                                    logger.error(error);
                                    return cb2(error);
                                }
                                guidOfGoodsWillSync = result;
                                cb2(null, result);
                            });
                        },
                        // 拉取商品详情
                        function (cb2) {
                            self.B2B_REQUEST_GOODS_INFO(enterpriseId, guidOfGoodsWillSync, function (error, result) {

                                if (error) {
                                    logger.error(error);
                                    return cb2(error);
                                }
                                goodsDetails = result;
                                cb2(null, result);
                            });
                        },
                        function (cb2) {
                            batchInsertIntoGoodsInfo(cloudDbName, dbService, enterpriseId, goodsDetails, function (error, result) {

                                if (error) {
                                    logger.error(error);
                                    return cb2(error);
                                }
                                cb2(null, result);
                            });
                        }
                    ],
                    function (error, result) {
                        if (error) {
                            logger.error(error);
                            return cb1(error);
                        }
                        var finishedGoodsNumber=goodsLimitItem.startNo-1,
                            sendMsg='已同步'+finishedGoodsNumber+'种商品';

                        sendMsgToRedisPubSub(syncGoodsProgressUpdate,
                            {
                                msg:sendMsg,
                                isDone:false
                            });
                        // func(goodsLimitItem.start-1, count);
                        cb1(null, result);
                    }
                );
            },
            function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }
                logger.dump('同步数据完成');
                var sendMsg='商品数据同步完成';
                sendMsgToRedisPubSub(syncGoodsProgressUpdate,
                    {
                        msg:sendMsg,
                        isDone:false
                    });
                callback(null, result);

            }
        );
    });
};


MsgTransmitter.prototype.EDI_PING_TO_ERP = function (enterpriseId, ping, callback) {
    var apiRobot = this.apiRobot;
    var msgType = "EDI_PING_TO_ERP";
    var msgData = {
        ping: ping
    };
    
    apiRobot.sendMsg(enterpriseId, msgType, msgData, function (error, feedback) {
        if (error) {
            logger.error(error);
            var pingKey = "_ping_" + enterpriseId;
            cacheService.get(pingKey, function (feebackCode, result) {
                if(feebackCode != 200){
                    logger.error(new Error('cache无法拿到ping'));
                    return callback(error);
                }
                logger.debug(JSON.stringify(result));
                var temp = JSON.parse(result);
                var socketId = temp.socketId;
                var ping = temp.ping;
                logger.ndump('ping from redis:' + temp.ping + "socketId from redis:" + socketId);

                var socketConn = __socketIO.sockets.connected[temp.socketId];
                if (!socketConn) {
                    logger.error(new Error('无法拿到socket连接'));
                    return callback(error);
                }
                var errMsg = error.toString();
                logger.debug(errMsg);
                var pushInfo = {
                    // 任务id, @see table CloudDB.Task.taskId
                    taskId: "",
                    // 任务类型, @see table CloudDB.Task.taskType
                    taskType: "",
                    // 子任务名称, 可选
                    description: "",
                    // 任务进度百分比, 0-100
                    taskProgress: "",
                    // 任务完成标志
                    isDone: false,
                    // 错误消息
                    errmsg: errMsg,
                    // 消息体
                    msg:""

                };
                logger.debug(JSON.stringify(pushInfo));
                socketConn.emit("connectSCC-ERP", pushInfo);
                return callback(error);
            });
        }else{
            logger.ndump('feedback', feedback);
            callback(null,  feedback);
        }
    });
};


MsgTransmitter.prototype.EDI_APPKEY_TO_ERP = function (enterpriseId, appKey, callback) {
    var apiRobot = this.apiRobot;
    var msgType = "EDI_APPKEY_TO_ERP";
    var msgData = {
        appKey: appKey
    };

    apiRobot.sendMsg(enterpriseId, msgType, msgData, function (error, feedback) {
        if (error) {
            logger.error(error);
            callback(error);
        }else{
            logger.ndump('feedback', feedback);
            callback(null,  feedback);
        }
    });
};


function retrieveGoodsGuidWillSync(cloudDbName, dbService, enterpriseId, goodsUpdateTimeData, callback) {
    logger.enter();
    var customerDbName = null;

    // 带同步商品的guid
    var guidOfGoodsWillSync = null;

    // 带更新的信息
    var goodsWillUpdateToDb = null;

    // updateTime为null, 则视为新商品
    guidOfGoodsWillSync = _.chain(goodsUpdateTimeData)
        .filter(function (item) {
            return item.UPDATEDATE === null;
        })
        .pluck('GUID')
        .value();
    if(guidOfGoodsWillSync.length === goodsUpdateTimeData.length) {
        return callback(null, guidOfGoodsWillSync);
    }

    // 待更新到数据库的数据
    goodsWillUpdateToDb = _.reject(goodsUpdateTimeData, function (item) {
        return item.UPDATEDATE === null;
    });

    // 从数据库查出需要想ERP拉取的数据
    async.series(
        [
            // 查 customDBName
            function (callback) {
                dbService.enterpriseInfoRetrieve(cloudDbName, {id:enterpriseId}, function (error, sellerEnterpriseInfo) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    if (sellerEnterpriseInfo.length === 0 || sellerEnterpriseInfo[0].customerDBSuffix === undefined) {
                        return callback(new Error('没有找到企业对应的数据库!!'));
                    }

                    customerDbName = sysconf.customerDBPrefix + '_' + sellerEnterpriseInfo[0].customerDBSuffix;
                    callback(null, customerDbName);
                });
            },
            // 更新数据库商品表>erp最后更新时间字段
            function (callback) {
                var erpUpdateTimeData = _.map(goodsWillUpdateToDb, function (item) {
                    var temp = [];
                    temp.push(item.GUID);
                    temp.push(item.UPDATEDATE);
                    return temp;
                });

                dbService.updateGoodsInfoWithErpUpdatedOn(customerDbName, erpUpdateTimeData, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    callback(null, result);
                });
            },
            // 查出需要同步的商品 (同步时间 < ERP最后更新时间)
            function (callback) {
                dbService.retrieveGoodsGuidNeedToSync(customerDbName, function (error, goodsInfo) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    var guids = _.pluck(goodsInfo, 'guid');
                    guidOfGoodsWillSync = guidOfGoodsWillSync.concat(guids);
                    callback(null, guidOfGoodsWillSync);
                });
            }
        ],
        function (error) {
            if (error) {
                logger.error(error);
                return callback(error);
            }

            callback(null, guidOfGoodsWillSync);
        }
    );
}
function batchInsertIntoGoodsInfo(cloudDbName, dbService, enterpriseId, goodsInfo, callback) {
    var customerDbName = null;
    if (goodsInfo.length === 0) {
        return callback(null, []);
    }
    async.series([
            // 通过enterpriseId,拿到customDBName
            function (callback) {
                dbService.enterpriseInfoRetrieve(cloudDbName, {id:enterpriseId}, function (error, sellerEnterpriseInfo) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }
                    if (sellerEnterpriseInfo.length === 0 || sellerEnterpriseInfo[0].customerDBSuffix === undefined) {
                        return callback(new Error('没有找到企业对应的数据库!!'));
                    }

                    customerDbName = sysconf.customerDBPrefix + '_' + sellerEnterpriseInfo[0].customerDBSuffix;
                    callback(null, customerDbName);
                });
            },
            function (callback) {

                logger.debug('goodsInfo:', goodsInfo.length);
                // 将没有批准文号和货号的商品数据过滤掉
                var goodsInfoList = _.filter(goodsInfo, function (item) {
                    return !!item.PZWH && !!item.HH;
                });

                logger.debug('goodsInfo:', goodsInfo.length);

                if (goodsInfoList.length <= 0) {
                    return callback(new Error("没有商品数据个写入数据库."));
                }

                logger.debug('goodsInfoList.length:', goodsInfoList.length);

                batchAddERPGoodsBasicInfo(customerDbName, dbService,goodsInfoList, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    callback(null, result);
                });
            }
        ],
        function (error, resultList) {
            if (error) {
                logger.error(error);
                return callback(error);
            }
            callback(null,  resultList);
        }
    );
}
function batchAddERPGoodsBasicInfo(customerDbName, dbService, goodsBasicInfo, callback) {
    logger.enter();

    dbService.beginTrans(function (connection) {
        async.series(
            [   //插入goodsInfo
                function prepareGoodsInfoToInsert(callback) {
                    logger.enter();

                    // 准备插入的数据:
                    var goodsInfoList = _.map(goodsBasicInfo, function (item) {
                        var temp = [];
                        temp.push(item.GUID ? item.GUID : null);              // guid,
                        temp.push(item.GHQY ? item.GHQY : null);                //平台编码
                        temp.push(item.YPQK ? item.YPQK : 1);                 //换算关系
                        temp.push(item.HH ? item.HH : null);                  //货号 goodsNos
                        temp.push(item.TM ? item.TM : null);                  //条码 barcode,

                        temp.push(item.PM ? item.PM : null);                  //商品通用名称commonName,
                        temp.push(item.BM ? item.BM : "");                    //别名Alias
                        temp.push(item.JX ? item.JX : null);                  //药剂类型DrugsType
                        temp.push(item.PZWH ? item.PZWH : "");                //批准文号licenseNo
                        temp.push(item.PZWHXQ ? item.PZWHXQ : null);          //文号或备案号有效期限filingNumberValidDate

                        temp.push(item.GG ? item.GG : null);                  //规格spec
                        temp.push(item.GYS ? item.GYS : null);                //供应商supplier
                        temp.push(item.CD ? item.CD : null);                  //产地birthPlace
                        temp.push(item.SCDW ? item.SCDW : null);              //生产企业producer
                        temp.push(item.PDW ? item.PDW : null);                //单位measureUnit

                        temp.push(item.LARGEPACKUNIT ? item.LARGEPACKUNIT : null);              //大包装单位largePackUnit
                        temp.push(item.MJL ? item.MJL : null);                                  //大包装量LargePackNum
                        temp.push(item.LARGEPACKBARCODE ? item.LARGEPACKBARCODE : null);        //大包装条码LargePackBarcode
                        temp.push(item.MIDDLEPACKUNIT ? item.MIDDLEPACKUNIT : null);            //中包装单位middlePackUnit
                        temp.push(item.ZBZL ? item.ZBZL : null);                                //中包装量middlePackNum

                        temp.push(item.MIDDLEPACKBARCODE ? item.MIDDLEPACKBARCODE : null);      //中包装条码MiddlePackBarcode
                        temp.push(item.SMALLPACKUNIT ? item.SMALLPACKUNIT : null);              //小包装单位SmallPackUnit
                        temp.push(item.SMALLPACKAGE ? item.SMALLPACKAGE : null);                //小包装量SmallPackNum
                        temp.push(item.ISNEBALANCE ? item.ISNEBALANCE : null);                  //允许负库存销售NegSell
                        temp.push(item.FDELETED ? item.FDELETED : null);                        //禁用标志IsForbidden

                        temp.push(item.ISCANCEL ? item.ISCANCEL : null);                        //删除标志IsDeleted
                        temp.push(item.RJKSXBZ ? item.RJKSXBZ : null);                          //入库检查库存上线标志Ischeckstore
                        temp.push(item.ISCONTROLSELLSCOPE ? item.ISCONTROLSELLSCOPE : null);    //需要控制销售范围标志IsAreaLimited
                        temp.push(item.AREARANGEDESCIBEID ? item.AREARANGEDESCIBEID : null);    //区域范围描述AreaDesc
                        temp.push(item.UPDATEDATE ? item.UPDATEDATE : null);                    //最近更新时间UpdatedOn

                        return temp;
                    });

                    dbService.transactionInsertGoodsInfo(connection, customerDbName, goodsInfoList, function (error, result) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }
                        callback(null, result)
                    });
                },
                // 接下来要将数据插入GoodsGsp表中, 先要给数据补充goodsId字段
                function addGoodsIdTogoodsInfo(callback) {
                    logger.enter();

                    var guidOfGoodsWillSync = _.reduce(goodsBasicInfo, function (memo, item) {
                        if (memo !== "") {
                            memo += ",";
                        }
                        return memo + "'" + item.GUID + "'";
                    }, "");

                    dbService.retrieveGoodsIdByGuid(customerDbName, guidOfGoodsWillSync,  function (error, result) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }

                        goodsBasicInfo = _.map(goodsBasicInfo, function (item) {

                            // 用item.GUID 匹配result中的guid
                            var index = _.findIndex(result, function (resultItem) {
                                return resultItem.guid === item.GUID;
                            });
                            var id = null;  // 默认goodsId为null
                            if (index !== -1) {
                                id = result[index].id;
                            }
                            item.goodsId = id;
                            return item;
                        });

                        goodsBasicInfo = _.filter(goodsBasicInfo, function (item) {
                            return item.goodsId !== null;
                        });
                        callback(null, goodsBasicInfo);
                    });
                },
                // 插入goodsGsp
                function insertGoodsInfo(callback) {
                    logger.enter();

                    // 准备数据:
                    var goodsGspInfoList = _.map(goodsBasicInfo, function (item) {
                        var temp = [];
                        temp.push(item.goodsId ? item.goodsId : null);// guid,UNI NOT ERP DATA
                        temp.push(item.GUID ? item.GUID : null);// guid,UNI
                        temp.push(item.GMPZSH ? item.GMPZSH : null);//GMP证书号gmpNumber
                        temp.push(item.GMPRZRQ ? item.GMPRZRQ : null);//GMP认证日期 gmpCertificationDate,
                        temp.push(item.GMPRZXQ ? item.GMPRZXQ : null);//GMP有效日期,gmpValidDate

                        temp.push(item.PZWH ? item.PZWH : null);// 批准文号或者器械注册备案号filingNumber
                        temp.push(item.PZWHXQ ? item.PZWHXQ : null);//文号或备案号有效期限filingNumberValidDate
                        temp.push(item.JKZCZH ? item.JKZCZH : null);//进口注册证号importRegisCertNum
                        temp.push(item.XKZQX ? item.XKZQX : null);//进口注册证期限importRegisCertNumValidDate
                        temp.push(item.XQ ? item.XQ : null);//药剂有效期DrugsValidDate

                        temp.push(item.CCTJ ? item.CCTJ : null);//存储条件storageCondition
                        temp.push(item.GSPSORTID ? item.GSPSORTID : null);//GSP类别GSPtype
                        temp.push(item.ZCSB ? item.ZCSB : null);//注册商标以及专利registeredTradeMarksAndPatents
                        temp.push(item.ZZQX ? item.ZZQX : null);//生产企业营业执照年检有效期businessLicenseValidDate
                        temp.push(item.YYZYXKZXQ ? item.YYZYXKZXQ : null);//器械生产许可证号instrumentProductionLicenseNum

                        temp.push(item.ZYX1 ? item.ZYX1 : null);//药监编码drugAdministrationEncoding
                        temp.push(item.MEDICALINSTRUMENTTYPE ? item.MEDICALINSTRUMENTTYPE : null);//医疗器械类别isMedicalApparatus
                        temp.push(item.YPBZ ? item.YPBZ : null);//药品标志IsMedicine
                        temp.push(item.JKPZBZ ? item.JKPZBZ : null);//进口标志IsImported
                        temp.push(item.ZYBZ ? item.ZYBZ : null);//中药饮片标志isHerbalDecoctioniieces

                        temp.push(item.ISCHECKMEDIDEVICES ? item.ISCHECKMEDIDEVICES : null);//需检查医疗器械证标志isCheckMedicalInstrumentCert
                        temp.push(item.ZZRS_TAG ? item.ZZRS_TAG : null);//终止妊娠品标志isPregnancyRermination
                        temp.push(item.ZYC_TAG ? item.ZYC_TAG : null);//中药材标志IsHerbalMedicine
                        temp.push(item.FISGMP ? item.FISGMP : null);//含特药品标志IsContainSpecialContent
                        temp.push(item.SFCF ? item.SFCF : null);//是否处方药品标志IsPrescriptionDrugs

                        temp.push(item.FISYBPZ ? item.FISYBPZ : null);//医保药品标志isMedicalInsuranceDrugs
                        temp.push(item.ISEGGPREPARATION ? item.ISEGGPREPARATION : null);//蛋白同化制剂标志isProteinasSimilationPreparation
                        temp.push(item.ISEPHEDRINE ? item.ISEPHEDRINE : null);//含麻黄碱标志isContainEphedrine
                        temp.push(item.ISTLHORMONE ? item.ISTLHORMONE : null);//含肽类激素标志IsContainPeptidehormone
                        temp.push(item.ISTWOCLASSMENTALDRUG ? item.ISTWOCLASSMENTALDRUG : null);//二类精神药品标志IsSecondPsychotropicDrugs

                        temp.push(item.ISMINDDRUG ? item.ISMINDDRUG : null);//一类精神药品标志IsFirstPsychotropicDrugs
                        temp.push(item.ISDANGERCHEMISTRY ? item.ISDANGERCHEMISTRY : null);//危险化学品标志IsHazardousChemicals
                        temp.push(item.ISANAESTHETIC ? item.ISANAESTHETIC : null);//麻醉药品标志isStupefacient
                        temp.push(item.ISDIAGNOSTICREAGENT ? item.ISDIAGNOSTICREAGENT : null);//诊断试剂药品标志IsDiagnosticReagent
                        temp.push(item.ISMEDICALTOXICITY ? item.ISMEDICALTOXICITY : null);//医疗用毒性品标志IsMedicalToxicity

                        temp.push(item.ISSTIMULANT ? item.ISSTIMULANT : null);//含兴奋剂药品标志IsContainingStimulants
                        temp.push(item.ISVACCINE ? item.ISVACCINE : null);//是否疫苗标志isVaccine
                        temp.push(item.ISHEALTHFOODS ? item.ISHEALTHFOODS : null);//麻醉药品标志isStupefacient
                        temp.push(item.ISFOOD ? item.ISFOOD : null);//麻醉药品标志isStupefacient
                        return temp;
                    });

                    async.mapSeries(goodsGspInfoList,
                        function (item,mapCallback) {
                            dbService.transactionInsertGoodsGsp(connection, customerDbName, [item], function (error, result) {
                                if (error) {
                                    logger.error(error);
                                    return mapCallback(error);
                                }

                                mapCallback(null, result);
                            });
                        },
                        function(err,result){
                            callback(err,result);
                        }
                    );
                    // dbService.transactionInsertGoodsGsp(connection, customerDbName, goodsGspInfoList, function (error, result) {
                    //     if (error) {
                    //         logger.error(error);
                    //         return callback(error);
                    //     }
                    //
                    //     callback(null, result);
                    // });
                },

                // 插入goodsPrice
                function insertGoodsPrice(callback) {
                    logger.enter();

                    // 准备数据:
                    var goodsPriceInfoList = _.map(goodsBasicInfo, function (item) {
                        var temp = [];
                        temp.push(item.goodsId ? item.goodsId : null);  // goodsId,UNI  NOT ERP DATA
                        temp.push(item.GUID ? item.GUID : null);        // guid,UNI
                        temp.push(item.PFJ ? item.PFJ : 0);             //商品批发价wholesalePrice
                        temp.push(item.LSJ ? item.LSJ : 0);             // 参考零售价,refRetailPrice
                        temp.push(item.PFJ1 ? item.PFJ1 : 0);           // 售价1,price1

                        temp.push(item.LSJ1 ? item.LSJ1 : 0);           //售价2,price2
                        temp.push(item.SJ1 ? item.SJ1 : 0);             //售价3,price3
                        temp.push(item.GJXJ ? item.GJXJ : 0);           //国家限价limitedPrice
                        temp.push(item.BASEMATERIELRETAILPRICE ? item.BASEMATERIELRETAILPRICE : 0);//国家基药价basePrice
                        temp.push(item.PROMANAGERETAILPRICE ? item.PROMANAGERETAILPRICE : 0);//省管基药价provinceBasePrice
                        temp.push(item.BASEMATERIELGUIDEPRICE ? item.BASEMATERIELGUIDEPRICE : 0);//基药指导价guidedBasePrice
                        return temp;
                    });

                    async.mapSeries(goodsPriceInfoList,
                        function (item,mapCallback) {
                            dbService.transactionInsertGoodsPrice(connection, customerDbName, [item], function (error, result) {
                                if (error) {
                                    logger.error(error);
                                    return mapCallback(error);
                                }

                                mapCallback(null, result);
                            });
                        },
                        function(err,result){
                            if (err) {
                                logger.error(err);
                                return callback(err)
                            }
                            callback(null, result);
                        }
                    );
                    // dbService.transactionInsertGoodsPrice(connection, customerDbName, goodsPriceInfoList, function (error, result) {
                    //     if (error) {
                    //         logger.error(error);
                    //         return callback(error);
                    //     }
                    //
                    //     callback(null, result);
                    // });
                }
            ],
            function (error, results) {
                if (error) {
                    logger.error(error);
                    dbService.rollbackTrans(connection, function () {
                        callback(new Error("同步失败(写入时):执行transaction时"));
                    });
                } else {
                    dbService.commitTrans(connection, function () {
                        callback(null, results);
                    });
                }
            }
        );
    });
}
function sendMsgToRedisPubSub(sendFunction,msg){
    if(_.isFunction(sendFunction)){
        sendFunction(msg);
    }
}

module.exports = MsgTransmitter;