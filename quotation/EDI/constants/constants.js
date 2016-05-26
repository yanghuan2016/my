var keyMirror = require('keymirror');

module.exports = keyMirror({

    VALIDATE: null,             //验证
    LOGIN_SUCCESS: null,        //登录成功
    LOGIN_ERROR: null,          //登录失败

    INIT_DB: null,          //初始化数据库
    INITIAL_DB_ACTION: null,  //正在初始化数据库
    GET_INIT_DB_PERCENT: null,          //获取初始化数据库的百分比
    INITIAL_DB_CLEAR: null,          //清除数据
    SWITCHTYPE: null, //切换用户的类型
    SWITCHLEFTACTIVE: null, //切换类型
    CHANGE_MSG: null, //修改提示消息
    SETTINGSUCCESS: null, //erp设置成功
    BT_STATUS_CHANGE: null,  //erp切换按钮的样式
    UPDATE_PERCENT: null, //更新初始化数据库的百分比
    DISPLAY_ERPMODAL: null, //显示erp设置的框框

    HOME_INFO: null,         //获取首页信息
    SET_NOTIFICATION: null,         //notification统一管理

    //erpSetting
    GET_APPKEY: null,   //获取APPKEY
    SYNC_APPKEY_SUCCESS:null,     //同步appKey成功
    GET_ERPDATA: null,    //获取初始数据
    OPEN_ERP_WINDOW: null,     //erp弹窗
    CLOSE_ERP_WINDOW: null,     //关闭erp弹窗
    KEEP_LOADING: null,    //同步数据开启进行中的效果
    STOP_LOADING: null,    //同步数据关闭进行中的效果
    LAST_TIME: null,    //获取上一次同步的时间
    LOADING_BT_CHANGE: null,     //改变同步数据按钮状态

    ORDER_LIST: null,           //获取订单管理列表数据
    ORDER_DETAIL: null,          //获取订单管理详情页数据

    INQUIRY_LIST: null,           //获取询价单管理列表数据
    QUOTATION_LIST: null,           //获取报价单管理列表数据
    QUOTATION_DETAIL: null,          //获取报价单管理详情页数据

    INQUIRY_SELLER_LIST: null,           //获取seller询价单管理列表数据
    QUOTATION_SELLER_LIST: null,           //获取seller报价单管理列表数据
    QUOTATION_SELLER_DETAIL: null,          //获取seller报价单管理详情页数据

    SHIP_LIST: null,              //获取出库单列表数据
    SHIP_DETAIL: null,             //获取出库单detail

    ORDER_SELLER_LIST: null,           //获取seller订单管理列表数据
    ORDER_SELLER_DETAIL: null,          //获取seller订单管理详情页数据

    SHIP_SELLER_LIST: null,              //获取seller出库单列表数据
    SHIP_SELLER_DETAIL: null,             //获取seller出库单detail

    RETURN_LIST: null,           //获取退货列表数据
    RETURN_DETAIL: null,          //获取退货管理详情页数据
    RETURN_BATCH: null,           //获取buyer退货批次信息

    SHIP_BATCH_LIST: null,          //批量获取批次号

    RETURN_SELLER_LIST: null,           //获取seller退货列表数据
    RETURN_SELLER_DETAIL: null,          //获取seller退货管理详情页数据
    RETURN_SELLER_BATCH: null,          //获取seller退货批次信息

    GET_PRODUCT_LIST_SUCCESS: null,   //匹配商品获取商品列表成功
    GET_PRODUCT_LIST_ERROR: null,   //匹配商品获取商品列表失败

    GET_PRODUCT_LIST_FROM_CLOUDS_SUCCESS: null,   //匹配云端商品获取商品列表成功
    GET_PRODUCT_LIST_FROM_CLOUDS_ERROR: null,   //匹配云端商品获取商品列表失败

    REPLY_INQUIRY_ERROR: null,    //提交报价失败

    GET_CLIENT_LIST_SUCCESS: null,  //获取客户列表成功
    GET_SUPPLIER_LIST_SUCCESS: null  //获取供应商列表成功

});
