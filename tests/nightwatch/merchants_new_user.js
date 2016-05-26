module.exports = {
    'login': function (browser) {
        browser
            .url('http://romens.f3322.net:3500/login?nextTo=')
            .waitForElementVisible('body', 10000)
            .maximizeWindow()
            .setValue('input#username', 'sm')
            .clearValue('input#password')
            .setValue('input#password', '123456')
            .click('input[type=submit]')
            .waitForElementVisible('body', 1000)
            .assert.elementPresent('i.fa-user');
    },
    'merchants_new_user':function(browser){
        for(var i=0;i<12;i++) {
            var price = i % 4;
            var categoryName=i%5;
            browser
                .click("div#sidebar a[href='/customer/client']")
                .waitForElementVisible("a[href='/customer/client/add']", 1000)
                .click("a[href='/customer/client/add']")
                .waitForElementVisible("input[id=clientName]", 1000)
                .setValue('input#clientName', '神木' + i)
                .setValue('input#clientCode',Math.floor(Math.random()*1000000));
            if(categoryName>0){
                browser.click('select[id=categoryName]');
                var keys="";
                for(var j=1;j<=categoryName;j++){
                    keys+="'\uE015',";
                }
                browser.keys([keys+ '\uE006']);
            }
            browser
                .setValue('input#clientArea', '美年广场');
            switch(price){
                case 0:browser.click("input[id=wholesale_price]");break;
                default :browser.click("input#price"+price);
            }
            browser
                .click('a.addBasicInformation')
                .waitForElementVisible('table.ui-dialog-grid', 1000)
                .verify.containsText('div.ui-dialog-content', '客户信息已添加成功')
                .click('button.ui-dialog-autofocus')
                .waitForElementVisible("a[href='/customer/client/add']", 1000);
        }
        browser
            .pause(10000)
            .end();
    }
}
