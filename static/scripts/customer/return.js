$(function () {

    //商户审核退货申请数据 todo
    $(document).delegate('#customerApplyReturnSubmit', 'click', function () {
        var remark = $("#customerReply").val();
        var data = {
            shipId: $(this).attr("shipid"),
            orderId: $(this).attr("orderid"),
            returnId: $(this).attr("returnid"),
            returnDisplayId: $(this).attr("data-displayid"),
            operatorId: $(this).attr("data-opid"),
            remark: remark,
            goodsArr: []
        };
        $("tr[name^='goodsItem']").each(function () {
            var temp = {};
            var element = $(this);
            var goodsId = Number(element.attr('goodsId'));
            var soldPrice = element.attr('soldPrice');
            temp.goodsId = goodsId;
            temp.allowReturnQuantity = Number(element.find(".applySum").text().trim());
            temp.price = soldPrice;
            temp.batchDatas = [];
            var aTags = element.find("td[name^='batch_']").find("a");
            _.each(aTags, function (aTagItem) {
                var orTemp = [];
                var batchNum = $(aTagItem).attr("batchNum");
                var goodsId = Number($(aTagItem).attr("goodsId"));
                var batchQty = Number($(aTagItem).attr("batchQty"));
                var OriginbatchQty = Number($(aTagItem).attr("OriginbatchQty"));
                var drugESC = $(aTagItem).attr("drugESC");
                var produceDate = $(aTagItem).attr("produceDate");
                var validDate = $(aTagItem).attr("validDate");
                var inspectReportURL = $(aTagItem).attr('inspectReportURL');
                orTemp.push(goodsId);
                orTemp.push(batchNum);
                orTemp.push(batchQty);
                orTemp.push(OriginbatchQty);
                orTemp.push(produceDate);
                orTemp.push(validDate);
                orTemp.push(drugESC);
                orTemp.push(inspectReportURL);
                temp.batchDatas.push(orTemp);
            });
            data.goodsArr.push(temp);
        });
        if (data.goodsArr.length == 0) {
            artDialogAlertModal("请先填写完整退货的数据");
            return;
        }
        $.ajax({
            data: data,
            url: '/customer/return/newpending',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                artDialogAlertModal(feedback.msg, function () {
                    window.location.href = '/customer/return';
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });


    //在退货待审核的时候商家端查看退货单点击确认
    $(document).delegate('a[id^=clientDisplayReturnShipInfo_]', 'click', function () {
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


    //商户端查看客户退货申请点击确认
    $(document).delegate('#customerReturnApplyReceiveItem', 'click', function () {
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
    //客户查看商家退货发货信息
    $(document).delegate('a[id^=customerDisplayReturnShipInfo_]', 'click', function () {
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
                "<a target='_blank' href='"+ inspectReportURL[i] +"'><img src='" + inspectReportURL[i] + "'>" +
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

    //商户端查看退货发货信息_____
    $(document).delegate('a[id^=displayReturnShipInfo_]', 'click', function () {
        clearDialog();
        var self = $(this);
        var goodsId = self.attr("goodsId");
        var selectGoods = $("#selectGoods");
        var batchNum = self.attr("batchNum");
        var batchQty = self.attr("batchQty");
        var produceDate = self.attr("produceDate");
        var drugESC = self.attr("drugESC");
        var validDate = self.attr("validDate");
        var otherreturnQuantity = 0;
        var siblingsDiv = self.closest(".ship-operator").siblings(".ship-operator");
        _.each(siblingsDiv, function (item) {
            var qty = Number($(item).find("#batchShipNum").text().trim());
            otherreturnQuantity = otherreturnQuantity + qty;
        });
        var hiddenInput = $("#maxReceivedNum_" + goodsId);
        var returnTotalNum = hiddenInput.val();
        var batchname = self.closest(".ship-operator").attr("name");
        selectGoods.attr("batchname", batchname);
        selectGoods.attr("shipqty", self.attr("shipqty"));
        selectGoods.attr("goodsid", goodsId);
        selectGoods.attr("returnTotalNum", returnTotalNum);
        selectGoods.attr("otherreturnQuantity", otherreturnQuantity);
        $('.inputBatchNum').val(batchNum);
        $('.inputQuantity').val(batchQty);
        $('.inputGoodsProduceDate').val(produceDate);
        $('.inputGoodsValidDate').val(validDate);
        $('.inputDrugESC').val(drugESC);
        $("#lgNum").text(hiddenInput.attr("largePackNum"));
        $("#lgUnit").text(hiddenInput.attr("largePackUnit"));
        $("#midNum").text(hiddenInput.attr("middlePackNum"));
        $("#midUnit").text(hiddenInput.attr("middlePackUnit"));
        var inspectReportURL = self.attr("inspectReportURL").split(",");
        var str = "";
        for (var i = 0; i < inspectReportURL.length; i++) {
            str += "<li><div class='fileClass'>" +
                "<a target='_blank' href='"+ inspectReportURL[i] +"'><img src='" + inspectReportURL[i] + "'>" +
                "</div></li>";
        }
        var fileContainer = $(".fileContainer");
        var formsignin = $(".form-signin");
        fileContainer.find("ul").append(str);
        formsignin.css("display", "block");
        formsignin.siblings("span").css("display", "none");
        hoverText($('.fileClass'), '点击看大图');
        displayDialog("selectGoods");
    });

    //商户端弹出窗口点击确认
    $(document).delegate('#customerConfirmReturnItem', 'click', function () {
        var selectGoods = $("#selectGoods");
        var data = {};
        var goodsId = Number(selectGoods.attr("goodsId"));
        var shipqty = Number(selectGoods.attr("shipqty"));
        var batchname = selectGoods.attr("batchname");
        var returnTotalNum = selectGoods.attr("returnTotalNum");
        var otherreturnQuantity = Number(selectGoods.attr("otherreturnQuantity"));
        data.receivedQuantity = Number($('.inputQuantity').val());
        data.drugESC = $('.inputDrugESC').val();
        if (Number(data.receivedQuantity) > Number(shipqty)) {
            artDialogAlertModal("实际验收数量已超出最大允许验收数量");
            return;
        }
        var batchDiv = $("div[name=" + batchname + "]");
        batchDiv.find("span[name=quantity]").text(data.receivedQuantity);
        batchDiv.find("a").attr("batchQty", data.receivedQuantity);
        batchDiv.find("a").attr("drugESC", data.drugESC);
        var sum = otherreturnQuantity + data.receivedQuantity;
        var receivedQtyInput = batchDiv.closest("td").siblings("td[id=receivedQty_" + goodsId + "]");
        if (sum != returnTotalNum) {
            receivedQtyInput.removeClass("font-green");
            receivedQtyInput.addClass("font-orange");
        } else if (sum == returnTotalNum) {
            receivedQtyInput.removeClass("font-orange");
            receivedQtyInput.addClass("font-green");
        }
        receivedQtyInput.text(sum);
        $(".fadeDiv").css('display', 'none');
        selectGoods.css('display', 'none');
    });

    //商户退货收货确认_____start
    //提交退货收货确认数据
    $(document).delegate('#btnConfirmReturnDelivered', 'click', function () {
        var element = $(this);
        artDialogAlertModalTitle("温馨提示", "您确定要执行入库吗？", function () {
            var returnId = element.attr("returnId");
            var clientId = element.attr("data-clientId");
            var displayReturnId = element.attr("data-displayId");
            var remark = $("#returnDeliveredRemark").val();
            var data = {};
            data.goodsArr=[];
            $('tr[id^=returnDeliverd_]').each(function () {
                var temp = {};
                var element = $(this);
                var goodsId = Number(element.attr('goodsId'));
                var soldPrice = element.attr('soldPrice');
                temp.goodsId = goodsId;
                temp.approvedQuantity= Number(element.find('td[class^=approvedQuantity_]').text().trim());
                temp.returnShippedQuantity= Number(element.find('td[class^=returnShippedQuantity_]').text().trim());
                temp.receiveShippedQuantity= Number(element.find('td[class^=receiveShippedQuantity_]').text().trim());
                temp.price = soldPrice;
                temp.batchDatas = [];
                var aTags = element.find("div[name^='batch_']").find("a");
                _.each(aTags, function (aTagItem) {
                    var orTemp = [];
                    var batchNum = $(aTagItem).attr("batchNum");
                    var goodsId = Number($(aTagItem).attr("goodsId"));
                    var batchQty = Number($(aTagItem).attr("batchQty"));
                    var OriginbatchQty = Number($(aTagItem).attr("OriginbatchQty"));
                    var drugESC = $(aTagItem).attr("drugESC");
                    var produceDate = $(aTagItem).attr("produceDate");
                    var validDate = $(aTagItem).attr("validDate");
                    var inspectReportURL = $(aTagItem).attr('inspectReportURL');
                    orTemp.push(goodsId);
                    orTemp.push(batchNum);
                    orTemp.push(batchQty);
                    orTemp.push(OriginbatchQty);
                    orTemp.push(produceDate);
                    orTemp.push(validDate);
                    orTemp.push(drugESC);
                    orTemp.push(inspectReportURL);
                    temp.batchDatas.push(orTemp);
                });
                data.goodsArr.push(temp);
            });
            data.returnId = returnId;
            data.displayReturnId = displayReturnId;
            data.clientId = clientId;
            data.orderId=typeof($('#hiddenShipAndOrder').attr('orderId'))=='undefined'?-1:($('#hiddenShipAndOrder').attr('orderId'));
            data.shipId=typeof($('#hiddenShipAndOrder').attr('shipId'))=='undefined'?-1:($('#hiddenShipAndOrder').attr('shipId'));
            data.remark = remark;





            $.ajax({
                data: data,
                url: '/customer/return/delivered',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == 200) {
                        artDialogAlertModal(feedback.msg, function () {
                            window.location.href = "/customer/return";
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

    //商户审核退货申请
    $(document).delegate('#checkReturnBtn', 'click', function () {
        var data = {};
        data.returnId = $(this).attr("returnId");
        data['customerReply'] = $('#customerReply').val();
        var approvedItems = [];
        var invalid = false;
        $('.good-info').each(function () {
            var element = $(this);
            var approvedItem = [];
            var goodsId = Number(element.attr("data-goodsid"));
            var quantity = Number(element.find('.approvedReturnQuantity').val());
            var shippedQty = Number(element.find('.RPshippedQty').text());
            if (quantity < 0 || quantity > shippedQty) {
                artDialogAlertModal("退货数量不可超出申退数量或为负");
                invalid = true;
                return false;
            }
            if (quantity != shippedQty && data['customerReply'] == "") {
                artDialogAlertModal("可退数量与申退数量不一致，请输入原因");
                invalid = true;
                return false;
            }
            approvedItem.push(goodsId);
            approvedItem.push(quantity);
            approvedItems.push(approvedItem);
        });
        data.goodsArr = approvedItems;
        if (invalid) {
            return false;
        }
        $.ajax({
            data: data,
            url: "/customer/return/pending",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == 200) {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = "/customer/return/detail?returnId=" + feedback.data.returnId;
                    });
                } else {
                    artDialogAlertModal(feedback.msg);
                }

            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    }); //客户查看商家发货信息
    $(document).delegate('a[id^=clientDisplayReturnInfo_]', 'click', function () {
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
        $('.inputBatchNum').val(batchNum);
        $('.inputQuantity').val(batchQty);
        $('.inputGoodsProduceDate').val(produceDate);
        $('.inputGoodsValidDate').val(validDate);
        $('.inputDrugESC').val(drugESC);
        var str = "";
        for (var i = 0; i < inspectReportURL.length; i++) {
            str += "<li><div class='fileClass'>" +
                "<a target='_blank' href='"+ inspectReportURL[i] +"'><img src='" + inspectReportURL[i] + "'>" +
                "</div></li>";
        }
        var fileContainer = $(".fileContainer");
        var formsignin = $(".form-signin");
        fileContainer.find("ul").append(str);
        formsignin.css("display", "block");
        formsignin.siblings("span").css("display", "none");
        hoverText($('.fileClass'), '点击看大图');
        displayDialog("selectGoods");
    });
});