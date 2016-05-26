var React=require('react');
var style=require('./Login.css');
var LoginBox=require('js/components/element/LoginBox/component');
var logger=require('util/logService');


var Login=React.createClass({
        getInitialState: function() {
            logger.enter();
            return {
                leftFirstSpanProps:{
                    className:style.spanLeft + ' ' + style.marginUpMore,
                    content:'Romens'
                },
                leftSecondSpanProps:{
                    className:style.spanLeft,
                    content:'雨人'
                }
            }
        },
        render:function(){
            logger.enter();
            return (
                <div className={style.loginBody}>
                    <LoginBox className={style.thirdDivLogin} />
                </div>
            );
        }
});
module.exports=Login;