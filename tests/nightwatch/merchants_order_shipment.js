module.exports = {
    'login': function (browser) {
        browser
            .url('http://romens.f3322.net:3400/login?nextTo=%2F')
            .waitForElementVisible('body', 1000)
            .maximizeWindow()
            .setValue('input#username', 'sm')
            .setValue('input#password', '123456')
            .click('input[type=submit]')
            .waitForElementVisible('body', 1000)
            .assert.elementPresent('i.fa-user');
    },
    'merchants_order_shipment':function(browser){
        browser
            .click("div#sidebar a[href='/customer/order']")
            .waitForElementVisible("input[placeholder='请输入客户名...']",1000)
            .moveToElement("div.filter_status",10,10)
            .click("li.filter_status_2 a")//选择待发货
            .waitForElementVisible("input[placeholder='请输入客户名...']",1000);
        loop(browser);//循环点击审核按钮
    }
};
function loop(browser){
    browser
        .waitForElementVisible("a[data-original-title='发货']",1000,false,function(res){
            if(res.value){
                browser
                    .click("a[data-original-title='发货']")
                    .waitForElementVisible("input.inputLogisticsCompany",1000)
                    .setValue("input.inputLogisticsCompany","申通快递")
                    .setValue("input.inputLogisticsNo",Math.floor(Math.random()*10000000000000))
                    .click("a.customerShipOrder")
                    .waitForElementVisible("textarea#artText",1000)
                    .setValue("textarea#artText","宝贝即将发货，请耐心等待")
                    .click("button[i-id='确定']")
                    .waitForElementVisible("input.inputLogisticsCompany",1000)
                    .click("div#sidebar a[href='/customer/order']")//单击订单管理
                    .waitForElementVisible("input[placeholder='请输入客户名...']",1000)
                    .moveToElement("div.filter_status",10,10)
                    .click("li.filter_status_2 a")//选择待发货
                    .waitForElementVisible("input[placeholder='请输入客户名...']",1000);
                loop(browser);
            }else{
                browser
                    .pause(10000)
                    .end();
            }
        });
}
