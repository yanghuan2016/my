$(function () {

    //客户添加退货发货信息_____start
    $(document).delegate('.displayReturnShipSelect', 'click', function () {
        //显示包装单位用
        var goodsId = $(this).attr("goodsid");
        var batchlist = $(this).attr("data-batch");
        var selectGoods = $("#selectGoods");
        var inputBatchNum = $(".inputBatchNum");
        var optionList = "";
        batchlist.split(",").forEach(function (item) {
            optionList += "<option value='" + item + "'>" + item + "</option>"
        });
        inputBatchNum.find("option").remove();
        inputBatchNum.append(optionList);
        var finalReturnQty = $('.finalReturnQty_' + goodsId).text();
        selectGoods.attr("goodsid", goodsId);
        selectGoods.attr("finalReturnQty", finalReturnQty);
        var element = $('.maxFinalReturnNum_' + goodsId);
        var largePackNum = element.attr("largePackNum");
        var largePackUnit = element.attr("largePackUnit");
        $("#lgNum").text(largePackNum);
        $("#lgUnit").text(largePackUnit);
        var middlePackNum = element.attr("middlePackNum");
        var middlePackUnit = element.attr("middlePackUnit");
        $("#midNum").text(middlePackNum);
        $("#midUnit").text(middlePackUnit);
        var smallPackNum = element.attr("smallPackNum");
        var smallPackUnit = element.attr("smallPackUnit");
        $("#smNum").text(smallPackNum);
        $("#smUnit").text(smallPackUnit);
        displayDialog("selectGoods");
        $.ajax({
            url: "/order/getShipInfoByBatchNum?batchNum=" + batchlist.split(",")[0],
            type: 'get',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                var data = feedback.data;
                if (data != undefined) {
                    $(".inputGoodsProduceDate").val(data.goodsProduceDate);
                    $(".inputGoodsValidDate").val(data.goodsValidDate);
                    if (data.inspectReportURL != "" && data.inspectReportURL != "undefined") {
                        var str = "";
                        var inspectReportURL = data.inspectReportURL.split(",");
                        for (var i = 0; i < inspectReportURL.length; i++) {
                            str += "<li><div class='fileClass'><img src=" + inspectReportURL[i] + "></div></li>";
                        }
                        var fileContainer = $(".fileContainer");
                        fileContainer.find("ul").find("li").remove();
                        fileContainer.find("ul").append(str);
                        fileContainer.css("display", "block");
                        fileContainer.siblings("span").css("display", "none");
                    } else {
                        var formSignin = $(".form-signin");
                        formSignin.css("display", "none");
                        formSignin.siblings("span").css("display", "block");
                    }
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });

    //提交发货数据
    $(document).delegate('.customerShipOrder', 'click', function () {
        var items = [];
        var orderId = "";
        var remark = $("#shipRemark").val();
        var logisticsCompany = $(".inputLogisticsCompany").val();
        var logisticsNo = $(".inputLogisticsNo").val();
        var displayId = $(this).attr('data-displayId');

        var emptyFlag=true;//默认为空

        $("tr[name^='shipItem']").each(function () {
            var element = $(this);
            var goodsId = element.attr('goodsId');
            if(orderId=="") {
                orderId = element.attr('orderid');
            }
            var orderQty = Number($(this).find("td").eq(3).text().trim());
            var isInOrder = element.find('td:first').find('div').length == 0;

            var shippedQuantitySum=element.find('.shippedNum_' + goodsId).text();
            var shippedNum = element.find('.shippedNum_' + goodsId).text();
            if(shippedNum!='0'){
                emptyFlag=false;
            }
            //if (shippedNum != "0") { 发货为0的必须显示
                var item = {};
                item.goodsId = element.attr('goodsId');
                var batchDatas = [];
                var template = element.find('div[name^=template_' + goodsId + "]");
                template.each(function () {
                    var batchData = [];
                    batchData.push(
                        $(this).find('.modifyShipItem').attr('batchNum'),
                        $(this).find('.modifyShipItem').attr('produceDate'),
                        $(this).find('.modifyShipItem').attr('validDate'),
                        $(this).find('.modifyShipItem').attr('batchqty'),
                        $(this).find('.modifyShipItem').attr('drugESC'),
                        $(this).find('.modifyShipItem').attr('inspectReportURL'),
                        isInOrder ? orderQty : 0,
                        Number(shippedQuantitySum)
                    );
                    batchDatas.push(batchData);
                });
                item.batchDatas = batchDatas;
                //item.totalQuantity = orderQty;
                items.push(item);
            //}
        });
        var data = {
            shipData: items
        };
        data['clientId'] = Number($.trim($('#hiddenClientId').html()));
        data['logisticsCompany'] = logisticsCompany;
        data['logisticsNo'] = logisticsNo;
        data['orderId'] = orderId;
        data['remark'] = remark;
        data['displayId'] = displayId;
        if(emptyFlag){
            artDialogAlertModal("订单内商品发货数量不能全部为0");
            return
        }
        ///items.length == 0 ||
        if ( logisticsCompany == "" || logisticsNo == "") {
            artDialogAlertModal("请先填写完整发货数据");
            return
        }
        $.ajax({
            data: data,
            url: '/customer/ship/add',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == 200) {
                    artDialogAlertModal("发货成功", function () {
                        window.location.href = "/customer/order/pending?orderId=" + orderId;
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

    //弹窗点击确认
    $(document).delegate('#addShipItem', 'click', function () {
        var iframe = $("iframe[name=picture]");
        var selectGoods = $("#selectGoods");
        var type = iframe.siblings("button").attr("data-update");
        if (type == "true") {
            var d = dialog({
                content: '选择以及修改图片以后一定要点击上传才可生效',
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
        var goodsId = selectGoods.attr("goodsid");
        var shippedNum = Number(selectGoods.attr("shippedNum"));
        var action = selectGoods.attr("action");
        data.batchNum = $('.inputBatchNum').val();
        data.goodsProduceDate = $('.inputGoodsProduceDate').val();
        data.goodsValidDate = $('.inputGoodsValidDate').val();
        data.shipQuantity = Number($('.inputQuantity').val());

        data.drugESC = $('.inputDrugESC').val();
        data.inspectReportURL = getUploadImg();

        shippedNum = shippedNum + Number(data.shipQuantity);


        var orderNum=selectGoods.attr('orderNum');
        var otherQuantity=selectGoods.attr('otherreturnQuantity');//typeof(selectGoods.attr('otherreturnQuantity'))=='undefined'?0:selectGoods.attr('otherreturnQuantity');


        var maxNum = $('.maxShipNum_' + goodsId).val();
        var otherShipBatchNum = selectGoods.attr("otherShipBatchNum").split(",");
        if (validateBatchNum(data.batchNum) &&
            validateGoodsProduceDate(data.goodsProduceDate) &&
            validateGoodsValidDate(data.goodsValidDate) &&
            validateInputQuantity(data.shipQuantity) &&
            validateDrugESC(data.drugESC) &&
            validateInspectReportURL(data.inspectReportURL)) {
            if(data.shipQuantity==0){
                artDialogAlertModalTitleCallBack("温馨提示", "单次发货数量不能为0", "返回修改","取消",function(){
                    $('.inputQuantity').focus();
                },function(){
                    $(".fadeDiv").css('display', 'none');
                    selectGoods.css('display', 'none');
                });
                return false;
            }
            if(Number(data.shipQuantity)==0&&Number(otherQuantity)==0){
                artDialogAlertModal("发货数量为0的批次只能有一个", function(){
                    $('.inputBatchNum').focus();
                });
                return false;
            }

            if (otherShipBatchNum.indexOf(data.batchNum) > -1) {
                artDialogAlertModal("批次号不能与本次发货商品其他批次号相同", function(){
                    $('.inputBatchNum').focus();
                });
                return false;
            }

            if(typeof(otherQuantity)!='undefined'&& ((Number(data.shipQuantity)+Number(otherQuantity))>Number(orderNum))){
                artDialogAlertModal("发货数量已超出订单总数量", function(){
                    $('.inputQuantity').focus();
                });
                return;
            }

            $.ajax({
                type: "GET",
                url: "/closure",
                dataType: "json",
                async: true
            }).done(function (res) {
                if (res.status == "200") {
                    var verifyShipNum = res.data.__verifyShipNum;
                    if (verifyShipNum) {
                        if (shippedNum > Number(maxNum)) {
                            artDialogAlertModal("发货数量已超出订单总数量", function(){
                                $('.inputQuantity').focus();
                            });
                            return;
                        }
                    }
                    var shippedNumLabel = $('.shippedNum_' + goodsId);
                    shippedNumLabel.text(shippedNum);
                    if (action == "ADD") {
                        var template = $("#template");
                        var newShipInfoDiv = template.clone(true);
                        newShipInfoDiv.css("display", "flex");
                        newShipInfoDiv.attr("name", "template_" + goodsId + "_" + data.batchNum);
                        newShipInfoDiv.attr("id", "");
                        newShipInfoDiv.find("#batchNum").text(data.batchNum);
                        newShipInfoDiv.find("#batchShipNum").text(data.shipQuantity);
                        var modify = newShipInfoDiv.find(".modifyShipItem");
                        modify.attr("goodsid", goodsId);
                        modify.attr("batchNum", data.batchNum);
                        modify.attr("batchQty", data.shipQuantity);
                        modify.attr("produceDate", data.goodsProduceDate);
                        modify.attr("validDate", data.goodsValidDate);
                        modify.attr("drugESC", data.drugESC);
                        modify.attr("inspectReportURL", data.inspectReportURL);
                        $('#collapse_' + goodsId).before(newShipInfoDiv);
                    } else if (action == "MODIFY") {
                        var modifyDiv = $("div[name=" + selectGoods.attr("name") + "]");
                        modifyDiv.find("#batchNum").text(data.batchNum);
                        modifyDiv.find("#batchShipNum").text(data.shipQuantity);
                        var modifyTemp = modifyDiv.find(".modifyShipItem");
                        modifyTemp.attr("goodsid", goodsId);
                        modifyTemp.attr("batchNum", data.batchNum);
                        modifyTemp.attr("batchQty", data.shipQuantity);
                        modifyTemp.attr("produceDate", data.goodsProduceDate);
                        modifyTemp.attr("validDate", data.goodsValidDate);
                        modifyTemp.attr("drugESC", data.drugESC);
                        modifyTemp.attr("inspectReportURL", data.inspectReportURL);
                    }
                    if (shippedNum == Number(maxNum)) {
                        shippedNumLabel.removeClass("font-orange");
                        shippedNumLabel.addClass("font-green");
                    } else if (shippedNum != Number(maxNum)) {
                        shippedNumLabel.addClass("font-orange");
                        shippedNumLabel.removeClass("font-green");
                    }

                    var sumPrice=0;
                    //更新合计信息
                    $('tr[name^="shipItem"]').each(function(index,item){
                        var goodsId=$(item).attr('goodsId');
                        var shipNum= Number($(this).find('.shippedNum_' + goodsId).text());
                        var singlePrice=Number($(this).find('.price_single_' + goodsId).text());
                        sumPrice=Number(sumPrice)+Number(shipNum*singlePrice);

                        $(this).find('.price_sum_' + goodsId).html(Number(shipNum*singlePrice).toFixed(Number($('#pointDigit').val())))
                    });

                    $('#shipSumPrice').text(Number(sumPrice).toFixed(Number($('#pointDigit').val())));
                    $(".fadeDiv").css('display', 'none');
                    selectGoods.css('display', 'none');
                }
            }).fail(function (req, status, ex) {
            });
        }
    });
    //删除发货信息
    $(document).delegate(".deleteShipItem", "click", function () {
        var self = $(this);
        var parentDiv = self.closest(".ship-operator");
        artDialogAlertModalTitle("温馨提示", "确定要删除此条发货信息", function () {

            var pointDigit=Number($('#pointDigit').val());

            var goodsId=self.closest('tr').attr('goodsId');
            var currentGoodPriceSum=self.closest('tr').find('.price_sum_'+goodsId).text(); //当前商品的价格总和
            var allGoodsPriceSum=Number($('#shipSumPrice').text());

            var oldNum=self.closest('tr').find('.shippedNum_'+goodsId).text();
            //删除商品的数量
            var num=Number(self.closest('div').prev().find('#batchShipNum').text());
            //删除商品的价格
            var price=Number(self.closest('tr').find('.price_single_'+goodsId).text()).toFixed(pointDigit);
            //商品数量修改
            self.closest('tr').find('.shippedNum_'+goodsId).text(Number(oldNum)-num);
            //总计减去删除的商品的价格
            var newAllGoodPriceSum=(allGoodsPriceSum-Number(num*price)).toFixed(pointDigit);
            $('#shipSumPrice').text(newAllGoodPriceSum);
            //小计减去价格
            var newGoodSum=Number(Number(currentGoodPriceSum)-Number(num*price).toFixed(pointDigit));
            self.closest('tr').find('.price_sum_'+goodsId).text(newGoodSum.toFixed(pointDigit));
            parentDiv.remove();
        });


    });
    //修改发货信息
    $(document).delegate('.modifyShipItem', 'click', function () {
        clearDialog();
        var goodsId = $(this).attr("goodsid");
        var shippedNum = $('.shippedNum_' + goodsId).text();

        var selectGoods = $("#selectGoods");
        var otherShipBatchNum = [];
        var siblingsDiv = $(this).closest(".ship-operator").siblings("div[name^=template_" + goodsId + "]");
        _.each(siblingsDiv, function (item) {
            otherShipBatchNum.push($(item).find("#batchNum").text().trim());
        });

        var otherreturnQuantity = 0;
        var siblingsDiv = $(this).closest(".ship-operator").siblings(".ship-operator");
        _.each(siblingsDiv, function (item) {
            var qty = Number($(item).find("#batchShipNum").text().trim());
            otherreturnQuantity = otherreturnQuantity + qty;
        });
        selectGoods.attr("otherreturnQuantity", otherreturnQuantity);

        selectGoods.attr("otherShipBatchNum", otherShipBatchNum);
        selectGoods.attr("goodsid", goodsId);
        selectGoods.attr("orderNum", $(this).closest('tr').find('span[name="quantity"]').html());
        selectGoods.attr("action", "MODIFY");
        selectGoods.attr("name", $(this).closest('.ship-operator').attr("name"));
        var element = $('.maxShipNum_' + goodsId);
        $("#lgNum").text(element.attr("largePackNum"));
        $("#lgUnit").text(element.attr("largePackUnit"));
        $("#midNum").text(element.attr("middlePackNum"));
        $("#midUnit").text(element.attr("middlePackUnit"));

        var batchNum = $(this).attr("batchNum");
        var batchQty = $(this).attr("batchQty");
        var produceDate = $(this).attr("produceDate");
        var validDate = $(this).attr("validDate");
        var drugESC = $(this).attr("drugESC");
        var inspectReportURL = $(this).attr("inspectReportURL").split(",");
        selectGoods.attr("shippedNum", Number(shippedNum) - Number(batchQty));
        if (batchNum != undefined) {
            $('.inputBatchNum').val(batchNum);
            $('.inputQuantity').val(batchQty);
            $('.inputGoodsProduceDate').val(produceDate);
            $('.inputGoodsValidDate').val(validDate);
            $('.inputDrugESC').val(drugESC);
            var str = "";
            for (var i = 0; i < inspectReportURL.length; i++) {
                str += "<li class='oldImg'><div class='fileClass'>" +
                    "<img src=" + inspectReportURL[i] + ">" +
                    "<a class='removeimg'><i class='fa fa-times-circle-o'></i></a>" +
                    "</div></li>";
            }
            var fileContainer = $(".fileContainer");
            var formsignin = $(".form-signin");
            fileContainer.find("ul").find("li").eq(0).before(str);
            formsignin.css("display", "block");
            formsignin.siblings("span").css("display", "none");
        }
        displayDialog("selectGoods");
    });
    //新增发货信息
    $(document).delegate('.displayAddShipItem', 'click', function () {
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

    $(document).delegate('.cancelAddShip', 'click', function () {
        $(parent.window.document).find('#selectGoods').css('display', 'none');
        $(parent.window.document).find('.fadeDiv').css('display', 'none');
    });

    $(document).delegate('.customerCancelReturnDialog', 'click', function () {
        var element = $(this);
        artDialogAlertModalTitle("温馨提示", "您确定要取消此次退货申请吗？", function () {
            var returnId = element.attr("returnId");
            var displayReturnId = element.attr("data-displayId");
            var operatorId = element.attr("data-opId");
            var data = {
                returnId: returnId,
                operatorId: operatorId,
                displayId: displayReturnId
            };
            $.ajax({
                data: data,
                url: '/customer/return/close',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == 200) {
                        artDialogAlertModal("退货已取消", function(){
                            window.location.reload();});
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

    $(document).delegate('.incA', 'click', function () {
        var self = $(this);
        var incNum = Number(self.prev().find('label').html());
        var inputEle = self.parent().parent().parent().next().find('input');
        inputEle.val(Number(inputEle.val()) + incNum);

    });
    $(document).delegate('.subA', 'click', function () {
        var self = $(this);
        var subNum = Number(self.next().find('label').html());
        var inputEle = self.parent().parent().parent().next().find('input');
        inputEle.val((Number(inputEle.val()) - subNum) <= 0 ? 0 : (Number(inputEle.val()) - subNum));
    });
    $(document).delegate('.subNumShip', 'click', function () {
        var self = $(this);
        var inputEle = self.next();
        inputEle.val((Number(inputEle.val()) - 1) <= 0 ? 0 : (Number(inputEle.val()) - 1));
    });
    $(document).delegate('.incNumShip', 'click', function () {
        var self = $(this);
        var inputEle = self.prev();
        inputEle.val(Number(inputEle.val()) + 1);
    });
    $(document).delegate('.customerCancelOrder', 'click', function () {
        var element = $(this);
        artDialogAlertModalTitle("温馨提示", "您确定要取消此订单吗？", function () {
            //添加点击确定的处理代码
            var orderId = element.attr("orderId");
            var data = {
                orderId: orderId
            };
            $.ajax({
                data: data,
                url: '/customer/order/close',
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
                        artDialogAlertModal(feedback.msg, function () {
                        });
                    }

                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }

            });


        });
    });
    //添加商品到发货单
    $(document).delegate("#addProductToShipOrder", "click", function () {
        var orderid = $(window.parent.document).contents().find("#addProductToShipIframe").attr("orderid");
        var shipTableBody = $(window.parent.document).contents().find(".shipTableBody");
        var IDS = _.map(shipTableBody.find("tr"), function (item) {
            var ID = $(item).attr("goodsId");
            if (ID) {
                return ID;
            }
        });
        _.each($(".icheckbox"), function (item) {
            var _self = $(item);
            var input = _self.find("input");
            var goodsId = input.attr("goodsId");
            var goodsNo = input.attr("goodsNo");
            var imageUrl = input.attr("imageUrl");
            var price = input.attr("price");
            var commonName = input.attr("commonName");
            var alias = input.attr("alias");
            var birthPlace = input.attr("birthPlace");
            var spec = input.attr("spec");
            var largePackNum = input.attr("largePackNum");
            var largePackUnit = input.attr("largePackUnit");
            var middlePackNum = input.attr("middlePackNum");
            var middlePackUnit = input.attr("middlePackUnit");
            var smallPackNum = input.attr("smallPackNum");
            var smallPackUnit = input.attr("smallPackUnit");
            if (_self.hasClass("checked") && goodsId && goodsNo) {
                if (IDS.indexOf(goodsId) == -1) {
                    var shipItemTemplate = shipTableBody.find("tr[name='ItemTemplate']").clone(true);
                    shipItemTemplate.attr("goodsId", goodsId);
                    shipItemTemplate.attr("orderid", orderid);
                    shipItemTemplate.find(".goods-img").find("img").attr("src", imageUrl);
                    var a = "<a href='/goods/detail?goodsId=" + goodsId + "'>" + commonName + (alias ? "(" + alias + ")" : "");
                    shipItemTemplate.find("h6[name='commonName']").html(a);
                    shipItemTemplate.find("h6[name='birthPlace']").text(birthPlace);
                    shipItemTemplate.find("h6[name='spec']").text(spec);
                    shipItemTemplate.find(".chkGoods").attr("name", "checkbox_" + goodsId);
                    shipItemTemplate.find("td[name='goodsNo']").text(goodsNo);
                    shipItemTemplate.find("span[name='quantity']").text("0");
                    var hiddenInput = shipItemTemplate.find("span[name='quantity']").siblings("input");
                    hiddenInput.addClass("maxShipNum_" + goodsId);
                    hiddenInput.attr("value", 0);
                    hiddenInput.attr("largePackNum", largePackNum);
                    hiddenInput.attr("largePackUnit", largePackUnit);
                    hiddenInput.attr("middlePackNum", middlePackNum);
                    hiddenInput.attr("middlePackUnit", middlePackUnit);
                    hiddenInput.attr("smallPackNum", smallPackNum);
                    hiddenInput.attr("smallPackUnit", smallPackUnit);
                    shipItemTemplate.find("td[name='shippedNum']").find("label").removeClass("shippedNum");
                    shipItemTemplate.find("input[id='price']").val(price);
                    shipItemTemplate.find("td[name='shippedNum']").find("label").addClass("shippedNum_" + goodsId);
                    shipItemTemplate.find("td[name='shippedNum']").find("label").text("0");
                    shipItemTemplate.find(".displayAddShipItem").attr("goodsId", goodsId);
                    shipItemTemplate.find("#collapse").attr("id", "collapse_" + goodsId);
                    shipItemTemplate.attr("name", "shipItem_" + goodsId);
                    shipItemTemplate.css("display", "");
                    shipTableBody.find("tr[name='ItemTemplate']").before(shipItemTemplate);
                }
            }
        });
    });
});