$(function () {

    //客户查看商家发货信息
    $(document).delegate('a[id^=clientDisplayShipInfo_]', 'click', function () {
        clearDialog();
        var self = $(this);
        var selectGoods = $("#selectGoods");
        var goodsId = self.attr("goodsId");
        var batchNum = self.attr("batchNum");
        var batchQty = self.attr("batchQty");
        var produceDate = self.attr("produceDate");
        var drugESC = self.attr("drugESC");
        var validDate = self.attr("validDate");
        var inspectReportURL = self.attr("inspectReportURL").split(",");
        var packInfo = $("#maxReceivedNum_" + goodsId);
        $('.inputBatchNum').val(batchNum);
        $('.inputQuantity').val(batchQty);
        $('.inputGoodsProduceDate').val(produceDate);
        $('.inputGoodsValidDate').val(validDate);
        $('.inputDrugESC').val(drugESC);
        $("#lgNum").text(packInfo.attr("largePackNum"));
        $("#lgUnit").text(packInfo.attr("largePackUnit"));
        $("#midNum").text(packInfo.attr("middlePackNum"));
        $("#midUnit").text(packInfo.attr("middlePackUnit"));
        var str = "";
        for (var i = 0; i < inspectReportURL.length; i++) {
            str += "<li><div class='fileClass'>" +
                "<a target='_blank' href='"+ inspectReportURL[i] +"'><img src='" + inspectReportURL[i] + "'></img>" +
                "</div></li>";
        }
        var fileContainer = $(".fileContainer");
        var formsignin = $(".form-signin");
        fileContainer.find("ul").append(str);
        formsignin.css("display", "block");
        formsignin.siblings("span").css("display", "none");
        var otherShipQuantity = 0;
        var siblingsDiv = self.closest(".ship-operator").siblings(".ship-operator");
        _.each(siblingsDiv, function (item) {
            var qty = Number($(item).find("span[name=quantity]").text().trim());
            otherShipQuantity = Number(otherShipQuantity + qty);
        });
        selectGoods.attr("name", self.attr("id"));
        selectGoods.attr("goodsId", self.attr("goodsId"));
        selectGoods.attr("shipTotal", self.attr("shipTotal"));
        selectGoods.attr("currentShipNum", self.attr("currentShipNum"));
        selectGoods.attr("otherShipQuantity", otherShipQuantity);
        hoverText($('.fileClass'), '点击看大图');
        displayDialog("selectGoods");
    });

    //客户端确认收货点击确认
    $(document).delegate('#clientConfirmReceiveItem', 'click', function () {
        var selectGoods = $("#selectGoods");
        var data = {};
        var currentShipNum = Number(selectGoods.attr("currentShipNum"));
        var name = selectGoods.attr("name");
        var shipTotal = selectGoods.attr("shipTotal");
        var otherShipQuantity = Number(selectGoods.attr("otherShipQuantity"));
        data.receivedQuantity = Number($('.inputQuantity').val());
        data.drugESC = $('.inputDrugESC').val();
        if (Number(data.receivedQuantity) > Number(currentShipNum)) {
            artDialogAlertModal("实际验收数量已超出最大允许验收数量");
            return;
        }
        var batchDiv = $("a[id=" + name + "]");
        batchDiv.closest(".ship-operator").find("span[name=quantity]").text(data.receivedQuantity);
        batchDiv.attr("batchQty", data.receivedQuantity);
        batchDiv.attr("drugESC", data.drugESC);
        var sum = otherShipQuantity + data.receivedQuantity;
        var sumInput = $("#receivedQty_" + selectGoods.attr("goodsId"));
        if (sum != shipTotal) {
            sumInput.removeClass("font-green");
            sumInput.addClass("font-orange");
        } else if (sum == shipTotal) {
            sumInput.removeClass("font-orange");
            sumInput.addClass("font-green");
        }
        sumInput.text(sum);
        $(".fadeDiv").css('display', 'none');
        selectGoods.css('display', 'none');
    });

    //提交退货申请数据
    $(document).delegate('#clientApplyReturn', 'click', function () {
        var remark = $("#returnApplyRemark").val();
        var data = {
            shipId: $(this).attr("shipId"),
            orderId: $(this).attr("orderId"),
            remark: remark,
            goodsArr: []
        };
        var returnEmpty=true;
        $("tr[name^='goodsItem']").each(function () {
            var temp = {};
            var element = $(this);
            var goodsId = Number(element.attr('goodsId'));
            var soldPrice = element.attr('soldPrice');
            temp.goodsId = goodsId;
            temp.applyQuantity = Number(element.find(".applySum").text().trim());
            temp.price = soldPrice;
            temp.batchDatas = [];
            var td = element.find("td[name^='batch_']");
            _.each(td, function (item) {
                var aTags = $(item).find("a");
                _.each(aTags, function (aTagItem) {
                    var orTemp = [];
                    var batchNum = $(aTagItem).attr("batchNum");
                    var goodsId = Number($(aTagItem).attr("goodsId"));
                    var batchQty = Number($(aTagItem).attr("batchQty"));
                    var drugESC = $(aTagItem).attr("drugESC");
                    var produceDate = $(aTagItem).attr("produceDate");
                    var validDate = $(aTagItem).attr("validDate");
                    var inspectReportURL = $(aTagItem).attr('inspectReportURL');
                    orTemp.push(goodsId);
                    orTemp.push(batchNum);
                    orTemp.push(batchQty);
                    orTemp.push(produceDate);
                    orTemp.push(validDate);
                    orTemp.push(drugESC);
                    orTemp.push(inspectReportURL);
                    temp.batchDatas.push(orTemp);
                });
            });
            if(Number(temp.applyQuantity)!=0){
                returnEmpty=false;
                data.goodsArr.push(temp);
            }

        });
        if(returnEmpty){
            artDialogAlertModal("退货数量不能为0");
            return;
        }
        if (data.goodsArr.length == 0) {
            artDialogAlertModal("请先填写完整退货的数据");
            return;
        }
        $.ajax({
            data: data,
            url: '/order/return/new',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                artDialogAlertModal(feedback.msg, function(){
                    window.location.href = '/order';
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });

    //提交确认收货
    $(document).delegate('#clientConfirmReceived', 'click', function () {
        var data = {};
        var status = "DELIVERED";
        var goodsItem = $('.goodsItem');
        _.each(goodsItem, function (gItem) {
            var shipQty = $(gItem).find("td").eq(2).text().trim();
            var receiveQty = $(gItem).find("td").eq(3).text().trim();
            if (Number(shipQty) != Number(receiveQty)) {
                status = "REJECT-REQUEST";
            }
        });
        data.status = status;
        var remark = $('.receivedRemark').val();
        var shipId = $(this).attr("shipId");
        data.shipId = shipId;
        data.remark = remark;
        data.reData = [];
        data.orData = [];
        var td = $("td[name^='batch_']");
        _.each(td, function (item) {
            var aTags = $(item).find("a");
            _.each(aTags, function (aTagItem) {
                var reTemp = [];
                var orTemp = [];
                var batchNum = $(aTagItem).attr("batchNum");
                var goodsId = Number($(aTagItem).attr("goodsId"));
                var batchQty = Number($(aTagItem).attr("batchQty"));
                var shipBatchQty = Number($(aTagItem).attr("currentShipNum"));
                var drugESC = $(aTagItem).attr("drugESC");
                var rebatchQty = Number(shipBatchQty - batchQty);
                var soldPrice = Number($(aTagItem).attr('soldPrice'));
                var inspectreporturl = $(aTagItem).attr('inspectreporturl');
                orTemp.push(shipId);
                orTemp.push(goodsId);
                orTemp.push(batchNum);
                orTemp.push(batchQty);
                orTemp.push(drugESC);
                orTemp.push(remark);
                data.orData.push(orTemp);
                if (rebatchQty != 0) {
                    reTemp.push(shipId);
                    reTemp.push(goodsId);
                    reTemp.push(batchNum);
                    reTemp.push(rebatchQty);
                    reTemp.push(drugESC);
                    reTemp.push(remark);
                    reTemp.push(soldPrice);
                    reTemp.push(inspectreporturl);
                    data.reData.push(reTemp);
                }
            });
        });
        /*if (status == "REJECT-REQUEST") {
            artDialogAlertTitleWithoutCancel(
                "您的收货数量与发货数量不一致,确认要生成拒收单?",
                "确认收货",
                function (isReject) {
                    data.isReject = isReject;
                    submitReviceData(data);
                }
            );
        } else {*/
            artDialogAlertModal("是否确认收货？", function () {
                data.isReject = false;
                submitReviceData(data);
            });
        //}
    });
});
function submitReviceData(data) {
    $.ajax({
        data: data,
        url: '/order/ship/update',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (feedback) {
            if (feedback.status == 200) {
                var url = "";
                if (data.isReject) {
                    var rejectId = feedback.data.rejectId;
                   // url = "/order/refuse/detail?refuseId=" + rejectId;
                } else {
                    //url = "/order/ship?type=received";
                }
                artDialogAlertModal(feedback.msg, function () {
                    window.location.href = url;
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