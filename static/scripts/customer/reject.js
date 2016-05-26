$(function () {
    //商户端拒收修改按钮
    $(document).delegate('a[id^=displayRejectShipSelect_]', 'click', function () {
        //显示包装单位用
        var self = $(this);
        var selectGoods = $("#selectGoods");
        var goodsId = self.attr("goodsId");
        var batchNum = self.attr("batchNum");
        var batchQty = self.attr("batchQty");
        var produceDate = self.attr("produceDate");
        var validDate = self.attr("validDate");
        var drugESC = self.attr("drugESC");
        var inspectReportURL = self.attr("inspectReportURL").split(",");
        $('.inputBatchNum').val(batchNum);
        $('.inputQuantity').val(batchQty);
        $('.inputGoodsProduceDate').val(produceDate);
        $('.inputGoodsValidDate').val(validDate);
        $('.drugESC').val(drugESC);
        var fileContainer = $(".fileContainer");
        var formSignin = $(".form-signin");
        if (inspectReportURL != "" && inspectReportURL != "undefined") {
            var str = "";
            for (var i = 0; i < inspectReportURL.length; i++) {
                str += "<li><div class='fileClass'><img src=" + inspectReportURL[i] + "></img></div></li>";
            }
            fileContainer.find("ul").find("li").remove();
            fileContainer.find("ul").append(str);
            formSignin.css("display", "block");
            formSignin.siblings("span").css("display", "none");
        } else {
            formSignin.css("display", "none");
            formSignin.siblings("span").css("display", "block");
        }
        var otherShipQuantity = 0;
        var siblingsDiv = self.closest(".ship-operator").siblings(".ship-operator");
        _.each(siblingsDiv, function (item) {
            var qty = Number($(item).find("#batchShipNum").text().trim());
            otherShipQuantity = otherShipQuantity + qty;
        });
        selectGoods.attr("goodsId", goodsId);
        selectGoods.attr("shipBatchQty", self.attr("shipBatchQty"));
        selectGoods.attr("batchName", self.closest(".ship-operator").attr("name"));
        selectGoods.attr("shipTotal", $("#finalRejectedTotalQty_" + goodsId).text().trim());
        selectGoods.attr("otherShipQuantity", otherShipQuantity);
        var element = $('#maxRefuseNum_' + goodsId);
        $("#lgNum").text(element.attr("largePackNum"));
        $("#lgUnit").text(element.attr("largePackUnit"));
        $("#midNum").text(element.attr("middlePackNum"));
        $("#midUnit").text(element.attr("middlePackUnit"));
        var temp = {
            middle: element.attr("largePackNum"),
            large: element.attr("middlePackNum")
        };
        $(".inputQuantity").attr("data", JSON.stringify(temp));
        displayDialog("selectGoods");
    });

    //商户端拒收查看按钮
    $(document).delegate('a[id^=displayRejectInfo_]', 'click', function () {
        //显示包装单位用
        var self = $(this);
        var goodsId = self.attr("goodsid");
        var batchNum = self.attr("batchNum");
        var batchQty = self.attr("batchQty");
        var produceDate = self.attr("produceDate");
        var validDate = self.attr("validDate");
        var drugESC = self.attr("drugESC");
        var inspectReportURL = self.attr("inspectReportURL").split(",");
        $('.inputBatchNum').val(batchNum);
        $('.inputQuantity').val(batchQty);
        $('.inputGoodsProduceDate').val(produceDate);
        $('.inputGoodsValidDate').val(validDate);
        $('.drugESC').val(drugESC);
        var fileContainer = $(".fileContainer");
        var formSignin = $(".form-signin");
        if (inspectReportURL != "" && inspectReportURL != "undefined") {
            var str = "";
            for (var i = 0; i < inspectReportURL.length; i++) {
                str += "<li><div class='fileClass'><img src=" + inspectReportURL[i] + "></img></div></li>";
            }
            fileContainer.find("ul").find("li").remove();
            fileContainer.find("ul").append(str);
            formSignin.css("display", "block");
            formSignin.siblings("span").css("display", "none");
        } else {
            formSignin.css("display", "none");
            formSignin.siblings("span").css("display", "block");
        }
        var element = $('#maxRefuseNum_' + goodsId);
        $("#lgNum").text(element.attr("largePackNum"));
        $("#lgUnit").text(element.attr("largePackUnit"));
        $("#midNum").text(element.attr("middlePackNum"));
        $("#midUnit").text(element.attr("middlePackUnit"));
        displayDialog("selectGoods");
    });

    //商户端修改拒收数量
    $(document).delegate('#confirmRejectReceiveItem', 'click', function () {
        var selectGoods = $("#selectGoods");
        var data = {};
        var goodsId = selectGoods.attr("goodsId");
        var shipBatchQty = Number(selectGoods.attr("shipBatchQty"));
        var batchName = selectGoods.attr("batchName");
        var otherShipQuantity = Number(selectGoods.attr("otherShipQuantity"));
        var shipTotal = Number(selectGoods.attr("shipTotal"));
        data.inputQuantity = Number($('.inputQuantity').val());
        data.drugESC = $('.drugESC').val();
        if (Number(data.returnShipQuantity) > Number(shipBatchQty)) {
            artDialogAlertModal("收货数量已超出最大允许收货数量");
            return;
        }
        var batchDiv = $("div[name=" + batchName + "]");
        batchDiv.find("span[name=quantity]").text(data.inputQuantity);
        batchDiv.find("a").attr("batchQty", data.inputQuantity);
        batchDiv.find("a").attr("drugESC", data.drugESC);
        var sum = Number(otherShipQuantity + data.inputQuantity);
        var receivedQtyLabel = batchDiv.closest("td").siblings("td").find("label[id=finalRejectedQty_" + goodsId + "]");
        if (sum != shipTotal) {
            receivedQtyLabel.closest("td").removeClass("font-green");
            receivedQtyLabel.closest("td").addClass("font-orange");
        } else if (sum == shipTotal) {
            receivedQtyLabel.closest("td").removeClass("font-orange");
            receivedQtyLabel.closest("td").addClass("font-green");
        }
        receivedQtyLabel.text(sum);
        $(".fadeDiv").css('display', 'none');
        selectGoods.css('display', 'none');
    });
    //确认入库
    $(document).delegate('#btnConfirmRejectDelivered', 'click', function () {
        var data = {};
        var element = $(this);
        var rejectReceiveRemarkSelect = $("#rejectReceiveRemark");
        var rejectId = element.attr("rejectId");
        var orderId = element.attr("orderId");
        data.rejectId = rejectId;
        data.orderId = orderId;
        data.remark = rejectReceiveRemarkSelect.val();
        if (data.remark == "") {
            rejectReceiveRemarkSelect.attr("placeholder", "入库备注不能为空");
            rejectReceiveRemarkSelect.focus();
            return false;
        }
        var items = [];
        $('.rejectDeliverd').each(function () {
            var goodsItem = $(this);
            var goodsId = goodsItem.attr('goodsId');
            var finalDeliveredQty = Number(goodsItem.find('#finalRejectedTotalQty_' + goodsId).text());
            var rejectReceiveQuantitySum = Number(goodsItem.find('#finalRejectedQty_' + goodsId).text());
            if (finalDeliveredQty != 0) {
                var item = {};
                var batchDatas = [];
                var batchBody = goodsItem.find("div[name^=batch_" + goodsId + "]");
                batchBody.each(function () {
                    var batchData = [];
                    batchData.push(
                        rejectId,
                        goodsId,
                        $(this).find('#batchNum').text(),
                        Number($(this).find('#batchShipNum').text()),
                        $(this).find('a').attr('drugESC'),
                        rejectReceiveQuantitySum
                    );
                    batchDatas.push(batchData);
                });
                item.goodsId = goodsId;
                item.batchDatas = batchDatas;
                items.push(item);
            }
        });
        data.deliveredItems = items;
        if (data.deliveredItems.length == 0) {
            artDialogAlertModal("尚未填写完整入库信息");
            return false;
        }
        $.ajax({
            data: data,
            url: '/customer/order/refuse/delivered',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == 200 && feedback.data != undefined) {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = '/customer/order/refuse?type=received';
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
});