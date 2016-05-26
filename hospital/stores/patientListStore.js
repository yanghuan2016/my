/**
 * 患者store
 */
var Dispatcher = require('dispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var constants = require('base/constants');
var CHANGE_EVENT = 'change';
var logger = require('util/logService');

var patientList = [
    {
        diagnosisId: '',             // 诊断单ID
        diagnoseDate: '',          // 诊断日期
        diseaseDescription: '',  // 病情描述
        diagnosis: '',              // 诊断结果
        diagnosisCreatedOn: '',      // 诊断单创建时间
        citizenIdNum: '',          // 病人身份证号
        patientCardId: '',           // 就诊卡号,
        name: '',                  // 姓名,
        gender: '',                  // 性别
        birthDate: '',              // 出生日期
        age: '',         // 年龄
        prescriptionInfoId: '',       // 处方ID
        prescriptionType: '',        // 处方类型
        prescriptionStatus: '',     // 处方状态
        remark: '',                 // 备注
        prescriptionInfoCreatedOn: ''  //处方创建时间
    }
];
var currentPatientList = [];
var patientCurrentDiagnosisInfo = [];

var patientStore = assign({}, EventEmitter.prototype, {
    // Emit Change event
    emitChange: function () {
        this.emit(CHANGE_EVENT);
    },
    // Add change listener
    addChangeListener: function (callback) {
        this.on(CHANGE_EVENT, callback);
    },
    // Remove change listener
    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    getPatientList: function () {
        return currentPatientList;
    },

    /* 获取当前病人的诊断信息　*/
    getCurrentPatentDiagnosisInfo: function () {
        logger.trace(patientCurrentDiagnosisInfo);
        var aSelectOne = patientCurrentDiagnosisInfo[0];
        if (aSelectOne && aSelectOne.name) {
            return {
                name: aSelectOne.name,
                gender: aSelectOne.gender,
                age: aSelectOne.age,
                patientCardId: aSelectOne.patientCardId,
                diagnoseDate: aSelectOne.diagnoseDate,
                diseaseDescription: aSelectOne.diseaseDescription
            }
        }
        return {};
    },

    /* 获取当前病人的诊断单列表　*/
    getCurrentPatentDiagnosisInfoList: function () {
        return _.map(patientCurrentDiagnosisInfo, function (item) {
            return {
                key: item.prescriptionInfoId,
                prescriptionInfoId: item.prescriptionInfoId,
                prescriptionInfoCreatedOn: item.prescriptionInfoCreatedOn,
                prescriptionStatus: item.prescriptionStatus
            }
        })
    }

});

Dispatcher.register(function (action) {

    switch (action.type) {

        case constants.GET_PATIENT_LIST:
            if (action.data && action.data.status == 200) {
                patientList = action.data.data.diagnosis;
                _.map(patientList, function (item) {
                    item.key = item.diagnosisId;
                });
                currentPatientList = patientList;
            }
            break;

        /*　获取当前的病人的诊断单信息　*/
        case constants.GET_CURRENT_PATIENT_DIAGNOSIS_INFO_SUCCESS:
            logger.trace(action);
            patientCurrentDiagnosisInfo = action.data;
            break;

        case constants.FILTER_PATIENT:
            patientFilter(action.data.keywords);
            break;
        default:
            return true;
    }
    patientStore.emitChange();
    return true;
});

function patientFilter(keywords) {
    keywords = keywords.trim();
    if (keywords === '') {
        currentPatientList = patientList;
        return;
    }
    if (patientList && (patientList.length > 0)) {
        currentPatientList = [];
        currentPatientList = _.filter(patientList, function (item) {
            return (item.name.indexOf(keywords) !== -1);
        })
    }
}

module.exports = patientStore;