/**
 * 封装ajax请求
 * @param url
 * @constructor
 */
var cookie = require('./cookieUtil');

function RestService(url) {
    this.myurl = url;
    this.post = function (model, callback) {
        $.ajax({
            type: 'POST',
            url: this.myurl,
            data: JSON.stringify(model),
            dataType: 'text',
            processData: false,
            contentType: 'application/json',
            beforeSend: function (HttpRequest) {
                HttpRequest.setRequestHeader("access-token", cookie.getItem('token'));
            },
            success: callback,
            error: function (req, status, ex) {
                callback({
                    req: req,
                    status: status,
                    ex: ex
                })
            },
            timeout: 60000
        });
    };
    this.put = function (model, callback) {
        $.ajax({
            type: 'PUT',
            url: this.myurl,
            data: JSON.stringify(model),
            dataType: 'text',
            processData: false,
            contentType: 'application/json',
            beforeSend: function (HttpRequest) {
                HttpRequest.setRequestHeader("access-token", cookie.getItem('token'));
            },
            success: callback,
            error: function (req, status, ex) {
                callback({
                    req: req,
                    status: status,
                    ex: ex
                })
            },
            timeout: 60000
        });
    };
    this.find = function (id, callback) {
        $.ajax({
            type: 'GET',
            url: this.myurl + '/' + id,
            contentType: 'application/json',
            beforeSend: function (HttpRequest) {
                HttpRequest.setRequestHeader("access-token", cookie.getItem('token'));
            },
            success: callback,
            error: function (req, status, ex) {
                callback({
                    req: req,
                    status: status,
                    ex: ex
                })
            },
            timeout: 60000
        });
    };
    this.findAll = function (callback) {
        $.ajax({
            type: 'GET',
            url: this.myurl,
            contentType: 'application/json',
            beforeSend: function (HttpRequest) {
                HttpRequest.setRequestHeader("access-token", cookie.getItem('token'));
            },
            success: callback,
            error: function (req, status, ex) {
                callback({
                    req: req,
                    status: status,
                    ex: ex
                })
            },
            timeout: 60000
        });
    };
    this.remove = function (id, callback) {
        $.ajax({
            type: 'DELETE',
            url: this.myurl + '/' + id,
            contentType: 'application/json',
            beforeSend: function (HttpRequest) {
                HttpRequest.setRequestHeader("access-token", cookie.getItem('token'));
            },
            success: callback,
            error: function (req, status, ex) {
                callback({
                    req: req,
                    status: status,
                    ex: ex
                })
            },
            timeout: 60000
        });
    };
}

module.exports = RestService;