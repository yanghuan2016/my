/**
 * buyer订单详情页
 * 字段：商品名称,生产单位,剂型,货号,图片地址,批准文号,订单数量,含税单价,小计
 *
 * @type {*|exports|module.exports}
 */

var React = require('react');
var logger = require('util/logService');
var Table = require('antd').Table;
var URL = require('edi/constantsUrl')();
var Style = require('./orderDetail.css');
var OrderStore = require('ediStores/buyer/orderStore');
var UserStore = require('ediStores/userStore');
var OrderAction = require('ediAction/buyer/orderAction');
var Head = require('ediComponents/basic/detailHead/detailHead');
var Price = require('ediComponents/basic/price/price');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var OrderInfo = require('ediComponents/basic/orderInfo/orderInfo');
var FixedBanner = require('ediComponents/basic/fixedBanner/fixedBanner');
var history = require('js/history');

var cookie = require('util/cookieUtil');
var OrderDetail = React.createClass({
    getInitialState: function () {
        var orderId = this.props.params.id;
        return {
            orderId: orderId,
            head: [{
                title: "商品信息", dataIndex: "goodsInfo",
                render(text, data) {
                    return (
                        <GoodsItem goodsDetail={data.goodsInfo}/>
                    )
                }
            },
                {
                    title: "订单数量",
                    dataIndex: "quantity",
                    render: function(text, data){
                        return (<span>{data.quantity}件</span>)
                    }
                },
                {
                    title: "含税单价", dataIndex: "inPrice",
                    render(text, data){
                        return (
                            <Price value={data.inPrice}/>
                        )
                    }
                },
                {
                    title: "小计", dataIndex: "total",
                    render(text, data){
                        return (
                        <Price value={(data.quantity * data.inPrice)}/>
                        )
                    }
                }],
            listData: OrderStore.getOrderDetailList(orderId)
        }
    },
    componentWillMount: function () {
        logger.enter();
        if (UserStore.getEnterpriseId()) {
            OrderAction.orderDetailAction(this.state.orderId, UserStore.getEnterpriseId());
        }
        OrderStore.addChangeListener(this.dataChange);
    },
    componentWillUnmount: function () {
        OrderStore.removeChangeListener(this.dataChange);
    },
    dataChange: function () {
        this.setState({
            listData: OrderStore.getOrderDetailList(this.state.orderId)
        });
    },
    render: function () {
        var buttons = [{
            name: "返回",
            type: "primary",
            onClick: function () {
                history.pushState(null, '/buyer/order');
            }
        }];
        var orderId = "订单号" + this.state.listData.billNO;
        return (
            <div>
                <Head orderId={orderId} name={this.state.listData.sellerName}/>

                <div className={Style.table}>
                    <Table
                        columns={this.state.head}
                        dataSource={this.state.listData.goods}
                        className="table-font-size"
                        pagination={false}/>
                </div>
                <div className={Style.total}>合计：<Price value={this.state.listData.subtotal}/></div>
                <div className={Style.table}><OrderInfo orderDetails={this.state.listData.orderInfo}/></div>
                <div className={Style.fixBanner}><FixedBanner buttons={buttons}/></div>
            </div>
        )
    }
});
module.exports = OrderDetail;