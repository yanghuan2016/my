$(function () {

    //所有价格的调整页面
    $(document).delegate('.waitChangePriceInput', 'blur', function () {
        var self = $(this);
        var currentVal = $.trim(self.val());
        var initVal = self.closest('td').prev().html();

        //判断是否是合法的数字
        var regPrice = /^\d+(\.\d{1,4})?$/;
        if (!regPrice.test(currentVal) || (currentVal == 0 && self.attr('name') != 'limitedPrice')) {
            //artDialogAlertModal("请输入正确的价格信息,最多精确到4位小数");
            self.css({
                border: '1px solid red',
                backgroundColor: '#FEEFEF'
            });
            //return false;
            autoCloseTips('新价格不能为0,最多精确到四位', null, function () {
                self.focus();
            });
            return;
        }
        //判断修改后的价格和现有的价格一样,若不一样就框体变红
        if ($.trim(currentVal) != $.trim(initVal)) {
            self.css({
                border: '1px solid red',
                color: 'red',
                backgroundColor: 'transparent'
            });
            return;
        }
        else {
            self.css({
                border: '1px solid grey',
                color: 'rgb(58,58,58)',
                backgroundColor: 'transparent'
            });
        }
        self.val(Number(currentVal).toFixed(4));


    });
    //var allInputs=$('.focusout');
    $(document).delegate('#btnChangePrice', 'click', function () {
        var isEditedflag = false;
        $('input[type="text"]').each(function (index) {
            if (index == 0) {
                return;
            }
            var self = $(this);
            var currentVal = self.val();
            var regPrice = /^\d+(\.\d{1,4})?$/;
            if (!regPrice.test(currentVal)) {
                //artDialogAlertModal("请输入正确的价格信息,最多精确到4位小数");
                self.trigger('blur');
                return false;
            }
        });
        var notChoseCheckPerson = true;
        var radioGroup = $(".radioGroup");
        var ModifyPriceReason = $("#ModifyPriceReason");
        radioGroup.find('.iradio').each(function () {
            if ($(this).attr('class').indexOf('checked') != -1) {
                notChoseCheckPerson = false;
                return false;
            }
        });
        if ($.trim(ModifyPriceReason.val()) == '') {
            autoCloseTips('请填写调价原因', null, function () {
                $('#ModifyPriceReason').focus();
            });
            return;
        }
        if (notChoseCheckPerson) {
            autoCloseTips('请选择审批人员', null);
            return;
        }

        //获取基础价格信息
        var data = {};
        data.goodsId = $('#hiddenGoodsId').val();
        var basicPriceInfo = [];
        $('#basicPriceInfo').find('tr').each(function () {
            var inputEle = $(this).find('input');
            var obj = {
                name: inputEle.attr('name'),
                oldPrice: inputEle.closest('td').prev().html(),
                newPrice: inputEle.val()

            };
            if (!isEditedflag) {
                isEditedflag = Number(obj.oldPrice) != Number(obj.newPrice);
            }
            basicPriceInfo.push(obj);
        });
        data.basicPriceInfo = basicPriceInfo;

        //获取客户类价格
        var clientCategoryPriceInfo = [];
        $('#clientCategoryPriceInfo').find('tr').each(function () {
            var hiddenInput = $(this).find('input[type="hidden"]');
            var obj = {
                id: hiddenInput.val(),
                oldPrice: $.trim(hiddenInput.closest('td').next().html()),
                newPrice: $(this).find('input[type="text"]').val()
            };
            if (!isEditedflag) {
                isEditedflag = Number(obj.oldPrice) != Number(obj.newPrice);
            }
            clientCategoryPriceInfo.push(obj);
        });
        data.clientCategoryPriceInfo = clientCategoryPriceInfo;


        var clientPriceInfo = [];
        $('#clientPriceInfo').find('tr').each(function () {
            var hiddenInput = $(this).find('input[type="hidden"]');
            var obj = {
                id: hiddenInput.val(),
                oldPrice: $.trim(hiddenInput.closest('td').next().html()),
                newPrice: $(this).find('input[type="text"]').val()
            };
            if (!isEditedflag) {
                isEditedflag = Number(obj.oldPrice) != Number(obj.newPrice);
            }
            clientPriceInfo.push(obj);
        });
        data.clientPriceInfo = clientPriceInfo;


        data.checkContents = {
            operatorId: radioGroup.find('.checked').find('input').attr('id'),
            modifyReason: ModifyPriceReason.val()
        };

        var submitUrl = '/customer/priceset/setgoodallprice';

        if ($(this).attr('data-submit') == 'basic') {
            submitUrl = '/customer/priceset/setgoodbasicprice';
        }
        if (!isEditedflag) {
            autoCloseTips('当前没有改动,不能提交审核', 1000);
            return;
        }
        $.ajax({
            url: submitUrl,
            data: data,
            type: 'post',
            success: function (feedback) {
                if (feedback.status == 200) {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = '/customer/priceset/setprice';
                    })
                } else if (feedback.status == 6001) {
                    artDialogAlertModal(feedback.msg, function () {
                        //window.location.href="/customer/setprice";
                    })
                }
            }
        })

    });


    //客户价格调整页面
    $(document).delegate('.deleteClientPrice', 'click', function () {
        var self = $(this);
        artDialogPromptModal("确定要删除该条价格设置？", function () {
            var currentVal = self.closest('td').prev().find('input').val();

            self.closest('td').prev().find('input').val('-1').css('display', 'none');
            var span = '<span>' + currentVal + '</span>';
            self.closest('td').prev().append(span);

            var clientId = self.closest('tr').find('td:first').find('input').val();
            self.closest('tr').attr('removeId', clientId).css('text-decoration', 'line-through').css('color', 'red');
            self.removeClass('deleteClientPrice').css('color', 'red')/*.css('color','grey')*/;
        });
    });

    $(document).delegate('#addClientPrice', 'click', function () {
        var inputEle = $(this).prev().prev();
        var dataId = inputEle.attr('data-id');
        var clientName = $.trim(inputEle.val());
        var clientCode = $.trim(inputEle.attr('clientCode'));
        if (dataId == undefined || dataId == "") {
            autoCloseTips('请输入正确的客户名称', 1000, function () {
                $('#inputValue').focus();
            });
            return;
        }
        var clientId = inputEle.attr('data-id');
        var existClient = false;
        var clientPriceInfo = $("#clientPriceInfo");
        clientPriceInfo.find('tr').each(function () {
            if ($(this).attr('removeId') == undefined) {
                var existClientId = $(this).find('input[type="hidden"]').val();
                if (clientId == existClientId) {
                    existClient = true;
                    return false;
                }
            }
        });
        if (existClient) {
            autoCloseTips('该客户已经存在,请确认', 1000, function () {
                $('#inputValue').focus();
            });
            return;
        }
        //添加数据到行数
        var currntOldPrice = 0;
        var removeTRTD = $('tr[removeId="' + clientId + '"]');
        if (removeTRTD.length != 0) {
            currntOldPrice = $.trim(removeTRTD.find('td').eq(1).html());
            removeTRTD.remove();
        } else {
            var pricePlan = inputEle.attr('pricePlan');
            currntOldPrice = $.trim($('td[name="' + pricePlan + '"]').html());
        }
        var newClientPriceTr = '';
        newClientPriceTr += '<tr>';
        newClientPriceTr += '<td>' + clientName + '/' + clientCode + '<input type="hidden" value="' + clientId + '"></td>';
        newClientPriceTr += '<td>' + currntOldPrice + '</td>';
        newClientPriceTr += '<td> <input class="waitChangePriceInput" type="text"  style="width:107px;" value="' + currntOldPrice + '" /></td>';
        newClientPriceTr += '<td>  <a href="javascript:void(0)" class="deleteClientPrice">' +
            '<i class="fa fa-times"></i>' +
            '</a></td>';
        newClientPriceTr += '</tr>';
        clientPriceInfo.append(newClientPriceTr);
    });

    $(document).delegate('#btnChangeClientPrice,#btnChangeClientCategoryPrice', 'click', function () {
        //获取所有的客户价格数据 或者客户类价格数据
        var isClientPrice = $(this).attr('id') == 'btnChangeClientPrice';

        var priceInfo = [];
        var tableName = isClientPrice ? '#clientPriceInfo' : '#clientCategoryPriceInfo';


        $(tableName).find('tr').each(function () {
            var currentClientId = $(this).find('input[type="hidden"]').val();
            var newPrice = $(this).find('input[type="text"]').val();
            var oldPrice = $.trim($(this).find('td').eq(1).html());
            var clientPriceObj = {
                id: currentClientId,
                oldPrice: oldPrice,
                newPrice: newPrice
            };
            priceInfo.push(clientPriceObj);
        });
        if (priceInfo.length == 0) {
            autoCloseTips('没有价格信息,请添加');
            return;
        }

        data = {};
        if (isClientPrice) {
            data.clientPriceInfo = priceInfo;
        } else {
            data.clientCategoryPriceInfo = priceInfo;
        }
        data.goodsId = $('#hiddenGoodsId').val();
        var notChoseCheckPerson = true;
        var radioGroup = $(".radioGroup");
        radioGroup.find('.iradio').each(function () {
            if ($(this).attr('class').indexOf('checked') != -1) {
                notChoseCheckPerson = false;
                return false;
            }
        });
        var ModifyPriceReason = $("#ModifyPriceReason");
        if ($.trim(ModifyPriceReason.val()) == '') {
            autoCloseTips('请填写调价原因', null, function () {
                $('#ModifyPriceReason').focus();
            });
            return;
        }
        if (notChoseCheckPerson) {
            autoCloseTips('请选择审批人员', null);
            return;
        }
        data.checkContents = {
            operatorId: radioGroup.find('.checked').find('input').attr('id'),
            modifyReason: ModifyPriceReason.val()
        };
        //发送数据
        var url = isClientPrice ? '/customer/priceset/setclientprice' : '/customer/priceset/setclientcategoryprice';
        $.ajax({
            url: url,
            type: 'post',
            data: data,
            success: function (feedback) {
                if (feedback.status == 200) {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.href = "/customer/priceset/setprice";
                    });
                }
                else if (feedback.status == 6001) {
                    artDialogAlertModal(feedback.msg);
                }
            }
        });


    });

    //客户类价格调整界面
    $(document).delegate('#addClientCategoryPriceBtn', 'click', function () {
        var clientCategory = $("#clientCategory");
        var clientCategoryId = clientCategory.val();
        var clientCategoryName = $.trim(clientCategory.find('option:selected').text());
        var existClient = false;
        var clientCategoryPriceInfo = $("#clientCategoryPriceInfo");
        clientCategoryPriceInfo.find('tr').each(function () {
            if ($(this).attr('removeId') == undefined) {
                var existClientCategoryId = $(this).find('input[type="hidden"]').val();
                if (clientCategoryId == existClientCategoryId) {
                    existClient = true;
                    return false;
                }
            }
        });
        if (existClient) {
            autoCloseTips('该客户类价格已经存在,请确认', 1000, function () {
                $('#inputValue').focus();
            });
            return;
        }
        var currentOldPrice = 0;
        var removeTRTD = $('tr[removeId="' + clientCategoryId + '"]');
        if (removeTRTD.length != 0) {
            currentOldPrice = $.trim(removeTRTD.find('td').eq(1).html());
            removeTRTD.remove();
        }

        var newClientPriceTr = '';
        newClientPriceTr += '<tr>';
        newClientPriceTr += '<td>' + clientCategoryName + '<input type="hidden" value="' + clientCategoryId + '"></td>';
        newClientPriceTr += '<td>' + currentOldPrice + '</td>';
        newClientPriceTr += '<td> <input class="waitChangePriceInput" type="text"  style="width:107px;" value="' + currentOldPrice + '" /></td>';
        newClientPriceTr += '<td>  <a href="javascript:void(0)" class="deleteClientPrice">' +
            '<i class="fa fa-times"></i>' +
            '</a></td>';
        newClientPriceTr += '</tr>';
        clientCategoryPriceInfo.append(newClientPriceTr);
    });

    //价格审核界面
    $(document).delegate('.btnCheckPriceModify', 'click', function () {
        //获取数据
        var checkStatus;
        if ($(this).attr('data-op') == 'accept') {
            checkStatus = "APPROVED";
        } else {
            checkStatus = "REJECTED";
        }
        var adjustPriceId = $.trim($('#adjustPriceId').html());
        var remark = $.trim($('#checkPriceReason').val());
        if (remark == "") {
            autoCloseTips('审核意见是必填的,请确认');
            return;
        }
        //获取价格数据
        var data = {};
        var basicPriceInfo = [];
        var selectBasicPriceInfo = $("#basicPriceInfo");
        selectBasicPriceInfo.find('tr').each(function () {
            var inputEle = $(this).find('input');
            var obj = {
                name: inputEle.attr('name'),
                oldPrice: inputEle.closest('td').prev().html(),
                newPrice: inputEle.val()
            };
            basicPriceInfo.push(obj);
        });

        if (selectBasicPriceInfo.css('display') == 'none') {
            basicPriceInfo = [];
        }
        data.basicPriceInfo = basicPriceInfo;
        //获取客户类价格
        var clientCategoryPriceInfo = [];
        $('#clientCategoryPriceInfo').find('tr').each(function () {
            var hiddenInput = $(this).find('input[type="hidden"]');
            var obj = {
                id: hiddenInput.val(),
                oldPrice: $.trim(hiddenInput.closest('td').next().html()),
                newPrice: $(this).find('td:first').css('textDecoration') == 'line-through' ? '-1' : $(this).find('input[type="text"]').val()
            };
            clientCategoryPriceInfo.push(obj);
        });
        data.clientCategoryPriceInfo = clientCategoryPriceInfo;


        var clientPriceInfo = [];
        $('#clientPriceInfo').find('tr').each(function () {
            var hiddenInput = $(this).find('input[type="hidden"]');
            var obj = {
                id: hiddenInput.val(),
                oldPrice: $.trim(hiddenInput.closest('td').next().html()),
                newPrice: $(this).find('td:first').css('textDecoration') == 'line-through' ? '-1' : $(this).find('input[type="text"]').val()
            };
            clientPriceInfo.push(obj);
        });
        data.clientPriceInfo = clientPriceInfo;
        var postData = {};
        postData.status = checkStatus;
        postData.readjustId = adjustPriceId;
        postData.remark = remark;
        postData.priceData = data;
        postData.goodsId = $('#hiddenGoodsId').val();


        $.ajax({
            url: '/customer/priceset/checkPriceModify',
            type: 'post',
            data: postData,
            success: function (feedback) {
                if (feedback.status == 200) {
                    artDialogAlertModal('审核成功', function () {
                        if (checkStatus == "APPROVED") {
                            window.location.href = "/customer/priceset/approvedPriceModifyList";
                        } else {
                            window.location.href = "/customer/priceset/rejectPriceModifyList";
                        }
                    })
                }
            }
        })


    });

    //审核人员 撤销删除 价格信息
    $(document).delegate('.undoRemovePriceCheck', 'click', function () {
        var self = $(this);
        var currentTd = self.closest('td');
        currentTd.siblings().css({
            color: 'black',
            textDecoration: 'none'
        });
        self.prev().css({
            color: 'black',
            textDecoration: 'none',
            border: '1px solid black'
        });
        self.prev().removeAttr('readonly').removeAttr('disabled').focus();
        self.css('display', 'none');
        self.next().show();
    });


    //审核人员 删除 价格信息
    $(document).delegate('.removePriceCheck', 'click', function () {
        var self = $(this);
        //input 按钮
        self.prev().prev().css({
            color: 'red',
            textDecoration: 'line-through',
            border: 'none'
        });
        self.prev().prev().attr('readonly', true).attr('disabled', true);
        self.closest('td').siblings().css({
            color: 'red',
            textDecoration: 'line-through'
        });
        self.css('display', 'none');
        self.prev().show();
    })
});