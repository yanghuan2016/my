erp test


modules/goods.js

INQUERY_CREATE  :
   msg.msgData = {
                "PurchasePlanTemp": [{
                    "GUID": "0b02b2e6-bd28-41be-8023-a5e04d215fb6",
                    "MaterielCode": "20001",
                    "SupplierCode": "10001",
                    "PurchaseUpset": 0,
                    "UnitPriceTax": 10,
                    "BalancePeriod": 0,
                    "PlanQuantity": 200
                }, {
                    "GUID": "796c3da0-d4d5-4000-a84e-59fe59045eb4",
                    "MaterielCode": "10001",
                    "SupplierCode": "10001",
                    "PurchaseUpset": 0,
                    "UnitPriceTax": 10,
                    "BalancePeriod": 0,
                    "PlanQuantity": 200
                }, {
                    "GUID": "07bbd804-8ea7-467e-848b-19a5f8f4f930",
                    "MaterielCode": "10002",
                    "SupplierCode": "10001",
                    "PurchaseUpset": 0,
                    "UnitPriceTax": 10,
                    "BalancePeriod": 0,
                    "PlanQuantity": 200
                }, {
                    "GUID": "ad0689aa-5c25-4218-bcf3-528b177b9a4a",
                    "MaterielCode": "10003",
                    "SupplierCode": "10001",
                    "PurchaseUpset": 0,
                    "UnitPriceTax": 10,
                    "BalancePeriod": 0,
                    "PlanQuantity": 200
                }, {
                    "GUID": "b0880d8e-2fe1-44a1-96ac-811db1b06aac",
                    "MaterielCode": "20002",
                    "SupplierCode": "10001",
                    "PurchaseUpset": 0,
                    "UnitPriceTax": 10,
                    "BalancePeriod": 0,
                    "PlanQuantity": 200
                }, {
                    "GUID": "c3db3e2d-f2a5-4af7-b23c-2d1c1390573d",
                    "MaterielCode": "20003",
                    "SupplierCode": "",
                    "PurchaseUpset": 0,
                    "UnitPriceTax": 10,
                    "BalancePeriod": 0,
                    "PlanQuantity": 200
                }, {
                    "GUID": "d7cc282a-dcd8-4c82-8565-146077d252f9",
                    "MaterielCode": "60001",
                    "SupplierCode": "10002",
                    "PurchaseUpset": 0,
                    "UnitPriceTax": 10,
                    "BalancePeriod": 0,
                    "PlanQuantity": 200
                }]
            }


