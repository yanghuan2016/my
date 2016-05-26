/**
 * 到店自提 -商品详情
 * added by dzw@romen 2016-05-12
 */
var React = require('react');
var style = require('./pickUpOrder.css');

var PickupOrder = React.createClass({

    getInitialState: function () {
        return {
            goods: this.props.goods
        };
    },

    render: function () {
        var content = [];
        var index = -1;
        this.props.goods.prescription.map(function (item) {
            content.push(
                <div className={style.goodsInfo} key={index++}>
                    <span className={style.goods}>
                        {item.commonName}
                    </span>
                    x
                    <span className={style.num}>{item.quantity}</span>
                </div>);
        });
        return (
            <div className={style.box}>
                {content}
            </div>
        )
    }
});
module.exports = PickupOrder;