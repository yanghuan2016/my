/**
 * 正在加载中.....
 * 需要传入正在加载中的提示信息 tips
 * @type {*|exports|module.exports}
 */

/*
 * spinBanner.jsx
 *
 * 2015-04-15    wzhongbi-romens     created
 *
 */

var React = require('react');

var Button = require('antd').Button;

var style = require('./spinBanner.css');

var SpinBanner = React.createClass({

    getDefaultProps: function () {
        return {
            tips: "系统正在导入数据,此过程耗时较长,建议您一个小时后重新登录查看"
        }
    },

    render: function () {
        return (
            <div className={style.banner}>
                <i className="fa fa-spinner fa-pulse fa-3x"></i>
                <span>{this.props.tips}</span>
            </div>
        );
    }
});

module.exports = SpinBanner;