module.exports = {
    'login': function (browser) {
        browser
            .url('http://romens.f3322.net:3500/login?nextTo=')
            .waitForElementVisible('body', 1000)
            .maximizeWindow()
            .setValue('input#username', '393581')
            .setValue('input#password', '123456')
            .click("input[type=submit]")
            .waitForElementVisible('i.fa-user', 1000)
            .assert.elementPresent('i.fa-user');
    },
    'user_order':function(browser){
        for(var i=0;i<3;i++){
            browser
                .click("a[href='/goods']")
                .waitForElementVisible("input[placeholder='过滤...']",1000)
                .clearValue("input#quantity_"+i)
                .setValue("input#quantity_"+i,2)//输入数量
                .click("a#goodsToCart_"+i);
            loop(browser,i);
            browser
                .waitForElementVisible("table.page-table",1000)
                .setValue("input#remark_0",'保密')
                .click("button.showNewAddressItem")
                .waitForElementVisible("input#input_address",1000)
                .setValue("input#input_address","张三 美年广场 13224356895")
                .click("a.btnAddAddress")
                .setValue("textarea#cart_remarks","轻放")
                .click("a.submitOrder")//提交订单
                .waitForElementVisible("a[href='/order/ship']",1000);
        }
        browser
            .pause(10000)
            .end();
    }
};
function loop(browser,i){
    browser
        .waitForElementVisible("button[i-id='去结算']",1000,false,function(res){
            if(res.value){
                browser
                    .click("button[i-id='去结算']");
            }else{
                browser
                    .click("button.ui-dialog-autofocus")
                    .waitForElementVisible("input[placeholder='过滤...']",1000)
                    .clearValue("input#quantity_"+(i+1))
                    .setValue("input#quantity_"+(i+1),2)//输入数量
                    .click("a#goodsToCart_"+(i+1));
                i++;
                loop(browser,i);
            }
        })
}
