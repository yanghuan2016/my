

$(function(){


    $('ins').remove();
    $(document).delegate('.TypeCheckbox>.iradio', 'click', function () {
        var checkName=$(this).find('input').attr('checkGspName');
        if (checkName=="医疗机构") {
            $(this).closest('td').next().find('select').show();
        }
        else{
            $(this).closest('td').next().find('select').hide();
        }
        $('#gspTypesIds').find('.iradio').each(function(index,item){
                $(item).removeClass('checked');
        });
        $(this).addClass('checked');

    });


    $(document).delegate('#arrowCollapse', 'click', function () {
        var self = $(this);
        var dataDisplay = self.attr('data-display');
        if (dataDisplay == "false") {
            self.find('i').attr('class', 'fa fa-arrow-up');
            self.find('span').html('点击收起');
            self.attr('data-display', 'true');
        } else {
            self.find('i').attr('class', 'fa fa-arrow-down');
            self.find('span').html('点击展开');
            self.attr('data-display', 'false');
        }
    });

    $(document).delegate('#paytype', 'change', function () {
        var checksize=$(this).val();
        if (checksize=="CREDIT") {
            $(this).closest('td').find('h6').show();
        }
        else{
            $(this).closest('td').find('h6').hide();
        }

    });


    $("#hospitalLevelId").change(function(){
        var hospitalLevel= $("#hospitalLevelId").find("option:selected").val();
        if(hospitalLevel != ''){
                var subNodes= $("#hospitalLevelId").find("option:selected").attr('data-subvalue');
                subNodes=subNodes.split(',');
            $("#hospitalGradesId").empty();

            var appendStr='<option value="" selected="selected">请选择医疗等次</option>';
            for(var i in subNodes){
                appendStr+='<option value="'+subNodes[i] +'">'+subNodes[i]+'</option>';
            }
            $("#hospitalGradesId").append(appendStr);
        }
        else{
            $("#hospitalGradesId").empty();
            $("#hospitalGradesId").append('<option value="" selected="selected">请选择医疗等次</option>');
        }
    });


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


});