/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * portal/controller.js
 *
 * portal controller
 * --------------------------------------------------------------
 * 2015-10-20	wzb && kevin -romens@issue#43 created
 *
 */

module.exports=function(app) {


    var path = require('path');
    var APPNAME = __dirname.split(path.sep).pop();
    var APPURL = "/" + APPNAME;

    var ueditor = require('ueditor');



    app.use(APPURL+"/ue", ueditor(path.join(__base),uploadPictureHandle));
    //app.post(APPURL+"/ue", ueditor(path.join(__base),uploadPictureHandle));

    function uploadPictureHandle(req, res, next) {
        if(req.query.action === 'uploadimage'){
            var foo = req.ueditor;
            var date = new Date();
            var imgname = req.ueditor.filename;



            var img_url = '/static/upload';
            res.ue_up(img_url);
        }
        //  客户端发起图片列表请求
        else if (req.query.action === 'listimage'){
            var dir_url = '/static/upload';
            res.ue_list(dir_url);
        }
        else {
            res.setHeader('Content-Type', 'application/json');
            res.redirect('/static/ueditor/config.json')
        }}
};

