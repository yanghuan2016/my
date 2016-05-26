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
 * pinyin.js
 */

var _module_name = __filename.replace(/\.js/,"").split("/").pop();

/*
 * init logger
 */
var logger = __logService;

/*
 * init 3rd libs
 */
var underscore = require("underscore");
var py = require("node-pinyin");

/**
 * 翻译中文的拼音首字母，组成字符串返回
 * @param name
 */
var getPinyinInitials = function(name) {
    logger.enter();
    logger.ndump("Get pinyin for name: " + name);

    var pyArray = py(name, {
        heteronym: true,
        style: 'normal'             // node-pinyin在firstLetter模式下，有bug，韵母会带有声调
                                    // py("阿莫西林", { style:'firstLetter'});
                                    // [ [ 'ā' ], [ 'm' ], [ 'x' ], [ 'l' ] ]
    });

    var str = "";
    var removeDup = {};

    function loopIntoArray(s, array, i) {
        if ( i >= array.length ) {
            if (underscore.isUndefined(removeDup[s])) {
                removeDup[s] = true;
                str += s + ','
            }
            return;
        }

        var word = array[i];
        for (var l in word) {
            var r = s + word[l][0];
            var j = i + 1;
            loopIntoArray(r, array, j);
        }
    };

    loopIntoArray(str, pyArray, 0);

    logger.ndump("Pinyin Initials for : " + name + " is [" + str + "]");
    return str;
};

exports.getPinyinInitials = getPinyinInitials;
