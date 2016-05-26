$(function(){
    //初始化 画布
    $('.js-signature-client,.js-signature-customer').jqSignature({
        lineColor: 'red',
        background: 'white',
        width:320,
        height:130
    });
    //获取初始画布值
    var initialBlank=$('.js-signature-client').jqSignature('getDataURL');
    //清空签名,重签按钮事件
    $(document).delegate('.clearSignatureClient','click',function(){
        $('.js-signature-client').jqSignature('clearCanvas');
        $('#agreePurchaseDeal').attr('data-sign','false');
        $('#agreePurchaseDeal').attr('disabled', true);
    });
    //同意合同 提交数据按钮事件
    $(document).delegate('#agreePurchaseDeal','click',function(){
        var stamp=$('#stampImgClient').attr('src');
        if(stamp==undefined|| $.trim(stamp)==""){
            //提示盖章的时候 控制滚动条
            $('#signStampClient').css('display','inline-block');
            return;
        }
        var imgBase64URL=$('.js-signature-client').jqSignature('getDataURL');
        if(imgBase64URL==initialBlank){
            //提示签名的时候 控制滚动条
            $('#signNameClient').css('display','inline-block');
        }
        else{
            var cart=postCartDataDeal;
            cart.clientSignature=imgBase64URL;
            var clientId=$('.submitOrder').attr('data-client');
            $.ajax({
                data: cart,
                url: '/order/add',
                type:'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function(feedback){
                    if(feedback.status == '200' && feedback.data.orderId !=undefined ) {
                        window.location.href='order/payment?o='+ encodeURIComponent(feedback.data.orderId)+'&c='+clientId;
                    }else{
                        $('#agreePurchaseDeal').attr('disabled',false);
                        $('#declinePurchaseDeal').attr('disabled',false);
                        artDialogAlertModal(feedback.msg);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown){
                    $('#agreePurchaseDeal').attr('disabled',false);
                    $('#declinePurchaseDeal').attr('disabled',false);
                    if(textStatus=='timeout'){
                        artDialogAlertModal('网络状况不好,请稍后再试');
                    }else {
                        artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                    }
                },
                beforeSend:function(){
                    //禁用按钮
                    $('#agreePurchaseDeal').attr('disabled',true);
                    $('#declinePurchaseDeal').attr('disabled',true);
                },
                complete:function(XMLHttpRequest,status){
                    /*    if(status=='timeout'){//超时,status还有success,error等值的情况
                     $('#agreePurchaseDeal').attr('disabled',false);
                     $('#declinePurchaseDeal').attr('disabled',false);
                     }*/
                }
            });
        }
    });



    //签名
    $('.js-signature-client').on('jq.signature.changed', function() {
        var currentBase64URL=$('.js-signature-client').jqSignature('getDataURL');
        if(currentBase64URL!=initialBlank){
            $('#signNameClient').hide();
            if($('#stampImgClient').attr('src')!=''&&$('#stampImgClient').attr('src')!=undefined) {
                $('#agreePurchaseDeal').attr('disabled', false);
            }
        }
    });

    //盖章事件
    $('#stampClient').on('click',function(){
        var imgUrl=$(this).attr('data-imgUrl');
        $('#stampImgClient').attr('src',imgUrl).show();
        $('#signStampClient').hide();
        var currentBase64URL=$('.js-signature-client').jqSignature('getDataURL');
        if(currentBase64URL!=initialBlank){
            $('#agreePurchaseDeal').attr('disabled', false);
        }
    })

    //拒绝事件
    $('#declinePurchaseDeal').on('click',function(){
        $('#purchaseAgreement').hide();
        $('#purchaseDealFadeDiv').hide();
        $('.js-signature-client').jqSignature('clearCanvas');
        $('#signStampClient').hide();
        $('#signNameClient').hide();
        $('#stampImgClient').attr('src','').hide();
        $('#agreePurchaseDeal').attr('disabled', true);

    });
})