var fgroups = {
    "帐号": {
        FP_VIEW_OPERATOR: {
            description: "帐号资料查看",
            value: false
        },
        FP_MANAGE_OPERATOR: {
            description: "帐号管理",
            value: false
        },
    },
    "客户": {
        FP_VIEW_CLIENT: {
            description: "客户资料查看",
            value: false
        },
        FP_APPROVE_CLIENT: {
            description: "客户资料审核",
            value: false
        },
    },
    "商品": {
        FP_VIEW_GOODS: {
            description: "商品信息查看",
            value: false
        },
        FP_SALE_GOODS: {
            description: "商品上下架",
            value: false
        },
        FP_PRICE_GOODS: {
            description: "商品价格设定",
            value: false
        },
        FP_INVENTORY_GOODS: {
            description: "商品库存设定",
            value: false
        },
        FP_NEW_GOODS: {
            description: "商品新增、修改",
            value: false
        },
    },
    "订单": {
        FP_VIEW_PRICE: {
            description:"调价单查看",
            value: false
        },
        FP_APPROVE_PRICE: {
            description: "调价单审核",
            value: false
        },
        FP_VIEW_ORDER: {
            description: "订单查看",
            value: false
        },
        FP_VIEW_REJECT: {
            description: "拒收单查看",
            value: false
        },
        FP_VIEW_RETURN: {
            description: "退货单查看",
            value: false
        },
        FP_APPROVE_ORDER: {
            description: "订单审核",
            value: false
        },
        FP_APPROVE_RETURN: {
            description: "退货单审核",
            value: false
        },
        FP_SHIP_ORDER: {
            description: "订单发货确认",
            value: false
        },
        FP_RECEIVE_REJECT: {
            description:"拒收入库确认",
            value: false
        },
        FP_RECEIVE_RETURN: {
            description: "退货入库确认",
            value: false
        },
        FP_CLOSE_ORDER:{
            description: "订单取消",
            value: false
        }
    },
    "门户": {
        FP_MANAGE_CAROUSEL: {
            description: "轮播图管理",
            value: false
        },
        FP_MANAGE_NEWS: {
            description: "新闻管理",
            value: false
        },
        FP_MANAGE_SHOPWINDOW: {
            description: "橱窗管理",
            value: false
        },
        FP_MANAGE_FOOTER: {
            description: "页脚管理",
            value: false
        },
    },
    "设置": {
        FP_MANAGE_GOODSTYPE: {
            description: "商品类别管理",
            value: false
        },
        FP_MANAGE_INVENTORYDISPLAY: {
            description: "库存方案管理",
            value: false
        },
        FP_MANAGE_GSP_OPTION: {
            description: "GSP管理",
            value: false
        },
        FP_MANAGE_CLIENTCATEGORY: {
            description: "客户类管理",
            value: false
        },
        FP_MANAGE_BASIC_OPTION: {
            description: "单位、剂型管理",
            value: false
        },
        FP_VIEW_LOG: {
            description:"查看日志",
            value: false
        },
        FP_MANAGE_PAYMENT: {
            description: "支付方式管理",
            value: false
        },
        FP_MANAGE_SMSGW: {
            description: "短信网关管理",
            value: false
        },
        FP_MANAGE_SCHEDULETASK: {
            description: "离线任务管理",
            value: false
        },
        FP_MANAGE_ERP: {
            description: "ERP接入管理",
            value: false
        }
    },
};

/**
 * 生成feature列表
 */
var underscore = require("underscore");
var featureKV = {};
var featureEnum = {};
var featureList = [];
for (var category in fgroups) {
    featureKV = underscore.extend(featureKV, fgroups[category]);
    featureList = underscore.extend(featureList, underscore.allKeys(fgroups[category]));
    for (var key in fgroups[category]) {
        featureEnum[key] = key.toString();
    }
}

module.exports.FEATURELIST = featureList;
module.exports.FEATUREENUM = featureEnum;
module.exports.FEATUREGROUPS = fgroups;