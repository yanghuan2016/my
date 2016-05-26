$(function(){

    $(document).delegate('#addNewDoamin','click',function(){
        $('#addContentTr').toggle();
    });
    $(document).delegate('#saveDomain','click',function(){
        var domainName= $.trim($('#newDomainName').val());
        if(domainName==""){
            artDialogAlertModal("新的区域内容不能为空");
            return;
        }
        var allInput=$(this).parents('tr').nextAll().find('input');
        var newDomainExist=false;
        allInput.each(function(index,item){
             var currentVal= $.trim($(item).val());
             if(currentVal==domainName) {
                 newDomainExist = true;
                 return false;
             }
        });
        if(newDomainExist){
            artDialogAlertModal("已经存在,请修改",function(){
                $('#newDomainName').focus();
            });
            return;
        }
        var postData = {name:domainName};
        $.ajax({
            url:'/customer/system/domainSetting/add',
            type:'POST',
            data:postData,
            success:function(feedback){
                if(feedback.status==200){
                    var newId=feedback.data;
                    var newTr='';
                    newTr+='<tr>';
                    newTr+='<td class="input-item">';
                    newTr+='<input style="width: 100%" data-id="'+ newId +'"  type="text"  class="input-read form-control" readonly value="'+domainName+'" />';
                    newTr+='</td>';
                    newTr+='<td>';
                    newTr+='<a onclick="editDomain(this)" title="编辑" style="margin-right: 20px;"><i class="fa fa-pencil-square-o"></i></a>';
                    newTr+='<a onclick="deleteDomain(this)" title="删除" style="margin-right: 8px;"><i class="fa fa-remove"></i></a>';
                    newTr+=' </td></tr>';
                    $('#domainTable').append(newTr);
                    $('#newDomainName').val('');
                }else if(feedback.status == 7002){
                    artDialogAlertModal(feedback.msg);
                    return;
                }
            }
        });
    });



    $(document).delegate('#cancelSaveDomain','click',function(){
        $('#addContentTr').css('display','none');
        $('#newDomainName').val('');
    });
});


function editDomain(context){
    var self=$(context);
    self.attr('title','保存');
    self.attr('onClick','updateDomain(this)');
    self.find('i').attr('class','fa fa-save');
    self.parent().prev().find('input').attr('class','input-edit').prop('readonly',false);

}

function deleteDomain(context){
    var id=$(context).parent().prev().find('input').attr('data-id');
    artDialogPromptModal('你确定要删除该条数据?',function(){
        var postData = {id:id};
        $.ajax({
            url:'/customer/system/domainSetting/delete',
            type:'POST',
            data:postData,
            success:function(feedback){
                if(feedback.status == 7002){
                    artDialogAlertModal(feedback.msg);
                    return;
                }
                //删除成功
                artDialogAlertModal('删除成功');
                $(context).parent().parent().remove();
            }
        });
    })
}

function updateDomain(context){
    var self=$(context);
    var inputEle=$(context).parent().prev().find('input');
    var id=inputEle.attr('data-id');
    var domainName= $.trim(inputEle.val());

    if(domainName==""){
        artDialogAlertModal("区域名字不能为空",function(){
            inputEle.focus();
            return false;
        });
    }
    var thisTR=self.closest('tr');
    var currentDomainName=domainName;
    var allDomain=$('#addContentTr').nextAll();
    var currentTrIndex=allDomain.index(thisTR);
    var allNames=[];
    allDomain.each(function(index,item){
        if(index!=currentTrIndex){
            allNames.push($(item).find('input').val());
        }
    });
    if($.inArray(currentDomainName,allNames)!=-1){
        artDialogAlertModal('已经存在同名,请修改',function(){
            inputEle.focus();
        });
        return;
    }
    var postData={
        id:id,
        name:domainName
    };
    $.ajax({
        url:'/customer/system/domainSetting/update',
        data:postData,
        type:'POST',
        success:function(feedback) {
            if (feedback.status == 200) {
                //保存成功
                artDialogAlertModal('更新成功', function () {
                    inputEle.prop('readonly', true).attr('class', 'input-read');
                    self.find('i').attr('class', 'fa fa-pencil-square-o');
                    self.attr('title', '编辑');
                    self.attr('onClick', 'editDomain(this)');
                });
            }else if(feedback.status == 7002){
                artDialogAlertModal(feedback.msg);
            }
        }
    })
}