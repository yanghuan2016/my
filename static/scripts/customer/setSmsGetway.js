$(function () {
    /**
     * 选中状态渲染
     */
    $(".smsSetArea input").each(function () {
        if ($(this).attr('data-checked') === "1") {
            $(this).parent('div.icheckbox').addClass("checked");
        }
    });

    /**
     * 设置参数
     */
    $(".setSmsParam").click(function () {
        artDialogPure($(".smsSetPanel"));
        var smsId = $(this).attr("data-id");
        getSmsParam(smsId);
    });

    $(".setSmsCancel").click(closePanel);
    $(".setSmsSave").click(saveParam);

    function saveParam(){
        var smsId = $(".smsSetPanelContent input").first().attr("data-id");
        var data = {
            smsId: smsId,
            configValue: {}
        };
        $(".smsSetPanelContent input").each(function(){
            var key = $(this).attr("name");
            var value = $(this).val();
            data.configValue[key] = value;
        });
        $.ajax({
            type: 'post',
            dataType: 'json',
            data: data,
            url: '/customer/system/sms/set',
            success: function(feedback){
                if(feedback.status == 200){
                    closePanel();
                }
            }
        })
    }

    var typeNames = {
        'smsDefault': 'isMain',
        'smsPrepare': 'isStandby'
    };

    /**
     * 勾选设置
     */
    $(".smsSetArea div.icheckbox").each(function () {
        $(this).click(smsChecked);
    });
    function smsChecked(e) {
        e.stopPropagation();
        e.preventDefault();
        var allStatus = collectSmsStatus();
        //获取本次点击的数据
        var smsId = $(this).parents("div.checkbox").attr("data-id");
        var type = typeNames[$(this).find("input").attr('class')];
        if(!$(this).hasClass("checked")){

            var reqData = [];
            _.map(allStatus, function(item){
                if(item[type] == 1){
                    item[type] = 0;
                }
                return item;
            });
            allStatus[smsId].isMain = 0;
            allStatus[smsId].isStandby = 0;
            allStatus[smsId][type] = 1;
            _.map(allStatus, function (item) {
                reqData.push(item);
            });
            findCheckedItem($(this).find("input").attr('class'));
            $(this).parents("label").siblings().find(".icheckbox").removeClass("checked");
            $(this).addClass("checked");
            smsReq(reqData);
        }
    }

    function getSmsParam(smsId){
        $.ajax({
            type: 'get',
            url: '/customer/system/sms/set?smsId=' + smsId,
            dataType: 'json',
            success: function(feedback){
                paramsFillIn(feedback, smsId);
            }
        })
    }

    function closePanel(){
        $(".smsSetPanelContent").empty();
        window._dialog.close().remove();
    }

    function paramsFillIn(params, smsId){
        var $smsSetPanelContent = $(".smsSetPanelContent");
        var paramIndex = 1;
        _.map(params, function(item, key){
            $smsSetPanelContent.append("<div>参数"+ (paramIndex++) +"： <input data-id="
                + smsId +" type='text' name="+ key +" value="+ item +"></div>")
        })
    }

    function findCheckedItem(type){
        $(".smsSetArea input").each(function(){
            if( ($(this).attr('name') == type) && $(this).parent("div.icheckbox").hasClass("checked") ){
                $(this).parent("div.icheckbox").removeClass("checked");
            }
        })
    }

    function checkSmsStatus(data) {
        //var mainSms = 0;
        //var standBySms = 0;
        var inOneSms = 0;
        for (var i = 0; i < data.length; i++) {
            //data[i].isMain && mainSms++;
            //data[i].isStandBy && standBySms++;
            (data[i].isMain && data[i].isStandby) && inOneSms++;
        }
        //(mainSms > 1) && artDialogAlertModal('只能设置一个首选');
        //(standBySms > 1) && artDialogAlertModal('只能设置一个备选');
        (inOneSms > 0) && artDialogAlertModal('同一个方案只能勾选一个');
        return (inOneSms === 0);
    }

    function smsReq(data) {
        $.ajax({
            type: 'post',
            url: '/customer/system/smsList',
            data: {"data": data},
            dataType: 'json',
            success: function (feedback) {
                //alert(feedback.msg)
            }
        })
    }

    /**
     * 收集所有勾选状态
     */
    function collectSmsStatus() {
        var status = {};
        $(".smsSetArea div.checkbox").each(function () {
            var mainSms;
            var standBySms;
            mainSms = +$(this).find('input.smsDefault').parent("div.icheckbox").hasClass("checked");
            standBySms = +$(this).find('input.smsPrepare').parent("div.icheckbox").hasClass("checked");
            status[$(this).attr('data-id')] = {
                smsId: $(this).attr('data-id'),
                isMain: mainSms,
                isStandby: standBySms
            }
        });
        return status;
    }


});
