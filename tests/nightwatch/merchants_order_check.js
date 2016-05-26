module.exports = {
    'login': function (browser) {
        browser
            .url('http://romens.f3322.net:3500/login?nextTo=%2F')
            .waitForElementVisible('body', 1000)
            .maximizeWindow()
            .setValue('input#username', 'sm')
            .setValue('input#password', '123456')
            .click('input[type=submit]')
            .waitForElementVisible('body', 1000)
            .assert.elementPresent('i.fa-user');
    },
    'merchants_order_check':function(browser){
        browser
            .click("div#sidebar a[href='/customer/order']")
            .waitForElementVisible("input[placeholder='请输入客户名...']",1000)
            .moveToElement("div.filter_status",10,10)
            .click("li.filter_status_1 a")//选择待审核
            .waitForElementVisible("input[placeholder='请输入客户名...']",1000);
        loop(browser);//循环点击审核按钮
    }
};
function loop(browser){
    browser
        .waitForElementVisible("table.page-table a[data-original-title='审核']",1000,false,function(res){
            if(res.value){
                browser
                    .click("a[data-original-title='审核']")
                    .waitForElementVisible("a[status='APPROVED']",1000)
                    .click("a[status='APPROVED']")
                    .waitForElementVisible("table.ui-dialog-grid",1000)
                    .setValue("textarea#artText",'保密')
                    .click("button[i-id='确定']")
                    .waitForElementVisible("table.ui-dialog-grid",1000,false,function(res){
                        if(res.value){
                            browser
                                .click("button.ui-dialog-autofocus")
                                .waitForElementVisible("a[status='REJECTED']",1000)
                                .click("a[status='REJECTED']")
                                .setValue("textarea#artText",'库存不足')
                                .click("button[i-id='确定']")
                                .waitForElementVisible("a.btn-primary",1000)
                        }else{
                            browser
                                .waitForElementVisible("div.PendingStatusContent",1000)
                        }

                    })
                    .click("div#sidebar a[href='/customer/order']")//单击订单管理
                    .waitForElementVisible("input[placeholder='请输入客户名...']",1000)
                    .moveToElement("div.filter_status",10,10)
                    .click("li.filter_status_1 a")//选择待审核
                    .waitForElementVisible("input[placeholder='请输入客户名...']",1000);
                loop(browser);
            }else{
                browser
                    .pause(10000)
                    .end();
            }
        });
}
