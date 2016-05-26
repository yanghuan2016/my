module.exports = {
    'login': function (browser) {
        browser
            .url('http://romens.f3322.net:3400/login?nextTo=')
            .waitForElementVisible('body', 1000)
            .maximizeWindow()
            .setValue('input#username', 'sm')
            .setValue('input#password', '123456')
            .click('input[type=submit]')
            .waitForElementVisible('i.fa-user', 1000)
            .assert.elementPresent('i.fa-user');
    },
    'merchants_return_receiving':function(browser){
        browser
            .click("div#sidebar a[href='/customer/return?']")
            .waitForElementVisible("input[placeholder='请输入客户名...']",1000)
            .moveToElement("div.filterStatus",10,10)
            .click("li.filterStatus_4 a");//选择退货已发货
        loop(browser);
    }
};
function loop(browser){
    browser
        .waitForElementVisible("a i[data-original-title='确认收货']",1000,false,function(res){
            if(res.value){
                browser
                    .click("a i[data-original-title='确认收货']")
                    .waitForElementVisible("button[action='DELIVERED']",1000)
                    .click("button[action='DELIVERED']")
                    .waitForElementVisible("table.ui-dialog-grid",1000)
                    .click("button[i-id='确定']")
                    .click("div#sidebar a[href='/customer/return?']")
                    .waitForElementVisible("input[placeholder='请输入客户名...']",1000)
                    .moveToElement("div.filterStatus",10,10)
                    .click("li.filterStatus_4 a");//选择退货已发货
                loop(browser);
            }else{
                browser
                    .waitForElementVisible("input[placeholder='请输入客户名...']",1000)
                    .end();
            }
        })
}
