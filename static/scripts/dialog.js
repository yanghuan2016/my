/**
 * Created by kevin on 15-10-24.
 */
function artDialogPromptModal(content,callback){
    var d= dialog({
        title:"提示",
        content:content,
        opacity:0.5,
        button: [{
            value: '确定',
            callback: function () {
                this.close().remove();
                if(jQuery.isFunction(callback)){
                    callback();
                }
            },
            autofocus: true
        }, {
            value: '取消',
            callback: function () {
                this.close().remove();
            }
        }]

    });
    d.showModal().width(400);
}


function artDialogPromptModalExtend(content,title,okValue,cancelValue,callback){
    var content=content,
        title=title||'提示',
        okValue=okValue||'确定',
        cancelValue=cancelValue||'取消';
    var d= dialog({
        title:title,
        content:content,
        opacity:0.5,
        button: [{
            value: okValue,
            callback: function () {
                this.close().remove();
                if(jQuery.isFunction(callback)){
                    callback();
                }
            },
            autofocus: true
        }, {
            value: cancelValue,
            callback: function () {
                this.close().remove();
            }
        }]

    });
    d.showModal().width(400);
}


function artDialogAlert(content,callback){
    var d= dialog({
        title:"温馨提示",
        okValue:"确定",
        content:content,
        ok:function(){
            this.close().remove();
            if(jQuery.isFunction(callback)){
                callback();
            }
        }
    });
    if(dialog.getCurrent()==null)
    {
        d.show().width(400);
    }
}
function artDialogAlertModalTitleWidthBtn(content,okValue,width,title,callback){
    okValue = okValue || '确定';
    width = width || 400;
    var d= dialog({
        title:title,
        content:content,
        okValue: okValue,
        opacity:0.5,
        ok:function(){
            this.close().remove();
            if(jQuery.isFunction(callback)){
                callback();
            }
        }
    });
    if(dialog.getCurrent()==null)
    {
        d.showModal().width(width);
    }
}

function artDialogAlertTitleWithoutCancel(title,okValue, callback){
    var d= dialog({
        title:title,
        content:"<div style='display: flex; justify-content: center; align-items: center'>" +
                "<label for='rejectCheckBox' style='display: flex;align-content: center;cursor: pointer'>" +
                "<input type='checkbox' id='rejectCheckBox' name='rejectCheckBox' checked/>生成拒收单</label></div>",
        okValue:okValue,
        ok:function(){
            var isReject = $("input[name='rejectCheckBox']").prop('checked');
            if(jQuery.isFunction(callback)){
                callback(isReject);
            }
        }
    });
    if(dialog.getCurrent()==null)
    {
        d.show().width(400);
    }
}

//shade div
function artDialogAlertModal(content,callback){
    var d= dialog({
        title:"提示",
        content:content,
        okValue:"确定",
        opacity:0.5,
        cancel:false,
        ok:function(){
            this.close().remove();
            if(jQuery.isFunction(callback)){
                callback();
            }
        }
    });
    d.showModal().width(400);
}

function artDialogPure(content){
    var d = dialog({
        content: content,
        opacity:0.5,
        padding:0
    });
    d.showModal();
    window._dialog = d;
}


function artDialogInputModal(title,callback,contentRequired,contentRequireTip){
    var d = dialog({
        title: title,
        content: '<textarea id="artText"  style="resize:none;width:500px;height:170px"></textarea>',
        button:[{
            value:"确定",
            callback:function(){
                var textVal=$("#artText").val();
                if(contentRequired){
                    if($.trim(textVal)==""){
                        $('#artText').attr('placeholder',contentRequireTip);

                        if(!(detectIE()&&detectIE()<=9)){
                            $('#artText').val('');
                        }
                        if(!detectIE()){
                            $('#artText').focus();
                        }
                        return false;
                    }
                }
                callback(textVal);
            },
            autofocus:true
        },{
            value:"取消",
            callback:function(){
                this.close().remove();
            }
        }]
    });
    d.showModal();
}

