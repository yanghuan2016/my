
$(function () {

    $(document).delegate(".show_All", "click", function () {
        $(".show_All").addClass("hide");
        $(".hide_All").removeClass("hide");
        $('.address-list').css('display', 'block');
    });

    $(document).delegate(".hide_All", "click", function () {
        $(".show_All").removeClass("hide");
        $(".hide_All").addClass("hide");
        $('.address-list').css('display', 'none');
    });
});

