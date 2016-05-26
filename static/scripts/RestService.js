function RestService(url) {
  this.myurl = url;
  this.post = function (model, callback) {
    $.ajax({
      type: 'POST',
      url: this.myurl,
      data: JSON.stringify(model), // '{"name":"' + model.name + '"}',
      dataType: 'text',
      processData: false,
      contentType: 'application/json',
      success: callback,
      error: function (req, status, ex) {
      },
      timeout: 60000
    });
  };
  this.put = function (model, callback) {
    $.ajax({
      type: 'PUT',
      url: this.myurl,
      data: JSON.stringify(model), // '{"name":"' + model.name + '"}',
      dataType: 'text',
      processData: false,
      contentType: 'application/json',
      success: callback,
      error: function (req, status, ex) {
      },
      timeout: 60000
    });
  };
  this.find = function (id, callback) {
    $.ajax({
      type: 'GET',
      url: this.myurl + '/' + id,
      contentType: 'application/json',
      success: callback,
      error: function (req, status, ex) {
      },
      timeout: 60000
    });
  };
  this.findAll = function (callback) {
    $.ajax({
      type: 'GET',
      url: this.myurl,
      contentType: 'application/json',
      success: callback,
      error: function (req, status, ex) {
      },
      timeout: 60000
    });
  };
  this.remove = function (id, callback) {
    $.ajax({
      type: 'DELETE',
      url: this.myurl + '/' + id,
      contentType: 'application/json',
      success: callback,
      error: function (req, status, ex) {
      },
      timeout: 60000
    });
  };
  this.loadTmpl = function (turl, callback) {
    $.ajax({
      url: turl,
      success: callback,
      error: function (req, status, ex) {
      },
      timeout: 60000
    });
  }
}