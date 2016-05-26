//首页用到的js
$(function(){
    $(document).delegate('.decreaseNum','click',function() {
        var self = $(this);
        var inputEle=self.next().find('input');
        var currentInputVal =inputEle .val();
        if (isNaN(Number(currentInputVal))||currentInputVal=='1'||Number(currentInputVal)<=1) {
            inputEle.val(1);
            return;
        }
        else{
            var result=Math.floor(Number(currentInputVal)-1);
            inputEle.val(result);
        }

    });
    $(document).delegate('.indexShowcaseUpdateNum','click',function(){
        var self = $(this);
        var inputEle = self.siblings('input');
        var currentInputVal = inputEle.val();
        if (isNaN(Number(currentInputVal)) || Number(currentInputVal) < 1) {
            inputEle.val(1);
        } else {
            var type = $(this).attr("type");
            var result;
            if (type == "decrease") {
                result = Math.floor(Number(currentInputVal) - 1);
            } else if (type == "increase") {
                result = Math.floor(Number(currentInputVal) + 1);
            }
            inputEle.val(result);
        }
    });
    $(document).delegate('.increaseNum','click',function(){
        var self = $(this);
        var inputEle=self.prev().find('input');
        var currentInputVal =inputEle .val();
        if (isNaN(Number(currentInputVal))||Number(currentInputVal)<1) {
            inputEle.val(1);
            return;
        }else{
            var result=Math.floor(Number(currentInputVal)+1);
            inputEle.val(result);
        }
    });
    $(document).delegate('.addToCart','click',function(){
        var self = $(this);
        var isLogin = self.attr('data-checklogin');
        var currentGoodsId = self.attr('goodsId');
        if (isLogin === "false") {
            addToCartModal("");
            return;
        }
        //点击的是头图下面的,添加进购物车按钮


            var inputEle = self.prev().find('input');
            var inputValue = inputEle.val();
            //判断是否是合法数字
            var reg = /^[1-9][0-9]*$/;
            if (!reg.test(inputValue)) {
                artDialogAlertModal('请输入正确的数量', function () {
                    inputEle.focus();
                });
                return;
            }
            var cartItem = {
                goodsId: currentGoodsId,
                quantity: Number(inputValue)
            };
            postAddToCart(cartItem, function (feedback) {
                if (feedback.status == 200) {
                    try {
                        var countCartItems = feedback.data.cartItemCount;
                        if (Number(countCartItems)) {
                            $("span.cartItemCount").text(countCartItems);
                        }
                    } catch (err) {
                    }
                    goOnShoppingOrCheck();
                } else {
                    artDialogAlertModal(feedback.msg);
                }
            });




    });



});