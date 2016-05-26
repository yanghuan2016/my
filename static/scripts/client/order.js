$(function () {
	$(document).delegate("#wechatPayButton", 'click', function () {
		var _this = $(this);
		var total = _this.attr('total');
		var url = _this.attr('url');
		var d = dialog(
			{
				id: 'wechatDialog',
				title: "支付¥" + total,
				content: "<div class='wechatDialog'>" +
				"<div><h3>微信扫码支付</h3></div>" +
				"<div id='qrcode'></div>" +
				"<div><hr></div>" +
				"<div><a id='closeBtn' onclick='closeDoalog()'>使用其他支付方式支付></a></div>" +
				"</div>"
			}
		);
		$('#qrcode').html('');
		$('#qrcode').qrcode({
			'text': url
		});
		d.showModal().width(500);

		var timer = setInterval(function () {
			$.ajax({
				type: 'get',
				url: '/order/wechatPayment/notify?rande=' + Math.random(),
				success: function (feedback) {
                    var current = window.location.href;
                    if (feedback.status == 200 && feedback.data === 'SUCCESS') {
                        if(current.indexOf('order/payment') > -1){
                            window.location.href = "/order/paySuccess";
                        }
                        clearInterval(timer);
					} else if(feedback.data === 'SUCCESS'){
                        if(current.indexOf('order/payment') > -1) {
                            window.location.href = "/order/payFailed";
                        }
                        clearInterval(timer);
					}
				}
			});
		}, 10000);
	});
});

function closeDoalog() {
	dialog.getCurrent().close().remove();
}