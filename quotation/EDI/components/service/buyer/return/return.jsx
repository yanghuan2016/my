/**
 * buyer退货单列表
 *      字段：退货单号,订单号,供应商名称,申请时间,状态,操作
 *
 */

var React = require('react');
var style = require('./return.css');
var Link = require('react-router').Link;
var Table = require('antd').Table;
var Pagination = require('ediComponents/basic/pagination/pagination');
var URL = require('edi/constantsUrl')();
var Icon = require('ediComponents/basic/icon/icon');
var TableFilter = require('ediComponents/basic/tableFilter/tableFilter');
var returnAction = require('ediAction/buyer/returnAction');
var UserStore = require('ediStores/userStore');
var returnStore = require('ediStores/buyer/returnStore');
var logger = require('util/logService');

var cookie = require('util/cookieUtil');
var Return = React.createClass({
    componentWillMount: function () {

        returnStore.addChangeListener(this.dataChange);
        returnAction.returnListAction(this.state.userID);
    },
    componentWillUnmount: function () {
        returnStore.removeChangeListener(this.dataChange);
    },
    getInitialState: function () {
        var userID = UserStore.getEnterpriseId();
        return {
            columns: [{
                title: '退货单号',
                dataIndex: 'guid',
                key: 'returnId'
            }, {
                title: '订单号',
                dataIndex: 'billNo',
                key: 'orderId'
            }, {
                title: '供应商',
                dataIndex: 'sellerName',
                key: 'store'
            }, {
                title: '申请时间',
                dataIndex: 'billDate',
                key: 'returnTime'
            }, {
                title: '操作',
                key: 'operator',
                render(text, data) {
                    var url = "/buyer/return/returnDetail/" + data.guid;
                    return <Link to={url}><Icon name="fa fa-eye"/></Link>;
                }
            }],
            datas: returnStore.getReturnList(),
            userID: userID,
            filter: {
                startValue: '',
                endValue: '',
                keywords: ''
            }
        }
    },
    dataChange: function () {
        var data = returnStore.getReturnList();
        logger.trace(data);
        this.setState({
            datas: data
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
            keywords: this.state.filter.keywords,
            startTime: start ? (start.getFullYear() + '-' + (Number(start.getMonth()) + 1) + '-' + start.getDate()) : '',
            endTime: end ? (end.getFullYear() + '-' + (Number(end.getMonth()) + 1) + '-' + end.getDate()) : ''
        })
    },
    onFilterChange: function (value) {
        this.setState({
            filter: value
        })
    },
    filter: function (suffix) {
        var urlSuffix = $.param(suffix);
        returnAction.returnListAction(this.state.userID, urlSuffix);
    },
    render: function () {
        return (
            <div className={style.box}>
                <div className={style.filter}>
                    <TableFilter placeholder="请输入退货单号/订单号/客户名称" onFilterKeywords={this.onFilterKeywords}
                                 onChange={this.onFilterChange}
                                 onFilterTime={this.onFilterTime}/>
                </div>
                <div className={style.table}>
                    <Table
                        columns={this.state.columns}
                        className="table-font-size"
                        dataSource={this.state.datas} pagination={false}/>
                </div>
                <Pagination onChange={this.onPagination} />
            </div>
        )
    }
});

module.exports = Return;