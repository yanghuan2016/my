//add address ajax
function addAddress(){
    var addressinfo = $("#input_address").val();
    var data = {
        "addressDetail":addressinfo
    };
    $.ajax({
        data: data,
        url: '/address/add',
        type:'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function(res){
            if(res.status == 200) {
                artDialogAlertModal(res.msg,function(){
                    location.reload();
                });
            }else{
                artDialogAlertModal(res.msg,function(){
                    location.reload();
                });
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            artDialogAlertModal('error ' + textStatus + " " + errorThrown);
        }
    });
}
//close add address ajax

//update address ajax
function updateAddress(id){
    var addressId = id.split("_")[1];
    var addressInfo = $("#inputMAitem_"+addressId).val();
    var data = {
        "addressId":addressId,
        "addressDetail":addressInfo
    };
    $.ajax({
        data: data,
        url: '/address/update',
        type:'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function(res){
            if(res.status == 200) {
            }else{
                artDialogAlertModal(res.msg,function(){
                    location.reload();
                });
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            artDialogAlertModal('error ' + textStatus + " " + errorThrown);
        }
    });
}
//close update address ajax

//delete address ajax
function deleteAddress(id){
    var addressId = id.split("_")[1];
    var urlparams = "&id="+encodeURIComponent(addressId);
    $.ajax({
        url: '/address/delete?'+urlparams,
        type:'get',
        dataType: 'json',
        timeout: 5000,
        success: function(res){
            if(res.status == 200) {
                var trLength=$('.newAddressTemplate').prevAll().length;
                if(trLength<=2){
                    $('#addressTips').css('display','none');
                }else{
                    $('#addressTips').css('display','table-row');
                }

            }else{
                artDialogAlertModal(res.msg,function(){
                    location.reload();
                });
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            artDialogAlertModal('error ' + textStatus + " " + errorThrown);
        }
    });
}
//close delete address ajax