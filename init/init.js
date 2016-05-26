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
 * init.js
 *      scc's startup initialization
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-28    hc-romens@issue#63     added sql injection protection
 * 2015-09-17    hc-romens@issue#18     removed co & yield oprations
 * 2015-09-17    hc-romens@issue#18     added module "stdio" for arg parse
 *
 */


/* 3rd party modules */
var express = require('express');
var compression = require('compression');
var favicon = require('serve-favicon');
var path = require('path');
var underscore = require('underscore');
var sprintf = require('sprintf-js').sprintf;
var async = require('async');
var cors = require('cors');

var feedback = require(__modules_path + "/feedback");
var FBCode = feedback.FBCode;
var FeedBack = feedback.FeedBack;

/**
 * Services
 **/
var logger = __logService;
var dbService = __dbService;

exports.initApp = function(callback) {

    logger.enter();

    /**
     * Set mime type for .woff, to improve the loading effect, as if .woff in browser cache
     */
    express.static.mime.define({
        'application/x-font-woff': ['woff'],
        'application/font-woff': ['woff']
    });

    var app = express();
    var server = require('http').createServer(app);
    global.__socketIO = require('socket.io')(server);

    var swaggerTools = require('swagger-tools');
    var jsyaml = require('js-yaml');
    var fs = require('fs');
    var spec = fs.readFileSync(__base + '/swagger/swagger.yaml', 'utf8');
    var swaggerDoc = jsyaml.safeLoad(spec);
    var options = {
    controllers: __base + '/swagger'
};
    // Initialize the Swagger middleware
    swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

    /**
     * 启用http gzip
     */
    app.use(compression());


        // /**
        //  * 启用http gzip
        //  */
        // app.use(compression());
        //
        // /**
        //  * 信任http proxy, 以获取真实的的源ip地址
        //  */
        // app.enable('trust proxy');
        // // app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));
        //
        // //TODO 允许跨域 //https://www.npmjs.com/package/cors 设置跨域
        // app.use(cors());
        //
        // app.use('/static',express.static('static', {maxAge: __browserCacheTTL}));

        /**
         * Set session, using the redisStore
         */
        var session = require('express-session');
        var RedisStore = require('connect-redis')(session);

        // 此中间件 检测请求的token 与cookie是否存在,当token存在,
        // cookie不存在时,将token的值写入cookie, 供下文中session中间件解析.
        app.use(function (req, res, next) {
            var access_token = req.header('access-token');
            if (access_token && (_.isEmpty(req.cookies) || _.isEmpty(req.cookies['connect.sid']))) {
                req.cookies = {};
                req.cookies['connect.sid'] = access_token;
                logger.debug('token is not null, cookie is null');
            }
            next();
        });
        /**
         * Init session in Redis
         */
        var sessionMiddleware = session({
            store: new RedisStore({
                host: __redisConfig.host,
                port: __redisConfig.port,
                ttl: __sessionTTL,
                db: Number(__redisConfig.dbNum)
            }),
            secret: __sessionSecret,
            saveUninitialized: true,
            resave: true
        });
        app.use(sessionMiddleware);

        /**
         * 启用http gzip
         */
        app.use(compression());

        /**
         * 信任http proxy, 以获取真实的的源ip地址
         */
        app.enable('trust proxy');
        // app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')));

        //TODO 允许跨域 //https://www.npmjs.com/package/cors 设置跨域
        app.use(cors());

        app.use('/static', express.static('static', {maxAge: __browserCacheTTL}));


        var bodyParser = require('body-parser');
        app.use(bodyParser.json());       // to support JSON-encoded bodies
        app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
            extended: true
        }));

        var cookieParser = require('cookie-parser');
        var _ = require('lodash');
        var cookie = require('cookie');
        var signature = require('cookie-signature');
        app.use(cookieParser());

        // 此中间件砸在cookie不存在时,将sessionID写入cookie
        app.use(function (req, res, next) {
            var access_token = req.header('access-token');

            logger.trace("\n" + req.protocol + " : " + req.method + " : " + req.url);
            logger.trace(
                '\n' + 'cookie: \t\t' + Boolean(req.cookies['connect.sid']) + " : " + req.cookies['connect.sid'] +
                '\n' + 'access-token: \t\t' + Boolean(access_token) + " : " + access_token +
                '\n' + 'req.sessionID: \t\t' + Boolean(req.sessionID) + " : " + req.sessionID
            );
            // 当cookies不存在时候:
            if (_.isEmpty(req.cookies)) {
                var signed = 's:' + signature.sign(req.sessionID, __sessionSecret);
                req.cookies = {
                    "connect.sid": signed
                };
                res.cookie('connect.sid', signed);
            }
            logger.debug(
                "\n" + "将access-token转cookie之后:" +
                '\n' + 'cookie: \t\t' + Boolean(req.cookies['connect.sid']) + " : " + req.cookies['connect.sid'] +
                '\n' + 'access-token: \t\t' + Boolean(access_token) + " : " + access_token +
                '\n' + 'req.sessionID: \t\t' + Boolean(req.sessionID) + " : " + req.sessionID
            );
            // 如果access_token 不存在, 则跳出
            if (_.isEmpty(access_token)) {
                return next();
            }
            // 否则在相应头中设置access_token字段
            res.header("access-token", access_token);
            next();
        });


        var sharedSession = require('express-socket.io-session');
        __socketIO.use(sharedSession(sessionMiddleware, {autoSave: true}));
        __socketIO.on('connection', require(__services_path + "/socketIOService"));


        initSubDomain(app);
        initControls(app);
        // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
        app.use(middleware.swaggerMetadata());

        // Validate Swagger requests
        app.use(middleware.swaggerValidator());

        // Route validated requests to appropriate controller
        app.use(middleware.swaggerRouter(options));


        app.set('views', path.join(__base, 'views'));
        app.set('view engine', 'ejs');

        var ccap = require("ccap");
        app.get("/captcha", function (req, res) {
            var captchaRobot = ccap(
                {
                    width: 170,
                    height: 60,
                    offset: 40,
                    quality: 40,
                    generate: function () {
                        var text = sprintf("%04d", Math.floor(Math.random() * 10000));
                        return text;
                    }
                }
            );
            var captcha = captchaRobot.get();
            logger.ndump("session", req.session);
            req.session.captchaCode = captcha[0].toString();
            var captchaBuff = captcha[1];
            res.set('Content-Type', 'image/jpeg');
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Headers", "X-Requested-With");
            res.set("Access-Control-Allow-Methods");
            // set browser cache ignore
            res.set('Cache-control', 'no-cache, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT');
            res.end(captchaBuff);
        });

        callback(null, server);
    });

}

