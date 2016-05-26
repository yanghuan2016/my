//carosel operation
$(document).delegate('#carouselSaveBtn', 'click', function () {
    //判断图片上传成功没有
    var carouselImg = $('#carouselImg');//TODO

    var imgObj = $('#picture').contents().find('img').eq(0);
    var carouselImgurl = imgObj.length != 0 ? imgObj.eq(0).attr('src') : null;
    if (!carouselImgurl) {
        artDialogAlertModal('请上传图片');
        return false;
    }
    var name = $('#carouselName').val();
    var url = $('#carouselUrl').val();
    var beginAt = $('#carouselBeginAt').val();
    var endAt = $('#carouselEndAt').val();
    var remark = $('#carouselRemark').val();
    var displayText=$('#displayText').val();
    if(ValidateNullOrEmpty(beginAt)||ValidateNullOrEmpty(endAt)){
        artDialogAlertModal("生效时间和失效时间是必填的,请确认");
        return;
    }
    if(!moment(beginAt).isValid()||!moment(endAt).isValid()){
        artDialogAlertModal('输入的时间不合法,请确认');
        return;
    }

    if(new Date(endAt)<new Date(beginAt)){
        artDialogAlertModal("失效时间不能早于生效时间,请确认");
        return;
    }
    if (ValidateNullOrEmpty(name)) {
        artDialogAlertModal('请填写广告名称');
        return;
    }

    if(displayText.length>112){
        artDialogAlertModal('图片说明字符不能超过110个,请删掉一下',function(){
            $('#displayText').focus();
        });
        return;
    }
    var hiddenId = $('#carousel_HiddenId').val();
    if (hiddenId) {
        //更新
        $.ajax({
            url: "/rest/customer/portal/carousel",
            type: "put",
            data: {
                id: hiddenId,
                img: carouselImgurl,
                title: name,
                url: url,
                startOn: beginAt,
                endOn: endAt,
                remark: remark,
                displayText:displayText
            },
            success: function (feedback) {
                if (feedback.status == 200) {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = "/page/customer/portal/carousel"
                    });
                }
                else {
                    artDialogAlertModal(feedback.msg);
                }
            }
        })
    }
    else {
        //添加
        $.ajax({
            url: "/rest/customer/portal/carousel",
            type: "post",
            data: {
                img: carouselImgurl,
                title: name,
                url: url,
                startOn: beginAt,
                endOn: endAt,
                remark: remark,
                displayText:displayText
            },
            success: function (feedback) {
                if (feedback.status == 200) {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = "/page/customer/portal/carousel";
                    });
                }
                else {
                    artDialogAlertModal(feedback.msg);
                }
            }
        })
    }
});

$(document).delegate('.carousel_UpOrder','click',function(){
        var self=$(this);

    var currentIndex=$('.carousel_UpOrder').index(self);
    if(currentIndex==0)
    {
        artDialogAlert("该橱窗当前已在第一位");
        return;
    }

    var currentTr=self.parents('tr').eq(0);
    var currentTable=self.parents('table').eq(0);

    currentTable.find('tr').eq(1).before(currentTr);

    currentTable.find('tr:last').css('display','table-row');

});


$(document).delegate('#CarouselSaveOrderBtn','click',function(){
            var allHiddenIds=$('[data-id]');
            var realIds=[];
            allHiddenIds.map(function(){
                realIds.push($(this).val());
                return $(this).val();
            });
            $.ajax({
                type:"post",
                data:{ids:realIds},
                url:"/rest/customer/portal/carousel/updateOrderSeq",
                success:function(feedback){
                    artDialogAlertModal(feedback.msg);
                },
                error:function(){

                }
            })

});

$(document).delegate('.delete_carousel','click',function(){
    var self=$(this);
    var deleteId=$(this).parents('tr').eq(0).find('[data-id]').val();
    artDialogPromptModal('确定要删除该条数据？',function(){
        $.ajax({
            type:"delete",
            url:"/rest/customer/portal/carousel/"+deleteId,
            success:function(feedback){
                        //TODO  直接删除当前dom 行
                if(feedback.status==200){
                    artDialogAlertModal(feedback.msg,function(){
                            self.parents('tr').remove();
                    });
                }
                else{
                    artDialogAlertModal(feedback.msg);
                }
            }
        })
    })
});


