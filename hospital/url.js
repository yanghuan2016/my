/**
 * url for request server
 * @constructor
 */
function Constant() {

    var PROTOCOL = 'http://';
    var PORT = '80';
    var HOST = 'wx.romenscd.cn';

    var http_header = PROTOCOL + HOST + ':' + PORT;

    return {
        authenticationUrl: http_header + '/doctorWorkstation/authentication',
        getPatientListUrl: http_header + '/doctorWorkstation/doctor/doctorId/diagnosis',
        getDiagnosisDetailUrl: http_header + '/doctorWorkstation/doctor/doctorId/diagnosis',
        getQrcodeUrl: http_header + '/doctorWorkstation/prescription/QRCode/prescriptionId',

        getGoodsUrl: http_header + '/doctorWorkstation/goods', /* 搜索 */
        postPrescriptionUrl: http_header + '/doctorWorkstation/doctor/doctorId/diagnosis/diagnosisId/prescription', /* 保存处方单　*/
        postPrescriptionDetailUrl: http_header + '/doctorWorkstation/doctor/doctorId/diagnosis/diagnosisId/prescription/prescriptionId', /* 处方单详情　*/


        weChatRecipeUrl:http_header + '/doctorWorkstation/prescription',   /* 微信处方单信息　*/
        getOrderDataUrl:http_header + '/doctorWorkstation/sendGrab', //获取要配送需要的商品数据
        postGrabSrcUrl:'http://romenscd.cn:4500/m/api',     //处方单数据发送到要配送的url
        postUpdatePrescriptionStatus: http_header+'/doctorWorkstation/prescriptionInfo/updateStatus'
    };
}

module.exports = Constant;