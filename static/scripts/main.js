$(function () {
	$("#POP800_PANEL_DIV").remove();
	$("#POP800_INIT_DIV").remove();
	$("#POP800_LEAVEWORD_DIV").remove();
	$("#POP800_SHADE").remove();
	$("#POP800_WEBCOUNT_DIV").remove();
	function init() {
		var classifyItemText = localStorage.classifyItemText;
		var textSelect = $(".sm-nav-bottom-top-content>ul>li[value='" + classifyItemText + "']");
		if (textSelect.length > 0) {
			textSelect.siblings("li").removeClass("sm-nav-bottom-top-content-active");
			textSelect.addClass("sm-nav-bottom-top-content-active");
			localStorage.classifyItemText = "";
		}
	}

	$(document).delegate(".sm-nav-bottom-top-content>ul>li", "click", function () {
		localStorage.classifyItemText = $(this).attr("value");
	});

	init();

	$(document).delegate('.customerDeletedGoods', 'click', function () {
		var productId = $(this).attr("productId");
		artDialogAlertModal("请确认真的要删除该商品吗？", function () {
			window.location.href = "/customer/updateGoodsOnsell?goodsId=" + productId + "&isDeleted=true";
		});
	});


	$('.nav-item').hover(function () {
		var self = $(this);
		if (self.find(".nav-list").hasClass('nav-list-active')) {
			self.find(".nav-list").removeClass('nav-list-active');
		} else {
			self.find(".nav-list").removeClass('nav-list-active');
			self.find(".nav-list").addClass('nav-list-active');
		}
	});

	$(document).delegate('#more-pendingNew', 'click', function () {
		var self = $(this);
		var dataDisplay = self.attr('data-display');
		if (dataDisplay == "false") {
			self.find('i').attr('class', 'fa fa-long-arrow-up');
			self.find('span').html('收起资质信息');
			self.attr('data-display', 'true');
		} else {
			self.find('i').attr('class', 'fa fa-long-arrow-down');
			self.find('span').html('展开资质信息');
			self.attr('data-display', 'false');
		}
	});


	//购物车 更多地址的显示
	$(document).delegate('.addressDisplayBtn', 'click', function () {
		var self = $(this);
		var dataType = self.attr('data-display');

		if (dataType == 'hide') {
			//点击事件  点击显示出来
			$('.newAddressTemplate').prevAll().each(function (index, item) {
				$('.address-list').css('display', 'table-row');
				self.attr('data-display', 'display');
				self.find('span').html('隐藏地址');
				self.find('a').attr('class', 'fa fa-long-arrow-up');
			});
		}
		else {
			//隐藏剩下的
			$('.address-list').each(function (index, item) {
				if (index >= 2) {
					$(item).css('display', 'none');
				}
			});
			self.attr('data-display', 'hide');
			self.find('span').html('显示地址');
			self.find('a').attr('class', 'fa fa-long-arrow-down');
		}
	});

	//忘记密码输入手机号点击发送密码
	$(document).delegate(".btnSendIdCode", "click", function () {
		var data = {};
		var account = $('.inputPwdInputAccount').val();
		var mobileNum = $('.inputMobileNum').val();
		data.username = account;
		data.mobileNum = mobileNum;
		$.ajax({
			data: data,
			url: "forgot_pwd/verifyMobile",
			type: 'post',
			dataType: 'json',
			cache: false,
			timeout: 5000,
			success: function (feedback) {
				if (feedback.status == 200) {
					artDialogAlertModal(feedback.msg, function () {
						window.location.href = "/forgot_pwd/verifySuccess";
					});
				} else {
					artDialogAlertModal(feedback.msg);
				}
			},
			error: function (jqXHR) {
				artDialogAlertModal(jqXHR.readyState + jqXHR.responseText);
			}
		});
	});


	$(document).delegate('.confirmPersonalChangePwd', 'click', function () {
		var data = {};
		var originPwd = $('.originPwd').val();
		if (originPwd == null || $.trim(originPwd) == '') {
			artDialogAlertModal("请输入原始密码");
			return;
		}
		var newPwd = $('.newPwd').val();
		if (newPwd == null || $.trim(newPwd) == '') {
			artDialogAlertModal("请输入新密码");
			return;
		}
		var regPassword = /^[a-zA-Z0-9_]{6,16}$/;
		if (!regPassword.test(newPwd)) {
			artDialogAlertModal("密码由数字字母下划线组成,长度6-16个字符,请重新输入.", function () {
				$('.newPwd').focus();
			});
			return;
		}

		var newPwd2 = $('.newPwd2').val();
		if (newPwd2 == null || $.trim(newPwd2) == '') {
			artDialogAlertModal("请再次输入新密码");
			return;
		}
		if (newPwd != newPwd2) {
			artDialogAlertModal("两次输入新密码不一致，请重新输入");
			return
		}
		//base64 for password
		data.password = $.base64.encode(originPwd);
		data.passwordnew = $.base64.encode(newPwd);
		$.ajax({
			data: data,
			url: "/portal/password/modify",
			type: 'post',
			dataType: 'json',
			cache: false,
			timeout: 5000,
			success: function (feedback) {
				if (feedback.status == 200) {
					artDialogAlertModal(feedback.msg, function () {
						window.location.href = "/portal/personal/info";
					});
				} else {
					artDialogAlertModal(feedback.msg);
				}

			},
			error: function (jqXHR) {
				artDialogAlertModal(jqXHR.readyState + jqXHR.responseText);
			}
		});
	});

	$(document).delegate('.cancelPersonalChangePwd', 'click', function () {
		window.location.href = "/portal/personal/info";
	});
//  _nav_head.ejs

	/* 获取产品分类  开始 */
	$(".category-item").on('click', function () {
		var self = $(this);
		var str = "";
		if (self.closest('.category-item-parent').length > 0) {
			var parentOne = self.closest('.category-item-parent').siblings('.panel-heading').find('h5');
			if (parentOne.closest('.category-item-parent').length > 0) {
				str = $.trim(parentOne.closest('.category-item-parent').siblings('.panel-heading').find('h5').text()) + "/";
			}
			str += $.trim(self.closest('.category-item-parent').siblings('.panel-heading').find('h5').text()) + "/";
		}
		str += $.trim($(this).text());
		$("input[name='product_category']").val(str);
	});
	/* 获取产品分类  结束 */

	/* 产品分类导航 开始*/
	$(document).delegate(".collapseOpen", "mouseenter", function () {
		var name = $(this).attr("name");
		var cloesetDiv = $(this).closest("div");
		cloesetDiv.css('border', "2px solid #237935");
		cloesetDiv.css('border-right', "none");
		var ul = $("ul[id=" + name + "]");
		ul.removeClass("article-ul-active");
		ul.slideDown();
	});
	$(document).delegate(".collapseOpen", "mouseleave", function () {
		var name = $(this).attr("name");
		var cloesetDiv = $(this).closest("div");
		cloesetDiv.css('border', "none");
		var ul = $("ul[id=" + name + "]");
		ul.removeClass("article-ul-active");
		ul.hide();
	});
	$('.goodsType-nav-list').mouseenter(function (e) {
		var self = $(this);
		self.children(".nav-list").addClass('nav-list-active');
	}).mouseleave(function () {
		var self = $(this);
		self.children(".nav-list").removeClass('nav-list-active');
	});

	$('.filter-item').mouseenter(function () {
		var self = $(this);
		self.find(".dropDown-list").css("display", 'block');
		self.find(".dropDown-list").attr("data-display", "show");
	}).mouseleave(function () {
		var self = $(this);
		self.find(".dropDown-list").css("display", 'none');
		self.find(".dropDown-list").attr("data-display", "hide")
	});

	$(".dropDown-list > a").on("click", function () {
		var url = $(this).attr("href");
		var newUrl = "";
		if (url.indexOf("sortOrder=DESC") > -1) {
			newUrl = url.replace(/sortOrder=DESC/, "sortOrder=ASC");
			$(this).attr("href", newUrl);
		} else {
			newUrl = url.replace(/sortOrder=ASC/, "sortOrder=DESC");
			$(this).attr("href", newUrl);
		}
	});

	$('.self-select-ul li').mouseenter(function () {
		var self = $(this);
		self.children(".nav-list").addClass('nav-list-active');
	}).mouseleave(function () {
		var self = $(this);
		self.children(".nav-list").removeClass('nav-list-active');
	});
	$(".self-select-wrapper").hover(function () {
		var self = $(this);
		if (self.find(".self-select-ul").attr("data-dispaly") == "hide") {
			self.find(".self-select-ul").show();
			self.find(".self-select-ul").attr("data-dispaly", "show");
		} else if (self.find(".self-select-ul").attr("data-dispaly") == "show") {
			self.find(".self-select-ul").hide();
			self.find(".self-select-ul").attr("data-dispaly", "hide");
		}
	});

	$(document).delegate('.self-select-ul li', 'click', function (event) {
		if (event && event.stopPropagation) {//非IE
			event.stopPropagation();
		}
		else {//IE
			window.event.cancelBubble = true;
		}
		var selfLi = $(this);
		var childrenUL = selfLi.find("ul");
		if (childrenUL.length == 0) {
			var oldvalue = selfLi.closest(".self-select-wrapper").find(".self-select-text").attr("value").trim();
			var self = selfLi.children('a').eq(0);
			var fullname = self.attr("fullname");
			var value = Number(self.attr("value"));
			var span = self.closest('.self-select-ul').siblings(".self-select-display").find(".self-select-text");
			var temp = selfLi.closest("td").attr("data-goodstype");
			var goodstypes = temp ? temp.split(",") : [];
			if (oldvalue != value) {
				if (goodstypes.indexOf(value.toString()) > -1) {
					alert("不能添加相同的类别");
					return;
				} else {
					var index = goodstypes.indexOf(oldvalue);
					if (index > -1) {
						goodstypes.splice(index, 1, value);
					} else {
						goodstypes.push(value);
					}
					span.text(fullname);
					span.attr("value", value);
				}
			} else {
				span.text(fullname);
				span.attr("value", value);
			}
			selfLi.closest("td").attr("data-goodstype", goodstypes);
			self.closest('.self-select-ul').hide();
		}
	});

	/* 产品分类导航 结束*/

	/* 轮播图加载 开始*/
	$('.flexslider').flexslider({
		animation: "slide",
		slideshowSpeed: 3000,
		animationSpeed: 500,
		pauseOnHover: true,
		start: function () {
			$('flexslider').removeClass('loading');
		},
		before: function () {
			$('.carouselATag').find('.flex-active-slide').find('.modalContent').css('display', 'none');
			$('.flex-control-nav').css('display', 'block');
		},
		after: function () {
			//$('.carouselATag').find('.flex-active-slide').find('.modalContent').slideDown('fast');
		}
	});
	$(document).delegate('.carouselATag', 'mouseenter', function () {
		var divElement = $(this).find('.flex-active-slide').find('.modalContent');
		if ($.trim(divElement.find('span').html()) == '')
			return;
		divElement.slideDown('fast');
		$('.flex-control-nav').css('display', 'none');
	});
	$(document).delegate('.carouselATag', 'mouseleave', function () {
		var divElement = $(this).find('.flex-active-slide').find('.modalContent');
		divElement.slideUp('fast', function () {
			divElement.css('display', 'none');
			$('.flex-control-nav').css('display', 'block');
		});
	});
	$(".flex-control-nav").css('margin-bottom', '40px');
	$(document).delegate('.flex-next', 'click', function () {
		var carouselATagSelect = $(".carouselATag");
		var modelContentElement = carouselATagSelect.find('.flex-active-slide').find('.modalContent');
		if ($.trim(modelContentElement.find('span').html()) == "")
			return;
		carouselATagSelect.find('.flex-active-slide').find('.modalContent').slideDown('slow');
		$('.flex-control-nav').css('display', 'none');
	});
	$(document).delegate('.flex-prev', 'click', function () {
		var carouselATagSelect = $(".carouselATag");
		var modelContentElement = carouselATagSelect.find('.flex-active-slide').find('.modalContent');
		if ($.trim(modelContentElement.find('span').html()) == "")
			return;
		carouselATagSelect.find('.flex-active-slide').find('.modalContent').slideDown('slow');
		$('.flex-control-nav').css('display', 'none');
	});


	/* 轮播图加载 结束*/

	$(document).delegate('.shoppingGoodsRegulation', 'click', function () {
		var self = $(this);

		//Ajax请求有三个参数,分别是 type,quantity,id
		// type 可能有四种情况 [increase,decrease,remove,create]
		// quantity 表示数量
		// id 表示商品-

		var type = self.attr('data-action');
		var quantity = 1;
		var goodsId = self.attr('goodsId');

		var model = {
			type: type,
			quantity: 1,
			id: goodsId
		};

		var ShoppingGoods = new RestService('cart/goods');
		ShoppingGoods.put(model, function (feedback) {
			// feedback :
			// {
			//   msg:       'success'/'failed'
			//   type:      操作类型
			//   amount:  修改后的数量
			//   id:        修改的商品的ID
			//   subtotal:  该商品的小计
			//   total:     商品的总价
			//   freight:   运费
			//   aggregate: 订单总额
			// }
			feedback = JSON.parse(feedback);
			if (feedback.msg === 'success') {
				var total = $(".cartTotal");
				var freight = $(".cartFreight");
				var aggregate = $(".cartAggregate");
				self.siblings('.quantity').val(Number(feedback.amount));
				total.text(Number(feedback.total).toFixed(2));
				freight.text(Number(feedback.freight).toFixed(2));
				aggregate.text(Number(feedback.aggregate).toFixed(2));
			} else {
				artDialogAlertModal(feedback);
			}
		});
	});

	// input & search
	$('.search_goods').click(function (e) {
		//阻止表单提交
		e.preventDefault();
		var self = $(this);
		var url = JSON.parse(self.attr('data-url'));
		var keywords = self.prev().val();
		var strb = url.kbv || "";
		url.kbv = strb.replace(/keywordsValueToBeReplaced/, keywords);
		var stra = url.kav || "";
		url.kav = stra.replace(/keywordsValueToBeReplaced/, keywords);
		var str = url.kv || "";
		url.kv = str.replace(/keywordsValueToBeReplaced/, keywords);
		if (keywords) {
			if (self.attr('data-attr') == 'chooseGoods') {
				joinPaginator(url, 'chooseGoods');
			} else if (self.attr('data-attr') == 'chooseGoodsIcon') {
				joinPaginator(url, 'chooseGoodsIcon');
			} else {
				joinPaginator(url);
			}
		} else if (keywords == null || $.trim(keywords) == '') {
			if (self.attr('data-attr') == 'chooseGoods') {
				var tempstr = "";
				if (localStorage.currentShowCaseGoodsIds != "") {
					tempstr = "&ids=" + localStorage.currentShowCaseGoodsIds;
				}
				//$('#showcaseChooseGoodsIframe').attr('src','/goods?flag=chooseGoods'+tempstr);
				window.location.href = '/goods/showcase?flag=chooseGoods' + tempstr;
				return false;
			} else if (self.attr('data-attr') == 'chooseGoodsIcon') {
				var tempstr = "";
				if (localStorage.currentICONShowCaseGoodsIds != "") {
					tempstr = "&ids=" + localStorage.currentICONShowCaseGoodsIds;
				}
				//$('#showcaseChooseGoodsIframe').attr('src','/goods?flag=chooseGoods'+tempstr);
				window.location.href = '/goods/showcaseIcon?flag=chooseGoods' + tempstr;
				return false;

			}
			else {
				url.kv = '';
				url.kbv = '';
				joinPaginator(url);
			}
		}
	});
	// end input & search

//  End : _nav_head.ejs

//  page: cart.ejs
	//calculate  num & price of goods in cart
	$(".moveMouse").mouseover(function () {
		$(this).css("font-size", "22px");
		$(this).css("font-weight", "bold");
	}).mouseout(function () {
		$(this).css("font-size", "");
		$(this).css("font-weight", "100");
	});
	//calculate package num

	$(document).delegate(".chkAll", 'click', function () {
		var chkAll = $(this);
		if (chkAll.hasClass('checked')) {
			$(".icheckbox").removeClass('checked');
			chkAll.removeClass('checked');
		} else {
			$(".icheckbox").addClass('checked');
			chkAll.addClass('checked');
		}
	});

	function removeCartItems(cartItems, callback) {
		$.ajax({
			type: 'POST',
			url: '/cart/remove',
			data: JSON.stringify(cartItems),
			processData: false,
			contentType: 'application/json',
			success: callback,
			error: function (req, status, ex) {
			},
			timeout: 60000
		});
	}

	function refreshCartCount(count) {
		var eleCount = $('span.cartItemCount');
		eleCount.text(count);
	}

	$(document).delegate('a[id^=remove_]', 'click', function () {
		var self = $(this);
		var goodsIds = [self.attr('goodsId')];
		removeCartItems({goodsIds: goodsIds}, function (feedback) {
			self.parents('tr.cartItem').remove();
			var eleCount = $('span.cartItemCount');
			eleCount.text(feedback.data.cartItemCount);
			refreshTotal();
		});
	});

	$(document).delegate('.removeSelected', 'click', function () {
		var goodsIds = [];
		$(".icheckbox.checked").parents('tr.cartItem').each(function () {
			goodsIds.push($(this).attr('goodsId'));
		});
		removeCartItems({goodsIds: goodsIds}, function (feedback) {
			$(".icheckbox.checked").parents('tr.cartItem').remove();
			refreshTotal();
			refreshCartCount(feedback.data.cartItemCount);
		});
	});

	$(document).delegate('.removeSelectedShipGoods', 'click', function () {
		$(".icheckbox.checked").each(function () {
			var parentTr = $(this).closest("tr");
			var goodsId = parentTr.attr("goodsid");
			if (goodsId) {
				parentTr.remove();
			}
		});
	});

	$(document).delegate('.removeAll', 'click', function () {
		$(".icheckbox").addClass('checked');
		$('.removeSelected').click();
	});

	$(document).delegate('.showNewAddressItem', 'click', function () {
		$('.trNewAddress').toggle();
	});

	$(document).delegate('.showNewListItem', 'click', function () {
		$('.trNewAddress').toggle();
	});

	$(document).delegate('.goodsAddPurchaseList', 'click', function () {
		var data = {};
		data.list = [];
		var goodsId = $(window.parent.document).contents().find("#selectGoods").attr('goodsId');
		var quantity = $(window.parent.document).contents().find("#selectGoods").attr('quantity');
		var radioBtns = $('.iradio');
		for (var j = 0; j < radioBtns.length - 1; j++) {
			var radioBtn = radioBtns[j];
			if ($(radioBtn).attr('class').indexOf('checked') != -1) {
				var id = $(radioBtn).parent().attr("data-id");
				var temp = [];
				temp.push(goodsId);
				temp.push(quantity);
				temp.push(id);
				data.list.push(temp);
				break;
			}
		}
		if (data.list.length < 1) {
			artDialogAlertModal("请至少选择一种清单列表");
		} else {

			$.ajax({
				data: data,
				url: "/goods/goodsAddList",
				type: 'post',
				dataType: 'json',
				cache: false,
				timeout: 5000,
				success: function (feedback) {
					if (feedback.status == 200) {
						$(window.parent.document).find('.fadeDiv').css('display', 'none');
						$(window.parent.document).find("#selectGoods").css('display', 'none').attr('src', '');
						window.location.reload();
					} else {
						artDialogAlertModal(feedback.msg);
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					artDialogAlertModal('error ' + textStatus + " " + errorThrown);
				}
			});
		}
	});

	$(document).delegate('.btnAddList', 'click', function () {
		var self = $(this);
		var inputList = self.parents('tr').find('.inputList');
		if (inputList.val() != '') {
			var data = {
				"listName": inputList.val()
			};
			$.ajax({
				data: data,
				url: '/portal/purchaseList/add',
				type: 'post',
				dataType: 'json',
				cache: false,
				timeout: 5000,
				success: function (res) {
					var newAddressTemplateSelect = $(".newAddressTemplate");
					if (res.status == 200) {
						var trNewAddress = newAddressTemplateSelect.clone().removeClass('newAddressTemplate').addClass('realPurchase');
						trNewAddress.find('.spanNewAddress').text(inputList.val());
						trNewAddress.find('.radio').attr("data-id", res.data);
						//trNewAddress.find('.iradio').find("input").remove();
						/*
						 trNewAddress.find('.checkbox').attr("data-id", res.data);*/
						//trNewAddress.find('.checkbox').find("label").addClass("chkItem");
						newAddressTemplateSelect.before(trNewAddress);
						self.parents('tr').hide();
						trNewAddress.slideDown('slow');
						inputList.val('');
					} else {
						artDialogAlertModal(res.msg, function () {
							window.location.reload();
						});
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					artDialogAlertModal('error ' + textStatus + " " + errorThrown);
				}
			});
		}
	});


	$(document).delegate('.btnAddAddress', 'click', function () {
		var self = $(this);
		var addressInfo = self.parents('tr').find('.inputAddress');
		if (addressInfo.val() != '') {

			var data = {
				"addressDetail": addressInfo.val()
			};
			$.ajax({
				data: data,
				url: '/address/add',
				type: 'post',
				dataType: 'json',
				cache: false,
				timeout: 5000,
				success: function (res) {
					if (res.status == 200) {
						var newAddressTemplateSelect = $(".newAddressTemplate");
						newAddressTemplateSelect.siblings("tr").find("td:nth-child(1)").find("i").removeClass("fa-lg");
						newAddressTemplateSelect.siblings("tr").find("td:nth-child(1)").find("i").removeClass("fa-check-circle");
						newAddressTemplateSelect.siblings("tr").find("td:nth-child(1)").find("i").addClass("fa-circle-o");
						var trNewAddress = newAddressTemplateSelect.clone().removeClass('newAddressTemplate');
						trNewAddress.find('.spanNewAddress').text(addressInfo.val());
						trNewAddress.addClass('address-list');


						var allAddress = $('.address-list');
						if (allAddress.length != 0) {
							if (allAddress.length > 1) {
								$(allAddress[1]).before(trNewAddress);
							} else {
								$(allAddress[0]).after(trNewAddress);
							}
						} else {
							newAddressTemplateSelect.before(trNewAddress);
						}

						//newAddressTemplateSelect.before(trNewAddress);
						self.parents('tr').hide();
						trNewAddress.slideDown('slow');
						trNewAddress.find('.modAddress').attr('id', "item_" + res.data);
						trNewAddress.find('.delAddress').find("i").attr('id', ("delAM_" + res.data));
						trNewAddress.find('.delAddress').find("a").attr('title', "删除");
						trNewAddress.find('.modAddress').find("a").removeClass("tooltipped");
						trNewAddress.find('.modAddress').find("a").addClass("tooltipped");
						trNewAddress.find('.modAddress').find("a").attr('title', "修改");
						trNewAddress.find('.modAddress').find("a").attr('data-toggle', "tooltip");
						trNewAddress.find('.modAddress').find("a").attr('data-placement', "left");
						trNewAddress.find('.flag').find("i").removeClass("fa-circle-o");
						trNewAddress.find('.flag').find("i").addClass("fa-lg");
						trNewAddress.find('.flag').find("i").addClass("fa-check-circle");
						addressInfo.val('');

						//如果条数大于2了 就让显示按钮出现
						var trLength = $('.newAddressTemplate').prevAll().length;
						if (trLength > 2) {
							//改变里面的字体和 样式


							$('.addressDisplayBtn').attr('data-display', 'display');
							$('.addressDisplayBtn').find('span').html('隐藏地址');
							$('.addressDisplayBtn').find('a').attr('class', 'fa fa-long-arrow-up');

							$('#addressTips').css('display', 'table-row');


						}

					} else {
						artDialogAlertModal(res.msg, function () {
							location.reload();
						});

					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					artDialogAlertModal('error ' + textStatus + " " + errorThrown);
				}
			});
		}
	});

	$(document).delegate('label.flag', 'mouseover', function () {
		var self = $(this);
		self.children('a').addClass('text-danger');
	});

	$(document).delegate('label.flag', 'mouseout', function () {
		var self = $(this);
		self.children('a').removeClass('text-danger');
	});

	$(document).delegate('label.flag', 'click', function () {
		var self = $(this);
		$('label.flag').children('a').children('i').removeClass('fa-lg', 'fa-check-circle').addClass('fa-circle-o');
		self.children('a').children('i').addClass('fa-check-circle fa-lg').removeClass('fa-circle-o');
	});

	$(document).delegate('.delAddress', 'click', function () {
		var self = $(this);
		self.parents('tr').remove();

	});

	$(document).delegate('.modAddress', 'click', function () {
		var self = $(this);
		if (self.attr('modifying') == 'true') {
			self.attr('modifying', 'false');
			self.parents('tr').next().hide();
		} else {
			var trModifyAddress = $('.trModifyAddress').clone().removeClass('trModifyAddress');
			trModifyAddress.find('input').val(self.parents('tr').find('span').text());
			self.parents('tr').after(trModifyAddress);
			trModifyAddress.find('a').attr('id', 'aMA' + this.id);
			trModifyAddress.find('input').attr('id', 'inputMA' + this.id);
			trModifyAddress.attr('id', 'trMA' + this.id);
			trModifyAddress.show();
			self.attr('modifying', 'true');
		}
	});

	$(document).delegate('.btnSaveAddress', 'click', function () {
		var self = $(this);
		var addressInfo = self.parents('tr').find('input').val();
		self.parents('tr').prev().find('span').text(addressInfo);
		self.parents('tr').prev().find('.modAddress').attr('modifying', 'false');
		self.parents('tr').remove();
	});


	$(document).delegate('.submitOrder', 'click', function () {
		var items = [];
		var numDataValid = true;
		var isIllegal = false;
		$(document).find('input[id^=cartChangeQuantity_]').map(function () {
			var currentInput = $(this)[0];
			var reg = /^[1-9][0-9]*$/;
			var i = $.trim($(this).attr('id')).substr(-1, 1);
			if (!reg.test($(this).val())) {
				if (dialog.getCurrent() == null) {
					dialog({
						content: '请输入正确的数量',
						align: 'top left',
						quickClose: true
					}).show(currentInput);
				}
				$(this).focus();
				numDataValid = false;
				return false;
			} else {
				var inputNum = Number($(this).val());
				var isSplit = $(this).attr('isSplit');
				var attrStock = $(this).attr('storage');
				var defaultNum = $(this).attr('defaultNum');

				function check(inputNum) {
					return inputNum % defaultNum === 0;
				}

				var newQty = $(this).val();
				if (isSplit == 0 && !check(inputNum)) {
					newQty = Math.ceil(inputNum / defaultNum) * defaultNum;
					isIllegal = true;
				}
				if (Number(attrStock) > -1) {
					if (Number($(this).val()) > Number(attrStock)) {
						newQty = Math.floor(Number(attrStock) / defaultNum) * defaultNum;
						isIllegal = true;
					}
				}
				$(this).val(newQty);
				refreshSubtotal(i);
			}
		});

		if (!numDataValid || isIllegal) {
			return;
		}
		//以下代码读取 items ;
		$('.cartItem').each(function () {
			var element = $(this);
			var isChecked = element.find('div.icheckbox').hasClass('checked');
			//if (isChecked) {
			var item = {};
			item.itemId = Number(element.attr('id'));
			item.goodsId = Number(element.attr('goodsId'));
			item.quantity = $.base64.encode(Number(element.find('input[id^=cartChangeQuantity_]').val()));
			item.remark = element.find('input[id^=remark_]').val();
			items.push(item);
			//}
		});
		//以下代码读取remarks数据
		var remarks = $('#cart_remarks').val();
		var address = $('#address-user').text();
		var chkTiklesTitle = $("#chkTikles").closest(".icheckbox").hasClass('checked');
		var chkTiklesContent = $("#tikelsContent").text();
		if ($('.submitOrder').attr('data-expire')) {
			artDialogAlertModal('您有证照已过期，不能购买商品');
			return;
		}
		if (items.length == 0) {
			artDialogAlertModal('您的购物车里没有商品.');
			return;
		}
		if (address == '') {
			artDialogAlertModal("请添加配送地址");
			return;
		}

		//复制订单表格信息 到 购买合同页面里面
		//药品信息 供价 数量  小计
		var newTr = "";
		$('#CartDetailTable').find('tbody').find('tr').each(function () {
			var medInfo = $(this).find('td').eq(1).find('div').eq(1);
			//药品信息
			var ultimateInfo = '<h6>' + medInfo.find('h6').eq(0).find('a').html() + '</h6>';
			//规格　　厂家
			var specInfo = medInfo.find('h6').eq(1)[0].outerHTML;
			var producer = medInfo.find('h6').eq(2)[0].outerHTML;
			var medicineInfo = ultimateInfo + specInfo + producer;
			var price = $(this).find('td').eq(2).find('label').html();
			var productsNum = $(this).find('td').eq(4).find('input').val();
			var singleProductsSum = $(this).find('td').eq(5).find('label').html();
			newTr += "<tr><td style='word-break:break-all' >" + medicineInfo + "</td><td>&yen;" + price + "</td><td>" + productsNum + "</td><td>&yen; " + singleProductsSum + "</td></tr>";

		});
		var $newTr = $(newTr).attr('style', 'border-bottom:1px solid #dddddd');
		var orderDetailTableSelect = $("#orderDetailTable");
		orderDetailTableSelect.find('tbody').empty();
		orderDetailTableSelect.find('tbody').append($newTr);

		// 商品总额是否超过授信余额
		var praticalPriceSum = $('#total').html();

		$('#purchaseDealTotal').html(praticalPriceSum);
		$('#purchaseDealFadeDiv').show();
		displayDialog("purchaseAgreement");
		//全局对象
		postCartDataDeal = {
			items: items,
			address: address,
			remarks: remarks,
			hasReceipt: chkTiklesTitle,
			receiptTitle: chkTiklesContent
		};
	});

	//此段代码可以和cart页面共用.做输入检查,并判断库存
	$(document).delegate('input[id^=quantity_]', 'blur', function () {
		var currentInput = $(this)[0];
		var attrStock = $(this).attr('storage');
		var reg = /^[1-9][0-9]*$/;
		var i = $.trim($(this).attr('id')).substr(-1, 1);
		if (!reg.test($(this).val())) {
			if (dialog.getCurrent() == null) {
				dialog({
					content: '请输入正确的数量',
					align: 'top left',
					quickClose: true
				}).show(currentInput);
			}
			$(this).focus();
			return;
		}
		var inputNum = Number($(this).val());
		var isSplit = $(this).attr('isSplit');
		var defaultNum = Number($(this).attr('defaultNum'));

		function check(inputNum) {
			return inputNum % defaultNum === 0;
		}

		var newQty = $(this).val();
		if (isSplit == 0 && !check(inputNum)) {
			newQty = Math.ceil(inputNum / defaultNum) * defaultNum;
			$(this).val(newQty);
		}
		if (Number(attrStock) > -1) {
			if (Number($(this).val()) > Number(attrStock)) {
				newQty = Math.floor(Number(attrStock) / defaultNum) * defaultNum;
				if (newQty == 0) {
					if (dialog.getCurrent() == null) {
						dialog({
							content: '库存不足',
							align: 'top left',
							quickClose: true
						}).show(currentInput);
					}
					$(this).val(defaultNum);
					return;
				}
			}
		}
		if (dialog.getCurrent() != null) {
			dialog.getCurrent().close().remove();
		}
		refreshSubtotal(i);
	});

	$(document).delegate('a[id=changeQuantityX]', 'click', function () {
		var self = $(this);
		var type = self.attr('type');
		var packNumber = Number(self.attr('pack'));
		var maxNum = Number(self.attr('maxNum'));
		var oldQuantity = Number(self.siblings("input").val());
		var newQuantity;
		if (type === 'decrease') {
			newQuantity = oldQuantity - packNumber;
			if (newQuantity < 0) {
				self.siblings("input").val(0);
			} else {
				self.siblings("input").val(newQuantity);
			}
		} else if (type === 'increase') {
			newQuantity = oldQuantity + packNumber;
			if (newQuantity > maxNum) {
				$(this).siblings("input").val(maxNum);
				artDialogAlertModal('不能大于实际收货的数量');
			} else {
				$(this).siblings("input").val(newQuantity);
			}
		}
	});

	$("ins").remove();
	$('.cart-checkbox-total .icheckbox').click(function () {
		var self = $(this);
		var checked = self.hasClass('checked');
		var display = self.closest(".cart-checkbox-total").attr("attr-display");
		if (display == "true") {
			self.closest(".cart-checkbox-total").attr("attr-display", "false");
			self.closest(".cart-total-display-address").find(".tikles").css('display', 'inline-block');
		} else {
			self.closest(".cart-checkbox-total").attr("attr-display", "true");
			self.closest(".cart-total-display-address").find(".tikles").css('display', 'none');
		}
	});

	//常购清单 和 商品中心的加减
	$(document).delegate('a[id^=changeQuantity_]', 'click', function () {
		var self = $(this);
		var type = self.attr('type');
		var packNumber = Number(self.attr('pack'));
		var isSplit = self.attr('isSplit');
		var i = self.attr('id').substr(self.attr('id').indexOf('_') + 1, self.attr('id').length);
		var eleInput = $('input[id^=quantity_' + i + ']');
		var storage = Number(eleInput.attr('storage'));
		var oldQuantity = Number(eleInput.val());
		var defaultNum = Number(self.attr("defaultNum"));
		var newQuantity;
		if (type === 'decrease') {
			if (isSplit == 0) {
				newQuantity = Number(oldQuantity - defaultNum * packNumber) < 1 ? oldQuantity : Number(oldQuantity - defaultNum * packNumber);
			} else {
				newQuantity = Number(oldQuantity - packNumber) < 1 ? 1 : Number(oldQuantity - packNumber);
			}
		} else if (type === 'increase') {
			if (isSplit == 0) {
				newQuantity = Number(oldQuantity + defaultNum * packNumber);
			} else {
				newQuantity = oldQuantity + packNumber;
			}
			if (storage > -1) {
				if (newQuantity > storage) {
					newQuantity = Math.floor(Number(storage) / defaultNum) * defaultNum;
					if (dialog.getCurrent() == null) {
						dialog({
							content: '库存不足',
							align: 'top left',
							quickClose: true
						}).show(eleInput[0]);
					}
					$(this).val((newQuantity == 0) ? defaultNum : newQuantity);
				}
			}
		}
		eleInput.val(newQuantity);
		refreshSubtotal(i);
	});
	//购物车的商品 加减
	$(document).delegate('a[id^=cartQuantityChange_]', 'click', function () {
		var self = $(this);
		var type = self.attr('type');
		var packNumber = Number(self.attr('pack'));
		var isSplit = self.attr('isSplit');
		var i = self.attr('id').substr(self.attr('id').indexOf('_') + 1, self.attr('id').length);
		var goodsId = Number(self.parents('tr').attr("goodsid"));
		var remark = $("input[id^=remark_" + i).val();

		var eleInput = $('input[id^=cartChangeQuantity_' + i + ']');
		var storage = Number(eleInput.attr('storage'));
		var oldQuantity = Number(eleInput.val());
		var defaultNum = Number(self.attr("defaultNum"));
		var newQuantity;
		if (type === 'decrease') {
			if (isSplit == 0) {
				newQuantity = Number(oldQuantity - defaultNum * packNumber) < 1 ? oldQuantity : Number(oldQuantity - defaultNum * packNumber);
			} else {
				newQuantity = Number(oldQuantity - packNumber) < 1 ? 1 : Number(oldQuantity - packNumber);
			}
		} else if (type === 'increase') {
			if (isSplit == 0) {
				newQuantity = Number(oldQuantity + defaultNum * packNumber);
			} else {
				newQuantity = oldQuantity + packNumber;
			}
			if (storage > -1) {
				if (newQuantity > storage) {
					newQuantity = Math.floor(Number(storage) / defaultNum) * defaultNum;
					if (dialog.getCurrent() == null) {
						dialog({
							content: '库存不足',
							align: 'top left',
							quickClose: true
						}).show(eleInput[0]);
					}
					eleInput.val((newQuantity == 0) ? defaultNum : newQuantity);
				}
			}
		}
		eleInput.val(newQuantity);
		if (Number(newQuantity) != Number(oldQuantity)) {
			addGoodsToShoppingCart(goodsId, Number(newQuantity - oldQuantity), remark);
		}
		refreshSubtotal(i);
	});


	$(document).delegate('input[id^=cartChangeQuantity_]', 'blur', function () {
		var self = $(this);
		var goodsSerialNumberInPage = self.attr('id').substr(self.attr('id').indexOf('_') + 1, self.attr('id').length);
		var remark = $("input[id^=remark_" + goodsSerialNumberInPage).val();
		var goodsId = Number(self.parents('tr').attr("goodsid"));
		var currentInput = $(this)[0];
		var attrStock = $(this).attr('storage');
		var reg = /^[1-9][0-9]*$/;
		var i = $.trim($(this).attr('id')).substr(-1, 1);
		//validate the right syntax of number
		if (!reg.test($(this).val())) {
			if (dialog.getCurrent() == null) {
				dialog({
					content: '请输入正确的数量',
					align: 'top left',
					quickClose: true
				}).show(currentInput);
			}
			$(this).focus();
			return;
		}
		var inputNum = Number($(this).val());
		var isSplit = $(this).attr('isSplit');
		var defaultNum = Number($(this).attr('defaultNum'));

		var data = $.parseJSON($(this).attr('data'));
		var originNum = parseInt(data.origin);

		function check(inputNum) {
			return inputNum % defaultNum === 0;
		}

		var newQty = $(this).val();
		if (isSplit == 0 && !check(inputNum)) {
			newQty = Math.ceil(inputNum / defaultNum) * defaultNum;
			$(this).val(newQty);
		}
		if (Number(attrStock) > -1) {
			if (Number($(this).val()) > Number(attrStock)) {
				newQty = Math.floor(Number(attrStock) / defaultNum) * defaultNum;
				if (dialog.getCurrent() == null) {
					dialog({
						content: '库存不足',
						align: 'top left',
						quickClose: true
					}).show(currentInput);
				}
				$(this).val((newQty == 0) ? defaultNum : newQty);
			}
		}
		if (dialog.getCurrent() != null) {
			dialog.getCurrent().close().remove();
		}

		if (Number(newQty) != Number(originNum)) {
			addGoodsToShoppingCart(goodsId, Number(newQty - originNum), remark);
		}
		refreshSubtotal(i);
	});

	function addGoodsToShoppingCart(goodsId, quantity, remark) {
		var url = "cart/goods/add";

		var successHandler = function (feedback) {
			artDialogAlertModal(feedback.msg);
		};
		var errorHandler = function (feedback) {
			artDialogAlertModal(feedback.msg);
		};

		var addGoodsService = new AddGoodsService(url);

		addGoodsService.addGoods(goodsId, quantity, remark, successHandler, errorHandler);

	}

	function AddGoodsService(addGoodsUrl) {
		this.addGoods = function (goodsId, quantity, remark, successHandler, errorHandler) {
			var data = {
				goodsId: goodsId,
				quantity: quantity,
				remark: remark
			};
			browser.post(addGoodsUrl, data, successHandler, errorHandler);
		};
	}

	var browser = {
		post: function (url, data, successHandler, errorHandler) {
			$.ajax({
				url: url,
				type: "POST",
				data: data,
				//success: successHandler,
				error: errorHandler
			});
		}
	};

	function refreshSubtotal(i) {
		var eleSubtotal = $('label[id^=subtotal_' + i + ']');
		var elePrice = $('label[id^=price_' + i + ']');
		var eleQuantity = $('input[id^=cartChangeQuantity_' + i + ']').length != 0 ? $('input[id^=cartChangeQuantity_' + i + ']') : $('input[id^=quantity_' + i + ']');

		var subtaotal = Number(elePrice.text()) * Number(eleQuantity.val());
		if (subtaotal) {
			eleSubtotal.text(subtaotal.toFixed(2));
			refreshTotal();
		}
	}

	function refreshTotal() {
		var eleTotal = $("strong[id='total']");
		var total = 0;
		$("label[id^='subtotal_']").each(function () {
			total += Number($(this).text());
		});
		eleTotal.text(total.toFixed(2));
	}


	$(document).delegate(".addList", "click", function () {
		var selectGoods = $("#selectGoods");
		var goodsId = $(this).attr("goodsId");
		selectGoods.attr('src', '/portal/purchaseList/list?goodsId=' + goodsId);
		var quantity = Number($(this).closest("td").prev().find("input").val());
		if ($(this).attr('data-checkLogin') == "true" && typeof goodsId != 'undefined') {
			selectGoods.attr("goodsId", goodsId);
			selectGoods.attr("quantity", quantity);
			_.each(selectGoods.contents().find("input[type=checkbox]"), function (item) {
				var list = $(item).attr("goodsIdList");
				$(item).closest("div").removeClass("checked");
				if (list != "" && list.indexOf(goodsId) > -1) {
					$(item).closest("div").addClass("checked");
				}
			});
			displayDialog("selectGoods");
		} else {
			var nextTo = window.parent.location.pathname;
			dialog(
				{
					title: '温馨提示',
					content: '登录之后才能加入购物清单,离开去登录?',
					button: [{
						value: '去登录',
						callback: function () {
							window.location.href = '/login?nextTo=' + nextTo;
						},
						autofocus: true
					}, {
						value: '继续逛',
						callback: function () {
						}
					}]
				}
			).showModal().width(400);
		}
	});

	$(document).delegate('a[id^=goodsToCart_]', 'click', function () {
		//validate the number of the products is valid or not
		var self = $(this);
		var i = $.trim(self.attr('id')).substr(-1, 1);
		var eleInput = $("input[id^=quantity_" + i + "]");
		var goodsQuantity = eleInput.val();
		var goodsPrice = $.trim($("[id^=price_" + i + "]").text());
		var goods_storage = $.trim(self.closest('tr').find(".goods_storage").text());
		if (!(Number(goodsPrice) > 0)) {
			artDialogAlertModal(' 该商品暂无价格信息，不能加入购物车哦！', function () {
			});
			return
		}
		var reg = /^[1-9][0-9]*$/;
		if (!reg.test(goodsQuantity)) {
			artDialogAlertModal('请输入正确的数量', function () {
				eleInput.focus();
			});
			return;
		}
		if (self.attr('data-checkLogin') == "true") {
			var goodsId = Number(self.attr('goodsId'));
			var cartItem = {
				goodsId: goodsId,
				quantity: goodsQuantity
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
					dialog(
						{
							title: '温馨提示',
							content: '商品已成功加入购物车,现在去结算?',
							button: [{
								value: '去结算',
								callback: function () {
									window.location.href = '/cart';
								},
								autofocus: true
							}, {
								value: '继续逛',
								callback: function () {
									this.close().remove();
								}
							}
							]

						}
					).showModal().width(400);
				} else {
					artDialogAlertModal(feedback.msg);
				}
			});
		}
		else {
			var nextTo = window.location.pathname;
			dialog(
				{
					title: '温馨提示',
					content: '登录之后才能加入购物车,离开去登录?',
					button: [{
						value: '去登录',
						callback: function () {
							window.location.href = '/login?nextTo=' + nextTo;
						},
						autofocus: true
					}, {
						value: '继续逛',
						callback: function () {
						}
					}]
				}
			).showModal().width(400);
		}
	});

//  END: goods.ejs

// personal_center.js start
	$(document).delegate('.infoAddCart', 'click', function () {
		//step1
		var self = $(this);
		var goodsId = Number(self.attr('goodsid'));
		var goodsQuantiry = Number($(this).closest("td").prev().find("input").val());
		var cartItem = {
			goodsId: goodsId,
			quantity: goodsQuantiry
		};
		postAddToCart(cartItem, function (feedback) {
			if (feedback.status == 200) {
				var countCartItems = feedback.data.cartItemCount;
				if (Number(countCartItems)) {

				}
				goOnShoppingOrCheck(undefined, undefined, '返回');

			} else {
				artDialogAlertModal(feedback.msg);
			}
		});
	});


// personal_center.js end


	$(document).delegate('.reviewPurchaseDealBtn', 'click', function () {
		//todo 获取订单数据
		$('#purchaseDealFadeDiv').show();
		displayDialog("purchaseAgreement");
	});

	//customerOrderPending.ejs


	//client 查看合同按钮事件
	$(document).delegate('#reviewPurchaseDeal', 'click', function () {
		$('#purchaseDealFadeDiv').show();
		displayDialog("purchaseAgreement");

	});
	//客户查看购买合同的 确定按钮[关闭当前模态框]
	$(document).delegate('#customerReadPurchase', 'click', function () {
		$('#purchaseAgreement').hide();
		$('#purchaseDealFadeDiv').hide();
		//$('.fadeDiv').hide();
	});

	//customerOrderPending.ejs  end


	$(document).delegate('.sureAccept', 'click', function () {
		var element = $(this);
		artDialogAlertModalTitle("温馨提示", "请收到货后,再确认收货哦!", function () {
			var shipId = element.attr("shipId");
			var data = {
				shipId: shipId
			};
			$.ajax({
				data: data,
				url: '/order/ship/update',
				type: 'post',
				dataType: 'json',
				cache: false,
				timeout: 5000,
				success: function (feedback) {
					if (feedback.status == 200 && feedback.data != undefined) {
						window.location.href = "/order/ship"
					} else {
						artDialogAlertModal(feedback.msg, function () {
						});
					}

				},
				error: function (jqXHR, textStatus, errorThrown) {
					artDialogAlertModal('error ' + textStatus + " " + errorThrown);
				}

			});


		});

	});


	$(document).delegate('.clientCancelDialog', 'click', function () {
		var element = $(this);
		var type = typeof(element.attr("type")) != "undefined" ? element.attr("type") : "";
		artDialogAlertModalTitle("温馨提示", "您确定要" + (element.attr("type") == "client" ? "取消" : "关闭") + "此次订单吗？", function () {
			var orderId = element.attr("orderId");
			var clientId = element.attr('data-clientId');
			var displayId = element.attr('data-displayId');
			var closeType = element.attr('data-type') || '';
			var data = {
				orderId: orderId,
				clientId: clientId,
				displayId: displayId,
				type: closeType
			};
			$.ajax({
				data: data,
				url: (element.attr("type") == "client" ? "" : "/customer") + '/order/close',
				type: 'post',
				dataType: 'json',
				cache: false,
				timeout: 5000,
				success: function (feedback) {
					if (feedback.status == "200") {
						artDialogAlertModal(feedback.msg, function () {
							window.location.reload();
						});
					} else {
						artDialogAlert(feedback.msg);
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					artDialogAlertModal('error ' + textStatus + " " + errorThrown);
				}
			});
		});
	});

	$(document).delegate("#arrowDownCollapse", "click", function () {
		var collapseDiv = $(this).closest(".collapse");
		collapseDiv.removeClass("in");
		collapseDiv.addClass("out");
	});


	/**
	 * 退款数据接收与提交
	 * @param oData
	 */
	function jsSubmit(oData) {
		var $ = function (id) {
			return document.getElementById(id);
		};
		var sFormId = 'jsSubmitter',
			dForm = $(sFormId);

		if (!dForm) {
			dForm = document.createElement('form');
			dForm.id = sFormId;
			dForm.method = 'POST';
			dForm.target = '_blank';
			dForm.style.display = 'none';
			document.body.appendChild(dForm);
		}

		dForm.innerHTML = '';
		if (typeof(oData) == 'object') {
			var merIdinput;
			merIdinput = document.createElement('input');
			merIdinput.type = 'hidden';
			merIdinput.name = "merId";
			merIdinput.value = oData.merId;
			dForm.appendChild(merIdinput);
			var dealinput;
			dealinput = document.createElement('input');
			dealinput.type = 'hidden';
			dealinput.name = "dealOrder";
			dealinput.value = oData.dealOrder;
			dForm.appendChild(dealinput);
			var dealAmount;
			dealAmount = document.createElement('input');
			dealAmount.type = 'hidden';
			dealAmount.name = "dealAmount";
			dealAmount.value = oData.dealAmount;
			dForm.appendChild(dealAmount);
			var refundAmount;
			refundAmount = document.createElement('input');
			refundAmount.type = 'hidden';
			refundAmount.name = "refundAmount";
			refundAmount.value = oData.refundAmount;
			dForm.appendChild(refundAmount);
			var dealSignure;
			dealSignure = document.createElement('input');
			dealSignure.type = 'hidden';
			dealSignure.name = "dealSignure";
			dealSignure.value = oData.dealSignure;
			dForm.appendChild(dealSignure);
			dForm.action = oData.baseUrl;
		}
		dForm.submit();
		artDialogAlertModal("您的退货信息已经提交，我们会在1-7个工作日退款，请耐心等待", function () {
			window.location.reload();
		});
	}

	//index 加入购物车

	$(document).delegate('.indexAddtoCart,.frequentGoodsAddToCart', 'click', function () {
		var self = $(this);
		var dataDisplay = self.attr('data-display');
		var isLogin = self.attr('data-checklogin');
		var currentGoodsId = self.attr('goodsId');
		if (isLogin === "false") {
			addToCartModal("");
			return;
		}
		//点击的是头图下面的,添加进购物车按钮
		if (dataDisplay == 'pic') {
			var stock = self.parent().prev().prev().find('span').html();
			if (Number(stock) <= 0) {
				artDialogAlertModal("库存不足,暂时不能购买");
				return false;
			}
			else {
				var cartItem1 = {
					goodsId: currentGoodsId,
					quantity: 1
				};
				postAddToCart(cartItem1, function (feedback) {
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

			}
		}
		else {
			var inputEle = self.parent().prev().find('input');
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
		}
	});

	//商品详情页面 + - 按钮 商品数量事件
	$(document).delegate('.changePurchaseQuanity', 'click', function () {
		var reg = /^[1-9][0-9]*$/;
		var purchaseNumsEle = $('#goodsDetailNumInput');
		var purchaseNums = purchaseNumsEle.val();
		if (!reg.test(purchaseNums)) {
			artDialogAlertModal("请输入正确的商品数量");
			purchaseNumsEle.focus();
			return;
		}
		var storage = $.trim($('#storage').html());
		var price = $.trim($('#price').find('text').html());
		if (!Number(storage) || !Number(price)) {
			artDialogAlertModal("商品暂时无法购买");
			return;
		}
		var inputNum = Number(purchaseNums);
		var operationType = $(this).attr('type');
		if (operationType === 'decrease') {
			if ((inputNum - 1) < 1) {
				purchaseNumsEle.val(1);
			} else {
				purchaseNumsEle.val(inputNum - 1);
			}
		} else {
			purchaseNumsEle.val(inputNum + 1);
		}
	});
	//商品详情页 添加进购物车
	$(document).delegate('#addToCartOnDetail', 'click', function () {
		var self = $(this);
		var isLogin = self.attr('data-checklogin');
		var currentGoodsId = self.attr('goodsId');
		if (isLogin === "false") {
			var url = window.location.pathname + "?goodsId=" + currentGoodsId;
			addToCartModal(url);
			return;
		}
		var storage = $.trim($('#storage').html());
		var price = $.trim($('#price').find('text').html());
		if (!Number(storage) || !Number(price)) {
			artDialogAlertModal("商品暂时无法购买,请稍后再");
			return;
		}
		var reg = /^[1-9][0-9]*$/;
		var purchaseNumsEle = $('input[id^=quantity_]');
		var purchaseNums = purchaseNumsEle.val();
		if (!reg.test(purchaseNums)) {
			artDialogAlertModal("请输入正确的商品数量");
			purchaseNumsEle.focus();
			return;
		}
		if (Number(purchaseNums) > Number(storage)) {
			artDialogAlertModal("亲,选购的数量大于库存了");
			return;
		}
		var cartItem = {
			goodsId: currentGoodsId,
			quantity: purchaseNums
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


	//personal_gsp_edit页面的编辑图片js

	//点击图片 触发file input 点击事件
	$(document).delegate('.gspImages', 'click', function () {
		$(this).next().trigger('click');
	});
	//file input 点击事件
	$(document).delegate('.editGspFileUpload', 'change', function () {
		var img = getImg($(this), 'NotRealSrc');
		img = $(img).attr('class', 'gspImages');
		$(this).prev().remove();
		$(this).before(img);
		$('#gspEditUploadBtn').attr('data-imageModify', 'false');
	});

	//新增图片 file input 中的change事件
	$(document).delegate('.editGspfileuploadInput', 'change', function () {
		var img = getImg($(this), 'NotRealSrc');


		var name = $(this).attr('name');
		var num = name.substr(name.indexOf('_') + 1, name.length);
		var newNum = Number(num) + 1;


		//隐藏当前file input
		$(this).hide();
		$(this).prev().remove();
		//获取img 添加到前面的li标签
		$(this).before(img);
		$(this).after('<a class="removeimg"><i class="fa  fa-times-circle-o"></i></a>');
		$(this).parent().after('<div style="text-align:center">其他附件</div>');

		var uploadStr = '<li style="display: inline" class="template-upfile">' +
			'<div class="fileClass">' +
			'<a class="fileinput-button-icon">+</a>' +
			'<input  name="inputFile_' + newNum + '"   class="editGspfileuploadInput" type="file"  accept="image/*">' +
			'</div>' +

			'</li>';


		//添加一个新的file input
		$(this).closest('li').after(uploadStr);
		$('#gspEditUploadBtn').attr('data-imageModify', 'false');

	});

	//客户自己编辑页面,提交GSP信息
	$(document).delegate('#submitGsp', 'click', function () {
		var currentId = $('#cId').val();
		var phoneReg = /^1[3578]\d{9}$/;
		var phoneNumberSelect = $("#phoneNumber");
		var businessLicenseSelect = $("#businessLicense");
		var businessLicenseEndDateSelect = $("#businessLicenseEndDate");
		var GMPandGSPcertificateEndDateSelect = $("#GMPandGSPcertificateEndDate");
		var GMPandGSPcertificateSelect = $("#GMPandGSPcertificate");
		var phoneNumber = phoneNumberSelect.val();
		if (ValidateNullOrEmpty(phoneNumber)) {
			artDialogAlertModal('电话号码不能为空', function () {
				phoneNumberSelect.focus();
			});
			return;
		}
		if (!phoneReg.test(phoneNumber)) {
			artDialogAlertModal('请输入正确格式的电话号码');
			return;
		}
		if (ValidateNullOrEmpty(businessLicenseSelect.val())) {
			artDialogAlertModal('请填写营业执照号', function () {
				businessLicenseSelect.focus();
			});
			return;
		}
		if (ValidateNullOrEmpty(businessLicenseEndDateSelect.val())) {
			artDialogAlertModal('请填写营业执照有效期限', function () {
				businessLicenseEndDateSelect.focus();
			});
			return;
		}
		if (ValidateNullOrEmpty(GMPandGSPcertificateEndDateSelect.val())) {
			artDialogAlertModal('请填写GMP/GSP证书有效期限', function () {
				GMPandGSPcertificateEndDateSelect.focus();
			});
			return;
		}
		if (ValidateNullOrEmpty(GMPandGSPcertificateSelect.val())) {
			artDialogAlertModal('请填写GMP/GSP证书号', function () {
				GMPandGSPcertificateSelect.val().focus();
			});
			return;
		}

		var data = {};
		data.clientId = currentId;
		data.basicInfo = {
			phoneNumber: phoneNumberSelect.val()
		};
		data.gspInfo = {
			address: $.trim($('#address').val()),
			legalReprent: $.trim($('#LegalRepresentative').val()),
			limitedBusinessRange: $.trim($('#controlRange').val()),
			limitedBusinessType: $.trim($('#gspControlType').val()),
			registeredCapital: $.trim($('#registeredCapital').val()),

			businessLicense: businessLicenseSelect.val(),
			businessLicenseEndDate: businessLicenseEndDateSelect.val(),
			orgCodeCertificate: $('#orgCodeCertificate').val(),
			orgCodeCertificateEndDate: $('#orgCodeCertificateEndDate').val(),
			taxRegcertificate: $('#taxRegcertificate').val(),
			taxRegcertificateEndDate: $('#taxRegcertificateEndDate').val(),
			GMPandGSPcertificate: GMPandGSPcertificateSelect.val(),
			GMPandGSPcertificateEndDate: GMPandGSPcertificateEndDateSelect.val(),
			medInsOccCertifacate: $('#medInsOccCertifacate').val(),
			medInsOccCertifacateEndDate: $('#medInsOccCertifacateEndDate').val(),
			InsLegalPersonCertifacate: $('#InsLegalPersonCertifacate').val(),
			InsLegalPersonCertifacateEndDate: $('#InsLegalPersonCertifacateEndDate').val(),
			proAndBusOperationCertifacate: $('#proAndBusOperationCertifacate').val(),
			proAndBusOperationCertifacateEndDate: $('#proAndBusOperationCertifacateEndDate').val(),
			foodCirclePermit: $('#foodCirclePermit').val(),
			foodCirclePermitEndDate: $('#foodCirclePermitEndDate').val(),
			medDevLicense: $('#medDevLicense').val(),
			medDevLicenseEndDate: $('#medDevLicenseEndDate').val(),
			healthCertifacate: $('#healthCertifacate').val(),
			healthCertifacateEndDate: $('#healthCertifacateEndDate').val(),
			spiritualNarcoticCard: $('#spiritualNarcoticCard').val(),
			spiritualNarcoticCardEndDate: $('#spiritualNarcoticCardEndDate').val(),
			dangerChemicalLicense: $('#dangerChemicalLicense').val(),
			dangerChemicalLicenseEndDate: $('#dangerChemicalLicenseEndDate').val(),
			maternalOccuLicense: $('#maternalOccuLicense').val(),
			maternalOccuLicenseEndDate: $('#maternalOccuLicenseEndDate').val(),
			images: []
		};

		//var canUpload = $('#gspEditUploadBtn').attr('data-imagemodify') == "true";
		//if (!canUpload) {
		//    artDialogAlertModal('附件做了修改,请上传附件之后再提交数据');
		//    return;
		//}
		var allImageUrls = {};
		var stampLink = {};
		//data.images=[];
		//获取所有用户现在上传或者修改的图片
		//var modifyOrAddImgs = [];//iframe下面的所有的修改数据集合
		//$('#picture').contents().find('img').map(function () {
		//    modifyOrAddImgs.push($(this).attr('src'));
		//});
		var imageContainer = $('.showpicture');
		imageContainer.find('img').each(function () {
			var $Urlname = $(this).parent().find('input');
			allImageUrls[$Urlname.attr('name')] = $(this).attr('src');
			//if (currentImg.attr('name') == 'realSrc') {
			//allImageUrls.push(currentImg.attr('src'));
			//    } else {
			//        var currentModifyorAddImgSrc = modifyOrAddImgs[0];
			//        allImageUrls.push(currentModifyorAddImgSrc);
			//        modifyOrAddImgs.shift();
			//    }
		});
		//
		//data.stampLink = allImageUrls[4];//之前是pop()若是用户新增了自己的其他附件,会有错
		//allImageUrls.splice(4, 1);

		data.gspInfo.stampLink = allImageUrls['stampLink'];

		delete allImageUrls['stampLink'];

		//data.gspInfo =  allImageUrls;
		data.gspInfo.images = JSON.stringify(allImageUrls);


		//获取gsp控制类型
		var batchInsertGspTypesData = [];
		//todo  获取gspType控制类型
		$('#gspTypesIds').find('.icheckbox').each(function (index, item) {
			var obj = [];
			if ($(item).attr('class').indexOf('checked') != -1) {
				var gspTypeId = $(item).find('input').attr('checkGspId');
				obj.push(currentId, gspTypeId);
				batchInsertGspTypesData.push(obj);
			}
		});
		data.gspTypes = batchInsertGspTypesData;

		//发送ajax请求
		$.ajax({
			type: 'post',
			data: data,
			url: '/customer/client/gsp/update',
			success: function (feedback) {
				if (feedback.status == 200) {
					artDialogAlertModal('恭喜,已经提交审核,请等待通知', function () {
						window.location.href = '/portal/personal/gsp';
					});

				} else {
					artDialogAlertModal(feedback.msg);
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				artDialogAlertModal('error ' + textStatus + " " + errorThrown);
			}
		});
	});


	$(document).delegate('#gspEditUploadBtn', 'click', function () {
		//若没有修改或者增加图片不让上传
		var allFileInput = $('.fileContainer').find('input[type="file"]');
		allFileInput = allFileInput.slice(0, allFileInput.length - 1);
		var canUpload = true;
		allFileInput.each(function () {
			if ($(this).val() == "") {
				canUpload = false;
			} else {
				canUpload = true;
				return false;
			}
		});
		if (!canUpload) {
			artDialogAlertModal('亲,您没有修改或者添加图片,不能上传哦');
			return;
		}

		//提交form表单;
		$(this).attr('data-imageModify', 'true');
		$('#gspEditPicForm').submit();
	});


	//客户单品价格过滤 js
	$('#customer_search_priceset').submit(function () {
		return false;
	});

	$(document).delegate('#customerPriceSearchBtn', 'click', function () {
		var clientName = $.trim($(this).prev().val());
		var goodsId = $('#clientPriceSet').attr('data-goodsid');
		window.location.href = "/customer/goods/clientprice?goodsId=" + goodsId + "&&clientName=" + clientName;
	});
	$('#customerPriceSearchInput').keypress(function (e) {
		var key = e.which;
		if (key == 13)  // the enter key code
		{
			$('#customerPriceSearchBtn').trigger('click');
			return false;
		}
	});


	//商户审核用户 按照客户名 搜索的js

	$(document).delegate('.checkedClientBtn', 'click', function () {
		var parentFormAttr = $(this).parents('form').attr('class');
		var clientName = $(this).prev().val();
		switch (parentFormAttr) {
			case 'approvedClientsForm':
				window.location.href = '/customer/client' + (clientName != '' ? '?clientName=' + clientName : '');
				break;
			case 'createdClientsForm':
				window.location.href = '/customer/client/toReview' + (clientName != '' ? '?clientName=' + clientName : '');
				break;
			case 'rejectedClientsForm':
				window.location.href = '/customer/client/reject' + (clientName != '' ? '?clientName=' + clientName : '');
				break;
			case 'updatedClientsForm':
				window.location.href = '/customer/client/updateInfoClient' + (clientName != '' ? '?clientName=' + clientName : '');
				break;
		}
	});

	//method below this function will be better than this
	$('.checkedClientSearchInput,.complainsListSearch,.searchSettlement').keypress(function (e) {
		var key = e.which;
		if (key == 13)  // the enter key code
		{
			if ($(this).attr('data-edit') == "complain") {
				$('.searchComplainBtn').trigger('click');
				return false;
			}
			else if ($(this).attr('data-edit') == 'settlement') {
				$('.searchSettlementBill').trigger('click');
				return false;
			}
			else {
				$('.checkedClientBtn').trigger('click');
				return false;
			}
		}
	});


	$('.searchInput').keypress(function (e) {
		var key = e.which;
		if (key == 13) {
			var currentBtnId = '#' + $(this).attr('data-btnid');
			$(currentBtnId).trigger('click');
			return false;
		}
	});
	$(document).delegate('#searchPriceSetGoodsBtn', 'click', function () {
	});

	$(document).delegate('.manage-client-confirm', 'click', function () {
		var self = $(this);
		var url = self.attr('data-operate-action');
		artDialogAlertModalTitle('温馨提示', '确认' + self.attr('data-original-title') + '该客户?', function () {
			window.location.href = url;
		});
	});

	$(document).delegate('.fast-commit', 'keypress', function (e) {
		var key = e.which;
		if (key == 13) {
			var self = $(this);
			var fastCommitTarget = self.attr('fast-commit-target');
			$(fastCommitTarget).click();
			return false;
		}
	});

	$(document).delegate('.searchComplainBtn', 'click', function () {
		var clientCodeOrName = $('.complainsListSearch').val();
		if ($.trim(clientCodeOrName) == '') {
			window.location.href = "/customer/complaints";
		}
		else {
			window.location.href = "/customer/complaints?clientCodeOrName=" + clientCodeOrName;
		}
	});

	//client 投诉建议 事件
	$(document).delegate('#clientComplainBtn', 'click', function () {
		var input = $(this).closest('div').prev();
		var inputVal = input.val();
		if ($.trim(inputVal) == '') {
			input.focus();
			return;
		}
		data = {content: inputVal};

		$.ajax({
			url: '/portal/personal/clientSaveComplaints',
			data: data,
			type: 'post',
			success: function (feedback) {
				if (feedback.status == 200) {
					input.val('');
					window.location.reload();
				}
			},
			beforeSend: function () {

			},
			complete: function () {

			},
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				artDialogAlertModal(textStatus + ":" + errorThrown);
			}
		})
	});

	$(document).delegate('#CustomerComplainBtn', 'click', function () {
		var input = $(this).closest('div').prev();
		var inputVal = input.val();
		var clientId = $('#medName').attr('data-id');
		if ($.trim(inputVal) == '') {
			input.focus();
			return;
		}
		data = {
			content: inputVal,
			clientId: clientId
		};
		$.ajax({
			url: '/customer/replyComplaints',
			data: data,
			type: 'post',
			success: function (feedback) {
				if (feedback.status == 200) {
					input.val('');
					window.location.reload();
				}
			},
			beforeSend: function () {

			},
			complete: function () {

			},
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				artDialogAlertModal(textStatus + ":" + errorThrown);
			}
		})

	});

	//查询按钮 settlement
	$(document).delegate('.searchSettlementBill ,.searchSettlementBillATag', 'click', function () {
		var currentOrderStatus = $('#orderStatusDiv').find('label').eq(0).attr('data-status');
		var startDate = $('#orderStartDate').val();
		var endDate = $('#orderEndDate').val();

		if (startDate && endDate && (new Date(startDate) > new Date(endDate))) {
			artDialogAlertModal('截止日期不能早于起始日期,请确认');
			return;
		}
		var fuzzyCondition = $.trim($('#settlementSearchKeywords').val());
		//return;
		window.location.href = "/customer/settlement?startDate=" + startDate + '&endDate=' + endDate + '&fuzzyCondition=' + fuzzyCondition + '&status=' + currentOrderStatus;
	});


	//结算按钮
	$(document).delegate('.closeOrderSettle', 'click', function () {
		var dataStatus = $(this).attr('data-status');
		if (dataStatus == 'CLEARED') {
			return;
		}
		var clearingDetailId = $(this).attr('data-cl');
		var self = $(this);
		artDialogPromptModal('确定结算该条数据', function () {
			$.ajax({
				type: 'post',
				url: "/customer/details/cleared",
				data: {clearingDetailId: clearingDetailId},
				success: function (feedback) {
					if (feedback.status == 200) {
						self.attr('data-status', 'CLEARED');
						self.closest('td').prev().find('span').css('color', 'green').html('已结算');
						self.find('i').css('color', 'grey');
						self.css('cursor', 'text')
					}
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					artDialogAlertModal(textStatus + ":" + errorThrown);
				}
			})
		});
	});


	$(document).delegate('.editGoodsUnit', 'change', function () {
		var self = $(this);
		var selectedVal = self.val();
		self.closest('tr').next().find('input').each(function () {
			$(this).next().html(selectedVal);

		});
	});

	$(document).delegate('#changeGoods', 'click', function () {
		var num = Number(window.location.search.replace("?num=", ""));
		if (num == 0) {
			window.location.href = 'http://' + window.location.host + '/portal?num=' + 8;
		} else {
			window.location.href = 'http://' + window.location.host + '/portal?num=' + (num + 4);
		}
	});


	//其他设置
	$(document).delegate('#submitOtherSetting', 'click', function () {
		var data = {};
		data.autoReceiveDays = $("#autoReceiveDays").find("option:selected").val();
		data.checkOutDays = Number($("#checkOutDays").text());
		data.autoCloseOrderDays = $("#autoCloseOrderDays").find("option:selected").val();

		$.ajax({
			url: '/customer/system/others',
			type: 'post',
			timeout: 5000,
			data: data,
			success: function (feedback) {
				$('#submitOtherSetting').attr('disabled', false);
				if (feedback.status == 200) {
					artDialogAlertModal('提交成功');
				}
				else {
					artDialogAlertModal(feedback.msg);
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				$('#submitOtherSetting').attr('disabled', false);
				if (textStatus == 'timeout') {
					self.siblings("span").text('网络状况不好,请稍后再试');
				} else {
					artDialogAlertModal('error ' + textStatus + " " + errorThrown);
				}
			},
			beforeSend: function () {
				$('#submitOtherSetting').attr('disabled', true);
			}
		});
	});

	$(".iradio").css('width', '18px');
	if ($('.checked').children().attr('paytype') == 'CRT') {
		$('.islook').css('display', 'none');
		$('.look').css('display', 'block');
	}

	//银联支付
	$(document).delegate('#pay', 'click', function () {
		var _this = $(this);
		var onlinepay = {
			orderId: _this.attr("orderId"),
			paymentId: _this.attr("payId"),
			dealOrder: $("#dealOrder").val(),
			dealFee: $("#dealFee").val(),
			paymentType: _this.attr('paymentType')
		};
		$.ajax({
			data: onlinepay,
			url: _this.attr('baseUrl'),
			type: 'post',
			dataType: 'json',
			cache: false,
			timeout: 5000,
			success: function (feedback) {
				if (feedback.status != '200') {
					artDialogAlert("跳转失败");
				}
			},
			error: function () {
				artDialogAlertModal('网络状况不好,请稍后再试');
			}
		})
	});
	// cod 与 授信支付
	$(document).delegate('#payment', 'click', function () {
		var onlinepay = {
			paymentId: $('.checked').children().attr("payId"),
			orderId: $(this).attr('data-type'),
			displayId: $(this).attr('data-displayid'),
			paytype: $('.checked').children().attr("paytype")
		};
		$.ajax({
			data: onlinepay,
			url: '/order/payment',
			type: 'post',
			dataType: 'json',
			cache: false,
			timeout: 5000,
			success: function (feedback) {
				if (feedback.status == '200') {
					window.location.href = '/order/detail?id=' + encodeURIComponent(feedback.data.orderId);
				} else {
					//artDialogAlert("支付失败："+feedback.data.err);
					artDialogAlertModal("支付失败：" + feedback.data.err);
				}
			},
			error: function () {
				artDialogAlertModal('网络状况不好,请稍后再试');
			}
		})
	});


	$(document).delegate('#showAllOrderInfo', 'click', function () {
		var self = $(this);
		var val = self.find('span').html();

		if (val == '查看更多') {
			self.find('span').html('隐藏信息');
			self.find('i').attr('class', 'fa fa-arrow-up');
		}
		else {
			self.find('span').html('查看更多');
			self.find('i').attr('class', 'fa fa-arrow-down');
		}

	});

});
var postCartDataDeal = null;
function getParams(data, key) {
	return typeof data[key] != 'undefined' ? data[key].toString() : typeof data.paginator != 'undefined' ? (typeof data.paginator[key] != 'undefined' ? data.paginator[key].toString() : "") : ("");
}
/* 拼接 paginator start*/
function joinPaginator(data, flag) {
	var result = {
		//cf : data.cf || data.paginator.cf || "",
		cf: getParams(data, "cf"),
		cv: getParams(data, "cv"),
		caf: getParams(data, "caf"),
		cav: getParams(data, "cav"),
		cbf: getParams(data, "cbf"),
		cbv: getParams(data, "cbv"),
		ccf: getParams(data, "ccf"),
		ccv: getParams(data, "ccv"),
		cdf: getParams(data, "cdf"),
		cdv: getParams(data, "cdv"),
		cff: getParams(data, "cff"),
		cfv: getParams(data, "cfv"),
		kaf: getParams(data, "kaf"),
		kav: getParams(data, "kav"),
		kbf: getParams(data, "kbf"),
		kbv: getParams(data, "kbv"),
		kf: getParams(data, "kf"),
		kv: getParams(data, "kv"),
		sf: getParams(data, "sf"),
		sv: getParams(data, "sv"),
		ps: getParams(data, "ps"),
		p: getParams(data, "p")
	};

	var str = (result.cf && (result.cf != "")) ? "cf=" + result.cf : "";
	str += (result.cv && (result.cv != "") && (result.cv != "%")) ? "&cv=" + result.cv : "";
	str += (result.caf && (result.caf != "")) ? "&caf=" + result.caf : "";
	str += (result.cav && (result.cav != "") && (result.cav != "%")) ? "&cav=" + result.cav : "";
	str += (result.cbf && (result.cbf != "")) ? "&cbf=" + result.cbf : "";
	str += (result.cbv && (result.cbv != "") && (result.cbv != "%")) ? "&cbv=" + result.cbv : "";
	str += (result.ccf && (result.ccf != "")) ? "&ccf=" + result.ccf : "";
	str += (result.ccv && (result.ccv != "") && (result.ccv != "%")) ? "&ccv=" + result.ccv : "";
	str += (result.cdf && (result.cdf != "")) ? "&cdf=" + result.cdf : "";
	str += (result.cdv && (result.cdv != "") && (result.cdv != "%")) ? "&cdv=" + result.cdv : "";
	str += (result.cff && (result.cff != "")) ? "&cff=" + result.cff : "";
	str += (result.cfv && (result.cfv != "") && (result.cfv != "%")) ? "&cfv=" + result.cfv : "";
	str += (result.kf && (result.kf != "")) ? "&kf=" + result.kf : "";
	str += (result.kv && (result.kv != "") && (result.kv != "%")) ? "&kv=" + result.kv : "";
	str += (result.kaf && (result.kaf != "")) ? "&kaf=" + result.kaf : "";
	str += (result.kav && (result.kav != "") && (result.kav != "%")) ? "&kav=" + result.kav : "";
	str += (result.kbf && (result.kbf != "")) ? "&kbf=" + result.kbf : "";
	str += (result.kbv && (result.kbv != "%")) ? "&kbv=" + result.kbv : "";
	str += (result.sf && (result.sf != "")) ? "&sf=" + result.sf : "";
	str += (result.sv && (result.sv != "")) ? "&sv=" + result.sv : "";
	str += (result.p && (result.p != "")) ? "&p=" + result.p : "";
	str += (result.ps && (result.ps != "")) ? "&ps=" + result.ps : "";


	//橱窗页面
	var currentHref = window.location.href;
	var isInShowCase = currentHref.indexOf('/goods/showcase?flag=chooseGoods') != -1;
	if (flag != undefined && isInShowCase) {
		str += "&ids=" + localStorage.currentShowCaseGoodsIds;
	}
	if ($('#goodsclientCatePriceHistSelect').length != 0) {
		var selectedVal = $('#goodsclientCatePriceHistSelect').val();
		data.url += '&&clientCategoryId=' + selectedVal;
	}

	if ((typeof ifOperatorLog !== 'undefined') && ifOperatorLog) {
		var $filterInput = $('.filterInput');
		var operatorName = $filterInput.val().trim() || '';
		data.url += '&on=' + operatorName;
	}


	var currentNewHref = data.url + encodeURI(str);


	//授信客户结款页面的分页 加入过滤信息
	if ($('#creditSettlePage').length != 0) {
		var data = {
			start: $("#spanGetStartYear").text().trim() + "-" + $("#spanGetStartMonth").text().trim(),
			end: $("#spanGetEndYear").text().trim() + "-" + $("#spanGetEndMonth").text().trim(),
			type: $("#spanGetType").text().trim(),
			clientName: $("#getClientName").val().trim()
		};

		var startDate = new Date(Number($("#spanGetStartYear").text().trim()), Number($("#spanGetStartMonth").text().trim()), 1);
		var endDate = new Date(Number($("#spanGetEndYear").text().trim()), Number($("#spanGetEndMonth").text().trim()), 1)

		if (startDate > endDate) {
			artDialogAlertModal('开始月份不能大于截止月份');
			return;
		}
		//var currentHref=window.location.href;

		var status;
		var statusText = $('#spanCreditType').text().trim();
		switch (statusText) {
			case '全部状态':
				status = 'ALL';
				break;
			case '已结清':
				status = 'CLEARED';
				break;
			case '未结清':
				status = 'UNCLEARED';
				break;
			case '未出账':
				status = 'PENDING'
		}


		currentNewHref = updateQueryStringParameter(currentNewHref, 'startMonth', data.start);
		currentNewHref = updateQueryStringParameter(currentNewHref, 'endMonth', data.end);
		currentNewHref = updateQueryStringParameter(currentNewHref, 'status', status);
		currentNewHref = updateQueryStringParameter(currentNewHref, 'clientName', data.clientName);

	}

	//授信客户 特定款项详情页面
	if ($('#creditClientPage').length != 0) {
		var year = $('#spanGetStartYear').text();
		var month = $('#spanGetStartMonth').text();
		var filterMonth = year + '-' + month;
		currentNewHref = updateQueryStringParameter(currentNewHref, 'filterMonth', filterMonth);
	}

	//客服中心 分页加入其他过滤信息
	if ($('#callCenterRefundVerify').length != 0) {
		var startDate = $('#StartDate').val(),
			endDate = $('#EndDate').val(),
			refundReason = $('#refundReason').attr('data-value'),
			refundType = $('#refundType').attr('data-value'),
			refundStatus = $('#refundItemStatus').attr('data-value'),
			keyWord = $.trim($(this).prev().val());
		if (new Date(startDate) > new Date(endDate)) {
			artDialogAlertModal('起始时间不能晚于结束时间');
			return;
		}
		var filterCondition = {
			startDate: startDate,
			endDate: endDate,
			refundReason: refundReason == 'ALL' ? '' : refundReason,
			refundType: refundType == 'ALL' ? '' : refundType,
			refundStatus: refundStatus == 'ALL' ? '' : refundStatus,
			keyWord: keyWord
		};
		currentNewHref = handleUrl(filterCondition, decodeURI(currentNewHref));
	}

	currentNewHref = tradeDetailPageClick(currentNewHref);

	window.location.href = currentNewHref;


}
/* 拼接 paginator end*/

function changTheLoginName(obj) {
	$("#login_id").val(obj.value);
}
function keyPress() {
	var keyCode = event.keyCode;
	event.returnValue = !!(keyCode >= 48 && keyCode <= 57);
}

function getImg(nodeList, fileName) {
	var node = nodeList[0];
	var imgURL = "";
	try {
		var file = null;
		if (node.files && node.files[0]) {
			file = node.files[0];
		} else if (node.files && node.files.item(0)) {
			file = node.files.item(0);
		}
		try {
			imgURL = file.getAsDataURL();
		} catch (e) {
			imgURL = window.URL.createObjectURL(file);
		}
	} catch (e) {
		if (node.files && node.files[0]) {
			var reader = new FileReader();
			reader.onload = function (e) {
				imgURL = e.target.result;
			};
			reader.readAsDataURL(node.files[0]);
		}
	}
	return "<img src='" + imgURL + "' name='" + fileName + "'/>";
}
function ValidateNullOrEmpty(str) {
	return !!(str == null || $.trim(str) == "");
}
/*var console = window.console || {
 log: function (msg) {
 }
 };*/


function clickOrderStatus(e, context) {
	var currentOrderStatus = $(context).attr('class');
	var fuzzyCondition = $.trim($('#settlementSearchKeywords').val());

	var startDate = $('#orderStartDate').val();
	var endDate = $('#orderEndDate').val();
	if (new Date(startDate) > new Date(endDate)) {
		artDialogAlertModal('截止日期不能早于起始日期,请确认');
		return;
	}
	window.location.href = "/customer/settlement?startDate=" + startDate + '&endDate=' + endDate + '&fuzzyCondition=' + fuzzyCondition + '&status=' + currentOrderStatus;
}


function postAddToCart(cartItem, callback) {
	$.ajax({
		data: cartItem,
		url: '/cart/add',
		type: 'post',
		dataType: 'json',
		cache: false,
		timeout: 5000,
		success: callback,
		error: function (jqXHR, textStatus, errorThrown) {
			artDialogAlertModal('error :' + textStatus + " " + errorThrown);
		}
	});
}
function hoverText($ele, text) {
	//$ele.css('position', 'relative');
	$ele.hover(function (e) {
		$text = $('<div></div>');
		$text.css({
			position: 'absolute',
			background: 'rgba(50,50,50, .8)',
			'z-index': '999',
			width: '80px',
			'padding-left': '5px',
			height: '25px',
			'font-weight': 'bold',
			color: '#fff',
			'line-height': '25px'
		});
		$text.text(text);
		$text.appendTo($(this));
		//$ele bind mousemove
		var pos = {};
		$(this).bind('mousemove', function (e) {
			pos.x = e.offsetX + 10;
			pos.y = e.offsetY - 20;
			$text.css({
				left: pos.x,
				top: pos.y
			})
		})
	}, function () {
		$text.remove()
	})
}
//check 证照预警，延时执行
var checkLicTimer = setTimeout(checkLicExpire, 500);
function checkLicExpire() {
	$.ajax({
		'type': 'post',
		'dataType': 'json',
		'url': '/expireLicense',
		'success': function (data) {
			if (data.needPop) {
				createPop(data.popMsg, null);
			}
		}
	})
}
var licensekey = {
	businessLicenseValidateDate: '营业执照',
	orgCodeValidateDate: '组织机构代码证',
	taxRegistrationLicenseNumValidateDate: '税务登记证',
	foodCirculationLicenseNumValidateDate: '食品流通许可证',
	qualityAssuranceLicenseNumValidateDate: '质量保证协议号',
	medicalApparatusLicenseNumValidateDate: '医疗器械许可证',
	healthProductsLicenseNumValidateDate: '保健品证书',
	productionAndBusinessLicenseNumValidateDate: '生产经营许可证',
	mentalanesthesiaLicenseNumValidateDate: '精神麻醉证书',
	gmpOrGspLicenseNumValidateDate: 'GSP证书',
	hazardousChemicalsLicenseNumValidateDate: '危化品许可证',
	medicalInstitutionLicenseNumValidateDate: '医疗机构执业许可证',
	maternalLicenseNumValidateDate: '母婴保健技术执业许可证',
	institutionLegalPersonCertValidateDate: '事业单位法人证书'
};
function createPop(popMsg) {
	var $popWin = $("<div class='popWin'></div>");
	var $popWinTitle = $("<h3 class='popWinTitle'>通知</h3>");
	var $popWinDesc = $("<span class='popWinDesc'>您的以下证照即将过期， <span class='text-mcolor'>若证照过期您将不能正常购买商品</span>，请尽快前去处理！</span>");
	var $popWinList = $("<ul><ul>");
	//从页脚获取客服电话
	var $contractPhones = $('.contractPhones');
	var $popWinRec;
	$contractPhones.each(function () {
		var rowText = $(this).text();
		if (rowText.indexOf('客服电话') !== -1) {
			rowText = rowText.substr(rowText.indexOf(':') + 1).replace('|', '');
			//rowText = rowText.match(/^\d+$/) ? rowText : "客服电话号码获取失败";
			$popWinRec = $("<span>请尽快联系客服提交新的证照资料，客服电话：" + rowText + "</span>");
		}
	});

	var i = 0;
	while ((typeof popMsg.datas[i]) !== 'undefined') {
		$li = $("<li></li>");
		for (var j = 0; j < 2; j++) {
			if ((typeof popMsg.datas[i + j]) == 'undefined') {
				break;
			}
			if (popMsg.datas[i + j].leftDays > 0) {
				$listLIne = $("<div class='listLine'><i>" + licensekey[popMsg.datas[i + j].licenseName] + "期限：</i><span>" +
					popMsg.datas[i + j].licenseDate + "</span>剩余<span>" + popMsg.datas[i + j].leftDays + "</span>天</div>");
			} else {
				$listLIne = $("<div class='listLine'><i>" + licensekey[popMsg.datas[i + j].licenseName] + "期限：</i><span>" +
					popMsg.datas[i + j].licenseDate + "</span><span>已过期</span></div>");
			}
			$li.append($listLIne);
			var alertType = (popMsg.datas[i + j].leftDays > 0) ? 'warn' : 'over';
			$listLIne.find('span').each(function () {
				$(this).addClass(alertType);
			})
		}
		i += 2;
		$popWinList.append($li);
	}

	$popWin.append($popWinTitle);
	$popWin.append($popWinDesc);
	$popWin.append($popWinList);
	$popWin.append($popWinRec);
	artDialogAlertModalTitleWidthBtn($popWin, '我知道了', 750, '', function () {
	});
}

function updateQueryStringParameter(uri, key, value) {
	var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
	var separator = uri.indexOf('?') !== -1 ? "&" : "?";
	if (uri.match(re)) {
		return uri.replace(re, '$1' + key + "=" + value + '$2');
	}
	else {
		return uri + separator + key + "=" + value;
	}
}

//下滚一定距离后显示浮动的navbar
$(window).scroll(function (e) {
	if ($(window).scrollTop() < 150) {
		//隐藏float navbar
		$('.sm-nav-float').hide();
		return;
	}
	$('.sm-nav-float').show();
});

function tradeDetailPageClick(url) {
	if ($('#tradeDetailPaginator').length == 0) {
		return url;
	}
	else {
		var startDate = $('#StartDate').val(),
			endDate = $('#EndDate').val(),
			bType = $.trim($('#bType').attr('data-value')),
			pType = $.trim($('#pType').attr('data-value')),
			keyWord = $('#keyWordInput').val();

		if (new Date(startDate) > new Date(endDate)) {
			artDialogAlertModal('起始时间不能晚于结束时间');
			return;
		}
		var filterCondition = {
			startDate: startDate,
			endDate: endDate,
			bType: bType == 'ALL' ? '' : bType,
			pType: pType == 'ALL' ? '' : pType,
			keyWord: keyWord
		};
		return handleUrl(filterCondition, decodeURI(url));
	}
}
//查询新消息，顶部显示
var $topnav_news = $('.topnav_news');
var operatorType = $topnav_news.attr('data-operatorType');
var clientId = $topnav_news.attr('data-clientId');
var MSG_CHECK_SEC = $topnav_news.attr('data-timeout');
var $newsAmount = $('.newsAmount');
var serverUrls = {
	'CLIENT': '/portal/personal/getMessageCounts',
	'CUSTOMER': '/customer/getUnreadMessageCounts'
};
var MSGUrl = serverUrls[operatorType];
if ($topnav_news.length > 0) {
	requstMsgAmount();
}

function requstMsgAmount() {
	$.ajax({
		url: MSGUrl,
		dataType: 'json',
		type: 'GET',
		data: {
			clientId: clientId
		},
		success: function (result) {
			if (result.status == 200) {
				updateVisual(result.data.COUNTS);
				window.msgCountTimer = setTimeout(requstMsgAmount, MSG_CHECK_SEC * 1000);
			}
		}
	})
}

function updateVisual(count) {
	$news = $newsAmount.parent('span');
	if (count === 0) {
		$news.removeClass('text-mcolor');
	} else {
		$news.hasClass('text-mcolor') || $news.addClass('text-mcolor');
	}
	count = (count > 99) ? '99+' : count;
	$newsAmount.text(count);
}
