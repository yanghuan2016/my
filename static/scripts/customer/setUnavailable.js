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

function UnavailableService(unavailableView, browser) {
    this.init = function initService() {
        unavailableView.initEnableGoods(this.enableGoods);
        unavailableView.initEnableMultiGoods(this.enableGoods);
    };

    this.enableGoods = function (goodsIds, viewSuccessHandler, viewErrorHandler, timeOutHandler) {
        if (_.isEmpty(goodsIds)) {
            return viewErrorHandler("您没有选择任何商品!");
        }
        var enableFeedbackHandler = function (feedback) {
            if (feedback.status === 200) {
                return viewSuccessHandler(feedback.msg, feedback.data);
            }
            viewErrorHandler(feedback.msg, feedback.data);
        };

        var url = "/customer/goods/unavailable/enableGoods";
        var data = {goodsIds: goodsIds};

        browser.post(url, data, enableFeedbackHandler, timeOutHandler);
    };
}


function UnavailableView() {
    this.initEnableGoods = function (enableGoods) {

        $(document).delegate(".enable-goods", "click", function () {
            var self = $(this);

            var goodsId = self.attr("data-goods-id");
            var goods = [];
            goods.push(goodsId);

            enableGoods(goods, enableGoodsSuccessHandler, enableGoodsErrorHandler, timeOutHandler);
        });
    };

    this.initEnableMultiGoods = function(enableGoods) {
        $(document).delegate("#enable-multi-goods", "click", function () {
            var goodsIds = [];
            $(".goodsCheckBox").each(function() {
                var self = $(this);
                if (self.parent().hasClass('checked')) {
                    goodsIds.push(self.attr("data-goods-id"));
                }
            });
            enableGoods(goodsIds, enableGoodsSuccessHandler, enableGoodsErrorHandler, timeOutHandler)
        });
    };

    var enableGoodsSuccessHandler = function (msg, data) {
        artDialogAlert(msg, function() {
            var goodsIds = data.goodsIds;
            $(".goodsCheckBox").each(function() {
                var self = $(this);
                if (goodsIds.indexOf(self.attr("data-goods-id")) !== -1) {
                    self.parents("tr").remove();
                }
            });
        });
    };

    var enableGoodsErrorHandler = function (msg) {
        artDialogAlert(msg);
    };

    var timeOutHandler = function () {
        artDialogAlert("请求超时");
    };
}
$(function () {
    var unavailableView = new UnavailableView();
    var browser = new Browser();
    var unavailableService = new UnavailableService(unavailableView, browser);

    unavailableService.init();

});

