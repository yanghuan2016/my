/**
 * Created by xdw on 16-3-7.
 */



/**
 * 测试SCC-EDI接口说明文档:
2016-03-31
 created by dawei
 @qingdao
 */


/**
 *   1询价
 * 此处模拟网页报价工具:postman,测试数据:
 表单模式提交POST:
 http://localhost:3000/api/erp/2
 msg =
 {"version":"1.0",
 "msgId":"233015df30-b64c-48d6-a3e7-89198b0256fc1459926169754000003",
 "msgType":"EDI_INQUIRY_CREATE",
 "msgData":{
 "PURCHASEPLANTEMP": [{
            "GUID": "89fa270a-bb23-41cd-bb21-442479a24190",
            "MATERIELCODE": "100020",
            "SUPPLIERCODE": "10003",
            "PLANQUANTITY": 15,
            "UNITPRICETAX": 9,
            "PURCHASEUPSET": 0,
            "BALANCEPERIOD": 0,
            "PLATFORMCODE": "1136596",
            "BILLNO": "SC201511010029-SZQ-01",
            "CONVERSION": "5.0000"
        }, {
            "GUID": "89fa270a-bb23-41cd-bb21-442479a24190",
            "MATERIELCODE": "100020",
            "SUPPLIERCODE": "10001",
            "PLANQUANTITY": 5,
            "UNITPRICETAX": 7,
            "PURCHASEUPSET": 0,
            "BALANCEPERIOD": 0,
            "PLATFORMCODE": "1136596",
             "BILLNO": "SC201511010029-SZQ-02",
            "CONVERSION": "2.0000"
        }, {
            "GUID": "89fa270a-bb23-41cd-bb21-442479a24190",
            "MATERIELCODE": "100034",
            "SUPPLIERCODE": "10001",
            "PLANQUANTITY": 1,
            "UNITPRICETAX": 16,
            "PURCHASEUPSET": 0,
            "BALANCEPERIOD": 0,
            "PLATFORMCODE": "1040531",
               "BILLNO": "SC201511010029-SZQ-03",
            "CONVERSION": "6.0000"
        }]
 },
 "checksum":"cd9824063a17d23a6ac255a21a487447"
 }

 http://SCCURL:3000/api/erp/2
 其中uid=2 需要先和SCC确认uid的客户是否已初始化数据库同步数据

 提交数据中
 SUPPLIERCODE（询价，订单，退货） 要在对应的上下游关系同步中存在的企业
 PLATFORMCODE（商品的平台ID） 需要商品同步范围内的商品
 CLIENTCODE（发货）  要在对应的上下游关系同步中存在的企业


 **/


