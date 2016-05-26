/**
 * socketIo
 * @type {*|exports|module.exports}
 */

/*
 * socketIo.jsx
 *
 * 2015-04-27    wzhongbi-romens     created
 *
 */
var React = require('react');

var socketIoAction = require('ediAction/socketIoAction');
var socketIoService = require('util/socketIoService.js');

var SocketIo = React.createClass({

    componentWillMount: function () {
        socketIoService.connectSocket();
    },

    componentWillUnmount: function () {
        socketIoService.disconnectSocket();
    },

    render: function () {
        var style = {
            height: '100%',
            width: '100%',
            position: 'relative'
        };
        return (
            <div style={style}>
                {this.props.children}
            </div>
        );
    }
});
module.exports = SocketIo;