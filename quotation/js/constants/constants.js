var keyMirror = require('keymirror');

module.exports = keyMirror({
    TODO_LOGIN: null,

    TODO_GETALL_INQUIRY: null, //获取所有数据inquiryList
    TODO_GETALL_QUOTATION: null, //获取所有数据quotationList
    TODO_QUTATIONTYPE: null, // 修改
    TODO_QUOTATIONDETAIL: null,
    TODO_queryQuationSuccess: null,
    TODO_queryQuationFiled: null,

    LOGIN_SUCCESS: null, //登录成功

    TODO_GETUSERINFO: null,   //获取用户的信息
    userUpdateName: null,  //更新用户名
    userUpdatePwd: null,  //更新密码
    updateIdCard: null,  //更新身份证号
    updatePhoneNumber: null,  //用户更新电话号码
    updateEmail: null,  //用户更新电子邮箱
    validateUserOldPwd: null, //验证旧密码
    validateUserNewPwd: null, //验证密码格式
    validateUserReNewPwd: null //验证密码格式

});
