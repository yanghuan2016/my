/**
 * 公共js库
 */

/**
 * 弹出对话框
 * @param selectDiv
 */
function displayDialog(selectDiv) {
    var decreaseHeight=selectDiv=='purchaseAgreement'?0:0;

    var width = 0, height = 0;
    if (!window.innerWidth) {
        width = (document.documentElement.clientWidth ? document.documentElement.clientWidth : document.body.clientWidth);

        height = (document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.clientHeight);
    } else {
        width = window.innerWidth;
        height = window.innerHeight;
    }
    if(selectDiv!='purchaseAgreement'){
        $(".fadeDiv").css('display', 'block');
    }
    var div = $('#' + selectDiv);
    div.css({
        display: 'block',
        zIndex: 1023,
        position: 'absolute',
        left: (width - div.width()) / 2 + document.body.scrollLeft,
        top: ((height - div.height()) / 2 + document.body.scrollTop) < 0 ? 10 : (height - div.height()) / 2 + document.body.scrollTop -decreaseHeight
    });
}
//清空对话框
function clearDialog() {
    $('.inputBatchNum').val("");
    $('.inputGoodsProduceDate').val("");
    $('.inputGoodsValidDate').val("");
    $('.inputQuantity').val("0");
    $('.inputDrugESC').val("");
    $("#lgNum").text("");
    $("#lgUnit").text("");
    $("#midNum").text("");
    $("#midUnit").text("");
    var iframe = $("iframe[name=picture]");
    iframe.contents().find("span").text("");
    iframe.contents().find("img").remove();
    var fileClass = $(".fileClass");
    if (fileClass.find("img").length > -1) {
        fileClass.find("img").closest("li").remove();
    }
    $(".template-file").remove();
    var template = $(".template-upfile").clone(true);
    template.removeClass("template-upfile");
    template.addClass("template-file");
    template.find("input").attr("name", "file_1");
    template.css("display", "inline-block");
    $(".template-img").before(template);
}

$(function(){

    $('.time').datetimepicker();

    //弹出商品选择框(发货添加商品,退货添加商品)
    $(document).delegate("#selectProductDialog", "click", function () {
        var inflame = $("#addProductToShipIframe");
        inflame.contents().find(".icheckbox").removeClass("checked");
        inflame.contents().find(".chkAll").removeClass("checked");
        displayDialog("addProductToShipIframe");
    });

    $(document).delegate(".defaultdropdown .dropdown-menu > li", "click", function () {
        var text = $(this).find("a").text().trim(),
            value= $(this).find("a").attr('data-value');
        $(this).closest("ul").siblings("button").find("span:first-child").text(text).attr('data-value',value);
    });

    $('#productDate').datetimepicker({
        timepicker: false,
        format: 'Y-m-d',
        minDate: false,
        maxDate: new Date()
    });
    $(document).delegate("#quanlityDate", "focus", function () {
        var startDate = $("#productDate").val()? new Date($("#productDate").val()) : new Date();
        $("#quanlityDate").datetimepicker({
            timepicker: false,
            format: 'Y-m-d',
            startDate: startDate,
            minDate: startDate,
            maxDate: false
        });
    });
});




//更新url中的参数,传为空则不会拼接到url中去 ,请注意 该方法传入的uri需要解码,不然会匹配不到
function updateQueryStringParameterNew(uri, key, value) {
    //待修改 不严谨
    if(value==''||value==null){
        var oldValue=loadPageVar(key);
        return uri.indexOf('&'+key+'='+oldValue)!=-1?uri.replace('&'+key+'='+oldValue,''):uri.replace(key+'='+oldValue,'');
    }
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");//忽略大小写
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (uri.match(re)) {
        return uri.replace(re, '$1' + key + "=" + value + '$2');
    }
    else {
        return uri + separator + key + "=" + value;
    }
}
//将多个参数以对象的方式传入方法,得到最终的url
function handleUrl(parameterObj,url){
    var keys=Object.keys(parameterObj);
    var localurl=url;
    for(var index in keys){
        localurl=updateQueryStringParameterNew(localurl,keys[index],parameterObj[keys[index]]);
    }
    return localurl;
}
//辅助方法  获取url中参数的值
function loadPageVar (sVar) {
    return decodeURI(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURI(sVar).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}