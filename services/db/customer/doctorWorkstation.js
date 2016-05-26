var logger = global.__logService;

var sprintf = require("sprintf-js").sprintf;
var underscore = require("underscore");
var moment = require('moment');
var knex = require('knex')({client: 'mysql'});

function DBService(connection) {
    this.connection = connection;
}

// 查询用户信息
DBService.prototype.getDoctorInfoBy_username_password = function (customerDbName, username, password, callback) {
    logger.enter();

    var sql = "" +
        "select " +
        "   doctorId, " +       // 医生编号
        "   name , " +          // 医生姓名
        "   citizenIdNum , " +  // 身份证号
        "   username, " +       // 用户名
        "   createdOn " +       // 帐号创建时间
        "from " +
        "   %s.Doctor " +
        "where " +
        "   username ='%s' and password = '%s'; ";

    sql = sprintf(sql, customerDbName, username, password);
    logger.sql(sql);

    __mysql.query(sql, function (err, results) {
        if (err) {
            logger.error(err);
            return callback(err);
        }
        callback(null, results);
    });
};

// 查询诊断单列表
DBService.prototype.retrieveDiagnosisByDoctorId = function (customerDbName, doctorId, callback) {
    logger.enter();

    var sql = "" +
        "select " +
        "   d.diagnosisId, " +      // 诊断单ID
        "   d.diagnoseDate, " +     // 诊断日期
        "   d.diseaseDescription, " +   // 病情描述
        "   d.diagnosis, " +        // 诊断结果
        "   d.createdOn, " +         // 诊断单创建时间
        "   p.citizenIdNum, " +     // 身份证号
        "   p.patientCardId, " +    // 就诊卡ID
        "   p.name, " +             // 姓名
        "   p.gender, " +              // 性别
        "   p.birthDate, " +        // 出生日期
        "    if(year(curDate())-year(birthDate)=0,18,year(curDate())-year(birthDate)) as age " +        // 年龄
        "from " +
        "   %s.Diagnosis d left join %s.Patient p " +
        "   on d.patientCardId = p.patientCardId " +
        "where " +
        "   d.doctorId = '%s';";
    sql = sprintf(sql, customerDbName, customerDbName, doctorId);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

// 查询诊断单信息
DBService.prototype.retrieveDiagnosisBy_doctorId_diagnosisId = function (customerDbName, doctorId, diagnosisId, callback) {
    logger.enter();

    var sql = "" +
        "select " +
        "   d.diagnosisId           as diagnosisId, " +             // 诊断单ID
        "   d.diagnoseDate          as diagnoseDate  , " +          // 诊断日期
        "   d.diseaseDescription    as diseaseDescription    , " +  // 病情描述
        "   d.diagnosis             as diagnosis , " +              // 诊断结果
        "   d.createdOn             as diagnosisCreatedOn , " +     // 诊断单创建时间
        "   p.citizenIdNum          as citizenIdNum  , " +          // 病人身份证号
        "   p.patientCardId         as patientCardId , " +          // 就诊卡号
        "   p.name                  as name  , " +                  // 姓名
        "   p.gender                as gender   , " +               // 性别
        "   p.birthDate             as birthDate , " +              // 出生日期
        "    if(year(curDate())-year(birthDate)=0,18,year(curDate())-year(birthDate)) as age, " +        // 年龄
        "   pr.prescriptionInfoId   as prescriptionInfoId , " +     // 处方ID
        "   pr.prescriptionType     as prescriptionType , " +       // 处方类型
        "   pr.prescriptionStatus   as prescriptionStatus , " +     // 处方状态
        "   pr.remark               as remark , " +                 // 备注
        "   pr.createdOn            as prescriptionInfoCreatedOn  " +  //处方创建时间
        "from " +
        "           %s.Diagnosis        d " +
        "left join  %s.Patient          p   on d.patientCardId  = p.patientCardId " +
        "left join  %s.PrescriptionInfo pr  on d.diagnosisId    = pr.diagnoseId " +
        "where " +
        "   d.doctorId = '%s' and d.diagnosisId = '%s' " +
        "order by " +
        "   pr.createdOn desc ; ";

    sql = sprintf(sql, customerDbName, customerDbName, customerDbName, doctorId, diagnosisId);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

// 通过处方单号查询诊断信息
DBService.prototype.retrieveDiagnosisByPreDescriptionId = function (customerDbName, prescriptionId, callback) {
    logger.enter();


    var columns = [
            'diagnosisId',
            'patientCardId',
            'doctorId',
            'diagnoseDate',
            'diseaseDescription',
            'diagnosis',
            'Diagnosis.createdOn'
        ],
        sql = knex.withSchema(customerDbName)
            .select(columns)
            .from('PrescriptionInfo')
            .leftJoin('Diagnosis', function () {
                this.on('PrescriptionInfo.diagnoseId', '=', 'Diagnosis.diagnosisId')
            })
            .where('PrescriptionInfo.prescriptionInfoId', prescriptionId)
            .toString();
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

// 根据处方单号更新状态
DBService.prototype.updatePrescriptionStatusByPreDescriptionId = function (customerDbName, prescriptionId, status, callback) {
    logger.enter();

    var sql = knex('PrescriptionInfo')
        .withSchema(customerDbName)
        .where('prescriptionInfoId', '=', prescriptionId)
        .update({
            prescriptionStatus: status
        }).toString();
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        callback(null, result);
    });
}

// 通过处方单号查询患者信息
DBService.prototype.retrievePatientByPreDescriptionId = function (customerDbName, prescriptionId, callback) {
    logger.enter();

    var sql = "" +
        "SELECT " +
        "Patient.patientCardId,  " +
        "citizenIdNum,  " +
        "weChartOpenId,  " +
        "name,  " +
        "gender,  " +
        "birthDate,  " +
        " if(year(curDate())-year(birthDate)=0,18,year(curDate())-year(birthDate)) as age " +
        "" +
        "FROM " +
        "%s.PrescriptionInfo  " +
        "   LEFT JOIN %s.Diagnosis  " +
        "   ON  PrescriptionInfo.diagnoseId=Diagnosis.diagnosisId  " +
        "   LEFT JOIN %s.Patient " +
        "   ON Diagnosis.patientCardId= Patient.patientCardId  " +
        "WHERE PrescriptionInfo.prescriptionInfoId='%s'";

    sql = sprintf(sql, customerDbName, customerDbName, customerDbName, prescriptionId);

    var columns = [
            'Patient.patientCardId',
            'citizenIdNum',
            'weChartOpenId',
            'name',
            'gender',
            'birthDate',
            ' if(year(curDate())-year(birthDate)=0,18,year(curDate())-year(birthDate)) as age '
        ],
        tempSql = knex.withSchema(customerDbName)
            .select(columns)
            .from('PrescriptionInfo')
            .leftJoin('Diagnosis', function () {
                this.on('PrescriptionInfo.diagnoseId', '=', 'Diagnosis.diagnosisId')
            })
            .leftJoin('Patient', function () {
                this.on('Diagnosis.patientCardId', '=', 'Patient.patientCardId')

            })
            .where('PrescriptionInfo.prescriptionInfoId', prescriptionId)
            .toString();
    logger.sql(tempSql);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};


// 查询prescription的信息
DBService.prototype.retrievePrescriptionById = function (customerDbName, prescriptionId, callback) {
    logger.enter();

    var sql = "" +
        "select " +
        "   pi.prescriptionInfoId   as  prescriptionInfoId, " +         // 处方编号
        "   pi.diagnoseId           as  diagnosisId, " +                // 诊断单编号
        "   pi.prescriptionType     as  prescriptionType, " +           // 处方类型
        "   pi.prescriptionStatus   as  prescriptionStatus, " +         // 处方状态
        "   pi.remark               as  remark, " +                     // 备注
        "   pi.createdOn            as  prescriptionInfoCreatedOn, " +  // 处方创建时间
        "   pd.unicode              as  unicode, " +                    // 药品平台编号
        "   pd.dose                 as  dose, " +                       // 每次用量
        "   pd.dailyTimes           as  dailyTimes, " +                 // 用药频率
        "   pd.takeMethods          as  takeMethods, " +                // 用药方式
        "   pd.medicationTime       as  medicationTime, " +             // 用药时间
        "   pd.quantity             as  quantity, " +                   // 购买数量
        "   pd.price                as  price, " +                      // 单价
        "   pd.subtotal             as  subtotal, " +                   // 小计
        "   pd.createdOn            as  prescriptionDetailCreatedOn, " +// 处方详情创建时间
        "   g.id                    as  goodsId, " +                    // 商品编号
        "   g.goodsNo               as  goodsNo, " +                    // 商品货号
        "   g.commonName            as  commonName, " +                 // 通用名
        "   g.pinyinInitials        as  pinyinInitials, " +             // 首拼字母
        "   g.alias                 as  alias, " +                      // 别名
        "   g.licenseNo             as  licenseNo, " +                  // 批准文号
        "   g.spec                  as  spec, " +                       // 规格
        "   g.supplier              as  supplier, " +                   // 供应商
        "   g.birthPlace            as  birthPlace, " +                 // 产地
        "   g.producer              as  producer, " +                   // 厂家
        "   g.measureUnit           as  measureUnit, " +                // 单位
        "   g.imageUrl              as  imageUrl, " +                   // 图像
        "   gp.refRetailPrice       as  refRetailPrice " +              // 零售价
        "from " +
        "           %s.PrescriptionInfo pi " +
        "left join  %s.PrescriptionDetail   pd  on pi.prescriptionInfoId = pd.prescriptionInfoId " +
        "left join  %s.GoodsInfo            g   on pd.unicode = g.unicode " +
        "left join  %s.GoodsPrice           gp  on g.id = gp.goodsId " +
        "where " +
        "   pi.prescriptionInfoId = '%s'; ";

    sql = sprintf(sql, customerDbName, customerDbName, customerDbName, customerDbName, prescriptionId);
    logger.sql(sql)
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};


// 创建 prescriptionInfo
DBService.prototype.createPrescriptionInfo = function (conn, customerDbName, prescriptionInfo, callback) {
    logger.enter();

    logger.ndump('prescriptionInfo', prescriptionInfo);
    var sql = "" +
        "insert into " +
        "   %s.PrescriptionInfo(" +
        "       prescriptionInfoId, " +
        "       diagnoseId, " +
        "       prescriptionType, " +
        "       prescriptionStatus, " +
        "       remark " +
        "   ) " +
        "values " +
        "   ? " +
        "on duplicate key update " +
        "   diagnoseId = values(diagnoseId), " +
        "   prescriptionType = values(prescriptionType), " +
        "   prescriptionStatus = values(prescriptionStatus), " +
        "   remark = values(remark); ";

    sql = sprintf(sql, customerDbName);
    logger.sql(sql);

    conn.query(sql, [prescriptionInfo], function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

// 通过prescriptionInfoId删除prescriptionDetail
DBService.prototype.deletePrescriptionDetail = function (conn, customerDbName, prescriptionInfoId, callback) {
    logger.enter();

    var sql = "" +
        "delete from " +
        "   %s.PrescriptionDetail " +
        "where " +
        "   prescriptionInfoId = '%s';";

    sql = sprintf(sql, customerDbName, prescriptionInfoId);

    logger.sql(sql);

    conn.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

// 插入prescriptionDetail
DBService.prototype.createPrescriptionDetail = function (conn, customerDbName, prescriptionDetail, callback) {
    logger.enter();

    var sql = "" +
        "insert into " +
        "   %s.PrescriptionDetail(" +
        "       prescriptionInfoId, " +
        "       unicode, " +
        "       dose, " +
        "       dailyTimes, " +
        "       takeMethods, " +
        "       medicationTime, " +
        "       quantity, " +
        "       price, " +
        "       subtotal " +
        "   ) " +
        "values " +
        "   ? ";

    sql = sprintf(sql, customerDbName);

    conn.query(sql, [prescriptionDetail], function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

// 通过 prescriptionInfoId 查询 patient 信息
DBService.prototype.retrievePatientByPrescriptionInfoId = function (customerDbName, prescriptionInfoId, callback) {
    logger.enter();

    var sql = "" +
        "select " +
        "   p.citizenIdNum, " +
        "   p.patientCardId, " +
        "   p.weChartOpenId, " +
        "   p.name, " +
        "   p.gender, " +
        "   p.birthDate " +
        "from " +
        "           %s.Patient p " +
        "left join  %s.Diagnosis d          on p.patientCardId = d.patientCardId " +
        "left join  %s.PrescriptionInfo pr  on d.diagnosisId = pr.diagnoseId " +
        "where " +
        "   pr.prescriptionInfoId = '%s'; ";

    sql = sprintf(sql, customerDbName, customerDbName, customerDbName, prescriptionInfoId);
    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }
        logger.ndump('result:', result);
        callback(null, result);
    });
};

// 更新 patient 的 weChartOpenId
DBService.prototype.updatePatientWeChatOpenId = function (customerDbName, patientCardId, weChartOpenId, callback) {
    logger.enter();

    var sql = "" +
        "update " +
        "   %s.Patient " +
        "set " +
        "   weChartOpenId = '%s' " +
        "where " +
        "   patientCardId = '%s'; ";

    sql = sprintf(sql, customerDbName, weChartOpenId, patientCardId);
    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

// 在数据库中查询商品数据
DBService.prototype.retrieveGoodsByCommonName = function (customerDbName, goodsCommonName, goodsName, callback) {
    logger.enter();

    var sql = "" +
        "select " +
        "   g.id                    as  goodsId, " +                    // 商品编号
        "   g.unicode               as  unicode, " +                    //
        "   g.commonName            as  commonName, " +                 // 通用名
        "   g.pinyinInitials        as  pinyinInitials, " +             // 首拼字母
        "   g.alias                 as  alias, " +                      // 别名
        "   g.licenseNo             as  licenseNo, " +                  // 批准文号
        "   g.spec                  as  spec, " +                       // 规格
        "   g.supplier              as  supplier, " +                   // 供应商
        "   g.birthPlace            as  birthPlace, " +                 // 产地
        "   g.producer              as  producer, " +                   // 厂家
        "   g.measureUnit           as  measureUnit, " +                // 单位
        "   g.imageUrl              as  imageUrl, " +                   // 图像
        "   gp.refRetailPrice       as  price " +              // 零售价
        "from " +
        "   %s.GoodsInfo g " +
        "left join %s.GoodsPrice gp on g.id = gp.goodsId " +
        "where " +
        "   g.commonName like '%%%s%%'" +
        "limit 0,20; ";
    sql = sprintf(sql, customerDbName, customerDbName, goodsName);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return callback(error);
        }

        callback(null, result);
    });
};

DBService.prototype.retrievePatientByWeChatOpenId = function (customerDbName, weChatOpenId, f) {
    logger.enter();

    var sql = "" +
        "select " +
        "   citizenIdNum, " +
        "   patientCardId, " +
        "   name, " +
        "   gender, " +
        "   birthDate, " +
        "   if(year(curDate())-year(birthDate)=0,18,year(curDate())-year(birthDate)) as age " +        // 年龄
        "from " +
        "   %s.Patient " +
        "where " +
        "   weChartOpenId = '%s'; ";
    sql = sprintf(sql, customerDbName, weChatOpenId);
    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return f(error);
        }

        f(null, result);
    });
};