$('.addcart').click(function(event){
    event.preventDefault();
    var listId = $(this).attr('data-type');
    $.ajax({
        url:"/portal/purchaseList/addToCart",
        type: "get",
        data:{
            listId:listId
        },
        success:function(feedback){
            console.log(feedback);
            if(feedback.status == '6001'){
                artDialogAlertModal(feedback.msg);
            }else if(feedback.status == '200'){
                window.location.href='/cart';
            }else{
                artDialogAlertModal('操作失败,请重试');
            }
        },
        error:function(){
            artDialogAlertModal('网络状况不好,请稍后再试');
        }
    })
});

//news operation
$(document).delegate('.newsSaveBtn','click',function(){
        var newsTitle=$('#newsTitle').val();
        var newsContent=UE.getEditor('editor').getContent();
        if(ValidateNullOrEmpty(newsTitle)||ValidateNullOrEmpty(newsContent)){
            artDialogAlertModal("标题和内容不能为空");
            return;
        }
        var newsId=$('#newsId').val();
        if(newsId != ""){
            //更新新闻
            $.ajax({
               type:"put",
                url:"/rest/customer/portal/news",
                data:{
                    id:newsId,
                    title:newsTitle,
                    Content:newsContent
                },
                success:function(feedback){
                    if(feedback.status == "200"){
                        artDialogAlertModal(feedback.msg, function(){
                            window.location.href = "/page/customer/portal/news";
                        });
                    }else {
                        artDialogAlertModal(feedback.msg);
                    }
                }
            });

        }
        else{
            //添加新闻
            $.ajax({
                type:"post",
                url:"/rest/customer/portal/news",
                data:{
                    title:newsTitle,
                    Content:newsContent
                },
                success:function(feedback){
                    if(feedback.status == "200"){
                        artDialogAlertModal(feedback.msg, function(){
                            window.location.href = "/page/customer/portal/news";
                        });
                    }else {
                        artDialogAlertModal(feedback.msg);
                    }
                }
            });
        }
});

$(document).delegate('.delete_news','click',function(){
    var self = $(this);
    var deleteId=$(this).attr("data-newId");
    artDialogPromptModal('确定要删除该条数据？',function(){
       $.ajax({
           type:"delete",
           url:"/rest/customer/portal/news/"+deleteId,
           success:function(feedback){
               if(feedback.status == "200"){
                   //删除dom元素
                   self.parents('tr').eq(0).remove();
               }else {
                   artDialogAlert(feedback.msg);
               }
           }
       });
    })
});


//showcase operation




//提升橱窗商品顺序
$(document).delegate('.updateSCGoodOrderBtn','click',function(){
    var allObjs=$('.updateSCGoodOrderBtn');
    var self=$(this);
    var currentIndex=allObjs.index(self);
    if(currentIndex==0){
        artDialogAlert("该商品当前已在第一位");
        return;
    }
    var currentTr=self.parents('tr').eq(0);
    var currentTable=self.parents('table').eq(0);
    currentTable.find('tr').eq(1).before(currentTr);
    var saveBtnDisplaySelect = $("#saveBtnDisplay");
    if(saveBtnDisplaySelect.css('display')=='none') {
        saveBtnDisplaySelect.css('display', 'block');
    }

/*    var goodslength=allObjs.length;
    var postData=[];

    for(var i=0;i<goodslength;i++){
        var obj={
            id:allObjs.eq(i).attr('data-id'),
            orderSeq:allObjs.eq(i).attr('data-orderSeq'),
            modifyStatus:i==currentIndex
        }
        postData.push(obj);
    }
    $.ajax({
            type:"post",
            data:postData,
            url:"/portal/updateSCGoodOrderSeqHandler/"+$(this).attr('data-id'),
            success:function(){
                window.location.reload();
                //TODO or oprerate the dom element
            }
    });*/
});

