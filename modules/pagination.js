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
 * 2015-10-07   zp-romens@issue#102  added some boundary conditions test
 * 2015-10-07   hc-romens@issue#79  added param tableName to makeWhere
 * 2015-10-05   hc-romens@issue#101 redesigned pagination data model
 * 2015-09-26   hc-romens@issue#54  make it more universal
 * 2015-09-15	hc-romens@issue#18	created
 */

module.exports = function() {

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
     * A paginator object looks like below:
     * {
     *     categoryField: "GoodsType",
     *     categoryValue: "西药",
     *     keywordsField: "commonName",
     *     keywordsValue: "感冒",
     *     sortField: "soldPrice",
     *     sortOrder: "asc",       # "asc" or "desc"
     *     pageSize: 10,
     *     page: 2
     * }
     */
    var paginator = {
        /**
         * createaFromReq
         *      create a paginator object from http req
         * @param req
         * @returns
         */
        createFromReq: function (req) {
            logger.enter();
            try {
                var paginator = {
                    categoryField: req.query.categoryField || "",
                    categoryValue: req.query.categoryValue || "",
                    keywordsField: req.query.keywordsField || "",
                    keywordsValue: req.query.keywordsValue || "",
                    tableName:req.query.tableName||"",
                    sortField: req.query.sortField || "",
                    sortOrder: req.query.sortOrder || "",
                    pageSize: parseInt(req.query.pageSize) || 10
                };
                if (req.query.pageSize) {
                    paginator.page = parseInt(req.query.page) || 1;
                } else {
                    paginator.page = 1;
                }
                logger.ndump("paginator", paginator);
                this.validate(paginator);
                return paginator;
            } catch (err) {
                logger.errorWithStack(err);
                throw err;
            }
        },

        /**
         * validate
         *      Validate the data field in a paginator
         * @param paginator object
         * @return true or false
         */
        validate: function(paginator) {
            logger.ndump("paginator", paginator);
            if (!underscore.isNumber(paginator.pageSize) ||
                !underscore.isNumber(paginator.page) ||
                !(paginator.sort.value=='' || paginator.sort.value.toUpperCase()==="ASC" || paginator.sort.value.toUpperCase()==="DESC")) {
                logger.warn("paginator is not a valid pagination object.");
                logger.ndump("paginator", paginator);

                throw "Invalide paginator";

                return false;
            }

            return true;
        },

        /**
         * hasWhere
         *      Check if the paginator needs WHERE clause
         *
         * @param paginator
         */
        hasWhere: function(paginator) {
            return underscore.isEmpty(paginator.categoryField || paginator.keywordsField);
        },

        /**
         * makeOrderByClauseByPaginator
         *      make the order by clause
         * @param pagintor
         * @returns {*}
         */
        makeOrderby: function (paginator) {
            this.validate(paginator);
            var orderby = "";
            if (!underscore.isEmpty(paginator.sortField)) {
                orderby = " ORDER BY ";
                orderby += paginator.sortField;
                var direction = " ASC";
                if (!underscore.isEmpty(paginator.sortOrder) && paginator.sortOrder.toUpperCase() === "DESC") {
                    direction = " DESC"
                }
                orderby += direction;
            }
            logger.ndump("orderby", orderby);
            return orderby;
        },

        /**
         * makeWhereClause
         *      Make the SQL SELECT WHERE clause by the paginator
         *      It generates the where clause with the word "WHERE"
         *
         * @otherConditions the other conditions, including "AND", "OR"
         * @param paginator
         * @param tableName, for the where clause field tablename, only applicable to multiple table join search
         * @return The where clause
         */


        makeWhere: function(paginator, otherConditions, tableName) {
            logger.enter();

            this.validate(paginator);

            var where;
            logger.ndump("otherConditions", otherConditions);
            if ((typeof otherConditions === "string" && otherConditions.trim()!=="") || this.hasWhere )
                where = " WHERE " + (otherConditions || "");

            if (underscore.isEmpty(tableName)) {
                tableName = "";
            }
            else{
                tableName += ".";
            }
            logger.debug(JSON.stringify(paginator));
            /* process categoryField, categoryValue */
            if (!underscore.isEmpty(paginator.categoryValue) && !underscore.isEmpty(paginator.categoryField) ) {
                where += sprintf(" (%s='%s')", tableName + paginator.categoryField,  paginator.categoryValue);
            }

            // go through and split the keywords
            if (! underscore.isEmpty(paginator.keywordsField) && !underscore.isEmpty(paginator.keywordsValue)) {
                var kwList = keywordsToArray(paginator.keywordsValue);
                var keywordsConditions = "";
                Object.keys(kwList).forEach(function(key){
                    keywordsConditions += sprintf(" (%s LIKE '%%%s%%') AND", tableName + paginator.keywordsField, kwList[key]);
                });
                keywordsConditions += " TRUE";
                if ( where.trim()!=='WHERE' && where.trim()!=="") {
                    where += " AND";
                }
                where += keywordsConditions;
            }
            if( where.trim()==='AND' ||
                where.trim()==='WHERE' ||
                where.trim()==='') {
                return '';
            }
            logger.ndump("where", where);
            return where;
        },

        /**
         * makePageClauseByPaginator
         *      make the "limit <offset>,<size>" clause for paging
         * @param paginator
         * @returns {*}
         */
        makeLimit: function(paginator) {
            // compose "LIMIT <offset>,<size>" string
            var page = paginator.page;
            var pageSize = paginator.pageSize;
            var result = " LIMIT ";
            try {
                if (underscore.isNaN(parseInt(paginator.pageSize))){
                    pageSize = 10;
                    page = 1;
                }
                else{
                    pageSize = parseInt(paginator.pageSize);
                    if (underscore.isNaN(paginator.page))
                        page = 1;
                    else
                        page = parseInt(paginator.page);
                }
            } catch (err) {
                logger.errorWithStack(err);
                logger.info("taking default pagination value.");
            }

            var offset = (page - 1) * pageSize;

            result += offset + ", " + pageSize;
            logger.ndump("paging", result);

            return result;
        }
    };

    return paginator;
}

