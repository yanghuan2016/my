    // 客服中心 点击查询按钮
$(document).delegate('#callcenter-searchRefundBtn','click',function(){
        var startDate=$('#StartDate').val(),
            endDate=$('#EndDate').val(),
            refundReason=$('#refundReason').attr('data-value'),
            refundType=$('#refundType').attr('data-value'),
            refundStatus=$('#refundItemStatus').attr('data-value'),
            keyWord=$.trim($(this).prev().val());
        if(new Date(startDate)>new Date(endDate)){
            artDialogAlertModal('起始时间不能晚于结束时间');
            return;
        }
        var filterCondition={
            startDate:startDate,
            endDate:endDate,
            refundReason:refundReason=='ALL'?'':refundReason,
            refundType:refundType=='ALL'?'':refundType,
            refundStatus:refundStatus=='ALL'?'':refundStatus,
            keyWord:keyWord
        };
        var currentHref=window.location.href;
        window.location.href=handleUrl(filterCondition,decodeURI(currentHref));
});


$(document).delegate('#traderDetailBtn','click',function(){
        var startDate=$('#StartDate').val(),
            endDate=$('#EndDate').val(),
            bType= $.trim($('#bType').attr('data-value')),
            pType= $.trim($('#pType').attr('data-value')),
            keyWord=$('#keyWordInput').val();

        if(new Date(startDate)>new Date(endDate)){
            artDialogAlertModal('起始时间不能晚于结束时间');
            return;
        }
        var filterCondition={
            startDate:startDate,
            endDate:endDate,
            bType:bType=='ALL'?'':bType,
            pType:pType=='ALL'?'':pType,
            keyWord:keyWord
        };
        var currentHref=window.location.href;
        window.location.href=handleUrl(filterCondition,decodeURI(currentHref));
});

$(document).delegate('#callCenterVerifyBtn','click',function(e){


        var regNum=/^\d+(\.\d{1,2})?$/;
        var number=$.trim($('#verifiedSum').val());
        if(!regNum.test(number)){
            $('#verifiedSum').focus();
            $('#callCenterNumberTips').text('请输入正确的数字,最多精确2位');
            return;
        }
        var orderTotal=$('#currentOrderTotal').text();
        if(Number(number)>Number(orderTotal)){
            $('#verifiedSum').focus();
            $('#callCenterNumberTips').text('退款金额不能大于订单金额');
            return;
        }



        $('#verifiedForm')[0].submit();

});


$('.displayAcceptModal').on('click',function(){
    var dataAccept=$(this).attr('data-accept'),
             refundId=$(this).attr('refundid');
    if(dataAccept=='true'){
        $('#refundInputTip').text('请输入同意备注');
    }
    else{
        $('#refundInputTip').text('请输入退回备注');
    }
    $('#selectGoods').attr('data-refundId',refundId).attr('data-accept',dataAccept);
    if($(this).attr('iscredit')=='true'){
     $('#selectGoods').attr('iscredit','true');
    }
    displayDialog('selectGoods');

});

$(document).delegate('#financeAcceptVerifyBtn','click',function(){
     var remark=$.trim($('#acceptRemark').val());
     var refundId=$(this).parents('#selectGoods').attr('data-refundId');

     var dataAccept=$(this).parents('#selectGoods').attr('data-accept');
     var url;
     if(dataAccept=='true'){
         url='/customer/bill/refundCheckAccept';
     }else{
         url='/customer/bill/refundCheckReject'
     }
    var isCredit=$('#selectGoods').attr('iscredit')=='true';

    var data = {
        isCredit:isCredit,
        refundId: refundId,
        remark: remark,
        refundType:$('.displayAcceptModal').eq(0).attr('data-refundtype')
    };
   if(isCredit){
       var ele=$('.displayAcceptModal').eq(0);
       data.refundAmount=Number(ele.attr('verifiedAmount'));
       data.clientId=Number(ele.attr('clientId'));
   }

    $.ajax({
        url:url,
        type:'post',
        data:data,
        success:function(feedback){
            if(feedback.status==200){
                artDialogAlertModal(feedback.msg,function(){
                    window.location.href='/customer/bill/refundCheck';
                });
            }else{
                artDialogAlertModal(feedback.msg);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            if(textStatus=='timeout'){
                self.siblings("span").text('网络状况不好,请稍后再试');
            }else {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        }
    })


});




$(document).delegate('#customerPerformRefund_one','click',function(){
    var refundId = $("#dialog-confirm").attr("data-refundId");
    var orderId = $("#dialog-confirm").attr("data-orderId");
    $.ajax({
        url:'/order/payRefund',
        type:'post',
        data:{
            refundId: refundId,
            orderId: orderId
        },
        success:function(feedback){
            if(feedback.status==200){
                $('#selectGoods').hide();
                $('.fadeDiv').hide();
                artDialogAlertModal(feedback.msg,function(){
                    window.location.reload();
                })
            }else{
                $('#selectGoods').hide();
                $('.fadeDiv').hide();
                artDialogAlertModal(feedback.msg,function(){
                    window.location.reload();
                })
            }
        }
    });

});
function checkVerifiedSum(context){
    var val=$.trim($(context).val());
    var regNum=/^\d+(\.\d{1,2})?$/;
    if(regNum.test(val)){
        //$('#callCenterNumberTips').text('');
        var orderTotal=$('#currentOrderTotal').text();
        if(Number(val)>Number(orderTotal)){
            $('#verifiedSum').focus();
            $('#callCenterNumberTips').text('退款金额不能大于订单金额');
            return;
        }else{
            $('#callCenterNumberTips').text('');
        }

    }else{
        $('#callCenterNumberTips').text('请输入正确的数字,最多精确2位');

    }


}