//保存橱窗商品顺序
$(document).delegate('#ShowCaseGoodsSaveOrderBtn','click',function(){
    var currentHref=window.location.href;
    var showcaseId=currentHref.substr(currentHref.lastIndexOf('/')+1);
    var allIds=$('.updateSCGoodOrderBtn').map(function(){
       return $(this).attr('data-id');
    });
    $.ajax({
        data:{
            id:showcaseId,
            showcaseGoodIds:allIds
        },
        type: 'post',
        url: '/portal/updateSCGoodOrder',
        success:function(){

        }
    });


});


//改变橱窗顺序
$(document).delegate('.showcaseOrderUpdate','click',function(){
        var self=$(this);
        var currentIndex=$('.showcaseOrderUpdate').index(self);
        if(currentIndex==0){
            artDialogAlert("该橱窗当前已在第一位");
            return;
        }
        var currentTr=self.parents('tr').eq(0);
        var currentTable=self.parents('table').eq(0);
        currentTable.find('tr').eq(1).before(currentTr);
        currentTable.find('tr:last').css('display','table-row');
});

//保存橱窗顺序
$(document).delegate('#ShowCaseSaveOrderBtn','click',function(){

    var realIds=[];
    $('.showcaseOrderUpdate').map(function(){
        realIds.push( $(this).attr('data-id'));
    });
    $.ajax({
        url:'/rest/customer/portal/showcase/updateShowcaseOrder',
        type:'post',
        data:{ids:realIds},
        success:function(feedback){
                if(feedback.status==200){
                        artDialogAlertModal(feedback.msg,function(){
                            $('#scTable').find('tr:last').hide();
                        });
                }
        }

    });
});

//删除橱窗
$(document).delegate('.delete_showcase','click',function(){
    var self=$(this);
    var deleteId=$(this).prev().attr('data-id');
    artDialogPromptModal('确定要删除该条数据？',function(){
        $.ajax({
            type:'delete',
            url:'/rest/customer/portal/showcase/'+deleteId,
            success:function(feedback){
                if(feedback.status==200){
                    artDialogAlertModal(feedback.msg,function(){
                        self.parents('tr').remove();
                    });
                }
                else{
                    artDialogAlertModal(feedback.msg);
                }
            }
        });
    });
});

//设置商品为橱窗推荐商品
$(document).delegate('.updateSCRecGoodStatusBtn','click',function(){
    //data-isRecommended
    var currentIsRecommendStatus=$(this).attr('data-isRecommended');
    $.ajax({
            type:"post",
            data:{currentIsRecommendStatus:currentIsRecommendStatus},
            url:"/portal/updateSCGoodRecommend/"+$(this).attr('data-id'),
            success:function(){
                    window.location.reload();
                    //TODO or operate the dom element
            }
    })
});

