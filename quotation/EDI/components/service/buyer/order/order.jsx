/**
 * Buyer订单查询页
 * 字段：订单号,供应商名称,下单时间,订单金额,订单状态,操作　
 *
 * @type {*|exports|module.exports}
 */

var React = require('react');
var Icon = require('ediComponents/basic/icon/icon');
var Pagination = require('ediComponents/basic/pagination/pagination');
var Price = require('ediComponents/basic/price/price');
var logger = require('util/logService');
var Table =require('antd').Table;
var URL = require('edi/constantsUrl')();
var Style = require('./order.css');
var Link = require('react-router').Link;
var OrderStore = require('ediStores/buyer/orderStore');
var UserStore = require('ediStores/userStore');
var OrderAction = require('ediAction/buyer/orderAction');
var TableFilter = require('ediComponents/basic/tableFilter/tableFilter');

var cookie = require('util/cookieUtil');

var Order = React.createClass({
    getInitialState: function(){
        return{
            filter: {
                startValue: '',
                endValue: '',
                keywords: ''
            },
            userID: UserStore.getEnterpriseId(),
            head:[{title:"订单号",dataIndex:"billNO"},{title:"供应商名称",dataIndex:"sellerName"},{title:"下单时间",dataIndex:"billDate"},
                {title:"订单金额",dataIndex:"subtotal",render(text,data){
                    return(
                        <Price value={data.subtotal}/>
                    )
                }},
                {title:"操作",dataIndex:"opreation",render(text,data){
                    var url = "/buyer/order/orderDetail/"+data.billNO;
                return (<Link to={url}><Icon name="fa fa-eye"/></Link>)
                } }],
            listData:OrderStore.getOrderList()
        }
    },

    componentWillMount: function () {
        logger.enter();
        OrderStore.addChangeListener(this._getInfo);
        OrderAction.orderListAction(this.state.userID);
    },
    componentWillUnmount: function(){
        OrderStore.removeChangeListener(this._getInfo);
    },
    _getInfo: function () {
        logger.enter();
        this.setState({
            listData:  OrderStore.getOrderList()
        });
    },
    onFilterKeywords:function(keyword){
        this.filter({
            keyword:keyword
        });
    },
    onFilterTime:function(start,end){
        this.filter({
            startTime:start.getFullYear() + '-' + (Number(start.getMonth())+1) + '-' + start.getDate(),
            endTime:end.getFullYear() + '-' + (Number(end.getMonth())+1) + '-' + end.getDate()
        });
    },
    onPagination:function(value){
        var start = this.state.filter.startValue;
        var end = this.state.filter.endValue;
        this.filter({
            page: value,
            pageSize: 10,
            keywords: this.state.filter.keywords,
            startTime: start ? (start.getFullYear() + '-' + (Number(start.getMonth())+1) + '-' + start.getDate()) : '',
            endTime: end ? (end.getFullYear() + '-' + (Number(end.getMonth())+1) + '-' + end.getDate()) : ''
        })
    },
    onFilterChange: function(value){
        this.setState({
            filter: value
        })
    },
    filter:function(suffix){
        var urlSuffix = $.param(suffix);
        OrderAction.orderListAction(this.state.userID,urlSuffix);
    },
    render: function () {
        return (
            <div >
                <TableFilter onFilterKeywords={this.onFilterKeywords}
                             onChange={this.onFilterChange}
                             onFilterTime={this.onFilterTime}/>
                <div className={Style.table}>
                <Table columns={this.state.head}
                       className="table-font-size"
                       dataSource={this.state.listData} pagination={false}/>
                </div>
                <Pagination  onChange={this.onPagination} />
            </div>
        );
    }
});
module.exports = Order;