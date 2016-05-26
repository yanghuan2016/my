/**
 * Created by xdw on 16-3-7.
 */



/**
 * 测试SCC-ERP接口说明文档:
2016-03-07
 created by dawei
 @qingdao
 */

/**
 * 测试询报价接口:
 1.需先进行商品数据库同步,使得双方ERP在SCC对应的库中GoodsInfo.goodsNo能和ERP对应上
 如未同步数据库,可在当前数据库插入如下数据做测试数据,在ERP数据库中选取货号为100309和100260商品测试询价:

 INSERT GoodsInfo (Id, GUID, skuNo,goodsTypeId, goodsno, BARCODE, isPrescriptionDrugs,
 commonName, ALIAS, licenseNo, filingNumberValidDate, SPEC, supplier, birthPlace, producer,
 measureUnit, imageUrl, largePackUnit, largePackNum, largePackBarcode, middlePackUnit, middlePackNum,
 middlePackBarcode, smallPackUnit, smallPackNum, smallPackBarcode,
 negSell, isForbidden, isCheckStore, isAreaLimited, areaDesc, goodsDetails)
 VALUES (778, 'BCF5B424-25EC-4841-A532-FFD27F9CDDC1', '1120102022','49', '100309', '', 0,
 '阿莫西林1', '测试商品1别名', '国药准字TEST1', NULL, '75毫克*10粒', '', 'yyy诺华制药有限公司', '',
 '盒', NULL, '', 1, '', '', 1, '', '盒', 1, '',
 1, 0, 0, 0, '', '')
 ON DUPLICATE KEY UPDATE guid=VALUES(guid),skuNo=VALUES(skuNo), goodsTypeId=VALUES(goodsTypeId),
 goodsNo=VALUES(goodsNo),barcode=VALUES(barcode),isPrescriptionDrugs=VALUES(isPrescriptionDrugs),
 commonName=VALUES(commonName),alias=VALUES(alias),licenseNo=VALUES(licenseNo),spec=VALUES(spec),
 supplier=VALUES(supplier), birthPlace=VALUES(birthPlace),producer=VALUES(producer),
 measureUnit=VALUES(measureUnit),largePackUnit=VALUES(largePackUnit), largePackNum=VALUES(largePackNum),
 largePackBarcode=VALUES(largePackBarcode),middlePackUnit=VALUES(middlePackUnit),
 middlePackNum=VALUES(middlePackNum),middlePackBarcode=VALUES(middlePackBarcode),
 smallPackUnit=VALUES(smallPackUnit), smallPackNum=VALUES(smallPackNum),
 smallPackBarcode=VALUES(smallPackBarcode);

 INSERT GoodsInfo (Id, GUID, skuNo,goodsTypeId, goodsno, BARCODE, isPrescriptionDrugs,
 commonName, ALIAS, licenseNo, filingNumberValidDate, SPEC, supplier, birthPlace, producer,
 measureUnit, imageUrl, largePackUnit, largePackNum, largePackBarcode, middlePackUnit, middlePackNum,
 middlePackBarcode, smallPackUnit, smallPackNum, smallPackBarcode,
 negSell, isForbidden, isCheckStore, isAreaLimited, areaDesc, goodsDetails)
 VALUES (779, 'BCF5B426-25EC-4841-A533-FFD27F9CDDC1', '11201020111','49', '100260', '', 0,
 '阿莫西林2', '测试商品2别名', '国药准字TEST2', NULL, '75毫克*20粒', '', 'XXX诺华制药有限公司2', '',
 '盒', NULL, '', 1, '', '', 1, '', '盒', 1, '',
 1, 0, 0, 0, '', '')
 ON DUPLICATE KEY UPDATE guid=VALUES(guid),skuNo=VALUES(skuNo), goodsTypeId=VALUES(goodsTypeId),
 goodsNo=VALUES(goodsNo),barcode=VALUES(barcode),isPrescriptionDrugs=VALUES(isPrescriptionDrugs),
 commonName=VALUES(commonName),alias=VALUES(alias),licenseNo=VALUES(licenseNo),spec=VALUES(spec),
 supplier=VALUES(supplier), birthPlace=VALUES(birthPlace),producer=VALUES(producer),
 measureUnit=VALUES(measureUnit),largePackUnit=VALUES(largePackUnit), largePackNum=VALUES(largePackNum),
 largePackBarcode=VALUES(largePackBarcode),middlePackUnit=VALUES(middlePackUnit),
 middlePackNum=VALUES(middlePackNum),middlePackBarcode=VALUES(middlePackBarcode),
 smallPackUnit=VALUES(smallPackUnit), smallPackNum=VALUES(smallPackNum),
 smallPackBarcode=VALUES(smallPackBarcode);

以上两组数据对应的销售方的ERPCODE数据也需要同步到数据库或者插入测试数据:
 INSERT INTO ClientSellerInfo(enterpriseId, enabled,erpCode, businessLicense) VALUES(5,1,'40627','65290001111111');
 INSERT INTO ClientSellerInfo(enterpriseId, enabled,erpCode, businessLicense) VALUES(6,1,'40149','65290002222222');
可生成询价单;

 {"version":"1.0",
 "msgId":"133015df30-b64c-48d6-a3e7-89198b0256fc1459926169754000003",
 "msgType":"EDI_INQUIRY_CREATE",
 "msgData":{
 "PURCHASEPLANTEMP":[
 {"GUID":"e56e9a51-7e5c-4f42-9c6e-22eed99101d5",
 "MATERIELCODE":"900020",
 "SUPPLIERCODE":"10001898",
 "PLANQUANTITY":10,
 "PLATFORMCODE":"9000200",
 "CONVERSION":2,
 "UNITPRICETAX":5.9,
 "PURCHASEUPSET":0,
 "BALANCEPERIOD":0},
 {"GUID":"e56e9a51-7e5c-4f42-9c6e-22eed99101d5",
 "MATERIELCODE":"900022",
 "SUPPLIERCODE":"1000000",
 "PLATFORMCODE":"9000221",
 "CONVERSION":3,
 "PLANQUANTITY":5,
 "UNITPRICETAX":8,
 "PURCHASEUPSET":0,
 "BALANCEPERIOD":0}]
 },
 "checksum":"cd9824063a17d23a6ac255a21a487447"
 }


 2.报价单,因为ERP中报价功能待实现,暂时先用网页报价功能,此处模拟网页报价工具:postman,测试数据:
表单模式提交POST:
 http://192.168.100.248:3300/api/erp/1
msg =
 {"version":"1.0",
   "msgId":"12a4548c1b-a705-486d-b7aa-f0ebcec054ea1456820001077000002",
   "msgType":"QUOTATION_CREATED",
   "msgData":   {"sellerId":6,
                "goods":[
                                       {
                                           "inquiryId": 1,
                                           "buyerId": 3,
                                           "licenseNo": "国药准字test1",
                                           "quotationQuantity": 30,
                                           "quotationPrice": 9.99,
                                           "quotationExpire":"2016-03-09"
                                       },
                                       {
                                           "inquiryId": 1,
                                           "buyerId": 3,
                                           "licenseNo": "国药准字test2",
                                           "quotationQuantity": 40,
                                           "quotationPrice": 19.99,
                                           "quotationExpire":"2016-03-09"
                                       }]},
   "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
   }

 *
 *
 *
 对应的ERP应返回采购订单生成数据:
 模拟数据:
 /调试采购订单生成订单接口:
 {"version":"1.0",
   "msgId":"12b4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
   "msgType":"ORDER_CREATE_FROM_BUYER",
   "msgData":   {
                     "STOCKORDERFORM": [{
                                  "GUID":"内码1",
                                  "BillNO":"单据编号",
                                  "Suppliercode":"供应商编号",
                                  "SupplierName":"供应商名称",
                                  "BillDate":"单据日期",
                                  "CustomerAdder":"送货地址",
                                  "EmployeeCode":"业务员编号",
                                  "EmployeeName":"业务员名称",
                                  "UseFulDate":"订单失效期",
                                  "SupplierEmployeeName":"采购订单",
                                  "AdvGoodsArriveDate":"预到货日期",
                                  "Remark":"备注"
                               }],
                       "STOCKORDERFORMDETAIL": [
                           {
                           "GUID":"detail内码",
                           "StockOrderFormGuid": "内码1",
                           "Quantity":"1",
                           "InPrice":"9.09",
                           "HH":"4060504005",
                           "PZWH":"苏镇食药监械（准）字2014第1560041号",
                           "AmountTax":"9.09"
                           },
                            {
                            "GUID":"detail内码2",
                           "StockOrderFormGuid": "内码1",
                           "Quantity":"10",
                           "InPrice":"9.09",
                           "HH":"5070501023",
                           "PZWH":"卫食健字（1999）第096号",
                           "AmountTax":"90.9"
                           }
                       ]
                },
   "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
   }
 *
 *
 * **
 */

