/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/**
 * feedback.js
 *
 * --------------------------------------------------------------
 * 2015-10-28   hc-romens@issue#357 optimiazed
 */

module.exports = function() {
    var _module_name = __filename.replace(/\.js/,"").split("/").pop();
    /**
     * Service
     */
    var logger = __logService;
    var db = __dbService;
    /**
     *  modules
     */
    var querystring = require('querystring');
    var http = require('http');
    var fs = require('fs');
    var crypto = require('crypto');
    var iconv = require('iconv-lite');
    var async = require('async');
    var underscore = require('underscore');

    var smsModule = {
        //通过SYSCONFIG配置发送短信
        sendSMS: function (mobile, msg,callback) {
            logger.enter();
            if(__enableSMS){
                var sendurl = __smsConfig.sendUrl;
                //yiyao365:
                //var post_data = querystring.stringify({
                //    ver : __smsConfig.ver,
                //    appkey :__smsConfig.appkey,
                //    phone : mobile,  //发送号码
                //    content: msg
                //    },
                //    '&',//[sep]分隔符
                //    '='//[eq]分配符
                //);
                //短信宝接口u=USERNAME&p=PASSWORD&m=PHONE&c=CONTENT

                var sighMethod = "MD5";
                var key = creatHashkey(__smsConfig.p,sighMethod);
                var post_data = querystring.stringify({
                        u: __smsConfig.u,
                        p: key,
                        m: mobile,  //发送号码
                        c: msg
                    },
                    '&',//[sep]分隔符
                    '='//[eq]分配符
                );


                var post_options = {
                    host: sendurl,
                    path: __smsConfig.path + post_data,
                    timeout: '5000',
                    method: 'GET'
                };
                // Set up the request
                var post_req = http.request(post_options, function (res) {
                    var strBuffer = "";
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        strBuffer += chunk;
                    });
                    res.on('end', function () {
                        callback(null, "OK");
                    });
                });
                post_req.on('error', function (err) {
                    callback(err);
                });
                post_req.end();
            }else{
                callback("短信接口未启用");
            }
        },
        //通过短信网关设置发送短信，失败了则用备用短信网关
        sendClientSMS: function(customerDB,mobile,msg,callback) {
            logger.enter();
            if(__enableSMS){
                var smsList = [];
                var mainSms = {};
                var standbySms = {};
                var isMainSucc = false;
                async.series([
                        //step1 get sms list
                        function(done){
                            db.getSmsList(customerDB,function(err,results){
                                smsList = results;
                                done(err,results);
                            })
                        },
                        //step2 get main sms keys
                        function(done){
                            underscore.map(smsList,function(item){
                                if(Number(item.isMain) == 1){
                                    mainSms.smsId = item.smsId;
                                    mainSms.name = item.name;
                                    mainSms.version = item.version;
                                    mainSms.encoding = item.encoding;
                                    mainSms.signMethod = item.signMethod;
                                    mainSms.baseUrl = item.baseUrl;
                                    mainSms.smsPath = item.smsPath;
                                }

                            });
                            db.getSmsSetting(customerDB,mainSms.smsId,function(err,results){
                                if(err||results.length ==0){
                                    done(err+"get sms configVale err");
                                }else{
                                    var configValueStr = results[0].configValue;
                                    var decodeValue = new Buffer(configValueStr, 'base64').toString();
                                    try{
                                        mainSms.smsConfig = JSON.parse(decodeValue);
                                    }catch(parseErr){
                                        logger.error(parseErr);
                                        return done("短信网关配置参数获取失败"+parseErr);
                                    }
                                    done();
                                }
                            });

                        },
                        //get  standby sms keys
                        function(done){
                            underscore.map(smsList,function(item){
                                if(Number(item.isStandby) == 1){
                                    standbySms.smsId = item.smsId;
                                    standbySms.name = item.name;
                                    standbySms.version = item.version;
                                    standbySms.encoding = item.encoding;
                                    standbySms.signMethod = item.signMethod;
                                    standbySms.baseUrl = item.baseUrl;
                                    standbySms.smsPath = item.smsPath;
                                }
                            });
                            if(standbySms.smsId){
                                db.getSmsSetting(customerDB,standbySms.smsId,function(err,results){
                                    if(err||results.length ==0){
                                        done(err+"get sms configVale err");
                                    }else{
                                        var configValueStr = results[0].configValue;
                                        var decodeValue = new Buffer(configValueStr, 'base64').toString();
                                        try{
                                            standbySms.smsConfig = JSON.parse(decodeValue);
                                        }catch(parseErr){
                                            logger.error(parseErr);
                                            return done(parseErr);
                                        }
                                        done();
                                    }
                                });
                            }else{
                                done();
                            }
                        },
                        //send sms by main sms
                        function(done){
                            sendMessageByConfig(mainSms,mobile,msg,function(err,result){
                                if(err){
                                    logger.error("send msg by main tunner fail");
                                }else{
                                    isMainSucc = true;
                                }
                                done();
                            })
                        },
                        //if main is fail,send sms by standby sms
                        function(done){
                            if(isMainSucc){
                                done();
                            }else if(!isMainSucc&&!standbySms.smsId){
                                done("首选短信网关发送失败，没有配置备用短信网关");
                            }else{
                                sendMessageByConfig(standbySms,mobile,msg,function(err,result){
                                    if(err){
                                        logger.error(err);
                                        done("备用短信网关发送失败"+err)
                                    }else{
                                        done(null,result);
                                    }
                                })
                            }
                        }
                    ],
                    function(errs,results){
                        if(errs){
                            logger.error(JSON.stringify(errs));
                            callback("发送短信失败："+errs)
                        }else{
                            logger.debug(JSON.stringify(results));
                            var feedback={
                                isMainSucc:isMainSucc,
                                msg:isMainSucc?"通过"+mainSms.name+"成功发送":"通过"+standbySms.name+"成功发送"
                            };
                            callback(null,feedback);
                        }
                    }
                );
            }else{
                callback("系统sysconfig短信接口未启用，请联系管理员")
            }
        }
    };

    function creatHashkey(key,signMethod){
        var crypto = require('crypto');
        var buffer=key;
        crypto = crypto.createHash(signMethod);
        crypto.update(buffer);
        return crypto.digest('hex');
    }
    //短信宝网关配置
    function sendMessageByConfig(smsConfig,mobile,msg,callback){
        logger.enter();
        logger.debug(JSON.stringify(smsConfig));
        var sendurl = smsConfig.baseUrl;
        var sighMethod = smsConfig.signMethod;
        var encoding = smsConfig.encoding;
        var smsPath = smsConfig.smsPath;
        var u =  smsConfig.smsConfig.u;
        var p  = smsConfig.smsConfig.p;
        var name = smsConfig.name;
        var version = smsConfig.version;

        if(name =="短信宝" && version == "v.1.0"){
            var key = creatHashkey(p,sighMethod);
            var post_data = querystring.stringify({
                    u: u,
                    p: key,
                    m: mobile,  //发送号码
                    c: msg
                },
                '&',//[sep]分隔符
                '='//[eq]分配符
            );
            var post_options = {
                host: sendurl,
                path: smsPath + post_data,
                timeout: '5000',
                method: 'GET'
            };
        }else{
            return callback("尚未配置该短信发送接口，请联系管理员")
        }

        // Set up the request
        var post_req = http.request(post_options, function (res) {
            var strBuffer = "";
            res.setEncoding(encoding);
            res.on('data', function (chunk) {
                strBuffer += chunk;
            });
            res.on('end', function () {
                callback(null, "OK");
            });
        });
        post_req.on('error', function (err) {
            callback(err);
        });
        post_req.end();
    }

    return smsModule;
};