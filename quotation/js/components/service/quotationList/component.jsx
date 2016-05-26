var React = require('react');
var style = require('./quotationList.css');

var HeaderTab = require('js/components/element/headerTab/component');
var Header = require('js/components/element/header/component');
var QuotationCard = require('js/components/element/quotationCard/component');
var Link = require('react-router').Link;

var quotationListAction = require('actions/quotationListAction');
var SysConstants = require('js/Sysconfig.js');

var QuotationStore = require('stores/QuotationStore');
var history = require('js/history');
var DateFormat = require('util/dataService');
var logger = require('util/logService');
var loginStore = require('js/stores/LoginStore');

var cookieUtil=require('util/cookieUtil');

var FontAwesomeIcon = require('js/components/basic/fontawesome/component');

var QuotationList = React.createClass({

    getInitialState: function () {
        var user = loginStore.getUserInfo();
        var dataList = [];
        var typeName = {
            'inquiry': 'left',
            'quotation': 'right'
        };
        return {
            headerSpanTxt: '雨诺在线报价系统',
            iconProps: {
                firstIconProps: {
                    url: 'info',
                    iconClassName: 'fa fa-user ' + style.quotationIconClass

                },
                secondIconProps: {
                    url: 'query/' + this.props.params.type,
                    iconClassName: 'fa fa-search'
                }
            },
            focusOn: typeName[this.props.params.type] || 'left',
            tabProps: {
                leftText: '待报价',
                leftClick: this._leftClickEvent,
                rightText: '已报价',
                rightClick: this._rightClickEvent
            },
            quotationList: dataList,
            type: "pending",
            user: user
        }
    },
    componentWillMount: function () {
        QuotationStore.addChangeListener(this._onChange);
        if(!this.props.location.query.query) {
            switch (this.props.params.type) {
                case 'inquiry':
                    quotationListAction.initialData(this.state.user.enterpriseId);
                    this.state.dataList = QuotationStore.getInquiryList();
                    break;
                case 'quotation':
                    quotationListAction.getQuotationList(this.state.user.enterpriseId);
                    this.state.dataList = QuotationStore.getQuotationList();
                    break;
            }
        }else{
            quotationListAction.queryQuation(this.props.location.query.query, this.props.params.type, this.state.user.enterpriseId);
        }
    },

    componentWillUnmount: function () {
        QuotationStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        var dataList = [];
        switch(this.state.focusOn){
            case 'left':
                dataList = QuotationStore.getInquiryList();
                break;
            case 'right':
                dataList = QuotationStore.getQuotationList();
                break;
        }

        this.setState({
            quotationList: dataList
        });
    },
    _leftClickEvent: function () {
        quotationListAction.changeType('pending');
        var iconProps = this.state.iconProps;
        iconProps.secondIconProps.url = 'query/inquiry';
        this.setState(
            {
                focusOn: 'left',
                type: "pending",
                iconProps: iconProps
            }
        ,function(){
                quotationListAction.initialData(this.state.user.enterpriseId);
                history.pushState(null, '/quotation/inquiry');
            });
    },
    _rightClickEvent: function () {
        quotationListAction.changeType('finished');
        var iconProps = this.state.iconProps;
        iconProps.secondIconProps.url = 'query/quotation';
        this.setState(
            {
                focusOn: 'right',
                type: "finished",
                iconProps: iconProps
            }
        ,function(){
                quotationListAction.getQuotationList(this.state.user.enterpriseId);
                history.pushState(null, '/quotation/quotation');
            })
    },
    _singleClick: function (id) {
        var detailType = {
            'right': 'quotation',
            'left': 'inquiry'
        };
        logger.debug("id = " + id);
        cookieUtil.setItem('currentQuotationNo',id);
        quotationListAction.getDetails(id, detailType[this.state.focusOn], this.state.user.enterpriseId);
        history.pushState(null, '/quotation/detail/' + id + '/' + detailType[this.state.focusOn]);
    },
    render: function () {
        var _this = this;
        var _tabProps = this.state.tabProps;
        _tabProps.focusOn = this.state.focusOn;

        var tempNodes = [];
        var index = -1;
        _.forOwn(this.state.quotationList, function (value, month) {
            var subNodes = [];
            var i = 0;
            value.forEach(function (subItem) {
                var inquiryQuantity = 0;
                var list = subItem.addInquiryDetails || subItem.quotationDetails;
                list.forEach(function(goods){
                    inquiryQuantity += Number(goods.inquiryQuantity);
                });
                var buyerName = (subItem.addInquiryDetails && subItem.addInquiryDetails[0].buyerName)
                                || (subItem.quotationDetails && subItem.quotationDetails[0].buyerName) || '';
                var inquiryExpire = (subItem.addInquiryDetails && subItem.addInquiryDetails[0].inquiryExpire)
                                || (subItem.quotationDetails && subItem.quotationDetails[0].inquiryExpire) || '';
                var quotationExpire = (subItem.addInquiryDetails && subItem.addInquiryDetails[0].quotationExpire)
                                || (subItem.quotationDetails && subItem.quotationDetails[0].quotationExpire) || '';
                var detail = {
                    quotationNo: subItem.inquiryId,
                    storeName: buyerName,
                    goodsSum: inquiryQuantity,
                    createdOn: subItem.createdOn,
                    inquiryExpire: inquiryExpire,
                    quotationExpire: quotationExpire
                };
                i++;
                subNodes.push(<QuotationCard onClick={_this._singleClick}
                                             dataNo={subItem.inquiryId}
                                             type={_this.props.params.type}
                                             key={String(subItem.quotationNo) + i}
                                             detail={detail}/>);
            });
            var tempNode =
                <div key={index}>
                    <div className={style.quotationMonthHeader}>
                        <div>{month}</div>
                        <div ><Link to={'collapse'+index}
                                    className="collapsed"
                                    data-toggle="collapse">
                            <FontAwesomeIcon className={style.iconHover} name='angle-up'/>
                        </Link></div>
                    </div>

                    <div id={"collapse" + index} className={"panel-collapse collapse "+(index++==0?'':' in')}>
                        {subNodes}
                    </div>
                </div>;
            tempNodes.push(tempNode);
        });
        return (
            <div className={style.bgContainer}>

                <Header spanText={this.state.headerSpanTxt}
                        iconProps={this.state.iconProps}/>
                <HeaderTab tabProps={_tabProps}/>

                <div className={style.quotationContainer}>
                    {tempNodes}
                </div>
            </div>
        );
    }
});
module.exports = QuotationList;