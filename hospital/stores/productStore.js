/**
 * 患者store
 */
var Dispatcher = require('dispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var constants = require('base/constants');
var CHANGE_EVENT = 'change';
var logger = require('util/logService');

var productList = [];
var selectRecipeList = [];
var paperDisable = 'disabled';
var recipeTime = {
    prescriptionId: (new Date()).valueOf(),
    createOn: moment().format('YYYY-MM-DD')
};

var productStore = assign({}, EventEmitter.prototype, {
    // Emit Change event
    emitChange: function () {
        this.emit(CHANGE_EVENT);
    },
    // Add change listener
    addChangeListener: function (callback) {
        this.on(CHANGE_EVENT, callback);
    },
    // Remove change listener
    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    getProductList: function () {
        return productList;
    },

    getSelectRecipeList: function () {
        return selectRecipeList;
    },

    getPaperDisable: function () {
        return paperDisable;
    },

    /* 获取当前诊断单时间　*/
    getRecipeTime: function () {
        return recipeTime;
    }
});

Dispatcher.register(function (action) {

    switch (action.type) {

        /*　获取搜索的商品列表　*/
        case constants.SEARCH_PRODUCT_SUCCESS:
            var productListTemp = action.data;
            _.map(productListTemp, function (item) {
                item.dose = "";
                item.dailyTimes = "";
                item.takeMethods = "";
                item.medicationTime = "";
                item.quantity = 1;
                var quantity = isNaN(item.quantity) ? 0 : item.quantity;
                item.subtotal = quantity * Number(item.price);
            });
            productList = productListTemp;
            paperDisable = 'disabled';
            break;

        /*　处方详情　*/
        case constants.GET_RECIPTDETAIL:
            var result = action.data;
            if (result.length == 1 && !result[0].commonName) {
                selectRecipeList = [];
                paperDisable = 'disabled';
            } else {
                selectRecipeList = action.data;
                _.map(selectRecipeList, function (item) {
                    item.key = item.unicode;
                });
                recipeTime['prescriptionId'] = selectRecipeList[0].prescriptionInfoId;
                paperDisable = '';
            }
            break;

        /*　清空处方列表　*/
        case constants.SAVE_RECIPR_LIST:
            if (selectRecipeList.length <= 0) {
                paperDisable = 'disabled';
            } else {
                paperDisable = '';
            }
            break;

        /*　清空处方列表　*/
        case constants.CLEAR_RECIPR_LIST:
            selectRecipeList = [];
            paperDisable = '';
            recipeTime['prescriptionId'] = (new Date()).valueOf();
            break;

        /*　增加一条药品　*/
        case constants.ADD_RECIPEONE:
            var unicode = action.data;
            var filter = _.filter(selectRecipeList, function (item) {
                return item.unicode == unicode;
            });
            if (filter.length != 1) {
                var tempOne = _.filter(productList, function (item) {
                    return item.unicode == unicode;
                });
                selectRecipeList.push(tempOne[0]);
            }
            paperDisable = 'disabled';
            break;

        /*　删除一条药品　*/
        case constants.DELETE_ONE_RECIPEONE:
            var tempTwo = _.filter(selectRecipeList, function (item) {
                return item.unicode != action.data;
            });
            selectRecipeList = tempTwo;
            paperDisable = 'disabled';
            break;

        /*　设置一条药品的用法用量　*/
        case constants.SET_TAKE_METHODS:
            var data = action.data;
            _.map(selectRecipeList, function (item) {
                if (item.unicode == data.unicode) {
                    item[data.key] = data.value;
                    var quantity = isNaN(item.quantity) ? 0 : item.quantity;
                    item.subtotal = Number(item.price) * quantity
                }
            });
            paperDisable = 'disabled';
            break;

        default:
            return true;
    }
    productStore.emitChange();
    return true;
});

module.exports = productStore;