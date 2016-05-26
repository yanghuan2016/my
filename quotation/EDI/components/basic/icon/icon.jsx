/**
 * 单个图标
 * 需要父组件传递相应的图标名字 name 以及点击事件 onClick
 * @type {*|exports|module.exports}
 */

/*
 * icon.jsx
 *
 * 2015-04-15    wzhongbi-romens     created
 *
 */

var React = require('react');
var FontAwesome = require('react-fontawesome');

var style = require('./icon.css');

var Icon = React.createClass({

    getDefaultProps: function () {
        return {
            name: "eye",
            onClick: function(){}
        }
    },

    _onClick: function () {
        this.props.onClick();
    },

    render: function () {
        var css = style.icon + ' ' + this.props.className;
        return (<FontAwesome name={this.props.name} className={css} onClick={this._onClick}/>);
    }
});

module.exports = Icon;