DBService.prototype.retrieveLastDiagnosisByPatientCardId = function (customerDbName, patientCardId, f) {
    logger.enter();

    var sql = "" +
        "select " +
        "   diagnosisId, " +
        "   patientCardId, " +
        "   doctorId, " +
        "   diagnoseDate, " +
        "   diseaseDescription, " +
        "   diagnosis, " +
        "   createdOn " +
        "from " +
        "   %s.Diagnosis " +
        "where " +
        "   patientCardId = '%s' " +
        "order by " +
        "   createdOn desc " +
        "limit 1; ";
    sql = sprintf(sql, customerDbName, patientCardId);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return f(error);
        }

        f(null, result);
    });
};

DBService.prototype.retrieveLastPrescriptionByDiagnosisId = function (customerDbName, diagnosisId, f) {
    logger.enter();

    var sql = "" +
        "select " +
        "   prescriptionInfoId, " +
        "   prescriptionType, " +
        "   prescriptionStatus, " +
        "   remark, " +
        "   createdOn " +
        "from " +
        "   %s.PrescriptionInfo " +
        "where " +
        "   diagnoseId = '%s' " +
        "order by " +
        "   createdOn desc " +
        "limit 1; ";
    sql = sprintf(sql, customerDbName, diagnosisId);
    logger.sql(sql);

    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return f(error);
        }

        f(null, result);
    });
};

