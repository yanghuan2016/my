var React = require('react');
var style = require('./queryQuotation.css');
var Header = require('js/components/element/header/component');
var SingleSpanRow = require('js/components/element/SingleSpanRow/component');
var Span = require('js/components/basic/span/component');


var WeUI = require('react-weui');
var weiUI = require('weui/dist/style/weui.css');
var Button = WeUI.Button;
var antd = require('antd');
var DatePicker = antd.DatePicker;
var antdCSS = require('antd/style/index.less');
var quotationListAction = require('actions/quotationListAction');
var QuotationStore = require('stores/QuotationStore');
var loginStore = require('js/stores/LoginStore');
var history = require('js/history');

var QueryQuotation = React.createClass({
    getInitialState: function () {
        return {
            headerSpanTxt: '报价单查询',
            iconProps: {
                firstIconProps: {
                    url: 'quotation/' + this.props.params.type,
                    iconClassName: 'fa fa-angle-left'
                },
                secondIconProps: {}
            },
            iconName: 'chevron-right',
            firstRow: {
                title: 'customerNameOrQuotationNo',
                keyWord: '客户名/单号'
            },
            spanProps: {
                content: '报价时间',
                className: style.contentSpanDivText,
                spanClassName: style.contentSpanLabelText
            },
            name: "",
            startValue: null,
            endValue: null,
            tips: QuotationStore.getTips(),
            user: loginStore.getUserInfo()
        }
    },
    componentDidMount: function () {
        QuotationStore.addChangeListener(this._onChangeTip);
    },
    componentWillUnmount: function () {
        QuotationStore.removeChangeListener(this._onChangeTip);
    },
    _onChangeTip: function () {
        this.setState({
            tips: QuotationStore.getTips()
        });
    },
    _inputCustomerNameOrQuotation: function (event) {
        this.setState({
            name: event.target.value
        });
    },
    disabledStartDate(startValue) {
        if (!startValue || !this.state.endValue) {
            return false;
        }
        return startValue.getTime() >= this.state.endValue.getTime();
    },
    disabledEndDate(endValue) {
        if (!endValue || !this.state.startValue) {
            return false;
        }
        return endValue.getTime() <= this.state.startValue.getTime();
    },
    onChange(field, value) {
        this.setState({
            [field]: value
        });
    },
    _onClick: function () {
        var data = {
            name: this.state.name,
            startValue: this.state.startValue,
            endValue: this.state.endValue
        };
        history.pushState(null, '/quotation/' + this.props.params.type + '?query=' + data.name);

    },
    render: function () {
        return (
            <div className={style.divContainer}>
                <Header spanText={this.state.headerSpanTxt}
                        iconProps={this.state.iconProps}/>

                <SingleSpanRow
                    readOnly={this.state.inputDisabled}
                    key={this.state.firstRow.title}
                    className={style.spaceUp}
                    onChange={this._inputCustomerNameOrQuotation}
                    keyWord={this.state.firstRow.keyWord}
                    keyValue={this.state.firstRow.keyValue}
                    />
                <Span spanProps={this.state.spanProps}/>

                <div className={style.spaceUp + ' ' + style.timer}>
                    <div>开始时间</div>
                    <div><DatePicker disabledDate={this.disabledStartDate}
                                     value={this.state.startValue}
                                     placeholder="开始日期"
                                     onChange={this.onChange.bind(this, 'startValue')}/>
                    </div>
                </div>
                <div className={style.spaceUp + ' ' + style.timer}>
                    <div>结束时间</div>
                    <div><DatePicker disabledDate={this.disabledEndDate}
                                     value={this.state.endValue}
                                     placeholder="结束日期"
                                     onChange={this.onChange.bind(this, 'endValue')}/>
                    </div>
                </div>
                <span>{this.state.tips}</span>
                <div className={style.btnContent}>
                    <Button onClick={this._onClick} className={"primary"+' '+style.infoBtnMobile}>查询</Button>
                </div>
            </div>
        );
    }
});

module.exports = QueryQuotation;