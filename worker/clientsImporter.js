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
 * worker.js
 *      scc's workers
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 *
 */

module.exports = function() {

    /* 3rd party modules */
    var underscore = require('underscore');
    var async = require("async");

    /**
     * Services
     **/
    var logger = __logService;
    var dbService = __dbService;


    var worker = {
        /**
         * Import an XLS Goods file
         * @param xlsFilename
         */

        /**
         * sheet2json
         *      read xls file into json row data, and callback on each row(except the header row)
         * @param xlsFilename
         * @returen The json data
         */
        sheet2json: function (xlsFilename) {
            logger.enter();

            var orderedHashMap = require("ordered-hashmap");
            var merge = require('merge');
            var xlsParser = require("xlsx");

            /* Load the xls file */
            var workbook = xlsParser.readFile(xlsFilename);
            var sheetNameList = workbook.SheetNames;
            logger.ndump("sheetNameList", sheetNameList);

            //var map = new orderedHashMap();
            var map = {};

            /* parse the sheet */
            sheetNameList.forEach(function readSheet(sheetName) {

                var worksheet = workbook.Sheets[sheetName];

                /* columnName, to save the column name in line#1 */
                var columnName = {};

                for (var addr in worksheet) {

                    /* by pass the cell addr starting with a '!' */
                    if (addr[0] === '!') continue;

                    /* get row and column, A16 -> row=16, column=A */
                    var row = addr.match(/[0-9]+/g).toString();
                    var column = addr.match(/([a-z]|[A-Z])+/g).toString();

                    /* get the cell value */
                    var value = worksheet[addr].v;

                    logger.trace("["+row+","+column+"]="+value);

                    if ('1' === row) {              // at line#1 ? for header
                        columnName[column] = value.toUpperCase();
                    } else {                        // at lines other than #1
                        var cell = map[row] || {};
                        cell[columnName[column]] = value;
                        map[row] = cell;
                    }
                }
            });

            var ret = [];
            for (var key in map){
                ret.push(map[key]);
            }
            return ret;

        },
        importClients: function(xlsFilename,customerDBname,done){
            logger.enter();
            logger.info("Start to import goods xls file: " + xlsFilename);
            var data = this.sheet2json(xlsFilename);

            if(underscore.isEmpty(data))
                return false;
            logger.debug(JSON.stringify(data));
            /* extract Clients data fields */

            async.mapSeries(
                data,
                function(item,callback){
                    logger.enter();
                    dbService.beginTrans(function(connect){
                        var clientInfo = [];
                        var clientGsp = [];
                        var clientId = undefined;
                        /* Start to the series of the db operations */
                        async.series([
                            /**
                             * Step 1. import Client
                             * @param done
                             */
                             function importClientInfo(done){
                                logger.debug(item);

                                /* set up the clientInfo object */
                                //(guid, clientCategory, clientCode,clientArea, clientName, pricePlan, email, mobile, fax, " +
                                //    defaultAddressId, paymentReminderMsg, readOnly,enabled )

                                clientInfo.push(item.GUID);//guid guid ERP编号
                                clientInfo.push(item.TJ_TAG);//clientCategory 客户类别  客户自定义 INT
                                clientInfo.push(item.TJBH);//clientCode 客户编号
                                clientInfo.push(item.AREARANGE);//clientArea 客户所属区域  客户自定义 INT
                                clientInfo.push(item.MC);//clientName 客户名称  UNIQUE NOT NULL
                                clientInfo.push(item.JGFA);//pricePlan  价格方案  客户自定义 INT
                                clientInfo.push(item.EMAIL);//email  Email
                                clientInfo.push(item.HandTEL);//mobile 	Mobile Number
                                clientInfo.push(item.FAXTEL);//fax 	fax Number
                                clientInfo.push(undefined);//defaultAddressId 	默认收货地址ID
                                clientInfo.push(undefined);//paymentReminderMsg 回款提醒通知消息  暂无作用
                                clientInfo.push(item.STOPSELL);//readOnly 停售标志
                                clientInfo.push(item.FDELETE);//enabled 禁用标志
                                /* save into db */
                                dbService.metaImportClientInfo(connect, customerDBname, clientInfo, function (err, result) {
                                    if (err) {
                                        lastError = err;
                                    }
                                    logger.debug(JSON.stringify(result));
                                    clientId = result;
                                    done(err, result);
                                });

                             },

                            /**
                             * Step 2. import clientGsp
                             * @param done
                             */

                            function importClientGspInfo(done){
                                if(clientId===0){
                                    done()
                                }else {
                                    /* set up the clientGsp object */
                                    clientGsp.push(item.GUID);//guid guid ERP编号
                                    clientGsp.push(clientId); //client id 客户id  UNIQUE NOT NULL
                                    clientGsp.push(item.FRDB); //legalRepresentative  法人代表
                                    clientGsp.push(item.YYZZ); //businessLicense  营业执照号
                                    clientGsp.push(item.QYFZR); //companyManager  企业负责人
                                    clientGsp.push(item.ZZQX); //businessLicenseValidateDate  执照期限
                                    clientGsp.push(item.ZCZB); //registeredCapital  注册资本
                                    clientGsp.push(item.YYDZ); //businessAddress  营业地址
                                    clientGsp.push(item.CONTROLTYPE); //limitedBusinessRange  控制范围
                                    clientGsp.push(item.GSPCONTROLTYPE); //limitedBusinessType  GSP控制类型
                                    clientGsp.push(item.ZZJGDMZH); //orgCode  组织机构代码证号
                                    clientGsp.push(item.ZZJGDMZQX); //orgCodeValidateDate  组织机构代码证期限
                                    clientGsp.push(item.SWDJZ); //taxRegistrationLicenseNum  税务登记证
                                    clientGsp.push(item.WSXKZH); //foodCirculationLicenseNum  食品流通许可证
                                    clientGsp.push(item.WSXKZQX); //foodCirculationLicenseNumValidateDate  食品流通许可证有效期
                                    clientGsp.push(item.ZLBZXYH); //qualityAssuranceLicenseNum  质量保证协议号
                                    clientGsp.push(item.ZLBZXYQX); //qualityAssuranceLicenseNumValidateDate  质量保证协议号有效期
                                    clientGsp.push(item.YLQXXKZH); //medicalApparatusLicenseNum  医疗器械许可证号
                                    clientGsp.push(item.YLQXXKQX); //medicalApparatusLicenseNumValidateDate  医疗器械许可证有效期
                                    clientGsp.push(item.MEDICALINSTRUMENTTYPE); //medicalApparatusType  医疗器械类别
                                    clientGsp.push(item.HEALTHCERTIFICATE); //healthProductsLicenseNum  保健品证书
                                    clientGsp.push(item.HEALTHFOODSLIMIT); //healthProductsLicenseNumValidateDate  保健品证书有效期
                                    clientGsp.push(item.BZ1); //productionAndBusinessLicenseNum  生产经营许可证
                                    clientGsp.push(item.FZRQ); //productionAndBusinessLicenseNumIssuedDate  生产经营许可证发证日期
                                    clientGsp.push(item.ProduceLimit); //productionAndBusinessLicenseNumValidateDate  生产经营许可证有效期
                                    clientGsp.push(item.FZJG); //productionAndBusinessLicenseNumIssuedDepartment  生产经营许可证发证机关
                                    clientGsp.push(undefined); //storageAddress  仓库地址
                                    clientGsp.push(item.TXZH); //mentaanesthesiaLicenseNum  精神麻醉证
                                    clientGsp.push(item.TXZHYXQ); //mentalanesthesiaLicenseNumValidateDate  精神麻醉证书有效期
                                    clientGsp.push(item.GMPGSPZSH); //gmpOrGspLicenseNum  GMP/GSP证书号    NOT NULL,
                                    clientGsp.push(item.GSPGMPYXQ); //gmpOrGspLicenseNumValidateDate  GMP/GSP证书有效期   NOT NULL,
                                    clientGsp.push(item.WXHXPXKZH); //hazardousChemicalsLicenseNum  危化品许可证
                                    clientGsp.push(item.WXHXPXKXQ); //hazardousChemicalsLicenseNumValidateDate  危化品许可证有效期
                                    clientGsp.push(item.YLJGXKZH); //medicalInstitutionLicenseNum  医疗机构执业许可证号
                                    clientGsp.push(item.YLJGXKXQ); //medicalInstitutionLicenseNumValidateDate  医疗机构执业许可证号有效期
                                    clientGsp.push(item.MYBJJSZYFWXKZ); //maternalLicenseNum  母婴保健技术执业许可证号
                                    clientGsp.push(undefined); //maternalLicenseNumValidateDate  母婴保健技术执业许可证号有效期
                                    clientGsp.push(item.SYDWFRZS); //institutionLegalPersonCert  事业单位法人证书
                                    clientGsp.push(item.SYDWFRZSQX); //institutionLegalPersonCertValidateDate  事业单位法人证书有效期

                                    logger.debug(JSON.stringify(clientGsp)+clientGsp.length);

                                    /* insert client GSP */
                                    dbService.metaImportClientGspInfo(connect,customerDBname, clientGsp, function (err, insertId) {
                                        if (err) {
                                            lastError = err;
                                        }
                                        done(err, insertId);
                                    });
                                }

                            }
                            ],
                            /**
                             * On final, do either commit or rollback
                             * @param err
                             * @param resultList
                             */
                            function (err, resultList) {
                                if (err) {
                                    logger.debug("Rollback the transaction");
                                    dbService.rollbackTrans(connect, function (transErr) {
                                        callback(err)
                                    });
                                } else {
                                    logger.debug("Commit the transaction");
                                    dbService.commitTrans(connect, function () {
                                        callback(null);
                                    });
                                }
                            }
                        )
                    });

                },
                function(err,results){
                    if(err)
                        logger.error(err);
                    logger.debug(JSON.stringify(results))
                    done(null,results);
                }

            )
        }
    };

    return worker;

};