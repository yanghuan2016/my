/**
 * seller端出库单列表
 *      字段：出库单号，订单号，供应商名称，出库时间，状态，操作
 *
 * param:
 *      data：出库单数据
 * added by violin 2016-04-19
 */

var React = require('react');
var style = require('./ship.css');
var Table = require('antd').Table;
var Pagination = require('ediComponents/basic/pagination/pagination');
var Link = require('react-router').Link;

var cookie = require('util/cookieUtil');
var Icon = require('ediComponents/basic/icon/icon');
var TableFilter = require('ediComponents/basic/tableFilter/tableFilter');
var shipAction = require('ediAction/seller/shipAction');
var shipStore = require('ediStores/seller/shipStore');
var logger = require('util/logService');
var userStore = require('ediStores/userStore');

var columns = [{
    title: '出库单号',
    dataIndex: 'billNo',
    key: 'billNo'
}, {
    title: '订单号',
    dataIndex: 'orderBillNo',
    key: 'orderBillNo'
}, {
    title: '客户名称',
    dataIndex: 'buyerName',
    key: 'buyerName'
}, {
    title: '出库时间',
    dataIndex: 'billDate',
    key: 'billDate'
}, {
    title: '状态',
    dataIndex: 'isShipped',
    key: 'isShipped',
    render: function(text, data){
        var ship = ['已发出','已收货'];
        var index = Number(data.isShipped);
        return (<span>{ship[index] || '未知状态'}</span>)
    }
}, {
    title: '操作',
    key: 'operator',
    render(text, data) {
        return <Link to={"/seller/ship/shipDetail/"+data.billNo}><Icon name="fa fa-eye"/></Link>;
    }
}];

var Ship = React.createClass({
    getInitialState: function () {
        return {
            filter: {
                startValue: '',
                endValue: '',
                keywords: ''
            },
            datas: shipStore.getShipList(),
            userInfo: userStore.getEnterpriseInfo()
        }
    },
    componentWillMount: function () {
        shipStore.addChangeListener(this.dataChange);
        shipAction.getListData(this.state.userInfo.enterpriseId, "");
    },
    componentWillUnmount: function () {
        shipStore.removeChangeListener(this.dataChange);
    },
    dataChange: function () {
        var data = shipStore.getShipList();
        logger.trace(data);
        this.setState({
            datas: data
        });
    },
    onFilterKeywords: function (keywords) {
        this.filter({
            keyword:keywords
        });
    },
    onFilterTime: function (start, end) {
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
        shipAction.getListData(this.state.userInfo.enterpriseId,urlSuffix);
    },
    render: function () {
        logger.trace(this.state.datas);
        return (
            <div className={style.box}>
                <div className={style.filter}>
                    <TableFilter onFilterKeywords={this.onFilterKeywords}
                                 onChange={this.onFilterChange}
                                 onFilterTime={this.onFilterTime}
                                 placeholder="请输入出库单号"/>
                </div>
                <div className={style.table}>
                    <Table columns={columns}
                           dataSource={this.state.datas}
                           className="table-font-size"
                           pagination={false}/>
                    <div>
                        <Pagination onChange={this.onPagination}></Pagination>
                    </div>
                </div>
            </div>
        )
    }
});

module.exports = Ship;