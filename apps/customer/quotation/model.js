/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/
module.exports=function() {
    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;
    /*
     * load 3rd party modules
     */
    var underscore = require("underscore");
    var async = require("async");
    /*
     * load project modules
     */
    var myPath = require(__modules_path + "/mypath");
    /*
     * init model name etc
     */
    var MODELNAME = myPath.getModelName(__dirname);
    logger.trace("Initiating model:[" + MODELNAME + "]");

    //model
    var model = {

        /**
         * get table data from Operator for quotation
         * @param sqlConnect  __mysql or connect
         * @param dBName     customerDB or other
         * @param condition id,name or other,for example{id: 1}
         * @param callback
         * var data = {
            name: '报价管理员Jack',
            idCard: '513022198612288663',
            phoneNumber: '15928142456',
            email: '1592812@gmail.com'
        };
         */
        getOperatorInfo : function(sqlConnect,dBName,condition,callback){
            logger.enter();
            var data = {};
            db.selectOperatorInfo(sqlConnect,dBName,condition,function(err,results){
                if(!err&& results.length>0){
                    data.name = results[0].operatorName;
                    data.idCard = results[0].citizenIdNum;
                    data.phoneNumber = results[0].mobileNum;
                    data.email = results[0].email;
                }
                callback(err,data);
            });
        },

        /**
         * update table Operator info
         * @param sqlConnect __mysql or connect
         * @param dBName    customerDB or other
         * @param updateInfo  eg:{name:"kevin"}
         * @param callback    success or fail
         */
        updateOperatorBasicInfo: function(sqlConnect,dBName,updateInfo,condition,callback){
            logger.enter();
            var upInfo = {
                operatorName:updateInfo.name||undefined,
                citizenIdNum:updateInfo.idCard||undefined,
                mobileNum:updateInfo.phoneNumber||undefined,
                email:updateInfo.email||undefined
            };
            db.updateOperatorBasic(sqlConnect,dBName,upInfo,condition,function(err,results){
                if(err){
                    callback(err);
                }else{
                    logger.ndump(results);
                    callback(null,true)
                }
            })
        },

        /**
         * check old password is right
         * @param sqlConnect
         * @param dBName
         * @param password
         * @param condition
         * @param callback err or boolean isSucc = true or false;
         */
        verifyPwd : function(sqlConnect,dBName,password,condition,callback){
            logger.enter();
            db.checkPwdForOperator(sqlConnect,dBName,password,condition,function(err,results){
                if(err){
                    callback(err);
                }else{
                    callback(null,results.length>0);
                }
            })
        },

        /**
         * update pwd for operator
         * @param sqlConnect
         * @param dBName
         * @param password
         * @param condition
         * @param callback
         */
        updateOperatorPwd : function(sqlConnect,dBName,password,condition,callback){
            logger.enter();
            db.updatePwdForOperator(sqlConnect,dBName,password,condition,function(err,results){
                if(err){
                    callback(err);
                }else{
                    callback(null,results);
                }
            })
        },

        /**
         *
         * 根据指定条件列出所有的报价单合计数据
         * @param sqlConnect
         * @param dBName
         * @param condition
         * @param callback
         */
        listAllQuotationDetails :function(sqlConnect,dBName,condition,callback){
            logger.enter();
            db.selectQuotationDetails(sqlConnect,dBName,condition,function(err,results){
                if(err){
                    callback(err);
                }else{
                    var data = getQuoatationFormat(results);
                    callback(null,data);
                }
            })
        },

        /**
         * 根据指定条件列出指定的某个报价详情数据
         * @param sqlConnect
         * @param dBName
         * @param condition
         * @param callback
         */
        getQuoationDetailsByCondition :function(sqlConnect,dBName,condition,callback){
            logger.enter();
            db.selectQuotationDetails(sqlConnect,dBName,condition,function(err,results){
                if(!err){
                    var quoteGoods = [];
                    var goodsSumObj = underscore.reduce(results,function(memo,obj){
                        if(results[0].inquiryId == obj.inquiryId){
                            memo.inquiryQuantity += obj.inquiryQuantity;
                        }
                        return memo;
                    },{inquiryQuantity:0});

                    var quotationData = {
                        quotationNo: results[0].inquiryId,
                        commonName: results[0].buyerName,
                        goodsSum: goodsSumObj.inquiryQuantity,
                        quoteDate: new Date(results[0].updatedOn),
                        deadLine: new Date(results[0].inquiryExpire),
                        createdOn: new Date(results[0].createdOn),
                        inquiryExpire: new Date(results[0].inquiryExpire),
                        quotationExpire: new Date(results[0].quotationExpire),
                        status: underscore.isNull(results[0].quotationPrice)?'pending':'finished'
                    };
                    async.mapSeries(results,
                        function(item,mapcallback){
                            var licenseNo = item.licenseNo;
                            db.getGoodsInfoBylicenseNo(sqlConnect,dBName,licenseNo,function(err,results){
                                if(err){
                                    logger.error("licenseNO = "+ licenseNo +"can not find goodsInfo");
                                    mapcallback(null,{});
                                }else{
                                    var quoObj = {
                                        quotationId: item.id,//add this to update
                                        goodsNo: results[0].goodsNo,
                                        imgUrl: results[0].imageUrl,
                                        commonName: results[0].commonName,
                                        producer: results[0].producer,
                                        spec: results[0].spec,
                                        applyNum: item.inquiryQuantity,
                                        quotePrice: item.quotationPrice,
                                        lastErpPrice: item.lastErpPrice,
                                        purchaseUpset:item.purchaseUpset,
                                        quoteNum: item.quotationQuantity,
                                        unit: results[0].measureUnit,
                                        drugsType: results[0].drugsType
                                    };
                                    quoteGoods.push(quoObj);
                                    mapcallback();
                                }
                            })
                        },
                        function(errs,resultArr){
                            if(errs){
                                callback(errs);
                            }else{
                                quotationData.quotaGoods = quoteGoods;
                                callback(null,quotationData);
                            }
                        }
                    )
                }else{
                    callback(err);
                }
            })
        },


        /**
         * update quotationDetails data
         * @param sqlConnect
         * @param dBName
         * @param updateData
         * @param callback
         */
        updateQuotationDetails : function(sqlConnect,dBName,updateData,callback){
            logger.enter();
            logger.debug(JSON.stringify(updateData));
            db.insertOnDupUpdateQuotationDetails(sqlConnect,dBName,updateData,function(err,results){
                callback(err,results);
            })
        },


        /**
         * 发送WEB报价信息到ERP
         * @param dbConnect
         * @param customerDB
         * @param data
         * @param callback
         */
        sendQuotationResult : function(dbConnect,customerDB,customerId,data,callback){
          logger.enter();
            var msgType = "EDI_QUOTATION_CREATED";
            var index = -1;
            var quotDetails = data.quotaGoods;
            async.mapSeries(quotDetails,
                function(item,mapCb){
                    index++;
                    var quotationId = item.quotationId;//报价单ID
                    var sellerDB = customerDB;
                    var sellerId = customerId;
                    var quotationInfo = undefined;
                    var buyerDB = undefined;
                    var sellerErpCode = undefined;
                    var goodsNo = undefined;
                    var msgData = undefined;
                    async.series([
                            //获取销售方报价数据
                            function(done){
                                db.listQuotationDetailsById(dbConnect,sellerDB,quotationId,function(err,result){
                                    if(err){
                                        done(null,"quotationId="+quotationId+" select ERR");
                                    }else{
                                        quotationInfo=result[0];
                                        done();
                                    }
                                });
                            },
                            //获取采购方的数据库名
                            function(done){
                                if(underscore.isUndefined(quotationInfo)){
                                    done();
                                }else{
                                    var buyerId = quotationInfo.buyerId;
                                    db.getBuyerInfoById(__cloudDBName,buyerId,function(err,result){
                                        if(!err && result.length>-1){
                                            buyerDB =__customerDBPrefix + "_" + result[0].dbSuffix;
                                        }
                                        done(err,result);
                                    });
                                }
                            },
                            //转换采购方数据库对应的报价方的ERPCODE和商品货号
                            function(done){
                                if(underscore.isUndefined(quotationInfo)){
                                    done();
                                }else{
                                    db.listSupplierInfoById(buyerDB,sellerId,function(err,results){
                                        sellerErpCode = results[0].erpCode;
                                        done(err,results);
                                    })
                                }
                            },
                            function(done){
                                if(underscore.isUndefined(quotationInfo)){
                                    done();
                                }else{
                                    db.getGoodsNoByPZWH(buyerDB,quotationInfo.licenseNo,function(err,results){
                                        goodsNo = results[0].goodsNo;
                                        done();
                                    })
                                }
                            },
                            //send data build
                            function(done){
                                if(underscore.isUndefined(quotationInfo)){
                                    done();
                                }else{
                                    var licenseNo = quotationInfo.licenseNo;
                                    var inquiryId = quotationInfo.inquiryId;
                                    var buyerId = quotationInfo.buyerId;
                                    var guid = creatGuid(inquiryId,licenseNo);
                                    var LSH = creatLSH(inquiryId,buyerId,index);
                                    msgData = {
                                        PRICECOMPARE:{
                                            GUID:guid,
                                            LSH:LSH,
                                            BILLDATE:new Date()
                                        },
                                        PRICECOMPAREDETAIL:{
                                            GUID:creatGuid("detail",getIndex(index)),
                                            PRICECOMPAREGUID:guid,
                                            DH:getIndex(index),
                                            GYS:sellerErpCode,//供应商ERP编号
                                            HH:goodsNo,
                                            SCHEDULECOUNT:quotationInfo.inquiryQuantity,
                                            SCHEDULEPRICE:quotationInfo.lastErpPrice,
                                            ORDERCOUNT:quotationInfo.quotationQuantity,
                                            ORDERPRICE:quotationInfo.quotationPrice
                                        },
                                        PRICECOMPARESCHEDULE:{
                                            GUID:creatGuid("schedule",getIndex(index)),
                                            PRICECOMPAREGUID:guid,
                                            BILLNO:LSH+getIndex(index),
                                            HH:goodsNo,
                                            SCHEDULECOUNT:quotationInfo.inquiryQuantity,
                                            SCHEDULEPRICE:quotationInfo.lastErpPrice
                                        }
                                    };
                                    logger.debug(JSON.stringify(msgData));
                                    done();
                                }
                            }
                        ],
                        function(errs,results){
                            //send msg to ERP
                            var ApiRobot = require(__base + "/modules/apiRobot");
                            var redisCli = __redisClient;
                            var cloudDB = __cloudDBName;
                            var isErpMsgCheckStrict = __isErpMsgCheckStrict;
                            var version = __erpApiVersion;
                            var apiRobot = new ApiRobot(cloudDB, db, redisCli, isErpMsgCheckStrict, version);
                            apiRobot.sendMsg(quotationInfo.buyerId, msgType, msgData,function sendMsgCallback(error, result) {
                                var sendresult = "";
                                if(error){
                                    sendresult = "send data"+msgData+"ERR";
                                }else{
                                    sendresult = "send data"+msgData+"SUCCESS";
                                }
                                logger.debug("quotationId="+quotationId+" data done");
                                mapCb(null,sendresult);
                            });
                        }
                    );
                },
                function(errs,results){
                        callback(null,results);
                }
            )
        },

        /**
         * 根据复合条件查询对应的询价单
         * @param sqlConnect
         * @param dBName
         * @param conditions
         * @param callback
         */
        queryQuotation : function(sqlConnect,dBName,conditions,callback){
            logger.enter();
            db.queryQuotationDetails(sqlConnect,dBName,conditions,function(err,results){
                var data = [];
                if(!err){
                    data = getQuoatationFormat(results);
                }
                callback(err,data);
            })
        }



    };

    //format quotation details data
    function getQuoatationFormat(results){
        var data = [];
        var monthlist = [];
        underscore.map(results,function(item){
            //统计同一个询价单下的商品总数
            var goodsSumObj = underscore.reduce(results,function(memo,obj){
                if(item.inquiryId == obj.inquiryId){
                    memo.inquiryQuantity += obj.inquiryQuantity;
                }
                return memo;
            },{inquiryQuantity:0});
            //格式化最小数据组
            var quoObj = {
                quotationNo: item.inquiryId,
                customerName: item.buyerName,
                goodsSum: goodsSumObj.inquiryQuantity,
                createdOn: item.createdOn,
                inquiryExpire: item.inquiryExpire,
                quotationExpire: item.quotationExpire
            };
            //判断数据生成时间的月份
            var quoYear = new Date(item.createdOn).getFullYear();
            var quoMon = (new Date(item.createdOn).getMonth());
            var quoteMonth = new Date(quoYear,quoMon);

            //判断是否已完成
            var isFinished = false;
            underscore.map(results,function(obj){
                if(!underscore.isNull(obj.quotationPrice) && item.inquiryId == obj.inquiryId){
                    isFinished = true;
                }
            });
            var pushObj = {};
            pushObj.status = isFinished?"finished":"pending";
            var monthStr = quoteMonth.toLocaleString();
            if(monthlist.indexOf(monthStr) == -1 ) {
                monthlist.push(monthStr);
                pushObj.quotes = [];
                pushObj.quoteMonth = quoteMonth;
                pushObj.quotes.push(quoObj);
                data.push(pushObj);
            }
            else if(monthlist.indexOf(monthStr)> -1){
                underscore.map(data,function(dItem){
                    if(dItem.quoteMonth.toLocaleString() == quoteMonth.toLocaleString()
                        && underscore.pluck(dItem.quotes,"inquiryId").indexOf(item.inquiryId)==-1
                        && dItem.status == pushObj.status){
                        dItem.quotes.push(quoObj);
                    }
                })
            }
        });
        return data;
    }
//create guid for Erp
    function creatGuid(inquiryId,licenseNo){
        var crypto = require('crypto');
        var buffer=inquiryId+licenseNo;
        crypto = crypto.createHash('md5');
        crypto.update(buffer);
        return crypto.digest('hex');
    }


//create LSH for Erp
    function creatLSH(inquiryId,buyerId,index){
        var dataStr = new Date().Format("yyyyMMdd");
        var result = "SCCBJ"+ inquiryId+ buyerId+ dataStr+getIndex(index);
        return result;
    }
//format index
    function getIndex(index){
        if(index < 10){
            return "0"+index;
        }
        return index+"";
    }





    return model;
};
