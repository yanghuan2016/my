/**
 * 二维码生成
 * 需要父组件传递相应的二维码的内容 content
 * @type {*|exports|module.exports}
 */

/*
 * qrcode.jsx
 *
 * 2015-05-12    wzhongbi-romens     created
 *
 */

var React = require('react');

module.exports = React.createClass({

    getDefaultProps: function () {
        return {
            content: 'http://192.168.100.20:4000/#/shipAddress'
        }
    },

    componentDidUpdate: function () {
        var self = this;
        $('#qrcode').html('');
        $('#qrcode').qrcode({
            'text': self.props.content
        });
    },

    render: function () {
        return <div id='qrcode'></div>;
    }
});