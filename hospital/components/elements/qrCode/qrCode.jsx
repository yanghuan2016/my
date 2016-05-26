/**
 * wechat二维码
 * added by dzw@romens 2016-05-12
 */
var React = require('react');
var style = require('./qrCode.css');
var code = require('./code.jpg');

var qrCode = React.createClass({
    render: function(){
        return (
            <div className={style.box}>
                <div className={style.title}>长按下方图片关注医药直通车，获取用药提醒。</div>
                <div className={style.img}><img src={code}/></div>
            </div>
        )
    }
});
module.exports = qrCode;