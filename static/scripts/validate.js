//验证批次号
function validateBatchNum(batchNum) {
    if (batchNum === "") {
        artDialogAlertModal("批次号不能为空");
        return false;
    }
    return true;
}
//验证生产日期
function validateGoodsProduceDate(goodsProduceDate) {
    if (goodsProduceDate === "") {
        artDialogAlertModal("生产日期不能为空");
        return false;
    }
    return true;
}
//验证有效期
function validateGoodsValidDate(goodsValidDate) {
    if (goodsValidDate === "") {
        artDialogAlertModal("有效期不能为空");
        return false;
    }
    return true;
}
//验证数量
function validateInputQuantity(inputQuantity) {
    var num=/(^[0-9]\d*$)/;
    if(!num.test(inputQuantity)){
        artDialogAlertModal("数量格式不对");
        return false;
    }
    return true;
}
//验证电子监管码
function validateDrugESC(drugESC) {
    if (drugESC === "") {
        artDialogAlertModal("电子监管码不能为空");
        return false;
    }
    return true;
}
//验证质检报告
function validateInspectReportURL(drugESC) {
    if (drugESC === "") {
        artDialogAlertModal("质检报告不能为空");
        return false;
    }
    return true;
}