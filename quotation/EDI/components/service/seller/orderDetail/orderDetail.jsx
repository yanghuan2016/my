/**
 * seller订单详情页
 * 字段：商品名称,生产单位,剂型,货号,图片地址,批准文号,订单数量,含税单价,小计
 *
 * added by sunshine 2016-04-20
 */

var React = require('react');
var logger = require('util/logService');
var Table = require('antd').Table;
var URL = require('edi/constantsUrl')();
var style = require('./orderDetail.css');
var Price = require('ediComponents/basic/price/price');
var OrderStore = require('ediStores/seller/orderStore');
var UserStore = require('ediStores/userStore');
var OrderAction = require('ediAction/seller/orderAction');
var Head = require('ediComponents/basic/detailHead/detailHead');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var OrderInfo = require('ediComponents/basic/orderInfo/orderInfo');
var FixedBanner = require('ediComponents/basic/fixedBanner/fixedBanner');
var Button = require('antd').Button;
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
                        return (
                            <span>{data.quantity}件</span>
                        )
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
    _backForward: function () {
        var href = window.location.href;
        window.location.href = href.split("seller")[0] + "seller/order";
    },
    componentWillMount: function () {
        logger.enter();
        //var orderId = this.props.params.id;
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
        var orderId = "订单号" + this.state.listData.billNo;
        return (
            <div>
                <Head orderId={orderId} name={this.state.listData.buyerName}/>

                <div className={style.table}>
                    <Table
                        columns={this.state.head}
                        dataSource={this.state.listData.goods}
                        className="table-font-size"
                        pagination={false}/>
                </div>
                <div className={style.total}>合计：<Price value={this.state.listData.subtotal}/></div>
                <div className={style.table}><OrderInfo orderDetails={this.state.listData.orderInfo}/></div>
                <div className={style.filter}><Button onClick={this._backForward} type='primary'
                                                      size='large'>返回</Button></div>
            </div>
        )
    }
});
module.exports = OrderDetail;