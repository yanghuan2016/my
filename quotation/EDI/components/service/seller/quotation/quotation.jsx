/**
 * seller端报价单列表
 *      字段：询价单号，供应商名称，询价时间，询价品种/金额，剩余时间，操作
 *
 * param:
 *      data：商品数据
 * added by sunshine 2016-04-19
 */

var React = require('react');
var style = require('./quotation.css');
var Table = require('antd').Table;
var Pagination = require('antd').Pagination;
var Tabs = require('antd').Tabs;
var TabPane = Tabs.TabPane;
var Link = require('react-router').Link;
var Icon = require('ediComponents/basic/icon/icon');
var Price = require('ediComponents/basic/price/price');
var TableFilter = require('ediComponents/basic/tableFilter/tableFilter');
var Timer = require('ediComponents/basic/timer/timer');
var quotationAction = require('ediAction/seller/quotationAction');
var quotationStore = require('ediStores/seller/quotationStore');
var logger = require('util/logService');
var userStore = require('ediStores/userStore');
var Popover = require('antd').Popover;
var DateFormat = require('util/dataService');

var cookie = require('util/cookieUtil');
var columns = [{
    title: '询价单号',
    dataIndex: 'inquiryId',
    key: 'inquiryId'
}, {
    title: '客户名称',
    dataIndex: 'buyerName',
    key: 'buyerName',
    render: function(text, data){
        if(data.addInquiryDetails[0].buyerName === ''){
            var info = <span>该ID的客户资料未同步，请联系管理员补全信息</span>;
            return (<Popover overlay={info} >
                <span><Icon name="fa fa-info-circle" className={style.info}/> {data.addInquiryDetails[0].buyerId}</span>
            </Popover>);
        }else{
            return (<span>{data.addInquiryDetails[0].buyerName}</span>);
        }
    }
}, {
    title: '询价时间',
    dataIndex: 'createdOn',
    key: 'createdOn'
}, {
    title: '询价品种',
    dataIndex: 'value',
    key: 'value',
    render: function(text, data){
        return <span>{data.typesCount}</span>
    }
}, {
    title: '剩余时间',
    dataIndex: 'leftTime',
    key: 'leftTime',
    render: function(text, data){
        return (<Timer onChange={function(){}} endTime={data.addInquiryDetails[0].inquiryExpire} />)
    }
}, {
    title: '操作',
    key: 'operator',
    render(text, data) {
        var expire = DateFormat.dateFormatter(data.addInquiryDetails[0].inquiryExpire);
        return <Link to={"/seller/quotation/quotationDetail/"+data.inquiryId+"/INQUIRY"}>
                    <Icon name={"fa " + (expire ? "fa-jpy" : "fa-eye")}/>
                </Link>;
    }
}];
var columnsPre = [
    {
        title: '询价单号',
        dataIndex: 'inquiryId',
        key: 'inquiryId'
    }, {
        title: '客户名称',
        dataIndex: 'buyerName',
        key: 'buyerName',
        render: function(text, data){
            return <span>{data.quotationDetails[0].buyerName}</span>
        }
    }, {
        title: '报价时间',
        dataIndex: 'createdOn',
        key: 'createdOn'
    }, {
        title: '报价品种/金额',
        dataIndex: 'value',
        key: 'value',
        render: function(text, data){
            return <span>{data.typesCount}/{data.subtotal ? <Price value={data.subtotal}/> : '无'}</span>
        }
    }, {
        title: '剩余时间',
        dataIndex: 'leftTime',
        key: 'leftTime',
        render: function(text, data){
            return (<Timer onChange={function(){}} endTime={data.quotationDetails[0].quotationExpire} />)
        }
    }, {
        title: '操作',
        key: 'operator',
        render(text, data) {
            var expire = DateFormat.dateFormatter(data.quotationDetails[0].quotationExpire);
            return <Link to={"/seller/quotation/quotationDetail/"+data.inquiryId+"/QUOTATION"}>
                <Icon name={"fa " + (expire ? "fa-jpy" : "fa-eye")}/>
            </Link>;
        }
    }
];
var Quotation = React.createClass({
    componentWillMount: function(){
        quotationStore.addChangeListener(this.dataChange);
        if (userStore.getEnterpriseId()) {
            quotationAction.getInquirys(userStore.getEnterpriseId());
        }
    },
    componentWillUnmount: function(){
        quotationStore.removeChangeListener(this.dataChange);
    },
    getInitialState: function(){
        var user = userStore.getEnterpriseInfo();
        return {
            datas: quotationStore.getQuotationList(),
            user: user,
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
    dataChange: function(){
        var data = quotationStore.getQuotationList();
        this.setState({
            datas: data,
            loading: false
        });
    },
    onFilterKeywords: function(keywords){
        this.filter({
            keyword: keywords
        });
    },
    onFilterTime: function(start, end){
        this.filter({
            startTime: start.getFullYear() + '-' + (Number(start.getMonth())+1) + '-' + start.getDate(),
            endTime: end.getFullYear() + '-' + (Number(end.getMonth())+1) + '-' + end.getDate()
        });
    },
    onPagination: function(value){
        var start = this.state.filter.startValue;
        var end = this.state.filter.endValue;
        this.filter({
            page: value,
            pageSize: 10,
            keyword: this.state.filter.keywords,
            startTime: start ? (start.getFullYear() + '-' + (Number(start.getMonth())+1) + '-' + start.getDate()) : '',
            endTime: end ? (end.getFullYear() + '-' + (Number(end.getMonth())+1) + '-' + end.getDate()) : ''
        })
    },
    filter: function(query){
        this.setState({
            loading: true
        });
        var queryStr = $.param(query);
        if (userStore.getEnterpriseId()) {
            switch (this.state.quotationType) {
                case 'quotation':
                    quotationAction.getQuotations(this.state.user.enterpriseId, queryStr);
                    break;
                case 'inquiry':
                    quotationAction.getInquirys(this.state.user.enterpriseId, queryStr);
                    break;
            }
        }
    },
    tabChange: function(key){
        if(key === 'quotation'){
            if(this.state.datas.quotationList.quotationSheets.length === 0){
                quotationAction.getQuotations(this.state.user.enterpriseId);
            }
        }
        this.setState({
            quotationType: key
        })
    },
    onFilterChange: function(value){
        this.setState({
          filter: value
        })
    },
    render: function(){
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
                                       dataSource={this.state.datas.inquiryList.inquirySheets}
                                       loading={this.state.loading}
                                       pagination={false}/>
                            </div>
                            <Pagination className={style.pagination} onChange={this.onPagination} defaultCurrent={1} total={1000}/>
                        </TabPane>
                        <TabPane tab="已报价" key="quotation">
                            <div className={style.table}>
                                <Table columns={columnsPre}
                                       className="table-font-size"
                                       dataSource={this.state.datas.quotationList.quotationSheets}
                                       loading={this.state.loading}
                                       pagination={false}/>
                            </div>
                            <Pagination className={style.pagination} onChange={this.onPagination} defaultCurrent={1} total={100}/>
                        </TabPane>
                    </Tabs>
                </div>
            </div>
        )
    }
});

module.exports = Quotation;