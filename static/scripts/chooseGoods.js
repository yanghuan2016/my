$(function(){
    var height=$('.realHeight').height()+100;
    $(window.parent.document).find('iframe').css('height',height);

});
$(document).delegate('.addThisToSC', 'click', function () {
        var self=$(this);
        var currentGoodsId=$(this).attr('goodsid');


        if(localStorage.currentShowCaseGoodsIds){

            var currentIds=localStorage.currentShowCaseGoodsIds;
            var currentArray=currentIds.split(',');

            if(currentArray.length==7){
                parent.window.artDialogAlertModal("橱窗最多7个商品,请先删掉一些吧.");
                return;
            }
            var isExist=$.inArray(currentGoodsId,currentArray)!=-1;
              if(isExist){
                parent.window.artDialogAlertModal("该商品已经存在啦,请选择其他商品吧");
                return;
            }
        }
        var currentTr=$(this).parents('tr');
        var comments=currentTr[0].outerHTML.replace(/<!--/g,"").replace(/-->/g,"");
        var aIndex=comments.lastIndexOf('<a');
        var aLIndex=comments.lastIndexOf('</a>');
        var beforeStr=comments.substr(0,aIndex);
        var afterStr=comments.substr(aLIndex+4);
        var insertStr='<a  href="javascript:void(0)"    data-id="'+currentGoodsId+'" class="updateSCGoodOrderBtn">'+
        '<i class="fa fa-arrow-circle-up tooltipped" data-toggle="tooltip" data-placement="left" title="置顶" style="margin-right: 2px"></i>'+
        '</a>';
        insertStr+='<a  href="javascript:void(0)" dom-add="true"  data-id="'+currentGoodsId+'" class="deleteSCGoodBtn">'+
        '<i class="fa fa-remove tooltipped" data-toggle="tooltip" data-placement="left" data-sctype="scLIST" title="删除" style="margin-right: 2px"></i></a>';
        var ultimateTr=beforeStr+insertStr+afterStr;
        $(window.parent.document).contents().find("#showcaseGoodsTable").append(ultimateTr);
        $(window.parent.document).contents().find('#saveBtnDisplay').css('display','block');
        if(localStorage.currentShowCaseGoodsIds){
            currentArray=localStorage.currentShowCaseGoodsIds.split(',');
            currentArray.push(currentGoodsId);
            localStorage.currentShowCaseGoodsIds=currentArray;
        }
        else{
            var arry=[];
            arry.push(currentGoodsId);
            localStorage.currentShowCaseGoodsIds=arry;
        }
        self.parents('tr').remove();
        var height=$('.realHeight').height()+100;
        $(window.parent.document).find('iframe').css('height',height);
});