/**
 *测试SM订单和ERP接口  1, 2 ,3
 *
 *
 数据准备
 SCC上应有一个已开启ERP配置的管理员帐号保证APPKEY可用
 在SCC上注册一个BUYER账户作为采购方帐号,该帐号应进行帐号同步,如果未同步需手动插入测试数据:
 INSERT INTO ClientBuyerInfo(enterpriseId, enabled,erpCode, businessLicense)
    VALUES(6,true,'erp6666', '652900050006027');
 此处enterpriseId = CloudDB.Customer.Id,
    erpCode为ERP中该客户对应的ERP编号如40627=阿莫西林生产厂家
    businesslicense为营业执照号


1.SCC上生成订单后同步到SM ERP
 /home/xdw/scc-src/apps/order/controller.js
   notifyERPorderCreatedBYSCC
2.SELLER ERP提交审核数据到SCC(包括ERP订单审核前关闭)  已测OK
     ERP发送到SCC 订单审核数据:
     GUID  //     内码（主键）--SCC发来的-orderId 同下billNo,任取一个都可
     BillNO//    订单编号—SCC发来的-orderId
     IsAuditing//     审核标志（1己审核，0未审核）
     IsClose//     关闭标志（1己关闭，0未关闭）标记ERP内异常状态;

     //调试订单审核接口,其中可传多个订单的审核状态,包括ERP关闭订单也可通过IsClose实现:
     {"version":"1.0",
       "msgId":"10a4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
       "msgType":"ORDER_CONFIRM_FROM_SELLER",
       "msgData":   {"XSDDHead":[
       {"GUID":"42","BILLNO":"42","ISAUDITING":1,"ISCLOSE":0}
       ]},
       "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
       }


 todo 需要设置启用ERP时系统自动生成电子合同(买卖双方帐号下授权默认提交电子签名和电子签章)

 3.SCC订单取消(BUYER登录SCC实现)
 /home/xdw/scc-src/apps/order/controller.js
 notifyERPOrderClosed
 {"version":"1.0",
       "msgId":"10a4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
       "msgType":"ORDER_CONFIRM_FROM_SELLER",
       "msgData":   {"XSDDHead":[
       {"GUID":"31","BILLNO":"31","ISAUDITING":0,"ISCLOSE":1}
       ]},
       "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
       }


 **/

