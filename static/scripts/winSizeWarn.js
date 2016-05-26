/*
 * 检测屏幕宽度，弹出提示框
 */
$(function(){
    var isInIframe = (self.frameElement) && (self.frameElement.tagName == "IFRAME");
    if (isInIframe) {
        return;
    }

    var LIMIT_WIDTH = 1200;
    var LIMIT_HEIGHT = 800;
    var WARN_TEXT = '为达到最佳显示效果，请将浏览器宽度设定在' + LIMIT_WIDTH + 'px以上';

    /**
     *  改变窗口尺寸触发提示
     */
    $(window).resize(detectWinSize);

    detectWinSize();
    function detectWinSize(){
        //检测窗口大小
        var winSize = {
            width: $(window).width(),
            height: $(window).height()
        };
        var shouldWarn = (winSize.width < LIMIT_WIDTH);
        shouldWarn ? pushWarn(WARN_TEXT) : closeWarn();
    }


    function pushWarn(WARN_TEXT){
        if( $('div.warnBottom').length === 0 ){
            var $warn = $('<div class="warnBottom"></div>');
            $warn.text(WARN_TEXT);
            $warn.css({
                display: 'none',
                position: 'fixed',
                width: '100%',
                height: '60px',
                bottom: 0,
                left: 0,
                background: 'rgba(30,30,30, .7)',
                color: '#fff',
                'z-index': 999,
                'text-align': 'center',
                'line-height': '60px'
            });
            var $closeBt = $('<span><i class="fa fa-times"></i> 关闭提示 </span>');
            $closeBt.css({
                position: 'absolute',
                right: '20px',
                cursor:'pointer'
            })
            $warn.append($closeBt);
            $warn.appendTo($('body'));
            $closeBt.click(closeWarn);
        }
        $warn.fadeIn();
    }

    function closeWarn(){
        $('.warnBottom').slideUp(function(){
            $(this).remove();
        });
    }
})