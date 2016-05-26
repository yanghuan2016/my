var config              = require('./config');
var logger              = __logService;
var wechatAPI           = __wechatAPI;

var menu = {
    "button":[
        {
            "type":"click",
            "name":"服药提醒",
            "key":"V1001_REMIND_DRUG"
        },

        {
            "type":"click",
            "name":"送药信息",
            "key":"V1001_DRUG_DELIVERY"
        },

        {
            "type":"click",
            "name":"医生叮嘱",
            "key":"V1001_DOC_ADVICE"
        }
    ]
}

exports.createMenu = function(){
    wechatAPI.createMenu(menu, function(err, result) {
        if(err){
            logger.error('creatMenu is err:', err);
        }
        else {
            logger.debug('menuResult:' + JSON.stringify(result));
        }
    });
};

