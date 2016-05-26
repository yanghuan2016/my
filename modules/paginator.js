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
 * pagination.js
 *
 * --------------------------------------------------------------
 * 2015-10-16   hc-romens@issue#217 optimiazed pagination
 * 2015-10-07   zp-romens@issue#102 added some boundary conditions test
 * 2015-10-07   hc-romens@issue#79  added param tableName to makeWhere
 * 2015-10-05   hc-romens@issue#101 redesigned pagination data model
 * 2015-09-26   hc-romens@issue#54  make it more universal
 * 2015-09-15	hc-romens@issue#18	created
 */

var _module_name = __filename.replace(/\.js/,"").split("/").pop();
var logger = __logService;
/**
 * Service
 */
var logger = __logService;

/**
 * 3rd party modules
 */
var underscore = require("underscore");
var sprintf = require("sprintf-js").sprintf;
var keywordsToArray = require("keywords-array");

/**
 * Paginator constructor
 *
 * @param categoryList, a category list, contains:
 *              field, value, tableName(with customerDBName part)
 * @param keywordList, a keyword object list, contains:
 *              field, value, tableName(with customerDBName part)
 * @param sort, a sort object, contains:
 *              field, value, tableName(with customerDBName part)
 * @param page
 * @param pageSize
 * @constructor
 */
function Paginator(categoryList, keywordList, sort, page, pageSize) {
    logger.enter();
    this.categoryList   = categoryList;
    this.keywordList    = keywordList;
    this.sort           = sort;
    this.page           = page;
    this.pageSize       = pageSize;
}

/**
 * where
 *      make the SQL where clause by the paginator
 * @param otherConditions
 *
 * @returns {*}
 */
