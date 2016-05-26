var RestService = require('util/restService');
var cookie = require('util/cookieUtil');
var Url = require('edi/constantsUrl')();

module.exports = function () {

    var socket = "";

    return {

        connectSocket: function () {
            socket = io.connect(Url.headUrl, {'force new connection': true});
            socket.on('connect', function () {
                var service = new RestService(Url.setSocketUrl);
                service.post({socketId: socket.id}, function (feedback) {
                });
            });
        },

        watchSocket: function (task, callback) {
            socket.on(task, function (msg) {
                callback(msg);
            });
        },

        removeSocketListener: function (task) {
            socket.removeListener(task);
        },

        disconnectSocket: function () {
            if (socket) socket.disconnect();
        }
    };
}();