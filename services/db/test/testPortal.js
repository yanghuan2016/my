/*****************************************************************
 * 青岛雨人软件有限公司©2015版权所有
 *
 * 本软件之所有（包括但不限于）源代码、设计图、效果图、动画、日志、
 * 脚本、数据库、文档均为青岛雨人软件或其附属子公司所有。任何组织
 * 或者个人，未经青岛雨人软件书面授权，不得复制、使用、修改、分发、
 * 公布本软件的任何部分。青岛雨人软件有限公司保留对任何违反本声明
 * 的组织和个人采取法律手段维护合法权益的权利。
 *****************************************************************/

/*
 * unittest database service: addressbook
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2015-09-26    xdw-romens@issue#46
 *
 */


var assert = require("assert");
var app = require(__dirname+"/../../../app.js");

describe('dbServer->customer->portal', function() {
    var dbService = __dbService;
    var underscore = require("underscore");
    var customerDBName = __customerDBPrefix + "_127_0_0_1";
    var orderSeq = 1;
    var testCarouselData = {
        orderSeq:orderSeq,
        imgUrl:"url=123.jpg",
        link:"http://test.html",
        beginAt:"2015-10-22",
        endAt:"2015-11-22",
        remark:"123",
        deleted:false
    };
    var testLinkColumnData = {
        columnName:"联系我们",
        colomnIcon:"fa-home",
        orderSeq:orderSeq,
        isDeleted:false
    };
    var testLinksData = {
        columnId:1,
        name:"地址" ,
        orderSeq:1,
        html:"<html></html>" ,
        isDeleted:false
    };
    var testNewsLinkData = {
        newsTitle:"新闻标题",
        html:"<div>新闻正文</div>",
        alwaysOnTop:false,
        clientCategoryIdList:"[]",
        isAnnouncement:false,
        announceTo:"",
        isDeleted:false
    };
    var shopWindowData = {
        title:"橱窗标题",
        orderSeq:"1",
        mode:"ICONLIST",
        size:7,
        isDeleted:false
    };

    var showWindowDetailData = {
        shopWindowId:1,
        type:"GOODS",
        goodsId:1,
        promotionId:0,
        orderSeq:1,
        isDeleted:false
    };




    /* Test cases */


    describe('#addCarousel()', function(){
        it('Testing addCarousel with a normal Carousel object', function(done){
            var carouselData = testCarouselData;
            dbService.addCarousel(customerDBName, carouselData, function(err,resultId){
                if(!err){
                    assert(resultId != 0);
                    done();
                }
            });
        });
    });
    describe('#listCarousel()', function(){
        it('Testing listCarousel with a normal Carousel object', function(done){
            var carouselData = testCarouselData;
            carouselData.orderSeq = orderSeq+1;
            dbService.addCarousel(customerDBName, carouselData, function(err,carouselId){
                if(!err){
                  var  condition = {orderSeq:2}
                  dbService.listCarousel(customerDBName,condition,function(err,results){
                      if(!err){
                          assert(results != []);
                          done();
                      }
                  })
                }
            });
        });
    });
    describe('#updateCarousel()', function(){
        it('Testing updateCarousel with a normal Carousel object', function(done){
            var carouselData = testCarouselData;
            carouselData.orderSeq = orderSeq+2;
            var caroseId = 1;
            dbService.addCarousel(customerDBName, carouselData, function(err,carouselId){
                if(!err){
                    var updateData = {orderSeq:orderSeq+3};
                    dbService.updateCarousel(customerDBName,updateData,carouselId,function(err,results){
                        if(!err){
                            assert(results >0);
                            done();
                        }
                    })
                }
            });
        });
    });

    describe('#addLinkColumns()', function(){
        it('Testing addLinkColumns with a normal LinkColumns object', function(done){
            var linkColumnsData = testLinkColumnData;
            dbService.addLinkColumns(customerDBName, linkColumnsData, function(err,resultId){
                if(!err){
                    assert(resultId != 0);
                    done();
                }
            });
        });
    });

    describe('#addLinks()', function(){
        it('Testing addLinks with a normal LinkColumns object', function(done){
            var linksData = testLinksData;
            dbService.addLinks(customerDBName, linksData, function(err,resultId){
                if(!err){
                    assert(resultId != 0);
                    done();
                }
            });
        });
    });

    describe('#listLinkColumns()', function(){
        it('Testing listLinkColumns with a normal LinkColumns object', function(done){
            var  condition = ""
            dbService.listLinkColumns(customerDBName, condition, function(err,results){
                if(!err){
                    assert(results != []);
                    done();
                }
            })
        });
    });
    describe('#listLinks()', function(){
        it('Testing listLinks with a normal LinkColumns object', function(done){
            var  condition = ""
            dbService.listLinks(customerDBName, condition, function(err,results){
                if(!err){
                    assert(results != []);
                    done();
                }
            })
        });
    });

    describe('#updateLinkColumns()', function(){
        it('Testing updateLinkColumns with a normal LinkColumns object', function(done){
            var updateData = {orderSeq:orderSeq+3};
            var id = 1;
            dbService.updateLinkColumns(customerDBName, updateData,id, function(err,results){
                if(!err){
                    assert(results >0);
                    done();
                }
            })
        });
    });
    describe('#updateLinks()', function(){
        it('Testing updateLinks with a normal LinkColumns object', function(done){
            var updateData = {orderSeq:orderSeq+3};
            var id = 1;
            dbService.updateLinks(customerDBName, updateData,id, function(err,results){
                if(!err){
                    assert(results >0);
                    done();
                }
            })
        });
    });


    //describe('#addNewsLink()', function(){
    //    it('Testing addNewsLink with a normal NewsLink object', function(done){
    //        var newsLinkData = testNewsLinkData;
    //        dbService.addNewsLink(customerDBName, newsLinkData, function(err,resultId){
    //            if(!err){
    //                assert(resultId != 0);
    //                done();
    //            }
    //        });
    //    });
    //});

    describe('#listNewsLink()', function(){
        it('Testing NewsLink with a normal NewsLink object', function(done){
            var  condition = ""
            dbService.listNewsLink(customerDBName, condition, function(err,results){
                if(!err){
                    assert(results != []);
                    done();
                }
            })
        });
    });

    //describe('#updateNewsLink()', function(){
    //    it('Testing updateNewsLink with a normal NewsLink object', function(done){
    //        var updateData = {newsTitle:"新闻标题2",};
    //        var id = 1;
    //        dbService.updateNewsLink(customerDBName, updateData,id, function(err,results){
    //            if(!err){
    //                assert(results >0);
    //                done();
    //            }
    //        })
    //    });
    //});

    describe('#addShopWindow()', function(){
        it('Testing addShopWindowwith a normal ShopWindow object', function(done){
            var shopWindow = shopWindowData;
            dbService.addShopWindow(customerDBName, shopWindow, function(err,resultId){
                if(!err){
                    assert(resultId != 0);
                    done();
                }
            });
        });
    });

    describe('#addShowWindowDetail()', function(){
        it('Testing addShowWindowDetail with a normal ShowWindowDetail object', function(done){
            var newData = showWindowDetailData;
            dbService.addShowWindowDetail(customerDBName, newData, function(err,resultId){
                if(!err){
                    assert(resultId != 0);
                    done();
                }
            });
        });
    });

    describe('#listShopWindow()', function(){
        it('Testing list ShopWindow with a normal shopWindow object', function(done){
            var  condition = ""
            dbService.listShopWindow(customerDBName, condition, function(err,results){
                if(!err){
                    assert(results != []);
                    done();
                }
            })
        });
    });
    describe('#listShowWindowDetail()', function(){
        it('Testing ShowWindowDetail with a normal ShowWindowDetail object', function(done){
            var  condition = ""
            dbService.listShowWindowDetail(customerDBName, condition, function(err,results){
                if(!err){
                    assert(results != []);
                    done();
                }
            })
        });
    });

    describe('#updateShopWindow()', function(){
        it('Testing updateShopWindow with a normal ShopWindow object', function(done){
            var updateData = {orderSeq:2,};
            var id = 1;
            dbService.updateShopWindow(customerDBName, updateData,id, function(err,results){
                if(!err){
                    assert(results >0);
                    done();
                }
            })
        });
    });

    describe('#updateNewsLink()', function(){
        it('Testing updateShowWindowDetail with a normal updateShowWindowDetail object', function(done){
            var updateData = {orderSeq:2,};
            var id = 1;
            dbService.updateShowWindowDetail(customerDBName, updateData,id, function(err,results){
                if(!err){
                    assert(results >0);
                    done();
                }
            })
        });
    });



});
