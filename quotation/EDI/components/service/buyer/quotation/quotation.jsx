/**
 * buyer端报价单列表
 *      字段：询价单号，供应商名称，询价时间，询价品种/金额，剩余时间，操作
 *
 * param:
 *      data：商品数据
 * added by hzh 2016-04-19
 */

var React = require('react');
var style = require('./quotation.css');
var Table = require('antd').Table;
var Pagination = require('antd').Pagination;
var Tabs = require('antd').Tabs;
var TabPane = Tabs.TabPane;
var Link = require('react-router').Link;
var Icon = require('ediComponents/basic/icon/icon');
var Timer = require('ediComponents/basic/timer/timer');
var TableFilter = require('ediComponents/basic/tableFilter/tableFilter');
var quotationAction = require('ediAction/buyer/quotationAction');
var quotationStore = require('ediStores/buyer/quotationStore');
var userStore = require('ediStores/userStore');
var logger = require('util/logService');

var cookie = require('util/cookieUtil');

var socketIoService = require('util/socketIoService.js');

var columns = [{
    title: '询价单号',
    dataIndex: 'inquiryId',
    key: 'inquiryId'
}, {
    title: '供应商数量',
    dataIndex: 'supplierCount',
    key: 'supplierCount'
}, {
    title: '询价品种数量',
    dataIndex: 'typesCount',
    key: 'typesCount'
}, {
    title: '询价时间',
    dataIndex: 'createdOn',
    key: 'createdOn'
}, {
    title: '剩余时间',
    dataIndex: 'leftTime',
    key: 'leftTime',
    render: function (text, data) {
        return (<Timer onChange={function(){}} endTime={data.addInquiryDetails[0].inquiryExpire}/>)
    }
}, {
    title: '操作',
    key: 'operator',
    render(text, data) {
        return <Link to={"/buyer/quotation/quotationDetail/"+data.inquiryId+'/INQUIRY'}><Icon name="fa fa-eye"/></Link>;
    }
}];
var columnsPre = [
    {
        title: '询价单号',
        dataIndex: 'inquiryId',
        key: 'inquiryId'
    }, {
        title: '已报/已询价供应商数量',
        dataIndex: 'quotationSuppliers',
        key: 'quotationSuppliers',
        render: function (text, data) {
            return <span>{data.quotationSuppliers + "/" + data.inquirySuppliers}</span>
        }
    }, {
        title: '已报/已询价品种数量',
        dataIndex: 'quotationGoodsTypes',
        key: 'quotationGoodsTypes',
        render: function(text, data){
            return <span>{data.quotationGoodsTypes + "/" + data.inquiryGoodsTypes}</span>
        }
    }, {
        title: '最近报价时间',
        dataIndex: 'quotationDate',
        key: 'quotationDate'
    }, {
        title: '剩余时间',
        dataIndex: 'quotationExpire',
        key: 'quotationExpire',
        render: function (text, data) {
            return (<Timer onChange={function(){}} endTime={data.inquiryExpire}/>)
        }
    }, {
        title: '操作',
        key: 'operator',
        render(text, data) {
            return <Link to={"/buyer/quotation/quotationDetail/"+data.inquiryId+'/QUOTATION'}><Icon
                name="fa fa-eye"/></Link>;
        }
    }
];
var Quotation = React.createClass({
    componentWillMount: function () {
        quotationStore.addChangeListener(this.dataChange);
        if (userStore.getEnterpriseId()) {
            quotationAction.getInquirys(userStore.getEnterpriseId());
        }
    },
    componentWillUnmount: function () {
        quotationStore.removeChangeListener(this.dataChange);
    },
    getInitialState: function () {


        socketIoService.watchSocket('pong', function (msg) {
            console.log("msg = " + msg);
        });
        return {
            datas: quotationStore.getQuotationList(),
            loading: true,
            activePanel: 1,
            quotationType: 'inquiry',
            filter: {
                startValue: '',
                endValue: '',
                keywords: ''
            }
        }
    },
    dataChange: function () {
        var data = quotationStore.getQuotationList();
        this.setState({
            datas: data,
            loading: false
        });
    },
    onFilterKeywords: function (keywords) {
        this.filter({
            keyword: keywords
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
            keyword: this.state.filter.keywords,
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
            switch (this.state.quotationType) {
                case 'quotation':
                    quotationAction.getQuotations(userStore.getEnterpriseId(), queryStr);
                    break;
                case 'inquiry':
                    quotationAction.getInquirys(userStore.getEnterpriseId(), queryStr);
                    break;
            }
        }
    },
    tabChange: function (key) {
        if (key === 'quotation') {
            if (this.state.datas.quotationList.quotationSheets.length === 0 && userStore.getEnterpriseId()) {
                quotationAction.getQuotations(userStore.getEnterpriseId());
            }
        }
        this.setState({
            quotationType: key
        })
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
                    <TableFilter onFilterKeywords={this.onFilterKeywords}
                                 onChange={this.onFilterChange}
                                 onFilterTime={this.onFilterTime}/>
                </div>
                <div style={{marginTop: 15}}></div>
                <div className={style.cardContainer}>
                    <Tabs defaultActiveKey={this.state.activePanel} onChange={this.tabChange} type="card">
                        <TabPane tab="待报价" key="inquiry">
                            <div className={style.table}>
                                <Table columns={columns}
                                       className="table-font-size"
                                       dataSource={this.state.datas.inquiryList.inquirySheets}
                                       loading={this.state.loading}
                                       pagination={false}/>
                            </div>
                            <Pagination className={style.pagination} onChange={this.onPagination} defaultCurrent={1}
                                        total={100}/>
                        </TabPane>
                        <TabPane tab="已报价" key="quotation">
                            <div className={style.table}>
                                <Table columns={columnsPre}
                                       className="table-font-size"
                                       dataSource={this.state.datas.quotationList.quotationSheets}
                                       loading={this.state.loading}
                                       pagination={false}/>
                            </div>
                            <Pagination className={style.pagination} onChange={this.onPagination} defaultCurrent={1}
                                        total={100}/>
                        </TabPane>
                    </Tabs>
                </div>
            </div>
        )
    }
});

module.exports = Quotation;