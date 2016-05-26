function InventoryModifyService(inventoryModifyView, browser) {
    this.init = function () {
        inventoryModifyView.initModifyInventory();
        inventoryModifyView.initSaveInventory(this.saveInventory);
        inventoryModifyView.initCancelModifyInventory();

        inventoryModifyView.initModifyAllInventory();
        inventoryModifyView.initSaveAllInventory(this.saveAllInventory);
        inventoryModifyView.initCancelModifyAllInventory();
    };

    this.saveInventory = function (goodsId, inventory) {
        var url = "/customer/priceset/goods/inventory/" + goodsId;
        var data = {
            inventory: inventory
        };
        browser.put(url, data, inventoryModifyView.saveInventorySuccessHandler, inventoryModifyView.saveInventoryErrorHandler);
    };

    this.saveAllInventory = function (inventorys) {
        if (!inventorys instanceof Array) {
            return;
        }
        var temp = _.chain(inventorys)
            .map(function (item) {
                if (item.inventory === item.oldInventory) {
                    return null;
                }
                return {
                    goodsId: item.goodsId,
                    storage: Number(item.inventory) - Number(item.lockinventory),
                    lock: item.lockinventory,
                    inventory: item.inventory
                };
            })
            .compact()
            .value();
        var url = "/customer/priceset/goods/inventory";
        var data = {
            inventorys: temp
        };
        browser.put(url, data, inventoryModifyView.saveInventoryAllSuccessHandler, inventoryModifyView.saveInventoryErrorHandler);
    };
}


