$(function(){
    /*TODO 字段有些需要更改*/
    /*http://ihealth.yiyao365.cn/index.php/GetInfoByPZWH/GetValueFromZhunzi.html?PZWH=%E5%9B%BD%E8%8D%AF%E5%87%86%E5%AD%97H20043171
    * （申请日期）APPLYDATE: "2010-09-21"
     BARCODE: null
     （本位码）BWM: "86902529000137"
     CLASSID: "501e36b4-69d5-4763-8583-d7c21d01a62a"
     （英文名字）ENGLISHNAME: "Ketoconazole Cream"
     （产地）FACTORYADDRESS: "西安市万寿北路34号"
     （生产企业）FACTORYNAME: "西安杨森制药有限公司"
     （规格）GG: "10g:0.2g"
     （ＩＤ）GUID: "4dfcbc6b3eeb4b018ad776ecb2df0761"
     （图片ｕｒｌ）IMGPATH: "conew_30018_small.jpg"
     （禁忌）JJ: ""
     （药品名）MEDICINETITLE: "酮康唑乳膏"
     MEMO: ""
     （注意事项）MEMO2: "1.避免接触眼睛和其他黏膜（如口、鼻等）。2.用药部位如有烧灼感、红肿等情况应停药，并将局部药物洗净，必要时向医师咨询。3.不得用于皮肤破溃处。4.不宜大面积使用。5.股癣患者，勿穿紧贴内裤或化纤内裤，在外用乳膏剂时可散布撒布剂（如痱子粉）。6.足癣患者，浴后将皮肤揩干，特别是趾间。宜穿棉纱袜，每天更换。鞋应透气，散布撒布剂或抗真菌粉剂于趾间、足、袜和鞋中，每日1次或2次。7.为减少复发，对体癣、股癣和花斑癣，疗程至少需要2-4周。8.孕妇及哺乳期妇女应在医师指导下使用。9.对本品过敏者禁用，过敏体质者慎用。10.本品性状发生改变时禁止使用。11.请将本品放在儿童不能接触的地方。12.儿童必须在成人监护下使用。13.如正在使用其他药品，使用本品前请咨询医师或药师。"
     （旧的批准文号）OLDPZWH: ""
     （参考价格）PRICE: "14.9~25"
     （品牌）PRODUCTNAME: ""
     （批准文号）PZWH: "国药准字H20043171"
     （类型）TYPE: "化学药品"
     （药物相互作用）XHZY: "如与其他药物同时使用可能会发生药物相互作用，详情请咨询医师或药师。"
     （药理毒理）YLDL: ""

     (不良反应)BLFY: "可见刺痛或其他刺激症状，偶见瘙痒等过敏反应。"
     （用法用量）YFYL: "局部外用，取本品适量涂于患处。一日2～3次。为减少复发，体癣、股癣、花斑癣及皮肤念珠菌病，应连续使用2～4周，手足癣应连续使用4～6周。"
     （储藏方法）ZCFF: ""
     （功能主治）ZZ: "用于手癣、足癣、体癣、股癣及花斑癣及皮肤念珠菌病。"
     （剂型）JX: "乳膏剂"
     * */

    $("input[name='goods-pzwh']").blur(function(){
        var licenseNo = this.value;
        var loadingPic=$('#loadingPic');
        getGoodsDetail(licenseNo,loadingPic, function (data) {
            var goodsInfo = (data == "")? "" : data[0];
            if (goodsInfo != "") {
                var goodsDetail = "[性状]: " + goodsInfo.JX + "\n\n[主治功能]: " + goodsInfo.ZZ +
                    "\n\n[用法用量]: " + goodsInfo.YFYL +
                    "\n\n[不良反应]: " + goodsInfo.BLFY + "\n\n[禁忌]: " + goodsInfo.JJ +
                    "\n\n[注意事项]: " + goodsInfo.MEMO2 + "\n\n[药物相互作用]: " + goodsInfo.XHZY +
                    "\n\n[药理毒理]: " + goodsInfo.YLDL + "\n\n[贮藏]: " + goodsInfo.ZCFF +
                    "\n\n[包装]: " + goodsInfo.GG + "\n\n[生产企业]:" +
                    "\n企业名称: " + goodsInfo.FACTORYNAME +
                    "\n生产地址: " + goodsInfo.FACTORYADDRESS;
                var productName = $("#product_name");
                if(!productName.val()){
                    productName.val(goodsInfo.MEDICINETITLE);
                }
                var factorySelect = $("#factory");
                if(!factorySelect.val()){
                    factorySelect.val(goodsInfo.FACTORYNAME);
                }
                var selfSelectText = $(".self-select-text");
                if(!selfSelectText.text()){
                    selfSelectText.text(goodsInfo.TYPE);
                }
                var barcodeSelect = $("#barcode");
                if(!barcodeSelect.val()){
                    barcodeSelect.val(goodsInfo.BAECODE);
                }
                var imageUrlSelect = $("#imageUrl");
                if(!imageUrlSelect.attr("src")){
                    imageUrlSelect.attr("src", "http://files.yunuo365.com/" + goodsInfo.IMGPATH);
                }
                var goodsDetailsSelect = $("#goodsDetails");
                if(!goodsDetailsSelect.val()){
                    goodsDetailsSelect.val(goodsDetail);
                }
            }
        });
    });

});

function getGoodsDetail(licenseNo,loadingPic, callback){
    if(licenseNo == ""){
        callback("");
        return;
    }
    var reg = new RegExp(/国药准字/);
    if(!reg.test(licenseNo)){
        licenseNo = "国药准字" + licenseNo;
    }
    var url = "http://ihealth.yiyao365.cn/index.php/GetInfoByPZWH/GetValueFromZhunzi.html?PZWH="+licenseNo;
    $.ajax({
        type: "get",
        url: url,
        data: {},
        dataType: "jsonp",
        jsonpCallback: "callback",
        beforeSend:function(){
            loadingPic.css('display','inline-block');
            loadingPic.parents('td').css('width',699);
        },
        complete:function(){
            loadingPic.css('display','none');

        },
        success: function (data) {
            callback(data);
        }
    });
}