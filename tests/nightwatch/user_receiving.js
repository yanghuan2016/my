module.exports = {
    'login': function (browser) {
        browser
            .url('http://romens.f3322.net:3500/login?nextTo=')
            .waitForElementVisible('body', 1000)
            .maximizeWindow()
            .setValue('input#username', '393581')
            .setValue('input#password', '123456')
            .click('input[type=submit]')
            .waitForElementVisible('i.fa-user', 1000)
            .assert.elementPresent('i.fa-user');
    },
    'user_receiving':function(browser){
        browser
            .click("div.pull-right a[href='/order']")
            .waitForElementVisible("div#sidebar",1000)
            .click("div#sidebar a[href='/order/ship?']")
            .waitForElementVisible("input[placeholder='请输入发货单号...']",1000)
            .moveToElement("div.filter-item",10,10)
            .click("li.noReceived a");
        loop(browser);
    }
};
function loop(browser){
    browser
        .waitForElementVisible("a[data-original-title='确认收货']",1000,false,function(res){
            if(res.value){
                browser
                    .click("a[data-original-title='确认收货']")
                    .waitForElementVisible("a.sureAccept",1000)
                    .click("a.sureAccept")
                    .waitForElementVisible("button[i-id='确定']",1000)
                    .click("button[i-id='确定']")
                    .waitForElementVisible("input[placeholder='请输入发货单号...']",1000)
                    .moveToElement("div.filter-item",10,10)
                    .click("li.noReceived a");//单击待收货
                    loop(browser);
            }else{
                browser
                    .waitForElementVisible("input[placeholder='请输入发货单号...']",1000)
                    .end();
            }
        })
}
