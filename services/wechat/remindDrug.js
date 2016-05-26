var wechatAPI = __wechatAPI;
var logger = __logService;
var docWorkstationDB = require('./../../apps/doctorWorkstation/model');

// TODO:需要接口（传递openid得到处方内容）
var setRemindDrugInfo = function (customerDbName, openid) {
    logger.enter('setRemindDrugInfo');
    docWorkstationDB.retrieveNearlyPrescriptionInfoByWeChatOpenId(customerDbName, openid, function (err, result) {
        if (err) {
            logger.error(err);
        }
        console.log('setRemindDrugInfo:' + JSON.stringify(result));
        var name = result.patient.name;
        var prescriptionInfoId = result.prescriptionInfo.prescriptionInfoId;
        var commonName = result.prescriptionDetail[0].commonName;
        var takeMethods = result.prescriptionDetail[0].takeMethods;
        var dose = result.prescriptionDetail[0].dose;
        var dailyTimes = result.prescriptionDetail[0].dailyTimes;
        var medicationTime = result.prescriptionDetail[0].medicationTime;

        logger.ndump('name', name);
        logger.ndump('prescriptionInfoId', prescriptionInfoId);
        logger.ndump('commonName', commonName);
        logger.ndump('takeMethods', takeMethods);
        logger.ndump('dose', dose);
        logger.ndump('dailyTimes', dailyTimes);
        logger.ndump('medicationTime', medicationTime);


        var data = {
            "first": {
                "value": '亲爱的' + name + ':\n您的处方编号：' + prescriptionInfoId + ' 请按时服药！',
                "color": "#173177"
            },
            "keyword1": {
                "value": takeMethods + medicationTime + '日' + '  ' + dailyTimes + '次/日',
                "color": "#173177"
            },
            "keyword2": {
                "value": commonName + '×' + dose,
                "color": "#173177"
            },
            "remark": {
                "value": "多喝温水，注意休息，祝您早日康复！",
                "color": "#173177"
            }
        };

        //logger.ndump('data', data);

        wechatAPI.sendTemplate(openid, 'O9kfOzKTc9x72f0uqw121FJpzK5LxGEYK0h7ThnKego', null, data, function (err, result) {
            if (err) {
                logger.ndump('err:', err);
            }
            logger.ndump('result:', result);
        });
    })
};

exports.pushMsg = function (customerDbName, openid) {
    setRemindDrugInfo(customerDbName, openid);
};
