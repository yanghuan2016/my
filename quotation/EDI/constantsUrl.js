/**
 * constantsUrl
 * @constructor
 */
function Constant() {

    var PROTOCOL = 'http://';
    var PORT = '3300';
    var HOST = '127.0.0.1';

    var http_header = PROTOCOL + HOST + ':' + PORT;

    return {

        headUrl: http_header,

        setSocketUrl: http_header + '/edi/v1/authentication/socket',

        loginUrl: http_header + '/edi/v1/authentication',

        initDbUrl: http_header + '/edi/v1/authentication/db/init', //初始化数据库
        getInitDbPercentUrl: http_header + '/edi/v1/authentication/db/businessLicense/status', //获取初始化数据库的百分比

        logoutUrl: http_header + '/edi/v1/authentication',

        createAppKeyUrl: http_header + '/edi/v1/erpConfig/enterpriseId/appKey',  //生成appkey
        syncAppKeyUrl: http_header + '/edi/v1/updateAppkey/enterpriseId',  //同步appkey

        erpSubmitSettingUrl: http_header + '/edi/v1/erpConfig/enterpriseId',  //保存erp设置
        testingErpSettingUrl: http_header + '/edi/v1/erpConfig/enterpriseId/connection',  //test erp 是否链接
        erpAsyncUrl: http_header + '/edi/v1/erpAsync/enterpriseId',  //test erp 是否链接
        getErpDataPercentUrl: http_header + '/edi/v1/erpAsync/enterpriseId/status',   //获取数据库实时状态
        getSyncTimeUrl: http_header + '/edi/v1/erpSettingHistory/enterpriseId',   //获取上一次同步数据完成的时间
        getHomeUrl: http_header + '/edi/v1/enterpriseType/home/enterpriseId',   //获取上一次同步数据完成的时间

        getClientListUrl: http_header + '/edi/v1/seller/client/enterpriseId',  //获取我的客户列表
        getSupplierListUrl: http_header + '/edi/v1/buyer/supplier/enterpriseId',  //获取我的供应商列表

        buyer: {
            orderListUrl: http_header + '/edi/v1/buyer/enterpriseId/orders',
            orderDetailUrl: http_header + '/edi/v1/buyer/enterpriseId/order',
            inquiryListUrl: http_header + '/edi/v1/buyer/enterpriseId/inquirySheets',
            inquiryDetailUrl: http_header + '/edi/v1/buyer/enterpriseId/inquiryDetails',
            quotationListUrl: http_header + '/edi/v1/buyer/enterpriseId/quotationSheets',
            quotationDetailUrl: http_header + '/edi/v1/buyer/enterpriseId/quotationDetails',
            shipListUrl: http_header + '/edi/v1/buyer/enterpriseId/orderShips',
            shipDetailUrl: http_header + '/edi/v1/buyer/enterpriseId/orderShip',
            returnListUrl: http_header + '/edi/v1/buyer/enterpriseId/orderShipReturns',
            returnDetailUrl: http_header + '/edi/v1/buyer/enterpriseId/orderShipReturn',

            getProductListUrl: http_header + '/',    //匹配商品获取我的商品列表
            getProductListFromCloudsUrl: http_header + '/'    //匹配商品获取云端商品列表
        },

        seller: {
            orderListUrl: http_header + '/edi/v1/seller/enterpriseId/orders',
            orderDetailUrl: http_header + '/edi/v1/seller/enterpriseId/order',
            inquiryListUrl: http_header + '/edi/v1/seller/enterpriseId/inquirySheets',
            quotationListUrl: http_header + '/edi/v1/seller/enterpriseId/quotationSheets',
            inquiryDetailUrl: http_header + '/edi/v1/seller/enterpriseId/inquiryDetails',
            quotationDetailUrl: http_header + '/edi/v1/seller/enterpriseId/quotationDetails',
            returnListUrl: http_header + '/edi/v1/seller/enterpriseId/orderShipReturns',
            returnDetailUrl: http_header + '/edi/v1/seller/enterpriseId/orderShipReturn',
            replyInquiryUrl: http_header + '/edi/v1/seller/enterpriseId/quotation',
            shipListUrl: http_header + '/edi/v1/seller/enterpriseId/orderShips',
            shipDetailUrl: http_header + '/edi/v1/seller/enterpriseId/orderShip'
        }
    };
}

module.exports = Constant;
