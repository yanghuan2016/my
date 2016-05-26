$(function(){

    $(document).delegate('.icheckbox', 'click', function () {
        var self = $(this);
        self.find("ins").remove();
        self.toggleClass('checked');
    });
    $("ins").remove();
    var REGISTERINFO={};
    var CLIENTGSPTYPES=[];
    //显示遮罩层
    var width=document.body.clientWidth
        ||document.documentElement.clientWidth ||window.innerWidth;
    var height=
        document.body.clientHeight
        ||document.documentElement.clientHeight ||window.innerHeight;
    var agreementSelect = $("#agreement");
    agreementSelect.css({
        zIndex:2000,
        position: 'absolute',
        left: (width - agreementSelect.width()) / 2 + document.body.scrollLeft,
        top:(height-agreementSelect.height())/2+document.body.scrollTop-100,
        display:'block'
    });


    $(document).delegate('#submitBasicInfo','click',function(){
        //todo 电话号码 正则表达式

        var regPassword=/^[a-zA-Z0-9_]{6,16}$/;
        //todo 验证数据合法性
        var name=$('#accountName').val();
        var loginAccountSelect = $("#loginAccount");
        var account=loginAccountSelect.val();
        var password=$('#loginPassword').val();
        var rePassword=$('#reInputPassword').val();
        var phoneNumber=$('#phoneNumber').val();


        var LegalRepresentative=$('#LegalRepresentative').val();
        var registeredCapital=$('#registeredCapital').val();
        var address=$('#address').val();



        // 数据验证
       if(ValidateNullOrEmpty(name)){
           artDialogAlertModal('请填写企业名称',function(){
               $('#accountName').focus();
           });
            return;
        }
        if(ValidateNullOrEmpty(account)){
            artDialogAlertModal('请填写登陆账号',function(){
                loginAccountSelect.focus();
            });
            return;
        }
        var loginAccountReg=/^[a-zA-Z0-9_]{6,16}$/;
        if(!loginAccountReg.test(account)){
            artDialogAlertModal('登陆账号只能是字母数字下划线的组合,并且长度6-16位,请确定',function(){
                loginAccountSelect.focus();
            });
            return;
        }
        if(ValidateNullOrEmpty(password)){
            artDialogAlertModal('请输入密码',function(){
                $('#loginPassword').focus();
            });
            return;
        }else{
            if(!regPassword.test(password)){
                var loginPasswordSelect = $("#loginPassword");
                loginPasswordSelect.focus();
                loginPasswordSelect.next().css('color','red');
                return;
            }
        }
        if(ValidateNullOrEmpty(rePassword)){
            artDialogAlertModal('请再次输入密码',function(){
                $('#reInputPassword').focus();
            });
            return;
        }
        if($.trim(password)!= $.trim(rePassword)){
            artDialogAlertModal('两次密码输入不一致,请确认',function(){
                $('#reInputPassword').focus();
            });
            return;
        }
        if(ValidateNullOrEmpty(phoneNumber)){
            artDialogAlertModal('请填写电话号码',function(){
                $('#phoneNumber').focus();
            });
            return;
        }

        var phoneReg=/^1[3578]\d{9}$/;
        if(!phoneReg.test(phoneNumber)){
            artDialogAlertModal('电话号码格式不正确',function(){
                $('#phoneNumber').focus();
            });
            return;
        }
        var isRepeatAccont=$('#repeatAccountTip').css('display');
        if(isRepeatAccont!="none"){
            loginAccountSelect.focus();
            return;
        }
        //验证法人代表
        if($.trim(LegalRepresentative)==""){
            artDialogAlertModal('请填写法人代表',function(){
                $('#LegalRepresentative').focus();
            });
            return;
        }

        var captchaSelect = $("#captcha");
        var captchaTipSelect = $("#captchaTip");
        if($.trim(captchaSelect.val())==""){
            captchaTipSelect.html('请输入验证码').css('color','red');
            captchaSelect.focus();
            return;
        }
        if($.trim(captchaTipSelect.html())!='验证码正确'){
            captchaSelect.focus();
            return;
        }

        //注册页面签订协议处
        if($("#ckboxdeal>div").hasClass('checked')){
        }
        else{
            artDialogAlertModal('请接受神木医药网服务协议',function(){});
            return;
        }

    var data={};
        data.basicInfo={
            name: name,
            loginAcctount:account,
            password:$.base64.encode(password),
            confirmPassword:$.base64.encode(rePassword),
            phoneNumber:phoneNumber,
            legalReprent:LegalRepresentative,
            registeredCapital:registeredCapital,
            address:address
        };


        REGISTERINFO.basicInfo=data.basicInfo;


        //改变导航条的样式
        var navigation1Select = $("#navigation1");
        var navigation2Select = $("#navigation2");
        navigation1Select.find('div').eq(0).attr('class','stepOneTextFocus');
        navigation1Select.find('div').eq(1).attr('class','rightPartFocus');

        navigation2Select.find('div').eq(0).attr('class','leftPart');
        navigation2Select.find('div').eq(1).attr('class','stepOneText');
        navigation2Select.find('div').eq(2).attr('class','rightPart');


        $('#basicInfo').css('display','none');

        $('#gspInfo').css('display','block');

    });

    $(document).delegate('#addMoreAccessory','click',function(){
        var self=$(this);
        var td=$('#uploadTd');
        var lastUploadContent=td.find('.uploadContent').last();

        var id=lastUploadContent.attr('id');

        var numberId=id.substr(id.indexOf('m')+1,id.length); //uploadForm1
        var newdivId='uploadForm'+(Number(numberId)+1);

        var formTarget=lastUploadContent.find('form').attr('target');
        var newFormTarget='picture' +(Number(formTarget.substr(formTarget.indexOf('e')+1,formTarget.length))+1);

        var cloneElement=lastUploadContent.clone(true);
        cloneElement.find('.uploadFileTips').html('其他附件');
        cloneElement.attr('id',newdivId).find('form').attr('target',newFormTarget);
        cloneElement.find('iframe').attr('id', newFormTarget).attr('name',newFormTarget);
        self.closest('div').before(cloneElement);

    });

    $(document).delegate('#submitGspInfo','click',function(){
        //todo 验证数据
        //必填：businessLicense businessLicenseEndDate GMPandGSPcertificate GMPandGSPcertificateEndDate
        var businessLicenseSelect = $("#businessLicense");
        if(ValidateNullOrEmpty(businessLicenseSelect.val())){
            artDialogAlertModal('请填写营业执照号',function(){
                businessLicenseSelect.focus();
            });
            return;
        }
        var businessLicenseEndDateSelect = $("#businessLicenseEndDate");
        if(ValidateNullOrEmpty(businessLicenseEndDateSelect.val())){
            artDialogAlertModal('请填写营业执照有效期限',function(){
                businessLicenseEndDateSelect.focus();
            });
            return;
        }
        var GMPandGSPcertificateEndDateSelect = $("#GMPandGSPcertificateEndDate");
        if(ValidateNullOrEmpty(GMPandGSPcertificateEndDateSelect.val())){
            artDialogAlertModal('请填写GMP/GSP证书有效期限',function(){
                GMPandGSPcertificateEndDateSelect.focus();
            });
            return;
        }
        var GMPandGSPcertificateSelect = $("#GMPandGSPcertificate");
        if(ValidateNullOrEmpty(GMPandGSPcertificateSelect.val())){
            artDialogAlertModal('请填写GMP/GSP证书号',function(){
                $('#GMPandGSPcertificate').val().focus();
            });
            return;
        }
        if(ValidateNullOrEmpty(CLIENTGSPTYPES)){
            artDialogAlertModal('请至少选择一个GSP控制类型',function(){
            });
            return;
        }

        var isValidUpload=false;
        //validate the attachment user have to upload
        var iframeSelect = $("iframe");
        iframeSelect.each(function(){
             var currentIndex=iframeSelect.index($(this));
             if(currentIndex>=4){
                 return false;
             }else{
                 var imgEle= $(this).contents().find('img');
                 if(imgEle.length==0){
                     switch (currentIndex){
                         case 0:
                             isValidUpload=true;
                             parent.window.artDialogAlertModal("请上传营业执照附件");
                             return false;
                         case 1:
                             isValidUpload=true;
                             parent.window.artDialogAlertModal("请上传GSP附件");
                             return false;
                         case 2:
                             isValidUpload=true;
                             parent.window.artDialogAlertModal("请上传合同页一");
                             return false;
                         case 3:
                             isValidUpload=true;
                             parent.window.artDialogAlertModal("请上传合同页二");
                             return false;
                         case 4:
                             isValidUpload=true;
                             parent.window.artDialogAlertModal("请上传合同公章");
                             return false;
                     }
                 }
             }
         });
        if(isValidUpload){
                return;
        }
        REGISTERINFO.gspTypes=CLIENTGSPTYPES;
        REGISTERINFO.gspInfo={
                    businessLicense:businessLicenseSelect.val(),
                    businessLicenseEndDate:businessLicenseEndDateSelect.val(),
                    limitedBusinessRange:$('#controlRange').val(),
                    orgCodeCertificate:$('#orgCodeCertificate').val(),
                    orgCodeCertificateEndDate:$('#orgCodeCertificateEndDate').val(),
                    taxRegcertificate:$('#taxRegcertificate').val(),
                    taxRegcertificateEndDate:$('#taxRegcertificateEndDate').val(),
                    GMPandGSPcertificate:GMPandGSPcertificateSelect.val(),
                    GMPandGSPcertificateEndDate:GMPandGSPcertificateEndDateSelect.val(),
                    medInsOccCertifacate:$('#medInsOccCertifacate').val(),
                    medInsOccCertifacateEndDate:$('#medInsOccCertifacateEndDate').val(),
                    InsLegalPersonCertifacate:$('#InsLegalPersonCertifacate').val(),
                    InsLegalPersonCertifacateEndDate:$('#InsLegalPersonCertifacateEndDate').val(),
                    proAndBusOperationCertifacate:$('#proAndBusOperationCertifacate').val(),
                    proAndBusOperationCertifacateEndDate:$('#proAndBusOperationCertifacateEndDate').val(),

                    foodCirclePermit:$('#foodCirclePermit').val(),
                    foodCirclePermitEndDate:$('#foodCirclePermitEndDate').val(),
                    medDevLicense:$('#medDevLicense').val(),
                    medDevLicenseEndDate:$('#medDevLicenseEndDate').val(),
                    healthCertifacate:$('#healthCertifacate').val(),
                    healthCertifacateEndDate:$('#healthCertifacateEndDate').val(),
                    spiritualNarcoticCard :$('#spiritualNarcoticCard').val(),
                    spiritualNarcoticCardEndDate:$('#spiritualNarcoticCardEndDate').val(),
                    dangerChemicalLicense:$('#dangerChemicalLicense').val(),
                    dangerChemicalLicenseEndDate:$('#dangerChemicalLicenseEndDate').val(),
                    maternalOccuLicense:$('#maternalOccuLicense').val(),
                    maternalOccuLicenseEndDate:$('#maternalOccuLicenseEndDate').val()
              };

             var imageUrls=[];
        iframeSelect.each(function(){
               var imgEle= $(this).contents().find('img');
               if(imgEle.length!=0){
                   imageUrls.push(imgEle.attr('src'));
               }
            });
        var stampLinkIndex=4;
        //data
        REGISTERINFO.stampLink = imageUrls[stampLinkIndex];
        //并且删掉印章的url,现在存在不同的字段里面
        imageUrls.splice(stampLinkIndex,1);
        REGISTERINFO.images=imageUrls;
        $.ajax({
            type:'post',
            url:'/rest/register',
            data:REGISTERINFO,
            success:function(feedback){
                if(feedback.status== 200){
                    var navigation3Select = $("#navigation3");
                    var navigation2Select = $("#navigation2");
                    navigation2Select.find('div').eq(0).attr('class','leftPartFocus');
                    navigation2Select.find('div').eq(1).attr('class','stepOneTextFocus');
                    navigation2Select.find('div').eq(2).attr('class','rightPartFocus');

                    navigation3Select.find('div').eq(0).attr('class','leftPart');
                    navigation3Select.find('div').eq(1).attr('class','stepOneText');
                    $('#gspInfo').css('display','none');
                    $('#successInfo').css('display','block');
                    window.scrollTo(0,0);
                } else if(feedback.status==1002){
                    $('#captchaTip').html(feedback.msg).css('color','red');
                    $('#captcha').focus();
                    $('#reloadCaptcha').trigger('click');
                } else {
                    artDialogAlertModal(feedback.msg);
                }
            }
        });
    });

//注册页面2的上一步
    $("#goback").bind("click",function(){
        $("#gspInfo").css('display','none');
        $("#basicInfo").css('display','block');
    });




    $(document).delegate('#agreeDeal','click',function(){
        $('#agreement').css('display','none');
       $('#fadeDiv').css('display','none');

    });


/*    $(document).delegate('input[type="checkbox"]','click',function(){
        alert($('input[type="checkbox"]').length);
    })*/

    $('.icheckbox').click(function(){
        var self=$(this);
        var attrClass=self.attr('class');
        var checked=attrClass.indexOf('checked')==-1;
        var businessLicenseEndDateSelect = $("#businessLicenseEndDate");
        if(checked){
            businessLicenseEndDateSelect[0].disabled=true;
            businessLicenseEndDateSelect.val('2100/01/01');
            businessLicenseEndDateSelect.hide();
        }else{
            businessLicenseEndDateSelect[0].disabled=false;
            businessLicenseEndDateSelect.val('');
            businessLicenseEndDateSelect.show();
        }
    });

    //gsp控制类型多选控制
    $('.gspTypeCheckbox .icheckbox').click(function(){
        var self=$(this);
        var attrClass=self.attr('class');
        var gspTypeId = self.find('input').attr('checkGspId');
        var checked=attrClass.indexOf('checked')==-1;
        if(checked){
            CLIENTGSPTYPES.push(gspTypeId);
        }else{
            for( var i=0;i<CLIENTGSPTYPES.length;i++){
                if(CLIENTGSPTYPES[i]== gspTypeId){
                    CLIENTGSPTYPES.splice(i,1);
                }
            }
        }
    });

    /**
     * @return {boolean}
     */
    function ValidateNullOrEmpty(str){
        return !!($.trim(str) == null || $.trim(str) == "");
    }

    $(document).delegate("#loginAccount", "focusout", function () {
        if($('#regAccount').css('color')=='rgb(255, 0, 0)'){
            return;
        }

        var self = $(this);
        var userName = self.val();
        $.ajax({
            type: 'get',
            url: '/register/operator/name/' + userName,
            success: function (feedback) {
                if (feedback.status == 200) {
                    $('#regAccount').css('display','none');
                    if(feedback.data.isExist=="1"){
                        $('#repeatAccountTip').css('display','inline-block');
                        $('#accountTip').css('display','none');
                    }else{
                        $('#repeatAccountTip').css('display', 'none');
                        $('#accountTip').css('display','inline-block');
                    }
                } else {
                    $('#repeatAccountTip').html('数据库出差错了,请刷新一下页面').css('display','inline—block');
                    $('#accountTip').css('display','none');
                }
            }
        });
    });





    $(document).delegate('.btnUploadReg','click',function(){
        var prevEle=$(this).prev().val();
        if(prevEle==""){
            artDialogAlertModal('请先选择文件');
            return;
        }
        $(this).parents('form').submit();

    });
});