/**
 *4.SELLER 通过ERP提交发货信息到SCC
 ORDER_SHIP_FROM_SELLER   /home/xdw/scc-src/apps/api/modules/order.js L625

NEW:
{
    "version": "1.0",
    "msgId": "11a4533c1b-a705-486d-b7aa-f0ebcec054ea1456820001077000012",
    "msgType": "ORDER_SHIP_FROM_SELLER",
    "msgData": {
        "FhdzkHead": [{
            "BILLNO": "101SZQ1510220253",
            "BILLDATE": "2015-10-22T00:00:00",
            "BILLTIME": "13:05:54",
            "ORDERBILLNO": "003",
            "ORDERGUID": "1417834129879",
            "NOTES": "调拨生成",
            "FHRY": "MANAGE",
            "FHRQ": "",
            "CUSTOMGUID": null,
            "CUSTOMNAME": null
        }],
        "Fhdzk": [{
            "LSH": "101SZQ1510220253",
            "DH": "dh121097",
            "HH": "1220102034",
            "PH1": "bn1297",
            "PCDH": "bnum121",
            "PH1_XQ": "2016-09-09",
            "SCRQ": "2015-09-09",
            "HTBH": "orderdetailId",
            "SL": "10",
            "BZ": "备注",
            "ReportURL": "批次检验报告URL",
            "MonitorCode": "监管码"
        }]
    },
    "checksum": "8cbf6e1911c97ab1640ce1faed29a57e"
}

  {
                "FhdzkHead": [{
                    "BILLNO": "101SZQ1510220253",//发货流水号
                    "BILLDATE": "2015-10-22T00:00:00",//出库日期
                    "BILLTIME": "13:05:54",//出库时间
                    "ORDERBILLNO": "003",//订单BillNo
                    "ORDERGUID": "1417834129879",//订单Guid
                    "NOTES": "调拨生成",//备注
                    "FHRY": "MANAGE",//发货人员（姓名）
                    "FHRQ": "",//发货日期
                    "CUSTOMGUID": null,//客户的GUID
                    "CUSTOMNAME": null//客户的姓名
                }],
                "Fhdzk": [{
                    "LSH": "发货流水号（对应FhdzkHead的BillNo）",
                    "DH": "发货明细单号",
                    "HH": "货号",
                    "PH1": "批号",
                    "PCDH": "批次单号",
                    "PH1_XQ": "效期",
                    "SCRQ": "生产日期",
                    "HTBH": "销售订单明细Guid",
                    "SL": "出库数量",
                    "BZ": "备注",
                    "ReportURL": "批次检验报告URL",
                    "MonitorCode": "监管码"
                }]
            };

 //调试订单发货接口模拟数据OLD:
 {"version":"1.0",
   "msgId":"11a4533c1b-a705-486d-b7aa-f0ebcec054ea1456820001077000012",
   "msgType":"ORDER_SHIP_FROM_SELLER",
   "msgData":   {
                                "guid": "testerpGuid",
                                "billNo": "testErpBillno",
                                "shipTime": "2016-03-03 12-22-20",
                                "orderId": "042",
                                "orderBill_id": "DH1002",
                                "shipDescription": "desc",
                                "senderName": "DAWEI",
                                "shipDate": "2016-03-03",
                                "logisticsName": "erplogid",
                                "logisticsNo": "erplogNo",
                                "receiverId": "001",
                                "remark": "shipremark",
                                "items": [
                                    {
                                        "guid": "detailshipguid",
                                        "goodsId": "001",
                                        "batchNo":"batNO1",
                                        "drugESC": "drugesctest1",
                                        "batchNum": "batchNum1",
                                        "inspectReportURL": "url:123",
                                        "goodsProduceDate": "2016-01-01",
                                        "goodsValidDate": "20116-10-10",
                                        "detailNo": 13,
                                        "orderBillOutDetailUid": "OBODguid",
                                        "quantity": 200,
                                        "remark": "detailreamrk"
                                    },
                                    {
                                      "goodsId": "002",
                                      "drugESC": "drugesctest2",
                                      "batchNo":"batNO2",
                                      "batchNum": "batchN2",
                                      "inspectReportURL": "url:223",
                                      "goodsProduceDate": "2016-01-01",
                                      "goodsValidDate": "20116-10-10",
                                      "detailNo": 1,
                                      "orderBillOutDetailUid":"OBODGUID",
                                      "quantity": 100,
                                      "remark": "detailreamrk"
                                    }
                                ]
                            },
   "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
   }


**/

