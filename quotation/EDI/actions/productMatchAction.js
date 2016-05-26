/**
 * buyer productMatchAction
 */
var Dispatcher = require('ediDispatcher');
var actionConstants = require('ediConstants/constants');
var Action = require('util/action');
var logger = require('util/logService');

var RestService = require('util/restService');
var Url = require('edi/constantsUrl')();
//引入history,用于跳转页面
var history = require('js/history');

module.exports = {
    getCurrentProductList: function () {
        var service = new RestService(Url.buyer.getProductListUrl);
        service.findAll(function (feedback) {
            feedback = {
                status: '200',
                msg: '',
                data: [
                    {
                        id: 37,
                        commonName: '鱼跃手杖910型',
                        alias: '鱼跃手杖910型',
                        spec: '810型',
                        barcode: '123456abc',
                        goodsNo: 'werwer234',
                        drugsType: '粉装',
                        isPrescriptionDrugs: 1,
                        licenseNo: '辽食药监械（准）字2013第312660178号13',
                        supplier: '成都雨诺',
                        birthPlace: '四川成都',
                        producer: '江苏鱼跃医疗设备股份有限公司',
                        imageUrl: 'http://files.yunuo365.com/images/conew_5100399028_small.jpg'
                    },
                    {
                        id: 38,
                        commonName: '鱼跃手杖810型',
                        alias: '鱼跃手杖810型',
                        spec: '810型',
                        barcode: '123456abc',
                        goodsNo: '4040202027',
                        drugsType: '粉装',
                        isPrescriptionDrugs: 1,
                        licenseNo: '辽食药监械（准）字2013第312660178号13',
                        supplier: '成都雨诺',
                        birthPlace: '四川成都',
                        producer: '江苏鱼跃医疗设备股份有限公司',
                        imageUrl: 'http://files.yunuo365.com/images/conew_1170203038_small.jpg'
                    },
                    {
                        id: 39,
                        commonName: '鱼跃手杖810型',
                        alias: '鱼跃手杖810型',
                        spec: '810型',
                        barcode: '123456abc',
                        goodsNo: '4040202027',
                        drugsType: '粉装',
                        isPrescriptionDrugs: 1,
                        licenseNo: '辽食药监械（准）字2013第312660178号13',
                        supplier: '成都雨诺',
                        birthPlace: '四川成都',
                        producer: '江苏鱼跃医疗设备股份有限公司',
                        imageUrl: 'http://files.yunuo365.com/images/conew_1170203038_small.jpg'
                    },
                    {
                        id: 40,
                        commonName: '鱼跃手杖810型',
                        alias: '鱼跃手杖810型',
                        spec: '810型',
                        barcode: '123456abc',
                        goodsNo: '4040202027',
                        drugsType: '粉装',
                        isPrescriptionDrugs: 1,
                        licenseNo: '辽食药监械（准）字2013第312660178号13',
                        supplier: '成都雨诺',
                        birthPlace: '四川成都',
                        producer: '江苏鱼跃医疗设备股份有限公司',
                        imageUrl: 'http://files.yunuo365.com/images/conew_1170203038_small.jpg'
                    }
                ]
            };
            if (results.status == "200") {
                Dispatcher.dispatch(new Action(actionConstants.GET_PRODUCT_LIST_SUCCESS, feedback.data));
            } else {
                Dispatcher.dispatch(new Action(actionConstants.GET_PRODUCT_LIST_ERROR, feedback.msg));
            }
        });
    },

    getCurrentProductListFromClouds: function () {
        var service = new RestService(Url.buyer.getProductListFromCloudsUrl);
        service.findAll(function (feedback) {
            feedback = {
                status: '200',
                msg: '',
                data: [
                    {
                        id: 37,
                        commonName: '鱼跃手杖910型',
                        alias: '鱼跃手杖910型',
                        spec: '810型',
                        barcode: '123456abc',
                        drugsType: '粉装',
                        isPrescriptionDrugs: 1,
                        licenseNo: '辽食药监械（准）字2013第312660178号13',
                        supplier: '成都雨诺',
                        birthPlace: '四川成都',
                        producer: '江苏鱼跃医疗设备股份有限公司',
                        imageUrl: 'http://files.yunuo365.com/images/conew_5100399028_small.jpg'
                    },
                    {
                        id: 38,
                        commonName: '鱼跃手杖810型',
                        alias: '鱼跃手杖810型',
                        spec: '810型',
                        barcode: '123456abc',
                        drugsType: '粉装',
                        isPrescriptionDrugs: 1,
                        licenseNo: '辽食药监械（准）字2013第312660178号13',
                        supplier: '成都雨诺',
                        birthPlace: '四川成都',
                        producer: '江苏鱼跃医疗设备股份有限公司',
                        imageUrl: 'http://files.yunuo365.com/images/conew_1170203038_small.jpg'
                    },
                    {
                        id: 39,
                        commonName: '鱼跃手杖810型',
                        alias: '鱼跃手杖810型',
                        spec: '810型',
                        barcode: '123456abc',
                        drugsType: '粉装',
                        isPrescriptionDrugs: 1,
                        licenseNo: '辽食药监械（准）字2013第312660178号13',
                        supplier: '成都雨诺',
                        birthPlace: '四川成都',
                        producer: '江苏鱼跃医疗设备股份有限公司',
                        imageUrl: 'http://files.yunuo365.com/images/conew_1170203038_small.jpg'
                    },
                    {
                        id: 40,
                        commonName: '鱼跃手杖810型',
                        alias: '鱼跃手杖810型',
                        spec: '810型',
                        barcode: '123456abc',
                        drugsType: '粉装',
                        isPrescriptionDrugs: 1,
                        licenseNo: '辽食药监械（准）字2013第312660178号13',
                        supplier: '成都雨诺',
                        birthPlace: '四川成都',
                        producer: '江苏鱼跃医疗设备股份有限公司',
                        imageUrl: 'http://files.yunuo365.com/images/conew_1170203038_small.jpg'
                    }
                ]
            };
            if (results.status == "200") {
                Dispatcher.dispatch(new Action(actionConstants.GET_PRODUCT_LIST_FROM_CLOUDS_SUCCESS, feedback.data));
            } else {
                Dispatcher.dispatch(new Action(actionConstants.GET_PRODUCT_LIST_FROM_CLOUDS_ERROR, feedback.msg));
            }
        });
    }
};