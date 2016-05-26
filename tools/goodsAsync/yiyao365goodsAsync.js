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
 * yiyao365goodsAsync
 *      scc's startup initialization
 *
 * 修订历史：
 * -----------------------------------------------------------------------------
 * 2016/1/15     romens@xdw
 *
 */

/* initdb */

var dbConfig = {
    "connectionLimit"     : 1,
    "host"                : "cd",
    "user"                : "root",
    "password"            : "romens@2015",
    "logSql"		      : true
};

var http = require("http");
var sprintf = require("sprintf-js").sprintf;
var underscore = require('underscore');
var mysql = require('mysql');
var async = require('async');
var crypto = require('crypto');
var zlib = require('zlib');
var pool  = mysql.createPool(dbConfig);
var dbService = pool;

var dbName = "hard code cloudDBName";

//接口URL
var yiyao365host = "ihealth.yiyao365.cn";
var getGoodsNumUrl = "/index.php/GetInfo/GetAllCount";
var getGoodsBaseInfoUrl ="/index.php/GetInfo/GetValue";
var getGoodsInfoUrl = "/index.php/GetInfo/GetAllValByHH";

var EventProxy = require('eventproxy');

var PAGESIZE = 10000;

function GoodsAsync (cloudDBName){
    this.cloudDBName = cloudDBName || 'CloudDB_romens';
}


//向医药365服务器请求所有的商品数量
GoodsAsync.prototype.getyiyao365AllGoodsNum =function (cb) {
    var checkCode = getMD5("SCC");
    var url = 'http://'+yiyao365host+getGoodsNumUrl+'?checkcode='+checkCode;
    console.log('获取商品数量URL:'+url);
    http.get(url, function(res) {
        res.setEncoding('utf8');
        var num='';
        res.on('data', function (chunk) {
            num += chunk;
        });
        res.on('end', function() {
            cb(null, num);
        });
    }).on('error', function(e) {
        cb(e);
    });

};

GoodsAsync.prototype.getPagedyiyao365GoodsInfo=function(total,cb) {
    var count = Math.ceil(total/PAGESIZE);

    var ep = new EventProxy();
    ep.fail(cb);
    ep.after('base_data', count, function (list) {
        cb(null, list);
    });

    var checkCode = getMD5("SCC");
    var getData = function(i, errTimer) {
        var url = 'http://'+yiyao365host+getGoodsBaseInfoUrl+'?checkcode='+checkCode+'&p='+i;
        console.log(url);
        http.get(url, function(res) {
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function(d) {
                body += d;
            });
            res.on('end', function() {
                try {
                    var parsed = JSON.parse(body);
                    console.log('get page:'+i+', first data: '+JSON.stringify(parsed[0]));
                    ep.emit('base_data', parsed);
                } catch (err) {
                    if (err) {
                        console.log(err);
                        return ep.emit('error', err);
                    }
                }
            });
        }).on('error', function(err) {
            errTime++
            if(errTimer < 2){
                getData(i, errTimer);
            }else {
                return ep.emit('error', err);
            }
        });
    };

    for(var i=1;i<=count;i++){
        var errTimer = 0;
        (function(i) {
                setTimeout(function() {
                    getData(i, errTimer);
                }, 100*i);
            }
        )(i)
    }

};

GoodsAsync.prototype.insertCloudDBGoodInfo = function(list, cb) {
    var INSERT_CLOUDDB_GOODSCACHE = "INSERT INTO %s.GoodsCache (skuNo, yiyao365Update) VALUES ? ON DUPLICATE KEY UPDATE yiyao365Update=VALUES(yiyao365Update);";
    var sql = sprintf(INSERT_CLOUDDB_GOODSCACHE, this.cloudDBName);
    async.mapSeries(
        list,
        function(item, cb) {
            dbService.query(sql, [item], function(err, results) {
                if(!err) console.log('success insert anther page: '+item[0]);
                cb(err, results);
            });
        },
        function(err, results) {
            cb(err, results);
        }
    )

};

