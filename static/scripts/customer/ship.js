$(function () {

    //商户端新增发货批次信息
    $(document).delegate('.customerAddShipItemBatchInfo', 'click', function () {
        clearDialog();
        var otherShipBatchNum = [];
        var goodsId = $(this).attr("goodsid");
        var length = $("div[name^=template_" + goodsId).length;
        if (length >= 5) {
            artDialogAlert("最多只能添加五条批次信息");
            return;
        }
        var siblingsDiv = $(this).closest("div").siblings("div[name^=template_" + goodsId + "]");
        _.each(siblingsDiv, function (item) {
            otherShipBatchNum.push($(item).find("#batchNum").text().trim());
        });
        var  otherreturnQuantity=undefined;
        if(siblingsDiv.length!=0){
            otherreturnQuantity=0;
        }
        _.each(siblingsDiv, function (item) {
            var qty = Number($(item).find("#batchShipNum").text().trim());
            otherreturnQuantity = otherreturnQuantity + qty;
        });

        var selectGoods = $("#selectGoods");
        selectGoods.attr("otherreturnQuantity", otherreturnQuantity);
        //显示包装单位用
        var shippedNum = $('.shippedNum_' + goodsId).text();
        selectGoods.attr("goodsid", goodsId);
        selectGoods.attr("shippedNum", shippedNum);
        selectGoods.attr("orderNum", $(this).closest('tr').find('span[name="quantity"]').html());
        selectGoods.attr("otherShipBatchNum", otherShipBatchNum);
        selectGoods.attr("action", "ADD");
        var element = $('.maxShipNum_' + goodsId);
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
    //商家添加发货信息___end

    //商户查看发货信息
    $(document).delegate('a[id^=customerDisplayShipInfo_]', 'click', function () {
        clearDialog();
        var self = $(this);
        var selectGoods = $("#selectGoods");
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
                "<a target='_blank' href='"+ inspectReportURL[i] +"'><img src='" + inspectReportURL[i] + "'></img></a>" +
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


    //客户端提交确认收货
    $(document).delegate('#smClientConfirmReceived', 'click', function () {
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
                var shipBatchQty = Number($(aTagItem).attr("batchQty"));
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
        artDialogAlertModalTitle("温馨提示", "是否确认收货？", function () {
            data.isReject = false;
            $.ajax({
                data: data,
                url: '/order/ship/update',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == 200) {
                        artDialogAlertModal(feedback.msg, function () {
                            window.location.reload();
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
});