$(function(){

    //父节点的点击事件
    $(document).delegate('.parentNodePermission','click',function(){
            var self=$(this);
            var currentITag=self.find('i');
            if(currentITag.hasClass('fa-check-square-o')){
                currentITag.removeClass('fa-check-square-o').addClass('fa-square-o');
                self.closest('div').next().find('i').each(function(index,item){
                    var curObj=$(item);
                    curObj.removeClass('fa-check-square-o').addClass('fa-square-o');
                    $(this).parent().removeClass('permissionchecked');
                })

            }else{
                currentITag.removeClass('fa-square-o').addClass('fa-check-square-o');
                self.closest('div').next().find('i').each(function(index,item){
                    var curObj=$(item);
                    curObj.removeClass('fa-square-o').addClass('fa-check-square-o');
                    $(this).parent().addClass('permissionchecked');
                })
            }
    });

    //子节点的点击事件
    $(document).delegate('.subNodePermission','click',function(){
        var self=$(this);
        var currentITag=self.find('i');
        if(currentITag.hasClass('fa-check-square-o')){
            self.removeClass('permissionchecked');
            currentITag.removeClass('fa-check-square-o').addClass('fa-square-o');
        }else{
            self.addClass('permissionchecked');
            currentITag.removeClass('fa-square-o').addClass('fa-check-square-o');
        }
    });



    //添加角色事件
    $(document).delegate('.addRole','click',function(){
    });

    //选择启用未启用
    $(document).delegate('.status-on,.status-off','click',function(){



        var self=$(this);
        if(self.hasClass('status-on')&&!self.find('i').hasClass('fa-check-square-o')){
            self.find('i').removeClass('fa-square-o').addClass('fa-check-square-o');
            self.next().find('i').addClass('fa-square-o').removeClass('fa-check-square-o');
            self.parent('.statusGroup').attr('ifOn', 1);
        }else if(self.hasClass('status-off')&&!self.find('i').hasClass('fa-check-square-o')){
            self.find('i').removeClass('fa-square-o').addClass('fa-check-square-o');
            self.prev().find('i').addClass('fa-square-o').removeClass('fa-check-square-o');
            self.parent('.statusGroup').attr('ifOn', 0);
        }

    });







    /**
     * 保存修改（add or modify）
     */
    $(document).delegate('.updateAccount', 'click', updateAccount);
    function updateAccount(){
        //isAdd：修改or添加的标志
        var isAdd = ($(this).attr('operatorId') == "null");
        var data = {};
        var updateData = {};
        var target = $(this).attr("target");
        var operatorId = $(this).attr("operatorId");
        if(target == "details"){
            var username = $('#username').val();
            var password = $('#passWord').val();
            var passwords = $('#passWords').val();
            var mobileNum = $('#mobileNum').val();
            var operatorName = $('#operatorName').val();
            var department = $('#department').val();
            var ifOn = $('.statusGroup').attr('ifOn');
            updateData.operatorRoles=[];
            $('.permissionchecked').each(function(){
                    var datakey=$(this).attr('data-key');

                    updateData.operatorRoles.push(datakey);
                });
            if(username == "" || password == "" || operatorName == ""||mobileNum== ""){
                artDialogAlertModal("账号密码姓名与联系电话不能输入空数据,请仔细检查再提交!");
                return;
            }
            var regPassword=/^[a-zA-Z0-9_]{6,16}$/;
            if((passwords!==password)|| !regPassword.test(password)){
                artDialogAlertModal("两次输入密码不一致或密码格式不正确,请重新确认！");
                return;
            }
            if($(this).attr("operatorId") == 'null'){
                if(username.length < 6||username.length > 16){
                    artDialogAlertModal("登陆账号不满足要求,请重新输入！");
                    return;
                }
            }
            //校验手机号
            var phoneNumber = $('#mobileNum').val().trim();
            var phoneReg=/^1[3578]\d{9}$/;
            if(!phoneReg.test(phoneNumber)){
                artDialogAlertModal('电话号码格式不正确',function(){
                    $('#phoneNumber').focus();
                });
                return;
            }

            updateData.operatorRoles = "[" +'"'+ updateData.operatorRoles.join('","') +'"'+ "]";
            updateData.username = username;
            updateData.mobileNum = mobileNum;
            updateData.password = password;
            updateData.operatorName = operatorName;
            updateData.department = department;
            updateData.enable=ifOn;
        }

        data.operatorId = operatorId;
        data.updateData = updateData;

        if(isAdd) {
            $.ajax({
                data: data,
                url: "/customer/account/add",
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == 200 && feedback.data != undefined) {
                        artDialogAlertModal(feedback.msg, function () {
                            window.location.href = "/customer/account";
                        });
                    } else {
                        artDialogAlertModal(feedback.msg);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }
            });

        }else{
            $.ajax({
                data: data,
                url: "/customer/account/edit",
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == 200 && feedback.data != undefined) {
                        artDialogAlertModal(feedback.msg, function () {
                            window.location.href = "/customer/account";
                        });
                    } else {
                        artDialogAlertModal(feedback.msg);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }
            });
        }
    }

});
function checkPassword(context){
    var _this=context;
    var currentValue=$(_this).val();
    var regPassword=/^[a-zA-Z0-9_]{6,16}$/;
    if(!regPassword.test(currentValue)){
        $(_this).next().css('color','red');
    }
    else{
        $(_this).next().css('color','green');
    }
}
function checkRePassword(context){
    var _this=context;
    var currentValue=$(_this).val().trim();
    var passVal= $.trim($('.loginPassword').val());
    // color:#
    var regPassword=/^[a-zA-Z0-9_]{6,16}$/;
    if(regPassword.test(passVal)){
        if(passVal!=currentValue){
            $('#reConfirmPassTip').css('display','inline').css('color','red').html('两次密码不一致');
            return;
        }else{
            $('#reConfirmPassTip').css('display','none').css('color','#A29E9E').html('数字字母下划线组成,6-16个字符');
        }
    }
    else{
        $('#reConfirmPassTip').css('display','inline').css('color','red').html('数字字母下划线组成,6-16个字符');
    }
}

function checkAccountRepeat(context){
    var _this=context;
    var regName=/^[a-zA-Z0-9_]{6,16}$/;
    var val=$(_this).val().trim();
    if(!regName.test(val)){
        $('#regAccount').css('color','red').css('display','inline');
        $('#accountTip').css('display','none');
        $('#repeatAccountTip').css('display','none');
    }
    else{
        $('#regAccount').css('color','green').css('display','inline');
        $('#accountTip').css('display','none');
        $('#repeatAccountTip').css('display','none');
    }


}