var licenseExpireAlert = require('../goodsAsync/LicenseExpireAlert');
var async = require('async');
var assert = require('chai').assert;
var EventProxy = require('eventproxy');

describe('test license Expire Alert', function() {
    this.timeout(6000000);
    /**
     * unit test below
     */
    //it('get CustomerDBList', function(done){
    //    var LicenseExpireAlert = new licenseExpireAlert();
    //    LicenseExpireAlert.getCustomerDBList(function(err, data) {
    //        console.log(data);
    //        assert.equal(err,null);
    //        done();
    //    });
    //});
    //
    //
    //
    //it('get clientGsp', function(done){
    //    var LicenseExpireAlert = new licenseExpireAlert();
    //    var customerList =  [{ id: 1,
    //        customerName: '神木医药网',
    //        customerDBSuffix: '192_168_100_14' },{ id: 3, customerName: '神木医药网', customerDBSuffix: '127_0_0_1' },
    //        { id: 8, customerName: 'buyer2', customerDBSuffix: 'buyer2' }];
    //    LicenseExpireAlert.getClientGspList(customerList,function(err,data){
    //        console.log(data);
    //        assert.equal(err,null);
    //        done();
    //    })
    //});

    //
    //it('compare license date', function(done){
    //    var LicenseExpireAlert = new licenseExpireAlert();
    //    var clientGspList =  [ { customerId: 1, customerName: '神木医药网', details: [ { id: 1,
    //        guid: null,
    //        clientId: 1,
    //        legalRepresentative: null,
    //        businessLicense: null,
    //        companyManager: null,
    //        businessLicenseValidateDate: "Thu Apr 21 2050 00:00:00 GMT+0800 (CST)",
    //        registeredCapital: null,
    //        businessAddress: null,
    //        limitedBusinessRange: null,
    //        limitedBusinessType: null,
    //        orgCode: null,
    //        orgCodeValidateDate: null,
    //        taxRegistrationLicenseNum: null,
    //        taxRegistrationLicenseNumValidateDate: null,
    //        foodCirculationLicenseNum: null,
    //        foodCirculationLicenseNumValidateDate: null,
    //        qualityAssuranceLicenseNum: null,
    //        qualityAssuranceLicenseNumValidateDate: null,
    //        medicalApparatusLicenseNum: null,
    //        medicalApparatusLicenseNumValidateDate: null,
    //        medicalApparatusType: null,
    //        healthProductsLicenseNum: null,
    //        healthProductsLicenseNumValidateDate: null,
    //        productionAndBusinessLicenseNum: null,
    //        productionAndBusinessLicenseNumIssuedDate: null,
    //        productionAndBusinessLicenseNumValidateDate: null,
    //        productionAndBusinessLicenseNumIssuedDepartment: null,
    //        storageAddress: null,
    //        mentaanesthesiaLicenseNum: null,
    //        mentalanesthesiaLicenseNumValidateDate: null,
    //        gmpOrGspLicenseNum: null,
    //        gmpOrGspLicenseNumValidateDate: null,
    //        hazardousChemicalsLicenseNum: null,
    //        hazardousChemicalsLicenseNumValidateDate: null,
    //        medicalInstitutionLicenseNum: null,
    //        medicalInstitutionLicenseNumValidateDate: null,
    //        maternalLicenseNum: null,
    //        maternalLicenseNumValidateDate: null,
    //        institutionLegalPersonCert: null,
    //        institutionLegalPersonCertValidateDate: null,
    //        gspImages: null,
    //        updatedOn: "Tue Mar 15 2016 16:16:39 GMT+0800 (CST)",
    //        createdOn: "Tue Mar 15 2016 16:16:39 GMT+0800 (CST)" } ]
    //},
    //        'Error: ER_NO_SUCH_TABLE: Table \'CustomerDB_dawei_buyer2.ClientGsp\' doesn\'t existcustomerId=8,buyer2 get clientGsp failed' ];
    //    LicenseExpireAlert.compareExpireLicense(clientGspList,function(err,data){
    //        console.log(data);
    //        assert.equal(err,null);
    //        done();
    //    })
    //});
    /**
     * unit test end
     */

    //
    it(' test  list all  license expire Days', function(done) {
        var LicenseExpireAlert = new licenseExpireAlert();
        async.waterfall([
            function(callback){
                LicenseExpireAlert.getCustomerDBList(function(err, customerList) {
                    callback(err, customerList);
                });
            },
            function(customerList, callback){
                LicenseExpireAlert.getClientGspList(customerList,function(err,clientGspList){
                    callback(err, clientGspList);
                })
            },
            function(clientGspList, callback){
                LicenseExpireAlert.compareExpireLicense(clientGspList,function(err,data){
                    callback(err,data);
                })
            }
        ], function (err, result) {
            // result now equals data
            console.log(result);
            assert.equal(err,null);
            done();
        });
    });

});


