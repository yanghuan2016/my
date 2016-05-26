/**
 * 显示页面的错误
 * @type {*|exports|module.exports}
 */

/*
 * msg.jsx
 *
 * 2015-05-17    wzhongbi-romens     created
 *
 */

var React = require('react');
var pageStore = require('ediStores/pageStore');
var pageAction = require('ediAction/pageAction');
var message = require('antd').message;

var msg = React.createClass({

    getInitialState: function () {
        return {
            msg: pageStore.getMsg()
        }
    },

    _onChange: function () {
        var self = this;
        self.setState({
            msg: pageStore.getMsg()
        });
    },

    componentDidMount: function () {
        pageStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        pageStore.removeChangeListener(this._onChange);
    },

    componentDidUpdate: function () {
        var msg = this.state.msg;
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