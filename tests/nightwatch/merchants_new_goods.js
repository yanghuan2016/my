module.exports = {
	'login' : function (browser) {
		browser
			.url('http://romens.f3322.net:3500/login?nextTo=')
			.waitForElementVisible('body', 1000)
			.maximizeWindow()
			.setValue('input#username', 'sm')
			.setValue('input#password', '123456')
			.click('input[type=submit]')
			.waitForElementVisible('body', 1000)
			.assert.containsText('div.container','操作员');
	},
	'merchants_new_product':function(browser){
		var goods=new Array(
			new Array('国药准字Z440213050','复方丹参片_0','CAL008748G','0.32g*60s 薄膜衣','广东罗浮山','广东罗浮山国药股份有限公司','2015/10/12'),
			new Array('国药准字H200431710','酮康唑乳膏_0','BN380190309','13g/支','陕西省西安市','西安杨森制药有限公司','2015/10/16'),
			new Array('国药准字H200431720','六味地黄丸_0','Z19993068','120丸/瓶','北京市','北京同仁堂科技发展股份有限公司制药厂','2015/10/18'),
			new Array('国药准字H200651190','辛伐他汀片_0','BMG003137C','10mg*14s','山东临沂','山东罗欣药业股份有限公司','2015/10/19'),
			new Array('国药准字H130241030','复方三维亚油酸胶丸_0','BMG014050C','100s','石家庄','华北制药股份有限公司','2015/10/30'),
			new Array('国药准字H430203250','盐酸地芬尼多片_0','BOD006010C','25mg*30s 糖衣','湖南千金湘江','湖南千金湘江药业股份有限公司','2015/10/31'),
			new Array('国药准字Z420209980','生脉饮_0','EZG029075G','10ml*10支','湖北纽兰药业','湖北纽兰药业有限公司','2015/10/31'),
			new Array('国药准字Z420215810','生脉饮(党参方)_0','EZG029350G','10mlx10支','武汉太福制药','武汉太福制药有限公司','2015/10/31'),
			new Array('国药准字Z200443130','心脑康胶囊_0','CBL056106G','0.25g*12s*4板','石家庄','石药集团欧意药业有限公司','2015/9/31'),
			new Array('国药准字H199903530','果糖二磷酸钠口服溶液(瑞安吉)_0','EMZ001001C','10ml:1g*6支','北京','北京华靳制药有限公司','2015/9/28'),
			new Array('国药准字Z120205810','牛黄降压丸_0','CCP005007G','300s 小蜜丸','天津','天津中新药业集团股份有限公司达仁堂制药厂','2015/9/24')
		);
		var len=goods.length,i= 0;
		browser
			.click("div#sidebar a[href='/customer/product']")
			.waitForElementVisible("a[href='/customer/product/edit']", 1000);
		for(;i<len;i++){
			browser
				.click("a[href='/customer/product/edit']")
				.waitForElementVisible('input#filingNumber', 1000)
				.setValue('input#filingNumber',goods[i][0])//录入基础信息
				.click('body').pause(5000)
				.click('div.self-select-wrapper')
				.moveToElement("ul.self-select-ul li.self-select-option_1",10,10)
				.moveToElement("ul.nav-list-active li.nav-list_1",10,10)
				.click("ul.nav-list_two li.nav-list_two_3 a")
				.setValue('input#product_name',goods[i][1])
				.setValue("input#product_num",goods[i][2])
				.setValue('input#spec',goods[i][3])
				.setValue('input#product_area',goods[i][4])
				.setValue('input#factory',goods[i][5])
				.click('input#filingNumberValidDate')
				.setValue('input#filingNumberValidDate',goods[i][6])
				.click('body')		// close the calendar input
				.click('a.nextToCustomerProductGsp1')
				.verify.elementNotPresent('table.ui-dialog-grid')
				.waitForElementVisible("input[id=shop_price]",1000)
				.setValue("input[id=shop_price]",'13')//录入价格
				.setValue('input#retail_price','17')
				.setValue('input#price1','12')
				.setValue('input#price2','13')
				.setValue('input#price3','14')
				.click('a.addProduct_price')
				.verify.elementNotPresent('table.ui-dialog-grid')//判断录入价格是否有误
				.waitForElementVisible('select#stock_show',1000)
				.click('select#stock_show')//录入库存量
				.keys(['\uE015','\uE015','\uE006'])
				.setValue("input[id=stock_num]",Math.floor(Math.random()*1000))
				.click("input[id=forbidInventory]")
				.click("input[id=Onput]")
				.click('a.addProduct_stock')//单击下一步
				.verify.elementNotPresent('table.ui-dialog-grid')//判断录入价格是否有误
				.waitForElementVisible('a.addProduct_GSP',1000)
				.click('a.addProduct_GSP')//单击下一步
				.verify.elementNotPresent('table.ui-dialog-grid')//判断录入价格是否有误
				.waitForElementVisible('a.addProduct_Mark',1000)
				.click('a.addProduct_Mark')//单击下一步
				.waitForElementVisible('table.ui-dialog-grid',1000)
				.verify.containsText('div.ui-dialog-content','商品信息已更新')//判断商品信息是否添加成功
				.click('button.ui-dialog-autofocus')
				.waitForElementVisible("a[href='/customer/product/edit']",1000);
		}

		browser
			.pause(10000)
			.end();
	}
};