/**
 *5.BUYER在SCC上提交发货收货的请求  ORDER_SHIP_RECEIVE_TO_SELLER

 /home/xdw/scc-src/apps/order/controller.js

 L379 function updateShipInfoHandler提交到ERP的数据格式如下
 {
    "shipInfo": {
        "orderId": 35,//SCC订单号
        "billNo": 10,//SCC发货单号
        "receiveDate": "2016-03-07T14:30:39.000Z",//收货时间
        "receiverName": null,//收货人姓名
        "orderBill_id": null,//订单内码
        "receiveDescription": null,//收货描述
        "logisticsNo": "erplogiderplogNo"//物流编码
    },
    "shipDetails": [{
        "shipId": 10, //SCC发货单号
        "goodsId": 1,//SCC商品编号
        "batchNo": "batNO1",//商品批号
        "drugESC": "drugesctest1",//商品药品监管吗
        "batchNum": "batchNum1",//商品批次号
        "inspectReportURL": "url:123",//批次质检报告
        "goodsProduceDate": "2015-12-31T16:00:00.000Z",//生产日期
        "goodsValidDate": "0000-00-00",//效期
        "detailNo": 31,//明细编码
        "receiveDate": "2016-03-07T14:30:39.000Z",//收货时间
        "orderBillOutDetailUid": "OBODguid",//明细内码
        "quantity": 200,//数量
        "remark": ""//备注
    }, {
       //..
    }]
}
L396  notifyERPShipReceived :
 ORDER_SHIP_RECEIVE_TO_SELLER
**/