需插入的testData  阿莫西林:
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
INSERT INTO ClientSellerInfo(enterpriseId, enabled,erpCode, businessLicense) VALUES(5,1,'40627','65290001111111');
INSERT INTO ClientSellerInfo(enterpriseId, enabled,erpCode, businessLicense) VALUES(6,1,'40149','65290002222222');


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


 //调试报价接口:
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


   //比价订单生成接口
   {"version":"1.0",
      "msgId":"12a4548c1b-a705-486d-b7aa-f0ebcec054ea1456820001077000022",
      "msgType":"ORDER_CREATE",
      "msgData":   {"orderInfo":6,
                   "orderDetails":[
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
      
  
      
      //调试订单发货接口:
       {"version":"1.0",
         "msgId":"11a4533c1b-a705-486d-b7aa-f0ebcec054ea1456820001077000012",
         "msgType":"ORDER_SHIP_FROM_SELLER",
         "msgData":   {
                                      "guid": "testerpGuid",           
                                      "billNo": "testErpBillno",         
                                      "shipTime": "2016-03-03 12-22-20",      
                                      "orderId": "026",       
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
                                              "detailNo": 1.323,            
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

ERP发送到SCC 订单审核数据:

  GUID  //     内码（主键）--SCC发来的-orderId 同下billNo,任取一个都可
  BillNO//    订单编号—SCC发来的-orderId
  IsAuditing//     审核标志（1己审核，0未审核） 
  IsClose//     关闭标志（1己关闭，0未关闭）标记ERP内异常状态;
 
  //调试订单审核接口:
         {"version":"1.0",
           "msgId":"10a4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
           "msgType":"ORDER_CONFIRM_FROM_SELLER",
           "msgData":   {"XSDDHead":[{
                        "GUID": "037",
                        "BillNO": "037",
                        "IsAuditing": "1",
                        "IsClose": "0"},
                        {
                        "GUID": "039",
                        "BillNO": "039",
                        "IsAuditing": "1",
                        "IsClose": "0"},
                        {
                        "GUID": "040",
                        "BillNO": "040",
                        "IsAuditing": "1",
                        "IsClose": "0"
                        }
                        ]
                        },
           "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
           }  
             
             
             
//调试退货订单审核接口:
      {"version":"1.0",
        "msgId":"10a4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
        "msgType":"ORDER_RETURN_CONFIRM_FROM_SELLER",
        "msgData":   {"XSTHHead":[
        {"GUID":"31","BILLNO":"31","ISAUDITING":1,"ISCLOSE":1}
        ]},
        "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
        } 
        
        
        
//调试退货发货接口:
      {"version":"1.0",
        "msgId":"12b4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
        "msgType":"ORDER_RETURN_SHIP_FROM_BUYER",
        "msgData":   {"CGTHFHHead":
                        { 
                          "GUID": "testerpGuid",
                          "BillNo": "001",
                          "SHIPTIME": "2016-03-03 12-22-20",
                          "REMARK": "shipremark",
                          "ITEMS": [
                              {
                                  "guid": "detailshipguid",                  
                                  "goodsId": "724", 
                                  "batchNo":"batNO1", 
                                  "drugESC": "drugesctest1",                
                                  "batchNum": "batchNum1",               
                                  "inspectReportURL": "url:123", 
                                  "goodsProduceDate": "2016-01-01",       
                                  "goodsValidDate": "20116-10-10",       
                                  "detailNo": 2,            
                                  "quantity": 1,               
                                  "remark": "detailreamrk1"                  
                              },
                              {                
                                "goodsId": "772",               
                                "drugESC": "drugesctest2", 
                                "batchNo":"batNO2", 
                                "batchNum": "batchN2",               
                                "inspectReportURL": "url:223",       
                                "goodsProduceDate": "2016-01-01",       
                                "goodsValidDate": "20116-10-10",   
                                "detailNo": 1,            
                                "quantity": 2,               
                                "remark": "detailreamrk2" 
                              }
                          ]
                        }
                     },
        "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
        } 
        
       
        退货创建的数据:
        var returndata = {
                    "userId": 1,
                    "msgId": "20000001145734184532200001",
                    "msgType": "ORDER_RETURN_CREATE_TO_SELLER",
                    "msgData": {
                        "returnId": "SCCreturnId_2",
                        "clientERPCode": "无",
                        "clientLicesNo": "无",
                        "operatorId": 7,
                        "returnDetails": [
                            {
                                "goodsId": 1,
                                "quantity": 12,
                                "detailRemark": "remark",
                                "licenseNo": "PZWH",
                                "price": 9.9,
                                "batchNum": "Bnum",
                                "batchNo": "bNo"
                            }],
                        "remark": "121"
                    },
                    "checksum": "06be76517995fdae7744b55aec0f0f4e"
                }

        
//调试退货收货接口:
  {"version":"1.0",
    "msgId":"12b4533c1b-a706-486d-b7aa-f0ebcec054ea1456820001077000012",
    "msgType":"ORDER_RETURN_RECEIVE_FROM_SELLER",
    "msgData":   {"XSTHSHHead":
                    { 
                      "GUID": "testerpGuid",
                      "BillNo": "001",
                      "RECEIVETIME": "2016-03-03 12-22-20",
                      "REMARK": "shipremark",
                      "ITEMS": [
                          {
                              "guid": "detailshipguid",                  
                              "goodsId": "724", 
                              "batchNo":"batNO1", 
                              "drugESC": "drugesctest1",                
                              "batchNum": "batchNum1",               
                              "inspectReportURL": "url:123", 
                              "goodsProduceDate": "2016-01-01",       
                              "goodsValidDate": "20116-10-10",       
                              "detailNo": 2,            
                              "quantity": 1,               
                              "remark": "detailreamrk1"                  
                          },
                          {                
                            "goodsId": "772",               
                            "drugESC": "drugesctest2", 
                            "batchNo":"batNO2", 
                            "batchNum": "batchN2",               
                            "inspectReportURL": "url:223",       
                            "goodsProduceDate": "2016-01-01",       
                            "goodsValidDate": "20116-10-10",   
                            "detailNo": 1,            
                            "quantity": 2,               
                            "remark": "detailreamrk2" 
                          }
                      ]
                    }
                 },
    "checksum":"8cbf6e1911c97ab1640ce1faed29a57e"
    } 
    
    
    
 //调试采购订单生成订单接口:
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
     
        
  