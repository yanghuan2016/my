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
    'merchants_return_check':function(browser){
        browser
            .click("div#sidebar a[href='/customer/return?']")
            .waitForElementVisible("input[placeholder='请输入客户名...']",1000)
            .moveToElement("div.filterStatus",10,10)
            .click("li.filterStatus_1 a")//选择退货待审核
        .waitForElementVisible("input[placeholder='请输入客户名...']",1000);
        loop(browser);//循环点击审核按钮
    }
};
function loop(browser){
    browser
        .waitForElementVisible("i[data-original-title='审核']",1000,false,function(res){
            if(res.value){
                browser
                    .click("a i[data-original-title='审核']")
                    .waitForElementVisible("button[action='APPROVED']",1000)
                    .click("button[action='APPROVED']")
                    .waitForElementVisible("table.ui-dialog-grid",1000)
                    .setValue("textarea#artText",'保密')
                    .click("button[i-id='确定']")
                    .click("div#sidebar a[href='/customer/return?']")//单击订单管理
                    .waitForElementVisible("input[placeholder='请输入客户名...']",1000)
                    .moveToElement("div.filterStatus",10,10)
                    .click("li.filterStatus_1 a")//选择退货待审核
                    .waitForElementVisible("input[placeholder='请输入客户名...']",1000);
                loop(browser);
            }else{
                browser
                    .pause(10000)
                    .end();
            }
        });
}

