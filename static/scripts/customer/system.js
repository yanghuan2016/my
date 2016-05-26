$(function () {
    _.each($("a>.fa-unlock"), function (item) {
        var self = $(item);
        self.closest("li").find("span").css("color", "#999");
        self.closest("li").find("i").css("color", "#999");
    });

    //商品类别置顶
    $(document).delegate("a[name=stickTop]", "click", function () {
        var li = $(this).closest("li");
        var beforeLi = li.prev("li");
        if (beforeLi.length <= 0) {
            artDialogAlert("已经是最顶上了");
            return false;
        } else {
            var topLi = $(this).closest("ul").find("li").first();
            topLi.before(li);
            var ordSeq = [];
            _.each($(".goodscategory>.rootCategory"), function (li) {
                var index = $(".goodscategory>.rootCategory").index($(li));
                var data = [];
                data.push(Number(index) + 1);
                data.push(Number($(li).attr("erpid")));
                ordSeq.push(data)
            });
            updateProductCategory(ordSeq, "updateDisplayOrder", function (feedback) {
                if (feedback.status != 200) {
                    artDialogAlertModal(feedback.msg);
                } else {
                    var d = dialog({
                        content: '置顶成功',
                        align: 'top left',
                        quickClose: false
                    });
                    d.show();
                    setTimeout(function () {
                        d.close().remove();
                    }, 1000);
                }
            });
        }
    });
    //添加商品跟类别弹出框
    $(document).delegate(".addrootcategory", "click", function () {
        var changeDiv = $("li[name='addrootcategory']");
        var status = changeDiv.css("display");
        if (status == "none") {
            changeDiv.css("display", "block");
            changeDiv.find("input").focus();
        } else if (status == "block") {
            changeDiv.css("display", "none");
        }
    });
    //增加商品跟类别
    $(document).delegate("a[name=addProductCategory]", "click", function () {
        var self = $(this);
        var newcategory = self.closest(".categoryDiv").find("input").val().trim();
        var parent_level = Number(self.closest("ul").closest("li").attr("level")) || 0;
        if (newcategory == "") {
            self.closest(".categoryDiv").find("input").focus();
            return;
        }
        var closestParentName = _.map(self.parents("ul"), function (results) {
            return $(results).attr("parentname") ? $(results).attr("parentname").trim() : "";
        });
        if (closestParentName.indexOf(newcategory) > -1) {
            artDialogAlertModal("不能与上级分类的名称相同，请修改", function () {
                self.closest(".categoryDiv").find("input").focus();
            });
            return;
        }
        var silbings = _.map(self.closest("li").siblings("li"), function (results) {
            return $(results).attr("name") ? $(results).attr("name").trim() : "";
        });
        if (silbings.indexOf(newcategory) > -1) {
            artDialogAlertModal("不能与同级分类的名称相同，请修改", function () {
                self.closest(".categoryDiv").find("input").focus();
            });
            return;
        }
        var parent_name = "";
        for (var i = self.parents("ul").length - 1; i > -1; i--) {
            if ($(self.parents("ul")[i]).attr("parentname") == "") {
                continue;
            }
            parent_name += $(self.parents("ul")[i]).attr("parentname") + "{" + $(self.parents("ul")[i]).attr("parentid");
            if ((i - 1) >= 0 && $(self.parents("ul")[i - 1]).attr("parentname") != "") {
                parent_name += ">";
            }
        }
        var parent_Id = self.closest("ul").attr("parentId") || 0;
        var newLi = $(".template").clone();
        newLi.attr("name", newcategory);
        newLi.find(".categoryDiv").eq(0).find("span").text(newcategory);
        newLi.find(".categoryDiv").eq(0).find("span").closest("a").attr("name", "productcategory" + newcategory);
        newLi.find("ul").attr("id", "productcategory" + newcategory);
        newLi.find("ul").attr("parentname", newcategory);
        newLi.removeClass("template");
        if (parent_level == 0) {
            newLi.addClass("rootCategory");
            newLi.attr("level", "1");
        } else if (parent_level == 1) {
            if (self.closest("ul").closest("li").find(".categoryDiv").eq(0).find("span").siblings("i").length <= 0) {
                self.closest("ul").closest("li").find(".categoryDiv").eq(0).find("span").before("<i class='fa fa-minus-square-o'></i>&nbsp;&nbsp;");
            }
            newLi.find("a[name=stickTop]").remove();
            newLi.addClass("secondChildren");
            newLi.attr("level", "2");
        } else if (parent_level == 2) {
            if (self.closest("ul").closest("li").find(".categoryDiv").eq(0).find("span").siblings("i").length <= 0) {
                self.closest("ul").closest("li").find(".categoryDiv").eq(0).find("span").before("<i class='fa fa-minus-square-o'></i>&nbsp;&nbsp;");
            }
            newLi.find("a[name=addproductcategory]").remove();
            newLi.find("a[name=stickTop]").remove();
            newLi.addClass("ThreeChildren");
            newLi.attr("level", "3");
        }
        self.closest("li").before(newLi);
        newLi.css("display", "block");
        self.closest("li").css("display", "none");
        var data = {
            name: newcategory,
            fullname: (parent_name == "") ? newcategory : (parent_name + ">" + newcategory),
            parentErpId: parent_Id,
            level: parent_level + 1
        };
        updateProductCategory(data, "update", function (feedback) {
            if (feedback.status != 200) {
                artDialogAlertModal(feedback.msg);
                return;
            }
            self.closest(".categoryDiv").find("input").val("");
            newLi.find("ul").attr("parentid", feedback.data);
            newLi.attr("erpid", feedback.data);
            var ordSeq = [];
            _.each($(".goodscategory>.rootCategory"), function (li) {
                var index = $(".goodscategory>.rootCategory").index($(li));
                var data = [];
                data.push(Number(index) + 1);
                data.push(Number($(li).attr("erpid")));
                ordSeq.push(data)
            });
            updateProductCategory(ordSeq, "updateDisplayOrder", function (feedback) {
                if (feedback.status != 200) {
                    artDialogAlertModal(feedback.msg);
                } else {
                }
            });
        });
    });

    //展开分类
    $(document).delegate("a[name^=productcategory]", 'click', function () {
        var self = $(this);
        var ul = self.closest(".categoryDiv").siblings("ul");
        var status = ul.css("display");
        if (status == "none") {
            ul.css("display", "block");
            self.find("i").removeClass("fa-plus-square-o");
            self.find("i").addClass("fa-minus-square-o");
            self.css("color", "#237935");
        } else {
            ul.css("display", "none");
            self.find("i").removeClass("fa-minus-square-o");
            self.find("i").addClass("fa-plus-square-o");
            self.css("color", "#000");
        }
        $(".addproductcategory").css("display", "none");
    });

    $(document).delegate("a[name=addproductcategory]", 'click', function () {
        var self = $(this);
        var categoryDiv = self.closest("div").siblings("div");
        categoryDiv.find("i").removeClass("fa-plus-square-o");
        categoryDiv.find("i").addClass("fa-minus-square-o");
        categoryDiv.find("a").css("color", "#237935");
        var ul = self.closest(".categoryDiv").siblings("ul");
        ul.css("display", "block");
        ul.children(".addproductcategory").css("display", "block");
        ul.children(".addproductcategory").find("input").focus();
    });
    $(document).delegate("a[name=cancelProductCategory]", "click", function () {
        var self = $(this);
        self.closest(".categoryDiv").find("input").val("");
        var selfLi = self.closest("li");
        selfLi.css("display", "none");
    });

    $(document).delegate("a[name=updateproductcategory]", 'click', function () {
        var self = $(this);
        var current = $.trim(self.closest("div").siblings("div").find("span").text());
        var changeDiv = self.closest(".categoryDiv").siblings(".categoryDiv");
        changeDiv.find("input").val(current);
        changeDiv.css("display", "block");
        changeDiv.find("input").focus();
    });
    $(document).delegate("a[name=cancelCategory]", "click", function () {
        var self = $(this);
        var changeDiv = self.closest(".categoryDiv");
        changeDiv.find("input").val("");
        changeDiv.css("display", "none");
    });

    $(document).delegate("a[name=updateProductCategory]", "click", function () {
        var self = $(this);
        var newcategory = self.closest(".categoryDiv").find("input").val().trim();
        if (newcategory == "") {
            self.closest(".categoryDiv").find("input").focus();
            return;
        }
        var closestParentName = _.map(self.parents("ul"), function (results) {
            return $(results).attr("parentname") ? $(results).attr("parentname").trim() : "";
        });
        if (closestParentName.indexOf(newcategory) > -1) {
            artDialogAlertModal("不能与上级分类的名称相同，请修改", function () {
                self.closest(".categoryDiv").find("input").focus();
            });
            return;
        }
        var silbings = _.map(self.closest("li").siblings("li"), function (results) {
            return $(results).attr("name") ? $(results).attr("name").trim() : "";
        });
        if (silbings.indexOf(newcategory) > -1) {
            artDialogAlertModal("不能与同级分类的名称相同，请修改", function () {
                self.closest(".categoryDiv").find("input").focus();
            });
            return;
        }
        var childrens = _.map(self.closest(".categoryDiv").siblings("ul").find("li"), function (results) {
            return $(results).attr("name") ? $(results).attr("name").trim() : "";
        });
        if (childrens.indexOf(newcategory) > -1) {
            artDialogAlertModal("不能与下级分类的名称相同，请修改", function () {
                self.closest(".categoryDiv").find("input").focus();
            });
            return;
        }
        var parent_name = "";
        for (var i = self.parents("ul").length - 1; i > -1; i--) {
            if ($(self.parents("ul")[i]).attr("parentname") == "") {
                continue;
            }
            parent_name += $(self.parents("ul")[i]).attr("parentname") + "{" + $(self.parents("ul")[i]).attr("parentid");
            if ((i - 1) >= 0 && $(self.parents("ul")[i - 1]).attr("parentname") != "") {
                parent_name += ">";
            }
        }
        var parent_Id = self.closest("ul").attr("parentId") || 0;
        var erpid = self.closest("li").attr("erpid");
        self.closest("li").find(".categoryDiv").eq(0).find("span").text(newcategory);
        self.closest(".categoryDiv").css("display", "none");
        var data = {
            erpId: Number(erpid),
            name: newcategory,
            fullname: (parent_name == "") ? newcategory : (parent_name + ">" + newcategory),
            parentErpId: Number(parent_Id),
            level: Number(self.closest("li").attr("level"))
        };
        updateProductCategory(data, "update", function (feedback) {
            self.closest(".categoryDiv").find("input").val("");
            if (feedback.status != 200) {
                artDialogAlertModal(feedback.msg);
            }
        });
    });

    $(document).delegate("a[name=deleteproductcategory]", "click", function () {
        var data = {};
        var self = $(this);
        var tip = "";
        if (self.find("i").hasClass("fa-lock")) {
            tip = "确认禁用该类别？";
            data.isDeleted = 1;
        } else {
            tip = "确认禁用该类别？";
            data.isDeleted = 0;
        }
        data.erpId = self.closest("li").attr("erpid");
        artDialogAlertModalTitle("温馨提示", tip, function () {
            updateProductCategory(data, "delete", function (feedback) {
                if (feedback.status != 200) {
                    artDialogAlertModal(feedback.msg);
                } else {
                    if (self.find("i").hasClass("fa-lock")) {
                        self.find("i").removeClass("fa-lock");
                        self.find("i").addClass("fa-unlock");
                        self.closest("li").find("span").css("color", "#999");
                        self.closest("li").find("i").css("color", "#999");
                    } else {
                        self.find("i").removeClass("fa-unlock");
                        self.find("i").addClass("fa-lock");
                        self.closest("li").find(".categoryContent").find("span").css("color", "#666");
                        self.closest("li").find(".categoryContent").find("i").css("color", "#666");
                        self.closest("li").find(".categoryAction").find("span").css("color", "#237935");
                        self.closest("li").find(".categoryAction").find("i").css("color", "#237935");
                    }
                }
            });
        });
    });

    //新增客户类
    $(document).delegate(".addClientCategory", "click", function () {
        var categoryName = $("#categoryName").val();
        var data = {};
        if (categoryName == "") {
            artDialogAlertModal("请输入新增的客户类别名称");
            return;
        }
        data.categoryName = categoryName;
        $.ajax({
            data: data,
            url: "/customer/system/customer/add",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == "200") {
                    $("#categoryName").val("");
                    $(window.parent.document).find('.fadeDiv').css('display', 'none');
                    $(window.parent.document).find("#selectGoods").css('display', 'none');
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.reload();
                        //$(window.parent.document).find("#editSubCategory").css('display', 'none');
                    });
                } else {
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR) {
                artDialogAlertModal('error ' + jqXHR.readyState + " " + jqXHR.responseText);
            }
        });
    });

    //删除客户类
    $(document).delegate(".removeClientCategory", "click", function () {
        var self = $(this);
        var categoryId = self.attr("data-category-id");
        artDialogPromptModal('确认要删除该类别吗？', function () {
            var data = {};
            if (categoryId == "") {
                artDialogAlertModal("失败，请刷新一下面看看");
                return;
            }
            data.categoryId = categoryId;
            $.ajax({
                data: data,
                url: "/customer/system/customer/remove",
                type: 'post',
                dataType: 'json',
                cache: false,
                timeout: 5000,
                success: function (feedback) {
                    if (feedback.status == "200") {
                        self.closest("tr").remove();
                    }else{
                        artDialogAlertModal(feedback.msg);
                    }
                },
                error: function (jqXHR) {
                    artDialogAlertModal('error ' + jqXHR.readyState + " " + jqXHR.responseText);
                }
            });
        });
    });
    //编辑客户类
    $(document).delegate('.editSub', 'click', function () {
        var self = $(this);
        var ClientCategoryName = $.trim(self.parents('td').prev().html());
        var ClientCategoryId = self.attr('data-category-id');
        $('#editSubCategory').find('input').val(ClientCategoryName).attr('data-category-id', ClientCategoryId);
        displayDialog("editSubCategory");
    });

    $(document).delegate(".updateClientCategory", "click", function () {
        var self = $(this);
        var data = {};
        var elemInput = self.parents('table').find('input');
        var categoryId = elemInput.attr('data-category-id');
        var name = elemInput.val();

        if (categoryId == "" || name == "") {
            artDialogAlertModal("客户类名字不能为空！");
            return;
        }

        data.categoryName = name;
        data.categoryId = categoryId;
        $.ajax({
            data: data,
            url: "/customer/system/customer/edit",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == "200") {
                    $("#categoryName").val("");
                    $(window.parent.document).find('.fadeDiv').css('display', 'none');
                    $(window.parent.document).find("#editSubCategory").css('display', 'none');
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.reload();
                    });
                } else {
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR) {
                artDialogAlertModal('error ' + jqXHR.readyState + " " + jqXHR.responseText);
            }
        });
    });

    function updateProductCategory(result, type, callback) {
        $.ajax({
            data: {data: result},
            url: "/customer/system/product/" + type,
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                callback(feedback);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                artDialogAlertModal('error ' + textStatus + " " + errorThrown);
            }
        });
    }

    //add  Inventory Plan
    $(document).delegate(".addInventoryPlan", "click", function () {
        var data = {};
        var planName = $("#planName").val();
        data.planName = planName;
        var num0 = $("#numLv0").val();
        var text0 = $("#textLv0").val();
        var keys = [num0];
        var vals = [text0];
        $("*[id^=numLv]").each(function () {
            var index = (this.id).split("Lv")[1];
            if (index > 0 && index != "X") {
                keys.push($("#numLv" + index).val());
            }
        });
        $("*[id^=textLv]").each(function () {
            var index = (this.id).split("Lv")[1];
            if (index > 0 && index != "X") {
                vals.push($("#textLv" + index).val());
            }
        });
        var numX = "X";
        var textX = $("#textLvX").val();
        keys.push(numX);
        vals.push(textX);
        if (planName == "" || text0 == "" || textX == "") {
            artDialogAlertModal('方案名，数量低于0与其他数量显示内容不能为空');
            return;
        }
        data.inventoryKeys = keys;
        data.inventoryVals = vals;
        $.ajax({
            data: data,
            url: "/customer/system/inventory/add",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == "200") {
                    artDialogAlertModal(feedback.msg, function () {

                        $(window.parent.document).find('.fadeDiv').css('display', 'none');
                        $(window.parent.document).find("#selectGoods").css('display', 'none');
                        $(window.parent.document).find("#addSubCategory").css('display', 'none');
                        $(window.parent.document).find("#editSubCategory").css('display', 'none');
                        window.parent.location.reload();
                    })
                } else {
                    artDialogAlertModal(feedback.msg, function () {
                        $(window.parent.document).find('.fadeDiv').css('display', 'none');
                        $(window.parent.document).find("#selectGoods").css('display', 'none');
                        $(window.parent.document).find("#addSubCategory").css('display', 'none');
                        $(window.parent.document).find("#editSubCategory").css('display', 'none');
                    })
                }
            },
            error: function (jqXHR) {
                artDialogAlertModal('error ' + jqXHR.readyState + " " + jqXHR.responseText);
            }
        });

    });
    $(document).delegate(".editPLan", "click", function () {
        var id = $(this).attr("planId");
        var isSystemInventoryPlan = $(this).attr('data-issystem') == 'true';
        $.ajax({
            url: "/customer/system/inventory/edit?id=" + id,
            type: 'get',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == "200") {
                    var data = feedback.data;
                    //此处返回成功　需要填入数据
                    $(window.parent.document).find("#editSubCategory").contents().find("#planName").val(data[0].name);
                    var insertStr = "";
                    if (isSystemInventoryPlan) {
                        $(window.parent.document).find("#editSubCategory").contents().find("#planName").css({
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: 15
                        }).attr('readonly', 'true');
                        insertStr += " 其他数量显示实际库存";
                    }
                    $(window.parent.document).find("#editSubCategory").contents().find("#planName").attr("planId", id);
                    $(window.parent.document).find("#editSubCategory").contents().find("#planName").attr("length", data.length);
                    var str = "";
                    for (var i = 0; i < data.length - 1; i++) {
                        str += "<label>当数量低于</label><input type='text'" +
                            " id='numLv" + (i) + "'class='input-sm' style='height: 30px' ";
                        if (i == 0) {
                            str += "disabled ";
                        }
                        str +=
                            " value=" + data[i].threshold + ">" +
                            "<label>时显示</label>" +
                            "<input type='text' id='textLv" + i + "' class='input-sm' detailsId=" + data[i].id + " style='height: 30px' " +
                            "threshold=" + data[i].threshold + " value=" + data[i].content + "><label>" + insertStr + "</label><br/><label>"
                    }
                    if (!isSystemInventoryPlan) {
                        str += "<label>其他数量时显示</label><input type='text' id='textLvX' class='input-sm' style='height: 30px' detailsId=" + data[data.length - 1].id + " threshold=" + data[data.length - 1].threshold + " value=" + data[data.length - 1].content + ">";
                    }
                    $(window.parent.document).find("#editSubCategory").contents().find("#planForm").find("label").remove();
                    $(window.parent.document).find("#editSubCategory").contents().find("#planForm").find("input").remove();
                    $(window.parent.document).find("#editSubCategory").contents().find("#planForm").find("br").remove();
                    $(window.parent.document).find("#editSubCategory").contents().find("#planForm").append(str);

                } else {
                    artDialogAlertModal(feedback.msg);
                }
            },
            error: function (jqXHR) {
                artDialogAlertModal('error ' + jqXHR.readyState + " " + jqXHR.responseText);
            }
        });
    });
    $(document).delegate(".editInventoryPlan", "click", function () {
        var data = {};
        var planNameSelect = $("#planName");
        var planName = planNameSelect.val();
        var planId = planNameSelect.attr("planid");
        var length = planNameSelect.attr("length");
        data.planName = planName;
        data.planId = planId;
        data.items = [];
        for (var i = 0; i < length - 1; i++) {
            var item = [];
            var element = $("#textLv" + i);
            item.push(element.attr("detailsId"));
            item.push(element.attr("threshold"));
            item.push(element.val());
            data.items.push(item)
        }
        var textLvX = $("#textLvX");
        var itemX = [textLvX.attr("detailsId"), textLvX.attr("threshold"), textLvX.val()];
        data.items.push(itemX);

        if (planName == "" || $("#textLv0").val() == "" || textLvX.val() == "") {
            artDialogAlertModal('方案名，数量低于0与其他数量显示内容不能为空');
            return;
        }
        $.ajax({
            data: data,
            url: "/customer/system/inventory/editSubCate",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == "200") {
                    artDialogAlertModal(feedback.msg, function () {

                        $(window.parent.document).find('.fadeDiv').css('display', 'none');
                        $(window.parent.document).find("#selectGoods").css('display', 'none');
                        $(window.parent.document).find("#addSubCategory").css('display', 'none');
                        $(window.parent.document).find("#editSubCategory").css('display', 'none');
                        window.parent.location.reload();
                    })
                } else {
                    artDialogAlertModal(feedback.msg, function () {
                        $(window.parent.document).find('.fadeDiv').css('display', 'none');
                        $(window.parent.document).find("#selectGoods").css('display', 'none');
                        $(window.parent.document).find("#addSubCategory").css('display', 'none');
                        $(window.parent.document).find("#editSubCategory").css('display', 'none');
                    })
                }
            },
            error: function (jqXHR) {
                artDialogAlertModal('error ' + jqXHR.readyState + " " + jqXHR.responseText);
            }
        });

    });
    $(document).delegate(".removePlan", "click", function () {
        var id = $(this).attr("planId");
        var data = {};
        data.id = id;
        $.ajax({
            data: data,
            url: "/customer/system/inventory/remove",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == "200") {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.reload();
                    })

                } else {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.reload();
                    })
                }
            },
            error: function (jqXHR) {
                artDialogAlertModal('error ' + jqXHR.readyState + " " + jqXHR.responseText);
            }
        });
    });
    $(document).delegate(".setPlanDefault", "click", function () {
        var id = $(this).attr("planId");
        var status = $(this).attr("status");
        if (status == "0") {
            return;
        }
        var data = {};
        data.id = id;
        data.status = status;
        $.ajax({
            data: data,
            url: "/customer/system/inventory/setDefault",
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (feedback) {
                if (feedback.status == "200") {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.reload();
                    })
                } else {
                    artDialogAlertModal(feedback.msg, function () {
                        window.location.reload();
                    })
                }
            },
            error: function (jqXHR) {
                artDialogAlertModal('error ' + jqXHR.readyState + " " + jqXHR.responseText);
            }
        });
    });

    //用户添加自定义库存阀值

    $(document).delegate('.deleteCustomerInventoryPlan', 'click', function () {
        var self = $(this);
        self.parents('div').eq(0).remove();
    });
});