/*****************************************************************
 * 青岛雨人软件有限公司?2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * EmuServer
 *      scc's startup initialization
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2016/1/15     romens@
 *
 */
var http = require('http');
var url = require('url');
var qs = require('querystring');

http.createServer(function(req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    var data = {num:10000};
    var parseData = JSON.stringify(data);
    res.end(parseData);
}).listen(3000, "127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');