/**
 *   1订单创建
 * 此处模拟网页报价工具:postman,测试数据:
表单模式提交POST:
 http://localhost:3000/api/erp/2
 msg =
 {"version":"1.0","msgId":"13e518ff1b-635c-4703-953c-4cf45e07b6761462444172984000001",
 "msgType":"EDI_ORDER_CREATE_FROM_BUYER",
 "msgData":{"STOCKORDERFORM":
 [{"GUID":"M201605050160-10002","BILLNO":"M20160505016010002",
 "SUPPLIERCODE":"10001",
 "SUPPLIERNAME":"甘肃众友药业中药饮片加工有限公司(江英)",
 "BILLDATE":"2016-05-05T00:00:00",
 "EMPLOYEECODE":"SZQ",
 "EMPLOYEENAME":"Song",
 "USEFULDATE":"2016-06-19T00:00:00",
 "SUPPLIEREMPLOYEENAME":"张文远",
 "ADVGOODSARRIVEDATE":"2016-06-04T00:00:00",
 "CUSTOMERADDER":null,"REMARK":"由比价生成"}],
 "STOCKORDERFORMDETAIL":
 [{"GUID":"78FAA0D2-A39F-440D-91A8-D56E6B9B8453",
 "STOCKORDERFORMGUID":"M201605050160-10002",
 "QUANTITY":17,
 "INPRICE":9.9,
 "HH":"100020",
 "PZWH":"国药准字Z20026560",
 "AMOUNTTAX":168.3,
 "DETAILNO":"1",
 "PLATFORMCODE":"1136596",
 "CONVERSION":
 "2.0000"}]},
 "checksum":"f1105032b9918e10c6c64116ea82d4e7"}

 *************************************
 * 对应以上数据的TEST DATA:
 *
 insert into ClientSellerInfo (enterpriseId,enabled,erpCode,businessLicense) VALUES(1,1,"供应商编号","营业执照1");
 insert into Client (clientCode,clientName) VALUES("采购客户CLIENTCODE");
 update ClientGsp set businessLicense = (SELECT  Customer.businessLicense  From CloudDB_dawei.Customer  WHERE Customer.id = 2);

此处Customer.id = 2就是ERP接口最后一位ID： http://localhost:3000/api/erp/2

 *
 * PZWH 替换为销售方seller数据库存在的PZWH
 * ********************************
字段说明：
 "msgData": {
        "STOCKORDERFORM": [
            {
                "GUID": "内码1",                // 内码
                "BillNO": "单据编号",           // 单据编号
                "Suppliercode": "供应商编号",   // 供应商编号
                "SupplierName": "供应商名称",   // 供应商名称
                "BillDate": "单据日期",         // 单据日期
                "CustomerAdder": "送货地址",    // 送货地址
                "EmployeeCode": "业务员编号",   // 业务员编号
                "EmployeeName": "业务员名称",   // 业务员名称
                "UseFulDate": "订单失效期",     // 订单失效期
                "SupplierEmployeeName": "供应商代表名字", // 供应商代表名字
                "AdvGoodsArriveDate": "预到货日期", // 预到货日期
                "Remark": "备注"                // 备注
            }
        ],
        "STOCKORDERFORMDETAIL": [
            {
                "GUID": "detail内码",
                "StockOrderFormGuid": "内码1",
                "Quantity": "1",
                "InPrice": "9.09",
                "HH": "4060504005",
                "PZWH": "苏镇食药监械（准）字2014第1560041号",
                "AmountTax": "9.09"
            },
            {
                "GUID": "detail内码2",
                "StockOrderFormGuid": "内码1",
                "Quantity": "10",
                "InPrice": "9.09",
                "HH": "5070501023",
                "PZWH": "卫食健字（1999）第096号",
                "AmountTax": "90.9"
            }
        ]
    },
 ********************************************
 * //云平台向商户ERP发送 新订单
 // data 为接ajax请求的data
 data = {
    msg: JSON.stringify(msgObj)
};
 msgObj = {
    userId: 1,
    msgId: "20000001145697671137700001",
    msgType: "ORDER_CREATE_TO_SELLER",
    msgData: {
        order: {
            orderInfo: {
                id: 6,
                clientGuid: "erptestNo",
                consigneeName: null,
                consigneeAddress: "address192",
                consigneeMobileNum: null,
                status: "CREATED",
                remark: "",
                confirmDate: "",
                total: 25
            },
            orderDetail: [
                {
                    detailno: 6,
                    orderId: 6,
                    goodsId: 772,
                    pricePlan: "price1",
                    soldPrice: 25,
                    quantity: 1,
                    amount: 25,
                    remark: ""
                }
            ]
        }
    },
    checksum: "d19f7917ea2aa4f21548969ba4240481"
};


 SCC will Send
 msg ={"version":"1.0","userId":3,"msgId":"20000003146244623594100001","msgType":"EDI_ORDER_CREATE_TO_SELLER","msgData":{"ORDER":{"ORDERINFO":{"TOTAL":168.3,"CONSIGNEENAME":"Song","CONSIGNEEADDRESS":null,"CONSIGNEEMOBILENUM":"","STATUS":"CREATED","REMARK":"由比价生成","CONFIRMDATE":"2016-05-05T00:00:00","STOCKORDERFORMGUID":"M201605050160-10001","CLIENTGUID":"00001"},"ORDERDETAIL":[{"STOCKORDERFORMDETAILGUID":"77FAA0D2-A39F-440D-91A8-D56E6B9B8453","DETAILNO":"1","ORDERID":"M201605050160-10001","SOLDPRICE":9.9,"QUANTITY":17,"AMOUNT":168.3,"REMARK":"由比价生成","GOODSID":"100020"}]}},"checksum":"1ce7b9e78b8eb61dbb0083fc98b519be"}

 **/


