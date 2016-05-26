/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

module.exports = function () {
    /**
     * yiyao365 service handles
     */
    var logger = global.__logService;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");
    var async = require("async");
    var crypto = require('crypto');
    var url = require('url');
    var moment = require('moment');
    var querystring = require('querystring');
    var http = require('http');

    var feedback = require(__modules_path + "/feedback");
    var FBCode = feedback.FBCode;
    var FeedBack = feedback.FeedBack;

    /**
     * yiyao365 Service provider
     */
    var yy365Service = {

        /**
         * OAuth EDI登陆认证处理
         * @param loginName
         * @param password
         * @param callback
         */
        login: function (loginName, password, callback) {
            logger.enter();
            var webSiteGuid = __yy365LoginAuth.webSiteGuid;                 // WebSiteGuid guid
            var webKeySeed = __yy365LoginAuth.webKeySeed;                   // WebKeySeed key
            var authServer = __yy365LoginAuth.authServer;                   // Server URL

            // step1. WebSiteGuid、yyyyMMdd、WebKeySeed 生成 WebKeyString
            var now = moment();
            var dateStr = now.format("YYYYMMDD");
            var webKeyString = webSiteGuid + dateStr + webKeySeed;
            logger.ndump('webKeyString : ', webKeyString);

            // step2. WebKeyString => MD5 => Base64

            var md5 = crypto.createHash('md5');
            var webKeyMd5Val = md5.update(webKeyString).digest('base64');
            logger.ndump('webKeyMd5Val : ', webKeyMd5Val);

            // step3. Md5Val base64 编码做调整[将‘=’替换为‘-’]、 [将‘+’替换为‘_’]
            webKeyMd5Val = webKeyMd5Val.replace(/=/g, '-').replace(/\+/g, '_');
            logger.ndump('webKeyMd5Val Format : ', webKeyMd5Val);

            // step4. 发起 POST 请求
            // URL: authServer + 'Handlers/login.ashx?wid=' + webSiteGuid +'&wcd=' + Md5Val
            // Data: UserCode(login name) pwd(password)
            var serverUrl = authServer + 'Handlers/login.ashx?wid=' + webSiteGuid + '&wcd=' + webKeyMd5Val;
            var urlData = url.parse(serverUrl);
            var postData = {
                UserCode: loginName,
                pwd: password
            };

            postData = querystring.stringify(postData);
            // 由于 querystring.stringify 会将 post data 中邮箱'@'符转换为'%40',
            // 而大平台 OAuth 认证服务器无法识别解译该字符，所以需要正则转换回来
            postData = postData.replace(/%40/g, '@');
            //postData = JSON.stringify(postData);

            //logger.ndump('Post Data : ', postData);

            var opt = {
                method: "POST",
                host: urlData.hostname,
                port: 80,
                path: urlData.path,
                headers: {
                    "Content-Type": 'application/x-www-form-urlencoded',
                    "Content-Length": Buffer.byteLength(postData, 'utf8')
                }
            };

            var req = http.request(opt, function (res) {
                if (res.statusCode == 200) {
                    var strBuffer = "";
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        strBuffer += chunk;
                    });
                    res.on('end', function () {
                        //logger.ndump('response data: ', strBuffer);
                        callback(null, strBuffer);
                    });
                }
                else {
                    callback("登录失败,错误码: " + res.statusCode);
                }
            });

            req.on('error', function (err) {
                logger.error('YY365 OAuth login error: ', err);
                callback(err);
            });

            req.write(postData);
            req.end();
        }

    };

    return yy365Service;
};
