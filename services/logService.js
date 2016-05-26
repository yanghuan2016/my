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
 * logService.js
 *      scc's logger library
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-16    hc-romens@issue#18     created
 *
 */

/* Levels */
var TRACE = 0;
var DEBUG = 1;
var INFO = 2;
var WARN = 3;
var ERROR = 4;
var FATAL = 5;

/* Terminal Colors */
var COLOR_WHITE     = '\033[0m';
var COLOR_RED       = '\033[31m';
var COLOR_GREEN     = '\033[32m';
var COLOR_ORANGE    = '\033[33m';
var COLOR_BLUE      = '\033[34m';
var COLOR_PURPLE    = '\033[35m';
var COLOR_GREEN_BLINK = '\033[32;5m';

var defaultLevel = TRACE;

/*
 * An empty function for backward compatibility
 */
function getLogger(name) {

}

/*
 * Get the current level
 * @return level in int
 */
function getLevel() {
    return defaultLevel;
}

/*
 * Set the Log level
 * @param level
 */
function setLevel(level) {
    switch (level.toUpperCase()) {
        case 'TRACE':
            level = TRACE;
            break;
        case 'DEBUG':
            level = DEBUG;
            break;
        case 'INFO' :
            level = INFO;
            break;
        case 'WARN':
        case 'WARNING':
            level = WARN;
            break;
        case 'ERROR':
            level = ERROR;
            break;
        case 'FATAL':
            level = FATAL;
            break;
    }
    console.log("Set log level to " + level);
    defaultLevel = level;
}

/*
 * Trace message
 */
function trace(msg) {
    if (TRACE >= defaultLevel) {
        printMsg(COLOR_GREEN, "TRACE", msg);
    }
}

/*
 * Debug message
 */
function debug(msg) {
    if (DEBUG >= defaultLevel) {
        printMsg(COLOR_ORANGE, "DEBUG", msg);
    }
}

/*
 * Info message
 */
function info(msg) {
    if (INFO >= defaultLevel) {
        printMsg(COLOR_WHITE, "INFO", msg);
    }
}

/*
 * Warn message
 */
function warn(msg) {
    if (WARN >= defaultLevel) {
        printMsg(COLOR_BLUE, "WARN", msg);
    }
}

/*
 * Error message
 */
function error(msg) {
    if (ERROR >= defaultLevel) {
        printMsg(COLOR_PURPLE, "ERROR", msg);
    }
}

function errorWithStack(err) {
    if (ERROR >= defaultLevel) {
        printMsg(COLOR_PURPLE, "ERRORWITHSTACK", "Error: " + err + ", stack trace: " + err.stack);
    }
}


/*
 * Fatal message
 */
function fatal(msg) {
    if (FATAL >= defaultLevel) {
        printMsg(COLOR_RED, "FATAL", msg);
    }
}

/*
 * Enter printout, used at the beginning of a method
 */
function enter(arg) {
    if (TRACE >= defaultLevel) {
        var stack = require("stack-trace").get();
        var caller = stack[1];

        console.log("[" + COLOR_GREEN + "ENTER" + COLOR_WHITE + "][" + timestamp() + "][" + caller.getFileName().replace(__base, '') + "#" + caller.getLineNumber() + "@<" + caller.getFunctionName() + ">] " + COLOR_GREEN + "Enter <" + caller.getFunctionName() + ">(" + JSON.stringify(arg) + ") ..." + COLOR_WHITE);
    }
}

/*
 * Leave printout, used at the exit of a method
 */
function leave(arg) {
    if (TRACE >= defaultLevel) {
        var stack = require("stack-trace").get();
        var caller = stack[1];
        console.log("[" + COLOR_GREEN + "TRACE" + COLOR_WHITE + "][" + timestamp() + "][" + caller.getFileName().replace(__base, '') + "#" + caller.getLineNumber() + "@<" + caller.getFunctionName() + ">] " + COLOR_GREEN + "Leave <" + caller.getFunctionName() + ">(" + JSON.stringify(arg) + ") ..." + COLOR_WHITE);
    }
}

/*
 * A footprint, for execution trace
 */
function footprint() {
    if (TRACE>=defaultLevel) {
        var stack = require("stack-trace").get();
        var caller = stack[1];
        console.log("[" + COLOR_GREEN + "TRACE" + COLOR_WHITE + "][" + timestamp() + "][" + caller.getFileName().replace(__base, '') + "#" + caller.getLineNumber() + "@<" + caller.getFunctionName() + ">] " + COLOR_GREEN_BLINK + "FOOTPRINT" + COLOR_WHITE);
    }
}

