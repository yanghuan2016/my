// global variables:
var modulesPath = __modules_path;
var dataService = __dataService;
var logger = __logService;


// third modules:
var path = require("path");
var _ = require('lodash');
var formidable = require('formidable');
var fs = require('fs');
var strftime = require('strftime');

// scc modules:
var sccPath = require(modulesPath + '/mypath');
var auth = require(__base + '/modules/auth');

// initialize
var attachmentPath = "/" + sccPath.getAppName(__dirname);
var FBCode = require(__modules_path + "/feedback").FBCode;
var Feedback = require(__modules_path + "/feedback").FeedBack;
var message = require(__modules_path + "/message");

module.exports = function (app) {

	/**
	 * 附件上传
	 */
	app.post(attachmentPath + "/upload", function (req, res, next) {
		logger.enter();
		var form = new formidable.IncomingForm();   //创建上传表单
		form.encoding = 'utf-8';    //设置编辑
		form.uploadDir = __base + '/static/upload/';   //设置上传目录
		var imgRootUrl = '/static/upload/';
		form.keepExtensions = true;   //保留后缀
		form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
		form.parse(req, function (err, fields, files) {
			if (err) {
				res.locals.error = err;
				res.json(new Feedback(FBCode.INTERNALERROR, ''));
				return;
			}
			var types = files.file.name.split('.');
			var timestamp = new Date();
			var url = strftime(imgRootUrl + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
			var filename = strftime(form.uploadDir + "%Y%m%d%H%I%M%S." + String(types[types.length - 1]), timestamp);
			fs.renameSync(files.file.path, filename);
			res.json(new Feedback(FBCode.SUCCESS, url));
		});
	});

};