DBService.prototype.retrievePrescriptionDetailByPrescriptionId = function (customerDbName, prescriptionId, f) {
    logger.enter();

    var sql = "" +
        "select " +
        "   p.id, " +
        "   p.prescriptionInfoId, " +
        "   p.unicode, " +
        "   p.dose, " +
        "   p.dailyTimes, " +
        "   p.takeMethods, " +
        "   p.medicationTime, " +
        "   p.quantity, " +
        "   p.price, " +
        "   p.subtotal, " +
        "   g.id                    as  goodsId, " +                    // 商品编号
        "   g.unicode               as  unicode, " +                    //
        "   g.commonName            as  commonName, " +                 // 通用名
        "   g.pinyinInitials        as  pinyinInitials, " +             // 首拼字母
        "   g.alias                 as  alias, " +                      // 别名
        "   g.licenseNo             as  licenseNo, " +                  // 批准文号
        "   g.spec                  as  spec, " +                       // 规格
        "   g.supplier              as  supplier, " +                   // 供应商
        "   g.birthPlace            as  birthPlace, " +                 // 产地
        "   g.producer              as  producer, " +                   // 厂家
        "   g.measureUnit           as  measureUnit, " +                // 单位
        "   g.imageUrl              as  imageUrl, " +                   // 图像
        "   gp.refRetailPrice       as  price " +              // 零售价
        "from " +
        "   %s.PrescriptionDetail p " +
        "left join %s.GoodsInfo g on p.unicode = g.unicode " +
        "left join %s.GoodsPrice gp on g.id = gp.goodsId " +
        "where " +
        "   prescriptionInfoId = '%s'; ";
    sql = sprintf(sql, customerDbName, customerDbName, customerDbName, prescriptionId);
    logger.sql(sql);
    __mysql.query(sql, function (error, result) {
        if (error) {
            logger.error(error);
            return f(error);
        }
        f(null, result);
    });
};

module.exports = new DBService();

