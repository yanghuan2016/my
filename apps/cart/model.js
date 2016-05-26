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
 * cart/model.js
 *
 * 购物车信息model
 * --------------------------------------------------------------
 * 2015-10-06   dawei-romens@issue#106
 *
 */

module.exports = function () {

    /*
     * Services
     */
    var logger = __logService;
    var db = __dbService;
    /*
     * init model name etc
     */
    var MODELNAME = __dirname.split("/").pop();

    var async = require("async");
    var _ = require('lodash');
    /*
     * load 3rd party modules
     */
    var underscore = require('underscore');

    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {

        getGoodsInventoryContent: function (customerDB, amount, planDetails) {
            logger.enter();
            var content = '暂无信息';
            if (planDetails.length > 0) {
                for (var i = planDetails.length - 1; i >= 0; i--) {
                    if (amount > planDetails[i].threshold) {
                        content = planDetails[i].content;
                        return content;
                        break;
                    }
                }
            } else {
                return content;
            }
        },

        /**
         * 添加购物车商品
         * @param customerDB
         * @param clientId
         * @param postData
         * @param callback
         */
        postCartGoods: function (customerDB, clientId, postData, callback) {
            logger.enter();
            async.series([
                function (done) {
                    var goodsId = Number(postData.goodsId);
                    var quantity = Number(postData.quantity);
                    db.shoppingCartUpdateGoodsQuantity(customerDB, clientId, goodsId, quantity, postData.remark, function (error, result) {
                        if (error) {
                            logger.sqlerr(error);
                            return done(error);
                        }
                        done(null, result);
                    });
                },
                function (done) {
                    db.shoppingCartRemoveGoodsQuantityLessThan0(customerDB, clientId, function (error, result) {
                        if (error) {
                            logger.sqlerr(error);
                            return done(error);
                        }
                        done(null, result);
                    });
                }
            ], function(error, resultList) {
                if(error) {
                    logger.error(error);
                    callback(error);
                }
                else {
                    logger.ndump(resultList);
                    callback(null, resultList);
                }
            });
        },

        /**
         * 删除购物车商品
         * @param customerDB
         * @param goodsIds
         * @param clientId
         * @param callback
         */
        deleteCartItems: function(customerDB, goodsIds, clientId, callback) {
            logger.enter();
            async.series([
                // 从购物车删除该项目
                function (done){
                    db.deleteGoodsFromCart(customerDB, goodsIds, clientId, function(err, success){
                        done(err, success);
                    });
                },
                // 重新读取购物车中商品品种数量
                function (done){
                    db.countCartItem(customerDB, clientId, function(err,count){
                        done(err, count);
                    });
                }
            ],
            function(err, resultList) {
                if (err && typeof(err)==="object"){
                    logger.error(error);
                    callback(err);

                } else {
                    logger.ndump(resultList);
                    callback(null, resultList[1]);
                }
            });
        },

        /**
         *
         * @param customerDB
         * @param clientId
         * @param postData
         * @param callback
         */
        postCartItems: function(customerDB, clientId, postData, callback) {
            logger.enter();
            var quantity = Number(postData.quantity);
            var goodsId = Number(postData.goodsId);
            var remark = postData.quantity;
            var limitedNum = 0;
            var numExisting = 0;
            var itemInCart;
            var numInventory;
            var sellEnable;

            db.ClientGoodsPriceList(customerDB, clientId, goodsId, function(err,clientGoodsPrice){
                if(err){
                    logger.error(err);
                    return callback('DBERROR');
                }
                if(clientGoodsPrice.price<=0){
                    //res.json(new FeedBack(FBCode.AUTHFAILURE, '价格信息验证失败，无法添加购物车.'));
                    return callback('VERIFAILED');
                }
                db.findGoodsInfoForAddToCart(customerDB, clientId, goodsId, function (error, findIncart) {
                    if (error) {
                        logger.error(error);
                        return callback('DBERROR');
                    }
                    db.findGoodsGspInfo(customerDB, goodsId, function (error, GoodsGsp) {
                        //获取ClientGSP控制范围信息
                        db.findClientGspType(customerDB, clientId, function (error, ClientGspType){
                            var gsp = [];
                            if(__gspScopeCheck==true && ClientGspType.length !== 0){ //开关
                                underscore.map(ClientGspType,function(item){
                                    gsp.push(item.goodsGspTypeId);
                                });
                                var cartbuy = underscore.some(gsp,function(gspid){
                                    return gspid == GoodsGsp[0].goodsGspid;
                                });
                                if(!cartbuy){
                                    //res.json(new FeedBack(FBCode.DBFAILURE, '存在商品不在您的GSP控制范围内,无法加入购物车'));
                                    return callback('OUTOFSCOPE');
                                }
                            }
                            if(error){
                                logger.error(error);
                                return callback('DBERROR');
                            }
                            itemInCart = findIncart[0];
                            numInventory = Number(GoodsGsp[0].inventory);
                            var countCartCallback = function (error, countCart) {
                                if (error) {
                                    logger.error(error);
                                    //res.json(new FeedBack(FBCode.SUCCESS, '添加成功,但是查询购物车条数失败.'));
                                    return callback('FINDITEMFAIL');
                                }
                                limitedNum =(numInventory - numExisting)>0?(numInventory - numExisting ):0;
                                if(limitedNum == 0){
                                    var msg = '您的购物车中已有:' + numExisting + '件商品,由于库存限制,最多只能再加入:' +  limitedNum + '件.';
                                    var fbData = {
                                        goodsId: itemInCart.goodsId,
                                        existing: itemInCart.existing,
                                        inventory: itemInCart.inventory
                                    };
                                    //res.json(new FeedBack(FBCode.DBFAILURE, msg, fbData));
                                    callback('LIMITEDNUM', {msg: msg, fbData: fbData});
                                }else{
                                    //res.json(new FeedBack(FBCode.SUCCESS, '加入购物车成功', {cartItemCount: countCart}));
                                    callback(null, {cartItemCount: countCart});
                                }
                            };
                            //当没有查到数据,新增:
                            //验证库存
                            if(findIncart.length !== 0) {
                                numExisting = Number(itemInCart.existing);
                                sellEnable = (!Boolean(itemInCart.negSell) && (numInventory - numExisting - quantity <= 0));//商品上架不允许负库存需检查数量
                                if(sellEnable){
                                    //res.json(new FeedBack(FBCode.DBFAILURE, '商品由于库存限制不允许加入!'));
                                    return callback('LIMITREPE');
                                }
                                db.updateCart(customerDB, itemInCart.cartId, quantity + numExisting, remark, function updateCart(error, affectedRows) {
                                    if (error) {
                                        logger.error(error);
                                        //res.json(new FeedBack(FBCode.DBFAILURE, '商品已经存在购物车,试图增加数量时出错.请重试!'));
                                        return callback('ADDGOODSNUM');
                                    }
                                    db.countCartItem(customerDB, clientId, countCartCallback);
                                });
                                return;
                            }else{
                                sellEnable = (!Boolean(GoodsGsp[0].negSell) && (numInventory  - quantity <= 0));
                                if(sellEnable){
                                    //res.json(new FeedBack(FBCode.DBFAILURE, '商品由于库存限制不允许加入!'));
                                    return callback('LIMITREPE');
                                }
                                db.addCart(customerDB, clientId, goodsId, quantity, remark, function (error, cartItemId) {
                                    if (error) {
                                        logger.error(error);
                                        //res.json(new FeedBack(FBCode.DBFAILURE, '添加失败'));
                                        return callback('ADDCARTFAIL');
                                    }
                                    db.countCartItem(customerDB, clientId, countCartCallback);
                                });
                                return;
                            }
                        });
                    });
                });
            });
        },

        /**
         * 获取购物车列表
         * @param customerDB
         * @param clientId
         * @param customerId
         * @param callback
         */
        getCartList: function(customerDB, data, clientId, customerId, callback){
            logger.enter();
            async.series([
                    function listCart(done) {
                        db.listCart(customerDB, clientId, function (err, cartItems) {
                            if(err){
                                logger.error(err);
                                done(err);
                            }else{
                                var planDetails = data.inventoryDetails;
                                logger.ndump("planDetails", planDetails);
                                cartItems = underscore(cartItems).map(function (item) {
                                    //按库存显示方案更新显示信息
                                    for(var i=0;i<planDetails.length;i++){
                                        if(item.showPlanId == planDetails[i].goodsInventoryPlanId){
                                            if(item.storage<planDetails[i].threshold){
                                                item.content = planDetails[i].content=="实际数量"?item.storage:planDetails[i].content;
                                                item.storage = item.negSell == 1 ? -1 : item.storage;
                                                break;
                                            }
                                        }
                                    }
                                    return item;
                                });
                                done(err, cartItems);
                            }
                        });
                    },
                    function listAddress(done) {
                        db.listAddress(customerDB, clientId, function (err, address) {
                            if(err){
                                logger.error(err);
                                done(err);
                            }else{
                                done(err, address);
                            }
                        });
                    },
                    function getclientInfoForContract(callback) {
                        db.retrieveClientInfoForContract(customerDB, clientId, function (error, clientInfo) {
                            if(error){
                                logger.error(error);
                                done(error);
                            }else{
                                callback(error, clientInfo)
                            }
                        });
                    },
                    function getCustomerInfoForContract(callback) {
                        db.retrieveCustomerInfoForContract( __cloudDBName , customerId, function (error, customerInfo) {
                            if(error){
                                logger.error(error);
                                done(error);
                            }else {
                                callback(error, customerInfo)
                            }
                        });
                    },
                    function getClientFinance(callback) {
                        db.getClientFinance(customerDB, clientId, function(err, clientFinance) {
                            var key = "checkOutDays";
                            db.getKeyValue(customerDB,key,function(value){
                                if(err){
                                    logger.error(err);
                                    callback(err);
                                }else {
                                    clientFinance.accoutDays = value;
                                    callback(err, clientFinance);
                                }
                            })
                        })
                    }
                ],
                function (err, resultList) {
                    if (err && typeof(err)==="object") {
                        logger.error(err);
                        callback(err);
                    } else {
                        var cartItems = resultList[0];
                        var address = resultList[1];

                        data.cart = { cartItems: cartItems };
                        data.address = address;
                        data.orderContractInfo={
                            clientSignature:null,
                            customerSignature:null,
                            clientSignatureDate:null,
                            customerSignatureDate:null,
                            status:null
                        };
                        data.clientContractInfo = resultList[2];
                        data.customerContractInfo = resultList[3];
                        data.contractStage = "CLIENTSIGN";
                        data.shipToRegisteredAddressOnly = __shipToRegisteredAddressOnly;
                        data.clientFinance = resultList[4];
                        data.defaultAddress=resultList[2].businessAddress;
                        var total = 0;
                        total = underscore(resultList[0]).reduce(function (total, item) {
                            return total + Number(item.quantity) * Number(item.clientGoodsPrice);
                        }, total);
                        data.cart.total = total;
                        data.cart.remarks = '';
                        var tip = "";
                        if(cartItems.length == 0 ){
                            tip = "您的购物车是空的哦"
                        }
                        callback(null, {data: data, tip:tip});
                        //res.render('customer/cart/cart', {data: data, tip:tip ,isexpire: isExpire});
                    }
                }
            );
        },


        /**
         * 获取购物车列表信息
         * @param customerDB
         * @param clientId
         * @param callback
         */
        getCartListInfo: function(customerDB, clientId, callback) {
            logger.enter();
            var temp = {},
                data = {};
            async.series([
                // step1. 获取商品库存详情
                function (done) {
                    db.listGoodsInventoryPlanDetails(customerDB, function (err, details) {
                        if(err) {
                            logger.error(err);
                            return done(err);
                        }
                        temp.inventoryDetails = details;
                        done(null, details);
                    });
                },
                // step2. 获取购物车列表
                function (done) {
                    db.listCart(customerDB, clientId, function (err, cartList) {
                        if(err){
                            logger.error(err);
                            return done(err);
                        }
                        temp.cartItems = cartList;
                        done(err, cartList);
                    });
                }
            ], function(err, result) {
                if(err) {
                    logger.error(err);
                    callback(err);
                }
                data.cartItems = _.map(temp.cartItems, function(item){
                    //按库存显示方案更新显示信息
                    for(var i=0; i<temp.inventoryDetails.length; i++) {
                        if(item.showPlanId == temp.inventoryDetails[i].goodsInventoryPlanId){
                            if(item.storage<temp.inventoryDetails[i].threshold){
                                item.content = temp.inventoryDetails[i].content=="实际数量"?item.storage:temp.inventoryDetails[i].content;
                                item.storage = item.negSell == 1 ? -1 : item.storage;
                                break;
                            }
                        }
                    }
                    return item;
                });
                data.total = 0;
                data.total = _.reduce(temp.cartItems, function(total, item){
                    return total + Number(item.quantity) * Number(item.clientGoodsPrice);
                }, data.total);

                callback(null, {cart: data});
            });
        },

        /**
         * 获取购物车地址列表
         * @param customerDB
         * @param clientId
         * @param callback
         */
        getCartAddrList: function(customerDB, clientId, callback) {
            logger.enter();
            db.listAddressDetail(customerDB, clientId, function(err, addrList) {
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                callback(null, {address: addrList});
            });
        },

        /**
         * 添加新的地址信息
         * @param customerDB
         * @param addrInfo
         * @param callback
         */
        addNewAddressItem: function(customerDB, addrInfo, callback) {
            logger.enter();
            var addrData = {};
            async.series([
                // step1. 新添加地址信息
                function (done) {
                    db.addAddressInfo(customerDB, addrInfo, function(err, result) {
                        if(err) {
                            logger.error(err);
                            return done(err);
                        }
                        addrData.id = result.insertId;
                        done();
                    });
                },
                // step2. 获取新地址信息详情
                function (done) {
                    db.getAddressInfoById(customerDB, addrData.id, function(err, result) {
                        if(err) {
                            logger.error(err);
                            return done(err);
                        }
                        addrData.clientId = result[0].clientId;
                        addrData.receiver = result[0].receiver;
                        addrData.telNum = result[0].telNum;
                        addrData.mobileNum = result[0].mobileNum;
                        addrData.postCode = result[0].postCode;
                        addrData.provinceFirstStage = result[0].provinceFirstStage;
                        addrData.citySecondStage = result[0].citySecondStage;
                        addrData.countiesThirdStage = result[0].countiesThirdStage;
                        addrData.remark = result[0].remark;
                        addrData.updatedOn = result[0].updatedOn;
                        addrData.createdOn = result[0].createdOn;
                        done();
                    });
                }
            ], function(err, resultList) {
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                callback(null, addrData);
            });
        },

        /**
         * 通过地址ID获取地址详情
         * @param customerDB
         * @param addressId
         * @param callback
         */
        getAddressDetail: function(customerDB, addressId, callback) {
            logger.enter();
            var addressData = {};
            db.getAddressInfoById(customerDB, addressId, function(err, result) {
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                addressData = result[0];
                addressData.id = addressId;
                callback(null, addressData);
            });
        },

        /**
         * 通过地址ID修改地址详情
         * @param customerDB
         * @param addressId
         * @param addrInfo
         * @param callback
         */
        putAddressDetail: function(customerDB, addressId, addrInfo, callback) {
            logger.enter();
            var addrData = {};
            async.series([
                // step1. 修改地址详情
                function (done) {
                    db.updateAddressInfo(customerDB, addressId, addrInfo, function(err, result){
                        done(err, result);
                    });
                },
                // step2. 获取修改后的地址详情
                function (done) {
                    db.getAddressInfoById(customerDB, addressId, function(err, result) {
                        if(err) {
                            logger.error(err);
                            return done(err);
                        }
                        addrData = result[0];
                        addrData.id = addressId;
                        done();
                    });
                }
            ], function(err, resultList) {
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                callback(null, addrData);
            });
        },

        /**
         * 通过地址ID删除地址
         * @param customerDB
         * @param addressId
         * @param callback
         */
        delAddressItem: function(customerDB, addressId, callback) {
            logger.enter();
            db.delAddressInfoById(customerDB, addressId, function(err, result) {
                if(err) {
                    logger.error(err);
                    return callback(err);
                }
                callback(null, result);
            });
        }



    };

    return model;
};