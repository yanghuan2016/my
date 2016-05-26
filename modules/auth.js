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
 * auth.js
 *
 * In this module, all the security apis are listed
 *
 * --------------------------------------------------------------
 * 2015-09-23	hc-romens@issue#34	created
 */

var _module_name = __filename.replace(/\.js/,"").split("/").pop();

/*
 * init logger
*/
var logger = __logService;

/*
 * init 3rd libs
*/
var passhash = require("password-hash-and-salt");
var underscore = require("underscore");
var feedback = require(__modules_path + "/feedback");
var FBCode = feedback.FBCode;
var FeedBack = feedback.FeedBack;

var validNamePattern = new RegExp("^[a-zA-Z0-9@._]+$");//校验合法username
var validPasswordPattern = new RegExp("^[a-zA-Z]\w{5,17}$");//校验合法password（以字母开头，长度在6~18之间，只能包含字符、数字和下划线）
var validUrlPattern = new RegExp("^((https|http|ftp|rtsp|mms)?://)" +
         "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" + //ftp的user@
         "(([0-9]{1,3}\.){3}[0-9]{1,3}" + // IP形式的URL- 199.194.52.184
         "|" +// 允许IP和DOMAIN（域名）
         "([0-9a-z_!~*'()-]+\.)*" +// 域名- www.
         "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." +// 二级域名
        "[a-z]{2,6})" +// first level domain- .com or .museum
        "(:[0-9]{1,4})?" +// 端口- :80
        "((/?)|" +// a slash isn't required if there is no file name
        "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$");//校验完整合法url
var validNextToUrlPattern = new RegExp("^/|%2F");//相对路径合法url以/开头
var validIdPattern = new RegExp("^[0-9]*$");//ID为纯数字
var validQuantityPattern = new RegExp("^[\-0-9]*$");//数量值为纯数字
var validAddressPattern = new RegExp("^[\u4E00-\u9FA5A-Za-z0-9_]+$");//address可以包括中文，英文，数字，下划线
var validRemarksPattern = "";//验证remarks

/**
 * stricted
 *      verify the login status
 * @param req
 * @param res
 * @param next
 */
exports.restrict = function(req, res, next) {
    logger.enter();
    //logger.info(JSON.stringify(req))
    if (req.session.operator) {
        if (req.url.indexOf("customer") > -1 && req.session.operator.operatorType == "CUSTOMER") {
            return next();
        } else if (req.url.indexOf("customer") > -1 && req.session.operator.operatorType != "CUSTOMER") {
            logger.debug("您所访问的页面没有权限");
            res.redirect("/no_permission")
        } else if (req.url.indexOf("customer") == -1 && req.session.operator.operatorType == "CLIENT") {
            return next();
        }
    }
    logger.ndump("url", req.url);
    var nextTo = encodeURIComponent(req.url);
    res.redirect("/login?nextTo=" + nextTo);
};


/**
 * Valide the req param
 * @param req
 * @returns  res next
 */
exports.validateReq = function(req,res,next) {
    logger.enter();
    var params = underscore(req.body).clone();
    params = underscore.extend(params, req.query);

    logger.ndump("session", req.session);

    for (var paramName in params) {
        if (typeof validRules[paramName] === "undefined") {
            logger.fatal("PARAM <" + paramName + "> VALIDATION IS NOT IMPLEMENTED YET!");
            continue;
        }
        var ret = validRules[paramName](params[paramName], req);
        if (typeof(ret) === "object" ) {
            res.json(ret);
            return;
        } if (typeof(ret) === "boolean" && ret == false) {
            logger.debug("auth validate " + paramName + " FAIL");
            res.json("输入数据格式有误");
            return;
        }
        logger.debug("Validating <" + paramName + "> ... PASSED!");
    }
    return next();
};