//shade div
function artDialogAlertModalTitle(title,content,callback){
    var d= dialog({
        title:title,
        content:content,
        opacity:0.5,
        button:[{
            value:"确定",
            callback:function(){
                this.close().remove();
                if(jQuery.isFunction(callback)){
                    callback();
                }
            },
            autofocus:true
        },{
            value:"取消",
            callback:function(){
                this.close().remove();
            }
        }]
    });
    d.showModal().width(400);
}
//shade div
function artDialogAlertModalTitleCallBack(title,content,valueleft,valueright, callbackleft, callbackright){
    var d= dialog({
        title:title,
        content:content,
        opacity:0.5,
        button:[{
            value:valueleft,
            callback:function(){
                this.close().remove();
                callbackleft();
            },
            autofocus:true
        },{
            value:valueright,
            callback:function(){
                this.close().remove();
                callbackright();
            }
        }]
    });
    d.showModal().width(400);
}

function artDialogAlertModalCustomered(title,content,sureButton,cancelButton,callback){
    var d= dialog({
        title:title,
        content:content,
        opacity:0.5,
        button:[{
            value:"好的知道了",
            callback:function(){
                this.close().remove();
                if(jQuery.isFunction(callback)){
                    callback();
                }
            },
            autofocus:true
        },{
            value:"暂不处理",
            callback:function(){
                this.close().remove();
            }
        }]
    });
    d.showModal().width(400);
}


//提示用户登陆才能添加进购物车
function addToCartModal(nextTo){
    dialog(
        {
            title: '温馨提示',
            content: '登录之后才能加入购物车,离开去登录?',
            button: [{
                value: '去登录',
                callback: function () {
                    window.location.href = '/login?nextTo=' + nextTo;
                },
                autofocus: true
            }, {
                value: '继续逛',
                callback: function () {

                }
            }]
        }
    ).showModal().width(400);
}


//shade div
function licensenExpireModal(clientId,callback){
    var d= dialog({
        title:"提示",
        content:"<h5>该客户有证照已过期,无法启购,请联系客户更新证照</h5>" +
                "<a href='/customer/client/add?clientId="+clientId+'&&active=gsp'+"'>查看详情</a>",
        okValue:"关闭",
        opacity:0.5,
        cancel:false,
        ok:function(){
            this.close().remove();
            if(jQuery.isFunction(callback)){
                callback();
            }
        }
    });
    d.showModal().width(500);
}


//添加进购物车去结算还是继续逛
function goOnShoppingOrCheck(content,sureText,cancelText){
    content=content||'商品已成功加入购物车,现在去结算?';
    sureText=sureText||'去结算';
    cancelText=cancelText||'继续逛';
    dialog(
        {
            title: '温馨提示',
            content: content,
            button: [{
                value: sureText,
                callback: function () {
                    window.location.href = '/cart';
                },
                autofocus: true
            }, {
                value: cancelText,
                callback: function () {
                    this.close().remove();
                }
            }
            ]

        }
    ).showModal().width(400);
}


function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // IE 12 (aka Edge) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}
//newCustomerDialogWindowFunction//todo


function autoCloseTips(title,time,callback){
    time=time|1000;
    var htmlStr='<div class="" style="padding-bottom:10px;line-height:90px;border-radius: 10px;min-width:370px;min-height:90px;text-align:center">'+title+'</div>';
    var d = dialog({
        padding:0.5,
        title:'提示信息',
        content: htmlStr,
        align: 'top left',
        quickClose: false
    });
    d.addEventListener('remove', function(){
        if(jQuery.isFunction(callback)){
            callback();
        }
    });
    d.showModal();
    setTimeout(function () {
        d.close().remove();
    }, time);
}



/*function artTest(content,callback){
    var d= dialog({
        title:"提示",
        content:content,
        okValue:"确定",
        opacity:0.5,
        cancel:false,
        ok:false

    });
    d.showModal().width(400);
    setTimeout(function () {
        d.close().remove();
    }, 1000);
}*/


