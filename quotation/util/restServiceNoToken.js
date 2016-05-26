/**
 * ajax请求
 * @param url
 * @constructor
 */

function RestService(url) {
    this.myurl = url;
    this.find = function (id, callback) {
        $.ajax({
            type: 'GET',
            url: this.myurl + '/' + id,
            contentType: 'application/json',
            success: callback,
            async: false,
            error: function (req, status, ex) {
                callback(req, status, ex)
            },
            timeout: 30000
        });
    };
    this.findAll = function (callback) {
        $.ajax({
            type: 'GET',
            url: this.myurl,
            contentType: 'application/json',
            success: callback,
            async: false,
            error: function (req, status, ex) {
                callback(req, status, ex)
            },
            timeout: 30000
        });
    };
    this.post = function (model, callback) {
        $.ajax({
            type: 'POST',
            url: this.myurl,
            data: JSON.stringify(model),
            dataType: 'text',
            processData: false,
            contentType: 'application/json',
            success: callback,
            error: function (req, status, ex) {
                callback(req, status, ex)
            },
            timeout: 30000
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
            success: callback,
            error: function (req, status, ex) {
                callback(req, status, ex)
            },
            timeout: 30000
        });
    };
    this.patch = function (model, callback) {
        $.ajax({
            type: 'PATCH',
            url: this.myurl,
            data: JSON.stringify(model),
            dataType: 'text',
            processData: false,
            contentType: 'application/json',
            success: callback,
            error: function (req, status, ex) {
                callback(req, status, ex)
            },
            timeout: 30000
        });
    };
    this.remove = function (id, callback) {
        $.ajax({
            type: 'DELETE',
            url: this.myurl + '/' + id,
            contentType: 'application/json',
            success: callback,
            error: function (req, status, ex) {
                callback(req, status, ex)
            },
            timeout: 30000
        });
    };
}

module.exports = RestService;