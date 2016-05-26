/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

// SCC modules:
require("../../modules/test/initEnv.js")();


// 3rd modules:
var path = require('path');
var _ = require("underscore");
var async = require('async');
var EventProxy = require('eventproxy');
var sprintf = require("sprintf-js").sprintf;


// variables:
var redisService = __redisClient;
var dbService = __dbService;
var modulesPath = __modules_path;
var cloudDbName = __cloudDBName;
var logger = __logService;
var isErpMsgCheckStrict = __isErpMsgCheckStrict;
var erpApiVersion = __erpApiVersion;
var customerDbPrefix = __customerDBPrefix;

// init:
var ErpAppCodeRobot = require(modulesPath + path.sep + 'erpAppCodeRobot');
var ApiRobot = require(modulesPath + "/apiRobot");
var erpAppCodeRobot = new ErpAppCodeRobot(cloudDbName, dbService, redisService);
var apiRobot = new ApiRobot(cloudDbName, dbService, redisService, isErpMsgCheckStrict, erpApiVersion);


function ERPGoodsAsync(enterpriseId) {
    if (enterpriseId == undefined) {
        logger.error("enterpriseId is undefined");
        return;
    }
    this.cloudDBName = cloudDbName;
    this.enterpriseId = enterpriseId;
}

ERPGoodsAsync.prototype.REQUEST_GOODS_COUNTS = function (callback) {
    var msgType = "ASYNC_GOODS_COUNT";
    var data = {};

    apiRobot.sendMsg(this.enterpriseId, msgType, data, function (error, feedback) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        if(feedback.status !== '200') {
            callback(new Error(feedback.msg));
        }
        callback(null, feedback.data.kckCount);
    });
};

// 该方法用分页的方式获取 商品的guid和updateTime
ERPGoodsAsync.prototype.REQUEST_GOODS_UPDATE_TIME = function (goodsCount, callback) {
    logger.enter();
    var msgType = "ASYNC_GOODSBASICINFO_KEYS";
    var data = {
        "startNo": 1,               //开始序号
        "endNo": goodsCount         //结束序号
    };
    // 一次性取商品的guid&updateTime
    apiRobot.sendMsg(this.enterpriseId, msgType, data, function (error, feedback) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        var data = JSON.parse(feedback.data);
        callback(null, data.YW_KCK);
    });
};

