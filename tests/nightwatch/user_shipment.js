/**
 * Created by Abby on 2015/11/3.
 */
module.exports = {
    'login': function (browser) {
        browser
            .url('http://romens.f3322.net:3400/login?nextTo=%2F')
            .waitForElementVisible('body', 1000)
            .maximizeWindow()
            .setValue('input#username', '393581')
            .setValue('input#password', '123456')
            .click('input[type=submit]')
            .waitForElementVisible('body', 1000)
            .assert.elementPresent('i.fa-user');
    },
    'user_shipment':function(browser){
        browser
            .click("div.container a[href='/order']")
            .waitForElementVisible("input[placeholder='请输入订单编号...']",1000)
            .click("div#sidebar a[href='/order/return?']")
            .waitForElementVisible("input[placeholder='请输入退货单号...']",1000)
            .moveToElement("div.filterStatus",10,10)
            .click("li.filterStatus_2 a");//选择退货审核通过
        loop(browser);//循环点击审核按钮
    }
};
function loop(browser){
    browser
        .waitForElementVisible("a[data-original-title='发货']",1000,false,function(res){
            if(res.value){
                browser
                    .click("a[data-original-title='发货']")
                    .waitForElementVisible("a.btnReturnShip",1000)
                    .click("a.btnReturnShip")
                    .waitForElementVisible("table.ui-dialog-grid",1000)
                    .click("button[i-id='确定']")
                    .click("div#sidebar a[href='/order/return?']")//单击退货管理
                    .waitForElementVisible("input[placeholder='请输入退货单号...']",1000)
                    .moveToElement("div.filterStatus",10,10)
                    .click("li.filterStatus_2 a");//选择退货审核通过
                loop(browser);
            }else{
                browser
                    .pause(10000)
                    .end();
            }
        });
}
