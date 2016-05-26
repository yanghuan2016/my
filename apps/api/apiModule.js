/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 * apiModule.js
 *
 */
var logger = __logService;

module.exports = function() {
    /**
     * Service
     */
    var logger = __logService;
    var underscore = require("underscore");
    /**
     *  modules
     */
    var querystring = require('querystring');

    //var erpToSccMsgType ={
    //    CLIENT_CREDIT_UPDATE　: 'CLIENT_CREDIT_UPDATE',  //将客户的授信资料通知给SCC，在审核订单成功、退货确认入库后发送本消息  商户customerERP
    //    INQUIRY_CREATE: 'INQUIRY_CREATE',             //商品询价接口
    //    QUOTATION_CREATED : 'QUOTATION_CREATED',         //ERP向SCC报价的接口
    //    SKU_NEW : 'SKU_NEW',                            //新品上架  商户customerERP
    //    SKU_INVENTORY_UPDATE : 'SKU_INVENTORY_UPDATE',  //更新商品库存、上下架  商户customerERP
    //    ORDER_CLOSE : 'ORDER_CLOSE',                    //关闭订单操作  商户customerERP
    //    PURCHASE_ORDER_CREATE : 'PURCHASE_ORDER_CREATE',                //订单审核操作  商户customerERP
    //    ORDER_CONFIRM : 'ORDER_CONFIRM',                //订单审核操作  商户customerERP
    //    ORDER_SHIP : 'ORDER_SHIP',                      //发货单发货操作 商户customerERP
    //    ORDER_SHIP_RECEIVE : 'ORDER_SHIP_RECEIVE',      //发货单收货操作 客户clientERP
    //    ORDER_SHIP_REJECT : 'ORDER_SHIP_REJECT',        //发起拒收单操作 客户clientERP
    //    ORDER_RETURN_NEW : 'ORDER_RETURN_NEW',          //申请退货      客户clientERP
    //    ORDER_RETURN_CONFIRM : 'ORDER_RETURN_CONFIRM',  //审核退货单操作 商户customerERP
    //    ORDER_RETURN_SHIP : 'ORDER_RETURN_SHIP',        //退货单发货    客户clientERP
    //    ORDER_RETURN_RECEIVE : 'ORDER_RETURN_RECEIVE',  //退货单入库    商户customerERP
    //    ORDER_REJECT_RECEIVE : 'ORDER_REJECT_RECEIVE'   //拒收单入库    商户customerERP
    //};

    //var sccToErpMsgType = {
    //    CLIENT_NEW : 'CLIENT_NEW',                          //SCC平台新客户批准启用通知
    //    CLIENT_UPDATE : 'CLIENT_UPDATE',                    //客户状态、资料发生变更通知
    //    SEND_QUOTATION: 'SEND_QUOTATION',                   //商品发出询价单接口
    //    SEND_QUOTATION_RESULT:'SEND_QUOTATION_RESULT',      //向ERP发出询价结果的接口
    //    SKU_STOCK_OUT : 'SKU_STOCK_OUT',                    //商品库存低于门限值
    //    ORDER_CREATED : 'ORDER_CREATED',                    //新订单通知
    //    ORDER_CLOSED : 'ORDER_CLOSED',                      //客户关闭订单通知
    //    ORDER_SHIPPED : 'ORDER_SHIPPED',                    //发货单发货通知
    //    ORDER_SHIP_RECEIVED : 'ORDER_SHIP_RECEIVED',        //发货单收货通知
    //    ORDER_SHIP_REJECTED : 'ORDER_SHIP_REJECTED',        //拒收单通知
    //    ORDER_RETURN_CREATED : 'ORDER_RETURN_CREATED',      //退货单申请通知
    //    ORDER_RETURN_CONFIRMED : 'ORDER_RETURN_CONFIRMED',  //退货单审核通知
    //    ORDER_RETURN_SHIPPED : 'ORDER_RETURN_SHIPPED',      //退货单发货通知
    //    ORDER_RETURN_RECEIVED : 'ORDER_RETURN_RECEIVED',    //退货单入库通知
    //    ORDER_REJECT_RECEIVED : 'ORDER_REJECT_RECEIVED'     //拒收单入库通知
    //};

    var apiModule = {
    };
    apiModule = underscore.extend(apiModule, require(__dirname + "/modules/client.js")());
    apiModule = underscore.extend(apiModule, require(__dirname + "/modules/order.js")());
    apiModule = underscore.extend(apiModule, require(__dirname + "/modules/goods.js")());
    apiModule = underscore.extend(apiModule, require(__dirname + "/modules/edi.js")());
    return apiModule;
};