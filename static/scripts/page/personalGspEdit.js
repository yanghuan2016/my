$(function(){
    //附件名称



    /**
     * 上传证照
     */

    var $allimagesUrls=$('.showpicture');
    for(var i=0;i<$allimagesUrls.length;i++){
        var $allimagesUrl = $allimagesUrls[i];
        var url=$($allimagesUrl).attr('data-types');
        var $input=$($allimagesUrls[i]).find('input');
        update_img(url,$input,i);
    }
    var $upload_inputs = $(".pic-upload-button input");
    $upload_inputs.change(upload_img);
    function upload_img(){
        var oFile = $(this).get()[0].files[0];
        var filedata = new FormData();
        filedata.append('fulAvatar', oFile);
        $that = $(this);
        //update_img("https://avatars1.githubusercontent.com/u/8455958?v=3&s=400", $(this));
        $.ajax({
            url: '/rest/register/upload',
            type: 'POST',
            data: filedata,
            cache: false,
            dataType: 'json',
            processData: false,
            contentType: false,
            success: function (res) {
                //res.url
                update_img(res.msg, $that);
            },
            error: function () {
                //todo error handle
            }
        })
    }

    /**
     * 更新图片展示
     * @param url 上传成功的图片url
     */
    function update_img(url, $input,i){
        var $upload_button = $input.parents('.pic-upload-button');
        //是否已有图片
        if( $upload_button.find('img').length > 0 ){
            $img = $upload_button.find('img');
            $bigPic = $upload_button.find('a');
        }else{
            var $img = $("<img/>");
            $img.css({
                position:"absolute",
                top:0,
                left:0,
                width:"100px",
                height:"100px",
                "z-index":"9"
            });
            $img.appendTo($upload_button);
            $bigPic = $('<a target="_blank">查看</a>');
            $bigPic.appendTo($upload_button);
            $bigPic.css({
                display:'none',
                position:'absolute',
                top:'60px',
                left:'10px',
                width:'80px',
                height:'20px',
                background:'#237935',
                'z-index':'11',
                'text-align':'center',
                'line-height':'20px',
                color:'#fff'
            });
            $upload_button.hover(function(){
                $input.parent('.inputWrap').addClass('floatOn');
                $(this).addClass('floatOn');
                $(this).find('a').show();
            },function(){
                $input.parent('.inputWrap').removeClass('floatOn');
                $(this).removeClass('floatOn');
                $(this).find('a').hide();
            })
        }
        $img.attr('src', url);
        $bigPic.attr('href', url);
    }

    /**
     * 新增附件
     */
    var $upload_add_bunnton = $(".pic-add-button");
    $upload_add_bunnton.click(function(){
        var $upload_items = $(".pic-upload-item");
        var $newItem = $(".item_model").clone();
        $newItem.css("display","block");
        $newItem.addClass('showpicture');
        $newItem.removeClass("item_model");
        var otherAmount = 0;
        otherAmount = $upload_items.find("input[name^='other']").length;
        $newItemInput = $newItem.find('input');
        $newItemInput.attr('name', 'other'+(String)(otherAmount+1));
        $newItem.insertBefore($(this).parent());
        $newItemInput.change(upload_img);
        //删除附件
        $newItem.find('.otherCloseBt').click(function(){
            confirm('确认删除附件？') && $newItem.remove();
        });

    });


    //
    $(document).delegate('.checkboxEdit .icheckbox', 'click', function () {
        var self = $(this);
        self.find("ins").remove();
        self.toggleClass('checked');
    });
    $('ins').remove();
    var isLongDate= $('#longdateSpan').attr('data-longdate');
    if(isLongDate=="true"){
        $('#businessLicenseEndDate').val('2100/01/01').hide();
        $('#ckboxIneditGsp').find('.icheckbox').attr('class','icheckbox checked');
    }
    $(document).delegate('#ckboxIneditGsp .icheckbox','click',function(){
        var thisClassAttr=$(this).attr('class');
        var checkedStatus=thisClassAttr.indexOf('checked')!=-1;
        if(checkedStatus){
            $('#businessLicenseEndDate').val('2100/01/01').hide();
        }
        else{
            $('#businessLicenseEndDate').val('').show();
        }
    });

    //渲染gsp控制类型
    var gspTypeIds=$('#gspTypesIds').attr('gspTypeValues').split(',');
    for(var i=0;i<gspTypeIds.length;i++){
        $('#gspTypesIds').find('.icheckbox').each(function(index,item){
            if($(item).find('input').attr('checkgspid')==gspTypeIds[i]){
                $(item).addClass('checked');
            }
        });
    }




    //上传图片相关
    var allimagesUrl=$('#picTd').attr('data-imgs');
    if(allimagesUrl != "" && allimagesUrl != "undefined"){
        var str = "";

        var accessFileName=
            [ '营业执照','GSP证书','合同页一','合同页二','合同公章'];

        var accessTips;

        for(var i in allimagesUrl.split(",")){
            var insertStr='';
            if(i>4){
                insertStr='<a class="removeimg"><i class="fa fa-times-circle-o"></i></a>';
            }
            accessTips=typeof(accessFileName[i])=='undefined'?'其他附件':accessFileName[i];

            str += "<li><div class='fileClass'><img src=" +
                allimagesUrl.split(",")[i] +
                " "+"name='realSrc' class='gspImages' title='单击修改图片'   "+ "></img>" +
                "<input  name='file_"+i+"'    class='editGspFileUpload'   type='file'>"+
                insertStr +
                "</div>"+
                "<div style='text-align:center'>"+accessTips+"</div>"+
                "</li>";
        }
        $(".fileContainer").find("ul").find("li").remove();
        $(".fileContainer").find("ul").append(str);
        var uploadStr= '<li style="display: inline" class="template-upfile">'+
            '<div class="fileClass">'+
            '<a class="fileinput-button-icon">+</a>'+
            '<input  name="inputFile_1"   class="editGspfileuploadInput" type="file"  accept="image/*">'+
            '</div>'+
            '</li>';
        $(".fileContainer").find("ul").append(uploadStr);

    }else{
    }
    //hide Input[type=file]
    $('.editGspFileUpload').hide();

    var checkComments= $.trim($('#checkComments').find('input').val());
    if($.trim(checkComments)!=""){

        artDialogAlertModalCustomered("审核意见",checkComments,"好的知道了(不再提示)","暂不处理",function(){
            var clientId=$('#cId').val();
            $.ajax({
                url:'/portal/clearCheckComments?clientId='+clientId,
                type:'get',
                success:function(feedback){
                    if(feedback.status==200){
                    }
                }
            });

        });



    }
});
