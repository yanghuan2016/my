$(function(){

        var allInput=$('.loginContainer').find('input');
        var newInput=allInput.slice(0,allInput.length-1);
        $('#username').focus();
        //when index is the length of newInput , focus has runs out from inputs,it should trigger submit button's submit event
        var lastEnterIndex=newInput.length;
        var $inp = $('input');
        $inp.bind('keydown',function(e){
                var key = e.which;
                if (key == 13) {
                        e.preventDefault();
                        var nxtIdx = newInput.index(this) + 1;
                        if(nxtIdx==lastEnterIndex){
                                $('#login').trigger('click');
                                return;
                        }
                        newInput[nxtIdx].focus();
                }
        });
        $(document).delegate('#login','click',function(){
                //var currentHref=window.location.href;
                var nextTo=loadPageVar('nextTo');
                var usernameSelect = $("#username");
                var passwordSelect = $("#password");
                var captchaSelect = $("#captcha");
                var loginTipSelect = $("#loginTip");
                var username= $.trim(usernameSelect.val());
                var password= $.trim(passwordSelect.val());
                var captcha= $.trim(captchaSelect.val());
                if(username==""){
                        loginTipSelect.html("请输入登陆账号");
                        usernameSelect.focus();
                        return;
                }
                if(password==""){
                        loginTipSelect.html("请输入密码");
                        passwordSelect.focus();
                        return;
                }
                if(captcha==""){
                        loginTipSelect.html("请输入验证码");
                        captchaSelect.focus();
                        return;
                }
                var CaptchaTips=$.trim(loginTipSelect.html());
                if(CaptchaTips=='验证码错误'){
                        captchaSelect.focus();
                        return;
                }
                if(CaptchaTips!=''&&CaptchaTips!='验证码错误'){
                        loginTipSelect.html("请输入验证码");
                        captchaSelect.focus();
                        return;
                }
                //base64 for password
                var base64Pwd = $.base64.encode(password);

                var postData={
                  username:username,
                  password:base64Pwd,
                  captcha:captcha,
                  nextTo:$('#nextToValue').val()
                };
                $.ajax({
                        type:'post',
                        data:postData,
                        url:'/login',
                        success:function(feedback){
                                if(feedback.status==1002){
                                        loginTipSelect.html(feedback.msg);
                                        captchaSelect.focus();
                                        $('#reloadCaptcha').trigger('click');
                                }else if(feedback.status==1003){
                                        loginTipSelect.html(feedback.msg);
                                        passwordSelect.focus();
                                        $('#reloadCaptcha').trigger('click');
                                }
                                else if(feedback.status==1004){
                                        loginTipSelect.html(feedback.msg);
                                        usernameSelect.focus();
                                        $('#reloadCaptcha').trigger('click');
                                }
                                else if(feedback.status==200){
                                        window.location.href=decodeURIComponent(feedback.data.nextTo);
                                }else if(feedback.status=1007){
                                        loginTipSelect.html(feedback.msg);
                                        $('#reloadCaptcha').trigger('click');
                                        captchaSelect.focus();
                                }else{
                                        loginTipSelect.html(feedback.msg);
                                        $('#reloadCaptcha').trigger('click');
                                        captchaSelect.focus();
                                }
                        },
                        error: function(XMLHttpRequest, textStatus, errorThrown) {
                                artDialogAlertModal(textStatus+":"+errorThrown);
                         }
                })
        })
});

function checkCaptcha(context,e){
        var event=e||window.event;
        var key = event.which;
        if (key == 13) {
                return;
        }
        var captcha= $.trim($(context).val());
        var reg=/^[a-zA-Z0-9]{4}$/;
        if(!reg.test(captcha)){
                $('#loginTip').html('验证码错误');
                //$('#captcha').focus();
                return;
        }
        $.ajax({
                type:'post',
                url:'/login',
                data:{
                        captchaCode: $.trim($('#captcha').val())
                },
                success:function(feedback){
                        if(feedback.status==1002){
                                $('#loginTip').html(feedback.msg);
                                $('#captcha').focus();
                        }else if(feedback.status==200){
                                $('#loginTip').html('');
                        }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                        artDialogAlertModal(textStatus+":"+errorThrown);
                }
        })


}