//删除橱窗的某个商品  现在列表橱窗 和 ICON橱窗 用的都是这一个 删除方法
$(document).delegate('.deleteSCGoodBtn','click',function(){
    var self=$(this);
    var currentId=$(this).attr('data-id');
    var scId=$('#showcaseHiddenId').val();
    var scType=self.find('i').attr('data-sctype');
    artDialogPromptModal("你确定要从橱窗移除该商品?",function(){
        if(self.attr('dom-add')==="true"){
            self.parents('tr').remove();
            deleteStorageId(Number(self.attr('data-id')),scType);
            //刷新iframe
            refreshIframe(scType);
            return;
        }
        $.ajax({
            type:"delete",
            data:{scId:scId},
            url:"/rest/customer/portal/showcase/scGoodDelete/"+currentId,
            success:function(feedback){
                if(feedback.status==200){
                    artDialogAlertModal(feedback.msg,function(){
                        self.parents('tr').remove();
                        deleteStorageId(Number(self.attr('data-id')),scType);//删除缓存中的商品id
                        refreshIframe(scType);
                    })
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                artDialogAlertModal(textStatus+":"+errorThrown);
            }
        });
    });
});

//删除橱窗商品后 删除缓存中存储的Id
function deleteStorageId(id,scType){
    switch (scType){
        case 'scLIST':
            var  currentArray=localStorage.currentShowCaseGoodsIds.split(',');
            localStorage.currentShowCaseGoodsIds = currentArray.filter(function (item) {
                return item != id;
            });
            break;
        case 'scICON':
            var  currentArray=localStorage.currentICONShowCaseGoodsIds.split(',');
            localStorage.currentICONShowCaseGoodsIds = currentArray.filter(function (item) {
                return item != id;
            });
            break;
    }
}


//删除橱窗商品后 刷新页面
function refreshIframe(scType){
    switch (scType){
        case 'scLIST':
            var tempstr="&ids="+localStorage.currentShowCaseGoodsIds;
            $('#showcaseChooseGoodsIframe').attr('src','/goods/showcase?flag=chooseGoods'+tempstr);
            break;
        case 'scICON':
            var tempstr="&ids="+localStorage.currentICONShowCaseGoodsIds;
            $('#showcaseChooseGoodsIframe').attr('src','/goods/showcaseIcon?flag=chooseGoods'+tempstr);
            break;

    }



}

//footer Operation

//删除link元素
$(document).delegate('.colRowDeleteBtn','click',function(){

        var self =$(this);
        //TODO
        var curId=self.attr('data-id');
        artDialogPromptModal("确定删除该数据？",function(){
            $.ajax({
               type:"delete",
                url:"/rest/customer/portal/link/"+curId,
               success:function(feedback){
                   if(feedback.status==200){
                       artDialogAlertModal(feedback.msg,function(){
                           self.parent().parent().remove();//删除子节点 包括自己
                       });
                   }
                   else{
                       artDialogAlertModal(feedback.msg);
                   }
               }
            });
        });
});

//删除父节点
$(document).delegate('.ColumnDeleteBtn','click',function(){
    var self =$(this);
    //TODO
    var curId=self.attr('data-id');
    artDialogPromptModal("确定删除该数据,该条数据以及子节点将全部被删除？",function(){
        $.ajax({
            type:"delete",
            url:"/rest/customer/portal/linkColumn/"+curId,
            success:function(feedback){
                if(feedback.status==200){
                    artDialogAlertModal(feedback.msg,function(){
                        window.location.reload();
                    });
                }
                else{
                    artDialogAlertModal(feedback.msg);
                }
            }
        });
    });

});

//显示隐藏图标列
$(document).delegate('#chooseIcon','click',function(){
        $('#iconContainer').toggle();
});

//选择图标事件
$(document).delegate('.iconTable tr td i','click',function(){
    var self=$(this);
    var classContent=self.attr('class');
    $('#topI').attr('class',classContent);
});

//保存大标题Column
$(document).delegate('#footerColumnBtn','click',function(){
    var hiddenId=$('#hiddenId').val();
    var columnName=$('#columnName').val();
    var iconClassName=$('#topI').attr('class');
    //if(ValidateNullOrEmpty(columnName)||ValidateNullOrEmpty(iconClassName)){
    if(ValidateNullOrEmpty(columnName)){
        artDialogAlertModal("主标题名称不能为空");
        return;
    }
    //修改
    if(hiddenId){
        var data1={
            id:hiddenId,
            iconName:iconClassName,
            columnName:columnName
        };
        $.ajax({
           type:"put",
            url:"/rest/customer/portal/linkColumn",
           data:data1,
           success:function(feedback){
               if(feedback.status==200){
                   artDialogAlertModal(feedback.msg+"..请记得添加子节点",function(){
                       window.location.href="/page/customer/portal/linkColumn/all"
                   })
               }
               else
                   artDialogAlertModal(feedback.msg);
           }
        });
    }
    else{
    //新增
        var data={
            iconName:iconClassName,
            columnName:columnName
        };
        $.ajax({
            type:"post",
            data:data,
            url:"/rest/customer/portal/linkColumn",
            success:function(feedback){
                if(feedback.status == 200){
                    artDialogAlertModal(feedback.msg+"..请记得添加子节点",function(){
                        window.location.href="/page/customer/portal/linkColumn/all";
                    });
                }
                else
                    artDialogAlertModal(feedback.msg);
            }
        });
    }
});

//保存子标题 以及内容
$(document).delegate('#saveSubLinkBtn','click',function(){

    var subName=$('#name').val();
    var linksContent=UE.getEditor('editor').getContent();
    if(ValidateNullOrEmpty(subName)){
        artDialogAlertModal("子标题名称是必填的");
        return;
    }
    var hiddenId=$('#subLinkId').val();

    if(!hiddenId){

        var temp = window.location.href.split('/');
        var columnId = temp[temp.length-1];
        $.ajax({
            type:"post",
            url:"/rest/customer/portal/link",
            data:{
                columnId: columnId,
                name: subName,
                html: linksContent
            },
            success:function(feedback){
                //TODO 返回成功
                if(feedback.status == 200){
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = "/page/customer/portal/linkColumn/all"
                    });
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            }
        });
    }
    else{
        //编辑
        $.ajax({
            type:"put",
            url:"/rest/customer/portal/link",
            data:{
                id: Number(hiddenId),
                name: subName,
                html: linksContent
            },
            success:function(feedback){
                if(feedback.status==200){
                    artDialogAlertModal(feedback.msg,function(){
                        window.location.href="/page/customer/portal/linkColumn/all"
                    })
                }
                else
                    artDialogAlertModal(feedback.msg);
            }

        });
    }
});


