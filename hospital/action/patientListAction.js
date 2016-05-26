/*
 *  患者列表action
 */
var Dispatcher = require('dispatcher');
var constants = require('base/constants');
var Action = require('util/action');
var logger = require('util/logService');
var RestService = require('util/restService');
var Url = require('base/url')();
var history = require('base/history');
var cookie = require('util/cookieUtil');

module.exports = {
    getPatientList: function (doctroId) {
        if (doctroId === '') {
            logger.error('no doctorId!');
            return;
        }
        logger.enter();
        var url = Url.getPatientListUrl.replace('doctorId', doctroId);
        var service = new RestService(url);
        service.findAll(function (feedback) {
            logger.trace(feedback);
            if (feedback.status == 200) {
                Dispatcher.dispatch(new Action(constants.GET_PATIENT_LIST, feedback));
            } else {
                Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, '出错了，请刷新重试'));
            }
        })
    },

    /* 通过　diagnosisId　诊断单号　获取该病人当前选择的诊断单的信息　*/
    getPatientDiagnosisInfo: function (diagnosisId, doctorId) {
        var url = Url.getDiagnosisDetailUrl.replace('doctorId', doctorId);
        var service = new RestService(url);
        service.find(diagnosisId, function (feedback) {
            try {
                if (feedback.status == '200') {
                    cookie.setItem('diagnosisId', feedback.data.diagnosis[0].diagnosisId);
                    Dispatcher.dispatch(new Action(constants.GET_CURRENT_PATIENT_DIAGNOSIS_INFO_SUCCESS, feedback.data.diagnosis));
                    history.pushState(null, '/home');
                } else {
                    Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, '出错了，请刷新重试'));
                }
            } catch (err) {
                Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, '出错了，请刷新重试'));
            }
        })
    },

    //　对患者列表做本地过滤
    filter: function (keywords) {
        Dispatcher.dispatch(new Action(constants.FILTER_PATIENT, {keywords: keywords}));
    },
    /* 通过　输入的商品名称获取商品信息　*/
    searchProduct: function (value) {
        var service = new RestService(Url.getGoodsUrl + '?search=' + value);
        service.findAll(function (feedback) {
            if (feedback && feedback.status == '200') {
                Dispatcher.dispatch(new Action(constants.SEARCH_PRODUCT_SUCCESS, feedback.data.goods));
            } else {
                Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, '出错了，请刷新重试'));
            }
        })
    },

    /*　清除搜索的数据　*/
    clearProduct: function () {
        Dispatcher.dispatch(new Action(constants.SEARCH_PRODUCT_SUCCESS, []));
    },

    /*　清除处方列表数据　*/
    clearReciptList: function () {
        Dispatcher.dispatch(new Action(constants.CLEAR_RECIPR_LIST, []));
    },

    /*　获取处方单的详情　*/
    getReciptDetail: function (prescriptionId, doctorId, diagnosisId) {
        var url = Url.postPrescriptionDetailUrl.replace(/doctorId/, doctorId).replace(/diagnosisId/, diagnosisId).replace(/prescriptionId/, prescriptionId);
        var service = new RestService(url);
        service.findAll(function (feedback) {
            if (feedback.status == '200') {
                history.pushState(null, '/detail');
                if (feedback.data.prescription.length > 0) {
                    Dispatcher.dispatch(new Action(constants.GET_RECIPTDETAIL, feedback.data.prescription));
                }
            } else {
                Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, '出错了，请刷新重试'));
            }
        });
    },

    /*　添加一条处方单 */
    addRecipeOne: function (unicode) {
        Dispatcher.dispatch(new Action(constants.ADD_RECIPEONE, unicode));
    },

    /*　删除一条处方单 */
    deleteOneProduct: function (unicode) {
        Dispatcher.dispatch(new Action(constants.DELETE_ONE_RECIPEONE, unicode));
    },

    /*　修改一条处方单的用法用量 */
    setTakeMethods: function (key, value, unicode) {
        Dispatcher.dispatch(new Action(constants.SET_TAKE_METHODS, {key: key, value: value, unicode: unicode}));
    },

    /*　保存处方单的用法用量 */
    saveRecipeList: function (info, doctorId, diagnosisId) {
        var msg = validate(info.prescriptionDetail);
        if (msg) {
            Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, msg));
        } else {
            var url = Url.postPrescriptionUrl.replace(/doctorId/, doctorId).replace(/diagnosisId/, diagnosisId);
            var service = new RestService(url);
            service.post({prescription: info}, function (feedback) {
                if (typeof feedback === 'string') {
                    feedback = JSON.parse(feedback);
                }
                if (feedback.status == '200') {
                    Dispatcher.dispatch(new Action(constants.SAVE_RECIPR_LIST));
                } else {
                    Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, '出错了，请刷新重试'));
                }
            })
        }
    }
};

//验证
var validate = function (data) {
    for (var index = 0; index < data.length; index++) {
        var tempOne = data[index];
        var keys = _.keys(tempOne);
        for (var item = 0; item < keys.length; item++) {
            var temp = keys[item];
            if (validateRegex[temp] && !validateRegex[temp].regExp.test(tempOne[temp])) {
                return validateRegex[temp].msg;
            }
        }
    }
    return "";
};

var validateRegex = {
    'quantity': {
        regExp: new RegExp(/^[1-9]\d*$/),
        msg: '取药数量格式不对，应该为数字'
    }
};