function notImplemented() {
    if (TRACE>=defaultLevel) {
        var stack = require("stack-trace").get();
        var caller = stack[1];
        console.log("[" + COLOR_GREEN + "TRACE" + COLOR_WHITE + "][" + timestamp() + "][" + caller.getFileName().replace(__base, '') + "#" + caller.getLineNumber() + "@<" + caller.getFunctionName() + ">] " + COLOR_GREEN_BLINK + "!!! NOT IMPLEMENTED !!!" + COLOR_WHITE);
    }
}

function sql(s) {
    if (TRACE>=defaultLevel) {
        printMsg(COLOR_BLUE, "SQL", "Executing SQL: " + s);
    }
}

function sqlerr(err) {
    if (ERROR >= defaultLevel) {
        printMsg(COLOR_PURPLE, "ERROR", "SQL Error: " + err + ", stack trace: " + err.stack);
    }
}

/*
 * Printout the value of a variable
 */
function dump(obj) {
    if (TRACE>=defaultLevel) {
        if (typeof obj === "object") {
            if (obj instanceof Array) {
                var output = "";
                for (var i in obj) {
                    output += obj[i] + ",";
                }
                if (output[output.length - 1] === ',')
                    output = output.slice(0, -1);
                printMsg(COLOR_ORANGE, "DUMP", COLOR_GREEN + "VARIABLE: [" + output + "]" + COLOR_WHITE);
            }
            else {
                printMsg(COLOR_ORANGE, "DUMP", COLOR_GREEN + "VARIABLE: {");
                try {
                    Object.keys(obj).forEach(function (key) {
                        console.log("                                                             " + COLOR_GREEN + key + " : " + obj[key] + COLOR_WHITE);
                    });
                    console.log("                                                           " + COLOR_GREEN + "}" + COLOR_WHITE);
                } catch (TypeError) {
                    console.log("                                                           " + COLOR_GREEN + obj + COLOR_WHITE);
                }
            }
        }
        else if (typeof obj === "undefined") {
            printMsg(COLOR_ORANGE, "DUMP", COLOR_GREEN + "VARIABLE: " + COLOR_GREEN_BLINK + "undefined" + COLOR_WHITE);
        }
        else {
            printMsg(COLOR_ORANGE, "DUMP", COLOR_GREEN + "VARIABLE: " + obj + COLOR_WHITE);
        }
    }
}

/*
 * Printout the value of a variable with name
 */
function ndump(name,obj) {
    if (TRACE>=defaultLevel) {
        if (typeof obj !== "string" && typeof obj !== "number" && typeof obj !== "function")
            obj = JSON.stringify(obj);

        printMsg(COLOR_ORANGE, "DUMP", COLOR_GREEN + "VARIABLE<" + name + ">: " + obj + COLOR_WHITE);
    }
    return;
}

/**
 * Get current time in YYYY-mm-dd HH:MM:SS.ms format
 */
function timestamp() {
    var ts_hms = new Date();
    return  ts_hms.getFullYear() + '-' +
            ("0" + (ts_hms.getMonth() + 1)).slice(-2) + '-' +
            ("0" + (ts_hms.getDate() + 1)).slice(-2) + ' ' +
            ("0" + ts_hms.getHours()).slice(-2) + ':' +
            ("0" + ts_hms.getMinutes()).slice(-2) + ':' +
            ("0" + ts_hms.getSeconds()).slice(-2) + '.' +
            ("000" + ts_hms.getMilliseconds()).slice(-3);
}

/**
 * printMsg
 * @param color
 * @param level
 * @param msg
 */
function printMsg(color, level, msg) {
    var stack = require("stack-trace").get();
    var caller = stack[2];
    console.log("[" + color + level + COLOR_WHITE + "][" + timestamp() + "][" + caller.getFileName().replace(__base,'') + "#" + caller.getLineNumber() + "@<" + caller.getFunctionName() + ">] " + color + msg + COLOR_WHITE);
}

/*
 *  Exports
 */
exports.getLogger = getLogger;
exports.getLevel = getLevel;
exports.setLevel = setLevel;
exports.trace = trace;
exports.debug = debug;
exports.info = info;
exports.warn = warn;
exports.error = error;
exports.fatal = fatal;
exports.timestamp = timestamp;
exports.enter = enter;
exports.leave = leave;
exports.footprint = footprint;
exports.notImplemented = notImplemented;
exports.dump = dump;
exports.ndump = ndump;
exports.sql = sql;
exports.sqlerr = sqlerr;
exports.errorWithStack = errorWithStack;
