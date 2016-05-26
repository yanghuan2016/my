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
 * accout/model.js
 *
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
    var underscore = require("underscore");
    /*
     * load 3rd party modules
     */
    var hasher = require('password-hash-and-salt');
    /*
     * init model name etc
     */
    var MODELNAME = __dirname.split("/").pop();
    logger.trace("Initiating model:[" + MODELNAME + "]");

    var model = {


        /**
         * update operator info in db
         * @param customerDBName
         * @param updateData
         * @param operatorId
         * @param callback
         */
        putOperatorInfo: function (customerDBName, updateData, operatorId, callback) {
            logger.enter();
            db.updateOperatorInfo(customerDBName, updateData, operatorId, function (err, result) {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY")
                        callback("ER_DUP_ENTRY");
                    else
                        callback("DBFAILURE");
                } else {
                    callback(null, result);
                }
            })
        },

        /**
         * edit account info page handler
         * @param customerDBName
         * @param data
         * @param operatorId
         * @param callback
         */
        getEditAccountInfo: function (customerDBName, data, operatorId, callback) {
            logger.enter();
            db.getCustomerOperatorById(customerDBName, operatorId, function (err, operator) {
                data.user = operator;
                var operatorRoles = operator.operatorRoles;
                data.permissionData = {
                    "帐号": {
                        "ROLE_VIEW_OPERATOR": {description: "帐号资料查看", value: true},
                        "ROLE_MANAGE_OPERATOR": {description: "账号管理", value: true}
                    },
                    "客户": {
                        "ROLE_VIEW_CLIENT": {description: "客户资料查看", value: true},
                        "ROLE_APPROVE_CLIENT": {description: "客户资料审核", value: true}
                    },
                    "商品": {
                        "ROLE_VIEW_GOODS": {description: "商品信息查看", value: true},
                        "ROLE_SALE_GOODS": {description: "商品上下架", value: true},
                        "ROLE_PRICE_GOODS": {description: "商品价格设定", value: true},
                        "ROLE_INVENTORY_GOODS": {description: "商品库存设定", value: true},
                        "ROLE_NEW_GOODS": {description: "商品新增、修改", value: true}
                    },
                    "订单": {
                        "ROLE_VIEW_PRICE": {description: "调价单查看", value: true},
                        "ROLE_APPROVE_PRICE": {description: "调价单审核", value: true},
                        "ROLE_VIEW_ORDER": {description: "订单查看", value: true},
                        "ROLE_VIEW_REJECT": {description: "拒收单查看 ", value: true},
                        "ROLE_VIEW_RETURN": {description: "退货单查看", value: true},
                        "ROLE_APPROVE_ORDER": {description: "订单审核", value: true},
                        "ROLE_APPROVE_RETURN": {description: "退货单审核", value: true},
                        "ROLE_SHIP_ORDER": {description: "订单发货确认", value: true},
                        "ROLE_RECEIVE_REJECT": {description: "拒收入库确认", value: true},
                        "ROLE_RECEIVE_RETURN": {description: "退货入库确认", value: true}
                    },
                    "门户": {
                        "ROLE_MANAGE_ADVERTISEMENT": {description: "广告管理", value: false},
                        "ROLE_MANAGE_NEWS": {description: "新闻管理", value: false},
                        "ROLE_MANAGE_SHOPWINDOW": {description: "橱窗管理", value: false},
                        "ROLE_MANAGE_FOOTER": {description: "页脚管理", value: false},
                    },
                    "设置": {
                        "ROLE_MANAGE_GOODSTYPE": {description: "商品类别管理", value: false},
                        "ROLE_MANAGE_INVENTORYDISPLAY": {description: "库存方案管理", value: false},
                        "ROLE_MANAGE_CLIENTCATEGORY": {description: "客户类管理", value: false},
                        "ROLE_MANAGE_BASIC_OPTION": {description: "单位,", value: false},
                        "ROLE_VIEW_LOG": {desciption: "查看日志", value: false}
                    }

                };
                var permissionRawData = __FEATUREGROUPS;
                var formatData = formatPermissionData(permissionRawData, operatorRoles);
                data.permissionData = formatData;
                callback(err, data);
            });
        },


        /**
         * list all operator for account manage
         * @param customerDB
         * @param callback
         */
        getAllOperators: function (customerDB, callback) {
            logger.enter();
            db.getAllOperator(customerDB, function (err, accounts) {
                callback(err, accounts);
            })
        },


        /**
         *  add operator Info
         * @param customerDBName
         * @param operatorInfo
         * @param callback
         */
        postAddOperatorInfo: function (customerDBName, operatorInfo, callback) {
            logger.enter();
            logger.debug(JSON.stringify(operatorInfo));

            hasher(operatorInfo.password).hash(function (err1, hashedPasswd) {
                if (err1) {
                    logger.error(err1);
                    callback("INTERNALERROR");
                } else {
                    operatorInfo.password = hashedPasswd;
                    db.insertOperatorInfo(customerDBName, operatorInfo, function (err, operatorId) {
                        if (err) {
                            if (err.code === "ER_DUP_ENTRY")
                                callback("ER_DUP_ENTRY");
                            else
                                callback("ADD_FAILUER");
                        } else {
                            callback(null, operatorId);
                        }

                    });
                }

            })
        }


    };

    function formatPermissionData(permissionData, operatorRoles) {
        var isDefault = underscore.isNull(operatorRoles) || underscore.isUndefined(operatorRoles);

        var renderPermissionData = [];
        var keys = Object.keys(permissionData);
        for (var index in keys) {
            var key = keys[index];
            var permissionItem = {
                key: key,
                subNodes: [],
                value: true
            };
            var subObj = permissionData[key];
            var subNodesKeys = Object.keys(subObj);
            for (var subIndex in subNodesKeys) {
                var subKey = subNodesKeys[subIndex];
                var status = isDefault ? subObj[subKey].value : underscore.contains(JSON.parse(operatorRoles), subKey);

                var subNode = {
                    key: subKey,
                    description: subObj[subKey].description,
                    value: status
                };
                /*subObj[subKey].value*/
                /*subObj[subKey].value*/
                if (permissionItem.value == true && status == false) {
                    permissionItem.value = false;
                }
                permissionItem.subNodes.push(subNode);
            }
            renderPermissionData.push(permissionItem);
        }
        return renderPermissionData;
    }

    return model;
};