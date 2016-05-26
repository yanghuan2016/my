/**
 * logo
 * added by hzh 2016-05-12
 */
var React = require('react');
var style = require('./logo.css');
var logoImg = require('./logo-mini.png');

var Logo = React.createClass({
    render: function(){
        return (
            <div className={style.box}>
                <img src={logoImg} alt=""/>
            </div>
        )
    }
});
module.exports = Logo;