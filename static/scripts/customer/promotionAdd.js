(function () {

    var app = function () {

        this.CIRCLE_DOT = "fa-dot-circle-o";
        this.CIRCLE_NULL = "fa-circle-o";
        this.SQUARE_CHECK = "fa-check-square-o";
        this.SQUARE_NULL = "fa-square-o";
        this.CCR = "cashCoupenRule";
        this.DCR = "discountCoupenRule";
        this.G1 = "radioGroup1";

        //切换FontAwesome图标
        //node 切换图标的结点
        //classOld 待替换的图标（如：fa-square-o）
        //classNew 替换后的图标（如：fa-check-square-o）
        this.ChangeFontAwesomeStyle = function (node, classOld, classNew) {
            _.each(node, function (item) {
                $(item).removeClass(classOld).addClass(classNew);
            })
        }

        //生成公共的参数
        this.CreateArgs = function (e) {
            var $targetMe = $(e.currentTarget);
            var group = $targetMe.data("group") || null;
            var Args = {
                currentTg: $targetMe,
                myClassName: $targetMe.attr("class"),
                group: group,
                groupNd: $("[data-group=" + group + "]") || null
            }
            return Args;
        }

        var me = this;

        //手动切换radioBox的样式
        $(document).delegate(".radioChange", "click", function (e) {
            var args = me.CreateArgs(e);
            if (args.currentTg.hasClass(me.CIRCLE_NULL)) {
                me.ChangeFontAwesomeStyle(args.groupNd, me.CIRCLE_DOT, me.CIRCLE_NULL);
                me.ChangeFontAwesomeStyle(args.currentTg, me.CIRCLE_NULL, me.CIRCLE_DOT);
                if (args.group === me.G1) {
                    var templateId = args.currentTg.hasClass("cushCoupen") ?
                        me.CCR : me.DCR;
                    $("#coupenRules").html(_.template($("#" + templateId).html()));
                    $(".deleteLine").remove();
                }
            }
        }).delegate(".checkBoxChange", "click", function (e) {//手动切换checkBox的样式
            var args = me.CreateArgs(e);
            var whetherChosed = !args.currentTg.hasClass(me.SQUARE_NULL);
            me.ChangeFontAwesomeStyle(args.currentTg,
                whetherChosed ? me.SQUARE_CHECK : me.SQUARE_NULL,
                whetherChosed ? me.SQUARE_NULL : me.SQUARE_CHECK)
        }).delegate(".checkBoxGroupChange", "click", function (e) {//分组切换checkBox的样式
            var args = me.CreateArgs(e);
            var whetherChosed = !args.currentTg.hasClass(me.SQUARE_NULL);
            me.ChangeFontAwesomeStyle(args.groupNd,
                whetherChosed ? me.SQUARE_CHECK : me.SQUARE_NULL,
                whetherChosed ? me.SQUARE_NULL : me.SQUARE_CHECK)
        }).delegate("#addNewRule", "click", function () {//添加促销规则事件
            var item = $("[data-group=" + me.G1 + "]." + me.CIRCLE_DOT);
            var templateId = item.hasClass("cushCoupen") ? me.CCR : me.DCR;
            var data = false;
            $("#coupenRules").append(_.template($("#" + templateId).html(), data))
        }).delegate(".deleteLine", "click", function (e) {
            $(e.currentTarget).closest("ul").remove();
        })

        $('.date').datetimepicker({
            timepicker: false,
            format: 'Y-m-d'
        });
    }

    return new app();
})()