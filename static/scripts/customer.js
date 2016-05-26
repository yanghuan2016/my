$(function () {


    //$(document).delegate('.updateAccount', 'click', function(){
    //    var data = {};
    //    var updateData = {};
    //    var target = $(this).attr("target");
    //    var operatorId = $(this).attr("operatorId");
    //    if(target == "details"){
    //        var username = $('#username').val();
    //        var password = $('#password').val();
    //        var mobileNum = $('#mobileNum').val();
    //        var operatorName = $('#operatorName').val();
    //        var department = $('#department').val();
    //        if(username == "" || password == "" || operatorName == ""){
    //            artDialogAlertModal("账号密码与姓名不能输入空数据,请仔细检查再提交!");
    //            return;
    //        }
    //        updateData.username = username;
    //        updateData.mobileNum = mobileNum;
    //        updateData.password = password;
    //        updateData.operatorName = operatorName;
    //        updateData.department = department;
    //    }else{
    //        if(target == "enable"){
    //            updateData.enable = 1;
    //        }
    //        if(target == "disable"){
    //            updateData.enable = 0;
    //        }
    //    }
    //    data.operatorId = operatorId;
    //    data.updateData = updateData;
    //    $.ajax({
    //        data: data,
    //        url: "/customer/account/edit",
    //        type: 'post',
    //        dataType: 'json',
    //        cache: false,
    //        timeout: 5000,
    //        success: function (feedback) {
    //            if (feedback.status == 200 && feedback.data != undefined) {
    //                artDialogAlertModal(feedback.msg, function () {
    //                    window.location.href = "/customer/account";
    //                });
    //            } else {
    //                artDialogAlertModal(feedback.msg);
    //            }
    //        },
    //        error: function (jqXHR, textStatus, errorThrown) {
    //            artDialogAlertModal('error ' + textStatus + " " + errorThrown);
    //        }
    //    });
    //});
    //customer changePwd
    $(document).delegate('.confirmChangePwd', 'click', function () {
        var data = {};
        var originPwd = $.trim($('.originPwd').val());
        var newPwd = $.trim($('.newPwd').val());
        var newPwd2 = $.trim($('.newPwd2').val());
        var regPassword=/^[a-zA-Z0-9_]{6,16}$/;
        if(!regPassword.test(newPwd)){
            artDialogAlertModal("密码由数字字母下划线组成,长度6-16个字符.",function(){
                $('.newPwd').focus();
            });
            return;
        }
        if(newPwd !=newPwd2){
            artDialogAlertModal("两次输入新密码不一致，请重新输入");
            return;
        }
        if(originPwd == "" || newPwd == "" || newPwd2 == ""){
            artDialogAlertModal("不能输入空数据,请仔细检查再提交!");
            return;
        }
        //base64 for password
        data.password = $.base64.encode(originPwd);
        data.passwordnew = $.base64.encode(newPwd);
        $.ajax({
            data: data,
            url: "/customer/password/modify",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == 200 && feedback.data != undefined) {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = "/customer";
                    });
                } else {
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });

    $(document).delegate('.cancelChangePwd', 'click', function () {
        window.location.href = "/customer"
    });

    $('.search_products').click(function () {
        var self = $(this);
        var url = JSON.parse(self.attr('data-url'));
        var keywords = self.prev().val();
        if(keywords) {
            var strb = url.kbv || "";
            url.kbv = strb.replace(/keywordsValueToBeReplaced/, keywords);
            var stra = url.kav || "";
            url.kav = stra.replace(/keywordsValueToBeReplaced/, keywords);
            var str = url.kv || "";
            url.kv = str.replace(/keywordsValueToBeReplaced/, keywords);
            joinPaginator(url);
            return false;
        }else if(keywords==null|| $.trim(keywords)==''){
            window.location.href='/customer/product?highlight=product';
            return false;
        }
        else{
            return false;
        }
    });

    $(document).delegate(".chckproductAll", 'click', function () {
        var chkAll = $(this);
        if (chkAll.hasClass('checked')) {
            $(".icheckbox").removeClass('checked');
            var obj1 = document.getElementsByName("chkProduct");
            for (var k1 = 0; k1 < obj1.length; k1++) {
                obj1[k1].checked = false;
            }
            chkAll.removeClass('checked');
        } else {
            $(".icheckbox").addClass('checked');
            chkAll.addClass('checked');
            var obj = document.getElementsByName("chkProduct");
            for (var k = 0; k < obj.length; k++) {
                obj[k].checked = true;
            }
        }
    });





    $(document).delegate(".checkManagementAll", 'click', function () {
        var chkAll = $(this);
        if (chkAll.hasClass('checked')) {
            $(".icheckbox").removeClass('checked');
            var obj1 = document.getElementsByName("chkmanagement");
            for (var k1 = 0; k1 < obj1.length; k1++) {
                obj1[k1].checked = false;
            }
            chkAll.removeClass('checked');
        } else {
            $(".icheckbox").addClass('checked');
            var obj = document.getElementsByName("chkmanagement");
            for (var k = 0; k < obj.length; k++) {
                obj[k].checked = true;
            }
            chkAll.addClass('checked');
        }
    });

    $("#closeupload").click(function () {
        $("#uploadfile").css('display', 'none');
    });

    $(document).delegate('#opener', 'click', function () {
        var test = $("#uploadfile")[0].innerHTML;
        var d = dialog({
            id: 'upModule',
            title: '文件上传',
            content: test

        }).width(500).height(100);
        d.showModal();
    });

    $(document).delegate('#btnCancelUpload', 'click', function () {
        dialog.get('upModule').close().remove();
    });
});
