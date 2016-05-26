function Browser() {
    this.post = function (url, data, successHandler, errorHandler) {
        $.ajax({
            url: url,
            type: 'post',
            data: data,
            success: successHandler,
            error: errorHandler
        });
    };

    this.put = function (url, data, successHandler, errorHandler) {
        $.ajax({
            url: url,
            type: 'put',
            data: data,
            success: successHandler,
            error: errorHandler
        });
    };

    this.get = function (url, successHandler, errorHandler) {
        $.ajax({
            url: url,
            type: 'get',
            success: successHandler,
            error: errorHandler
        });
    };

    this.delete = function (url, successHandler, errorHandler) {
        $.ajax({
            url: url,
            type: 'delete',
            success: successHandler,
            error: errorHandler
        });
    };
}

function AvailableService(availableView, browser) {
    this.init = function initService() {
        availableView.initDisableGoods(this.disableGoods);
        availableView.initDisableMultiGoods(this.disableGoods);
    };

    this.disableGoods = function (goodsIds, viewSuccessHandler, viewErrorHandler, timeOutHandler) {
        if (_.isEmpty(goodsIds)) {
            return viewErrorHandler("您没有选择任何商品!");
        }
        var disableFeedbackHandler = function (feedback) {
            if (feedback.status === 200) {
                viewSuccessHandler(feedback.msg, feedback.data);
            }else {
                viewErrorHandler(feedback.msg, feedback.data);
            }
        };

        var url = "/customer/goods/available/disableGoods";
        var data = {goodsIds: goodsIds};

        browser.post(url, data, disableFeedbackHandler, timeOutHandler);
    };
}


function AvailableView() {
    this.initDisableGoods = function (disableGoods) {

        $(document).delegate(".disable-goods", "click", function () {
            var self = $(this);

            var goodsId = self.attr("data-goods-id");
            var goods = [];
            goods.push(goodsId);

            disableGoods(goods, disableGoodsSuccessHandler, disableGoodsErrorHandler, timeOutHandler);
        });
    };

    this.initDisableMultiGoods = function(disableGoods) {
        $(document).delegate("#disable-multi-goods", "click", function () {
            var goodsIds = [];
            $(".goodsCheckBox").each(function() {
                var self = $(this);
                if (self.parent().hasClass('checked')) {
                    goodsIds.push(self.attr("data-goods-id"));
                }
            });
            disableGoods(goodsIds, disableGoodsSuccessHandler, disableGoodsErrorHandler, timeOutHandler)
        });
    };

    var disableGoodsSuccessHandler = function (msg, data) {
        artDialogAlertModal(msg, function() {
            var goodsIds = data.goodsIds;
            $(".goodsCheckBox").each(function() {
                var self = $(this);
                if (goodsIds.indexOf(self.attr("data-goods-id")) !== -1) {
                    self.parents("tr").remove();
                    window.location.reload();
                }
            });
        });
    };

    var disableGoodsErrorHandler = function (msg) {
        artDialogAlert(msg);
    };

    var timeOutHandler = function () {
        artDialogAlert("请求超时");
    };
}
$(function () {
    var availableView = new AvailableView();
    var browser = new Browser();
    var availableService = new AvailableService(availableView, browser);

    availableService.init();

});

