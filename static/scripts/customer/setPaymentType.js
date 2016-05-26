$(function () {

	$(".setPaymentRadio").click(function () {
		var _this = $(this).find('input');
		var inputs = _this.closest("td").find(".paymentType-setting-config-value").find("input");
		if (inputs.length > 0) {
			var flag = false;
			for (var index = 0; index < inputs.length; index++) {
				var self = $(inputs[index]);
				if (self.val() === '') {
					flag = true;
					break;
				}
			}
			if (flag) {
				artDialogAlertModal("请先配置支付参数", function () {
					_this.closest('.radioContainer').find("input[value='1']").closest('div').removeClass('checked');
					_this.closest('.radioContainer').find("input[value='0']").closest('div').addClass('checked');
				});
				return;
			}
		}
		var paymentId = _this.attr("paymentId");
		var isForbidden = Number(_this.val());
		if (paymentId) {
			$.ajax({
				url: '/customer/system/paymentType',
				type: 'post',
				data: {paymentId: paymentId, isForbidden: isForbidden},
				success: function (feedback) {
					if (feedback.status === 200) {
						if (isForbidden === 1) {
							_this.closest(".payment-type-container").removeClass('payment-type-container-gray');
							_this.closest(".payment-type-container").addClass('payment-type-container-green');
						} else {
							_this.closest(".payment-type-container").removeClass('payment-type-container-green');
							_this.closest(".payment-type-container").addClass('payment-type-container-gray');
						}
					} else {
						_this.parent('div').removeClass('checked');
						artDialogAlertModal("出错了，请重试");
					}
				},
				error: function () {
					_this.parent('div').removeClass('checked');
					artDialogAlertModal("出错了，请重试");
				}
			});
		}
	});

	$(document).delegate('#paymentTypeParaSave', 'click', function () {
		var _this = $(this);
		var inputs = _this.closest(".paymentType-setting").find('input');
		var paymentid = $(this).attr('paymentid');
		var temp = {};
		_.map(inputs, function (item) {
			var self = $(item);
			temp[self.attr('name')] = self.val();
		});
		var data = {
			paymentId: paymentid,
			configValue: JSON.stringify(temp)
		};
		$.ajax({
			url: '/customer/system/payment/set',
			type: 'post',
			data: data,
			success: function (feedback) {
				if (feedback.status === 200) {
					window.location.reload();
				} else {
					artDialogAlertModal("出错了，请重试");
				}
			},
			error: function () {
				artDialogAlertModal("出错了，请重试");
			}
		});
	});
});

function inputPaymentTypeCheck(input) {
	var _this = $(input);
	var sibInput = _this.closest(".paymentType-setting-config-value").find("input");
	var flag = false;
	var button = _this.closest(".paymentType-setting-config-value").find("#paymentTypeParaSave");
	for (var index = 0; index < sibInput.length; index++) {
		var self = $(sibInput[index]);
		if (self.val() === '') {
			flag = true;
			break;
		}
	}
	button.prop('disabled', flag);
}