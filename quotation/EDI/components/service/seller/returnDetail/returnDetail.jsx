/**
 * seller退货详情页
 * 字段：商品名称,生产单位,剂型,货号,图片地址,退货数量,无税/含税单价,含税小计
 *
 * @type {*|exports|module.exports}
 */

var React = require('react');
var logger = require('util/logService');
var Table = require('antd').Table;
var Button = require('antd').Button;
var Modal = require('antd').Modal;
var URL = require('edi/constantsUrl')();
var UserStore = require('ediStores/userStore');
var Style = require('./returnDetail.css');
var Price = require('ediComponents/basic/price/price');
var ReturnStore = require('ediStores/seller/returnStore');
var ReturnAction = require('ediAction/seller/returnAction');
var Head = require('ediComponents/basic/detailHead/detailHead');
var BatchInfoItem = require('ediComponents/basic/batchInfoItem/batchInfoItem');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var OrderInfo = require('ediComponents/basic/orderInfo/orderInfo');
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
                        batch.push(<div data={data.key} onClick={batchWindow}>【{item.batchNum}】/{item.quantity}</div>);
                    });
                    return (
                        <div>{batch}</div>
                    );

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
                        <Price value={amount}/>
                    )
                }}],
            listData:ReturnStore.getReturnDetail(returnId)
        }

    },
    componentDidMount: function () {
        logger.enter();
        var user = UserStore.getEnterpriseInfo();
        ReturnStore.addChangeListener(this.dataChange);
        ReturnAction.returnDetailAction(this.state.returnId,user.enterpriseId);
    },
    dataChange: function () {
        this.setState({
            listData: ReturnStore.getReturnDetail(this.state.returnId)
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
    _backForward: function () {
        var href = window.location.href;
        window.location.href = href.split("seller")[0] + "seller/return";
    },
    render: function () {
        var goodstotal = 0;
        var taxs = 0;
        var amounts = 0;
        var returnDetails = this.state.listData.returnDetails;
        returnDetails.map(function (item){
            for(var index in item.batchDetail){
                amounts+= item.batchDetail[index].subtotal;
                taxs+= item.batchDetail[index].taxSubtotal;
                goodstotal+= item.batchDetail[index].goodsSubtotal
            }
        });
        var returnId = "退货单号" + this.state.listData.guid;
        return (
            <div>
                <Head orderId={returnId} name={this.state.listData.buyerName} />
                <div className={Style.table}>
                    <Table columns={this.state.head}
                           className="table-font-size"
                           dataSource={this.state.listData.returnDetails}
                           pagination={false}/>
                </div>
                <div className={Style.total}>
                    <div className={Style.sum}>金额：<Price value={goodstotal}/></div>
                    <div className={Style.tax}>税额：<Price value={taxs}/></div>
                    价税合计：
                    <div className={Style.amount}><span><Price value={amounts}/></span></div>
                </div>
                <div className={Style.table}><OrderInfo orderDetails={this.state.listData.orderInfo}/></div>
                <div className={Style.fixBt}>
                    <Button type="primary" onClick={this._backForward}>返回</Button>
                </div>
            </div>
        )
    }
});
module.exports = ReturnDetail;