/***
 *  2订单审核
 * *****************************
 *
 * http://localhost:3000/api/erp/2
 * EDI_ORDER_CONFIRM_FROM_SELLER

 //商户ERP向云平台发送 订单审核信息
 // data 为接ajax请求的data
 data = {
    msg: JSON.stringify(msgObj)
};
 msgObj =
 {
  "version": "1.0",
  "msgId": "10a4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
  "msgType": "EDI_ORDER_CONFIRM_FROM_SELLER",
  "msgData": {
        "XSDDHead": [
            {
                "GUID": "31",
                "BILLNO": "31",
                "CLIENTCODE":"erp11111",
                "ISAUDITING": 1,
                "ISCLOSE": 0
            }
        ]
    },
    "checksum": "8cbf6e1911c97ab1640ce1faed29a57e"
 }




 EDI_ORDER_CONFIRM_TO_BUYER

 //云平台向客户ERP发送 订单审核信息
 // data 为接ajax请求的data
 data = {
    msg: JSON.stringify(msgObj)
};
 msgObj = {
    msgId: '20000001145698867192200001',
    msgType: 'EDI_ORDER_CONFIRM_TO_BUYER',
    msgData: {
        "orderUpdate": {
            "orderId": "9",         // SCC订单号
            "status": "APPROVED",
            // ENUM('CREATED','APPROVED','SHIPPED','FINISHED','CLOSED')
            // 已提交待审核, 已受理待发货,商家已发货,已完成订单, 已关闭订单
            "remark": "bala bala bala",
            "createdOn": "2016-03-03 15:04:31"
        }
    },
    checksum: '580847066234a2c3dc27c6e40c63e070'
}
 *************************************
 *
 *
 *
 *
 *
 **/

