/**
 * 微信处方单-商品详情目录
 * by dzw@romens
 */
var React = require('react');
var Style = require('./goodDetail.css');
var Icon = require('basic/icon/icon');

var GoodDetail = React.createClass({

    render: function () {
        var content = [];
        var index = -1;
        this.props.goodsInfo.map(function (item) {
            content.push(
                <div className={Style.list} key={index++}>
                    <div className={Style.marginBottom}>{item.commonName}<span
                        className={Style.price}>&yen;{item.refRetailPrice ? item.refRetailPrice.toFixed(2) : "0.00"}</span>
                    </div>

                    <div>{item.spec}<span className={Style.info}>x{item.quantity}</span></div>
                </div>)
        });
        return (
            <div className={Style.goods}>
                <div className={Style.detail}><Icon name="fa fa-list-alt" className={Style.icon}/>处方详情 <span
                    className={Style.title}>共计{this.props.goodsInfo.length}种药品</span></div>
                {content}
                <div className={Style.total}>
                    <div>药品总额：<span className={Style.price}>&yen;{Number(this.props.sum).toFixed(2)}</span></div>
                    <div>运费：<span className={Style.price}>&yen;0.00</span></div>
                </div>
            </div>
        )
    }
});

module.exports = GoodDetail;