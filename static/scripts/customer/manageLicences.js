$(function(){

    var actions = {
        'add': {
            'url': '/rest/customer/portal/licences/add',
            'name': '添加',
            'callback': afterAdd
        },
        'delete': {
            'url': '/rest/customer/portal/licences/delete',
            'name': '删除',
            'callback': afterDel,
            'noFile': true
        },
        'modify': {
            'url': '/rest/customer/portal/licences/edit',
            'name': '修改',
            'callback': afterMod
        }
    };

    /**
     * 证书类型选择
     */
    $(document).delegate('.editPanelType > div', 'ifChecked', function(){
        var licType = $(this).find('input').val();
        choseLicType(licType);
    });

    /**
     * 修改证书
     */
    $(document).delegate('.licencesEdit', 'click', function(){
        artDialogPure($('#editPanel'));
        window.currentModding = $(this).parents('li');
        var dataId = $(this).attr('data-id');
        var licType = $(this).attr('data-type');
        var licUrl = $(this).parents('li').find('.imgArea a').attr('href');
        var licName = $(this).parents('li').find('.nameArea span.licName').text();
        var expireTime = $(this).parents('li').find('.nameArea span.expireTime').text();
        choseLicType(licType);
        $('.editPanelType').hide();
        $('.editPanelFunc').attr('data-id', dataId);
        $('.editPanelFunc').attr('data-type', licType);
        $('.editPanelContent').children('input.licName').val(licName);
        $('.editPanelContent').find('input.licUrl').val(licUrl);
        $('.editPanelContent').children('input#expireTime').val(expireTime);
        $('.editPanelTitle').text('编辑证照');
    });



    /**
     * 添加证书
     */
    $(document).delegate('.addLicence', 'click', function(){
        artDialogPure($('#editPanel'));
        $('.editPanelTitle').text('添加证照');
    });

    /**
     * 删除证书
     */
    $(document).delegate('.licencesDelete', 'click', function(){
        window.currentModding = $(this).parents('li');
        var licName = $(this).parents('li').find('.nameArea span.licName').text();
        var id = $(this).parents('li').find('.licencesEdit').attr('data-id');
        artDialogAlertModalTitle('确认要删除该证书?', licName, function(){
            makeReq(actions['delete'], {id: id});
        });
    });

    /**
     * 弹出窗操作
     */
    var $cancel = $('.licEditCancel');
    var $save = $('.licEditSave');

    $cancel.click(closeEditPanel);

    $save.click(function(){
    //    colect datas
        var licName = $(this).parents('#editPanel').find('input.licName').val();
        var oFile = $(this).parents('#editPanel').find('input[type="file"]').get()[0].files[0];
        var expireTime = $(this).parents('#editPanel').find('input#expireTime').val();
        var id = $(this).parent('.editPanelFunc').attr('data-id');
        var licType = $(this).parent('.editPanelFunc').attr('data-type')
            || $('.editPanelType').find('.iradio.checked').find('input').val();
        var licUrl = $(this).parents('#editPanel').find('input.licUrl').val();

        //输入检查
        var tipText = [];
        (licName === '') && tipText.push('请输入证照名称');
        (expireTime === '') && tipText.push('请输入证照期限');
        (typeof oFile === 'undefined') && (licType === 'licImg') && tipText.push('请上传证照图片');
        //(licUrl === '') && (licType === 'licUrl') && tipText.push('请输入证照链接');

        if( tipText.length > 0 ) {
            pushTip(tipText[0]);
            return;
        }
        $(this).text("正在保存...").attr('disabled', true);
        var filedata = new FormData();
        if ( licType === 'licImg' ) {
            filedata.append('licImg', oFile);
        } else {
            if(licUrl !== ''){
                licUrl = licUrl.match(/^http/) ? licUrl : 'http://' + licUrl;
            }
            filedata.append('licUrl', licUrl);
        }
        filedata.append('licName', licName);
        filedata.append('licType', licType);
        filedata.append('expireTime', expireTime);
        filedata.append('id', id);
    //    判断状态为修改还是新增
        var ifAdd = ($(this).parent('.editPanelFunc').attr('data-id') == '');
        ifAdd ? makeReq(actions['add'], filedata) : makeReq(actions['modify'], filedata);
    });

    function pushTip(text){
        var $tip = $('.licencesEditTip');
        $tip.text(text);
        $tip.show();
        setTimeout(function(){
            $tip.fadeOut(function(){
                $(this).hide();
            });
        }, 1000);
    }


    function afterAdd(feedback){
        closeEditPanel();
        var data = {
            id: feedback.id,
            url: feedback.url,
            type: feedback.type,
            name: feedback.name,
            expireTime: feedback.expireTime
        };
        newItem(data);
    }

    function afterDel(feedback){
        $item = window.currentModding;
        delete window.currentModding;
        $item.remove();
    }

    function afterMod(feedback){
        closeEditPanel();
        var data = {
            id: feedback.id,
            url: feedback.url,
            name: feedback.name,
            expireTime: feedback.expireTime
        };
        editItem(data);
    }

    function makeReq(action, data){
        /**
         * test 假数据
         */
        //action.callback({
        //    url: '/static/upload/licence.jpg',
        //    name: '中二证',
        //    id: '13',
        //    expireTime: '2016-12-12'
        //});
        //return;
        data = data || '';
        var ajaxOpt = {
            url: action.url,
            dataType: 'json',
            type: 'post',
            data: data,
            success: function(feedback){
                if(feedback.status == 200){
                    action.callback(feedback.msg.data.licData || '');
                } else {
                    pushTip( action.name +'失败！');
                }
            }
        };
        if ( action.noFile !== true) {
            ajaxOpt.processData = false;
            ajaxOpt.cache= false;
            ajaxOpt.contentType= false;
        }
        $.ajax(ajaxOpt);
    }

    function closeEditPanel(){
        $editPanel = $('#editPanel');
        $editPanel.hide();
        //类型选择恢复显示
        $('.editPanelType').show();
        $('.editPanelType').find('input[value="licImg"]').iCheck('check');
        choseLicType('licImg');
        $editPanel.find('input[type!="radio"]').each(function(){
            $(this).val('');
        });
        $editPanel.find('.licencesEditTip').text('');
        $editPanel.find('.editPanelFunc').attr('data-id', '')
            .find('.licEditSave').text('保存').attr('disabled', false);
        window._dialog.close().remove();
    }

    function newItem(data){
        var licType = data.type;
        var $newItem = $('.licModel').clone();
        $newItem.removeClass('licModel');
        $newItem.insertBefore('.licModel');
        (licType === 'licImg')
            ? $newItem.find('.imgArea span').remove() : $newItem.find('.imgArea img').remove();
        licDataInsert($newItem, data);
        $newItem.show();
    }

    function editItem(data){
        $item = window.currentModding;
        delete window.currentModding;
        licDataInsert($item, data);
    }

    function licDataInsert($dom, data){
        $dom.find('.licencesEdit').attr('data-id', data.id);
        $dom.find('.licencesEdit').attr('data-type', data.type);
        $dom.find('.licName').text(data.name);
        $dom.find('.imgArea a').attr('href', data.url);
        $dom.find('.imgArea img').attr('src', data.url);
        $dom.find('.expireTime').text(data.expireTime);
    }

    function choseLicType(type){
        var $licContent = $('.licContent');
        $('.editPanelFunc').attr('data-type', type);
        $licContent.find('.' + type + 'Wrap')
            .show().siblings().hide();
    }
});