var React = require('react');
var style = require('./goodsDetailCard.css');
var FontAwesomeIcon = require('js/components/basic/fontawesome/component');

var QuotationStore = require('stores/QuotationStore');

var GoodCard = React.createClass({
    getInitialState: function () {
        return {
            iconName: 'chevron-right'
        }
    },
    _onClick: function () {
        this.props.onClick(this.props.keyValue);
    },
    render: function () {
        return (
            <div onClick={this._onClick} className={style.goodsDetailContainer}>
                <div className={style.imgAndSingleContainer}>
                    <div className={style.imgContainer}>
                        <img src={this.props.item.imageUrl} alt=""/>
                    </div>
                    <div className={style.singleGoodContainer}>
                        <div className={style.spaceUp+' '+ style.commonName}>
                            {this.props.item.commonName || ''}
                        </div>
                        <div className={style.spaceUp}>
                            {this.props.item.producer || ''}
                        </div>
                        <div className={style.spaceUp}>
                            {this.props.item.spec || ''}
                        </div>
                    </div>
                </div>
                <div className={style.quotationRow}>
                    <div className={style.quotationRowFirstCol}>
                        {(this.props.item.inquiryQuantity + '件') || ''}
                    </div>
                    <div className={style.quotationRowSecondCol}>
                        <span className={style.fontColorDescribe}>我的报价:  </span>
                        <span className={style.fontColorValue}>
                            {this.props.item.quotationPrice ? ("\u00A5" + Number(this.props.item.quotationPrice).toFixed(2) + "*"
                                + Number(this.props.item.quotationQuantity)) + '件' : ''}
                        </span>
                    </div>
                    <div className={style.quotationRowThirdCol}>
                        <FontAwesomeIcon name={this.state.iconName}/>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = GoodCard;