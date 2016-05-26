/**
 * 微信-Action
 * Created by time on 16-5-13.
 */

var Dispatcher = require('dispatcher');
var Action = require('util/action');
var logger = require('util/logService');

var RestService = require('util/restService');
var Url = require('base/url')();
//引入history,用于跳转页面
var history = require('base/history.js');
var constants = require('base/constants.js');
require('plugin/jquery.base64.min.js');
var WeChatStore = require('stores/weChatStore');

var WechatAction = {
    getCustomerRecipe:function(recipeId){
        var url = Url.weChatRecipeUrl;
        var service = new RestService(url);
        service.find(recipeId,function (feedback) {
            console.log(feedback.status);
            if(feedback.status ===200){
                Dispatcher.dispatch(new Action(constants.GETRECIPE_INFO, feedback.data));
            }
        })
    },
    pickUpInfo:function(){
        var url = Url.getPatientListUrl;
        var service = new RestService(url);
        service.findAll(function () {
            var data = {};
            data.pickUpInfo = {
                address:'成都市高新区天府大道30号幸福大药房',
                dates:'8:00-17:00',
                phone:'028-88888888',
                payment:29
            };
            data.goods = [{
                goodsName:"海王牌金樽片",
                goodsNumber:3
            },
                {
                    goodsName:"黄氏颗粒（无蔗糖）",
                    goodsNumber:2
                },
                {
                    goodsName:"绿A天然螺旋藻片",
                    goodsNumber:4
                }];
            Dispatcher.dispatch(new Action(constants.PICKUP_INFO, data));
        })
    },
    getOrderData:function(prescriptionId){
        var url = Url.getOrderDataUrl;
        var service = new RestService(url);
        service.find(prescriptionId,function (feedback) {
            console.log(feedback);
            if(feedback.status==200){
                Dispatcher.dispatch(new Action(constants.GET_ORDERINFO, feedback.data));
            }else{
                Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, "出错了,请重试"));
            }
        });
    },
    updatePrescriptionStatus:function(prescriptionId,status,desturl){
        var url=Url.postUpdatePrescriptionStatus;
        var service = new RestService(url+'/'+prescriptionId);
        service.post({status:status},function(feedback){
            feedback=JSON.parse(feedback);
             if(feedback.status==200){
                 history.pushState(null,desturl);
             }else{
                 Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, "出错了,请重试"));
             }
        });
    }
    ,
    submitAddress: function (data,pId) {
        var msg=validate(data);
        if(msg){
            Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, msg));
            return;
        }
        var _self=this,
            grabSrcUrl=Url.postGrabSrcUrl;
        var service = new RestService(grabSrcUrl);
        var OrderInfo=WeChatStore.getOrderData();
        var  consumer={
                name: data.receiver,               //# 消费者姓名，必填
                telNum: data.phoneNum,       //# 手机号码，必填
                postcode:"",           //# 邮编，可为空，如有则传
                provinceFirstStage:"",  //# 国标收货地址第一级：省，直辖市，可为空，如有则传
                citySecondStage:"",     //# 国标收货地址第二级：市，可为空，如有则传
                countiesThirdStage:"",       //# 国标收货地址第三级：县，镇，村，可为空，如有则传
                detailAddress:data.detailAddress,//# 详细收货地址，必填
                remark:"",      //# 消费者备注，可为空，如有则传
                "longitude": "104.25247",
                "latitude": "30.575319"
        };

        var postData={
            UserGuid:OrderInfo.userId,
            QueryType:"ORDER_CREATE",
            Params:{
                orderData: {
                    orderInfo: OrderInfo.orderInfo,
                    orderDetails: OrderInfo.orderDetails,
                    consumer: consumer
                }
            }
        };
        console.log('传递的数据');
        console.log(JSON.stringify(postData));
        console.log(postData);

        service.post(postData,function(feedback){
            console.log(feedback);
            console.log(feedback.retcode);
            var data=null;
            try{
                data=JSON.parse(feedback);
                if(data.retcode==200){
                    //改变处方单的状态
                    _self.updatePrescriptionStatus(pId,'COD','/cod/'+pId);
                }else{
                    Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, "出错了,请重试"));
                }
            }catch(e){
                Dispatcher.dispatch(new Action(constants.VALIDATE_ERROR, "出错了,请重试"));
            }

        });

    }
    
};

//验证
var validate = function (data) {
    var keys = _.keys(data);
    for (var item = 0; item < keys.length; item++) {
        var temp = keys[item];
        if (!validateRegex[temp].regExp.test(data[temp])) {
            return validateRegex[temp].msg;
        }
    }
    return "";
};

var validateRegex = {
    'receiver': {
        regExp: new RegExp('^\\S+$'),
        msg: '请输入收货人姓名'
    },
    'phoneNum': {
        regExp: new RegExp('^1[3578]\\d{9}$'),
        msg: '请输入合法的电话号码'
    },
    'provinceAddress': {
        regExp: new RegExp('^\\S+$'),
        msg: '请输入省市区'
    },
    'detailAddress':{
        regExp: new RegExp('^\\S+$'),
        msg: '请输入收货人姓名'
    }
};

module.exports = WechatAction;