GoodsAsync.prototype.getCloudDBGoodsInfo =function (cb) {
    //sql语句
    var SELECT_CLOUDDB_GOODSCACHE = "select skuNo from %s.GoodsCache where yiyao365Update > lastAsyncDate";
    var sql = sprintf(SELECT_CLOUDDB_GOODSCACHE, this.cloudDBName);
    dbService.query(sql, function (err, results) {
        if (err) {
            cb(err);
        } else {
            console.log('get all the '+results.length+' diff');
            cb(null, results);
        }
    });
};

GoodsAsync.prototype.getGoodsInfoByGuid = function(guidList,cb) {
    var count = Math.ceil(guidList.length/(PAGESIZE/10));
    var checkCode = getMD5("SCC");
    var self = this;

    var getData = function(_guids, i, errTimer, cb) {
        console.log('send request: '+i+'/'+count+'for gooodsInfo');
        var postData = "HH="+_guids;
        var options = {
            hostname: yiyao365host,
            path: getGoodsInfoUrl+'?checkcode='+checkCode,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length,
                'Accept-Encoding': "gzip"
            }
        };
        // Set up the request
        var post_req = http.request(options, function(res) {

            var gunzip = zlib.createGunzip();
            res.pipe(gunzip);

            var chunks =[];
            gunzip.on('data', function (chunk) {
                chunks.push(chunk);
            });
            gunzip.on('end', function() {
                try {
                    var buffer = Buffer.concat(chunks);
                    console.log('get goods info page: ' + i);
                    cb(null, JSON.parse(buffer.toString()));

                }catch(err) {
                    cb(err);
                }

            });
        });
        post_req.on('error', function(err) {
            errTimer++
            if(errTimer < 2){
                getData(guids, i, errTimer, cb);
            }else {
                console.log('请求page失败！');
                cb(err);
            }
        });
        post_req.write(postData);
        post_req.end();
    };

    var list = [];
    for (var i=1; i<=count; i++) {
        var start = 0 + (PAGESIZE/10) * (i - 1);
        var end = i * (PAGESIZE/10);
        var guids = guidList.slice(start, end).join();
        list.push(guids);
    }

    var timer = 1;
    async.mapSeries(
        list,
        function(item, cb) {
            getData(item, timer++, 0, function(err, results) {
                //cb(err, results);
                if(err) {
                    cb(err);
                }else {
                    self.batchInsertIntoGoodsCache(results, cb);
                }
            });
        },
        function(err, results) {
            cb(err, results);
        }
    );



    //var ep = new EventProxy();
    //ep.fail(cb);
    //ep.after('goods_info', count, function (list) {
    //    try{
    //        cb(null, list);
    //    }catch(e) {
    //        console.log(e);
    //    }
    //
    //});
    //
    //
    ///*
    // 重要的事情做三遍
    // */
    //var errTimer = 0;
    //var getData = function(_guids, i) {
    //
    //    console.log('send request: '+i+' for gooodsInfo');
    //
    //    var postData = "HH="+_guids;
    //    console.log(postData);
    //    var options = {
    //        hostname: yiyao365host,
    //        path: getGoodsInfoUrl+'?checkcode='+checkCode,
    //        method: 'POST',
    //        headers: {
    //            'Content-Type': 'application/x-www-form-urlencoded',
    //            'Content-Length': postData.length
    //        }
    //    };
    //    console.log(options);
    //    // Set up the request
    //    var post_req = http.request(options, function(res) {
    //        var strBuffer = "";
    //        //res.setEncoding('utf8');
    //        res.on('data', function (chunk) {
    //            strBuffer+=chunk;
    //        });
    //        res.on('end', function() {
    //            try {
    //                console.log('get goods info page: '+i);
    //                console.log(JSON.parse(strBuffer));
    //                ep.emit('goods_info', JSON.parse(strBuffer));
    //            }catch(err) {
    //                if (err) {
    //                    console.log(err);
    //                    return ep.emit('error', err);
    //                }
    //            }
    //
    //        });
    //    });
    //    post_req.on('error', function(err) {
    //        errTimer++
    //        if(errTimer < 2){
    //            getData(guids, i);
    //        }else {
    //            console.log('请求page: '+i+' 失败！');
    //            return ep.emit('error', err);
    //        }
    //    });
    //    post_req.write(postData);
    //    post_req.end();
    //};
    //
    //for (var i=1; i<=count; i++) {
    //    var start = 0+PAGESIZE*(i-1);
    //    var end = i*PAGESIZE;
    //
    //    var guids = guidList.slice(start, 100).join();
    //    console.log(guids.slice(0, 100));
    //    getData(guids, i);
    //}
};

