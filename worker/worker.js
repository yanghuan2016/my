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
 * worker.js
 *      scc's workers
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 *
 */

module.exports = function() {

    /* 3rd party modules */
    var underscore = require('underscore');

    /**
     * Services
     **/
    var logger = __logService;
    var dbService = __dbService;
    var mqService = __mqService;


    var worker = {
        go: function () {
            mqService.popTask(function switchTask(taskInfo, done) {
                logger.enter();
                logger.ndump("taskInfo", taskInfo);

                switch (taskInfo.taskType) {
                    /* This is a Goods import task */
                    case mqService.TaskTypes.TaskTypeImportGoodsXLS:
                        this.importGoods(taskInfo.xlsFilename);
                        break;

// TODO:
                    /* This is a Client import task */
                    case mqService.TaskTypes.TaskTypeImportClientXLS:
                        break;
// TODO
                    /* This is a SMS send task */
                    case mqService.TaskTypes.TaskTypeSendSMS:
                        break;
// TODO
                    /* this is an email post task */
                    case mqService.TaskTypes.TaskTypePostEmail:
                        break;

                    /* This task is not supported yet! */
                    default:
                        logger.error("Unknown task type: " + taskInfo.taskType);
                        break;
                }

                done();

            });
        }
    };
    worker = underscore.extend(worker, require(__dirname + "/clientsImporter.js")());
    worker = underscore.extend(worker, require(__dirname + "/goodsImporter.js")());
    worker = underscore.extend(worker, require(__dirname + "/switchToDelivered.js")());
    return worker;

};