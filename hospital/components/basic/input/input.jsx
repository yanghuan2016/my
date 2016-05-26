/**
 * 基于　ant design 封装的输入框
 *
 */

/*
 * input.jsx
 *
 * 2015-05-12    wzhongbi-romens     created
 *
 */
var React = require('react');
var Input = require('antd').Input;

module.exports = React.createClass({

    _onChange: function (event) {
        this.props.onChange(this.props.name, event.target.value, this.props.keyId);
    },

    render: function () {
        return <Input {...this.props} onChange={this._onChange}/>
    }
});