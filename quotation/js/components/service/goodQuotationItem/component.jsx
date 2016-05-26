var React = require('react');
var style = require('./goodQuotationItem.css');
var Displaydiv = require('js/components/element/basicDisplayDiv/component');
var SingleSpanRow = require('js/components/element/SingleSpanRow/component');
var Span = require('js/components/basic/span/component');
var BottomButtonGroup = require('js/components/element/bottomButtonGroup/component');

var QuotationStore = require('stores/QuotationStore');
var quotationListAction = require('actions/quotationListAction');
var history = require('js/history');
var cookieUtil = require('util/cookieUtil');
var logger = require('util/logService');

var goodQuotationItem = React.createClass({
    getInitialState: function () {

        var value = QuotationStore.getCurrentDetailGoodItem(this.props.params.goodsNo) || {};
        if (!(value && value.unicode)) {
            quotationListAction.getDetails(cookieUtil.getItem('currentQuotationNo'));
        }
        return {
            spanProps: {
                content: '我的报价',
                className: style.contentSpanDivText,
                spanClassName: style.contentSpanLabelText
            },
            inputDisabled: (typeof value.quotationPrice === 'undefined'),
            goodItem: {},
            quotePrice: Number(0).toFixed(2),
            quoteNum: Number(0)
        }
    },
    componentDidMount: function () {
        QuotationStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        QuotationStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        var value = QuotationStore.getCurrentDetailGoodItem(this.props.params.goodsNo);
        this.setState({
            goodItem: value,
            quotePrice: value.quotationPrice || Number(0).toFixed(2),
            quoteNum: value.quotationQuantity || 0,
            inputDisabled: (typeof value.quotationPrice === 'undefined')
        });
    },
    _leftBtnClick: function () {
        var goodsItem = this.state.goodItem;
        logger.ndump("修改前的goodsItem", goodsItem);
        goodsItem.quotationPrice = this.state.quotePrice;
        goodsItem.quotationQuantity = this.state.quoteNum;
        logger.ndump("修改过后的goodsItem", goodsItem);
        logger.ndump("goodsItem", goodsItem);
        this.setState({
            goodItem: goodsItem
        });
        history.goBack();
    },
    _rightBtnClick: function () {
        history.goBack();
    },
    _onChangePrice: function (event) {
        var value = event.target.value;
        this.setState({
            quotePrice: value
        });
    },
    _onChangeNumber: function (event) {
        var value = event.target.value;
        this.setState({
            quoteNum: value
        });
    },
    componentWillMount: function () {
        var goodsItem = this.state.goodItem.unicode || QuotationStore.getCurrentDetailGoodItem(this.props.params.goodsNo);
        logger.trace(goodsItem);
        this.setState({
            goodItem: goodsItem,
            quotePrice: goodsItem.quotationPrice || Number(0).toFixed(2),
            quoteNum: goodsItem.quotationQuantity || Number(0)
        });
    },
    render: function () {
        var screenHeight = $(window).height();
        var goodsItem = this.state.goodItem;
        return (<div className={style.goodQuotationContainer}>
            <div className={style.imgContainer}>
                <div className={style.imgDiv}>
                    <img style={{height:'120px'}}
                         src={(goodsItem&&goodsItem.imageUrl)||''} alt=""/>
                </div>
            </div>
            <div className={style.goodInfoContainer}>
                <div className={style.spaceUpAndLeft}>
                    <span className={style.keyWord}>名称: </span>
                    <span className>{goodsItem.commonName}</span>
                </div>
                <div className={style.spaceUpAndLeft}>
                    <span className={style.keyWord}>厂家: </span>
                    <span className>{goodsItem.producer}</span>
                </div>
                <div className={style.spaceUpAndLeft}>
                    <span className={style.keyWord}>规格: </span>
                    <span className>{goodsItem.spec}</span>
                </div>
                <div className={style.spaceUpAndLeft}>
                    <span className={style.keyWord}>平台编码: </span>
                    <span className>{goodsItem.unicode}</span>
                </div>
            </div>
            <Displaydiv leftText={'参考价格'} rightText={goodsItem.purchaseUpset}/>
            <Span spanProps={this.state.spanProps}/>
            <SingleSpanRow
                className={style.extraFont}
                inputDisabled={this.state.inputDisabled}
                keyWord={'单价'}
                refValue={'quotationPrice'}
                onChange={this._onChangePrice}
                keyValue={this.state.quotePrice || Number(0).toFixed(2)}/>
            <SingleSpanRow
                className={style.extraFont}
                inputDisabled={this.state.inputDisabled}
                keyWord={'数量'}
                onChange={this._onChangeNumber}
                refValue={'quotationSum'}
                keyValue={this.state.quoteNum}/>
            <div style={{marginTop:screenHeight-440}}>
                <BottomButtonGroup
                    leftBtnText={'确认'}
                    buttonGroupClass={style.buttonGroup}
                    rightBtnText={'取消'}
                    onLeftClick={this._leftBtnClick}
                    onRightClick={this._rightBtnClick}
                    />
            </div>
        </div>);

    }
});
module.exports = goodQuotationItem;