var React = require('react');
var Header = require('js/components/element/header/component');
var BottomButtonGroup = require('js/components/element/bottomButtonGroup/component');
var Span = require('js/components/basic/span/component');
var style = require('./quotationDetail.css');
var GoodCell = require('js/components/element/goodsDetailCard/component');

var QuotationStore = require('stores/QuotationStore');

var Constants = require('actionConstants/constants');
var quotationListAction = require('actions/quotationListAction');
var history = require('js/history');
var cookieUtil = require('util/cookieUtil');
var DateFormat = require('util/dataService');
var logger = require('util/logService');
var loginStore = require('js/stores/LoginStore');


var QuotationDetail = React.createClass({
    getInitialState: function () {
        var user = loginStore.getUserInfo();
        //logger.ndump("QuotationStore.getCurrentDetail()", QuotationStore.getCurrentDetail());
        if (!(QuotationStore.getCurrentDetail() && (QuotationStore.getCurrentDetail().addInquiryDetails || QuotationStore.getCurrentDetail().quotationDetails))) {
            quotationListAction.getDetails(cookieUtil.getItem('currentQuotationNo'), this.props.params.type, user.enterpriseId);
        }
        logger.info("报价清单");
        //logger.info(QuotationStore.getCurrentDetail());
        return {
            spanProps: {
                content: '报价清单',
                className: style.contentSpanDivText,
                spanClassName: style.contentSpanLabelText
            },
            headerSpanTxt: '报价单详情',
            iconProps: {
                firstIconProps: {
                    url: 'quotation/' + this.props.params.type,
                    iconClassName: 'fa fa-angle-left'
                },
                secondIconProps: {}
            },
            quotationDetail: QuotationStore.getCurrentDetail(),
            quotationStatusTxt: "",
            user: user
        }

    },

    componentDidMount: function () {
        var _self = this;
        QuotationStore.addChangeListener(_self._onChange);
        function transition() {
            var date = _self.state.quotationDetail.addInquiryDetails && _self.state.quotationDetail.addInquiryDetails[0].inquiryExpire;
            _self.setState({
                quotationStatusTxt: DateFormat.transition(new Date(date) - new Date())
            });
        }

        if (this.props.params.type === 'inquiry') {
            _self.timer = setInterval(transition, 1000);
        }
    },
    componentWillUnmount: function () {
        QuotationStore.removeChangeListener(this._onChange);
        clearInterval(this.timer);
    },
    _onChange: function () {
        this.setState({
            quotationDetail: QuotationStore.getCurrentDetail()
        });
    },
    _leftBtnClick: function () {
        quotationListAction.updateQuationPriceAndNum(this.state.quotationDetail, this.state.user.enterpriseId);
    },
    _rightBtnClick: function () {
        history.goBack();
    },
    _onClick: function (id) {
        cookieUtil.setItem('currentQuotationNo', this.props.params.no);
        cookieUtil.setItem('currentQuotationNoToDetailGoodsNo', id);
        history.pushState(null, '/quotationGoodDetail/' + this.props.params.no + '/' + id);
    },
    componentWillMount: function () {
        //logger.ndump("this.state.quotationDetail", this.state.quotationDetail);
        var quoteGoods = (typeof(this.state.quotationDetail && this.state.quotationDetail.quotaGoods) != "undefined") ? this.state.quotationDetail.quotaGoods : [];
        //logger.ndump("quoteGoods", quoteGoods);
    },
    render: function () {
        var self = this;
        var goodCells = [];
        //logger.ndump("this.state.quotationDetail", this.state.quotationDetail);
        var quoteGoods = this.state.quotationDetail.quotationDetails || this.state.quotationDetail.addInquiryDetails || [];
        //logger.ndump("quoteGoods", quoteGoods);
        var i = 0;
        quoteGoods.forEach(function (item, index) {
            self.state.quotationDetail.addInquiryDetails
                && (self.state.quotationDetail.addInquiryDetails[index].inquiryId = self.state.quotationDetail.inquiryId);
            goodCells.push(
                <GoodCell
                    onClick={self._onClick}
                    key={item.unicode + i}
                    keyValue={item.unicode}
                    item={item}
                    />
            );
            i++;
        });
        var detail = this.state.quotationDetail;
        var leftBtnText = '';
        var rightBtnText = '';
        var quotationStatusTxt = '';
        var str = "";
        if (this.props.params.type === 'inquiry') {
            str = "询价时间";
            quotationStatusTxt = this.state.quotationStatusTxt;
            leftBtnText = '确认报价';
            rightBtnText = '暂不报价';
        } else {
            str = "报价时间";
            quotationStatusTxt = '';
            leftBtnText = '修改报价';
            rightBtnText = '返回';
        }
        var buttonGroup = <BottomButtonGroup
            buttonGroupClass={style.buttonGroupClass}
            leftBtnText={leftBtnText}
            key={i+1}
            rightBtnText={rightBtnText}
            onLeftClick={this._leftBtnClick}
            onRightClick={this._rightBtnClick}
            />;
        return (
            <div className={style.detailContainer}>
                <Header spanText={this.state.headerSpanTxt}
                        iconProps={this.state.iconProps}/>

                <div className={style.goodsDetail}>
                    <div>
                        <div className={style.goodsDetailHeader}>
                            <div className={style.LeftHeader}>{this.props.params.no}</div>
                            <div className={style.RightHeader}>{quotationStatusTxt}</div>
                        </div>
                        <div className={style.quotationStoreDetail}>
                            <div className={style.spaceUp}>客户名称: {
                                (detail.quotationDetails && detail.quotationDetails[0].buyerName)||
                                (detail.addInquiryDetails && detail.addInquiryDetails[0].buyerName)
                            }</div>
                            <div className={style.spaceUp}>商品总数: {quoteGoods.length}件</div>
                            <div className={style.spaceUp}>{str}: {DateFormat.getYYYYMMDDHHMMSS(detail.createdOn
                                || detail.quotationDetails[0].createdOn)}</div>
                        </div>
                        <Span spanProps={this.state.spanProps}/>
                        {goodCells}
                    </div>
                </div>
                {(this.props.params.type === 'inquiry') ? buttonGroup : ''}
            </div>);
    }
});


module.exports = QuotationDetail;
