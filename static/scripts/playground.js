$(function () {
    $("#updateAppCode").click(function () {
        var hello = CryptoJS.MD5(JSON.stringify("hello"));
        var userType = $("#userType").val().toLowerCase();
        var uid = $("#uid").val();
        var appKey = $("#appKey").val();

        var url = "/api/erp/appCode/" + uid;
        //接口数据格式:保留方案
        var msg = {
            version: "1.0",
            msgId: "123456789012345678",
            msgType: "GENERATE_APPCODE",
            checksum: appKey,
            msgData: {
                name: "zp",
                age: 23
            }
        };

        msg.checksum = CryptoJS.MD5(JSON.stringify(msg)).toString();
        //临时方案:
        var checkedMsg = {appKey: appKey};
        $.ajax({
            data: checkedMsg,
            url: url,
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == 200) {
                    $("#appCode").val(feedback.data.appCode);
                    $("#checksum").val(feedback.data.appCode);
                } else {
                    artDialogAlertModal(feedback.msg, function () {
                    });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });

    });

    $("#makeCall").click(function () {
        var url = $("#url").val();
        var version = $("#version").val();
        var msgId = $("#msgId").val();
        var msgType = $("#msgType").val();
        var checksum = $("#checksum").val();
        var msgData = {
            name: "zp",
            age: 23
        };

        var msg = {
            version: version,
            msgId: msgId,
            msgType: msgType,
            checksum: checksum,
            msgData: msgData
        };
        msg.checksum = CryptoJS.MD5(JSON.stringify(msg)).toString();

        var checkedMsg = {
            msg: JSON.stringify(msg)
        };

        $("#inputData").text(JSON.stringify(msg));

        $.ajax({
            data: checkedMsg,
            url: url,
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == 200) {
                    artDialogAlert(JSON.stringify(feedback));
                    $("#receiveData").text(JSON.stringify(feedback))
                } else {
                    artDialogAlertModal(feedback.msg, function () {
                    });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });

    $('#startSendDataToErp').click(function () {
        var url = "/playground/startSendDataToErp";
        var s = $("#inputData").text();
        var msgData = JSON.parse(s);
        var data = {
            enterpriseId: $("#uid").val(),
            msgType: $("#msgType").val(),
            msgData: msgData
        };

        $.ajax({
            url: url,
            type: 'post',
            data: data,
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                artDialogAlertModal(JSON.stringify(feedback));

            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
});