GoodsAsync.prototype.batchInsertIntoGoodsCache = function(dataList, cb) {
    var dbName = this.cloudDBName;
    listFieldListInfo(dbName, "GoodsCache", function(err, fieldlist){
        if(err){
            cb(err)
        }else{
            console.log(fieldlist);
            batchAddGoodsBasicInfo(dbName, fieldlist, dataList, function(err, results) {
                cb(err, results);
            });
        }
    });

};

GoodsAsync.prototype.async = function(cb) {
    var goodsAsync = new GoodsAsync();
    goodsAsync.getyiyao365AllGoodsNum(function(err, data) {
        if(err) return cb(err);

        goodsAsync.getPagedyiyao365GoodsInfo(data, function(err, data) {
            if(err) return cb(err);

            for(var i=0; i<data.length;i++) {
                for(var j=0;j<data[i].length;j++) {
                    var middle = data[i][j];
                    var HH = middle.HH;
                    var UPDATEDATE = middle.UPDATEDATE;
                    data[i][j] = [HH, UPDATEDATE];
                }
            }

            goodsAsync.insertCloudDBGoodInfo(data, function(err, data) {
                if(err) return cb(err);

                goodsAsync.getCloudDBGoodsInfo(function(err, data) {
                    if(err) return cb(err);

                    for(var i=0;i<data.length;i++) {
                        data[i] = data[i].skuNo;
                    }

                    goodsAsync.getGoodsInfoByGuid(data, function(err, data) {
                        if(err) return cb(err);
                        console.log(data);
                        done();
                    });
                });
            });
        });
    });
};

function listFieldListInfo(DBName,tableName, callback) {
    var sqlallField = sprintf("show full columns from  %s.%s;", DBName, tableName);
    dbService.query(sqlallField, function (err, result) {
        if (err) {
            callback(err);
        } else {
            //取出所有的表格FIELD，过滤掉自动插入的自增长id,创建日期，更新日期
            var filed_list = underscore.pluck(result, 'Field').slice(1, -2);
            callback(null, filed_list);
        }
    });
};

