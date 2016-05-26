$(function(){
    //商品管理　批量操作
    $(document).delegate(".batch-goods-action", 'click', function () {
        var data = {};
        var obj = document.getElementsByName("chkProduct");
        data.goodsIds = [];
        for (var k = 0; k < obj.length; k++) {
            if (obj[k].checked) {
                data.goodsIds.push(obj[k].value);
            }
        }
        data.onSell = $(this).attr("onSell");
        if(data.goodsIds.length<1){
            artDialogAlertModal("您没有选中任何商品");
            return;
        }
        var text = $(this).text();
        $.ajax({
            data: data,
            url: '/customer/updateMutiGoodsOnsell',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                artDialogAlertModal((text + feedback.msg),function(){
                    window.location.reload();
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
    //点击修改笔，　修改价格
    $(document).delegate('.productInputUpdatePrice', 'click', function(){
        var self = $(this);
        self.find('i').removeClass('fa-pencil');
        self.siblings('input').removeAttr('readonly');
        self.siblings('input').focus();
        self.find('i').addClass('fa-floppy-o');
        self.removeClass('productInputUpdatePrice');
        self.addClass('productUpdatePrice');
    });
    $(document).delegate('.classInputUpdatePrice', 'click', function(){
        var self = $(this);
        self.find('i').removeClass('fa-pencil');
        self.siblings('input').removeAttr('readonly');
        self.siblings('input').focus();
        self.find('i').addClass('fa-floppy-o');
        self.removeClass('classInputUpdatePrice');
        self.addClass('classUpdatePrice');
    });
    //修改价格
    $(document).delegate('.productUpdatePrice', 'click', function(){
        var self = $(this);
        var newPrice = self.siblings('input').val();
        var goodsId = self.closest('tr').attr('data-goodsId');
        var clientId = self.closest('tr').attr('data-clientId');
        var data = {
            price : newPrice,
            goodsId : goodsId,
            clientId : clientId
        };
        if(newPrice == "" || goodsId == "" || clientId == ""){
            artDialogAlertModal("失败，请重试");
            return;
        }
        $.ajax({
            data: data,
            url: '/customer/goods/clientprice/update',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                    artDialogAlertModal(feedback.msg, function(){
                        window.location.reload();
                    });
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
    $(document).delegate('.classUpdatePrice', 'click', function(){
        var self = $(this);
        var newPrice = self.siblings('input').val();
        var goodsId = self.closest('tr').attr('data-goodsId');
        var clientCategoryid = self.closest('tr').attr('data-clientCategoryId');
        var data = {
            price : newPrice,
            goodsId : goodsId,
            clientCategoryid : clientCategoryid
        };
        if(newPrice == "" || goodsId == "" || clientCategoryid == ""){
            artDialogAlertModal("失败，请重试");
            return;
        }
        $.ajax({
            data: data,
            url: '/customer/goods/categoryprice/update',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                    artDialogAlertModal(feedback.msg, function(){
                        window.location.reload();
                    });
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
    //删除客户
    $(document).delegate('.productRemoveGoods', 'click', function(){
        var self = $(this);
        var goodsId = self.closest('tr').attr('data-goodsId');
        var clientId = self.closest('tr').attr('data-clientId');
        var data = {
            goodsId : goodsId,
            clientId : clientId
        };
        if(clientId == "" || goodsId == ""){
            artDialogAlertModal("失败，请重试");
            return;
        }
        $.ajax({
            data: data,
            url: '/customer/goods/clientprice/delete',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                    artDialogAlertModal(feedback.msg, function(){
                        window.location.reload();
                    });
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
    $(document).delegate('.productRemoveClient', 'click', function(){
        var self = $(this);
        var goodsId = self.closest('tr').attr('data-goodsId');
        var clientCategoryid = self.closest('tr').attr('data-clientCategoryId');
        var data = {
            goodsId : goodsId,
            clientCategoryid : clientCategoryid
        };
        if(clientCategoryid == "" || goodsId == ""){
            artDialogAlertModal("失败，请重试");
            return;
        }
        $.ajax({
            data: data,
            url: '/customer/goods/categoryprice/delete',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                    artDialogAlertModal(feedback.msg,function(){
                        window.location.reload();
                    });
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
    //添加客户
    $(document).delegate('.addClient', 'click', function(){
        var self = $(this);
        var goodsId = self.closest('tr').attr('goodsId');
        var clientId = self.closest('tr').attr('clientId');
        var data = {
            goodsId : goodsId,
            clientId : clientId
        };
        if(goodsId == "" || clientId == ""){
            artDialogAlertModal("失败，请重试");
            return;
        }

        $.ajax({
            data: data,
            url: '/customer/goods/categoryprice/add',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
    //添加客户类
    $(document).delegate('.customerAddGoodsClassPrice', 'click', function(){
        var self = $(this);
        var goodsId = self.closest('tr').attr('goodsId');
        var clientId = self.closest('tr').attr('clientId');
        var data = {
            goodsId : goodsId,
            clientId : clientId
        };
        if(goodsId == "" || clientId == ""){
            artDialogAlertModal("失败，请重试");
            return;
        }

        $.ajax({
            data: data,
            url: '/customer/goods/categoryprice/add',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
    //选中筛选
    $(document).delegate("#clientFilterSelect", 'change', function(){
        var self = $(this)[0];
        var index = self.selectedIndex;
        var text = self.options[index].value;
        if(text == "按名称"){
            $("input[name='clientInputFilter']").attr("placeholder","请输入名称...");
        }else if(text == "按编码"){
            $("input[name='clientInputFilter']").attr("placeholder","请输入编码...");
        }
    });

    $(document).delegate(".setClientPrice", "click", function () {
        var clientId = $("input[name='clientInputFilter']").attr("data-id");
        if(clientId == ""||typeof(clientId)=='undefined'){
            artDialogAlertModal("请选择客户");
            return;
        }
        var price = $("input[name='price']").val();
        if(price == ""){
            artDialogAlertModal("请设置价格");
            return;
        }
        var regPrice=/^\d+(\.\d{1,4})?$/;
        if(!regPrice.test(price)){
            artDialogAlertModal("请输入正确的价格信息,最多精确到4位小数");
            return;
        }
        var goodsId = window.location.search.replace("?goodsId=","");
        if(goodsId == ""){
            artDialogAlertModal("失败，请刷新页面重试");
            return;
        }
        var data = {
            price : price,
            clientId : clientId,
            goodsId : goodsId
        };
        $.ajax({
            data: data,
            url: "/customer/goods/clientprice/add",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                    artDialogAlertModal(feedback.msg, function(){
                        $(window.parent.document).find('.fadeDiv').css('display', 'none');
                        $(window.parent.document).find("#selectGoods").css('display', 'none');
                        window.parent.location.reload();
                    });
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
    $(document).delegate(".dropdown>li", "click", function(){
        var self = $(this);
        var input = $("#inputValue");
        var text = self.text();
        var id = self.attr("data-id");
        input.val(text);
        input.attr("data-id", id).attr('pricePlan',self.attr('pricePlan')).attr('clientCode',self.attr('clientCode'));
        $(".dropdown").css("display", "none");
    });

    $("#inputValue").focus(function(){
        $(".dropdown").css("display", "block");
    });
    $("#putClientPrice").focus(function(){
        $(".dropdown").css("display", "none");
    });
    //库存方案改变 详细内容变化
    $(document).delegate('#stock_case','change',function(){
        var selectedInventoryId=$(this).val();
        //获取详细信息
        $.ajax({
            url:"/customer/system/inventory/edit?id=" +selectedInventoryId,
            type:'get',
            success:function(feedback){
                if(feedback.status == 200){
                    var data = feedback.data;
                    var str ="";
                    var i;
                    for( i=0; i<data.length-1; i++){
                        str+='当数量低于<span style="font-weight:bold">'+data[i].threshold+'</span>显示<span style="font-weight:bold">'+data[i].content+'</span>,';
                    }
                    str += '其他数量时显示<span style="font-weight:bold">'+data[data.length-1].content+'</span>';
                    var inventoryPlanDetail = $("#inventoryPlanDetail");
                    inventoryPlanDetail.find('td').eq(1).empty();
                    inventoryPlanDetail.find('td').eq(1).append(str);
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            }
        });
    });

    //添加多级产品类别
    $(document).delegate('#CustomerGoodsAddCategory', 'click', function(){
        var newBox = $(".categorytemplate").clone(true);
        newBox.removeClass("categorytemplate");
        var addCategoryDiv = $("div[name='CustomerGoodsAddCategory']");
        addCategoryDiv.after(newBox);
        newBox.after(addCategoryDiv);
        newBox.css("display", "block");
    });
    //删除分类
    $(document).delegate('.deletegoodscategory', "click", function () {
        var self = $(this);
        var div = self.closest("div");
        var oldvalue = self.siblings(".self-select-wrapper").find(".self-select-text").attr("value").trim();
        var goodstypes = self.closest("td").attr("data-goodstype").split(",");
        var index = goodstypes.indexOf(oldvalue);
        if(index > -1){
            goodstypes.splice(index, 1);
        }
        self.closest("td").attr("data-goodstype", goodstypes);
        div.remove();
    });

    $(document).delegate('.goodsInfoSubmit', 'click', function () {
        var isValidBasicInfo=checkBasicInfoEdit().invalid;
        if(isValidBasicInfo){
            artDialogAlertModal('请先填写完整商品信息');
            return;
        }
        if($("#GSP_category").val()==''){
            artDialogAlertModal('请先填写对应的GSP类型');
            return;
        }
        var data = {};
        data.baseInfo = customerAddProductBasicInfo();
        data.inventoryInfo = customerAddProductStockInfo();
        if(data.inventoryInfo == false){
            return false;
        }
        data.inventoryInfo.onSell = $(this).attr("onsell");
        data.gspInfo = customerAddProductGsp();
        data.marksInfo = customerAddProductMark();
        $.ajax({
            data: data,
            url: '/customer/updateGoodsInfo',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                    artDialogAlertModal(feedback.msg, function(){
                        if (data.inventoryInfo.onSell == "1") {
                            window.location.href = "/customer/goods/available/list";
                        } else {
                            window.location.href = "/customer/goods/unavailable/list";
                        }
                    });
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });

    //设置商品剂型单位　添加
    $(document).delegate('.addProductPackUnit', 'click', function(){
        var self = $(this);
        var input = self.siblings("input");
        var value = input.val().trim();
        addPackUnit(value, function(feedback){
            if (feedback.status == "200") {
                self.siblings("span").text("添加成功");
                var str = "<tr name='newAdd' packUnitId="+ feedback.data.packUnitId +"><td>" +
                    value + "</td><td><a class='removePackUnit tooltipped' data-toggle='tooltip' data-placement='left' title='删除'><i class='fa fa-trash' ></i></a></td></tr>";
                self.closest("tr").after(str);
                input.val("");
            } else {
                self.siblings("span").text(feedback.msg);
                input.focus();
            }
        });
    });
    //删除包装单位
    $(document).delegate(".removePackUnit", "click", function () {
        var self = $(this);
        var data = {
            packUnitId: self.closest("tr").attr("packUnitId")
        };
        $.ajax({
            data: data,
            url: "/customer/system/packUnit/remove",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == "200") {
                    self.closest("tr").remove();
                } else {
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR) {
                artDialogAlertModal('error ' + jqXHR.readyState + " " + jqXHR.responseText);
            }
        });
    });
    //设置商品GSP　添加
    $(document).delegate('.addProductGSP', 'click', function(){
        var self = $(this);
        var input = self.siblings("input");
        var value = input.val().trim();
        addGSP(value, function (feedback) {
            if (feedback.status == "200") {
                self.siblings("span").text("添加成功");
                var str = "<tr name='newAdd' gspId="+ feedback.data.gspId +"><td>" + value + "</td><td><a class='deleteProductGSP tooltipped' data-toggle='tooltip' data-placement='left' title='删除'><i class='fa fa-trash' ></i></a></td></tr>";
                self.closest("tr").after(str);
                self.siblings("span").text("");
                input.val("");
            } else {
                self.siblings("span").text(feedback.msg);
                input.focus();
            }
        });
    });
    //设置商品GSP　删除
    $(document).delegate('.deleteProductGSP', 'click', function(){
        var self = $(this);
        var data = {
            gspId : self.closest("tr").attr("gspId")
        };
        artDialogAlertModal("确认要删除该类别？", function(){
            $.ajax({
                data: data,
                url: '/customer/system/productGSP/delete',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == "200") {
                        self.closest("tr").remove();
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
    //设置商品剂型　添加
    $(document).delegate('.addProductJX', 'click', function(){
        var self = $(this);
        var input = self.siblings("input");
        var value = input.val().trim();
        addJX(value, function (feedback) {
            if (feedback.status == "200") {
                self.siblings("span").text("添加成功");
                var str = "<tr name='newAdd' jxId="+ feedback.data.jxId +"><td>" + value + "</td><td><a class='deleteProductJX tooltipped' data-toggle='tooltip' data-placement='left' title='删除'><i class='fa fa-trash' ></i></a></td></tr>";
                self.closest("tr").after(str);
                input.val("");
                self.siblings("span").text("");
            } else {
                self.siblings("span").text(feedback.msg);
                input.focus();
            }
        });
    });
    //设置投诉电话　添加
    $(document).delegate('.addProductComplaintsPhone', 'click', function(){
        var self = $(this);
        var input = self.siblings("input");
        var value = input.val().trim();
        addComplaints(value, function (feedback) {
            if (feedback.status == "200") {
                self.siblings("span").text("添加成功");
                var str = "<tr name='newAdd' complaintsId="+ feedback.data.complaintsId +" ><td>" + value + "</td><td>" +
                    "<a class='updateProductComplaintsPhone tooltipped' data-toggle='tooltip'  style='margin-right: 20px' data-placement='left' title='修改'>" +
                    "<i class='fa fa-pencil-square-o' ></i></a>" +
                    "<a class='deleteProductComplaintsPhone tooltipped' data-toggle='tooltip' data-placement='left' title='删除'>" +
                    "<i class='fa fa-trash' ></i></a>" +
                    "</td></tr>";
                self.closest("tr").after(str);
                input.val("");
                self.siblings("span").text("");
            } else {
                self.siblings("span").text(feedback.msg);
                input.focus();
            }
        });
    });
    //设置投诉电话　添加
    $(document).delegate('.updateProductComplaintsPhone', 'click', function(){
        var input = $("input[name='addProductComplaintsPhone']");
        var cloneTR = input.closest("tr").clone();
        var closestTR = $(this).closest("tr");
        var complaintsTR = closestTR.find("td.complaintPhone");
        var complaintsId = closestTR.attr("complaintsId");
        var complaints = complaintsTR.text().trim();
        complaints = (complaints === '空') ? "":complaints;
        var complaintsName = closestTR.find('.contractPhoneName').text().trim();
        cloneTR.find("input").val(complaints);
        cloneTR.find("input").attr('complaintsid', complaintsId);
        cloneTR.find("input").siblings("a").text("修改");
        cloneTR.find("input").siblings("a").removeClass("addProductComplaintsPhone");
        cloneTR.find("input").siblings("a").addClass("updateComplaintsPhone");
        cloneTR.find("input").siblings("a").attr("data-name", complaintsName);
        closestTR.after(cloneTR);
        cloneTR.find("input").focus();
        cloneTR.find("input").attr('name', '');
        $(this).hide();
        cloneTR.show();
    });

    //设置商品剂型　删除
    $(document).delegate('.deleteProductJX', 'click', function(){
        var self = $(this);
        var data = {
            jxId : self.closest("tr").attr("jxId")
        };
        artDialogAlertModal("确认要删除该剂型？", function () {
            $.ajax({
                data: data,
                url: '/customer/system/productJX/delete',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == "200") {
                        self.closest("tr").remove();
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
    //投诉管理　删除电话号码
    $(document).delegate('.deleteProductComplaintsPhone', 'click', function(){
        var self = $(this);
        var data = {
            complaintsId : self.closest("tr").attr("complaintsId")
        };
        artDialogAlertModal("确认删除该投诉电话", function(){
            $.ajax({
                data: data,
                url: '/page/customer/portal/complaints/delete',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == "200") {
                        self.closest("tr").remove();
                    } else {
                        self.siblings("span").text(feedback.msg);
                        input.focus();
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }
            });
        });
    });

     //投诉管理　更新电话号码
    $(document).delegate('.updateComplaintsPhone', 'click', function(){
        var self = $(this);
        var input = self.siblings("input");
        var complaintsid = input.attr("complaintsid");
        var name = self.attr('data-name').replace('：','');
        var data = {
            id : complaintsid,
            content : input.val(),
            name: name
        };
        $.ajax({
            data: data,
            url: '/page/customer/portal/complaints/update',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == "200") {
                    $("tr[complaintsId=" + complaintsid + "]").find("td.complaintPhone").text(input.val());
                    self.parents('tr').prev('tr').find('.updateProductComplaintsPhone').show();
                    self.closest("tr").remove();
                } else {
                    self.siblings("span").text(feedback.msg);
                    input.focus();
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });

    $('.radio').click(function () {
        var self = $(this);
        if (self.hasClass("radio-negSell")) {
            var input = $("input[name='radio_negSell']:checked");
            var value = Number(input.val());
            if (value === Number(0)) {
                var inventoryInfo = input.attr("inventoryInfo");
                var commanName = input.attr("commanname");
                if (typeof inventoryInfo != "undefined" && inventoryInfo < 0) {
                    artDialogAlert("当前商品库存当前为负数，不能禁止负库存销售，" +
                        "<a href='/customer/goods/inventory/list?kf=商品名&kv=" + commanName + "'>前去设置?</a>", function(){});
                }
            }
        }
    });
});

function checkBasicInfoEdit(){
    var invalid = false;
    var data = {};
    data.filingNumber = $("#filingNumber").val().trim();
    data.filingNumberValidDate = $("#filingNumberValidDate").val().trim();
    if (data.filingNumberValidDate == "") {
        invalid = true;
    }
    data.goodsNo = $("#product_num").val().trim();
    if (data.goodsNo == "") {
        invalid = true;
    }
    data.commonName = $("#product_name").val().trim();
    if (data.commonName == "") {
        invalid = true;
    }
    data.alias = $("#alias").val().trim();
    data.birthPlace = $("#birthPlace").val().trim();
    if (data.birthPlace == "") {
        invalid = true;
    }
    data.producer = $("#factory").val().trim();
    if (data.producer == "") {
        invalid = true;
    }
    data.drugsType = $("#dosage").val();
    data.spec = $("#spec").val();
    if (data.spec == "") {
        invalid = true;
    }
    var measureUnitSelect = $("#measureUnit");
    data.measureUnit = measureUnitSelect.find("option:selected").text();
    if (data.measureUnit == "") {
        invalid = true;
    }
    //data.largePackNum = $("#largePackNum").val().trim();
    data.largePackNum = 0;
    //data.largePackUnit = measureUnitSelect.find("option:selected").text();
    data.largePackUnit = measureUnitSelect.find("option:selected").text();
    data.middlePackNum = $("#middlePackNum").val().trim();
    data.middlePackUnit = measureUnitSelect.find("option:selected").text();
    data.goodsType = $("#product_category").attr("data-goodstype");
    if (data.goodsType == "请选择") {
        invalid = true;
    }
    data.barcode = $("#barcode").val().trim();
    data.imageUrl = $('#picture').contents().find('img').eq(0).attr('src');
    data.id = $("#goodsId").val();
    data.gspTypeId = $("#GSP_category").val();
    return {
        data: data,
        invalid: invalid
    }
}

function checkThisClientId(obj){
    var data = {};
    var inputValue = $("#inputValue");
    inputValue.attr("data-id", "");
    inputValue.attr("pricePlan", "");
    inputValue.attr('clientCode',"");
    data.keyword = obj.value;
    var url = '/customer/goods/clientprice/listclients';
    $.ajax({
        data: data,
        url: url,
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (feedback) {
            if(feedback.status == "200"){
                var ul = $(".dropdown");
                ul.find("li").remove();
                var str = _.map(feedback.data, function (item) {
                    if(item.clientName == data.keyword){
                        $("#inputValue").attr("data-id", item.id).attr('pricePlan',item.pricePlan).attr('clientCode',item.clientCode);
                    }
                    return "<li data-id=" +
                        item.id +
                            " pricePlan='"+
                        item.pricePlan+"'"+
                            "  clientCode='"+
                        item.clientCode+"'"+
                        " >" +
                        item.clientName +
                        "</li>";
                });
                ul.append(str);
                ul.css("display", "block");
            }else{
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            artDialogAlertModal('error ' + textStatus + " " + errorThrown);
        }
    });
}

function customerAddProductBasicInfo(){
    var returnData=checkBasicInfoEdit();
    var data=returnData.data;
    data.goodsDetails = UE.getEditor('editor').getContent();
    return data;
}

function customerAddProductStockInfo(){
    var data = {};
    data.showPlanId = $("#stock_case").val();
    data.goodsBatchTime = $("#goodsBatchTime").val();
    //data.amount = $("#stock_num").val();
    //           库存设置      在单独的库存设定页面
    //var input = $("input[name='radio_negSell']:checked");
    //data.negSell = Number(input.val());
    //if (data.negSell === Number(0)) {
    //    var inventoryInfo = input.attr("inventoryInfo");
    //    var commanName = input.attr("commanname");
    //    if (typeof inventoryInfo != "undefined" && inventoryInfo < 0) {
    //        artDialogAlert("当前商品库存当前为负数，不能禁止负库存销售，" +
    //            "<a href='/customer/goods/inventory/list?kf=商品名&kv=" + commanName + "'>前去设置?</a>", function () {
    //            return false;
    //        });
    //        return false;
    //    }
    //}
    data.negSell = Number(0);
    //data.onSell = $("input[name='radio_onSell']:checked").val();      状态         不在此设定
    data.isSplit = $("input[name='radio_isSplit']:checked").val();
    return data;
}

function customerAddProductGsp(){
    var data = {};
    data.gmpNumber = $("#GMP_license").val();
    data.gmpCertificationDate = $("#GMP_license_startline").val();
    data.gmpValidDate = $("#GMP_license_deadline").val();
    data.importRegisCertNum = $("#import_num").val();
    data.importRegisCertNumValidDate = $("#import_num_deadline").val();
    data.gspType = $("#GSP_category").val();
    data.registeredTradeMarksAndPatents = $("#trademark").val();
    data.drugAdministrationEncoding = $("#regulatory_code").val();
    data.drugsValidDate = $("#validity").val();
    return data;
}

function customerAddProductMark(){
    var data = {};
    data.isNationalMedicine = $('#isNationalMedicine').is(':checked');
    data.isMedicine = $('#drug_mark').is(':checked');
    data.isImported = $('#import_mark').is(':checked');
    data.isHerbalDecoctioniieces = $('#TCMdrink_mark').is(':checked');
    data.isCheckMedicalInstrumentCert = $('#needcheckdevice_mark').is(':checked');
    data.isPregnancyRermination = $('#stopgestation_mark').is(':checked');
    data.isHerbalMedicine = $('#TCM_drug').is(':checked');
    data.isPrescriptionDrugs = $('#prescription_mark').is(':checked');
    data.isMedicalInsuranceDrugs = $('#Medicare_mark').is(':checked');
    data.isProteinasSimilationPreparation = $('#protein_mark').is(':checked');
    data.isContainEphedrine = $('#ephedra_mark').is(':checked');
    data.isContainPeptidehormone = $('#hormone_mark').is(':checked');
    data.isFirstPsychotropicDrugs = $('#onepsychic_mark').is(':checked');
    data.isSecondPsychotropicDrugs = $('#twopsychic_mark').is(':checked');
    data.isHazardousChemicals = $('#chemistry_mark').is(':checked');
    data.isStupefacient = $('#hocus_mark').is(':checked');
    data.isDiagnosticReagent = $('#diagnostic_reagents_mark').is(':checked');
    data.isMedicalToxicity = $('#medicine_poison_mark').is(':checked');
    data.isContainingStimulants = $('#doping_mark').is(':checked');
    data.isVaccine = $('#vaccine').is(':checked');
    data.isHealthProducts = $('#health_mark').is(':checked');
    data.isFood = $('#food_mark').is(':checked');
    data.isContainSpecialContent = $('#isContainSpecialContent').is(':checked');
    return data;
}

function addComplaints(value, callback) {
    var phoneReg=/(^\d{3,4}-?\d{7,8})$|(1[1,9]{10})/;
    if(!phoneReg.test(value)){
        $(".tips").text("投诉电话格式不正确");
        $("input[name='addProductComplaintsPhone']").focus();
        return;
    }
    if (value == "") {
        $(".tips").text("请输入投诉电话");
        $("input[name='addProductComplaintsPhone']").focus();
    } else {
        var data = {
            complaints: value
        };
        var temp = [];
        var arr = $("tr[name='newAdd']").find("td:first-child");
        arr.each(function (item) {
            var element = arr[item];
            temp.push($(element).text().trim());
        });
        if (temp.indexOf(value) > -1) {
            $(".tips").text("已经添加过该电话号码了");
            $("input[name='addProductComplaintsPhone']").focus();
        } else {
            $.ajax({
                data: data,
                url: '/page/customer/portal/complaints/add',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    callback(feedback);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }
            });
        }
    }
}


function addJX(value, callback) {
    if (value == "") {
        $(".tips").text("请输入商品剂型类型");
        input.focus();
    } else {
        var data = {
            jx: value
        };
        var temp = [];
        var arr = $("tr[name='newAdd']").find("td:first-child");
        arr.each(function (item) {
            var element = arr[item];
            temp.push($(element).text().trim());
        });
        if (temp.indexOf(value) > -1) {
            $(".tips").text("已经添加过该剂型了");
            $("input[name='addProductJX']").focus();
        } else {
            $.ajax({
                data: data,
                url: '/customer/system/productJX/add',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    callback(feedback);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }
            });
        }
    }
}


function addGSP(value, callback) {
    if (value == "") {
        $(".tips").text("请输入商品GSP类别");
        $("input[name='addProductGSP']").focus();
    } else {
        var data = {
            gspValue: value
        };
        var temp = [];
        var arr = $("tr[name='newAdd']").find("td:first-child");
        arr.each(function (item) {
            var element = arr[item];
            temp.push($(element).text().trim());
        });
        if (temp.indexOf(value) > -1) {
            $(".tips").text("已经添加过该类别了");
            $("input[name='addProductGSP']").focus();
        } else {
            $.ajax({
                data: data,
                url: '/customer/system/productGSP/add',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    callback(feedback);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }
            });
        }
    }
}


function addPackUnit(value, callback) {
    if (value == "") {
        $(".tips").text("请输入商品包装单位");
        $("input[name='addProductPackUnit']").focus();
    } else {
        var data = {
            packUnit: value
        };
        var temp = [];
        var arr = $("tr[name='newAdd']").find("td:first-child");
        arr.each(function (item) {
            var element = arr[item];
            temp.push($(element).text().trim());
        });
        if (temp.indexOf(value) > -1) {
            $(".tips").text("已经添加过该单位了");
            $("input[name='addProductPackUnit']").focus();
        } else {
            $.ajax({
                data: data,
                url: '/customer/system/packUnit/add',
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    callback(feedback);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }
            });
        }
    }
}

function EnterPressAddComplaints(e){
    var e = e || window.event;
    if(e.keyCode == 13){
        var value = $("input[name='addProductComplaintsPhone']").val().trim();
        addComplaints(value, function (feedback) {
            if (feedback.status == "200") {
                $(".tips").text("添加成功");
                var str = "<tr name='newAdd' complaintsId="+ feedback.data.complaintsId +" ><td>" + value + "</td><td>" +
                    "<a class='updateProductComplaintsPhone tooltipped' data-toggle='tooltip'  style='margin-right: 20px' data-placement='left' title='修改'>" +
                    "<i class='fa fa-pencil-square-o' ></i></a>" +
                    "<a class='deleteProductComplaintsPhone tooltipped' data-toggle='tooltip' data-placement='left' title='删除'>" +
                    "<i class='fa fa-trash' ></i></a>" +
                    "</td></tr>";
                $("input[name='addProductComplaintsPhone']").closest("tr").after(str);
                $("input[name='addProductComplaintsPhone']").val("");
                $(".tips").text("");
            } else {
                $(".tips").text(feedback.msg);
                $("input[name='addProductComplaintsPhone']").focus();
            }
        });
    }
}

function EnterPressAddJX(e){
    var e = e || window.event;
    if(e.keyCode == 13){
        var value = $("input[name='addProductJX']").val().trim();
        addJX(value, function (feedback) {
            if (feedback.status == "200") {
                $(".tips").text("添加成功");
                var str = "<tr name='newAdd' jxId="+ feedback.data.jxId +"><td>" + value + "</td><td><a class='deleteProductJX tooltipped' data-toggle='tooltip' data-placement='left' title='删除'><i class='fa fa-trash' ></i></a></td></tr>";
                $("input[name='addProductJX']").closest("tr").after(str);
                $("input[name='addProductJX']").val("");
            } else {
                $(".tips").text(feedback.msg);
                $("input[name='addProductJX']").focus();
            }
        });
    }
}

function EnterPressAddPackUnit(e){
    var e = e || window.event;
    if(e.keyCode == 13){
        var value = $("input[name='addProductPackUnit']").val().trim();
        addPackUnit(value, function (feedback) {
            if (feedback.status == "200") {
                $(".tips").text("添加成功");
                var str = "<tr name='newAdd' packUnitId="+ feedback.data.packUnitId +"><td>" + value + "</td><td><a class='removePackUnit tooltipped' data-toggle='tooltip' data-placement='left' title='删除'><i class='fa fa-trash' ></i></a></td></tr>";
                $("input[name='addProductPackUnit']").closest("tr").after(str);
                $("input[name='addProductPackUnit']").val("");
            } else {
                $(".tips").text(feedback.msg);
                $("input[name='addProductPackUnit']").focus();
            }
        });
    }
}

function EnterPressAddGSP(e){
    var e = e || window.event;
    if(e.keyCode == 13){
        var value = $("input[name='addProductGSP']").val().trim();
        addGSP(value, function (feedback) {
            if (feedback.status == "200") {
                $(".tips").text("添加成功");
                var str = "<tr name='newAdd' gspId="+ feedback.data.gspId +"><td>" + value + "</td><td><a class='deleteProductGSP tooltipped' data-toggle='tooltip' data-placement='left' title='删除'><i class='fa fa-trash' ></i></a></td></tr>";
                $("input[name='addProductGSP']").closest("tr").after(str);
                $("input[name='addProductGSP']").val("");
            } else {
                $(".tips").text(feedback.msg);
                $("input[name='addProductGSP']").focus();
            }
        });
    }
}
