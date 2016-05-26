var keyMirror = require('keymirror');

module.exports = keyMirror({

    LOGIN_SUCCESS: null,        //登录成功
    VALIDATE_ERROR: null,        //验证失败
    CLEAR_MSG: null,        //清除用的错误信息
    GET_PATIENT_LIST: null,    //获取患者列表
    FILTER_PATIENT: null,       //过滤患者列表
    GET_CURRENT_PATIENT_DIAGNOSIS_INFO_SUCCESS: null,    //获取该病人当前选择的诊断单的信息
    ADD_RECIPEONE: null,    //增加一条药品
    DELETE_ONE_RECIPEONE: null,    //删除一条药品
    SET_TAKE_METHODS: null,    //设置一条药品的用法用量
    GET_RECIPTDETAIL: null,    //处方单详情
    CLEAR_RECIPR_LIST: null,    //清空处方列表
    SAVE_RECIPR_LIST: null,    //保存处方列表
    SEARCH_PRODUCT_SUCCESS: null,    //搜索商品信息成功
    SHOW_MEDICINE_PAPER: null,    //显示引导单
    GET_QRCODE: null,       //获取二维码url

    GETRECIPE_INFO:null,         //微信获取患者和处方信息页
    PICKUP_INFO:null,             //到店自提详情
    SUBMIT_ADDRESS:null,             //选择省份信息,获取城市信息
    GET_ORDERINFO:null,          //根据处方单获取商品信息 发送到要配送
    UPDATE_PRESCRIPTION_STATUS:null //修改处方单的状态 是货到付款 还是自提
});
