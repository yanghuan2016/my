/**
 * 拒收记录
 */
$(function () {
    $(document).delegate("#confirmRejectItem", "click", function () {
        var selectGoods = $("#selectGoods");
        var data = {};
        var goodsId = Number(selectGoods.attr("goodsId"));
        var applyRejectBatchQty = Number(selectGoods.attr("applyRejectBatchQty"));
        var batchName = selectGoods.attr("batchName");
        var currentRefuseTotal = Number(selectGoods.attr("currentRefuseTotal"));
        var otherRejectQuantity = Number(selectGoods.attr("otherRejectQuantity"));
        data.receivedQuantity = Number($('.inputQuantity').val());
        data.drugESC = $('.inputDrugESC').val();
        if (Number(data.receivedQuantity) > Number(applyRejectBatchQty)) {
            artDialogAlertModal("实际拒收数量已超出最大允许拒收数量");
            return;
        }
        var sum = Number(otherRejectQuantity + data.receivedQuantity);
        var currentRefuseShipTotalNum = $("#currentRefuseShipTotalNum_" + goodsId);
        if (sum <= currentRefuseTotal) {
            currentRefuseShipTotalNum.text(sum);
            var batchDiv = $("div[name=" + batchName + "]");
            batchDiv.find("span[name=quantity]").text(data.receivedQuantity);
            batchDiv.find("a").attr("currentbatchqty", data.receivedQuantity);
            batchDiv.find("a").attr("drugESC", data.drugESC);
            if (sum != currentRefuseTotal) {
                currentRefuseShipTotalNum.removeClass("font-green");
                currentRefuseShipTotalNum.addClass("font-orange");
            } else if (sum == currentRefuseTotal) {
                currentRefuseShipTotalNum.removeClass("font-orange");
                currentRefuseShipTotalNum.addClass("font-green");
            }
            $(".fadeDiv").css('display', 'none');
            selectGoods.css('display', 'none');
        } else {
            artDialogAlertModal("实际拒收数量已超出最大允许拒收数量");
            return false;
        }
    });

    /**
     * 弹出拒收发货弹出框
     */
    $(document).delegate("a[id^=clientDisplayRejectInfo_]", "click", function () {
        clearDialog();
        var self = $(this);
        var selectGoods = $("#selectGoods");
        var otherRejectQuantity = 0;
        var batchName = self.closest(".ship-operator").attr("name");
        var applyRejectBatchQty = Number(self.attr("applyrejectbatchqty").trim());
        var currentRefuseTotal = Number(self.attr("currentrefuseshiptotal").trim());
        var siblingsDiv = self.closest(".ship-operator").siblings(".ship-operator");
        _.each(siblingsDiv, function (item) {
            var qty = Number($(item).find("span[name='quantity']").text().trim());
            otherRejectQuantity = otherRejectQuantity + qty;
        });
        var goodsId = self.attr("goodsid");
        var packInput = $(".maxReceivedNum_" + goodsId);
        var inputQuantitySelect = $('.inputQuantity');
        selectGoods.attr("goodsId", goodsId);
        selectGoods.attr("applyRejectBatchQty", applyRejectBatchQty);
        selectGoods.attr("currentRefuseTotal", currentRefuseTotal);
        selectGoods.attr("batchName", batchName);
        selectGoods.attr("otherRejectQuantity", otherRejectQuantity);
        var batchNum = self.attr("batchnum");
        var batchQty = self.attr("currentbatchqty");
        var produceDate = self.attr("produceDate");
        var drugESC = self.attr("drugESC");
        var validDate = self.attr("validDate");
        var inspectReportURL = self.attr("inspectReportURL").split(",");
        var fileContainer = $(".fileContainer");
        var formSignin = $(".form-signin");
        if (batchNum != undefined) {
            $('.inputBatchNum').val(batchNum);
            inputQuantitySelect.val(batchQty);
            $('.inputGoodsProduceDate').val(produceDate);
            $('.inputGoodsValidDate').val(validDate);
            $('.inputDrugESC').val(drugESC);
            $('#lgNum').text(packInput.attr("largePackNum"));
            $('#lgUnit').text(packInput.attr("largePackUnit"));
            $('#midNum').text(packInput.attr("middlePackNum"));
            $('#midUnit').text(packInput.attr("middlePackUnit"));
            var temp = {
                middle: packInput.attr("largePackNum"),
                large: packInput.attr("middlePackNum")
            };
            inputQuantitySelect.attr("data", JSON.stringify(temp));
            fileContainer.find("ul").find("li").remove();
            if (inspectReportURL != "" && inspectReportURL != "undefined") {
                var str = "";
                for (var i = 0; i < inspectReportURL.length; i++) {
                    str += "<li><div class='fileClass'><img src=" + inspectReportURL[i] + "></img></div></li>";
                }
                fileContainer.find("ul").append(str);
                formSignin.css("display", "block");
                formSignin.siblings("span").css("display", "none");
            } else {
                $(".fileClass").find("img").remove();
                formSignin.css("display", "none");
                formSignin.siblings("span").css("display", "block");
            }
        }
        displayDialog("selectGoods");
    });

    $(document).delegate('#refuseSend', 'click', function () {
        var iframe = $("iframe[name=picture]");
        var selectGoods = $("#selectGoods");
        var type = iframe.siblings("button").attr("data-update");
        if (type == "true") {
            var d = dialog({
                content: '图片修改以后一定要点击上传才可生效',
                align: 'top left',
                quickClose: false
            });
            d.show();
            setTimeout(function () {
                d.close().remove();
            }, 1000);
            return;
        }
        var trs = $("tr[id^=batch_goods_]");
        var self = $(this);
        var inputLogisticsCompanySelect = $("#inputLogisticsCompany");
        var inputLogisticsNoSelect = $("#inputLogisticsNo");
        var shipRemarkSelect = $("#shipRemark");
        var data = {};
        data.orderId = self.attr("orderId");
        data.rejectId = self.attr("rejectId");
        data.logisticsCompany = inputLogisticsCompanySelect.val();
        data.logisticsNo = inputLogisticsNoSelect.val();
        data.remark = shipRemarkSelect.val();
        data.rejectImg = getUploadImg();
        data.shipData = [];
        if (data.logisticsCompany == "") {
            inputLogisticsCompanySelect.attr("placeholder", "物流公司不能为空");
            inputLogisticsCompanySelect.focus();
            return false;
        }
        if (data.logisticsNo == "") {
            inputLogisticsNoSelect.attr("placeholder", "物流单号不能为空");
            inputLogisticsNoSelect.focus();
            return false;
        }
        if (data.remark == "") {
            shipRemarkSelect.attr("placeholder", "拒收备注不能为空");
            shipRemarkSelect.focus();
            return false;
        }
        _.each(trs, function (item) {
            var element = {};
            element.rejectShippedQuantitySum = Number($(item).find("label[id^=currentRefuseShipTotalNum]").text().trim());
            element.goodsNotSendRefundQuantity = Number(Number($(item).find("label[id^=totalRefuseNum]").text())-Number($(item).find("label[id^=currentRefuseShipTotalNum]").text().trim()));
            element.batchDatas = [];
            var batches = $(item).find("a[id^=clientDisplayRejectInfo]");
            _.each(batches, function (ele) {
                element.goodsId = $(ele).attr("goodsid");
                var temp = [];
                temp.push($(ele).attr("batchnum"));
                temp.push($(ele).attr("currentbatchqty"));
                temp.push($(ele).attr("drugesc"));
                element.batchDatas.push(temp);
            });
            data.shipData.push(element);
        });
        $.ajax({
            type: 'post',
            url: '/order/refuse/ship',
            data: data,
            success: function (feedback) {
                if (feedback.status == 200) {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = "/order/refuse?type=receive";
                    });
                } else {
                    artDialogAlertModal(feedback.msg);
                }
            }
        });
    });
});