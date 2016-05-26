var url = 'http://romenscd.cn:6002';
module.exports = {

    login: {
        loginInUrl: url + '/edi/v1/authentication',
        //validateLogInUrl: url + '/validateLogIn',   //验证登录
        validateUserPwd: url + '/customer/quotation/validateUserOldPwd',  //验证用户输入的旧密码是否正确,
        updatePwd: url + '/customer/quotation/updatePwd',  //用户更新密码

        updateName: url + '/customer/quotation/updateBasicInfo',  //用户更新用户名
        updatePhoneNumber: url + '/customer/quotation/updateBasicInfo',  //用户更新电话号码
        updateIdCard: url + '/customer/quotation/updateBasicInfo',  //用户更新身份证号
        updateEmail: url + '/customer/quotation/updateBasicInfo'  //用户更新电子邮箱
    },
    quotationList: {
        getAllUrl: url + '/edi/v1/seller/enterpriseId/inquirySheets',
        getInquiryDetailUrl: url + '/edi/v1/seller/enterpriseId/inquiryDetails',
        getQuotationDetailUrl: url + '/edi/v1/seller/enterpriseId/quotationDetails',
        updateQuationPriceAndNumUrl: url + '/edi/v1/seller/enterpriseId/quotation',
        queryQuationUrl: url + '/customer/quotation/queryQuation',
        getInquiryList: url + '/edi/v1/seller/enterpriseId/quotationSheets'
    }
};



