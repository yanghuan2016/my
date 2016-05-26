module.exports={

    /***
     * 登录页面验证
     */
    validateUserNameAndPwd:function(data){
        var feedback;
        if (data.username.trim() == '') {
            feedback = '请输入用户名';
        } else if (data.password.trim() == '') {
            feedback = '请输入密码';
        }
        return feedback;
    },
    /**
     * 判断字符是否为空
     */
    validateIsNULLOrEMPTY:function(data){
        if(data==''||data==null)
            return false;
        if($.trim(data)=='')
            return false;
        return true;
    },
    /**
     *判断IDCard是否合法
     */
    validateIDCard:function(data){
        var reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        return reg.test(reg);
    },
    validatePhoneNum:function(data){
        var phoneReg=/^1[3578]\d{9}$/;
        return phoneReg.test(data);

    },
    validateEmail:function(data){
        var emailRe = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRe.test(data);

    }

};