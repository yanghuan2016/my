/**
 * 图标
 * 传入的数据是　name: name
 * name 是图标的名称
 *
 * @type {*|exports|module.exports}
 */
/*
 * icon.jsx
 *
 * 2015-05-12    wzhongbi-romens     created
 *
 */
var React = require('react');
var style = require('./icon.css');

var FontAwesome = require('react-fontawesome');

var Icon = React.createClass({

    getDefaultProps: function () {
        return {
            to: '', /* 图标跳转链接 */
            className: '', /* 图标的样式 */
            name: '', /* 图标的名字 */
            onClick: function () {
                /*　图标的点击事件 */
            },
            keyId: ''
        };
    },

    _onClick: function () {
        this.props.onClick(this.props.keyId);
    },

    render: function () {
        return (
            <a onClick={this._onClick}
               className={this.props.className}
               data-toggle={this.props.dataToggle}>
                <FontAwesome name={this.props.name}/>
            </a>
        );
    }
});

module.exports = Icon;