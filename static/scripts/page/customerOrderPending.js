$(function(){
    $('.js-signature-customer').jqSignature({
        lineColor: 'red',
        background: 'white',
        width:320,
        height:130
    });
    //获取初始画布值
    var initialBlank=$('.js-signature-customer').jqSignature('getDataURL');


    //签名
    $('.js-signature-customer').on('jq.signature.changed', function() {
        var currentBase64URL=$('.js-signature-customer').jqSignature('getDataURL');
        if(currentBase64URL!=initialBlank){
            $('#signNameCustomer').hide();
            if($('#stampImgCustomer').attr('src')!=''&&$('#stampImgCustomer').attr('src')!=undefined) {
                $('#ApproveOrder').attr('disabled', false);
            }
        }
    });

    //customer 重新签名
    $(document).delegate('.clearSignatureCustomer','click',function(){
        $('.js-signature-customer').jqSignature('clearCanvas');
        var imgBase64URLCUR=$('.js-signature-customer').jqSignature('getDataURL');//$('.js-signature-client')
        $('#ApproveOrder').attr('disabled',true);
    });
    //customer 盖章事件
    //盖章事件
    $('#stampCustomer').on('click',function(){
        var imgUrl=$(this).attr('data-imgUrl');
        $('#stampImgCustomer').attr('src',imgUrl).show();
        $('#signStampCustomer').hide();
        var imgBase64URL=$('.js-signature-customer').jqSignature('getDataURL');
        if(imgBase64URL!=initialBlank){
            $('#ApproveOrder').attr('disabled',false);
        }
    })

    $(document).delegate('#ApproveOrder','click',function(){
        var stamp=$('#stampImgCustomer').attr('src');
        if(stamp==undefined|| $.trim(stamp)==""){
            $('#signStampCustomer').css('display','inline-block');
            return;
        }
        var imgBase64URL=$('.js-signature-customer').jqSignature('getDataURL');
        if(imgBase64URL==initialBlank){
            $('#signNameCustomer').css('display','inline-block');
            return;
        }
        //postData to backGround

        var element = $('#customerApprovedOrder');
        var orderId = element.attr('orderId');
        var displayId = element.attr('data-displayId');
        var client = element.attr('data-client');
        var clientId = element.attr('data-clientId');
        var status = element.attr('status');
        var dialogTitle="请输入备注信息";
        artDialogInputModal(dialogTitle,function(textareaContent){
            //textareaContent  用户输入的内容
            var  remark = textareaContent;
            //get returnInfo items
            var data = {
                orderId:orderId,
                displayId: displayId,
                client: client,
                clientId: clientId,
                status: status,
                remark:remark,
                customerSignature:imgBase64URL
            };
            $.ajax({
                data: data,
                url: '/customer/order/updateStatus',
                type:'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function(feedback){
                    if(feedback.status == 200 && feedback.data !=undefined ) {
                        location.reload();
                    }else{
                        artDialogAlertModal(feedback.msg);

                    }
                },
                error: function(jqXHR, textStatus, errorThrown){
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                },
                beforeSend:function(){
                    //禁用按钮
                    $('#ApproveOrder').attr('disabled',true);
                    $('#CancelApprove').attr('disabled',true);
                },
                complete:function(){
                    //恢复按钮
                    $('#ApproveOrder').attr('disabled',false);
                    $('#CancelApprove').attr('disabled',false);
                },
            });
        });


    })

    $(document).delegate('#CancelApprove','click',function(){
        $('#purchaseAgreement').hide();
        $('#purchaseDealFadeDiv').hide();
        $('.js-signature-customer').jqSignature('clearCanvas');
        $('#signStampCustomer').hide();
        $('#signNameCustomer').hide();
        $('#stampImgCustomer').attr('src','').hide();
        $('#ApproveOrder').attr('disabled',true);
    });
});