$(function () {
    //商户查询　财务报表
    //查询按钮过滤
    $(document).delegate("#selectFinance", "click", function () {

        var data = {
            start: $("#spanGetStartYear").text().trim()+"-"+  $("#spanGetStartMonth").text().trim() ,
            end:$("#spanGetEndYear").text().trim()+"-"+$("#spanGetEndMonth").text().trim(),
            type: $("#spanGetType").text().trim(),
            clientName: $("#getClientName").val().trim()
        };

        var startDate= new Date(Number($("#spanGetStartYear").text().trim()), Number($("#spanGetStartMonth").text().trim()),1);
        var endDate=new Date(Number($("#spanGetEndYear").text().trim()), Number($("#spanGetEndMonth").text().trim()),1)

        if(startDate>endDate){
            artDialogAlertModal('开始月份不能大于截止月份');
            return;
        }
        var status;
        var statusText=$('#spanCreditType').text().trim();
        switch (statusText){
            case '全部状态':
                status='ALL';
                break;
            case '已结清':
                status='CLEARED';
                break;
            case '未结清':
                status='UNCLEARED';
                break;
            case '未出账':
                status='PENDING';
                break;
        }

        var currentHref=window.location.href;


        var newCurrentHref=updateQueryStringParameter(currentHref,'startMonth',data.start);
        newCurrentHref=updateQueryStringParameter(newCurrentHref,'endMonth',data.end);
        newCurrentHref=updateQueryStringParameter(newCurrentHref,'status',status);
        newCurrentHref=updateQueryStringParameter(newCurrentHref,'clientName',data.clientName);


        window.location.href=newCurrentHref;

    });


    $(document).delegate('.creditSettlementBtn','click',function(){
        var self=$(this);
        var eqId=self.closest('tr').attr('data-index');
        var clientId=self.closest('tr').attr('data-clientid');
        var billMonth=self.closest('tr').find('.billMonth').text();

        $('#hiddenData').attr('data-clientId',clientId).attr('data-billMonth',billMonth).attr('tr-index',eqId);

        displayDialog("settleModal");
    });

    $(document).delegate('#creditSettleBtn','click',function(){
          var firstInputValidateRetulst=window.checkSum.call($('#settleSum')[0],$('#settleSum')[0]),
            secondInputValidateResult=window.reCheckSum.call($('#reSettleSum')[0],$('#reSettleSum')[0]);
          if(!(firstInputValidateRetulst&&secondInputValidateResult)){
            return;
          }

        var creditSettleRemark=$('#creditSettleRemark').val();
        var trIndex=Number($('#hiddenData').attr('tr-index'));

        var selectedTr=$('.finance-table').find('tr').eq(trIndex);
        var receiveSum=selectedTr.find('.receivableState').text(); //应结款
        var clearAmount=selectedTr.find('.clearAmount').text();  //已结款
        var waitForState=selectedTr.find('.waitForState').text();//待结款

        var status=(Number(waitForState)-Number($('#settleSum').val()))<=0?'CLEARED':'UNCLEARED';


        var postData= {
            statementMonthlyId:selectedTr.attr('data-id'),
            clientId: $('#hiddenData').attr('data-clientId'),
            billMonth: $('#hiddenData').attr('data-billMonth'),
            clearAmount:$('#settleSum').val(),
            clearRemark:creditSettleRemark,
            status:status  //true 已结清 false 未结清
        };
          $.ajax({
             url:'/customer/bill/creditSettle',
             type:'post',
             data:postData,
             success:function(feedback){
                    if(feedback.status==200){
                        artDialogAlertModal(feedback.msg,function(){
                            window.location.reload();
                        })
                    }else{
                       //alert('内部错误');
                        artDialogAlertModal(feedback.msg);
                        window.location.reload();
                    }
              }
          });

    });


    $(document).delegate('#cancelCreditSettleBtn','click',function(){
        $('#settleSum').val('');
        $('#reSettleSum').val('');
        $('#creditSettleRemark').val('');
        $('#settleModal').hide();
        $('.fadeDiv').hide();
    });


    //用户特定月份 结款统计
    $(document).delegate('#creditUserReceivableBtn','click',function(){
        var year=$('#spanGetStartYear').text();
        var month=$('#spanGetStartMonth').text();
        var filterMonth=year+'-'+month;


        var currentHref=window.location.href;
        currentHref=updateQueryStringParameter(currentHref,'filterMonth',filterMonth);
        window.location.href=currentHref;

    });



    //货到付款 js
    $(document).delegate('.codSearchBtn','click',function(){
        var startDate=$('#StartDate').val(),
            endDate=$('#EndDate').val();
        if((new Date(startDate)>new Date(endDate))){
            artDialogAlertModal('起始时间不能晚于截止时间');
            return;
        }
        var orderStatusText=$.trim($('#codOrderStatus').text());
        var orderStatus=null;
        switch(orderStatusText){
            case '全部状态':
                orderStatus='ALL';
                break;
            case '待结款':
                orderStatus='UNCLEARED';
                break;
            case '已结款':
                orderStatus='CLEARED';
                break;
        }
        var keyWord=$.trim($('#codFilterInput').val());
        var urlQueryParameterObj={
            startDate:startDate,
            endDate:endDate,
            status:orderStatus,
            keyWord:keyWord
        };
        var currentHref=window.location.href;
        var newHref=handleUrl(urlQueryParameterObj,decodeURI(currentHref));
        window.location.href=newHref;
    });

    //货到付款结款
    $(document).delegate('.codSettleBtn','click',function(){
        var self=$(this);
        //var orderId = self.closest('tr').attr('data-ordeid');
        var orderId = self.attr('data-ordeId');
        var amount = self.attr('data-shipAmount');
        var clientId = self.attr('data-clientId');
        var displayOrderId = self.attr('data-displayOrderId');

        artDialogPromptModalExtend('确认结算此笔款项吗 ?','结算确认','确认结款','取消',function(){


            //确认了 发起ajax请求
            /*self.closest('tr').find('.orderStatus').find('span').removeClass('font-color-orange').text('已结款');
            self.closest('tr').find('.receivableSum').find('span').text('0.00');*/
            self.closest('tr').find('td:last').find('div').removeClass('finance-operation').removeClass('codSettleBtn');
            //return;
            $.ajax({
                url:'/customer/bill/codClearConfirm',
                type:'post',
                data:{
                    orderId: orderId,
                    clientId: clientId,
                    amount: amount,
                    displayOrderId: displayOrderId
                },
                success:function(feedback){
                    if(feedback.status==200){
                        //alert('确认结款成功');
                        self.find('.orderStatus').find('span').removeClass('font-color-orange');
                        artDialogAlertModal(feedback.msg,function(){
                            window.location.reload();
                        })

                    }else{
                        //alert('内部错误');
                        artDialogAlertModal(feedback.msg,function(){
                            window.location.reload();
                        })
                    }
                },
                error:function (jqXHR, textStatus, errorThrown) {
                    if (textStatus == 'timeout') {
                        artDialogAlertModal('网络状况不好,请稍后再尝试');
                    } else {
                        artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                    }
                }
            });
        });
    });

    $(document).delegate(".displaySelectRefund", "click", function () {
        // 获取当前行数据 refundId/orderId
        var refundId = $(this).attr('data-refundId');
        var orderId = $(this).attr('data-orderId');
        // 在 #dialog-confirm 中设置 refundId/orderId
        $("#dialog-confirm").attr("data-refundId", refundId);
        $("#dialog-confirm").attr("data-orderId", orderId);

        displayDialog("selectGoods");
    });

    $(document).delegate("a[id^=customerPerformRefund]", "click", function () {

    });
});

function checkSum(context){
    var self=$(context);
    var settleVal=self.val();
    var regNum=/^\d+(\.\d{1,2})?$/;
        //var xx=/^\d\.\d{2}$/;
    if(!regNum.test(settleVal)){
        $('.tips').css({color:'red'}).text('请输入正确的数字[最多精确2位]');
        return false;
    }
    else{
        $('.tips').hide();
        return true;
    }
}

function reCheckSum(context){
    var self=$(context);
    var resettleVal=self.val();
    var regNum=/^\d+(\.\d{1,2})?$/;

    var settleVal=$('#settleSum').val();
    if(!regNum.test(resettleVal)){
        $('.retips').css({color:'red'}).text('请输入正确的数字[最多精确2位]');
        return false;
    }
    if(settleVal!=resettleVal){
        $('.retips').css({color:'red'}).text('两次金额不一致');
        return false;
    }
    else{
        $('.retips').hide();
        return true;
    }
}

