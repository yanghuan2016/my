var React = require('react');
var style = require('./quotationCard.css');
var DateFormat = require('util/dataService');

var QuotationCard = React.createClass({
    getInitialState: function () {
        return {seconds: this.props.seconds}
    },
    _onClick: function () {
        this.props.onClick(this.props.dataNo);
    },

    render: function () {
        var extraClass = '';
        var str = "";
        var surplus = "";
        var self = this;
        var detail = self.props.detail;
        var list = [];
        var index = -1;
        if (this.props.type === "inquiry") {
            str = "询价时间";
            var inquiryExpire = new Date(detail.inquiryExpire);
            var minus = inquiryExpire - new Date();
            if (minus > 0) {
                surplus = "剩余";
                extraClass = style.qCardQuote;
                index++;
                list.push(<Item onClick={self._onClick}
                                surplus={surplus}
                                extraClass={extraClass}
                                key={index}
                                minus={minus}
                                str={str}
                                detail={detail}/>);
            } else {
                surplus = "已过期";
                extraClass = style.qCardOutOfDate;
                index++;
                list.push(<Item surplus={surplus}
                                key={index}
                                minus={0}
                                extraClass={extraClass}
                                str={str}
                                detail={detail}/>);
            }
        } else {
            str = "报价时间";
            if (new Date(detail.quotationExpire) - new Date() > 0) {
                surplus = "报价中";
                extraClass = style.qCardQuoting;
                index++;
                list.push(<Item onClick={self._onClick}
                                surplus={surplus}
                                minus={0}
                                extraClass={extraClass}
                                key={index}
                                str={str}
                                detail={detail}/>);
            } else {
                surplus = "已失效";
                extraClass = style.qCardInvalid;
                index++;
                list.push(<Item surplus={surplus}
                                str={str}
                                minus={0}
                                extraClass={extraClass}
                                key={index}
                                detail={detail}/>);
            }
        }
        return <div>{list}</div>
    }
});

var Item = React.createClass({

    getInitialState: function () {
        return {
            str: DateFormat.transition(new Date(this.props.detail.inquiryExpire) - new Date())
        }
    },
    componentWillMount: function () {
        var _self = this;

        function transition() {
            _self.setState({
                str: DateFormat.transition(new Date(_self.props.detail.inquiryExpire) - new Date())
            });
        }

        _self.timer = setInterval(transition, 1000);
    },
    componentWillUnmount: function () {
        clearInterval(this.timer);
    },
    render: function () {
        var detail = this.props.detail;
        var str = this.props.minus > 0 ? this.state.str : "";
        return (
            <div onClick={this.props.onClick} className={style.quotationCardContainer}>
                <div className={style.quotationCardHeader}>
                    <div className={style.cardLeftHeader}>
                        {detail.quotationNo}
                    </div>
                    <div className={style.cardRightHeader + ' ' + this.props.extraClass}>
                        {this.props.surplus + str}
                    </div>
                </div>
                <div className={style.quotationCardDetail}>
                    <div className={style.spaceUp}>{detail.storeName}</div>
                    <div className={style.spaceUp}>商品总数 {detail.goodsSum}件</div>
                    <div className={style.spaceUp}>{this.props.str}
                        : {DateFormat.getYYYYMMDDHHMMSS(detail.createdOn)}</div>
                </div>
            </div>
        );
    }
});


module.exports = QuotationCard;