// 查找待同步商品的guid
ERPGoodsAsync.prototype.retrieveGoodsGuidWillSync = function (goodsUpdateTimeData, callback) {
    logger.enter();
    var enterpriseId = this.enterpriseId;
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

    // 待更新到数据库的数据
    goodsWillUpdateToDb = _.reject(goodsUpdateTimeData, function (item) {
        return item.UPDATEDATE === null;
    });

    // 从数据库查出需要想ERP拉取的数据
    async.series(
        [
            // 查 customDBName
            function (callback) {
                dbService.enterpriseInfoRetrieveByEnterpriseId(cloudDbName, enterpriseId, function (error, sellerEnterpriseInfo) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }

                    if (sellerEnterpriseInfo.length === 0 || sellerEnterpriseInfo[0].customerDBSuffix === undefined) {
                        return callback(new Error('没有找到企业对应的数据库!!'));
                    }

                    customerDbName = customerDbPrefix + '_' + sellerEnterpriseInfo[0].customerDBSuffix;
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
};

ERPGoodsAsync.prototype.REQUEST_GOODS_DETAIL = function (guidOfGoodsWillSync, callback) {
    logger.enter();
    var msgType = "ASYNC_GOODSBASICINFO_DETAILS";

    var guidListStr = _.reduce(guidOfGoodsWillSync, function (memo, item) {
        if (memo !== "") {
            memo += ','
        }
        return memo + "'" + item + "'"
    }, "");

    var data = {'GUID': guidListStr};
    apiRobot.sendMsg(this.enterpriseId, msgType, data, function (error, feedback) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        var goodsInfo = undefined;
        try {
            goodsInfo = JSON.parse(feedback.data).YW_KCK;
        } catch (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, goodsInfo);
    });
};

ERPGoodsAsync.prototype.batchInsertIntoGoodsInfo = function (goodsInfo, callabck) {
    var cloudDbName = this.cloudDBName;
    var enterpriseId = this.enterpriseId;
    var customerDbName = null;
    async.series([
            // 通过enterpriseId,拿到customDBName
            function (callback) {
                dbService.enterpriseInfoRetrieveByEnterpriseId(cloudDbName, enterpriseId, function (error, sellerEnterpriseInfo) {
                    if (error) {
                        logger.error(error);
                        return callback(error);
                    }
                    if (sellerEnterpriseInfo.length === 0 || sellerEnterpriseInfo[0].customerDBSuffix === undefined) {
                        return callback(new Error('没有找到企业对应的数据库!!'));
                    }

                    customerDbName = customerDbPrefix + '_' + sellerEnterpriseInfo[0].customerDBSuffix;
                    callback(null, customerDbName);
                });
            },
            function (callback) {

                console.log('goodsInfo:', goodsInfo.length);
                // 将没有批准文号和货号的商品数据过滤掉
                var goodsInfoList = _.filter(goodsInfo, function (item) {
                    return !!item.PZWH && !!item.HH;
                });

                console.log('goodsInfo:', goodsInfo.length);

                if (goodsInfoList.length <= 0) {
                    return callback(new Error("没有商品数据个写入数据库."));
                }

                console.log('goodsInfoList.length:', goodsInfoList.length);

                batchAddERPGoodsBasicInfo(customerDbName, goodsInfoList, function (error, result) {
                    if (error) {
                        logger.error(error);
                        return callabck(error);
                    }

                    callback(null, result);
                });
            }
        ],
        function (error, resultList) {
            if (error) {
                logger.error(error);
                return callabck(error);
            }
            callabck(null,  resultList);
        }
    );
};

function batchAddERPGoodsBasicInfo(customerDbName, goodsBasicInfo, callback) {
    logger.enter();

    dbService.beginTrans(function (connection) {
        async.series(
            [   //插入goodsInfo
                function (callback) {
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

                        temp.push(item.LargePackUnit ? item.LargePackUnit : null);              //大包装单位largePackUnit
                        temp.push(item.MJL ? item.MJL : null);                                  //大包装量LargePackNum
                        temp.push(item.LargePackBarcode ? item.LargePackBarcode : null);        //大包装条码LargePackBarcode
                        temp.push(item.MiddlePackUnit ? item.MiddlePackUnit : null);            //中包装单位middlePackUnit
                        temp.push(item.ZBZL ? item.ZBZL : null);                                //中包装量middlePackNum

                        temp.push(item.MiddlePackBarcode ? item.MiddlePackBarcode : null);      //中包装条码MiddlePackBarcode
                        temp.push(item.SmallPackUnit ? item.SmallPackUnit : null);              //小包装单位SmallPackUnit
                        temp.push(item.SmallPackage ? item.SmallPackage : null);                //小包装量SmallPackNum
                        temp.push(item.IsNebalance ? item.IsNebalance : null);                  //允许负库存销售NegSell
                        temp.push(item.FDeleted ? item.FDeleted : null);                        //禁用标志IsForbidden

                        temp.push(item.IsCancel ? item.IsCancel : null);                        //删除标志IsDeleted
                        temp.push(item.RJKSXBZ ? item.RJKSXBZ : null);                          //入库检查库存上线标志Ischeckstore
                        temp.push(item.ISCONTROLSELLSCOPE ? item.ISCONTROLSELLSCOPE : null);    //需要控制销售范围标志IsAreaLimited
                        temp.push(item.AreaRangeDescibeId ? item.AreaRangeDescibeId : null);    //区域范围描述AreaDesc
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
                function (callback) {
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
                function (callback) {
                    // 准备数据:
                    var goodsGspInfoList = _.map(goodsBasicInfo, function (item) {
                        var temp = [];
                        temp.push(item.goodsId ? item.goodsId : null);// guid,UNI
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
                        temp.push(item.GSPSortID ? item.GSPSortID : null);//GSP类别GSPtype
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
                        temp.push(item.IsHealthFoods ? item.IsHealthFoods : null);//麻醉药品标志isStupefacient
                        temp.push(item.ISFOOD ? item.ISFOOD : null);//麻醉药品标志isStupefacient
                        return temp;
                    });

                    dbService.transactionInsertGoodsGsp(connection, customerDbName, goodsGspInfoList, function (error, result) {
                        if (error) {
                            logger.error(error);
                            return callback(error);
                        }

                        callback(null, result);
                    });
                },

                // 插入goodsPrice
                function (callback) {
                    // 准备数据:
                    var goodsPriceInfoList = _.map(goodsBasicInfo, function (item) {
                        var temp = [];
                        temp.push(item.goodsId ? item.goodsId : null);  // goodsId,UNI
                        temp.push(item.GUID ? item.GUID : null);        // guid,UNI
                        temp.push(item.PFJ ? item.PFJ : 0);             //商品批发价wholesalePrice
                        temp.push(item.LSJ ? item.LSJ : 0);             // 参考零售价,refRetailPrice
                        temp.push(item.PFJ1 ? item.PFJ1 : 0);           // 售价1,price1

                        temp.push(item.LSJ1 ? item.LSJ1 : 0);           //售价2,price2
                        temp.push(item.SJ1 ? item.SJ1 : 0);             //售价3,price3
                        temp.push(item.GJXJ ? item.GJXJ : 0);           //国家限价limitedPrice
                        temp.push(item.BASEMATERIELRETAILPRICE ? item.BASEMATERIELRETAILPRICE : 0);//国家基药价basePrice
                        temp.push(item.PROMANAGERETAILPRICE ? item.PROMANAGERETAILPRICE : 0);//省管基药价provinceBasePrice
                        temp.push(item.BaseMaterielGuidePrice ? item.BaseMaterielGuidePrice : 0);//基药指导价guidedBasePrice
                        return temp;
                    });

                    dbService.transactionInsertGoodsPrice(connection, customerDbName, goodsPriceInfoList, function (error, result) {
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

module.exports = ERPGoodsAsync;

var enterpriseId = 2;
var erpGoodsAsync = new ERPGoodsAsync(enterpriseId);
var goodsCount = undefined;
var goodsInfokeys = undefined;
var guidOfGoodsWillSync = undefined;
var goodsDetails = undefined;
async.series(
    [
        // 获取所有商品的数量
        function (cb) {
            erpGoodsAsync.REQUEST_GOODS_COUNTS(function (error, goodsCount) {
                if (error) {
                    cb(error);
                } else {
                    console.log("goodsCount=" + goodsCount);
                    cb(null, goodsCount);
                }
            });
        },
        // 用分页的方式获取 商品的guid和updateTime
        function (cb) {
            erpGoodsAsync.REQUEST_GOODS_UPDATE_TIME(goodsCount, function (err, basicInfokeys) {
                if (err) {
                    cb(err);
                } else {
                    console.log('basicInfokeys:,', JSON.stringify(basicInfokeys).substr(0, 10000));
                    goodsInfokeys = basicInfokeys;
                    cb(null, goodsInfokeys);
                }
            });
        },
        // select keys by update
        function (cb) {
            erpGoodsAsync.retrieveGoodsGuidWillSync(goodsInfokeys, function (err, guidlist) {
                if (err) {
                    cb(err);
                } else {
                    console.log('guidlist:', guidlist);
                    guidOfGoodsWillSync = guidlist;
                    cb(null, guidlist);
                }
            });
        },
        // get goodsdetails
        function (cb) {
            erpGoodsAsync.REQUEST_GOODS_DETAIL(guidOfGoodsWillSync, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    goodsDetails = result;
                    cb(null, goodsDetails);
                }
            })
        },
        // insert DB
        function (cb) {
            erpGoodsAsync.batchInsertIntoGoodsInfo(goodsDetails, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, result);
                }
            })
        }
    ],
    function (err, resultlist) {
        if (err) {
            console.log(err);
            console.log("同步商品数据有错" + err);
        } else {
            console.log("同步商品数据完成");
        }
    }
);