/**
 *6.BUYER在SCC上发起退货请求  ORDER_RETURN_CREATE_TO_SELLER
 /home/xdw/scc-src/apps/order/controller.js

 L125 insertReturnGoodsHandler

 todo 修改前端生成退货单的页面数据接口:需补充提交数据licenseNo,batchNum,batchNo,price
 根据ERP同步要求,此处提交过来数据应该有:来源是前段录入或者筛选
 goodsArr:[[goodsId,quantity,remark,licenseNo,batchNum,batchNo,price]]

 所以该接口提交采用的为测试数据:
 goodsArr = [["754", "11", "11111","国药准字H34020418","bNum12","bNo12","9,9"], ["772", "22", "2222","国药准字H10940176","bNum22","bNo22","8.8"]];


 ORDER_RETURN_CREATE_TO_SELLER

 提交到销售ERP的数据格式:

 var msgData = {
    "userId": 1,
    "msgId": "20000001145741868374200001",
    "msgType": "ORDER_RETURN_CREATE_TO_SELLER",
    "msgData": {
        "SALERETURNAPPROVE": {
            "Guid": "c52df7b781f556922f94f5b1595c8bce",
            "BillNO": 9,
            "CustomerCode": "erpbuyerfir132",
            "BillDate": "2016-03-08 14:31:23",
            "EmployeeCode": "",
            "SellItem": "",
            "SendAddressCode": "",
            "Remark": ""
        },
        "SALERETURNAPPROVEDETAIL": [{
            "Guid": "892c91e0a653ba19df81a90f89d99bcd",
            "MainGuid": "c52df7b781f556922f94f5b1595c8bce",
            "Materielcode": "1220102034",
            "Quantity": 10,
            "ReturnReason": "reason",
            "AmountTax": 99,
            "TaxUnitPrice": 9.9,
            "BatchNumber": "Bnum",
            "BatchNo": "bNo",
            "UseFulDate": "2016-03-30",
            "Remark": ""
        }]
    }

//
// var msgData = {
//    "returnId": "SCCreturnId_18",//SCC退货单号
//    "clientERPCode": "无",//ERP客户编号
//    "clientLicesNo": "无",//客户营业执照号
//    "operatorId": 11,//操作员SCC编号
//    "returnDetails": [{
//        "goodsId": 1,//商品SCC编号
//        "quantity": 12,//数量
//        "detailRemark": "remark",//备注
//        "licenseNo": "PZWH",//批准文号
//        "price": 9.9,//价格
//        "batchNum": "Bnum",//批次号
//        "batchNo": "bNo"//批号
//    }],
//    "remark": "121"
//}

**/