/**
 * 上传证照
 */
var $upload_inputs = $(".pic-upload-button input");
$upload_inputs.change(function(){
    var oFile = $(this).get()[0].files[0];
    var filedata = new FormData();
    filedata.append('picture', oFile);
    //update_img("https://avatars1.githubusercontent.com/u/8455958?v=3&s=400", $(this));
    $.ajax({
        url: '/addpic',
        type: 'POST',
        data: filedata,
        cache: false,
        dataType: 'json',
        processData: false,
        contentType: false,
        success: function (res) {
            //res.url
            update_img(res, $(this));
        },
        error: function () {
            //todo error handle
        }
    })
});

/**
 * 更新图片展示
 * @param url 上传成功的图片url
 */
function update_img(url, $input){
    var $upload_bunnton = $input.parent();
    var $img = $("<img/>");
    $img.attr('src', url);
    $img.css({
        position:"absolute",
        top:0,
        left:0,
        width:"100px",
        height:"100px",
        "z-index":"99"
    });
    $img.appendTo($upload_bunnton);
}

/**
 * 新增附件
 */
var $upload_add_bunnton = $(".pic-add-button");
$upload_add_bunnton.click(function(){
    var $upload_items = $(".pic-upload-item");
    var $newItem = $(".item_model").clone();
    $newItem.css("display","block");
    $newItem.removeClass("item_model");
    $newItem.insertBefore($(this).parent());
    //$upload_items.append($newItem);
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
    var passVal= $.trim($('#loginPassword').val());
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
    var regName=/^[a-zA-Z0-9_]{8,16}$/;
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

function checkRegisterCaptcha(context){
    //var _this=context;
   // var currentValue=$(_this).val().trim();
    var _this=context;
    var captcha= $.trim($(_this).val());
    var reg=/^[a-zA-Z0-9]{4}$/;
    if(!reg.test(captcha)){
        $('#captchaTip').html('验证码错误').css('color','red');
        $('#captcha').focus();
        return;
    }
    $.ajax({
        type:'post',
        url:'/rest/register',
        data:{
            captchaCode: $.trim($('#captcha').val())
        },
        success:function(feedback){
            if(feedback.status==1002){
                $('#captchaTip').html(feedback.msg);
                $('#captcha').focus();
                return;
            }else if(feedback.status==200){
                $('#captchaTip').html('验证码正确').css('color','green');
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            artDialogAlertModal(textStatus+":"+errorThrown);
        }
    })






}

function clickCK(e){
    var e=window.event||e;
    if (e.stopPropagation) //支持W3C标准
        e.stopPropagation();
    else //IE8及以下浏览器
        e.cancelBubble = true;
}