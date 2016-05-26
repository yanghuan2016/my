/**
 * buyer端出库单列表
 *      字段：出库单号，订单号，供应商名称，出库时间，状态，操作
 *
 * param:
 *      data：出库单数据
 * added by hzh 2016-04-19
 */

var React = require('react');
var style = require('./ship.css');
var Table = require('antd').Table;
var Link = require('react-router').Link;
var Pagination = require('ediComponents/basic/pagination/pagination');

var Icon = require('ediComponents/basic/icon/icon');
var TableFilter = require('ediComponents/basic/tableFilter/tableFilter');
var shipAction = require('ediAction/buyer/shipAction');
var shipStore = require('ediStores/buyer/shipStore');
var logger = require('util/logService');
var userStore = require('ediStores/userStore');

var cookie = require('util/cookieUtil');

var columns = [{
    title: '出库单号',
    dataIndex: 'billNo',
    key: 'billNo'
}, {
    title: '订单号',
    dataIndex: 'orderBillNo',
    key: 'orderBillNo'
}, {
    title: '供应商名称',
    dataIndex: 'sellerName',
    key: 'sellerName'
}, {
    title: '出库时间',
    dataIndex: 'billDate',
    key: 'billDate'
},
    {
    title: '状态',
    dataIndex: 'state',
    key: 'state',
    render: function(text, data){
        var ship = ['已发出','已收货'];
        var index = Number(data.isShipped);
        return (<span>{ship[index] || '未知状态'}</span>)
    }
},
    {
        title: '操作',
        key: 'operator',
        render(text, data) {
            return <Link to={"/buyer/ship/shipDetail/"+data.billNo}><Icon name="fa fa-eye"/></Link>;
        }
    }];

var Ship = React.createClass({
    componentWillMount: function () {
        shipStore.addChangeListener(this.dataChange);
        if (userStore.getEnterpriseId()) {
            shipAction.getListData(userStore.getEnterpriseId());
        }
    },
    componentWillUnmount: function () {
        shipStore.removeChangeListener(this.dataChange);
    },
    getInitialState: function () {
        return {
            datas: shipStore.getShipList(),
            loading: true,
            filter: {
                startValue: '',
                endValue: '',
                keywords: ''
            }
        }
    },
    dataChange: function () {
        var data = shipStore.getShipList();
        logger.trace(data);
        this.setState({
            datas: data,
            loading: false
        });
    },
    onFilterKeywords: function (keywords) {
        this.filter({
            keywords: keywords
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
            keywords: this.state.filter.keywords,
            startTime: start ? (start.getFullYear() + '-' + (Number(start.getMonth()) + 1) + '-' + start.getDate()) : '',
            endTime: end ? (end.getFullYear() + '-' + (Number(end.getMonth()) + 1) + '-' + end.getDate()) : ''
        })
    },
    filter: function (query) {
        this.setState({
            loading: true
        });
        var queryStr = $.param(query);
        if (userStore.getEnterpriseId()) {
            shipAction.getListData(userStore.getEnterpriseId(), queryStr);
        }
    },
    onFilterChange: function (value) {
        this.setState({
            filter: value
        })
    },
    render: function () {
        return (
            <div className={style.box}>
                <div className={style.filter}>
                    <TableFilter placeholder="请输入出库单号"
                                 onFilterKeywords={this.onFilterKeywords}
                                 onChange={this.onFilterChange}
                                 onFilterTime={this.onFilterTime}/>
                </div>
                <div className={style.table}>
                    <Table columns={columns}
                           className="table-font-size"
                           dataSource={this.state.datas.orderShips}
                           loading={this.state.loading}
                           pagination={false}/>
                    <Pagination  onChange={this.onPagination} />
                </div>
            </div>
        )
    }
});

module.exports = Ship;