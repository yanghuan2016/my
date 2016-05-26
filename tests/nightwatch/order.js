module.exports = {
    'login': function (browser) {
        browser
            .url('http://romens.f3322.net:3400/login?nextTo=%2F')
            .waitForElementVisible('body', 1000)
            .maximizeWindow()
            .setValue('input#username', 'hc')
            .setValue('input#password', '123456')
            .click('input[type=submit]')
            .waitForElementVisible('body', 1000)
            .assert.elementPresent('i.fa-user');
    },
    'order':function(browser){
       browser
           .click("div.pull-left a[href='/goods']")
           .waitForElementVisible("input[placeholder='过滤...']",1000)
           .clearValue("input#quantity_2")
           .setValue("input#quantity_2",10)//输入数量
           .click("a#goodsToCart_2")
           .waitForElementVisible("table.ui-dialog-grid",1000)
           .click("button[i-id='继续逛']")
           .waitForElementVisible("input[placeholder='过滤...']",1000)
           .clearValue("input#quantity_3")
           .setValue("input#quantity_3",10)//输入数量
           .click("a#goodsToCart_3")
           .waitForElementVisible("table.ui-dialog-grid",1000)
           .click("button[i-id='去结算']")
           .waitForElementVisible("table.page-table",1000)
           .setValue("input#remark_0",'保密')
           .setValue("input#remark_1",'保密')
           .click("button.showNewAddressItem")
           .waitForElementVisible("input#input_address",1000)
           .setValue("input#input_address","张三 美年广场 13224356895")
           .click("a.btnAddAddress")
           .setValue("textarea#cart_remarks","轻放")
           .click("a.submitOrder")//提交订单
           .waitForElementVisible("a[href='/order/ship']",1000)
           .click("div.container a[href='/order']")
           .waitForElementVisible("input[placeholder='请输入订单编号...']",1000)
            .pause(10000);
            //.end();
    }
};
