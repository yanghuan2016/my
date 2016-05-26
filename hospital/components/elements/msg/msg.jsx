/**
 * 显示页面的错误
 * @type {*|exports|module.exports}
 */

/*
 * msg.jsx
 *
 * 2015-05-13    wzhongbi-romens     created
 *
 */

var React = require('react');
var userStore = require('stores/userStore');
var userAction = require('action/userAction');
var message = require('antd').message;

var msg = React.createClass({

    getInitialState: function () {
        return {
            msg: userStore.getErrorMsg()
        }
    },

    _onChange: function () {
        this.setState({
            msg: userStore.getErrorMsg()
        });
    },

    componentDidMount: function () {
        userStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        userStore.removeChangeListener(this._onChange);
    },

    componentDidUpdate: function () {
        var self = this;
        var msg = self.state.msg;
        if (msg) {
            message.error(msg);
        }
    },

    render: function () {
        var self = this;
        return <div style={{width: '100%', height: '100%'}}>{self.props.children}</div>;
    }
});

module.exports = msg;