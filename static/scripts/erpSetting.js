$(function () {
    $('ins').remove();
    //赋值
    var erpIsEnableTrSelect = $(".erpIsEnableTr");
    var erpEnable = erpIsEnableTrSelect.attr('erpEnable');
    if (erpEnable == "true") {
        erpIsEnableTrSelect.find('td').eq(1).find('.iradio').eq(0).attr('class', 'iradio checked');
    }else{
        erpIsEnableTrSelect.find('td').eq(1).find('.iradio').eq(1).attr('class', 'iradio checked');
    }

    $(document).delegate('.iradio', 'click', function () {
        var iradioSelect = $(".iradio");
        var currentIndex = iradioSelect.index($(this));
        var maxIndexRadio = iradioSelect.length - 1;
        if (currentIndex == maxIndexRadio) {
            $(this).attr('class', 'iradio checked');
            $(this).parents('.radioInErpSettings').prev().find('.iradio').attr('class', 'iradio');
            $('.erpContent').hide();
        } else {
            $(this).attr('class', 'iradio checked');
            $(this).parents('.radioInErpSettings').next().find('.iradio').attr('class', 'iradio');
            $('.erpContent').show();
        }
    });


    //生成appKey
    $(document).delegate('#updateAppKey', 'click', function () {
        var userType = $(this).attr('data-attr') == 'customer' ? 'customer' : 'client';
        var url;
        if(userType=="customer"){
            url="/customer/system/get/appKey";
        }
        else if(userType=="client"){
            url="/portal/get/appKey";
        }
        $.ajax({
            url: url,
            type: 'get',
            success: function (feedback) {
                if (feedback.status == 200) {
                    $('#appKey').text(feedback.data);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                artDialogAlertModal(textStatus + ":" + errorThrown);
            }
        });
    });


    //customer 保存
    $(document).delegate('#saveErpSetting', 'click', function () {
        var userType = $(this).attr('data-attr');
        var appKey = $('#appKey').text();
        var erpMsgUrl = $.trim($('#erpMsgUrl').val());
        var erpAppCodeUrl = $.trim($('#erpAppCodeUrl').val());
        var url = null;

        if (userType == "customer") {
            url = "/customer/system/erpSetting";
        } else if(userType == "client") {
            url = "/portal/erpSetting";
        }

        var erpEnabled = $('#erpEnabled').closest('div').attr('class').indexOf('checked') != -1;
        var postData = {
            erpEnabled: false,
            appKey: appKey,
            erpMsgUrl: erpMsgUrl,
            erpAppCodeUrl: erpAppCodeUrl
        };
        if (erpEnabled) {
            if (appKey == "") {
                return artDialogAlertModal('请先获取appkey');
            }
            if (erpMsgUrl == "") {
                return artDialogAlertModal('启用erp后需要您填写erp地址', function () {
                    $('#erpMsgUrl').focus();
                });
            }
            if (erpAppCodeUrl == "") {
                return artDialogAlertModal('启用erp后需要您填写erp地址', function () {
                    $('#erpAppCodeUrl').focus();
                });
            }
            postData.appKey = appKey;
            postData.erpMsgUrl = erpMsgUrl;
            postData.erpAppCodeUrl = erpAppCodeUrl;
            postData.erpEnabled = true;
        }

        $.ajax({
            url: url,
            type: 'post',
            data: postData,
            success: function (feedback) {
                artDialogAlertModal(feedback.msg);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                artDialogAlertModal(textStatus + ":" + errorThrown);
            }
        });
    });
});