function InventoryModifyView() {

    var enterModifyMode = function (goodsId) {
        $(".modify-inventory").show();
        $(".save-inventory").hide();
        $(".cancel-modify-inventory").hide();
        $(".span-goods-inventory").show();
        $(".input-goods-inventory").hide();

        var btnModifyInventory = $(".modify-inventory[goods-id=" + goodsId + "]");
        var btnSaveInventory = $(".save-inventory[goods-id=" + goodsId + "]");
        var btnCancelModifyInventory = $(".cancel-modify-inventory[goods-id=" + goodsId + "]");
        var spanInventory = $(".span-goods-inventory[goods-id=" + goodsId + "]");
        var inputInventory = $(".input-goods-inventory[goods-id=" + goodsId + "]");

        btnModifyInventory.hide();
        btnSaveInventory.show();
        btnCancelModifyInventory.show();
        spanInventory.hide();
        inputInventory.val(spanInventory.text());
        inputInventory.show();
        inputInventory.focus();
    };

    var enterModifyAllMode = function () {

        var btnModifyAllInventory = $(".modify-all-inventory");
        var btnSaveAllInventory = $(".save-all-inventory");
        var btnCancelModifyAllInventory = $(".cancel-modify-all-inventory");

        btnModifyAllInventory.hide();
        btnSaveAllInventory.show();
        btnCancelModifyAllInventory.show();

        var btnModifyInventory = $(".modify-inventory");
        var btnSaveInventory = $(".save-inventory");
        var btnCancelModifyInventory = $(".cancel-modify-inventory");
        var spanInventory = $(".span-goods-inventory");
        var inputInventory = $(".input-goods-inventory");

        btnModifyInventory.hide();
        btnSaveInventory.hide();
        btnCancelModifyInventory.hide();
        spanInventory.hide();
        inputInventory.show();

        inputInventory.each(function () {
            $(this).val($(".span-goods-inventory[goods-id=" + $(this).attr("goods-id") + "]").text());
        });
    };

    var quitModifyMode = function (goodsId, inventory) {
        var btnModifyInventory = $(".modify-inventory[goods-id=" + goodsId + "]");
        var btnSaveInventory = $(".save-inventory[goods-id=" + goodsId + "]");
        var btnCancelModifyInventory = $(".cancel-modify-inventory[goods-id=" + goodsId + "]");
        var spanInventory = $(".span-goods-inventory[goods-id=" + goodsId + "]");
        var lockedAmount = Number(spanInventory.siblings(".lockedAmount").text());
        var inputInventory = $(".input-goods-inventory[goods-id=" + goodsId + "]");

        btnModifyInventory.show();
        btnSaveInventory.hide();
        btnCancelModifyInventory.hide();
        spanInventory.show();
        inputInventory.hide();

        spanInventory.text(inventory);
        spanInventory.siblings(".amount").text(inventory-lockedAmount);
        inputInventory.val(inventory);
    };

    var quitModifyAllMode = function (inventorys) {
        var btnModifyAllInventory = $(".modify-all-inventory");
        var btnSaveAllInventory = $(".save-all-inventory");
        var btnCancelModifyAllInventory = $(".cancel-modify-all-inventory");

        btnModifyAllInventory.show();
        btnSaveAllInventory.hide();
        btnCancelModifyAllInventory.hide();

        var btnModifyInventory = $(".modify-inventory");
        var btnSaveInventory = $(".save-inventory");
        var btnCancelModifyInventory = $(".cancel-modify-inventory");
        var spanInventory = $(".span-goods-inventory");
        var inputInventory = $(".input-goods-inventory");

        btnModifyInventory.show();
        btnSaveInventory.hide();
        btnCancelModifyInventory.hide();
        spanInventory.show();
        inputInventory.hide();

        _(inventorys).each(function (item) {
            $(".span-goods-inventory[goods-id=" + item.goodsId + "]").text(item.inventory);
            $(".span-goods-inventory[goods-id=" + item.goodsId + "]").siblings(".amount").text(item.storage);
        });
    };

    this.initModifyInventory = function () {
        $(document).delegate(".modify-inventory", "click", function () {
            var self = $(this);
            var goodsId = self.attr('goods-id');
            enterModifyMode(goodsId);
        });
    };

    this.initModifyAllInventory = function () {
        $(document).delegate(".modify-all-inventory", "click", function () {
            enterModifyAllMode();
        });
    };

    this.initCancelModifyInventory = function () {
        $(document).delegate(".cancel-modify-inventory", "click", function () {
            var self = $(this);
            var tr = self.parents("tr");
            var goodsId = self.attr("goods-id");
            var inventory = tr.find(".span-goods-inventory").text();

            quitModifyMode(goodsId, inventory);
        });
    };

    this.initCancelModifyAllInventory = function () {
        $(document).delegate(".cancel-modify-all-inventory", "click", function () {
            quitModifyAllMode();
        });
    };

    this.initSaveInventory = function (saveInverntory) {
        $(document).delegate(".save-inventory", "click", function () {
            var self = $(this);
            var goodsId = self.attr('goods-id');
            var input = $(".input-goods-inventory[goods-id=" + goodsId + "]");
            var locInventory = Number(input.siblings(".lockedAmount").text().trim());
            var inventory = input.val();
            var regex = new RegExp("^[1-9]*[1-9][0-9]*$");
            if (!regex.test(inventory) || inventory < locInventory) {
                if (dialog.getCurrent() == null) {
                    dialog({
                        content: '库存应该大于0而且大于锁定库存',
                        align: 'top left',
                        quickClose: true
                    }).show(input[0]);
                    input.focus();
                }
            } else {
                saveInverntory(goodsId, inventory);
            }
        });
    };

    this.initSaveAllInventory = function (saveAllInverntory) {
        $(document).delegate(".save-all-inventory", "click", function () {
            var inventorys = [];
            var flag = true;
            $(".input-goods-inventory").each(function () {
                var self = $(this);
                var temp = {
                    goodsId: self.attr("goods-id"),
                    inventory: Number(self.val()),
                    lockinventory: Number(self.siblings(".lockedAmount").text().trim()),
                    oldInventory: self.attr("inventory")
                };
                var regex = new RegExp("^[1-9]*[1-9][0-9]*$");
                if (!regex.test(self.val())|| temp.inventory < temp.lockinventory) {
                    if (dialog.getCurrent() == null) {
                        dialog({
                            content: '库存应该大于0而且大于锁定库存',
                            align: 'top left',
                            quickClose: true
                        }).show(self[0]);
                        self.focus();
                    }
                    flag = false;
                }
                inventorys.push(temp);
            });
            if (flag) {
                saveAllInverntory(inventorys);
            }
        });
    };

    this.saveInventorySuccessHandler = function (feedback) {
        if (feedback.status === 200) {
            quitModifyMode(feedback.data.goodsId, feedback.data.inventory);
        } else {
            artDialogAlertModal(feedback.msg);
        }
    };

    this.saveInventoryAllSuccessHandler = function (feedback) {
        if (feedback.status === 200) {
            quitModifyAllMode(feedback.data.inventorys);
        } else {
            artDialogAlertModal(feedback.msg);
        }
    };

    this.saveInventoryErrorHandler = function () {
        artDialogAlertModal("请求超时");
    };
}


$(function () {

    var browser = new Browser();

    var inventoryModifyView = new InventoryModifyView();

    var inventoryModifyService = new InventoryModifyService(inventoryModifyView, browser);

    inventoryModifyService.init();
});


// RESTFUL REQUEST
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