/***
 *  3.发货
 * *****************************
 *
 EDI_ORDER_SHIP_FROM_SELLER

 // 商户ERP向SCC发送订单发货信息
 // data 为接ajax请求的data
 data =
 {
   "version": "1.0",
   "msgId": "12b4ac62c4-080a-4419-b50e-81c2bcd2a5551460030192846000001",
   "msgType": "EDI_ORDER_SHIP_FROM_SELLER",
   "msgData":
 {"FHDZKHEAD":[{"BILLNO":"M1605060257D","BILLDATE":"2016-05-06T00:00:00",
 "BILLTIME":"13:21:47",
 "ORDERBILLNO":"M201605060161-10001",
 "ORDERGUID":"M201605060161-10001","NOTES":"","FHRY":null,"FHRQ":null,"CUSTOMGUID":"06EB2300EC784C1FA032379251358CF5",
 "CUSTOMNAME":"雨人健康城(兰州店)"}],
 "FHDZK":[
 {"CLIENTCODE":"00001","KDRQ":"2016-05-06T00:00:00",
 "DH":"M1605060365D","LSH":"M1605060257D",
 "HH":"100035","SJ":10,
 "BATCHNO":"空值","BATCHNUM":"201604070272","GOODSVALIDDATE":"2017-04-07T00:00:00",
 "GOODSPRODUCEDATE":"2016-01-01T00:00:00",
 "QUANTITY":40,"REMARK":"","INSPECTREPORTURL":null,"TYBZ":0,"SBZ2":"8563007F-7E38-44AA-B30D-EB059DE61B1C","PLATFORMCODE":"1089172","CONVERSION":"1.0000"},
 {"CLIENTCODE":"00001","KDRQ":"2016-05-06T00:00:00",
 "DH":"M1605060365D","LSH":"M1605060257D",
 "HH":"100020","SJ":10,
 "BATCHNO":"空值","BATCHNUM":"201604070272","GOODSVALIDDATE":"2017-04-07T00:00:00",
 "GOODSPRODUCEDATE":"2016-01-01T00:00:00",
 "QUANTITY":30,"REMARK":"","INSPECTREPORTURL":null,"TYBZ":0,"SBZ2":"8563007F-7E38-44AA-B30D-EB059DE61B1C","PLATFORMCODE":"1136596","CONVERSION":"1.0000"}],"MONITORDETAIL":[]}
 ,
   "checksum": "fd0882d8e91147087530e0c7dd20f1fb"
 }

 目前折中后的json格式
 {
   "version": "1.0",
   "msgId": "12b4ac62c4-080a-4419-b50e-81c2bcd2a5551460030192846000001",
   "msgType": "EDI_ORDER_SHIP_FROM_SELLER",
   "msgData": {
     "FHDZKHEAD": [
       {
         "BILLNO": "62c4-080a-4419-b50e-81c2bcd2a555146",
         "BILLDATE": "2016-04-05T00:00:00",
         "BILLTIME": "2016-04-05T00:00:00",
         "ORDERBILLNO": "orderid",
         "ORDERGUID": null,
         "NOTES": "",
         "FHRY": null,
         "FHRQ": null,
         "CUSTOMGUID": "客户Guid",
         "CUSTOMNAME": "客户名称"
       }
     ],
     "FHDZK": [
       {
         "CLIENTCODE": "00002",
         "KDRQ": "2016-04-05T00:00:00",
         "DH": "62c4-080a-4419-b50e-81c2bcd2a555146",
         "LSH": "lsh1212313",
         "HH": "100020",
         "PLATFORMCODE":"1000200",
         "CONVERSION":2,
         "SJ": "9.9",
         "BATCHNO": "bat1",
         "BATCHNUM": "banum1",
         "GOODSVALIDDATE": "2015-04-05T00:00:00",
         "GOODSPRODUCEDATE": "2017-04-05T00:00:00",
         "QUANTITY": "20",
         "REMARK": "备注",
         "INSPECTREPORTURL": "检验报告单url",
         "TYBZ": "销售方式",
         "SBZ2": "订单明细Guid"
       }
     ],
     "MONITORDETAIL": [
       {
         "DRUGESC": "电子监管码",
         "YSDH": "orderid",
         "BZGG": "包装规格",
         "FTYPE": 1
       }
     ]
   },
   "checksum": "fd0882d8e91147087530e0c7dd20f1fb"
 }

 {
   "version": "1.0",
   "msgId": "12b4ac62c4-080a-4419-b50e-81c2bcd2a5551460030192846000001",
   "msgType": "EDI_ORDER_SHIP_FROM_SELLER",
   "msgData": {
     "FHDZKHEAD": [
       {
         "BillNo": "流水号",
         "Billdate": "单据日期",
         "BillTIme": "单据时间",
         "OrderBillNo": null,
         "OrderGuid": null,
         "Notes": "",
         "FHRY": null,
         "FHRQ": null,
         "CustomGuid": "客户Guid",
         "CustomName": "客户名称"
       }
     ],	 // 只有一个元素
     "FHDZK": [
       {
         "CLIENTCODE": "客户编号",
         "KDRQ": "单据日期",
         "DH": "发货单号",
         "LSH": "流水号",
         "HH": "货号",
         "SJ": "含税售价",
         "BATCHNO": "批号",
         "BATCHNUM": "批次号",
         "GOODSVALIDDATE": "有效期",
         "GOODSPRODUCEDATE": "生产日期",
         "QUANTITY": "数量",
         "REMARK": "备注",
         "INSPECTREPORTURL": "检验报告单url",
         "TYBZ": "销售方式",
         "SBZ2": "订单明细Guid"
       }
     ],
     "MONITORDETAIL": [
       {
         "DRUGESC": "电子监管码",
         "YSDH": "销售单号",
         "BZGG": "包装规格",
         "FTYPE": 1
       }
     ]
   },
   "checksum": "fd0882d8e91147087530e0c7dd20f1fb"
 }
 


 EDI_ORDER_SHIP_TO_BUYER
 // SCC发送发货数据到客户ERP
 // data 为接ajax请求的data
 data = {
    msg: JSON.stringify(msgObj)
};
 msgObj = {
    msgId: '20000001145698867192200001',
    msgType: 'EDI_ORDER_SHIP_FROM_SELLER',
    msgData: {
		"T_HeadMove": [
			{
				"Lsh": "流水号",
				"dh": "明细单号",
				"kdrq": "接货日期(数据传输日期)",
				"Suppliercode": "供应商编号",
				"hh": "货号 (erp的)",
				"sj": "含税价",
				"sl": "数量",
				"Ph1": "批号",
				"pcdh": "批次单号",
				"Ph1_xq": "有效期至",
				"scrq": "生产日期",
				"bz": "备注",
				"Sbz1": "检验报告单URL",
				"tybz": "销售方式",
				"Sbz2": "采购订单明细guid",
				"monitordetail": [
					{
						"monitorcode": "监管码",
						"ysdh": "销售单号",
						"bzgg": "包装规格",
						"ftype": 1
					}
				]
			}
		]
	},
    checksum: '580847066234a2c3dc27c6e40c63e070'
}
 *
 *
 *
 **/

