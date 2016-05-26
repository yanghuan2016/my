var expect = require("chai").expect;

var initEnv = require("./initEnv")();

var MsgTransmitter = require('../msgTransmitter');

var cloudDbName = global.__cloudDbName;
var dbService = global.__dbService;
var redisConnection = global.__redisClient;
var logger = global.__logService;

describe("testMsgTransmitter", function () {

    xit("B2B_CLIENT_NEW_TO_SELLER", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);

        var newClientId = 1;        // client1: buyer1
        var sellerEnterpriseId = 2; // enterprise: sm127

        msgTransmitter.B2B_CLIENT_NEW_TO_SELLER(newClientId, sellerEnterpriseId, function(error, feedback) {
            if (error) {
                logger.error(error);
            }

            expect(feedback).not.equal(undefined);
            done();
        });
    });

    xit("B2B_REQUEST_CLIENT_TO_SELLER", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);

        var enterpriseId = 2;

        msgTransmitter.B2B_REQUEST_CLIENT_TO_SELLER(enterpriseId, function (error, result, asyncFieldClient) {
            if (error) {
                logger.error(error);
            }
            console.log('asyncFieldClient', asyncFieldClient);
            console.log('------------------------');
            console.log('result', result);
            console.log('result json:', JSON.stringify(result));
            console.log('------------------------');
            console.log('asyncFieldClient', asyncFieldClient);
            console.log('asyncFieldClient', JSON.stringify(asyncFieldClient));
            console.log('------------------------');

            expect(result).not.equal(undefined);
            done();
        });
    });

    xit("B2B_REQUEST_CLIENT_CATEGORY_TO_SELLER", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);

        var sellerEnterpriseId = 2; // enterprise: sm127

        msgTransmitter.B2B_REQUEST_CLIENT_CATEGORY_TO_SELLER(sellerEnterpriseId, function(error, feedback) {
            if (error) {
                logger.error(error);
            }

            expect(feedback).not.equal(undefined);
            done();
        });
    });

    xit("B2B_REQUEST_SKU_TO_SELLER", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);

        var sellerEnterpriseId = 2; // enterprise: sm127

        msgTransmitter.B2B_REQUEST_SKU_TO_SELLER(sellerEnterpriseId, function(error, feedback) {
            if (error) {
                logger.error(error);
            }

            expect(feedback).not.equal(undefined);
            done();
        });
    });

    xit('B2B_REQUEST_GOODS_TYPES_TO_SELLER', function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);

        var enterpriseId = 3;
        msgTransmitter.B2B_REQUEST_GOODS_TYPES_TO_SELLER(enterpriseId, function (error, feedback) {
            if (error) {
                logger.error(error);
            }

            expect(feedback).not.equal(undefined);

            done();
        });
    });

    xit("B2B_REQUEST_GSP_RANGE_TO_SELLER", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);

        var sellerEnterpriseId = 2;
        msgTransmitter.B2B_REQUEST_GSP_RANGE_TO_SELLER(sellerEnterpriseId, function (error, feedback) {
            if (error) {
                logger.error(error);
            }
            expect(feedback).not.equal(undefined);
            done();
        });
    });

    xit("B2B_INSERT_CLIENT_SALE_SCOPE", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);

        var sellerEnterpriseId = 2;

        msgTransmitter.B2B_INSERT_CLIENT_SALE_SCOPE(sellerEnterpriseId, function (error, feedback) {
            if (error) {
                logger.error(error);
                return callback();
            }

            expect(feedback).not.equal(undefined);
            done();
        });
    });

    xit("EDI_REQUEST_BUYER_ALL_TO_SELLER", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);

        var sellerEnterpriseId = 2;

        msgTransmitter.EDI_REQUEST_BUYER_ALL_TO_SELLER(sellerEnterpriseId, function (error, feedback) {


            expect(error).to.equal(null);
            expect(feedback).not.equal(undefined);
            done();
        });

    });

    xit("EDI_REQUEST_SELLER_ALL_TO_SELLER", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);
        var buyerEnterpriseId = 6;

        msgTransmitter.EDI_REQUEST_SELLER_ALL_TO_BUYER(buyerEnterpriseId, function (error, feedback) {

            expect(error).to.equal(null);
            expect(feedback).not.equal(undefined);
            done();
        });
    });

    xit("EDI_REQUEST_SALESMAN_ALL_TO_SELLER", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);
        var buyerEnterpriseId = 2;

        msgTransmitter.EDI_REQUEST_SALESMAN_ALL_TO_SELLER(buyerEnterpriseId, function (error, feedback) {

            expect(error).to.equal(null);
            expect(feedback).not.equal(undefined);
            done();
        });
    });

    xit("B2B_REQUEST_GOODS_WILL_BE_EXPIRED_TO_SELLER", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);
        var buyerEnterpriseId = 2;
        var expirationDate = 3;

        msgTransmitter.B2B_REQUEST_GOODS_WILL_BE_EXPIRED_TO_SELLER(buyerEnterpriseId, expirationDate, function (error, feedback) {

            expect(error).to.equal(null);
            expect(feedback).not.equal(undefined);
            done();
        });
    });

    it("ERI_REQUEST_GOODS_SYNC", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);
        var enterpriseId = 2;

        msgTransmitter.ERI_REQUEST_GOODS_SYNC(enterpriseId, 5000, function (error, result) {

            expect(error).to.equal(null);
            expect(result).not.equal(undefined);
            done();
        });
    });

    xit("EDI_PING_TO_ERP", function (done) {
        var msgTransmitter = new MsgTransmitter(cloudDbName, dbService, redisConnection);
        var buyerEnterpriseId = 2;
        var ping = 100;

        msgTransmitter.EDI_PING_TO_ERP(buyerEnterpriseId, ping, function (error, feedback) {

            expect(error).to.equal(null);
            expect(feedback).not.equal(undefined);
            done();
        });
    });

});