Paginator.prototype.where = function(otherConditions,findGoodsNo) {
    logger.enter();

    logger.ndump("categoryList", this.categoryList);
    logger.ndump("keywordList", this.keywordList);
    logger.ndump("sort", this.sort);
    logger.ndump("page", this.page);
    logger.ndump("pageSize", this.pageSize);
    logger.ndump("findGoodsNo", findGoodsNo);
    var where = ' WHERE ';
    if(otherConditions && otherConditions.trim()!=='') {
        where += (otherConditions || "") + " AND ";
    }
    var categoryCondition = "";

    // loop the categories
    for (var i in this.categoryList) {
        var cateObj = this.categoryList[i];
        logger.ndump("cateObj", cateObj);
        if (underscore.isUndefined(cateObj.field) || underscore.isUndefined(cateObj.value))
            continue;

        var field = ((cateObj.tableName) ? cateObj.tableName + "." : "") + cateObj.field;

        if(typeof cateObj.value =='number') {
            if(cateObj.value==1){
                categoryCondition += sprintf(" (%s = %d) AND", field, cateObj.value);
            }else{
                categoryCondition += sprintf(" ((%s = 0)OR (%s = 1) OR %s is NULL) AND", field,field, field);
            }
        }else if(typeof cateObj.value == 'string') {
            if (!underscore.isEmpty(cateObj.value)) {
                if(cateObj.field==="goodsType"&&cateObj.value==="%"){
                    categoryCondition += sprintf(" (%s LIKE '%%%s%%' OR %s is  NULL) AND", field, cateObj.value, field);

                }else{
                    categoryCondition += sprintf(" (%s LIKE '%%%s%%') AND", field, cateObj.value);
                }
            }
        }
    }
    // append a true to enclose "AND"
    where += categoryCondition;
    logger.ndump("where", where);

    // loop the keywords
    var keywordsCondition = "";
    for (var i in this.keywordList) {
        var keywordObj = this.keywordList[i];
        logger.ndump("keywordObj", keywordObj);
        if (!underscore.isUndefined(keywordObj.field) && !underscore.isUndefined(keywordObj.value)) {
            var type = typeof keywordObj.value;
            if(type == 'string'){
                var kwList = keywordsToArray(keywordObj.value);
                var field = ((keywordObj.tableName) ? keywordObj.tableName + "." : "") +
                    keywordObj.field;
                Object.keys(kwList).forEach(function (key) {
                    if (!underscore.isEmpty(kwList[key])) {
                        if (underscore.isUndefined(findGoodsNo) || findGoodsNo==false) {
                            keywordsCondition += sprintf(" (%s LIKE '%%%s%%') AND", field, kwList[key]);
                        }
                        if (!underscore.isUndefined(findGoodsNo) && findGoodsNo=="goodsSort"){
                            keywordsCondition += sprintf(" (%s LIKE '%%%s%%' OR goodsNo LIKE '%%%s%%' " +
                                "OR alias LIKE '%%%s%%' OR producer LIKE '%%%s%%' ) AND",
                                field, kwList[key],kwList[key],kwList[key],kwList[key]);
                        }
                        if (!underscore.isUndefined(findGoodsNo) && findGoodsNo=="clientName"){
                            keywordsCondition += sprintf(" (%s LIKE '%%%s%%' OR Client.clientName LIKE '%%%s%%' ) AND",
                                field, kwList[key],kwList[key]);
                        }
                        if(!underscore.isUndefined(findGoodsNo)&&findGoodsNo=="ReturnListclientFilter"){
                            keywordsCondition += sprintf(" (%s LIKE '%%%s%%' OR displayReturnId LIKE '%%%s%%' " +
                                "OR displayOrderId LIKE '%%%s%%' OR Client.clientName LIKE '%%%s%%' ) AND",
                                field, kwList[key],kwList[key], kwList[key], kwList[key]);
                        }
                        if (!underscore.isUndefined(findGoodsNo) && findGoodsNo == "shipInfo") {
                            keywordsCondition += sprintf(" (%s LIKE '%%%s%%' OR displayShipId LIKE '%%%s%%' " +
                                "OR displayOrderId LIKE '%%%s%%' OR Client.clientName LIKE '%%%s%%') AND",
                                field, kwList[key], kwList[key], kwList[key], kwList[key]);
                        }
                    }
                });
            }else if (type == 'number') {
                var field = ((keywordObj.tableName) ? keywordObj.tableName + "." : "") + keywordObj.field;
                keywordsCondition += sprintf(" (%s = %d) AND", field, keywordObj.value);
            }

            where += keywordsCondition;
        }
    }

    if (where.trim() === "WHERE")
        where = "";
    else
        where += " TRUE ";
    logger.ndump("where", where);
    return where;

};

/**
 * make order by clause
 * @returns {string}
 */
Paginator.prototype.orderby = function() {
    logger.enter();

    var orderby = "";
    var orderObj = this.sort;

    if (!underscore.isEmpty(this.sort.field)) {

        orderby = " ORDER BY ";

        orderby += (underscore.isEmpty(orderObj.tableName)?"":(orderObj.tableName+".")) + orderObj.field;

        var direction = " ASC";
        if (!underscore.isEmpty(orderObj.value) && orderObj.value.toUpperCase() === "DESC") {
            direction = " DESC"
        }
        orderby += direction;
    }
    logger.ndump("orderby", orderby);
    return orderby;
};

/**
 * make limit clause
 * @returns {string}
 */
Paginator.prototype.limit = function(){
    // compose "LIMIT <offset>,<size>" string
    var page = this.page;
    var pageSize = this.pageSize;
    var result = " LIMIT ";
    try {
        if (underscore.isNaN(parseInt(pageSize))){
            pageSize = 10;
            page = 1;
        }
        else{
            pageSize = parseInt(pageSize);
            if (underscore.isNaN(page))
                page = 1;
            else
                page = parseInt(page);
        }
    } catch (err) {
        logger.errorWithStack(err);
        logger.info("taking default pagination value.");
    }

    var offset = (page - 1) * pageSize;

    result += offset + ", " + pageSize;
    logger.ndump("paging", result);

    return result;
};

module.exports = Paginator;