/***
 *  4.收货
 * *****************************
 *
 // 客户ERP向SCC发送收货数据
 // 仅供参考, 需协商
 EDI_ORDER_SHIP_RECEIVE_FROM_BUYER

 // 客户ERP向SCC发送收货数据
 // 仅供参考, 需协商
 data = {
    msg: JSON.stringify(msgObj)
};
 msgObj =
 {
    "version": "1.0",
    "msgId": "12b4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
    "msgType": "EDI_ORDER_SHIP_RECEIVE_FROM_BUYER",
    "msgData": {
		"RKDHEADZK": [
			{
				"SUPPLIERCODE":	"10006 ",
				"LSH": "流水号",
				"RKDZK": [
					{
						"RKDH": "入库单号",
						"HH": "商品货号",
						"PZWH": "批准文号",
						"YFPHM": "原配送单号",
						"SSSL": "10",
						"HTBH": "Guid10"
					},
					{
						"RKDH": "入库单号",
						"HH": "商品货号",
						"PZWH": "批准文号",
						"YFPHM": "原配送单号",
						"SSSL": "10",
						"HTBH": "Guid11"
					}
				]
			}
		]
	},
    "checksum": "8cbf6e1911c97ab1640ce1faed29a57e"
}


 EDI_ORDER_SHIP_RECEIVE_TO_SELLER
 // SCC向商户ERP发送收货数据

 data = {
    msg: JSON.stringify(msgObj)
};
 msgObj = {
    "version": "1.0",
    "msgId": "12b4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
    "msgType": "EDI_ORDER_SHIP_RECEIVE_TO_SELLER",
    "msgData": {
		"FHDZK": [
			{
				"HTBH": "销售订单明细Guid",
				"SCCRECEIVEQUANTITY": "收货数量"
			}
		]
	},
    "checksum": "8cbf6e1911c97ab1640ce1faed29a57e"
};


 *
 *
 **/