/**
 * @param app
 */
function initSubDomain(app) {

    /*
     * 按照用户访问的域名/IP地址来加载对应的CustomerDB
     */
    app.use(function (req, res, next) {

        if (__mode !== "B2B")
            return next();

        // 分离域名或者ip地址
        var accessURL = req.protocol + "://" + req.host;
        var host = req.host.split(':');
        var domain = host[0].toLowerCase();
        var port = host[1];

        // 读取source ip地址
        if (!underscore.isUndefined((req.ip))) {
            req.ipv4 = req.ip.split(':').pop();
        }

        logger.ndump("customer", req.session.customer);
        logger.ndump("req.session", req.session);
        async.series([
            function checkDomain(done) {
                /* 限制该用户在所授权的域上访问 */
                if (!underscore.isEmpty(req.session.customer) && (domain !== req.session.customer.domain)) {
                    /* 清除session */
                    req.session.destroy(function () {
                        done();
                    });
                } else {
                    done();
                }
            },
            function loadCustomerInfo(done) {
                /**
                 * 从CloudDB.Customer中读取该domain对应的商户配置数据
                 */
                dbService.loadCustomerDBInfo(domain, function (err, results) {
                    if (!underscore.isEmpty(results)) {
                        if (results[0].enabled == false) {
                            logger.warn(results[0].customerName + "已经停止服务，请电话或邮件联络");
                            // todo render a service suspended page
                            return;
                        }

                        var customer = {
                            domain: domain,
                            customerId: results[0].customerId,
                            hasPortal: results[0].hasPortal == 1,
                            customerDB: __customerDBPrefix + "_" + results[0].customerDBSuffix,
                            customerEnabled: results[0].enabled == 1,
                            erpIsAvailable: results[0].erpIsAvailable,
                            paymentOnCloud: results[0].paymentIsOnCloud == 1
                        };

                        req.session.customer = customer;

                        async.series(
                            [
                                function checkOperatorUsability(done1) {
                                    logger.enter();
                                    // 检查操作员是否被禁用

                                    if (req.session && req.session.operator && req.session.operator.operatorId) {
                                        logger.trace("getOperator");
                                        dbService.getOperatorById(customer.customerDB, req.session.operator.operatorId, function (err2, operatorInfo) {
                                            if (operatorInfo && operatorInfo.operatorEnabled == false) {
                                                logger.debug("Operator " + req.session.operator.operatorName + " is banned to access!");
                                                req.session.destroy(function () {
                                                    done1(FBCode.OPERATORDISABLED);
                                                });
                                            } else {
                                                done1(null);
                                            }
                                        });
                                    } else {
                                        logger.trace("no session");
                                        done1(null);
                                    }
                                }
                            ],
                            function (err) {
                                logger.ndump("customer", customer);
                                if (err == FBCode.OPERATORDISABLED) {
                                    res.json(new FeedBack(FBCode.OPERATORDISABLED, "该操作员已经被禁用！"));
                                } else if (customer.hasPortal) {
                                    logger.footprint();
                                    next();
                                }
                                done();
                            }
                        );
                    } else {

                        /**
                         * 该商户没有portal
                         */
                        logger.info(domain + " doesn't have a portal. Redirecting to the cloud url");
                        res.redirect(__cloudURL);
                        done();
                    }
                });
            }
        ]);
    });
}

function initErrorHandlers(app) {

    /**
     * Error handler for 404 not found
     */
    app.use(function (req, res, next) {
        var err = new Error('Not Found the requested URL: ' + req.url);
        err.status = 404;
        res.render('error/404', {
            message: err.message,
            error: err
        });
    });

    /**
     * Error handler for 500 Internal Server Error
     */
    app.use(function (err, req, res, next) {
        logger.error(err.toString() + ": " + err.stack);
        res.status(err.status || 500);
        res.render('error/500', {
            message: err.message,
            error: err
        });
    });
}


/*
 * traverse and load the apps
 */
var initControls = function (app) {
    logger.enter();

    var options = {
        followLinks: false,
        filters: [__node_modules_path]
    };

    var walker = require("walk").walk(__apps_path, options);

    walker.on('file', function (root, fileStats, next) {
        var filename = fileStats.name;
        if (filename === "controller.js") {
            logger.debug(root + filename);
            require(root + "/" + filename)(app);
        }
        next();
    }).on('end', function () {
        initErrorHandlers(app);
    });

    return app;
};
