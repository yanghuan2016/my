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
var logger = __logService;

var FB_CODE = {
    SUCCESS     : 200,            // 操作成功
    WAIT        : 201,            // 操作成功，等待返回结果
    /* Error code */
    DUPDATA         : 1001,       // 数据已经存在于数据库中
    INVALIDCAPTCHA  : 1002,       // 验证码错误
    LOGINFAILURE    : 1003,       // 账号密码不符
    CLIENTDISABLED  : 1004,       // 客户已经被禁用
    INVALIDAPPKEY   : 1005,       // 无效的APPKEY
    INVALIDAPPCODE  : 1006,       // 无效的APPCODE
    OPERATORDISABLED: 1007,       // 操作员已经被禁用
    CUSTOMERDISABLED: 1008,       // 商户账号已经被禁用
    USERDISABLED    : 1009,       // 账号已经被禁用
    MAXPASSWDFAIL   : 1010,       // 达到密码最大连续错误次数，账号锁定若干时间
    NOTFOUND        : 1011,       // 没有匹配到对象
    REDISERR        : 1012,       // Redis读写错误
    CACHEDISABLED   : 1013,       // 缓存被关闭
    NORESPONSE      : 1014,       // 服务器发送请求后没有响应
    CACHEKEYNOTALLOWED: 1015,     // Redis的Key未再cacheService.CacheKeys中定义  
    INTERNALERROR   : 5001,       // 服务器内部错误
    NOTIMPLEMENTED  : 5002,       // 该功能尚未实现
    INVALIDACTION   : 6001,       // 无效的操作
    AUTHFAILURE     : 7001,       // 未登录用户
    NOTGRANTED      : 7002,       // 没有执行该操作的权限
    INVALIDDATA     : 8001,       // 无效的数据
    DBFAILURE       : 9001,       // 数据库操作失败
    INITDBFAILURE   : 9002        // 初始化数据库操作失败
};

function FeedBack(retcode, message, data) {
    this.status = retcode;
    this.msg = message;
    this.data = data;
    logger.dump("feedback: status=" + this.status + ", msg=" + this.msg + ", data=" + JSON.stringify(this.data));
}

module.exports.FBCode = FB_CODE;
module.exports.FeedBack = FeedBack;