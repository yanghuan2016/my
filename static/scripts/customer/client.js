$(function(){

    $('.gspTime').each(function(){
        IsExprie($(this));
    });

    if(typeof($('#businessLicenseEndDate').val()) !=='undefined'){
        var now = new Date();
        var item = $('#businessLicenseEndDate');
        var mydate = (item.val()).replace(/-/g,"/");
        mydate = new Date(Date.parse(mydate));
        if(mydate < now && item.val()!==''){
            item.css('border-color','red');
        }else{
            item.attr('style', item.attr('style').replace('border-color: red;',''));
        }
    }

    $('#businessLicenseEndDate').change(function(){
        IsExprie($(this));
    });

    $('.gspTime').change(function(){
        IsExprie($(this));
    });

    //客户管理　设置客户单品价格
    $(document).delegate(".setClientGoodsPrice", 'click', function (){
        var price = $('#clientGoodsPrice').val();
        var clientId = $(this).attr("clientId");
        var goodsId = $(this).attr("goodsId");
        var data = {};
        data.price = price;
        if(price == ""){
            artDialogAlertModal("请先填写客户单品价格");
            return;
        }
        data.clientId = clientId;
        data.goodsId = goodsId;
        $.ajax({
            data: data,
            url: '/customer/client/price/addGoods',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status != "9001"){
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = "/customer/client/price?clientId=" + clientId;
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

    //客户管理　批量操作
    $(document).delegate(".batch-custom-action", 'click', function () {
        var data = {};
        var obj = document.getElementsByName("chkmanagement");
        data.clientIds = [];
        for (var k = 0; k < obj.length; k++) {
            if (obj[k].checked) {
                data.clientIds.push(obj[k].value);
            }
        }
        if(data.clientIds.length<1){
            artDialogAlertModal("您没有选中任何客户");
            return;
        }
        data.statusName = $(this).attr("statusName");
        data.status = $(this).attr("status");
        var text = $(this).text();
        $.ajax({
            data: data,
            url: '/customer/client/status/update',
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                artDialogAlertModal((text + feedback.msg), function(){
                    window.location.reload();
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
    //客户管理　新增客户基础信息
    $(document).delegate('.updateBasicInformation', 'click', function(){
/*        var CLIENTGSPTYPES=[];
        $('.icheckbox').each(function(index){
            var attrClass=$(this).attr('class');
            var gspTypeId =$(this).find('input').attr('checkGspId');
            var checked=attrClass.indexOf('checked')>-1;
            if(checked){
                CLIENTGSPTYPES.push(gspTypeId);
            }else{
                for( var i=0;i<CLIENTGSPTYPES.length;i++){
                    if(CLIENTGSPTYPES[i]== gspTypeId){
                        CLIENTGSPTYPES.splice(i,1);
                    }
                }
            }
        });*/
        var phoneNumber= $.trim($('#mobile').val());

        if(ValidateNullOrEmpty(phoneNumber)){
            artDialogAlertModal('请填写电话号码',function(){
                $('#mobile').focus();
            });
            return;
        }

        var isexpire = false;
        $('.gspTime').each(function(index){
            var now = new Date();
            var mydate = ($(this).val()).replace(/-/g,"/");
            mydate = new Date(Date.parse(mydate));
            if(mydate < now &&$(this).val()!==''){
                isexpire = true;
            }
        });
        //if(isexpire){
        //    artDialogAlertModal('存在证照期限小于当前日期,请检查');
        //    return;
        //}

        var phoneReg=/^1[3578]\d{9}$/;
        if(!phoneReg.test(phoneNumber)){
            artDialogAlertModal('电话号码格式不正确',function(){
                $('#mobile').focus();
            });
            return;
        }
        var CLIENTGSPTYPES=[];
        $('#gspTypesIds').find('.iradio').each(function(index,item){
            if($(item).attr('class').indexOf('checked')!=-1){
                var gspTypeId=$(item).find('input').attr('checkGspId');
                CLIENTGSPTYPES.push(gspTypeId)
            }
        });



        customerUpdateClientBasicInfo(CLIENTGSPTYPES,function(feedback){
            if (feedback.status == 200 && feedback.data != undefined) {
                artDialogAlertModal(feedback.msg,function(){
                    window.location.href = "/customer/client";
                });
            } else {
                artDialogAlertModal(feedback.msg);
            }
        });
    });
    //点击修改笔，　修改价格
    $(document).delegate('.inputUpdatePrice', 'click', function(){
        var self = $(this);
        self.find('i').removeClass('fa-pencil');
        self.siblings('input').removeAttr('readonly');
        self.siblings('input').focus();
        self.find('i').addClass('fa-floppy-o');
        self.removeClass('inputUpdatePrice');
        self.addClass('updatePrice');
    });
    //修改价格
    $(document).delegate('.updatePrice', 'click', function(){
        var self = $(this);
        var newPrice = self.siblings('input').val();
        var goodsId = self.closest('tr').attr('goodsId');
        var clientId = self.closest('tr').attr('clientId');
        var data = {
            newPrice : newPrice,
            goodsId : goodsId,
            clientId : clientId
        };
        if(newPrice == "" || goodsId == "" || clientId == ""){
            artDialogAlertModal("失败，请重试");
            return;
        }
        $.ajax({
            data: data,
            url: '/customer/client/price/update',
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
    //删除商品
    $(document).delegate('.removeGoods', 'click', function(){
        var self = $(this);
        var goodsId = self.closest('tr').attr('goodsId');
        var clientId = self.closest('tr').attr('clientId');
        var data = {
            goodsId : goodsId,
            clientId: clientId
        };
        if(goodsId == ""||clientId ==""){
            artDialogAlertModal("失败，请重试");
            return;
        }
        $.ajax({
            data: data,
            url: '/customer/client/price/delete',
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
    //点击添加弹出对话框
    $(document).delegate('.displaySelect', 'click', function () {
        displayDialog("selectGoods");
    });
    //点击添加弹出对话框
    $(document).delegate('.clientSetGoodsPriceInfo', 'click', function () {
        var refRetailPrice = $(this).attr("refRetailPrice");
        var wholesalePrice = $(this).attr("wholesalePrice");
        var price1 = $(this).attr("price1");
        var price2 = $(this).attr("price2");
        var price3 = $(this).attr("price3");
        var setClientGoodsPrice = $(".setClientGoodsPrice");
        setClientGoodsPrice.attr("clientId",$(this).attr("clientId"));
        setClientGoodsPrice.attr("goodsId",$(this).attr("goodsId"));
        var td = $("#selectGoods").find("tbody[name=price]").find("tr").find("td");
        td.eq(0).text(Number(wholesalePrice)!=0?("￥"+Number(wholesalePrice).toFixed(4)):"暂无信息");
        td.eq(1).text(Number(refRetailPrice)!=0?("￥"+Number(refRetailPrice).toFixed(4)):"暂无信息");
        td.eq(2).text(Number(price1)!=0?("￥"+Number(price1).toFixed(4)):"暂无信息");
        td.eq(3).text(Number(price2)!=0?("￥"+Number(price2).toFixed(4)):"暂无信息");
        td.eq(4).text(Number(price3)!=0?("￥"+Number(price3).toFixed(4)):"暂无信息");
        displayDialog("selectGoods");
    });

    //点击添加弹出对话框
    $(document).delegate('.editSub', 'click', function () {
        displayDialog("editSubCategory");
    });
    //点击关闭按钮关闭对话框
    $(document).delegate('.closeIframeGuide','click', function(){
        $(this).closest("li").removeClass("active");
        $(this).closest("ul").find("li").first().addClass("active");
        $(window.parent.document).find('.fadeDiv').css('display', 'none');
        $(window.parent.document).find("#selectGoods").css('display', 'none');
        $(window.parent.document).find("#addSubCategory").css('display', 'none');
        $(window.parent.document).find("#editSubCategory").css('display', 'none');
        $(window.parent.document).find("#addProductToShipIframe").css('display', 'none');
        if($(this).attr('data-cancel')=='goodsPage'){
            $(window.parent.document).find("#selectGoods").attr('src', '');
        }
    });

    $(document).delegate(".setClientCategoryPrice", "click", function () {
        var clientId = $("#inputValue").attr("data-id");
        if(clientId == ""||typeof(clientId)=="undefined"){
            artDialogAlertModal("请选择客户");
            return;
        }
        var price = $("#putClientPrice").val();
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
            clientCategoryid : clientId,
            goodsId : goodsId
        };
        $.ajax({
            data: data,
            url: "/customer/goods/categoryprice/add",
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

    //　取消上传
    $(document).delegate(".cancelGoodsUpload", 'click', function () {
        artDialogAlertModal("添加取消上传的请求, source/client.js  276行")
    });

    //审核客户页面 经营范围的跳转
    $(document).delegate('#home-down-step','click',function(){
        var credits = $("#credits").val();
        if ($("#paytype").val() == "CREDIT" && (credits == "0" || credits == "")) {
            artDialogAlertModalTitleCallBack("温馨提示", "确认授信额度为" + (credits == "" ? "空" : credits) + "吗?", "返回修改", "确认", function () {
                $("#credits").focus();
            }, function () {
                $('#GSP-new').find('a').trigger('click');
            });
        } else {
            $('#GSP-new').find('a').trigger('click');
        }
    });
    $(document).delegate('#gsp-up-step','click',function(){
        $('#basic-new').find('a').trigger('click');
    });
    $(document).delegate('#gsp-down-step','click',function(){
        $('#business-new').find('a').trigger('click');
    });
    $(document).delegate('#business-up-step','click',function(){
        $('#GSP-new').find('a').trigger('click');
    });


//审核客户页面 经营范围的选项

    $(".business-scope").find('.controlRange').each(function(index,item){
            if($(item).attr('data-isselect')=='true'){
                $(item).find('.icheckbox').addClass('checked');
            }
        if($(".business-scope").find("#business-update>div").hasClass('checked')){
            $(item).find('.icheckbox').addClass('checked');
        }

    });


    //确认通过审核
    $(document).delegate(".comfirmPassReview", "click", function () {
        var data = {};
        var clientInfo = {};
        var gspInfo = {};
        var clientId=$(this).attr("id");
        //baseInfo
        clientInfo.clientName = $("#clientName").val();
        clientInfo.clientCode = $("#clientCode").val();
        clientInfo.mobile = $('#mobile').val();
        gspInfo.legalRepresentative = $('#legalRepresentative').val();
        gspInfo.registeredCapital = $('#registeredCapital').val();
        gspInfo.businessAddress = $('#businessAddress').val();

        clientInfo.clientCategoryId = $("#clientCategoryId").val();
        clientInfo.clientArea = $("#clientArea").val();
        clientInfo.paymentType = $("#paytype").val();
        clientInfo.pricePlan = $("input[name='pricePlan']:checked").val();
        // hospitalLevel val
        clientInfo.hospitalLevel= $("#hospitalLevelId").find("option:selected").text();
        // hospitalGrades val
        clientInfo.hospitalGrades= $("#hospitalGradesId").find("option:selected").val();
        // credits
        data.credits = $("#credits").val();
        data.clientInfo = clientInfo;
        data.clientId = $(this).attr("id");
        data.status= $.trim($(this).attr('data-status'));

        //GSP
        gspInfo.businessLicense = $("#businessLicense").val();
        gspInfo.businessLicenseValidateDate = $("#businessLicenseValidateDate").val();
        gspInfo.orgCode = $("#orgCode").val();
        gspInfo.orgCodeValidateDate = $("#orgCodeValidateDate").val();
        gspInfo.taxRegistrationLicenseNum = $("#taxRegistrationLicenseNum").val();
        gspInfo.taxRegistrationLicenseNumValidateDate = $("#taxRegistrationLicenseNumValidateDate").val();
        gspInfo.gmpOrGspLicenseNum = $("#gmpOrGspLicenseNum").val();
        gspInfo.gmpOrGspLicenseNumValidateDate = $("#gmpOrGspLicenseNumValidateDate").val();
        gspInfo.medicalInstitutionLicenseNum = $("#medicalInstitutionLicenseNum").val();
        gspInfo.medicalInstitutionLicenseNumValidateDate = $("#medicalInstitutionLicenseNumValidateDate").val();
        gspInfo.institutionLegalPersonCert = $("#institutionLegalPersonCert").val();
        gspInfo.institutionLegalPersonCertValidateDate = $("#institutionLegalPersonCertValidateDate").val();
        gspInfo.productionAndBusinessLicenseNum = $("#productionAndBusinessLicenseNum").val();
        gspInfo.productionAndBusinessLicenseNumValidateDate = $("#productionAndBusinessLicenseNumValidateDate").val();
        gspInfo.foodCirculationLicenseNum = $("#foodCirculationLicenseNum").val();
        gspInfo.foodCirculationLicenseNumValidateDate = $("#foodCirculationLicenseNumValidateDate").val();
        gspInfo.medicalApparatusLicenseNum = $("#medicalApparatusLicenseNum").val();
        gspInfo.medicalApparatusLicenseNumValidateDate = $("#medicalApparatusLicenseNumValidateDate").val();
        gspInfo.healthProductsLicenseNum = $("#healthProductsLicenseNum").val();
        gspInfo.healthProductsLicenseNumValidateDate = $("#healthProductsLicenseNumValidateDate").val();
        gspInfo.mentaanesthesiaLicenseNum = $("#mentalanesthesiaLicenseNum").val();
        gspInfo.mentalanesthesiaLicenseNumValidateDate = $("#mentalanesthesiaLicenseNumValidateDate").val();
        gspInfo.hazardousChemicalsLicenseNum = $("#hazardousChemicalsLicenseNum").val();
        gspInfo.hazardousChemicalsLicenseNumValidateDate = $("#hazardousChemicalsLicenseNumValidateDate").val();
        gspInfo.maternalLicenseNum = $("#maternalLicenseNum").val();
        gspInfo.maternalLicenseNumValidateDate = $("#maternalLicenseNumValidateDate").val();
        gspInfo.limitedBusinessRange = $("#limitedBusinessRange").val();
        //检查是否有填了证照没填日期或者填了日期没填证照的情况
        var except = ['legalRepresentative', 'registeredCapital',
            'businessAddress', 'limitedBusinessRange', 'businessLicenseValidateDate'];
        var dateReg = /ValidateDate$/;
        for(var key in gspInfo){
            if(gspInfo.hasOwnProperty(key)){
                if($.inArray(key, except) !== -1){
                    continue;
                }
                if(gspInfo[key] !== ''){
                    //检查对应名称或日期
                    if(dateReg.test(key)){
                        if($('#'+key.replace('ValidateDate','')).val() == ''){
                            $('#'+key.replace('ValidateDate','')).focus();
                            artDialogAlertModal('请填写对应证照编号');
                            return;
                        }
                    }else{
                        if($('#'+key+'ValidateDate').val() == ''){
                            $('#'+key+'ValidateDate').focus();
                            artDialogAlertModal('请填写对应过期时间');
                            return;
                        }
                    }
                }
            }
        }
         var batchInsertGspTypesData=[];
        $('#gspTypesIds').find('.iradio').each(function(index,item){
                var obj=[];
                if($(item).attr('class').indexOf('checked')!=-1){
                        var gspTypeId = Number($(item).find('input').attr('checkGspId'));
                        obj.push(clientId,gspTypeId);
                        batchInsertGspTypesData.push(obj);
                }
        });
        data.gspTypes=batchInsertGspTypesData;
        var goodsGspTypeList=[];
        $('.controlRange').each(function(index,item){
               var ele= $(item).find('.icheckbox').eq(0);
                if(ele.hasClass('checked')){
                    goodsGspTypeList.push(Number($(item).attr('id')));
                }
        });
        data.goodsGspTypeList=goodsGspTypeList;
        data.gspTypes=batchInsertGspTypesData;


        var isexpire = {
            isexpire: false,
            element:null
        };
        $('.gspTime').each(function(index){
            var now = new Date();
            var mydate = ($(this).val()).replace(/-/g,"/");
            mydate = new Date(Date.parse(mydate));
            if(mydate < now &&$(this).val()!==''){
                isexpire.isexpire = true;
                isexpire.element = $(this);
            }
        });
        //if(isexpire.isexpire){
        //    var licName = isexpire.element.parents('tr').find('td:first-child').text();
        //    artDialogAlertModal(licName.replace(':', '') + '的证照期限小于当前日期,请检查');
        //    return;
        //}

        //var canUpload = $('#gspEditUploadBtn').attr('data-imagemodify') == "true";
        //if (!canUpload) {
        //    artDialogAlertModal('附件做了修改,请上传附件之后再提交数据');
        //    return;
        //}
        var allImageUrls = {};
        var stampLink={};
        //data.images=[];
        //获取所有用户现在上传或者修改的图片
        //var modifyOrAddImgs = [];//iframe下面的所有的修改数据集合
        //$('#picture').contents().find('img').map(function () {
        //    modifyOrAddImgs.push($(this).attr('src'));
        //});
        var imageContainer = $('.showpicture');
        imageContainer.find('img').each(function() {
            var $Urlname=$(this).parent().find('input');
            allImageUrls[$Urlname.attr('name')]=$(this).attr('src');
            //if (currentImg.attr('name') == 'realSrc') {
            //allImageUrls.push(currentImg.attr('src'));
            //    } else {
            //        var currentModifyorAddImgSrc = modifyOrAddImgs[0];
            //        allImageUrls.push(currentModifyorAddImgSrc);
            //        modifyOrAddImgs.shift();
            //    }
        });
        //
        //data.stampLink = allImageUrls[4];//之前是pop()若是用户新增了自己的其他附件,会有错
        //allImageUrls.splice(4, 1);

        data.stampLink=allImageUrls['stampLink'];
        delete allImageUrls['stampLink'];

        //data.gspInfo =  allImageUrls;
        gspInfo.gspImages=JSON.stringify(allImageUrls);
        data.gspInfo =gspInfo;

        if($('#clientCategory').attr('style')=="") {
            var required = ['businessLicense', 'businessLicenseValidateDate',
                'limitedBusinessRange', 'gmpOrGspLicenseNum'];
            var hasPrb = false;
            for(var i=0;i<required.length;i++){
                if(
                    ((typeof gspInfo[required[i]]) === 'undefined')
                    || gspInfo[required[i]] === ''
                    || gspInfo[required[i]] === null)
                {
                    var licName = $('#'+ required[i]).parents('tr').find('td:first-child').text().replace(':', '');
                    artDialogAlertModal("请完善"+ licName);
                    return;
                }
            }

            if (
                clientInfo.clientArea == ""||
                clientInfo.clientArea==null
                ) {
                artDialogAlertModal("请完善带＊的信息");
                return;
            }

            if (data.gspTypes == "") {
                artDialogAlertModal("请选择GSP控制类型");
                return;
            }
            if (typeof(clientInfo.pricePlan) == "undefined") {
                artDialogAlertModal("请选择价格方案");
                return;
            }

            if ( data.gspTypes[0][1] == 4 ) {
                if ((clientInfo.hospitalGrades === "") || (clientInfo.hospitalLevel === '请选择医疗级别')) {
                    artDialogAlertModal("请选择医疗级别和医疗等次");
                    return;
                }
            }
        }
        artDialogInputModal("请填写通过意见",function(approveReason){
            data.approveReason=approveReason;
            //最后发送数据
            var url = "/customer/client/review";
            $.ajax({
                data: data,
                url: url,
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 10000,
                success: function (feedback) {
                    if(feedback.status == "200"){
                        artDialogAlertModal(feedback.msg,function(){
                            window.location.href = "/customer/client";
                        });
                    }else{
                        artDialogAlertModal(feedback.msg);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                },
                beforeSend:function(){
                    $('.comfirmPassReview').attr('disabled',true);
                    $('.cancelPassReview').attr('disabled',true);
                },
                complete:function(){
                    $('.comfirmPassReview').attr('disabled',false);
                    $('.cancelPassReview').attr('disabled',false);
                }

            });
        },false,'通过意见');
    });
    //退回审核
    $(document).delegate(".cancelPassReview", "click", function () {
        var clientStatus=$(this).attr('data-status');
        var data = {};
        data.clientId = $(this).attr("id");
        data.phoneNumber= $.trim($('#clientPhoneNumber').val());
        data.loginAccount= $.trim($('#loginAccount').val());
        data.clientStatus=clientStatus;
        artDialogInputModal("请填写退回理由(必填)",function(rejectReason){
            data.rejectReson=rejectReason;
            var url = "/customer/client/reject";
            $.ajax({
                data: data,
                url: url,
                type: 'post',
                dataType: 'json',
                cache: false,
                //timeout: 5000,
                success: function (feedback) {
                    if(feedback.status == "200"){
                        artDialogAlertModal(feedback.msg,function(){
                            window.location.href = "/customer/client/toReview";
                        });
                    }else{
                        artDialogAlertModal(feedback.msg);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                },
                beforeSend:function(){
                    $('.comfirmPassReview').attr('disabled',true);
                    $('.cancelPassReview').attr('disabled',true);
                },
                complete:function(){
                    $('.comfirmPassReview').attr('disabled',false);
                    $('.cancelPassReview').attr('disabled',false);
                }
            });
        },true,'请填写退回原因');
    });
});

function customerUpdateClientBasicInfo(clientGspTypes,callback){
    var data = {};
    var clientInfo = {};
    var gspInfo = {};
    var CLIENTGSPTYPES=clientGspTypes;
    //baseInfo
    clientInfo.clientName = $("#clientName").val();
    clientInfo.clientCode = $("#clientCode").val();
    clientInfo.mobile = $('#mobile').val();
    gspInfo.legalRepresentative = $('#legalRepresentative').val();
    gspInfo.registeredCapital = $('#registeredCapital').val();
    gspInfo.businessAddress = $('#businessAddress').val();

    clientInfo.clientCategoryId = $("#categoryName").val();
    clientInfo.clientArea = $("#clientArea").val();
    clientInfo.paymentType = $("#paytype").val();
    clientInfo.pricePlan = $("input[name='pricePlan']:checked").val();
    // hospitalLevel val
    clientInfo.hospitalLevel= $("#hospitalLevelId").find("option:selected").text();
    // hospitalGrades val
    clientInfo.hospitalGrades= $("#hospitalGradesId").find("option:selected").val();
    data.clientInfo = clientInfo;
    data.clientId = $('.updateBasicInformation').eq(0).attr("id");
    data.status= $.trim($(this).attr('data-status'));
    var credits= $.trim($("#credits").val());
    var regNumber=/^\d+(\.\d+)?$/;
    if(!regNumber.test(credits)){
        artDialogAlertModal('授信额度,请输入正确的数字',function(){
            $('#basic-new').find('a').trigger('click');
            $('#credits').focus();
        });
        return;
    }
    data.credits =credits ;

    //GSP
    gspInfo.businessLicense = $("#businessLicense").val();
    gspInfo.businessLicenseValidateDate = $("#businessLicenseEndDate").val();
    gspInfo.limitedBusinessRange = $("#limitedBusinessRange").val();
    gspInfo.orgCode = $("#orgCode").val();
    gspInfo.orgCodeValidateDate = $("#orgCodeValidateDate").val();
    gspInfo.taxRegistrationLicenseNum = $("#taxRegistrationLicenseNum").val();
    gspInfo.taxRegistrationLicenseNumValidateDate = $("#taxRegistrationLicenseNumValidateDate").val();
    gspInfo.gmpOrGspLicenseNum = $("#gmpOrGspLicenseNum").val();
    gspInfo.gmpOrGspLicenseNumValidateDate = $("#gmpOrGspLicenseNumValidateDate").val();
    gspInfo.medicalInstitutionLicenseNum = $("#medicalInstitutionLicenseNum").val();
    gspInfo.medicalInstitutionLicenseNumValidateDate = $("#medicalInstitutionLicenseNumValidateDate").val();
    gspInfo.institutionLegalPersonCert = $("#institutionLegalPersonCert").val();
    gspInfo.institutionLegalPersonCertValidateDate = $("#institutionLegalPersonCertValidateDate").val();
    gspInfo.productionAndBusinessLicenseNum = $("#productionAndBusinessLicenseNum").val();
    gspInfo.productionAndBusinessLicenseNumValidateDate = $("#productionAndBusinessLicenseNumValidateDate").val();
    gspInfo.foodCirculationLicenseNum = $("#foodCirculationLicenseNum").val();
    gspInfo.foodCirculationLicenseNumValidateDate = $("#foodCirculationLicenseNumValidateDate").val();
    gspInfo.medicalApparatusLicenseNum = $("#medicalApparatusLicenseNum").val();
    gspInfo.medicalApparatusLicenseNumValidateDate = $("#medicalApparatusLicenseNumValidateDate").val();
    gspInfo.healthProductsLicenseNum = $("#healthProductsLicenseNum").val();
    gspInfo.healthProductsLicenseNumValidateDate = $("#healthProductsLicenseNumValidateDate").val();
    gspInfo.mentaanesthesiaLicenseNum = $("#mentaanesthesiaLicenseNum").val();
    gspInfo.mentalanesthesiaLicenseNumValidateDate = $("#mentalanesthesiaLicenseNumValidateDate").val();
    gspInfo.hazardousChemicalsLicenseNum = $("#hazardousChemicalsLicenseNum").val();
    gspInfo.hazardousChemicalsLicenseNumValidateDate = $("#hazardousChemicalsLicenseNumValidateDate").val();
    gspInfo.maternalLicenseNum = $("#maternalLicenseNum").val();
    gspInfo.maternalLicenseNumValidateDate = $("#maternalLicenseNumValidateDate").val();


    //检查是否有填了证照没填日期或者填了日期没填证照的情况
    var except = ['legalRepresentative', 'registeredCapital',
        'businessAddress', 'limitedBusinessRange', 'businessLicenseValidateDate'];
    var dateReg = /ValidateDate$/;
    for(var key in gspInfo){
        if(gspInfo.hasOwnProperty(key)){
            if($.inArray(key, except) !== -1){
                continue;
            }
            if(gspInfo[key] !== ''){
                //检查对应名称或日期
                if(dateReg.test(key)){
                    if($('#'+key.replace('ValidateDate','')).val() == ''){
                        $('#'+key.replace('ValidateDate','')).focus();
                        artDialogAlertModal('请填写对应证照编号');
                        return;
                    }
                }else{
                    if($('#'+key+'ValidateDate').val() == ''){
                        $('#'+key+'ValidateDate').focus();
                        artDialogAlertModal('请填写对应过期时间');
                        return;
                    }
                }
            }
        }
    }

    //var canUpload = $('#gspEditUploadBtn').attr('data-imagemodify') == "true";
    //if (!canUpload) {
    //    artDialogAlertModal('附件做了修改,请上传附件之后再提交数据');
    //    return;
    //}
    var allImageUrls = {};
    var stampLink={};
    //data.images=[];
    //获取所有用户现在上传或者修改的图片
    //var modifyOrAddImgs = [];//iframe下面的所有的修改数据集合
    //$('#picture').contents().find('img').map(function () {
    //    modifyOrAddImgs.push($(this).attr('src'));
    //});
    var imageContainer = $('.showpicture');
    imageContainer.find('img').each(function() {
        var $Urlname=$(this).parent().find('input');
        allImageUrls[$Urlname.attr('name')]=$(this).attr('src');
        //if (currentImg.attr('name') == 'realSrc') {
        //allImageUrls.push(currentImg.attr('src'));
        //    } else {
        //        var currentModifyorAddImgSrc = modifyOrAddImgs[0];
        //        allImageUrls.push(currentModifyorAddImgSrc);
        //        modifyOrAddImgs.shift();
        //    }
    });
    //
    //data.stampLink = allImageUrls[4];//之前是pop()若是用户新增了自己的其他附件,会有错
    //allImageUrls.splice(4, 1);

    data.stampLink=allImageUrls['stampLink'];
    delete allImageUrls['stampLink'];

    //data.gspInfo =  allImageUrls;
    gspInfo.gspImages=JSON.stringify(allImageUrls);
    data.gspInfo =gspInfo;




    if($.trim(CLIENTGSPTYPES)==null||$.trim(CLIENTGSPTYPES)==""){
        artDialogAlertModal('请至少选择一个GSP控制类型',function(){
        });
        return;
    }
    data.gspTypes=CLIENTGSPTYPES;

    var goodsGspTypeList=[];
    $('.business-more').find('.controlRange').each(function(index,item){
        var ele= $(item).find('.icheckbox').eq(0);
        if(ele.hasClass('checked')){
            goodsGspTypeList.push(Number($(item).attr('id')));
        }
    });
    data.goodsGspTypeList=goodsGspTypeList;


    //填写检查
    var required = ['businessLicense', 'businessLicenseValidateDate',
        'limitedBusinessRange', 'gmpOrGspLicenseNum'];
    var hasPrb = false;
    for(var i=0;i<required.length;i++){
        if(
            ((typeof gspInfo[required[i]]) === 'undefined')
            || gspInfo[required[i]] === ''
            || gspInfo[required[i]] === null)
        {
            var licName = $('#'+ required[i]).parents('tr').find('td:first-child').text().replace(':', '');
            artDialogAlertModal("请完善"+ (licName || '带*的必填信息'));
            return;
        }
    }

    if (
        clientInfo.clientArea == ""||
        clientInfo.clientArea==null
    ) {
        artDialogAlertModal("请完善带＊的信息");
        return;
    }

    if (data.gspTypes == "") {
        artDialogAlertModal("请选择GSP控制类型");
        return;
    }
    if (typeof(clientInfo.pricePlan) == "undefined") {
        artDialogAlertModal("请选择价格方案");
        return;
    }

    if ( data.gspTypes[0][1] == 4 ) {
        if ((clientInfo.hospitalGrades === "") || (clientInfo.hospitalLevel === '请选择医疗级别')) {
            artDialogAlertModal("请选择医疗级别和医疗等次");
            return;
        }
    }

    if (typeof(clientInfo.pricePlan) == 'undefined' || clientInfo.clientArea == "" || clientInfo.clientCategoryId == "") {
        callback({
            status : 600,
            msg: "完善待＊的项目"
        });
        return;
    }


    var clientIdSearch = window.location.search;
    data.oldCredits=$('#credits').attr('oldCredits');
    $.ajax({
        data: data,
        url: '/customer/client/update' + clientIdSearch,
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (feedback) {
            callback(feedback);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            callback({
                status : 600,
                msg : 'error ' + textStatus + " " + errorThrown
            });
        }
    });
}

function IsExprie(item){
    var now = new Date();
    if($(item).length==0){
        return;
    }
    var mydate = (item.val()).replace(/-/g,"/");
    mydate = new Date(Date.parse(mydate));
    if(mydate < now && item.val()!==''){
        item.css('border-color','red');
    }else{
        item.attr('style', item.attr('style').replace('border-color: red;',''));
    }
}