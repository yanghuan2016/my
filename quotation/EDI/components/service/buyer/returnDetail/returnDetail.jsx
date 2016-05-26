/**
 * buyer退货详情页
 * 字段：商品名称,生产单位,剂型,货号,图片地址,退货数量,无税/含税单价,含税小计
 *
 * @type {*|exports|module.exports}
 */

var React = require('react');
var logger = require('util/logService');
var Table =require('antd').Table;
var Button = require('antd').Button;
var Modal = require('antd').Modal;
var URL = require('edi/constantsUrl')();
var Style = require('./returnDetail.css');
var UserStore = require('ediStores/userStore');
var ReturnStore = require('ediStores/buyer/returnStore');
var Price = require('ediComponents/basic/price/price');
var ReturnAction = require('ediAction/buyer/returnAction');
var Head = require('ediComponents/basic/detailHead/detailHead');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var OrderInfo = require('ediComponents/basic/orderInfo/orderInfo');
var BatchInfoItem = require('ediComponents/basic/batchInfoItem/batchInfoItem');
var FixedBanner = require('ediComponents/basic/fixedBanner/fixedBanner');
var history = require('js/history');

var cookie = require('util/cookieUtil');
var ReturnDetail = React.createClass({
    getInitialState: function () {
        var returnId = this.props.params.id;
        var batchWindow = this.batchWindow;
        return{
            loading: false,
            visible: false,
            returnId:returnId,
            head:[{title:"商品信息",dataIndex:"goodsInfo",
                render(text, data) {
                    return (
                        <GoodsItem goodsDetail={data.goodsInfo}/>
                    )}},
                {title:"退货数量",dataIndex:"quantity",render(text,data){
                    var quantity = 0;
                    data.batchDetail.map(function(item){
                        quantity+= item.quantity;
                    });
                    return(
                        <div>{quantity}件</div>
                    )
                }},
                {title:"【批次】/数量",dataIndex:"batchNum",render(text,data){
                    var batch = [];
                    data.batchDetail.map(function(item){
                        batch.push(<div data={data.guid} onClick={batchWindow}>【{item.batchNum}】/{item.quantity} </div>);
                    });
                    return(
                        <div>{batch}</div>
                    )
                }},
                {title:"无税/含税单价",dataIndex:"price",render(text,data){
                    var price = [];
                    data.batchDetail.map(function(item){
                        price.push(<div><Price value={item.price}/>/<Price value={item.taxPrice}/></div>);
                    });
                    return(
                        <div>{price}</div>
                    )
                }}, {title:"含税小计",dataIndex:"goodsSubtotal",render(text,data){
                    var amount = 0;
                    data.batchDetail.map(function(item){
                        amount+= item.subtotal;
                    });
                    return(
                        <div><Price value={amount}/></div>
                    )
                }}],
            listData:ReturnStore.getReturnDetail(returnId)
        }
    },
    componentWillMount: function () {
        logger.enter();
        if(UserStore.getEnterpriseId()){
            ReturnAction.returnDetailAction(this.state.returnId, UserStore.getEnterpriseId());
        }
        ReturnStore.addChangeListener(this.returnInfo);
    },
    componentWillUnmount: function(){
        ReturnStore.removeChangeListener(this.returnInfo);
    },
    returnInfo: function () {
        logger.enter();
        this.setState({
            listData:  ReturnStore.getReturnDetail(this.state.returnId)
        });
    },
    batchWindow: function (event) {
        ReturnAction.returnBatchAction(event.currentTarget.attributes["data"].value);
        this.showModal();
    },
    showModal: function () {
        this.setState({
            batchInfo:ReturnStore.getBatchList(),
            visible: true
        });
    },
    handleCancel: function () {
        this.setState({visible: false});
    },
    render:function(){
        var goodstotal = 0;
        var taxs = 0;
        var amounts = 0;
        var buttons = [{
            name: "返回",
            type: "primary",
            onClick: function () {
                history.pushState(null, '/buyer/return');
            }
        }];
        var returnDetails = this.state.listData.returnDetails;
        returnDetails.map(function (item){
            for(var index in item.batchDetail){
                amounts+= item.batchDetail[index].subtotal;
                taxs+= item.batchDetail[index].taxSubtotal;
                goodstotal+= item.batchDetail[index].goodsSubtotal
            }
        });
        var returnId= "退货单号"+this.state.listData.guid;
        return(
            <div>
                <Head orderId={returnId} name={this.state.listData.sellerName} status={this.state.listData.state}/>
                <div className={Style.table}>
                    <Table
                        columns={this.state.head}
                        dataSource={this.state.listData.returnDetails}
                        className="table-font-size"
                        pagination={false}/>
                </div>
                <div className={Style.total}>
                    <div className={Style.sum}>金额：<Price value={goodstotal}/></div>
                    <div className={Style.tax}>税额：<Price value={taxs}/></div>
                    价税合计：<div className={Style.amount}><span><Price value={amounts}/></span></div>
                </div>
                <div className={Style.table}><OrderInfo orderDetails={this.state.listData.orderInfo}/></div>
                <div className={Style.fixedBanner}><FixedBanner buttons={buttons}/></div>
            </div>
        )
    }
});
module.exports = ReturnDetail;