/***
 * 5.退货
 EDI_ORDER_RETURN_CREATE_FROM_BUYER

 // 商户ERP向SCC发送新退货单
 data = {
    msg: JSON.stringify(msgObj)
};

 msgObj =
 {"version":"1.0","msgId":"228bc30da4-4da7-41a9-835a-8d88821c8ed21462518949170000001",
 "msgType":"EDI_ORDER_RETURN_CREATE_FROM_BUYER","msgData":{"STOCKRETURNAPPROVE":
 [{"GUID":"99B0F22E-6DA7-4A22-90F7-B3A0D73E4B23",
 "BILLNO":"201605060143","BILLDATE":"2016-05-06T00:00:00","SUPPLIERCODE":"10001",
 "STOCKTYPE":0,"REMARK":"","UserName":"180001"}],
 "STOCKRETURNAPPROVEDETAIL":[
 {"GUID":"CA2395E6-2531-497E-A412-83025D95DFE6",
 "DETAILNO":"1","MATERIELCODE":"100035","BATCHNO":"空值1",
 "BATCHNUMBER":"201605060275","QUANTITY":-40,"TAXUNITPRICE":10,"UNITPRICE":8.547009,
 "AMOUNT":-341.88,"TAXAMOUNT":-58.12,"AMOUNTTAX":-400,"REMARK":null,"RETURNREASON":"厂家召回","ORDERDETAILGUID":"8563007F-7E38-44AA-B30D-EB059DE61B1C","PLATFORMCODE":"1089172","CONVERSION":"1.0000"},
  {"GUID":"CA2395E6-2531-497E-A412-83025D95DFE7",
 "DETAILNO":"2","MATERIELCODE":"100035","BATCHNO":"空值2",
 "BATCHNUMBER":"201605060274","QUANTITY":-40,"TAXUNITPRICE":10,"UNITPRICE":8.547009,
 "AMOUNT":-341.88,"TAXAMOUNT":-58.12,"AMOUNTTAX":-400,"REMARK":null,"RETURNREASON":"厂家召回","ORDERDETAILGUID":"8563007F-7E38-44AA-B30D-EB059DE61B1C","PLATFORMCODE":"1089172","CONVERSION":"1.0000"},
  {"GUID":"CA2395E6-2531-497E-A412-83025D95DFE8",
 "DETAILNO":"3","MATERIELCODE":"100020","BATCHNO":"空值",
 "BATCHNUMBER":"201605060272","QUANTITY":-40,"TAXUNITPRICE":10,"UNITPRICE":8.547009,
 "AMOUNT":-341.88,"TAXAMOUNT":-58.12,"AMOUNTTAX":-400,"REMARK":null,"RETURNREASON":"厂家召回","ORDERDETAILGUID":"8563007F-7E38-44AA-B30D-EB059DE61B1C","PLATFORMCODE":"1136596","CONVERSION":"1.0000"}
 ]},"checksum":"48ecd3bc6134220dae816510e3fc98fe"}

 msgObj =
   {
    "version": "1.0", "msgId": "12f4487646-27f3-4dff-95ba-db254cd880de1460172959523000001", "msgType": "EDI_ORDER_RETURN_CREATE_FROM_BUYER",
    "msgData": {
        "STOCKRETURNAPPROVE": [{
            "GUID": "12C117D0-4171-4486-A73F-7AE829FEB9EC",
            "BILLNO": "201604080142",
            "BILLDATE": "2016-04-08T00:00:00",
            "SUPPLIERCODE": "10001",
            "STOCKTYPE": 0,
            "REMARK": "",
            "RETURNREASON": "调换商品",
            "USERNAME": null
        }],
        "STOCKRETURNAPPROVEDETAIL": [{
            "GUID": "3F901ACE-1209-46BC-8719-CFD88B02293C",
            "DETAILNO": "1",
            "MATERIELCODE": "100020",
            "BATCHNO": "空值",
            "BATCHNUMBER": "201604080270",
            "QUANTITY": -2,
            "TAXUNITPRICE": 8,
            "UNITPRICE": 6.837607,
            "AMOUNT": -13.68,
            "TAXAMOUNT": -2.32,
            "AMOUNTTAX": -16,
            "REMARK": null,
            "RETURNREASON": "调换商品",
            "ORDERDETAILGUID": "786d5694-bcc4-4370-bfc6-5a5bef049aa7"
        }]
    },
 "checksum": "8cbf6e1911c97ab1640ce1faed29a57e"
}
 ;



 EDI_ORDER_RETURN_CREATE_TO_SELLER

 // 云平台向商户ERP发送 新退货单信息
 // data 为接ajax请求的data
 data = {
    msg: JSON.stringify(msgObj)
};
 msgObj = {
    userId: 1,
    msgId: "20000001145734184532200001",
    msgType: "EDI_ORDER_RETURN_CREATE_TO_SELLER",
    msgData: {
		"SALERETURNAPPROVE": [
			{
				"GUID": "Guid",
				"BILLNO": "流水号",
				"BILLDATE": "单据日期",
				"CUSTOMERCODE": "客户编号",
				"EMPLOYEECODE": "业务员编号",？
				"SELLITEM": "结算客户",？
				"SENDADDRESS": "发货地址",？
				"SALETYPE": "销售方式",？
				"ISIMPORT": "引入标志",？
				"RETURNREASON": "退回原因",
				"REMARK": "备注",
				"SALERETURNAPPROVEDETAIL": [
					{
						"GUID": "guid",
						"MAINGUID": "主表Guid",
						"MATERIELCODE": "商品货号",
						"PZWH": "批准文号",
						"BATCHNO": "批号",
						"BATCHNUMBER": "批次单号",？
						"USEFULDATE": "批次效期",?
						"RETURNREASON": "退回原因",
						"QUANTITY": "申退数量",
						"TAXUNITPRICE": "含税单价",
						"UNITPRICE": "无税单价",
						"AMOUNT": "金额",
						"TAXAMOUNT": "税额",
						"AMOUNTTAX": "价税合计",
						"COSTPRICE": "成本价",？
						"ISIMPORT": "引入标志",？
						"SOURCEBILLNO": "原单单号",？
						"REMARK": "备注"
					}
				]
			}
		]
	},
    checksum: "06be76517995fdae7744b55aec0f0f4e"
};

 *
 *
 *
 *
 *
 *
 *
 **/





/***

 * *****************************
 *
 *
 *

 *  退货发货完成,订单流程对接OK
 *
 *
**/


