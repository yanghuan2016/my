$(function () {

    //新增退货发货信息
    $(document).delegate('#displayAddReturnItem', 'click', function () {
        clearDialog();
        var self = $(this);
        var goodsId = self.attr("goodsid");
        var length = $("div[name^=template_" + goodsId).length;
        if (length >= 5) {
            artDialogAlert("最多只能添加五条批次信息");
            return;
        }
        var selectGoods = $('#selectGoods');
        var otherreturnQuantity = 0;
        var otherShipBatchNum = [];
        var siblingsDiv = self.closest("div").siblings(".ship-operator");
        _.each(siblingsDiv, function (item) {
            var qty = Number($(item).find("#batchShipNum").text().trim());
            otherreturnQuantity = otherreturnQuantity + qty;
        });
        _.each(siblingsDiv, function (item) {
            otherShipBatchNum.push($(item).find("#batchNum").text().trim());
        });
        var returnTotalNum = Number($("#returnTotalNum_" + goodsId).text());
        selectGoods.attr("goodsid", goodsId);
        selectGoods.attr("returnTotalNum", returnTotalNum);
        selectGoods.attr("action", "ADD");
        selectGoods.attr("otherreturnQuantity", otherreturnQuantity);
        selectGoods.attr("otherShipBatchNum", otherShipBatchNum);
        var element = $('#maxFinalReturnNum_' + goodsId);
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

    //客户退货 发货 修改批次
    $(document).delegate('a[id^=clientDeliverReturnInfo_]','click',function(){

        clearDialog();
        var self = $(this);
        var selectGoods = $("#selectGoods");

        var otherreturnQuantity = 0;
        var otherShipBatchNum = [];
        var siblingsDiv = self.closest(".ship-operator").siblings(".ship-operator");
        _.each(siblingsDiv, function (item) {
            var qty = Number($(item).find('span[name="quantity"]').text().trim());
            otherreturnQuantity = otherreturnQuantity + qty;
        });
        _.each(siblingsDiv, function (item) {
            otherShipBatchNum.push($(item).find(".batchNumber").text().trim());
        });



        var goodsId = self.attr("goodsid");
        var returnTotalNum = $("#maxReceivedNum_" + goodsId).attr('approvedquantity');
        selectGoods.attr("goodsid", goodsId);
        selectGoods.attr("returnTotalNum", returnTotalNum);
        selectGoods.attr("action", "MODIFY");
        selectGoods.attr("otherreturnQuantity", otherreturnQuantity);
        selectGoods.attr("returnTotalNum", returnTotalNum);
        selectGoods.attr("otherShipBatchNum", otherShipBatchNum);
        var element = $('#maxReceivedNum_' + goodsId);
        $("#lgNum").text(element.attr("largePackNum"));
        $("#lgUnit").text(element.attr("largePackUnit"));
        $("#midNum").text(element.attr("middlePackNum"));
        $("#midUnit").text(element.attr("middlePackUnit"));

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
                "<a target='_blank' href='"+ inspectReportURL[i] +"'><img src='" + inspectReportURL[i] + "'></img>" +
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


    //discard
    $(document).delegate("a[id^=modifyReturnItem_]", 'click', function () {
        clearDialog();
        var self = $(this);
        var inputBatchNum = $('.inputBatchNum');
        var inputGoodsProduceDate = $('.inputGoodsProduceDate');
        var inputGoodsValidDate = $('.inputGoodsValidDate');
        var inputQuantity = $('.inputQuantity');
        var inputDrugESC = $('.inputDrugESC');
        var selectGoods = $('#selectGoods');

        var otherreturnQuantity = 0;
        var otherShipBatchNum = [];
        var siblingsDiv = self.closest(".ship-operator").siblings(".ship-operator");
        _.each(siblingsDiv, function (item) {
            var qty = Number($(item).find("#batchShipNum").text().trim());
            otherreturnQuantity = otherreturnQuantity + qty;
        });
        _.each(siblingsDiv, function (item) {
            otherShipBatchNum.push($(item).find("#batchNum").text().trim());
        });

        var goodsId = self.attr("goodsid");
        var returnTotalNum = $("#returnTotalNum_" + goodsId).text();
        selectGoods.attr("goodsid", goodsId);
        selectGoods.attr("returnTotalNum", returnTotalNum);
        selectGoods.attr("action", "MODIFY");
        selectGoods.attr("otherreturnQuantity", otherreturnQuantity);
        selectGoods.attr("returnTotalNum", returnTotalNum);
        selectGoods.attr("otherShipBatchNum", otherShipBatchNum);
        var element = $('#maxFinalReturnNum_' + goodsId);
        $("#lgNum").text(element.attr("largePackNum"));
        $("#lgUnit").text(element.attr("largePackUnit"));
        $("#midNum").text(element.attr("middlePackNum"));
        $("#midUnit").text(element.attr("middlePackUnit"));
        var inspectReportURL = self.attr("inspectReportURL").split(",");
        inputBatchNum.val(self.attr("batchNum"));
        inputQuantity.val(self.attr("batchQty"));
        inputGoodsProduceDate.val(self.attr("produceDate"));
        inputGoodsValidDate.val(self.attr("validDate"));
        inputDrugESC.val(self.attr("drugESC"));
        var str = "";
        for (var i = 0; i < inspectReportURL.length; i++) {
            str += "<li class='oldImg'><div class='fileClass'>" +
                "<img src=" + inspectReportURL[i] + "/>" +
                "<a class='removeimg'><i class='fa fa-times-circle-o'></i></a>" +
                "</div></li>";
        }
        var fileContainer = $(".fileContainer");
        var formsignin = $(".form-signin");
        fileContainer.find("ul").find("li").eq(0).before(str);
        formsignin.css("display", "block");
        formsignin.siblings("span").css("display", "none");
        displayDialog("selectGoods");
    });

    //确认退货信息
    $(document).delegate('#confirmReturnItem', 'click', function () {
        var iframe = $("iframe[name=picture]");
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
        var data = {};
        var selectGoods = $('#selectGoods');
        var goodsId = selectGoods.attr("goodsid");
        var otherreturnquantity = Number(selectGoods.attr("otherreturnquantity"));
        var otherShipBatchNum = selectGoods.attr("otherShipBatchNum").split(",");
        var returnTotalNum = Number(selectGoods.attr("returnTotalNum"));

        data.batchNum = $('.inputBatchNum').val();
        data.goodsProduceDate = $('.inputGoodsProduceDate').val();
        data.goodsValidDate = $('.inputGoodsValidDate').val();
        data.inputQuantity = Number($('.inputQuantity').val());
        data.drugESC = $('.inputDrugESC').val();
        data.inspectReportURL = getUploadImg();

        if (validateBatchNum(data.batchNum) &&
            validateGoodsProduceDate(data.goodsProduceDate) &&
            validateGoodsValidDate(data.goodsValidDate) &&
            validateInputQuantity(data.inputQuantity) &&
            validateDrugESC(data.drugESC)) {
            if (otherShipBatchNum.indexOf(data.batchNum) > -1) {
                artDialogAlertModal("批次号不能与本次发货商品其他批次号相同");
                return false;
            }
            var sum = Number(otherreturnquantity + data.inputQuantity);
            var filnalReturnQty = $("#receivedQty_" + goodsId);
            if (sum > Number(returnTotalNum)) {
                artDialogAlertModal("实退数量已超出可退数量");
                return;
            }
            if (sum != returnTotalNum) {
                filnalReturnQty.removeClass("font-green");
                filnalReturnQty.addClass("font-orange");
            } else if (sum == returnTotalNum) {
                filnalReturnQty.removeClass("font-orange");
                filnalReturnQty.addClass("font-green");
            }
            filnalReturnQty.text(sum);
            var action = selectGoods.attr("action");
            if (action == "ADD") {
                var template = $("#template");
                var newShipInfoDiv = template.clone(true);
                newShipInfoDiv.css("display", "flex");
                newShipInfoDiv.attr("name", "template_" + goodsId + "_" + data.batchNum);
                newShipInfoDiv.attr("id", "");
                var modify = newShipInfoDiv.find("div").eq(1).find("a").eq(0).attr("id", "modifyReturnItem_" + goodsId);
                newShipInfoDiv.find("#batchNum").text(data.batchNum);
                newShipInfoDiv.find("#batchShipNum").text(data.inputQuantity);
                modify.attr("goodsid", goodsId);
                modify.attr("batchNum", data.batchNum);
                modify.attr("batchQty", data.inputQuantity);
                modify.attr("produceDate", data.goodsProduceDate);
                modify.attr("validDate", data.goodsValidDate);
                modify.attr("drugESC", data.drugESC);
                modify.attr("inspectReportURL", data.inspectReportURL);
                $('#collapse_' + goodsId).before(newShipInfoDiv);
            } else if (action == "MODIFY") {
                var modifyDiv = $("div[name=batch_" + goodsId + "_" + data.batchNum + "]");
                modifyDiv.find(".batchNumber").text(data.batchNum);
                modifyDiv.find('span[name="quantity"]').text(data.inputQuantity);
                var modifyTemp = modifyDiv.find("div").eq(1).find("a").eq(0);
                modifyTemp.attr("goodsid", goodsId);
                modifyTemp.attr("batchNum", data.batchNum);
                modifyTemp.attr("batchQty", data.inputQuantity);
                modifyTemp.attr("produceDate", data.goodsProduceDate);
                modifyTemp.attr("validDate", data.goodsValidDate);
                modifyTemp.attr("drugESC", data.drugESC);
            }
            $(".fadeDiv").css('display', 'none');
            selectGoods.css('display', 'none');
        }
    });
    // 提交退货信息
    $(document).delegate('.confirmReturnShip', 'click', function () {
        var element = $(this);
        artDialogAlertModalTitle("温馨提示", "您确定要退货吗？", function () {



            if(ValidateNullOrEmpty( $("#inputLogisticsCompany").val())||ValidateNullOrEmpty($("#inputLogisticsNo").val())){
                artDialogAlertModal('请填写完整的物流信息');
                return;
            }

            var returnId = element.attr("returnId");
            var returnDisplayId = element.attr("returnDisplayId");
            var data = {};
            data.goodsArr=[];
            $("tr[name^='goodsItem']").each(function () {
                var temp = {};
                var element = $(this);
                var goodsId = Number(element.attr('goodsId'));
                var soldPrice = element.attr('soldPrice');
                temp.goodsId = goodsId;
                temp. allowQuantity= Number(element.find('input[id^=maxReceivedNum_]').attr('approvedquantity')); //approvedQuantity
                temp. returnQuantity=Number(element.find('td').eq(5).html().trim()); //returnShippedQuantity
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


            data.returnId = returnId;
            data.returnDisplayId = returnDisplayId;
            data.logisticsCompany = $("#inputLogisticsCompany").val().trim();
            data.logisticsNo = $("#inputLogisticsNo").val().trim();
            data.orderId=typeof($('#hiddenShipAndOrder').attr('orderId'))=='undefined'?-1:($('#hiddenShipAndOrder').attr('orderId'));
            data.shipId=typeof($('#hiddenShipAndOrder').attr('shipId'))=='undefined'?-1:($('#hiddenShipAndOrder').attr('shipId'));
            data.remark = $("#returnShipRemark").val().trim();


            $.ajax({
                data: data,
                url: '/order/return/ship',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == 200) {
                        artDialogAlertModal(feedback.msg, function () {
                            window.location.href = "/order/return";
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

    //客户查看商家发货信息
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
                "<a target='_blank' href='"+ inspectReportURL[i] +"'><img src='" + inspectReportURL[i] + "'></img>" +
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
    //客户查看退货发货信息_____
    $(document).delegate('.displayReturnShipInfo', 'click', function () {
        var self = $(this);
        var selectGoods = $("#selectGoods");
        var batchNum = self.attr("batchNum");
        var batchQty = self.attr("batchQty");
        var produceDate = self.attr("produceDate");
        var drugESC = self.attr("drugESC");
        var validDate = self.attr("validDate");
        var inspectReportURL = self.attr("inspectReportURL").split(",");
        if (batchNum != undefined) {
            $('.inputBatchNum').val(batchNum);
            $('.inputQuantity').val(batchQty);
            $('.inputGoodsProduceDate').val(produceDate);
            $('.inputGoodsValidDate').val(validDate);
            $('.inputDrugESC').val(drugESC);
            selectGoods.find("ul").find("li").remove();
            var formsignin = $("#form-signin");
            if (inspectReportURL != "" && inspectReportURL != "undefined") {
                var str = "";
                for (var i = 0; i < inspectReportURL.length; i++) {
                    str += "<li><div class='fileClass'><img src=" + inspectReportURL[i] + "></img></div></li>";
                }
                $(".fileContainer").find("ul").append(str);
                formsignin.css("display", "block");
                formsignin.siblings("span").css("display", "none");
            } else {
                $(".fileClass").find("img").remove();
                formsignin.css("display", "none");
                formsignin.siblings("span").css("display", "block");
            }
        }
        displayDialog("selectGoods");
    });

    //添加商品到退货单
    $(document).delegate("#addProductToReturnOrder", "click", function () {
        var parent = $(window.parent.document).contents();
        var tr = parent.find("tr[id^=product_item_]");
        var IDS = _.map(tr, function (item) {
            var ID = $(item).attr("goodsId");
            if (ID) {
                return ID;
            }
        });
        var index = 1;
        _.each($(".icheckbox"), function (item) {
            var _self = $(item);
            var input = _self.find("input");
            var goodsId = input.attr("goodsId");
            var goodsNo = input.attr("goodsNo");
            var imageUrl = input.attr("imageUrl");
            var commonName = input.attr("commonName");
            var alias = input.attr("alias");
            var birthPlace = input.attr("birthPlace");
            var spec = input.attr("spec");
            if (_self.hasClass("checked") && goodsId && goodsNo) {
                if (IDS.indexOf(goodsId) == -1) {
                    var template = parent.find("tr[name='ItemTemplate']").clone(true);
                    template.attr("goodsId", goodsId);
                    template.find(".goods-img").find("img").attr("src", imageUrl);
                    var a = "<a href='/goods/detail?goodsId=" + goodsId + "'>" + commonName + (alias ? "(" + alias + ")" : "");
                    template.find("h6[name='commonName']").html(a);
                    template.find("h6[name='birthPlace']").text(birthPlace);
                    template.find("h6[name='spec']").text(spec);
                    template.find("td[name='goodsNo']").text(goodsNo);
                    template.find("td:last-child").find("a").attr("id", "deleteCurrentProduct_" + goodsId);
                    template.find("input[name='applyQuantity']").val("1");
                    template.find("input[name='applyQuantity']").attr("id", "quantity_" + index);
                    template.attr("name", "");
                    template.attr("id", "product_item_" + goodsId);
                    template.css("display", "");
                    parent.find("tr[name='ItemTemplate']").before(template);
                    index++;
                }
            }
        })
        $('.closeIframeGuide').trigger('click');
    });
    //删除当前的商品
    $(document).delegate("a[id^=deleteCurrentProduct_]", "click", function () {
        $(this).closest("tr").remove();
    });
    //提交退货申请商品
    /*$(document).delegate("#submitReturnInfo", "click", function () {
        var tr = $("tr[id^=product_item_]");
        var data = {};
        data.goodsArr = [];
        var flag = false;
        _.map(tr, function (item) {
            if (isNaN($(item).find("input[name=applyQuantity]").val())) {
                flag = true;
            }
            var temp = [];
            temp.push($(item).attr("goodsid"));
            temp.push(Number($(item).find("input[name=applyQuantity]").val()));
            temp.push($(item).find("input[name=goodsRemark]").val());
            data.goodsArr.push(temp);
        });
        if (flag) {
            artDialogAlertModal("退货数量必须是数字");
            return false;
        }
        data.remark = $("input[name=addReturnRemark]").val().trim();
        $.ajax({
            url: '/order/returnInfo/add',
            type: 'post',
            data: data,
            success: function (feedback) {
                artDialogAlertModal(feedback.msg, function () {
                    window.location.href = "/order/return";
                });
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                artDialogAlertModal(textStatus + ":" + errorThrown);
            }
        });
    });*/

    //提交退货申请数据
    $(document).delegate('#submitReturnInfo', 'click', function () {
        var remark = $("#returnApplyRemark").val();
        var data = {
            shipId: -1,
            orderId: -1,
            remark: remark,
            goodsArr: []
        };
        $("tr[name^='shipItem_']").each(function () {
            var temp = {};
            var element = $(this);
            var goodsId = Number(element.attr('goodsId'));
            temp.goodsId = goodsId;
            temp.applyQuantity = element.find("td[name=shippedNum]").find("label").text();
            temp.price = element.find("#price").val();
            temp.batchDatas = [];
            var td = element.find("div[name^='template_']");
            _.each(td, function (item) {
                var aTags = $(item).find("a");
                _.each(aTags, function (aTagItem) {
                    var orTemp = [];
                    var batchNum = $(aTagItem).attr("batchNum");
                    var batchQty = Number($(aTagItem).attr("batchqty"));
                    var drugESC = $(aTagItem).attr("drugesc");
                    var produceDate = $(aTagItem).attr("producedate");
                    var validDate = $(aTagItem).attr("validdate");
                    var inspectReportURL = $(aTagItem).attr('inspectreporturl');
                    orTemp.push(goodsId);
                    orTemp.push(batchNum);
                    orTemp.push(batchQty);
                    orTemp.push(produceDate);
                    orTemp.push(validDate);
                    orTemp.push(drugESC);
                    orTemp.push(inspectReportURL);
                    temp.batchDatas.push(orTemp);
                    data.goodsArr.push(temp);
                });
            });
        });
        if (data.goodsArr.length == 0) {
            artDialogAlertModal("请先填写完整退货的数据");
            return;
        }
        /*　TODO  */
        alert("需要在script/client/return.js下面添加post的路由450行");
        return;
        $.ajax({
            url: '/order/returnInfo/add',
            type: 'post',
            data: data,
            success: function (feedback) {
                artDialogAlertModal(feedback.msg, function () {
                    window.location.href = "/order/return";
                });
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                artDialogAlertModal(textStatus + ":" + errorThrown);
            }
        });
    });

    $(document).delegate('.cancelReturnDialog', 'click', function () {
        var element = $(this);
        artDialogAlertModalTitle("温馨提示", "您确定要取消此次退货申请吗？", function () {
            var returnId = element.attr("returnId");
            var data = {
                returnId: returnId
            };
            $.ajax({
                data: data,
                url: '/order/return/close',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == 200) {
                        artDialogAlertModal("退货已取消", function(){
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