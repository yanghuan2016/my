/**
 * seller订单查询页
 * 字段：商品名称,生产单位,剂型,货号,图片地址,批准文号,订单数量,含税单价,小计
 *
 * added by sunshine 2016-04-20
 */

var React = require('react');
var Icon = require('ediComponents/basic/icon/icon');
var Price = require('ediComponents/basic/price/price');
var logger = require('util/logService');
var Table = require('antd').Table;
var URL = require('edi/constantsUrl')();
var style = require('./order.css');
var Link = require('react-router').Link;
var Pagination = require('ediComponents/basic/pagination/pagination');
var OrderStore = require('ediStores/seller/orderStore');
var UserStore = require('ediStores/userStore');
var OrderAction = require('ediAction/seller/orderAction');
var TableFilter = require('ediComponents/basic/tableFilter/tableFilter');

var cookie = require('util/cookieUtil');

var Order = React.createClass({
    getInitialState: function () {
        return {
            listData: OrderStore.getOrderList(),
            loading: true,
            filter: {
                startValue: '',
                endValue: '',
                keywords: ''
            },
            userID: UserStore.getEnterpriseId(),
            head: [{title: "订单号", dataIndex: "billNo"}, {title: "客户名称", dataIndex: "buyerName"}, {
                title: "下单时间",
                dataIndex: "billDate"
            },
                {
                    title: "订单金额", dataIndex: "subtotal", render(text, data){
                    return (
                        <Price value={data.subtotal}/>
                    )
                }
                },
                {
                    title: "操作", dataIndex: "opreation", render(text, data){
                    var url = "/seller/order/orderDetail/" + data.billNo;
                    return (<Link to={url}><Icon name="fa fa-eye"/></Link>)
                }
                }]
        }
    },

    componentWillMount: function () {
        logger.enter();
        OrderStore.addChangeListener(this._getInfo);
        OrderAction.orderListAction(this.state.userID);
    },
    componentWillUnmount: function () {
        OrderStore.removeChangeListener(this._getInfo);
    },
    _getInfo: function () {
        logger.enter();
        this.setState({
            listData: OrderStore.getOrderList(),
            loading: false
        });
    },
    onFilterKeywords: function (keyword) {
        this.filter({
            keyword: keyword
        });
    },
    onFilterTime: function (start, end) {
        this.filter({
            startTime: start.getFullYear() + '-' + (Number(start.getMonth()) + 1) + '-' + start.getDate(),
            endTime: end.getFullYear() + '-' + (Number(end.getMonth()) + 1) + '-' + end.getDate()
        });
    },
    onPagination: function (value) {
        var start = this.state.filter.startValue;
        var end = this.state.filter.endValue;
        this.filter({
            page: value,
            pageSize: 10,
            keyword: this.state.filter.keyword,
            startTime: start ? (start.getFullYear() + '-' + (Number(start.getMonth()) + 1) + '-' + start.getDate()) : '',
            endTime: end ? (end.getFullYear() + '-' + (Number(end.getMonth()) + 1) + '-' + end.getDate()) : ''
        })
    },
    filter: function (suffix) {
        this.setState({
            loading: true
        });
        var urlSuffix = $.param(suffix);
        OrderAction.orderListAction(this.state.userID, urlSuffix);
    },
    render: function () {
        return (
            <div >
                <TableFilter onFilterKeywords={this.onFilterKeywords} onFilterTime={this.onFilterTime}/>

                <div className={style.table}>
                    <Table columns={this.state.head}
                           loading={this.state.loading}
                           dataSource={this.state.listData}
                           className="table-font-size"
                           pagination={false}/>
                </div>
                <Pagination  onChange={this.onPagination} />
            </div>
        );
    }
});
module.exports = Order;