//改变小标题顺序
$(document).delegate('.updateSubLinkOrder','click',function(){
    var self=$(this);
    var currentTr=self.parents('tr');
    var dataRowValue=currentTr.attr('data-row');
    var allSameLevelTR=$('[data-row='+dataRowValue+']');
    var currentIndex=allSameLevelTR.index(currentTr);
    if(currentIndex==0){
        artDialogAlert("当前已在第一位");
        return ;
    }
    allSameLevelTR.eq(0).before(currentTr);
    self.parents('table').find('tr:last').css('display','table-row');
});


//改变大图标顺序
$(document).delegate('.updateLinkOrder','click',function(){
    var self=$(this);
    var currentTR=self.parents('tr');
    var dataColValue=currentTR.attr('data-col');
    var allSameLevelTR=$('[data-col]');
    var currentIndex=allSameLevelTR.index(currentTR);
    if(currentIndex==0){
        artDialogAlert("当前已在第一位");
        return ;
    }
    //移动父元素
    self.parents('table').find('tr').eq(1).before(currentTR);

    //移动子元素
    var subLevelTR=$('[data-row='+dataColValue+']');
    self.parents('table').find('tr').eq(1).after(subLevelTR);
    self.parents('table').find('tr:last').css('display','table-row');

});


//保存大小图标顺序
$(document).delegate('#FooterSaveOrderBtn', 'click', function () {
    var allParentNode = $('[data-col]');

    var realPostData = [];
    var postData =
        allParentNode.map(function () {
            var dataColValue = $(this).attr('data-col');
            var parentNodeId = $(this).attr('data-id');
            var obj = {
                id: Number(parentNodeId),
                subIds: []
            };
            var subNodeIds = $('[data-row=' + dataColValue + ']').map(function () {
                obj.subIds.push(Number($(this).attr('data-id')));
                return $(this).attr('data-id');
            });
            realPostData.push(obj);
            return obj;

        });
    $.ajax({
        data: {links: realPostData},
        type: "put",
        url: '/rest/customer/portal/linkColumn/orderSeq',
        success: function (feedback) {
            if(feedback.status == 200){
                artDialogAlertModal(feedback.msg, function () {
                    window.location.href = "/page/customer/portal/linkColumn/all"
                });
            }else{
                artDialogAlertModal(feedback.msg, function () {
                });
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            artDialogAlertModal(textStatus+":"+errorThrown);
        }
    });
});
/**
 * @return {boolean}
 */
function ValidateNullOrEmpty(str){
    return !!(str == null | str == "");
}


//LIST橱窗编辑和新增页面  的 保存按钮事件
$(document).delegate('#saveSCGoodsBtn','click',function(){
    var currentShowcaseID=$('#showcaseHiddenId').val();
    var currentShowcaseName=$('#name').val();
    if(ValidateNullOrEmpty(currentShowcaseName)){
        artDialogAlertModal("橱窗名不能为空");
        return;
    }
    showcaseGoodsIds=localStorage.currentShowCaseGoodsIds.split(',');
    var ids=[];
    $('.updateSCGoodOrderBtn').map(function(){
       ids.push($(this).attr('data-id'));
    });
    if(currentShowcaseID){
        //编辑
        var putData={
            showcaseId:currentShowcaseID,
            showcaseName:currentShowcaseName,
            goodsIds:ids
        };
        $.ajax({
           type:"put",
           url:"/rest/customer/portal/showcase",
           data:putData,
           success:function(feedback){
                if(feedback.status==200){
                    artDialogAlertModal(feedback.msg,function(){
                        window.location.href="/page/customer/portal/showcase";
                    })
                }
               else
                artDialogAlertModal(feedback.msg);

           },
           error: function(XMLHttpRequest, textStatus, errorThrown) {
                artDialogAlertModal(textStatus+":"+errorThrown);
            },
            beforeSend:function(){
                //禁用按钮
                $('#saveSCGoodsBtn').attr('disabled',true);
            },
            complete:function(){
                //恢复按钮
                $('#saveSCGoodsBtn').attr('disabled',false);
            }
        });
    }
    else{
        //新增
        var postdata={
            showcaseName:currentShowcaseName,
            goodsIds:ids
        };
        $.ajax({
           type:"post",
            url:"/rest/customer/portal/showcase",
            data:postdata,
            success:function(feedback){
                artDialogAlertModal(feedback.msg,function(){
                    window.location.href="/page/customer/portal/showcase";
                });
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                artDialogAlertModal(textStatus+":"+errorThrown);
            },
            beforeSend:function(){
                //禁用按钮
                $('#saveSCGoodsBtn').attr('disabled',true);
            },
            complete:function(){
                //恢复按钮
                $('#saveSCGoodsBtn').attr('disabled',false);
            }
        });
    }
});

//ICON 橱窗编辑和新增页面 的 保存按钮事件
$(document).delegate('#saveSCGoodsICONBtn','click',function(){
    var ids=[];
    var currentShowcaseID=$('#showcaseHiddenId').val();
    var currentShowcaseName=$('#name').val();
    if(ValidateNullOrEmpty(currentShowcaseName)){
        artDialogAlertModal("橱窗名不能为空");
        return;
    }
    var imgObj = $('#picture').contents().find('img').eq(0);
    var advertiseImgurl = imgObj.length != 0 ? imgObj.eq(0).attr('src') : null;
    if (!advertiseImgurl) {
        artDialogAlertModal('请上传广告图片');
        return false;
    }
    var advertiseLink=$('#Link').val();
    if($.trim(advertiseLink)==''){
        artDialogAlertModal('请填写活动链接',function(){
            ('#Link').focus();
        });
        return;
    }
    var advertiseObj={
        advertiseImg:advertiseImgurl,
        advertiseHref:advertiseLink
    };
    //获取新增或者编辑的商品id
    $('.updateSCGoodOrderBtn').map(function(){
        ids.push($(this).attr('data-id'));
    });
    if(ids.length<1){
        artDialogAlertModal('请至少选择一个商品');
        return;
    }
    if(currentShowcaseID){
        //编辑橱窗
        var putData={
            showcaseId:currentShowcaseID,
            showcaseName:currentShowcaseName,
            advertiseObj:advertiseObj,
            goodsIds:ids
        };
        $.ajax({
            type:"put",
            url:"/rest/customer/portal/showcase/iconShowcase",
            data:putData,
            success:function(feedback){
                if(feedback.status==200){
                    artDialogAlertModal(feedback.msg,function(){
                        window.location.href="/page/customer/portal/showcase";
                    })
                }
                else
                    artDialogAlertModal(feedback.msg);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                if(textStatus=='timeout'){
                    artDialogAlertModal('网络状况不好,请稍后再试');
                }else {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }
            },
            beforeSend:function(){
                //禁用按钮
                $('#saveSCGoodsICONBtn').attr('disabled',true);
            }
        });
    }
    else{
        //新增橱窗
        var postdata={
            showcaseName:currentShowcaseName,
            goodsIds:ids,
            advertiseObj:advertiseObj
        };
        $.ajax({
            type:"post",
            url:"/rest/customer/portal/showcase/iconShowcase",
            data:postdata,
            success:function(feedback){
                artDialogAlertModal(feedback.msg,function(){
                    window.location.href="/page/customer/portal/showcase";
                });
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                if(textStatus=='timeout'){
                    artDialogAlertModal('网络状况不好,请稍后再试');
                }else {
                    artDialogAlertModal('error ' + textStatus + " " + errorThrown);
                }
            },
            beforeSend:function(){
                //禁用按钮
                $('#saveSCGoodsICONBtn').attr('disabled',true);
            }
        });
    }

});



    $(document).delegate(".removePurchaseOne", "click", function(){
        var data = {};
        var self = $(this);
        data.listId = self.attr("listId");
        $.ajax({
            data: data,
            url: "/portal/purchaseList/remove",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                    self.closest("tr").remove();
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });

$(document).delegate(".addPurchaseList", "click", function(){
    var listName = $("#listName").val();
    if(listName == ""){
        window.parent.artDialogAlertModal("请输入清单的名字", function(){
            $("#listName").focus();
        });
        return;
    }
    var data = {};
    data.listName = listName;
    $.ajax({
        type: "post",
        url: "/portal/purchaseList/add",
        data: data,
        success:function(feedback){
            if(feedback.status==200){
                $("#listName").val("");
                $(window.parent.document).find('.fadeDiv').css('display', 'none');
                $(window.parent.document).find("#selectGoods").css('display', 'none');
                window.parent.location.reload();
            } else {
                window.parent.artDialogAlertModal(feedback.msg);
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            window.parent.artDialogAlertModal(textStatus+":"+errorThrown);
        }
    });
});

$(document).delegate(".updatePurchaseList", "click", function(){
    var goods = [];
    _.each($(".cartItem"), function (item) {
        var temp = [];
        temp.push(Number($("input[name=favorName]").attr("listId")));
        temp.push(Number($(item).attr("detailId")));
        temp.push(Number($(item).attr("goodsId")));
        temp.push(Number($(item).find("input[name=quantity]").val()));
        temp.push($(item).find("input[name=remark]").val());
        goods.push(temp);
    });

    var favorNameSelect = $("input[name=favorName]");
    var data = {
        listName : favorNameSelect.val(),
        listId : Number(favorNameSelect.attr("listId")),
        goods : goods
    };
    var data_href = $(this).attr("data-href");
    $.ajax({
        data: data,
        url: "/portal/purchaseList/update",
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (feedback) {
            if(feedback.status == "200"){
                    window.location.href = data_href;
            }else{
                artDialogAlertModal(feedback.msg);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            artDialogAlertModal('error ' + textStatus + " " + errorThrown);
        }
    });
});

$(document).delegate(".removePurchaseGoodsOne", "click", function(){
    var data = {};
    var self = $(this);
    data.listId = $("input[name=favorName]").attr("listId");
    data.goodsId = self.closest("tr").attr("goodsId");


    artDialogPromptModal("确定要删除该商品",function(){
        $.ajax({
            data: data,
            url: "/portal/purchaseList/removeGoodsOne",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if(feedback.status == "200"){
                    self.closest("tr").remove();
                    if($('#purchaseListTable').find('tbody').find('tr').length==0){
                        $('#total').html(0);
                    }
                }else{
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    });
});


$(document).delegate("a[name^=productcategory]", 'click', function () {
    var self = $(this);
    var contexts = self.context.name;
    $("tr[id^="+contexts+"]").each(function (i, element) {
        var status = $(element).css("display");
        if (status == "none") {
            $(element).css("display","table-row");
            self.find("i").removeClass("fa-plus-square-o");
            self.find("i").addClass("fa-minus-square-o");
            self.css("color", "#237935;");
        } else {
            $(element).css( "display","none");
            self.find("i").removeClass("fa-minus-square-o");
            self.find("i").addClass("fa-plus-square-o");
            self.css("color", "#000");
        }
    });
});


$(document).delegate('#addShowCaseBtn','click',function(){
      var showcaseValue=$('#showcaseType').val();
    switch (showcaseValue){
        case 'LIST':
            window.location.href='/page/customer/portal/showcase/item/add';
            break;
        case 'ICONLIST':
            window.location.href='/page/customer/portal/showcase/itemIcon/add';
            break;
        default:
            break;
    }

});