/**
 *7.SELLER在ERP审核退货请求  ORDER_RETURN_CONFIRM_FROM_SELLER
退货单审核:
 /home/xdw/scc-src/apps/api/modules/order.js 939


{"version":"1.0",
        "msgId":"10a4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
        "msgType":"ORDER_RETURN_CONFIRM_FROM_SELLER",
        "msgData":   {"XSTHHead":[{
                     "GUID": "004",
                     "BILLNO": "004",
                     "IsAuditing": "1",
                     "IsClose": "0"},
                     {
                     "GUID": "017",
                     "BILLNO": "017",
                     "IsAuditing": "1",
                     "IsClose": "0"}]
                     },
        "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
        }


 "XSTHHead":[{
                     "GUID": "002",//SCC退货单号+"SCC"生成的GUID
                     "BILLNO": "002",//SCC退货单号
                     "IsAuditing": "1",//审核标志
                     "IsClose": "0"},//关闭标志
取消该退货单:
 {"version":"1.0",
         "msgId":"10a4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
         "msgType":"ORDER_RETURN_CONFIRM_FROM_SELLER",
         "msgData":   {"XSTHHead":[{
                      "GUID": "020",
                      "BILLNO": "002",
                      "IsAuditing": "0",
                      "IsClose": "1"}]
                      },
         "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
         }

 **/

/**
 *8.BUYER登录SCC提交退货发货数据  ORDER_RETURN_SHIP_TO_SELLER
 *
 * /home/xdw/scc-src/apps/order/model.js 1145
 * notifyERPReturnShipped
 * todo 补充缺少的退货发货数据
 * 退货的数据格式:
 *
{
    "ReturnInfo": {
        "returnId": "004",
        "clientErpCode": "erp151515",
        "shipId": 0,
        "orderId": 0,
        "logisticsNo": "1211212",
        "remark": "1212"
    },
    "ReturnDetails": [{
        "returnId": 4,
        "orderId": 0,
        "goodsId": 754,
        "quantity": 2,
        "price": 0,
        "drugESC": "12121",
        "batchNo": null,
        "batchNum": "121",
        "goodsLicenseNo": null,
        "inspectReportURL": "/static/upload/0.36600165138952434.jpg",
        "goodsProduceDate": "2016-03-07T16:00:00.000Z",
        "goodsValidDate": "2016-03-30T16:00:00.000Z"
    }, {
        "returnId": 4,
        "orderId": 0,
        "goodsId": 754,
        "quantity": null,
        "price": 9,
        "drugESC": null,
        "batchNo": "bNo12",
        "batchNum": "bNum12",
        "goodsLicenseNo": "国药准字H34020418",
        "inspectReportURL": null,
        "goodsProduceDate": null,
        "goodsValidDate": null
    }]
}


 "ReturnInfo": {
        "returnId": "004",//退货单号
        "clientErpCode": "erp151515",//客户的ERP编号
        "shipId": 0,//发货号
        "orderId": 0,//订单号
        "logisticsNo": "1211212",//物流编码
        "remark": "1212"//备注
    },
 "ReturnDetails": [{
        "returnId": 4,//退货单号
        "orderId": 0,//订单号
        "goodsId": 754,//商品SCC编号
        "quantity": 2,//数量
        "price": 0,//价格
        "drugESC": "12121",//电子监管吗
        "batchNo": null,//批号
        "batchNum": "121",//批次号
        "goodsLicenseNo": null,//商品批准文号
        "inspectReportURL": "/static/upload/0.36600165138952434.jpg",//批次检验报告
        "goodsProduceDate": "2016-03-07T16:00:00.000Z",//生产日期
        "goodsValidDate": "2016-03-30T16:00:00.000Z"//有效期
    }
 *
 *
 *
**/

