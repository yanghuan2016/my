$(function () {
    //选择图片　
    $(document).delegate(".fileupload", "change", function () {
        var fileName = "file_" + (Number($(this).attr("name").split("_")[1]) + 1);
        var img = getImg($(this), $(this).attr("name"));
        var selfFileLi = $(this).closest("li");
        var fileImg = $(".template-img").clone();
        var newFileLi = $(".template-upfile").clone();
        fileImg.find(".removeimg").before(img);
        newFileLi.find("input").attr("name", fileName);
        fileImg.removeClass("template-img");
        newFileLi.attr("class", "template-file");
        selfFileLi.attr("class", "template-file");
        newFileLi.css("display", "inline-block");
        fileImg.css("display", "inline-block");
        selfFileLi.after(fileImg);
        fileImg.after(newFileLi);
        selfFileLi.css("display", "none");
        $("iframe[name=picture]").contents().find("span").text("");
        $(this).closest("li").siblings("button").attr("data-update", "true");
    });
    //删除图片
    $(document).delegate(".removeimg", "click", function () {
        var self = $(this);
        if(self.closest("li").attr("class") != "oldImg"){
            self.closest("li").siblings("button").attr("data-update", "true");
        }
        var gspEditUploadBtn = $("#gspEditUploadBtn");
        var fileName = self.siblings("img").attr("name");
        var removeLi = $("input[name=" + fileName + "]").closest("li");
        var selfLi = self.closest("li");
        removeLi.remove();
        selfLi.remove();
        $("iframe[name=picture]").contents().find("span").text("");
        if (gspEditUploadBtn.length > 0) {
            var hasUpload = $('#picture').contents().find('span').length == 0;
            if (hasUpload) {
                if ($('#gspEditPicForm').find('.removeimg').length != 0) {
                    //不能只判断有没有,还应该判断有没有上传文件
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
                    //不能上传  file input no value
                    if (!canUpload) {
                        //提交按钮就可以提交数据,因为没有要提交的内容
                        gspEditUploadBtn.attr('data-imagemodify', 'true');
                    }
                    else {
                        //提交按钮不能提交数据,因为有内容没有提交
                        gspEditUploadBtn.attr('data-imagemodify', 'false');
                    }
                }
                else {
                    gspEditUploadBtn.attr('data-imagemodify', 'true');
                }
                return;
            }
            gspEditUploadBtn.attr('data-imagemodify', 'false');
        }
    });
    $(document).delegate("#submitPicture", "click", function (event) {
        var self = $(this);
        var templateFile = self.siblings(".template-file");
        if(self.attr("data-update") == "true"){
            var flag = false;
            _.each(templateFile, function (item) {
                var name = $(item).find("input").attr("name");
                var img = self.siblings("li").find("img[name=" + name + "]");
                if (img.length > 0) {
                    flag = true;
                    return false;
                }
            });
            if (flag) {
                $(this).attr("data-update", "false");
            } else {
                artDialogAlertModal("图片没有更改");
            }
        }else if(self.attr("data-update") == "false"){
            event.preventDefault();
        }
    });
});

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
//得到所有上传图片路径
function getUploadImg(){
    var iframe = $("iframe[name=picture]");
    var temp = [];
    var oldImg = $(".fileContainer>ul").find("li[class=oldImg]");
    if(oldImg.length > 0){
        _.each(oldImg, function (item) {
            if($(item).find("img").attr("src")){
                temp.push($(item).find("img").attr("src"));
            }
        });
    }
    _.each(iframe.contents().find("img"), function (item) {
        temp.push($(item).attr("src"));
    });
    return temp.toString();
}