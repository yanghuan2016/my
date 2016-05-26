var getYYYYMMDD = function (date) {
    date = new Date(date);
    if (date) {
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    } else {
        return "";
    }
};
var getYYYYMMDDHHMMSS = function (date) {
    date = new Date(date);
    if (date) {
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '  ' + date.getHours() + ":" + date.getMinutes();
    } else {
        return "";
    }
};
var transition = function (date) {
    date = new Date(date);
    if (date > 0) {
        var intervalSec = date / 1000;
        var day = parseInt(intervalSec / 3600 / 24);
        var hour = parseInt((intervalSec - day * 24 * 3600) / 3600);
        var min = parseInt((intervalSec - day * 24 * 3600 - hour * 3600) / 60);
        var minutes = parseInt(intervalSec - day * 24 * 3600 - hour * 3600 - min * 60);
        return day + '天' + hour + '小时' + min + '分钟' + minutes + "秒";
    } else {
        return "";
    }
};
var dateFormatter = function (endDate) {
    var date = new Date(endDate) - new Date();
    if (date > 0) {
        var intervalSec = date / 1000;
        var day = parseInt(intervalSec / 3600 / 24);
        var hour = parseInt((intervalSec - day * 24 * 3600) / 3600);
        var min = parseInt((intervalSec - day * 24 * 3600 - hour * 3600) / 60);
        var minutes = parseInt(intervalSec - day * 24 * 3600 - hour * 3600 - min * 60);
        return day + '天' + hour + '小时' + min + '分钟' + minutes + "秒";
        //return day + '天' + hour + '小时' + min + '分';
    } else {
        return false;
    }
};

module.exports.getYYYYMMDD = getYYYYMMDD;
module.exports.getYYYYMMDDHHMMSS = getYYYYMMDDHHMMSS;
module.exports.transition = transition;
module.exports.dateFormatter = dateFormatter;