/**
 *9.SELLER在ERP返回退货收货数据  ORDER_RETURN_RECEIVE_FROM_SELLER
 *
 *  /home/xdw/scc-src/apps/api/modules/order.js  1177
 *
 *
 *
 {
    "version": "1.0",
    "msgId": "11a4533c1b-a705-486d-b7aa-f0ebcec054ea1456820001077000012",
    "msgType": "ORDER_RETURN_RECEIVE_FROM_SELLER",
    "msgData": {
        "FhdzkHead": [{
            "BILLNO": "004",
            "BILLDATE": "2015-10-22T00:00:00",
            "BILLTIME": "13:05:54",
            "ORDERBILLNO": "003",
            "ORDERGUID": "1417834129879",
            "NOTES": "调拨生成",
            "FHRY": "MANAGE",
            "FHRQ": "",
            "CUSTOMGUID": null,
            "CUSTOMNAME": null
        }],
        "Fhdzk": [{
            "LSH": "004",
            "DH": "dh121097",
            "HH": "1220102034",
            "PH1": "bn1297",
            "PCDH": "bnum121",
            "PH1_XQ": "2016-09-09",
            "SCRQ": "2015-09-09",
            "HTBH": "orderdetailId",
            "SL": "10",
            "BZ": "备注",
            "ReportURL": "批次检验报告URL",
            "MonitorCode": "监管码"
        }]
    },
    "checksum": "8cbf6e1911c97ab1640ce1faed29a57e"
}
 //{"version":"1.0",
 //   "msgId":"12b4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
 //   "msgType":"ORDER_RETURN_RECEIVE_FROM_SELLER",
 //   "msgData":   {"XSTHSHHead":
 //                   {
 //                     "GUID": "0182308",//SCC退货单号+"SCC"生成
 //                     "BillNo": "018",//SCC退货单号
 //                     "RECEIVETIME": "2016-03-03 12-22-20",//收货时间
 //                     "REMARK": "shipremark",//备注
 //                     "ITEMS": [
 //                         {
 //                             "guid": "detailshipguid",//明细编号
 //                             "goodsId": "724",//SCC订单号
 //                             "batchNo":"batNO1",//批号
 //                             "drugESC": "drugesctest1",//电子监管吗
 //                             "batchNum": "batchNum1",//批次号
 //                             "inspectReportURL": "url:123",//质检报告
 //                             "goodsProduceDate": "2016-01-01",//生产日期
 //                             "goodsValidDate": "20116-10-10",//效期
 //                             "detailNo": 2,//明细唯一吗
 //                             "quantity": 1,//数量
 //                             "remark": "detailreamrk1"//备注
 //                         },
 //                         {
 //                           "goodsId": "772",
 //                           "drugESC": "drugesctest2",
 //                           "batchNo":"batNO2",
 //                           "batchNum": "batchN2",
 //                           "inspectReportURL": "url:223",
 //                           "goodsProduceDate": "2016-01-01",
 //                           "goodsValidDate": "20116-10-10",
 //                           "detailNo": 1,
 //                           "quantity": 2,
 //                           "remark": "detailreamrk2"
 //                         }
 //                     ]
 //                   }
 //                },
 //   "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
 //   }
 *

 3.SCC订单取消(BUYER登录SCC实现)
 /home/xdw/scc-src/apps/order/controller.js
 notifyERPOrderREJECT
 {
"version":"1.0",
"msgId":"20a4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
"msgType":"B2B_ORDER_RETURN_CREATE_FROM_SELLER",
"msgData":
{"XSJSHead":[
{"GUID":"1","BILLNO":"1"}
]},
"checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
}
 **/
 /**
 *
 *  退货发货完成,订单流程对接OK
 *
 *
**/