function batchAddGoodsBasicInfo(DBName,tableFieldList,goodsBasicInfo, callback){
    var goodsInfoList = [];
    for(var i=0;i<goodsBasicInfo.length;i++) {
        var arr = [];
        //用于字段的默认值调整和导入值的映射关系调整
        arr.push(goodsBasicInfo[i].GUID?goodsBasicInfo[i].GUID:"NULL");// guid,
        arr.push(goodsBasicInfo[i].HH?goodsBasicInfo[i].HH: "NULL");
        arr.push(goodsBasicInfo[i].BARCODE?goodsBasicInfo[i].BARCODE:"NULL");// barcode,
        arr.push(goodsBasicInfo[i].MEDICINETITLE?goodsBasicInfo[i].MEDICINETITLE:"NULL");// commonName,
        arr.push(goodsBasicInfo[i].ENGLISHNAME?goodsBasicInfo[i].ENGLISHNAME:"");
        arr.push(goodsBasicInfo[i].PZWH?goodsBasicInfo[i].PZWH:"");
        arr.push(goodsBasicInfo[i].OLDPZWH?goodsBasicInfo[i].OLDPZWH:"");
        arr.push(goodsBasicInfo[i].PRODUCTNAME?goodsBasicInfo[i].PRODUCTNAME:"NULL")
        arr.push(goodsBasicInfo[i].TYPE?goodsBasicInfo[i].TYPE:"NULL");
        arr.push(goodsBasicInfo[i].GG?goodsBasicInfo[i].GG:"NULL");
        arr.push(goodsBasicInfo[i].FACTORYADDRESS?goodsBasicInfo[i].FACTORYADDRESS:"NULL");
        arr.push(goodsBasicInfo[i].FACTORYNAME?goodsBasicInfo[i].FACTORYNAME:"NULL");
        arr.push(goodsBasicInfo[i].BWM?goodsBasicInfo[i].BWM:"NULL");
        arr.push(goodsBasicInfo[i].ZZ?goodsBasicInfo[i].ZZ:"NULL");
        arr.push(goodsBasicInfo[i].JJ?goodsBasicInfo[i].JJ:"NULL");
        arr.push(goodsBasicInfo[i].XHZY?goodsBasicInfo[i].XHZY:"NULL");
        arr.push(goodsBasicInfo[i].YLDL?goodsBasicInfo[i].YLDL:"NULL");
        arr.push(goodsBasicInfo[i].BLFY?goodsBasicInfo[i].BLFY:"NULL");
        arr.push(goodsBasicInfo[i].MEMO2?goodsBasicInfo[i].MEMO2:"NULL");
        arr.push(goodsBasicInfo[i].YFYL?goodsBasicInfo[i].YFYL:"NULL");
        arr.push(goodsBasicInfo[i].IMGPATH?goodsBasicInfo[i].IMGPATH:"NULL");
        arr.push(goodsBasicInfo[i].JX?goodsBasicInfo[i].JX:"NULL");
        arr.push(goodsBasicInfo[i].ZCFF?goodsBasicInfo[i].ZCFF:"NULL");
        arr.push(goodsBasicInfo[i].APPLYDATE?goodsBasicInfo[i].APPLYDATE:0);
        arr.push(goodsBasicInfo[i].PRICE?goodsBasicInfo[i].PRICE:0);
        arr.push(goodsBasicInfo[i].UPDATEDATE?goodsBasicInfo[i].UPDATEDATE:0);
        arr.push(goodsBasicInfo[i].UPDATEDATE?goodsBasicInfo[i].UPDATEDATE:0);

        goodsInfoList.push(arr);
    }


    var data = parseBatchInsert(tableFieldList);
    var sql = sprintf(" insert into %s.GoodsCache (%s) VALUES ? " +
        " ON DUPLICATE KEY UPDATE %s;", DBName, data.keys, data.values);
    console.log(sql);
    dbService.query(sql,[goodsInfoList],function(err,result){
        if (err) {
            callback(err);
        } else {
            console.log('sucess insert goods infos');
            console.log(result);

            callback(null, result.insertId);
        }
    });
};

function parseBatchInsert(keyList){
    var result = {keys:"",values:""};
    for(var i in keyList){
        result.keys += keyList[i] + "," ;
        result.values += keyList[i]+ "=VALUES("+keyList[i]+"),";

    }
    result.keys = result.keys.slice(0,-1);
    result.values = result.values.slice(0,-1);
    return result;
};


function generatorCheckCode() {
    var content = 'scc';
    var md5 = crypto.createHash('md5');
    md5.update(content);
    var d = md5.digest('hex');  //MD5值是5f4dcc3b5aa765d61d8327deb882cf99

};

function getMD5(text){
    var nowTime = new Date().Format("yyyyMMdd");
    var md5 = crypto.createHash("md5");
    md5.update(text+nowTime);
    var base64String = md5.digest().toString('base64').replace(/=/g, "-").replace(/\+/g, "_");
    console.log(base64String);
    return base64String;
}


// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d hs.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

module.exports = GoodsAsync;

