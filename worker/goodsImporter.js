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
         * Import an XLS SortType file
         * @param xlsFilename
         * @param customerDBName
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

        importGoodsTypes: function(xlsFilename, customerDBName, done) {
            logger.enter();

            logger.info("Start to import GoodsTypes xls file: " + xlsFilename);

            // load xls file into a json array
            var xlsData = this.sheet2json(xlsFilename);

            logger.ndump("xlsdata", xlsData);

            // skip empty file
            if (underscore.isEmpty(xlsData))
            {
                logger.warn("The xls file " + xlsFilename + " is EMPTY!!!");
                return false;
            }

            // 用来保存类别树关系
            var goodsTypes = {id:0, level:0};
            var helperFields = __dbService.GoodsTypesHelperFields;

            // 用来记录递归遍历是所在的目录层次关系
            var hierarchyNames = [];

            // use a recursive way to relayout the goodsType in TREE hierarchy
            var addIntoTree = function(holder, typeObj){

                /* set parentId to zero if level is zero */
                if (!typeObj.level)
                    typeObj.parentId = 0;

                var typeName = typeObj.name;

                if (holder && (typeof holder === "object")) {       // dive into object only

                    if (holder.id == typeObj.parentId) {            // add it into object holder

                        logger.debug("Found the parent node: " + holder.hierarchyName + " for: " + typeName);
                        holder[typeName] = typeObj;

                        // make the hierarchy name for this type
                        hierarchyNames.push(typeName);
                        typeObj.hierarchyName = holder.hierarchyName = hierarchyNames.join("->");
                        hierarchyNames.pop();

                    } else {                                        // go through all daughter types

                        Object.keys(holder).forEach(function(key){

                            if (helperFields.indexOf(key) < 0) {        // bypass the helper fileds

                                hierarchyNames.push(holder[key].name);
                                addIntoTree(holder[key], typeObj);
                                hierarchyNames.pop();
                            }
                        });
                    }

                }

            };


            /**
             * read the xls data
             * @type {Array}
             */
            var typeArray = [];
            for (var x in xlsData) {
                var typeId = Number(xlsData[x]["LBID"]);

                if ( !underscore.isNaN(typeId)) {   // cope with a row with valid typeId
                    var type = {
                        id      : typeId,
                        parentId: Number(xlsData[x]["FParentID"]),
                        level   : Number(xlsData[x]["FLevel"]),
                        name    : xlsData[x]['NAME']
                    };

                    // add into GoodsTypes Tree
                    addIntoTree(goodsTypes, type);

                    // push into a flat array for fetching goodstype name while adding goods
                    typeArray.push(type);
                }
            }

            /**
             * Save the goods types into db
             */
            dbService.setGoodsTypes(customerDBName, goodsTypes,function(success){
                if (success)
                    done(typeArray);
                else
                    done();
            });
        },

        /**
         * Import an XLS Goods file
         * @param xlsFilename
         */
        importGoods: function (xlsFilename,customerDBname,done) {
            logger.enter();

            logger.info("Start to import goods xls file: " + xlsFilename);

            var data = this.sheet2json(xlsFilename);

            if (underscore.isEmpty(data))
                return false;
            logger.debug(JSON.stringify(data));
            /* extract GoodsInfo and GoodsGSP fields */

            async.mapSeries(
                data,
                function(item,callback) {
                    logger.enter();
                    dbService.beginTrans(function (connect) {
                        /* An error flag, to keep the error value by any of the steps below */
                        var goodsInfo = [];
                        var goodsGsp = [];
                        var goodsPrice = [];
                        var goodsInfoId = undefined;
                        /* Start to the series of the db operations */
                        async.series([
                                /**
                                 * Step 1. import goodsInfo
                                 * @param done
                                 */
                                function importGoodsInfo(done) {

                                    /** set up a goodsInfo object
                                     *  guid, goodsType, goodsNo, barcode, isPrescriptionDrugs, commonName, alias, licenseNo, spec, supplier,
                                     *  birthPlace, producer, measureUnit, largePackUnit, largePackNum, largePackBarcode, middlePackUnit,
                                     *   middlePackNum, middlePackBarcode, smallPackUnit, smallPackNum, smallPackBarcode, isForbidden, isAreaLimited,
                                     *   areaDesc
                                     *    push value    :   DB value
                                     *    NULL          :   ERR: NULL is not defined
                                     *    undefined (NOT NULL)        :   ER_BAD_NULL_ERROR
                                     *    undefined (DEFAULT NULL)    :   NULL
                                     *    ''            :   ""
                                     */
                                    goodsInfo.push(item.GUID);//guid
                                    goodsInfo.push(item.LB); //goodsType  //todo add dataService.getGoodsTypeById   goodsInfo.push(dataService.getGoodsTypeById(item.LB));
                                    goodsInfo.push(item.HH); //goodsNo
                                    goodsInfo.push(item.TM); //barcode
                                    goodsInfo.push(item.SFCF); //isPrescriptionDrugs
                                    goodsInfo.push(item.PM); //commonName
                                    goodsInfo.push(item.BM); //alias
                                    goodsInfo.push(item.PZWH); //licenseNo  UNIQUE NOT NULL
                                    goodsInfo.push(item.GG); //spec   2.5mg /4mg/10克/24片/0.3克/粒
                                    goodsInfo.push(item.GYS); //supplier
                                    goodsInfo.push(item.CD); //birthPlace 产地/ERP为公司名字
                                    goodsInfo.push(item.SCDW); //producer 生产单位
                                    goodsInfo.push(item.PDW); //measureUnit  单位
                                    goodsInfo.push(item.LARGEPACKUNIT); //largePackUnit
                                    goodsInfo.push(item.MJL); //largePackNum
                                    goodsInfo.push(item.LARGEPACKBARCODE); //largePackBarcode
                                    goodsInfo.push(item.MIDDLEPACKUNIT); //middlePackUnit
                                    goodsInfo.push(item.ZBZL); //middlePackNum
                                    goodsInfo.push(item.MIDDLEPACKBARCODE); //middlePackBarcode
                                    goodsInfo.push(item.SMALLPACKUNIT); //smallPackUnit
                                    goodsInfo.push(item.SMALLPACKAGE); //smallPackNum
                                    goodsInfo.push(item.TM); //smallPackBarcode
                                    goodsInfo.push(item.FDELETED); //isForbidden
                                    goodsInfo.push(item.JX); //drugsType  药剂类型
                                    goodsInfo.push(item.ISCONTROLSELLSCOPE); //isAreaLimited
                                    goodsInfo.push(item.AREARANGEDESCIBEID); //areaDesc

                                    logger.debug(goodsInfo);
                                    /* save into db */
                                    dbService.metaImportGoodsInfo(connect, customerDBname, goodsInfo, function (err, result) {
                                        if (err) {
                                            lastError = err;
                                        }
                                        logger.debug(JSON.stringify(result));
                                        goodsInfoId = result.insertId;
                                        done(err, result);
                                    });

                                },
                                /**
                                 * Step 2. import goodsGsp
                                 * @param done
                                 */

                                function importGoodsGsp(done) {
                                    if(goodsInfoId===0){
                                        done()
                                    }else {

                                        /* set up the goodsGsp object */
                                        //(goodsId, guid, gmpNumber, gmpCertificationDate, gmpValidDate, filingNumber, filingNumberValidDate, " +
                                        //"    importRegisCertNum, importRegisCertNumValidDate, drugsType, drugsValidDate, storageCondition, " +
                                        //"    gspType, registeredTradeMarksAndPatents, businessLicenseValidDate, instrumentProductionLicenseNum, " +
                                        //"    drugAdministrationEncoding, isMedicalApparatus, isMedicine, isImported, isHerbalDecoctioniieces, " +
                                        //"    isCheckMedicalInstrumentCert, isPregnancyRermination, isHerbalMedicine, isContainSpecialContent, " +
                                        //"    isPrescriptionDrugs, isMedicalInsuranceDrugs, isProteinasSimilationPreparation, isContainEphedrine, " +
                                        //"    isContainPeptidehormone, isSecondPsychotropicDrugs, isFirstPsychotropicDrugs, isHazardousChemicals, " +
                                        //"    isStupefacient, isDiagnosticReagent, isMedicalToxicity, isContainingStimulants, isVaccine, isHealthProducts, " +
                                        //"    isFood)

                                        goodsGsp.push(goodsInfoId); //goods id 商品编号  unique not null
                                        goodsGsp.push(item.GUID); //guid 商品ERP编号
                                        goodsGsp.push(item.GMPZSH); //gmpNumber GMP证书号
                                        goodsGsp.push(item.GMPRZRQ); //gmpCertificationDate GMP认证日期
                                        goodsGsp.push(item.GMPRZXQ); //gmpValidDate GMP有效日期
                                        goodsGsp.push(item.PZWH);//filingNumber 批准文号或者器械注册备案号 unique not null
                                        goodsGsp.push(item.PZWHXQ);//filingNumber 批准文号或者器械注册备案号 unique not null
                                        goodsGsp.push(item.JKZCZH); //importRegisCertNum 进口注册证号
                                        goodsGsp.push(item.XKZQX); //importRegisCertNumValidDate 进口注册证期限

                                        goodsGsp.push(item.XQ); //drugsValidDate 药剂有效期
                                        goodsGsp.push(item.CCTJ); //storageCondition 存储条件
                                        goodsGsp.push(item.GSPSORTID); //gspType GSP类别
                                        goodsGsp.push(item.ZCSB); //registeredTradeMarksAndPatents 注册商标以及专利
                                        goodsGsp.push(item.ZZQX); //businessLicenseValidDate 生产企业营业执照年检有效期
                                        goodsGsp.push(item.YYZYXKZXQ); //instrumentProductionLicenseNum  器械生产许可证号
                                        goodsGsp.push(item.ZYX1); //drugAdministrationEncoding 药监编码
                                        goodsGsp.push(item.MEDICALINSTRUMENTTYPE); //isMedicalApparatus 医疗器械类别
                                        goodsGsp.push(item.YPBZ); //isMedicine  药品标志
                                        goodsGsp.push(item.JKPZBZ); //isImported     进口标志
                                        goodsGsp.push(item.ZYBZ); //isHerbalDecoctioniieces  中药饮片标志
                                        goodsGsp.push(item.ISCHECKMEDIDEVICES); //isCheckMedicalInstrumentCert 需检查医疗器械证标志
                                        goodsGsp.push(item.ZZRS_TAG); //isPregnancyRermination 终止妊娠品标志
                                        goodsGsp.push(item.ZYC_TAG); //isHerbalMedicine  中药材标志
                                        goodsGsp.push(item.FISGMP); //isContainSpecialContent 含特药品标志
                                        goodsGsp.push(item.SFCF); //isPrescriptionDrugs 是否处方药品标志
                                        goodsGsp.push(item.FISYBPZ); //isMedicalInsuranceDrugs 医保药品标志
                                        goodsGsp.push(item.ISEGGPREPARATION); //isProteinasSimilationPreparation 蛋白同化制剂标志
                                        goodsGsp.push(item.ISEPHEDRINE); //isContainEphedrine 含麻黄碱标志
                                        goodsGsp.push(item.ISTLHORMONE); //isContainPeptidehormone 含肽类激素标志
                                        goodsGsp.push(item.ISTWOCLASSMENTALDRUG); //isSecondPsychotropicDrugs 二类精神药品标志
                                        goodsGsp.push(item.ISMINDDRUG); //isFirstPsychotropicDrugs 一类精神药品标志
                                        goodsGsp.push(item.ISDANGERCHEMISTRY); //isHazardousChemicals 危险化学品标志
                                        goodsGsp.push(item.ISANAESTHETIC); // isStupefacient	  麻醉药品标志
                                        goodsGsp.push(item.ISDIAGNOSTICREAGENT); //isDiagnosticReagent  诊断试剂药品标志
                                        goodsGsp.push(item.ISMEDICALTOXICITY); // isMedicalToxicity   医疗用毒性品标志
                                        goodsGsp.push(item.ISSTIMULANT); //  isContainingStimulants        含兴奋剂药品标志
                                        goodsGsp.push(item.ISVACCINE); // isVaccine        是否疫苗标志
                                        goodsGsp.push(item.ISHEALTHFOODS); // isHealthProducts 是否保健品标志
                                        goodsGsp.push(item.ISFOOD); // isFood    食品标识
                                        logger.debug(goodsGsp);
                                        /* save into db */
                                        /* insert Goods GSP */
                                        dbService.metaImportGoodsGsp(connect,customerDBname, goodsGsp, function (err, insertId) {
                                            if (err) {
                                                lastError = err;
                                            }
                                            logger.debug(insertId);
                                            done(err, insertId);
                                        });

                                    }
                                }
                                /**
                                 * Step 3. import goodsPrice
                                 * @param done
                                 */
                                //function importGoodsPrice(done){
                                //    if(goodsInfoId===0){
                                //        done()
                                //    }else {
                                //        /* set up the goodsPrice object */
                                //        goodsPrice.push(item.GUID); //guid 商品ERP编号
                                //        goodsPrice.push(goodsInfoId); //goodsId 商品编号
                                //        goodsPrice.push(item.PFJ); //wholesalePrice 批发价
                                //        goodsPrice.push(item.LSJ); //refRetailPrice  参考零售价
                                //        goodsPrice.push(item.PFJ1); //price1   售价一
                                //        goodsPrice.push(item.LSJ1); //price2   售价二
                                //        goodsPrice.push(item.SJ1); //price3   售价三
                                //        goodsPrice.push(item.GJXJ); //limitedPrice 国家限价
                                //        goodsPrice.push(item.BASEMATERIELRETAILPRICE); //basePrice 国家基药价
                                //        goodsPrice.push(item.PROMANAGERETAILPRICE); //provinceBasePrice 省管基药价
                                //        goodsPrice.push(item.BASEMATERIELGUIDEPRICE); //guidedBasePrice 基药指导价
                                //        logger.debug(goodsPrice);
                                //
                                //
                                //    }
                                //},
                                /**
                                 * Step 4. import goodsInventory
                                 * @param done
                                 */
                                //function importGoodsInventory(){}

                            ],
                            /**
                             * On final, do either commit or rollback
                             * @param errList
                             * @param resultList
                             */
                            function (err, resultList) {
                                if (err&typeof(err) ==="object") {
                                    logger.debug("Rollback the transaction");
                                    dbService.rollbackTrans(connect, function (transErr) {
                                        callback(err)
                                    });
                                }
                                else {
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
        },
    };
    return worker;

    function syncQuery(sql){
        setInterval(checkQueryDone, 100);
    }

    function checkQueryDone(){
        if (finished) {
            index++;
            __mysql.query(sql, function(err, results){
                finished = false;
            });
        }
    }

};