var validRules = {
    //所有req提交信息的验证字典，按首字母顺序排列
    //验证address信息
    'action': function (value) {
        return true;
    },
    'address': function (value) {
        return true;
    },
    'addressDetail': function (value) {
        return true;
    },
    'stock_case': function (value) {
        return true;
    },
    'keyword': function (value) {
        return true;
    },
    'addressId': function (value) {
        return true;
    },
    'amount': function (value) {
        return true;
    },
    'registeredTradeMarksAndPatents': function (value) {
        return true;
    },
    'areaDesc': function (value) {
        return true;
    },
    'barcode': function (value) {
        return true;
    },
    /**
     * 验证码检查，每次清除当前验证码，用于表单最后的数据提交
     * @param captchaCode
     * @param req
     * @returns {*}
     */
    'captcha': function (captchaCode, req) {
        // 清除session中的captchaCode
        var captchaCodeInSession = req.session.captchaCode;
        // 删session中保存的验证码
        delete req.session.captchaCode;
        logger.ndump("__enableCaptcha", __enableCaptcha);
        if (captchaCode.toUpperCase() === captchaCodeInSession || !__enableCaptcha) {
            return true;
        } else {
            return new FeedBack(FBCode.INVALIDCAPTCHA, "验证码错误");
        }
    },
    /**
     * 验证码检查，不清除当前验证码。用于动态显示验证码输入框后面的对错提醒
     * @param captchaCode
     * @param req
     * @returns {*|FeedBack}
     */
    'captchaCode': function (captchaCode, req) {
        var captchaCodeInSession = req.session.captchaCode;
        logger.ndump("__enableCaptcha", __enableCaptcha);
        if (captchaCode.toUpperCase() === captchaCodeInSession || !__enableCaptcha) {
            return new FeedBack(FBCode.SUCCESS);
        } else {
            return new FeedBack(FBCode.INVALIDCAPTCHA, "验证码错误");
        }
    },

    //验证cartItemIds
    'cartItemIds': function (value) {
        return validIdPattern.test(value);
    },
    'categoryField': function (value) {
        return true;
    },
    'categoryName': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'clientId': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'clientCategoryid': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'clientIds': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'clientArea': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'clientCode': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'clientName': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'id': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    //验证clientId
    'clientId': function (value) {
        return validIdPattern.test(value);
    },
    'commonName': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'customerReply': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'drugAdministrationEncoding': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'drugsType': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'drugsValidDate': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'filingNumber': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'filingNumberValidDate': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'goodsDetails': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'goodsNo': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'goodsIds': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'goodsType': function (value) {
        //TODO ADD REGEXP
        return true;
    },

    'gmpNumber': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'gmpCertificationDate': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'gmpValidDate': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'gspType': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'id': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'imageUrl': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'importRegisCertNum': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'importRegisCertNumValidDate': function (value) {
        //TODO ADD REGEXP
        return true;
    },

    //针对is开头的标志位字段作验证
    '/^is/': function (value) {
        //TODO ADD REGEXP
        return true;
    },

    'items': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'goodsId': function (value) {
        return validIdPattern.test(value);
    },
    'goodsIds': function (value) {
        //TODO ADD REGEXP
        return true
    },
    //验证login_id合法性
    'login_id': function (value) {
        return validNamePattern.test(value);
    },
    //验证login_pwd合法性
    'login_pwd': function (value) {
        return validPasswordPattern.test(value);
    },
    'logisticsCompany': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'logisticsNo': function (value) {
        //TODO ADD REGEXP
        return true;
    },

    'mobileNum': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'negSell': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    //验证nextTo url合法性
    'nextTo': function (value) {
        return validNextToUrlPattern.test(value);
    },
    'orderId': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'onSell': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    //验证登录密码
    'password': function (value) {
        // validate password  oK return true
        return true;
    },
    'passwordnew': function (value) {
        // validate password  oK return true
        return true;
    },
    'price1': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'price': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'price2': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'price3': function (value) {
        //TODO ADD REGEXP
        return true;
    },

    'pricePlan': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    'producer': function (value) {
        //TODO ADD REGEXP
        return true;
    },
    //验证数量
    'quantity': function (value) {
        // validate quantity  oK return true
        return validQuantityPattern.test(value);
    },

    'registeredTradeMarksAndPatents': function (value) {
        return validIdPattern.test(value);
    },
    //验证备注
    'remark': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },

    'remarks': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },

    'refRetailPrice': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },
    'returnData': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },
    'returnId': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },
    'shipData': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },
    'shipId': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },
    'spec': function (value) {
        return true;
    },
    'statusName': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },
    'status': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },

    //验证登录用户名
    'username': function (value) {
        // validate username
        return validNamePattern.test(value);
    },
    'wholesalePrice': function (value) {
        // validate remarks  oK return true
        //todo add Regexp to valid remarks;
        return true;
    },
    'title': function (value) {
        return true;
    },
    'Content': function (value) {
        return true;
    },
    'categoryId':function(value){
        return true;
    },
    'logisticsNo':function(value){
        return true;
    },
    'baseInfo': function(value) {
        return true;
    },
    'priceInfo': function(value) {
        return true;
    },
    'inventoryInfo': function(value) {
        return true;
    },
    'gspInfo': function(value) {
        return true;
    },
    'marksInfo': function(value) {
        return true;
    }
};

/**
 * Salt and hash the string
 * @param str
 * @param done  a callback function
 */
exports.hash = function(str, done) {
    logger.enter();

    passhash(str).hash(function (error, hash) {
        if (error) {
            logger.error("Fail to hash the password, due to:" + error.stack);
        } else {
            logger.ndump("hashed string", hash);
            done(hash);
        }
    });
};

exports.acl = function(fps) {
    return function (req, res, next) {
        //return next();
        var found = false;
        if (underscore.isUndefined(req.session)) {
            logger.trace("Not login yet! Not Granted!");
        } else {
            if (!underscore.isArray(fps)) {
                fps = [fps];
            }
            logger.trace("Checking fps=[" + fps + "] for user, user's rights=[" + req.session.operator.operatorRoles + "]");

            /**
             * loop the fps to match granted previliges
             */
            for (var i=0; i<fps.length; i++) {
                var fp = fps[i];
                if (underscore.contains(req.session.operator.operatorRoles, fp)) { // match
                    logger.debug("Operator: " + req.session.operator.operatorName + " is granted to access [" + fp + "].");
                    found = true;
                    return next();
                }
            }
        }

        if (!found) {
            logger.trace("No permit for user");

            var feedback = require(__modules_path + "/feedback");
            var FBCode = feedback.FBCode;
            var FeedBack = feedback.FeedBack;


            var data = new FeedBack(FBCode.NOTGRANTED, "您没有权限执行该业务操作，请联系管理员开通权限。");
            if( req.headers['x-requested-with'] && (req.headers['x-requested-with'] == 'XMLHttpRequest') ){
                return res.json(data);
            } else {
                return res.render("error/forbid",{
                    data: data
                });
            }
        }
    };
};
