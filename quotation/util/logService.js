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
var COLOR_BLACK = "color: #000000";
var COLOR_WHITE = "color: #FFFFFF";
var COLOR_RED = "color: #c81724";
var COLOR_GREEN = "color: #5cb85c";
var COLOR_ORANGE = "color: #EC971F";
var COLOR_BLUE = "color: #337ab7";
var COLOR_PURPLE = "color: #b64ad4";
var COLOR_GREEN_BLINK = "color: #449d44";

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
        console.log("%c[%cTRACE%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + JSON.stringify(msg), COLOR_BLACK, COLOR_GREEN, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
    }
}

/*
 * Debug message
 */
function debug(msg) {
    if (DEBUG >= defaultLevel) {
        console.log("%c[%cDEBUG%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + JSON.stringify(msg), COLOR_BLACK, COLOR_ORANGE, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
    }
}

/*
 * Info message
 */
function info(msg) {
    if (INFO >= defaultLevel) {
        console.log("%c[%cINFO%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + JSON.stringify(msg), COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
    }
}

/*
 * Warn message
 */
function warn(msg) {
    if (WARN >= defaultLevel) {
        console.log("%c[%cWARN%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + JSON.stringify(msg), COLOR_BLACK, COLOR_ORANGE, COLOR_BLACK, COLOR_BLUE, COLOR_ORANGE, COLOR_GREEN);
    }
}

/*
 * Error message
 */
function error(msg) {
    if (ERROR >= defaultLevel) {
        console.log("%c[%cERROR%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + JSON.stringify(msg), COLOR_BLACK, COLOR_RED, COLOR_BLACK, COLOR_BLUE, COLOR_RED, COLOR_GREEN);
    }
}

function errorWithStack(err) {
    error("Error: " + err + ", stack trace: " + err.stack);
}


/*
 * Fatal message
 */
function fatal(msg) {
    if (FATAL >= defaultLevel) {
        console.log("%c[%cTRACE%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + JSON.stringify(msg), COLOR_BLACK, COLOR_RED, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
    }
}

/*
 * Enter printout, used at the beginning of a method
 */
function enter() {
    if (TRACE >= defaultLevel) {
        console.log("%c[%cTRACE%c]%c[" + timestamp() + "]%c" + getStackTrace()[1], COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK);
    }
}

/*
 * Leave printout, used at the exit of a method
 */
function leave() {
    if (TRACE >= defaultLevel) {
        console.log("%c[%cTRACE%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + JSON.stringify(arguments), COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
    }
}

/*
 * A footprint, for execution trace
 */
function footprint() {
    if (TRACE >= defaultLevel) {
        console.log("%c[%cTRACE%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + JSON.stringify(arguments), COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
    }
}

function sql(s) {
    if (TRACE >= defaultLevel) {
        console.log("%c[%c" + "SQL" + "%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%cSQL, Executing SQL: " + JSON.stringify(s), COLOR_BLACK, COLOR_GREEN, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
    }
}

function sqlerr(err) {
    if (TRACE >= defaultLevel) {
        console.log("%c[%c" + "SQL Error" + "%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + JSON.stringify(err) + ", %cstack trace: " + err.stack, COLOR_BLACK, COLOR_GREEN, COLOR_BLACK, COLOR_BLUE, COLOR_RED, COLOR_GREEN, COLOR_RED);
    }
}

/*
 * Printout the value of a variable
 */
function dump(obj) {
    if (TRACE >= defaultLevel) {
        if (typeof obj === "object") {
            if (obj instanceof Array) {
                var output = "";
                for (var i in obj) {
                    output += obj[i] + ",";
                }
                if (output[output.length - 1] === ',')
                    output = output.slice(0, -1);
                console.log("%c[%c" + "DUMP" + "%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + "{" + name + ": " + output + "}", COLOR_BLACK, COLOR_ORANGE, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
            }
            else {
                console.log("%c[%c" + "DUMP" + "%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + "{" + name + ": " + JSON.stringify("NULL") + "}", COLOR_BLACK, COLOR_ORANGE, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
                try {
                    Object.keys(obj).forEach(function (key) {
                        console.log("%c" + key + " : " + obj[key], COLOR_GREEN);
                    });
                    console.log("%c}", COLOR_GREEN);
                } catch (TypeError) {
                    console.log("%c" + JSON.stringify(obj), COLOR_GREEN);
                }
            }
        }
        else if (typeof obj === "undefined") {
            console.log("%c[%c" + "DUMP" + "%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + "{" + name + ": " + JSON.stringify("undefined") + "}", COLOR_BLACK, COLOR_ORANGE, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN_BLINK);
        }
        else {
            console.log("%c[%c" + "DUMP" + "%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + "{" + name + ": " + JSON.stringify(obj) + "}", COLOR_BLACK, COLOR_ORANGE, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
        }
    }
}

/*
 * Printout the value of a variable with name
 */
function ndump(name, obj) {
    if (TRACE >= defaultLevel) {
        if (typeof obj !== "string" && typeof obj !== "number" && typeof obj !== "function")
            obj = JSON.stringify(obj);
        console.log("%c[%c" + "ndump" + "%c]%c[" + timestamp() + "]%c" + getStackTrace()[1] + "%c" + "{" + name + ": " + JSON.stringify(obj) + "}", COLOR_BLACK, COLOR_GREEN, COLOR_BLACK, COLOR_BLUE, COLOR_BLACK, COLOR_GREEN);
    }
}

/**
 * Get current time in YYYY-mm-dd HH:MM:SS.ms format
 */
function timestamp() {
    var ts_hms = new Date();
    return ts_hms.getFullYear() + '-' +
        ("0" + (ts_hms.getMonth() + 1)).slice(-2) + '-' +
        ("0" + (ts_hms.getDate() + 1)).slice(-2) + ' ' +
        ("0" + ts_hms.getHours()).slice(-2) + ':' +
        ("0" + ts_hms.getMinutes()).slice(-2) + ':' +
        ("0" + ts_hms.getSeconds()).slice(-2) + '.' +
        ("000" + ts_hms.getMilliseconds()).slice(-3);
}

function getStackTrace() {

    var stack;

    try {
        throw new Error('');
    }
    catch (error) {
        stack = error.stack || '';
    }

    stack = stack.split('\n').map(function (line) {
        return line.trim();
    });
    return stack.splice(stack[0] == 'Error' ? 2 : 1);
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
exports.dump = dump;
exports.ndump = ndump;
exports.sql = sql;
exports.sqlerr = sqlerr;
exports.errorWithStack = errorWithStack;
