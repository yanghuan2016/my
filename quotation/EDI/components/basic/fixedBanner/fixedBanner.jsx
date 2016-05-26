/**
 * 所用详情页面底部操作栏始终在屏幕底部
 * @type {*|exports|module.exports}
 */

/*
 * fixedBanner.jsx
 *
 * 2015-04-15    wzhongbi-romens     created
 *
 */

var React = require('react');
var FontAwesome = require('react-fontawesome');

var Button = require('antd').Button;

var style = require('./fixedBanner.css');

var FixedBanner = React.createClass({

    getDefaultProps: function () {
        return {
            buttons: [
                {
                    name: "修改报价",
                    type: "primary",
                    onClick: function () {
                        alert("父亲传递的函数")
                    }
                },
                {
                    name: "返回",
                    type: "ghost",
                    onClick: function () {
                        alert("父亲传递的函数")
                    }
                }
            ]
        }
    },

    _onClick: function () {
        this.props.onClick();
    },

    render: function () {
        var index = -1;
        var list = this.props.buttons.map(function (item) {
            index++;
            return <Button type={item.type}
                           onClick={item.onClick}
                           size="large"
                           key={index}
                           className={style.button}>{item.name}</Button>
        });

        return (
            <div className={style.banner}>
                {list}
            </div>
        );
    }
});

module.exports = FixedBanner;