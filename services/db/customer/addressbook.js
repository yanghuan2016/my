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
 * database service module: addressbook.js
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-25    hc-romens@issue#45
 * 2015-09-25    xdw-romens@issue#46
 *
 */
module.exports=function(){

    /**
     * system service handles
     */
    var logger = global.__logService;
    var db = global.__mysql;

    /**
     * 3rd party modules
     */
    var sprintf = require("sprintf-js").sprintf;
    var underscore = require("underscore");
    var knex = require('knex')({client: "mysql"});

    /**
     * SQL for customer DB, abbr. SQL_CT_***
     */
    var SQL_CT_ADDRESS_SELECT_BY_CLIENTID = "SELECT id, clientId,detailAddress " +
                                 "FROM %s.ClientAddress " +
                                 "WHERE clientId=%d;";

    var SQL_CT_ADDRESS_INSERT  = "INSERT INTO %s.ClientAddress ( clientId, detailAddress) " +
        "VALUES ( %d, '%s');";

    var SQL_CT_DEFAULT_ADDRESS_UPDATE_TO_CLIENT  = "UPDATE %s.Client SET defaultAddressId = %d" +
                                                    "WHERE id=%d;";

    var SQL_CT_ADDRESS_DELETE_BY_ID    = "DELETE FROM %s.ClientAddress WHERE id=%d;";

    var SQL_CT_ADDRESS_UPDATE_BY_ID    = "UPDATE %s.ClientAddress SET detailAddress = '%s' " +
                                        "WHERE id=%d;";

    /**
     * DB Service provider
     */
    var dbService = {

        /**
         * add Address
         *      add address data to database
         * @param customerDBName
         * @param clientId
         * @param detailAddress
         * @param callback
         */
        addAddress: function (customerDBName, clientId, detailAddress, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_ADDRESS_INSERT, customerDBName, clientId, detailAddress);

            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.insertId);
                }
            })

        },

        /**
         * 添加新地址信息
         * @param customerDB
         * @param clientId
         * @param addrInfo
         * @param callback
         */
        addAddressInfo: function(customerDB, addrInfo, callback) {
            logger.enter();

            var sql = knex.withSchema(customerDB).insert(addrInfo).into('ClientAddress');

            logger.sql(sql.toString());

            __mysql.query(sql.toString(), function (error, addrData) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, addrData);
                }
            });
        },

        /**
         * 获取地址通过地址ID
         * @param customerDB
         * @param addrId
         * @param callback
         */
        getAddressInfoById: function(customerDB, addrId, callback) {
            logger.enter();
            var column = ['clientId', 'receiver', 'telNum', 'mobileNum', 'postCode',
                'provinceFirstStage', 'citySecondStage', 'countiesThirdStage', 'detailAddress', 'remark',
                'updatedOn', 'createdOn'];
            var sql = knex.withSchema(customerDB).select(column)
                .from('ClientAddress').where('id', addrId);

            logger.sql(sql.toString());
            /* start to query */
            __mysql.query(sql.toString(), function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * 更新地址信息通过地址ID
         * @param customerDB
         * @param addressId
         * @param addrInfo
         * @param callback
         */
        updateAddressInfo: function(customerDB, addressId, addrInfo, callback) {
            logger.enter();
            var sql = knex.withSchema(customerDB).table('ClientAddress')
                .where('id', addressId).update(addrInfo);

            logger.sql(sql.toString());
            /* start to query */
            __mysql.query(sql.toString(), function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * 删除地址信息通过地址ID
         * @param customerDB
         * @param addressId
         * @param callback
         */
        delAddressInfoById: function(customerDB, addressId, callback) {
            logger.enter();
            var sql = knex.withSchema(customerDB).table('ClientAddress')
                .where('id', addressId).del();

            logger.sql(sql.toString());
            /* start to query */
            __mysql.query(sql.toString(), function (err, results) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * list Address
         *      find  address data from database, specified by clientId
         * @param customerDBName
         * @param clientId
         * @param callback
         */
        listAddress: function (customerDBName, clientId, callback) {
            logger.enter();
            var sql = sprintf(SQL_CT_ADDRESS_SELECT_BY_CLIENTID, customerDBName, clientId);
            logger.sql(sql);
            /* start to query */
            __mysql.query(sql, function (err, results, fields) {
                logger.enter();
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                } else {
                    callback(err, results);
                }
            });
        },

        /**
         * 获取地址列表详情
         * @param customerDBName
         * @param clientId
         * @param callback
         */
        listAddressDetail: function (customerDB, clientId, callback) {
            logger.enter();

            var column = ['ADDR.id', 'ADDR.clientId', 'CLI.clientName', 'ADDR.receiver', 'ADDR.telNum',
                'ADDR.mobileNum', 'ADDR.postCode', 'ADDR.provinceFirstStage', 'ADDR.citySecondStage',
                'ADDR.countiesThirdStage', 'ADDR.detailAddress', 'ADDR.remark', 'ADDR.updatedOn', 'ADDR.createdOn'];

            var sql = knex.withSchema(customerDB).select(column).from("ClientAddress AS ADDR")
                .innerJoin('Client AS CLI', 'ADDR.clientId', 'CLI.id')
                .where('ADDR.clientId', clientId);

            logger.sql(sql.toString());

            __mysql.query(sql.toString(), function (error, addrList) {
                if (error) {
                    logger.sqlerr(error);
                    callback(error);
                } else {
                    callback(null, addrList);
                }
            });

        },

        /**
         * delete Address
         *      delete address data from database, specified by addressId
         * @param customerDBName
         * @param addressId
         * @param callback
         */
        deleteAddress: function (customerDBName, addressId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_ADDRESS_DELETE_BY_ID, customerDBName, addressId);
            logger.sql(sql);

            /* execute sql */
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });

        },

        /**
         *  update AddressDetail
         *      update address data from database, specified by addressId
         * @param customerDBName
         * @param addressId
         * @param detailAddress
         * @param callback
         */
        updateAddressDetail: function (customerDBName, addressId, detailAddress, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_ADDRESS_UPDATE_BY_ID, customerDBName, detailAddress, addressId);
            logger.sql(sql);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err);
                } else {
                    callback(err, result.affectedRows);
                }
            });
        },

        setDefaultAddressId: function (customerDBName, addressId, clientId, callback) {
            logger.enter();

            var sql = sprintf(SQL_CT_DEFAULT_ADDRESS_UPDATE_TO_CLIENT, customerDBName, addressId, clientId);
            __mysql.query(sql, function (err, result) {
                if (err) {
                    logger.sqlerr(err);
                    callback(err)
                } else {
                    callback(err, result.changedRows);
                }

            });
        },
        transactionInsertClientAddress: function (connection, customerDbName, insertObj, callback) {
            logger.enter();

            var sql = "" +
                "insert into %s.ClientAddress(" +
                "   clientId, receiver, telNum, mobileNum, postCode, provinceFirstStage, citySecondStage, countiesThirdStage, detailAddress, remark)" +
                "values(%d, '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s'); ";
            sql = sprintf(sql, customerDbName,
                insertObj.clientId,
                insertObj.receiver,
                insertObj.telNum,
                insertObj.mobileNum,
                insertObj.postCode,
                insertObj.provinceFirstStage,
                insertObj.citySecondStage,
                insertObj.countiesThirdStage,
                insertObj.detailAddress,
                insertObj.remark
            );

            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        },
        transactionUpdateClientAddressFromErp: function (connection, customerDbName, updateObj, callback) {
            logger.enter();
            //updateObj = {
            //    defaultAddressId: defaultAddressId,
            //    receiver: clientItemInfo.defaultAddressReceiver,
            //    telNum: clientItemInfo.defaultAddressTelNum,
            //    mobileNum: clientItemInfo.defaultAddressMobileNum,
            //    postCode: clientItemInfo.defaultAddressPostCode,
            //    provinceFirstStage: clientItemInfo.defaultAddressProvinceFirstStage,
            //    citySecondStage: clientItemInfo.defaultAddressCitySecondStage,
            //    countiesThirdStage: clientItemInfo.defaultAddressCountiesThirdStage,
            //    detailAddress: clientItemInfo.defaultAddressDetailAddress,
            //    remark: clientItemInfo.defaultAddressRemark
            //};
            var sql = "" +
                "update %s.ClientAddress " +
                "set " +
                "   receiver = '%s', " +
                "   telNum = '%s', " +
                "   mobileNum = '%s'," +
                "   postCode = '%s', " +
                "   provinceFirstStage = '%s'," +
                "   citySecondStage = '%s'," +
                "   countiesThirdStage = '%s'," +
                "   detailAddress = '%s', " +
                "   remark = '%s' " +
                "where id = %d; ";
            sql = sprintf(sql,
                customerDbName,
                updateObj.receiver,
                updateObj.telNum,
                updateObj.mobileNum,
                updateObj.postCode,
                updateObj.provinceFirstStage,
                updateObj.citySecondStage,
                updateObj.countiesThirdStage,
                updateObj.detailAddress,
                updateObj.remark,
                updateObj.defaultAddressId
            );

            connection.query(sql, function (error, result) {
                if (error) {
                    logger.error(error);
                    return callback(error);
                }

                callback(null, result);
            });
        }

    };

    return dbService;
}